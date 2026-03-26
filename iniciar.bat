@echo off
echo Instalando dependencias do backend...
cd backend
call npm install
echo.
echo Instalando dependencias do frontend...
cd ..\frontend
call npm install
echo.
echo Iniciando backend...
start "Backend - Buscador Juris" cmd /k "cd /d %~dp0backend && node server.js"
timeout /t 2 /nobreak > nul
echo Iniciando frontend...
start "Frontend - Buscador Juris" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo Pronto! Acesse http://localhost:5173
