/**
 * Isolated TAAP admin: leads, Jev log, disputed cases. Not medcoll.tech.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./env.js";
import { listDecisions } from "./log.js";
import {
  listHandledKeys,
  listLeads,
  listOperatorQueue,
  listSessions,
  markOperatorHandled,
  operatorHandledKey,
} from "./store.js";

const PAGE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "admin.html");

function send(res, status, body, headers = {}) {
  const json = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": typeof body === "string" ? "text/html; charset=utf-8" : "application/json; charset=utf-8",
    ...headers,
  });
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

function parseCookies(header) {
  const out = {};
  for (const part of String(header || "").split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    out[trimmed.slice(0, eq)] = decodeURIComponent(trimmed.slice(eq + 1));
  }
  return out;
}

function adminToken() {
  return env("ADMIN_TOKEN");
}

export function isAdminAuthorized(req, url) {
  const token = adminToken();
  if (!token) {
    return false;
  }
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ") && timingSafeEqual(auth.slice(7), token)) {
    return true;
  }
  const cookie = parseCookies(req.headers.cookie).taap_admin;
  if (cookie && timingSafeEqual(cookie, token)) {
    return true;
  }
  const queryToken = url.searchParams.get("token");
  if (queryToken && timingSafeEqual(queryToken, token)) {
    return true;
  }
  return false;
}

function loginPage() {
  return `<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>ArzonTur вход</title>
<style>body{font-family:Georgia,serif;background:#14110e;color:#f3ece3;margin:0}form{max-width:22rem;padding:2rem}input,button{font:inherit;padding:.5rem;width:100%;margin:.4rem 0}input{background:#1e1914;color:#f3ece3;border:1px solid #3a3229}button{cursor:pointer}</style>
</head><body>
<form class="login" method="post" action="/admin/login">
  <h1>Разбор ArzonTur</h1>
  <p>Токен из gitignored .env, не из medcoll.tech.</p>
  <label>ADMIN_TOKEN<br/><input type="password" name="token" autocomplete="current-password" required /></label>
  <button type="submit">Войти</button>
</form>
</body></html>`;
}

function cookieHeader(token) {
  return `taap_admin=${encodeURIComponent(token)}; Path=/admin; HttpOnly; SameSite=Lax; Secure; Max-Age=604800`;
}

function disputes() {
  const handled = listHandledKeys();
  const fromQueue = listOperatorQueue(300).map((row) => ({
    id: row.id || operatorHandledKey(row),
    ts: row.ts,
    chatId: row.chatId,
    username: row.username,
    reason: row.reason,
    text: row.text,
    source: "queue",
    handled: Boolean(handled[row.id] || handled[operatorHandledKey(row)]),
  }));
  const fromDecisions = listDecisions(300)
    .filter((row) => {
      const action = row.decision?.action;
      const noul = Number(row.answers?.to_human?.noul ?? 0);
      const conf = Number(row.answers?.intent?.confidence ?? 1);
      return action === "operator" || noul >= 0.85 || (conf >= 0.4 && conf <= 0.8);
    })
    .map((row) => ({
      id: `dec_${row.ts}_${row.chatId || ""}`,
      ts: row.ts,
      chatId: row.chatId,
      username: null,
      reason: row.decision?.reason || row.decision?.action,
      text: row.message,
      source: "decision",
      handled: Boolean(handled[`dec_${row.ts}_${row.chatId || ""}`]),
    }));
  const fromSessions = listSessions()
    .filter((s) => s.handedOff)
    .map((s) => ({
      id: `ses_${s.chatId}_${s.updatedAt || ""}`,
      ts: s.updatedAt,
      chatId: s.chatId,
      username: s.username || null,
      reason: "handed_off_session",
      text: JSON.stringify(s.slots || {}),
      source: "session",
      handled: Boolean(handled[`ses_${s.chatId}_${s.updatedAt || ""}`]),
    }));
  const seen = new Set();
  const items = [];
  for (const row of [...fromQueue, ...fromDecisions, ...fromSessions]) {
    const key = `${row.chatId}|${row.ts}|${row.reason}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    items.push(row);
  }
  items.sort((a, b) => String(b.ts || "").localeCompare(String(a.ts || "")));
  return items;
}

export async function handleAdmin(req, res, url, readBody) {
  if (req.method === "GET" && (url.pathname === "/admin" || url.pathname === "/admin/")) {
    if (!isAdminAuthorized(req, url)) {
      send(res, 200, loginPage());
      return true;
    }
    const headers = {};
    const queryToken = url.searchParams.get("token");
    const expected = adminToken();
    if (queryToken && expected && timingSafeEqual(queryToken, expected)) {
      headers["Set-Cookie"] = cookieHeader(expected);
    }
    send(res, 200, fs.readFileSync(PAGE, "utf8"), headers);
    return true;
  }

  if (req.method === "POST" && url.pathname === "/admin/login") {
    const raw = await readBody(req);
    const params = new URLSearchParams(raw);
    const token = params.get("token") || "";
    const expected = adminToken();
    if (!expected || !timingSafeEqual(token, expected)) {
      send(res, 401, loginPage());
      return true;
    }
    res.writeHead(303, {
      Location: "/admin",
      "Set-Cookie": cookieHeader(expected),
    });
    res.end();
    return true;
  }

  if (!url.pathname.startsWith("/admin/api/")) {
    return false;
  }
  if (!isAdminAuthorized(req, url)) {
    send(res, 401, { ok: false, error: "unauthorized" });
    return true;
  }
  if (req.method === "GET" && url.pathname === "/admin/api/leads") {
    send(res, 200, { ok: true, items: listLeads(200) });
    return true;
  }
  if (req.method === "GET" && url.pathname === "/admin/api/decisions") {
    send(res, 200, { ok: true, items: listDecisions(200) });
    return true;
  }
  if (req.method === "GET" && url.pathname === "/admin/api/disputes") {
    send(res, 200, { ok: true, items: disputes() });
    return true;
  }
  if (req.method === "POST" && url.pathname === "/admin/api/disputes/handled") {
    const body = JSON.parse((await readBody(req)) || "{}");
    if (!body.id) {
      send(res, 400, { ok: false });
      return true;
    }
    markOperatorHandled(String(body.id));
    send(res, 200, { ok: true });
    return true;
  }
  send(res, 404, { ok: false });
  return true;
}
