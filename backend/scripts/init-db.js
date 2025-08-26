
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Activity = require('../models/Activity');

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_room', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 检查是否需要重置用户
const args = process.argv.slice(2);
const resetUsers = args.includes('--reset-users');

const initDatabase = async () => {
  try {
    console.log('开始初始化数据库...');

    // 创建管理员用户
    if (resetUsers) {
      await User.deleteOne({ email: 'admin@sportsroom.com' });
      console.log('🗑️ 已删除现有管理员用户');
    }
    
    const adminExists = await User.findOne({ email: 'admin@sportsroom.com' });
    if (!adminExists) {
      // 让User模型的pre-save中间件处理密码哈希
      const adminUser = new User({
        username: 'admin',
        email: 'admin@sportsroom.com',
        password: 'admin123', // 明文密码，将由pre-save中间件处理
        role: 'admin',
        isActive: true,
        bio: '系统管理员'
      });
      
      await adminUser.save();
      console.log('✅ 管理员用户创建成功');
    } else {
      console.log('ℹ️ 管理员用户已存在');
    }

    // 创建测试用户
    if (resetUsers) {
      await User.deleteOne({ email: 'user@sportsroom.com' });
      console.log('🗑️ 已删除现有测试用户');
    }
    
    const testUserExists = await User.findOne({ email: 'user@sportsroom.com' });
    if (!testUserExists) {
      // 让User模型的pre-save中间件处理密码哈希
      const testUser = new User({
        username: 'testuser',
        email: 'user@sportsroom.com',
        password: 'user123', // 明文密码，将由pre-save中间件处理
        role: 'user',
        isActive: true,
        bio: '测试用户'
      });
      
      await testUser.save();
      console.log('✅ 测试用户创建成功');
    } else {
      console.log('ℹ️ 测试用户已存在');
    }

    // 创建示例活动
    const activitiesCount = await Activity.countDocuments();
    if (activitiesCount === 0) {
      const adminUser = await User.findOne({ role: 'admin' });
      
      const sampleActivities = [
        {
          title: '周末篮球友谊赛',
          description: '欢迎所有篮球爱好者参加，不分水平，重在参与和交友。我们将根据人数分组进行比赛。',
          category: '篮球',
          tags: ['友谊赛', '周末', '新手友好'],
          location: '市体育馆篮球场',
          startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 一周后
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3小时后
          maxParticipants: 20,
          price: 0,
          requirements: '请自带篮球鞋，我们会提供篮球',
          equipment: '篮球鞋，运动服',
          organizer: adminUser._id,
          status: 'published',
          isFeatured: true
        },
        {
          title: '羽毛球双打训练',
          description: '专业的羽毛球双打训练课程，适合有一定基础的球友。教练将提供技术指导。',
          category: '羽毛球',
          tags: ['训练', '双打', '专业指导'],
          location: '羽毛球馆',
          startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3天后
          endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2小时后
          maxParticipants: 8,
          price: 50,
          requirements: '需要有一定羽毛球基础',
          equipment: '羽毛球拍，运动鞋',
          organizer: adminUser._id,
          status: 'published',
          isFeatured: true
        },
        {
          title: '晨跑健身团',
          description: '每天早上6点开始晨跑，路线经过公园和湖边，风景优美。适合想要养成运动习惯的朋友。',
          category: '跑步',
          tags: ['晨跑', '健身', '日常'],
          location: '城市公园集合点',
          startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 明天
          endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000), // 1小时后
          maxParticipants: 15,
          price: 0,
          requirements: '请准时到达集合点',
          equipment: '运动鞋，舒适服装',
          organizer: adminUser._id,
          status: 'published'
        },
        {
          title: '瑜伽放松课程',
          description: '适合初学者的瑜伽课程，帮助放松身心，改善体态。请自带瑜伽垫。',
          category: '瑜伽',
          tags: ['瑜伽', '放松', '初学者'],
          location: '瑜伽工作室',
          startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5天后
          endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000), // 1.5小时后
          maxParticipants: 12,
          price: 30,
          requirements: '适合所有年龄段',
          equipment: '瑜伽垫，舒适服装',
          organizer: adminUser._id,
          status: 'published'
        }
      ];

      for (const activityData of sampleActivities) {
        const activity = new Activity(activityData);
        await activity.save();
      }
      
      console.log('✅ 示例活动创建成功');
    } else {
      console.log('ℹ️ 示例活动已存在');
    }

    console.log('🎉 数据库初始化完成！');
    console.log('\n📋 默认账户信息：');
    console.log('管理员账户：admin@sportsroom.com / admin123');
    console.log('测试账户：user@sportsroom.com / user123');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
  } finally {
    mongoose.connection.close();
  }
};

// 运行初始化
initDatabase();
