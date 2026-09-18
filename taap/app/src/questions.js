/**
 * Jev question sets for the TAAP consultant.
 * Visa answers are never generated here — only labels for a DB lookup.
 */

export const ROUTING_KEYS = ["intent", "destination", "to_human", "lead_score"];
export const HOTEL_KEYS = ["slots_complete", "budget_level", "flexible_dates"];
export const VISA_KEYS = ["visa_topic", "is_transit", "asks_for_service"];
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
        "The client asks about hotel or booking prices, commission, how to pay, breakfast-in-rate, cancellation or refund *policy* — without a story that a booking already failed. Not a currency exchange rate, and not a request to pick a specific hotel.",
      complaint:
        "Complaint, refund demand after a failed or missing booking, accusation of fraud, hostility toward the service, or anger that the bot is looping / sending templates and they want a human. A single-word «оператор» with no grievance is other, not complaint.",
      greeting:
        "Greeting, thanks, or a short acknowledgement. Also a hello plus generic «I need help» / «кумак лозим аст» with no hotel, visa, price, or complaint details. If they greet and then ask for a hotel, that is hotel, not greeting.",
      other:
        "Off-topic: currency rates, weather, sports, news, politics, or a bare «оператор» / transfer-to-human with no complaint about a booking.",
    },
  },
  destination: {
    type: "choice",
    instructions:
      "Which travel country is named in `message`? A city counts as its country. If several trip countries are named, pick the main one. Ignore the client's home country (Tajikistan / Тоҷикистон) and citizenship; those are not the destination. If only home or payment currency is named, choose unnamed.",
    criteria: {
      uae: "UAE / ОАЭ: Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, or the country as a whole.",
      turkey:
        "Turkey / Турция: Istanbul, Antalya, Alanya, Kemer, Bodrum, or the country as a whole.",
      egypt:
        "Egypt / Египет: Hurghada, Sharm el-Sheikh, Cairo, Dahab, or the country as a whole.",
      germany:
        "Germany / Германия: Berlin, Frankfurt, Munich, or the country as a whole.",
      unnamed: "No country or city is named.",
      other: "A country is named, but it is not UAE, Turkey, Egypt, or Germany.",
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
      "How close is the client in `message` to sending a housing booking request through this service? Visa questions are not a purchase. Level 1 is farthest from a booking; level 5 is ready to book now.",
    criteria: [
      "Far from booking: greeting, off-topic, or a complaint — no request to stay somewhere.",
      "General info or a visa question; not asking to pick or book a stay.",
      "Named a destination or is exploring a stay, but is not ready to book.",
      "Has several trip details (place, dates, or people) and is close to a request, but does not yet ask to book.",
      "Ready to book or explicitly asks to reserve / send a booking link now.",
    ],
  },
};

/** Step 3 — housing. Consumed when routing points at hotel or prices. */
export const HOTEL_QUESTIONS = {
  slots_complete: {
    type: "noul",
    instructions:
      "If `message` is about finding a place to stay: does it already contain destination, dates, number of people, AND a budget — all four?",
    criteria: {
      true:
        "Destination (city or country), dates, guest count, and a budget are all present.",
      false:
        "Any of destination, dates, guests, or budget is missing, or the message is not a housing search.",
    },
  },
  budget_level: {
    type: "score",
    instructions: "What housing budget level is expressed in `message`?",
    criteria: [
      "No budget is named or implied.",
      "Cheap / economy / hostel / the cheapest option (low).",
      "Mid-range ordinary hotel, no extremes (mid).",
      "Luxury, 5-star, expensive, or price does not matter (high).",
    ],
  },
  flexible_dates: {
    type: "choice",
    instructions: "Are the travel dates in `message` flexible?",
    criteria: {
      yes: "The client clearly can move dates (plus/minus days, «примерно», «санаҳояшро тағйир»).",
      no: "Exact or fixed dates are given and flexibility is not offered.",
      unspecified: "Dates are absent, or flexibility is not stated.",
    },
  },
};

/** Visa path only — classifier, not the answer text. */
export const VISA_QUESTIONS = {
  visa_topic: {
    type: "choice",
    instructions:
      "If `message` is about a visa or entry stamp, which subtopic is it? Russian or Tajik. Pick one.",
    criteria: {
      needed:
        "Asks whether a visa is required at all, visa-free, or visa on arrival.",
      documents: "Asks which documents, photos, insurance, or bookings are needed for a visa.",
      timing: "Asks how long a visa takes, processing days, or when to apply.",
      fee: "Asks the visa price, consular fee, or how to pay for a visa.",
      transit: "Asks about airport transit, layover, or changing planes without entering the city.",
      refusal: "Asks about a visa refusal, denial, or ban.",
      extension: "Asks about extending a stay or a visa already issued.",
      other: "Visa-related but none of the topics above, or not a visa question.",
    },
  },
  is_transit: {
    type: "noul",
    instructions: "Is `message` specifically about airport transit / layover rather than a stay in the country?",
    criteria: {
      true: "The client only wants to change planes or remain airside.",
      false: "They plan to enter the country, stay in a city, or the message is not about transit.",
    },
  },
  asks_for_service: {
    type: "noul",
    instructions:
      "Is the client asking this bot to apply for, buy, or file a visa on their behalf?",
    criteria: {
      true: "They want us to submit a visa application, get them a stamp, or act as a visa agency.",
      false: "They only want information, a checklist, or a link to an official site.",
    },
  },
};

export const ALL_QUESTIONS = {
  ...ROUTING_QUESTIONS,
  ...HOTEL_QUESTIONS,
};
