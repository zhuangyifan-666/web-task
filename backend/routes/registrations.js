const express = require('express');
const { body } = require('express-validator');
const registrationController = require('../controllers/registrationController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

const router = express.Router();

// 报名验证规则
const registrationValidation = [
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('备注最多500个字符')
];

// 取消报名验证规则
const cancelValidation = [
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('取消原因最多200个字符')
];

// 需要认证的路由
router.post('/activities/:activityId/register', authenticateToken, registrationValidation, registrationController.registerActivity);
router.delete('/activities/:activityId/register', authenticateToken, cancelValidation, registrationController.cancelRegistration);
router.get('/user', authenticateToken, registrationController.getUserRegistrations);
router.get('/activities/:activityId', authenticateToken, registrationController.getActivityRegistrations);

// 管理员路由
router.delete('/:registrationId', authenticateToken, requireAdmin, cancelValidation, registrationController.adminCancelRegistration);
router.put('/:registrationId/confirm', authenticateToken, requireAdmin, registrationController.confirmRegistration);

module.exports = router;