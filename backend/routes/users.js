const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticateToken, requireAdmin, requireSuperAdmin } = require('../middlewares/auth');

const router = express.Router();

// 用户更新验证规则
const userUpdateValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度必须在3-20个字符之间')
    .matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
    .withMessage('用户名只能包含字母、数字、下划线和中文'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('role')
    .optional()
    .isIn(['user', 'admin', 'superadmin'])
    .withMessage('角色必须是user、admin或superadmin'),
  body('phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号'),
  body('bio')
    .optional()
    .isLength({ max: 200 })
    .withMessage('个人简介最多200个字符')
];

// 管理员路由
router.get('/', authenticateToken, requireAdmin, userController.getUsers);
router.get('/:userId', authenticateToken, requireAdmin, userController.getUserById);
router.put('/:userId', authenticateToken, requireAdmin, userUpdateValidation, userController.updateUserByAdmin);
router.patch('/:userId/toggle-status', authenticateToken, requireAdmin, userController.toggleUserStatus);
router.post('/:userId/ban', authenticateToken, requireAdmin, userController.banUser);
router.post('/:userId/unban', authenticateToken, requireAdmin, userController.unbanUser);
router.delete('/:userId', authenticateToken, requireAdmin, userController.deleteUser);

// 用户活动相关
router.get('/:userId/activities', userController.getUserActivities);
router.get('/:userId/registrations', userController.getUserRegistrations);
router.get('/:userId/stats', userController.getUserStats);

module.exports = router;
