/**
 * Visa answers come only from the checked knowledge base.
 * Jev may classify country/topic; it never writes this text.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_KB = path.resolve(HERE, "../../db/visa-rules.json");

export const CITIZENSHIP = "TJ";

export const DEST_TO_COUNTRY = {
  uae: "AE",
  turkey: "TR",
  egypt: "EG",
  AE: "AE",
  TR: "TR",
  EG: "EG",
};

export const COUNTRY_LABEL = {
  AE: { ru: "ОАЭ", tg: "Имороти Муттаҳидаи Араб" },
  TR: { ru: "Турция", tg: "Туркия" },
  EG: { ru: "Египет", tg: "Миср" },
};

const VISA_TYPES = ["tourist", "transit", "visa-free", "on-arrival", "e-visa"];

let cached = null;

export function loadVisaKb(filePath = DEFAULT_KB) {
  if (cached && filePath === DEFAULT_KB) {
    return cached;
  }
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const kb = {
    citizenship: raw.citizenship || CITIZENSHIP,
    checked_at: raw.checked_at,
    valid_until: raw.valid_until,
    disclaimer_ru: raw.disclaimer_ru,
    disclaimer_tg: raw.disclaimer_tg,
    rules: Array.isArray(raw.rules) ? raw.rules : [],
  };
  if (filePath === DEFAULT_KB) {
    cached = kb;
  }
  return kb;
}

export function resetVisaKbCache() {
  cached = null;
}

export function looksTajik(text) {
  const raw = String(text || "");
  if (/[қӯғҳҷӣҚӮҒҲҶӢ]/.test(raw)) {
    return true;
  }
  return /раводид|шиноснома|тоҷикистон|точикистон|лозим аст|шаҳрванд|шахрванд/i.test(raw);
}

export function mapDestination(value) {
  if (!value) {
    return null;
  }
  const key = String(value).trim();
  const lower = key.toLowerCase();
  if (DEST_TO_COUNTRY[key]) {
    return DEST_TO_COUNTRY[key];
  }
  if (DEST_TO_COUNTRY[lower]) {
    return DEST_TO_COUNTRY[lower];
  }
  return null;
}

export function extractVisaType(text, visaAnswers = {}) {
  if (visaAnswers.is_transit?.choice === "yes" || visaAnswers.is_transit?.noul > 0.7) {
    return "transit";
  }
  const topic = visaAnswers.visa_topic?.choice;
  if (topic === "transit") {
    return "transit";
  }
  const raw = String(text || "");
  if (/транзит|transit|пересадк|транзитгоҳ|транзитгох/i.test(raw)) {
    return "transit";
  }
  if (/е-?виз|e-?visa|электронн\w*\s+виз|раводиди электрон/i.test(raw)) {
    return "e-visa";
  }
  if (/по прибыт|по прилёт|по прилет|on arrival|в аэропорт\w* виз|раводид дар фурудгоҳ/i.test(raw)) {
    return "on-arrival";
  }
  if (/без виз|visa-?free|виза не нужн|раводид лозим нест|бе раводид/i.test(raw)) {
    return "visa-free";
  }
  return "tourist";
}

export function asksForVisaService(text, visaAnswers = {}) {
  if (Number(visaAnswers.asks_for_service?.noul ?? 0) > 0.7) {
    return true;
  }
  return /оформ(и|ьте|ить).*виз|сделайте виз|подайте.*виз|раводид.*оред|закажите виз/i.test(
    String(text || ""),
  );
}

function isExpired(record, now) {
  if (!record?.valid_until) {
    return false;
  }
  return String(record.valid_until) < now.toISOString().slice(0, 10);
}

export function lookupVisa({
  country,
  citizenship = CITIZENSHIP,
  visaType = "tourist",
  now = new Date(),
  kb = null,
} = {}) {
  const store = kb || loadVisaKb();
  const iso = mapDestination(country);
  const type = VISA_TYPES.includes(visaType) ? visaType : "tourist";
  if (!iso) {
    return { kind: "need_country", record: null, expired: false };
  }
  const record = store.rules.find(
    (row) =>
      row.country === iso &&
      row.citizenship === citizenship &&
      row.visa_type === type,
  );
  if (!record) {
    return { kind: "gap", country: iso, visaType: type, record: null, expired: false };
  }
  const expired = isExpired(record, now);
  return {
    kind: expired ? "stale" : "ok",
    country: iso,
    visaType: type,
    record,
    expired,
  };
}

function fieldLine(label, value, lang) {
  if (value === null || value === undefined || value === "") {
    return lang === "tg"
      ? `${label}: дар манбаи расмӣ нест (холӣ).`
      : `${label}: в официальном источнике нет (пусто).`;
  }
  return `${label}: ${value}`;
}

export function formatVisaReply(hit, { text = "", visaAnswers = {}, lang = null } = {}) {
  const kb = loadVisaKb();
  const useTg = lang === "tg" || (lang == null && looksTajik(text));
  const disclaimer = useTg ? kb.disclaimer_tg : kb.disclaimer_ru;
  const serviceNote = asksForVisaService(text, visaAnswers)
    ? useTg
      ? "Мо раводид намеорем ва дархост намефиристем. Танҳо маълумоти санҷидашуда."
      : "Мы не оформляем визу и не подаём заявление за вас. Только проверенная справка."
    : null;

  if (hit.kind === "need_country") {
    return {
      text: [
        useTg
          ? "Ба кадом кишвар? ИМА, Туркия ё Миср — тугмаро пахш кунед."
          : "В какую страну? ОАЭ, Турция или Египет — нажмите кнопку.",
        disclaimer,
      ].join("\n\n"),
      askCountry: true,
      handoff: false,
    };
  }

  if (hit.kind === "gap" || !hit.record) {
    return {
      text: [
        useTg
          ? "Барои ин кишвар ё намуди раводид сабти санҷидашуда ҳанӯз нест. Ба оператор медиҳам."
          : "По этой стране или типу визы проверенной записи ещё нет. Передаю оператору.",
        disclaimer,
      ].join("\n\n"),
      askCountry: false,
      handoff: true,
      gap: true,
    };
  }

  const rec = hit.record;
  const label = COUNTRY_LABEL[rec.country]?.[useTg ? "tg" : "ru"] || rec.country;
  const notes = useTg ? rec.notes_tg : rec.notes_ru;
  const stale = hit.expired
    ? useTg
      ? `Муҳлати сабт гузаштааст (то ${rec.valid_until}). Тавре ки дар санаи ${rec.checked_at} санҷида будем, мегӯем ва операторро ҷалб мекунем — қоидаҳо метавонанд иваз шуда бошанд.`
      : `Срок записи истёк (до ${rec.valid_until}). Отвечаю по проверке ${rec.checked_at} и зову оператора — правила могли измениться.`
    : null;

  const lines = [
    useTg ? `${label}, шаҳрвандии Тоҷикистон, ${rec.visa_type}.` : `${label}, гражданство Таджикистан, ${rec.visa_type}.`,
    notes,
    fieldLine(useTg ? "Раводид лозим" : "Виза нужна", rec.required ? (useTg ? "ҳа" : "да") : (useTg ? "не / вобаста ба шарт" : "нет / зависит от условия"), useTg ? "tg" : "ru"),
    fieldLine(useTg ? "Ҳуҷҷатҳо" : "Документы", rec.documents, useTg ? "tg" : "ru"),
    fieldLine(useTg ? "Рӯзҳои иқомат" : "Дней пребывания", rec.stay_days, useTg ? "tg" : "ru"),
    fieldLine(useTg ? "Рӯзҳои баррасӣ" : "Дней обработки", rec.processing_days, useTg ? "tg" : "ru"),
    fieldLine(useTg ? "Пардохт" : "Сбор", rec.fee, useTg ? "tg" : "ru"),
    rec.apply_url ? `${useTg ? "Дархост" : "Подача"}: ${rec.apply_url}` : null,
    `${useTg ? "Санҷида шуд" : "Проверено"}: ${rec.checked_at}. ${useTg ? "Эътибор то" : "Действительно до"}: ${rec.valid_until}.`,
    `${useTg ? "Манбаъ" : "Источник"}: ${rec.source_url}`,
    stale,
    serviceNote,
    disclaimer,
  ].filter(Boolean);

  return {
    text: lines.join("\n"),
    askCountry: false,
    handoff: Boolean(hit.expired),
    gap: false,
    stale: Boolean(hit.expired),
    record: rec,
  };
}

export function answerVisa({
  country,
  visaType,
  text = "",
  visaAnswers = {},
  now = new Date(),
  kb = null,
} = {}) {
  const type = visaType || extractVisaType(text, visaAnswers);
  const hit = lookupVisa({ country, visaType: type, now, kb });
  const formatted = formatVisaReply(hit, { text, visaAnswers });
  return { ...hit, ...formatted, visaType: type };
}
