/**
 * 重置数据库：删除除了超级管理员以外的所有用户账号，并清理相关数据
 * 运行方法: node backend/scripts/reset-database.js
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

async function resetDatabase() {
  try {
    console.log('=== 开始重置数据库 ===');
    console.log('步骤1: 查找超级管理员账号');
    
    // 查找超级管理员账号
    let adminUser = await User.findOne({ email: 'admin@sportsroom.com' });
    
    if (!adminUser) {
      console.log('未找到超级管理员账号，将创建一个新的超级管理员账号');
      
      // 创建超级管理员账号
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      adminUser = new User({
        username: 'admin',
        email: 'admin@sportsroom.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        bio: '系统超级管理员'
      });
      
      await adminUser.save();
      console.log('超级管理员账号已创建');
      console.log('- 用户名: admin');
      console.log('- 邮箱: admin@sportsroom.com');
      console.log('- 密码: admin123 (请登录后立即修改此密码)');
    }
    
    console.log(`找到超级管理员账号: ${adminUser.username} (${adminUser.email})`);
    
    console.log('\n步骤2: 删除除了超级管理员以外的所有用户');
    // 删除除了超级管理员以外的所有用户
    const deletedUsers = await User.deleteMany({ 
      email: { $ne: 'admin@sportsroom.com' } 
    });
    
    console.log(`成功删除 ${deletedUsers.deletedCount} 个用户账号`);
    
    // 确保超级管理员有正确的角色和状态
    if (adminUser.role !== 'admin' || !adminUser.isActive) {
      adminUser.role = 'admin';
      adminUser.isActive = true;
      await adminUser.save();
      console.log('已更新超级管理员账号状态');
    }
    
    console.log('\n步骤3: 清理相关数据');
    
    // 1. 删除非管理员用户创建的活动
    const deletedActivities = await Activity.deleteMany({
      organizer: { $ne: adminUser._id }
    });
    console.log(`- 已删除 ${deletedActivities.deletedCount} 个非管理员创建的活动`);
    
    // 2. 删除所有报名记录
    const deletedRegistrations = await Registration.deleteMany({});
    console.log(`- 已删除 ${deletedRegistrations.deletedCount} 条报名记录`);
    
    // 3. 删除所有评论
    const deletedComments = await Comment.deleteMany({});
    console.log(`- 已删除 ${deletedComments.deletedCount} 条评论`);
    
    // 4. 重置管理员创建的活动的参与人数
    await Activity.updateMany(
      { organizer: adminUser._id },
      { $set: { currentParticipants: 0 } }
    );
    console.log('- 已重置管理员活动的参与人数');
    
    console.log('\n=== 数据库重置完成 ===');
    console.log('现在系统中只保留了超级管理员账号，所有其他用户和相关数据已被删除');
    process.exit(0);
  } catch (error) {
    console.error('重置数据库时出错:', error);
    process.exit(1);
  }
}

// 添加确认提示
console.log('\x1b[31m警告: 此操作将删除除了超级管理员以外的所有用户和相关数据，此操作不可逆！\x1b[0m');
console.log('如果确定要继续，请在5秒内按下Ctrl+C取消操作');

// 5秒后执行重置操作
setTimeout(() => {
  console.log('开始执行重置操作...');
  resetDatabase();
}, 5000);
