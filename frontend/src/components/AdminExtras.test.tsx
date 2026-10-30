// Bulk select, drag-drop order, notifications bell, dark mode
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
vi.mock("../lib/api", async (orig) => {
  const real = await orig<typeof import("../lib/api")>();
  return { ...real, api: { get: (u: string) => get(u) } };
});

const { default: DataTable } = await import("./DataTable");
const { default: ReorderList, moveItem, orderPayload } = await import("./ReorderList");
const { default: NotificationBell, badgeText } = await import("./NotificationBell");
const { DARK_CLASS, isDark, NEXT_MODE, readTheme, THEME_KEY, useAdminTheme } = await import("./theme");
const { bulkMessage } = await import("../pages/ModuleListPage");

type R = { id: number; name: string };
const ROWS: R[] = [
  { id: 1, name: "One" },
  { id: 2, name: "Two" },
  { id: 3, name: "Three" }
];

describe("bulk select", () => {
  it("rows chuno => bar, action ko sirf chuni rows", async () => {
    const del = vi.fn(() => Promise.resolve());
    render(
      <MemoryRouter>
        <DataTable<R> id="b" columns={[{ key: "name", header: "Name", render: (r) => r.name }]} rows={ROWS} rowKey={(r) => r.id} bulkActions={[{ label: "Delete", danger: true, onClick: del }]} />
      </MemoryRouter>
    );
    expect(screen.queryByRole("toolbar", { name: "Bulk actions" })).toBeNull();
    const boxes = screen.getAllByLabelText("Select row");
    fireEvent.click(boxes[0]);
    fireEvent.click(boxes[2]);
    expect(screen.getByText("2 selected")).toBeInTheDocument();
    expect((screen.getByLabelText("Select all rows") as HTMLInputElement).indeterminate).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(del).toHaveBeenCalledWith([ROWS[0], ROWS[2]]));
    await waitFor(() => expect(screen.queryByText("2 selected")).toBeNull());

    fireEvent.click(screen.getByLabelText("Select all rows"));
    expect(screen.getByText("3 selected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(screen.queryByText("3 selected")).toBeNull();
  });

  it("bulk message", () => {
    expect(bulkMessage("publish", { done: 3, skipped: [] })).toBe("3 published");
    expect(bulkMessage("delete", { done: 1, skipped: [{ id: 9, reason: "Cannot delete: used in 2 Image Gallery record(s)" }] })).toBe(
      "1 deleted · 1 skipped (Cannot delete: used in 2 Image Gallery record(s))"
    );
  });
});

describe("drag & drop order", () => {
  it("helpers", () => {
    expect(moveItem([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
    expect(moveItem([1, 2, 3], 0, -1)).toEqual([1, 2, 3]);
    expect(orderPayload([{ id: 7 }, { id: 3 }])).toEqual([
      { id: 7, sort_order: 0 },
      { id: 3, sort_order: 1 }
    ]);
  });

  it("arrows se order + save", async () => {
    const save = vi.fn((_items: R[]) => Promise.resolve());
    render(<ReorderList<R> items={ROWS} render={(r) => r.name} onSave={save} onCancel={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Save order" })).toBeDisabled();
    fireEvent.click(screen.getAllByLabelText("Move down")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Save order" }));
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0][0].map((r) => r.id)).toEqual([2, 1, 3]);
    expect(screen.getAllByLabelText("Move up")[0]).toBeDisabled();
  });
});

describe("notifications bell", () => {
  beforeEach(() => get.mockReset());

  it("badge text", () => {
    expect(badgeText(0)).toBe("");
    expect(badgeText(7)).toBe("7");
    expect(badgeText(150)).toBe("99+");
  });

  it("count + list + links", async () => {
    get.mockResolvedValue({
      data: {
        total: 4,
        items: [
          { key: "enquiries", label: "3 new enquiries", count: 3, to: "/m/enquiries", tone: "blue" },
          { key: "orders", label: "1 order to ship", count: 1, to: "/store/orders?status=PLACED", tone: "violet" }
        ],
        recentEnquiries: [{ id: 12, name: "Riya", subject: "Admission", created_on: new Date().toISOString() }]
      }
    });
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    );
    const bell = await screen.findByRole("button", { name: "Notifications (4)" });
    fireEvent.click(bell);
    expect(screen.getByRole("link", { name: /3 new enquiries/ })).toHaveAttribute("href", "/m/enquiries");
    expect(screen.getByRole("link", { name: /1 order to ship/ })).toHaveAttribute("href", "/store/orders?status=PLACED");
    expect(screen.getByRole("link", { name: /Riya/ })).toHaveAttribute("href", "/m/enquiries/12");
  });

  it("kuch nahi => all caught up", async () => {
    get.mockResolvedValue({ data: { total: 0, items: [], recentEnquiries: [] } });
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    );
    await waitFor(() => expect(get).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.getByText(/All caught up/)).toBeInTheDocument();
  });
});

describe("dark mode", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(DARK_CLASS);
  });

  it("helpers", () => {
    expect(readTheme()).toBe("light");
    localStorage.setItem(THEME_KEY, "dark");
    expect(readTheme()).toBe("dark");
    localStorage.setItem(THEME_KEY, "purple");
    expect(readTheme()).toBe("light");
    expect(isDark("system", true)).toBe(true);
    expect(isDark("system", false)).toBe(false);
    expect([NEXT_MODE.light, NEXT_MODE.dark, NEXT_MODE.system]).toEqual(["dark", "system", "light"]);
  });

  it("html par class lagti, yaad rehti, admin se bahar hat-ti", () => {
    function Toggle() {
      const [mode, set] = useAdminTheme();
      return <button onClick={() => set(NEXT_MODE[mode])}>{mode}</button>;
    }
    const { unmount } = render(<Toggle />);
    expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(false);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "light" }));
    });
    expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(true);
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
    unmount();
    expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(false);
  });
});
