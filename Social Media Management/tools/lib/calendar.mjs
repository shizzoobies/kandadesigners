import path from "node:path";
import { listDayFolders, readManifest } from "./manifest.mjs";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Rows for today through today + days - 1. Dates are YYYY-MM-DD strings, no timezone math. */
export function buildCalendar({ root, today, days = 14 }) {
  const byDate = new Map();
  for (const dir of listDayFolders(root)) {
    const name = path.basename(dir);
    const m = readManifest(dir);
    const list = byDate.get(m.date) || [];
    list.push({ name, m });
    byDate.set(m.date, list);
  }

  const rows = [];
  const start = new Date(`${today}T00:00:00Z`);
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const date = d.toISOString().slice(0, 10);
    const weekday = WEEKDAYS[d.getUTCDay()];
    const entries = byDate.get(date) || [];
    if (entries.length === 0) {
      const isWeekday = d.getUTCDay() >= 1 && d.getUTCDay() <= 5;
      rows.push({ date, weekday, status: isWeekday ? "gap" : "", pillar: "", title: "", note: "" });
      continue;
    }
    for (const { name, m } of entries) {
      let note = "";
      if (m.status === "native") note = "native";
      else if (name !== date) note = `second post ${name}`;
      rows.push({ date, weekday, status: m.status, pillar: m.pillar || "", title: m.title || "", note });
    }
  }
  return rows;
}

export function formatCalendar(rows) {
  return rows.map((r) => {
    const parts = [r.date, r.weekday, r.status.padEnd(11), r.pillar.padEnd(18), r.title];
    if (r.note) parts.push(`[${r.note}]`);
    return parts.join("  ").replace(/\s+$/, "");
  }).join("\n");
}
