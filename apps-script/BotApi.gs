// Read-only endpoint for the chat bot: {"action": "feed", "key": <BOT_KEY property>, "after": <last Id seen>}.
var BOT_FEED_PAGE = 50;

function handleBotApi_(data) {
  try {
    if (!botKeyOk_(data.key)) return json_({ ok: false, error: 'unauthorized' });
    if (data.action === 'feed') return json_(botFeed_(data.after));
    return json_({ ok: false, error: 'bad-request' });
  } catch (err) {
    // The message could quote a learner's row, so the caller only learns that it failed.
    return json_({ ok: false, error: 'server' });
  }
}

// An unset or empty BOT_KEY refuses everyone, so a missing property never leaves the feed open.
function botKeyOk_(key) {
  var want = PropertiesService.getScriptProperties().getProperty('BOT_KEY');
  return typeof key === 'string' && !!want && key === want;
}

// A journal Id may be a number or its text; the header and stray text give -1.
function botId_(value) {
  var text = String(value).trim();
  return /^\d+$/.test(text) ? Number(text) : -1;
}

// Row values by upper-cased code from one read of the tab, so a long page costs one read and not one per event.
function botLearners_() {
  var found = Object.create(null);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var size = sheet ? sheet.getLastRow() - 1 : 0;
  if (size < 1) return found;
  var col = ledgerCol_('Mã học viên') - 1;
  sheet.getRange(2, 1, size, HEADERS.length).getValues().forEach(function (v) {
    var code = clean_(v[col]).toUpperCase();
    if (code && !(code in found)) found[code] = v;
  });
  return found;
}

function botEvent_(type, id, entry, learner) {
  var at = function (header) { return clean_(learner[ledgerCol_(header) - 1]); };
  var event = { id: id, time: clean_(entry[1]), type: type, code: clean_(entry[2]), name: [at('Họ và chữ lót'), at('Tên')].filter(Boolean).join(' ') };
  if (type === 'registered') {
    event.dot = at('Đợt');
    event.package = at('Mã gói');
    event.phone = at('Số điện thoại');
    event.channel = at('Kênh');
  }
  return event;
}

// Never writes and never takes the script lock, so a poll cannot hold up a registration.
function botFeed_(after) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LEDGER_JOURNAL.name);
  var size = sheet ? sheet.getLastRow() - 1 : 0;
  var rows = [];
  // shortcut: reads the whole journal on every poll, fine for a few thousand rows; then read only the Id column and the rows after the cursor.
  if (size > 0) {
    sheet.getRange(2, 1, size, LEDGER_JOURNAL.headers.length).getValues().forEach(function (v, i) {
      var id = botId_(v[0]);
      if (id >= 0) rows.push({ id: id, at: i, v: v });
    });
  }
  // Sorted so a page never skips a row, even if staff sorted the tab.
  rows.sort(function (a, b) { return a.id - b.id || a.at - b.at; });
  var feed = { ok: true, last: rows.length ? rows[rows.length - 1].id : 0, events: [] };
  // Only a JSON number from 0 up is a cursor: Number(null) is 0 and would replay the whole journal.
  if (typeof after !== 'number' || !(after >= 0)) return feed;

  var learners = null;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].id <= after) continue;
    var v = rows[i].v;
    var kind = clean_(v[3]);
    var type = kind === 'đăng ký' ? 'registered' : (kind === 'đổi trạng thái' && clean_(v[4]) === 'Đã đóng' ? 'paid' : '');
    var code = clean_(v[2]);
    if (type && code) {
      learners = learners || botLearners_();
      var learner = learners[code.toUpperCase()];
      // A learner row staff deleted or retyped leaves no event, but the cursor still moves past it.
      if (learner) feed.events.push(botEvent_(type, rows[i].id, v, learner));
    }
    if (feed.events.length === BOT_FEED_PAGE) {
      feed.last = rows[i].id;
      break;
    }
  }
  return feed;
}
