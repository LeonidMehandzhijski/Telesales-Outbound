@echo off
echo Building Tailwind CSS...
"C:\Users\leonid.mehandzhijski\Downloads\node-v22.15.1-win-x64\node-v22.15.1-win-x64\node.exe" "%CD%\node_modules\tailwindcss\lib\cli.js" -i "./src/index.css" -o "./src/tailwind.css"
if %ERRORLEVEL% EQU 0 (
    echo Successfully built Tailwind CSS
) else (
    echo Failed to build Tailwind CSS
    exit /b 1
)
