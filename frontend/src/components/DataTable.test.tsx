import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DataTable, { Column, csvCell, fetchAllPages, menuPosition, toCsv } from "./DataTable";

type R = { id: number; name: string; total: number };
const COLS: Column<R>[] = [
  { key: "name", header: "Name", hideable: false, render: (r) => r.name, exportValue: (r) => r.name },
  { key: "total", header: "Total", align: "right", render: (r) => `₹${r.total}`, exportValue: (r) => r.total }
];
const ROWS: R[] = [
  { id: 1, name: "Anjali", total: 100 },
  { id: 2, name: "Singh, Hardware", total: 4649 }
];

describe("csv export helpers", () => {
  it("cells: quotes, commas, formula injection", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(true)).toBe("Yes");
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("@cmd")).toBe("'@cmd");
    expect(csvCell("-12.5")).toBe("-12.5");
    expect(csvCell(42)).toBe("42");
  });

  it("toCsv: header + rows, sirf exportable columns", () => {
    expect(toCsv([...COLS, { key: "x", header: "Hidden", render: () => "" }], ROWS)).toBe('Name,Total\r\nAnjali,100\r\n"Singh, Hardware",4649');
  });

  it("fetchAllPages: page by page jab tak total na mile", async () => {
    const load = vi.fn((page: number, size: number) => {
      const all = Array.from({ length: 230 }, (_, i) => i);
      return Promise.resolve({ items: all.slice((page - 1) * size, page * size), total: 230 });
    });
    const rows = await fetchAllPages(load, 100);
    expect(rows).toHaveLength(230);
    expect(load).toHaveBeenCalledTimes(3);
  });

  it("row menu position: neeche jagah na ho to upar", () => {
    const vp = { width: 1000, height: 800 };
    expect(menuPosition({ top: 100, bottom: 130, right: 900 }, 3, vp)).toEqual({ top: 136, left: 708 });
    const up = menuPosition({ top: 760, bottom: 790, right: 900 }, 3, vp);
    expect(up.top).toBeLessThan(760);
    expect(menuPosition({ top: 100, bottom: 130, right: 50 }, 2, vp).left).toBe(8);
  });
});

describe("DataTable", () => {
  beforeEach(() => localStorage.clear());

  const renderTable = (extra: Partial<Parameters<typeof DataTable<R>>[0]> = {}) =>
    render(
      <MemoryRouter>
        <DataTable<R> id="t" title="Customers" columns={COLS} rows={ROWS} rowKey={(r) => r.id} total={18} page={1} size={10} onPage={vi.fn()} {...extra} />
      </MemoryRouter>
    );

  it("rows, compact pagination", () => {
    const onPage = vi.fn();
    renderTable({ onPage });
    expect(screen.getByText("Anjali")).toBeInTheDocument();
    expect(screen.getByText("1-10 of 18")).toBeInTheDocument();
    fireEvent.click(screen.getAllByLabelText("Next page")[0]);
    expect(onPage).toHaveBeenCalledWith(2);
  });

  it("columns chhupao — yaad rehta hai", () => {
    renderTable();
    fireEvent.click(screen.getByLabelText("Show / hide columns"));
    fireEvent.click(screen.getByRole("checkbox", { name: "Total" }));
    expect(screen.queryByText("₹100")).toBeNull();
    expect(JSON.parse(localStorage.getItem("wm_cols_t")!)).toEqual(["total"]);
    // naam wala column hamesha
    expect(screen.queryByRole("checkbox", { name: "Name" })).toBeNull();
  });

  it("⋮ menu actions", () => {
    const del = vi.fn();
    renderTable({ rowActions: () => [{ label: "Delete", onClick: del, danger: true }, { label: "Hidden", onClick: vi.fn(), hidden: () => true }] });
    fireEvent.click(screen.getAllByLabelText("Row actions")[1]);
    expect(screen.queryByRole("menuitem", { name: "Hidden" })).toBeNull();
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(del).toHaveBeenCalledWith(ROWS[1]);
  });

  it("search: type karte hi (debounce) + clear", async () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    renderTable({ search: { value: "", onChange, placeholder: "Search customer" } });
    fireEvent.change(screen.getByRole("searchbox", { name: "Search customer" }), { target: { value: "anj " } });
    expect(onChange).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(onChange).toHaveBeenCalledWith("anj");
    fireEvent.click(screen.getByLabelText("Clear search"));
    expect(onChange).toHaveBeenLastCalledWith("");
    vi.useRealTimers();
  });

  it("export: saari rows CSV me", async () => {
    const created: string[] = [];
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      created.push(this.download);
    });
    const onExport = vi.fn(() => Promise.resolve(ROWS));
    renderTable({ onExport, exportName: "customers" });
    fireEvent.click(screen.getByRole("button", { name: /Export Excel/ }));
    await waitFor(() => expect(created[0]).toMatch(/^customers-\d{4}-\d{2}-\d{2}\.csv$/));
    expect(onExport).toHaveBeenCalled();
    click.mockRestore();
  });

  it("filter panel + count + empty state", () => {
    const clear = vi.fn();
    render(
      <MemoryRouter>
        <DataTable<R> id="e" columns={COLS} rows={[]} rowKey={(r) => r.id} filters={<span>Status filter</span>} activeFilters={2} onClearFilters={clear} empty={<span>Nothing here</span>} />
      </MemoryRouter>
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Filter/ }));
    expect(screen.getByText("Status filter")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(clear).toHaveBeenCalled();
  });
});
