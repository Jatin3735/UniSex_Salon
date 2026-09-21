import { useCallback, useState } from "react";
import { Plus, Pencil, Trash2, BadgePercent, Star } from "lucide-react";

import { fetchOffers, createOffer, updateOffer, deleteOffer } from "../../../api/admin.js";
import { assetUrl } from "../../../api/client.js";
import { useAsync } from "../../../lib/useAsync.js";
import { formatCurrency } from "../../../lib/salon.js";
import { useToast } from "../../../components/admin/toastContext.js";
import {
  Drawer,
  ConfirmDialog,
  Field,
  TextInput,
  TextArea,
  Select,
  Toggle,
  PrimaryButton,
  GhostButton,
  SectionLoader,
  SectionError,
  SectionEmpty,
  Pill,
} from "../../../components/admin/ui.jsx";
import { ImageField, Toolbar, FilterSelect } from "./parts.jsx";

const BLANK = {
  title: "",
  description: "",
  discountType: "percent",
  discountValue: "",
  promoCode: "",
  image: "",
  startDate: "",
  expiryDate: "",
  minBookingAmount: "",
  status: true,
  featured: false,
};

export default function OffersSection({ query = "" }) {
  const toast = useToast();
  const [status, setStatus] = useState("");

  const load = useCallback((signal) => fetchOffers({ q: query, status }, { signal }), [query, status]);
  const { data, loading, error, reload, setData } = useAsync(load);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const offers = data ?? [];

  const openNew = () => {
    setEditing(BLANK);
    setForm(BLANK);
    setErrors({});
  };
  const openEdit = (o) => {
    setEditing(o);
    setForm({
      title: o.title ?? "",
      description: o.description ?? "",
      discountType: o.discountType ?? "percent",
      discountValue: String(o.discountValue ?? ""),
      promoCode: o.promoCode ?? "",
      image: o.image ?? "",
      startDate: o.startDate ?? "",
      expiryDate: o.expiryDate ?? "",
      minBookingAmount: o.minBookingAmount != null ? String(o.minBookingAmount) : "",
      status: o.status !== false,
      featured: Boolean(o.featured),
    });
    setErrors({});
  };

  const set = (field) => (v) => setForm((prev) => ({ ...prev, [field]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      promoCode: form.promoCode.trim(),
      image: form.image.trim(),
      startDate: form.startDate,
      expiryDate: form.expiryDate,
      minBookingAmount: form.minBookingAmount === "" ? 0 : Number(form.minBookingAmount),
      status: form.status,
      featured: form.featured,
    };
    try {
      const isNew = editing === BLANK || !editing?.id;
      const saved = isNew ? await createOffer(payload) : await updateOffer(editing.id, payload);
      setData(isNew ? [saved, ...offers] : offers.map((o) => (o.id === saved.id ? saved : o)));
      toast.success(isNew ? "Offer created." : "Offer updated.");
      setEditing(null);
    } catch (err) {
      if (err.details) setErrors(err.details);
      toast.error(err.message || "Could not save the offer.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      await deleteOffer(confirm.id);
      setData(offers.filter((o) => o.id !== confirm.id));
      toast.success("Offer deleted.");
      setConfirm(null);
    } catch (err) {
      toast.error(err.message || "Could not delete the offer.");
    } finally {
      setDeleting(false);
    }
  };

  const discountLabel = (o) =>
    o.discountType === "percent" ? `${o.discountValue}% off` : `${formatCurrency(o.discountValue)} off`;

  const isNew = editing === BLANK || !editing?.id;

  return (
    <div>
      <Toolbar>
        <FilterSelect value={status} onChange={setStatus} label="Status">
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </FilterSelect>
        <PrimaryButton onClick={openNew} className="ml-auto">
          <Plus size={16} /> New offer
        </PrimaryButton>
      </Toolbar>

      {loading ? (
        <SectionLoader label="Loading offers…" />
      ) : error ? (
        <SectionError message={error.message} onRetry={reload} />
      ) : offers.length === 0 ? (
        <SectionEmpty
          title="No offers"
          message="Create a promotion to show on the site."
          icon={BadgePercent}
          action={<PrimaryButton onClick={openNew}><Plus size={16} /> New offer</PrimaryButton>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {offers.map((o) => (
            <div key={o.id} className="overflow-hidden rounded-2xl border border-ivory/10 bg-ink-800">
              {o.image && (
                <div className="h-28 w-full overflow-hidden bg-ink-700">
                  <img src={assetUrl(o.image)} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate font-medium text-ivory">{o.title}</h3>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => openEdit(o)} className="rounded-md p-1.5 text-ash transition hover:bg-ink-700 hover:text-ivory" aria-label="Edit">
                      <Pencil size={15} />
                    </button>
                    <button type="button" onClick={() => setConfirm(o)} className="rounded-md p-1.5 text-ash transition hover:bg-red-400/10 hover:text-red-300" aria-label="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-ash">{o.description || "No description"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Pill tone="gold">{discountLabel(o)}</Pill>
                  {o.promoCode && <Pill tone="neutral">{o.promoCode}</Pill>}
                  {o.featured && <Pill tone="gold"><Star size={11} /> Featured</Pill>}
                  <Pill tone={o.status ? "on" : "off"}>{o.status ? "Live" : "Off"}</Pill>
                </div>
                {(o.startDate || o.expiryDate) && (
                  <p className="mt-2 text-[0.7rem] text-ash">
                    {o.startDate || "—"} → {o.expiryDate || "no expiry"}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer
        open={editing !== null}
        onClose={() => (saving ? null : setEditing(null))}
        title={isNew ? "New offer" : "Edit offer"}
        subtitle={isNew ? "Create a promotion" : editing?.title}
        footer={
          <div className="flex justify-end gap-3">
            <GhostButton onClick={() => setEditing(null)} disabled={saving}>Cancel</GhostButton>
            <PrimaryButton type="submit" form="offer-form" busy={saving}>{isNew ? "Create" : "Save"}</PrimaryButton>
          </div>
        }
      >
        <form id="offer-form" onSubmit={save} className="space-y-4">
          <Field label="Title" error={errors.title}>
            <TextInput value={form.title} onChange={(e) => set("title")(e.target.value)} error={errors.title} required />
          </Field>
          <Field label="Description" error={errors.description} hint="Up to 600 characters.">
            <TextArea value={form.description} onChange={(e) => set("description")(e.target.value)} error={errors.description} />
          </Field>
          <ImageField value={form.image} onChange={set("image")} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Discount type" error={errors.discountType}>
              <Select value={form.discountType} onChange={(e) => set("discountType")(e.target.value)}>
                <option value="percent">Percentage</option>
                <option value="flat">Flat (₹)</option>
              </Select>
            </Field>
            <Field label={form.discountType === "percent" ? "Value (%)" : "Value (₹)"} error={errors.discountValue}>
              <TextInput type="number" min="0" value={form.discountValue} onChange={(e) => set("discountValue")(e.target.value)} error={errors.discountValue} required />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Promo code" error={errors.promoCode}>
              <TextInput value={form.promoCode} onChange={(e) => set("promoCode")(e.target.value)} placeholder="SAVE20" />
            </Field>
            <Field label="Min booking (₹)" error={errors.minBookingAmount}>
              <TextInput type="number" min="0" value={form.minBookingAmount} onChange={(e) => set("minBookingAmount")(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date" error={errors.startDate}>
              <TextInput type="date" value={form.startDate} onChange={(e) => set("startDate")(e.target.value)} error={errors.startDate} />
            </Field>
            <Field label="Expiry date" error={errors.expiryDate}>
              <TextInput type="date" value={form.expiryDate} onChange={(e) => set("expiryDate")(e.target.value)} error={errors.expiryDate} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-6 pt-1">
            <Toggle checked={form.status} onChange={set("status")} label="Live" />
            <Toggle checked={form.featured} onChange={set("featured")} label="Featured" />
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        busy={deleting}
        title="Delete offer?"
        message={`"${confirm?.title}" will be permanently deleted.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
