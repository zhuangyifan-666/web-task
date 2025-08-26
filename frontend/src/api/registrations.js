import api from './index';

// 报名相关API
export const registrationAPI = {
  // 报名活动
  registerActivity: (activityId, data = {}) => api.post(`/registrations/activities/${activityId}/register`, data),
  
  // 取消报名
  cancelRegistration: (activityId, data = {}) => api.delete(`/registrations/activities/${activityId}/register`, { data }),
  
  // 获取用户报名记录
  getUserRegistrations: (params) => api.get('/registrations/user', { params }),
  
  // 获取活动报名列表
  getActivityRegistrations: (activityId, params) => api.get(`/registrations/activities/${activityId}`, { params }),
  
  // 管理员取消用户报名
  adminCancelRegistration: (registrationId, data = {}) => api.delete(`/registrations/${registrationId}`, { data }),
  
  // 确认用户报名
  confirmRegistration: (registrationId) => api.put(`/registrations/${registrationId}/confirm`),
};