import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Scissors, Star } from "lucide-react";

import {
  fetchServices,
  createService,
  updateService,
  deleteService,
  fetchStaff,
} from "../../../api/admin.js";
import { assetUrl } from "../../../api/client.js";
import { useAsync } from "../../../lib/useAsync.js";
import { formatCurrency } from "../../../lib/salon.js";
import { formatDuration } from "../../../lib/time.js";
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
  desc: "",
  image: "",
  category: "men",
  price: "",
  duration: "",
  skills: "",
  staff: [],
  featured: false,
  active: true,
  displayOrder: 0,
};

export default function ServicesSection({ query = "" }) {
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");

  const load = useCallback(
    (signal) => fetchServices({ q: query, status, category }, { signal }),
    [query, status, category]
  );
  const { data, loading, error, reload, setData } = useAsync(load);

  const [staffOptions, setStaffOptions] = useState([]);
  useEffect(() => {
    let alive = true;
    fetchStaff().then((s) => alive && setStaffOptions(s)).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const [editing, setEditing] = useState(null); // service being edited, or BLANK for new
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const services = data ?? [];

  const openNew = () => {
    setEditing(BLANK);
    setForm(BLANK);
    setErrors({});
  };
  const openEdit = (s) => {
    setEditing(s);
    setForm({
      title: s.title ?? "",
      desc: s.desc ?? "",
      image: s.image ?? "",
      category: s.category ?? "men",
      price: String(s.price ?? ""),
      duration: String(s.duration ?? ""),
      skills: (s.skills ?? []).join(", "),
      staff: s.staff ?? [],
      featured: Boolean(s.featured),
      active: s.active !== false,
      displayOrder: s.displayOrder ?? 0,
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
      desc: form.desc.trim(),
      image: form.image.trim(),
      category: form.category,
      price: Number(form.price),
      duration: Number(form.duration),
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      staff: form.staff,
      featured: form.featured,
      active: form.active,
      displayOrder: Number(form.displayOrder) || 0,
    };
    try {
      const isNew = editing === BLANK || !editing?.id;
      const saved = isNew
        ? await createService(payload)
        : await updateService(editing.id, payload);
      setData(isNew ? [saved, ...services] : services.map((s) => (s.id === saved.id ? saved : s)));
      toast.success(isNew ? "Service created." : "Service updated.");
      setEditing(null);
    } catch (err) {
      if (err.details) setErrors(err.details);
      toast.error(err.message || "Could not save the service.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      const res = await deleteService(confirm.id);
      if (res?.deleted) setData(services.filter((s) => s.id !== confirm.id));
      else setData(services.map((s) => (s.id === confirm.id ? res.service : s)));
      toast.success(res?.deleted ? "Service deleted." : "Service deactivated (it has bookings).");
      setConfirm(null);
    } catch (err) {
      toast.error(err.message || "Could not delete the service.");
    } finally {
      setDeleting(false);
    }
  };

  const toggleStaff = (id) =>
    setForm((prev) => ({
      ...prev,
      staff: prev.staff.includes(id) ? prev.staff.filter((x) => x !== id) : [...prev.staff, id],
    }));

  const isNew = editing === BLANK || !editing?.id;

  return (
    <div>
      <Toolbar>
        <FilterSelect value={category} onChange={setCategory} label="Category">
          <option value="">All categories</option>
          <option value="men">Men</option>
          <option value="women">Women</option>
        </FilterSelect>
        <FilterSelect value={status} onChange={setStatus} label="Status">
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </FilterSelect>
        <PrimaryButton onClick={openNew} className="ml-auto">
          <Plus size={16} /> New service
        </PrimaryButton>
      </Toolbar>

      {loading ? (
        <SectionLoader label="Loading services…" />
      ) : error ? (
        <SectionError message={error.message} onRetry={reload} />
      ) : services.length === 0 ? (
        <SectionEmpty
          title="No services"
          message="Add your first service to the menu."
          icon={Scissors}
          action={<PrimaryButton onClick={openNew}><Plus size={16} /> New service</PrimaryButton>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.id}
              className="flex gap-4 rounded-2xl border border-ivory/10 bg-ink-800 p-4"
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-ink-700">
                {s.image ? (
                  <img src={assetUrl(s.image)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-ash">
                    <Scissors size={20} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate font-medium text-ivory">{s.title}</h3>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="rounded-md p-1.5 text-ash transition hover:bg-ink-700 hover:text-ivory"
                      aria-label="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirm(s)}
                      className="rounded-md p-1.5 text-ash transition hover:bg-red-400/10 hover:text-red-300"
                      aria-label="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-ash">{s.desc || "No description"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-medium text-champagne-soft">
                    {formatCurrency(s.price)}
                  </span>
                  <span className="text-xs text-ash">· {formatDuration(s.duration)}</span>
                  <Pill tone="neutral">{s.category}</Pill>
                  {s.featured && (
                    <Pill tone="gold">
                      <Star size={11} /> Featured
                    </Pill>
                  )}
                  {!s.active && <Pill tone="off">Inactive</Pill>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / edit drawer */}
      <Drawer
        open={editing !== null}
        onClose={() => (saving ? null : setEditing(null))}
        title={isNew ? "New service" : "Edit service"}
        subtitle={isNew ? "Add a service to the menu" : editing?.title}
        footer={
          <div className="flex justify-end gap-3">
            <GhostButton onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </GhostButton>
            <PrimaryButton type="submit" form="service-form" busy={saving}>
              {isNew ? "Create" : "Save"}
            </PrimaryButton>
          </div>
        }
      >
        <form id="service-form" onSubmit={save} className="space-y-4">
          <Field label="Title" error={errors.title}>
            <TextInput value={form.title} onChange={(e) => set("title")(e.target.value)} error={errors.title} required />
          </Field>
          <Field label="Description" error={errors.desc}>
            <TextArea value={form.desc} onChange={(e) => set("desc")(e.target.value)} error={errors.desc} />
          </Field>
          <ImageField value={form.image} onChange={set("image")} hint="Shown on the service card." />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" error={errors.category}>
              <Select value={form.category} onChange={(e) => set("category")(e.target.value)} error={errors.category}>
                <option value="men">Men</option>
                <option value="women">Women</option>
              </Select>
            </Field>
            <Field label="Display order" error={errors.displayOrder}>
              <TextInput type="number" value={form.displayOrder} onChange={(e) => set("displayOrder")(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₹)" error={errors.price}>
              <TextInput type="number" min="0" value={form.price} onChange={(e) => set("price")(e.target.value)} error={errors.price} required />
            </Field>
            <Field label="Duration (min)" error={errors.duration}>
              <TextInput type="number" min="5" step="5" value={form.duration} onChange={(e) => set("duration")(e.target.value)} error={errors.duration} required />
            </Field>
          </div>
          <Field label="Skills" error={errors.skills} hint="Comma-separated, e.g. hair, beard. At least one.">
            <TextInput value={form.skills} onChange={(e) => set("skills")(e.target.value)} error={errors.skills} placeholder="hair, beard" />
          </Field>

          <div>
            <span className="text-sm font-medium text-ivory-dim">Qualified staff</span>
            {staffOptions.length === 0 ? (
              <p className="mt-1 text-xs text-ash">No staff yet.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {staffOptions.map((st) => {
                  const on = form.staff.includes(st.id);
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => toggleStaff(st.id)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        on
                          ? "border-champagne bg-champagne/15 text-champagne-soft"
                          : "border-ink-600 bg-ink-700 text-ivory-dim hover:border-ivory/30"
                      }`}
                    >
                      {st.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-6 pt-1">
            <Toggle checked={form.featured} onChange={set("featured")} label="Featured" />
            <Toggle checked={form.active} onChange={set("active")} label="Active" />
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        busy={deleting}
        title="Delete service?"
        message={`"${confirm?.title}" will be removed. If it has past bookings it is deactivated instead so history is preserved.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
