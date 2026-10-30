import { beforeEach, describe, expect, it } from "vitest";
import { addItem, cart, cartCount, CartItem, cartPayload, loadCart, percentOff, rupees, setItemQty } from "./store";

const tee = (qty = 1, variantId: number | null = 11): CartItem => ({ productId: 1, variantId, qty, title: "Tee", price: 499 });

describe("cart", () => {
  beforeEach(() => localStorage.clear());

  it("same product + variant => qty judti hai, alag variant = alag line", () => {
    let items = addItem([], tee(2));
    items = addItem(items, tee(3));
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(5);
    items = addItem(items, tee(1, 12));
    expect(items).toHaveLength(2);
    expect(cartCount(items)).toBe(6);
  });

  it("qty 99 se upar nahi, 0 = hata do", () => {
    let items = addItem([], tee(98));
    items = addItem(items, tee(5));
    expect(items[0].qty).toBe(99);
    items = setItemQty(items, { productId: 1, variantId: 11 }, 0);
    expect(items).toEqual([]);
  });

  it("server ko sirf ids + qty", () => {
    expect(cartPayload([tee(2)])).toEqual([{ productId: 1, variantId: 11, qty: 2 }]);
  });

  it("localStorage me save + kharab data ignore", () => {
    cart.add(tee(2));
    cart.add({ ...tee(1), variantId: null });
    expect(loadCart()).toHaveLength(2);
    cart.remove({ productId: 1, variantId: null });
    expect(loadCart()).toHaveLength(1);
    localStorage.setItem("wm_cart", "not json");
    expect(loadCart()).toEqual([]);
    localStorage.setItem("wm_cart", JSON.stringify([{ productId: "x" }, null, tee(0)]));
    expect(loadCart()).toEqual([]);
  });
});

describe("money", () => {
  it("rupees", () => {
    expect(rupees(1299)).toBe("₹1,299");
    expect(rupees("54990")).toBe("₹54,990");
    expect(rupees(979.5)).toBe("₹979.5");
    expect(rupees("abc")).toBe("");
  });

  it("percent off", () => {
    expect(percentOff(499, 899)).toBe(44);
    expect(percentOff(500, 400)).toBe(0);
    expect(percentOff(500, null)).toBe(0);
  });
});
