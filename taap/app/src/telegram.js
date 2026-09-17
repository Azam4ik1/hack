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

export async function setWebhook(url, secret, certificatePem) {
  if (!certificatePem) {
    return call("setWebhook", {
      url,
      secret_token: secret || undefined,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: true,
    });
  }
  const form = new FormData();
  form.set("url", url);
  if (secret) {
    form.set("secret_token", secret);
  }
  form.set("allowed_updates", JSON.stringify(["message", "callback_query"]));
  form.set("drop_pending_updates", "true");
  form.set(
    "certificate",
    new Blob([certificatePem], { type: "application/octet-stream" }),
    "cert.pem",
  );
  const response = await fetch(`${apiRoot()}/setWebhook`, {
    method: "POST",
    body: form,
  });
  const data = await response.json().catch(() => ({}));
  if (!data.ok) {
    const err = new Error("Telegram setWebhook failed");
    err.status = response.status;
    throw err;
  }
  return data.result;
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
