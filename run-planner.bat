@echo off
rem Change directory to the project folder
cd /d "%~dp0"

rem Start http-server on port 3000 in a new window
start "" cmd /c "npx http-server . -p 3000"

rem Give the server a moment to start
ping -n 5 127.0.0.1 >nul

rem Open default browser to the served site
start "" "http://localhost:3000"

rem Keep the original window open until the user closes it
pause
