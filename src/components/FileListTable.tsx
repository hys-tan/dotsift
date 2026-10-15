import React, { useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Play,
  FolderSymlink,
  Copy,
  Check,
  FileAudio,
  FileVideo,
  FileImage,
  FileText,
  FileCode2,
  File,
  SearchX,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { FileItem } from "../types";
import { formatBytes, formatDate, getCategoryBadge } from "../utils/formatters";

interface FileListTableProps {
  files: FileItem[];
  searchQuery: string;
  isScanning: boolean;
  hasRootSelected: boolean;
  onOpenFile: (path: string) => void;
  onOpenFolder: (path: string) => void;
  onSelectDirectory: () => void;
}

export const FileListTable: React.FC<FileListTableProps> = ({
  files,
  searchQuery,
  isScanning,
  hasRootSelected,
  onOpenFile,
  onOpenFolder,
  onSelectDirectory,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const virtualizer = useVirtualizer({
    count: files.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 12,
  });

  const handleCopyPath = (id: number, path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getFileIcon = (ext: string) => {
    const e = ext.toLowerCase();
    if (["mp3", "flac", "wav", "aac", "ogg", "m4a", "alac", "opus"].includes(e)) {
      return <FileAudio className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
    if (["mp4", "mkv", "avi", "mov", "wmv", "flv"].includes(e)) {
      return <FileVideo className="w-4 h-4 text-rose-400 shrink-0" />;
    }
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(e)) {
      return <FileImage className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (["pdf", "doc", "docx", "txt", "md", "xls"].includes(e)) {
      return <FileText className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    if (["rs", "ts", "js", "py", "json", "c", "cpp", "cs"].includes(e)) {
      return <FileCode2 className="w-4 h-4 text-indigo-400 shrink-0" />;
    }
    return <File className="w-4 h-4 text-zinc-400 shrink-0" />;
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-indigo-500/30 text-indigo-200 font-semibold rounded px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Estado 1: No hay carpeta seleccionada aún
  if (!hasRootSelected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-950/40">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 shadow-xl">
          <FolderOpen className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-base font-semibold text-zinc-100 mb-1">Ningún directorio seleccionado</h2>
        <p className="text-xs text-zinc-400 max-w-sm mb-5">
          Selecciona una carpeta o biblioteca de audio de tu disco duro para indexar y clasificar todos los archivos en segundos.
        </p>
        <button
          onClick={onSelectDirectory}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 transition-all cursor-pointer shadow-lg shadow-indigo-950/50"
        >
          <FolderOpen className="w-4 h-4" />
          Seleccionar Carpeta
        </button>
      </div>
    );
  }

  // Estado 2: Escaneando en segundo plano
  if (isScanning) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-950/40">
        <div className="relative mb-4">
          <div className="w-14 h-14 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin flex items-center justify-center" />
          <Loader2 className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-100 mb-1">Indexando archivos del sistema...</h3>
        <p className="text-xs text-zinc-500 max-w-xs">
          El hilo de Rust está recorriendo el disco a velocidad nativa sin bloquear la interfaz.
        </p>
      </div>
    );
  }

  // Estado 3: La búsqueda no arrojó resultados
  if (files.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-950/40">
        <SearchX className="w-10 h-10 text-zinc-600 mb-3" />
        <h3 className="text-sm font-medium text-zinc-300 mb-1">No se encontraron archivos</h3>
        <p className="text-xs text-zinc-500">
          No hay elementos que coincidan con &quot;{searchQuery}&quot; en la extensión seleccionada.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-950">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-3 px-5 py-2.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80 bg-zinc-900/40 select-none">
        <div className="col-span-6 flex items-center gap-2">Nombre del Archivo</div>
        <div className="col-span-2">Extensión</div>
        <div className="col-span-2">Tamaño</div>
        <div className="col-span-2 text-right">Acciones</div>
      </div>

      {/* Virtualized Container */}
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto divide-y divide-zinc-900 relative"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const file = files[virtualRow.index];
            const isCopied = copiedId === file.id;
            const badge = getCategoryBadge(file.extension, "");

            return (
              <div
                key={file.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onDoubleClick={() => onOpenFile(file.path)}
                className="grid grid-cols-12 gap-3 px-5 py-2 items-center text-xs hover:bg-zinc-900/60 transition-colors group cursor-pointer border-b border-zinc-900/40"
              >
                {/* Name & Path */}
                <div className="col-span-6 flex items-center gap-3 min-w-0">
                  {getFileIcon(file.extension)}
                  <div className="min-w-0 flex-1">
                    <p
                      className="font-medium text-zinc-200 truncate group-hover:text-indigo-300 transition-colors"
                      title={file.name}
                    >
                      {highlightMatch(file.name, searchQuery)}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate font-mono" title={file.path}>
                      {file.path}
                    </p>
                  </div>
                </div>

                {/* Extension Badge */}
                <div className="col-span-2 flex items-center">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${badge.bg}`}
                  >
                    {file.extension === "[sin extensión]" ? "Ninguna" : file.extension}
                  </span>
                </div>

                {/* Size & Date */}
                <div className="col-span-2 flex flex-col justify-center">
                  <span className="font-mono text-zinc-300 text-[11px] font-medium">
                    {formatBytes(file.size_bytes)}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {formatDate(file.modified_timestamp)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="col-span-2 flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  {/* Play / Open */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenFile(file.path);
                    }}
                    className="p-1.5 rounded-md text-zinc-400 hover:text-emerald-400 hover:bg-emerald-950/40 border border-transparent hover:border-emerald-800/50 transition-all cursor-pointer"
                    title="Reproducir / Abrir con aplicación predeterminada"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>

                  {/* Open Folder in Windows Explorer */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenFolder(file.path);
                    }}
                    className="p-1.5 rounded-md text-zinc-400 hover:text-indigo-400 hover:bg-indigo-950/40 border border-transparent hover:border-indigo-800/50 transition-all cursor-pointer"
                    title="Mostrar en el Explorador de Windows"
                  >
                    <FolderSymlink className="w-3.5 h-3.5" />
                  </button>

                  {/* Copy Path */}
                  <button
                    onClick={(e) => handleCopyPath(file.id, file.path, e)}
                    className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all cursor-pointer"
                    title="Copiar ruta absoluta"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
