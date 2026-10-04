/**
 * Brings the FAQ tab and the "Thông tin thêm" tab up to date with the repository, so new data
 * needs no pasted code and no new deployment. Each deployment of the site publishes
 * assistant-data.json (built by tools/build-assistant-data.js from FaqSeed.gs and Knowledge.gs).
 * In the sheet, staff choose Trợ lý AI > Cập nhật dữ liệu từ trang web. For each row (by Mã):
 *   - a group, question, answer, date or fact is replaced only while the cell still holds what the
 *     last update brought in (on the first update: a text the repository ever wrote, from the hashes
 *     in the data file). A cell staff changed keeps their text; the new text goes into a block at
 *     the end of the cell's note, below any note staff wrote;
 *   - phrasings new in the repository since the last update are added, unless another active row
 *     with overlapping dates already has them; phrasings the repository dropped are removed;
 *     phrasings and rows staff deleted are not brought back;
 *   - rows the repository dropped are switched off ("Không" in Bật) while their answer is still
 *     the repository's text;
 *   - rows staff added, columns to the right and every other cell are left alone.
 * What the last update brought in is kept in the document properties (keys "sync:...").
 */

var SYNC_DEFAULT_URL = 'https://thaingocthienlong.github.io/landing-page-01.27/assistant-data.json';
var SYNC_NOTE_PREFIX = 'Bản mới trên trang web';
var SYNC_LOG_SHEET_NAME = 'Lịch sử cập nhật';
var SYNC_MENU_ITEM = 'Cập nhật dữ liệu từ trang web';
var SYNC_ASK_HELP = 'chụp màn hình thông báo này gửi người phụ trách trang web.';
var FACTS_SHEET_NAME = 'Thông tin thêm';
var FACTS_HEADERS = ['Mã', 'Nội dung', 'Bật'];
var FACTS_CACHE_KEY = 'facts_rows_v1';
// Folded words each header must contain, so a renamed or inserted column stops the update.
var SYNC_FAQ_HEADER_WORDS = ['ma', 'nhom', 'cau hoi', 'cach hoi', 'tra loi', 'tu ngay', 'den ngay', 'bat'];
var SYNC_FACTS_HEADER_WORDS = ['ma', 'noi dung', 'bat'];

function onOpen() {
  try {
    SpreadsheetApp.getUi().createMenu('Trợ lý AI').addItem(SYNC_MENU_ITEM, 'syncAssistantData').addToUi();
  } catch (err) {
    // Opened without a user interface: no menu to add.
  }
}

function syncAssistantData() {
  var result = syncAssistantData_();
  try {
    SpreadsheetApp.getUi().alert(result.message);
  } catch (err) {
    Logger.log(result.message);
  }
  return result;
}

