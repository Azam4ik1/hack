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

Admin (leads, Jev log, disputed cases): `$PUBLIC_BASE_URL/admin`, cookie/Bearer `ADMIN_TOKEN`. Not on medcoll.tech.

Eval:

```bash
node taap/tools/eval.mjs
```

## Hostinger VPS

Separate Docker Compose project. Do not join the ejournal network, do not bind 80/443, and do not touch `medcoll.tech`.

| Item | Value |
| --- | --- |
| Folder | `/home/taap` |
| Compose project | `taap` |
| Network | `taap_net` |
| Public URL | `https://srv1957432.hstgr.cloud:8443` |
| Webhook | `https://srv1957432.hstgr.cloud:8443/telegram/webhook` |

Hostinger’s domain portfolio on this account is only `medcoll.tech` (college). That zone is left unchanged. The VPS hostname `srv1957432.hstgr.cloud` already points at the machine, so TAAP uses it on port **8443** (Telegram allows 443, 80, 88, 8443). A self-signed cert is uploaded to Telegram; Let’s Encrypt HTTP-01/TLS-ALPN would need 80/443, which belong to ejournal Caddy.

```bash
# on the VPS, as root
install -d -m 700 /home/taap
# copy this taap/ tree into /home/taap (no git secrets)
cp /path/to/taap/.env.example /home/taap/.env
# fill TYPESAFE_API_KEY, TELEGRAM_BOT_TOKEN, DB_PASSWORD, TELEGRAM_WEBHOOK_SECRET
sh /home/taap/scripts/make-tls.sh /home/taap/certs
cd /home/taap && docker compose up -d --build
curl -sS http://127.0.0.1:8081/health
curl -sk https://127.0.0.1:8443/health
```

Postgres is local to `taap_net` (not published on the host). Daily dumps stay in `/home/taap/backups` for 14 days. Sessions/leads are still JSON files under `data/` until the store swap; `db/init.sql` is applied on first boot.

`OPERATOR_CHAT_ID` is set when the owner writes the bot (or claims via `/start op_<OPERATOR_CLAIM_TOKEN>`). Admin panel: `https://srv1957432.hstgr.cloud:8443/admin` with `ADMIN_TOKEN` from `/home/taap/.env`.
