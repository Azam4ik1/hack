/**
 * Accuracy harness for the TAAP Jev layer.
 *
 *   cd taap && node tools/eval.mjs
 *
 * Loads tools/fixtures.json, then overlays docs/taap-50-messages.md when that
 * labeled set exists. Never prints TYPESAFE_API_KEY.
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

function loadJsonFixtures() {
  const file = path.join(HERE, "fixtures.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function parseMarkdownLabeled(filePath) {
  if (!fs.existsSync(filePath)) {
    return { items: [], source: null };
  }
  const text = fs.readFileSync(filePath, "utf8");
  const jsonBlock = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlock) {
    const parsed = JSON.parse(jsonBlock[1]);
    const items = Array.isArray(parsed) ? parsed : parsed.messages || parsed.items || [];
    return { items, source: filePath };
  }
  const lines = text.split(/\r?\n/);
  const header = lines.find((line) => /^\|.+\|/.test(line) && /intent/i.test(line));
  if (!header) {
    return { items: [], source: filePath, parseError: "no json fence or intent table" };
  }
  const cols = header
    .split("|")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
  const items = [];
  for (const line of lines) {
    if (!line.startsWith("|") || /---/.test(line) || line === header) {
      continue;
    }
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((_, i, arr) => i > 0 && i < arr.length - 1);
    if (cells.length !== cols.length) {
      continue;
    }
    const row = {};
    cols.forEach((name, i) => {
      row[name] = cells[i];
    });
    const message = row.message || row.text || row.msg;
    if (!message || message === "message") {
      continue;
    }
    items.push({
      id: row.id || `md-${items.length + 1}`,
      message,
      intent: row.intent || undefined,
      destination: row.destination || row.dest || undefined,
      city: row.city || undefined,
      date: row.date || undefined,
    });
  }
  return { items, source: filePath };
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

async function main() {
  const seed = loadJsonFixtures();
  const labeled = parseMarkdownLabeled(LABELED_MD);
  const { items, used } = mergeFixtures(seed, labeled.items);

  const stats = {
    n: items.length,
    source: used,
    labeledPath: labeled.source,
    labeledCount: labeled.items.length,
    parseError: labeled.parseError || null,
    intent: { hit: 0, total: 0 },
    destination: { hit: 0, total: 0 },
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
    const intentOk = fieldMatch(gotIntent, item.intent);
    const destOk = fieldMatch(gotDest, item.destination);
    if (intentOk !== null) {
      stats.intent.total += 1;
      if (intentOk) {
        stats.intent.hit += 1;
      }
    }
    if (destOk !== null) {
      stats.destination.total += 1;
      if (destOk) {
        stats.destination.hit += 1;
      }
    }
    stats.latencies.push(result.latencyMs);
    stats.rows.push({
      id: item.id,
      expected_intent: item.intent,
      got_intent: gotIntent,
      intent_confidence: result.answers.intent?.confidence,
      expected_destination: item.destination,
      got_destination: gotDest,
      dest_confidence: result.answers.destination?.confidence,
      to_human: result.answers.to_human?.noul,
      lead_score: result.answers.lead_score?.score,
      slots_complete: result.answers.slots_complete?.noul,
      budget_level: result.answers.budget_level?.score,
      flexible_dates: result.answers.flexible_dates?.noul,
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
  const mid = stats.latencies[Math.floor(stats.latencies.length / 2)];
  const report = {
    source: stats.source,
    labeled_file: stats.labeledPath,
    labeled_parsed: stats.labeledCount,
    labeled_parse_error: stats.parseError,
    n: stats.n,
    intent_accuracy:
      stats.intent.total === 0
        ? null
        : `${stats.intent.hit}/${stats.intent.total}`,
    destination_accuracy:
      stats.destination.total === 0
        ? null
        : `${stats.destination.hit}/${stats.destination.total}`,
    intent_pct:
      stats.intent.total === 0
        ? null
        : Number((stats.intent.hit / stats.intent.total).toFixed(4)),
    destination_pct:
      stats.destination.total === 0
        ? null
        : Number((stats.destination.hit / stats.destination.total).toFixed(4)),
    median_latency_ms: mid,
    max_latency_ms: stats.latencies[stats.latencies.length - 1],
    stage1_intent_target: 0.9,
    stage1_pass:
      stats.intent.total > 0
        ? stats.intent.hit / stats.intent.total > 0.9
        : null,
    rows: stats.rows,
  };

  const outDir = path.join(ROOT, "taap/logs");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "eval-last.json"),
    JSON.stringify(report, null, 2),
  );

  console.log(
    JSON.stringify(
      {
        source: report.source,
        labeled_parsed: report.labeled_parsed,
        n: report.n,
        intent_accuracy: report.intent_accuracy,
        destination_accuracy: report.destination_accuracy,
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

main().catch((err) => {
  console.error(err.message || String(err));
  process.exit(1);
});
