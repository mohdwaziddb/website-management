import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, Check, EyeOff, Star, Trash2 } from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { Button, Card, confirmDialog, PageHeader, showToast } from "../../components/ui";
import { formatDateTime } from "./shared";

type Review = {
  id: number;
  product_id: number;
  product_title: string;
  product_slug: string;
  customer_name: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified: boolean;
  is_approved: boolean;
  created_on: string;
};

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "all", label: "All" }
] as const;

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-4 w-4 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("pending");
  const [items, setItems] = useState<Review[] | null>(null);

  const load = useCallback(() => {
    setItems(null);
    api
      .get<Review[]>("/shop/reviews", { params: { status: tab } })
      .then((r) => setItems(r.data))
      .catch((e) => {
        setItems([]);
        showToast(errorMessage(e), true);
      });
  }, [tab]);

  useEffect(load, [load]);

  const setApproved = async (r: Review, approved: boolean) => {
    try {
      await api.put(`/shop/reviews/${r.id}`, { is_approved: approved });
      showToast(approved ? "Review approved — now visible on the website" : "Review hidden from the website");
      // tab ke hisaab se list se hatao ya update karo
      setItems((xs) => (xs ?? []).flatMap((x) => (x.id !== r.id ? [x] : tab === "all" ? [{ ...x, is_approved: approved }] : [])));
    } catch (e) {
      showToast(errorMessage(e), true);
    }
  };

  const remove = async (r: Review) => {
    const ok = await confirmDialog({
      title: "Delete this review?",
      message: (
        <>
          {r.customer_name}'s review of <b>{r.product_title}</b> will be permanently deleted.
        </>
      ),
      confirmText: "Delete",
      danger: true
    });
    if (!ok) return;
    try {
      await api.delete(`/shop/reviews/${r.id}`);
      showToast("Review deleted");
      setItems((xs) => (xs ?? []).filter((x) => x.id !== r.id));
    } catch (e) {
      showToast(errorMessage(e), true);
    }
  };

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Product reviews from customers — approve to show them on the website" />
      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3.5 py-1.5 text-sm ${tab === t.key ? "bg-brand-600 font-medium text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {items === null && <p className="py-10 text-center text-slate-400">Loading…</p>}
      {items && items.length === 0 && (
        <Card className="py-12 text-center text-sm text-slate-400">{tab === "pending" ? "No reviews waiting for approval" : "No reviews yet"}</Card>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <AnimatePresence initial={false}>
          {(items ?? []).map((r) => (
            <motion.div key={r.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}>
              <Card className="flex h-full flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Stars rating={Number(r.rating)} />
                    {r.title && <div className="mt-1 font-semibold text-slate-900">{r.title}</div>}
                  </div>
                  {tab === "all" && (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${r.is_approved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {r.is_approved ? "Approved" : "Pending"}
                    </span>
                  )}
                </div>
                {r.comment && <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{r.comment}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{r.customer_name}</span>
                  {r.is_verified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified purchase
                    </span>
                  )}
                  <span>·</span>
                  <span>{formatDateTime(r.created_on)}</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  on{" "}
                  <Link to={`/m/products/${r.product_id}`} className="font-medium text-brand-600 hover:underline">
                    {r.product_title}
                  </Link>
                </div>
                <div className="mt-auto flex justify-end gap-2 pt-3">
                  {r.is_approved ? (
                    <Button variant="secondary" onClick={() => setApproved(r, false)}>
                      <EyeOff className="h-4 w-4" /> Hide
                    </Button>
                  ) : (
                    <Button onClick={() => setApproved(r, true)}>
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                  )}
                  <button onClick={() => remove(r)} className="inline-flex items-center rounded-lg px-2.5 text-red-500 hover:bg-red-50" title="Delete" aria-label="Delete review">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
