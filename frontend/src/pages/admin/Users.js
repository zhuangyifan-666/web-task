import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  Modal, 
  Input, 
  message,
  Switch,
  Tooltip,
  Popconfirm,
  Select,
  Row,
  Col
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  DeleteOutlined, 
  EditOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { userAPI } from '../../api/users';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    isActive: ''
  });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentUser2Edit, setCurrentUser2Edit] = useState(null);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    role: '',
    isActive: true
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };

      // 移除空值
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await userAPI.getUsers(params);
      setUsers(response.data.users);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total
      }));
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination) => {
    setPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
      total: pagination.total
    });
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleRoleFilter = (value) => {
    // 特殊处理超级管理员筛选
    if (value === 'superadmin') {
      setFilters(prev => ({ 
        ...prev, 
        role: 'admin',
        search: 'admin@sportsroom.com'
      }));
    } else {
      setFilters(prev => ({ 
        ...prev, 
        role: value,
        search: value === 'admin' ? '' : prev.search // 清除可能的超级管理员搜索
      }));
    }
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleStatusFilter = (value) => {
    setFilters(prev => ({ ...prev, isActive: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 禁用功能已移除，只保留封禁功能
  
  const handleBanUser = async (userId, isBanned) => {
    if (isBanned) {
      // 解除封禁
      try {
        await userAPI.unbanUser(userId);
        message.success('用户封禁已解除');
        fetchUsers();
      } catch (error) {
        console.error('解除封禁失败:', error);
        message.error(error.response?.data?.message || '操作失败');
      }
    } else {
      // 封禁用户
      Modal.confirm({
        title: '封禁用户',
        content: (
          <div>
            <p>封禁后，该用户将无法发表评论或点赞。</p>
            <Input.TextArea 
              placeholder="请输入封禁原因（可选）" 
              id="ban-reason" 
              rows={3}
            />
          </div>
        ),
        onOk: async () => {
          const reason = document.getElementById('ban-reason').value;
          try {
            await userAPI.banUser(userId, reason);
            message.success('用户已被封禁');
            fetchUsers();
          } catch (error) {
            console.error('封禁用户失败:', error);
            message.error(error.response?.data?.message || '操作失败');
          }
        }
      });
    }
  };

  const handleDelete = async (userId, force = false) => {
    try {
      await userAPI.deleteUser(userId, force);
      message.success('用户已删除');
      fetchUsers();
    } catch (error) {
      console.error('删除用户失败:', error);
      
      // 如果是因为用户有活动或报名记录而无法删除，且当前用户是超级管理员，则提示是否强制删除
      if (error.response?.status === 400 && 
          error.response?.data?.message?.includes('有活动或报名记录') && 
          currentUser.role === 'superadmin' && 
          !force) {
        Modal.confirm({
          title: '强制删除用户',
          icon: <ExclamationCircleOutlined />,
          content: '该用户有活动或报名记录，强制删除将同时删除所有相关活动和报名记录。确定要继续吗？',
          okText: '强制删除',
          okType: 'danger',
          cancelText: '取消',
          onOk: () => handleDelete(userId, true)
        });
      } else {
        message.error(error.response?.data?.message || '删除用户失败');
      }
    }
  };

  const showEditModal = (user) => {
    setCurrentUser2Edit(user);
    setEditForm({
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
    setEditModalVisible(true);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleEditSubmit = async () => {
    if (!currentUser2Edit) return;
    
    try {
      await userAPI.updateUserByAdmin(currentUser2Edit._id, editForm);
      message.success('用户信息更新成功');
      setEditModalVisible(false);
      fetchUsers();
    } catch (error) {
      console.error('更新用户信息失败:', error);
      message.error(error.response?.data?.message || '更新用户信息失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: '_id',
      key: '_id',
      width: 80,
      ellipsis: true,
      render: id => <Tooltip title={id}>{id.substring(0, 8)}...</Tooltip>
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <Space>
          <UserOutlined />
          <span>{text}</span>
          {record._id === currentUser._id && <Tag color="green">当前用户</Tag>}
        </Space>
      )
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role, record) => (
        <Tag color={record.email === 'admin@sportsroom.com' ? 'purple' : role === 'admin' ? 'red' : 'blue'}>
          {record.email === 'admin@sportsroom.com' ? '超级管理员' : role === 'admin' ? '管理员' : '普通用户'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive, record) => (
        <>
          <Tag color={isActive ? 'green' : 'red'}>
            {isActive ? '正常' : '已禁用'}
          </Tag>
          {record.isBanned && (
            <Tag color="volcano">已封禁</Tag>
          )}
        </>
      )
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: time => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => showEditModal(record)}
          >
            编辑
          </Button>
          
          {record._id !== currentUser._id && (
            <>
              {/* 禁用功能已移除，只保留封禁功能 */}
              
              <Button 
                type="link" 
                icon={<LockOutlined />}
                onClick={() => handleBanUser(record._id, record.isBanned)}
                size="small"
                danger={!record.isBanned}
              >
                {record.isBanned ? '解封' : '封禁'}
              </Button>
              
              <Popconfirm
                title="确定要删除此用户吗？"
                description="此操作不可逆，请谨慎操作。"
                onConfirm={() => handleDelete(record._id)}
                okText="确定"
                cancelText="取消"
                icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
              >
                <Button 
                  type="link" 
                  danger 
                  icon={<DeleteOutlined />} 
                  size="small"
                >
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px 0' }}>
      <div className="container">
        <Card>
          <Title level={2}>用户管理</Title>
          <Paragraph type="secondary">
            管理所有用户，包括设置管理员权限、封号或删除用户
          </Paragraph>

          {/* 筛选区域 */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8} md={8}>
              <Input.Search
                placeholder="搜索用户名或邮箱"
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={handleSearch}
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Select
                placeholder="角色筛选"
                style={{ width: '100%' }}
                allowClear
                onChange={handleRoleFilter}
              >
                <Option value="superadmin">超级管理员</Option>
                <Option value="admin">管理员</Option>
                <Option value="user">普通用户</Option>
              </Select>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Select
                placeholder="状态筛选"
                style={{ width: '100%' }}
                allowClear
                onChange={handleStatusFilter}
              >
                <Option value="true">正常</Option>
                <Option value="false">已封号</Option>
              </Select>
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={users}
            rowKey="_id"
            pagination={pagination}
            onChange={handleTableChange}
            loading={loading}
            scroll={{ x: 800 }}
          />
        </Card>

        {/* 编辑用户弹窗 */}
        <Modal
          title="编辑用户"
          open={editModalVisible}
          onOk={handleEditSubmit}
          onCancel={() => setEditModalVisible(false)}
          okText="保存"
          cancelText="取消"
        >
          <div style={{ marginBottom: 16 }}>
            <Text strong>用户名:</Text>
            <Input
              value={editForm.username}
              onChange={e => handleEditFormChange('username', e.target.value)}
              style={{ marginTop: 8 }}
              placeholder="请输入用户名"
            />
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <Text strong>邮箱:</Text>
            <Input
              value={editForm.email}
              onChange={e => handleEditFormChange('email', e.target.value)}
              style={{ marginTop: 8 }}
              placeholder="请输入邮箱"
            />
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <Text strong>角色:</Text>
            <Select
              value={editForm.role}
              onChange={value => handleEditFormChange('role', value)}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Option value="user">普通用户</Option>
              <Option value="admin">管理员</Option>
              {currentUser.role === 'superadmin' && (
                <Option value="superadmin">超级管理员</Option>
              )}
            </Select>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              管理员可以审核和删除活动，超级管理员可以强制删除活动和用户
            </Text>
          </div>
          
          {/* 禁用功能已移除，只保留封禁功能 */}
        </Modal>
      </div>
    </div>
  );
};

export default Users;
