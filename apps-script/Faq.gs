/**
 * FAQ answers for the learner-care chat. Staff keep a 'FAQ' tab in this spreadsheet: one row per
 * question, with other ways learners ask it and the approved answer. A question that clearly
 * matches a row is answered with that row word for word, instantly and without leaving Apps
 * Script. Anything less certain goes to the AI model with the closest rows as reference, and
 * when no model can answer, the learner is offered the closest questions to pick from.
 *
 * Setup: run setupFaq once (it creates the tab with starter rows from FaqSeed.gs). Edits apply
 * within a few minutes. In any cell, =FAQ_KHOP("câu hỏi") shows which row a question matches.
 */

var FAQ_SHEET_NAME = 'FAQ';
var FAQ_HEADERS = ['Mã', 'Nhóm', 'Câu hỏi', 'Cách hỏi khác (mỗi dòng một cách)', 'Trả lời', 'Từ ngày', 'Đến ngày', 'Bật'];
var FAQ_CACHE_KEY = 'faq_rows_v1';
var FAQ_CACHE_SECONDS = 600;
// Answer from the table only when the best row is clearly ahead; tuned on a held-out learner
// test set (README, "FAQ matching").
var FAQ_MIN_SCORE = 6;
var FAQ_MIN_COVERAGE = 0.4;
var FAQ_MIN_MARGIN = 1.3;
// Rows below these are too weak to offer as "did you mean" or to hand the model as reference.
var FAQ_MIN_CANDIDATE = 3;
var FAQ_MIN_CANDIDATE_COVERAGE = 0.34;
var FAQ_BM25_K1 = 1.2;
var FAQ_BM25_B = 0.5;

// Shorthand learners type, keyed by the unaccented form.
var FAQ_SHORTHAND = {
  hp: 'hoc phi', dk: 'dang ky', dky: 'dang ky', sdt: 'so dien thoai', stk: 'so tai khoan',
  ck: 'chuyen khoan', gv: 'giang vien', onl: 'online', off: 'offline', bn: 'bao nhieu',
  bnhieu: 'bao nhieu', tg: 'thoi gian', tgian: 'thoi gian', ko: 'khong', k: 'khong',
  kg: 'khong', khg: 'khong', hok: 'khong', j: 'gi', dc: 'duoc', trc: 'truoc', hv: 'hoc vien',
  vs: 'voi', ng: 'nguoi', laptop: 'may tinh', k1: 'khoa 1', k2: 'khoa 2', k3: 'khoa 3',
  g1: 'goi 1', g2: 'goi 2', g3: 'goi 3', g4: 'goi 4', g5: 'goi 5', g6: 'goi 6'
};
// Shorthand that only makes sense written with its accents.
var FAQ_SHORTHAND_ACCENTED = { 'giá': 'phi', 'đt': 'dien thoai' };
// Greetings, particles and pronouns that carry no meaning for matching. Unaccented words that
// fold to something meaningful ("cho" is also chỗ, "toi" also tối/tới) are left in.
var FAQ_STOP = {
  'ạ': 1, 'à': 1, 'á': 1, 'a': 1, 'c': 1, 'e': 1, 'em': 1, 'anh': 1, 'chị': 1, 'mình': 1, 'tôi': 1,
  'ad': 1, 'admin': 1, 'ơi': 1, 'oi': 1, 'nhé': 1, 'nhe': 1, 'nha': 1, 'nhá': 1, 'vậy': 1, 'vay': 1,
  'z': 1, 'thế': 1, 'dạ': 1, 'vâng': 1, 'chào': 1, 'chao': 1, 'xin': 1, 'hỏi': 1, 'hoi': 1,
  'là': 1, 'thì': 1, 'của': 1, 'cua': 1, 'và': 1, 'với': 1, 'ạh': 1, 'ah': 1, 'ơ': 1, 'luôn': 1
};

