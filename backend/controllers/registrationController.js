


const Registration = require('../models/Registration');
const Activity = require('../models/Activity');
const { validationResult } = require('express-validator');

// 用户报名活动
const registerActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
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
        message: '您的账号已被封禁，无法参与活动。如需解封，请联系管理员：admin@sportsroom.com'
      });
    }

    // 检查活动是否存在
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({
        error: '活动不存在',
        message: '未找到指定的活动'
      });
    }

    // 检查活动状态
    if (activity.status !== 'published') {
      return res.status(400).json({
        error: '活动未开放报名',
        message: '该活动暂未开放报名'
      });
    }

    // 检查活动是否已开始
    // 使用与hasStarted虚拟字段相同的逻辑
    const now = new Date();
    const bufferTime = new Date(activity.startTime);
    bufferTime.setMinutes(bufferTime.getMinutes() - 1);
    if (now >= bufferTime) {
      return res.status(400).json({
        error: '活动已开始',
        message: '活动已开始，无法报名'
      });
    }

    // 检查是否已报名
    const existingRegistration = await Registration.findOne({
      user: req.user._id,
      activity: activityId,
      status: { $nin: ['cancelled'] }
    });

    if (existingRegistration) {
      return res.status(400).json({
        error: '已报名',
        message: '您已经报名了此活动'
      });
    }

    // 检查名额
    const confirmedRegistrations = await Registration.countDocuments({
      activity: activityId,
      status: 'confirmed'
    });

    let status = 'confirmed';
    if (confirmedRegistrations >= activity.maxParticipants) {
      status = 'waitlist';
    }

    // 创建报名记录
    const registration = new Registration({
      user: req.user._id,
      activity: activityId,
      status,
      paymentAmount: activity.price,
      notes: req.body.notes || ''
    });

    await registration.save();

    // 更新活动当前参与人数
    if (status === 'confirmed') {
      await Activity.findByIdAndUpdate(activityId, {
        $inc: { currentParticipants: 1 }
      });
    }

    const populatedRegistration = await Registration.findById(registration._id)
      .populate('user', 'username avatar')
      .populate('activity', 'title startTime location');

    res.status(201).json({
      message: status === 'confirmed' ? '报名成功' : '已加入等待队列',
      registration: populatedRegistration
    });
  } catch (error) {
    console.error('报名活动错误:', error);
    res.status(500).json({
      error: '报名失败',
      message: '请稍后重试'
    });
  }
};

// 取消报名
const cancelRegistration = async (req, res) => {
  try {
    const { activityId } = req.params;

    // 查找报名记录
    const registration = await Registration.findOne({
      user: req.user._id,
      activity: activityId,
      status: { $nin: ['cancelled'] }
    });

    if (!registration) {
      return res.status(404).json({
        error: '报名记录不存在',
        message: '未找到您的报名记录'
      });
    }

    // 检查活动是否已开始
    const activity = await Activity.findById(activityId);
    // 使用与hasStarted虚拟字段相同的逻辑
    const now = new Date();
    const bufferTime = new Date(activity.startTime);
    bufferTime.setMinutes(bufferTime.getMinutes() - 1);
    if (now >= bufferTime) {
      return res.status(400).json({
        error: '活动已开始',
        message: '活动已开始，无法取消报名'
      });
    }

    // 取消报名
    registration.status = 'cancelled';
    registration.cancelledBy = 'user';
    registration.cancelledAt = new Date();
    registration.cancellationReason = req.body.reason || '用户主动取消';
    
    await registration.save();

    // 更新活动参与人数
    if (registration.status === 'confirmed') {
      await Activity.findByIdAndUpdate(activityId, {
        $inc: { currentParticipants: -1 }
      });
    }

    // 如果有等待队列，将第一个用户转为确认状态
    if (registration.status === 'confirmed') {
      const nextInWaitlist = await Registration.findOne({
        activity: activityId,
        status: 'waitlist'
      }).sort({ registrationTime: 1 });

      if (nextInWaitlist) {
        nextInWaitlist.status = 'confirmed';
        await nextInWaitlist.save();
        
        await Activity.findByIdAndUpdate(activityId, {
          $inc: { currentParticipants: 1 }
        });
      }
    }

    res.json({
      message: '取消报名成功'
    });
  } catch (error) {
    console.error('取消报名错误:', error);
    res.status(500).json({
      error: '取消报名失败',
      message: '请稍后重试'
    });
  }
};

