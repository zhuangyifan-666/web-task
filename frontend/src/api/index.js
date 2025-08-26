import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器：添加认证令牌到请求头
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理认证错误
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 如果是认证错误（401），可以在这里处理，例如清除本地存储的令牌
    if (error.response && error.response.status === 401) {
      console.log('认证失败，请重新登录');
      localStorage.removeItem('token');
      // 可以在这里添加重定向到登录页面的逻辑
    }
    return Promise.reject(error);
  }
);

export default api;
