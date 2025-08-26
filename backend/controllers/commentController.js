const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

// 获取活动评论列表
const getActivityComments = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', _t } = req.query;

    console.log(`获取活动评论，活动ID: ${activityId}, 时间戳: ${_t || 'none'}`);

    // 检查活动是否存在
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({
        error: '活动不存在',
        message: '未找到指定的活动'
      });
    }

    // 直接使用原始查询，不依赖中间件
    const query = { 
      activity: activityId,
      parentComment: null, // 只获取主评论，不包含回复
      isDeleted: { $ne: true } // 明确排除已删除的评论
    };
    
    console.log('查询评论，活动ID:', activityId);
    console.log('查询评论，条件:', JSON.stringify(query));

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 使用原始MongoDB查询，绕过Mongoose中间件
    const db = mongoose.connection.db;
    const commentsCollection = db.collection('comments');
    
    // 执行原始查询
    const rawComments = await commentsCollection.find({
      activity: new mongoose.Types.ObjectId(activityId),
      parentComment: null,
      isDeleted: { $ne: true }
    }).sort(sort).skip(skip).limit(parseInt(limit)).toArray();
    
    console.log(`原始查询找到 ${rawComments.length} 条评论`);
    
    // 手动填充用户信息
    const userIds = rawComments.map(c => c.user);
    const users = await mongoose.connection.db.collection('users')
      .find({ _id: { $in: userIds } })
      .project({ username: 1, avatar: 1 })
      .toArray();
    
    const usersMap = {};
    users.forEach(u => {
      usersMap[u._id.toString()] = { username: u.username, avatar: u.avatar };
    });
    
    // 处理评论数据
    const comments = rawComments.map(c => {
      const comment = {
        ...c,
        user: usersMap[c.user.toString()] || { username: 'Unknown', avatar: null },
        likeCount: c.likes ? c.likes.length : 0,
        hasLiked: req.user ? (c.likes || []).some(like => like.toString() === req.user._id.toString()) : false
      };
      return comment;
    });
    
    console.log(`处理后返回 ${comments.length} 条评论`);

    // 为每个评论添加用户点赞状态
    if (req.user) {
      for (let comment of comments) {
        comment.hasLiked = comment.likes.some(like => like.toString() === req.user._id.toString());
        comment.likeCount = comment.likes.length;
        
        // 处理回复
        if (comment.replies) {
          for (let reply of comment.replies) {
            reply.hasLiked = reply.likes.some(like => like.toString() === req.user._id.toString());
            reply.likeCount = reply.likes.length;
          }
        }
      }
    }

    const total = await Comment.countDocuments(query);

    res.json({
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取评论列表错误:', error);
    res.status(500).json({
      error: '获取评论失败',
      message: '请稍后重试'
    });
  }
};

// 发表评论
const createComment = async (req, res) => {
  try {
    const { activityId } = req.params;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '数据验证失败',
        details: errors.array()
      });
    }

    // 检查用户是否被封禁
    if (req.user.isBanned) {
      return res.status(403).json({
        error: '账号已被封禁',
        message: req.user.banReason ? `您的账号已被封禁，原因：${req.user.banReason}` : '您的账号已被封禁，无法发表评论'
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
        error: '活动未开放',
        message: '该活动暂未开放评论'
      });
    }

    const commentData = {
      user: req.user._id,
      activity: activityId,
      content: req.body.content,
      rating: req.body.rating || 5,
      parentComment: req.body.parentComment || null
    };

    // 如果是回复，检查父评论是否存在
    if (commentData.parentComment) {
      const parentComment = await Comment.findById(commentData.parentComment);
      if (!parentComment) {
        return res.status(404).json({
          error: '父评论不存在',
          message: '回复的评论不存在'
        });
      }
    }

    console.log('创建评论，数据:', JSON.stringify(commentData));
    
    const comment = new Comment(commentData);
    await comment.save();
    
    console.log('评论已保存，ID:', comment._id);

    // 确保评论已正确保存，并使用lean()获取纯JavaScript对象
    const savedComment = await Comment.findById(comment._id).lean();
    if (!savedComment) {
      console.error('评论保存失败，无法找到刚创建的评论');
      return res.status(500).json({
        error: '评论保存失败',
        message: '请稍后重试'
      });
    }

    // 使用lean()获取纯JavaScript对象，避免Mongoose文档对象的问题
    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'username avatar')
      .populate('parentComment', 'content')
      .lean();

    console.log('返回填充后的评论:', populatedComment ? '成功' : '失败');
    console.log('评论ID:', populatedComment?._id);

    res.status(201).json({
      message: '评论发表成功',
      comment: populatedComment
    });
  } catch (error) {
    console.error('发表评论错误:', error);
    res.status(500).json({
      error: '发表评论失败',
      message: '请稍后重试'
    });
  }
};

