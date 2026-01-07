@echo off
title Eunoia.so - Installer Generator
echo ===========================================
echo       Eunoia.so - Installer Factory
echo ===========================================
echo.
echo [1/3] Building Application (Electronic/React)...
echo       (This may take a minute)
call npm run electron:build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Preparing Distribution...
if not exist "Installers" mkdir "Installers"

echo       Copying installer to "Installers" folder...
copy "release\Eunoia Setup *.exe" "Installers\" >nul

echo.
echo [3/3] Done! Opening folder...
explorer "Installers"

echo.
echo ===========================================
echo    SUCCESS!
echo    The installer is ready in the "Installers" folder.
echo    You can upload this file to share Eunoia.
echo ===========================================
echo.
pause
