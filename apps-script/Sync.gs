/**
 * Brings the FAQ tab and the "Thông tin thêm" tab up to date with the repository, so new data
 * needs no pasted code and no new deployment. Each deployment of the site publishes
 * assistant-data.json (built by tools/build-assistant-data.js from FaqSeed.gs and Knowledge.gs).
 * In the sheet, staff choose Trợ lý AI > Cập nhật dữ liệu từ trang web. For each row (by Mã):
 *   - a group, question, answer, date or fact is replaced only while the cell still holds what the
 *     last update brought in (on the first update: a text the repository ever wrote, from the hashes
 *     in the data file). A cell staff changed keeps their text; the new text goes into a block in
 *     the cell's note, between any notes staff wrote;
 *   - phrasings new in the repository are added, unless another active row with overlapping dates
 *     already has them (checked against the tab as this update leaves it); phrasings the repository
 *     dropped are removed; phrasings and rows staff deleted are not brought back;
 *   - rows the repository dropped are switched off ("Không" in Bật) once, while their answer is
 *     still the repository's text, and switched back on if the repository brings them back;
 *   - a row staff added keeps its Mã even when the repository later adds a row with the same Mã:
 *     that new row waits until staff rename theirs;
 *   - rows staff added, columns to the right and every other cell are left alone.
 * What the last update brought in is kept in the document properties (keys "sync:..."), saved only
 * after every cell is written, so an update that stops halfway is simply run again. A new or
 * emptied tab starts over from the repository's rows.
 */

var SYNC_DEFAULT_URL = 'https://thaingocthienlong.github.io/landing-page-01.27/assistant-data.json';
var SYNC_NOTE_PREFIX = 'Bản mới trên trang web';
var SYNC_NOTE_END = '(Hết ghi chú của menu cập nhật)';
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
    // Both headers are checked before either tab is created or written.
    var badHeader = syncHeaderProblem_(book.getSheetByName(FAQ_SHEET_NAME), SYNC_FAQ_HEADER_WORDS) ? FAQ_SHEET_NAME
      : syncHeaderProblem_(book.getSheetByName(FACTS_SHEET_NAME), SYNC_FACTS_HEADER_WORDS) ? FACTS_SHEET_NAME : '';
    if (badHeader) {
      return syncFail_(book, data.version, 'Hàng tiêu đề của tab "' + badHeader + '" đã bị đổi (đổi tên, thêm hoặc xóa cột) nên chưa cập nhật được. Bảng chưa thay đổi gì. Đưa các cột về như cũ, hoặc ' + SYNC_ASK_HELP);
    }
    var label = syncLabel_(data.version);
    var saved = {};
    var faq = syncTab_(book, syncSheet_(book, FAQ_SHEET_NAME, faqStartSheet_), data.faq, data.retiredFaq, props, saved, 'faq', label, {
      headers: FAQ_HEADERS,
      fields: [[1, 'group'], [2, 'question'], [4, 'answer'], [5, 'from'], [6, 'to']],
      main: [4, 'answer'], question: 2, variants: 3, from: 5, to: 6, on: 7,
      row: function (item) { return [item.id, item.group, item.question, '', item.answer, item.from || '', item.to || '', 'Có']; }
    });
    var facts = syncTab_(book, syncSheet_(book, FACTS_SHEET_NAME, factsStartSheet_), data.facts, data.retiredFacts, props, saved, 'fact', label, {
      headers: FACTS_HEADERS,
      fields: [[1, 'text']],
      main: [1, 'text'], on: 2,
      row: function (item) { return [item.id, item.text, 'Có']; }
    });
    // Saved last and in one call: an update that stops before this point left the old state, and
    // running it again finishes the job.
    SpreadsheetApp.flush();
    saved['sync:meta'] = JSON.stringify({ time: data.time || '', version: data.version });
    props.setProperties(saved);
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

// A missing or blank tab has no header to check: the update creates it.
function syncHeaderProblem_(sheet, words) {
  if (!sheet || sheet.getLastRow() === 0) return false;
  var row = sheet.getRange(1, 1, 1, words.length).getValues()[0];
  return words.some(function (word, i) { return syncFold_(row[i]).indexOf(word) === -1; });
}

