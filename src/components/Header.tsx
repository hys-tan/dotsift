import React from "react";
import { FolderOpen, RefreshCw, XCircle, HardDrive, Clock, Files, Music2, Copy, Check } from "lucide-react";
import { ScanResult } from "../types";
import { formatBytes } from "../utils/formatters";

interface HeaderProps {
  currentPath: string | null;
  scanResult: ScanResult | null;
  isScanning: boolean;
  onSelectDirectory: () => void;
  onRescan: () => void;
  onCancelScan: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  scanResult,
  isScanning,
  onSelectDirectory,
  onRescan,
  onCancelScan,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyPath = () => {
    if (!currentPath) return;
    navigator.clipboard.writeText(currentPath);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl px-5 py-3 sticky top-0 z-30 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-[1px] shadow-lg shadow-indigo-950/50">
            <div className="w-full h-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
              <Music2 className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-wide text-zinc-100">Audio & File Explorer</h1>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Indexación $O(1)$ y filtrado reactivo en memoria</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isScanning ? (
            <button
              onClick={onCancelScan}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-950/60 text-red-300 border border-red-800/60 hover:bg-red-900/50 transition-all cursor-pointer shadow-sm"
              title="Cancelar el escaneo actual"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancelar
            </button>
          ) : (
            currentPath && (
              <button
                onClick={onRescan}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer shadow-sm"
                title="Volver a escanear este directorio"
              >
                <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
                Re-escanear
              </button>
            )
          )}

          <button
            onClick={onSelectDirectory}
            disabled={isScanning}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 transition-all cursor-pointer shadow-md shadow-indigo-950/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>{currentPath ? "Cambiar Carpeta" : "Seleccionar Carpeta"}</span>
          </button>
        </div>
      </div>

      {/* Path Breadcrumb & Metrics Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-900 text-xs">
        {/* Directory indicator */}
        <div className="flex items-center gap-2 min-w-0 max-w-xl">
          <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Ruta:</span>
          {currentPath ? (
            <div className="flex items-center gap-1.5 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800/80 text-zinc-300 min-w-0">
              <span className="truncate font-mono text-[11px]" title={currentPath}>
                {currentPath}
              </span>
              <button
                onClick={handleCopyPath}
                className="text-zinc-500 hover:text-zinc-200 transition-colors p-0.5"
                title="Copiar ruta"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          ) : (
            <span className="text-zinc-500 italic text-[11px]">Ninguna carpeta seleccionada</span>
          )}
        </div>

        {/* Scan Metrics */}
        {scanResult && (
          <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
            <div className="flex items-center gap-1 bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-800/50">
              <Files className="w-3 h-3 text-indigo-400" />
              <span className="font-semibold text-zinc-200">{scanResult.total_files.toLocaleString()}</span>
              <span className="text-zinc-500">archivos</span>
            </div>
            <div className="flex items-center gap-1 bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-800/50">
              <HardDrive className="w-3 h-3 text-cyan-400" />
              <span className="font-semibold text-zinc-200">{formatBytes(scanResult.total_size_bytes)}</span>
            </div>
            <div className="flex items-center gap-1 bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-800/50">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span className="font-semibold text-zinc-200">{scanResult.duration_ms}</span>
              <span className="text-zinc-500">ms</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
