export interface Connection {
  id: number;
  name: string;
  kind: string;
  dsn: string;
  is_demo: number;
}

export interface CatalogColumn {
  id: number;
  column_name: string;
  ordinal: number;
  physical_type: string;
  description: string | null;
  codes: string | null;
  value_format: string | null;
  share_samples: number;
}

export interface CatalogTable {
  id: number;
  table_name: string;
  description: string | null;
  columns: CatalogColumn[];
}

export interface JoinPath {
  left_table: string;
  left_column: string;
  right_table: string;
  right_column: string;
  description: string | null;
}

export interface Catalog {
  tables: CatalogTable[];
  join_paths: JoinPath[];
}

export interface MergeChange {
  target: string;
  field: string;
  old: string | null;
  new: string;
}

export interface MergePreview {
  added: MergeChange[];
  overwritten: MergeChange[];
  unknown: string[];
  join_count: number;
}

export interface AskOutcome {
  ok: boolean;
  sql: string;
  explanation: string;
  notes: string[];
  attempts: string[];
}

export interface ValidateOutcome {
  ok: boolean;
  sql: string;
  error: string | null;
  notes: string[];
}

export interface ResultColumn {
  name: string;
  business_name: string | null;
  codes: Record<string, string> | null;
  value_format: string | null;
}

export interface RunResult {
  columns: ResultColumn[];
  rows: (string | number | null)[][];
  row_count: number;
  runtime_ms: number;
  truncated: boolean;
  sql: string;
  notes: string[];
}

export interface HistoryRun {
  id: number;
  connection_id: number;
  request_text: string;
  generated_sql: string;
  explanation: string | null;
  status: string;
  error: string | null;
  row_count: number | null;
  runtime_ms: number | null;
  created_at: string;
}

export interface SavedReport {
  id: number;
  connection_id: number;
  name: string;
  request_text: string;
  sql: string;
  explanation: string | null;
  created_at: string;
}
