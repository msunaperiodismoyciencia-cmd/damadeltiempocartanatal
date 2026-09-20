@echo off
cd /d "%~dp0"
python -m venv .venv
if errorlevel 1 goto error
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto error
echo Instalacion terminada. Abri INICIAR.cmd.
pause
exit /b 0
:error
echo No se completo la instalacion. Se requiere Python 3.11 e Internet.
pause
exit /b 1
