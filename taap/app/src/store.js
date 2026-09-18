/**
 * File-backed store for sessions, leads, and operator queue.
 * Not PostgreSQL — VPS can swap this for the schema in db/init.sql.
 */

import { env } from "./env.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

function dataDir() {
  if (process.env.TAAP_DATA_DIR) {
    return path.resolve(process.env.TAAP_DATA_DIR);
  }
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data");
}

function ensure() {
  fs.mkdirSync(dataDir(), { recursive: true });
}

function readJson(name, fallback) {
  ensure();
  const file = path.join(dataDir(), name);
  if (!fs.existsSync(file)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(name, value) {
  ensure();
  fs.writeFileSync(path.join(dataDir(), name), JSON.stringify(value, null, 2));
}

function appendJsonl(name, row) {
  ensure();
  fs.appendFileSync(path.join(dataDir(), name), `${JSON.stringify(row)}\n`);
}

export function emptySlots() {
  return {
    destination: null,
    city: null,
    dates: null,
    people: null,
    budget: null,
    budgetLevel: null,
  };
}

export function getSession(chatId) {
  const all = readJson("sessions.json", {});
  const key = String(chatId);
  if (!all[key]) {
    all[key] = {
      chatId: key,
      slots: emptySlots(),
      mode: "idle",
      handedOff: false,
      updatedAt: new Date().toISOString(),
    };
  }
  return all[key];
}

export function saveSession(session) {
  const all = readJson("sessions.json", {});
  session.updatedAt = new Date().toISOString();
  all[String(session.chatId)] = session;
  writeJson("sessions.json", all);
  return session;
}

export function resetSession(chatId) {
  const session = {
    chatId: String(chatId),
    slots: emptySlots(),
    mode: "idle",
    handedOff: false,
    updatedAt: new Date().toISOString(),
  };
  saveSession(session);
  return session;
}

export function saveLead(lead) {
  const row = {
    id: `lead_${Date.now()}`,
    ts: new Date().toISOString(),
    ...lead,
  };
  appendJsonl("leads.jsonl", row);
  return row;
}

export function queueOperator(entry) {
  const row = {
    id: `opq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ts: new Date().toISOString(),
    ...entry,
  };
  appendJsonl("operator-queue.jsonl", row);
  return row;
}

export function logDialog(entry) {
  appendJsonl("dialogs.jsonl", { ts: new Date().toISOString(), ...entry });
}

function readJsonl(name, limit = 200) {
  ensure();
  const file = path.join(dataDir(), name);
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

export function listLeads(limit = 200) {
  return readJsonl("leads.jsonl", limit);
}

export function listOperatorQueue(limit = 200) {
  return readJsonl("operator-queue.jsonl", limit);
}

export function listDialogs(limit = 200) {
  return readJsonl("dialogs.jsonl", limit);
}

export function listSessions() {
  const all = readJson("sessions.json", {});
  return Object.values(all).sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
}

export function getOperatorChatId() {
  const fromEnv = env("OPERATOR_CHAT_ID");
  if (fromEnv) {
    return String(fromEnv);
  }
  const saved = readJson("operator.json", null);
  return saved?.chatId ? String(saved.chatId) : "";
}

export function setOperatorChatId(chatId, username = null) {
  const row = {
    chatId: String(chatId),
    username: username || null,
    claimedAt: new Date().toISOString(),
  };
  writeJson("operator.json", row);
  process.env.OPERATOR_CHAT_ID = row.chatId;
  return row;
}

export function operatorHandledKey(entry) {
  return `${entry.ts || ""}|${entry.chatId || ""}|${entry.reason || ""}`;
}

export function listHandledKeys() {
  return readJson("operator-handled.json", {});
}

export function markOperatorHandled(id) {
  const all = listHandledKeys();
  all[String(id)] = new Date().toISOString();
  writeJson("operator-handled.json", all);
  return all[String(id)];
}

export function operatorWelcomeSent() {
  return Boolean(readJson("operator-welcome.json", null)?.sentAt);
}

export function markOperatorWelcomeSent() {
  writeJson("operator-welcome.json", { sentAt: new Date().toISOString() });
}
