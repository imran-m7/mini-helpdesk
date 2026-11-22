export const STATUSES = ["open", "in_progress", "resolved", "closed"];
export const PRIORITIES = ["low", "medium", "high", "urgent"];

// "in_progress" → "In progress"
export function formatLabel(value) {
  const text = value.replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1); // I and n progress
}

// API sends UTC times without a timezone ("2026-11-20T18:23:13"),
// so we add "Z" to make the browser treat them as UTC and convert to local time.
export function formatDate(value) {
  const hasTimezone = /Z|[+-]\d\d:\d\d$/.test(value); // check if there is Z that tells UTC
  const date = new Date(hasTimezone ? value : `${value}Z`);
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); // "Nov 22, 2026, 2:22 PM"
}