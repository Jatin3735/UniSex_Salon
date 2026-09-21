import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";

import {
  fetchStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  fetchServices,
} from "../../../api/admin.js";
import { assetUrl } from "../../../api/client.js";
import { useAsync } from "../../../lib/useAsync.js";
import { useToast } from "../../../components/admin/toastContext.js";
import {
  Drawer,
  ConfirmDialog,
  Field,
  TextInput,
  TextArea,
  Toggle,
  PrimaryButton,
  GhostButton,
  SectionLoader,
  SectionError,
  SectionEmpty,
  Pill,
} from "../../../components/admin/ui.jsx";
import { ImageField, Toolbar, FilterSelect } from "./parts.jsx";

const DAYS = [
  ["mon", "Mon"],
  ["tue", "Tue"],
  ["wed", "Wed"],
  ["thu", "Thu"],
  ["fri", "Fri"],
  ["sat", "Sat"],
  ["sun", "Sun"],
];

const BLANK = {
  name: "",
  role: "Stylist",
  specialization: "",
  bio: "",
  mobile: "",
  email: "",
  photo: "",
  age: "",
  experience: "",
  skills: "",
  workingDays: ["mon", "tue", "wed", "thu", "fri", "sat"],
  workingHours: { start: "10:00", end: "20:00" },
  services: [],
  displayOrder: 0,
  active: true,
};

