pub fn run() {
    // Dev: levanta el servidor embebido en localhost:8080 para probar sin deploy.
    // Release: el frontend usa VITE_WS_URL (baked at build time) → servidor remoto.
    #[cfg(debug_assertions)]
    std::thread::spawn(|| {
        let rt = tokio::runtime::Runtime::new().expect("tokio runtime");
        rt.block_on(server::start_embedded(8080));
    });

    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running Pulse LFG");
}
