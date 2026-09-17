/**
 * HTTP channel: health + Telegram webhook.
 */

import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import { handleTurn } from "./bot.js";
import { env, loadEnv } from "./env.js";
import { getMe, getWebhookInfo, parseUpdate, sendMessage, setWebhook, answerCallback } from "./telegram.js";

const PORT = Number(env("PORT", "8081"));

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(json);
}

function timingSafeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) {
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

async function onWebhook(req, res) {
  const secret = env("TELEGRAM_WEBHOOK_SECRET");
  const header = req.headers["x-telegram-bot-api-secret-token"] || "";
  if (secret && !timingSafeEqual(header, secret)) {
    send(res, 401, { ok: false });
    return;
  }
  let update;
  try {
    update = JSON.parse(await readBody(req));
  } catch {
    send(res, 400, { ok: false });
    return;
  }
  const ctx = parseUpdate(update);
  send(res, 200, { ok: true });
  if (!ctx) {
    return;
  }
  try {
    if (ctx.callbackId) {
      await answerCallback(ctx.callbackId);
    }
    const result = await handleTurn({
      ...ctx,
      operatorChatId: env("OPERATOR_CHAT_ID") || null,
    });
    for (const item of result.replies || []) {
      await sendMessage(ctx.chatId, item);
    }
    for (const note of result.notify || []) {
      await sendMessage(note.chatId, { text: note.text });
    }
  } catch (err) {
    try {
      await sendMessage(ctx.chatId, {
        text: "Сбой обработки. Напишите «оператор» или нажмите кнопку меню.",
      });
    } catch {
      console.error("telegram send failed", err.message);
    }
  }
}

export function createServer() {
  loadEnv();
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    if (req.method === "GET" && (url.pathname === "/health" || url.pathname === "/")) {
      send(res, 200, {
        ok: true,
        service: "taap",
        telegram: Boolean(env("TELEGRAM_BOT_TOKEN")),
        typesafe: Boolean(env("TYPESAFE_API_KEY")),
      });
      return;
    }
    if (req.method === "POST" && url.pathname === "/telegram/webhook") {
      await onWebhook(req, res);
      return;
    }
    send(res, 404, { ok: false });
  });
}

export async function start() {
  loadEnv();
  if (!env("TELEGRAM_BOT_TOKEN")) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }
  const me = await getMe();
  const server = createServer();
  await new Promise((resolve) => server.listen(PORT, "0.0.0.0", resolve));
  const publicBase = env("PUBLIC_BASE_URL").replace(/\/$/, "");
  const secret = env("TELEGRAM_WEBHOOK_SECRET");
  let webhookUrl = null;
  if (publicBase) {
    webhookUrl = `${publicBase}/telegram/webhook`;
    const certPath = env("TELEGRAM_WEBHOOK_CERT");
    const certificatePem =
      certPath && fs.existsSync(certPath) ? fs.readFileSync(certPath, "utf8") : "";
    await setWebhook(webhookUrl, secret, certificatePem || undefined);
  }
  const info = publicBase ? await getWebhookInfo() : { url: "" };
  console.log(
    JSON.stringify({
      ok: true,
      bot: me.username || me.id,
      port: PORT,
      webhook: Boolean(info.url),
    }),
  );
  return { server, username: me.username, webhookUrl };
}

const isMain = process.argv[1] && process.argv[1].endsWith("server.js");
if (isMain) {
  start().catch((err) => {
    console.error(err.message || String(err));
    process.exit(1);
  });
}
