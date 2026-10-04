/**
 * Brings the FAQ tab and the "Thông tin thêm" tab up to date with the repository, so new data
 * needs no pasted code and no new deployment. Each deployment of the site publishes
 * assistant-data.json (built by tools/build-assistant-data.js from FaqSeed.gs and Knowledge.gs).
 * In the sheet, staff choose Trợ lý AI > Cập nhật dữ liệu từ trang:
 *   - rows the repository has and the tab does not are added;
 *   - phrasings the repository added are appended, and phrasings it retired are removed;
 *   - a group, question, answer or date is replaced only while the cell still holds a text the
 *     repository wrote at some point (the data file lists their hashes), so a cell staff edited
 *     keeps their text and the repository's new text goes into the cell's note;
 *   - rows staff added themselves, the "Bật" column and columns to the right are never touched.
 */

var SYNC_DEFAULT_URL = 'https://thaingocthienlong.github.io/landing-page-01.27/assistant-data.json';
var SYNC_NOTE_PREFIX = 'Bản mới trên trang';
var SYNC_LOG_SHEET_NAME = 'Lịch sử cập nhật';
var FACTS_SHEET_NAME = 'Thông tin thêm';
var FACTS_HEADERS = ['Mã', 'Nội dung', 'Bật'];
var FACTS_CACHE_KEY = 'facts_rows_v1';

