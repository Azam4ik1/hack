/**
 * Dialog core: scenarios, rules, slot collection. Jev is a sensor only.
 */

import { decide } from "./decide.js";
import { extract, isOperatorEscape, looksLikeSecret, mergeSlots, missingSlot, slotsComplete } from "./extract.js";
import { env } from "./env.js";
import { judgeMessage, visaMessage as defaultVisaMessage } from "./index.js";
import { logDecision } from "./log.js";
import {
  emptySlots,
  getOperatorChatId,
  getSession,
  logDialog,
  queueOperator,
  resetSession,
  saveLead,
  saveSession,
  setOperatorChatId,
  logVisaGap,
} from "./store.js";
import { answerVisa, loadVisaKb, mapDestination } from "./visa.js";

export const MENU_KEYBOARD = {
  inline_keyboard: [
    [{ text: "Подобрать жильё", callback_data: "menu:hotel" }],
    [{ text: "Виза (справка)", callback_data: "menu:visa" }],
    [{ text: "Цены и условия", callback_data: "menu:prices" }],
    [{ text: "Оператор", callback_data: "menu:operator" }],
  ],
};

const DEST_KEYBOARD = {
  inline_keyboard: [
    [
      { text: "ОАЭ", callback_data: "dest:uae" },
      { text: "Турция", callback_data: "dest:turkey" },
    ],
    [
      { text: "Египет", callback_data: "dest:egypt" },
      { text: "Другое", callback_data: "dest:other" },
    ],
    [{ text: "Оператор", callback_data: "menu:operator" }],
  ],
};

const VISA_DEST_KEYBOARD = {
  inline_keyboard: [
    [
      { text: "ОАЭ", callback_data: "visa-dest:uae" },
      { text: "Турция", callback_data: "visa-dest:turkey" },
    ],
    [
      { text: "Египет", callback_data: "visa-dest:egypt" },
      { text: "Оператор", callback_data: "menu:operator" },
    ],
  ],
};

const BUDGET_KEYBOARD = {
  inline_keyboard: [
    [
      { text: "Эконом", callback_data: "budget:low" },
      { text: "Средний", callback_data: "budget:mid" },
    ],
    [
      { text: "Люкс", callback_data: "budget:high" },
      { text: "Не важно", callback_data: "budget:unspecified" },
    ],
    [{ text: "Оператор", callback_data: "menu:operator" }],
  ],
};

function reply(text, extras = {}) {
  return { text, ...extras };
}

function withMenu(text) {
  return reply(text, { reply_markup: MENU_KEYBOARD });
}

function welcome() {
  return withMenu(
    "Салом. Я ArzonTur — консультант по жилью за границей для поездок из Таджикистана.\n\nСейчас подбираем заявки в ОАЭ, Турцию и Египет. Бронирующую ссылку пока не даём: партнёрство TAAP ещё не одобрено. Паспорт и номер карты не нужны. Визовая справка — из проверенной базы, это не агентство и не консульство.\n\nНапишите, куда хотите поехать, или нажмите кнопку. В любой момент — «оператор».",
  );
}

export function operatorCopy() {
  return "Передал оператору. Напишите ещё что нужно передать — или /start, чтобы вернуться в меню.";
}

export function helpCopy() {
  return withMenu(
    "ArzonTur собирает заявки на жильё за границей (ОАЭ, Турция, Египет). Ссылку Booking/TAAP пока не даём.\n\nКнопки меню или напишите город и даты. Жалобы и слово «оператор» сразу человеку.\n\nВизовая справка берётся из базы с датой проверки — это не агентство и не консульство.\n\nArzonTur дархости манзилро ҷамъ мекунад. «оператор» нависед — инсон ҷавоб медиҳад.",
  );
}

export function operatorClaimCopy() {
  return "Этот чат назначен операторским. Спорные диалоги и заявки будут приходить сюда. Клиентское меню: /start без кода.";
}

function pricesCopy() {
  return withMenu(
    "По ценам и условиям: комиссию сверху цены отеля мы не добавляем. Пока TAAP не одобрен, ссылку на бронь не отправляем — оставляем заявку, и человек свяжется.\n\nОтмена и питание зависят от конкретного отеля. Могу собрать заявку на жильё.",
  );
}

