/**
 * Jev question sets for the TAAP consultant.
 * Visa path questions are intentionally omitted; `visa` is only an intent label.
 */

export const ROUTING_KEYS = ["intent", "destination", "to_human", "lead_score"];
export const HOTEL_KEYS = ["slots_complete", "budget_level", "flexible_dates"];
export const QUESTION_KEYS = [...ROUTING_KEYS, ...HOTEL_KEYS];

/** Step 1 — asked on every message. */
export const ROUTING_QUESTIONS = {
  intent: {
    type: "choice",
    instructions:
      "What is the main kind of request in `message`? The text may be Russian or Tajik. Pick one.",
    criteria: {
      hotel:
        "The client wants to find, compare, or book a place to stay (hotel, apartment, room). They talk about a trip stay, not about a visa.",
      visa:
        "The client asks about a visa, entry stamp, visa documents, refusal, or extension — not about choosing a hotel.",
      prices:
        "The client asks about rates, service commission, how payment works, or booking terms, without asking to pick a specific hotel.",
      complaint:
        "Complaint, refund demand, accusation of fraud, a failed booking blamed on us, or hostility toward the service.",
      greeting:
        "Greeting, thanks, or a short acknowledgement (ok, хорошо) with no new task.",
      other:
        "Off-topic, or it is not a hotel, visa, prices, complaint, or greeting request.",
    },
  },
  destination: {
    type: "choice",
    instructions:
      "Which travel country is named in `message`? A city counts as its country. If several are named, pick the main one.",
    criteria: {
      uae: "UAE / ОАЭ: Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, or the country as a whole.",
      turkey:
        "Turkey / Турция: Istanbul, Antalya, Alanya, Kemer, Bodrum, or the country as a whole.",
      egypt:
        "Egypt / Египет: Hurghada, Sharm el-Sheikh, Cairo, Dahab, or the country as a whole.",
      unnamed: "No country or city is named.",
      other: "A country is named, but it is not UAE, Turkey, or Egypt.",
    },
  },
  to_human: {
    type: "noul",
    instructions:
      "Should `message` be handed to a live operator right now instead of continuing the bot scenario?",
    criteria: {
      true:
        "Explicit ask for an operator, a real complaint, a threat, panic, or the bot cannot help.",
      false:
        "An ordinary question the bot can route, answer later from data, or clarify with buttons. Calm price questions are false.",
    },
  },
  lead_score: {
    type: "score",
    instructions:
      "How close is the client in `message` to sending a housing request through this service? Visa questions are not a purchase.",
    criteria: [
      "Not about a trip: greeting, off-topic, or a complaint unrelated to booking now.",
      "General info or visa; no dates and no ask to book housing.",
      "Named a destination or dates and is still choosing; does not ask to book yet.",
      "Wants to leave a request or get a booking link now.",
    ],
  },
};

/** Step 3 — housing. Consumed when routing points at hotel or prices. */
export const HOTEL_QUESTIONS = {
  slots_complete: {
    type: "noul",
    instructions:
      "If `message` is about finding a place to stay: does it already have enough of destination, dates, and guest count to search? Budget is optional.",
    criteria: {
      true:
        "A destination (city or country) and dates are present, and guest count or family/solo is clear.",
      false:
        "Destination, dates, or who is travelling is missing, or the message is not about housing search.",
    },
  },
  budget_level: {
    type: "score",
    instructions: "What housing budget level is expressed in `message`?",
    criteria: [
      "No budget is named or implied.",
      "Cheap / economy / hostel / the cheapest option.",
      "Mid-range ordinary hotel, no extremes.",
      "Luxury, 5-star, expensive, or price does not matter.",
    ],
  },
  flexible_dates: {
    type: "noul",
    instructions: "Does `message` say the travel dates are flexible?",
    criteria: {
      true:
        "The client clearly can move dates (plus/minus days, «примерно», «не принципиально»).",
      false:
        "Dates are fixed, dates are absent, or flexibility is not stated.",
    },
  },
};

export const ALL_QUESTIONS = {
  ...ROUTING_QUESTIONS,
  ...HOTEL_QUESTIONS,
};
