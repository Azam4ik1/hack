/**
 * Dialog core: scenarios, rules, slot collection. Jev is a sensor only.
 */

import { decide } from "./decide.js";
import { extract, isOperatorEscape, looksLikeSecret, mergeSlots, missingSlot, slotsComplete } from "./extract.js";
import { judgeMessage } from "./index.js";
import { logDecision } from "./log.js";
import { emptySlots, getSession, logDialog, queueOperator, resetSession, saveLead, saveSession } from "./store.js";

export const MENU_KEYBOARD = {
  inline_keyboard: [
    [{ text: "Подобрать жильё", callback_data: "menu:hotel" }],
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
    "Салом. Я ArzonTur — консультант по жилью за границей для поездок из Таджикистана.\n\nСейчас подбираем заявки в ОАЭ, Турцию и Египет. Бронирующую ссылку пока не даём: партнёрство TAAP ещё не одобрено. Паспорт и номер карты не нужны.\n\nНапишите, куда хотите поехать, или нажмите кнопку. В любой момент — «оператор».",
  );
}

export function operatorCopy() {
  return "Передал оператору. Напишите ещё что нужно передать — или /start, чтобы вернуться в меню.";
}

function pricesCopy() {
  return withMenu(
    "По ценам и условиям: комиссию сверху цены отеля мы не добавляем. Пока TAAP не одобрен, ссылку на бронь не отправляем — оставляем заявку, и человек свяжется.\n\nОтмена и питание зависят от конкретного отеля. Могу собрать заявку на жильё.",
  );
}

function visaDeferred() {
  return withMenu(
    "Визовая справка в боте ещё не подключена — факты должны идти из проверенной базы, не из модели. Это не визовое агентство и не консульство.\n\nМогу подобрать жильё или передать оператору.",
  );
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
  const operatorId = ctx.operatorChatId;
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

  if (ctx.callbackData === "menu:operator" || (text && isOperatorEscape(text))) {
    return handoff(session, { ...ctx, text: text || "оператор" }, "operator_escape", null);
  }

  if (text === "/start" || /^\/start\b/i.test(text || "") || /^меню$/i.test(text || "")) {
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
    return handleCallback(session, ctx, judge);
  }

  if (session.handedOff && session.mode === "operator") {
    queueOperator({
      chatId: session.chatId,
      username: ctx.username || null,
      reason: "followup",
      text,
    });
    return {
      replies: [reply("Передал оператору.")],
      session,
    };
  }

  if (session.mode === "hotel" && text) {
    let judged = null;
    try {
      const extracted = extract(text);
      judged = await judge(text, {
        city: extracted.city || session.slots.city,
        date: extracted.dates || session.slots.dates,
      });
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
    });
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
    return { replies: [visaDeferred()], session };
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

function normalizeIncoming(ctx) {
  if (ctx.callbackData) {
    return "";
  }
  return String(ctx.text || "").trim();
}

async function handleCallback(session, ctx, judge) {
  const data = ctx.callbackData;
  if (data === "menu:hotel") {
    session.mode = "hotel";
    saveSession(session);
    return continueHotel(session, { ...ctx, text: "" }, null);
  }
  if (data === "menu:prices") {
    session.mode = "idle";
    saveSession(session);
    return { replies: [pricesCopy()], session };
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
