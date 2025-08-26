const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 验证JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: '访问令牌缺失',
        message: '请先登录'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        error: '无效的访问令牌',
        message: '用户不存在'
      });
    }

    // 不再阻止被封号的用户登录，而是在前端显示警告
    // 在活动创建和报名接口中单独检查用户状态

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: '无效的访问令牌',
        message: '请重新登录'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: '访问令牌已过期',
        message: '请重新登录'
      });
    }

    console.error('认证中间件错误:', error);
    res.status(500).json({
      error: '认证服务错误',
      message: '请稍后重试'
    });
  }
};

// 验证管理员权限
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: '未认证',
      message: '请先登录'
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({
      error: '权限不足',
      message: '需要管理员权限'
    });
  }

  next();
};

// 验证超级管理员权限
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: '未认证',
      message: '请先登录'
    });
  }

  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      error: '权限不足',
      message: '需要超级管理员权限'
    });
  }

  next();
};

// 验证资源所有者或管理员权限
const requireOwnerOrAdmin = (resourceUserId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: '未认证',
        message: '请先登录'
      });
    }

    const isOwner = req.user._id.toString() === resourceUserId.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: '权限不足',
        message: '您只能操作自己的资源'
      });
    }

    next();
  };
};

// 可选认证（不强制要求登录）
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // 可选认证失败不影响继续执行
    next();
  }
};

// 生成JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireSuperAdmin,
  requireOwnerOrAdmin,
  optionalAuth,
  generateToken
};
