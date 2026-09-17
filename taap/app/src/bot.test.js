import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "taap-test-"));
process.env.TAAP_DATA_DIR = dataDir;

const { handleTurn, operatorCopy } = await import("./bot.js");

test("exact оператор never waits for Jev", async () => {
  let called = false;
  const result = await handleTurn(
    { chatId: "1", text: "оператор", username: "azam" },
    {
      judgeMessage: async () => {
        called = true;
        throw new Error("should not call Jev");
      },
    },
  );
  assert.equal(called, false);
  assert.match(result.replies[0].text, /оператор/i);
  assert.equal(result.replies[0].text, operatorCopy());
});

test("complaint from Jev is never auto-handled as hotel", async () => {
  const result = await handleTurn(
    { chatId: "2", text: "верните деньги" },
    {
      judgeMessage: async () => ({
        answers: {
          intent: { choice: "complaint", confidence: 0.99 },
          to_human: { noul: 0.2 },
        },
        decision: { action: "operator", path: "support", reason: "intent_complaint" },
      }),
    },
  );
  assert.match(result.replies[0].text, /оператору/i);
});

test("Jev down falls back to menu buttons", async () => {
  const result = await handleTurn(
    { chatId: "3", text: "что-нибудь" },
    {
      judgeMessage: async () => {
        throw new Error("TypeSafe HTTP 503");
      },
    },
  );
  assert.equal(result.fallback, true);
  assert.ok(result.replies[0].reply_markup.inline_keyboard);
});

test("hotel menu collects slots then saves a lead without a booking URL", async () => {
  const chatId = "4";
  await handleTurn({ chatId, callbackData: "menu:hotel" }, { judgeMessage: async () => ({}) });
  await handleTurn({ chatId, callbackData: "dest:uae" }, { judgeMessage: async () => ({}) });
  await handleTurn({ chatId, text: "12–18 октября" }, { judgeMessage: async () => ({ decision: { action: "act", path: "hotel" }, answers: {} }) });
  await handleTurn({ chatId, text: "2 взрослых" }, { judgeMessage: async () => ({ decision: { action: "act", path: "hotel" }, answers: {} }) });
  const done = await handleTurn(
    { chatId, callbackData: "budget:mid" },
    { judgeMessage: async () => ({}) },
  );
  assert.match(done.replies[0].text, /Заявка сохранена/);
  assert.doesNotMatch(done.replies[0].text, /booking\.com/i);
  const leads = fs.readFileSync(path.join(dataDir, "leads.jsonl"), "utf8");
  assert.match(leads, /"chatId":"4"/);
});
