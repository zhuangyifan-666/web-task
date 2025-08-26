/**
 * 清理与已删除用户相关的数据
 * 运行方法: node backend/scripts/cleanup-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Registration = require('../models/Registration');
const Comment = require('../models/Comment');

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_room', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('数据库连接成功'))
  .catch(err => {
    console.error('数据库连接失败:', err);
    process.exit(1);
  });

async function cleanupData() {
  try {
    console.log('开始清理数据...');
    
    // 获取超级管理员ID
    const adminUser = await User.findOne({ email: 'admin@sportsroom.com' });
    
    if (!adminUser) {
      console.error('错误: 未找到超级管理员账号');
      process.exit(1);
    }
    
    // 1. 删除非管理员用户创建的活动
    const deletedActivities = await Activity.deleteMany({
      organizer: { $ne: adminUser._id }
    });
    console.log(`已删除 ${deletedActivities.deletedCount} 个非管理员创建的活动`);
    
    // 2. 删除所有报名记录
    const deletedRegistrations = await Registration.deleteMany({});
    console.log(`已删除 ${deletedRegistrations.deletedCount} 条报名记录`);
    
    // 3. 删除所有评论
    const deletedComments = await Comment.deleteMany({});
    console.log(`已删除 ${deletedComments.deletedCount} 条评论`);
    
    // 4. 重置管理员创建的活动的参与人数
    await Activity.updateMany(
      { organizer: adminUser._id },
      { $set: { currentParticipants: 0 } }
    );
    console.log('已重置管理员活动的参与人数');
    
    console.log('数据清理完成');
    process.exit(0);
  } catch (error) {
    console.error('清理数据时出错:', error);
    process.exit(1);
  }
}

cleanupData();
