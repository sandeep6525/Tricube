import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, User as UserIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/users")({
  head: () => ({
    meta: [{ title: "Users — TRI CUBE" }],
  }),
  component: UsersPage,
});

type Row = {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "staff";
};

function UsersPage() {
  const { user: me, isAdmin } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const load = async () => {
    setLoading(true);
    setError("");
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("created_at", { ascending: true });

    if (pErr) {
      setError(pErr.message);
      setLoading(false);
      return;
    }

    const { data: roles, error: rErr } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rErr) {
      setError(rErr.message);
      setLoading(false);
      return;
    }

    const roleMap = new Map<string, "admin" | "staff">();
    (roles ?? []).forEach((r: any) => {
      // admin wins over staff if both somehow exist
      const existing = roleMap.get(r.user_id);
      if (r.role === "admin" || !existing) roleMap.set(r.user_id, r.role);
    });

    setRows(
      (profiles ?? []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        role: roleMap.get(p.id) ?? "staff",
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const setRole = async (userId: string, newRole: "admin" | "staff") => {
    setBusyId(userId);
    setError("");
    const { error } = await supabase.rpc("set_user_role", {
      _user_id: userId,
      _new_role: newRole,
    });
    if (error) setError(error.message);
    await load();
    setBusyId(null);
  };

  if (!isAdmin) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <h2 className="font-display text-lg font-semibold">Admins only</h2>
        <p className="text-sm text-muted-foreground mt-1">
          You need admin access to manage users.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Promote staff to admin or revoke admin access.
          </p>
        </div>
      </div>

      {error && (
        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground border-b border-border/60">
          <div className="col-span-5">User</div>
          <div className="col-span-4">Email</div>
          <div className="col-span-1">Role</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading users…
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No users yet.
          </div>
        ) : (
          rows.map((u) => {
            const isMe = me?.id === u.id;
            const isAdminRow = u.role === "admin";
            return (
              <div
                key={u.id}
                className="grid grid-cols-12 items-center px-5 py-3.5 border-b border-border/40 last:border-b-0 hover:bg-accent/5 transition"
              >
                <div className="col-span-5 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-navy text-white flex items-center justify-center text-xs font-semibold uppercase">
                    {u.full_name?.[0] ?? u.email[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {u.full_name}
                      {isMe && (
                        <span className="ml-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                          you
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-span-4 text-sm text-muted-foreground truncate">
                  {u.email}
                </div>
                <div className="col-span-1">
                  <span
                    className={`text-[10px] font-semibold tracking-widest px-2 py-1 rounded-md inline-flex items-center gap-1 ${
                      isAdminRow ? "bg-gold/15 text-gold" : "bg-accent/20 text-foreground"
                    }`}
                  >
                    {isAdminRow ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                    {u.role.toUpperCase()}
                  </span>
                </div>
                <div className="col-span-2 flex justify-end">
                  {isAdminRow ? (
                    <button
                      onClick={() => setRole(u.id, "staff")}
                      disabled={busyId === u.id}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-accent/10 transition disabled:opacity-50"
                    >
                      {busyId === u.id ? "…" : "Demote to Staff"}
                    </button>
                  ) : (
                    <button
                      onClick={() => setRole(u.id, "admin")}
                      disabled={busyId === u.id}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gradient-gold text-white shadow-gold hover:opacity-95 transition disabled:opacity-50"
                    >
                      {busyId === u.id ? "…" : "Promote to Admin"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
