// Pushes the .gs files of apps-script/ to the Institute's Apps Script project with clasp, in
// place of pasting them by hand. Run on a computer where `clasp login` was done with the Google
// account that owns the project (setup: apps-script/README.md, "Pushing with clasp"):
//
//     node tools/gas-push.js            compare the project with the repository, then push
//     node tools/gas-push.js --dry      compare only
//     node tools/gas-push.js --add      also allow files the project does not have yet
//     node tools/gas-push.js --deploy   after the push, point the web app at a new version
//
// A clasp push replaces the whole project: a file the push does not carry is deleted there, and
// every file it carries is added. So this script first reads what the project holds and stops
// when a push would delete a file, or add one nobody asked for. The files it carries are the
// ones .claspignore lets through.

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
// Pinned: where clasp looks for .claspignore changed between its versions, and without that
// file it pushes the test harnesses too.
const CLASP = process.env.CLASP_BIN ? [process.env.CLASP_BIN] : ["npx", "--yes", "@google/clasp@3.4.1"];
// The web app's deployment: the id in the /exec URL of dist/index.html. Updating it keeps the URL.
const DEPLOYMENT = "AKfycbxRin0oSmu7fJkn72dHSI9_Dee8zJvNcraqm9M-SekGBjNpNKxHgPtz-JqHpXvlEmF7-w";
const MANIFEST = "appsscript";

// What a file is compared by: its text without line-ending noise; the manifest by its values.
const sorted = (value) => (Array.isArray(value) ? value.map(sorted)
  : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sorted(value[key])])) : value);
const canon = (name, text) => (name === MANIFEST ? JSON.stringify(sorted(JSON.parse(text))) : text.replace(/\r\n?/g, "\n").trimEnd());

// What a push would do. local and remote map a file's name in the project (its path under
// apps-script/ without the extension) to its text.
function plan(local, remote) {
  const names = Object.keys(local);
  return {
    removed: Object.keys(remote).filter((name) => !(name in local)).sort(),
    added: names.filter((name) => !(name in remote)).sort(),
    changed: names.filter((name) => name in remote && canon(name, local[name]) !== canon(name, remote[name])).sort(),
  };
}

function selfTest() {
  const remote = { Code: "a\r\nb\r\n", Chat: "old", Ledger: "x", [MANIFEST]: '{"timeZone":"Asia/Ho_Chi_Minh","webapp":{"access":"ANYONE","executeAs":"USER_DEPLOYING"}}' };
  const local = { Code: "a\nb", Chat: "new", Stats: "y", [MANIFEST]: '{\n  "webapp": { "executeAs": "USER_DEPLOYING", "access": "ANYONE" },\n  "timeZone": "Asia/Ho_Chi_Minh"\n}\n' };
  assert.deepStrictEqual(plan(local, remote), { removed: ["Ledger"], added: ["Stats"], changed: ["Chat"] });
  assert.deepStrictEqual(plan(remote, remote), { removed: [], added: [], changed: [] });
  assert.deepStrictEqual(plan({ ...local, [MANIFEST]: '{"timeZone":"Asia/Bangkok"}' }, remote).changed, ["Chat", MANIFEST]);
  console.log("gas-push self-test: all passed");
}

// Thrown rather than exited on, so the scratch copy of the project is always removed.
const fail = (message) => { throw new Error(message); };

function clasp(args, cwd, show) {
  const run = spawnSync(CLASP[0], [...CLASP.slice(1), ...args], { cwd, encoding: "utf8", shell: process.platform === "win32", stdio: show ? "inherit" : "pipe" });
  if (run.error || run.status !== 0) {
    fail("lệnh clasp " + args.join(" ") + " không chạy được.\n" + (run.error ? String(run.error) : (run.stderr || "") + (run.stdout || ""))
      + "\nNếu chưa đăng nhập: npx @google/clasp@3.4.1 login, và bật Apps Script API tại https://script.google.com/home/usersettings");
  }
  return run.stdout || "";
}

// The project's files, read into a scratch folder so nothing in the repository is overwritten.
function readRemote(scriptId) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gas-push-"));
  try {
    fs.writeFileSync(path.join(dir, ".clasp.json"), JSON.stringify({ scriptId, rootDir: "." }));
    clasp(["pull"], dir);
    const files = {};
    const walk = (folder) => fs.readdirSync(folder, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(folder, entry.name);
      if (entry.isDirectory()) return walk(full);
      if (entry.name === ".clasp.json") return;
      const name = path.relative(dir, full).split(path.sep).join("/").replace(/\.[^./]+$/, "");
      files[name] = fs.readFileSync(full, "utf8");
    });
    walk(dir);
    return files;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// The files clasp would push from here, as clasp itself lists them.
