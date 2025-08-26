@echo off
echo ========================================
echo 体育活动室 - 项目启动脚本
echo ========================================
echo.

echo 正在检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

echo 正在检查MongoDB...
mongod --version >nul 2>&1
if errorlevel 1 (
    echo 警告: 未找到MongoDB，请确保MongoDB服务已启动
    echo 或者使用MongoDB Atlas云数据库
    echo.
)

echo.
echo 正在安装后端依赖...
cd backend
call npm install
if errorlevel 1 (
    echo 错误: 后端依赖安装失败
    pause
    exit /b 1
)

echo.
echo 正在安装前端依赖...
cd ../frontend
call npm install
if errorlevel 1 (
    echo 错误: 前端依赖安装失败
    pause
    exit /b 1
)

echo.
echo 正在启动后端服务...
cd ../backend
start "后端服务" cmd /k "npm run dev"

echo 等待后端服务启动...
timeout /t 3 /nobreak >nul

echo.
echo 正在启动前端服务...
cd ../frontend
start "前端服务" cmd /k "npm start"

echo.
echo ========================================
echo 项目启动完成！
echo ========================================
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:5000
echo 健康检查: http://localhost:5000/health
echo ========================================
echo.
echo 按任意键退出...
pause >nul