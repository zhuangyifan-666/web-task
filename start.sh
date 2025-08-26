#!/bin/bash

echo "========================================"
echo "体育活动室 - 项目启动脚本"
echo "========================================"
echo

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

echo "Node.js版本: $(node --version)"

# 检查MongoDB
if ! command -v mongod &> /dev/null; then
    echo "警告: 未找到MongoDB，请确保MongoDB服务已启动"
    echo "或者使用MongoDB Atlas云数据库"
    echo
fi

# 安装后端依赖
echo "正在安装后端依赖..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "错误: 后端依赖安装失败"
    exit 1
fi

# 安装前端依赖
echo "正在安装前端依赖..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "错误: 前端依赖安装失败"
    exit 1
fi

# 启动后端服务
echo "正在启动后端服务..."
cd ../backend
gnome-terminal --title="后端服务" -- bash -c "npm run dev; exec bash" &
BACKEND_PID=$!

# 等待后端启动
echo "等待后端服务启动..."
sleep 3

# 启动前端服务
echo "正在启动前端服务..."
cd ../frontend
gnome-terminal --title="前端服务" -- bash -c "npm start; exec bash" &
FRONTEND_PID=$!

echo
echo "========================================"
echo "项目启动完成！"
echo "========================================"
echo "前端地址: http://localhost:3000"
echo "后端地址: http://localhost:5000"
echo "健康检查: http://localhost:5000/health"
echo "========================================"
echo
echo "按 Ctrl+C 停止所有服务..."

# 等待用户中断
trap "echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait