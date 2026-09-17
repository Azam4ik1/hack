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

Eval prefers the 50-message gold JSON, then the markdown set, then `taap/tools/fixtures.json`. Decisions are appended to `taap/logs/decisions.jsonl` (gitignored). `with_family` is labeled in gold but is not a Jev question here.
