import { describe, expect, it } from "vitest";
import { greeting, relativeTime } from "./time";

const NOW = new Date("2026-10-30T15:00:00");

describe("time", () => {
  it("relativeTime", () => {
    expect(relativeTime("2026-10-30T14:59:40", NOW)).toBe("just now");
    expect(relativeTime("2026-10-30 14:50:00", NOW)).toBe("10 min ago");
    expect(relativeTime("2026-10-30T12:00:00", NOW)).toBe("3 h ago");
    expect(relativeTime("2026-10-29T10:00:00", NOW)).toBe("Yesterday");
    expect(relativeTime("2026-10-26T10:00:00", NOW)).toBe("4 days ago");
    expect(relativeTime("2026-09-01T10:00:00", NOW)).toMatch(/Sept? 2026/);
    expect(relativeTime(null, NOW)).toBe("");
    expect(relativeTime("garbage", NOW)).toBe("");
  });

  it("greeting", () => {
    expect(greeting(new Date("2026-10-30T09:00:00"))).toBe("Good morning");
    expect(greeting(new Date("2026-10-30T14:00:00"))).toBe("Good afternoon");
    expect(greeting(new Date("2026-10-30T20:00:00"))).toBe("Good evening");
  });
});