// 获取用户报名记录
const getUserRegistrations = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { user: req.user._id };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const registrations = await Registration.find(query)
      .populate('activity', 'title startTime endTime location category images')
      .populate('user', 'username avatar')
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

// 获取活动报名列表（管理员）
const getActivityRegistrations = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    // 检查权限
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({
        error: '活动不存在',
        message: '未找到指定的活动'
      });
    }

    if (activity.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: '权限不足',
        message: '您只能查看自己创建活动的报名列表'
      });
    }

    const query = { activity: activityId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const registrations = await Registration.find(query)
      .populate('user', 'username email phone avatar')
      .sort({ registrationTime: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Registration.countDocuments(query);

    // 统计各状态数量
    const statusCounts = await Registration.aggregate([
      { $match: { activity: activity._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      registrations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      statusCounts
    });
  } catch (error) {
    console.error('获取活动报名列表错误:', error);
    res.status(500).json({
      error: '获取报名列表失败',
      message: '请稍后重试'
    });
  }
};

// 管理员取消用户报名
const adminCancelRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findById(registrationId)
      .populate('activity');

    if (!registration) {
      return res.status(404).json({
        error: '报名记录不存在',
        message: '未找到指定的报名记录'
      });
    }

    // 检查权限
    if (registration.activity.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: '权限不足',
        message: '您只能取消自己创建活动的报名'
      });
    }

    // 取消报名
    registration.status = 'cancelled';
    registration.cancelledBy = 'admin';
    registration.cancelledAt = new Date();
    registration.cancellationReason = req.body.reason || '管理员取消';
    
    await registration.save();

    // 更新活动参与人数
    if (registration.status === 'confirmed') {
      await Activity.findByIdAndUpdate(registration.activity._id, {
        $inc: { currentParticipants: -1 }
      });
    }

    res.json({
      message: '取消报名成功'
    });
  } catch (error) {
    console.error('管理员取消报名错误:', error);
    res.status(500).json({
      error: '取消报名失败',
      message: '请稍后重试'
    });
  }
};

// 确认用户报名（从等待队列转为确认）
const confirmRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findById(registrationId)
      .populate('activity');

    if (!registration) {
      return res.status(404).json({
        error: '报名记录不存在',
        message: '未找到指定的报名记录'
      });
    }

    // 检查权限
    if (registration.activity.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: '权限不足',
        message: '您只能确认自己创建活动的报名'
      });
    }

    if (registration.status !== 'waitlist') {
      return res.status(400).json({
        error: '状态错误',
        message: '只能确认等待队列中的报名'
      });
    }

    // 检查是否还有名额
    const confirmedCount = await Registration.countDocuments({
      activity: registration.activity._id,
      status: 'confirmed'
    });

    if (confirmedCount >= registration.activity.maxParticipants) {
      return res.status(400).json({
        error: '名额已满',
        message: '活动名额已满，无法确认报名'
      });
    }

    // 确认报名
    registration.status = 'confirmed';
    await registration.save();

    // 更新活动参与人数
    await Activity.findByIdAndUpdate(registration.activity._id, {
      $inc: { currentParticipants: 1 }
    });

    res.json({
      message: '确认报名成功'
    });
  } catch (error) {
    console.error('确认报名错误:', error);
    res.status(500).json({
      error: '确认报名失败',
      message: '请稍后重试'
    });
  }
};

module.exports = {
  registerActivity,
  cancelRegistration,
  getUserRegistrations,
  getActivityRegistrations,
  adminCancelRegistration,
  confirmRegistration
};