async function continueVisa(session, ctx, judged, deps = {}) {
  session.mode = "visa";
  const extracted = extract(ctx.text || "");
  session.slots = mergeSlots(session.slots, extracted, judged?.answers || {});
  saveSession(session);

  let visaAnswers = judged?.visaAnswers || {};
  const askVisa = deps.visaMessage || defaultVisaMessage;
  if (ctx.text && !ctx.callbackData) {
    try {
      const vm = await askVisa(ctx.text);
      visaAnswers = vm.answers || {};
    } catch {
      visaAnswers = {};
    }
  }

  const destRaw =
    session.slots.destination ||
    judged?.answers?.destination?.choice ||
    extracted.destination ||
    null;
  const country = mapDestination(destRaw);
  if (!country && destRaw && destRaw !== "unnamed") {
    logVisaGap({
      country: destRaw,
      citizenship: "TJ",
      visaType: null,
      question: ctx.text || null,
      chatId: session.chatId,
    });
    const handed = await handoff(session, ctx, "visa_gap", judged);
    const kb = loadVisaKb();
    const useTg = ctx.text && /[қӯғҳҷӣҚӮҒҲҶӢ]/.test(ctx.text);
    const unsupported = useTg
      ? `Барои ин кишвар сабти санҷидашуда нест. Ба оператор медиҳам.\n\n${kb.disclaimer_tg}`
      : `По этой стране проверенной записи нет. Передаю оператору.\n\n${kb.disclaimer_ru}`;
    return {
      replies: [withMenu(unsupported), ...handed.replies],
      notify: handed.notify,
      session: handed.session,
    };
  }
  const result = answerVisa({
    country,
    text: ctx.text || "",
    visaAnswers,
  });

  if (result.askCountry) {
    return {
      replies: [reply(result.text, { reply_markup: VISA_DEST_KEYBOARD })],
      session,
    };
  }
  if (result.gap) {
    logVisaGap({
      country: result.country || null,
      citizenship: "TJ",
      visaType: result.visaType || null,
      question: ctx.text || null,
      chatId: session.chatId,
    });
  }
  if (result.handoff) {
    const handed = await handoff(session, ctx, result.stale ? "visa_stale" : "visa_gap", judged);
    return {
      replies: [withMenu(result.text), ...handed.replies],
      notify: handed.notify,
      session: handed.session,
    };
  }
  return { replies: [withMenu(result.text)], session };
}

function askMissing(slot) {
  if (slot === "destination") {
    return reply("Куда едете?", { reply_markup: DEST_KEYBOARD });
  }
  if (slot === "dates") {
    return withMenu("На какие даты? Напишите заезд и выезд, например: 12–18 октября.");
  }
  if (slot === "people") {
    return withMenu("Сколько человек едет? Взрослые и дети.");
  }
  if (slot === "budget") {
    return reply("Какой бюджет за ночь?", { reply_markup: BUDGET_KEYBOARD });
  }
  return withMenu("Уточните, пожалуйста.");
}

function leadSummary(slots) {
  return [
    "Заявка сохранена. Ссылку Booking/TAAP пока не даём.",
    `Направление: ${slots.city || slots.destination}`,
    `Даты: ${slots.dates}`,
    `Гости: ${slots.people}`,
    `Бюджет: ${slots.budget || slots.budgetLevel}`,
    "Оператор свяжется. /start — новое обращение. Паспорт и карту не присылайте.",
  ].join("\n");
}

