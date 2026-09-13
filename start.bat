@echo off
chcp 65001 >nul
title Class Manager
echo ========================================
echo   Class Manager System
echo ========================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [Error] Python not found
    pause
    exit /b 1
)
python --version
echo.

:: Check virtual environment
if not exist "venv" (
    echo [Info] Creating virtual environment...
    python -m venv venv
)

:: Activate virtual environment
call venv\Scripts\activate.bat
echo.

:: Install dependencies
if not exist "venv\Lib\site-packages\flask" (
    echo [Info] Installing dependencies...
    pip install -r requirements.txt
)
echo.

:: Initialize data
echo [Info] Initializing data...
python init_data.py
echo.

echo ========================================
echo   Starting server...
echo ========================================
echo.
python app.py

pause
