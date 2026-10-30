// Naye admin design ke pages: dashboard, login, list, form, profile, settings, layout (sidebar hide/show, Ctrl+K)
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FieldDef, ModuleDef } from "../lib/types";

const MODULES: ModuleDef[] = [
  {
    key: "pages",
    label: "Pages",
    group: "Content",
    icon: "file-text",
    titleField: "title",
    publishable: true,
    sortable: false,
    fields: [
      { name: "title", label: "Page Title", type: "TEXT", required: true, listed: true, searchable: true, unique: false, ref: null, options: [], help: null, min: null },
      { name: "banner_image", label: "Banner", type: "IMAGE", required: false, listed: true, searchable: false, unique: false, ref: null, options: [], help: null, min: null }
    ]
  },
  { key: "products", label: "Products", group: "Store", icon: "shopping-bag", titleField: "title", publishable: true, sortable: true, fields: [] }
];

const get = vi.fn();
const put = vi.fn((_u: string, _b: unknown) => Promise.resolve({ data: {} }));
const post = vi.fn((_u: string, _b: unknown) => Promise.resolve({ data: {} }));
const login = vi.fn();
const logout = vi.fn();

vi.mock("../lib/api", async (orig) => {
  const real = await orig<typeof import("../lib/api")>();
  return { ...real, api: { get: (u: string, c?: unknown) => get(u, c), put: (u: string, b: unknown) => put(u, b), post: (u: string, b: unknown) => post(u, b), delete: vi.fn() } };
});
vi.mock("../lib/auth", () => ({ useAuth: () => ({ user: { userId: 1, name: "Anita Sharma", email: "anita@x.com", role: "ADMIN", scope: "TENANT", tenant: "demo" }, login, logout }) }));
vi.mock("../lib/modules", () => ({
  useModules: () => MODULES,
  useModule: (k: string) => MODULES.find((m) => m.key === k),
  useReloadModules: () => () => Promise.resolve()
}));

const { default: DashboardPage, setupChecklist } = await import("./DashboardPage");
const { default: LoginPage } = await import("./LoginPage");
const { default: ModuleListPage } = await import("./ModuleListPage");
const { default: ModuleFormPage, formBody, isDirty } = await import("./ModuleFormPage");
const { passwordStrength } = await import("./ProfilePage");
const { groupSettings } = await import("./SettingsPage");
const { default: Layout, MINI_KEY } = await import("../components/Layout");

function routeApi(map: Record<string, unknown>) {
  get.mockImplementation((url: string) => {
    const hit = Object.keys(map).find((k) => url.startsWith(k));
    return hit ? Promise.resolve({ data: map[hit] }) : Promise.reject(new Error("no route " + url));
  });
}

beforeEach(() => {
  get.mockReset();
  get.mockImplementation(() => Promise.reject(new Error("no api in test")));
  put.mockClear();
  post.mockClear();
  login.mockReset();
  localStorage.clear();
});

