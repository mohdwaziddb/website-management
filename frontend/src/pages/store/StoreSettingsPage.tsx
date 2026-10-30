import { FormEvent, useEffect, useState } from "react";
import { Copy, CreditCard, Mail, PlugZap, Send, Store, Truck } from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { baseInputClass, Button, Card, ErrorBox, inputClass, PageHeader, showToast } from "../../components/ui";
import { settingsDiff, type StoreSettingField } from "./shared";

type SettingsData = {
  fields: StoreSettingField[];
  values: Record<string, unknown>;
  secretsSet: Record<string, boolean>;
  webhookUrl: string;
};

const GROUPS = [
  { key: "Store", title: "Store", subtitle: "Invoice details, GST and order numbers", icon: Store },
  { key: "Shipping", title: "Shipping", subtitle: "Delivery charges", icon: Truck },
  { key: "Payments", title: "Payments", subtitle: "Cash on delivery and Razorpay (UPI / cards / netbanking)", icon: CreditCard },
  { key: "Email", title: "Email", subtitle: "SMTP for order emails to customers and you", icon: Mail }
];

const RZP_EVENTS = ["payment.captured", "payment.failed", "order.paid"];

function SettingInput({ f, value, secretSaved, onChange }: { f: StoreSettingField; value: unknown; secretSaved: boolean; onChange: (v: unknown) => void }) {
  const id = `s-${f.key}`;
  if (f.kind === "BOOLEAN") {
    const on = value === true;
    return (
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <span className="relative mt-0.5 inline-flex shrink-0">
          <input id={id} type="checkbox" role="switch" className="peer sr-only" checked={on} onChange={(e) => onChange(e.target.checked)} />
          <span className="h-5 w-9 rounded-full bg-slate-300 transition peer-checked:bg-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-200" />
          <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
        </span>
        <span>
          <span className="block text-sm font-medium text-slate-700">{f.label}</span>
          {f.help && <span className="block text-xs text-slate-500">{f.help}</span>}
        </span>
      </label>
    );
  }
  const str = value == null ? "" : String(value);
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {f.label}
      </label>
      {f.secret ? (
        <input
          id={id}
          type="password"
          autoComplete="new-password"
          className={inputClass}
          placeholder={secretSaved ? "•••••• saved — type to replace" : "Not set"}
          value={str}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          type={f.kind === "EMAIL" ? "email" : f.kind === "DECIMAL" || f.kind === "NUMBER" ? "number" : "text"}
          step={f.kind === "DECIMAL" ? "0.01" : f.kind === "NUMBER" ? "1" : undefined}
          min={f.kind === "DECIMAL" || f.kind === "NUMBER" ? 0 : undefined}
          className={inputClass}
          placeholder={f.defaultValue != null && f.defaultValue !== "" ? String(f.defaultValue) : undefined}
          value={str}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {f.help && <p className="mt-1 text-xs text-slate-500">{f.help}</p>}
    </div>
  );
}

function RazorpayHelp({ webhookUrl, keyId }: { webhookUrl: string; keyId: string }) {
  const [testing, setTesting] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      showToast("Webhook URL copied");
    } catch {
      showToast("Copy failed — select the URL and copy it manually", true);
    }
  };
  const test = async () => {
    setTesting(true);
    try {
      const r = await api.post<{ ok: boolean; mode: "TEST" | "LIVE" }>("/shop/settings/test-razorpay");
      if (r.data.ok) showToast(`Razorpay connected — ${r.data.mode === "LIVE" ? "LIVE mode (real payments)" : "TEST mode"}`);
      else showToast("Razorpay connection failed", true);
    } catch (e) {
      showToast(errorMessage(e), true);
    } finally {
      setTesting(false);
    }
  };
  const isTest = keyId.startsWith("rzp_test_");
  const isLive = keyId.startsWith("rzp_live_");

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-medium text-slate-800">Razorpay webhook</div>
        {(isTest || isLive) && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isLive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {isLive ? "Live keys" : "Test keys"}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <input readOnly aria-label="Webhook URL" className={`${baseInputClass} min-w-0 flex-1 bg-white font-mono text-xs`} value={webhookUrl} onFocus={(e) => e.target.select()} />
        <Button type="button" variant="secondary" onClick={copy}>
          <Copy className="h-4 w-4" /> Copy
        </Button>
      </div>
      <ol className="list-decimal space-y-1 pl-5 text-slate-600">
        <li>Razorpay Dashboard → Settings → Webhooks → Add New Webhook</li>
        <li>Webhook URL: the URL above</li>
        <li>
          Active events:{" "}
          {RZP_EVENTS.map((e, i) => (
            <span key={e}>
              <code className="rounded bg-white px-1 text-xs">{e}</code>
              {i < RZP_EVENTS.length - 1 ? ", " : ""}
            </span>
          ))}
        </li>
        <li>Secret: any strong text — paste the same value in “Razorpay Webhook Secret” here</li>
      </ol>
      <p className="text-xs text-slate-500">
        Keys starting with <code>rzp_test_</code> run in test mode — no real money moves. Use Razorpay test cards / test UPI (e.g. <code>success@razorpay</code>) to try a checkout. Switch to <code>rzp_live_</code> keys when you go live.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" disabled={testing} onClick={test}>
          <PlugZap className="h-4 w-4" /> {testing ? "Testing…" : "Test connection"}
        </Button>
        <span className="text-xs text-slate-500">Uses the saved keys — save first after changing them.</span>
      </div>
    </div>
  );
}

