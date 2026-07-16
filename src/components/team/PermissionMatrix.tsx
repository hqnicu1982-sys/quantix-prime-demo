import { Card, CardHead } from "@/components/Primitives";

type Tier = "Admin" | "Pro Control" | "Pro" | "Operative";

const ROWS: Array<[Tier, boolean, boolean, boolean, boolean, boolean, boolean, boolean]> = [
  ["Admin", true, true, true, true, true, true, true],
  ["Pro Control", true, true, true, true, true, false, false],
  ["Pro", true, true, true, false, false, false, false],
  ["Operative", true, false, false, false, false, false, false],
];

const COLS = ["View projects", "Edit BoQ", "Upload prices", "Approve call-offs", "Sign invoices", "Manage users", "Billing"];

export function PermissionMatrix({
  subtitle = "Role × capability",
  highlightTiers,
  counts,
}: {
  subtitle?: string;
  highlightTiers?: Tier[];
  counts?: Partial<Record<Tier, number>>;
}) {
  const highlightSet = highlightTiers ? new Set(highlightTiers) : null;
  return (
    <Card>
      <CardHead title="Permission matrix" subtitle={subtitle} />
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead className="bg-[var(--ink-50)] text-[10.5px] uppercase tracking-wider text-[var(--ink-500)]">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">Role</th>
              {COLS.map((c) => (
                <th key={c} className="px-3 py-2.5 text-center font-semibold">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ink-200)]">
            {ROWS.map((row) => {
              const tier = row[0];
              const isHighlight = !highlightSet || highlightSet.has(tier);
              const count = counts?.[tier];
              return (
                <tr
                  key={tier}
                  className={
                    highlightSet
                      ? isHighlight
                        ? "bg-[var(--accent-500)]/5"
                        : "opacity-45"
                      : ""
                  }
                >
                  <td className="px-4 py-2.5 font-semibold">
                    <span className={isHighlight && highlightSet ? "text-[var(--ink-900)]" : ""}>{tier}</span>
                    {isHighlight && highlightSet && count !== undefined && count > 0 && (
                      <span className="ml-2 rounded bg-[var(--accent-500)]/10 px-1.5 py-0.5 font-mono-num text-[10px] font-semibold text-[var(--accent-500)]">
                        {count} {count === 1 ? "member" : "members"}
                      </span>
                    )}
                  </td>
                  {row.slice(1).map((v, i) => (
                    <td key={i} className="px-3 py-2.5 text-center">
                      {v ? <span className="text-[var(--green-600)]">✓</span> : <span className="text-[var(--ink-200)]">✗</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
