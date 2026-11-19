@echo off
title SISTEMA DE CREDITO Y COBRANZA EN RUTA - FINANCIERA
color 0A
cd /d "C:\Users\JOSUE\Desktop\SISTEMA_CREDITO_COBRANZA"
echo ============================================================
echo   SISTEMA DE CREDITO, PRESTAMOS Y COBRANZA EN RUTA
echo   MONITOREO GPS EN VIVO Y CORTE DIARIO DE CAJA
echo   Desarrollado por Josue Hernandez (961 276 5041)
echo ============================================================
echo.
echo [1/3] Verificando e instalando actualizaciones desde GitHub...
git pull origin main
echo.
echo [2/3] Iniciando servidor y enlace remoto...
timeout /t 2 /nobreak >nul
echo [3/3] Abriendo panel de control...
start http://localhost:4000
node server.js
pause