function readLocal(rootDir) {
  const out = clasp(["status", "--json"], root);
  const status = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1));
  const files = {};
  status.filesToPush.forEach((file) => {
    const name = path.relative(path.join(root, rootDir), path.resolve(root, file)).split(path.sep).join("/").replace(/\.[^./]+$/, "");
    files[name] = fs.readFileSync(path.resolve(root, file), "utf8");
  });
  return files;
}

async function main() {
  const flags = process.argv.slice(2);
  const unknown = flags.filter((flag) => !["--dry", "--add", "--deploy"].includes(flag));
  if (unknown.length) fail("không hiểu tham số " + unknown.join(" ") + ". Dùng: --dry, --add, --deploy.");
  const project = JSON.parse(fs.readFileSync(path.join(root, ".clasp.json"), "utf8"));
  const manifestPath = path.join(root, project.rootDir, MANIFEST + ".json");

  console.log("Đọc dự án Apps Script " + project.scriptId + " ...");
  const remote = readRemote(project.scriptId);
  if (!remote[MANIFEST]) fail("không đọc được tệp appsscript.json của dự án.");
  // First run: the manifest (time zone, scopes, who the web app runs as) comes from the project.
  if (!fs.existsSync(manifestPath)) {
    fs.writeFileSync(manifestPath, remote[MANIFEST].trimEnd() + "\n");
    console.log("Đã chép appsscript.json của dự án vào " + path.relative(root, manifestPath) + ". Hãy commit tệp này.");
  }
  const local = readLocal(project.rootDir);
  const todo = plan(local, remote);
  const list = (names) => names.map((name) => "  - " + name).join("\n");

  console.log("Dự án có " + Object.keys(remote).length + " tệp, kho mã đẩy " + Object.keys(local).length + " tệp.");
  if (todo.changed.length) console.log("Sẽ thay nội dung:\n" + list(todo.changed));
  if (todo.added.length) console.log("Sẽ thêm mới:\n" + list(todo.added));
  if (todo.removed.length) {
    fail("dự án có tệp mà kho mã không đẩy; push sẽ XÓA chúng:\n" + list(todo.removed)
      + "\nĐưa các tệp này vào apps-script/ và vào .claspignore (hoặc xóa chúng trong dự án nếu thật sự thừa), rồi chạy lại.");
  }
  if (todo.changed.includes(MANIFEST)) {
    fail("appsscript.json trong kho mã khác với của dự án (có người đổi quyền hoặc cài đặt trong trình soạn, hoặc tệp trong kho mã bị sửa)."
      + "\nSo hai bản, giữ bản đúng trong kho mã. Muốn chủ động đổi cài đặt của dự án từ kho mã: npx @google/clasp@3.4.1 push -f");
  }
  if (todo.added.length && !flags.includes("--add")) {
    fail("các tệp ở mục \"Sẽ thêm mới\" chưa có trong dự án. Nếu đúng là muốn đưa chúng lên, chạy lại với --add;"
      + " nếu chưa, bỏ dòng của chúng khỏi .claspignore.");
  }
  if (flags.includes("--dry")) return console.log("Chỉ so sánh, chưa đẩy gì.");

  if (todo.changed.length || todo.added.length) {
    clasp(["push"], root, true);
    const after = plan(local, readRemote(project.scriptId));
    if (after.removed.length || after.added.length || after.changed.length) fail("sau khi đẩy, dự án vẫn khác kho mã: " + JSON.stringify(after));
    console.log("Đã đẩy và đối chiếu lại: dự án trùng với kho mã.");
  } else {
    console.log("Dự án đã trùng với kho mã, không có gì để đẩy.");
  }

  if (!flags.includes("--deploy")) {
    return console.log("Lưu ý: ứng dụng web chỉ chạy mã mới sau khi có phiên bản mới: chạy lại với --deploy, hoặc Triển khai > Quản lý các bản triển khai > Phiên bản mới.");
  }
  // No spaces in the description: on Windows the command goes through a shell.
  clasp(["redeploy", DEPLOYMENT, "-d", "gas-push-" + new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")], root, true);
  const url = "https://script.google.com/macros/s/" + DEPLOYMENT + "/exec";
  const text = await fetch(url).then((response) => response.text()).catch((err) => String(err));
  if (!/"ok"\s*:\s*true/.test(text)) fail(url + " không trả về {\"ok\":true,...}. Mở đường dẫn đó trong trình duyệt để xem; nếu Google hỏi quyền, chạy chatSelfTest một lần trong trình soạn.\n" + text.slice(0, 300));
  console.log("Đã triển khai phiên bản mới; " + url + " trả lời bình thường.");
}

if (process.argv.includes("--self-test")) selfTest();
else main().catch((err) => { console.error("\nDỪNG: " + err.message); process.exit(1); });
