import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const DATA = {
  fields: [
    { key: "order_prefix", label: "Order Number Prefix", group: "Store", kind: "TEXT", secret: false, defaultValue: "ORD", help: null },
    { key: "shipping_fee", label: "Shipping Charge (₹)", group: "Shipping", kind: "DECIMAL", secret: false, defaultValue: "0", help: null },
    { key: "cod_enabled", label: "Cash on Delivery", group: "Payments", kind: "BOOLEAN", secret: false, defaultValue: "true", help: null },
    { key: "razorpay_key_id", label: "Razorpay Key ID", group: "Payments", kind: "TEXT", secret: false, defaultValue: "", help: null },
    { key: "razorpay_key_secret", label: "Razorpay Key Secret", group: "Payments", kind: "TEXT", secret: true, defaultValue: "", help: null },
    { key: "smtp_host", label: "SMTP Host", group: "Email", kind: "TEXT", secret: false, defaultValue: "", help: null }
  ],
  values: { order_prefix: "ORD", shipping_fee: "49", cod_enabled: true, razorpay_key_id: "rzp_test_abc", razorpay_key_secret: "", smtp_host: "" },
  secretsSet: { razorpay_key_secret: true },
  webhookUrl: "https://shop.example.com/api/public/shop/razorpay/webhook"
};

const get = vi.fn(() => Promise.resolve({ data: DATA }));
const put = vi.fn((_u: string, _b: Record<string, unknown>) => Promise.resolve({ data: DATA }));
const post = vi.fn((_u: string, _b?: unknown) => Promise.resolve({ data: { ok: true, mode: "TEST" } }));

vi.mock("../../lib/api", async (importOriginal) => {
  const real = await importOriginal<typeof import("../../lib/api")>();
  return { ...real, api: { get: () => get(), put: (u: string, b: Record<string, unknown>) => put(u, b), post: (u: string, b?: unknown) => post(u, b) } };
});

const { default: StoreSettingsPage } = await import("./StoreSettingsPage");

describe("StoreSettingsPage", () => {
  beforeEach(() => {
    put.mockClear();
    post.mockClear();
  });

  it("groups, webhook URL, saved-secret placeholder", async () => {
    render(<StoreSettingsPage />);
    await waitFor(() => screen.getByText("Order Number Prefix"));
    for (const g of ["Store", "Shipping", "Payments", "Email"]) expect(screen.getByRole("heading", { name: g })).toBeInTheDocument();
    expect(screen.getByLabelText("Webhook URL")).toHaveValue(DATA.webhookUrl);
    expect(screen.getByLabelText("Razorpay Key Secret")).toHaveAttribute("placeholder", "•••••• saved — type to replace");
    expect(screen.getByText("Test keys")).toBeInTheDocument();
  });

  it("save => sirf badle keys, khaali secret nahi", async () => {
    render(<StoreSettingsPage />);
    await waitFor(() => screen.getByText("Order Number Prefix"));
    fireEvent.change(screen.getByLabelText("Shipping Charge (₹)"), { target: { value: "59" } });
    fireEvent.click(screen.getByLabelText("Cash on Delivery"));
    fireEvent.click(screen.getAllByRole("button", { name: "Save Settings" })[0]);
    await waitFor(() => expect(put).toHaveBeenCalled());
    expect(put.mock.calls[0][1]).toEqual({ shipping_fee: "59", cod_enabled: false });
  });

  it("test connection => test-razorpay", async () => {
    render(<StoreSettingsPage />);
    await waitFor(() => screen.getByText("Order Number Prefix"));
    fireEvent.click(screen.getByRole("button", { name: /Test connection/ }));
    await waitFor(() => expect(post).toHaveBeenCalledWith("/shop/settings/test-razorpay", undefined));
  });
});
