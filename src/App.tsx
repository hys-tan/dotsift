import { useState, useEffect, useMemo, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Header } from "./components/Header";
import { ExtensionChips } from "./components/ExtensionChips";
import { SearchBar } from "./components/SearchBar";
import { FileListTable } from "./components/FileListTable";
import { FileItem, ScanResult, SortField, SortOrder } from "./types";
import { AlertCircle } from "lucide-react";

export function App() {
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtros y ordenamiento
  const [selectedExtension, setSelectedExtension] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Lista de archivos cargados desde Rust para la extensión actual
  const [loadedFiles, setLoadedFiles] = useState<FileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);

  // Escanear un directorio dado
  const startScan = useCallback(async (path: string) => {
    try {
      setIsScanning(true);
      setErrorMsg(null);
      setCurrentPath(path);
      setSelectedExtension(null);
      setSearchQuery("");

      const result = await invoke<ScanResult>("scan_directory", { path });
      setScanResult(result);

      // Cargar lista inicial
      setIsLoadingFiles(true);
      const files = await invoke<FileItem[]>("get_filtered_files", {
        extension: null,
        searchQuery: null,
      });
      setLoadedFiles(files);
    } catch (err: unknown) {
      console.error("Error al escanear directorio:", err);
      setErrorMsg(typeof err === "string" ? err : "Ocurrió un error al escanear la carpeta.");
    } finally {
      setIsScanning(false);
      setIsLoadingFiles(false);
    }
  }, []);

  // Seleccionar carpeta mediante diálogo nativo de Windows
  const handleSelectDirectory = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Seleccionar Carpeta para Escanear",
      });

      if (selected && typeof selected === "string") {
        await startScan(selected);
      }
    } catch (err) {
      console.error("Error al abrir diálogo de selección:", err);
    }
  };

  // Re-escanear directorio actual
  const handleRescan = () => {
    if (currentPath) {
      startScan(currentPath);
    }
  };

  // Cancelar escaneo
  const handleCancelScan = async () => {
    try {
      await invoke("cancel_scan");
      setIsScanning(false);
    } catch (err) {
      console.error("Error al cancelar escaneo:", err);
    }
  };

  // Consultar archivos en memoria en Rust cuando cambia la extensión seleccionada
  useEffect(() => {
    if (!currentPath || isScanning) return;

    let isMounted = true;
    const fetchExtensionFiles = async () => {
      try {
        setIsLoadingFiles(true);
        const files = await invoke<FileItem[]>("get_filtered_files", {
          extension: selectedExtension,
          searchQuery: null,
        });
        if (isMounted) {
          setLoadedFiles(files);
        }
      } catch (err) {
        console.error("Error al obtener archivos por extensión:", err);
      } finally {
        if (isMounted) setIsLoadingFiles(false);
      }
    };

    fetchExtensionFiles();

    return () => {
      isMounted = false;
    };
  }, [selectedExtension, currentPath, isScanning]);

  // Filtrado y ordenamiento reactivo en memoria (cliente)
  const sortedAndFilteredFiles = useMemo(() => {
    let result = loadedFiles;

    // Filtro por texto en el cliente para latencia instantánea
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((file) => file.name.toLowerCase().includes(q));
    }

    // Ordenamiento
    const sorted = [...result].sort((a, b) => {
      if (sortField === "name") {
        const cmp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
        return sortOrder === "asc" ? cmp : -cmp;
      }
      if (sortField === "size") {
        return sortOrder === "asc" ? a.size_bytes - b.size_bytes : b.size_bytes - a.size_bytes;
      }
      if (sortField === "date") {
        return sortOrder === "asc"
          ? a.modified_timestamp - b.modified_timestamp
          : b.modified_timestamp - a.modified_timestamp;
      }
      return 0;
    });

    return sorted;
  }, [loadedFiles, searchQuery, sortField, sortOrder]);

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder(field === "size" || field === "date" ? "desc" : "asc");
    }
  };

  // Acciones sobre archivos del sistema operativo
  const handleOpenFile = async (path: string) => {
    try {
      await invoke("open_file_default", { path });
    } catch (err) {
      console.error("Error al abrir archivo:", err);
    }
  };

  const handleOpenFolder = async (path: string) => {
    try {
      await invoke("open_containing_folder", { path });
    } catch (err) {
      console.error("Error al abrir carpeta en el explorador:", err);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans select-none">
      {/* Header superior */}
      <Header
        currentPath={currentPath}
        scanResult={scanResult}
        isScanning={isScanning}
        onSelectDirectory={handleSelectDirectory}
        onRescan={handleRescan}
        onCancelScan={handleCancelScan}
      />

      {/* Banner de error si ocurre alguno */}
      {errorMsg && (
        <div className="bg-red-950/80 border-b border-red-800/80 px-5 py-2.5 flex items-center justify-between text-xs text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-red-400 hover:text-red-100 font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Chips de Extensiones (solo visible tras escanear) */}
      {scanResult && (
        <ExtensionChips
          extensions={scanResult.extensions}
          selectedExtension={selectedExtension}
          onSelectExtension={setSelectedExtension}
          totalFiles={scanResult.total_files}
        />
      )}

      {/* Barra de Búsqueda reactiva (solo si hay carpeta cargada) */}
      {scanResult && (
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filteredCount={sortedAndFilteredFiles.length}
          totalInExtension={loadedFiles.length}
          selectedExtension={selectedExtension}
          sortField={sortField}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />
      )}

      {/* Tabla Virtualizada */}
      <FileListTable
        files={sortedAndFilteredFiles}
        searchQuery={searchQuery}
        isScanning={isScanning || isLoadingFiles}
        hasRootSelected={currentPath !== null}
        onOpenFile={handleOpenFile}
        onOpenFolder={handleOpenFolder}
        onSelectDirectory={handleSelectDirectory}
      />
    </div>
  );
}

export default App;
