import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import ConnectionPicker from "../components/ConnectionPicker";
import type {
  Catalog as CatalogData,
  CatalogColumn,
  Connection,
  MergePreview,
} from "../types";

interface Props {
  connections: Connection[];
  connectionId: number;
  onSelectConnection: (id: number) => void;
}

export default function Catalog({
  connections,
  connectionId,
  onSelectConnection,
}: Props) {
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<MergePreview | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    api
      .catalog(connectionId)
      .then((data) => {
        setCatalog(data);
        setSelectedTable((current) =>
          current && data.tables.some((t) => t.table_name === current)
            ? current
            : (data.tables[0]?.table_name ?? null),
        );
        setError(null);
      })
      .catch((e) => setError(String(e.message ?? e)));
  }, [connectionId]);

  useEffect(load, [load]);

  const table = catalog?.tables.find((t) => t.table_name === selectedTable);

  const onFileChosen = async (file: File) => {
    setPendingFile(file);
    setError(null);
    try {
      setPreview(await api.dictionaryPreview(connectionId, file));
    } catch (e) {
      setPendingFile(null);
      setError(String((e as Error).message ?? e));
    }
  };

  const applyDictionary = async () => {
    if (!pendingFile) return;
    try {
      await api.dictionaryApply(connectionId, pendingFile);
      setPreview(null);
      setPendingFile(null);
      load();
    } catch (e) {
      setError(String((e as Error).message ?? e));
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">Catalog</h1>
        <div className="flex items-center gap-2">
          <input
            ref={fileInput}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileChosen(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInput.current?.click()}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-accent"
          >
            Upload dictionary
          </button>
          <ConnectionPicker
            connections={connections}
            connectionId={connectionId}
            onSelect={onSelectConnection}
          />
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded border border-rose-300 bg-rose-50 px-3 py-2 text-rose-800">
          {error}
        </div>
      )}

      {preview && (
        <div className="mb-4 rounded border border-slate-300 bg-white p-4">
          <div className="mb-2 font-semibold text-slate-800">
            Dictionary merge preview: {pendingFile?.name}
          </div>
          <div className="mb-3 text-slate-600">
            {preview.added.length} additions, {preview.overwritten.length}{" "}
            overwrites, {preview.join_count} join paths,{" "}
            {preview.unknown.length} unknown entries (skipped).
          </div>
          <div className="mb-3 grid max-h-56 grid-cols-1 gap-3 overflow-auto md:grid-cols-2">
            <ChangeList title="Will be added" changes={preview.added} />
            <ChangeList title="Will be overwritten" changes={preview.overwritten} />
          </div>
          {preview.unknown.length > 0 && (
            <div className="mb-3 text-[12px] text-amber-800">
              Not in the live schema, will be skipped:{" "}
              {preview.unknown.join(", ")}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={applyDictionary}
              className="rounded bg-accent px-4 py-1.5 font-semibold text-white hover:bg-accent-hover"
            >
              Apply dictionary
            </button>
            <button
              onClick={() => {
                setPreview(null);
                setPendingFile(null);
              }}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {catalog && (
        <div className="flex gap-4">
          <div className="w-48 shrink-0">
            {catalog.tables.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTable(t.table_name)}
                className={`mb-0.5 block w-full rounded px-2.5 py-1.5 text-left font-mono ${
                  t.table_name === selectedTable
                    ? "bg-accent-soft font-semibold text-accent"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t.table_name}
              </button>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            {table && (
              <TableDetail
                key={table.id}
                table={table}
                joinPaths={catalog.join_paths.filter(
                  (j) =>
                    j.left_table === table.table_name ||
                    j.right_table === table.table_name,
                )}
                onSaved={load}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ChangeList({
  title,
  changes,
}: {
  title: string;
  changes: MergePreview["added"];
}) {
  return (
    <div>
      <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
        {title} ({changes.length})
      </div>
      {changes.length === 0 ? (
        <div className="text-[12px] text-slate-400">None</div>
      ) : (
        <ul className="space-y-0.5 text-[12px]">
          {changes.slice(0, 40).map((c, i) => (
            <li key={i}>
              <span className="font-mono">{c.target}</span>{" "}
              <span className="text-slate-500">{c.field}:</span>{" "}
              {c.old && <span className="text-rose-700 line-through">{c.old}</span>}{" "}
              <span className="text-emerald-800">{c.new}</span>
            </li>
          ))}
          {changes.length > 40 && (
            <li className="text-slate-400">and {changes.length - 40} more</li>
          )}
        </ul>
      )}
    </div>
  );
}

function TableDetail({
  table,
  joinPaths,
  onSaved,
}: {
  table: { id: number; table_name: string; description: string | null; columns: CatalogColumn[] };
  joinPaths: { left_table: string; left_column: string; right_table: string; right_column: string }[];
  onSaved: () => void;
}) {
  const [description, setDescription] = useState(table.description ?? "");

  const saveTableDescription = async () => {
    if (description === (table.description ?? "")) return;
    await api.patchTable(table.id, description || null);
    onSaved();
  };

  return (
    <div className="rounded border border-slate-300 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="font-mono text-[15px] font-bold text-slate-900">
          {table.table_name}
        </div>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={saveTableDescription}
          placeholder="Table description"
          className="mt-1 w-full rounded border border-transparent px-1 py-0.5 text-slate-600 hover:border-slate-200 focus:border-slate-300 focus:outline-none"
        />
        {joinPaths.length > 0 && (
          <div className="mt-1 text-[12px] text-slate-400">
            Joins:{" "}
            {joinPaths
              .map(
                (j) =>
                  `${j.left_table}.${j.left_column} = ${j.right_table}.${j.right_column}`,
              )
              .join("; ")}
          </div>
        )}
      </div>
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="bg-slate-50 text-left text-slate-500">
            <th className="px-3 py-1.5 font-medium">Column</th>
            <th className="px-3 py-1.5 font-medium">Type</th>
            <th className="px-3 py-1.5 font-medium">Business description</th>
            <th className="px-3 py-1.5 font-medium">Codes</th>
            <th className="px-3 py-1.5 font-medium">Format</th>
            <th className="px-3 py-1.5 font-medium" title="Share sample values with the model">
              Samples
            </th>
          </tr>
        </thead>
        <tbody>
          {table.columns.map((col) => (
            <ColumnRow key={col.id} column={col} onSaved={onSaved} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ColumnRow({
  column,
  onSaved,
}: {
  column: CatalogColumn;
  onSaved: () => void;
}) {
  const [description, setDescription] = useState(column.description ?? "");
  const [codes, setCodes] = useState(column.codes ?? "");

  const save = async (fields: Record<string, unknown>) => {
    await api.patchColumn(column.id, fields);
    onSaved();
  };

  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="whitespace-nowrap px-3 py-1.5 font-mono font-semibold">
        {column.column_name}
      </td>
      <td className="whitespace-nowrap px-3 py-1.5 font-mono text-slate-500">
        {column.physical_type}
      </td>
      <td className="px-3 py-1">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() =>
            description !== (column.description ?? "") &&
            save({ description: description || null })
          }
          className="w-full rounded border border-transparent px-1 py-0.5 hover:border-slate-200 focus:border-slate-300 focus:outline-none"
        />
      </td>
      <td className="px-3 py-1">
        <input
          value={codes}
          onChange={(e) => setCodes(e.target.value)}
          onBlur={() =>
            codes !== (column.codes ?? "") && save({ codes: codes || null })
          }
          placeholder="A=Label; B=Label"
          className="w-full rounded border border-transparent px-1 py-0.5 font-mono text-[12px] hover:border-slate-200 focus:border-slate-300 focus:outline-none"
        />
      </td>
      <td className="px-3 py-1">
        <select
          value={column.value_format ?? ""}
          onChange={(e) => save({ value_format: e.target.value || null })}
          className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[12px]"
        >
          <option value="">plain</option>
          <option value="CYMD">CYMD date</option>
        </select>
      </td>
      <td className="px-3 py-1 text-center">
        <input
          type="checkbox"
          checked={column.share_samples === 1}
          onChange={(e) => save({ share_samples: e.target.checked })}
        />
      </td>
    </tr>
  );
}
