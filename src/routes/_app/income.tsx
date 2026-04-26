import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader, GlassCard, PrimaryButton, EmptyState } from "@/components/ui-kit";
import { DataTable } from "@/components/DataTable";
import { Modal, FormField, inputCls } from "@/components/Modal";
import { fmtCurrency, fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_app/income")({
  head: () => ({ meta: [{ title: "Income — TRI CUBE" }] }),
  component: IncomePage,
});

const TYPES = ["course", "project", "workshop", "other"] as const;

function IncomePage() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ title: "", type: "course", amount: "", date: new Date().toISOString().slice(0, 10), notes: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("income").select("*").order("date", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (!isAdmin) return <Restricted />;

  const startAdd = () => {
    setEditing(null);
    setForm({ title: "", type: "course", amount: "", date: new Date().toISOString().slice(0, 10), notes: "" });
    setOpen(true);
  };

  const startEdit = (r: any) => {
    setEditing(r);
    setForm({ title: r.title, type: r.type, amount: String(r.amount), date: r.date, notes: r.notes ?? "" });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { title: form.title, type: form.type, amount: Number(form.amount), date: form.date, notes: form.notes || null };
    if (editing) await supabase.from("income").update(payload).eq("id", editing.id);
    else await supabase.from("income").insert(payload);
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await supabase.from("income").delete().eq("id", id);
    load();
  };

  const total = rows.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div>
      <PageHeader
        title="Income"
        subtitle={`${rows.length} entries · ${fmtCurrency(total)} total`}
        action={<PrimaryButton onClick={startAdd}><Plus className="h-4 w-4" /> Add income</PrimaryButton>}
      />
      <GlassCard className="p-2 sm:p-4">
        {loading ? <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div> : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            empty="No income entries yet."
            columns={[
              { header: "Title", cell: (r) => <span className="font-medium">{r.title}</span> },
              { header: "Type", cell: (r) => <span className="text-xs px-2 py-1 rounded-md bg-secondary capitalize">{r.type}</span> },
              { header: "Date", cell: (r) => fmtDate(r.date) },
              { header: "Amount", align: "right", cell: (r) => <span className="font-display font-semibold text-gold">{fmtCurrency(r.amount)}</span> },
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

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit income" : "Add income"}>
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Title"><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Type">
              <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Amount"><input type="number" step="0.01" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></FormField>
          </div>
          <FormField label="Date"><input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></FormField>
          <FormField label="Notes"><textarea rows={2} className={`${inputCls} h-auto py-2`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></FormField>
          <div className="flex justify-end pt-2">
            <PrimaryButton type="submit">{editing ? "Save" : "Add"}</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Restricted() {
  return (
    <div>
      <PageHeader title="Restricted" />
      <GlassCard className="p-12"><EmptyState title="Admin access required" hint="This module is only available to admins." /></GlassCard>
    </div>
  );
}
