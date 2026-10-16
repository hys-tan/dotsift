import React from "react";
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
    <div className="bg-[#ffffff] px-6 py-3 border-b border-[#e4e1dd] flex flex-wrap items-center justify-between gap-4 select-none font-sans-oracle">
      {/* Search Input (Oracle text-input styling: 1px field-border #d4cfca, 6px radius) */}
      <div className="relative flex-1 min-w-[260px] max-w-md">
        <Search className="w-4 h-4 text-[#aea8a2] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={
            selectedExtension
              ? `Buscar en .${selectedExtension}... (nombre o ruta)`
              : "Buscar en todos los archivos..."
          }
          className="w-full bg-[#ffffff] border border-[#d4cfca] focus:border-[#312d2a] rounded-[6px] pl-10 pr-8 py-2 text-xs text-[#161513] placeholder-[#aea8a2] focus:outline-none transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#aea8a2] hover:text-[#161513] p-1 cursor-pointer"
            title="Limpiar búsqueda"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Sorting & Counter */}
      <div className="flex items-center gap-4 text-xs">
        {/* Results Counter */}
        <span className="text-[#767069] text-xs">
          Mostrando{" "}
          <strong className="text-[#161513] font-semibold">{filteredCount.toLocaleString()}</strong> de{" "}
          <span className="font-mono-oracle">{totalInExtension.toLocaleString()}</span>
        </span>

        {/* Sort Controls (Oracle style: rounded 4px, neutral ladder) */}
        <div className="flex items-center gap-1 bg-[#f5f4f2] p-1 rounded-[4px] border border-[#e4e1dd]">
          <button
            onClick={() => onSortChange("name")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
              sortField === "name"
                ? "bg-[#312d2a] text-[#ffffff]"
                : "text-[#161513] hover:bg-[#e9e7e4]"
            }`}
          >
            <span>Nombre</span>
            {sortField === "name" &&
              (sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-[#f0cc71]" /> : <ArrowDown className="w-3 h-3 text-[#f0cc71]" />)}
          </button>

          <button
            onClick={() => onSortChange("size")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
              sortField === "size"
                ? "bg-[#312d2a] text-[#ffffff]"
                : "text-[#161513] hover:bg-[#e9e7e4]"
            }`}
          >
            <span>Tamaño</span>
            {sortField === "size" &&
              (sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-[#f0cc71]" /> : <ArrowDown className="w-3 h-3 text-[#f0cc71]" />)}
          </button>

          <button
            onClick={() => onSortChange("date")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
              sortField === "date"
                ? "bg-[#312d2a] text-[#ffffff]"
                : "text-[#161513] hover:bg-[#e9e7e4]"
            }`}
          >
            <span>Fecha</span>
            {sortField === "date" &&
              (sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-[#f0cc71]" /> : <ArrowDown className="w-3 h-3 text-[#f0cc71]" />)}
          </button>
        </div>
      </div>
    </div>
  );
};
