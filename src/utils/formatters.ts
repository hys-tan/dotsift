export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(dm))} ${sizes[idx]}`;
}

export function formatDate(timestampSec: number): string {
  if (!timestampSec) return "-";
  const date = new Date(timestampSec * 1000);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getCategoryBadge(ext: string, category: string) {
  const e = ext.toLowerCase();

  if (category === "audio" || ["mp3", "flac", "wav", "aac", "ogg", "m4a", "alac"].includes(e)) {
    if (e === "flac") {
      return {
        bg: "bg-purple-950/40 border-purple-800/40 text-purple-300 hover:border-purple-600/60",
        active: "bg-purple-600 text-white shadow-lg shadow-purple-900/30 ring-2 ring-purple-400",
        dot: "bg-purple-400",
        label: "FLAC",
      };
    }
    if (e === "mp3") {
      return {
        bg: "bg-blue-950/40 border-blue-800/40 text-blue-300 hover:border-blue-600/60",
        active: "bg-blue-600 text-white shadow-lg shadow-blue-900/30 ring-2 ring-blue-400",
        dot: "bg-blue-400",
        label: "MP3",
      };
    }
    if (e === "wav") {
      return {
        bg: "bg-cyan-950/40 border-cyan-800/40 text-cyan-300 hover:border-cyan-600/60",
        active: "bg-cyan-600 text-white shadow-lg shadow-cyan-900/30 ring-2 ring-cyan-400",
        dot: "bg-cyan-400",
        label: "WAV",
      };
    }
    return {
      bg: "bg-violet-950/40 border-violet-800/40 text-violet-300 hover:border-violet-600/60",
      active: "bg-violet-600 text-white shadow-lg shadow-violet-900/30 ring-2 ring-violet-400",
      dot: "bg-violet-400",
      label: ext.toUpperCase(),
    };
  }

  if (category === "video") {
    return {
      bg: "bg-rose-950/40 border-rose-800/40 text-rose-300 hover:border-rose-600/60",
      active: "bg-rose-600 text-white shadow-lg shadow-rose-900/30 ring-2 ring-rose-400",
      dot: "bg-rose-400",
      label: ext.toUpperCase(),
    };
  }

  if (category === "image") {
    return {
      bg: "bg-emerald-950/40 border-emerald-800/40 text-emerald-300 hover:border-emerald-600/60",
      active: "bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 ring-2 ring-emerald-400",
      dot: "bg-emerald-400",
      label: ext.toUpperCase(),
    };
  }

  if (category === "document") {
    return {
      bg: "bg-amber-950/40 border-amber-800/40 text-amber-300 hover:border-amber-600/60",
      active: "bg-amber-600 text-white shadow-lg shadow-amber-900/30 ring-2 ring-amber-400",
      dot: "bg-amber-400",
      label: ext.toUpperCase(),
    };
  }

  if (category === "code") {
    return {
      bg: "bg-indigo-950/40 border-indigo-800/40 text-indigo-300 hover:border-indigo-600/60",
      active: "bg-indigo-600 text-white shadow-lg shadow-indigo-900/30 ring-2 ring-indigo-400",
      dot: "bg-indigo-400",
      label: ext.toUpperCase(),
    };
  }

  return {
    bg: "bg-zinc-900/50 border-zinc-800/60 text-zinc-300 hover:border-zinc-700",
    active: "bg-zinc-700 text-white shadow-lg shadow-zinc-900/40 ring-2 ring-zinc-500",
    dot: "bg-zinc-400",
    label: ext === "[sin extensión]" ? "Sin ext." : ext.toUpperCase(),
  };
}
