@echo off
set CARGO=C:\Users\jarmo\AppData\Local\puccinialin\puccinialin\Cache\cargo\bin\cargo.exe
set CARGO_INCREMENTAL=0

echo.
echo  Pulse LFG — Dev Launcher
echo  ========================
echo  [1] Desktop app  (cargo tauri dev)
echo  [2] Solo backend (cargo run --bin pulse-server)
echo  [3] Solo frontend (npm run dev)
echo.
set /p mode="Modo (1/2/3): "

if "%mode%"=="1" (
    echo Iniciando app de escritorio...
    %CARGO% tauri dev
) else if "%mode%"=="2" (
    echo Iniciando backend en localhost:8080...
    %CARGO% run --bin pulse-server
) else if "%mode%"=="3" (
    echo Iniciando frontend en localhost:5173...
    npm run dev
) else (
    echo Opcion invalida.
)
