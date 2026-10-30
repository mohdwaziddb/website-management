import { describe, expect, it } from "vitest";
import { formatDecimal, rupee } from "./money";

describe("rupee", () => {
  it("Indian grouping + 2 decimals", () => {
    expect(rupee(1299)).toBe("₹1,299.00");
    expect(rupee("125000.5")).toBe("₹1,25,000.50");
    expect(rupee(0)).toBe("₹0.00");
  });
  it("khaali / galat value", () => {
    expect(rupee(null)).toBe("—");
    expect(rupee("")).toBe("—");
    expect(rupee("abc")).toBe("—");
  });
});

describe("formatDecimal (list cell)", () => {
  it("₹ label => rupee", () => expect(formatDecimal("Selling Price (₹)", "1299.00")).toBe("₹1,299.00"));
  it("baaki => plain number", () => {
    expect(formatDecimal("Discount Value", "10.00")).toBe("10");
    expect(formatDecimal("Weight", 2.5)).toBe("2.5");
  });
});
