@echo off
rem Change directory to the project folder
cd /d "%~dp0"

rem Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

rem Start the server in a new window
start "" cmd /c "node server.js"

rem Give the server a moment to start
ping -n 3 127.0.0.1 >nul

rem Open default browser to the served site
start "" "http://localhost:3000"

rem Keep the original window open until the user closes it
pause