function syncAssistantData_() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var url = String(PropertiesService.getScriptProperties().getProperty('ASSISTANT_DATA_URL') || '').trim() || SYNC_DEFAULT_URL;
  var retry = ' Bảng chưa thay đổi gì. Chờ vài phút rồi chọn lại menu; nếu vẫn lỗi, ' + SYNC_ASK_HELP;
  var data;
  try {
    // The time parameter skips the copy GitHub Pages keeps for up to 10 minutes.
    var res = UrlFetchApp.fetch(url + (url.indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now(), { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return syncFail_(book, '', 'Không tải được dữ liệu từ trang web (mã lỗi ' + res.getResponseCode() + ').' + retry);
    data = JSON.parse(res.getContentText());
  } catch (err) {
    return syncFail_(book, '', 'Không đọc được dữ liệu từ trang web.' + retry);
  }
  var invalid = syncInvalid_(data);
  if (invalid) return syncFail_(book, '', 'Dữ liệu trên trang web bị lỗi (' + invalid + ') nên chưa cập nhật được. Bảng chưa thay đổi gì. Vui lòng ' + SYNC_ASK_HELP);

  var lock = LockService.getDocumentLock() || LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { ok: false, message: 'Có người khác đang cập nhật. Chờ một phút rồi chọn lại menu.' };
  var props = PropertiesService.getDocumentProperties() || PropertiesService.getScriptProperties();
  try {
    var meta = JSON.parse(props.getProperty('sync:meta') || '{}');
    if (meta.time && data.time && Date.parse(data.time) < Date.parse(meta.time)) {
      return syncFail_(book, data.version, 'Dữ liệu trên trang web (' + syncLabel_(data.version) + ') cũ hơn lần cập nhật trước (' + syncLabel_(meta.version) + ') nên không dùng. Bảng chưa thay đổi gì. Chờ vài phút rồi chọn lại menu.');
    }
    var faqSheet = syncSheet_(book, FAQ_SHEET_NAME, faqStartSheet_);
    var factsSheet = syncSheet_(book, FACTS_SHEET_NAME, factsStartSheet_);
    var badHeader = syncHeaderProblem_(faqSheet, SYNC_FAQ_HEADER_WORDS) ? FAQ_SHEET_NAME
      : syncHeaderProblem_(factsSheet, SYNC_FACTS_HEADER_WORDS) ? FACTS_SHEET_NAME : '';
    if (badHeader) {
      return syncFail_(book, data.version, 'Hàng tiêu đề của tab "' + badHeader + '" đã bị đổi (đổi tên, thêm hoặc xóa cột) nên chưa cập nhật được. Bảng chưa thay đổi gì. Đưa các cột về như cũ, hoặc ' + SYNC_ASK_HELP);
    }
    var label = syncLabel_(data.version);
    var faq = syncTab_(book, faqSheet, data.faq, data.retiredFaq, props, 'faq', label, {
      headers: FAQ_HEADERS,
      fields: [[1, 'group'], [2, 'question'], [4, 'answer'], [5, 'from'], [6, 'to']],
      main: [4, 'answer'], variants: 3, on: 7,
      row: function (item, variants) { return [item.id, item.group, item.question, variants.join('\n'), item.answer, item.from || '', item.to || '', 'Có']; }
    });
    var facts = syncTab_(book, factsSheet, data.facts, data.retiredFacts, props, 'fact', label, {
      headers: FACTS_HEADERS,
      fields: [[1, 'text']],
      main: [1, 'text'], on: 2,
      row: function (item) { return [item.id, item.text, 'Có']; }
    });
    props.setProperty('sync:meta', JSON.stringify({ time: data.time || '', version: data.version }));
    var message = syncMessage_(label, faq, facts);
    syncLog_(book, data.version, message);
    return { ok: true, message: message, faq: faq, facts: facts };
  } catch (err) {
    return syncFail_(book, data.version, 'Cập nhật bị gián đoạn (' + err.message + '). Một phần bảng có thể đã được cập nhật; chọn lại menu để chạy tiếp. Nếu vẫn lỗi, ' + SYNC_ASK_HELP);
  } finally {
    faqClearCache_();
    knowledgeClearCache_();
    lock.releaseLock();
  }
}

function syncFail_(book, version, message) {
  syncLog_(book, version, message);
  return { ok: false, message: message };
}

// The first broken rule, or '' when the file can be used.
function syncInvalid_(data) {
  var text = function (value) { return typeof value === 'string'; };
  var texts = function (list) { return Array.isArray(list) && list.every(text); };
  if (!data || data.format !== 1 || !text(data.version) || !Array.isArray(data.faq) || !Array.isArray(data.facts) ||
    (data.retiredFaq && !Array.isArray(data.retiredFaq)) || (data.retiredFacts && !Array.isArray(data.retiredFacts))) return 'định dạng';
  var seen = {};
  for (var i = 0; i < data.faq.length; i++) {
    var item = data.faq[i];
    var name = 'dòng FAQ ' + (item && text(item.id) && item.id ? item.id : i + 1);
    if (!item || !text(item.id) || !item.id || seen['f' + item.id]) return name;
    seen['f' + item.id] = true;
    if (!text(item.group) || !text(item.question) || !item.question || !text(item.answer) || !item.answer || !texts(item.variants) ||
      !text(item.from || '') || !text(item.to || '') || (item.retired && !texts(item.retired))) return name;
  }
  for (var j = 0; j < data.facts.length; j++) {
    var fact = data.facts[j];
    var factName = 'dòng Thông tin thêm ' + (fact && text(fact.id) && fact.id ? fact.id : j + 1);
    if (!fact || !text(fact.id) || !fact.id || seen['t' + fact.id] || !text(fact.text) || !fact.text) return factName;
    seen['t' + fact.id] = true;
  }
  return '';
}

function syncSheet_(book, name, start) {
  var sheet = book.getSheetByName(name) || book.insertSheet(name);
  if (sheet.getLastRow() === 0) start(sheet);
  return sheet;
}

function syncHeaderProblem_(sheet, words) {
  var row = sheet.getRange(1, 1, 1, words.length).getValues()[0];
  return words.some(function (word, i) { return syncFold_(row[i]).indexOf(word) === -1; });
}

function syncFold_(value) {
  return faqFold_(String(value || '').toLowerCase()).replace(/\s+/g, ' ').trim();
}

// Merges the repository's items into one tab; see the top of this file for the rules.
function syncTab_(book, sheet, items, retiredItems, props, kind, label, spec) {
  var counts = { rows: 0, updated: 0, added: 0, removed: 0, off: 0, kept: [], skipped: [], clashes: [] };
  var tab = sheet.getName();
  var range = sheet.getDataRange();
  var values = range.getValues();
  var notes = range.getNotes();
  var cell = function (cells, col) { return cells && col < cells.length ? cells[col] : ''; };
  var zone = book.getSpreadsheetTimeZone();
  var at = {};
  values.forEach(function (cells, i) {
    var id = String(cell(cells, 0) || '').trim();
    if (i > 0 && id && !(id in at)) at[id] = i;
  });
  var lastIds = JSON.parse(props.getProperty('sync:' + kind + ':ids') || 'null');
  var writes = [];
  var appends = [];
  var noteWrites = [];
  var day = function (value) { return faqDay_(value instanceof Date ? value : syncText_(value), zone); };

  // Phrasings by matcher words, for the "already on another active row" check (FAQ tab only).
  var index = {};
  var windowOf = function (cells) { return { from: day(cell(cells, 5)), to: day(cell(cells, 6)) }; };
  var overlaps = function (a, b) { return (!a.from || !b.to || a.from <= b.to) && (!b.from || !a.to || b.from <= a.to); };
  if (spec.variants !== undefined) {
    values.forEach(function (cells, i) {
      if (i === 0) return;
      String(cell(cells, spec.variants) || '').split(/\r?\n/).concat([cell(cells, 2)]).forEach(function (line) {
        if (!String(line || '').trim()) return;
        var key = syncWords_(line);
        (index[key] = index[key] || []).push(i);
      });
    });
  }
  // Phrasings the repository dropped, per row, worked out first so a phrasing moved to another
  // row is not taken for a duplicate: since the last update or, on the first update, ever.
  var states = {};
  var droppedAt = {};
  items.forEach(function (item) {
    var state = JSON.parse(props.getProperty('sync:' + kind + ':' + item.id) || 'null');
    states[item.id] = state;
    var i = at[item.id];
    if (i === undefined || spec.variants === undefined) return;
    var repoKeys = (item.variants || []).map(syncWords_);
    var dropped = {};
    if (state && state.v) state.v.forEach(function (key) { if (repoKeys.indexOf(key) === -1) dropped[key] = true; });
    else (item.retired || []).forEach(function (line) { dropped[syncWords_(line)] = true; });
    droppedAt[i] = dropped;
    Object.keys(dropped).forEach(function (key) {
      if (index[key]) index[key] = index[key].filter(function (j) { return j !== i; });
    });
  });
  var elsewhere = function (key, i, window) {
    return (index[key] || []).some(function (j) {
      return j !== i && syncOn_(cell(values[j], spec.on)) && overlaps(window, windowOf(values[j]));
    });
  };

  items.forEach(function (item) {
    var stateKey = 'sync:' + kind + ':' + item.id;
    var state = states[item.id];
    var repoKeys = (item.variants || []).map(syncWords_);
    var next = { h: {}, v: repoKeys };
    spec.fields.forEach(function (pair) { next.h[pair[1]] = syncHash_(syncText_(item[pair[1]])); });
    var i = at[item.id];
    if (i === undefined) {
      // Not in the tab and already brought in once: staff deleted it, so it stays out.
      if (!(lastIds && lastIds.indexOf(item.id) !== -1)) {
        var window = { from: day(item.from), to: day(item.to) };
        var variants = (item.variants || []).filter(function (line) {
          if (spec.variants === undefined || !elsewhere(syncWords_(line), -1, window)) return true;
          counts.skipped.push('"' + line + '" (dòng mới ' + item.id + ')');
          return false;
        });
        appends.push(spec.row(item, variants));
        counts.rows += 1;
        // A question cannot be left out like a phrasing: staff choose which row stays on.
        if (spec.variants !== undefined && elsewhere(syncWords_(item.question), -1, window)) {
          counts.clashes.push('dòng mới ' + item.id + ' ("' + item.question + '")');
        }
      }
      props.setProperty(stateKey, JSON.stringify(next));
      return;
    }
    var cells = values[i];
    spec.fields.forEach(function (pair) {
      var col = pair[0];
      var field = pair[1];
      var isDate = field === 'from' || field === 'to';
      var current = isDate ? syncDayText_(cell(cells, col), zone) : syncText_(cell(cells, col));
      var wanted = syncText_(item[field]);
      var note = String(cell(notes[i], col) || '');
      // A note pasted whole into the cell counts as taking the new text.
      var pasted = current.indexOf(SYNC_NOTE_PREFIX) === 0 && current.indexOf('\n') !== -1 &&
        syncText_(current.slice(current.indexOf('\n') + 1)) === wanted;
      if (current === wanted) {
        syncNote_(noteWrites, i, col, note, '');
        return;
      }
      var unchanged = state && state.h && state.h[field] !== undefined
        ? state.h[field] === syncHash_(current)
        : ((item.known && item.known[field]) || []).indexOf(syncHash_(current)) !== -1;
      if (pasted || unchanged) {
        writes.push({ row: i, col: col, value: item[field] || '', date: isDate });
        counts.updated += 1;
        syncNote_(noteWrites, i, col, note, '');
        return;
      }
      counts.kept.push(tab + ', dòng ' + (i + 1) + ' (' + item.id + '), cột ' + spec.headers[col]);
      syncNote_(noteWrites, i, col, note, wanted
        ? SYNC_NOTE_PREFIX + ' (' + label + '). Ô này đã được sửa trong bảng nên được giữ nguyên. Muốn dùng bản mới, chép phần dưới dòng này vào ô:\n' + item[field]
        : SYNC_NOTE_PREFIX + ' (' + label + ') để trống ô này. Ô này đã được sửa trong bảng nên được giữ nguyên. Muốn dùng bản mới, xóa chữ trong ô.');
    });
    if (spec.variants !== undefined) {
      var col = spec.variants;
      var lines = String(cell(cells, col) || '').split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
      var dropped = droppedAt[i];
      var keep = lines.filter(function (line) { return !dropped[syncWords_(line)]; });
      var seen = {};
      [cell(cells, 2)].concat(keep).forEach(function (line) { seen[syncWords_(line)] = true; });
      var before = keep.length;
      var rowWindow = windowOf(cells);
      item.variants.forEach(function (line, k) {
        var key = repoKeys[k];
        if (seen[key]) return;
        seen[key] = true;
        // Brought in by an earlier update and since removed by staff: leave it out.
        if (state && state.v && state.v.indexOf(key) !== -1) return;
        if (elsewhere(key, i, rowWindow)) {
          counts.skipped.push('"' + line + '" (' + item.id + ')');
          return;
        }
        keep.push(line);
      });
      if (keep.length !== lines.length || before !== lines.length) {
        counts.removed += lines.length - before;
        counts.added += keep.length - before;
        writes.push({ row: i, col: col, value: keep.join('\n') });
      }
    }
    props.setProperty(stateKey, JSON.stringify(next));
  });

  // Rows the repository dropped: switched off while their main text is still the repository's.
  (retiredItems || []).forEach(function (old) {
    var i = at[old.id];
    if (i === undefined || !syncOn_(cell(values[i], spec.on))) return;
    var known = (old.known && old.known[spec.main[1]]) || [];
    if (known.indexOf(syncHash_(syncText_(cell(values[i], spec.main[0])))) !== -1) {
      writes.push({ row: i, col: spec.on, value: 'Không' });
      counts.off += 1;
    } else {
      counts.kept.push(tab + ', dòng ' + (i + 1) + ' (' + old.id + '): trang web đã bỏ dòng này');
      syncNote_(noteWrites, i, 0, String(cell(notes[i], 0) || ''), SYNC_NOTE_PREFIX + ' (' + label + ') đã bỏ dòng này. Dòng đã được sửa trong bảng nên vẫn để bật; nếu không cần nữa, ghi Không ở cột Bật.');
    }
  });

  syncWrite_(sheet, writes, appends, spec.headers.length);
  noteWrites.forEach(function (change) {
    var target = sheet.getRange(change.row + 1, change.col + 1);
    if (change.note) target.setNote(change.note);
    else target.clearNote();
  });
  props.setProperty('sync:' + kind + ':ids', JSON.stringify(items.map(function (item) { return item.id; })));
  return counts;
}

// Only the sync's own block of a note is replaced or removed; a note staff wrote stays above it.
function syncNote_(noteWrites, row, col, note, block) {
  var at = note.indexOf(SYNC_NOTE_PREFIX);
  var staff = (at === -1 ? note : note.slice(0, at)).replace(/\s+$/, '');
  var next = block ? (staff ? staff + '\n\n' : '') + block : staff;
  if (next !== note) noteWrites.push({ row: row, col: col, note: next });
}

// Writes only the changed cells (neighbouring cells of a row at once), then appends new rows.
function syncWrite_(sheet, writes, appends, width) {
  var cells = writes.slice().sort(function (a, b) { return a.row - b.row || a.col - b.col; });
  for (var k = 0; k < cells.length;) {
    var run = [cells[k]];
    while (k + run.length < cells.length && cells[k + run.length].row === run[0].row && cells[k + run.length].col === run[run.length - 1].col + 1) {
      run.push(cells[k + run.length]);
    }
    sheet.getRange(run[0].row + 1, run[0].col + 1, 1, run.length).setValues([run.map(function (w) { return syncCell_(w.value, w.date); })]);
    k += run.length;
  }
  if (!appends.length) return;
  var rows = appends.map(function (values) {
    return values.map(function (value, col) { return syncCell_(value, width > 3 && (col === 5 || col === 6)); });
  });
  var start = sheet.getLastRow() + 1;
  var missing = start + rows.length - 1 - sheet.getMaxRows();
  if (missing > 0) sheet.insertRowsAfter(sheet.getMaxRows(), missing);
  sheet.getRange(start, 1, rows.length, width).setValues(rows);
}

// Text Sheets would read as a formula, a number or a date is stored as plain text.
function syncCell_(value, date) {
  if (typeof value !== 'string' || value === '') return value;
  return date || /^[=+\-'@]/.test(value) ? "'" + value : value;
}

function syncOn_(value) {
  return !/^(không|khong|tắt|tat|no|false|0)$/i.test(String(value === undefined || value === null ? '' : value).trim());
}

function factsStartSheet_(sheet) {
  sheet.appendRow(FACTS_HEADERS);
  sheet.getRange(1, 1, 1, FACTS_HEADERS.length).setFontWeight('bold').setBackground('#0a3d91').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  sheet.getRange('B:B').setWrap(true).setVerticalAlignment('top');
  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 640);
}

// One form for comparing a cell with the repository: line breaks, accents and trailing spaces
// written differently still count as the same text. tools/build-assistant-data.js matches it.
function syncText_(value) {
  return String(value === undefined || value === null ? '' : value).replace(/\r\n?/g, '\n').normalize('NFC')
    .split('\n').map(function (line) { return line.replace(/\s+$/, ''); }).join('\n').trim();
}

function syncDayText_(value, zone) {
  if (value instanceof Date && !isNaN(value)) return Utilities.formatDate(value, zone, 'dd/MM/yyyy');
  return syncText_(value);
}

function syncHash_(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, text, Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}

// Two phrasings that the matcher reads the same way count as one.
function syncWords_(line) {
  var words = faqTerms_(line).words.join(' ');
  return words || syncText_(line).toLowerCase();
}

// "2026-10-03 d2d8909" reads as "bản ngày 03/10/2026" for staff; the log keeps the full version.
function syncLabel_(version) {
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(version || ''));
  return m ? 'bản ngày ' + m[3] + '/' + m[2] + '/' + m[1] : 'bản ' + version;
}

function syncMessage_(label, faq, facts) {
  var changed = faq.rows + faq.updated + faq.added + faq.removed + faq.off + facts.rows + facts.updated + facts.off;
  var lines = [];
  if (changed) {
    lines.push('Đã cập nhật từ trang web (' + label + ').');
    lines.push('FAQ: ' + faq.rows + ' dòng mới, ' + faq.added + ' cách hỏi mới, ' + faq.removed + ' cách hỏi cũ được bỏ, ' + faq.updated + ' ô được cập nhật' + (faq.off ? ', ' + faq.off + ' dòng trang web đã bỏ được tắt' : '') + '.');
    lines.push('Thông tin thêm: ' + facts.rows + ' dòng mới, ' + facts.updated + ' dòng được cập nhật' + (facts.off ? ', ' + facts.off + ' dòng trang web đã bỏ được tắt' : '') + '.');
  } else {
    lines.push('Không có gì mới từ trang web (' + label + ').');
  }
  var kept = faq.kept.concat(facts.kept);
  if (kept.length) {
    lines.push('Giữ nguyên ' + kept.length + ' ô đã được sửa trong bảng. Bản mới nằm trong ghi chú của từng ô (tam giác nhỏ ở góc ô):');
    kept.slice(0, 15).forEach(function (where) { lines.push('- ' + where); });
    if (kept.length > 15) lines.push('- và ' + (kept.length - 15) + ' ô khác');
  }
  if (faq.clashes.length) {
    lines.push('Câu hỏi của ' + faq.clashes.length + ' dòng mới trùng với một dòng khác đang bật; ghi Không ở cột Bật của một trong hai dòng:');
    faq.clashes.forEach(function (what) { lines.push('- ' + what); });
  }
  if (faq.skipped.length) {
    lines.push('Không thêm ' + faq.skipped.length + ' cách hỏi vì một dòng khác đang bật đã có:');
    faq.skipped.slice(0, 10).forEach(function (what) { lines.push('- ' + what); });
    if (faq.skipped.length > 10) lines.push('- và ' + (faq.skipped.length - 10) + ' cách hỏi khác');
  }
  return lines.join('\n');
}

function syncLog_(book, version, message) {
  try {
    var sheet = book.getSheetByName(SYNC_LOG_SHEET_NAME);
    if (!sheet) {
      sheet = book.insertSheet(SYNC_LOG_SHEET_NAME);
      sheet.appendRow(['Thời gian', 'Phiên bản', 'Kết quả']);
      sheet.setFrozenRows(1);
    }
    var when = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm');
    sheet.appendRow([when, version, message].map(textCell_));
  } catch (err) {
    // The log is a convenience; the result was already shown.
  }
}

// Enabled rows of the "Thông tin thêm" tab, or null while the tab does not exist or cannot be
// read; the prompt then uses the facts built into Knowledge.gs.
function knowledgeFacts_() {
  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get(FACTS_CACHE_KEY);
    if (cached) return JSON.parse(cached);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FACTS_SHEET_NAME);
    var facts = null;
    if (sheet) {
      facts = sheet.getDataRange().getValues().slice(1).map(function (cells) {
        return { id: String(cells[0] || '').trim(), text: syncText_(cells[1]).replace(/\s*\n\s*/g, ' '), on: syncOn_(cells[2]) };
      }).filter(function (fact) { return fact.on && fact.text; }).map(function (fact) { return { id: fact.id, text: fact.text }; });
    }
    try {
      cache.put(FACTS_CACHE_KEY, JSON.stringify(facts), FAQ_CACHE_SECONDS);
    } catch (err) {
      // Too big for the cache: the tab is read on each question instead.
    }
    return facts;
  } catch (err) {
    return null;
  }
}

function knowledgeClearCache_() {
  CacheService.getScriptCache().remove(FACTS_CACHE_KEY);
}
