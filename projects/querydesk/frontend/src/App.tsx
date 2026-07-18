import { useEffect, useState } from "react";
import { api } from "./api";
import Ask from "./screens/Ask";
import Catalog from "./screens/Catalog";
import Connections from "./screens/Connections";
import History from "./screens/History";
import type { Connection } from "./types";

export type Screen = "connections" | "catalog" | "ask" | "history";

export interface AskPrefill {
  requestText: string;
  sql: string;
  explanation: string | null;
}

const NAV: { id: Screen; label: string }[] = [
  { id: "ask", label: "Ask" },
  { id: "catalog", label: "Catalog" },
  { id: "history", label: "History" },
  { id: "connections", label: "Connections" },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("ask");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionId, setConnectionId] = useState<number | null>(null);
  const [prefill, setPrefill] = useState<AskPrefill | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshConnections = () =>
    api
      .connections()
      .then((list) => {
        setConnections(list);
        setConnectionId((current) => {
          if (current && list.some((c) => c.id === current)) return current;
          const demo = list.find((c) => c.is_demo) ?? list[0];
          return demo ? demo.id : null;
        });
        setLoadError(null);
      })
      .catch((e) => setLoadError(String(e.message ?? e)));

  useEffect(() => {
    refreshConnections();
  }, []);

  const openInAsk = (fill: AskPrefill) => {
    setPrefill(fill);
    setScreen("ask");
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-52 shrink-0 border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="text-base font-bold tracking-tight text-accent">
            QueryDesk
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            Self-serve legacy reporting
          </div>
        </div>
        <nav className="p-2">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className={`mb-0.5 block w-full rounded px-3 py-1.5 text-left ${
                screen === item.id
                  ? "bg-accent-soft font-semibold text-accent"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-5">
        {loadError && (
          <div className="mb-4 rounded border border-rose-300 bg-rose-50 px-3 py-2 text-rose-800">
            Could not reach the QueryDesk API: {loadError}. Is the backend
            running on port 8000?
          </div>
        )}
        {screen === "connections" && (
          <Connections
            connections={connections}
            onChanged={refreshConnections}
          />
        )}
        {screen === "catalog" && connectionId !== null && (
          <Catalog
            connections={connections}
            connectionId={connectionId}
            onSelectConnection={setConnectionId}
          />
        )}
        {screen === "ask" && connectionId !== null && (
          <Ask
            connections={connections}
            connectionId={connectionId}
            onSelectConnection={setConnectionId}
            prefill={prefill}
            onPrefillConsumed={() => setPrefill(null)}
          />
        )}
        {screen === "history" && (
          <History connections={connections} onOpenInAsk={openInAsk} />
        )}
        {connectionId === null &&
          !loadError &&
          (screen === "catalog" || screen === "ask") && (
            <div className="text-slate-500">
              No connections yet. Run make seed to create the demo connection.
            </div>
          )}
      </main>
    </div>
  );
}