async function handoff(session, ctx, reason, judged) {
  session.handedOff = true;
  session.mode = "operator";
  saveSession(session);
  queueOperator({
    chatId: session.chatId,
    username: ctx.username || null,
    reason,
    text: ctx.text || null,
    judged: judged
      ? {
          action: judged.decision?.action,
          path: judged.decision?.path,
          intent: judged.answers?.intent,
          to_human: judged.answers?.to_human,
        }
      : null,
  });
  if (!judged) {
    logDecision({
      message: ctx.text || "",
      chatId: session.chatId,
      answers: null,
      decision: { action: "operator", path: "human", reason },
    });
  }
  const operatorId = ctx.operatorChatId || getOperatorChatId() || null;
  const notify = [];
  if (operatorId) {
    notify.push({
      chatId: operatorId,
      text: `Новый диалог для оператора (${reason})\nfrom=${session.chatId} @${ctx.username || "-"}\n${ctx.text || ""}`.slice(0, 3500),
    });
  }
  return {
    replies: [reply(operatorCopy())],
    notify,
    session,
  };
}

function finishLead(session, ctx, judged) {
  const lead = saveLead({
    chatId: session.chatId,
    username: ctx.username || null,
    slots: session.slots,
    lead_score: judged?.answers?.lead_score?.score ?? null,
    source_text: ctx.text || null,
  });
  session.mode = "idle";
  session.slots = emptySlots();
  saveSession(session);
  return {
    replies: [withMenu(leadSummary(lead.slots))],
    session,
  };
}

function continueHotel(session, ctx, judged) {
  session.mode = "hotel";
  const extracted = extract(ctx.text || "");
  session.slots = mergeSlots(session.slots, extracted, judged?.answers || {});
  saveSession(session);
  if (slotsComplete(session.slots)) {
    return finishLead(session, ctx, judged);
  }
  return {
    replies: [askMissing(missingSlot(session.slots))],
    session,
  };
}

export async function handleTurn(ctx, deps = {}) {
  const judge = deps.judgeMessage || judgeMessage;
  const session = getSession(ctx.chatId);
  const text = normalizeIncoming(ctx);
  logDialog({ chatId: session.chatId, direction: "in", text, callback: ctx.callbackData || null });

  const claimed = tryClaimOperator(ctx, text);
  if (claimed) {
    return claimed;
  }

  if (ctx.callbackData === "menu:operator" || (text && isOperatorEscape(text))) {
    return handoff(session, { ...ctx, text: text || "оператор" }, "operator_escape", null);
  }

  if (/^\/help(?:@\w+)?$/i.test(text || "")) {
    return { replies: [helpCopy()], session };
  }

  if (text === "/start" || /^\/start(?:@\w+)?(?:\s|$)/i.test(text || "") || /^меню$/i.test(text || "")) {
    resetSession(ctx.chatId);
    return { replies: [welcome()], session: getSession(ctx.chatId) };
  }

  if (looksLikeSecret(text)) {
    return {
      replies: [withMenu("Не присылайте номера карт и паспортов. Они нам не нужны.")],
      session,
    };
  }

  if (ctx.callbackData) {
    return handleCallback(session, ctx, judge, deps);
  }

  if (session.handedOff && session.mode === "operator") {
    queueOperator({
      chatId: session.chatId,
      username: ctx.username || null,
      reason: "followup",
      text,
    });
    const operatorId = ctx.operatorChatId || getOperatorChatId() || null;
    const notify = [];
    if (operatorId && String(operatorId) !== String(session.chatId)) {
      notify.push({
        chatId: operatorId,
        text: `Дополнение от клиента ${session.chatId} @${ctx.username || "-"}\n${text || ""}`.slice(0, 3500),
      });
    }
    return {
      replies: [reply("Передал оператору.")],
      notify,
      session,
    };
  }

  if (session.mode === "visa" && text) {
    let judged = null;
    try {
      const extracted = extract(text);
      judged = await judge(text, {
        city: extracted.city || session.slots.city,
        date: extracted.dates || session.slots.dates,
      }, { chatId: session.chatId });
      if (judged.decision.action === "operator") {
        return handoff(session, ctx, judged.decision.reason, judged);
      }
      if (judged.decision.path === "hotel" || judged.decision.action === "collect_slots") {
        return continueHotel(session, ctx, judged);
      }
    } catch {
      judged = null;
    }
    return continueVisa(session, ctx, judged, deps);
  }

  if (session.mode === "hotel" && text) {
    let judged = null;
    try {
      const extracted = extract(text);
      judged = await judge(text, {
        city: extracted.city || session.slots.city,
        date: extracted.dates || session.slots.dates,
      }, { chatId: session.chatId });
      if (judged.decision.action === "operator") {
        return handoff(session, ctx, judged.decision.reason, judged);
      }
    } catch {
      judged = null;
    }
    return continueHotel(session, ctx, judged);
  }

  let judged;
  try {
    const extracted = extract(text || "");
    judged = await judge(text || "", {
      city: extracted.city || session.slots.city,
      date: extracted.dates || session.slots.dates,
    }, { chatId: session.chatId });
  } catch {
    return {
      replies: [
        withMenu(
          "Сейчас не получилось понять сообщение автоматически. Выберите пункт меню — бот работает и без этого.",
        ),
      ],
      session,
      fallback: true,
    };
  }

  if (judged.decision.action === "operator") {
    return handoff(session, ctx, judged.decision.reason, judged);
  }

  if (judged.decision.path === "hotel" || judged.decision.action === "collect_slots") {
    return continueHotel(session, ctx, judged);
  }
  if (judged.decision.path === "prices") {
    return { replies: [pricesCopy()], session };
  }
  if (judged.decision.path === "visa") {
    return continueVisa(session, ctx, judged, deps);
  }
  if (judged.decision.path === "greeting") {
    return { replies: [welcome()], session };
  }
  return {
    replies: [
      withMenu("Не уверен, что нужно. Можно подобрать жильё, спросить про условия или позвать оператора."),
    ],
    session,
  };
}

