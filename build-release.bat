@echo off
set CARGO=C:\Users\jarmo\AppData\Local\puccinialin\puccinialin\Cache\cargo\bin\cargo.exe
set CARGO_INCREMENTAL=0

echo.
echo  Pulse LFG — Release Builder
echo  ============================
echo  IMPORTANTE: Edita .env.production con tu URL de Railway antes de continuar.
echo.
echo  [1] Build desktop (.exe instalador)
echo  [2] Build web (dist/ para Vercel/Netlify)
echo.
set /p mode="Que quieres buildear (1/2): "

if "%mode%"=="1" (
    echo Construyendo instalador de escritorio...
    %CARGO% tauri build
    echo.
    echo Instalador en: target\release\bundle\nsis\
) else if "%mode%"=="2" (
    echo Construyendo frontend web...
    npm run build
    echo.
    echo Archivos en: dist\
    echo Subelos a Vercel con: npx vercel deploy --prod
) else (
    echo Opcion invalida.
)
