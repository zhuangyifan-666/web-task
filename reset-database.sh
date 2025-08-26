#!/bin/bash

echo "==================================================="
echo "数据库重置工具 - 体育活动室管理系统"
echo "==================================================="
echo
echo "此工具将删除除了超级管理员(admin@sportsroom.com)以外的所有用户账号"
echo "同时也会删除所有相关的活动、报名记录和评论数据"
echo
echo "警告: 此操作不可逆! 请确保您已备份重要数据!"
echo

read -p "是否继续? (y/N): " confirm

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo
  echo "操作已取消"
  exit 0
fi

echo
echo "正在重置数据库，请稍候..."
echo

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 执行重置脚本
node backend/scripts/reset-database.js

echo
echo "按Enter键退出..."
read
