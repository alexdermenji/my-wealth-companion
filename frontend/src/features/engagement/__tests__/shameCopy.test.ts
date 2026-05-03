import { describe, it, expect } from "vitest";
import { getTrackingCopy, getNoSpendCopy } from "../shameCopy";

describe("getTrackingCopy", () => {
  it("returns 'Habit protected' headline when logged at low streak", () => {
    const { headline } = getTrackingCopy({ currentStreak: 2, todayStatus: "logged" });
    expect(headline).toBe("Habit protected");
  });

  it("returns 'X days strong' headline when logged at 7+", () => {
    const { headline } = getTrackingCopy({ currentStreak: 7, todayStatus: "logged" });
    expect(headline).toMatch(/7 days strong/i);
  });

  it("includes beat-your-best subline when below longestStreak", () => {
    const { subline } = getTrackingCopy({ currentStreak: 5, todayStatus: "logged", longestStreak: 8 });
    expect(subline).toMatch(/3 more day|beat your best/i);
  });

  it("includes days-to-seven subline when no longestStreak advantage", () => {
    const { subline } = getTrackingCopy({ currentStreak: 3, todayStatus: "logged" });
    expect(subline).toMatch(/4 more day|7-day streak/i);
  });

  it("returns no subline when at longest streak and past 7", () => {
    const { subline } = getTrackingCopy({ currentStreak: 10, todayStatus: "logged", longestStreak: 10 });
    expect(subline).toBeUndefined();
  });

  it("returns nudge headline when pending and streak > 0", () => {
    const { headline } = getTrackingCopy({ currentStreak: 3, todayStatus: "pending" });
    expect(headline).toMatch(/3-day streak/i);
  });

  it("includes log-today in subline when pending", () => {
    const { subline } = getTrackingCopy({ currentStreak: 3, todayStatus: "pending" });
    expect(subline).toMatch(/log today/i);
  });

  it("returns start copy when streak is 0", () => {
    const { headline } = getTrackingCopy({ currentStreak: 0, todayStatus: "pending" });
    expect(headline).toMatch(/start your streak/i);
  });

  it("never returns empty headline", () => {
    [0, 1, 5, 7, 30].forEach((streak) => {
      expect(getTrackingCopy({ currentStreak: streak, todayStatus: "pending" }).headline.length).toBeGreaterThan(0);
      expect(getTrackingCopy({ currentStreak: streak, todayStatus: "logged" }).headline.length).toBeGreaterThan(0);
    });
  });
});

describe("getNoSpendCopy", () => {
  it("returns spent status when today is spent", () => {
    const { status } = getNoSpendCopy({ currentStreak: 0, todayStatus: "spent" });
    expect(status).toMatch(/spent today/i);
  });

  it("includes fresh-start messaging when spent", () => {
    const { status } = getNoSpendCopy({ currentStreak: 0, todayStatus: "spent" });
    expect(status).toMatch(/fresh start|tomorrow/i);
  });

  it("shows beat-your-best challenge when spent and has a previous best", () => {
    const { challenge } = getNoSpendCopy({ currentStreak: 0, todayStatus: "spent", longestStreak: 5 });
    expect(challenge).toMatch(/5-day best|beat your/i);
  });

  it("shows 2-day challenge when spent and no previous best", () => {
    const { challenge } = getNoSpendCopy({ currentStreak: 0, todayStatus: "spent" });
    expect(challenge).toMatch(/2-day|challenge/i);
  });

  it("does not use harsh reset language when spent", () => {
    const { status } = getNoSpendCopy({ currentStreak: 0, todayStatus: "spent" });
    expect(status).not.toMatch(/reset/i);
  });

  it("returns positive status when no-spend today", () => {
    const { status } = getNoSpendCopy({ currentStreak: 3, todayStatus: "no-spend" });
    expect(status).toMatch(/no spending today|great control/i);
  });

  it("returns 7+ challenge when streak is 7+", () => {
    const { challenge } = getNoSpendCopy({ currentStreak: 7, todayStatus: "no-spend" });
    expect(challenge).toMatch(/7|incredible/i);
  });

  it("shows days-to-week goal when streak is 3–6", () => {
    const { challenge } = getNoSpendCopy({ currentStreak: 4, todayStatus: "no-spend" });
    expect(challenge).toMatch(/3 more day|week/i);
  });

  it("shows next-goal copy when streak is 1–2", () => {
    const { challenge } = getNoSpendCopy({ currentStreak: 1, todayStatus: "no-spend" });
    expect(challenge).toMatch(/next goal/i);
  });

  it("never returns empty status", () => {
    [0, 1, 3, 7].forEach((streak) => {
      expect(getNoSpendCopy({ currentStreak: streak, todayStatus: "no-spend" }).status.length).toBeGreaterThan(0);
    });
  });
});
