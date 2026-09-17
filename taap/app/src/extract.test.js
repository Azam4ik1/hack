import assert from "node:assert/strict";
import test from "node:test";
import { extract, isOperatorEscape, looksLikeSecret, missingSlot, slotsComplete } from "./extract.js";

test("exact оператор escape", () => {
  assert.equal(isOperatorEscape("оператор"), true);
  assert.equal(isOperatorEscape("Оператор"), true);
  assert.equal(isOperatorEscape("  оператор  "), true);
});

test("оператор as a word still escapes", () => {
  assert.equal(isOperatorEscape("Лутфан ба оператор гузаронед"), true);
});

test("hotel request is not an escape", () => {
  assert.equal(isOperatorEscape("Нужен отель в Дубае"), false);
});

test("extract dubai hotel gold-like", () => {
  const got = extract(
    "Нужен отель в Дубае с 12 по 18 октября, 2 взрослых и ребёнок 6 лет, бюджет около 150$ за ночь",
  );
  assert.equal(got.destination, "uae");
  assert.ok(got.dates);
  assert.ok(got.people);
  assert.equal(got.budgetLevel, "mid");
});

test("complete slots helper", () => {
  assert.equal(missingSlot({}), "destination");
  assert.equal(
    slotsComplete({
      destination: "uae",
      city: "Дубай",
      dates: "12-18 октября",
      people: "2",
      budget: "150$",
    }),
    true,
  );
});

test("card-like numbers are rejected", () => {
  assert.equal(looksLikeSecret("4111111111111111"), true);
});
