# 体育活动室 - 安装和启动指南

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm 或 yarn

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd web开发项目
```

### 2. 安装依赖
```bash
# 安装所有依赖（根目录）
npm run install-all

# 或者分别安装
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 3. 配置环境变量

#### 后端配置
在 `backend/` 目录下创建 `.env` 文件：
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/sports_room
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
```

#### 前端配置
在 `frontend/` 目录下创建 `.env` 文件：
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. 启动MongoDB
确保MongoDB服务正在运行：
```bash
# Windows
net start MongoDB

# macOS (使用Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### 5. 初始化数据库
```bash
cd backend
node scripts/init-db.js
```

### 6. 启动应用

#### 方式一：使用根目录脚本（推荐）
```bash
# 同时启动前后端
npm run dev
```

#### 方式二：分别启动
```bash
# 启动后端（终端1）
cd backend
npm run dev

# 启动前端（终端2）
cd frontend
npm start
```

#### 方式三：使用提供的启动脚本
- **Windows**: 双击 `start.bat`
- **Linux/Mac**: 运行 `./start.sh`

### 7. 访问应用
- 前端: http://localhost:3000
- 后端API: http://localhost:5000
- 健康检查: http://localhost:5000/health

## 📋 默认账户

初始化数据库后，系统会自动创建以下账户：

### 管理员账户
- 邮箱: admin@sportsroom.com
- 密码: admin123
- 权限: 管理员（可管理所有活动和用户）

### 测试用户账户
- 邮箱: user@sportsroom.com
- 密码: user123
- 权限: 普通用户

## 🔧 开发指南

### 项目结构
```
web开发项目/
├── backend/          # Express后端
├── frontend/         # React前端
├── .github/          # GitHub Actions
├── README.md         # 项目说明
├── SETUP.md          # 安装指南
└── package.json      # 根目录配置
```

### 常用命令
```bash
# 开发模式
npm run dev

# 构建前端
npm run build

# 运行测试
npm test

# 代码检查
cd frontend && npm run lint
cd backend && npm run lint
```

### API文档
主要API端点：
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/activities` - 获取活动列表
- `POST /api/activities` - 创建活动
- `POST /api/activities/:id/register` - 报名活动
- `GET /api/comments/activities/:id` - 获取活动评论

## 🐛 故障排除

### 常见问题

#### 1. MongoDB连接失败
```bash
# 检查MongoDB服务状态
# Windows
net start MongoDB

# macOS
brew services list | grep mongodb

# Linux
sudo systemctl status mongod
```

#### 2. 端口被占用
```bash
# 检查端口占用
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# 杀死进程
taskkill /PID <进程ID> /F
```

#### 3. 依赖安装失败
```bash
# 清除缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

#### 4. 前端无法连接后端
- 检查后端是否正常运行
- 确认API地址配置正确
- 检查CORS设置

### 日志查看
```bash
# 后端日志
cd backend
npm run dev

# 前端日志
cd frontend
npm start
```

## 🚀 部署指南

### 本地部署
1. 按照上述步骤完成本地开发环境搭建
2. 确保MongoDB服务正常运行
3. 使用 `npm run dev` 启动应用

### 生产部署
1. 构建前端：`npm run build`
2. 配置生产环境变量
3. 使用PM2或类似工具管理Node.js进程
4. 配置Nginx反向代理
5. 使用MongoDB Atlas或自托管MongoDB

## 📞 技术支持

如果遇到问题，请：
1. 查看控制台错误信息
2. 检查网络连接
3. 确认环境配置
4. 提交Issue到项目仓库

## 🎯 功能特性

### 已实现功能
- ✅ 用户注册登录
- ✅ 活动管理（CRUD）
- ✅ 活动报名系统
- ✅ 评论系统
- ✅ 搜索和筛选
- ✅ 管理后台
- ✅ 响应式设计

### 待实现功能
- 🔄 文件上传
- 🔄 邮件通知
- 🔄 实时聊天
- 🔄 移动端APP
- 🔄 支付集成