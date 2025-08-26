# 体育活动室 - 项目结构说明

## 📁 完整项目结构

```
web开发项目/
├── 📁 backend/                    # Express后端服务
│   ├── 📁 config/                 # 配置文件
│   │   └── database.js            # 数据库连接配置
│   ├── 📁 controllers/            # 控制器层
│   │   ├── authController.js      # 用户认证控制器
│   │   ├── activityController.js  # 活动管理控制器
│   │   ├── registrationController.js # 报名管理控制器
│   │   └── commentController.js   # 评论管理控制器
│   ├── 📁 middlewares/            # 中间件
│   │   ├── auth.js                # JWT认证中间件
│   │   ├── validation.js          # 数据验证中间件
│   │   └── upload.js              # 文件上传中间件
│   ├── 📁 models/                 # 数据模型
│   │   ├── User.js                # 用户模型
│   │   ├── Activity.js            # 活动模型
│   │   ├── Registration.js        # 报名模型
│   │   └── Comment.js             # 评论模型
│   ├── 📁 routes/                 # 路由定义
│   │   ├── auth.js                # 认证路由
│   │   ├── activities.js          # 活动路由
│   │   ├── registrations.js       # 报名路由
│   │   ├── comments.js            # 评论路由
│   │   └── users.js               # 用户路由
│   ├── 📁 utils/                  # 工具函数
│   │   ├── logger.js              # 日志工具
│   │   └── helpers.js             # 辅助函数
│   ├── app.js                     # 应用入口文件
│   └── package.json               # 后端依赖配置
│
├── 📁 frontend/                   # React前端应用
│   ├── 📁 public/                 # 静态资源
│   │   ├── index.html             # HTML模板
│   │   ├── favicon.ico            # 网站图标
│   │   └── manifest.json          # PWA配置
│   ├── 📁 src/                    # 源代码
│   │   ├── 📁 api/                # API接口
│   │   │   ├── auth.js            # 认证API
│   │   │   ├── activities.js      # 活动API
│   │   │   ├── registrations.js   # 报名API
│   │   │   └── comments.js        # 评论API
│   │   ├── 📁 components/         # 组件
│   │   │   ├── 📁 common/         # 通用组件
│   │   │   │   ├── ProtectedRoute.js # 受保护路由
│   │   │   │   ├── AdminRoute.js      # 管理员路由
│   │   │   │   ├── Loading.js         # 加载组件
│   │   │   │   └── ErrorBoundary.js   # 错误边界
│   │   │   ├── 📁 layout/         # 布局组件
│   │   │   │   ├── Layout.js          # 主布局
│   │   │   │   ├── Header.js          # 头部导航
│   │   │   │   ├── Footer.js          # 页脚
│   │   │   │   └── Sidebar.js         # 侧边栏
│   │   │   ├── 📁 forms/          # 表单组件
│   │   │   │   ├── LoginForm.js       # 登录表单
│   │   │   │   ├── RegisterForm.js    # 注册表单
│   │   │   │   ├── ActivityForm.js    # 活动表单
│   │   │   │   └── CommentForm.js     # 评论表单
│   │   │   └── 📁 ui/             # UI组件
│   │   │       ├── ActivityCard.js    # 活动卡片
│   │   │       ├── CommentItem.js     # 评论项
│   │   │       ├── SearchBar.js       # 搜索栏
│   │   │       └── FilterPanel.js     # 筛选面板
│   │   ├── 📁 contexts/           # React上下文
│   │   │   └── AuthContext.js     # 认证上下文
│   │   ├── 📁 hooks/              # 自定义Hooks
│   │   │   ├── useAuth.js         # 认证Hook
│   │   │   ├── useActivities.js   # 活动Hook
│   │   │   └── useApi.js          # API Hook
│   │   ├── 📁 pages/              # 页面组件
│   │   │   ├── HomePage.js        # 首页
│   │   │   ├── LoginPage.js       # 登录页
│   │   │   ├── RegisterPage.js    # 注册页
│   │   │   ├── ActivityListPage.js # 活动列表页
│   │   │   ├── ActivityDetailPage.js # 活动详情页
│   │   │   ├── ProfilePage.js     # 个人资料页
│   │   │   └── 📁 admin/          # 管理页面
│   │   │       ├── Dashboard.js       # 管理仪表板
│   │   │       ├── Activities.js      # 活动管理
│   │   │       └── Users.js           # 用户管理
│   │   ├── 📁 styles/             # 样式文件
│   │   │   ├── index.css          # 全局样式
│   │   │   ├── App.css            # 应用样式
│   │   │   └── components.css     # 组件样式
│   │   ├── 📁 utils/              # 工具函数
│   │   │   ├── constants.js       # 常量定义
│   │   │   ├── helpers.js         # 辅助函数
│   │   │   └── validation.js      # 前端验证
│   │   ├── App.js                 # 主应用组件
│   │   └── index.js               # 应用入口
│   └── package.json               # 前端依赖配置
│
├── 📁 .github/                    # GitHub配置
│   └── 📁 workflows/              # GitHub Actions
│       └── ci.yml                 # CI/CD配置
│
├── 📄 README.md                   # 项目说明文档
├── 📄 PROJECT_STRUCTURE.md        # 项目结构说明
├── 📄 start.bat                   # Windows启动脚本
├── 📄 start.sh                    # Linux/Mac启动脚本
└── 📄 .gitignore                  # Git忽略文件
```

