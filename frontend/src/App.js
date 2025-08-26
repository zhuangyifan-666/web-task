import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import ModeratorRoute from './components/common/ModeratorRoute';

// 页面组件
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ActivityListPage from './pages/ActivityListPage';
import ActivityDetailPage from './pages/ActivityDetailPage';
import CreateActivityPage from './pages/CreateActivityPage';
import ProfilePage from './pages/ProfilePage';
import MyActivitiesPage from './pages/MyActivitiesPage';
import AdminDashboard from './pages/admin/Dashboard';
import AdminActivities from './pages/admin/Activities';
import AdminUsers from './pages/admin/Users';

// 样式
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          {/* 公开路由 */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="activities" element={<ActivityListPage />} />
            <Route path="activities/create" element={
              <ProtectedRoute>
                <CreateActivityPage />
              </ProtectedRoute>
            } />
            <Route path="activities/:id" element={<ActivityDetailPage />} />
            
            {/* 需要登录的路由 */}
            <Route path="profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="my-activities" element={
              <ProtectedRoute>
                <MyActivitiesPage />
              </ProtectedRoute>
            } />
            
            {/* 管理员路由 */}
            <Route path="admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="admin/activities" element={
              <ModeratorRoute>
                <AdminActivities />
              </ModeratorRoute>
            } />
            <Route path="admin/users" element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            } />
            
            {/* 404页面 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        
        {/* 全局通知 */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#52c41a',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ff4d4f',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </AuthProvider>
  );
}

export default App;
