"use client";

import type { SessionPayload, DiagnosisResult } from "./types";

const SESSION_KEY = "best_station_session";
const SCHEMA_VERSION = "2";

// ── 読み出し ──────────────────────────────────────────────────────────────────

export function loadSession(): SessionPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: SessionPayload = JSON.parse(raw);
    if (parsed.schemaVersion !== SCHEMA_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ── 書き込み ──────────────────────────────────────────────────────────────────

export function saveAnswers(
  rawAnswers: Record<string, unknown>,
  diagnosisVersion: string,
): void {
  if (typeof window === "undefined") return;
  const payload: SessionPayload = {
    schemaVersion: SCHEMA_VERSION,
    diagnosisVersion,
    rawAnswers,
    result: null,
  };
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

export function saveResult(result: DiagnosisResult): void {
  if (typeof window === "undefined") return;
  const existing = loadSession();
  const payload: SessionPayload = {
    schemaVersion: SCHEMA_VERSION,
    diagnosisVersion: existing?.diagnosisVersion ?? "0.2.0-review",
    rawAnswers: existing?.rawAnswers ?? {},
    result,
  };
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

// ── クリア ─────────────────────────────────────────────────────────────────────

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_KEY);
}

// ── 結果のみ取得 ──────────────────────────────────────────────────────────────

export function loadResult(): DiagnosisResult | null {
  return loadSession()?.result ?? null;
}
