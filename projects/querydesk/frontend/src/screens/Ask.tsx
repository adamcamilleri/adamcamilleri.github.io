import { useEffect, useState } from "react";
import { api, ApiError } from "../api";
import type { AskPrefill } from "../App";
import ConnectionPicker from "../components/ConnectionPicker";
import ResultsGrid from "../components/ResultsGrid";
import SqlEditor from "../components/SqlEditor";
import type { Connection, RunResult, ValidateOutcome } from "../types";

const EXAMPLES = [
  "Active loans maturing in the next 90 days by province",
  "Total privilege payments by month for 2025",
  "Loans in default with property tax arrears",
];

interface Props {
  connections: Connection[];
  connectionId: number;
  onSelectConnection: (id: number) => void;
  prefill: AskPrefill | null;
  onPrefillConsumed: () => void;
}

export default function Ask({
  connections,
  connectionId,
  onSelectConnection,
  prefill,
  onPrefillConsumed,
}: Props) {
  const [requestText, setRequestText] = useState("");
  const [sql, setSql] = useState("");
  const [explanation, setExplanation] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidateOutcome | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [banner, setBanner] = useState<{ kind: "warn" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<"generate" | "run" | "export" | null>(null);
  const [reportName, setReportName] = useState("");
  const [savedNote, setSavedNote] = useState<string | null>(null);

  useEffect(() => {
    if (prefill) {
      setRequestText(prefill.requestText);
      setSql(prefill.sql);
      setExplanation(prefill.explanation);
      setValidation(null);
      setResult(null);
      setBanner(null);
      onPrefillConsumed();
    }
  }, [prefill, onPrefillConsumed]);

  const generate = async () => {
    if (!requestText.trim()) return;
    setBusy("generate");
    setBanner(null);
    setResult(null);
    setSavedNote(null);
    try {
      const outcome = await api.ask(connectionId, requestText.trim());
      setSql(outcome.sql);
      setExplanation(outcome.explanation);
      if (outcome.ok) {
        setValidation({ ok: true, sql: outcome.sql, error: null, notes: outcome.notes });
      } else {
        setValidation({
          ok: false,
          sql: outcome.sql,
          error: outcome.attempts[outcome.attempts.length - 1] ?? "Validation failed",
          notes: [],
        });
      }
    } catch (e) {
      const kind = e instanceof ApiError && e.status === 503 ? "warn" : "error";
      setBanner({ kind, text: String((e as Error).message ?? e) });
    } finally {
      setBusy(null);
    }
  };

  const validate = async () => {
    if (!sql.trim()) return;
    try {
      const outcome = await api.validate(connectionId, sql);
      setValidation(outcome);
      if (outcome.ok) setSql(outcome.sql);
    } catch (e) {
      setBanner({ kind: "error", text: String((e as Error).message ?? e) });
    }
  };

  const run = async () => {
    if (!sql.trim()) return;
    setBusy("run");
    setBanner(null);
    setSavedNote(null);
    try {
      const outcome = await api.run(connectionId, sql, requestText.trim(), explanation);
      setResult(outcome);
      setSql(outcome.sql);
      setValidation({ ok: true, sql: outcome.sql, error: null, notes: outcome.notes });
    } catch (e) {
      setResult(null);
      const message = String((e as Error).message ?? e);
      if (message.startsWith("Validation failed: ")) {
        setValidation({
          ok: false,
          sql,
          error: message.replace("Validation failed: ", ""),
          notes: [],
        });
      } else {
        setBanner({ kind: "error", text: message });
      }
    } finally {
      setBusy(null);
    }
  };

  const doExport = async (format: "xlsx" | "csv") => {
    setBusy("export");
    setBanner(null);
    try {
      await api.export(connectionId, sql, format);
    } catch (e) {
      setBanner({ kind: "error", text: String((e as Error).message ?? e) });
    } finally {
      setBusy(null);
    }
  };

  const saveReport = async () => {
    if (!reportName.trim() || !sql.trim()) return;
    try {
      await api.createReport(
        connectionId,
        reportName.trim(),
        requestText.trim() || reportName.trim(),
        sql,
        explanation,
      );
      setSavedNote(`Saved as "${reportName.trim()}"`);
      setReportName("");
    } catch (e) {
      setBanner({ kind: "error", text: String((e as Error).message ?? e) });
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">Ask</h1>
        <ConnectionPicker
          connections={connections}
          connectionId={connectionId}
          onSelect={onSelectConnection}
        />
      </div>

      {banner && (
        <div
          className={`mb-3 rounded border px-3 py-2 ${
            banner.kind === "warn"
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-rose-300 bg-rose-50 text-rose-800"
          }`}
        >
          {banner.text}
        </div>
      )}

      <div className="mb-2 flex flex-wrap gap-1.5">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            onClick={() => setRequestText(example)}
            className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[12px] text-slate-600 hover:border-accent hover:text-accent"
          >
            {example}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <textarea
          value={requestText}
          onChange={(e) => setRequestText(e.target.value)}
          placeholder="Describe the report you need, in plain language"
          rows={2}
          className="flex-1 rounded border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          onClick={generate}
          disabled={busy !== null || !requestText.trim()}
          className="self-stretch rounded bg-accent px-4 font-semibold text-white hover:bg-accent-hover disabled:opacity-40"
        >
          {busy === "generate" ? "Generating..." : "Generate SQL"}
        </button>
      </div>

      {(sql || explanation) && (
        <div className="mt-4 space-y-3">
          <SqlEditor value={sql} onChange={(v) => {
            setSql(v);
            setValidation(null);
          }} />

          {explanation && (
            <div className="rounded border border-slate-200 bg-white px-3 py-2 text-slate-600">
              {explanation}
            </div>
          )}

          {validation &&
            (validation.ok ? (
              <div className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-emerald-800">
                Validation passed
                {validation.notes.length > 0 && (
                  <span className="text-emerald-700">
                    {" "}
                    ({validation.notes.join("; ")})
                  </span>
                )}
              </div>
            ) : (
              <div className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-rose-800">
                Validation failed: {validation.error}
              </div>
            ))}

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={run}
              disabled={busy !== null || !sql.trim()}
              className="rounded bg-accent px-4 py-1.5 font-semibold text-white hover:bg-accent-hover disabled:opacity-40"
            >
              {busy === "run" ? "Running..." : "Run"}
            </button>
            <button
              onClick={validate}
              disabled={!sql.trim()}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-accent"
            >
              Validate
            </button>
            <button
              onClick={() => doExport("xlsx")}
              disabled={busy !== null || !sql.trim()}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-accent disabled:opacity-40"
            >
              Export XLSX
            </button>
            <button
              onClick={() => doExport("csv")}
              disabled={busy !== null || !sql.trim()}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-accent disabled:opacity-40"
            >
              Export CSV
            </button>
            <span className="mx-1 text-slate-300">|</span>
            <input
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Report name"
              className="w-44 rounded border border-slate-300 px-2 py-1.5"
            />
            <button
              onClick={saveReport}
              disabled={!reportName.trim() || !sql.trim()}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-accent disabled:opacity-40"
            >
              Save report
            </button>
            {savedNote && <span className="text-emerald-700">{savedNote}</span>}
          </div>
        </div>
      )}

      {result && (
        <div className="mt-4">
          <ResultsGrid result={result} />
        </div>
      )}
    </div>
  );
}
