// Admin ki har list ka common table: search, filter panel, Export Excel, columns chhupao, compact pagination, ⋮ row menu.
// Server pagination (page / total) parent sambhalta hai — table sirf dikhata + events deta hai.
import { ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Filter,
  MoreVertical,
  Search,
  X,
} from "lucide-react";
import {
  Button,
  EmptyState,
  IconButton,
  Pagination,
  showToast,
  TableSkeleton,
} from "./ui";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Excel me kya jaaye (na ho to column export nahi hota) */
  exportValue?: (row: T) => string | number | boolean | null | undefined;
  align?: "left" | "right" | "center";
  /** false = hamesha dikhe (naam wala column) */
  hideable?: boolean;
  className?: string;
}

export interface RowAction<T> {
  label: string;
  icon?: ReactNode;
  onClick?: (row: T) => void;
  /** link wala action */
  to?: (row: T) => string;
  danger?: boolean;
  hidden?: (row: T) => boolean;
}

export interface DataTableProps<T> {
  /** columns ki pasand yaad rakhne ke liye (localStorage) */
  id: string;
  title?: ReactNode;
  columns: Column<T>[];
  rows: T[] | null;
  rowKey: (row: T) => string | number;
  loading?: boolean;
  total?: number;
  page?: number;
  size?: number;
  onPage?: (p: number) => void;
  search?: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  };
  /** Filter button ke andar ka panel */
  filters?: ReactNode;
  activeFilters?: number;
  onClearFilters?: () => void;
  /** Add / Import jaise buttons (search ke right) */
  toolbar?: ReactNode;
  /** Saari (filtered) rows laao — Export Excel */
  onExport?: () => Promise<T[]>;
  exportName?: string;
  rowActions?: (row: T) => RowAction<T>[];
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  /** row ke neeche / upar halka rang (e.g. disabled) */
  rowClassName?: (row: T) => string;
  /** Checkbox se kai rows chuno => upar bar me ye actions (Publish / Delete ...) */
  bulkActions?: BulkAction<T>[];
}

export interface BulkAction<T> {
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  /** kaam ho jaaye to selection saaf */
  onClick: (rows: T[]) => Promise<unknown> | void;
}

// ------------------------------------------------------------ helpers (testable)

/** Excel / CSV ka ek cell: quotes escape + formula injection se bachao (=, +, -, @ se shuru) */
export function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s = typeof v === "boolean" ? (v ? "Yes" : "No") : String(v);
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv<T>(columns: Column<T>[], rows: T[]): string {
  const cols = columns.filter((c) => c.exportValue);
  const head = cols.map((c) => csvCell(c.header)).join(",");
  const body = rows.map((r) =>
    cols.map((c) => csvCell(c.exportValue!(r))).join(","),
  );
  return [head, ...body].join("\r\n");
}

export function downloadCsv(name: string, csv: string) {
  // BOM = Excel me ₹ / Hindi sahi dikhe
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Server pagination wali API se saari rows (export ke liye), max 5000 */
export async function fetchAllPages<T>(
  load: (page: number, size: number) => Promise<{ items: T[]; total: number }>,
  size = 100,
  max = 5000,
): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; out.length < max; page++) {
    const r = await load(page, size);
    out.push(...r.items);
    if (r.items.length < size || out.length >= r.total) break;
  }
  return out.slice(0, max);
}

function readHidden(id: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(`wm_cols_${id}`) ?? "[]");
  } catch {
    return [];
  }
}

// ------------------------------------------------------------ small popovers

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return { open, setOpen, ref };
}

const panel =
  "absolute z-30 mt-2 rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10";

/** Table scroll box ke bahar bhi dikhe: screen position (fixed) se; neeche jagah na ho to upar */
export function menuPosition(
  rect: { top: number; bottom: number; right: number },
  items: number,
  viewport: { width: number; height: number },
) {
  const height = items * 38 + 10;
  const width = 192;
  const below = rect.bottom + 6 + height <= viewport.height;
  return {
    top: below ? rect.bottom + 6 : Math.max(8, rect.top - 6 - height),
    left: Math.max(8, Math.min(rect.right - width, viewport.width - width - 8)),
  };
}

