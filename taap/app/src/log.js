/**
 * Append-only decision journal. Local JSONL only — not a DB, Telegram, or TAAP.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function logDir() {
  if (process.env.TAAP_LOG_DIR) {
    return path.resolve(process.env.TAAP_LOG_DIR);
  }
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../logs");
}

export function logDecision(entry) {
  fs.mkdirSync(logDir(), { recursive: true });
  const file = path.join(logDir(), "decisions.jsonl");
  const record = {
    ts: new Date().toISOString(),
    ...entry,
  };
  fs.appendFileSync(file, `${JSON.stringify(record)}\n`, "utf8");
  return record;
}

export function logPath() {
  return path.join(logDir(), "decisions.jsonl");
}

export function listDecisions(limit = 200) {
  const file = logPath();
  if (!fs.existsSync(file)) {
    return [];
  }
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
  const rows = [];
  for (const line of lines.slice(-Math.max(1, limit))) {
    try {
      rows.push(JSON.parse(line));
    } catch {
      // skip a corrupt line
    }
  }
  return rows.reverse();
}
