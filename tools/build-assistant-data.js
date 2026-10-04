// Builds assistant-data.json, the file the sheet's "Cập nhật dữ liệu từ trang" menu reads
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

// Every committed version of a file, oldest first; empty when git or its history is missing.
function history(file, name) {
  let commits = [];
  try {
    commits = git(["log", "--format=%H", "--", file]).split("\n").filter(Boolean).reverse();
  } catch (err) {
    return [];
  }
  return commits.map((sha) => {
    try {
      return load(git(["show", `${sha}:${file}`]), name);
    } catch (err) {
      return undefined;
    }
  }).filter(Array.isArray);
}

function build() {
  const seed = load(fs.readFileSync(path.join(root, SEED), "utf8"), "FAQ_SEED");
  const facts = load(fs.readFileSync(path.join(root, KNOWLEDGE), "utf8"), "KNOWLEDGE_EXTRA");
  if (!Array.isArray(seed) || !seed.length) throw new Error("FAQ_SEED not found in " + SEED);
  if (!Array.isArray(facts) || !facts.length) throw new Error("KNOWLEDGE_EXTRA not found in " + KNOWLEDGE);

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

  let version = "local";
  try {
    version = git(["log", "-1", "--format=%cs %h"]).trim();
  } catch (err) {
    // Built outside a git checkout.
  }
  return { format: 1, version, faq, facts: factRows };
}

const out = process.argv[2] || path.join(root, "dist", "assistant-data.json");
const data = build();
fs.writeFileSync(out, JSON.stringify(data));
console.log(`${out}: ${data.faq.length} FAQ rows, ${data.facts.length} facts, version ${data.version}`);
