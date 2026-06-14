@echo off
echo Running Shift Initialization Script...
echo ========================================

:: Path to your Node.js script
set SCRIPT_PATH=scripts\ScriptZaDatabaza.js

:: Check if Node.js is in PATH
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed or not in PATH
    pause
    exit /b 1
)

:: Run the script
node %SCRIPT_PATH%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ Script completed successfully!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ❌ Script failed with error code %ERRORLEVEL%
    echo ========================================
)

pause