// Drag & drop se order badlo (Sliders, Menus, Products ...). Mouse se khincho, ya ↑ ↓ buttons (keyboard / mobile).
import { ReactNode, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { Button, IconButton } from "./ui";

/** Naya order => server ko [{id, sort_order}] (0, 1, 2 ...) — testable */
export function orderPayload<T extends { id: number }>(items: T[]): { id: number; sort_order: number }[] {
  return items.map((it, i) => ({ id: it.id, sort_order: i }));
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}

function Row<T extends { id: number }>({ item, index, count, render, onMove }: {
  item: T;
  index: number;
  count: number;
  render: (item: T) => ReactNode;
  onMove: (from: number, to: number) => void;
}) {
  const drag = useDragControls();
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={drag}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
      whileDrag={{ scale: 1.02, boxShadow: "0 12px 30px rgba(15,23,42,0.15)" }}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        onPointerDown={(e) => drag.start(e)}
        className="cursor-grab touch-none rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <span className="w-7 text-sm tabular-nums text-slate-400">{index + 1}</span>
      <div className="min-w-0 flex-1">{render(item)}</div>
      <IconButton title="Move up" disabled={index === 0} onClick={() => onMove(index, index - 1)} className="disabled:opacity-30">
        <ArrowUp className="h-4 w-4" />
      </IconButton>
      <IconButton title="Move down" disabled={index === count - 1} onClick={() => onMove(index, index + 1)} className="disabled:opacity-30">
        <ArrowDown className="h-4 w-4" />
      </IconButton>
    </Reorder.Item>
  );
}

export default function ReorderList<T extends { id: number }>({ items: initial, render, onSave, onCancel }: {
  items: T[];
  render: (item: T) => ReactNode;
  onSave: (items: T[]) => Promise<void>;
  onCancel: () => void;
}) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState(false);
  const changed = items.some((it, i) => it.id !== initial[i]?.id);
  const save = async () => {
    setBusy(true);
    try {
      await onSave(items);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-brand-100">
        <span>Drag the handle (or use the arrows) to change the order shown on your website. Top = first.</span>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} loading={busy} disabled={!changed}>
            Save order
          </Button>
        </div>
      </div>
      <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2" aria-label="Reorder list">
        {items.map((it, i) => (
          <Row key={it.id} item={it} index={i} count={items.length} render={render} onMove={(f, t) => setItems((cur) => moveItem(cur, f, t))} />
        ))}
      </Reorder.Group>
    </div>
  );
}
