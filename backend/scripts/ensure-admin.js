/**
 * 确保超级管理员账号存在
 * 如果不存在，则创建一个超级管理员账号
 * 运行方法: node backend/scripts/ensure-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// 超级管理员账号信息
const ADMIN_EMAIL = 'admin@sportsroom.com';
const ADMIN_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin123'; // 默认密码，建议创建后立即修改

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

async function ensureAdminExists() {
  try {
    console.log('检查超级管理员账号是否存在...');
    
    // 查找超级管理员账号
    let adminUser = await User.findOne({ email: ADMIN_EMAIL });
    
    if (adminUser) {
      console.log('超级管理员账号已存在');
      
      // 确保账号状态正确
      if (adminUser.role !== 'admin' || !adminUser.isActive) {
        console.log('更新超级管理员账号状态...');
        adminUser.role = 'admin';
        adminUser.isActive = true;
        await adminUser.save();
        console.log('超级管理员账号状态已更新');
      }
    } else {
      console.log('超级管理员账号不存在，正在创建...');
      
      // 创建超级管理员账号
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);
      
      adminUser = new User({
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        bio: '系统超级管理员'
      });
      
      await adminUser.save();
      console.log(`超级管理员账号已创建`);
      console.log(`- 用户名: ${ADMIN_USERNAME}`);
      console.log(`- 邮箱: ${ADMIN_EMAIL}`);
      console.log(`- 密码: ${DEFAULT_PASSWORD} (请登录后立即修改此密码)`);
    }
    
    console.log('操作完成');
    process.exit(0);
  } catch (error) {
    console.error('确保超级管理员账号存在时出错:', error);
    process.exit(1);
  }
}

ensureAdminExists();
