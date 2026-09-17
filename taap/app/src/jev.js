/**
 * Sole TypeSafe/Jev HTTP adapter. No databases, Telegram, or TAAP calls.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const MODEL = "jev-latest";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const text = fs.readFileSync(filePath, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }
    const eq = line.indexOf("=");
    const name = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (name && process.env[name] === undefined) {
      process.env[name] = value;
    }
  }
}

export function loadApiKey() {
  if (!process.env.TYPESAFE_API_KEY) {
    loadEnvFile(path.join(ROOT, ".env"));
  }
  if (!process.env.TYPESAFE_API_KEY) {
    loadEnvFile(path.join(ROOT, "taap", ".env"));
  }
  const key = process.env.TYPESAFE_API_KEY || "";
  if (!key) {
    throw new Error("TYPESAFE_API_KEY is not set (process env or gitignored .env)");
  }
  return key;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function systemOne({ state, questions, model = MODEL }) {
  const key = loadApiKey();
  const body = JSON.stringify({ state, model, questions });
  let lastError;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const started = Date.now();
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body,
    });
    const latencyMs = Date.now() - started;
    const payload = await response.json().catch(() => ({}));

    if (response.status === 429 || response.status === 529) {
      lastError = new Error(`TypeSafe ${response.status}`);
      await sleep(200 * 2 ** attempt);
      continue;
    }
    if (!response.ok) {
      const err = new Error(`TypeSafe HTTP ${response.status}`);
      err.status = response.status;
      throw err;
    }
    return {
      model: payload.model,
      answers: payload.answers || {},
      usage: payload.usage || {},
      latencyMs,
    };
  }

  throw lastError || new Error("TypeSafe request failed");
}

export function summarizeAnswers(answers) {
  const out = {};
  for (const [id, answer] of Object.entries(answers)) {
    if (!answer || typeof answer !== "object") {
      continue;
    }
    if (answer.type === "choice") {
      out[id] = {
        type: "choice",
        choice: answer.choice,
        confidence: answer.confidence,
        probabilities: answer.probabilities,
      };
    } else if (answer.type === "score") {
      out[id] = {
        type: "score",
        score: answer.score,
        confidence: answer.confidence,
        probabilities: answer.probabilities,
      };
    } else if (answer.type === "noul") {
      out[id] = { type: "noul", noul: answer.noul };
    }
  }
  return out;
}
