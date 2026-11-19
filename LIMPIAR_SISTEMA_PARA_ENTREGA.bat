@echo off
title LIMPIAR SISTEMA PARA ENTREGA AL CLIENTE - JOSUE HERNANDEZ
color 0C
cd /d "C:\Users\JOSUE\Desktop\SISTEMA_CREDITO_COBRANZA"
echo ============================================================
echo   RESTABLECER DE FABRICA Y ENTREGAR LIMPIO AL CLIENTE
echo   Desarrollado por Josue Hernandez (961 276 5041)
echo ============================================================
echo.
echo ADVERTENCIA: Esta accion borrara todos los clientes de prueba,
echo cobros falsos, gastos y cortes anteriores para dejar el sistema
echo en $0.00 pesos listo para el cliente final.
echo.
set /p PIN="Ingresa tu PIN Maestro de Desarrollador (9612): "

if not "%PIN%"=="9612" (
    if not "%PIN%"=="9612765041" (
        echo.
        echo [ERROR] PIN Maestro incorrecto. Cancelando operacion.
        pause
        exit /b
    )
)

echo.
echo Limpiando cartera, prestamos de prueba y cortes de caja...
node -e "const fs = require('fs'); const file = 'database.json'; if (fs.existsSync(file)) { const d = JSON.parse(fs.readFileSync(file, 'utf8')); d.clientes = []; d.cobros = []; d.cortes = []; d.gastos = []; (d.cobradores || []).forEach(c => { c.totalCobradoHoy = 0; c.efectivoEnMano = c.fondoInicial || 1000; c.clientesAsignados = 0; c.clientesCobradosHoy = 0; c.efectividad = 0; }); fs.writeFileSync(file, JSON.stringify(d, null, 2), 'utf8'); console.log('>> Base de datos restablecida a ceros exitosamente.'); } else { console.log('No existe database.json'); }"

echo.
echo ============================================================
echo   SISTEMA 100%% LIMPIO Y LISTO PARA ENTREGAR AL CLIENTE
echo ============================================================
echo.
pause
