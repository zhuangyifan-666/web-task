const express = require('express');
const { body } = require('express-validator');
const commentController = require('../controllers/commentController');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middlewares/auth');

const router = express.Router();

// Comment validation rules
const commentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content length must be between 1-1000 characters'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1-5'),
  body('parentComment')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent comment ID format')
];

// Public routes with optional authentication
router.get('/activities/:activityId', optionalAuth, commentController.getActivityComments);
router.get('/activities/:activityId/stats', commentController.getCommentStats);

// Routes that require authentication
router.post('/activities/:activityId', authenticateToken, commentValidation, commentController.createComment);
router.put('/:commentId', authenticateToken, commentValidation, commentController.updateComment);
router.delete('/:commentId', authenticateToken, commentController.deleteComment);
router.post('/:commentId/like', authenticateToken, commentController.toggleCommentLike);
router.get('/user', authenticateToken, commentController.getUserComments);

module.exports = router;
