import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader, GlassCard, PrimaryButton, GhostButton, StatCard, EmptyState } from "@/components/ui-kit";
import { fmtCurrency, fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — TRI CUBE" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exporting, setExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const incQ = supabase.from("income").select("*").order("date");
    const expQ = supabase.from("expense").select("*, staff(name)").order("date");
    const stQ = supabase.from("staff").select("*");
    const ptQ = supabase.from("partner").select("*");
    const evQ = supabase.from("event").select("*").order("start_date");
    const psQ = supabase.from("payslip").select("*, staff(name, role)").order("month");
    const [i, e, st, pt, ev, ps] = await Promise.all([
      from && to ? incQ.gte("date", from).lte("date", to) : incQ,
      from && to ? expQ.gte("date", from).lte("date", to) : expQ,
      stQ, ptQ, evQ, psQ,
    ]);
    setData({ income: i.data ?? [], expenses: e.data ?? [], staff: st.data ?? [], partners: pt.data ?? [], events: ev.data ?? [], payslips: ps.data ?? [] });
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  if (!isAdmin) return (<div><PageHeader title="Restricted" /><GlassCard className="p-12"><EmptyState title="Admin access required" /></GlassCard></div>);
  if (!data) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const totalIncome = data.income.reduce((s: number, r: any) => s + Number(r.amount), 0);
  const totalExpense = data.expenses.reduce((s: number, r: any) => s + Number(r.amount), 0);
  const profit = totalIncome - totalExpense;

  const exportExcel = async () => {
    setExporting(true);
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    const summary = [
      ["TRI CUBE DIGITAL SOLUTIONS — Company report"],
      [from && to ? `Period: ${from} to ${to}` : "Period: All time"],
      [],
      ["Total revenue", totalIncome],
      ["Total expenses", totalExpense],
      ["Net profit", profit],
      [],
      ["Partner shares"],
      ...data.partners.map((p: any) => [p.name, `${p.share_percentage}%`, profit * Number(p.share_percentage) / 100]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Summary");

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.income.map((r: any) => ({ Title: r.title, Type: r.type, Amount: Number(r.amount), Date: r.date, Notes: r.notes ?? "" }))), "Income");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.expenses.map((r: any) => ({ Title: r.title, Category: r.category, Amount: Number(r.amount), Staff: r.staff?.name ?? "", Date: r.date, Notes: r.notes ?? "" }))), "Expenses");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.staff.map((r: any) => ({ Name: r.name, Role: r.role, "Salary type": r.salary_type, Amount: Number(r.salary_amount), Email: r.email ?? "", Phone: r.phone ?? "" }))), "Staff");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.payslips.map((r: any) => ({ Employee: r.staff?.name ?? "", Role: r.staff?.role ?? "", Month: r.month, Basic: Number(r.basic_salary), Bonus: Number(r.bonus), Deductions: Number(r.deductions), Net: Number(r.basic_salary) + Number(r.bonus) - Number(r.deductions), "Payment date": r.payment_date ?? "" }))), "Payslips");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.events.map((r: any) => {
      const rev = Number(r.number_of_students) * Number(r.price_per_student);
      return { Event: r.event_name, Start: r.start_date, End: r.end_date, Students: r.number_of_students, "Price/student": Number(r.price_per_student), Revenue: rev, Expense: Number(r.total_expense), Profit: rev - Number(r.total_expense) };
    })), "Events");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.partners.map((r: any) => ({ Name: r.name, "Share %": Number(r.share_percentage), "Profit share": profit * Number(r.share_percentage) / 100 }))), "Partners");

    XLSX.writeFile(wb, `tricube-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
    setExporting(false);
  };

  const exportPdf = async () => {
    setExporting(true);
    const html2pdf = (await import("html2pdf.js")).default;
    if (printRef.current) {
      await html2pdf().set({
        margin: 0.5, filename: `tricube-summary-${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: "jpeg", quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: "in", format: "a4" },
      }).from(printRef.current).save();
    }
    setExporting(false);
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Export multi-sheet Excel and PDF summaries."
        action={
          <div className="flex gap-2">
            <GhostButton onClick={exportPdf}><FileText className="h-4 w-4" /> PDF</GhostButton>
            <PrimaryButton onClick={exportExcel} disabled={exporting}><FileSpreadsheet className="h-4 w-4" /> Excel</PrimaryButton>
          </div>
        }
      />

      <GlassCard className="p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-xs font-medium text-foreground/70 mb-1.5 block">From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10 rounded-xl border border-input bg-white/60 px-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-foreground/70 mb-1.5 block">To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10 rounded-xl border border-input bg-white/60 px-3 text-sm" />
          </label>
          <GhostButton onClick={load}>Apply filter</GhostButton>
          <GhostButton onClick={() => { setFrom(""); setTo(""); setTimeout(load, 0); }}>Clear</GhostButton>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Revenue" value={fmtCurrency(totalIncome)} tone="teal" />
        <StatCard label="Expenses" value={fmtCurrency(totalExpense)} tone="destructive" />
        <StatCard label="Profit" value={fmtCurrency(profit)} tone="gold" />
        <StatCard label="Events" value={String(data.events.length)} tone="navy" />
      </div>

      <div ref={printRef} className="glass-card rounded-2xl p-6 bg-white">
        <div className="border-b border-border pb-4 mb-4">
          <div className="text-[10px] tracking-widest text-muted-foreground">TRI CUBE DIGITAL SOLUTIONS</div>
          <div className="font-display text-2xl font-semibold mt-1">Company Summary</div>
          <div className="text-xs text-muted-foreground mt-1">Generated {fmtDate(new Date())}{from && to ? ` · ${from} to ${to}` : ""}</div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
          <div><div className="text-xs text-muted-foreground">Total revenue</div><div className="font-display text-lg font-semibold text-gold">{fmtCurrency(totalIncome)}</div></div>
          <div><div className="text-xs text-muted-foreground">Total expenses</div><div className="font-display text-lg font-semibold text-destructive">{fmtCurrency(totalExpense)}</div></div>
          <div><div className="text-xs text-muted-foreground">Net profit</div><div className="font-display text-lg font-semibold">{fmtCurrency(profit)}</div></div>
        </div>

        <div className="text-sm font-semibold mb-2">Partner allocations</div>
        <table className="w-full text-sm mb-6">
          <tbody>
            {data.partners.map((p: any) => (
              <tr key={p.id} className="border-t border-border/60"><td className="py-2">{p.name}</td><td className="py-2 text-muted-foreground">{p.share_percentage}%</td><td className="py-2 text-right font-semibold">{fmtCurrency(profit * Number(p.share_percentage) / 100)}</td></tr>
            ))}
            {data.partners.length === 0 && <tr><td className="py-2 text-muted-foreground text-xs">No partners configured.</td></tr>}
          </tbody>
        </table>

        <div className="text-sm font-semibold mb-2">Event performance</div>
        <table className="w-full text-sm">
          <thead><tr className="text-xs text-muted-foreground"><th className="text-left py-2">Event</th><th className="text-right py-2">Revenue</th><th className="text-right py-2">Profit</th></tr></thead>
          <tbody>
            {data.events.map((e: any) => {
              const rev = Number(e.number_of_students) * Number(e.price_per_student);
              return <tr key={e.id} className="border-t border-border/60"><td className="py-2">{e.event_name}</td><td className="py-2 text-right">{fmtCurrency(rev)}</td><td className="py-2 text-right font-semibold">{fmtCurrency(rev - Number(e.total_expense))}</td></tr>;
            })}
            {data.events.length === 0 && <tr><td className="py-2 text-muted-foreground text-xs">No events.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
