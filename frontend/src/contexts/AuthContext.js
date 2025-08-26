import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { message, Modal } from 'antd';
import { authAPI } from '../api/auth';

// 初始状态
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Action类型
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer函数
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: action.payload
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

// 创建Context
const AuthContext = createContext();

// Provider组件
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 检查token有效性
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await authAPI.getProfile();
          const user = response.data.user;
          
          // 存储用户角色
          localStorage.setItem('userRole', user.role);
          
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user,
              token
            }
          });
        } catch (error) {
          console.error('Token验证失败:', error);
          localStorage.removeItem('token');
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    };

    checkAuth();
  }, []);

  // 登录
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      // 添加调试信息
      console.log('登录请求数据:', credentials);
      
      const response = await authAPI.login(credentials);
      console.log('登录响应数据:', response.data);
      
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', user.role); // 存储用户角色
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token }
      });
      
      // 检查用户是否被封号
      if (user.isBanned) {
        Modal.warning({
          title: '账号已被封禁',
          content: (
            <div>
              <p>您的账号已被封禁，无法发表评论。</p>
              <p>封禁原因：{user.banReason || '违反社区规定'}</p>
              <p>如需解封，请联系超级管理员：admin@sportsroom.com</p>
            </div>
          ),
          okText: '我知道了'
        });
      } else if (!user.isActive) {
        Modal.warning({
          title: '账号已被禁用',
          content: (
            <div>
              <p>您的账号已被禁用，无法参与或发布活动。</p>
              <p>如需解封，请联系超级管理员：admin@sportsroom.com</p>
            </div>
          ),
          okText: '我知道了'
        });
      } else {
        message.success('登录成功！');
      }
      return { success: true };
    } catch (error) {
      console.error('登录错误详情:', error);
      
      const errorMessage = error.response?.data?.message || '登录失败，请稍后重试';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      
      message.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 注册
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });
    
    try {
      // 移除后端不需要的字段
      const { confirmPassword, agreement, ...userDataToSend } = userData;
      
      const response = await authAPI.register(userDataToSend);
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', user.role); // 存储用户角色
      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: { user, token }
      });
      
      message.success('注册成功！');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || '注册失败，请稍后重试';
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage
      });
      
      message.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 登出
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    message.success('已退出登录');
  };

  // 更新用户信息
  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      dispatch({
        type: AUTH_ACTIONS.UPDATE_PROFILE,
        payload: response.data.user
      });
      
      message.success('个人信息更新成功！');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || '更新失败，请稍后重试';
      message.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 修改密码
  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData);
      message.success('密码修改成功！');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || '密码修改失败，请稍后重试';
      message.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 清除错误
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // 检查是否为管理员
  const isAdmin = () => {
    return state.user?.role === 'admin' || state.user?.role === 'superadmin';
  };

  // 检查是否为超级管理员
  const isSuperAdmin = () => {
    return state.user?.role === 'superadmin';
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
    isAdmin,
    isSuperAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
};