describe("Dashboard", () => {
  const stats = [
    { key: "pages", label: "Pages", group: "Content", icon: "file-text", total: 3, published: 2 },
    { key: "sliders", label: "Home Sliders", group: "Content", icon: "images", total: 0, published: 0 },
    { key: "products", label: "Products", group: "Store", icon: "shopping-bag", total: 5, published: 5 }
  ];

  it("setup checklist", () => {
    const list = setupChecklist({ logo: "/files/x.png", phone: "1", email: "a@b.c", instagram: "https://i" }, stats);
    const done = Object.fromEntries(list.map((c) => [c.label, c.done]));
    expect(done["Upload your logo"]).toBe(true);
    expect(done["Add phone & email"]).toBe(true);
    expect(done["Add your address"]).toBe(false);
    expect(done["Link a social profile"]).toBe(true);
    expect(done["Add a home slider"]).toBe(false);
    expect(done["Add your first product"]).toBe(true);
  });

  it("hero, store numbers, content, activity", async () => {
    routeApi({
      "/dashboard": stats,
      "/settings": { values: { site_type: "ecommerce", template: "shopfront" } },
      "/logs": { items: [{ id: 1, module: "pages", action: "CREATE", summary: "Created \"About\"", user_name: "Anita", created_on: new Date().toISOString() }] },
      "/shop/summary": { today: { orders: 4, revenue: 2500 }, month: { orders: 30, revenue: 90000 }, byStatus: { PLACED: 2, CONFIRMED: 1, PACKED: 0 }, lowStock: [1] }
    });
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText("Anita")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Orders today")).toBeInTheDocument());
    expect(screen.getByText("Shopfront")).toBeInTheDocument();
    expect(screen.getByText("Created \"About\"")).toBeInTheDocument();
    expect(screen.getByText("Add product")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Setup progress" })).toBeInTheDocument();
  });
});

describe("Login", () => {
  it("show/hide password, remember email, error", async () => {
    routeApi({});
    login.mockRejectedValueOnce({ response: { data: { message: "Invalid email or password" } } }).mockResolvedValueOnce(undefined);
    render(<LoginPage />);
    // jsdom host = localhost = root domain => super admin login
    expect(screen.getByText("Super admin sign in")).toBeInTheDocument();
    const pw = screen.getByLabelText("Password");
    expect(pw).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByLabelText("Show password"));
    expect(pw).toHaveAttribute("type", "text");

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "anita@x.com" } });
    fireEvent.change(pw, { target: { value: "wrong-pass" } });
    fireEvent.click(screen.getByLabelText("Remember my email"));
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(pw).toHaveValue("");

    fireEvent.change(pw, { target: { value: "Secret@123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(login).toHaveBeenLastCalledWith("anita@x.com", "Secret@123"));
    await waitFor(() => expect(localStorage.getItem("wm_login_email")).toBe("anita@x.com"));
  });
});

describe("Module list + form", () => {
  const renderAt = (path: string) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/m/:key" element={<ModuleListPage />} />
          <Route path="/m/:key/:id" element={<ModuleFormPage />} />
        </Routes>
      </MemoryRouter>
    );

  it("list: rows, image placeholder, publish switch", async () => {
    routeApi({ "/m/pages": { items: [{ id: 7, title: "About Us", banner_image: null, is_publish: true }], total: 1, page: 1, size: 20 } });
    renderAt("/m/pages");
    await waitFor(() => expect(screen.getByText("About Us")).toBeInTheDocument());
    expect(screen.getByText("1 record · Content")).toBeInTheDocument();
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-checked", "true");
    fireEvent.click(sw);
    await waitFor(() => expect(put).toHaveBeenCalledWith("/m/pages/7", { is_publish: false }));
    // ⋮ menu se bhi
    fireEvent.click(screen.getByLabelText("Row actions"));
    expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveAttribute("href", "/m/pages/7");
    expect(screen.getByRole("menuitem", { name: "Move to draft" })).toBeInTheDocument();
  });

  it("list: empty state with add button", async () => {
    routeApi({ "/m/pages": { items: [], total: 0, page: 1, size: 20 } });
    renderAt("/m/pages");
    await waitFor(() => expect(screen.getByText("No pages yet")).toBeInTheDocument());
    // toolbar + khaali table dono jagah "Add Page"
    const links = screen.getAllByRole("link", { name: /Add Page/ });
    expect(links).toHaveLength(2);
    links.forEach((l) => expect(l).toHaveAttribute("href", "/m/pages/new"));
  });

  it("form helpers: body + dirty", () => {
    const m = MODULES[0];
    expect(formBody(m, { id: 3, title: "A", created_on: "x", is_publish: true })).toEqual({ title: "A", banner_image: null, is_publish: true, is_active: true });
    expect(isDirty(m, { title: "A", is_publish: true }, { title: "A", is_publish: true, banner_image: "" })).toBe(false);
    expect(isDirty(m, { title: "A" }, { title: "B" })).toBe(true);
    expect(isDirty(m, null, { title: "B" })).toBe(false);
  });

  it("form: switches + unsaved marker + save", async () => {
    renderAt("/m/pages/new");
    expect(screen.getByText("Add Page")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Contact" } });
    expect(screen.getByText("● Unsaved changes")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: "Publish on website" }));
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));
    await waitFor(() => expect(post).toHaveBeenCalledWith("/m/pages", { title: "Contact", banner_image: null, is_publish: false, is_active: true }));
  });
});

