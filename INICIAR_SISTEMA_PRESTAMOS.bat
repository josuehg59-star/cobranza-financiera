@echo off
title SISTEMA DE CREDITO Y COBRANZA EN RUTA - FINANCIERA
color 0A
cd /d "C:\Users\JOSUE\Desktop\SISTEMA_CREDITO_COBRANZA"
echo ============================================================
echo   SISTEMA DE CREDITO, PRESTAMOS Y COBRANZA EN RUTA
echo   MONITOREO GPS EN VIVO Y CORTE DIARIO DE CAJA
echo ============================================================
echo.
echo Iniciando servidor en puerto 4000 y enlace remoto...
timeout /t 2 /nobreak >nul
start http://localhost:4000
node server.js
pause
