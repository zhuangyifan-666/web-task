import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar, Space, Badge } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  DashboardOutlined,
  CalendarOutlined,
  TeamOutlined,
  CommentOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = AntLayout;

const Layout = () => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">个人资料</Link>,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <Link to="/settings">设置</Link>,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const adminMenuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/admin">仪表板</Link>,
    },
    {
      key: 'activities',
      icon: <CalendarOutlined />,
      label: <Link to="/admin/activities">活动管理</Link>,
    },
    {
      key: 'users',
      icon: <TeamOutlined />,
      label: <Link to="/admin/users">用户管理</Link>,
    },
  ];

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">首页</Link>,
    },
    {
      key: '/activities',
      icon: <CalendarOutlined />,
      label: <Link to="/activities">活动列表</Link>,
    },
    ...(isAuthenticated ? [
      {
        key: '/my-activities',
        icon: <CalendarOutlined />,
        label: <Link to="/my-activities">我的活动</Link>,
      }
    ] : []),
    ...(isAdmin() ? adminMenuItems : []),
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={200}>
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? '16px' : '20px',
          fontWeight: 'bold',
          background: 'rgba(255, 255, 255, 0.1)'
        }}>
          {collapsed ? 'SR' : '体育活动室'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>
      
      <AntLayout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          
          <Space>
            {isAuthenticated ? (
              <>
                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                  <Space style={{ cursor: 'pointer' }}>
                    <Avatar src={user?.avatar} icon={<UserOutlined />} />
                    <span>{user?.username}</span>
                  </Space>
                </Dropdown>
              </>
            ) : (
              <Space>
                <Link to="/login">
                  <Button type="link">登录</Button>
                </Link>
                <Link to="/register">
                  <Button type="primary">注册</Button>
                </Link>
              </Space>
            )}
          </Space>
        </Header>
        
        <Content style={{ 
          margin: '24px 16px',
          padding: 24,
          background: '#fff',
          borderRadius: 8,
          minHeight: 280
        }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
