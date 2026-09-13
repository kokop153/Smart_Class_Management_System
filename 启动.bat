@echo off
chcp 65001 >nul
title 智慧班级管理系统 - 启动
echo ========================================
echo   智慧班级管理系统
echo ========================================
echo.

:: 检查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Python
    pause
    exit /b 1
)
python --version
echo.

:: 检查虚拟环境
if not exist "venv" (
    echo [信息] 创建虚拟环境...
    python -m venv venv
)

:: 激活虚拟环境
call venv\Scripts\activate.bat
echo.

:: 安装依赖
if not exist "venv\Lib\site-packages\flask" (
    echo [信息] 安装依赖...
    pip install -r requirements.txt
)
echo.

:: 初始化数据
echo [信息] 初始化数据...
python init_data.py
echo.

echo ========================================
echo   启动服务器...
echo ========================================
echo.
python app.py

pause