function RowMenu<T>({ row, actions }: { row: T; actions: RowAction<T>[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const visible = actions.filter((a) => !a.hidden?.(row));
  // bahar click / Esc / scroll / resize = band (menu body me portal hai, isliye dono refs dekho)
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const outside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!btn.current?.contains(t) && !menu.current?.contains(t)) close();
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", esc);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);
  if (!visible.length) return null;
  const toggle = () => {
    if (!open && btn.current)
      setPos(
        menuPosition(btn.current.getBoundingClientRect(), visible.length, {
          width: window.innerWidth,
          height: window.innerHeight,
        }),
      );
    setOpen(!open);
  };
  const item =
    "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition";
  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        ref={btn}
        type="button"
        aria-label="Row actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${open ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800"}`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={menu}
              role="menu"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              style={{ position: "fixed", top: pos.top, left: pos.left }}
              className="z-50 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/10"
            >
              {visible.map((a) => {
                const cls = `${item} ${a.danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50"}`;
                return a.to ? (
                  <Link
                    key={a.label}
                    role="menuitem"
                    to={a.to(row)}
                    className={cls}
                    onClick={() => setOpen(false)}
                  >
                    {a.icon}
                    {a.label}
                  </Link>
                ) : (
                  <button
                    key={a.label}
                    role="menuitem"
                    type="button"
                    className={cls}
                    onClick={() => {
                      setOpen(false);
                      a.onClick?.(row);
                    }}
                  >
                    {a.icon}
                    {a.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}

// ------------------------------------------------------------ table

export default function DataTable<T>(p: DataTableProps<T>) {
  const [hidden, setHidden] = useState<string[]>(() => readHidden(p.id));
  const [text, setText] = useState(p.search?.value ?? "");
  const [exporting, setExporting] = useState(false);
  const filterPop = usePopover();
  const colPop = usePopover();
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  // page / filter / data badla => purana selection saaf
  useEffect(() => setSelected(new Set()), [p.rows]);
  const selectable = !!p.bulkActions?.length;
  const keys = (p.rows ?? []).map(p.rowKey);
  const allChecked = keys.length > 0 && keys.every((k) => selected.has(k));
  const someChecked = !allChecked && keys.some((k) => selected.has(k));
  const toggleRow = (k: string | number) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(keys));
  const runBulk = async (a: BulkAction<T>) => {
    const rows = (p.rows ?? []).filter((r) => selected.has(p.rowKey(r)));
    setBulkBusy(true);
    try {
      await a.onClick(rows);
      setSelected(new Set());
    } finally {
      setBulkBusy(false);
    }
  };

  // parent ne search reset kiya (Clear filters) to box bhi
  useEffect(() => setText(p.search?.value ?? ""), [p.search?.value]);
  // type karte hi (thoda ruk ke) search — Enter ki zaroorat nahi
  useEffect(() => {
    if (!p.search || text === p.search.value) return;
    const t = setTimeout(() => p.search!.onChange(text.trim()), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const toggleCol = (key: string) => {
    const next = hidden.includes(key)
      ? hidden.filter((k) => k !== key)
      : [...hidden, key];
    setHidden(next);
    try {
      localStorage.setItem(`wm_cols_${p.id}`, JSON.stringify(next));
    } catch {
      // ignore
    }
  };
  const cols = p.columns.filter(
    (c) => c.hideable === false || !hidden.includes(c.key),
  );
  const page = p.page ?? 1;
  const size = p.size ?? 20;
  const total = p.total ?? p.rows?.length ?? 0;
  const pages = Math.max(1, Math.ceil(total / size));
  const from = total === 0 ? 0 : (page - 1) * size + 1;
  const to = Math.min(total, page * size);
  const hasActions = !!p.rowActions;

  const doExport = async () => {
    if (!p.onExport) return;
    setExporting(true);
    try {
      const rows = await p.onExport();
      downloadCsv(p.exportName ?? p.id, toCsv(p.columns, rows));
      showToast(
        `Exported ${rows.length} record${rows.length === 1 ? "" : "s"}`,
      );
    } catch {
      showToast("Export failed — please try again", true);
    } finally {
      setExporting(false);
    }
  };

  const align = (c: Column<T>) =>
    c.align === "right"
      ? "text-right"
      : c.align === "center"
        ? "text-center"
        : "text-left";

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="space-y-3 p-4">
        {p.title && (
          <div className="text-sm font-medium text-slate-500">{p.title}</div>
        )}
        {selectable && selected.size > 0 && (
          <div role="toolbar" aria-label="Bulk actions" className="flex flex-wrap items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 ring-1 ring-brand-100">
            <span className="text-sm font-semibold text-brand-800">{selected.size} selected</span>
            <span className="mx-1 h-4 w-px bg-brand-200" />
            {p.bulkActions!.map((a) => (
              <Button key={a.label} size="sm" variant={a.danger ? "danger" : "secondary"} disabled={bulkBusy} onClick={() => runBulk(a)}>
                {a.icon}
                {a.label}
              </Button>
            ))}
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelected(new Set())}>
              Clear selection
            </Button>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {p.filters && (
            <div ref={filterPop.ref} className="relative">
              <Button
                variant="secondary"
                onClick={() => filterPop.setOpen(!filterPop.open)}
                aria-expanded={filterPop.open}
              >
                <Filter className="h-4 w-4" /> Filter
                {!!p.activeFilters && (
                  <span className="rounded-full bg-brand-600 px-1.5 text-[11px] text-white">
                    {p.activeFilters}
                  </span>
                )}
              </Button>
              <AnimatePresence>
                {filterPop.open && (
                  <motion.div
                    role="dialog"
                    aria-label="Filters"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className={`${panel} left-0 w-80 p-4`}
                  >
                    <div className="space-y-3">{p.filters}</div>
                    <div className="mt-4 flex justify-between border-t border-slate-100 pt-3">
                      {p.onClearFilters ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => p.onClearFilters?.()}
                        >
                          Clear all
                        </Button>
                      ) : (
                        <span />
                      )}
                      <Button
                        size="sm"
                        onClick={() => filterPop.setOpen(false)}
                      >
                        Done
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          {p.search && (
            <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                role="searchbox"
                aria-label={p.search.placeholder ?? "Search"}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && p.search!.onChange(text.trim())
                }
                placeholder={p.search.placeholder ?? "Search…"}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm shadow-sm outline-none transition hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
              />
              {text && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setText("");
                    p.search!.onChange("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {p.onExport && (
              <Button
                variant="secondary"
                onClick={doExport}
                loading={exporting}
                title="Download as Excel (CSV)"
              >
                {!exporting && <Download className="h-4 w-4" />} Export Excel
              </Button>
            )}
            {p.toolbar}
            {p.columns.some((c) => c.hideable !== false) && (
              <div ref={colPop.ref} className="relative">
                <IconButton
                  title="Show / hide columns"
                  onClick={() => colPop.setOpen(!colPop.open)}
                  className="h-9 w-9 justify-center border border-slate-200 bg-white"
                >
                  <Columns3 className="h-4 w-4" />
                </IconButton>
                <AnimatePresence>
                  {colPop.open && (
                    <motion.div
                      role="dialog"
                      aria-label="Columns"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className={`${panel} right-0 w-56 p-2`}
                    >
                      <div className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Columns
                      </div>
                      {p.columns
                        .filter((c) => c.hideable !== false)
                        .map((c) => (
                          <label
                            key={c.key}
                            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300"
                              checked={!hidden.includes(c.key)}
                              onChange={() => toggleCol(c.key)}
                            />
                            {c.header}
                          </label>
                        ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            {p.onPage && (
              <div className="flex items-center gap-1.5 pl-1 text-sm text-slate-500">
                <span className="whitespace-nowrap tabular-nums">
                  {total === 0 ? "0 of 0" : `${from}-${to} of ${total}`}
                </span>
                <IconButton
                  title="Previous page"
                  disabled={page <= 1}
                  onClick={() => p.onPage!(page - 1)}
                  className="h-9 w-9 justify-center border border-slate-200 bg-white disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </IconButton>
                <IconButton
                  title="Next page"
                  disabled={page >= pages}
                  onClick={() => p.onPage!(page + 1)}
                  className="h-9 w-9 justify-center border border-slate-200 bg-white disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </IconButton>
              </div>
            )}
          </div>
        </div>
      </div>

      {p.rows === null && p.loading !== false ? (
        <div className="border-t border-slate-100">
          <TableSkeleton cols={Math.min(cols.length + 1, 6)} />
        </div>
      ) : !p.rows || p.rows.length === 0 ? (
        <div className="border-t border-slate-100">
          {p.empty ?? <EmptyState title="No records" />}
        </div>
      ) : (
        <div
          className={`overflow-x-auto border-t border-slate-100 transition-opacity ${p.loading ? "opacity-60" : ""}`}
        >
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                {selectable && (
                  <th scope="col" className="w-10 py-3 pl-5 pr-0">
                    <input
                      type="checkbox"
                      aria-label="Select all rows"
                      className="h-4 w-4 rounded border-slate-300 text-brand-600"
                      checked={allChecked}
                      ref={(el) => {
                        if (el) el.indeterminate = someChecked;
                      }}
                      onChange={toggleAll}
                    />
                  </th>
                )}
                {cols.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    className={`whitespace-nowrap px-5 py-3 ${align(c)}`}
                  >
                    {c.header}
                  </th>
                ))}
                {hasActions && (
                  <th scope="col" className="w-20 px-5 py-3 text-center">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {p.rows.map((row) => (
                <tr
                  key={p.rowKey(row)}
                  onClick={p.onRowClick ? () => p.onRowClick!(row) : undefined}
                  className={`transition hover:bg-slate-50/70 ${p.onRowClick ? "cursor-pointer" : ""} ${selected.has(p.rowKey(row)) ? "bg-brand-50/40" : ""} ${p.rowClassName?.(row) ?? ""}`}
                >
                  {selectable && (
                    <td className="w-10 py-3.5 pl-5 pr-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label="Select row"
                        className="h-4 w-4 rounded border-slate-300 text-brand-600"
                        checked={selected.has(p.rowKey(row))}
                        onChange={() => toggleRow(p.rowKey(row))}
                      />
                    </td>
                  )}
                  {cols.map((c) => (
                    <td
                      key={c.key}
                      className={`px-5 py-3.5 align-middle text-slate-700 ${align(c)} ${c.className ?? ""}`}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-5 py-2 text-center">
                      <RowMenu row={row} actions={p.rowActions!(row)} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {p.onPage && total > size && (
        <Pagination page={page} size={size} total={total} onPage={p.onPage} />
      )}
    </div>
  );
}
