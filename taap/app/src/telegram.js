/**
 * Telegram Bot API helpers. Token never logged.
 */

import { env } from "./env.js";

function apiRoot() {
  const token = env("TELEGRAM_BOT_TOKEN");
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }
  return `https://api.telegram.org/bot${token}`;
}

async function call(method, payload) {
  const response = await fetch(`${apiRoot()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!data.ok) {
    const err = new Error(`Telegram ${method} failed`);
    err.status = response.status;
    throw err;
  }
  return data.result;
}

export async function getMe() {
  return call("getMe", {});
}

export async function sendMessage(chatId, reply) {
  const payload = {
    chat_id: chatId,
    text: reply.text,
    disable_web_page_preview: true,
  };
  if (reply.reply_markup) {
    payload.reply_markup = reply.reply_markup;
  }
  return call("sendMessage", payload);
}

export async function answerCallback(id) {
  try {
    await call("answerCallbackQuery", { callback_query_id: id });
  } catch {
    // ignore stale queries
  }
}

export async function setWebhook(url, secret) {
  return call("setWebhook", {
    url,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
}

export async function deleteWebhook() {
  return call("deleteWebhook", { drop_pending_updates: false });
}

export async function getWebhookInfo() {
  return call("getWebhookInfo", {});
}

export function parseUpdate(update) {
  if (update.callback_query) {
    const q = update.callback_query;
    return {
      chatId: String(q.message.chat.id),
      username: q.from?.username || null,
      text: "",
      callbackData: q.data,
      callbackId: q.id,
    };
  }
  const msg = update.message;
  if (!msg || !msg.chat) {
    return null;
  }
  return {
    chatId: String(msg.chat.id),
    username: msg.from?.username || null,
    text: msg.text || msg.caption || "",
    callbackData: null,
    callbackId: null,
  };
}
