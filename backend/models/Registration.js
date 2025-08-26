const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'waitlist'],
    default: 'pending'
  },
  registrationTime: {
    type: Date,
    default: Date.now
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid'
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    maxlength: [500, '备注最多500个字符']
  },
  isAttended: {
    type: Boolean,
    default: false
  },
  attendedTime: {
    type: Date
  },
  cancellationReason: {
    type: String,
    maxlength: [200, '取消原因最多200个字符']
  },
  cancelledBy: {
    type: String,
    enum: ['user', 'admin', 'system'],
    default: 'user'
  },
  cancelledAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：是否已过期（活动开始后24小时）
registrationSchema.virtual('isExpired').get(function() {
  const activity = this.populated('activity') || this.activity;
  if (!activity || !activity.startTime) return false;
  
  const expirationTime = new Date(activity.startTime.getTime() + 24 * 60 * 60 * 1000);
  return new Date() > expirationTime;
});

// 中间件：确保用户不能重复报名同一活动
registrationSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existingRegistration = await this.constructor.findOne({
      user: this.user,
      activity: this.activity,
      status: { $nin: ['cancelled'] }
    });
    
    if (existingRegistration) {
      return next(new Error('您已经报名了此活动'));
    }
  }
  next();
});

// 中间件：更新活动的当前参与人数
registrationSchema.post('save', async function() {
  const Activity = mongoose.model('Activity');
  const activity = await Activity.findById(this.activity);
  
  if (activity) {
    const confirmedCount = await this.constructor.countDocuments({
      activity: this.activity,
      status: 'confirmed'
    });
    
    activity.currentParticipants = confirmedCount;
    await activity.save();
  }
});

// 中间件：取消报名时更新活动参与人数
registrationSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && doc.activity) {
    const Activity = mongoose.model('Activity');
    const activity = await Activity.findById(doc.activity);
    
    if (activity) {
      const confirmedCount = await this.model.countDocuments({
        activity: doc.activity,
        status: 'confirmed'
      });
      
      activity.currentParticipants = confirmedCount;
      await activity.save();
    }
  }
});

// 索引
registrationSchema.index({ user: 1, activity: 1 }, { unique: true });
registrationSchema.index({ activity: 1, status: 1 });
registrationSchema.index({ user: 1, status: 1 });
registrationSchema.index({ registrationTime: 1 });

module.exports = mongoose.model('Registration', registrationSchema);