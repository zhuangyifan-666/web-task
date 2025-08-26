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
  Tabs,
  Tooltip,
  Popconfirm
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { activityAPI } from '../../api/activities';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [pendingActivities, setPendingActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [pendingPagination, setPendingPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [currentActivity, setCurrentActivity] = useState(null);
  const [activeTab, setActiveTab] = useState('1');

  useEffect(() => {
    fetchActivities();
  }, [pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchPendingActivities();
  }, [pendingPagination.current, pendingPagination.pageSize, activeTab]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await activityAPI.getActivities({
        page: pagination.current,
        limit: pagination.pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      setActivities(response.data.activities);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total
      }));
    } catch (error) {
      console.error('获取活动列表失败:', error);
      message.error('获取活动列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingActivities = async () => {
    if (activeTab !== '2') return;
    
    setPendingLoading(true);
    try {
      const response = await activityAPI.getPendingActivities({
        page: pendingPagination.current,
        limit: pendingPagination.pageSize
      });

      setPendingActivities(response.data.activities);
      setPendingPagination(prev => ({
        ...prev,
        total: response.data.pagination.total
      }));
    } catch (error) {
      console.error('获取待审核活动失败:', error);
      message.error('获取待审核活动失败');
    } finally {
      setPendingLoading(false);
    }
  };

  const handleTableChange = (pagination) => {
    setPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
      total: pagination.total
    });
  };

  const handlePendingTableChange = (pagination) => {
    setPendingPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
      total: pagination.total
    });
  };

  const handleApprove = async (id) => {
    try {
      await activityAPI.approveActivity(id);
      message.success('活动已审核通过');
      fetchPendingActivities();
      fetchActivities();
    } catch (error) {
      console.error('审核活动失败:', error);
      message.error('审核活动失败');
    }
  };

  const showRejectModal = (activity) => {
    setCurrentActivity(activity);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleReject = async () => {
    if (!currentActivity) return;
    
    try {
      await activityAPI.rejectActivity(currentActivity._id, rejectReason);
      message.success('已拒绝该活动');
      setRejectModalVisible(false);
      fetchPendingActivities();
    } catch (error) {
      console.error('拒绝活动失败:', error);
      message.error('拒绝活动失败');
    }
  };

  const handleDelete = async (id, force = false) => {
    try {
      await activityAPI.deleteActivity(id, force);
      message.success('活动已删除');
      fetchActivities();
    } catch (error) {
      console.error('删除活动失败:', error);
      
      // 如果是因为活动有报名记录而无法删除，且当前用户是超级管理员，则提示是否强制删除
      if (error.response?.status === 400 && 
          error.response?.data?.message?.includes('已有用户报名') && 
          localStorage.getItem('userRole') === 'superadmin' && 
          !force) {
        Modal.confirm({
          title: '强制删除活动',
          icon: <ExclamationCircleOutlined />,
          content: '该活动已有用户报名，强制删除将同时删除所有相关报名记录。确定要继续吗？',
          okText: '强制删除',
          okType: 'danger',
          cancelText: '取消',
          onOk: () => handleDelete(id, true)
        });
      } else {
        message.error(error.response?.data?.message || '删除活动失败');
      }
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
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
      title: '活动标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <Link to={`/activities/${record._id}`}>{text}</Link>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: category => <Tag color="blue">{category}</Tag>
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 150,
      render: time => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '组织者',
      dataIndex: 'organizer',
      key: 'organizer',
      width: 120,
      render: organizer => organizer?.username || '未知'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: status => {
        let color = 'default';
        if (status === 'published') color = 'green';
        if (status === 'cancelled') color = 'red';
        if (status === 'completed') color = 'blue';
        if (status === 'pending') color = 'orange';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Link to={`/activities/${record._id}`}>
            <Button type="link" icon={<EyeOutlined />} size="small">
              查看
            </Button>
          </Link>
          <Popconfirm
            title="确定要删除此活动吗？"
            onConfirm={() => handleDelete(record._id)}
            okText="确定"
            cancelText="取消"
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const pendingColumns = [
    {
      title: 'ID',
      dataIndex: '_id',
      key: '_id',
      width: 80,
      ellipsis: true,
      render: id => <Tooltip title={id}>{id.substring(0, 8)}...</Tooltip>
    },
    {
      title: '活动标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <Link to={`/activities/${record._id}`}>{text}</Link>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: category => <Tag color="blue">{category}</Tag>
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 150,
      render: time => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '组织者',
      dataIndex: 'organizer',
      key: 'organizer',
      width: 120,
      render: organizer => organizer?.username || '未知'
    },
    {
      title: '提交时间',
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
          <Link to={`/activities/${record._id}`}>
            <Button type="link" icon={<EyeOutlined />} size="small">
              查看
            </Button>
          </Link>
          <Button 
            type="link" 
            icon={<CheckCircleOutlined />} 
            style={{ color: 'green' }}
            onClick={() => handleApprove(record._id)}
            size="small"
          >
            通过
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<CloseCircleOutlined />}
            onClick={() => showRejectModal(record)}
            size="small"
          >
            拒绝
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px 0' }}>
      <div className="container">
        <Card>
          <Title level={2}>活动管理</Title>
          <Paragraph type="secondary">
            管理所有活动，包括审核新活动和删除不适当的活动
          </Paragraph>

          <Tabs activeKey={activeTab} onChange={handleTabChange}>
            <TabPane tab="所有活动" key="1">
              <Table
                columns={columns}
                dataSource={activities}
                rowKey="_id"
                pagination={pagination}
                onChange={handleTableChange}
                loading={loading}
                scroll={{ x: 800 }}
              />
            </TabPane>
            <TabPane 
              tab={
                <span>
                  待审核活动
                  {pendingPagination.total > 0 && (
                    <Tag color="red" style={{ marginLeft: 8 }}>
                      {pendingPagination.total}
                    </Tag>
                  )}
                </span>
              } 
              key="2"
            >
              <Table
                columns={pendingColumns}
                dataSource={pendingActivities}
                rowKey="_id"
                pagination={pendingPagination}
                onChange={handlePendingTableChange}
                loading={pendingLoading}
                scroll={{ x: 800 }}
              />
            </TabPane>
          </Tabs>
        </Card>

        <Modal
          title="拒绝活动"
          open={rejectModalVisible}
          onOk={handleReject}
          onCancel={() => setRejectModalVisible(false)}
          okText="确认拒绝"
          cancelText="取消"
        >
          <div style={{ marginBottom: 16 }}>
            <Text>活动标题: {currentActivity?.title}</Text>
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">请输入拒绝原因（可选）:</Text>
          </div>
          <TextArea
            rows={4}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="请输入拒绝原因，例如：活动内容不符合规范"
          />
        </Modal>
      </div>
    </div>
  );
};

export default Activities;
