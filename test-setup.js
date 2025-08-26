const fs = require('fs');
const path = require('path');

console.log('🧪 体育活动室项目测试脚本');
console.log('================================');

// 检查必要文件是否存在
const requiredFiles = [
  'backend/package.json',
  'backend/app.js',
  'backend/models/User.js',
  'backend/models/Activity.js',
  'backend/models/Registration.js',
  'backend/models/Comment.js',
  'backend/controllers/authController.js',
  'backend/controllers/activityController.js',
  'backend/controllers/registrationController.js',
  'backend/controllers/commentController.js',
  'backend/routes/auth.js',
  'backend/routes/activities.js',
  'backend/routes/registrations.js',
  'backend/routes/comments.js',
  'backend/routes/users.js',
  'backend/middlewares/auth.js',
  'backend/config/database.js',
  'backend/scripts/init-db.js',
  'frontend/package.json',
  'frontend/src/index.js',
  'frontend/src/App.js',
  'frontend/src/contexts/AuthContext.js',
  'frontend/src/api/auth.js',
  'frontend/src/api/activities.js',
  'frontend/src/api/registrations.js',
  'frontend/src/api/comments.js',
  'frontend/src/pages/HomePage.js',
  'frontend/src/pages/LoginPage.js',
  'frontend/src/pages/RegisterPage.js',
  'frontend/src/pages/ActivityListPage.js',
  'frontend/src/pages/ActivityDetailPage.js',
  'frontend/src/pages/ProfilePage.js',
  'frontend/src/pages/admin/Dashboard.js',
  'frontend/src/components/layout/Layout.js',
  'frontend/src/components/common/ProtectedRoute.js',
  'frontend/src/components/common/AdminRoute.js',
  'frontend/src/styles/index.css',
  'frontend/src/styles/App.css',
  'README.md',
  'SETUP.md',
  'package.json',
  '.gitignore',
  '.github/workflows/ci.yml'
];

console.log('\n📁 检查项目文件结构...');

let allFilesExist = true;
const missingFiles = [];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - 文件缺失`);
    missingFiles.push(file);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ 发现缺失文件：');
  missingFiles.forEach(file => console.log(`   - ${file}`));
  console.log('\n请检查项目结构是否完整。');
  process.exit(1);
}

console.log('\n✅ 所有必要文件都存在！');

// 检查package.json文件
console.log('\n📦 检查依赖配置...');

try {
  const rootPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const backendPackage = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  const frontendPackage = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));

  console.log('✅ 根目录 package.json 配置正确');
  console.log('✅ 后端 package.json 配置正确');
  console.log('✅ 前端 package.json 配置正确');
} catch (error) {
  console.log('❌ package.json 文件解析失败:', error.message);
  process.exit(1);
}

// 检查环境变量文件
console.log('\n🔧 检查环境配置...');

const envFiles = [
  { path: 'backend/.env', required: false, name: '后端环境变量' },
  { path: 'frontend/.env', required: false, name: '前端环境变量' }
];

envFiles.forEach(({ path: envPath, required, name }) => {
  if (fs.existsSync(envPath)) {
    console.log(`✅ ${name}文件存在`);
  } else if (required) {
    console.log(`❌ ${name}文件缺失`);
  } else {
    console.log(`ℹ️ ${name}文件不存在（可选）`);
  }
});

console.log('\n🎉 项目结构检查完成！');
console.log('\n📋 下一步操作：');
console.log('1. 确保MongoDB服务正在运行');
console.log('2. 在backend目录下创建.env文件并配置环境变量');
console.log('3. 运行 npm run install-all 安装依赖');
console.log('4. 运行 node backend/scripts/init-db.js 初始化数据库');
console.log('5. 运行 npm run dev 启动项目');
console.log('\n📖 详细说明请查看 SETUP.md 文件');