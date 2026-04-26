import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, FolderKanban, Phone, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader, GlassCard, PrimaryButton, EmptyState, StatCard } from "@/components/ui-kit";
import { DataTable } from "@/components/DataTable";
import { Modal, FormField, inputCls } from "@/components/Modal";
import { fmtCurrency, fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_app/projects")({
  head: () => ({ meta: [{ title: "Projects — TRI CUBE" }] }),
  component: ProjectsPage,
});

const STATUSES = ["planned", "in_progress", "completed", "cancelled"] as const;

const emptyForm = {
  name: "",
  customer_name: "",
  customer_phone: "",
  description: "",
  staff_id: "",
  total_cost: "",
  staff_salary: "",
  status: "planned",
  start_date: "",
  end_date: "",
  notes: "",
};

function ProjectsPage() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(emptyForm);

  const load = async () => {
    setLoading(true);
    const [{ data: projects }, { data: staffRows }] = await Promise.all([
      supabase.from("project").select("*").order("created_at", { ascending: false }),
      supabase.from("staff").select("id, name, role").order("name"),
    ]);
    setRows(projects ?? []);
    setStaff(staffRows ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="Restricted" />
        <GlassCard className="p-12"><EmptyState title="Admin access required" /></GlassCard>
      </div>
    );
  }

  const startAdd = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const startEdit = (r: any) => {
    setEditing(r);
    setForm({
      name: r.name ?? "",
      customer_name: r.customer_name ?? "",
      customer_phone: r.customer_phone ?? "",
      description: r.description ?? "",
      staff_id: r.staff_id ?? "",
      total_cost: String(r.total_cost ?? ""),
      staff_salary: String(r.staff_salary ?? ""),
      status: r.status ?? "planned",
      start_date: r.start_date ?? "",
      end_date: r.end_date ?? "",
      notes: r.notes ?? "",
    });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      customer_name: form.customer_name,
      customer_phone: form.customer_phone || null,
      description: form.description || null,
      staff_id: form.staff_id || null,
      total_cost: Number(form.total_cost || 0),
      staff_salary: Number(form.staff_salary || 0),
      status: form.status,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      notes: form.notes || null,
    };
    if (editing) await supabase.from("project").update(payload).eq("id", editing.id);
    else await supabase.from("project").insert(payload);
    setOpen(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    await supabase.from("project").delete().eq("id", id); load();
  };

  const totalRevenue = rows.reduce((s, r) => s + Number(r.total_cost || 0), 0);
  const totalSalary = rows.reduce((s, r) => s + Number(r.staff_salary || 0), 0);
  const profit = totalRevenue - totalSalary;
  const active = rows.filter((r) => r.status === "in_progress").length;

  const staffName = (id: string | null) => staff.find((s) => s.id === id)?.name ?? "—";

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      planned: "bg-accent/15 text-foreground",
      in_progress: "bg-teal/20 text-teal",
      completed: "bg-emerald-500/15 text-emerald-600",
      cancelled: "bg-destructive/15 text-destructive",
    };
    return <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-md ${map[s] ?? "bg-secondary"}`}>{s.replace("_", " ")}</span>;
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${rows.length} project${rows.length === 1 ? "" : "s"} on the books`}
        action={<PrimaryButton onClick={startAdd}><Plus className="h-4 w-4" /> Add project</PrimaryButton>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <StatCard label="Total Revenue" value={fmtCurrency(totalRevenue)} hint={`${rows.length} projects`} tone="gold" />
        <StatCard label="Staff Payouts" value={fmtCurrency(totalSalary)} tone="navy" />
        <StatCard label="Net Profit" value={fmtCurrency(profit)} tone={profit >= 0 ? "teal" : "destructive"} />
        <StatCard label="In Progress" value={String(active)} tone="default" />
      </div>

      <GlassCard className="p-2 sm:p-4">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            empty="No projects yet."
            columns={[
              {
                header: "Project",
                cell: (r) => (
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="mt-0.5 inline-flex items-center justify-center h-8 w-8 rounded-lg bg-gold/15 text-gold shrink-0"><FolderKanban className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.name}</div>
                      {r.description && <div className="text-xs text-muted-foreground truncate max-w-xs">{r.description}</div>}
                    </div>
                  </div>
                ),
              },
              {
                header: "Customer",
                cell: (r) => (
                  <div>
                    <div className="font-medium text-sm flex items-center gap-1.5"><UserIcon className="h-3 w-3 text-muted-foreground" />{r.customer_name}</div>
                    {r.customer_phone && <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5"><Phone className="h-3 w-3" />{r.customer_phone}</div>}
                  </div>
                ),
              },
              { header: "Assigned to", cell: (r) => <span className="text-sm">{staffName(r.staff_id)}</span> },
              { header: "Status", cell: (r) => statusBadge(r.status) },
              {
                header: "Dates",
                cell: (r) => (
                  <div className="text-xs text-muted-foreground">
                    {r.start_date ? fmtDate(r.start_date) : "—"} → {r.end_date ? fmtDate(r.end_date) : "—"}
                  </div>
                ),
              },
              { header: "Total cost", align: "right", cell: (r) => <span className="font-display font-semibold tabular-nums">{fmtCurrency(r.total_cost)}</span> },
              { header: "Staff salary", align: "right", cell: (r) => <span className="tabular-nums text-muted-foreground">{fmtCurrency(r.staff_salary)}</span> },
              {
                header: "",
                align: "right",
                cell: (r) => (
                  <div className="inline-flex gap-1">
                    <button onClick={() => startEdit(r)} className="p-1.5 rounded-lg hover:bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(r.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </GlassCard>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit project" : "Add project"}>
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Project name">
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Customer name">
              <input className={inputCls} value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
            </FormField>
            <FormField label="Phone number">
              <input className={inputCls} value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} placeholder="+91 ..." />
            </FormField>
          </div>

          <FormField label="Description / scope">
            <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Assigned staff">
              <select className={inputCls} value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })}>
                <option value="">— Unassigned —</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}{s.role ? ` (${s.role})` : ""}</option>)}
              </select>
            </FormField>
            <FormField label="Status">
              <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Total cost (charged to customer)">
              <input type="number" step="0.01" className={inputCls} value={form.total_cost} onChange={(e) => setForm({ ...form, total_cost: e.target.value })} required />
            </FormField>
            <FormField label="Salary to staff for this project">
              <input type="number" step="0.01" className={inputCls} value={form.staff_salary} onChange={(e) => setForm({ ...form, staff_salary: e.target.value })} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start date">
              <input type="date" className={inputCls} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </FormField>
            <FormField label="End date">
              <input type="date" className={inputCls} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </FormField>
          </div>

          <FormField label="Notes">
            <textarea className={inputCls} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </FormField>

          <div className="flex justify-end pt-2">
            <PrimaryButton type="submit">{editing ? "Save" : "Add project"}</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
