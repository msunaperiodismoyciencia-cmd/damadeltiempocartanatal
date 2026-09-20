@echo off
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Primero ejecuta INSTALAR.cmd. Solo la instalacion requiere Internet.
  pause
  exit /b 1
)
".venv\Scripts\python.exe" server.py --open
pause
