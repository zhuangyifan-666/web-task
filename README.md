# 体育活动室管理系统

> 暑期Web开发课程大作业

![React](https://img.shields.io/badge/React-18.x-blue)
![Node.js](https://img.shields.io/badge/Node.js-16.x-green)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey)
![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-yellow)

## 📝 项目概述

本项目是暑期Web开发课程的大作业，实现了一个完整的体育活动管理系统。系统采用前后端分离架构，前端使用React构建用户界面，后端使用Node.js和Express提供API服务，MongoDB作为数据库存储数据。

该系统允许用户注册、登录、创建活动、报名参加活动、发表评论等，同时实现了多级权限管理，包括超级管理员、普通管理员和普通用户三种角色，每种角色拥有不同的权限。

## 🎯 学习目标

通过本项目，我掌握了以下Web开发技能：

1. **前后端分离架构**：理解和实现前后端分离的应用架构
2. **React前端开发**：组件化开发、状态管理、路由控制
3. **Node.js后端开发**：RESTful API设计、中间件使用、数据库交互
4. **MongoDB数据库**：数据模型设计、查询优化、关联查询
5. **用户认证与授权**：JWT认证、基于角色的访问控制
6. **前端UI设计**：使用Ant Design构建现代化用户界面
7. **项目部署与维护**：环境配置、脚本编写、错误处理

## 🛠️ 技术栈

### 前端
- React 18
- React Router v6
- Axios
- Ant Design
- Context API
- CSS Modules

### 后端
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT认证
- bcrypt密码加密

### 开发工具
- Git
- VS Code
- Postman
- MongoDB Compass

## ✨ 功能特性

### 用户系统
- 用户注册与登录
- 多级权限控制（超级管理员、普通管理员、普通用户）
- 用户封号系统（被封用户可登录但无法创建或参与活动）
- 个人资料管理

### 活动管理
- 活动创建与编辑
- 活动审核流程
- 活动报名与取消
- 活动搜索与筛选
- 活动评论功能

### 管理功能
- 用户管理（查看、编辑、封禁、删除）
- 活动管理（审核、编辑、删除）
- 数据统计与分析
- 系统设置

## 📋 项目结构

```
web开发项目/
├── backend/                # Express后端
│   ├── controllers/        # 控制器
│   ├── models/             # 数据模型
│   ├── routes/             # 路由
│   ├── middlewares/        # 中间件
│   ├── config/             # 配置文件
│   ├── scripts/            # 脚本文件
│   └── app.js              # 应用入口
├── frontend/               # React前端
│   ├── public/             # 静态资源
│   └── src/
│       ├── components/     # 组件
│       ├── pages/          # 页面
│       ├── api/            # API调用
│       ├── contexts/       # 上下文
│       └── styles/         # 样式文件
├── reset-database.bat      # 数据库重置脚本(Windows)
├── reset-database.sh       # 数据库重置脚本(Unix)
└── README.md               # 项目文档
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd web开发项目
```

2. **安装依赖**
```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

3. **配置环境变量**

创建 `backend/.env` 文件：
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sports_room
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

创建 `frontend/.env` 文件：
```
REACT_APP_API_URL=http://localhost:5000/api
```

4. **初始化数据库**
```bash
cd ../backend
node scripts/init-db.js
```

5. **启动应用**

Windows:
```bash
# 在项目根目录下
start.bat
```

Unix/Linux/macOS:
```bash
# 在项目根目录下
chmod +x start.sh
./start.sh
```

或手动启动：
```bash
# 启动后端
cd backend
npm run dev

# 启动前端（新终端）
cd frontend
npm start
```

6. **访问应用**
- 前端: http://localhost:3000
- 后端API: http://localhost:5000/api

### 默认账号

**超级管理员**
- 邮箱: admin@sportsroom.com
- 密码: admin123

## 💡 实现细节

### 1. 多级权限系统

实现了基于角色的访问控制（RBAC）系统，包含三种用户角色：

1. **超级管理员**
   - 唯一标识：邮箱为 admin@sportsroom.com
   - 权限：可访问所有功能，包括用户管理、活动管理和系统设置
   - 实现方式：通过 `isSuperAdmin()` 方法在 `AuthContext` 中判断

2. **普通管理员**
   - 权限：可管理活动（审核、删除），但不能管理用户
   - 实现方式：通过 `role === 'admin'` 判断

3. **普通用户**
   - 权限：创建活动、参与活动、发表评论
   - 实现方式：默认角色

权限控制通过以下组件实现：
- `AdminRoute.js`: 限制只有超级管理员可访问的路由
- `ModeratorRoute.js`: 限制只有管理员可访问的路由
- `ProtectedRoute.js`: 限制只有登录用户可访问的路由

### 2. 用户封号系统

实现了用户封号功能，具有以下特点：

1. **封号机制**
   - 被封号用户可以登录系统，但会看到警告提示
   - 被封号用户无法创建活动或报名参加活动
   - 管理员必须先被取消管理员权限才能被封号

2. **技术实现**
   - 后端：修改 `auth.js` 中间件，允许被封号用户通过认证
   - 前端：在 `AuthContext.js` 中添加封号状态检查和警告提示
   - 活动创建和报名接口：添加用户状态检查

### 3. 数据库管理

为方便课程演示和测试，实现了数据库管理脚本：

1. **数据库重置**
   - 脚本：`reset-database.js`
   - 功能：删除除超级管理员外的所有用户和相关数据
   - 使用方法：通过 `reset-database.bat` 或 `reset-database.sh` 执行

2. **超级管理员账号确保**
   - 脚本：`ensure-admin.js`
   - 功能：确保系统中存在超级管理员账号
   - 使用场景：初始化系统或重置管理员密码

## 📚 学习心得

在完成这个项目的过程中，我学到了很多实用的Web开发知识和技能：

1. **前后端分离架构的优势**
   - 更清晰的关注点分离
   - 前后端可以独立开发和部署
   - 更好的可扩展性和可维护性

2. **React组件化开发的思想**
   - 将UI拆分为可复用的组件
   - 使用Context API进行状态管理
   - 使用自定义Hook封装逻辑

3. **RESTful API设计原则**
   - 资源命名和URL设计
   - HTTP方法的正确使用
   - 状态码和错误处理

4. **数据库设计与优化**
   - MongoDB文档模型设计
   - 索引优化
   - 关联查询实现

5. **用户认证与授权**
   - JWT的工作原理和实现
   - 基于角色的访问控制
   - 安全最佳实践

6. **项目组织与代码质量**
   - 清晰的项目结构
   - 代码复用和模块化
   - 错误处理和日志记录

## 🔍 项目难点与解决方案

### 1. 多级权限控制

**难点**：如何在前端和后端同时实现有效的权限控制，确保用户只能访问其权限范围内的功能。

**解决方案**：
- 后端：使用中间件检查用户角色和权限
- 前端：使用高阶组件包装需要权限控制的路由
- 统一：在Context中集中管理用户权限状态

### 2. 用户封号系统

**难点**：如何允许被封号用户登录但限制其操作。

**解决方案**：
- 修改认证中间件，不再在登录阶段拦截被封号用户
- 在需要限制的操作接口中单独检查用户状态
- 前端显示警告信息，提示用户账号状态

### 3. 数据关联与一致性

**难点**：如何处理用户、活动、报名和评论之间的关联关系，确保数据一致性。

**解决方案**：
- 使用Mongoose的引用和填充功能
- 实现级联删除操作
- 使用事务确保关键操作的原子性

## 🔜 未来改进

如果有更多时间，我计划对项目进行以下改进：

1. **前端性能优化**
   - 实现组件懒加载
   - 优化渲染性能
   - 添加缓存机制

2. **功能扩展**
   - 添加活动日历视图
   - 实现消息通知系统
   - 添加用户评分和反馈功能

3. **安全性增强**
   - 实现CSRF保护
   - 添加请求速率限制
   - 增强密码策略

4. **测试覆盖**
   - 添加单元测试
   - 实现端到端测试
   - 性能测试

## 📝 课程总结

通过这个暑期Web开发课程的大作业，我不仅学习了现代Web开发的技术栈和工具，还掌握了从需求分析到系统实现的完整开发流程。这个项目让我对前后端分离架构有了更深入的理解，也提升了我解决实际问题的能力。

特别感谢课程老师的指导和同学们的帮助，使我能够顺利完成这个项目。

---

© 2025 暑期Web开发课程大作业 - 体育活动室管理系统
