const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '活动标题不能为空'],
    trim: true,
    maxlength: [100, '活动标题最多100个字符']
  },
  description: {
    type: String,
    required: [true, '活动描述不能为空'],
    maxlength: [2000, '活动描述最多2000个字符']
  },
  category: {
    type: String,
    required: [true, '活动分类不能为空'],
    enum: ['篮球', '足球', '羽毛球', '乒乓球', '游泳', '跑步', '健身', '瑜伽', '其他']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, '标签最多20个字符']
  }],
  location: {
    type: String,
    required: [true, '活动地点不能为空'],
    maxlength: [200, '活动地点最多200个字符']
  },
  startTime: {
    type: Date,
    required: [true, '开始时间不能为空']
  },
  endTime: {
    type: Date,
    required: [true, '结束时间不能为空']
  },
  maxParticipants: {
    type: Number,
    required: [true, '最大参与人数不能为空'],
    min: [1, '最大参与人数至少为1'],
    max: [1000, '最大参与人数不能超过1000']
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    default: 0,
    min: [0, '价格不能为负数']
  },
  images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['draft', 'pending', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requirements: {
    type: String,
    maxlength: [500, '活动要求最多500个字符']
  },
  equipment: {
    type: String,
    maxlength: [500, '装备要求最多500个字符']
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：活动是否已满
activitySchema.virtual('isFull').get(function() {
  return this.currentParticipants >= this.maxParticipants;
});

// 虚拟字段：活动是否已开始
activitySchema.virtual('hasStarted').get(function() {
  // 添加1分钟的缓冲时间，避免前后端时间微小差异导致的判断不一致
  const now = new Date();
  const bufferTime = new Date(this.startTime);
  bufferTime.setMinutes(bufferTime.getMinutes() - 1);
  return now >= bufferTime;
});

// 虚拟字段：活动是否已结束
activitySchema.virtual('hasEnded').get(function() {
  return new Date() >= this.endTime;
});

// 虚拟字段：剩余名额
activitySchema.virtual('remainingSpots').get(function() {
  return Math.max(0, this.maxParticipants - this.currentParticipants);
});

// 虚拟字段：报名进度百分比
activitySchema.virtual('progressPercentage').get(function() {
  return Math.round((this.currentParticipants / this.maxParticipants) * 100);
});

// 中间件：验证结束时间晚于开始时间
activitySchema.pre('save', function(next) {
  if (this.endTime <= this.startTime) {
    return next(new Error('结束时间必须晚于开始时间'));
  }
  next();
});

// 索引
activitySchema.index({ title: 'text', description: 'text', tags: 'text' });
activitySchema.index({ category: 1 });
activitySchema.index({ status: 1 });
activitySchema.index({ startTime: 1 });
activitySchema.index({ organizer: 1 });
activitySchema.index({ isFeatured: 1 });

module.exports = mongoose.model('Activity', activitySchema);
