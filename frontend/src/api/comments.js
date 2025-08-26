import api from './index';

// 评论相关API
export const commentAPI = {
  // 获取活动评论
  getActivityComments: (activityId, params = {}) => {
    // 添加时间戳参数，防止浏览器缓存
    if (!params._t) {
      params._t = new Date().getTime();
    }
    return api.get(`/comments/activities/${activityId}`, { params });
  },
  
  // 发表评论
  createComment: (activityId, data) => api.post(`/comments/activities/${activityId}`, data),
  
  // 更新评论
  updateComment: (commentId, data) => api.put(`/comments/${commentId}`, data),
  
  // 删除评论
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
  
  // 点赞/取消点赞评论
  toggleCommentLike: (commentId) => api.post(`/comments/${commentId}/like`),
  
  // 获取用户评论
  getUserComments: (params = {}) => {
    // 添加时间戳参数，防止浏览器缓存
    if (!params._t) {
      params._t = new Date().getTime();
    }
    return api.get('/comments/user', { params });
  },
  
  // 获取评论统计
  getCommentStats: (activityId) => api.get(`/comments/activities/${activityId}/stats`),
};
