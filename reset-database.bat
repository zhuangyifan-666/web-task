@echo off
chcp 65001 > nul
echo ===================================================
echo Database Reset Tool - Sports Room Management System
echo ===================================================
echo.
echo This tool will delete all user accounts except the super admin (admin@sportsroom.com)
echo It will also delete all related activities, registrations, and comments
echo.
echo WARNING: This operation is irreversible! Make sure you have backed up important data!
echo.
set /p confirm=Continue? (Y/N): 

if /i "%confirm%" neq "Y" (
  echo.
  echo Operation cancelled
  goto :end
)

echo.
echo Resetting database, please wait...
echo.

cd %~dp0
node backend/scripts/reset-database.js

:end
echo.
echo Press any key to exit...
pause > nul
