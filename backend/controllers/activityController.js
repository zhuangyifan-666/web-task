const Activity = require('../models/Activity');
const Registration = require('../models/Registration');
const { validationResult } = require('express-validator');

// 获取活动列表
const getActivities = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status = 'published',
      search,
      sortBy = 'startTime',
      sortOrder = 'asc'
    } = req.query;

    console.log('Request query:', req.query);
    console.log('Category from query:', category);
    console.log('Category type:', typeof category);

    // 构建查询条件
    const query = {};
    
    if (category) {
      // 确保category是字符串并且不为空
      query.category = category.toString().trim();
      console.log('Adding category to query:', query.category);
    }
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    // 添加审核状态过滤
    if (status === 'published') {
      query.approvalStatus = 'approved';
    }

    console.log('Final query:', query);

    // 构建排序条件
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 执行查询
    const activities = await Activity.find(query)
      .populate('organizer', 'username avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // 获取总数
    const total = await Activity.countDocuments(query);

    // 为每个活动添加报名状态（如果用户已登录）
    if (req.user) {
      for (let activity of activities) {
        const registration = await Registration.findOne({
          user: req.user._id,
          activity: activity._id,
          status: { $nin: ['cancelled'] }
        });
        activity.isRegistered = !!registration;
        activity.registrationStatus = registration?.status;
      }
    }

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
    console.error('获取活动列表错误:', error);
    res.status(500).json({
      error: '获取活动列表失败',
      message: '请稍后重试'
    });
  }
};

// 获取活动详情
const getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const activity = await Activity.findById(id)
      .populate('organizer', 'username avatar bio')
      .lean();

    if (!activity) {
      return res.status(404).json({
        error: '活动不存在',
        message: '未找到指定的活动'
      });
    }

    // 增加浏览次数
    await Activity.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

    // 获取报名用户列表
    const registrations = await Registration.find({
      activity: id,
      status: 'confirmed'
    })
    .populate('user', 'username avatar')
    .sort({ registrationTime: 1 })
    .lean();

    // 检查当前用户是否已报名
    let userRegistration = null;
    if (req.user) {
      userRegistration = await Registration.findOne({
        user: req.user._id,
        activity: id
      }).lean();
    }

    res.json({
      activity: {
        ...activity,
        registrations,
        userRegistration
      }
    });
  } catch (error) {
    console.error('获取活动详情错误:', error);
    res.status(500).json({
      error: '获取活动详情失败',
      message: '请稍后重试'
    });
  }
};

// 创建活动
const createActivity = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '数据验证失败',
        details: errors.array()
      });
    }

    // 检查用户是否被封号
    if (!req.user.isActive) {
      return res.status(403).json({
        error: '账号已被封禁',
        message: '您的账号已被封禁，无法创建活动。如需解封，请联系管理员：admin@sportsroom.com'
      });
    }

    // 检查用户角色，如果是管理员，则直接设置为已批准
    const isAdmin = req.user.role === 'admin';
    
    const activityData = {
      ...req.body,
      organizer: req.user._id,
      status: isAdmin ? 'published' : 'pending',
      approvalStatus: isAdmin ? 'approved' : 'pending'
    };

    const activity = new Activity(activityData);
    await activity.save();

    const populatedActivity = await Activity.findById(activity._id)
      .populate('organizer', 'username avatar');

    res.status(201).json({
      message: isAdmin ? '活动创建成功' : '活动已提交，等待管理员审核',
      activity: populatedActivity
    });
  } catch (error) {
    console.error('创建活动错误:', error);
    res.status(500).json({
      error: '创建活动失败',
      message: '请稍后重试'
    });
  }
};

// 更新活动
const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '数据验证失败',
        details: errors.array()
      });
    }

    const activity = await Activity.findById(id);
    
    if (!activity) {
      return res.status(404).json({
        error: '活动不存在',
        message: '未找到指定的活动'
      });
    }

    // 检查权限：只有组织者或管理员可以编辑
    if (activity.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: '权限不足',
        message: '您只能编辑自己创建的活动'
      });
    }

    const updatedActivity = await Activity.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('organizer', 'username avatar');

    res.json({
      message: '活动更新成功',
      activity: updatedActivity
    });
  } catch (error) {
    console.error('更新活动错误:', error);
    res.status(500).json({
      error: '更新活动失败',
      message: '请稍后重试'
    });
  }
};

// 删除活动
const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;

    const activity = await Activity.findById(id);
    
    if (!activity) {
      return res.status(404).json({
        error: '活动不存在',
        message: '未找到指定的活动'
      });
    }

    // 检查权限：只有组织者或管理员可以删除
    if (activity.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        error: '权限不足',
        message: '您只能删除自己创建的活动'
      });
    }

    // 检查是否有用户已报名
    const registrationCount = await Registration.countDocuments({
      activity: id,
      status: { $nin: ['cancelled'] }
    });

    // 如果有报名且不是超级管理员强制删除，则阻止删除
    if (registrationCount > 0 && !(req.user.role === 'superadmin' && force === 'true')) {
      return res.status(400).json({
        error: '无法删除活动',
        message: req.user.role === 'superadmin' 
          ? '该活动已有用户报名，请使用强制删除选项' 
          : '该活动已有用户报名，无法删除'
      });
    }

    // 如果是超级管理员强制删除，同时删除所有相关的报名记录
    if (req.user.role === 'superadmin' && force === 'true' && registrationCount > 0) {
      await Registration.deleteMany({ activity: id });
    }

    await Activity.findByIdAndDelete(id);

    res.json({
      message: registrationCount > 0 
        ? '活动及相关报名记录已强制删除' 
        : '活动删除成功'
    });
  } catch (error) {
    console.error('删除活动错误:', error);
    res.status(500).json({
      error: '删除活动失败',
      message: '请稍后重试'
    });
  }
};

