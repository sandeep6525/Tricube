import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="glass-card rounded-3xl w-full max-w-lg shadow-elev pointer-events-auto max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 glass-card rounded-t-3xl z-10">
                <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function FormField({
  label, children,
}: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-foreground/70 mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full h-10 rounded-xl border border-input bg-white/60 backdrop-blur px-3 text-sm outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40 transition";
