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
  scanProgressDuration: number;
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

  const filteredExtensions = extensions.filter((item) =>
    item.extension.toLowerCase().includes(comboSearch.toLowerCase().trim())
  );

  const selectedStat = extensions.find((e) => e.extension === selectedExtension);

  return (
    <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 max-w-2xl mx-auto w-full select-none">
      {/* 1. Header / Hero con tipografía Oracle Serif y regla de oro (40x4px) */}
      <div className="text-center pt-3 pb-8">
        <h1 className="text-4xl font-normal font-serif-oracle text-[#161513] tracking-normal mb-3">
          DotSift
        </h1>
        {/* Oracle Eyebrow Rule: 40 × 4px Accent Gold ornament */}
        <div className="w-[40px] h-[4px] bg-[#f0cc71] mx-auto mb-4" />
        <p className="text-sm font-sans-oracle text-[#161513]/80 max-w-md mx-auto leading-relaxed">
          Explora y clasifica archivos en disco de forma instantánea por tipo de extensión.
        </p>
      </div>

      {/* Banner de error */}
      {errorMsg && (
        <div className="mb-4 p-3.5 rounded-[6px] bg-[#fbf9f8] border border-[#d63b25] flex items-center justify-between text-xs text-[#d63b25]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-sans-oracle font-medium">{errorMsg}</span>
          </div>
          <button
            onClick={onClearError}
            className="text-[#d63b25] hover:opacity-75 font-semibold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Contenedor Principal (Product-card chrome: Canvas blanco, 1px hairline, 8px radius, NO SHADOWS) */}
      <div className="bg-[#ffffff] border border-[#e4e1dd] rounded-[8px] p-7 flex flex-col gap-6">
        {/* Sección: Directorios */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-[#161513] uppercase tracking-wider flex items-center gap-2 font-sans-oracle">
              <Folder className="w-3.5 h-3.5 text-[#312d2a]" />
              <span>Directorios a escanear</span>
            </label>
            <span
              className={`text-[11px] font-sans-oracle font-medium px-2 py-0.5 rounded-[4px] border ${
                directories.length === 5
                  ? "bg-[#f5f4f2] text-[#312d2a] border-[#d4cfca]"
                  : "bg-[#fbf9f8] text-[#161513]/70 border-[#e4e1dd]"
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
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-[6px] bg-[#fbf9f8] border border-[#e4e1dd] text-xs text-[#161513] group hover:border-[#d4cfca] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Folder className="w-4 h-4 text-[#312d2a]/70 shrink-0" />
                  <span className="font-mono-oracle text-[11px] truncate text-[#161513]" title={dir}>
                    {dir}
                  </span>
                </div>
                <button
                  onClick={() => onRemoveDirectory(index)}
                  disabled={isScanning}
                  className="text-[#aea8a2] hover:text-[#d63b25] p-1 rounded-[4px] hover:bg-[#f5f4f2] transition-colors cursor-pointer shrink-0"
                  title="Quitar carpeta"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {directories.length === 0 && (
              <div
                onClick={onAddDirectory}
                className="border border-dashed border-[#d4cfca] rounded-[6px] p-5 text-center text-xs text-[#161513]/60 hover:border-[#312d2a] hover:text-[#161513] transition-colors cursor-pointer bg-[#fbf9f8]"
              >
                Haz clic en &quot;Agregar carpeta&quot; para seleccionar de 1 a 5 directorios.
              </div>
            )}
          </div>

          {/* Botón secundario Oracle (button-secondary: borde #161513, texto #161513, rounded 4px) */}
          {directories.length < 5 && (
            <button
              onClick={onAddDirectory}
              disabled={isScanning}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] text-xs font-medium text-[#161513] border border-[#161513] hover:bg-[#f5f4f2] transition-colors cursor-pointer disabled:opacity-40"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Agregar carpeta</span>
            </button>
          )}
        </div>

        {/* Sección: ComboBox de Tipos de Archivo */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-xs font-bold text-[#161513] uppercase tracking-wider mb-2 font-sans-oracle">
            Tipo de archivo a filtrar
          </label>

          {/* Trigger (text-input: Canvas blanco, 1px field-border, 6px radius, padding 12px 18px) */}
          <div
            onClick={() => {
              if (directories.length > 0 && !isScanning) {
                setComboOpen(!comboOpen);
              }
            }}
            className={`flex items-center justify-between px-4 py-2.5 rounded-[6px] border text-xs cursor-pointer transition-colors ${
              directories.length === 0
                ? "bg-[#fbf9f8] border-[#e4e1dd] text-[#aea8a2] cursor-not-allowed"
                : comboOpen
                ? "bg-[#ffffff] border-[#312d2a] text-[#161513]"
                : "bg-[#ffffff] border-[#d4cfca] hover:border-[#312d2a] text-[#161513]"
            }`}
          >
            <div className="flex items-center gap-2 truncate font-sans-oracle">
              {directories.length === 0 ? (
                <span className="text-[#aea8a2] italic">
                  Agrega al menos una carpeta para ver los tipos...
                </span>
              ) : selectedExtension === null ? (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#161513]">[Todas las extensiones]</span>
                  {scanResult && (
                    <span className="text-[#767069] text-[11px] font-mono-oracle">
                      ({scanResult.total_files.toLocaleString()} archivos • {formatBytes(scanResult.total_size_bytes)})
                    </span>
                  )}
                </div>
              ) : selectedStat ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono-oracle font-bold text-[#006b8f]">
                    .{selectedStat.extension.toUpperCase()}
                  </span>
                  <span className="text-[#161513]/70 text-[11px]">
                    — {selectedStat.count.toLocaleString()} archivos ({formatBytes(selectedStat.total_size_bytes)})
                  </span>
                </div>
              ) : (
                <span className="font-mono-oracle">.{selectedExtension.toUpperCase()}</span>
              )}
            </div>

            <ChevronDown
              className={`w-4 h-4 text-[#312d2a] shrink-0 transition-transform ${
                comboOpen ? "rotate-180" : ""
              }`}
            />
          </div>

          {/* Menú desplegable (Canvas blanco, 1px hairline border, NO SHADOWS, divide hairline) */}
          {comboOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-[#ffffff] border border-[#e4e1dd] rounded-[6px] overflow-hidden">
              {/* Buscador interno si hay muchas opciones */}
              {extensions.length > 8 && (
                <div className="p-2.5 border-b border-[#e9e7e4] bg-[#fbf9f8] flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-[#aea8a2]" />
                  <input
                    type="text"
                    value={comboSearch}
                    onChange={(e) => setComboSearch(e.target.value)}
                    placeholder="Filtrar tipos (ej: pdf, mp3, docx)..."
                    className="w-full bg-transparent text-xs text-[#161513] placeholder-[#aea8a2] focus:outline-none font-sans-oracle"
                    autoFocus
                  />
                </div>
              )}

              {/* Lista con scroll vertical */}
              <div className="max-h-56 overflow-y-auto py-1 divide-y divide-[#e9e7e4]">
                {/* Opción: Todas las extensiones */}
                <div
                  onClick={() => {
                    onSelectExtension(null);
                    setComboOpen(false);
                    setComboSearch("");
                  }}
                  className={`flex items-center justify-between px-4 py-2.5 text-xs hover:bg-[#f5f4f2] cursor-pointer transition-colors ${
                    selectedExtension === null ? "bg-[#f1efed] font-semibold text-[#161513]" : "text-[#161513]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>[Todas las extensiones]</span>
                    {scanResult && (
                      <span className="text-[11px] text-[#767069] font-mono-oracle">
                        ({scanResult.total_files.toLocaleString()} archivos)
                      </span>
                    )}
                  </div>
                  {selectedExtension === null && <Check className="w-3.5 h-3.5 text-[#312d2a]" />}
                </div>

                {/* Opciones por extensión */}
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
                      className={`flex items-center justify-between px-4 py-2.5 text-xs hover:bg-[#f5f4f2] cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f1efed] text-[#161513]" : "text-[#161513]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono-oracle font-bold text-[#161513]">
                          .{item.extension.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-[#767069] font-sans-oracle">
                          {item.count.toLocaleString()} archivos
                        </span>
                        <span className="text-[10px] text-[#aea8a2] font-mono-oracle">
                          ({formatBytes(item.total_size_bytes)})
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#312d2a]" />}
                    </div>
                  );
                })}

                {filteredExtensions.length === 0 && (
                  <div className="p-3.5 text-center text-xs text-[#aea8a2] italic font-sans-oracle">
                    No se encontró esa extensión
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. Barra de Carga que depende de la duración del escaneo */}
        {isScanning && (
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center justify-between text-xs font-sans-oracle text-[#767069]">
              <span>Analizando archivos en disco...</span>
              <span className="font-mono-oracle text-[11px] text-[#161513]">
                {(scanProgressDuration / 1000).toFixed(1)}s
              </span>
            </div>
            {/* Barra de progreso sobria (track canvas-warm, fill action-charcoal) */}
            <div className="w-full h-1.5 bg-[#f1efed] border border-[#e4e1dd] rounded-none overflow-hidden">
              <div
                className="h-full bg-[#312d2a] transition-all duration-150"
                style={{
                  width: `${Math.min(96, (scanProgressDuration / 1200) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* 4. Botón Primario Oracle (button-primary: fill #312d2a, texto #ffffff, rounded 4px, padding 10px 16px) */}
        <div className="pt-2">
          <button
            onClick={onStartExplore}
            disabled={directories.length === 0 || isScanning}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-[4px] text-sm font-medium bg-[#312d2a] hover:bg-[#47423e] active:bg-[#211e1c] text-[#ffffff] transition-colors cursor-pointer disabled:bg-[#f5f4f2] disabled:text-[#aea8a2] disabled:border disabled:border-[#e4e1dd] disabled:cursor-not-allowed font-sans-oracle"
          >
            <span>Explorar archivos</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5. Footer (Caption style: typography.caption, disabled-ink #aea8a2) */}
      <footer className="text-center pt-8 pb-3 text-xs text-[#aea8a2] font-sans-oracle">
        <span>DotSift v0.1.0 • Hecho por Kened</span>
      </footer>
    </div>
  );
};
