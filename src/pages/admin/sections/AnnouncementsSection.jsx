import { useCallback, useState } from "react";
import { Plus, Pencil, Trash2, Megaphone } from "lucide-react";

import {
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../../api/admin.js";
import { useAsync } from "../../../lib/useAsync.js";
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
import { Toolbar, FilterSelect } from "./parts.jsx";

const PLACEMENTS = [
  ["bar", "Top bar"],
  ["hero", "Hero"],
  ["offers", "Offers page"],
  ["popup", "Popup"],
];

const BLANK = {
  message: "",
  ctaLabel: "",
  ctaHref: "",
  placement: "bar",
  startDate: "",
  endDate: "",
  status: true,
};

export default function AnnouncementsSection({ query = "" }) {
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [placement, setPlacement] = useState("");

  const load = useCallback(
    (signal) => fetchAnnouncements({ status, placement }, { signal }),
    [status, placement]
  );
  const { data, loading, error, reload, setData } = useAsync(load);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const all = data ?? [];
  const q = query.trim().toLowerCase();
  const items = q ? all.filter((a) => a.message.toLowerCase().includes(q)) : all;

  const openNew = () => {
    setEditing(BLANK);
    setForm(BLANK);
    setErrors({});
  };
  const openEdit = (a) => {
    setEditing(a);
    setForm({
      message: a.message ?? "",
      ctaLabel: a.ctaLabel ?? "",
      ctaHref: a.ctaHref ?? "",
      placement: a.placement ?? "bar",
      startDate: a.startDate ?? "",
      endDate: a.endDate ?? "",
      status: a.status !== false,
    });
    setErrors({});
  };

  const set = (field) => (v) => setForm((prev) => ({ ...prev, [field]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const payload = {
      message: form.message.trim(),
      ctaLabel: form.ctaLabel.trim(),
      ctaHref: form.ctaHref.trim(),
      placement: form.placement,
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
    };
    try {
      const isNew = editing === BLANK || !editing?.id;
      const saved = isNew
        ? await createAnnouncement(payload)
        : await updateAnnouncement(editing.id, payload);
      setData(isNew ? [saved, ...all] : all.map((a) => (a.id === saved.id ? saved : a)));
      toast.success(isNew ? "Announcement created." : "Announcement updated.");
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
      await deleteAnnouncement(confirm.id);
      setData(all.filter((a) => a.id !== confirm.id));
      toast.success("Announcement deleted.");
      setConfirm(null);
    } catch (err) {
      toast.error(err.message || "Could not delete.");
    } finally {
      setDeleting(false);
    }
  };

  const isNew = editing === BLANK || !editing?.id;
  const placementLabel = (p) => PLACEMENTS.find(([k]) => k === p)?.[1] ?? p;

  return (
    <div>
      <Toolbar>
        <FilterSelect value={placement} onChange={setPlacement} label="Placement">
          <option value="">All placements</option>
          {PLACEMENTS.map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </FilterSelect>
        <FilterSelect value={status} onChange={setStatus} label="Status">
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </FilterSelect>
        <PrimaryButton onClick={openNew} className="ml-auto">
          <Plus size={16} /> New announcement
        </PrimaryButton>
      </Toolbar>

      {loading ? (
        <SectionLoader label="Loading announcements…" />
      ) : error ? (
        <SectionError message={error.message} onRetry={reload} />
      ) : items.length === 0 ? (
        <SectionEmpty
          title="No announcements"
          message="Post a notice to show across the site."
          icon={Megaphone}
          action={<PrimaryButton onClick={openNew}><Plus size={16} /> New announcement</PrimaryButton>}
        />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="flex items-start gap-4 rounded-2xl border border-ivory/10 bg-ink-800 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-ivory">{a.message}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Pill tone="info">{placementLabel(a.placement)}</Pill>
                  <Pill tone={a.status ? "on" : "off"}>{a.status ? "Live" : "Off"}</Pill>
                  {a.ctaLabel && <Pill tone="neutral">CTA: {a.ctaLabel}</Pill>}
                  {(a.startDate || a.endDate) && (
                    <span className="text-[0.7rem] text-ash">{a.startDate || "—"} → {a.endDate || "no end"}</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => openEdit(a)} className="rounded-md p-1.5 text-ash transition hover:bg-ink-700 hover:text-ivory" aria-label="Edit">
                  <Pencil size={15} />
                </button>
                <button type="button" onClick={() => setConfirm(a)} className="rounded-md p-1.5 text-ash transition hover:bg-red-400/10 hover:text-red-300" aria-label="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer
        open={editing !== null}
        onClose={() => (saving ? null : setEditing(null))}
        title={isNew ? "New announcement" : "Edit announcement"}
        footer={
          <div className="flex justify-end gap-3">
            <GhostButton onClick={() => setEditing(null)} disabled={saving}>Cancel</GhostButton>
            <PrimaryButton type="submit" form="ann-form" busy={saving}>{isNew ? "Create" : "Save"}</PrimaryButton>
          </div>
        }
      >
        <form id="ann-form" onSubmit={save} className="space-y-4">
          <Field label="Message" error={errors.message} hint="Up to 300 characters.">
            <TextArea value={form.message} onChange={(e) => set("message")(e.target.value)} error={errors.message} required />
          </Field>
          <Field label="Placement" error={errors.placement}>
            <Select value={form.placement} onChange={(e) => set("placement")(e.target.value)}>
              {PLACEMENTS.map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CTA label" error={errors.ctaLabel}>
              <TextInput value={form.ctaLabel} onChange={(e) => set("ctaLabel")(e.target.value)} placeholder="Book now" />
            </Field>
            <Field label="CTA link" error={errors.ctaHref}>
              <TextInput value={form.ctaHref} onChange={(e) => set("ctaHref")(e.target.value)} placeholder="/services" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date" error={errors.startDate}>
              <TextInput type="date" value={form.startDate} onChange={(e) => set("startDate")(e.target.value)} error={errors.startDate} />
            </Field>
            <Field label="End date" error={errors.endDate}>
              <TextInput type="date" value={form.endDate} onChange={(e) => set("endDate")(e.target.value)} error={errors.endDate} />
            </Field>
          </div>
          <div className="pt-1">
            <Toggle checked={form.status} onChange={set("status")} label="Live" />
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        busy={deleting}
        title="Delete announcement?"
        message="This announcement will be permanently deleted."
        confirmLabel="Delete"
      />
    </div>
  );
}
