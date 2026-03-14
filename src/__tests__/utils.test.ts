import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  cn,
  formatDate,
  formatDateTime,
  getDday,
  formatKRW,
  getStatusColor,
  getStatusLabel,
  isWithinTwoWeeks,
  timeAgo,
} from "@/lib/utils";

describe("cn (className merge)", () => {
  it("merges multiple classNames", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("handles conditional classes", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
  it("handles empty inputs", () => {
    expect(cn()).toBe("");
  });
});

describe("formatDate", () => {
  it("formats Korean date", () => {
    const result = formatDate("2026-03-14T10:00:00+09:00");
    expect(result).toContain("2026");
    expect(result).toContain("3");
    expect(result).toContain("14");
  });
});

describe("formatDateTime", () => {
  it("includes time", () => {
    const result = formatDateTime("2026-03-14T15:30:00+09:00");
    expect(result).toContain("2026");
  });
});

describe("getDday", () => {
  it("returns D-Day for today", () => {
    const today = new Date().toISOString();
    const result = getDday(today);
    expect(result).toMatch(/D[-+]?\d*|D-Day/);
  });
  it("returns D-N for future dates", () => {
    const future = new Date(Date.now() + 5 * 86400000).toISOString();
    const result = getDday(future);
    expect(result).toMatch(/D-\d+/);
  });
  it("returns D+N for past dates", () => {
    const past = new Date(Date.now() - 5 * 86400000).toISOString();
    const result = getDday(past);
    expect(result).toMatch(/D\+\d+/);
  });
});

describe("formatKRW", () => {
  it("formats amount with 원", () => {
    expect(formatKRW(1000000)).toBe("1,000,000원");
  });
  it("formats zero", () => {
    expect(formatKRW(0)).toBe("0원");
  });
});

describe("getStatusColor", () => {
  it("returns green classes for ongoing", () => {
    expect(getStatusColor("ongoing")).toContain("green");
  });
  it("returns gray classes for ended", () => {
    expect(getStatusColor("ended")).toContain("gray");
  });
  it("returns blue classes for upcoming", () => {
    expect(getStatusColor("upcoming")).toContain("blue");
  });
  it("returns gray for unknown", () => {
    expect(getStatusColor("unknown")).toContain("gray");
  });
});

describe("getStatusLabel", () => {
  it("returns 진행중 for ongoing", () => {
    expect(getStatusLabel("ongoing")).toBe("진행중");
  });
  it("returns 종료 for ended", () => {
    expect(getStatusLabel("ended")).toBe("종료");
  });
  it("returns 예정 for upcoming", () => {
    expect(getStatusLabel("upcoming")).toBe("예정");
  });
  it("returns raw string for unknown", () => {
    expect(getStatusLabel("custom")).toBe("custom");
  });
});

describe("isWithinTwoWeeks", () => {
  it("returns true for recently ended", () => {
    const recent = new Date(Date.now() - 3 * 86400000).toISOString();
    expect(isWithinTwoWeeks(recent)).toBe(true);
  });
  it("returns false for old end date", () => {
    const old = new Date(Date.now() - 30 * 86400000).toISOString();
    expect(isWithinTwoWeeks(old)).toBe(false);
  });
  it("returns true for exactly 14 days ago", () => {
    const twoWeeks = new Date(Date.now() - 14 * 86400000).toISOString();
    expect(isWithinTwoWeeks(twoWeeks)).toBe(true);
  });
  it("returns false for 15 days ago", () => {
    const fifteenDays = new Date(Date.now() - 15 * 86400000).toISOString();
    expect(isWithinTwoWeeks(fifteenDays)).toBe(false);
  });
});

describe("timeAgo", () => {
  it("returns 방금 전 for just now", () => {
    expect(timeAgo(new Date().toISOString())).toBe("방금 전");
  });
  it("returns minutes ago", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(fiveMinAgo)).toContain("분 전");
  });
  it("returns hours ago", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    expect(timeAgo(threeHoursAgo)).toContain("시간 전");
  });
  it("returns days ago", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400 * 1000).toISOString();
    expect(timeAgo(twoDaysAgo)).toContain("일 전");
  });
});