function tryClaimOperator(ctx, text) {
  const match = String(text || "").trim().match(/^\/start(?:@\w+)?(?:\s+(\S+))?$/i);
  if (!match || !match[1]) {
    return null;
  }
  const token = env("OPERATOR_CLAIM_TOKEN");
  if (!token) {
    return null;
  }
  const payload = match[1];
  if (payload !== token && payload !== `op_${token}`) {
    return null;
  }
  const existing = getOperatorChatId();
  if (existing && existing !== String(ctx.chatId)) {
    return {
      replies: [withMenu("Оператор уже назначен в другом чате. Это клиентское меню.")],
      session: getSession(ctx.chatId),
    };
  }
  setOperatorChatId(ctx.chatId, ctx.username || null);
  return {
    replies: [reply(operatorClaimCopy())],
    session: getSession(ctx.chatId),
    claimedOperator: true,
  };
}

function normalizeIncoming(ctx) {
  if (ctx.callbackData) {
    return "";
  }
  return String(ctx.text || "").trim();
}

async function handleCallback(session, ctx, judge, deps = {}) {
  const data = ctx.callbackData;
  if (data === "menu:hotel") {
    session.mode = "hotel";
    saveSession(session);
    return continueHotel(session, { ...ctx, text: "" }, null);
  }
  if (data === "menu:visa") {
    session.mode = "visa";
    saveSession(session);
    return continueVisa(session, { ...ctx, text: "" }, null, deps);
  }
  if (data === "menu:prices") {
    session.mode = "idle";
    saveSession(session);
    return { replies: [pricesCopy()], session };
  }
  if (data.startsWith("visa-dest:")) {
    const dest = data.slice("visa-dest:".length);
    session.slots.destination = dest;
    session.mode = "visa";
    saveSession(session);
    return continueVisa(session, { ...ctx, text: "" }, null, deps);
  }
  if (data.startsWith("dest:")) {
    const dest = data.slice(5);
    session.slots.destination = dest;
    if (dest !== "other") {
      session.slots.city = session.slots.city || dest;
    }
    session.mode = "hotel";
    saveSession(session);
    return continueHotel(session, { ...ctx, text: "" }, null);
  }
  if (data.startsWith("budget:")) {
    session.slots.budgetLevel = data.slice(7);
    session.slots.budget = session.slots.budget || session.slots.budgetLevel;
    session.mode = "hotel";
    saveSession(session);
    return continueHotel(session, { ...ctx, text: "" }, null);
  }
  void judge;
  return { replies: [withMenu("Выберите пункт меню.")], session };
}

export { decide, isOperatorEscape, missingSlot, slotsComplete };
