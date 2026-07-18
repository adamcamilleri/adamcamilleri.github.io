import { useRef } from "react";

const KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "IS", "NULL", "AS",
  "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "CROSS", "ON", "GROUP", "BY",
  "ORDER", "HAVING", "LIMIT", "OFFSET", "UNION", "ALL", "DISTINCT", "CASE",
  "WHEN", "THEN", "ELSE", "END", "BETWEEN", "LIKE", "EXISTS", "CAST", "ASC",
  "DESC", "WITH",
]);

const FUNCTIONS = new Set([
  "COUNT", "SUM", "AVG", "MIN", "MAX", "ROUND", "COALESCE", "SUBSTR",
  "LENGTH", "PRINTF", "ABS", "IFNULL",
]);

const TOKEN_PATTERN = /('(?:[^']|'')*'?)|(\d+(?:\.\d+)?)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|(.)/g;

function highlight(sql: string) {
  const parts: React.ReactNode[] = [];
  let match: RegExpExecArray | null;
  let key = 0;
  TOKEN_PATTERN.lastIndex = 0;
  while ((match = TOKEN_PATTERN.exec(sql)) !== null) {
    const [text, str, num, word] = match;
    let className = "";
    if (str) className = "text-emerald-700";
    else if (num) className = "text-rose-700";
    else if (word) {
      const upper = word.toUpperCase();
      if (KEYWORDS.has(upper)) className = "text-accent font-semibold";
      else if (FUNCTIONS.has(upper)) className = "text-purple-700";
    }
    parts.push(
      className ? (
        <span key={key++} className={className}>
          {text}
        </span>
      ) : (
        text
      ),
    );
  }
  return parts;
}

interface Props {
  value: string;
  onChange: (sql: string) => void;
  minRows?: number;
}

export default function SqlEditor({ value, onChange, minRows = 6 }: Props) {
  const preRef = useRef<HTMLPreElement>(null);

  const rows = Math.max(minRows, value.split("\n").length);
  const sharedStyle =
    "m-0 w-full whitespace-pre-wrap break-words p-3 font-mono text-[13px] leading-5";

  return (
    <div className="relative rounded border border-slate-300 bg-white">
      <pre
        ref={preRef}
        aria-hidden
        className={`${sharedStyle} pointer-events-none absolute inset-0 overflow-hidden text-slate-800`}
      >
        {highlight(value)}
        {"\n"}
      </pre>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={(e) => {
          if (preRef.current)
            preRef.current.scrollTop = e.currentTarget.scrollTop;
        }}
        rows={rows}
        spellCheck={false}
        className={`${sharedStyle} relative resize-y bg-transparent text-transparent caret-slate-800 outline-none focus:ring-1 focus:ring-accent`}
      />
    </div>
  );
}
