import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader, GlassCard, PrimaryButton } from "@/components/ui-kit";
import { DataTable } from "@/components/DataTable";
import { Modal, FormField, inputCls } from "@/components/Modal";
import { fmtCurrency, fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_app/events")({
  head: () => ({ meta: [{ title: "Events — TRI CUBE" }] }),
  component: EventsPage,
});

function EventsPage() {
  const { user, isAdmin } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const today = () => new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<any>({ event_name: "", start_date: today(), end_date: today(), number_of_students: 0, price_per_student: 0, total_expense: 0, requirements: "" });

  const load = async () => {
    const { data } = await supabase.from("event").select("*").order("start_date", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const startAdd = () => { setEditing(null); setForm({ event_name: "", start_date: today(), end_date: today(), number_of_students: 0, price_per_student: 0, total_expense: 0, requirements: "" }); setOpen(true); };
  const startEdit = (r: any) => { setEditing(r); setForm({ event_name: r.event_name, start_date: r.start_date, end_date: r.end_date, number_of_students: r.number_of_students, price_per_student: r.price_per_student, total_expense: r.total_expense, requirements: r.requirements ?? "" }); setOpen(true); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      event_name: form.event_name,
      start_date: form.start_date,
      end_date: form.end_date,
      number_of_students: Number(form.number_of_students),
      price_per_student: Number(form.price_per_student),
      total_expense: Number(form.total_expense),
      requirements: form.requirements || null,
      created_by: user?.id ?? null,
    };
    if (editing) await supabase.from("event").update(payload).eq("id", editing.id);
    else await supabase.from("event").insert(payload);
    setOpen(false); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await supabase.from("event").delete().eq("id", id); load();
  };

  const duration = (s: string, e: string) => Math.max(1, Math.round((+new Date(e) - +new Date(s)) / 86400000) + 1);

  return (
    <div>
      <PageHeader
        title="Events & Workshops"
        subtitle={`${rows.length} events`}
        action={<PrimaryButton onClick={startAdd}><Plus className="h-4 w-4" /> Add event</PrimaryButton>}
      />
      <GlassCard className="p-2 sm:p-4">
        <DataTable
          rows={rows} rowKey={(r) => r.id} empty="No events yet."
          columns={[
            { header: "Event", cell: (r) => <div className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-gold" /><span className="font-medium">{r.event_name}</span></div> },
            { header: "Dates", cell: (r) => <div><div className="text-sm">{fmtDate(r.start_date)} → {fmtDate(r.end_date)}</div><div className="text-xs text-muted-foreground">{duration(r.start_date, r.end_date)} day{duration(r.start_date, r.end_date) > 1 ? "s" : ""}</div></div> },
            { header: "Students", cell: (r) => r.number_of_students },
            { header: "Revenue", align: "right", cell: (r) => <span className="text-gold font-semibold">{fmtCurrency(Number(r.number_of_students) * Number(r.price_per_student))}</span> },
            { header: "Profit", align: "right", cell: (r) => {
              const p = Number(r.number_of_students) * Number(r.price_per_student) - Number(r.total_expense);
              return <span className={`font-display font-semibold ${p >= 0 ? "text-foreground" : "text-destructive"}`}>{fmtCurrency(p)}</span>;
            }},
            { header: "", align: "right", cell: (r) => (
              <div className="inline-flex gap-1">
                <button onClick={() => startEdit(r)} className="p-1.5 rounded-lg hover:bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>
                {isAdmin && <button onClick={() => remove(r.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>}
              </div>
            )},
          ]}
        />
      </GlassCard>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit event" : "Add event"}>
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Event name"><input className={inputCls} value={form.event_name} onChange={(e) => setForm({ ...form, event_name: e.target.value })} required /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start date"><input type="date" className={inputCls} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required /></FormField>
            <FormField label="End date"><input type="date" className={inputCls} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required /></FormField>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Students"><input type="number" min="0" className={inputCls} value={form.number_of_students} onChange={(e) => setForm({ ...form, number_of_students: e.target.value })} /></FormField>
            <FormField label="Price / student"><input type="number" step="0.01" min="0" className={inputCls} value={form.price_per_student} onChange={(e) => setForm({ ...form, price_per_student: e.target.value })} /></FormField>
            <FormField label="Total expense"><input type="number" step="0.01" min="0" className={inputCls} value={form.total_expense} onChange={(e) => setForm({ ...form, total_expense: e.target.value })} /></FormField>
          </div>
          <div className="text-xs text-muted-foreground bg-secondary/60 rounded-lg px-3 py-2">
            Auto-revenue: <span className="font-semibold text-foreground">{fmtCurrency(Number(form.number_of_students) * Number(form.price_per_student))}</span>
            {" · "}Profit: <span className="font-semibold text-foreground">{fmtCurrency(Number(form.number_of_students) * Number(form.price_per_student) - Number(form.total_expense))}</span>
          </div>
          <FormField label="Requirements / materials"><textarea rows={3} className={`${inputCls} h-auto py-2`} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} /></FormField>
          <div className="flex justify-end pt-2"><PrimaryButton type="submit">{editing ? "Save" : "Add"}</PrimaryButton></div>
        </form>
      </Modal>
    </div>
  );
}
