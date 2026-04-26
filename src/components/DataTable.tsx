import type { ReactNode } from "react";

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  empty = "No data yet.",
}: {
  rows: T[];
  columns: { header: string; cell: (row: T) => ReactNode; className?: string; align?: "left" | "right" | "center" }[];
  rowKey: (row: T) => string;
  empty?: string;
}) {
  if (!rows.length) {
    return <div className="text-center py-12 text-sm text-muted-foreground">{empty}</div>;
  }
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            {columns.map((c, i) => (
              <th
                key={i}
                className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : ""} ${c.className ?? ""}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className="border-t border-border/60 hover:bg-white/40 transition">
              {columns.map((c, i) => (
                <td key={i} className={`px-3 py-3 ${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : ""} ${c.className ?? ""}`}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
