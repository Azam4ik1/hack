/**
 * Thresholds and action selection. Pure function: no I/O, no Jev calls.
 * Thresholds come from the TAAP architecture measurements.
 */

export const THRESHOLDS = {
  intentAct: 0.8,
  intentSlotsLow: 0.4,
  toHuman: 0.85,
};

const HOTEL_OR_PRICES = new Set(["hotel", "prices"]);

/**
 * @param {object} answers Jev answers keyed by question id
 * @param {{ city?: string | null, date?: string | null }} [extracted] facts from code, not Jev
 */
export function decide(answers, extracted = {}) {
  const intent = answers.intent || {};
  const choice = intent.choice;
  const confidence = Number(intent.confidence ?? 0);
  const toHuman = Number(answers.to_human?.noul ?? 0);
  const hasSlotHint = Boolean(extracted.city || extracted.date);

  if (choice === "complaint" || toHuman > THRESHOLDS.toHuman) {
    return {
      action: "operator",
      path: choice === "complaint" ? "support" : "human",
      reason:
        choice === "complaint" ? "intent_complaint" : "to_human_above_threshold",
      thresholds: THRESHOLDS,
    };
  }

  if (confidence > THRESHOLDS.intentAct) {
    if (choice === "hotel") {
      return {
        action: "act",
        path: "hotel",
        reason: "intent_high",
        thresholds: THRESHOLDS,
      };
    }
    if (choice === "visa") {
      return {
        action: "act",
        path: "visa",
        reason: "visa_from_kb",
        thresholds: THRESHOLDS,
      };
    }
    if (choice === "prices") {
      return {
        action: "act",
        path: "prices",
        reason: "intent_high",
        thresholds: THRESHOLDS,
      };
    }
    if (choice === "greeting") {
      return {
        action: "act",
        path: "greeting",
        reason: "intent_high",
        thresholds: THRESHOLDS,
      };
    }
    return {
      action: "off_topic",
      path: "off",
      reason: "intent_other",
      thresholds: THRESHOLDS,
    };
  }

  if (
    confidence >= THRESHOLDS.intentSlotsLow &&
    HOTEL_OR_PRICES.has(choice) &&
    hasSlotHint
  ) {
    return {
      action: "collect_slots",
      path: "hotel",
      reason: "mid_intent_with_city_or_date",
      thresholds: THRESHOLDS,
    };
  }

  return {
    action: "ask_buttons",
    path: HOTEL_OR_PRICES.has(choice) ? "hotel" : choice || "unknown",
    reason:
      confidence < THRESHOLDS.intentSlotsLow
        ? "intent_below_0.40"
        : "ambiguous_without_slot",
    thresholds: THRESHOLDS,
  };
}