describe("profile + settings helpers", () => {
  it("password strength", () => {
    expect(passwordStrength("short")).toBe(0);
    expect(passwordStrength("abcdefgh")).toBe(1);
    expect(passwordStrength("Abcdefgh")).toBe(2);
    expect(passwordStrength("Abcdefg1")).toBe(3);
    expect(passwordStrength("Abcdefg1!")).toBe(4);
  });

  it("settings grouped into sections", () => {
    const f = (name: string): FieldDef => ({ name, label: name, type: "TEXT", required: false, listed: false, searchable: false, unique: false, ref: null, options: [], help: null, min: null });
    const groups = groupSettings([f("site_name"), f("phone"), f("facebook"), f("cta_text"), f("something_new")]);
    expect(groups.map((g) => [g.title, g.fields.map((x) => x.name)])).toEqual([
      ["Website & design", ["site_name"]],
      ["Contact details", ["phone"]],
      ["Social media", ["facebook"]],
      ["Buttons & footer", ["cta_text"]],
      ["More", ["something_new"]]
    ]);
  });
});

describe("Layout", () => {
  const renderLayout = () =>
    render(
      <MemoryRouter initialEntries={["/m/pages"]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/m/pages" element={<div>Pages content</div>} />
            <Route path="/m/products" element={<div>Products content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

  it("sidebar hide / show (yaad rehta hai) + breadcrumb", async () => {
    routeApi({ "/tenant-info": { name: "Sunrise School", logo: null } });
    renderLayout();
    await waitFor(() => expect(screen.getAllByText("Sunrise School").length).toBeGreaterThan(0));
    expect(screen.getByRole("navigation", { name: "Location" })).toHaveTextContent("Pages");
    expect(screen.getByText("Store")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Hide sidebar"));
    expect(localStorage.getItem(MINI_KEY)).toBe("1");
    // chhote sidebar me naam nahi, sirf icon (title / aria-label)
    expect(screen.queryByText("Store")).toBeNull();
    expect(screen.getByRole("link", { name: "Products" })).toHaveAttribute("title", "Products");
    // header ka button + sidebar ka logo — dono "Show sidebar"
    const show = screen.getAllByLabelText("Show sidebar");
    expect(show).toHaveLength(2);
    fireEvent.click(show[0]);
    expect(localStorage.getItem(MINI_KEY)).toBe("0");
    expect(screen.getByText("Store")).toBeInTheDocument();
  });

  it("chhote sidebar me logo click = sidebar khul jaata hai (dashboard nahi khulta)", async () => {
    routeApi({ "/tenant-info": { name: "Sunrise School", logo: null } });
    localStorage.setItem(MINI_KEY, "1");
    renderLayout();
    const logo = screen.getAllByLabelText("Show sidebar").find((el) => el.tagName === "A")!;
    fireEvent.click(logo);
    expect(localStorage.getItem(MINI_KEY)).toBe("0");
    expect(screen.getByText("Store")).toBeInTheDocument();
    expect(screen.getByText("Pages content")).toBeInTheDocument();
  });

  it("Ctrl+K quick search jaata hai", async () => {
    routeApi({ "/tenant-info": { name: "Sunrise School", logo: null } });
    renderLayout();
    act(() => {
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    });
    const input = await screen.findByLabelText("Search menus", { selector: "input" });
    fireEvent.change(input, { target: { value: "prod" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(screen.getByText("Products content")).toBeInTheDocument());
  });
});
