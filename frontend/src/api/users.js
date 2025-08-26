import api from './index';

// 用户管理相关API
export const userAPI = {
  // 获取用户列表（管理员）
  getUsers: (params) => api.get('/users', { params }),
  
  // 获取用户详情
  getUserById: (userId) => api.get(`/users/${userId}`),
  
  // 更新用户信息（管理员）
  updateUserByAdmin: (userId, data) => api.put(`/users/${userId}`, data),
  
  // 切换用户状态
  toggleUserStatus: (userId) => api.patch(`/users/${userId}/toggle-status`),
  
  // 封禁用户
  banUser: (userId, reason) => api.post(`/users/${userId}/ban`, { reason }),
  
  // 解除用户封禁
  unbanUser: (userId) => api.post(`/users/${userId}/unban`),
  
  // 删除用户
  deleteUser: (userId, force = false) => api.delete(`/users/${userId}`, { 
    params: force ? { force: 'true' } : {} 
  }),
  
  // 获取用户活动
  getUserActivities: (userId, params) => api.get(`/users/${userId}/activities`, { params }),
  
  // 获取用户报名记录
  getUserRegistrations: (userId, params) => api.get(`/users/${userId}/registrations`, { params }),
  
  // 获取用户统计
  getUserStats: (userId) => api.get(`/users/${userId}/stats`),
};