function setupFaq() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(FAQ_SHEET_NAME) || book.insertSheet(FAQ_SHEET_NAME);
  if (sheet.getLastRow() > 1) {
    Logger.log('The FAQ tab already has rows; nothing was overwritten.');
    return;
  }
  sheet.clear();
  sheet.appendRow(FAQ_HEADERS);
  sheet.getRange(1, 1, 1, FAQ_HEADERS.length).setFontWeight('bold').setBackground('#0a3d91').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  // Dates stay text, so "07/12/2026" is read as day/month whatever the sheet's locale.
  sheet.getRange('F:G').setNumberFormat('@');
  if (FAQ_SEED.length) {
    var rows = FAQ_SEED.map(function (row) {
      return [row.id, row.group, row.question, row.variants.join('\n'), row.answer, row.from, row.to, 'Có'];
    });
    sheet.getRange(2, 1, rows.length, FAQ_HEADERS.length).setValues(rows);
  }
  sheet.getRange('C:E').setWrap(true).setVerticalAlignment('top');
  sheet.setColumnWidths(1, 2, 140);
  sheet.setColumnWidth(3, 260);
  sheet.setColumnWidth(4, 320);
  sheet.setColumnWidth(5, 420);
  faqClearCache_();
  Logger.log('FAQ tab ready with ' + FAQ_SEED.length + ' starter rows.');
}

/**
 * Shows how the chat would handle a question: the decision, the best row and its score.
 *
 * @param {string} question A learner question.
 * @return The decision (trả lời / AI hoặc gợi ý), best row id, score and coverage.
 * @customfunction
 */
function FAQ_KHOP(question) {
  var result = faqLookup_(String(question || ''));
  var best = result.ranked[0];
  if (!best) return [['không khớp', '', 0, 0]];
  return [[result.answer ? 'trả lời' : 'AI hoặc gợi ý', best.row.id, Math.round(best.score * 10) / 10, Math.round(best.coverage * 100) / 100]];
}

// Clears the cached rows as soon as staff edit the FAQ tab.
function onEdit(e) {
  try {
    if (e && e.range && e.range.getSheet().getName() === FAQ_SHEET_NAME) faqClearCache_();
  } catch (err) {
    // The cache also expires on its own after FAQ_CACHE_SECONDS.
  }
}

function faqRowsCount_() {
  try {
    return faqRows_().length;
  } catch (err) {
    return 0;
  }
}

function faqClearCache_() {
  CacheService.getScriptCache().remove(FAQ_CACHE_KEY);
}

// Returns { answer: row or null, candidates: rows worth offering, ranked: scored rows }.
function faqLookup_(question) {
  var empty = { answer: null, candidates: [], ranked: [] };
  var rows;
  try {
    rows = faqRows_();
  } catch (err) {
    return empty;
  }
  var today = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyyMMdd');
  rows = rows.filter(function (row) {
    return (!row.from || today >= row.from) && (!row.to || today <= row.to);
  });
  var query = faqTerms_(question);
  if (!rows.length || !query.words.length) return empty;

  var docs = [];
  rows.forEach(function (row) {
    [row.question].concat(row.variants).forEach(function (text) {
      var terms = faqTerms_(text);
      if (terms.all.length) docs.push({ row: row, terms: terms });
    });
  });
  var frequency = {};
  var totalLength = 0;
  docs.forEach(function (doc) {
    totalLength += doc.terms.all.length;
    faqUnique_(doc.terms.all).forEach(function (term) { frequency[term] = (frequency[term] || 0) + 1; });
  });
  var averageLength = totalLength / docs.length;

  var best = {};
  docs.forEach(function (doc) {
    var counts = {};
    doc.terms.all.forEach(function (term) { counts[term] = (counts[term] || 0) + 1; });
    var score = 0;
    faqUnique_(query.all).forEach(function (term) {
      var tf = counts[term];
      if (!tf) return;
      var idf = Math.log(1 + (docs.length - frequency[term] + 0.5) / (frequency[term] + 0.5));
      score += idf * tf * (FAQ_BM25_K1 + 1) / (tf + FAQ_BM25_K1 * (1 - FAQ_BM25_B + FAQ_BM25_B * doc.terms.all.length / averageLength));
    });
    var hits = query.words.filter(function (word) { return counts[word]; }).length;
    var coverage = hits / query.words.length;
    var current = best[doc.row.id];
    if (!current || score > current.score) best[doc.row.id] = { row: doc.row, score: score, coverage: coverage };
  });

  var ranked = Object.keys(best).map(function (id) { return best[id]; })
    .filter(function (entry) { return entry.score > 0; })
    .sort(function (a, b) { return b.score - a.score; });
  var top = ranked[0];
  var second = ranked[1];
  var confident = top && top.score >= FAQ_MIN_SCORE && top.coverage >= FAQ_MIN_COVERAGE &&
    (!second || top.score >= second.score * FAQ_MIN_MARGIN);
  return {
    answer: confident ? top.row : null,
    candidates: ranked.filter(function (entry) {
      return entry.score >= FAQ_MIN_CANDIDATE && entry.coverage >= FAQ_MIN_CANDIDATE_COVERAGE;
    }).slice(0, 3).map(function (entry) { return entry.row; }),
    ranked: ranked
  };
}

