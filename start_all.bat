@echo off
TITLE Kabadi Man Boot Menu

echo Starting Django Backend Server (Port 8000)...
start "Kabadi Man - Backend API (8000)" cmd /k "cd backend && venv\Scripts\activate && python manage.py runserver 127.0.0.1:8000 --settings=kabadiman.settings.dev"

echo Starting Next.js Admin Panel (Port 3000)...
start "Kabadi Man - Admin Panel (3000)" cmd /k "cd apps\admin-panel && pnpm run dev"

echo Starting Customer App (Expo Server)...
start "Kabadi Man - Customer App (8084)" cmd /k "cd apps\customer-app && npx expo start -c --port 8084"

echo Starting Partner App (Expo Server)...
start "Kabadi Man - Partner App (8083)" cmd /k "cd apps\partner-app && npx expo start -c --port 8083"

echo.
echo =========================================================
echo All servers are booting up in separate terminal windows!
echo Give it a few seconds for the Next.js and Expo compilers to finish spinning up.
echo.
echo Here are your local URLs:
echo ---------------------------------------------------------
echo 1. ⚙️  Admin Panel:      http://localhost:3000
echo 2. 🏠 Customer App:     Metro Bundler on Port 8084
echo 3. 🛺 Partner App:      Metro Bundler on Port 8083
echo =========================================================
echo You can use these Mock Credentials to log in:
echo.
echo Admin Panel:
echo Username: admin
echo Password: admin_123
echo.
echo Mobile Apps (Customer/Partner):
echo Phone:    Any 10-digit number (e.g., 1234567890)
echo OTP:      123456
echo =========================================================
pause
