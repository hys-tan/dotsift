use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Instant, UNIX_EPOCH};
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileItem {
    pub id: usize,
    pub name: String,
    pub path: String,
    pub extension: String,
    pub size_bytes: u64,
    pub modified_timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionStat {
    pub extension: String,
    pub count: usize,
    pub total_size_bytes: u64,
    pub category: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub root_paths: Vec<String>,
    pub total_files: usize,
    pub total_size_bytes: u64,
    pub duration_ms: u64,
    pub extensions: Vec<ExtensionStat>,
}

pub struct ScannerState {
    pub files_by_extension: Mutex<HashMap<String, Vec<FileItem>>>,
    pub current_roots: Mutex<Vec<String>>,
    pub cancel_flag: Arc<AtomicBool>,
}

impl ScannerState {
    pub fn new() -> Self {
        Self {
            files_by_extension: Mutex::new(HashMap::new()),
            current_roots: Mutex::new(Vec::new()),
            cancel_flag: Arc::new(AtomicBool::new(false)),
        }
    }
}

pub fn categorize_extension(ext: &str) -> &'static str {
    match ext {
        "mp3" | "flac" | "wav" | "aac" | "ogg" | "m4a" | "wma" | "alac" | "aiff" | "opus" | "mid" | "midi" => "audio",
        "mp4" | "mkv" | "avi" | "mov" | "wmv" | "flv" | "webm" | "m4v" => "video",
        "jpg" | "jpeg" | "png" | "gif" | "webp" | "svg" | "bmp" | "ico" | "tiff" | "psd" | "raw" => "image",
        "pdf" | "doc" | "docx" | "txt" | "md" | "xls" | "xlsx" | "csv" | "ppt" | "pptx" | "epub" => "document",
        "zip" | "rar" | "7z" | "tar" | "gz" | "bz2" | "iso" => "archive",
        "rs" | "ts" | "js" | "tsx" | "jsx" | "py" | "html" | "css" | "json" | "c" | "cpp" | "h" | "cs" | "go" | "java" => "code",
        _ => "other",
    }
}

pub fn perform_scan_multiple(
    roots: &[String],
    cancel_flag: Arc<AtomicBool>,
) -> Result<(ScanResult, HashMap<String, Vec<FileItem>>), String> {
    cancel_flag.store(false, Ordering::Relaxed);
    let start_time = Instant::now();

    if roots.is_empty() {
        return Err("No se especificó ninguna carpeta para escanear.".to_string());
    }

    let mut valid_roots: Vec<String> = Vec::new();
    for r in roots {
        let p = Path::new(r);
        if p.exists() && p.is_dir() {
            if !valid_roots.contains(r) {
                valid_roots.push(r.clone());
            }
        } else if p.exists() && p.is_file() {
            if let Some(parent) = p.parent() {
                let parent_str = parent.to_string_lossy().to_string();
                if !valid_roots.contains(&parent_str) {
                    valid_roots.push(parent_str);
                }
            }
        }
    }

    if valid_roots.is_empty() {
        return Err("Ninguna de las carpetas seleccionadas existe o es válida.".to_string());
    }

    let mut files_by_extension: HashMap<String, Vec<FileItem>> = HashMap::new();
    let mut total_size_bytes: u64 = 0;
    let mut current_id: usize = 0;

    for root_dir in &valid_roots {
        let root_path = Path::new(root_dir);

        for entry_result in WalkDir::new(root_path)
            .follow_links(false)
            .into_iter()
            .filter_entry(|e| {
                let file_name = e.file_name().to_string_lossy();
                !file_name.eq_ignore_ascii_case("$RECYCLE.BIN")
                    && !file_name.eq_ignore_ascii_case("System Volume Information")
            })
        {
            if current_id % 1000 == 0 && cancel_flag.load(Ordering::Relaxed) {
                return Err("Escaneo cancelado por el usuario.".to_string());
            }

            let entry = match entry_result {
                Ok(e) => e,
                Err(_) => continue,
            };

            if !entry.file_type().is_file() {
                continue;
            }

            let path = entry.path();
            let file_name = entry.file_name().to_string_lossy().to_string();

            let ext = match path.extension() {
                Some(os_ext) => os_ext.to_string_lossy().to_lowercase(),
                None => "[sin extensión]".to_string(),
            };

            let metadata = match entry.metadata() {
                Ok(m) => m,
                Err(_) => {
                    match fs::metadata(path) {
                        Ok(m) => m,
                        Err(_) => continue,
                    }
                }
            };

            let size = metadata.len();
            total_size_bytes += size;

            let modified_ts = metadata
                .modified()
                .unwrap_or(UNIX_EPOCH)
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();

            let item = FileItem {
                id: current_id,
                name: file_name,
                path: path.to_string_lossy().to_string(),
                extension: ext.clone(),
                size_bytes: size,
                modified_timestamp: modified_ts,
            };

            current_id += 1;
            files_by_extension
                .entry(ext)
                .or_insert_with(Vec::new)
                .push(item);
        }
    }

    let duration_ms = start_time.elapsed().as_millis() as u64;

    let mut extensions: Vec<ExtensionStat> = files_by_extension
        .iter()
        .map(|(ext, items)| {
            let count = items.len();
            let total_size: u64 = items.iter().map(|f| f.size_bytes).sum();
            ExtensionStat {
                extension: ext.clone(),
                count,
                total_size_bytes: total_size,
                category: categorize_extension(ext).to_string(),
            }
        })
        .collect();

    // Ordenar de mayor a menor cantidad de archivos
    extensions.sort_by(|a, b| b.count.cmp(&a.count));

    let summary = ScanResult {
        root_paths: valid_roots,
        total_files: current_id,
        total_size_bytes,
        duration_ms,
        extensions,
    };

    Ok((summary, files_by_extension))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn benchmark_scan() {
        let test_dir = if Path::new("C:\\Windows\\System32").exists() {
            "C:\\Windows\\System32".to_string()
        } else {
            ".".to_string()
        };

        println!("\n========== [TEST DE RENDIMIENTO DOTSIFT] ==========");
        println!("Directorio de prueba: {}", test_dir);

        let cancel_flag = Arc::new(AtomicBool::new(false));
        let start = Instant::now();

        match perform_scan_multiple(&[test_dir], cancel_flag) {
            Ok((summary, _)) => {
                let elapsed = start.elapsed();
                let secs = elapsed.as_secs_f64();
                let rate = if secs > 0.0 {
                    summary.total_files as f64 / secs
                } else {
                    summary.total_files as f64
                };

                println!("Archivos indexados: {}", summary.total_files);
                println!("Extensiones detectadas: {}", summary.extensions.len());
                println!("Tamaño total en disco: {:.2} MB", summary.total_size_bytes as f64 / 1_048_576.0);
                println!("Tiempo de indexación: {:.3} segundos ({:?})", secs, elapsed);
                println!("Velocidad de procesamiento: {:.0} archivos/segundo", rate);
                println!("Top 5 extensiones con más archivos:");
                for ext in summary.extensions.iter().take(5) {
                    println!("  - .{:8} | {:6} archivos | {:.2} MB", ext.extension, ext.count, ext.total_size_bytes as f64 / 1_048_576.0);
                }
                println!("===================================================\n");

                assert!(summary.total_files > 0);
            }
            Err(e) => {
                panic!("Error durante el escaneo de prueba: {}", e);
            }
        }
    }
}
