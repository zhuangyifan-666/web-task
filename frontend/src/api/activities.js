import api from './index';

// 活动相关API
export const activityAPI = {
  // 获取活动列表
  getActivities: (params) => api.get('/activities', { params }),
  
  // 获取活动详情
  getActivityById: (id) => api.get(`/activities/${id}`),
  
  // 创建活动
  createActivity: (data) => api.post('/activities', data),
  
  // 更新活动
  updateActivity: (id, data) => api.put(`/activities/${id}`, data),
  
  // 删除活动
  deleteActivity: (id, force = false) => api.delete(`/activities/${id}`, {
    params: force ? { force: 'true' } : {}
  }),
  
  // 获取活动分类
  getCategories: () => api.get('/activities/categories'),
  
  // 获取推荐活动
  getRecommendedActivities: (params) => api.get('/activities/recommended', { params }),
  
  // 搜索活动
  searchActivities: (params) => api.get('/activities/search', { params }),
  
  // 获取活动统计
  getStats: () => api.get('/activities/stats'),
  
  // 获取用户创建的活动
  getUserActivities: (params) => api.get('/activities/user', { params }),
  
  // 管理员API
  
  // 获取待审核活动
  getPendingActivities: (params) => api.get('/activities/admin/pending', { params }),
  
  // 审核通过活动
  approveActivity: (id) => api.post(`/activities/${id}/approve`),
  
  // 拒绝活动
  rejectActivity: (id, reason) => api.post(`/activities/${id}/reject`, { reason }),
};
