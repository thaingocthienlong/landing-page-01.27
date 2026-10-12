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

// Staff type 6.700.000, 6,700,000 or 6.700.000 đ; a 1-2 digit decimal tail is dropped, and under 1000 or over 100 million (a phone number) is invalid.
function parseAmount_(value) {
  var n = Number(clean_(value).replace(/[.,]\d{1,2}(?!\d)\D*$/, '').replace(/\D/g, ''));
  return n < 1000 || n > 1e8 ? 0 : n;
}

// The caller holds the script lock, so reading the last Id and appending cannot race.
function journal_(code, event, detail) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LEDGER_JOURNAL.name);
  if (!sheet) return 0;
  var last = sheet.getLastRow();
  // The header row and any stray text count as 0.
  var id = (last > 0 ? Number(sheet.getRange(last, 1).getValue()) || 0 : 0) + 1;
  var row = [id, Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss'), clean_(code), clean_(event), clean_(detail)];
  // A new tab has 1000 rows; writing past the grid throws, and the registration row is already saved by then.
  if (last + 1 > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), 1);
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

var LEDGER_FLAG = '#f8d7da';
var LEDGER_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function ledgerNow_(format) {
  return Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', format);
}

// The email or the stamp is already done by then, so a journal failure must not undo or repeat it.
function ledgerNote_(code, event, detail) {
  try { journal_(code, event, detail); } catch (ignore) {}
}

function ledgerTell_(message) {
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (err) {
    Logger.log(message);
  }
}

// Text format keeps a stamped date or a code from turning into a date or number cell.
function ledgerPut_(sheet, rowIndex, header, text) {
  sheet.getRange(rowIndex, ledgerCol_(header)).setNumberFormat('@').setValue(text);
}

// Only a cell this code flagged is cleared, so a note or colour staff added stays.
function ledgerFlag_(sheet, rowIndex, header, text) {
  var cell = sheet.getRange(rowIndex, ledgerCol_(header));
  if (text) cell.setBackground(LEDGER_FLAG).setNote(text);
  else if (cell.getBackground() === LEDGER_FLAG) cell.setBackground(null).clearNote();
}

// The simple onEdit in Faq.gs cannot send mail, so this one is an installable trigger. It never throws at whoever is editing.
function onLedgerEdit(e) {
  try {
    var range = e && e.range;
    var status = ledgerCol_('Trạng thái');
    if (!range || range.getSheet().getName() !== SHEET_NAME) return;
    if (status < range.getColumn() || status >= range.getColumn() + range.getNumColumns()) return;
    var first = Math.max(range.getRow(), 2);
    var count = range.getRow() + range.getNumRows() - first;
    if (count < 1) return;
    var sheet = range.getSheet();
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      sheet.getRange(first, status, count, 1).getValues().forEach(function (v, i) {
        ledgerStatusChanged_(sheet, first + i, clean_(v[0]));
      });
    } finally {
      try { lock.releaseLock(); } catch (ignore) {}
    }
  } catch (err) {
    Logger.log('onLedgerEdit: ' + err);
  }
}

function ledgerStatusChanged_(sheet, rowIndex, status) {
  if (!status) return;
  var r = ledgerRow_(sheet, rowIndex);
  if (status === 'Đã đóng') {
    // The date doubles as "already recorded", so a second Đã đóng on the row adds nothing.
    if (clean_(r['Ngày đóng'])) return;
    ledgerPut_(sheet, rowIndex, 'Ngày đóng', ledgerNow_('dd/MM/yyyy'));
  }
  ledgerNote_(clean_(r['Mã học viên']), 'đổi trạng thái', status);
  if (status === 'Chờ CK' && !clean_(r['Email CK đã gửi'])) ledgerSendPayment_(sheet, rowIndex, r);
}

// Returns true when the email went out. Bad data and a failed send are flagged on the row and journaled, never thrown.
function ledgerSendPayment_(sheet, rowIndex, r) {
  var code = clean_(r['Mã học viên']);
  var amount = parseAmount_(r['Số tiền phải đóng']);
  var checks = [
    ['Mã học viên', code, 'Thiếu Mã học viên. Dùng menu Sổ học viên > Cấp mã cho dòng chưa có mã, rồi Gửi lại email CK.'],
    ['Email', LEDGER_EMAIL.test(clean_(r['Email'])), 'Email không hợp lệ. Sửa xong, dùng menu Sổ học viên > Gửi lại email CK.'],
    ['Số tiền phải đóng', amount, 'Thiếu hoặc sai Số tiền phải đóng (ví dụ 6.700.000). Sửa xong, dùng menu Sổ học viên > Gửi lại email CK.']
  ];
  var ready = true;
  checks.forEach(function (check) {
    ledgerFlag_(sheet, rowIndex, check[0], check[1] ? '' : check[2]);
    if (!check[1]) ready = false;
  });
  if (!ready) return false;
  try {
    sendPaymentEmail_(r, ledgerIntake_(clean_(r['Đợt'])) || {});
  } catch (err) {
    var why = String((err && err.message) || err).slice(0, 200);
    ledgerFlag_(sheet, rowIndex, 'Email CK đã gửi', 'Chưa gửi được email: ' + why + ' Dùng menu Sổ học viên > Gửi lại email CK để thử lại.');
    ledgerNote_(code, 'lỗi email', 'email CK: ' + why);
    return false;
  }
  ledgerPut_(sheet, rowIndex, 'Email CK đã gửi', ledgerNow_('dd/MM/yyyy HH:mm:ss'));
  ledgerFlag_(sheet, rowIndex, 'Email CK đã gửi', '');
  ledgerNote_(code, 'email CK', amount);
  return true;
}

