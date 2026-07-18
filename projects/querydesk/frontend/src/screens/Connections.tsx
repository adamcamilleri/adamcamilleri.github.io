import { useState } from "react";
import { api } from "../api";
import type { Connection } from "../types";

const KIND_LABELS: Record<string, string> = {
  sqlite: "SQLite file",
  db2_odbc: "DB2 for i (AS/400, ODBC)",
  sqlserver: "SQL Server (ODBC)",
};

interface Props {
  connections: Connection[];
  onChanged: () => void;
}

export default function Connections({ connections, onChanged }: Props) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("db2_odbc");
  const [dsn, setDsn] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || !dsn.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      await api.addConnection(name.trim(), kind, dsn.trim());
      setMessage({ ok: true, text: `Connection "${name.trim()}" added.` });
      setName("");
      setDsn("");
      onChanged();
    } catch (e) {
      setMessage({ ok: false, text: String((e as Error).message ?? e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="mb-4 text-lg font-bold text-slate-900">Connections</h1>

      <div className="mb-6 rounded border border-slate-300 bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Connection</th>
            </tr>
          </thead>
          <tbody>
            {connections.map((c) => (
              <tr key={c.id} className="border-b border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-800">
                  {c.name}
                  {c.is_demo === 1 && (
                    <span className="ml-2 rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent">
                      demo
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {KIND_LABELS[c.kind] ?? c.kind}
                </td>
                <td className="max-w-md truncate px-3 py-2 font-mono text-[12px] text-slate-500">
                  {c.dsn}
                </td>
              </tr>
            ))}
            {connections.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-slate-400">
                  No connections. Run make seed to create the demo connection.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded border border-slate-300 bg-white p-4">
        <div className="mb-3 font-semibold text-slate-800">Add a connection</div>
        {message && (
          <div
            className={`mb-3 rounded border px-3 py-2 ${
              message.ok
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-amber-300 bg-amber-50 text-amber-900"
            }`}
          >
            {message.text}
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-slate-600">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-slate-300 px-2 py-1.5"
              placeholder="Production MIPROD"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-slate-600">Type</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5"
            >
              <option value="db2_odbc">{KIND_LABELS.db2_odbc}</option>
              <option value="sqlserver">{KIND_LABELS.sqlserver}</option>
              <option value="sqlite">{KIND_LABELS.sqlite}</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-slate-600">
              {kind === "sqlite" ? "Database file path" : "Connection string"}
            </span>
            <input
              value={dsn}
              onChange={(e) => setDsn(e.target.value)}
              className="w-full rounded border border-slate-300 px-2 py-1.5 font-mono text-[12px]"
              placeholder={
                kind === "sqlite"
                  ? "C:/data/legacy.db"
                  : "SYSTEM=PROD400;UID=QRYUSER;PWD=..."
              }
            />
          </label>
        </div>
        <button
          onClick={submit}
          disabled={busy || !name.trim() || !dsn.trim()}
          className="mt-3 rounded bg-accent px-4 py-1.5 font-semibold text-white hover:bg-accent-hover disabled:opacity-40"
        >
          {busy ? "Testing..." : "Test and add"}
        </button>
      </div>
    </div>
  );
}
