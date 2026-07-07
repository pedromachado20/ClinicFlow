import { describe, expect, it, afterEach, vi } from "vitest";
import { hojeLocal, primeiroDiaMesLocal } from "./utils";

describe("hojeLocal (regression guard for the UTC-vs-Brasília 'today' bug)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stays on the Brazil-local day even when UTC has already rolled over to tomorrow", () => {
    // 2026-07-07 23:30 in São Paulo (UTC-3) = 2026-07-08 02:30 UTC.
    // A naive `new Date().toISOString().slice(0,10)` would incorrectly return "2026-07-08" here.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-08T02:30:00.000Z"));
    expect(hojeLocal()).toBe("2026-07-07");
  });

  it("matches UTC during the day when both timezones agree", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-07T15:00:00.000Z"));
    expect(hojeLocal()).toBe("2026-07-07");
  });
});

describe("primeiroDiaMesLocal", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the 1st of the Brazil-local month, not UTC's", () => {
    // 2026-06-30 22:00 São Paulo (UTC-3) = 2026-07-01 01:00 UTC.
    // A naive UTC-based calculation would wrongly report July as the current month.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T01:00:00.000Z"));
    expect(primeiroDiaMesLocal()).toBe("2026-06-01");
  });
});
