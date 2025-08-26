const User = require('../models/User');
const { generateToken } = require('../middlewares/auth');
const { validationResult } = require('express-validator');

// 用户注册
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '数据验证失败',
        details: errors.array()
      });
    }

    const { username, email, password, phone } = req.body;

    // 检查用户名是否已存在
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        error: '用户名已存在',
        message: '请选择其他用户名'
      });
    }

    // 检查邮箱是否已存在
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        error: '邮箱已被注册',
        message: '请使用其他邮箱或尝试登录'
      });
    }

    // 创建新用户
    const user = new User({
      username,
      email,
      password,
      phone
    });

    await user.save();

    // 生成JWT token
    const token = generateToken(user._id);

    res.status(201).json({
      message: '注册成功',
      user: user.getPublicProfile(),
      token
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      error: '注册失败',
      message: '请稍后重试'
    });
  }
};

// 用户登录
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '数据验证失败',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: '登录失败',
        message: '邮箱或密码错误'
      });
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: '登录失败',
        message: '邮箱或密码错误'
      });
    }

    // 不再阻止被封号的用户登录，而是在前端显示警告
    // 用户状态会随用户信息一起返回，前端根据isActive字段判断是否显示警告

    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();

    // 生成JWT token
    const token = generateToken(user._id);

    res.json({
      message: '登录成功',
      user: user.getPublicProfile(),
      token
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      error: '登录失败',
      message: '请稍后重试'
    });
  }
};

// 获取当前用户信息
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('activityCount')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        error: '用户不存在',
        message: '用户信息未找到'
      });
    }

    res.json({
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      error: '获取用户信息失败',
      message: '请稍后重试'
    });
  }
};

// 更新用户信息
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '数据验证失败',
        details: errors.array()
      });
    }

    const { username, phone, bio, avatar } = req.body;
    const updateData = {};

    // 只更新提供的字段
    if (username !== undefined) updateData.username = username;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;

    // 检查用户名是否已被其他用户使用
    if (username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.user._id } 
      });
      if (existingUser) {
        return res.status(400).json({
          error: '用户名已存在',
          message: '请选择其他用户名'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: '用户信息更新成功',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      error: '更新用户信息失败',
      message: '请稍后重试'
    });
  }
};

// 修改密码
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '数据验证失败',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // 验证当前密码
    const user = await User.findById(req.user._id);
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: '当前密码错误',
        message: '请输入正确的当前密码'
      });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    res.json({
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      error: '修改密码失败',
      message: '请稍后重试'
    });
  }
};

// 刷新token
const refreshToken = async (req, res) => {
  try {
    const token = generateToken(req.user._id);
    
    res.json({
      message: 'Token刷新成功',
      token
    });
  } catch (error) {
    console.error('刷新Token错误:', error);
    res.status(500).json({
      error: '刷新Token失败',
      message: '请稍后重试'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken
};
