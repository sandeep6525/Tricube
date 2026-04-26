import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Upload, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader, GlassCard, PrimaryButton, EmptyState } from "@/components/ui-kit";
import { DataTable } from "@/components/DataTable";
import { Modal, FormField, inputCls } from "@/components/Modal";
import { fmtCurrency } from "@/lib/format";

export const Route = createFileRoute("/_app/staff")({
  head: () => ({ meta: [{ title: "Staff — TRI CUBE" }] }),
  component: StaffPage,
});

function StaffPage() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ name: "", role: "", salary_type: "fixed", salary_amount: "", email: "", phone: "", photo_url: "" });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("staff").select("*").order("created_at", { ascending: false });
    setRows(data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (!isAdmin) return (<div><PageHeader title="Restricted" /><GlassCard className="p-12"><EmptyState title="Admin access required" /></GlassCard></div>);

  const startAdd = () => { setEditing(null); setForm({ name: "", role: "", salary_type: "fixed", salary_amount: "", email: "", phone: "", photo_url: "" }); setOpen(true); };
  const startEdit = (r: any) => { setEditing(r); setForm({ name: r.name, role: r.role, salary_type: r.salary_type, salary_amount: String(r.salary_amount), email: r.email ?? "", phone: r.phone ?? "", photo_url: r.photo_url ?? "" }); setOpen(true); };

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Photo must be under 5 MB."); return; }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("staff-photos").upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (error) { alert(`Upload failed: ${error.message}`); setUploading(false); return; }
    const { data } = supabase.storage.from("staff-photos").getPublicUrl(path);
    setForm((f: any) => ({ ...f, photo_url: data.publicUrl }));
    setUploading(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name, role: form.role, salary_type: form.salary_type, salary_amount: Number(form.salary_amount), email: form.email || null, phone: form.phone || null, photo_url: form.photo_url || null };
    if (editing) await supabase.from("staff").update(payload).eq("id", editing.id);
    else await supabase.from("staff").insert(payload);
    setOpen(false); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this staff record?")) return;
    await supabase.from("staff").delete().eq("id", id); load();
  };

  return (
    <div>
      <PageHeader title="Staff" subtitle={`${rows.length} team members`} action={<PrimaryButton onClick={startAdd}><Plus className="h-4 w-4" /> Add staff</PrimaryButton>} />
      <GlassCard className="p-2 sm:p-4">
        {loading ? <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div> : (
          <DataTable
            rows={rows} rowKey={(r) => r.id} empty="No staff yet."
            columns={[
              { header: "Name", cell: (r) => (
                <div className="flex items-center gap-3 min-w-0">
                  {r.photo_url ? (
                    <img src={r.photo_url} alt={r.name} className="h-9 w-9 rounded-full object-cover ring-1 ring-border shrink-0" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-gradient-navy text-white flex items-center justify-center text-xs font-semibold uppercase shrink-0">
                      {r.name?.[0] ?? "?"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.name}</div>
                    {r.email && <div className="text-xs text-muted-foreground truncate">{r.email}</div>}
                  </div>
                </div>
              ) },
              { header: "Role", cell: (r) => r.role },
              { header: "Salary type", cell: (r) => <span className="text-xs px-2 py-1 rounded-md bg-secondary capitalize">{r.salary_type.replace("_", " ")}</span> },
              { header: "Amount", align: "right", cell: (r) => <span className="font-display font-semibold">{fmtCurrency(r.salary_amount)}</span> },
              { header: "", align: "right", cell: (r) => (
                <div className="inline-flex gap-1">
                  <button onClick={() => startEdit(r)} className="p-1.5 rounded-lg hover:bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => remove(r.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              )},
            ]}
          />
        )}
      </GlassCard>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit staff" : "Add staff"}>
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Photo">
            <div className="flex items-center gap-4">
              {form.photo_url ? (
                <img src={form.photo_url} alt="Preview" className="h-16 w-16 rounded-full object-cover ring-1 ring-border" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                  <UserIcon className="h-6 w-6" />
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-xl glass border border-border text-sm font-medium hover:bg-white/80 transition disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5" />
                {uploading ? "Uploading…" : form.photo_url ? "Change photo" : "Upload photo"}
              </button>
              {form.photo_url && !uploading && (
                <button type="button" onClick={() => setForm({ ...form, photo_url: "" })} className="text-xs text-destructive hover:underline">Remove</button>
              )}
            </div>
          </FormField>
          <FormField label="Full name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></FormField>
          <FormField label="Role / position"><input className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Salary type">
              <select className={inputCls} value={form.salary_type} onChange={(e) => setForm({ ...form, salary_type: e.target.value })}>
                <option value="fixed">Fixed</option>
                <option value="per_project">Per project</option>
              </select>
            </FormField>
            <FormField label="Amount"><input type="number" step="0.01" className={inputCls} value={form.salary_amount} onChange={(e) => setForm({ ...form, salary_amount: e.target.value })} required /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email"><input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormField>
            <FormField label="Phone"><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></FormField>
          </div>
          <div className="flex justify-end pt-2"><PrimaryButton type="submit">{editing ? "Save" : "Add"}</PrimaryButton></div>
        </form>
      </Modal>
    </div>
  );
}
