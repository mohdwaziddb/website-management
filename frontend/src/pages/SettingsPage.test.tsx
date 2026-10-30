import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const FIELDS = [
  { name: "site_name", label: "Website Name", type: "TEXT", options: [] },
  { name: "site_type", label: "Website Type", type: "SELECT", options: ["school", "restaurant", "gym"] },
  { name: "phone", label: "Phone", type: "TEXT", options: [] },
  { name: "template", label: "Website Template", type: "SELECT", options: ["classic", "modern", "minimal", "vibrant", "elegant", "saffron", "bistro", "noir", "iron", "pulse", "zenfit"] }
];
const get = vi.fn(() => Promise.resolve({ data: { fields: FIELDS, values: { site_name: "Sunrise", site_type: "school", template: "classic", phone: "" } } }));
const put = vi.fn((_u: string, body: Record<string, unknown>) => Promise.resolve({ data: body }));
const reload = vi.fn(() => Promise.resolve());

vi.mock("../lib/api", async (importOriginal) => {
  const real = await importOriginal<typeof import("../lib/api")>();
  return { ...real, api: { get: () => get(), put: (u: string, b: Record<string, unknown>) => put(u, b) } };
});
vi.mock("../lib/auth", () => ({ useAuth: () => ({ user: { role: "ADMIN" } }) }));
vi.mock("../lib/modules", () => ({ useReloadModules: () => reload }));

const { default: SettingsPage } = await import("./SettingsPage");

function setup() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>
  );
}

const templateSelect = () => screen.getAllByRole("combobox").find((s) => (s as HTMLSelectElement).value && [...(s as HTMLSelectElement).options].some((o) => o.value === "classic" || o.value === "saffron" || o.value === "iron")) as HTMLSelectElement;
const optionValues = (s: HTMLSelectElement) => [...s.options].map((o) => o.value).filter(Boolean);

describe("SettingsPage: website type + template", () => {
  beforeEach(() => {
    put.mockClear();
    reload.mockClear();
  });

  it("template dropdown me sirf website type ke templates, Website Type ke neeche", async () => {
    setup();
    await waitFor(() => screen.getByText("Website Template"));
    expect(optionValues(templateSelect())).toEqual(["classic", "modern", "minimal", "vibrant", "elegant"]);
    const labels = screen.getAllByText(/^(Website Type|Website Template|Phone)$/).map((e) => e.textContent);
    expect(labels).toEqual(["Website Type", "Website Template", "Phone"]);
  });

  it("type badla => template us type ka pehla; save => sidebar reload", async () => {
    setup();
    await waitFor(() => screen.getByText("Website Template"));
    const typeSelect = screen.getAllByRole("combobox").find((s) => (s as HTMLSelectElement).value === "school")!;
    fireEvent.change(typeSelect, { target: { value: "restaurant" } });
    expect(optionValues(templateSelect())).toEqual(["saffron", "bistro", "noir"]);
    expect(templateSelect().value).toBe("saffron");
    fireEvent.click(screen.getByRole("button", { name: "Save Settings" }));
    await waitFor(() => expect(put).toHaveBeenCalled());
    expect(put.mock.calls[0][1]).toMatchObject({ site_type: "restaurant", template: "saffron" });
    await waitFor(() => expect(reload).toHaveBeenCalled());
  });
});
