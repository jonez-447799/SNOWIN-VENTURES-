@echo off
title Factory Dead Inventory Engine Server
cd /d "%~dp0"
echo Starting Dead Inventory Cash Flow Engine...
echo Open http://localhost:3000 in your browser.
start http://localhost:3000
npm run dev
pause
