const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
  },
  content: {
    type: String,
    required: [true, '评论内容不能为空'],
    trim: true,
    maxlength: [1000, '评论内容最多1000个字符']
  },
  rating: {
    type: Number,
    min: [1, '评分最低为1'],
    max: [5, '评分最高为5'],
    default: 5
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：点赞数量
commentSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// 虚拟字段：回复数量
commentSchema.virtual('replyCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
  count: true
});

// 中间件：软删除
commentSchema.methods.softDelete = function(deletedBy = 'user') {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

// 中间件：恢复删除
commentSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  return this.save();
};

// 中间件：添加点赞
commentSchema.methods.addLike = function(userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// 中间件：移除点赞
commentSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(id => !id.equals(userId));
  return this.save();
};

// 中间件：检查用户是否已点赞
commentSchema.methods.hasLiked = function(userId) {
  return this.likes.some(id => id.equals(userId));
};

// 查询中间件：默认不显示已删除的评论
commentSchema.pre(/^find/, function(next) {
  // 记录查询条件
  console.log('Comment查询中间件执行，原始查询:', JSON.stringify(this.getQuery()));
  
  // 如果查询条件中已经明确指定了isDeleted，则不修改查询
  if (this.getQuery().isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
    console.log('添加isDeleted条件后的查询:', JSON.stringify(this.getQuery()));
  }
  
  next();
});

// 索引
commentSchema.index({ activity: 1, createdAt: -1 });
commentSchema.index({ user: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Comment', commentSchema);
