import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, Users, CalendarDays, Receipt, Wallet2, PiggyBank, CalendarRange, Download, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader, StatCard, GlassCard, EmptyState, GhostButton } from "@/components/ui-kit";
import { fmtCurrency, fmtDate } from "@/lib/format";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TRI CUBE" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { isAdmin, role, loading: authLoading } = useAuth();
  if (authLoading) return null;
  return isAdmin ? <AdminDashboard /> : <StaffDashboard />;
}

function AdminDashboard() {
  const [income, setIncome] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [staffCount, setStaffCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [i, e, p, ev, s] = await Promise.all([
        supabase.from("income").select("*"),
        supabase.from("expense").select("*"),
        supabase.from("partner").select("*"),
        supabase.from("event").select("*").order("start_date", { ascending: false }),
        supabase.from("staff").select("id", { count: "exact", head: true }),
      ]);
      setIncome(i.data ?? []);
      setExpenses(e.data ?? []);
      setPartners(p.data ?? []);
      setEvents(ev.data ?? []);
      setStaffCount(s.count ?? 0);
      setLoading(false);
    })();
  }, []);

  const totalIncome = income.reduce((s, r) => s + Number(r.amount), 0);
  const totalExpense = expenses.reduce((s, r) => s + Number(r.amount), 0);
  const profit = totalIncome - totalExpense;

  const today = new Date().toISOString().slice(0, 10);
  const activeEvents = events.filter((e) => e.end_date >= today).length;

  // Last 6 months for line chart
  const months: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleString("en", { month: "short" }) });
  }
  const incByMonth = months.map((m) => income.filter((r) => r.date?.startsWith(m.key)).reduce((s, r) => s + Number(r.amount), 0));
  const expByMonth = months.map((m) => expenses.filter((r) => r.date?.startsWith(m.key)).reduce((s, r) => s + Number(r.amount), 0));

  // Recent activity feed (latest 6 income+expense entries)
  const activity = [
    ...income.map((r) => ({ id: `i-${r.id}`, type: "income" as const, label: r.source ?? "Income", date: r.date, amount: Number(r.amount) })),
    ...expenses.map((r) => ({ id: `e-${r.id}`, type: "expense" as const, label: r.description ?? r.category ?? "Expense", date: r.date, amount: Number(r.amount) })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);

  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div>
      {/* Top utility bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-gold/15 text-gold">✦</span>
          <span className="font-medium tracking-wide">Dashboard</span>
        </div>
        <div className="text-xs text-muted-foreground">{dateStr}</div>
      </div>

      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-2">Overview</div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">Welcome back.</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Here's how TRI CUBE is performing today.</p>
        </div>
        <GhostButton>
          <Download className="h-4 w-4" />
          Export Excel
        </GhostButton>
      </div>

      {/* Hero stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <HeroStat icon={<TrendingUp className="h-5 w-5" />} iconBg="bg-gold/90" iconText="text-white" label="Total Revenue" value={loading ? "—" : fmtCurrency(totalIncome)} delay={0} />
        <HeroStat icon={<Receipt className="h-5 w-5" />} iconBg="bg-destructive" iconText="text-white" label="Total Expenses" value={loading ? "—" : fmtCurrency(totalExpense)} delay={0.05} />
        <HeroStat icon={<PiggyBank className="h-5 w-5" />} iconBg="bg-emerald-500" iconText="text-white" label="Net Profit" value={loading ? "—" : fmtCurrency(profit)} delay={0.1} />
        <HeroStat icon={<CalendarRange className="h-5 w-5" />} iconBg="bg-teal" iconText="text-white" label="Active Events" value={String(activeEvents)} delay={0.15} />
      </div>

      {/* Monthly performance — full width line chart */}
      <GlassCard className="p-5 mb-5" delay={0.2}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="font-display font-semibold tracking-tight">Monthly performance</div>
            <div className="text-xs text-muted-foreground">Income vs. expenses across all activity</div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gold" /> Income</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-navy" /> Expenses</span>
          </div>
        </div>
        <div className="h-64">
          <Line
            data={{
              labels: months.map((m) => m.label),
              datasets: [
                {
                  label: "Income", data: incByMonth,
                  borderColor: "oklch(0.78 0.13 80)", backgroundColor: "oklch(0.78 0.13 80 / 0.15)",
                  fill: true, tension: 0.4, pointBackgroundColor: "oklch(0.78 0.13 80)", pointRadius: 4, pointHoverRadius: 6, borderWidth: 2.5,
                },
                {
                  label: "Expenses", data: expByMonth,
                  borderColor: "oklch(0.28 0.06 255)", backgroundColor: "oklch(0.28 0.06 255 / 0.1)",
                  fill: true, tension: 0.4, pointBackgroundColor: "oklch(0.28 0.06 255)", pointRadius: 4, pointHoverRadius: 6, borderWidth: 2.5,
                },
              ],
            }}
            options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, grid: { color: "oklch(0.92 0.005 250)" }, ticks: { callback: (v) => `$${Number(v) / 1000}k`, font: { size: 11 } } },
                x: { grid: { display: false }, ticks: { font: { size: 11 } } },
              },
            }}
          />
        </div>
      </GlassCard>

      {/* Revenue mix donut + Recent activity */}
      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <GlassCard className="p-5" delay={0.25}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="font-display font-semibold tracking-tight">Revenue mix</div>
              <div className="text-xs text-muted-foreground">Breakdown by source</div>
            </div>
          </div>
          {(() => {
            const byType = income.reduce<Record<string, number>>((acc, r) => {
              const k = (r.type || r.title || "Other").toString();
              acc[k] = (acc[k] ?? 0) + Number(r.amount);
              return acc;
            }, {});
            const entries = Object.entries(byType).sort((a, b) => b[1] - a[1]);
            const palette = [
              "oklch(0.65 0.17 155)", "oklch(0.78 0.13 80)", "oklch(0.62 0.22 25)",
              "oklch(0.55 0.18 260)", "oklch(0.72 0.12 195)", "oklch(0.60 0.20 320)",
              "oklch(0.50 0.15 30)", "oklch(0.68 0.14 110)",
            ];
            const total = entries.reduce((s, [, v]) => s + v, 0);
            if (entries.length === 0) {
              return <div className="h-56 flex items-center justify-center"><EmptyState title="No income yet" /></div>;
            }
            return (
              <div className="grid sm:grid-cols-2 gap-4 items-center">
                <div className="h-56 relative">
                  <Doughnut
                    data={{
                      labels: entries.map(([k]) => k),
                      datasets: [{
                        data: entries.map(([, v]) => v),
                        backgroundColor: entries.map((_, i) => palette[i % palette.length]),
                        borderWidth: 0,
                      }],
                    }}
                    options={{
                      responsive: true, maintainAspectRatio: false, cutout: "70%",
                      plugins: {
                        legend: { display: false },
                        tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${fmtCurrency(Number(ctx.parsed))}` } },
                      },
                    }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</div>
                    <div className="font-display text-lg font-semibold tabular-nums">{fmtCurrency(total)}</div>
                  </div>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {entries.map(([label, value], i) => {
                    const pct = total > 0 ? (value / total) * 100 : 0;
                    return (
                      <div key={label} className="flex items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: palette[i % palette.length] }} />
                          <span className="truncate capitalize">{label}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-display font-semibold tabular-nums text-xs">{fmtCurrency(value)}</div>
                          <div className="text-[10px] text-muted-foreground tabular-nums">{pct.toFixed(1)}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </GlassCard>

        <GlassCard className="p-5" delay={0.3}>
          <div className="flex items-center justify-between mb-4">
            <div className="font-display font-semibold tracking-tight">Recent activity</div>
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> {staffCount} staff
            </div>
          </div>
          {activity.length === 0 ? (
            <EmptyState title="No activity yet" />
          ) : (
            <div className="space-y-3.5">
              {activity.map((a) => (
                <div key={a.id} className="flex items-center justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${a.type === "income" ? "bg-emerald-500" : "bg-destructive"}`} />
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{a.label}</div>
                      <div className="text-[11px] text-muted-foreground capitalize">{a.type} · {fmtDate(a.date)}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-display font-semibold tabular-nums ${a.type === "income" ? "text-emerald-600" : "text-destructive"}`}>
                    {a.type === "income" ? "+" : "−"}{fmtCurrency(a.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Partner shares */}
      <GlassCard className="p-5" delay={0.35}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-display font-semibold tracking-tight">Partner shares</div>
            <div className="text-xs text-muted-foreground">Profit allocation across partners</div>
          </div>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
        {partners.length === 0 ? (
          <EmptyState title="No partners yet" hint="Add partners to allocate profit shares." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {partners.map((p) => {
              const share = (profit * Number(p.share_percentage)) / 100;
              return (
                <div key={p.id} className="rounded-xl border border-border/60 p-4 bg-white/40">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">{p.name}</div>
                    <div className="text-[11px] px-1.5 py-0.5 rounded-md bg-accent/15">{p.share_percentage}%</div>
                  </div>
                  <div className={`font-display text-xl font-semibold tabular-nums ${share >= 0 ? "text-emerald-600" : "text-destructive"}`}>{fmtCurrency(share)}</div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function HeroStat({
  icon, iconBg, iconText, label, value, delay = 0,
}: {
  icon: React.ReactNode; iconBg: string; iconText: string; label: string; value: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card rounded-2xl p-5"
    >
      <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl ${iconBg} ${iconText} shadow-sm mb-4`}>
        {icon}
      </div>
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">{label}</div>
      <div className="font-display text-2xl sm:text-[28px] font-semibold mt-1.5 tracking-tight tabular-nums">{value}</div>
    </motion.div>
  );
}

function StaffDashboard() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<any | null>(null);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: s } = await supabase.from("staff").select("*").eq("user_id", user.id).maybeSingle();
      setStaff(s);
      const today = new Date().toISOString().slice(0, 10);
      const { data: ev } = await supabase.from("event").select("*").gte("end_date", today).order("start_date").limit(5);
      setEvents(ev ?? []);
      if (s?.id) {
        const { data: ps } = await supabase.from("payslip").select("*").eq("staff_id", s.id).order("month", { ascending: false }).limit(3);
        setPayslips(ps ?? []);
      }
    })();
  }, [user]);

  const latest = payslips[0];
  const net = latest ? Number(latest.basic_salary) + Number(latest.bonus) - Number(latest.deductions) : 0;

  return (
    <div>
      <PageHeader title={`Welcome${staff ? `, ${staff.name.split(" ")[0]}` : ""}`} subtitle="Your personal workspace at TRI CUBE." />

      <div className="grid sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <StatCard label="My role" value={staff?.role ?? "Staff"} tone="navy" />
        <StatCard label="Salary type" value={staff?.salary_type === "fixed" ? "Fixed monthly" : staff?.salary_type === "per_project" ? "Per project" : "—"} tone="teal" />
        <StatCard label="Latest payslip" value={latest ? fmtCurrency(net) : "—"} hint={latest ? latest.month : "No payslips yet"} tone="gold" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display font-semibold tracking-tight">Upcoming events</div>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </div>
          {events.length === 0 ? (
            <EmptyState title="No upcoming events" />
          ) : (
            <div className="space-y-3">
              {events.map((e) => (
                <div key={e.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{e.event_name}</div>
                    <div className="text-xs text-muted-foreground">{fmtDate(e.start_date)} → {fmtDate(e.end_date)}</div>
                  </div>
                  <div className="text-xs px-2 py-1 rounded-md bg-accent/15 text-foreground">{e.number_of_students} students</div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display font-semibold tracking-tight">Recent payslips</div>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          {payslips.length === 0 ? (
            <EmptyState title="No payslips yet" />
          ) : (
            <div className="space-y-3">
              {payslips.map((p) => {
                const n = Number(p.basic_salary) + Number(p.bonus) - Number(p.deductions);
                return (
                  <div key={p.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{p.month}</div>
                      <div className="text-xs text-muted-foreground">{fmtDate(p.payment_date)}</div>
                    </div>
                    <div className="font-display font-semibold text-gold">{fmtCurrency(n)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
