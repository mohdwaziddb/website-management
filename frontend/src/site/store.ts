// Online store (website ka shopper): customer login, cart, paisa format, Razorpay checkout.
// Customer ka session admin session se bilkul alag (alag key, alag API /api/store/**).
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useEffect, useState } from "react";
import { unwrap } from "../lib/api";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const SESSION_KEY = "wm_customer";
const CART_KEY = "wm_cart";
const SESSION_EVENT = "wm-customer";
const CART_EVENT = "wm-cart";

export interface Customer {
  userId: number;
  name: string;
  email: string;
}

interface CustomerSession {
  accessToken: string;
  refreshToken: string;
  user: Customer;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown, event: string) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode — memory me hi chalega
  }
  window.dispatchEvent(new Event(event));
}

// ------------------------------------------------------------ customer session

export function loadCustomer(): CustomerSession | null {
  return read<CustomerSession | null>(SESSION_KEY, null);
}

export function saveCustomer(s: CustomerSession | null) {
  write(SESSION_KEY, s, SESSION_EVENT);
}

/** Logged-in shopper (ya null) — login / logout par apne aap update */
export function useCustomer(): Customer | null {
  const [c, setC] = useState(() => loadCustomer()?.user ?? null);
  useEffect(() => {
    const on = () => setC(loadCustomer()?.user ?? null);
    window.addEventListener(SESSION_EVENT, on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener(SESSION_EVENT, on);
      window.removeEventListener("storage", on);
    };
  }, []);
  return c;
}

/** /api/store/** — customer token ke saath; 401 par ek baar refresh */
export const storeApi = axios.create({ baseURL: API_BASE });

storeApi.interceptors.request.use((cfg) => {
  const s = loadCustomer();
  if (s?.accessToken) cfg.headers.set("Authorization", `Bearer ${s.accessToken}`);
  return cfg;
});

let refreshing: Promise<string | null> | null = null;

function refresh(): Promise<string | null> {
  if (!refreshing) {
    const s = loadCustomer();
    refreshing = (s?.refreshToken
      ? axios
          .post(API_BASE + "/store/auth/refresh", { refreshToken: s.refreshToken })
          .then((r) => {
            const next = unwrap<CustomerSession>(r).data;
            saveCustomer(next);
            return next.accessToken;
          })
          .catch(() => {
            saveCustomer(null);
            return null;
          })
      : Promise.resolve(null)
    ).finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

storeApi.interceptors.response.use(
  (r) => unwrap(r),
  async (error: AxiosError) => {
    const cfg = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (error.response?.status === 401 && cfg && !cfg._retried && !cfg.url?.includes("/auth/")) {
      cfg._retried = true;
      const token = await refresh();
      if (token) {
        cfg.headers.set("Authorization", `Bearer ${token}`);
        return storeApi(cfg);
      }
    }
    return Promise.reject(error);
  }
);

export async function customerLogin(path: "login" | "register", body: Record<string, unknown>): Promise<Customer> {
  const r = await storeApi.post<CustomerSession>(`/store/auth/${path}`, body);
  saveCustomer(r.data);
  return r.data.user;
}

export function customerLogout() {
  saveCustomer(null);
}

// ------------------------------------------------------------ cart (browser me; price hamesha server quote se)

export interface CartItem {
  productId: number;
  variantId: number | null;
  qty: number;
  /** sirf dikhane ke liye (drawer) — asli price server se */
  title: string;
  variantTitle?: string | null;
  price: number;
  image?: unknown;
  slug?: string;
}

export const MAX_QTY = 99;

export function loadCart(): CartItem[] {
  const items = read<CartItem[]>(CART_KEY, []);
  return Array.isArray(items) ? items.filter((i) => i && typeof i.productId === "number" && i.qty > 0) : [];
}

const same = (a: Pick<CartItem, "productId" | "variantId">, b: Pick<CartItem, "productId" | "variantId">) =>
  a.productId === b.productId && (a.variantId ?? null) === (b.variantId ?? null);

/** Pure (testable): same product + variant => qty jodo (max 99) */
export function addItem(items: CartItem[], item: CartItem): CartItem[] {
  const found = items.find((i) => same(i, item));
  if (!found) return [...items, { ...item, qty: Math.min(MAX_QTY, Math.max(1, item.qty)) }];
  return items.map((i) => (same(i, item) ? { ...i, ...item, qty: Math.min(MAX_QTY, i.qty + item.qty) } : i));
}

export function setItemQty(items: CartItem[], key: Pick<CartItem, "productId" | "variantId">, qty: number): CartItem[] {
  if (qty <= 0) return items.filter((i) => !same(i, key));
  return items.map((i) => (same(i, key) ? { ...i, qty: Math.min(MAX_QTY, qty) } : i));
}

export const cart = {
  add(item: CartItem) {
    write(CART_KEY, addItem(loadCart(), item), CART_EVENT);
  },
  setQty(key: Pick<CartItem, "productId" | "variantId">, qty: number) {
    write(CART_KEY, setItemQty(loadCart(), key, qty), CART_EVENT);
  },
  remove(key: Pick<CartItem, "productId" | "variantId">) {
    write(CART_KEY, setItemQty(loadCart(), key, 0), CART_EVENT);
  },
  clear() {
    write(CART_KEY, [], CART_EVENT);
  }
};

export function useCart(): CartItem[] {
  const [items, setItems] = useState(loadCart);
  useEffect(() => {
    const on = () => setItems(loadCart());
    window.addEventListener(CART_EVENT, on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener(CART_EVENT, on);
      window.removeEventListener("storage", on);
    };
  }, []);
  return items;
}

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.qty, 0);

/** Server ko sirf ye jaata hai */
export const cartPayload = (items: CartItem[]) => items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty }));