function syncFold_(value) {
  return faqFold_(String(value || '').toLowerCase()).replace(/\s+/g, ' ').trim();
}

// Merges the repository's items into one tab; see the top of this file for the rules. The cells
// are written here; the state to remember goes into `saved`, which the caller stores at the end.
function syncTab_(book, sheet, items, retiredItems, props, saved, kind, label, spec) {
  var counts = { rows: 0, updated: 0, added: 0, removed: 0, off: 0, on: 0, kept: [], skipped: [], clashes: [], taken: [] };
  var tab = sheet.getName();
  var key = 'sync:' + kind + ':';
  var range = sheet.getDataRange();
  var values = range.getValues();
  var notes = range.getNotes();
  var cell = function (cells, col) { return cells && col < cells.length ? cells[col] : ''; };
  var zone = book.getSpreadsheetTimeZone();
  var day = function (value) { return faqDay_(value instanceof Date ? value : syncText_(value), zone); };
  var hashOf = function (value) { return syncHash_(syncText_(value)); };
  var at = {};
  values.forEach(function (cells, i) {
    var id = String(cell(cells, 0) || '').trim();
    if (i > 0 && id && !(id in at)) at[id] = i;
  });
  // A new or emptied tab starts over: what earlier updates brought in no longer describes it.
  var fresh = !Object.keys(at).length;
  var load = function (name, empty) { return (fresh ? null : JSON.parse(props.getProperty(key + name) || 'null')) || empty; };
  var lastIds = load('ids', null);
  var offIds = load('off', {});
  var nextIds = {};
  (lastIds || []).forEach(function (id) { nextIds[id] = true; });
  // The tab as this update leaves it: every decision below reads it, so a row switched off or a
  // date changed earlier in the same update counts.
  var live = values.map(function (cells) { return cells.slice(); });
  var writes = {};
  var put = function (i, col, value) {
    live[i][col] = value;
    if (i < values.length) writes[i + ',' + col] = { row: i, col: col, value: value };
  };
  var noteWrites = [];
  var noteOf = function (i, col) { return String(cell(notes[i], col) || ''); };

  var plan = items.map(function (item) {
    var i = at[item.id];
    var state = load('row:' + item.id, null);
    if (i === undefined) {
      // Brought in by an earlier update and no longer in the tab: staff deleted it, so it stays out.
      return { item: item, role: lastIds && lastIds.indexOf(item.id) !== -1 ? 'deleted' : 'new' };
    }
    // A Mã the repository never brought into this tab, on a row that is not the repository's
    // text: a row staff added themselves. It is not merged with the new repository row.
    var mainKnown = ((item.known && item.known[spec.main[1]]) || []).indexOf(hashOf(cell(values[i], spec.main[0]))) !== -1;
    if (lastIds && lastIds.indexOf(item.id) === -1 && !state && !mainKnown) {
      counts.taken.push(tab + ', dòng ' + (i + 1) + ' (Mã ' + item.id + ')');
      return { item: item, role: 'staff' };
    }
    return { item: item, role: 'row', i: i, state: state };
  });

  // 1. Each field of the rows already in the tab.
  plan.forEach(function (p) {
    if (p.role !== 'row') return;
    var item = p.item;
    var i = p.i;
    nextIds[item.id] = true;
    if (offIds[item.id]) {
      // The repository brought back a row it had dropped.
      if (offIds[item.id] === 'off' && !syncOn_(cell(live[i], spec.on))) {
        put(i, spec.on, 'Có');
        counts.on += 1;
      }
      syncNote_(noteWrites, i, 0, noteOf(i, 0), '');
      delete offIds[item.id];
    }
    spec.fields.forEach(function (pair) {
      var col = pair[0];
      var field = pair[1];
      var isDate = col === spec.from || col === spec.to;
      var current = isDate ? syncDayText_(cell(values[i], col), zone) : syncText_(cell(values[i], col));
      var wanted = syncText_(item[field]);
      if (current === wanted) {
        syncNote_(noteWrites, i, col, noteOf(i, col), '');
        return;
      }
      var unchanged = p.state && p.state.h && p.state.h[field] !== undefined
        ? p.state.h[field] === syncHash_(current)
        : ((item.known && item.known[field]) || []).indexOf(syncHash_(current)) !== -1;
      if (unchanged || syncPasted_(current) === wanted) {
        put(i, col, item[field] || '');
        counts.updated += 1;
        syncNote_(noteWrites, i, col, noteOf(i, col), '');
        return;
      }
      counts.kept.push(tab + ', dòng ' + (i + 1) + ' (' + item.id + '), cột ' + spec.headers[col]);
      syncNote_(noteWrites, i, col, noteOf(i, col), wanted
        ? SYNC_NOTE_PREFIX + ' (' + label + '). Ô này đã được sửa trong bảng nên được giữ nguyên. Muốn dùng bản mới, chép các dòng nằm giữa dòng này và dòng ' + SYNC_NOTE_END + ' vào ô:\n' + item[field] + '\n' + SYNC_NOTE_END
        : SYNC_NOTE_PREFIX + ' (' + label + ') để trống ô này. Ô này đã được sửa trong bảng nên được giữ nguyên. Muốn dùng bản mới, xóa chữ trong ô.\n' + SYNC_NOTE_END);
    });
  });

  // 2. Rows the repository dropped: switched off once, while their main text is the repository's.
  (retiredItems || []).forEach(function (old) {
    var i = at[old.id];
    if (i === undefined || offIds[old.id]) return;
    var known = (old.known && old.known[spec.main[1]]) || [];
    if (!syncOn_(cell(live[i], spec.on))) {
      offIds[old.id] = 'off';
    } else if (known.indexOf(hashOf(cell(live[i], spec.main[0]))) !== -1) {
      put(i, spec.on, 'Không');
      counts.off += 1;
      offIds[old.id] = 'off';
    } else {
      counts.kept.push(tab + ', dòng ' + (i + 1) + ' (' + old.id + '): trang web đã bỏ dòng này');
      syncNote_(noteWrites, i, 0, noteOf(i, 0), SYNC_NOTE_PREFIX + ' (' + label + ') đã bỏ dòng này. Dòng đã được sửa trong bảng nên vẫn để bật; nếu không cần nữa, ghi Không ở cột Bật.\n' + SYNC_NOTE_END);
      offIds[old.id] = 'kept';
    }
  });

  // Phrasings (and questions) by matcher words, for the "already on another active row" check.
  var index = {};
  var listed = function (line, i) {
    if (!String(line || '').trim()) return;
    var words = syncWords_(line);
    (index[words] = index[words] || []).push(i);
  };
  var windowOf = function (cells) { return { from: day(cell(cells, spec.from)), to: day(cell(cells, spec.to)) }; };
  var overlaps = function (a, b) { return (!a.from || !b.to || a.from <= b.to) && (!b.from || !a.to || b.from <= a.to); };
  var elsewhere = function (words, i) {
    var window = windowOf(live[i]);
    return (index[words] || []).some(function (j) {
      return j !== i && syncOn_(cell(live[j], spec.on)) && overlaps(window, windowOf(live[j]));
    });
  };
  // Phrasings the repository dropped from each row (since the last update or, on the first
  // update, ever), left out of the index first so a phrasing moved to another row is no duplicate.
  var dropped = {};
  if (spec.variants !== undefined) {
    plan.forEach(function (p) {
      if (p.role !== 'row') return;
      var repoKeys = p.item.variants.map(syncWords_);
      var gone = dropped[p.i] = {};
      if (p.state && p.state.v) p.state.v.forEach(function (words) { if (repoKeys.indexOf(words) === -1) gone[words] = true; });
      else (p.item.retired || []).forEach(function (line) { gone[syncWords_(line)] = true; });
    });
    live.forEach(function (cells, i) {
      if (i === 0) return;
      listed(cell(cells, spec.question), i);
      String(cell(cells, spec.variants) || '').split(/\r?\n/).forEach(function (line) {
        if (!(dropped[i] && dropped[i][syncWords_(line)])) listed(line, i);
      });
    });
  }

  // 3. New rows, added at the end of the tab. A question cannot be left out like a phrasing, so a
  // clash with another active row is reported for staff to choose which row stays on.
  plan.forEach(function (p) {
    if (p.role !== 'new') return;
    p.i = live.length;
    live.push(spec.row(p.item));
    nextIds[p.item.id] = true;
    counts.rows += 1;
    if (spec.variants === undefined) return;
    if (elsewhere(syncWords_(p.item.question), p.i)) counts.clashes.push('dòng mới ' + p.item.id + ' ("' + p.item.question + '")');
    listed(p.item.question, p.i);
  });

  // 4. Phrasings, against the tab as steps 1 to 3 left it.
  if (spec.variants !== undefined) {
    plan.forEach(function (p) {
      if (p.role !== 'row' && p.role !== 'new') return;
      var col = spec.variants;
      var before = p.role === 'new' ? [] : String(cell(values[p.i], col) || '').split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
      var gone = dropped[p.i] || {};
      var keep = before.filter(function (line) { return !gone[syncWords_(line)]; });
      var removed = before.length - keep.length;
      var onRow = {};
      [cell(live[p.i], spec.question)].concat(keep).forEach(function (line) { onRow[syncWords_(line)] = true; });
      var earlier = (p.state && p.state.v) || [];
      var added = 0;
      p.item.variants.forEach(function (line) {
        var words = syncWords_(line);
        // On the row already, or brought in by an earlier update and since removed by staff. A new
        // row takes every phrasing, so it reads exactly like the row setupFaq would write.
        if (p.role !== 'new' && (onRow[words] || earlier.indexOf(words) !== -1)) return;
        if (elsewhere(words, p.i)) {
          counts.skipped.push('"' + line + '" (' + (p.role === 'new' ? 'dòng mới ' : '') + p.item.id + ')');
          return;
        }
        onRow[words] = true;
        listed(line, p.i);
        keep.push(line);
        added += 1;
      });
      if (p.role === 'new') {
        live[p.i][col] = keep.join('\n');
      } else if (removed || added) {
        counts.removed += removed;
        counts.added += added;
        put(p.i, col, keep.join('\n'));
      }
      // Remembered: the repository's phrasings on the row now, and those staff removed earlier. A
      // phrasing skipped as a duplicate is not, so it arrives once the other row is switched off.
      p.v = p.item.variants.map(syncWords_).filter(function (words) { return onRow[words] || earlier.indexOf(words) !== -1; });
    });
  }

  syncWrite_(sheet, Object.keys(writes).map(function (k) { return writes[k]; }), live.slice(values.length), spec.headers.length);
  noteWrites.forEach(function (change) {
    var target = sheet.getRange(change.row + 1, change.col + 1);
    if (change.note) target.setNote(change.note);
    else target.clearNote();
  });

  plan.forEach(function (p) {
    if (p.role !== 'row' && p.role !== 'new') return;
    var next = { h: {} };
    spec.fields.forEach(function (pair) { next.h[pair[1]] = hashOf(p.item[pair[1]]); });
    if (p.v) next.v = p.v;
    saved[key + 'row:' + p.item.id] = JSON.stringify(next);
  });
  saved[key + 'ids'] = JSON.stringify(Object.keys(nextIds));
  saved[key + 'off'] = JSON.stringify(offIds);
  return counts;
}

