import type {
  AskOutcome,
  Catalog,
  Connection,
  HistoryRun,
  MergePreview,
  RunResult,
  SavedReport,
  ValidateOutcome,
} from "./types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      if (body.detail) detail = String(body.detail);
    } catch {
      // non-JSON error body; keep the status text
    }
    throw new ApiError(response.status, detail);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export const api = {
  connections: () => request<Connection[]>("/api/connections"),
  addConnection: (name: string, kind: string, dsn: string) =>
    post<Connection>("/api/connections", { name, kind, dsn }),

  catalog: (connectionId: number) =>
    request<Catalog>(`/api/catalog/${connectionId}`),
  patchTable: (tableId: number, description: string | null) =>
    request(`/api/catalog/tables/${tableId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    }),
  patchColumn: (columnId: number, fields: Record<string, unknown>) =>
    request(`/api/catalog/columns/${columnId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    }),
  dictionaryPreview: (connectionId: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<MergePreview>(
      `/api/catalog/${connectionId}/dictionary/preview`,
      { method: "POST", body: form },
    );
  },
  dictionaryApply: (connectionId: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<MergePreview>(
      `/api/catalog/${connectionId}/dictionary/apply`,
      { method: "POST", body: form },
    );
  },

  ask: (connectionId: number, requestText: string) =>
    post<AskOutcome>("/api/ask", {
      connection_id: connectionId,
      request_text: requestText,
    }),
  validate: (connectionId: number, sql: string) =>
    post<ValidateOutcome>("/api/query/validate", {
      connection_id: connectionId,
      sql,
    }),
  run: (
    connectionId: number,
    sql: string,
    requestText: string,
    explanation: string | null,
  ) =>
    post<RunResult>("/api/query/run", {
      connection_id: connectionId,
      sql,
      request_text: requestText,
      explanation,
    }),

  async export(connectionId: number, sql: string, format: "xlsx" | "csv") {
    const response = await fetch(`/api/query/export/${format}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connection_id: connectionId, sql }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new ApiError(response.status, body.detail ?? response.statusText);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `querydesk-export.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  },

  history: () => request<HistoryRun[]>("/api/history"),
  reports: () => request<SavedReport[]>("/api/reports"),
  createReport: (
    connectionId: number,
    name: string,
    requestText: string,
    sql: string,
    explanation: string | null,
  ) =>
    post<SavedReport>("/api/reports", {
      connection_id: connectionId,
      name,
      request_text: requestText,
      sql,
      explanation,
    }),
  deleteReport: (reportId: number) =>
    request(`/api/reports/${reportId}`, { method: "DELETE" }),
};
