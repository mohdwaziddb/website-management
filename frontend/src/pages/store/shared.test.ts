import { describe, expect, it } from "vitest";
import { canRefund, methodLabel, ORDER_STATUSES, paymentMeta, rupee, settingsDiff, statusMeta, type StoreSettingField } from "./shared";

describe("order status badge", () => {
  it("har status ka label + alag colour", () => {
    expect(statusMeta("PENDING_PAYMENT").label).toBe("Awaiting payment");
    expect(statusMeta("PLACED").label).toBe("Order placed");
    expect(statusMeta("DELIVERED").cls).toContain("emerald");
    expect(statusMeta("CANCELLED").cls).toContain("red");
    const classes = ORDER_STATUSES.map((s) => statusMeta(s).cls);
    expect(new Set(classes).size).toBe(ORDER_STATUSES.length);
  });
  it("anjaan status = grey + raw naam", () => {
    expect(statusMeta("ON_HOLD")).toMatchObject({ label: "ON_HOLD" });
    expect(statusMeta(null).label).toBe("—");
  });
  it("payment status + method", () => {
    expect(paymentMeta("PAID").label).toBe("Paid");
    expect(paymentMeta("REFUNDED").label).toBe("Refunded");
    expect(methodLabel("COD")).toBe("Cash on delivery");
    expect(methodLabel("RAZORPAY")).toBe("Razorpay");
  });
  it("rupee re-export", () => expect(rupee(1234)).toBe("₹1,234.00"));
});

describe("canRefund", () => {
  it("sirf paid Razorpay + cancelled/returned", () => {
    expect(canRefund({ payment_method: "RAZORPAY", payment_status: "PAID", status: "CANCELLED" })).toBe(true);
    expect(canRefund({ payment_method: "RAZORPAY", payment_status: "PAID", status: "RETURNED" })).toBe(true);
    expect(canRefund({ payment_method: "RAZORPAY", payment_status: "PAID", status: "SHIPPED" })).toBe(false);
    expect(canRefund({ payment_method: "RAZORPAY", payment_status: "REFUNDED", status: "CANCELLED" })).toBe(false);
    expect(canRefund({ payment_method: "COD", payment_status: "PAID", status: "CANCELLED" })).toBe(false);
  });
});

const f = (key: string, kind: StoreSettingField["kind"], secret = false): StoreSettingField => ({ key, label: key, group: "Store", kind, secret, defaultValue: "", help: null });
const FIELDS = [f("order_prefix", "TEXT"), f("shipping_fee", "DECIMAL"), f("cod_enabled", "BOOLEAN"), f("low_stock", "NUMBER"), f("razorpay_key_secret", "TEXT", true), f("gstin", "TEXT")];
const ORIGINAL = { order_prefix: "ORD", shipping_fee: "49", cod_enabled: true, low_stock: "5", razorpay_key_secret: "", gstin: "07AABCU9603R1ZM" };

describe("settingsDiff", () => {
  it("kuch nahi badla => khaali", () => {
    expect(settingsDiff(FIELDS, ORIGINAL, { ...ORIGINAL })).toEqual({});
  });
  it("sirf badle keys; number string/number same", () => {
    expect(settingsDiff(FIELDS, ORIGINAL, { ...ORIGINAL, shipping_fee: "59.50", cod_enabled: false, low_stock: 5 })).toEqual({ shipping_fee: "59.50", cod_enabled: false });
  });
  it("khaali secret kabhi nahi bhejte (purana rahe)", () => {
    expect(settingsDiff(FIELDS, ORIGINAL, { ...ORIGINAL, razorpay_key_secret: "" })).toEqual({});
    expect(settingsDiff(FIELDS, ORIGINAL, { ...ORIGINAL, razorpay_key_secret: "   " })).toEqual({});
    expect(settingsDiff(FIELDS, ORIGINAL, { ...ORIGINAL, razorpay_key_secret: " abc123 " })).toEqual({ razorpay_key_secret: "abc123" });
  });
  it("normal field khaali karna = empty string bhejo (clear)", () => {
    expect(settingsDiff(FIELDS, ORIGINAL, { ...ORIGINAL, gstin: "" })).toEqual({ gstin: "" });
  });
});
