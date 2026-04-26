import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex items-end justify-between gap-4 mb-6"
    >
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </motion.div>
  );
}

export function GlassCard({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`glass-card rounded-2xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  delay = 0,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "gold" | "navy" | "teal" | "destructive";
  delay?: number;
}) {
  const toneCls =
    tone === "gold" ? "from-gold/15 to-gold/5 text-gold" :
    tone === "navy" ? "from-navy/15 to-navy/5 text-navy" :
    tone === "teal" ? "from-teal/20 to-teal/5 text-teal" :
    tone === "destructive" ? "from-destructive/15 to-destructive/5 text-destructive" :
    "from-foreground/5 to-transparent text-foreground";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card rounded-2xl p-5 relative overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${toneCls} opacity-60 pointer-events-none`} />
      <div className="relative">
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">{label}</div>
        <div className="font-display text-2xl sm:text-3xl font-semibold mt-2 tracking-tight">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1.5">{hint}</div>}
      </div>
    </motion.div>
  );
}

export function PrimaryButton({
  children, onClick, type = "button", className = "", disabled,
}: {
  children: ReactNode; onClick?: () => void; type?: "button" | "submit"; className?: string; disabled?: boolean;
}) {
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-gold text-white text-sm font-medium shadow-gold hover:opacity-95 transition disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children, onClick, className = "",
}: {
  children: ReactNode; onClick?: () => void; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 h-10 px-4 rounded-xl glass border border-border text-sm font-medium hover:bg-white/80 transition ${className}`}
    >
      {children}
    </button>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <div className="text-sm font-medium text-foreground/70">{title}</div>
      {hint && <div className="text-xs mt-1">{hint}</div>}
    </div>
  );
}
