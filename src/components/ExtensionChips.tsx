import React, { useState } from "react";
import { Headphones, Film, Image, FileText, Code2, Layers, Music } from "lucide-react";
import { ExtensionStat } from "../types";
import { formatBytes, getCategoryBadge } from "../utils/formatters";

interface ExtensionChipsProps {
  extensions: ExtensionStat[];
  selectedExtension: string | null;
  onSelectExtension: (ext: string | null) => void;
  totalFiles: number;
}

export const ExtensionChips: React.FC<ExtensionChipsProps> = ({
  extensions,
  selectedExtension,
  onSelectExtension,
  totalFiles,
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");

  const categories = [
    { id: "all", label: "Todas", icon: Layers },
    { id: "audio", label: "Audio", icon: Headphones },
    { id: "video", label: "Video", icon: Film },
    { id: "image", label: "Imágenes", icon: Image },
    { id: "document", label: "Documentos", icon: FileText },
    { id: "code", label: "Código", icon: Code2 },
  ];

  const filteredExtensions =
    activeCategoryFilter === "all"
      ? extensions
      : extensions.filter((item) => item.category === activeCategoryFilter);

  return (
    <div className="bg-zinc-950 border-b border-zinc-800/60 px-5 py-3 flex flex-col gap-2.5">
      {/* Category Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : "text-zinc-500"}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <span className="text-[11px] text-zinc-500 hidden sm:inline">
          {filteredExtensions.length} tipos de archivo
        </span>
      </div>

      {/* Extension Chips Carousel / Flex-wrap */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
        {/* 'Todos' Chip */}
        <button
          onClick={() => onSelectExtension(null)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            selectedExtension === null
              ? "bg-zinc-100 text-zinc-900 border-zinc-100 shadow-md ring-2 ring-zinc-400/50"
              : "bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-200"
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Todos los archivos</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
              selectedExtension === null ? "bg-zinc-300 text-zinc-900" : "bg-zinc-800 text-zinc-300"
            }`}
          >
            {totalFiles.toLocaleString()}
          </span>
        </button>

        {/* Extensions Chips */}
        {filteredExtensions.map((item) => {
          const isSelected = selectedExtension === item.extension;
          const badge = getCategoryBadge(item.extension, item.category);

          return (
            <button
              key={item.extension}
              onClick={() => onSelectExtension(item.extension)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer whitespace-nowrap shrink-0 group ${
                isSelected ? badge.active : badge.bg
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : badge.dot}`} />
              <span className="font-semibold tracking-wider font-mono">{badge.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  isSelected ? "bg-black/20 text-white" : "bg-zinc-800/80 text-zinc-300 group-hover:bg-zinc-700"
                }`}
              >
                {item.count.toLocaleString()}
              </span>
              <span
                className={`text-[10px] ${
                  isSelected ? "text-white/80" : "text-zinc-500"
                }`}
              >
                {formatBytes(item.total_size_bytes)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
