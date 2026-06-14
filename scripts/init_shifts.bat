@echo off
echo Running Shift Initialization...
echo ========================================

:: Change the execution policy for this session to allow script execution
PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& {Start-Process PowerShell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File "%~dp0init_shifts.ps1"' -Verb RunAs}"

echo.
echo ========================================
echo If you don't see any errors above, initialization is complete!
echo ========================================
pause