@echo off
echo Killing all running Node.js servers (Next.js, Expo)...
taskkill /F /IM node.exe /T >nul 2>&1

echo Killing all running Python servers (Django)...
taskkill /F /IM python.exe /T >nul 2>&1

echo Found dangling Next.js lock files... cleaning up!
if exist "apps\admin-panel\.next" (
    rmdir /S /Q "apps\admin-panel\.next"
)

echo Cleanup complete! You can now safely run start_all.bat
pause
