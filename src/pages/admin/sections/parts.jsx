import { useRef, useState } from "react";
import { Upload, Loader2, Trash2 } from "lucide-react";

import { uploadImage } from "../../../api/admin.js";
import { assetUrl } from "../../../api/client.js";
import { useToast } from "../../../components/admin/toastContext.js";

/**
 * Shared image picker for the admin forms. Uploads to /api/admin/uploads and
 * stores the returned server path; also accepts a pasted URL. Used by Staff,
 * Services, Offers and Gallery so the upload behaviour stays identical.
 */
export function ImageField({ label = "Image", value, onChange, hint }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setBusy(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
      toast.success("Image uploaded.");
    } catch (err) {
      toast.error(err.message || "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <span className="text-sm font-medium text-ivory-dim">{label}</span>
      <div className="mt-1 flex items-start gap-3">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-ink-600 bg-ink-700">
          {value ? (
            <img src={assetUrl(value)} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[0.6rem] text-ash">No image</span>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-700 px-3 py-1.5 text-xs font-medium text-ivory-dim transition hover:border-champagne hover:text-ivory disabled:opacity-50"
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {busy ? "Uploading…" : "Upload"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-700 px-3 py-1.5 text-xs font-medium text-ash transition hover:border-red-400/40 hover:text-red-300"
              >
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>
          <input
            type="url"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="…or paste an image URL"
            className="w-full rounded-lg border border-ink-600 bg-ink-700 px-3 py-1.5 text-xs text-ivory placeholder-ash focus:border-champagne focus:outline-none"
          />
          {hint && <p className="text-[0.7rem] text-ash">{hint}</p>}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}

/** A search + filter toolbar row shared by list sections. */
export function Toolbar({ children }) {
  return <div className="mb-5 flex flex-wrap items-center gap-2">{children}</div>;
}

/** A compact select used for list filters. */
export function FilterSelect({ value, onChange, children, label }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-ash">
      {label && <span className="hidden sm:inline">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-sm text-ivory focus:border-champagne focus:outline-none"
      >
        {children}
      </select>
    </label>
  );
}
