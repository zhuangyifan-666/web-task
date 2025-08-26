import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { useAuth } from '../../contexts/AuthContext';

// 超级管理员邮箱，只有这个账号可以访问用户管理和仪表盘
const SUPER_ADMIN_EMAIL = 'admin@sportsroom.com';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 检查是否为超级管理员
  if (user?.role !== 'admin' || user?.email !== SUPER_ADMIN_EMAIL) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="抱歉，只有超级管理员可以访问此页面。"
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            返回上一页
          </Button>
        }
      />
    );
  }

  return children;
};

export default AdminRoute;
