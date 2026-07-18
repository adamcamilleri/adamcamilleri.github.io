import type { RunResult } from "../types";

function formatCymd(value: string | number | null): string | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 19000101 || n > 21001231) return null;
  const year = Math.floor(n / 10000);
  const month = Math.floor((n % 10000) / 100);
  const day = n % 100;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

export default function ResultsGrid({ result }: { result: RunResult }) {
  return (
    <div className="rounded border border-slate-300 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-1.5 text-xs text-slate-500">
        <span>
          {result.row_count.toLocaleString()} rows in {result.runtime_ms} ms
          {result.truncated ? " (truncated at the row limit)" : ""}
        </span>
      </div>
      <div className="max-h-[28rem] overflow-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              {result.columns.map((col) => (
                <th
                  key={col.name}
                  className="border-b border-slate-300 px-2.5 py-1.5 text-left align-bottom"
                >
                  <div className="font-mono font-semibold text-slate-800">
                    {col.name}
                  </div>
                  {col.business_name && (
                    <div className="font-normal text-slate-500">
                      {col.business_name}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, i) => (
              <tr key={i} className="odd:bg-white even:bg-slate-50/60">
                {row.map((value, j) => {
                  const col = result.columns[j];
                  const decoded =
                    col.codes && value !== null
                      ? col.codes[String(value)]
                      : null;
                  const asDate =
                    col.value_format === "CYMD" ? formatCymd(value) : null;
                  return (
                    <td
                      key={j}
                      className="whitespace-nowrap border-b border-slate-100 px-2.5 py-1 tabular-nums"
                    >
                      {value === null ? (
                        <span className="text-slate-300">null</span>
                      ) : asDate ? (
                        <>
                          <span>{asDate}</span>
                          <span className="ml-1.5 text-[11px] text-slate-400">
                            {String(value)}
                          </span>
                        </>
                      ) : decoded ? (
                        <>
                          <span className="font-mono">{String(value)}</span>
                          <span className="ml-1.5 text-slate-500">
                            {decoded}
                          </span>
                        </>
                      ) : (
                        String(value)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {result.rows.length === 0 && (
          <div className="px-3 py-6 text-center text-slate-400">
            The query returned no rows.
          </div>
        )}
      </div>
    </div>
  );
}