function onOpen() {
  try {
    SpreadsheetApp.getUi().createMenu('Trợ lý AI').addItem('Cập nhật dữ liệu từ trang', 'syncAssistantData').addToUi();
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
  var url = String(PropertiesService.getScriptProperties().getProperty('ASSISTANT_DATA_URL') || '').trim() || SYNC_DEFAULT_URL;
  var data;
  try {
    // The time parameter skips the copy GitHub Pages keeps for up to 10 minutes.
    var res = UrlFetchApp.fetch(url + (url.indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now(), { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) {
      return { ok: false, message: 'Không tải được dữ liệu từ trang (mã ' + res.getResponseCode() + '). Bảng chưa thay đổi.' };
    }
    data = JSON.parse(res.getContentText());
  } catch (err) {
    return { ok: false, message: 'Không đọc được dữ liệu từ trang. Bảng chưa thay đổi.' };
  }
  if (!syncValid_(data)) return { ok: false, message: 'Dữ liệu trên trang không đúng định dạng. Bảng chưa thay đổi.' };

  var lock = LockService.getDocumentLock() || LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var book = SpreadsheetApp.getActiveSpreadsheet();
    var faq = syncTab_(book, FAQ_SHEET_NAME, FAQ_HEADERS, data.faq, data.version, {
      fields: [[1, 'group'], [2, 'question'], [4, 'answer'], [5, 'from'], [6, 'to']],
      variants: 3,
      start: faqStartSheet_,
      row: function (item) { return [item.id, item.group, item.question, item.variants.join('\n'), item.answer, item.from || '', item.to || '', 'Có']; }
    });
    var facts = syncTab_(book, FACTS_SHEET_NAME, FACTS_HEADERS, data.facts, data.version, {
      fields: [[1, 'text']],
      start: factsStartSheet_,
      row: function (item) { return [item.id, item.text, 'Có']; }
    });
    faqClearCache_();
    knowledgeClearCache_();
    var message = syncMessage_(data.version, faq, facts);
    syncLog_(book, data.version, message);
    return { ok: true, message: message, faq: faq, facts: facts };
  } finally {
    lock.releaseLock();
  }
}

function syncValid_(data) {
  var text = function (value) { return typeof value === 'string'; };
  return !!data && data.format === 1 && text(data.version) && Array.isArray(data.faq) && Array.isArray(data.facts) &&
    data.faq.every(function (item) {
      return item && text(item.id) && item.id && text(item.group) && text(item.question) && item.question &&
        text(item.answer) && item.answer && Array.isArray(item.variants) && item.variants.every(text);
    }) &&
    data.facts.every(function (item) { return item && text(item.id) && item.id && text(item.text) && item.text; });
}

// Merges the repository's items into one tab; see the top of this file for the rules.
function syncTab_(book, name, headers, items, version, spec) {
  var counts = { rows: 0, updated: 0, kept: 0, added: 0, removed: 0 };
  var sheet = book.getSheetByName(name);
  if (!sheet) sheet = book.insertSheet(name);
  if (sheet.getLastRow() === 0) spec.start(sheet);
  var width = headers.length;
  var range = sheet.getDataRange();
  var values = range.getValues();
  var notes = range.getNotes();
  var pad = function (cells, fill) {
    var row = cells.slice(0, width);
    while (row.length < width) row.push(fill);
    return row;
  };
  var grid = values.map(function (cells) { return pad(cells, ''); });
  var noteGrid = notes.map(function (cells) { return pad(cells, ''); });
  var zone = book.getSpreadsheetTimeZone();
  var at = {};
  grid.forEach(function (cells, i) {
    var id = String(cells[0] || '').trim();
    if (i > 0 && id && !(id in at)) at[id] = i;
  });
  var noteChanges = [];
  var changed = {};
  var added = [];

  items.forEach(function (item) {
    var i = at[item.id];
    if (i === undefined) {
      added.push(spec.row(item));
      counts.rows += 1;
      return;
    }
    var cells = grid[i];
    spec.fields.forEach(function (pair) {
      var col = pair[0];
      var field = pair[1];
      var current = field === 'from' || field === 'to' ? syncDayText_(cells[col], zone) : syncText_(cells[col]);
      var wanted = syncText_(item[field]);
      var note = String(noteGrid[i][col] || '');
      var ours = note.indexOf(SYNC_NOTE_PREFIX) === 0;
      if (current === wanted) {
        if (ours) noteChanges.push([i, col, '']);
        return;
      }
      var known = (item.known && item.known[field]) || [];
      if (known.indexOf(syncHash_(current)) !== -1) {
        cells[col] = item[field] || '';
        counts.updated += 1;
        changed[i] = true;
        if (ours) noteChanges.push([i, col, '']);
        return;
      }
      counts.kept += 1;
      var text = SYNC_NOTE_PREFIX + ' (' + version + '):\n' + (item[field] || '(để trống)');
      if (note !== text) noteChanges.push([i, col, text]);
    });
    if (spec.variants !== undefined) {
      var col = spec.variants;
      var retired = {};
      (item.retired || []).forEach(function (line) { retired[syncText_(line)] = true; });
      var lines = String(cells[col] || '').split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
      var keep = lines.filter(function (line) { return !retired[syncText_(line)]; });
      var seen = {};
      [cells[2]].concat(keep).forEach(function (line) { seen[syncWords_(line)] = true; });
      var before = keep.length;
      item.variants.forEach(function (line) {
        var key = syncWords_(line);
        if (seen[key]) return;
        seen[key] = true;
        keep.push(line);
      });
      if (keep.length !== lines.length || before !== lines.length) {
        counts.removed += lines.length - before;
        counts.added += keep.length - before;
        cells[col] = keep.join('\n');
        changed[i] = true;
      }
    }
  });

  // Only rows that changed are written, so a formula or a fresh edit elsewhere in the tab stays.
  Object.keys(changed).forEach(function (i) {
    sheet.getRange(Number(i) + 1, 1, 1, width).setValues([grid[i]]);
  });
  if (added.length) sheet.getRange(grid.length + 1, 1, added.length, width).setValues(added);
  noteChanges.forEach(function (change) {
    var cell = sheet.getRange(change[0] + 1, change[1] + 1);
    if (change[2]) cell.setNote(change[2]);
    else cell.clearNote();
  });
  return counts;
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

function syncMessage_(version, faq, facts) {
  var changed = faq.rows + faq.updated + faq.added + faq.removed + facts.rows + facts.updated;
  var kept = faq.kept + facts.kept;
  var lines = [];
  if (changed) {
    lines.push('Đã cập nhật từ trang (phiên bản ' + version + ').');
    lines.push('FAQ: ' + faq.rows + ' dòng mới, ' + faq.added + ' cách hỏi mới, ' + faq.removed + ' cách hỏi cũ được bỏ, ' + faq.updated + ' ô được cập nhật.');
    lines.push('Thông tin thêm: ' + facts.rows + ' dòng mới, ' + facts.updated + ' dòng được cập nhật.');
  } else {
    lines.push('Bảng đã giống dữ liệu trên trang (phiên bản ' + version + '), không có gì cần cập nhật.');
  }
  if (kept) lines.push(kept + ' ô nhân viên đã sửa được giữ nguyên; bản mới nằm trong ghi chú của ô (ô có tam giác nhỏ ở góc).');
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
    // The log is a convenience; the update itself is already written.
  }
}

// Enabled rows of the "Thông tin thêm" tab, or null while the tab does not exist (the prompt
// then uses the facts built into Knowledge.gs).
function knowledgeFacts_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(FACTS_CACHE_KEY);
  if (cached) return JSON.parse(cached);
  var sheet;
  try {
    sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FACTS_SHEET_NAME);
  } catch (err) {
    return null;
  }
  var facts = null;
  if (sheet) {
    facts = sheet.getDataRange().getValues().slice(1).map(function (cells) {
      return {
        id: String(cells[0] || '').trim(),
        text: syncText_(cells[1]).replace(/\s*\n\s*/g, ' '),
        on: !/^(không|khong|tắt|tat|no|false|0)$/i.test(String(cells[2] === undefined ? '' : cells[2]).trim())
      };
    }).filter(function (fact) { return fact.on && fact.text; }).map(function (fact) { return { id: fact.id, text: fact.text }; });
  }
  try {
    cache.put(FACTS_CACHE_KEY, JSON.stringify(facts), FAQ_CACHE_SECONDS);
  } catch (err) {
    // Too big for the cache: the tab is read on each question instead.
  }
  return facts;
}

function knowledgeClearCache_() {
  CacheService.getScriptCache().remove(FACTS_CACHE_KEY);
}
