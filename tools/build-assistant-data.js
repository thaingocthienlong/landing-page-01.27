// Builds assistant-data.json, the file the sheet's "Cập nhật dữ liệu từ trang web" menu reads
// (apps-script/Sync.gs). The deploy workflow runs it before publishing the site:
//
//     node tools/build-assistant-data.js dist/assistant-data.json
//
// It holds the FAQ rows of apps-script/FaqSeed.gs and the confirmed facts of
// apps-script/Knowledge.gs. For every field it also lists the hashes of all the versions the
// repository ever had (from git history), so Sync.gs can tell a cell the repository wrote from a
// cell staff edited, and for every row the phrasings the repository has since retired.
// Needs Node 18 or later and, for the history, a full git checkout (fetch-depth: 0).

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const SEED = "apps-script/FaqSeed.gs";
const KNOWLEDGE = "apps-script/Knowledge.gs";
const FIELDS = ["group", "question", "answer", "from", "to"];

// Same as syncText_ in Sync.gs.
const text = (value) => String(value === undefined || value === null ? "" : value).replace(/\r\n?/g, "\n").normalize("NFC")
  .split("\n").map((line) => line.replace(/\s+$/, "")).join("\n").trim();
const hash = (value) => crypto.createHash("md5").update(text(value), "utf8").digest("hex");

function load(source, name) {
  const context = {};
  vm.createContext(context);
  vm.runInContext(source + `\n;this.__value = typeof ${name} === "undefined" ? undefined : ${name};`, context);
  return context.__value;
}

function git(args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

// Every committed version of a file, oldest first. A shallow or missing history would publish a
// file that marks every older cell as a staff edit, so it stops the build instead.
function history(file, name) {
  if (git(["rev-parse", "--is-shallow-repository"]).trim() === "true") {
    throw new Error("shallow git checkout: fetch the full history (actions/checkout with fetch-depth: 0)");
  }
  const commits = git(["log", "--format=%H", "--", file]).split("\n").filter(Boolean).reverse();
  if (!commits.length) throw new Error("no git history for " + file);
  return commits.map((sha) => {
    try {
      return load(git(["show", `${sha}:${file}`]), name);
    } catch (err) {
      // Versions from before the list existed (KNOWLEDGE_EXTRA) or that do not run on their own.
      return undefined;
    }
  }).filter(Array.isArray);
}

// The rules Sync.gs checks (syncInvalid_), so a file the sheet would refuse is never published.
function check(seed, facts) {
  const isText = (value) => typeof value === "string";
  const ids = new Set();
  seed.forEach((row, i) => {
    const name = `FAQ_SEED row ${row && row.id ? row.id : i + 1}`;
    if (!row || !isText(row.id) || !row.id || ids.has(row.id)) throw new Error(name + ": missing or repeated id");
    ids.add(row.id);
    if (!isText(row.group) || !isText(row.question) || !row.question || !isText(row.answer) || !row.answer) throw new Error(name + ": group, question and answer must be text");
    if (!Array.isArray(row.variants) || !row.variants.every(isText)) throw new Error(name + ": variants must be a list of text");
    if (!isText(row.from || "") || !isText(row.to || "")) throw new Error(name + ": from and to must be text");
  });
  const factIds = new Set();
  facts.forEach((fact, i) => {
    const name = `KNOWLEDGE_EXTRA item ${fact && fact.id ? fact.id : i + 1}`;
    if (!fact || !isText(fact.id) || !fact.id || factIds.has(fact.id)) throw new Error(name + ": missing or repeated id");
    factIds.add(fact.id);
    if (!isText(fact.text) || !fact.text) throw new Error(name + ": text must be non-empty");
  });
}

function build() {
  const seed = load(fs.readFileSync(path.join(root, SEED), "utf8"), "FAQ_SEED");
  const facts = load(fs.readFileSync(path.join(root, KNOWLEDGE), "utf8"), "KNOWLEDGE_EXTRA");
  if (!Array.isArray(seed) || !seed.length) throw new Error("FAQ_SEED not found in " + SEED);
  if (!Array.isArray(facts) || !facts.length) throw new Error("KNOWLEDGE_EXTRA not found in " + KNOWLEDGE);
  check(seed, facts);

  const pastRows = history(SEED, "FAQ_SEED").concat([seed]);
  const faq = seed.map((row) => {
    const known = {};
    FIELDS.forEach((field) => { known[field] = new Set(); });
    const everVariants = new Set();
    pastRows.forEach((rows) => {
      const old = rows.find((r) => r && r.id === row.id);
      if (!old) return;
      FIELDS.forEach((field) => known[field].add(hash(old[field])));
      (old.variants || []).forEach((v) => everVariants.add(text(v)));
    });
    const current = new Set(row.variants.map(text));
    return {
      id: row.id,
      group: row.group,
      question: row.question,
      variants: row.variants,
      answer: row.answer,
      from: row.from || "",
      to: row.to || "",
      known: Object.fromEntries(FIELDS.map((field) => [field, [...known[field]]])),
      retired: [...everVariants].filter((v) => !current.has(v)),
    };
  });

  const pastFacts = history(KNOWLEDGE, "KNOWLEDGE_EXTRA").concat([facts]);
  const factRows = facts.map((fact) => {
    const known = new Set();
    pastFacts.forEach((list) => {
      const old = list.find((f) => f && f.id === fact.id);
      if (old) known.add(hash(old.text));
    });
    return { id: fact.id, text: fact.text, known: { text: [...known] } };
  });

  // Rows and facts the repository once had and has dropped: Sync.gs switches them off.
  const dropped = (past, current, field) => {
    const now = new Set(current.map((item) => item.id));
    const out = new Map();
    past.forEach((list) => list.forEach((item) => {
      if (!item || !item.id || now.has(item.id)) return;
      if (!out.has(item.id)) out.set(item.id, new Set());
      out.get(item.id).add(hash(item[field]));
    }));
    return [...out].map(([id, known]) => ({ id, known: { [field]: [...known] } }));
  };

  return {
    format: 1,
    version: git(["log", "-1", "--format=%cs %h"]).trim(),
    time: git(["log", "-1", "--format=%cI"]).trim(),
    faq,
    facts: factRows,
    retiredFaq: dropped(pastRows, seed, "answer"),
    retiredFacts: dropped(pastFacts, facts, "text"),
  };
}

const out = process.argv[2] || path.join(root, "dist", "assistant-data.json");
const data = build();
fs.writeFileSync(out, JSON.stringify(data));
console.log(`${out}: ${data.faq.length} FAQ rows, ${data.facts.length} facts, version ${data.version}`);
