var LEDGER_STATUSES = ['Mới', 'Đã liên hệ', 'Chờ CK', 'Đã đóng', 'Hủy'];
var LEDGER_FORMATS = ['Trực tiếp', 'Online'];

var LEDGER_INTAKES = {
  name: 'Đợt học',
  headers: ['Mã đợt', 'Tên chuỗi', 'Tiền tố mã', 'Hạn ưu đãi', 'Hạn chót', 'Ngày khai giảng', 'Mở đăng ký'],
  seed: [['R27', 'Phân tích định lượng với R', 'R27-', '08/12/2026', '28/12/2026', '08/01/2027', 'Có']]
};

var LEDGER_PACKAGES = {
  name: 'Gói',
  headers: ['Mã đợt', 'Gói', 'Các khóa', 'Học phí gốc'],
  seed: [
    ['R27', 'Gói 1', 'K1, K2, K3', '8800000'],
    ['R27', 'Gói 2', 'K1, K2', '6700000'],
    ['R27', 'Gói 3', 'K1, K3', '7500000'],
    ['R27', 'Gói 4', 'K2, K3', '6700000'],
    ['R27', 'Gói 5', 'K2', '3500000'],
    ['R27', 'Gói 6', 'K3', '4500000']
  ]
};

var LEDGER_JOURNAL = {
  name: 'Nhật ký',
  headers: ['Id', 'Thời gian', 'Mã học viên', 'Sự kiện', 'Chi tiết']
};

function setupLedger() {
  var sheet = getSheet_();
  var current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0].map(clean_);
  // Check every header before writing anything, so a refusal leaves the sheet as it was.
  current.forEach(function (name, i) {
    if (name && name !== HEADERS[i]) {
      throw new Error('Cột ' + (i + 1) + ' của tab "' + SHEET_NAME + '" đang là "' + name + '", cần là "' + HEADERS[i] + '". Không ghi đè.');
    }
  });
  var added = 0;
  current.forEach(function (name, i) {
    if (!name) {
      sheet.getRange(1, i + 1).setValue(HEADERS[i]);
      added++;
    }
  });
  ledgerHeader_(sheet, HEADERS.length);
  sheet.getRange(2, 1, sheet.getMaxRows() - 1, HEADERS.length).setNumberFormat('@');

  [['Trạng thái', LEDGER_STATUSES], ['Hình thức', LEDGER_FORMATS]].forEach(function (pick) {
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(pick[1], true).setAllowInvalid(false).build();
    sheet.getRange(2, ledgerCol_(pick[0]), sheet.getMaxRows() - 1, 1).setDataValidation(rule);
  });

  var made = [LEDGER_INTAKES, LEDGER_PACKAGES, LEDGER_JOURNAL].filter(function (def) { return ledgerTab_(def); })
    .map(function (def) { return def.name; });
  return 'Sổ học viên: thêm ' + added + ' cột vào "' + SHEET_NAME + '"; tab mới: ' + (made.join(', ') || 'không có') + '.';
}

// Returns true when it filled an empty tab; a tab that already has rows is left alone.
function ledgerTab_(def) {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(def.name) || book.insertSheet(def.name);
  if (sheet.getLastRow() > 0) return false;
  var width = def.headers.length;
  var rows = [def.headers].concat(def.seed || []);
  // Text format keeps a typed 08/12/2026 or 8800000 from turning into a date or number cell.
  if (def.seed) sheet.getRange(1, 1, sheet.getMaxRows(), width).setNumberFormat('@');
  sheet.getRange(1, 1, rows.length, width).setValues(rows);
  ledgerHeader_(sheet, width);
  if (def === LEDGER_JOURNAL) sheet.protect().setWarningOnly(true);
  return true;
}

function ledgerHeader_(sheet, width) {
  sheet.getRange(1, 1, 1, width).setFontWeight('bold').setBackground('#0a3d91').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
}

// Null (never a throw) while the tab is missing or empty, so a sheet that is not migrated yet keeps registering.
function ledgerIntake_(dot) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LEDGER_INTAKES.name);
  if (!sheet || sheet.getLastRow() < 2) return null;
  // Sheets turns a typed date into a Date value unless the cell is text.
  var text = function (v) {
    return Object.prototype.toString.call(v) === '[object Date]' ? Utilities.formatDate(v, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy') : clean_(v);
  };
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, LEDGER_INTAKES.headers.length).getValues()
    .map(function (r) { return r.map(text); })
    .filter(function (r) { return r[0]; });
  var want = clean_(dot).toUpperCase();
  var found = rows.filter(function (r) { return r[0].toUpperCase() === want; })[0];
  if (!found) {
    var open = rows.filter(function (r) { return r[6].toLowerCase() === 'có'; });
    if (open.length !== 1) return null;
    found = open[0];
  }
  return { dot: found[0], name: found[1], prefix: found[2], earlyDeadline: found[3], deadline: found[4], start: found[5] };
}

// Counts codes staff typed by hand too, so a new code never repeats one in the sheet.
function nextLearnerCode_(codes, prefix) {
  var head = prefix.toUpperCase();
  var max = 0;
  codes.forEach(function (code) {
    var c = String(code).trim().toUpperCase();
    var tail = c.slice(head.length);
    if (c.indexOf(head) === 0 && /^\d+$/.test(tail)) max = Math.max(max, Number(tail));
  });
  var next = String(max + 1);
  while (next.length < 3) next = '0' + next;
  return prefix + next;
}

function channelFromPage_(page) {
  var found = /[?&]utm_source=([^&#]*)/i.exec(clean_(page));
  if (!found) return '';
  var value = found[1];
  try { value = decodeURIComponent(value.replace(/\+/g, ' ')); } catch (err) {}
  return value.trim().toLowerCase().slice(0, 50);
}

function transferNote_(code, packageId) {
  var digits = String(packageId || '').replace(/\D/g, '');
  return digits ? code + ' GOI' + digits : code;
}

// Staff type amounts as 6.700.000, 6,700,000 or 6.700.000 đ; under 1000 is not a fee.
function parseAmount_(value) {
  var n = Number(clean_(value).replace(/\D/g, ''));
  return n < 1000 ? 0 : n;
}

// The caller holds the script lock, so reading the last Id and appending cannot race.
function journal_(code, event, detail) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LEDGER_JOURNAL.name);
  if (!sheet) return 0;
  var last = sheet.getLastRow();
  // The header row and any stray text count as 0.
  var id = (last > 0 ? Number(sheet.getRange(last, 1).getValue()) || 0 : 0) + 1;
  var row = [id, Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss'), clean_(code), clean_(event), clean_(detail)];
  sheet.getRange(last + 1, 2, 1, 4).setNumberFormat('@');
  sheet.getRange(last + 1, 1, 1, 5).setValues([row]);
  return id;
}

function ledgerRow_(sheet, rowIndex) {
  var values = sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0];
  var row = {};
  HEADERS.forEach(function (name, i) { row[name] = values[i]; });
  return row;
}

function ledgerCol_(header) {
  return HEADERS.indexOf(header) + 1;
}
