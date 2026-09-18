/**
 * Public decision-layer API. Jev is a sensor; this module does not write
 * to databases, Telegram, or TAAP.
 */

import { decide } from "./decide.js";
import { systemOne, summarizeAnswers } from "./jev.js";
import { logDecision } from "./log.js";
import { ALL_QUESTIONS, HOTEL_QUESTIONS, ROUTING_QUESTIONS, VISA_QUESTIONS } from "./questions.js";

export { decide, THRESHOLDS } from "./decide.js";
export {
  ALL_QUESTIONS,
  HOTEL_KEYS,
  HOTEL_QUESTIONS,
  QUESTION_KEYS,
  ROUTING_KEYS,
  ROUTING_QUESTIONS,
  VISA_KEYS,
  VISA_QUESTIONS,
} from "./questions.js";

async function ask(message, questions) {
  const result = await systemOne({
    state: { message },
    questions,
  });
  return {
    model: result.model,
    usage: result.usage,
    latencyMs: result.latencyMs,
    answers: summarizeAnswers(result.answers),
  };
}

/** Step 1 routing only. */
export function routeMessage(message) {
  return ask(message, ROUTING_QUESTIONS);
}

/** Step 2 visa labels only. Text answers come from visa.js / the KB. */
export function visaMessage(message) {
  return ask(message, VISA_QUESTIONS);
}

/** Step 3 hotel questions only. */
export function hotelMessage(message) {
  return ask(message, HOTEL_QUESTIONS);
}

/**
 * Routing + hotel in one Jev call (speculative fan-out).
 * Code consumes hotel answers only when the path is hotel/prices.
 */
export async function judgeMessage(message, extracted = {}, meta = {}) {
  const judged = await ask(message, ALL_QUESTIONS);
  const decision = decide(judged.answers, extracted);
  const record = logDecision({
    message,
    chatId: meta.chatId || null,
    extracted,
    model: judged.model,
    usage: judged.usage,
    latencyMs: judged.latencyMs,
    answers: judged.answers,
    decision,
  });
  return {
    ...judged,
    decision,
    logTs: record.ts,
  };
}
