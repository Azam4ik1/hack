/**
 * File-backed store for sessions, leads, and operator queue.
 * Not PostgreSQL — VPS can swap this for the schema in db/init.sql.
 */

import { env } from "./env.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const DATA = env("TAAP_DATA_DIR")
  ? path.resolve(env("TAAP_DATA_DIR"))
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data");

function ensure() {
  fs.mkdirSync(DATA, { recursive: true });
}

function readJson(name, fallback) {
  ensure();
  const file = path.join(DATA, name);
  if (!fs.existsSync(file)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(name, value) {
  ensure();
  fs.writeFileSync(path.join(DATA, name), JSON.stringify(value, null, 2));
}

function appendJsonl(name, row) {
  ensure();
  fs.appendFileSync(path.join(DATA, name), `${JSON.stringify(row)}\n`);
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
    ts: new Date().toISOString(),
    ...entry,
  };
  appendJsonl("operator-queue.jsonl", row);
  return row;
}

export function logDialog(entry) {
  appendJsonl("dialogs.jsonl", { ts: new Date().toISOString(), ...entry });
}
