import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader, GlassCard, PrimaryButton, GhostButton } from "@/components/ui-kit";
import { DataTable } from "@/components/DataTable";
import { Modal, FormField, inputCls } from "@/components/Modal";
import { fmtCurrency, fmtDate, monthLabel } from "@/lib/format";

export const Route = createFileRoute("/_app/payslips")({
  head: () => ({ meta: [{ title: "Payslips — TRI CUBE" }] }),
  component: PayslipsPage,
});

function PayslipsPage() {
  const { isAdmin, user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [staffList, setStaff] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [downloading, setDownloading] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ staff_id: "", month: new Date().toISOString().slice(0, 7), basic_salary: 0, bonus: 0, deductions: 0, payment_date: "", notes: "" });
  const printRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const [p, s] = await Promise.all([
      supabase.from("payslip").select("*, staff(name, role, email)").order("month", { ascending: false }),
      supabase.from("staff").select("id, name"),
    ]);
    setRows(p.data ?? []); setStaff(s.data ?? []);
  };
  useEffect(() => { load(); }, []);

  const startAdd = () => { setEditing(null); setForm({ staff_id: staffList[0]?.id ?? "", month: new Date().toISOString().slice(0, 7), basic_salary: 0, bonus: 0, deductions: 0, payment_date: "", notes: "" }); setOpen(true); };
  const startEdit = (r: any) => { setEditing(r); setForm({ staff_id: r.staff_id, month: r.month, basic_salary: r.basic_salary, bonus: r.bonus, deductions: r.deductions, payment_date: r.payment_date ?? "", notes: r.notes ?? "" }); setOpen(true); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      staff_id: form.staff_id, month: form.month,
      basic_salary: Number(form.basic_salary), bonus: Number(form.bonus), deductions: Number(form.deductions),
      payment_date: form.payment_date || null, notes: form.notes || null,
    };
    if (editing) await supabase.from("payslip").update(payload).eq("id", editing.id);
    else await supabase.from("payslip").insert(payload);
    setOpen(false); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this payslip?")) return;
    await supabase.from("payslip").delete().eq("id", id); load();
  };

  const download = async (r: any) => {
    setDownloading(r);
    await new Promise((r) => setTimeout(r, 50));
    const html2pdf = (await import("html2pdf.js")).default;
    if (printRef.current) {
      await html2pdf().set({
        margin: 0.5,
        filename: `payslip-${r.staff?.name?.replace(/\s+/g, "_")}-${r.month}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      }).from(printRef.current).save();
    }
    setDownloading(null);
  };

  // Staff sees only their own payslips (RLS already enforces); we sort by month
  return (
    <div>
      <PageHeader
        title="Payslips"
        subtitle={isAdmin ? `${rows.length} payslips on file` : "Your salary history"}
        action={isAdmin ? <PrimaryButton onClick={startAdd}><Plus className="h-4 w-4" /> Generate payslip</PrimaryButton> : undefined}
      />
      <GlassCard className="p-2 sm:p-4">
        <DataTable
          rows={rows} rowKey={(r) => r.id} empty="No payslips yet."
          columns={[
            { header: "Employee", cell: (r) => <div><div className="font-medium">{r.staff?.name ?? "—"}</div><div className="text-xs text-muted-foreground">{r.staff?.role ?? ""}</div></div> },
            { header: "Month", cell: (r) => monthLabel(r.month) },
            { header: "Basic", align: "right", cell: (r) => fmtCurrency(r.basic_salary) },
            { header: "Bonus", align: "right", cell: (r) => fmtCurrency(r.bonus) },
            { header: "Deductions", align: "right", cell: (r) => fmtCurrency(r.deductions) },
            { header: "Net", align: "right", cell: (r) => <span className="font-display font-semibold text-gold">{fmtCurrency(Number(r.basic_salary) + Number(r.bonus) - Number(r.deductions))}</span> },
            { header: "", align: "right", cell: (r) => (
              <div className="inline-flex gap-1">
                <button onClick={() => download(r)} className="p-1.5 rounded-lg hover:bg-secondary" title="Download PDF"><Download className="h-3.5 w-3.5" /></button>
                {isAdmin && <button onClick={() => startEdit(r)} className="p-1.5 rounded-lg hover:bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>}
                {isAdmin && <button onClick={() => remove(r.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>}
              </div>
            )},
          ]}
        />
      </GlassCard>

      {/* Hidden printable payslip */}
      <div className="fixed -left-[9999px] top-0">
        {downloading && (
          <div ref={printRef} style={{ width: "780px", padding: "40px", background: "#fff", fontFamily: "Inter, sans-serif", color: "#1a1a2e" }}>
            <div style={{ borderBottom: "3px solid #c9a227", paddingBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "10px", letterSpacing: "0.2em", color: "#888" }}>TRI CUBE DIGITAL SOLUTIONS</div>
                <div style={{ fontSize: "28px", fontWeight: 600, marginTop: "4px" }}>Payslip</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "12px", color: "#666" }}>Pay period</div>
                <div style={{ fontSize: "16px", fontWeight: 600 }}>{monthLabel(downloading.month)}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "30px", fontSize: "13px" }}>
              <div>
                <div style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Employee</div>
                <div style={{ fontWeight: 600, marginTop: "4px" }}>{downloading.staff?.name}</div>
                <div style={{ color: "#666" }}>{downloading.staff?.role}</div>
                {downloading.staff?.email && <div style={{ color: "#666", fontSize: "12px" }}>{downloading.staff.email}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Payment date</div>
                <div style={{ fontWeight: 600, marginTop: "4px" }}>{downloading.payment_date ? fmtDate(downloading.payment_date) : "—"}</div>
              </div>
            </div>

            <table style={{ width: "100%", marginTop: "30px", borderCollapse: "collapse", fontSize: "13px" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #eee" }}><td style={{ padding: "12px 0" }}>Basic salary</td><td style={{ textAlign: "right", padding: "12px 0", fontWeight: 600 }}>{fmtCurrency(downloading.basic_salary)}</td></tr>
                <tr style={{ borderBottom: "1px solid #eee" }}><td style={{ padding: "12px 0", color: "#3aa17e" }}>Bonus</td><td style={{ textAlign: "right", padding: "12px 0", fontWeight: 600, color: "#3aa17e" }}>+ {fmtCurrency(downloading.bonus)}</td></tr>
                <tr style={{ borderBottom: "1px solid #eee" }}><td style={{ padding: "12px 0", color: "#c0392b" }}>Deductions</td><td style={{ textAlign: "right", padding: "12px 0", fontWeight: 600, color: "#c0392b" }}>− {fmtCurrency(downloading.deductions)}</td></tr>
                <tr><td style={{ padding: "16px 0", fontSize: "15px", fontWeight: 600 }}>Net pay</td><td style={{ textAlign: "right", padding: "16px 0", fontSize: "20px", fontWeight: 700, color: "#c9a227" }}>{fmtCurrency(Number(downloading.basic_salary) + Number(downloading.bonus) - Number(downloading.deductions))}</td></tr>
              </tbody>
            </table>

            {downloading.notes && <div style={{ marginTop: "20px", padding: "12px", background: "#faf6e8", borderRadius: "8px", fontSize: "12px", color: "#666" }}>{downloading.notes}</div>}

            <div style={{ marginTop: "60px", textAlign: "center", fontSize: "10px", color: "#999", letterSpacing: "0.15em" }}>
              TRI CUBE DIGITAL SOLUTIONS · CONFIDENTIAL
            </div>
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit payslip" : "Generate payslip"}>
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Employee">
            <select className={inputCls} value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })} required>
              <option value="">Select…</option>
              {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>
          <FormField label="Month"><input type="month" className={inputCls} value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} required /></FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Basic"><input type="number" step="0.01" className={inputCls} value={form.basic_salary} onChange={(e) => setForm({ ...form, basic_salary: e.target.value })} required /></FormField>
            <FormField label="Bonus"><input type="number" step="0.01" className={inputCls} value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} /></FormField>
            <FormField label="Deductions"><input type="number" step="0.01" className={inputCls} value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} /></FormField>
          </div>
          <div className="text-xs text-muted-foreground bg-secondary/60 rounded-lg px-3 py-2">
            Net pay: <span className="font-semibold text-gold">{fmtCurrency(Number(form.basic_salary) + Number(form.bonus) - Number(form.deductions))}</span>
          </div>
          <FormField label="Payment date"><input type="date" className={inputCls} value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} /></FormField>
          <FormField label="Notes"><textarea rows={2} className={`${inputCls} h-auto py-2`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></FormField>
          <div className="flex justify-end gap-2 pt-2">
            <GhostButton onClick={() => setOpen(false)}>Cancel</GhostButton>
            <PrimaryButton type="submit">{editing ? "Save" : "Generate"}</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
