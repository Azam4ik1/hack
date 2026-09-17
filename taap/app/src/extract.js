/**
 * Facts the bot extracts in code — dates, cities, guests, budget.
 * Jev does not parse these.
 */

const CITY_TO_DEST = [
  { dest: "uae", re: /(?:^|[^\p{L}])(дуба[йеюя]|dubai|абу[-\s]?даби|abu\s?dhabi|шардж?а|sharjah|оаэ|uae|эмират)/iu },
  { dest: "turkey", re: /(?:^|[^\p{L}])(стамбул|istanbul|антал[ьяи]|antalya|алань[яа]|alanya|кемер|kemer|бодрум|bodrum|турци|turkey|туркия)/iu },
  { dest: "egypt", re: /(?:^|[^\p{L}])(хургад|hurghad|шарм|sharm|каир|cairo|египет|миср|egypt)/iu },
  { dest: "germany", re: /(?:^|[^\p{L}])(герман|germany|berlin|берлин)/iu },
];

const MONTH = "январ|феврал|март|апрел|ма[йя]|июн|июл|август|сентябр|октябр|ноябр|декабр|январ|феврал|май|июн";

export function normalizeText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isOperatorEscape(text) {
  const raw = normalizeText(text);
  if (!raw) {
    return false;
  }
  const lower = raw.toLowerCase();
  if (lower === "оператор" || lower === "operator") {
    return true;
  }
  return /(?:^|[^\p{L}])оператор(?:[^\p{L}]|$)/iu.test(raw);
}

export function looksLikeSecret(text) {
  const digits = String(text || "").replace(/\D/g, "");
  return digits.length >= 13 && digits.length <= 19;
}

export function extract(text) {
  const raw = normalizeText(text);
  const out = {
    city: null,
    destination: null,
    dates: null,
    people: null,
    budget: null,
    budgetLevel: null,
  };
  if (!raw) {
    return out;
  }

  for (const row of CITY_TO_DEST) {
    const hit = raw.match(row.re);
    if (hit) {
      out.destination = row.dest;
      out.city = hit[1] || hit[0];
      break;
    }
  }

  const range =
    raw.match(
      new RegExp(
        `(?:с|аз|заезд)?\\s*(\\d{1,2})\\s*(?:по|то|-|–|—)\\s*(\\d{1,2})\\s*(${MONTH})[а-я]*`,
        "i",
      ),
    ) ||
    raw.match(/(\d{1,2}\s*[.\/]\s*\d{1,2}(?:\s*[.\/]\s*\d{2,4})?)/) ||
    raw.match(/(\d{1,2}\s*(?:-\s*|–\s*)\d{1,2}\s+(?:декабря|января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября))/i);
  if (range) {
    out.dates = range[0].trim();
  } else if (/\b\d+\s*(ноч|шаб|дн)/i.test(raw) && /\b(октябр|ноябр|декабр|январ|август|сентябр|июн|июл|март|апрел|май)/i.test(raw)) {
    const loose = raw.match(
      new RegExp(`\\d+\\s*(?:ноч|шаб|дн)[а-я]*[^.]{0,40}(${MONTH})[а-я]*`, "i"),
    );
    if (loose) {
      out.dates = loose[0];
    }
  }

  const people =
    raw.match(/(\d+)\s*(взрослых|взросл|кас|нафар|человек|чел\b)/i) ||
    raw.match(/(двое|трое|четверо)\s+взрослых/i) ||
    raw.match(/оила\s+(\d+)\s*нафар/i) ||
    raw.match(/(\d+)\s*взрослых(?:\s*(?:и|,)?\s*реб[её]н)?/i);
  if (people) {
    out.people = people[0];
  } else if (/\b(один|1 кас|командировк)/i.test(raw)) {
    out.people = "1";
  } else if (/\b(оила|семь[яи]|реб[её]н|кӯдак|ду кӯдак)/i.test(raw)) {
    out.people = "family";
  }

  const money = raw.match(/(\d+[.,]?\d*)\s*(\$|usd|долл|евро|сомони)/i);
  if (money) {
    out.budget = money[0];
    const n = Number(String(money[1]).replace(",", "."));
    if (n > 0 && n < 80) {
      out.budgetLevel = "low";
    } else if (n >= 200) {
      out.budgetLevel = "high";
    } else {
      out.budgetLevel = "mid";
    }
  } else if (/\b(недорог|эконом|арзон|хостел|самый деш)/i.test(raw)) {
    out.budgetLevel = "low";
    out.budget = "low";
  } else if (/\b(люкс|5\s*зв|пятизв|не ограничен|budget не)/i.test(raw)) {
    out.budgetLevel = "high";
    out.budget = "high";
  } else if (/\b(миёна|средн|mid|4\s*зв)/i.test(raw)) {
    out.budgetLevel = "mid";
    out.budget = "mid";
  }

  return out;
}

export function mergeSlots(current, extracted, jevAnswers = {}) {
  const slots = { ...current };
  if (extracted.city && !slots.city) {
    slots.city = extracted.city;
  }
  if (extracted.destination && !slots.destination) {
    slots.destination = extracted.destination;
  }
  if (extracted.dates && !slots.dates) {
    slots.dates = extracted.dates;
  }
  if (extracted.people && !slots.people) {
    slots.people = extracted.people;
  }
  if (extracted.budget && !slots.budget) {
    slots.budget = extracted.budget;
  }
  if (extracted.budgetLevel && !slots.budgetLevel) {
    slots.budgetLevel = extracted.budgetLevel;
  }
  const dest = jevAnswers.destination?.choice;
  if (dest && dest !== "unnamed" && dest !== "other" && !slots.destination) {
    slots.destination = dest;
  }
  const budgetScore = jevAnswers.budget_level?.score;
  if (budgetScore !== undefined && !slots.budgetLevel) {
    const rounded = Math.round(Number(budgetScore));
    slots.budgetLevel = ["unspecified", "low", "mid", "high"][rounded] || null;
    if (slots.budgetLevel && slots.budgetLevel !== "unspecified" && !slots.budget) {
      slots.budget = slots.budgetLevel;
    }
  }
  return slots;
}

export function missingSlot(slots) {
  if (!slots.destination && !slots.city) {
    return "destination";
  }
  if (!slots.dates) {
    return "dates";
  }
  if (!slots.people) {
    return "people";
  }
  if (!slots.budget && !slots.budgetLevel) {
    return "budget";
  }
  return null;
}

export function slotsComplete(slots) {
  return missingSlot(slots) === null;
}
