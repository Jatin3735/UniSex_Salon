import { useCallback, useState } from "react";
import { Plus, Pencil, Trash2, Images } from "lucide-react";

import {
  fetchGallery,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
} from "../../../api/admin.js";
import { assetUrl } from "../../../api/client.js";
import { useAsync } from "../../../lib/useAsync.js";
import { useToast } from "../../../components/admin/toastContext.js";
import {
  Modal,
  ConfirmDialog,
  Field,
  TextInput,
  Toggle,
  PrimaryButton,
  GhostButton,
  SectionLoader,
  SectionError,
  SectionEmpty,
  Pill,
} from "../../../components/admin/ui.jsx";
import { ImageField, Toolbar, FilterSelect } from "./parts.jsx";

const BLANK = { image: "", label: "", category: "", displayOrder: 0, active: true };

export default function GallerySection({ query = "" }) {
  const toast = useToast();
  const [status, setStatus] = useState("");

  const load = useCallback((signal) => fetchGallery({ status }, { signal }), [status]);
  const { data, loading, error, reload, setData } = useAsync(load);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const all = data ?? [];
  const q = query.trim().toLowerCase();
  const images = q
    ? all.filter((i) => `${i.label} ${i.category}`.toLowerCase().includes(q))
    : all;

  const openNew = () => {
    setEditing(BLANK);
    setForm(BLANK);
    setErrors({});
  };
  const openEdit = (i) => {
    setEditing(i);
    setForm({
      image: i.image ?? "",
      label: i.label ?? "",
      category: i.category ?? "",
      displayOrder: i.displayOrder ?? 0,
      active: i.active !== false,
    });
    setErrors({});
  };

  const set = (field) => (v) => setForm((prev) => ({ ...prev, [field]: v }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.image.trim()) {
      setErrors({ image: "An image is required." });
      return;
    }
    setSaving(true);
    setErrors({});
    const payload = {
      image: form.image.trim(),
      label: form.label.trim(),
      category: form.category.trim(),
      displayOrder: Number(form.displayOrder) || 0,
      active: form.active,
    };
    try {
      const isNew = editing === BLANK || !editing?.id;
      const saved = isNew
        ? await createGalleryImage(payload)
        : await updateGalleryImage(editing.id, payload);
      setData(isNew ? [saved, ...all] : all.map((i) => (i.id === saved.id ? saved : i)));
      toast.success(isNew ? "Image added." : "Image updated.");
      setEditing(null);
    } catch (err) {
      if (err.details) setErrors(err.details);
      toast.error(err.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      await deleteGalleryImage(confirm.id);
      setData(all.filter((i) => i.id !== confirm.id));
      toast.success("Image deleted.");
      setConfirm(null);
    } catch (err) {
      toast.error(err.message || "Could not delete.");
    } finally {
      setDeleting(false);
    }
  };

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
          <Plus size={16} /> Add image
        </PrimaryButton>
      </Toolbar>

      {loading ? (
        <SectionLoader label="Loading gallery…" />
      ) : error ? (
        <SectionError message={error.message} onRetry={reload} />
      ) : images.length === 0 ? (
        <SectionEmpty
          title="No images"
          message="Upload photos to build the gallery."
          icon={Images}
          action={<PrimaryButton onClick={openNew}><Plus size={16} /> Add image</PrimaryButton>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((i) => (
            <div key={i.id} className="group relative overflow-hidden rounded-2xl border border-ivory/10 bg-ink-800">
              <div className="aspect-square w-full overflow-hidden bg-ink-700">
                <img src={assetUrl(i.image)} alt={i.label} className="h-full w-full object-cover transition group-hover:scale-105" />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink to-transparent p-3">
                <p className="truncate text-sm text-ivory">{i.label || "Untitled"}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  {i.category && <Pill tone="neutral">{i.category}</Pill>}
                  {!i.active && <Pill tone="off">Hidden</Pill>}
                </div>
              </div>
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                <button type="button" onClick={() => openEdit(i)} className="rounded-md bg-ink/80 p-1.5 text-ivory-dim backdrop-blur transition hover:text-ivory" aria-label="Edit">
                  <Pencil size={14} />
                </button>
                <button type="button" onClick={() => setConfirm(i)} className="rounded-md bg-ink/80 p-1.5 text-ivory-dim backdrop-blur transition hover:text-red-300" aria-label="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => (saving ? null : setEditing(null))}
        title={isNew ? "Add image" : "Edit image"}
        footer={
          <div className="flex justify-end gap-3">
            <GhostButton onClick={() => setEditing(null)} disabled={saving}>Cancel</GhostButton>
            <PrimaryButton type="submit" form="gallery-form" busy={saving}>{isNew ? "Add" : "Save"}</PrimaryButton>
          </div>
        }
      >
        <form id="gallery-form" onSubmit={save} className="space-y-4">
          <ImageField value={form.image} onChange={set("image")} hint="Required." />
          {errors.image && <p className="text-xs text-red-400">{errors.image}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Label" error={errors.label}>
              <TextInput value={form.label} onChange={(e) => set("label")(e.target.value)} placeholder="Fresh fade" />
            </Field>
            <Field label="Category" error={errors.category}>
              <TextInput value={form.category} onChange={(e) => set("category")(e.target.value)} placeholder="Hair, Spa…" />
            </Field>
          </div>
          <Field label="Display order" error={errors.displayOrder}>
            <TextInput type="number" value={form.displayOrder} onChange={(e) => set("displayOrder")(e.target.value)} />
          </Field>
          <div className="pt-1">
            <Toggle checked={form.active} onChange={set("active")} label="Visible" />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        busy={deleting}
        title="Delete image?"
        message="This image will be permanently removed from the gallery."
        confirmLabel="Delete"
      />
    </div>
  );
}
