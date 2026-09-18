import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "taap-op-"));
process.env.TAAP_DATA_DIR = dataDir;
process.env.TAAP_LOG_DIR = dataDir;
process.env.OPERATOR_CHAT_ID = "";
process.env.OPERATOR_CLAIM_TOKEN = "claimme";

const { handleTurn, helpCopy, operatorClaimCopy } = await import("./bot.js");
const { getOperatorChatId } = await import("./store.js");

test("/help does not call Jev", async () => {
  let called = false;
  const result = await handleTurn(
    { chatId: "10", text: "/help" },
    {
      judgeMessage: async () => {
        called = true;
        throw new Error("no jev");
      },
    },
  );
  assert.equal(called, false);
  assert.equal(result.replies[0].text, helpCopy().text);
});

test("operator claim start payload stores chat id", async () => {
  const result = await handleTurn(
    { chatId: "507", text: "/start op_claimme", username: "azik" },
    { judgeMessage: async () => ({}) },
  );
  assert.equal(result.claimedOperator, true);
  assert.equal(result.replies[0].text, operatorClaimCopy());
  assert.equal(getOperatorChatId(), "507");
});

test("handoff notifies operator chat", async () => {
  const result = await handleTurn(
    { chatId: "11", text: "оператор", operatorChatId: "507" },
    { judgeMessage: async () => ({}) },
  );
  assert.equal(result.notify[0].chatId, "507");
  assert.match(result.notify[0].text, /оператор/i);
});
