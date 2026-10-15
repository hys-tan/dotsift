import { Search, X, ArrowUp, ArrowDown } from "lucide-react";
import { SortField, SortOrder } from "../types";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredCount: number;
  totalInExtension: number;
  selectedExtension: string | null;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  filteredCount,
  totalInExtension,
  selectedExtension,
  sortField,
  sortOrder,
  onSortChange,
}) => {
  return (
    <div className="bg-zinc-950/60 backdrop-blur-md px-5 py-2.5 border-b border-zinc-800/60 flex flex-wrap items-center justify-between gap-3">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[240px] max-w-md">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={
            selectedExtension
              ? `Buscar en .${selectedExtension}... (título, artista, nombre)`
              : "Buscar en todos los archivos escaneados..."
          }
          className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg pl-9 pr-8 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 p-0.5 cursor-pointer"
            title="Limpiar búsqueda"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Sorting & Counter */}
      <div className="flex items-center gap-3 text-xs">
        {/* Results Counter */}
        <span className="text-zinc-400 text-[11px]">
          Mostrando{" "}
          <strong className="text-zinc-100 font-semibold">{filteredCount.toLocaleString()}</strong> de{" "}
          <span className="text-zinc-500">{totalInExtension.toLocaleString()}</span>
        </span>

        {/* Sort Buttons */}
        <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
          <button
            onClick={() => onSortChange("name")}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              sortField === "name"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>Nombre</span>
            {sortField === "name" &&
              (sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />)}
          </button>

          <button
            onClick={() => onSortChange("size")}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              sortField === "size"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>Tamaño</span>
            {sortField === "size" &&
              (sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />)}
          </button>

          <button
            onClick={() => onSortChange("date")}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              sortField === "date"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>Fecha</span>
            {sortField === "date" &&
              (sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />)}
          </button>
        </div>
      </div>
    </div>
  );
};
