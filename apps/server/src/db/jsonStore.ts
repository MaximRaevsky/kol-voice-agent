import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_DIR = join(__dirname, '..', '..', 'db');

// Ensure db directory exists
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

export function getDbPath(filename: string): string {
  return join(DB_DIR, filename);
}

export function readJson<T>(filename: string, defaultValue: T): T {
  const path = getDbPath(filename);
  if (!existsSync(path)) {
    return defaultValue;
  }
  try {
    const data = readFileSync(path, 'utf-8');
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
}

export function writeJson<T>(filename: string, data: T): void {
  const path = getDbPath(filename);
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
}

export function updateJson<T>(filename: string, defaultValue: T, updater: (data: T) => T): T {
  const current = readJson(filename, defaultValue);
  const updated = updater(current);
  writeJson(filename, updated);
  return updated;
}

