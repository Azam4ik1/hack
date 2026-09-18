import assert from "node:assert/strict";
import test from "node:test";
import {
  answerVisa,
  extractVisaType,
  formatVisaReply,
  loadVisaKb,
  lookupVisa,
  mapDestination,
} from "./visa.js";

test("KB has AE TR EG records for TJ tourist transit visa-free on-arrival e-visa", () => {
  const kb = loadVisaKb();
  const types = ["tourist", "transit", "visa-free", "on-arrival", "e-visa"];
  for (const country of ["AE", "TR", "EG"]) {
    for (const visa_type of types) {
      const row = kb.rules.find(
        (r) => r.country === country && r.citizenship === "TJ" && r.visa_type === visa_type,
      );
      assert.ok(row, `${country} ${visa_type}`);
      assert.ok(row.source_url.startsWith("https://"));
      assert.equal(row.checked_at, "2026-09-18");
      assert.equal(row.valid_until, "2026-12-17");
      assert.ok(row.notes_ru);
      assert.ok(row.notes_tg);
    }
  }
});

test("lookup AE tourist is required and cites u.ae", () => {
  const hit = lookupVisa({ country: "uae", visaType: "tourist" });
  assert.equal(hit.kind, "ok");
  assert.equal(hit.record.required, true);
  assert.match(hit.record.source_url, /u\.ae/);
});

test("TR airside transit is not required", () => {
  const hit = lookupVisa({ country: "TR", visaType: "transit" });
  assert.equal(hit.record.required, false);
});

test("EG e-visa stays required because TJ is not on the portal list", () => {
  const hit = lookupVisa({ country: "egypt", visaType: "e-visa" });
  assert.equal(hit.record.required, true);
  assert.match(hit.record.notes_ru, /Tajikistan/);
});

test("expired row is stale, still returns the record", () => {
  const hit = lookupVisa({
    country: "AE",
    visaType: "tourist",
    now: new Date("2027-01-01"),
  });
  assert.equal(hit.kind, "stale");
  assert.equal(hit.expired, true);
  assert.ok(hit.record);
});

test("unnamed country asks for a destination", () => {
  const out = answerVisa({ country: null, text: "нужна виза?" });
  assert.equal(out.askCountry, true);
  assert.match(out.text, /справ/i);
});

test("reply never invents a fee and always disclaims", () => {
  const out = answerVisa({ country: "EG", visaType: "tourist", text: "виза в Египет" });
  assert.match(out.text, /не визовая услуга/);
  assert.match(out.text, /пусто/);
  assert.doesNotMatch(out.text, /booking\.com/i);
});

test("Tajik text gets notes_tg", () => {
  const out = answerVisa({ country: "TR", visaType: "tourist", text: "раводид ба Туркия лозим аст?" });
  assert.match(out.text, /хизмати раводид/);
  assert.match(out.text, /ABC Ltd/);
});

test("extractVisaType prefers transit and e-visa keywords", () => {
  assert.equal(extractVisaType("транзит в Дубае"), "transit");
  assert.equal(extractVisaType("е-виза в ОАЭ"), "e-visa");
  assert.equal(mapDestination("turkey"), "TR");
});

test("stale format hands off", () => {
  const hit = lookupVisa({
    country: "AE",
    visaType: "tourist",
    now: new Date("2027-01-01"),
  });
  const formatted = formatVisaReply(hit, { text: "виза дубай" });
  assert.equal(formatted.handoff, true);
  assert.match(formatted.text, /истёк/);
});
