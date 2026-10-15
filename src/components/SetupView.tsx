import React, { useState, useRef, useEffect } from "react";
import {
  FolderPlus,
  Folder,
  Trash2,
  ChevronDown,
  Check,
  Search,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { ExtensionStat, ScanResult } from "../types";
import { formatBytes } from "../utils/formatters";

interface SetupViewProps {
  directories: string[];
  onAddDirectory: () => void;
  onRemoveDirectory: (index: number) => void;
  selectedExtension: string | null;
  onSelectExtension: (ext: string | null) => void;
  scanResult: ScanResult | null;
  isScanning: boolean;
  scanProgressDuration: number; // duración en ms o segundos
  onStartExplore: () => void;
  errorMsg: string | null;
  onClearError: () => void;
}

export const SetupView: React.FC<SetupViewProps> = ({
  directories,
  onAddDirectory,
  onRemoveDirectory,
  selectedExtension,
  onSelectExtension,
  scanResult,
  isScanning,
  scanProgressDuration,
  onStartExplore,
  errorMsg,
  onClearError,
}) => {
  const [comboOpen, setComboOpen] = useState(false);
  const [comboSearch, setComboSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar el combo al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setComboOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const extensions: ExtensionStat[] = scanResult?.extensions || [];

  // Filtrar extensiones dentro del combobox si el usuario escribe
  const filteredExtensions = extensions.filter((item) =>
    item.extension.toLowerCase().includes(comboSearch.toLowerCase().trim())
  );

  const selectedStat = extensions.find((e) => e.extension === selectedExtension);

  return (
    <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 max-w-2xl mx-auto w-full select-none animate-fadeIn">
      {/* 1. Header / Brand */}
      <div className="text-center pt-2 pb-6">
        <div className="inline-flex items-center justify-center gap-2 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/50" />
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 font-sans">
            DotSift
          </h1>
        </div>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
          Explora y clasifica archivos en disco de forma instantánea por extensión.
        </p>
      </div>

      {/* Banner de error si existe */}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/40 flex items-center justify-between text-xs text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={onClearError}
            className="text-red-400 hover:text-red-200 font-medium cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Contenedor Principal de Configuración */}
      <div className="flex flex-col gap-6 bg-zinc-900/40 border border-zinc-800/70 rounded-2xl p-6 backdrop-blur-sm shadow-xl shadow-black/20">
        {/* Sección: Directorios (1 a 5) */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
              <Folder className="w-3.5 h-3.5 text-indigo-400" />
              <span>Directorios a escanear</span>
            </label>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                directories.length === 5
                  ? "bg-amber-950/40 text-amber-300 border-amber-800/40"
                  : "bg-zinc-800/70 text-zinc-400 border-zinc-700/60"
              }`}
            >
              {directories.length} de 5 máximo
            </span>
          </div>

          {/* Lista de carpetas agregadas */}
          <div className="flex flex-col gap-2 mb-3">
            {directories.map((dir, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-200 group hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Folder className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="font-mono text-[11px] truncate" title={dir}>
                    {dir}
                  </span>
                </div>
                <button
                  onClick={() => onRemoveDirectory(index)}
                  disabled={isScanning}
                  className="text-zinc-500 hover:text-red-400 p-1 rounded-md hover:bg-red-950/30 transition-all cursor-pointer shrink-0"
                  title="Quitar carpeta"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {directories.length === 0 && (
              <div
                onClick={onAddDirectory}
                className="border border-dashed border-zinc-800 rounded-xl p-5 text-center text-xs text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer bg-zinc-950/30"
              >
                Haz clic en &quot;Agregar carpeta&quot; para seleccionar de 1 a 5 directorios.
              </div>
            )}
          </div>

          {/* Botón para añadir carpeta */}
          {directories.length < 5 && (
            <button
              onClick={onAddDirectory}
              disabled={isScanning}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-zinc-800/80 hover:bg-zinc-700/90 text-zinc-200 border border-zinc-700/60 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Agregar carpeta</span>
            </button>
          )}
        </div>

        {/* Sección: ComboBox de Tipos de Archivo */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-xs font-semibold text-zinc-300 mb-2">
            Tipo de archivo a filtrar
          </label>

          {/* Caja principal del ComboBox */}
          <div
            onClick={() => {
              if (directories.length > 0 && !isScanning) {
                setComboOpen(!comboOpen);
              }
            }}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
              directories.length === 0
                ? "bg-zinc-950/30 border-zinc-800/50 text-zinc-600 cursor-not-allowed"
                : comboOpen
                ? "bg-zinc-950 border-indigo-500/80 text-zinc-100 ring-2 ring-indigo-500/20"
                : "bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 text-zinc-200"
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {directories.length === 0 ? (
                <span className="text-zinc-600 italic">
                  Agrega al menos una carpeta para ver los tipos...
                </span>
              ) : selectedExtension === null ? (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-200">[Todas las extensiones]</span>
                  {scanResult && (
                    <span className="text-zinc-500 text-[11px]">
                      ({scanResult.total_files.toLocaleString()} archivos • {formatBytes(scanResult.total_size_bytes)})
                    </span>
                  )}
                </div>
              ) : selectedStat ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-300">
                    .{selectedStat.extension.toUpperCase()}
                  </span>
                  <span className="text-zinc-400 text-[11px]">
                    — {selectedStat.count.toLocaleString()} archivos ({formatBytes(selectedStat.total_size_bytes)})
                  </span>
                </div>
              ) : (
                <span className="font-mono">.{selectedExtension.toUpperCase()}</span>
              )}
            </div>

            <ChevronDown
              className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${
                comboOpen ? "rotate-180" : ""
              }`}
            />
          </div>

          {/* Menú desplegable con scroll vertical */}
          {comboOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 z-40 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
              {/* Buscador interno del combobox */}
              {extensions.length > 8 && (
                <div className="p-2 border-b border-zinc-800/80 bg-zinc-900/50 flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={comboSearch}
                    onChange={(e) => setComboSearch(e.target.value)}
                    placeholder="Filtrar tipos (ej: pdf, mp3, docx)..."
                    className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
                    autoFocus
                  />
                </div>
              )}

              {/* Lista con scroll vertical */}
              <div className="max-h-56 overflow-y-auto py-1 divide-y divide-zinc-900/60">
                {/* Opción: Todas las extensiones */}
                <div
                  onClick={() => {
                    onSelectExtension(null);
                    setComboOpen(false);
                    setComboSearch("");
                  }}
                  className={`flex items-center justify-between px-3.5 py-2 text-xs hover:bg-zinc-900 cursor-pointer transition-colors ${
                    selectedExtension === null ? "bg-indigo-950/40 text-indigo-200" : "text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">[Todas las extensiones]</span>
                    {scanResult && (
                      <span className="text-[11px] text-zinc-500">
                        ({scanResult.total_files.toLocaleString()} archivos)
                      </span>
                    )}
                  </div>
                  {selectedExtension === null && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>

                {/* Opciones por cada extensión */}
                {filteredExtensions.map((item) => {
                  const isSelected = selectedExtension === item.extension;
                  return (
                    <div
                      key={item.extension}
                      onClick={() => {
                        onSelectExtension(item.extension);
                        setComboOpen(false);
                        setComboSearch("");
                      }}
                      className={`flex items-center justify-between px-3.5 py-2 text-xs hover:bg-zinc-900 cursor-pointer transition-colors ${
                        isSelected ? "bg-indigo-950/40 text-indigo-200" : "text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-zinc-200">
                          .{item.extension.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          {item.count.toLocaleString()} archivos
                        </span>
                        <span className="text-[10px] text-zinc-600">
                          ({formatBytes(item.total_size_bytes)})
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                  );
                })}

                {filteredExtensions.length === 0 && (
                  <div className="p-3 text-center text-xs text-zinc-500 italic">
                    No se encontró esa extensión
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. Barra de Carga que depende enteramente del tiempo de escaneo */}
        {isScanning && (
          <div className="flex flex-col gap-2 pt-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Analizando archivos en disco...</span>
              <span className="font-mono text-zinc-400 text-[11px]">
                {(scanProgressDuration / 1000).toFixed(1)}s
              </span>
            </div>
            {/* Barra de progreso */}
            <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-150 animate-pulse"
                style={{
                  width: `${Math.min(95, (scanProgressDuration / 1500) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* 4. Botón de Acción Principal */}
        <div className="pt-2">
          <button
            onClick={onStartExplore}
            disabled={directories.length === 0 || isScanning}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white transition-all cursor-pointer shadow-lg shadow-indigo-950/40 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Explorar archivos</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5. Footer sutil y discreto */}
      <footer className="text-center pt-6 pb-2 text-[11px] text-zinc-600 font-sans tracking-wide">
        <span>DotSift v0.1.0 • Hecho por Kened</span>
      </footer>
    </div>
  );
};