export default function StaffSection({ query = "" }) {
  const toast = useToast();
  const [status, setStatus] = useState("");

  const load = useCallback((signal) => fetchStaff({ q: query, status }, { signal }), [query, status]);
  const { data, loading, error, reload, setData } = useAsync(load);

  const [serviceOptions, setServiceOptions] = useState([]);
  useEffect(() => {
    let alive = true;
    fetchServices().then((s) => alive && setServiceOptions(s)).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const staff = data ?? [];

  const openNew = () => {
    setEditing(BLANK);
    setForm(BLANK);
    setErrors({});
  };
  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name ?? "",
      role: s.role ?? "Stylist",
      specialization: s.specialization ?? "",
      bio: s.bio ?? "",
      mobile: s.mobile ?? "",
      email: s.email ?? "",
      photo: s.photo ?? "",
      age: s.age != null ? String(s.age) : "",
      experience: s.experience != null ? String(s.experience) : "",
      skills: (s.skills ?? []).join(", "),
      workingDays: s.workingDays ?? [],
      workingHours: s.workingHours ?? { start: "10:00", end: "20:00" },
      services: s.services ?? [],
      displayOrder: s.displayOrder ?? 0,
      active: s.active !== false,
    });
    setErrors({});
  };

  const set = (field) => (v) => setForm((prev) => ({ ...prev, [field]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const payload = {
      name: form.name.trim(),
      role: form.role.trim(),
      specialization: form.specialization.trim(),
      bio: form.bio.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      photo: form.photo.trim(),
      age: form.age === "" ? undefined : Number(form.age),
      experience: form.experience === "" ? undefined : Number(form.experience),
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      workingDays: form.workingDays,
      workingHours: form.workingHours,
      services: form.services,
      displayOrder: Number(form.displayOrder) || 0,
      active: form.active,
    };
    try {
      const isNew = editing === BLANK || !editing?.id;
      const saved = isNew ? await createStaff(payload) : await updateStaff(editing.id, payload);
      setData(isNew ? [...staff, saved] : staff.map((s) => (s.id === saved.id ? saved : s)));
      toast.success(isNew ? "Staff member added." : "Staff member updated.");
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
      const res = await deleteStaff(confirm.id);
      if (res?.deleted) setData(staff.filter((s) => s.id !== confirm.id));
      else setData(staff.map((s) => (s.id === confirm.id ? res.staff : s)));
      toast.success(res?.deleted ? "Staff member removed." : "Deactivated (they have bookings).");
      setConfirm(null);
    } catch (err) {
      toast.error(err.message || "Could not remove.");
    } finally {
      setDeleting(false);
    }
  };

  const toggleDay = (d) =>
    setForm((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(d)
        ? prev.workingDays.filter((x) => x !== d)
        : [...prev.workingDays, d],
    }));
  const toggleService = (id) =>
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(id)
        ? prev.services.filter((x) => x !== id)
        : [...prev.services, id],
    }));

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
          <Plus size={16} /> New staff
        </PrimaryButton>
      </Toolbar>

      {loading ? (
        <SectionLoader label="Loading staff…" />
      ) : error ? (
        <SectionError message={error.message} onRetry={reload} />
      ) : staff.length === 0 ? (
        <SectionEmpty
          title="No staff"
          message="Add your first team member."
          icon={Users}
          action={<PrimaryButton onClick={openNew}><Plus size={16} /> New staff</PrimaryButton>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {staff.map((s) => (
            <div key={s.id} className="flex gap-4 rounded-2xl border border-ivory/10 bg-ink-800 p-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-ink-700">
                {s.photo ? (
                  <img src={assetUrl(s.photo)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-lg font-semibold text-ash">
                    {s.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-medium text-ivory">{s.name}</h3>
                    <p className="truncate text-xs text-champagne-soft">{s.role}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => openEdit(s)} className="rounded-md p-1.5 text-ash transition hover:bg-ink-700 hover:text-ivory" aria-label="Edit">
                      <Pencil size={15} />
                    </button>
                    <button type="button" onClick={() => setConfirm(s)} className="rounded-md p-1.5 text-ash transition hover:bg-red-400/10 hover:text-red-300" aria-label="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(s.skills ?? []).slice(0, 4).map((sk) => (
                    <Pill key={sk} tone="neutral">{sk}</Pill>
                  ))}
                  {!s.active && <Pill tone="off">Inactive</Pill>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer
        open={editing !== null}
        onClose={() => (saving ? null : setEditing(null))}
        title={isNew ? "New staff member" : "Edit staff member"}
        subtitle={isNew ? "Add someone to the team" : editing?.name}
        footer={
          <div className="flex justify-end gap-3">
            <GhostButton onClick={() => setEditing(null)} disabled={saving}>Cancel</GhostButton>
            <PrimaryButton type="submit" form="staff-form" busy={saving}>
              {isNew ? "Create" : "Save"}
            </PrimaryButton>
          </div>
        }
      >
        <form id="staff-form" onSubmit={save} className="space-y-4">
          <ImageField label="Photo" value={form.photo} onChange={set("photo")} />
          <Field label="Name" error={errors.name}>
            <TextInput value={form.name} onChange={(e) => set("name")(e.target.value)} error={errors.name} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Role" error={errors.role}>
              <TextInput value={form.role} onChange={(e) => set("role")(e.target.value)} placeholder="Stylist" />
            </Field>
            <Field label="Specialization" error={errors.specialization}>
              <TextInput value={form.specialization} onChange={(e) => set("specialization")(e.target.value)} placeholder="Colour, fades…" />
            </Field>
          </div>
          <Field label="Bio" error={errors.bio} hint="Up to 800 characters.">
            <TextArea value={form.bio} onChange={(e) => set("bio")(e.target.value)} error={errors.bio} rows={3} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mobile" error={errors.mobile}>
              <TextInput value={form.mobile} onChange={(e) => set("mobile")(e.target.value)} />
            </Field>
            <Field label="Email" error={errors.email}>
              <TextInput type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} error={errors.email} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Age" error={errors.age}>
              <TextInput type="number" min="16" max="100" value={form.age} onChange={(e) => set("age")(e.target.value)} error={errors.age} />
            </Field>
            <Field label="Experience (yrs)" error={errors.experience}>
              <TextInput type="number" min="0" max="70" value={form.experience} onChange={(e) => set("experience")(e.target.value)} error={errors.experience} />
            </Field>
            <Field label="Order" error={errors.displayOrder}>
              <TextInput type="number" value={form.displayOrder} onChange={(e) => set("displayOrder")(e.target.value)} />
            </Field>
          </div>
          <Field label="Skills" error={errors.skills} hint="Comma-separated, e.g. hair, beard, spa.">
            <TextInput value={form.skills} onChange={(e) => set("skills")(e.target.value)} error={errors.skills} placeholder="hair, beard" />
          </Field>

          <div>
            <span className="text-sm font-medium text-ivory-dim">Working days</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAYS.map(([d, label]) => {
                const on = form.workingDays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                      on ? "border-champagne bg-champagne/15 text-champagne-soft" : "border-ink-600 bg-ink-700 text-ivory-dim hover:border-ivory/30"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts" error={errors.workingHours}>
              <TextInput type="time" value={form.workingHours.start} onChange={(e) => set("workingHours")({ ...form.workingHours, start: e.target.value })} />
            </Field>
            <Field label="Ends">
              <TextInput type="time" value={form.workingHours.end} onChange={(e) => set("workingHours")({ ...form.workingHours, end: e.target.value })} />
            </Field>
          </div>

          <div>
            <span className="text-sm font-medium text-ivory-dim">Services offered</span>
            {serviceOptions.length === 0 ? (
              <p className="mt-1 text-xs text-ash">No services yet.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {serviceOptions.map((sv) => {
                  const on = form.services.includes(sv.id);
                  return (
                    <button
                      key={sv.id}
                      type="button"
                      onClick={() => toggleService(sv.id)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        on ? "border-champagne bg-champagne/15 text-champagne-soft" : "border-ink-600 bg-ink-700 text-ivory-dim hover:border-ivory/30"
                      }`}
                    >
                      {sv.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-1">
            <Toggle checked={form.active} onChange={set("active")} label="Active" />
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        busy={deleting}
        title="Remove staff member?"
        message={`"${confirm?.name}" will be removed. If they have bookings they are deactivated instead so history is preserved.`}
        confirmLabel="Remove"
      />
    </div>
  );
}
