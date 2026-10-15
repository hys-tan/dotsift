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
    pub root_path: String,
    pub total_files: usize,
    pub total_size_bytes: u64,
    pub duration_ms: u64,
    pub extensions: Vec<ExtensionStat>,
}

pub struct ScannerState {
    pub files_by_extension: Mutex<HashMap<String, Vec<FileItem>>>,
    pub all_files: Mutex<Vec<FileItem>>,
    pub current_root: Mutex<Option<String>>,
    pub cancel_flag: Arc<AtomicBool>,
}

impl ScannerState {
    pub fn new() -> Self {
        Self {
            files_by_extension: Mutex::new(HashMap::new()),
            all_files: Mutex::new(Vec::new()),
            current_root: Mutex::new(None),
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

pub fn perform_scan(
    root: &str,
    cancel_flag: Arc<AtomicBool>,
) -> Result<(ScanResult, HashMap<String, Vec<FileItem>>, Vec<FileItem>), String> {
    cancel_flag.store(false, Ordering::Relaxed);
    let start_time = Instant::now();
    let root_path = Path::new(root);

    if !root_path.exists() || !root_path.is_dir() {
        return Err("La ruta especificada no existe o no es un directorio válido.".to_string());
    }

    let mut files_by_extension: HashMap<String, Vec<FileItem>> = HashMap::new();
    let mut all_files: Vec<FileItem> = Vec::new();
    let mut total_size_bytes: u64 = 0;
    let mut current_id: usize = 0;

    // Recorrido recursivo ultra-rápido ignorando errores de permisos silenciosamente
    for entry_result in WalkDir::new(root_path)
        .follow_links(false)
        .into_iter()
        .filter_entry(|e| {
            // Evitar carpetas de sistema problemáticas o enlaces circulares
            let file_name = e.file_name().to_string_lossy();
            !file_name.eq_ignore_ascii_case("$RECYCLE.BIN")
                && !file_name.eq_ignore_ascii_case("System Volume Information")
        })
    {
        // Comprobar si el usuario canceló el escaneo
        if current_id % 1000 == 0 && cancel_flag.load(Ordering::Relaxed) {
            return Err("Escaneo cancelado por el usuario.".to_string());
        }

        let entry = match entry_result {
            Ok(e) => e,
            Err(_) => continue, // Salta permisos denegados sin romper el escaneo
        };

        // Solo procesar archivos (no directorios ni enlaces simbólicos)
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
            .push(item.clone());
        all_files.push(item);
    }

    let duration_ms = start_time.elapsed().as_millis() as u64;

    // Calcular estadísticas por extensión
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

    // Ordenar: primero los de audio con mayor conteo, luego los demás por conteo descendente
    extensions.sort_by(|a, b| {
        let a_is_audio = a.category == "audio";
        let b_is_audio = b.category == "audio";
        if a_is_audio && !b_is_audio {
            std::cmp::Ordering::Less
        } else if !a_is_audio && b_is_audio {
            std::cmp::Ordering::Greater
        } else {
            b.count.cmp(&a.count)
        }
    });

    let summary = ScanResult {
        root_path: root.to_string(),
        total_files: current_id,
        total_size_bytes,
        duration_ms,
        extensions,
    };

    Ok((summary, files_by_extension, all_files))
}
