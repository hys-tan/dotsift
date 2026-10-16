import React, { useRef, useState, useEffect } from "react";
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

interface ContextMenuState {
  file: FileItem;
  x: number;
  y: number;
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
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Virtualizador incondicional
  const virtualizer = useVirtualizer({
    count: files.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 12,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Cerrar el menú contextual al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = () => setContextMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
      }
    };

    window.addEventListener("click", handleClickOutside);
    window.addEventListener("contextmenu", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("click", handleClickOutside);
      window.removeEventListener("contextmenu", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu]);

  const handleRowContextMenu = (file: FileItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Calcular posición para que no se desborde fuera de la pantalla
    const menuWidth = 220;
    const menuHeight = 150;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 12);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 12);

    setContextMenu({ file, x, y });
  };

  const handleCopyPath = (id: number, path: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getFileIcon = (ext: string) => {
    const e = ext.toLowerCase();
    if (["mp3", "flac", "wav", "aac", "ogg", "m4a", "alac", "opus"].includes(e)) {
      return <FileAudio className="w-4 h-4 text-[#006b8f] shrink-0" />;
    }
    if (["mp4", "mkv", "avi", "mov", "wmv", "flv"].includes(e)) {
      return <FileVideo className="w-4 h-4 text-[#312d2a] shrink-0" />;
    }
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(e)) {
      return <FileImage className="w-4 h-4 text-[#33553c] shrink-0" />;
    }
    if (["pdf", "doc", "docx", "txt", "md", "xls"].includes(e)) {
      return <FileText className="w-4 h-4 text-[#c74634] shrink-0" />;
    }
    if (["rs", "ts", "js", "py", "json", "c", "cpp", "cs"].includes(e)) {
      return <FileCode2 className="w-4 h-4 text-[#312d2a] shrink-0" />;
    }
    return <File className="w-4 h-4 text-[#767069] shrink-0" />;
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    try {
      const parts = text.split(new RegExp(`(${query.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi"));
      return (
        <>
          {parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
              <mark key={i} className="bg-[#f7e0a1] text-[#161513] font-semibold px-0.5 rounded-[2px]">
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </>
      );
    } catch {
      return text;
    }
  };

  // Estado: No hay carpetas seleccionadas
  if (!hasRootSelected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#fbf9f8] select-none font-sans-oracle">
        <div className="w-14 h-14 rounded-[8px] bg-[#ffffff] border border-[#e4e1dd] flex items-center justify-center mb-4">
          <FolderOpen className="w-6 h-6 text-[#312d2a]" />
        </div>
        <h2 className="text-base font-bold text-[#161513] mb-1">Ningún directorio seleccionado</h2>
        <p className="text-xs text-[#767069] max-w-sm mb-5 leading-relaxed">
          Selecciona una o más carpetas para catalogar y filtrar tus archivos al instante.
        </p>
        <button
          onClick={onSelectDirectory}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[4px] text-xs font-medium bg-[#312d2a] text-[#ffffff] hover:bg-[#47423e] transition-colors cursor-pointer"
        >
          <FolderOpen className="w-4 h-4" />
          <span>Seleccionar Carpeta</span>
        </button>
      </div>
    );
  }

  // Estado: Escaneando en segundo plano
  if (isScanning) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#fbf9f8] select-none font-sans-oracle">
        <Loader2 className="w-7 h-7 text-[#312d2a] mb-3 animate-spin" />
        <h3 className="text-sm font-bold text-[#161513] mb-1">Indexando archivos del sistema...</h3>
        <p className="text-xs text-[#767069] max-w-xs">
          Procesando directorios sin bloquear la interfaz.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#ffffff] select-none font-sans-oracle relative">
      {/* Table Header (Oracle ex-data-table-cell: headerBackground canvas-tint #f5f4f2) */}
      <div className="grid grid-cols-12 gap-4 px-6 py-2.5 text-xs font-bold text-[#161513] uppercase tracking-wider border-b border-[#e4e1dd] bg-[#f5f4f2] shrink-0">
        <div className="col-span-6 flex items-center gap-2">Nombre del Archivo</div>
        <div className="col-span-2">Extensión</div>
        <div className="col-span-2">Tamaño</div>
        <div className="col-span-2 text-right">Acciones</div>
      </div>

      {/* Table Body Area */}
      {files.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none font-sans-oracle">
          <div className="w-12 h-12 rounded-[8px] bg-[#fbf9f8] border border-[#e4e1dd] flex items-center justify-center mb-3">
            <SearchX className="w-6 h-6 text-[#aea8a2]" />
          </div>
          <h3 className="text-sm font-bold text-[#161513] mb-1">No se encontraron archivos</h3>
          <p className="text-xs text-[#767069] max-w-sm leading-relaxed">
            No hay ningún archivo que coincida con &quot;{searchQuery}&quot;. Puedes probar con otro nombre o pulsar{" "}
            <kbd className="px-1.5 py-0.5 bg-[#f5f4f2] border border-[#e4e1dd] rounded-[3px] text-[10px] font-mono-oracle font-medium text-[#161513]">
              Esc
            </kbd>{" "}
            para limpiar la búsqueda.
          </p>
        </div>
      ) : (
        /* Virtualized Container */
        <div
          ref={parentRef}
          className="flex-1 overflow-y-auto divide-y divide-[#e9e7e4] relative"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualItems.map((virtualRow) => {
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
                  onContextMenu={(e) => handleRowContextMenu(file, e)}
                  className="grid grid-cols-12 gap-4 px-6 py-2 items-center text-xs hover:bg-[#fbf9f8] transition-colors group cursor-pointer border-b border-[#e4e1dd]"
                >
                  {/* Name & Path */}
                  <div className="col-span-6 flex items-center gap-3 min-w-0">
                    {getFileIcon(file.extension)}
                    <div className="min-w-0 flex-1">
                      <p
                        className="font-medium text-[#161513] truncate group-hover:text-[#006b8f] transition-colors"
                        title={file.name}
                      >
                        {highlightMatch(file.name, searchQuery)}
                      </p>
                      <p
                        className="text-[11px] text-[#767069] truncate font-mono-oracle"
                        title={file.path}
                      >
                        {file.path}
                      </p>
                    </div>
                  </div>

                  {/* Extension Badge */}
                  <div className="col-span-2 flex items-center">
                    <span
                      className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono-oracle font-semibold uppercase border ${badge.bg}`}
                    >
                      {file.extension === "[sin extensión]" ? "Ninguna" : file.extension}
                    </span>
                  </div>

                  {/* Size & Date */}
                  <div className="col-span-2 flex flex-col justify-center">
                    <span className="font-mono-oracle text-[#161513] text-[11px] font-medium">
                      {formatBytes(file.size_bytes)}
                    </span>
                    <span className="text-[10px] text-[#767069]">
                      {formatDate(file.modified_timestamp)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenFile(file.path);
                      }}
                      className="p-1.5 rounded-[4px] text-[#312d2a] hover:bg-[#f5f4f2] transition-colors cursor-pointer"
                      title="Abrir con aplicación predeterminada"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenFolder(file.path);
                      }}
                      className="p-1.5 rounded-[4px] text-[#312d2a] hover:bg-[#f5f4f2] transition-colors cursor-pointer"
                      title="Mostrar en el Explorador de Windows"
                    >
                      <FolderSymlink className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleCopyPath(file.id, file.path, e)}
                      className="p-1.5 rounded-[4px] text-[#312d2a] hover:bg-[#f5f4f2] transition-colors cursor-pointer"
                      title="Copiar ruta absoluta"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-[#33553c]" />
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
      )}

      {/* Menú Contextual Personalizado al hacer clic derecho */}
      {contextMenu && (
        <div
          style={{
            position: "fixed",
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            zIndex: 9999,
          }}
          className="w-56 bg-[#ffffff] border border-[#d4cfca] rounded-[6px] shadow-lg py-1 text-xs select-none animate-fadeIn font-sans-oracle"
          onClick={(e) => e.stopPropagation()}
        >
          {/* File header in menu */}
          <div className="px-3 py-1.5 border-b border-[#e4e1dd] bg-[#fbf9f8] text-[11px] text-[#767069] truncate font-mono-oracle">
            {contextMenu.file.name}
          </div>

          {/* Menu Items */}
          <button
            onClick={() => {
              onOpenFile(contextMenu.file.path);
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-[#161513] hover:bg-[#f5f4f2] transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-[#312d2a]" />
            <span>Abrir archivo</span>
          </button>

          <button
            onClick={() => {
              onOpenFolder(contextMenu.file.path);
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-[#161513] hover:bg-[#f5f4f2] transition-colors cursor-pointer"
          >
            <FolderSymlink className="w-3.5 h-3.5 text-[#312d2a]" />
            <span>Mostrar en el Explorador</span>
          </button>

          <div className="h-[1px] bg-[#e4e1dd] my-1" />

          <button
            onClick={(e) => {
              handleCopyPath(contextMenu.file.id, contextMenu.file.path, e);
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-[#161513] hover:bg-[#f5f4f2] transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-[#312d2a]" />
            <span>Copiar ruta absoluta</span>
          </button>
        </div>
      )}
    </div>
  );
};
