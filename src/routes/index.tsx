import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Shield, BarChart3 } from "lucide-react";
import logo from "@/assets/logo.jpeg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TRI CUBE Digital Solutions — Company Operating System" },
      { name: "description", content: "An Apple-grade operating system for finance, staff, events and reporting at TRI CUBE." },
      { property: "og:title", content: "TRI CUBE Digital Solutions" },
      { property: "og:description", content: "An Apple-grade operating system for finance, staff, events and reporting." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gold/15 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-teal/15 blur-3xl" />

      <header className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="TRI CUBE Digital Solutions" className="h-11 w-11 object-contain rounded-2xl" />
          <div>
            <div className="font-display font-semibold tracking-tight text-sm">TRI CUBE</div>
            <div className="text-[10px] text-muted-foreground tracking-[0.2em]">DIGITAL SOLUTIONS</div>
          </div>
        </div>
        <Link to="/login" className="text-sm font-medium text-foreground/70 hover:text-foreground transition flex items-center gap-1.5">
          Sign in <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 sm:pt-24 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-gold/30 text-xs font-medium text-foreground/70 mb-8"
        >
          <Sparkles className="h-3.5 w-3.5 text-gold" />
          The operating system for your studio
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
          className="font-display text-5xl sm:text-7xl font-semibold tracking-tight leading-[1.05] mb-6"
        >
          Run your company with <br className="hidden sm:block" />
          <span className="text-gradient-gold">precision and grace.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Finance, staff, events, and reports — unified in one beautifully crafted workspace built for TRI CUBE Digital Solutions.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
          className="flex items-center justify-center gap-3"
        >
          <Link to="/login" className="h-12 px-7 rounded-2xl bg-gradient-gold text-white font-medium shadow-gold hover:opacity-95 transition inline-flex items-center gap-2">
            Open dashboard <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/login" className="h-12 px-6 rounded-2xl glass border border-border font-medium hover:bg-white/80 transition">
            Staff sign in
          </Link>
        </motion.div>

        <div className="mt-24 grid sm:grid-cols-3 gap-4">
          {[
            { icon: BarChart3, title: "Financial clarity", desc: "Revenue, expenses, profit and partner shares — at a glance." },
            { icon: Shield, title: "Role-based access", desc: "Admins see everything. Staff see only what they should." },
            { icon: Sparkles, title: "Made beautiful", desc: "A premium interface that feels effortless to use every day." },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 + i * 0.08 }}
              className="glass-card rounded-2xl p-6 text-left"
            >
              <div className="h-10 w-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <div className="font-semibold mb-1">{f.title}</div>
              <div className="text-sm text-muted-foreground">{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
