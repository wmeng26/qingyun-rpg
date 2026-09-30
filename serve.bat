@echo off
chcp 65001 >nul
title 青云仙途 - 本地服务器
cd /d "%~dp0"
echo ================================================
echo    青云仙途 - 修仙回合制 RPG
echo    本地服务器启动中: http://localhost:8080
echo ================================================
where python >nul 2>nul
if %errorlevel%==0 (
    start "" "http://localhost:8080"
    python -m http.server 8080
    goto :eof
)
where py >nul 2>nul
if %errorlevel%==0 (
    start "" "http://localhost:8080"
    py -3 -m http.server 8080
    goto :eof
)
echo [!] 未找到 Python，请先安装 Python 3: https://www.python.org/downloads/
echo     或使用其他静态服务器(如 VS Code Live Server)打开本目录。
pause