// 获取活动分类
const getCategories = async (req, res) => {
  try {
    const categories = await Activity.distinct('category');
    res.json({ categories });
  } catch (error) {
    console.error('获取活动分类错误:', error);
    res.status(500).json({
      error: '获取活动分类失败',
      message: '请稍后重试'
    });
  }
};

// 获取推荐活动
const getRecommendedActivities = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const activities = await Activity.find({
      status: 'published',
      approvalStatus: 'approved',
      startTime: { $gt: new Date() }
    })
    .populate('organizer', 'username avatar')
    .sort({ isFeatured: -1, viewCount: -1, startTime: 1 })
    .limit(parseInt(limit))
    .lean();

    res.json({ activities });
  } catch (error) {
    console.error('获取推荐活动错误:', error);
    res.status(500).json({
      error: '获取推荐活动失败',
      message: '请稍后重试'
    });
  }
};

// 搜索活动
const searchActivities = async (req, res) => {
  try {
    const { q, category, startDate, endDate, maxPrice } = req.query;

    const query = { 
      status: 'published',
      approvalStatus: 'approved'
    };

    if (q) {
      query.$text = { $search: q };
    }

    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    if (maxPrice) {
      query.price = { $lte: parseFloat(maxPrice) };
    }

    const activities = await Activity.find(query)
      .populate('organizer', 'username avatar')
      .sort({ startTime: 1 })
      .lean();

    res.json({ activities });
  } catch (error) {
    console.error('搜索活动错误:', error);
    res.status(500).json({
      error: '搜索活动失败',
      message: '请稍后重试'
    });
  }
};

// 获取活动统计
const getStats = async (req, res) => {
  try {
    const [totalActivities, totalUsers, totalRegistrations] = await Promise.all([
      Activity.countDocuments({ status: 'published', approvalStatus: 'approved' }),
      require('../models/User').countDocuments({ isActive: true }),
      Registration.countDocuments({ status: 'confirmed' })
    ]);

    res.json({
      totalActivities,
      totalUsers,
      totalRegistrations
    });
  } catch (error) {
    console.error('获取活动统计错误:', error);
    res.status(500).json({
      error: '获取活动统计失败',
      message: '请稍后重试'
    });
  }
};

// 获取待审核活动列表
const getPendingActivities = async (req, res) => {
  try {
    // 只有管理员可以访问此接口
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: '权限不足',
        message: '只有管理员可以访问此接口'
      });
    }

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // 构建查询条件
    const query = { 
      approvalStatus: 'pending'
    };

    // 构建排序条件
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 执行查询
    const activities = await Activity.find(query)
      .populate('organizer', 'username avatar email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // 获取总数
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
    console.error('获取待审核活动列表错误:', error);
    res.status(500).json({
      error: '获取待审核活动列表失败',
      message: '请稍后重试'
    });
  }
};

// 审核活动
const approveActivity = async (req, res) => {
  try {
    // 只有管理员可以访问此接口
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: '权限不足',
        message: '只有管理员可以审核活动'
      });
    }

    const { id } = req.params;
    
    const activity = await Activity.findById(id);
    
    if (!activity) {
      return res.status(404).json({
        error: '活动不存在',
        message: '未找到指定的活动'
      });
    }

    // 更新活动状态
    activity.approvalStatus = 'approved';
    activity.status = 'published';
    await activity.save();

    res.json({
      message: '活动审核通过',
      activity
    });
  } catch (error) {
    console.error('审核活动错误:', error);
    res.status(500).json({
      error: '审核活动失败',
      message: '请稍后重试'
    });
  }
};

// 获取用户创建的活动
const getUserActivities = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // 构建查询条件 - 只查询当前用户创建的活动
    const query = { 
      organizer: req.user._id
    };

    // 构建排序条件
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 执行查询
    const activities = await Activity.find(query)
      .populate('organizer', 'username avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // 获取总数
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
    console.error('获取用户创建的活动错误:', error);
    res.status(500).json({
      error: '获取用户创建的活动失败',
      message: '请稍后重试'
    });
  }
};

// 拒绝活动
const rejectActivity = async (req, res) => {
  try {
    // 只有管理员可以访问此接口
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: '权限不足',
        message: '只有管理员可以拒绝活动'
      });
    }

    const { id } = req.params;
    const { reason } = req.body;
    
    const activity = await Activity.findById(id);
    
    if (!activity) {
      return res.status(404).json({
        error: '活动不存在',
        message: '未找到指定的活动'
      });
    }

    // 更新活动状态
    activity.approvalStatus = 'rejected';
    activity.rejectionReason = reason || '未通过审核';
    await activity.save();

    res.json({
      message: '已拒绝活动',
      activity
    });
  } catch (error) {
    console.error('拒绝活动错误:', error);
    res.status(500).json({
      error: '拒绝活动失败',
      message: '请稍后重试'
    });
  }
};

module.exports = {
  getActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  getCategories,
  getRecommendedActivities,
  searchActivities,
  getStats,
  getUserActivities,
  getPendingActivities,
  approveActivity,
  rejectActivity
};
