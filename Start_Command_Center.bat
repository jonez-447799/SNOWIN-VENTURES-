@echo off
title Manufacturing Command Center Launcher
cd /d "%~dp0"
echo Starting Manufacturing Intelligence & Command Center on http://localhost:3000/ ...
start "" "http://localhost:3000/"
call npx vite --port=3000 --host=0.0.0.0
pause
