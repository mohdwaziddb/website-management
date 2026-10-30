import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn((_u: string, body: Record<string, unknown>) => Promise.resolve({ data: { id: 7, key: "custom-7", ...body } }));
const put = vi.fn((_u: string, _b: unknown) => Promise.resolve({ data: {} }));
const get = vi.fn(() =>
  Promise.resolve({
    data: [
      {
        id: 3,
        key: "custom-3",
        name: "Old Look",
        baseTemplate: "iron",
        type: "gym",
        config: {
          dark: true,
          colors: { primary: "#dc2626", accent: "#f97316", bg: "#0a0a0a", surface: "#141414", text: "#f5f5f5", muted: "#a3a3a3", heroText: "#ffffff", onPrimary: "#ffffff", onAccent: "#ffffff" },
          fonts: { heading: "Oswald", body: "Inter" },
          nav: "dark",
          hero: "centered",
          heading: "eyebrow",
          button: "rounded-none",
          radius: "none",
          card: "flat",
          sections: ["hero", "pricing:bold", "contact"]
        }
      }
    ]
  })
);

vi.mock("../lib/api", async (importOriginal) => {
  const real = await importOriginal<typeof import("../lib/api")>();
  return { ...real, api: { get: () => get(), post: (u: string, b: Record<string, unknown>) => post(u, b), put: (u: string, b: unknown) => put(u, b) } };
});
vi.mock("../lib/modules", () => ({ useReloadModules: () => () => Promise.resolve() }));

const { default: TemplateEditorPage } = await import("./TemplateEditorPage");

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/templates/new" element={<TemplateEditorPage />} />
        <Route path="/templates/:id" element={<TemplateEditorPage />} />
        <Route path="/templates" element={<div>Templates list</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("TemplateEditorPage", () => {
  beforeEach(() => {
    post.mockClear();
    put.mockClear();
  });

  it("Customize saffron: design load, change, save", async () => {
    const { container } = renderAt("/templates/new?base=saffron");
    expect(screen.getByDisplayValue("My Saffron")).toBeInTheDocument();
    expect(container.querySelector("iframe")?.getAttribute("src")).toBe("/?template=draft&preview=1");
    fireEvent.change(screen.getByLabelText("Hero style"), { target: { value: "typewriter" } });
    fireEvent.change(screen.getByLabelText("Primary hex"), { target: { value: "#123456" } });
    // FAQ on karo (saffron me nahi tha)
    fireEvent.click(screen.getByLabelText("Show FAQ"));
    // gallery ko upar le jao
    fireEvent.click(screen.getByLabelText("Move Gallery up"));
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    const body = post.mock.calls[0][1] as { name: string; baseTemplate: string; config: { hero: string; colors: { primary: string }; sections: string[] } };
    expect(body.baseTemplate).toBe("saffron");
    expect(body.config.hero).toBe("typewriter");
    expect(body.config.colors.primary).toBe("#123456");
    expect(body.config.sections[0]).toBe("hero");
    expect(body.config.sections).toContain("faq:accordion");
    expect(body.config.sections.indexOf("gallery:strip")).toBeLessThan(body.config.sections.indexOf("services:cards"));
    await waitFor(() => expect(screen.getByText("Templates list")).toBeInTheDocument());
  });

  it("edit existing custom template", async () => {
    renderAt("/templates/3");
    await waitFor(() => expect(screen.getByDisplayValue("Old Look")).toBeInTheDocument());
    expect((screen.getByLabelText("Hero style") as HTMLSelectElement).value).toBe("centered");
    expect((screen.getByLabelText("Show Hero (top banner)") as HTMLInputElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));
    await waitFor(() => expect(put).toHaveBeenCalledWith("/templates/custom/3", expect.objectContaining({ name: "Old Look", baseTemplate: "iron" })));
  });
});
