export interface FileItem {
  id: number;
  name: string;
  path: string;
  extension: string;
  size_bytes: number;
  modified_timestamp: number;
}

export interface ExtensionStat {
  extension: string;
  count: number;
  total_size_bytes: number;
  category: "audio" | "video" | "image" | "document" | "archive" | "code" | "other" | string;
}

export interface ScanResult {
  root_paths: string[];
  total_files: number;
  total_size_bytes: number;
  duration_ms: number;
  extensions: ExtensionStat[];
}

export type SortField = "name" | "size" | "date";
export type SortOrder = "asc" | "desc";
