import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let demo = { siteType: "restaurant", demoRows: 0, hasDemo: false };
const get = vi.fn((url: string) =>
  url === "/demo" ? Promise.resolve({ data: demo }) : Promise.resolve({ data: { fields: [], values: { template: "saffron", site_type: "restaurant" } } })
);
// backend jaisa: template ke type se site_type
const TYPE_OF: Record<string, string> = { saffron: "restaurant", bistro: "restaurant", noir: "restaurant", iron: "gym", pulse: "gym", zenfit: "gym" };
const put = vi.fn((_url: string, body: { template: string }) => Promise.resolve({ data: { template: body.template, site_type: TYPE_OF[body.template] } }));
const reload = vi.fn(() => Promise.resolve());
const post = vi.fn(() => {
  demo = { siteType: "restaurant", demoRows: 40, hasDemo: true };
  return Promise.resolve({ data: { imported: 40 } });
});
const del = vi.fn(() => Promise.resolve({ data: { removed: 40 } }));
let role = "ADMIN";

vi.mock("../lib/api", async (importOriginal) => {
  const real = await importOriginal<typeof import("../lib/api")>();
  return { ...real, api: { get: (u: string) => get(u), put: (u: string, b: { template: string }) => put(u, b), post: () => post(), delete: () => del() } };
});
vi.mock("../lib/auth", () => ({ useAuth: () => ({ user: { role }, login: vi.fn(), logout: vi.fn() }) }));
vi.mock("../lib/modules", () => ({ useReloadModules: () => reload }));

const { default: TemplatesPageInner, previewUrl } = await import("./TemplatesPage");
const { MemoryRouter } = await import("react-router-dom");
// Link / useNavigate ke liye router
const TemplatesPage = () => (
  <MemoryRouter>
    <TemplatesPageInner />
  </MemoryRouter>
);

describe("TemplatesPage", () => {
  beforeEach(() => {
    get.mockClear();
    put.mockClear();
    post.mockClear();
    reload.mockClear();
    role = "ADMIN";
    demo = { siteType: "restaurant", demoRows: 0, hasDemo: false };
  });

  it("website type ke 3 templates live preview ke saath, current Active", async () => {
    const { container } = render(<TemplatesPage />);
    await waitFor(() => expect(screen.getByText("Active")).toBeInTheDocument());
    expect(container.querySelectorAll("iframe")).toHaveLength(3);
    expect(container.querySelector("iframe")?.getAttribute("src")).toBe(previewUrl("saffron"));
    expect(screen.getAllByRole("button", { name: "Apply" })).toHaveLength(2);
  });

  it("Apply se template save", async () => {
    render(<TemplatesPage />);
    await waitFor(() => screen.getByText("Active"));
    fireEvent.click(screen.getAllByRole("button", { name: "Apply" })[0]);
    await waitFor(() => expect(put).toHaveBeenCalledWith("/settings", { template: "bistro" }));
  });

  it("dusre type ke templates dekh sakte hain (warning ke saath)", async () => {
    const { container } = render(<TemplatesPage />);
    await waitFor(() => screen.getByText("Active"));
    fireEvent.change(screen.getByLabelText("Website type"), { target: { value: "gym" } });
    expect(container.querySelector("iframe")?.getAttribute("src")).toBe(previewUrl("iron"));
    expect(screen.getByText(/applying one will switch/)).toBeInTheDocument();
  });

  it("dusre type ka template apply => confirm, type badle, sidebar reload", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<TemplatesPage />);
    await waitFor(() => screen.getByText("Active"));
    fireEvent.change(screen.getByLabelText("Website type"), { target: { value: "gym" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Apply" })[1]);
    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => expect(put).toHaveBeenCalledWith("/settings", { template: "pulse" }));
    await waitFor(() => expect(reload).toHaveBeenCalled());
    expect((screen.getByLabelText("Website type") as HTMLSelectElement).value).toBe("gym");
    expect(screen.getByText(/Gym \/ Fitness \(your type\)/)).toBeInTheDocument();
    confirmSpy.mockRestore();
  });

  it("confirm cancel => kuch save nahi", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<TemplatesPage />);
    await waitFor(() => screen.getByText("Active"));
    fireEvent.change(screen.getByLabelText("Website type"), { target: { value: "gym" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Apply" })[0]);
    expect(put).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("demo import one click", async () => {
    render(<TemplatesPage />);
    await waitFor(() => screen.getByText("Restaurant / Cafe demo content"));
    fireEvent.click(screen.getByRole("button", { name: /Import demo content/ }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText("Demo content is live (40 records)")).toBeInTheDocument());
  });

  it("editor na apply kar sakta na demo import", async () => {
    role = "EDITOR";
    render(<TemplatesPage />);
    await waitFor(() => screen.getByText("Active"));
    expect(screen.queryByRole("button", { name: "Apply" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Import demo/ })).toBeNull();
    expect(screen.getByText("Only admins can change the template.")).toBeInTheDocument();
  });
});
