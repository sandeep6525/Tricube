import { createFileRoute, Outlet, redirect, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Users,
  UserCog,
  Handshake,
  CalendarDays,
  FileText,
  BarChart3,
  FolderKanban,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.jpeg";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}

const ALL_NAV: { to: string; label: string; icon: typeof LayoutDashboard; roles: ("admin" | "staff")[] }[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "staff"] },
  { to: "/income", label: "Income", icon: TrendingUp, roles: ["admin"] },
  { to: "/expenses", label: "Expenses", icon: Receipt, roles: ["admin"] },
  { to: "/staff", label: "Staff", icon: Users, roles: ["admin"] },
  { to: "/users", label: "Users", icon: UserCog, roles: ["admin"] },
  { to: "/partners", label: "Partners", icon: Handshake, roles: ["admin"] },
  { to: "/events", label: "Events", icon: CalendarDays, roles: ["admin", "staff"] },
  { to: "/projects", label: "Projects", icon: FolderKanban, roles: ["admin", "staff"] },
  { to: "/payslips", label: "Payslips", icon: FileText, roles: ["admin", "staff"] },
  { to: "/reports", label: "Reports", icon: BarChart3, roles: ["admin"] },
];

function Shell() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  const nav = ALL_NAV.filter((n) => !role || n.roles.includes(role));

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col glass-card border-r border-sidebar-border m-3 rounded-2xl shadow-soft">
        <div className="px-6 py-6 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <img src={logo} alt="TRI CUBE" className="h-10 w-10 object-contain rounded-xl" />
            <div>
              <div className="font-display font-semibold text-sm tracking-tight leading-none">TRI CUBE</div>
              <div className="text-[10px] text-muted-foreground tracking-widest mt-0.5">DIGITAL SOLUTIONS</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-gradient-gold text-white shadow-gold"
                    : "text-foreground/70 hover:bg-sidebar-accent hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="text-xs text-muted-foreground mb-2 truncate">{user?.email}</div>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold tracking-widest px-2 py-1 rounded-md ${role === "admin" ? "bg-gold/15 text-gold" : "bg-accent/20 text-foreground"}`}>
              {role?.toUpperCase()}
            </span>
            <button onClick={handleSignOut} className="text-muted-foreground hover:text-foreground transition" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-72 glass-card z-50 lg:hidden p-4 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-display font-semibold">TRI CUBE</span>
                <button onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></button>
              </div>
              <nav className="flex-1 space-y-1">
                {nav.map((item) => {
                  const active = location.pathname === item.to;
                  const Icon = item.icon;
                  return (
                    <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${active ? "bg-gradient-gold text-white" : "hover:bg-sidebar-accent"}`}>
                      <Icon className="h-4 w-4" /><span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-2">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="glass-card mx-3 mt-3 rounded-2xl shadow-soft px-4 sm:px-6 py-3 flex items-center justify-between">
          <button className="lg:hidden" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></button>
          <div className="hidden lg:block">
            <h1 className="font-display text-lg font-semibold tracking-tight">
              {nav.find((n) => location.pathname.startsWith(n.to))?.label ?? "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Live
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-navy text-white flex items-center justify-center text-xs font-semibold uppercase">
              {user?.email?.[0] ?? "?"}
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-6 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
