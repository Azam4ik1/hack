/**
 * Accuracy harness for the TAAP Jev layer.
 *
 *   node taap/tools/eval.mjs
 *
 * Prefers docs/taap-50-messages.md when present; otherwise seed fixtures.
 * Never prints TYPESAFE_API_KEY.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { judgeMessage } from "../app/src/index.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const LABELED_MD = path.join(
  "/cursor/stores/bc-be797ad2-42dd-4b4f-a6f1-65ed289f5f65/docs/taap-50-messages.md",
);
const LABELED_JSON = path.join(
  "/cursor/stores/bc-be797ad2-42dd-4b4f-a6f1-65ed289f5f65/internal/taap-50-messages.json",
);

const DEST_MAP = {
  "ОАЭ": "uae",
  "Турция": "turkey",
  "Египет": "egypt",
  "Германия": "germany",
  "не названа": "unnamed",
  uae: "uae",
  turkey: "turkey",
  egypt: "egypt",
  germany: "germany",
  unnamed: "unnamed",
};

const YES_NO = { да: true, нет: false, yes: true, no: false };
const FLEX_MAP = { да: "yes", нет: "no", "не указано": "unspecified" };
const BUDGET_LEVELS = ["unspecified", "low", "mid", "high"];

function loadJsonFixtures() {
  return JSON.parse(fs.readFileSync(path.join(HERE, "fixtures.json"), "utf8"));
}

function flexGold(value) {
  if (value === true) {
    return "yes";
  }
  if (value === false) {
    return "no";
  }
  if (value === null) {
    return "unspecified";
  }
  return undefined;
}

export function loadLabeledJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return { items: [], source: null };
  }
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const messages = data.messages || [];
  const items = messages.map((row) => {
    const hotel = row.intent === "hotel";
    return {
      id: String(row.id).padStart(2, "0"),
      lang: row.lang,
      message: row.text,
      intent: row.intent,
      destination: row.destination,
      to_human: row.to_human,
      lead_score: row.lead_score,
      slots_complete: hotel ? row.slots_complete : undefined,
      budget_level: hotel ? row.budget_level : undefined,
      flexible_dates: hotel ? flexGold(row.flexible_dates) : undefined,
      city: row.destination && row.destination !== "unnamed" ? row.destination : null,
      date: row.flexible_dates === false || row.slots_complete === true ? "present" : null,
      jailbreak: row.jailbreak,
      operator_escape: row.operator_escape,
    };
  });
  return { items, source: filePath };
}

function yn(value) {
  if (value === undefined) {
    return undefined;
  }
  const mapped = YES_NO[String(value).trim().toLowerCase()];
  return mapped;
}

export function parseMarkdownLabeled(filePath) {
  if (!fs.existsSync(filePath)) {
    return { items: [], source: null };
  }
  const text = fs.readFileSync(filePath, "utf8");
  const items = [];
  const blockRe =
    /\*\*(\d+)\*\*\s*·\s*`([^`]+)`\s*·\s*(\w+)\s*·\s*([^·\n]+?)((?:\s*·\s*[^\n]+)*)\n+\n>\s*(.+)/g;
  let match;
  while ((match = blockRe.exec(text))) {
    const id = match[1];
    const lang = match[2].trim();
    const intent = match[3].trim();
    const destRaw = match[4].trim();
    const rest = match[5] || "";
    const message = match[6].trim();
    const flags = {};
    for (const part of rest.split("·")) {
      const piece = part.trim();
      if (!piece) {
        continue;
      }
      const eq = piece.indexOf("=");
      if (eq === -1) {
        flags[piece] = true;
        continue;
      }
      flags[piece.slice(0, eq).trim()] = piece.slice(eq + 1).trim();
    }
    items.push({
      id,
      lang,
      message,
      intent,
      destination: DEST_MAP[destRaw] || destRaw,
      to_human: yn(flags.to_human),
      lead_score: flags.lead ? Number(flags.lead) : undefined,
      slots_complete: yn(flags.slots),
      budget_level: flags.budget || undefined,
      flexible_dates: flags.flex ? FLEX_MAP[flags.flex] || flags.flex : undefined,
      with_family: flags.family,
      operator_escape: Boolean(flags.operator_escape) || rest.includes("operator_escape"),
      jailbreak: Boolean(flags.jailbreak) || rest.includes("jailbreak"),
      city: DEST_MAP[destRaw] && DEST_MAP[destRaw] !== "unnamed" ? destRaw : null,
      date: flags.flex === "нет" || flags.slots === "да" ? "present" : null,
    });
  }
  return {
    items,
    source: filePath,
    parseError: items.length ? null : "no numbered message blocks",
  };
}

function mergeFixtures(seed, labeled) {
  if (!labeled.length) {
    return { items: seed, used: "seed" };
  }
  return { items: labeled, used: "labeled-50" };
}

function fieldMatch(got, expected) {
  if (expected === undefined || expected === null || expected === "") {
    return null;
  }
  return String(got) === String(expected);
}

function roundScore(score) {
  if (score === undefined || score === null || Number.isNaN(Number(score))) {
    return null;
  }
  return Math.round(Number(score));
}

function noulYes(noul) {
  if (noul === undefined || noul === null) {
    return null;
  }
  return Number(noul) >= 0.5;
}

function tally(store, ok) {
  if (ok === null) {
    return;
  }
  store.total += 1;
  if (ok) {
    store.hit += 1;
  }
}

function pct(store) {
  if (!store.total) {
    return null;
  }
  return {
    accuracy: `${store.hit}/${store.total}`,
    pct: Number((store.hit / store.total).toFixed(4)),
  };
}

async function main() {
  if (process.argv.includes("--parse-only")) {
    const labeled = loadLabeledJson(LABELED_JSON);
    const fallback = labeled.items.length ? labeled : parseMarkdownLabeled(LABELED_MD);
    console.log(
      JSON.stringify(
        {
          n: fallback.items.length,
          source: fallback.source,
          intents: fallback.items.reduce((acc, row) => {
            acc[row.intent] = (acc[row.intent] || 0) + 1;
            return acc;
          }, {}),
        },
        null,
        2,
      ),
    );
    return;
  }

  const seed = loadJsonFixtures();
  const fromJson = loadLabeledJson(LABELED_JSON);
  const labeled = fromJson.items.length ? fromJson : parseMarkdownLabeled(LABELED_MD);
  const { items, used } = mergeFixtures(seed, labeled.items);

  const stats = {
    intent: { hit: 0, total: 0 },
    destination: { hit: 0, total: 0 },
    to_human: { hit: 0, total: 0 },
    lead_score: { hit: 0, total: 0 },
    slots_complete: { hit: 0, total: 0 },
    budget_level: { hit: 0, total: 0 },
    flexible_dates: { hit: 0, total: 0 },
    latencies: [],
    rows: [],
  };

  for (const item of items) {
    const result = await judgeMessage(item.message, {
      city: item.city || null,
      date: item.date || null,
    });
    const gotIntent = result.answers.intent?.choice;
    const gotDest = result.answers.destination?.choice;
    const gotToHuman = noulYes(result.answers.to_human?.noul);
    const leadRounded = roundScore(result.answers.lead_score?.score);
    const gotLead = leadRounded === null ? null : leadRounded + 1;
    const gotSlots = noulYes(result.answers.slots_complete?.noul);
    const gotBudget = BUDGET_LEVELS[roundScore(result.answers.budget_level?.score)] || null;
    const gotFlex = result.answers.flexible_dates?.choice;

    const intentOk = fieldMatch(gotIntent, item.intent);
    const destOk = fieldMatch(gotDest, item.destination);
    const toHumanOk =
      item.to_human === undefined ? null : gotToHuman === item.to_human;
    const leadOk =
      item.lead_score === undefined ? null : gotLead === item.lead_score;
    const slotsOk =
      item.slots_complete === undefined
        ? null
        : gotSlots === item.slots_complete;
    const budgetOk = fieldMatch(gotBudget, item.budget_level);
    const flexOk = fieldMatch(gotFlex, item.flexible_dates);

    tally(stats.intent, intentOk);
    tally(stats.destination, destOk);
    tally(stats.to_human, toHumanOk);
    tally(stats.lead_score, leadOk);
    tally(stats.slots_complete, slotsOk);
    tally(stats.budget_level, budgetOk);
    tally(stats.flexible_dates, flexOk);
    stats.latencies.push(result.latencyMs);
    stats.rows.push({
      id: item.id,
      expected_intent: item.intent,
      got_intent: gotIntent,
      intent_confidence: result.answers.intent?.confidence,
      expected_destination: item.destination,
      got_destination: gotDest,
      to_human_gold: item.to_human,
      to_human_noul: result.answers.to_human?.noul,
      lead_gold: item.lead_score,
      lead_pred: Number.isFinite(gotLead) ? gotLead : null,
      slots_gold: item.slots_complete,
      slots_pred: gotSlots,
      budget_gold: item.budget_level,
      budget_pred: gotBudget,
      flex_gold: item.flexible_dates,
      flex_pred: gotFlex,
      action: result.decision.action,
      path: result.decision.path,
      reason: result.decision.reason,
      latency_ms: result.latencyMs,
      model: result.model,
      intent_ok: intentOk,
      destination_ok: destOk,
    });
  }

  stats.latencies.sort((a, b) => a - b);
  const mid = stats.latencies[Math.floor(stats.latencies.length / 2)] || null;
  const intent = pct(stats.intent);
  const report = {
    source: used,
    labeled_file: labeled.source,
    labeled_parsed: labeled.items.length,
    labeled_parse_error: labeled.parseError,
    n: items.length,
    intent_accuracy: intent?.accuracy || null,
    intent_pct: intent?.pct ?? null,
    destination: pct(stats.destination),
    to_human: pct(stats.to_human),
    lead_score: pct(stats.lead_score),
    slots_complete: pct(stats.slots_complete),
    budget_level: pct(stats.budget_level),
    flexible_dates: pct(stats.flexible_dates),
    median_latency_ms: mid,
    max_latency_ms: stats.latencies[stats.latencies.length - 1] || null,
    stage1_intent_target: 0.9,
    stage1_pass: intent ? intent.pct > 0.9 : null,
    rows: stats.rows,
  };

  const outDir = path.join(ROOT, "taap/logs");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "eval-last.json"), JSON.stringify(report, null, 2));

  console.log(
    JSON.stringify(
      {
        source: report.source,
        labeled_parsed: report.labeled_parsed,
        n: report.n,
        intent_accuracy: report.intent_accuracy,
        destination: report.destination,
        to_human: report.to_human,
        lead_score: report.lead_score,
        slots_complete: report.slots_complete,
        budget_level: report.budget_level,
        flexible_dates: report.flexible_dates,
        median_latency_ms: report.median_latency_ms,
        stage1_pass: report.stage1_pass,
      },
      null,
      2,
    ),
  );
  for (const row of stats.rows) {
    const mark = row.intent_ok === false ? "MISS" : "ok";
    console.log(
      `${mark}\t${row.id}\texp=${row.expected_intent}\tgot=${row.got_intent}\tconf=${Number(row.intent_confidence).toFixed(2)}\tact=${row.action}`,
    );
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error(err.message || String(err));
    process.exit(1);
  });
}
