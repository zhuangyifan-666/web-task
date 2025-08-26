const express = require('express');
const { body } = require('express-validator');
const activityController = require('../controllers/activityController');
const { authenticateToken, requireAdmin, requireSuperAdmin } = require('../middlewares/auth');

const router = express.Router();

// 活动验证规则
const activityValidation = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('活动标题长度必须在2-100个字符之间'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('活动描述长度必须在10-2000个字符之间'),
  body('category')
    .isIn(['篮球', '足球', '羽毛球', '乒乓球', '游泳', '跑步', '健身', '瑜伽', '其他'])
    .withMessage('请选择有效的活动分类'),
  body('location')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('活动地点长度必须在2-200个字符之间'),
  body('startTime')
    .isISO8601()
    .withMessage('请提供有效的开始时间'),
  body('endTime')
    .isISO8601()
    .withMessage('请提供有效的结束时间')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('结束时间必须晚于开始时间');
      }
      return true;
    }),
  body('maxParticipants')
    .isInt({ min: 1, max: 1000 })
    .withMessage('最大参与人数必须在1-1000之间'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('价格不能为负数'),
  body('requirements')
    .optional()
    .isLength({ max: 500 })
    .withMessage('活动要求最多500个字符'),
  body('equipment')
    .optional()
    .isLength({ max: 500 })
    .withMessage('装备要求最多500个字符'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组格式')
];

// 公开路由
router.get('/', activityController.getActivities);
router.get('/categories', activityController.getCategories);
router.get('/recommended', activityController.getRecommendedActivities);
router.get('/search', activityController.searchActivities);
router.get('/stats', activityController.getStats);
router.get('/user', authenticateToken, activityController.getUserActivities);
router.get('/:id', activityController.getActivityById);

// 需要认证的路由
router.post('/', authenticateToken, activityValidation, activityController.createActivity);
router.put('/:id', authenticateToken, activityValidation, activityController.updateActivity);
router.delete('/:id', authenticateToken, activityController.deleteActivity);

// 管理员路由
router.get('/admin/pending', authenticateToken, requireAdmin, activityController.getPendingActivities);
router.post('/:id/approve', authenticateToken, requireAdmin, activityController.approveActivity);
router.post('/:id/reject', authenticateToken, requireAdmin, activityController.rejectActivity);

module.exports = router;
