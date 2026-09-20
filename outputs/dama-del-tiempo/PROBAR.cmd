@echo off
cd /d "%~dp0"
".venv\Scripts\python.exe" -m unittest discover -s tests -v
if errorlevel 1 goto error
where node >nul 2>nul
if errorlevel 1 (
  echo Para las pruebas de rueda se requiere Node 24. Las pruebas Python terminaron.
) else (
  node --test --test-isolation=none tests\wheel.test.mjs tests\orbs.test.mjs tests\dignities.test.mjs tests\angular.test.mjs tests\compact-aspects.test.mjs tests\lots.test.mjs tests\profections.test.mjs
  if errorlevel 1 goto error
)
echo Pruebas completadas. Consulta VALIDACION.md para las pruebas de navegador.
pause
exit /b 0
:error
echo Hay pruebas fallidas. Revisa los mensajes anteriores.
pause
exit /b 1
