@echo off
title Eunoia.so Installer
echo ===========================================
echo       Eunoia.so - Installer / Updater
echo ===========================================

echo.
echo [1/3] Updating Dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies. Please check if Node.js is installed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/5] Creating Shortcut...
set "TARGET_FILE=%CD%\release\win-unpacked\Eunoia.exe"
set "SHORTCUT_FILE=%USERPROFILE%\Desktop\Eunoia.lnk"
set "ICON_FILE=%CD%\public\vite.svg" 

powershell -ExecutionPolicy Bypass -File "scripts/create_shortcut.ps1" -TargetFile "%TARGET_FILE%" -ShortcutFile "%SHORTCUT_FILE%" -IconFile "%ICON_FILE%" -Description "Launch Eunoia Sanctuary"

echo.
echo [4/5] Creating Start Menu Shortcut...
set "START_MENU_SHORTCUT=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Eunoia.lnk"
powershell -ExecutionPolicy Bypass -File "scripts/create_shortcut.ps1" -TargetFile "%TARGET_FILE%" -ShortcutFile "%START_MENU_SHORTCUT%" -IconFile "%ICON_FILE%" -Description "Launch Eunoia Sanctuary"

echo.
echo [5/5] Installer Generated Successfully.
echo.
echo ===========================================
echo    Installation Complete!
echo    - App installed to Start Menu & Desktop (local).
echo    - INSTALLER READY: "release\Eunoia Setup 0.1.0.exe"
echo      (Upload this file to your website)
echo ===========================================
echo.
pause