// ------------------------------------------------------------ cart drawer (kahin se bhi kholo)

const DRAWER_EVENT = "wm-cart-drawer";
export const openCartDrawer = () => window.dispatchEvent(new Event(DRAWER_EVENT));

export function useCartDrawer(): [boolean, (open: boolean) => void] {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener(DRAWER_EVENT, on);
    return () => window.removeEventListener(DRAWER_EVENT, on);
  }, []);
  return [open, setOpen];
}

// ------------------------------------------------------------ paisa

const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2, minimumFractionDigits: 0 });

/** 1299 -> "₹1,299", 1299.5 -> "₹1,299.5" (paise ho to dikhte hain) */
export function rupees(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return INR.format(n);
}

/** MRP se % off (MRP chhota / khaali => 0) */
export function percentOff(price: unknown, mrp: unknown): number {
  const p = Number(price);
  const m = Number(mrp);
  if (!Number.isFinite(p) || !Number.isFinite(m) || m <= p || m <= 0) return 0;
  return Math.round(((m - p) / m) * 100);
}

// ------------------------------------------------------------ Razorpay

export interface RazorpayPayment {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  orderNo: string;
  prefill: Record<string, unknown>;
}

export interface RazorpayResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (r: unknown) => void) => void };
  }
}

function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Razorpay. Check your internet connection."));
    document.body.appendChild(s);
  });
}

/** Razorpay popup kholo. resolve = payment ho gaya (signature server verify karega), null = customer ne band kiya */
export async function payWithRazorpay(p: RazorpayPayment, themeColor: string): Promise<RazorpayResult | null> {
  await loadRazorpay();
  return new Promise((resolve) => {
    const rzp = new window.Razorpay!({
      key: p.keyId,
      amount: p.amount,
      currency: p.currency,
      name: p.name,
      description: p.description,
      order_id: p.razorpayOrderId,
      prefill: p.prefill,
      notes: { order_no: p.orderNo },
      theme: { color: themeColor },
      handler: (r: RazorpayResult) => resolve(r),
      modal: { ondismiss: () => resolve(null) }
    });
    rzp.open();
  });
}

export const ORDER_STEPS = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const;
