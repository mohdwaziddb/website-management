import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Search } from "lucide-react";
import { ModuleIcon } from "./Icon";
import { NavItem, searchNav } from "./nav";

/** Ctrl+K / ⌘K: kisi bhi menu par seedha jao */
export default function CommandPalette({ items, open, onClose }: { items: NavItem[]; open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [index, setIndex] = useState(0);
  const list = useMemo(() => searchNav(items, q), [items, q]);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setIndex(0);
      setTimeout(() => input.current?.focus(), 30);
    }
  }, [open]);
  useEffect(() => setIndex(0), [q]);

  const go = (item: NavItem | undefined) => {
    if (!item) return;
    onClose();
    navigate(item.to);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(list.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(list[index]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[65] flex items-start justify-center bg-slate-900/40 p-4 pt-[12vh] backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog"
            aria-label="Quick search"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-slate-100 px-4">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKey}
                placeholder="Jump to… (Pages, Orders, Settings)"
                aria-label="Search menus"
                className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              <kbd className="rounded border border-slate-200 px-1.5 text-[11px] text-slate-400">Esc</kbd>
            </div>
            <ul role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
              {list.length === 0 && <li className="px-3 py-8 text-center text-sm text-slate-500">No menu matches “{q}”</li>}
              {list.map((item, i) => (
                <li key={item.to} role="option" aria-selected={i === index}>
                  <button
                    type="button"
                    onMouseEnter={() => setIndex(i)}
                    onClick={() => go(item)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${i === index ? "bg-brand-50 text-brand-700" : "text-slate-700"}`}
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${i === index ? "bg-white text-brand-600 shadow-sm" : "bg-slate-100 text-slate-500"}`}>
                      <ModuleIcon name={item.icon} />
                    </span>
                    <span className="flex-1 font-medium">{item.label}</span>
                    <span className="text-xs text-slate-400">{item.group}</span>
                    {i === index && <CornerDownLeft className="h-4 w-4 text-brand-500" />}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
