const User = require('../models/User');
const Registration = require('../models/Registration');
const Activity = require('../models/Activity');
const { validationResult } = require('express-validator');

// 获取用户列表（管理员）
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, isActive } = req.query;

    const query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      error: '获取用户列表失败',
      message: '请稍后重试'
    });
  }
};

// 获取用户详情
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({
        error: '用户不存在',
        message: '未找到指定的用户'
      });
    }

    // 获取用户统计信息
    const stats = await Promise.all([
      Registration.countDocuments({ user: userId }),
      Activity.countDocuments({ organizer: userId }),
      Registration.countDocuments({ user: userId, status: 'confirmed' })
    ]);

    const userStats = {
      totalRegistrations: stats[0],
      totalActivities: stats[1],
      confirmedRegistrations: stats[2]
    };

    res.json({
      user: { ...user, stats: userStats }
    });
  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({
      error: '获取用户详情失败',
      message: '请稍后重试'
    });
  }
};

// 更新用户信息（管理员）
const updateUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '数据验证失败',
        details: errors.array()
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: '用户不存在',
        message: '未找到指定的用户'
      });
    }

    const updateData = {};
    
    if (req.body.username !== undefined) updateData.username = req.body.username;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.role !== undefined) updateData.role = req.body.role;
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.bio !== undefined) updateData.bio = req.body.bio;
    if (req.body.avatar !== undefined) updateData.avatar = req.body.avatar;

    // 检查用户名和邮箱唯一性
    if (req.body.username) {
      const existingUser = await User.findOne({ 
        username: req.body.username, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(400).json({
          error: '用户名已存在',
          message: '请选择其他用户名'
        });
      }
    }

    if (req.body.email) {
      const existingUser = await User.findOne({ 
        email: req.body.email, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(400).json({
          error: '邮箱已被使用',
          message: '请使用其他邮箱'
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: '用户信息更新成功',
      user: updatedUser
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      error: '更新用户信息失败',
      message: '请稍后重试'
    });
  }
};

// 禁用/启用用户（管理员）- 已废弃，只保留封禁功能
const toggleUserStatus = async (req, res) => {
  return res.status(410).json({
    error: '功能已废弃',
    message: '禁用功能已被移除，请使用封禁功能'
  });
};

// 封禁用户（管理员）
const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: '用户不存在',
        message: '未找到指定的用户'
      });
    }

    // 不能封禁自己
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        error: '操作失败',
        message: '不能封禁自己的账户'
      });
    }

    // 不能封禁管理员（除非是超级管理员）
    if ((user.role === 'admin' || user.role === 'superadmin') && req.user.role !== 'superadmin') {
      return res.status(403).json({
        error: '权限不足',
        message: '无法封禁管理员账户'
      });
    }

    user.isBanned = true;
    user.banReason = reason || '违反社区规定';
    user.bannedAt = new Date();
    await user.save();

    res.json({
      message: '用户已被封禁',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isBanned: user.isBanned,
        banReason: user.banReason,
        bannedAt: user.bannedAt
      }
    });
  } catch (error) {
    console.error('封禁用户错误:', error);
    res.status(500).json({
      error: '操作失败',
      message: '请稍后重试'
    });
  }
};

// 解除用户封禁（管理员）
const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: '用户不存在',
        message: '未找到指定的用户'
      });
    }

    if (!user.isBanned) {
      return res.status(400).json({
        error: '操作失败',
        message: '该用户未被封禁'
      });
    }

    user.isBanned = false;
    user.banReason = '';
    user.bannedAt = null;
    await user.save();

    res.json({
      message: '用户封禁已解除',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isBanned: user.isBanned
      }
    });
  } catch (error) {
    console.error('解除用户封禁错误:', error);
    res.status(500).json({
      error: '操作失败',
      message: '请稍后重试'
    });
  }
};

// 删除用户（管理员）
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { force } = req.query;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: '用户不存在',
        message: '未找到指定的用户'
      });
    }

    // 不能删除自己
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        error: '操作失败',
        message: '不能删除自己的账户'
      });
    }

    // 检查用户是否有活动或报名记录
    const [activityCount, registrationCount] = await Promise.all([
      Activity.countDocuments({ organizer: userId }),
      Registration.countDocuments({ user: userId })
    ]);

    // 如果用户有活动或报名记录，且不是超级管理员强制删除，则阻止删除
    if ((activityCount > 0 || registrationCount > 0) && !(req.user.role === 'superadmin' && force === 'true')) {
      return res.status(400).json({
        error: '无法删除用户',
        message: req.user.role === 'superadmin' 
          ? '该用户有活动或报名记录，请使用强制删除选项' 
          : '该用户有活动或报名记录，无法删除'
      });
    }

    // 如果是超级管理员强制删除，同时删除所有相关的活动和报名记录
    if (req.user.role === 'superadmin' && force === 'true') {
      // 获取用户创建的所有活动ID
      const activities = await Activity.find({ organizer: userId }).select('_id');
      const activityIds = activities.map(activity => activity._id);
      
      // 删除这些活动的所有报名记录
      if (activityIds.length > 0) {
        await Registration.deleteMany({ activity: { $in: activityIds } });
      }
      
      // 删除用户创建的所有活动
      await Activity.deleteMany({ organizer: userId });
      
      // 删除用户的所有报名记录
      await Registration.deleteMany({ user: userId });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      message: (activityCount > 0 || registrationCount > 0) 
        ? '用户及相关活动和报名记录已强制删除' 
        : '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      error: '删除用户失败',
      message: '请稍后重试'
    });
  }
};

// 获取用户活动列表
const getUserActivities = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const query = { organizer: userId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const activities = await Activity.find(query)
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Activity.countDocuments(query);

    res.json({
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取用户活动错误:', error);
    res.status(500).json({
      error: '获取活动失败',
      message: '请稍后重试'
    });
  }
};

// 获取用户报名记录
const getUserRegistrations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const registrations = await Registration.find(query)
      .populate('activity', 'title startTime endTime location category')
      .sort({ registrationTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Registration.countDocuments(query);

    res.json({
      registrations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取用户报名记录错误:', error);
    res.status(500).json({
      error: '获取报名记录失败',
      message: '请稍后重试'
    });
  }
};

// 获取用户统计信息
const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await Promise.all([
      User.findById(userId).select('createdAt lastLogin'),
      Registration.countDocuments({ user: userId }),
      Registration.countDocuments({ user: userId, status: 'confirmed' }),
      Activity.countDocuments({ organizer: userId }),
      Activity.countDocuments({ organizer: userId, status: 'published' })
    ]);

    const [user, totalRegistrations, confirmedRegistrations, totalActivities, publishedActivities] = stats;

    if (!user) {
      return res.status(404).json({
        error: '用户不存在',
        message: '未找到指定的用户'
      });
    }

    res.json({
      stats: {
        joinDate: user.createdAt,
        lastLogin: user.lastLogin,
        totalRegistrations,
        confirmedRegistrations,
        totalActivities,
        publishedActivities
      }
    });
  } catch (error) {
    console.error('获取用户统计错误:', error);
    res.status(500).json({
      error: '获取统计失败',
      message: '请稍后重试'
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUserByAdmin,
  toggleUserStatus,
  banUser,
  unbanUser,
  deleteUser,
  getUserActivities,
  getUserRegistrations,
  getUserStats
};
