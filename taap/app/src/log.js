/**
 * Append-only decision journal. Local JSONL only — not a DB, Telegram, or TAAP.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LOG_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../logs",
);

export function logDecision(entry) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const file = path.join(LOG_DIR, "decisions.jsonl");
  const record = {
    ts: new Date().toISOString(),
    ...entry,
  };
  fs.appendFileSync(file, `${JSON.stringify(record)}\n`, "utf8");
  return record;
}

export function logPath() {
  return path.join(LOG_DIR, "decisions.jsonl");
}
