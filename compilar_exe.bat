@echo off
title Compilador AGUASYS (.exe)
echo ====================================================
echo   COMPILANDO AGUASYS PARA WINDOWS (.EXE)
echo ====================================================
echo.

echo [1/4] Compilando interfaz visual (React / Vite)...
cd /d "%~dp0frontend"
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo ERROR al compilar el frontend. Verifique que Node.js este instalado.
    pause
    exit /b 1
)

echo.
echo [2/4] Instalando dependencias de Python y PyInstaller...
cd /d "%~dp0backend"
pip install fastapi uvicorn sqlalchemy pydantic pyinstaller
if %errorlevel% neq 0 (
    echo ERROR al instalar paquetes de Python. Verifique que Python este instalado.
    pause
    exit /b 1
)

echo.
echo [3/4] Generando ejecutable AGUASYS.exe...
pyinstaller --noconfirm --onefile --name "AGUASYS" --add-data "../frontend/dist;dist" app\main.py
if %errorlevel% neq 0 (
    echo ERROR al generar el ejecutable.
    pause
    exit /b 1
)

echo.
echo [4/4] Preparando carpeta ENTREGABLE_CLIENTE...
cd /d "%~dp0"
if not exist "ENTREGABLE_CLIENTE" mkdir "ENTREGABLE_CLIENTE"
copy /Y "backend\dist\AGUASYS.exe" "ENTREGABLE_CLIENTE\AGUASYS.exe"

echo.
echo ====================================================
echo   LISTO! Tu programa esta en la carpeta:
echo   ENTREGABLE_CLIENTE\AGUASYS.exe
echo ====================================================
pause
