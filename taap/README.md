# TAAP consultant bot

Telegram bot + Jev decision layer for housing requests from Tajikistan. Visa path is not implemented. No Booking/TAAP links until partnership is approved. Jev does not touch Telegram, databases, or TAAP.

Bot: [@ArzonTur_bot](https://t.me/ArzonTur_bot)

## Question keys

Routing: `intent`, `destination`, `to_human`, `lead_score`  
Hotel: `slots_complete`, `budget_level`, `flexible_dates`

`intent=visa` is a routing label only. Complaints always go to a human. Exact «оператор» is handled in core before Jev.

## Run locally

Secrets in the gitignored repo `.env`: `TYPESAFE_API_KEY`, `TELEGRAM_BOT_TOKEN`, optional `OPERATOR_CHAT_ID`, `PUBLIC_BASE_URL`, `TELEGRAM_WEBHOOK_SECRET`.

```bash
node --test taap/app/src/*.test.js
PORT=8081 node taap/app/src/server.js
curl -s http://127.0.0.1:8081/health
```

If `PUBLIC_BASE_URL` is an https origin, the process sets Telegram webhook to `$PUBLIC_BASE_URL/telegram/webhook`.

Eval:

```bash
node taap/tools/eval.mjs
```

## Hostinger VPS

Copy the `taap/` folder to `/home/taap`, put secrets in `/home/taap/.env` (not on medcoll.tech), then `docker compose up -d --build`. Point `PUBLIC_BASE_URL` at that host’s https URL and open port 8081 (or a reverse proxy). Postgres schema is in `db/init.sql`; this build uses JSON files in `data/` until that swap.