// Words for matching: lower case, shorthand expanded, particles dropped. Each word is indexed
// unaccented (so "hoc phi" finds "học phí") and, when written with accents, also accented (so
// "cô" and "có" stay apart for learners who type accents). Neighbouring pairs add phrase weight.
function faqTerms_(text) {
  var raw = String(text || '').toLowerCase().normalize('NFC').match(/[\p{L}\p{N}]+/gu) || [];
  var words = [];
  var accented = [];
  raw.forEach(function (word) {
    if (FAQ_STOP[word]) return;
    var plain = faqFold_(word);
    var expanded = FAQ_SHORTHAND_ACCENTED[word] || (word === plain ? FAQ_SHORTHAND[plain] : null);
    if (expanded) {
      expanded.split(' ').forEach(function (part) { words.push(part); });
      return;
    }
    words.push(plain);
    if (word !== plain) accented.push('~' + word);
  });
  var pairs = [];
  for (var i = 1; i < words.length; i++) pairs.push(words[i - 1] + '_' + words[i]);
  return { words: words, all: words.concat(accented, pairs) };
}

function faqFold_(word) {
  return word.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
}

function faqUnique_(list) {
  var seen = {};
  return list.filter(function (item) {
    if (seen[item]) return false;
    seen[item] = true;
    return true;
  });
}

// Rows from the FAQ tab, cached as gzip so a long table still fits one cache entry.
function faqRows_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(FAQ_CACHE_KEY);
  if (cached) {
    return JSON.parse(Utilities.ungzip(Utilities.newBlob(Utilities.base64Decode(cached), 'application/x-gzip')).getDataAsString());
  }
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(FAQ_SHEET_NAME);
  if (!sheet) return [];
  var zone = book.getSpreadsheetTimeZone();
  var rows = sheet.getDataRange().getValues().slice(1).map(function (cells) {
    return {
      id: String(cells[0] || '').trim(),
      group: String(cells[1] || '').trim(),
      question: String(cells[2] || '').trim(),
      variants: String(cells[3] || '').split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean),
      answer: String(cells[4] || '').trim(),
      from: faqDay_(cells[5], zone),
      to: faqDay_(cells[6], zone),
      on: !/^(không|khong|tắt|tat|no|false|0)$/i.test(String(cells[7] === undefined ? '' : cells[7]).trim())
    };
  }).filter(function (row) { return row.on && row.question && row.answer; });
  rows.forEach(function (row, i) { if (!row.id) row.id = 'dong-' + (i + 2); });
  try {
    var packed = Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(JSON.stringify(rows), 'application/json')).getBytes());
    if (packed.length < 100000) cache.put(FAQ_CACHE_KEY, packed, FAQ_CACHE_SECONDS);
  } catch (err) {
    // Too big or cache unavailable: the tab is read on each question instead.
  }
  return rows;
}

// 'yyyyMMdd' from a date cell (a Date, or text written dd/MM/yyyy), or '' when empty or unreadable.
function faqDay_(value, zone) {
  if (value instanceof Date && !isNaN(value)) return Utilities.formatDate(value, zone, 'yyyyMMdd');
  var match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(value || '').trim());
  if (!match) return '';
  return match[3] + ('0' + match[2]).slice(-2) + ('0' + match[1]).slice(-2);
}