function installLedgerTrigger() {
  var have = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'onLedgerEdit'; });
  if (!have) ScriptApp.newTrigger('onLedgerEdit').forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet()).onEdit().create();
  ledgerTell_(have ? 'Gửi email tự động đã bật từ trước.' : 'Đã bật. Từ giờ chọn Chờ CK ở cột Trạng thái là học viên nhận email chuyển khoản.');
}

// Never journals: rows typed before the ledger existed must not look like new registrations to the staff feed.
function assignMissingCodes() {
  var sheet = getSheet_();
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  var done = 0;
  var skipped = 0;
  try {
    var last = sheet.getLastRow();
    var rows = last > 1 ? sheet.getRange(2, 1, last - 1, HEADERS.length).getValues() : [];
    var taken = rows.map(function (v) { return v[ledgerCol_('Mã học viên') - 1]; });
    var intakes = {};
    rows.forEach(function (v, i) {
      var at = function (header) { return clean_(v[ledgerCol_(header) - 1]); };
      if (at('Mã học viên')) return;
      var dot = at('Đợt');
      if (intakes[dot] === undefined) intakes[dot] = ledgerIntake_(dot);
      var intake = intakes[dot];
      if (!(at('Họ và chữ lót') || at('Tên')) || !intake || !intake.prefix) {
        skipped++;
        return;
      }
      var code = nextLearnerCode_(taken, intake.prefix);
      taken.push(code);
      ledgerPut_(sheet, i + 2, 'Mã học viên', code);
      if (!dot) ledgerPut_(sheet, i + 2, 'Đợt', intake.dot);
      var channel = at('Kênh') ? '' : channelFromPage_(at('Trang gửi'));
      if (channel) ledgerPut_(sheet, i + 2, 'Kênh', channel);
      done++;
    });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
  ledgerTell_('Đã cấp mã cho ' + done + ' dòng.' + (skipped ? ' Bỏ qua ' + skipped + ' dòng chưa có họ tên hoặc chưa xác định được đợt.' : ''));
  return done;
}

// Rows outside Chờ CK are skipped: no payment detail may reach a learner before staff move the row there.
function resendPaymentEmail() {
  var app = SpreadsheetApp.getUi();
  var range = SpreadsheetApp.getActiveRange();
  var sheet = range && range.getSheet();
  var first = range ? Math.max(range.getRow(), 2) : 0;
  var last = range ? Math.min(range.getRow() + range.getNumRows() - 1, sheet.getLastRow()) : 0;
  if (!sheet || sheet.getName() !== SHEET_NAME || last < first) {
    app.alert('Chọn các dòng học viên trong tab "' + SHEET_NAME + '" rồi chạy lại.');
    return;
  }
  var ask = 'Gửi lại email chuyển khoản cho ' + (last - first + 1) + ' dòng đang chọn? Học viên sẽ nhận email lần nữa.';
  if (app.alert(ask, app.ButtonSet.YES_NO) !== app.Button.YES) return;
  var sent = 0;
  var skipped = 0;
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    for (var row = first; row <= last; row++) {
      var r = ledgerRow_(sheet, row);
      if (clean_(r['Trạng thái']) !== 'Chờ CK') skipped++;
      else if (ledgerSendPayment_(sheet, row, r)) sent++;
    }
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
  var failed = last - first + 1 - sent - skipped;
  app.alert('Đã gửi ' + sent + ' email.' + (skipped ? ' Bỏ qua ' + skipped + ' dòng không ở trạng thái Chờ CK.' : '') +
    (failed ? ' ' + failed + ' dòng chưa gửi được, xem ô tô đỏ.' : ''));
}

function ledgerMenu_(ui) {
  ui.createMenu('Sổ học viên')
    .addItem('Cấp mã cho dòng chưa có mã', 'assignMissingCodes')
    .addItem('Gửi lại email CK (dòng đang chọn)', 'resendPaymentEmail')
    .addItem('Bật gửi email tự động', 'installLedgerTrigger')
    .addItem('Cài đặt Sổ học viên', 'setupLedger')
    .addToUi();
}
