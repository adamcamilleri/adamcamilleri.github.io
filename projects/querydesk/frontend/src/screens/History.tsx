import { useEffect, useState } from "react";
import { api } from "../api";
import type { AskPrefill } from "../App";
import type { Connection, HistoryRun, SavedReport } from "../types";

interface Props {
  connections: Connection[];
  onOpenInAsk: (fill: AskPrefill) => void;
}

export default function History({ connections, onOpenInAsk }: Props) {
  const [runs, setRuns] = useState<HistoryRun[]>([]);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    Promise.all([api.history(), api.reports()])
      .then(([runList, reportList]) => {
        setRuns(runList);
        setReports(reportList);
        setError(null);
      })
      .catch((e) => setError(String(e.message ?? e)));
  };

  useEffect(load, []);

  const connectionName = (id: number) =>
    connections.find((c) => c.id === id)?.name ?? `Connection ${id}`;

  const removeReport = async (reportId: number) => {
    await api.deleteReport(reportId);
    load();
  };

  return (
    <div className="max-w-5xl">
      <h1 className="mb-4 text-lg font-bold text-slate-900">History</h1>
      {error && (
        <div className="mb-3 rounded border border-rose-300 bg-rose-50 px-3 py-2 text-rose-800">
          {error}
        </div>
      )}

      <div className="mb-6 rounded border border-slate-300 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-700">
          Saved reports
        </div>
        {reports.length === 0 ? (
          <div className="px-3 py-4 text-slate-400">
            No saved reports yet. Save one from the Ask screen.
          </div>
        ) : (
          <table className="w-full text-left">
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-800">
                    {report.name}
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {report.request_text}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-400">
                    {connectionName(report.connection_id)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button
                      onClick={() =>
                        onOpenInAsk({
                          requestText: report.request_text,
                          sql: report.sql,
                          explanation: report.explanation,
                        })
                      }
                      className="rounded border border-slate-300 bg-white px-2.5 py-1 text-slate-700 hover:border-accent"
                    >
                      Open in Ask
                    </button>
                    <button
                      onClick={() => removeReport(report.id)}
                      className="ml-1.5 rounded border border-slate-300 bg-white px-2.5 py-1 text-slate-500 hover:border-rose-400 hover:text-rose-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded border border-slate-300 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-700">
          Past requests
        </div>
        {runs.length === 0 ? (
          <div className="px-3 py-4 text-slate-400">No runs recorded yet.</div>
        ) : (
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-3 py-1.5 font-medium">When (UTC)</th>
                <th className="px-3 py-1.5 font-medium">Request</th>
                <th className="px-3 py-1.5 font-medium">SQL</th>
                <th className="px-3 py-1.5 text-right font-medium">Rows</th>
                <th className="px-3 py-1.5 text-right font-medium">ms</th>
                <th className="px-3 py-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-b border-slate-100 align-top">
                  <td className="whitespace-nowrap px-3 py-1.5 tabular-nums text-slate-500">
                    {run.created_at}
                  </td>
                  <td className="max-w-[16rem] px-3 py-1.5">
                    <span
                      className={
                        run.status === "ok" ? "" : "text-rose-700"
                      }
                    >
                      {run.request_text}
                    </span>
                    {run.error && (
                      <div className="text-[11px] text-rose-600">{run.error}</div>
                    )}
                  </td>
                  <td className="max-w-[22rem] truncate px-3 py-1.5 font-mono text-[11.5px] text-slate-500">
                    {run.generated_sql}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {run.row_count ?? ""}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {run.runtime_ms ?? ""}
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-right">
                    <button
                      onClick={() =>
                        onOpenInAsk({
                          requestText: run.request_text,
                          sql: run.generated_sql,
                          explanation: run.explanation,
                        })
                      }
                      className="rounded border border-slate-300 bg-white px-2.5 py-0.5 text-slate-700 hover:border-accent"
                    >
                      Re-run
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
