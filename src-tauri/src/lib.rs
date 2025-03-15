use std::fs::read_dir;
use std::path::PathBuf;
use tauri::ipc::InvokeError;
use walkdir::DirEntry;
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

fn is_invalid_utf8(os_str: &std::ffi::OsStr) -> bool {
    os_str.to_str().is_none()  // If it's None, it's not valid UTF-8
}

#[tauri::command]
fn select_directory_desktop() -> Result<PathBuf, InvokeError> {
    use rfd::FileDialog;

    let selected_dir: Option<PathBuf> = FileDialog::new().set_directory(".").pick_folder();

    match selected_dir {
        Some(path) => Ok(path),
        None => Err(InvokeError::from("No directory selected")),
    }
}

#[tauri::command]
fn scan_selected_directory(path: String) -> Result<Vec<String>, InvokeError> {
    let walk_dir = walkdir::WalkDir::new(path);

    let invalid_paths: Vec<String> = walk_dir
        .into_iter()
        .filter_map(|entry| entry.ok())  // Ignore unreadable files
        .filter(|entry| is_invalid_utf8(entry.path().as_os_str()))
        .map(|entry| entry.path().display().to_string())  // Convert only valid paths back to String
        .collect();

    Ok(invalid_paths)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![select_directory_desktop, scan_selected_directory])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}