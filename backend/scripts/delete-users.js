/**
 * 删除除了超级管理员以外的所有用户账号
 * 运行方法: node backend/scripts/delete-users.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

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

async function deleteUsers() {
  try {
    console.log('开始删除用户...');
    
    // 查找超级管理员账号
    const adminUser = await User.findOne({ email: 'admin@sportsroom.com' });
    
    if (!adminUser) {
      console.error('错误: 未找到超级管理员账号');
      process.exit(1);
    }
    
    console.log(`找到超级管理员账号: ${adminUser.username} (${adminUser.email})`);
    
    // 删除除了超级管理员以外的所有用户
    const result = await User.deleteMany({ 
      email: { $ne: 'admin@sportsroom.com' } 
    });
    
    console.log(`成功删除 ${result.deletedCount} 个用户账号`);
    console.log('只保留了超级管理员账号');
    
    // 确保超级管理员有正确的角色和状态
    if (adminUser.role !== 'admin' || !adminUser.isActive) {
      adminUser.role = 'admin';
      adminUser.isActive = true;
      await adminUser.save();
      console.log('已更新超级管理员账号状态');
    }
    
    console.log('操作完成');
    process.exit(0);
  } catch (error) {
    console.error('删除用户时出错:', error);
    process.exit(1);
  }
}

deleteUsers();
