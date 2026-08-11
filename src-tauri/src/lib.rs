//! The desktop shell is a window and nothing else: every calculation happens in the
//! same TypeScript core the browser and phone builds use, so there is one implementation
//! of the mathematics and one set of tests covering it.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("failed to start the Compass Error window");
}
