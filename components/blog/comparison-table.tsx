import type { BlogComparisonTable } from "@/lib/types";

export function ComparisonTable({ table }: { table: BlogComparisonTable }) {
  return (
    <div>
      {table.heading && <p className="font-heading text-base font-semibold text-foreground">{table.heading}</p>}
      <div className="mt-3 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50">
              {table.headers.map((header, i) => (
                <th
                  key={i}
                  className="border-b border-border px-4 py-2.5 text-left font-heading font-semibold text-foreground"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 1 ? "bg-gray-50/60" : undefined}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="border-b border-border px-4 py-2.5 text-gray-600 last:border-b-0">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
