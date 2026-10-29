import { lazy, Suspense, useEffect, useState } from "react";
import { FileIcon, Upload, X } from "lucide-react";
import { api, errorMessage, fileUrl, uploadFile } from "../lib/api";
import { FieldDef, MONTHS } from "../lib/types";
import { inputClass, showToast } from "./ui";

// CKEditor bada hai — sirf form khulne par load ho
const RichTextEditor = lazy(() => import("./RichTextEditor"));

type Option = { id: number; label: string };
const optionCache = new Map<string, Promise<Option[]>>();

export function loadOptions(module: string): Promise<Option[]> {
  if (!optionCache.has(module)) {
    optionCache.set(
      module,
      api.get<Option[]>(`/m/${module}/options`).then((r) => r.data).catch((e) => {
        optionCache.delete(module);
        throw e;
      })
    );
  }
  return optionCache.get(module)!;
}

export function clearOptionCache(module: string) {
  optionCache.delete(module);
}

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  excludeId?: number;
  /** SELECT option ka dikhne wala naam (value wahi rehti hai), e.g. "real_estate" -> "Real Estate" */
  optionLabel?: (option: string) => string;
}

export default function FieldInput({ field, value, onChange, excludeId, optionLabel }: Props) {
  const str = value == null ? "" : String(value);

  switch (field.type) {
    case "TEXTAREA":
      return <textarea className={inputClass} rows={4} value={str} onChange={(e) => onChange(e.target.value)} />;
    case "RICHTEXT":
      return (
        <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-slate-100" />}>
          <RichTextEditor value={str} onChange={onChange} />
        </Suspense>
      );
    case "NUMBER":
      return <input type="number" className={inputClass} value={str} onChange={(e) => onChange(e.target.value)} />;
    case "DATE":
      return <input type="date" className={inputClass} value={str.slice(0, 10)} onChange={(e) => onChange(e.target.value)} />;
    case "URL":
      return <input type="url" className={inputClass} placeholder="https://" value={str} onChange={(e) => onChange(e.target.value)} />;
    case "BOOLEAN":
      return (
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" className="h-4 w-4" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
          Yes
        </label>
      );
    case "MONTH":
      return (
        <select className={inputClass} value={str} onChange={(e) => onChange(e.target.value)}>
          <option value="">— Select —</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      );
    case "SELECT":
      return (
        <select className={inputClass} value={str} onChange={(e) => onChange(e.target.value)}>
          <option value="">— Select —</option>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {optionLabel ? optionLabel(o) : o}
            </option>
          ))}
        </select>
      );
    case "REF":
      return <RefSelect module={field.ref!} value={str} onChange={onChange} excludeId={excludeId} />;
    case "IMAGE":
    case "FILE":
      return <FileField image={field.type === "IMAGE"} value={str} onChange={onChange} />;
    default:
      return <input className={inputClass} value={str} onChange={(e) => onChange(e.target.value)} />;
  }
}

function RefSelect({ module, value, onChange, excludeId }: { module: string; value: string; onChange: (v: unknown) => void; excludeId?: number }) {
  const [options, setOptions] = useState<Option[]>([]);
  useEffect(() => {
    loadOptions(module).then(setOptions).catch(() => setOptions([]));
  }, [module]);
  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">— Select —</option>
      {options
        .filter((o) => o.id !== excludeId)
        .map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
    </select>
  );
}

function FileField({ image, value, onChange }: { image: boolean; value: string; onChange: (v: unknown) => void }) {
  const [busy, setBusy] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const r = await uploadFile(file);
      onChange(r.url);
    } catch (e) {
      showToast(errorMessage(e), true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {value &&
        (image ? (
          <img src={fileUrl(value)} alt="" className="h-20 w-28 rounded-lg border border-slate-200 object-cover" />
        ) : (
          <a href={fileUrl(value)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-brand-600 underline">
            <FileIcon className="h-4 w-4" /> View file
          </a>
        ))}
      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
        <Upload className="h-4 w-4" />
        {busy ? "Uploading…" : value ? "Change" : "Upload"}
        <input
          type="file"
          className="hidden"
          accept={image ? "image/*" : undefined}
          disabled={busy}
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {value && (
        <button type="button" className="inline-flex items-center gap-1 text-sm text-red-600" onClick={() => onChange(null)}>
          <X className="h-4 w-4" /> Remove
        </button>
      )}
    </div>
  );
}
