import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader, GlassCard, PrimaryButton, EmptyState } from "@/components/ui-kit";
import { DataTable } from "@/components/DataTable";
import { Modal, FormField, inputCls } from "@/components/Modal";
import { fmtCurrency, fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_app/expenses")({
  head: () => ({ meta: [{ title: "Expenses — TRI CUBE" }] }),
  component: ExpensesPage,
});

const CATS = ["salary", "rent", "materials", "other"] as const;

function ExpensesPage() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [staffList, setStaff] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ title: "", category: "other", amount: "", staff_id: "", event_id: "", date: new Date().toISOString().slice(0, 10), notes: "" });

  const load = async () => {
    setLoading(true);
    const [e, s, ev] = await Promise.all([
      supabase.from("expense").select("*").order("date", { ascending: false }),
      supabase.from("staff").select("id, name"),
      supabase.from("event").select("id, event_name"),
    ]);
    setRows(e.data ?? []);
    setStaff(s.data ?? []);
    setEvents(ev.data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (!isAdmin) return (<div><PageHeader title="Restricted" /><GlassCard className="p-12"><EmptyState title="Admin access required" /></GlassCard></div>);

  const startAdd = () => { setEditing(null); setForm({ title: "", category: "other", amount: "", staff_id: "", event_id: "", date: new Date().toISOString().slice(0, 10), notes: "" }); setOpen(true); };
  const startEdit = (r: any) => { setEditing(r); setForm({ title: r.title, category: r.category, amount: String(r.amount), staff_id: r.staff_id ?? "", event_id: r.event_id ?? "", date: r.date, notes: r.notes ?? "" }); setOpen(true); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: form.title, category: form.category, amount: Number(form.amount),
      staff_id: form.staff_id || null, event_id: form.event_id || null,
      date: form.date, notes: form.notes || null,
    };
    if (editing) await supabase.from("expense").update(payload).eq("id", editing.id);
    else await supabase.from("expense").insert(payload);
    setOpen(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    await supabase.from("expense").delete().eq("id", id);
    load();
  };

  const total = rows.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle={`${rows.length} entries · ${fmtCurrency(total)} total`}
        action={<PrimaryButton onClick={startAdd}><Plus className="h-4 w-4" /> Add expense</PrimaryButton>}
      />
      <GlassCard className="p-2 sm:p-4">
        {loading ? <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div> : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            empty="No expenses yet."
            columns={[
              { header: "Title", cell: (r) => <span className="font-medium">{r.title}</span> },
              { header: "Category", cell: (r) => <span className="text-xs px-2 py-1 rounded-md bg-secondary capitalize">{r.category}</span> },
              { header: "Date", cell: (r) => fmtDate(r.date) },
              { header: "Amount", align: "right", cell: (r) => <span className="font-display font-semibold text-destructive">{fmtCurrency(r.amount)}</span> },
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

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit expense" : "Add expense"}>
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Title"><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category">
              <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="Amount"><input type="number" step="0.01" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Staff (optional)">
              <select className={inputCls} value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })}>
                <option value="">—</option>
                {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>
            <FormField label="Event (optional)">
              <select className={inputCls} value={form.event_id} onChange={(e) => setForm({ ...form, event_id: e.target.value })}>
                <option value="">—</option>
                {events.map((s) => <option key={s.id} value={s.id}>{s.event_name}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Date"><input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></FormField>
          <FormField label="Notes"><textarea rows={2} className={`${inputCls} h-auto py-2`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></FormField>
          <div className="flex justify-end pt-2"><PrimaryButton type="submit">{editing ? "Save" : "Add"}</PrimaryButton></div>
        </form>
      </Modal>
    </div>
  );
}
