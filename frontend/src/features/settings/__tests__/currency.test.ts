import { describe, it, expect } from "vitest";
import { CURRENCIES, getCurrencySymbol } from "../types";

describe("CURRENCIES", () => {
  it("contains 10 entries", () => {
    expect(CURRENCIES).toHaveLength(10);
  });

  it("every entry has code, symbol, flag, and iso", () => {
    for (const c of CURRENCIES) {
      expect(c.code).toBeTruthy();
      expect(c.symbol).toBeTruthy();
      expect(c.flag).toBeTruthy();
      expect(c.iso).toBeTruthy();
    }
  });

  it("all codes are unique", () => {
    const codes = CURRENCIES.map(c => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("all ISO codes are unique", () => {
    const isos = CURRENCIES.map(c => c.iso);
    expect(new Set(isos).size).toBe(isos.length);
  });

  it("includes GBP, USD, EUR as first three entries", () => {
    expect(CURRENCIES[0].iso).toBe("GBP");
    expect(CURRENCIES[1].iso).toBe("USD");
    expect(CURRENCIES[2].iso).toBe("EUR");
  });

  it("CA$ and A$ both display as $ symbol", () => {
    expect(CURRENCIES.find(c => c.code === "CA$")?.symbol).toBe("$");
    expect(CURRENCIES.find(c => c.code === "A$")?.symbol).toBe("$");
  });

  it("kr-sek and kr-nok both display as kr symbol", () => {
    expect(CURRENCIES.find(c => c.code === "kr-sek")?.symbol).toBe("kr");
    expect(CURRENCIES.find(c => c.code === "kr-nok")?.symbol).toBe("kr");
  });
});

describe("getCurrencySymbol", () => {
  it("returns the symbol for a known code", () => {
    expect(getCurrencySymbol("£")).toBe("£");
    expect(getCurrencySymbol("$")).toBe("$");
    expect(getCurrencySymbol("€")).toBe("€");
    expect(getCurrencySymbol("¥")).toBe("¥");
    expect(getCurrencySymbol("Fr")).toBe("Fr");
    expect(getCurrencySymbol("₹")).toBe("₹");
  });

  it("returns $ for CA$ code", () => {
    expect(getCurrencySymbol("CA$")).toBe("$");
  });

  it("returns $ for A$ code", () => {
    expect(getCurrencySymbol("A$")).toBe("$");
  });

  it("returns kr for kr-sek code", () => {
    expect(getCurrencySymbol("kr-sek")).toBe("kr");
  });

  it("returns kr for kr-nok code", () => {
    expect(getCurrencySymbol("kr-nok")).toBe("kr");
  });

  it("returns the code itself for unknown codes", () => {
    expect(getCurrencySymbol("XYZ")).toBe("XYZ");
    expect(getCurrencySymbol("BTC")).toBe("BTC");
  });
});
