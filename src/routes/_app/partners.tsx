import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader, GlassCard, PrimaryButton, EmptyState } from "@/components/ui-kit";
import { DataTable } from "@/components/DataTable";
import { Modal, FormField, inputCls } from "@/components/Modal";
import { fmtCurrency } from "@/lib/format";

export const Route = createFileRoute("/_app/partners")({
  head: () => ({ meta: [{ title: "Partners — TRI CUBE" }] }),
  component: PartnersPage,
});

function PartnersPage() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [income, setIncome] = useState<any[]>([]);
  const [expense, setExpense] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ name: "", share_percentage: "", email: "" });

  const load = async () => {
    const [p, i, e] = await Promise.all([
      supabase.from("partner").select("*").order("share_percentage", { ascending: false }),
      supabase.from("income").select("amount"),
      supabase.from("expense").select("amount"),
    ]);
    setRows(p.data ?? []); setIncome(i.data ?? []); setExpense(e.data ?? []);
  };
  useEffect(() => { load(); }, []);

  if (!isAdmin) return (<div><PageHeader title="Restricted" /><GlassCard className="p-12"><EmptyState title="Admin access required" /></GlassCard></div>);

  const profit = income.reduce((s, r) => s + Number(r.amount), 0) - expense.reduce((s, r) => s + Number(r.amount), 0);
  const allocated = rows.reduce((s, p) => s + Number(p.share_percentage), 0);

  const startAdd = () => { setEditing(null); setForm({ name: "", share_percentage: "", email: "" }); setOpen(true); };
  const startEdit = (r: any) => { setEditing(r); setForm({ name: r.name, share_percentage: String(r.share_percentage), email: r.email ?? "" }); setOpen(true); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name, share_percentage: Number(form.share_percentage), email: form.email || null };
    if (editing) await supabase.from("partner").update(payload).eq("id", editing.id);
    else await supabase.from("partner").insert(payload);
    setOpen(false); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete partner?")) return;
    await supabase.from("partner").delete().eq("id", id); load();
  };

  return (
    <div>
      <PageHeader
        title="Partners"
        subtitle={`Net profit ${fmtCurrency(profit)} · ${allocated}% allocated`}
        action={<PrimaryButton onClick={startAdd}><Plus className="h-4 w-4" /> Add partner</PrimaryButton>}
      />
      <GlassCard className="p-2 sm:p-4">
        <DataTable
          rows={rows} rowKey={(r) => r.id} empty="No partners yet."
          columns={[
            { header: "Name", cell: (r) => <div><div className="font-medium">{r.name}</div>{r.email && <div className="text-xs text-muted-foreground">{r.email}</div>}</div> },
            { header: "Share %", cell: (r) => <span className="text-gold font-semibold">{r.share_percentage}%</span> },
            { header: "Profit share", align: "right", cell: (r) => <span className="font-display font-semibold">{fmtCurrency(profit * Number(r.share_percentage) / 100)}</span> },
            { header: "", align: "right", cell: (r) => (
              <div className="inline-flex gap-1">
                <button onClick={() => startEdit(r)} className="p-1.5 rounded-lg hover:bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => remove(r.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            )},
          ]}
        />
      </GlassCard>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit partner" : "Add partner"}>
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></FormField>
          <FormField label="Share percentage"><input type="number" step="0.01" min="0" max="100" className={inputCls} value={form.share_percentage} onChange={(e) => setForm({ ...form, share_percentage: e.target.value })} required /></FormField>
          <FormField label="Email"><input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormField>
          <div className="flex justify-end pt-2"><PrimaryButton type="submit">{editing ? "Save" : "Add"}</PrimaryButton></div>
        </form>
      </Modal>
    </div>
  );
}
