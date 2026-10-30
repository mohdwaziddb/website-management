// Website visitor ke liye: contact form (admin "Enquiries" me aata hai), newsletter subscribe, WhatsApp chat button
import { FormEvent, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, MessageCircle, Send } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { useSite } from "./data";
import { headingFont, useSetting } from "./ui";

const field = "w-full rounded-lg border border-site-text/15 bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition placeholder:text-site-muted/70 focus:border-[var(--primary)]";

/** Preview / showcase me form asli message na bheje */
function useLiveSite(): boolean {
  const { preview, showcase } = useSite();
  return !preview && !showcase;
}

export function EnquiryForm() {
  const live = useLiveSite();
  const { template } = useSite();
  const { pathname } = useLocation();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!live) {
      setError("This is a preview — the form works on your live website.");
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setError("Please share your email or phone so we can reply.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/public/enquiries", { ...form, page: pathname });
      setDone("Thank you! We have received your message and will get back to you soon.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "", website: "" });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[var(--surface)] p-5 shadow-sm ring-1 ring-site-text/10 sm:p-6">
      <h3 style={headingFont} className="text-xl font-bold">
        Send us a message
      </h3>
      <p className="mt-1 text-sm text-[var(--muted)]">We usually reply within one working day.</p>
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex flex-col items-center gap-3 py-6 text-center" role="status">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <p className="font-medium">{done}</p>
            <button type="button" onClick={() => setDone(null)} className="text-sm text-[var(--primary)] underline">
              Send another message
            </button>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} className="mt-5 space-y-3" aria-label="Contact form">
            <div className="grid gap-3 sm:grid-cols-2">
              <input aria-label="Your name" required maxLength={150} placeholder="Your name *" autoComplete="name" value={form.name} onChange={set("name")} className={field} />
              <input aria-label="Phone" inputMode="tel" maxLength={20} placeholder="Phone" autoComplete="tel" value={form.phone} onChange={set("phone")} className={field} />
            </div>
            <input aria-label="Email" type="email" maxLength={200} placeholder="Email" autoComplete="email" value={form.email} onChange={set("email")} className={field} />
            <input aria-label="Subject" maxLength={200} placeholder="Subject" value={form.subject} onChange={set("subject")} className={field} />
            <textarea aria-label="Message" required minLength={5} maxLength={2000} rows={4} placeholder="How can we help? *" value={form.message} onChange={set("message")} className={field} />
            {/* bots ke liye jaal — insaan ko dikhta nahi */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={set("website")} className="absolute left-[-9999px] h-0 w-0 opacity-0" />
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className={`inline-flex w-full items-center justify-center gap-2 bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--on-primary)] transition hover:brightness-110 disabled:opacity-60 ${template.button}`}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {busy ? "Sending…" : "Send message"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SubscribeBox() {
  const live = useLiveSite();
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<{ busy?: boolean; done?: boolean; error?: string }>({});

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!live) {
      setState({ error: "Works on your live website." });
      return;
    }
    setState({ busy: true });
    try {
      await api.post("/public/subscribe", { email, source: "Footer", website });
      setState({ done: true });
      setEmail("");
    } catch (err) {
      setState({ error: errorMessage(err) });
    }
  };

  return (
    <div>
      <div className="mb-3 font-semibold text-white">Stay updated</div>
      {state.done ? (
        <p className="flex items-center gap-2 text-sm" role="status">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" /> You're subscribed — thank you!
        </p>
      ) : (
        <form onSubmit={submit} className="flex gap-2" aria-label="Newsletter">
          <input
            type="email"
            required
            aria-label="Email for newsletter"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/50 focus:border-white/40"
          />
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} className="absolute left-[-9999px] h-0 w-0 opacity-0" />
          <button type="submit" disabled={state.busy} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)] disabled:opacity-60">
            {state.busy ? "…" : "Subscribe"}
          </button>
        </form>
      )}
      {state.error && <p className="mt-2 text-xs text-red-300">{state.error}</p>}
    </div>
  );
}

/** "+91 98765 43210" / "098765 43210" / "9876543210" -> "919876543210" (wa.me format). Galat => null */
export function whatsappNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) d = "91" + d;
  return /^\d{11,15}$/.test(d) ? d : null;
}

export function WhatsAppButton() {
  const number = whatsappNumber(useSetting("whatsapp"));
  const name = useSetting("site_name");
  if (!number) return null;
  const text = encodeURIComponent(`Hi${name ? ` ${name}` : ""}, I visited your website and have a question.`);
  return (
    <motion.a
      href={`https://wa.me/${number}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      title="Chat on WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring" }}
      whileHover={{ scale: 1.08 }}
      className="fixed bottom-4 right-4 z-[55] flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-xl shadow-black/20 sm:bottom-6 sm:right-6"
    >
      <MessageCircle className="h-7 w-7" />
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25d366] opacity-30" />
    </motion.a>
  );
}