// The new text when staff pasted a whole note block into the cell ('' for a block that empties
// the cell), null otherwise.
function syncPasted_(current) {
  if (current.indexOf(SYNC_NOTE_PREFIX) !== 0 || current.indexOf('\n') === -1) return null;
  var body = current.slice(current.indexOf('\n') + 1);
  if (body.slice(-SYNC_NOTE_END.length) === SYNC_NOTE_END) body = body.slice(0, -SYNC_NOTE_END.length);
  return syncText_(body);
}

// Only the menu's own block of a note, from its first line to its closing line, is replaced or
// removed; what staff wrote above or below it stays. The closing line counts only on a line of its
// own, since the block's first line names it.
function syncNote_(noteWrites, row, col, note, block) {
  var start = note.indexOf(SYNC_NOTE_PREFIX);
  var end = start === -1 ? -1 : note.indexOf('\n' + SYNC_NOTE_END, start);
  var above = (start === -1 ? note : note.slice(0, start)).replace(/\s+$/, '');
  var below = end === -1 ? '' : note.slice(end + 1 + SYNC_NOTE_END.length).replace(/^\s+/, '');
  var next = [above, block, below].filter(Boolean).join('\n\n');
  if (next !== note) noteWrites.push({ row: row, col: col, note: next });
}

