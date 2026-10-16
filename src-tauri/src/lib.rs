mod scanner;

use scanner::{FileItem, ScanResult, ScannerState};
use std::sync::atomic::Ordering;
use tauri::State;

#[tauri::command]
async fn scan_directories(
    paths: Vec<String>,
    state: State<'_, ScannerState>,
) -> Result<ScanResult, String> {
    let cancel_flag = state.cancel_flag.clone();
    let roots = paths.clone();

    let result = tauri::async_runtime::spawn_blocking(move || {
        scanner::perform_scan_multiple(&roots, cancel_flag)
    })
    .await
    .map_err(|e| format!("Error en el hilo de escaneo: {}", e))??;

    let (summary, files_by_ext, all) = result;

    if let Ok(mut ext_map) = state.files_by_extension.lock() {
        *ext_map = files_by_ext;
    }
    if let Ok(mut all_list) = state.all_files.lock() {
        *all_list = all;
    }
    if let Ok(mut roots_guard) = state.current_roots.lock() {
        *roots_guard = paths;
    }

    Ok(summary)
}

#[tauri::command]
fn cancel_scan(state: State<'_, ScannerState>) -> Result<(), String> {
    state.cancel_flag.store(true, Ordering::Relaxed);
    Ok(())
}

#[tauri::command]
fn get_filtered_files(
    extension: Option<String>,
    search_query: Option<String>,
    state: State<'_, ScannerState>,
) -> Result<Vec<FileItem>, String> {
    let query_lower = search_query.map(|q| q.trim().to_lowercase());
    let has_query = query_lower.as_ref().map(|q| !q.is_empty()).unwrap_or(false);

    let candidates: Vec<FileItem> = match extension {
        Some(ref ext) if ext != "ALL" => {
            let ext_map = state
                .files_by_extension
                .lock()
                .map_err(|_| "Error al bloquear mapa de extensiones".to_string())?;
            ext_map.get(ext).cloned().unwrap_or_default()
        }
        _ => {
            let all_list = state
                .all_files
                .lock()
                .map_err(|_| "Error al bloquear lista de archivos".to_string())?;
            all_list.clone()
        }
    };

    if has_query {
        let q = query_lower.unwrap();
        let filtered = candidates
            .into_iter()
            .filter(|f| f.name.to_lowercase().contains(&q))
            .collect();
        Ok(filtered)
    } else {
        Ok(candidates)
    }
}

#[tauri::command]
fn open_file_default(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &path])
            .creation_flags(CREATE_NO_WINDOW)
            .spawn()
            .map_err(|e| format!("No se pudo abrir el archivo: {}", e))?;
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = path;
        Ok(())
    }
}

#[tauri::command]
fn open_containing_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(format!("/select,{}", path))
            .spawn()
            .map_err(|e| format!("No se pudo abrir la carpeta en el explorador: {}", e))?;
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = path;
        Ok(())
    }
}

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(ScannerState::new())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                if let Some(icon) = app.default_window_icon() {
                    let _ = window.set_icon(icon.clone());
                } else if let Ok(icon) = tauri::image::Image::from_app_icon_resource(32) {
                    let _ = window.set_icon(icon);
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            scan_directories,
            cancel_scan,
            get_filtered_files,
            open_file_default,
            open_containing_folder
        ])
        .run(tauri::generate_context!())
        .expect("Error al inicializar la aplicación Tauri");
}
