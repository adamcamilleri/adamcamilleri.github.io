import type { Connection } from "../types";

interface Props {
  connections: Connection[];
  connectionId: number;
  onSelect: (id: number) => void;
}

export default function ConnectionPicker({
  connections,
  connectionId,
  onSelect,
}: Props) {
  return (
    <select
      value={connectionId}
      onChange={(e) => onSelect(Number(e.target.value))}
      className="rounded border border-slate-300 bg-white px-2 py-1 text-[13px]"
    >
      {connections.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
