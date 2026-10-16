import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { SetupView } from "./components/SetupView";
import { SearchBar } from "./components/SearchBar";
import { FileListTable } from "./components/FileListTable";
import { FileItem, ScanResult, SortField, SortOrder } from "./types";
import { ArrowLeft } from "lucide-react";
import "./App.css";

export function App() {
  const [currentView, setCurrentView] = useState<"setup" | "results">("setup");

  // Estado de directorios (hasta 5)
  const [directories, setDirectories] = useState<string[]>([]);
  const directoriesRef = useRef<string[]>([]);
  directoriesRef.current = directories;

  const [selectedExtension, setSelectedExtension] = useState<string | null>(null);

  // Escaneo y resultados
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgressDuration, setScanProgressDuration] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // Archivos cargados para la vista de resultados
  const [loadedFiles, setLoadedFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const scanTimerRef = useRef<number | null>(null);

  // Función de escaneo
  const executeScan = useCallback(async (pathsToScan: string[]): Promise<ScanResult | null> => {
    if (pathsToScan.length === 0) {
      setScanResult(null);
      setLoadedFiles([]);
      return null;
    }

    try {
      setIsScanning(true);
      setErrorMsg(null);
      setScanProgressDuration(0);

      const startTime = Date.now();
      scanTimerRef.current = window.setInterval(() => {
        setScanProgressDuration(Date.now() - startTime);
      }, 50);

      const result = await invoke<ScanResult>("scan_directories", { paths: pathsToScan });
      setScanResult(result);
      return result;
    } catch (err: unknown) {
      console.error("Error al escanear directorios:", err);
      setErrorMsg(typeof err === "string" ? err : "Error al procesar las carpetas.");
      return null;
    } finally {
      if (scanTimerRef.current) {
        clearInterval(scanTimerRef.current);
        scanTimerRef.current = null;
      }
      setIsScanning(false);
    }
  }, []);

  const executeScanRef = useRef(executeScan);
  executeScanRef.current = executeScan;

  // Agregar carpetas mediante explorador de archivos nativo (acumular hasta 5)
  const handleAddDirectory = async () => {
    const current = directoriesRef.current;
    if (current.length >= 5) return;

    try {
      const selected = await open({
        directory: true,
        multiple: true,
        title: "Seleccionar Carpeta para DotSift",
      });

      if (selected) {
        const selectedList = (Array.isArray(selected) ? selected : [selected]).filter(
          (s): s is string => typeof s === "string"
        );
        const existing = new Set(directoriesRef.current);
        const toAdd = selectedList.filter((p) => !existing.has(p));
        if (toAdd.length === 0) return;

        const availableSlots = 5 - directoriesRef.current.length;
        const added = toAdd.slice(0, availableSlots);
        const updated = [...directoriesRef.current, ...added];
        directoriesRef.current = updated;
        setDirectories(updated);
        await executeScanRef.current(updated);
      }
    } catch (err) {
      console.error("Error al abrir diálogo de selección:", err);
    }
  };

  // Quitar una carpeta
  const handleRemoveDirectory = async (index: number) => {
    const updated = directoriesRef.current.filter((_, i) => i !== index);
    directoriesRef.current = updated;
    setDirectories(updated);
    if (updated.length > 0) {
      await executeScanRef.current(updated);
    } else {
      setScanResult(null);
      setLoadedFiles([]);
    }
  };

  // Manejar carpetas soltadas mediante Drag & Drop (acumular hasta 5)
  const handleDropDirectories = useCallback(async (newPaths: string[]) => {
    const current = directoriesRef.current;
    if (current.length >= 5) return;
    const existing = new Set(current);
    const toAdd = newPaths.filter((p) => !existing.has(p));
    if (toAdd.length === 0) return;

    const availableSlots = 5 - current.length;
    const added = toAdd.slice(0, availableSlots);
    const updated = [...current, ...added];
    directoriesRef.current = updated;
    setDirectories(updated);
    await executeScanRef.current(updated);
  }, []);

  // Escuchar eventos nativos de Drag & Drop de Tauri v2
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    let isCancelled = false;

    getCurrentWebview()
      .onDragDropEvent((event) => {
        if (event.payload.type === "enter" || event.payload.type === "over") {
          setIsDraggingOver(true);
        } else if (event.payload.type === "leave") {
          setIsDraggingOver(false);
        } else if (event.payload.type === "drop") {
          setIsDraggingOver(false);
          const paths = event.payload.paths;
          if (paths && paths.length > 0) {
            handleDropDirectories(paths);
          }
        }
      })
      .then((fn) => {
        if (isCancelled) {
          fn();
        } else {
          unlisten = fn;
        }
      })
      .catch((err) => {
        console.warn("Error vinculando onDragDropEvent:", err);
      });

    return () => {
      isCancelled = true;
      if (unlisten) unlisten();
    };
  }, [handleDropDirectories]);

  // Iniciar la exploración (cambiar a Vista 2)
  const handleStartExplore = async () => {
    if (directories.length === 0) return;

    // Si aún no se ha escaneado, se escanea
    if (!scanResult) {
      await executeScan(directories);
    }

    try {
      const files = await invoke<FileItem[]>("get_filtered_files", {
        extension: selectedExtension,
        searchQuery: null,
      });
      setLoadedFiles(files);
      // Cambio instantáneo de vista tras completar el escaneo
      setCurrentView("results");
    } catch (err) {
      console.error("Error al cargar archivos:", err);
    }
  };

  // Consultar archivos al cambiar de extensión en la Vista 2
  useEffect(() => {
    if (currentView !== "results" || directories.length === 0) return;

    let isMounted = true;
    const fetchFiles = async () => {
      try {
        const files = await invoke<FileItem[]>("get_filtered_files", {
          extension: selectedExtension,
          searchQuery: null,
        });
        if (isMounted) {
          setLoadedFiles(files);
        }
      } catch (err) {
        console.error("Error al obtener archivos por extensión:", err);
      }
    };

    fetchFiles();
    return () => {
      isMounted = false;
    };
  }, [selectedExtension, currentView, directories]);

  // Filtrado y ordenamiento en cliente para Vista 2
  const sortedAndFilteredFiles = loadedFiles
    .filter((f) =>
      searchQuery.trim() ? f.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) : true
    )
    .sort((a, b) => {
      if (sortField === "name") {
        const cmp = a.name.localeCompare(b.name, undefined, { numeric: true });
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

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder(field === "size" || field === "date" ? "desc" : "asc");
    }
  };

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
    <div className="flex flex-col h-screen w-screen bg-[#fbf9f8] text-[#161513] overflow-hidden font-sans-oracle select-none">
      {/* VISTA 1: Pantalla de Configuración Inicial */}
      {currentView === "setup" && (
        <SetupView
          directories={directories}
          onAddDirectory={handleAddDirectory}
          onRemoveDirectory={handleRemoveDirectory}
          selectedExtension={selectedExtension}
          onSelectExtension={setSelectedExtension}
          scanResult={scanResult}
          isScanning={isScanning}
          scanProgressDuration={scanProgressDuration}
          onStartExplore={handleStartExplore}
          errorMsg={errorMsg}
          onClearError={() => setErrorMsg(null)}
          isDraggingOver={isDraggingOver}
        />
      )}

      {/* VISTA 2: Pantalla de Contenido y Exploración */}
      {currentView === "results" && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Barra superior de Vista 2 (Oracle masthead/subnav style) */}
          <div className="border-b border-[#e4e1dd] bg-[#ffffff] px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView("setup")}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[4px] text-xs font-medium text-[#161513] border border-[#161513] hover:bg-[#f5f4f2] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a DotSift</span>
              </button>

              <div className="h-4 w-[1px] bg-[#e4e1dd]" />

              <div className="flex items-center gap-2 text-xs text-[#767069]">
                <span className="font-sans-oracle">
                  {directories.length} {directories.length === 1 ? "carpeta" : "carpetas"} analizadas
                </span>
                {selectedExtension && (
                  <span className="font-mono-oracle text-[#006b8f] font-semibold">
                    (Tipo: .{selectedExtension.toUpperCase()})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Barra de búsqueda */}
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

          {/* Tabla de archivos */}
          <FileListTable
            files={sortedAndFilteredFiles}
            searchQuery={searchQuery}
            isScanning={false}
            hasRootSelected={directories.length > 0}
            onOpenFile={handleOpenFile}
            onOpenFolder={handleOpenFolder}
            onSelectDirectory={handleAddDirectory}
          />
        </div>
      )}
    </div>
  );
}

export default App;
