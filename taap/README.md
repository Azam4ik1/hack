# TAAP Jev decision layer

Routing + hotel judgments for the TAAP consultant. Jev does not touch databases, Telegram, or TAAP.

Visa is a routing `intent` label only. There is no visa question set and no visa knowledge base here.

## Question keys

Routing (every message): `intent`, `destination`, `to_human`, `lead_score`

Hotel: `slots_complete`, `budget_level`, `flexible_dates`

`intent` values: `hotel` | `visa` | `prices` | `complaint` | `greeting` | `other`

## Run

From the repo root (uses gitignored `.env` for `TYPESAFE_API_KEY`):

```bash
node --test taap/app/src/decide.test.js
node taap/tools/eval.mjs
```

Eval reads `taap/tools/fixtures.json`, then overlays `docs/taap-50-messages.md` from the project store when that file exists. Decisions are appended to `taap/logs/decisions.jsonl` (gitignored).
