import assert from "node:assert/strict";
import test from "node:test";
import { decide, THRESHOLDS } from "./decide.js";

test("complaint always goes to operator", () => {
  const d = decide({
    intent: { choice: "complaint", confidence: 0.99 },
    to_human: { noul: 0.2 },
  });
  assert.equal(d.action, "operator");
  assert.equal(d.path, "support");
});

test("to_human above 0.85 goes to operator even on a calm-looking intent", () => {
  const d = decide({
    intent: { choice: "prices", confidence: 0.9 },
    to_human: { noul: 0.86 },
  });
  assert.equal(d.action, "operator");
  assert.equal(d.reason, "to_human_above_threshold");
});

test("calm price to_human 0.78 does not page an operator", () => {
  const d = decide({
    intent: { choice: "prices", confidence: 0.9 },
    to_human: { noul: 0.78 },
  });
  assert.equal(d.action, "act");
  assert.equal(d.path, "prices");
});

test("high-confidence hotel acts", () => {
  const d = decide({
    intent: { choice: "hotel", confidence: 0.91 },
    to_human: { noul: 0.1 },
  });
  assert.equal(d.action, "act");
  assert.equal(d.path, "hotel");
});

test("high-confidence visa routes to the knowledge base", () => {
  const d = decide({
    intent: { choice: "visa", confidence: 0.93 },
    to_human: { noul: 0.1 },
  });
  assert.equal(d.action, "act");
  assert.equal(d.path, "visa");
  assert.equal(d.reason, "visa_from_kb");
});

test("mid hotel with city collects slots", () => {
  const d = decide(
    {
      intent: { choice: "hotel", confidence: 0.55 },
      to_human: { noul: 0.2 },
    },
    { city: "Dubai" },
  );
  assert.equal(d.action, "collect_slots");
});

test("mid hotel without city or date asks buttons", () => {
  const d = decide({
    intent: { choice: "hotel", confidence: 0.55 },
    to_human: { noul: 0.2 },
  });
  assert.equal(d.action, "ask_buttons");
  assert.equal(d.reason, "ambiguous_without_slot");
});

test("intent below 0.40 asks buttons", () => {
  const d = decide({
    intent: { choice: "hotel", confidence: 0.3 },
    to_human: { noul: 0.1 },
  });
  assert.equal(d.action, "ask_buttons");
  assert.equal(d.reason, "intent_below_0.40");
});

test("thresholds match the architecture", () => {
  assert.equal(THRESHOLDS.intentAct, 0.8);
  assert.equal(THRESHOLDS.intentSlotsLow, 0.4);
  assert.equal(THRESHOLDS.toHuman, 0.85);
});
