import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import http from "node:http";
import path from "node:path";
import test from "node:test";

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "taap-admin-"));
process.env.TAAP_DATA_DIR = dataDir;
process.env.TAAP_LOG_DIR = dataDir;
process.env.ADMIN_TOKEN = "admin-test-token";
process.env.OPERATOR_CHAT_ID = "";
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "0:test";
process.env.TYPESAFE_API_KEY = process.env.TYPESAFE_API_KEY || "test";

const { saveLead, queueOperator } = await import("./store.js");
const { logDecision } = await import("./log.js");
const { createServer } = await import("./server.js");

saveLead({
  chatId: "4",
  username: "guest",
  slots: { destination: "uae", city: "Дубай", dates: "12-18", people: "2", budget: "mid" },
  lead_score: 3,
  source_text: "хочу дубай",
});
queueOperator({ chatId: "4", username: "guest", reason: "operator_escape", text: "оператор" });
logDecision({
  chatId: "4",
  message: "верните деньги",
  answers: { intent: { choice: "complaint", confidence: 0.99 }, to_human: { noul: 0.9 } },
  decision: { action: "operator", path: "support", reason: "intent_complaint" },
});

const server = createServer();
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;

async function grab(pathname, headers = {}) {
  const res = await fetch(`${base}${pathname}`, { headers, redirect: "manual" });
  const text = await res.text();
  return { status: res.status, text, headers: res.headers };
}

test("admin api rejects missing token", async () => {
  const res = await grab("/admin/api/leads");
  assert.equal(res.status, 401);
});

test("admin shows login without cookie", async () => {
  const res = await grab("/admin");
  assert.equal(res.status, 200);
  assert.match(res.text, /ADMIN_TOKEN/);
});

test("admin leads decisions disputes with bearer", async () => {
  const auth = { Authorization: "Bearer admin-test-token" };
  const leads = JSON.parse((await grab("/admin/api/leads", auth)).text);
  assert.equal(leads.ok, true);
  assert.equal(leads.items[0].chatId, "4");
  const decisions = JSON.parse((await grab("/admin/api/decisions", auth)).text);
  assert.equal(decisions.items[0].decision.action, "operator");
  const disputes = JSON.parse((await grab("/admin/api/disputes", auth)).text);
  assert.ok(disputes.items.length >= 1);
  const page = await grab("/admin", auth);
  assert.match(page.text, /внутренний разбор/);
});

test("health mentions operator and admin flags", async () => {
  const res = JSON.parse((await grab("/health")).text);
  assert.equal(res.ok, true);
  assert.equal(res.service, "taap");
  assert.equal(typeof res.operator, "boolean");
  assert.equal(res.admin, true);
  assert.equal(res.visa, true);
});

test.after(() => server.close());