function TestEmail() {
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!to.trim()) return;
    setBusy(true);
    try {
      await api.post("/shop/settings/test-email", { to: to.trim() });
      showToast(`Test email sent to ${to.trim()}`);
    } catch (e) {
      showToast(errorMessage(e), true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
      <label htmlFor="test-email" className="mb-1 block text-sm font-medium text-slate-700">
        Send a test email
      </label>
      <div className="flex gap-2">
        <input
          id="test-email"
          type="email"
          className={`${baseInputClass} min-w-0 flex-1`}
          placeholder="you@example.com"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          onKeyDown={(e) => {
            // bahar wala Save form submit na ho
            if (e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
        />
        <Button type="button" variant="secondary" disabled={busy || !to.trim()} onClick={send}>
          <Send className="h-4 w-4" /> {busy ? "Sending…" : "Send"}
        </Button>
      </div>
      <p className="mt-1 text-xs text-slate-500">Uses the saved SMTP settings — save first after changing them.</p>
    </div>
  );
}

export default function StoreSettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const apply = (d: SettingsData) => {
    setData(d);
    setValues({ ...d.values });
  };

  useEffect(() => {
    api
      .get<SettingsData>("/shop/settings")
      .then((r) => apply(r.data))
      .catch((e) => setError(errorMessage(e)));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!data) return;
    const body = settingsDiff(data.fields, data.values, values);
    if (Object.keys(body).length === 0) {
      showToast("Nothing to save");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await api.put<SettingsData>("/shop/settings", body);
      apply(r.data);
      showToast("Store settings saved");
    } catch (err) {
      setError(errorMessage(err));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  };

  const dirty = data ? Object.keys(settingsDiff(data.fields, data.values, values)).length > 0 : false;

  return (
    <div className="mx-auto max-w-4xl">
      <form onSubmit={submit}>
        <PageHeader
          title="Store Settings"
          subtitle="Payments, shipping, GST invoice and order emails"
          actions={
            <Button type="submit" disabled={busy || !dirty}>
              {busy ? "Saving…" : "Save Settings"}
            </Button>
          }
        />
        <div className="space-y-5">
          <ErrorBox message={error} />
          {!data && !error && <p className="py-10 text-center text-slate-400">Loading…</p>}
          {data &&
            GROUPS.map((g) => {
              const fields = data.fields.filter((f) => f.group === g.key);
              if (fields.length === 0) return null;
              const Icon = g.icon;
              return (
                <Card key={g.key}>
                  <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-3.5">
                    <span className="rounded-lg bg-brand-50 p-2 text-brand-600">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="font-semibold text-slate-900">{g.title}</h2>
                      <p className="text-xs text-slate-500">{g.subtitle}</p>
                    </div>
                  </div>
                  <div className="grid gap-5 p-5 sm:grid-cols-2">
                    {fields.map((f) => (
                      <div key={f.key} className={f.key === "business_address" ? "sm:col-span-2" : f.kind === "BOOLEAN" ? "sm:col-span-2" : ""}>
                        <SettingInput f={f} value={values[f.key]} secretSaved={data.secretsSet[f.key] === true} onChange={(v) => setValues((p) => ({ ...p, [f.key]: v }))} />
                      </div>
                    ))}
                    {g.key === "Payments" && <RazorpayHelp webhookUrl={data.webhookUrl} keyId={String(values.razorpay_key_id ?? data.values.razorpay_key_id ?? "")} />}
                    {g.key === "Email" && <TestEmail />}
                  </div>
                </Card>
              );
            })}
          {/* backend ne koi naya group bheja jo upar list me nahi */}
          {data &&
            [...new Set(data.fields.map((f) => f.group))]
              .filter((g) => !GROUPS.some((x) => x.key === g))
              .map((g) => (
                <Card key={g} className="p-5">
                  <h2 className="mb-4 font-semibold text-slate-900">{g}</h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {data.fields
                      .filter((f) => f.group === g)
                      .map((f) => (
                        <SettingInput key={f.key} f={f} value={values[f.key]} secretSaved={data.secretsSet[f.key] === true} onChange={(v) => setValues((p) => ({ ...p, [f.key]: v }))} />
                      ))}
                  </div>
                </Card>
              ))}
        </div>
        {data && (
          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={busy || !dirty}>
              {busy ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
