import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { makeTempRoot, makeDay, baseManifest } from "./helpers.mjs";
import { buildCalendar, formatCalendar, todayInNewYork } from "../lib/calendar.mjs";

let root;
afterEach(() => { if (root) fs.rmSync(root, { recursive: true, force: true }); });

describe("calendar", () => {
  it("lists every day in the window with gaps on weekdays only", () => {
    root = makeTempRoot();
    makeDay(root, "2026-09-25", { id: "2026-09-25", date: "2026-09-25", time: "09:00", timezone: "America/New_York", status: "native", title: "Job aids video", platforms: { facebook: { type: "REEL" } } });
    makeDay(root, "2026-09-28", baseManifest({ id: "2026-09-28", date: "2026-09-28", status: "ready", title: "Web reel" }));
    makeDay(root, "2026-09-28-2", baseManifest({ id: "2026-09-28-2", date: "2026-09-28", status: "planned", title: "Second post" }));
    const rows = buildCalendar({ root, today: "2026-09-25", days: 5 });
    expect(rows.map((r) => [r.date, r.weekday, r.status, r.note])).toEqual([
      ["2026-09-25", "Fri", "native", "native"],
      ["2026-09-26", "Sat", "", ""],
      ["2026-09-27", "Sun", "", ""],
      ["2026-09-28", "Mon", "ready", ""],
      ["2026-09-28", "Mon", "planned", "second post 2026-09-28-2"],
      ["2026-09-29", "Tue", "gap", ""]
    ]);
    expect(rows[3].title).toBe("Web reel");
  });

  it("marks a folder with a broken manifest instead of crashing", () => {
    root = makeTempRoot();
    const dir = path.join(root, "To Be Released", "2026-09-28");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "post.json"), "{ nope");
    const rows = buildCalendar({ root, today: "2026-09-28", days: 1 });
    expect(rows[0]).toMatchObject({ date: "2026-09-28", status: "broken", note: "cannot parse post.json" });
  });

  it("formats aligned lines", () => {
    const text = formatCalendar([
      { date: "2026-09-28", weekday: "Mon", status: "ready", pillar: "client-spotlight", title: "Web reel", note: "" },
      { date: "2026-10-02", weekday: "Fri", status: "gap", pillar: "", title: "", note: "" }
    ]);
    expect(text.split("\n")).toEqual([
      "2026-09-28  Mon  ready        client-spotlight    Web reel",
      "2026-10-02  Fri  gap"
    ]);
  });

  it("reports today in New York as YYYY-MM-DD", () => {
    expect(todayInNewYork(new Date("2026-09-25T03:30:00Z"))).toBe("2026-09-24");
    expect(todayInNewYork(new Date("2026-09-25T12:00:00Z"))).toBe("2026-09-25");
  });
});
