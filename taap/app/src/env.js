/**
 * Load gitignored env files. Never log values.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

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

let loaded = false;

export function loadEnv() {
  if (loaded) {
    return;
  }
  const files = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../.env"),
    path.resolve(HERE, "../../.env"),
    path.resolve(HERE, "../../../.env"),
  ];
  for (const file of files) {
    loadEnvFile(file);
  }
  loaded = true;
}

export function env(name, fallback = "") {
  loadEnv();
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

export function repoRoot() {
  return path.resolve(HERE, "../../..");
}
