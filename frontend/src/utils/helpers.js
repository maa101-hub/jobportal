// ============================================================================
// HireTrack — shared helpers
// Small pure utilities reused across modules (kept dependency-free).
// ============================================================================

import { STATUS_TO_STAGE, STAGE_TONE } from "./constants";

/** Coerce the many shapes the backend/axios can return into a flat array. */
export function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  for (const key of [
    "data",
    "content",
    "items",
    "applications",
    "offers",
    "jobs",
    "employees",
  ]) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  return [];
}

/** Read the current user object from localStorage (or null). */
export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

/** Normalized uppercase role string. */
export function getRole() {
  const u = getUser();
  return String(u?.role || localStorage.getItem("role") || "").toUpperCase();
}

/** Resolve the acting company id from the various places it's stored. */
export function getCompanyId() {
  const u = getUser();
  const raw = u?.companyId ?? localStorage.getItem("companyId") ?? u?.id;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Two-letter initials from a name or email. */
export function initials(nameOrEmail = "") {
  const base = String(nameOrEmail).trim();
  if (!base) return "?";
  if (base.includes("@")) return base.slice(0, 2).toUpperCase();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Map a raw application status to a pipeline stage. */
export function toStage(status) {
  return STATUS_TO_STAGE[String(status || "").toUpperCase()] || "NEW";
}

/** Tone keyword for a given pipeline stage. */
export function stageTone(stage) {
  return STAGE_TONE[String(stage || "").toUpperCase()] || "info";
}

/** Friendly date, e.g. "Sep 25, 2026". Returns "—" for empty/invalid. */
export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Title-case a SCREAMING_SNAKE or lowercase token, e.g. "IN_PROGRESS" -> "In Progress". */
export function humanize(token = "") {
  return String(token)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