// 更新评论
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '数据验证失败',
        details: errors.array()
      });
    }

    // 检查用户是否被封禁
    if (req.user.isBanned) {
      return res.status(403).json({
        error: '账号已被封禁',
        message: req.user.banReason ? `您的账号已被封禁，原因：${req.user.banReason}` : '您的账号已被封禁，无法更新评论'
      });
    }

    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({
        error: '评论不存在',
        message: '未找到指定的评论'
      });
    }

    // 检查权限：只有评论作者或管理员可以编辑
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: '权限不足',
        message: '您只能编辑自己的评论'
      });
    }

    // 更新评论
    comment.content = req.body.content;
    comment.rating = req.body.rating || comment.rating;
    comment.isEdited = true;
    comment.editedAt = new Date();

    await comment.save();

    const updatedComment = await Comment.findById(commentId)
      .populate('user', 'username avatar');

    res.json({
      message: '评论更新成功',
      comment: updatedComment
    });
  } catch (error) {
    console.error('更新评论错误:', error);
    res.status(500).json({
      error: '更新评论失败',
      message: '请稍后重试'
    });
  }
};

// 删除评论
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    // 检查用户是否被封禁
    if (req.user.isBanned) {
      return res.status(403).json({
        error: '账号已被封禁',
        message: req.user.banReason ? `您的账号已被封禁，原因：${req.user.banReason}` : '您的账号已被封禁，无法删除评论'
      });
    }

    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({
        error: '评论不存在',
        message: '未找到指定的评论'
      });
    }

    // 检查权限：只有评论作者或管理员可以删除
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: '权限不足',
        message: '您只能删除自己的评论'
      });
    }

    // 软删除评论
    await comment.softDelete(req.user.role === 'admin' ? 'admin' : 'user');

    res.json({
      message: '评论删除成功'
    });
  } catch (error) {
    console.error('删除评论错误:', error);
    res.status(500).json({
      error: '删除评论失败',
      message: '请稍后重试'
    });
  }
};

// 点赞/取消点赞评论
const toggleCommentLike = async (req, res) => {
  try {
    const { commentId } = req.params;

    // 检查用户是否被封禁
    if (req.user.isBanned) {
      return res.status(403).json({
        error: '账号已被封禁',
        message: req.user.banReason ? `您的账号已被封禁，原因：${req.user.banReason}` : '您的账号已被封禁，无法点赞评论'
      });
    }

    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({
        error: '评论不存在',
        message: '未找到指定的评论'
      });
    }

    const hasLiked = comment.likes.some(like => like.toString() === req.user._id.toString());

    if (hasLiked) {
      // 取消点赞
      await comment.removeLike(req.user._id);
      res.json({
        message: '取消点赞成功',
        liked: false,
        likeCount: comment.likes.length - 1
      });
    } else {
      // 添加点赞
      await comment.addLike(req.user._id);
      res.json({
        message: '点赞成功',
        liked: true,
        likeCount: comment.likes.length + 1
      });
    }
  } catch (error) {
    console.error('点赞评论错误:', error);
    res.status(500).json({
      error: '操作失败',
      message: '请稍后重试'
    });
  }
};

// 获取用户评论列表
const getUserComments = async (req, res) => {
  try {
    const { page = 1, limit = 20, _t } = req.query;
    
    console.log(`获取用户评论，用户ID: ${req.user._id}, 时间戳: ${_t || 'none'}`);
    
    // 明确排除已删除的评论
    const userId = req.user._id;
    console.log('用户ID:', userId);
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 使用原始MongoDB查询，绕过Mongoose中间件
    const db = mongoose.connection.db;
    const commentsCollection = db.collection('comments');
    
    // 执行原始查询
    const rawComments = await commentsCollection.find({
      user: new mongoose.Types.ObjectId(userId),
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).toArray();
    
    console.log(`原始查询找到 ${rawComments.length} 条用户评论`);
    
    // 手动填充活动信息
    const activityIds = rawComments.map(c => c.activity).filter(Boolean);
    const activities = await mongoose.connection.db.collection('activities')
      .find({ _id: { $in: activityIds } })
      .project({ title: 1, startTime: 1, location: 1 })
      .toArray();
    
    const activitiesMap = {};
    activities.forEach(a => {
      activitiesMap[a._id.toString()] = { 
        title: a.title, 
        startTime: a.startTime, 
        location: a.location 
      };
    });
    
    // 处理评论数据
    const comments = rawComments.map(c => {
      const comment = {
        ...c,
        activity: c.activity ? activitiesMap[c.activity.toString()] || null : null
      };
      return comment;
    });
    
    console.log(`处理后返回 ${comments.length} 条用户评论`);
    
    // 记录评论ID，便于调试
    if (comments.length > 0) {
      console.log('评论ID列表:', comments.map(c => c._id));
    }

    const total = await commentsCollection.countDocuments({
      user: new mongoose.Types.ObjectId(userId),
      isDeleted: { $ne: true }
    });

    res.json({
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取用户评论错误:', error);
    res.status(500).json({
      error: '获取评论失败',
      message: '请稍后重试'
    });
  }
};

// 获取评论统计
const getCommentStats = async (req, res) => {
  try {
    const { activityId } = req.params;

    const stats = await Comment.aggregate([
      { $match: { activity: activityId } },
      {
        $group: {
          _id: null,
          totalComments: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          totalLikes: { $sum: { $size: '$likes' } }
        }
      }
    ]);

    const ratingDistribution = await Comment.aggregate([
      { $match: { activity: activityId } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      stats: stats[0] || { totalComments: 0, avgRating: 0, totalLikes: 0 },
      ratingDistribution
    });
  } catch (error) {
    console.error('获取评论统计错误:', error);
    res.status(500).json({
      error: '获取统计失败',
      message: '请稍后重试'
    });
  }
};

module.exports = {
  getActivityComments,
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
  getUserComments,
  getCommentStats
};