// Writes only the changed cells (neighbouring cells of a row at once), then appends new rows. The
// cells written are formatted as plain text first, so Sheets stores each value as typed: no
// formula, number or date is read into it.
function syncWrite_(sheet, writes, appends, width) {
  var cells = writes.slice().sort(function (a, b) { return a.row - b.row || a.col - b.col; });
  for (var k = 0; k < cells.length;) {
    var run = [cells[k]];
    while (k + run.length < cells.length && cells[k + run.length].row === run[0].row && cells[k + run.length].col === run[run.length - 1].col + 1) {
      run.push(cells[k + run.length]);
    }
    sheet.getRange(run[0].row + 1, run[0].col + 1, 1, run.length).setNumberFormat('@')
      .setValues([run.map(function (w) { return w.value; })]);
    k += run.length;
  }
  if (!appends.length) return;
  var rows = appends.map(function (cells) { return cells.slice(0, width); });
  var start = sheet.getLastRow() + 1;
  var missing = start + rows.length - 1 - sheet.getMaxRows();
  if (missing > 0) sheet.insertRowsAfter(sheet.getMaxRows(), missing);
  sheet.getRange(start, 1, rows.length, width).setNumberFormat('@').setValues(rows);
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

// A date cell as dd/mm/yyyy text; an apostrophe typed into a plain-text cell is not part of it.
function syncDayText_(value, zone) {
  if (value instanceof Date && !isNaN(value)) return Utilities.formatDate(value, zone, 'dd/MM/yyyy');
  return syncText_(value).replace(/^'/, '');
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
  var changed = faq.rows + faq.updated + faq.added + faq.removed + faq.off + faq.on + facts.rows + facts.updated + facts.off + facts.on;
  var turned = function (counts) {
    return (counts.off ? ', ' + counts.off + ' dòng trang web đã bỏ được tắt' : '') + (counts.on ? ', ' + counts.on + ' dòng trang web dùng lại được bật lại' : '');
  };
  var lines = [];
  if (changed) {
    lines.push('Đã cập nhật từ trang web (' + label + ').');
    lines.push('FAQ: ' + faq.rows + ' dòng mới, ' + faq.added + ' cách hỏi mới, ' + faq.removed + ' cách hỏi cũ được bỏ, ' + faq.updated + ' ô được cập nhật' + turned(faq) + '.');
    lines.push('Thông tin thêm: ' + facts.rows + ' dòng mới, ' + facts.updated + ' dòng được cập nhật' + turned(facts) + '.');
  } else {
    lines.push('Không có gì mới từ trang web (' + label + ').');
  }
  var taken = faq.taken.concat(facts.taken);
  if (taken.length) {
    lines.push('Chưa thêm ' + taken.length + ' dòng mới của trang web vì Mã của dòng đó trùng với một dòng do Viện tự thêm. Đổi Mã của dòng trong bảng (ví dụ thêm chữ -vien) rồi chọn lại menu:');
    taken.forEach(function (where) { lines.push('- ' + where); });
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
    lines.push('Không thêm ' + faq.skipped.length + ' cách hỏi vì một dòng khác đang bật đã có (sẽ được thêm khi dòng kia tắt hoặc bỏ cách hỏi đó):');
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

// Enabled rows of the "Thông tin thêm" tab, or null while the tab does not exist, has no rows yet
// or cannot be read; the prompt then uses the facts built into Knowledge.gs.
function knowledgeFacts_() {
  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get(FACTS_CACHE_KEY);
    if (cached) return JSON.parse(cached);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FACTS_SHEET_NAME);
    var rows = sheet ? sheet.getDataRange().getValues().slice(1).map(function (cells) {
      return { id: String(cells[0] || '').trim(), text: syncText_(cells[1]).replace(/\s*\n\s*/g, ' '), on: syncOn_(cells[2]) };
    }).filter(function (fact) { return fact.text; }) : [];
    var facts = rows.length ? rows.filter(function (fact) { return fact.on; }).map(function (fact) { return { id: fact.id, text: fact.text }; }) : null;
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