## 🏗️ 架构设计

### 后端架构 (Express + MongoDB)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   客户端请求     │───▶│   Express路由   │───▶│   控制器层      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   响应数据       │◀───│   中间件层      │◀───│   数据模型层    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                               ┌─────────────────┐
                                               │   MongoDB数据库 │
                                               └─────────────────┘
```

### 前端架构 (React + Ant Design)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   用户界面       │───▶│   React组件     │───▶│   API接口层     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Ant Design    │    │   Context状态   │    │   Axios请求     │
│   UI组件库      │    │   管理          │    │   封装          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 数据模型关系

```
User (用户)
├── 1:N ──▶ Activity (活动) ──▶ 1:N ──▶ Registration (报名)
├── 1:N ──▶ Comment (评论)
└── 1:N ──▶ Comment (点赞)

Activity (活动)
├── 1:N ──▶ Registration (报名)
├── 1:N ──▶ Comment (评论)
└── 1:N ──▶ Tag (标签)

Registration (报名)
├── N:1 ──▶ User (用户)
└── N:1 ──▶ Activity (活动)

Comment (评论)
├── N:1 ──▶ User (用户)
├── N:1 ──▶ Activity (活动)
├── 1:N ──▶ Comment (回复)
└── N:N ──▶ User (点赞用户)
```

## 🔧 技术栈详情

### 后端技术栈
- **运行时**: Node.js 18+
- **框架**: Express.js 4.18+
- **数据库**: MongoDB 4.4+
- **ORM**: Mongoose 7.5+
- **认证**: JWT (jsonwebtoken)
- **密码加密**: bcryptjs
- **数据验证**: express-validator
- **文件上传**: multer
- **安全**: helmet, cors, express-rate-limit
- **日志**: morgan
- **测试**: Jest + Supertest

### 前端技术栈
- **框架**: React 18+
- **路由**: React Router 6+
- **状态管理**: React Context + useReducer
- **UI组件库**: Ant Design 5+
- **HTTP客户端**: Axios
- **数据获取**: React Query 3+
- **表单处理**: React Hook Form
- **通知**: React Hot Toast
- **日期处理**: Day.js
- **工具库**: Lodash
- **构建工具**: Create React App

### 开发工具
- **版本控制**: Git
- **CI/CD**: GitHub Actions
- **代码规范**: ESLint + Prettier
- **包管理**: npm

## 🚀 部署架构

### 开发环境
```
本地开发
├── 前端: http://localhost:3000
├── 后端: http://localhost:5000
└── 数据库: MongoDB本地实例
```

### 生产环境
```
云部署
├── 前端: Vercel/Netlify
├── 后端: Render/Railway
└── 数据库: MongoDB Atlas
```

## 📝 开发规范

### 文件命名规范
- **组件文件**: PascalCase (如: `ActivityCard.js`)
- **工具文件**: camelCase (如: `authHelper.js`)
- **常量文件**: UPPER_SNAKE_CASE (如: `API_ENDPOINTS.js`)
- **样式文件**: kebab-case (如: `activity-card.css`)

### 代码规范
- **缩进**: 2个空格
- **分号**: 必须
- **引号**: 单引号
- **最大行长度**: 80字符
- **函数命名**: camelCase
- **常量命名**: UPPER_SNAKE_CASE

### Git提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

## 🔍 关键文件说明

### 后端关键文件
- `app.js`: 应用入口，配置中间件和路由
- `models/`: 数据模型定义，包含业务逻辑
- `controllers/`: 业务逻辑处理，响应客户端请求
- `middlewares/auth.js`: JWT认证中间件
- `routes/`: API路由定义

### 前端关键文件
- `App.js`: 主应用组件，配置路由
- `contexts/AuthContext.js`: 全局认证状态管理
- `components/layout/`: 布局相关组件
- `pages/`: 页面级组件
- `api/`: API接口封装

### 配置文件
- `package.json`: 项目依赖和脚本
- `.github/workflows/ci.yml`: 自动化测试和部署
- `start.bat/start.sh`: 快速启动脚本