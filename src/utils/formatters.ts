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

// Oracle Design Language Badge styling (warm neutral ladder + subtle accents)
export function getCategoryBadge(ext: string, category: string) {
  const e = ext.toLowerCase();

  if (category === "audio" || ["mp3", "flac", "wav", "aac", "ogg", "m4a", "alac"].includes(e)) {
    return {
      bg: "bg-[#f5f4f2] border-[#e4e1dd] text-[#161513]",
      active: "bg-[#312d2a] text-[#ffffff] border-[#312d2a]",
      dot: "bg-[#006b8f]", // Teal accent
      label: ext.toUpperCase(),
    };
  }

  if (category === "document") {
    return {
      bg: "bg-[#f5f4f2] border-[#e4e1dd] text-[#161513]",
      active: "bg-[#312d2a] text-[#ffffff] border-[#312d2a]",
      dot: "bg-[#f0cc71]", // Gold accent
      label: ext.toUpperCase(),
    };
  }

  return {
    bg: "bg-[#fbf9f8] border-[#e4e1dd] text-[#161513]",
    active: "bg-[#312d2a] text-[#ffffff] border-[#312d2a]",
    dot: "bg-[#aea8a2]",
    label: ext === "[sin extensión]" ? "Sin ext." : ext.toUpperCase(),
  };
}
