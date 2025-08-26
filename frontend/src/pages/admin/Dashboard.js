import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Statistic, 
  Table, 
  Button, 
  Space,
  Tag,
  Progress,
  List,
  Avatar
} from 'antd';
import { 
  UserOutlined, 
  CalendarOutlined, 
  TeamOutlined,
  TrophyOutlined,
  FireOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { activityAPI } from '../../api/activities';
import { userAPI } from '../../api/users';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activitiesRes, usersRes] = await Promise.all([
        activityAPI.getStats(),
        activityAPI.getActivities({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
        userAPI.getUsers({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })
      ]);

      setStats(statsRes.data);
      setRecentActivities(activitiesRes.data.activities);
      setRecentUsers(usersRes.data.users);
    } catch (error) {
      console.error('获取仪表板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const activityColumns = [
    {
      title: '活动名称',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Link to={`/activities/${record._id}`}>{text}</Link>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          draft: { color: 'default', text: '草稿' },
          published: { color: 'green', text: '已发布' },
          cancelled: { color: 'red', text: '已取消' },
          completed: { color: 'orange', text: '已完成' }
        };
        const { color, text } = statusMap[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '参与人数',
      dataIndex: 'currentParticipants',
      key: 'currentParticipants',
      render: (current, record) => `${current}/${record.maxParticipants}`,
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time) => dayjs(time).format('MM-DD HH:mm'),
    },
  ];

  const userColumns = [
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? '管理员' : '用户'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time) => dayjs(time).format('YYYY-MM-DD'),
    },
  ];

  return (
    <div style={{ padding: '24px 0' }}>
      <div className="container">
        {/* 页面标题 */}
        <div style={{ marginBottom: 32 }}>
          <Title level={2}>管理仪表板</Title>
          <Paragraph type="secondary">
            欢迎回来，这里是您的管理控制台
          </Paragraph>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总用户数"
                value={stats.totalUsers || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总活动数"
                value={stats.totalActivities || 0}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总报名数"
                value={stats.totalRegistrations || 0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总评论数"
                value={stats.totalComments || 0}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#eb2f96' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 图表和列表 */}
        <Row gutter={[24, 24]}>
          {/* 最近活动 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <FireOutlined />
                  最近活动
                </Space>
              }
              extra={
                <Link to="/admin/activities">
                  <Button type="link">查看全部</Button>
                </Link>
              }
            >
              <Table
                columns={activityColumns}
                dataSource={recentActivities}
                pagination={false}
                size="small"
                rowKey="_id"
              />
            </Card>
          </Col>

          {/* 最近用户 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <UserOutlined />
                  最近注册用户
                </Space>
              }
              extra={
                <Link to="/admin/users">
                  <Button type="link">查看全部</Button>
                </Link>
              }
            >
              <Table
                columns={userColumns}
                dataSource={recentUsers}
                pagination={false}
                size="small"
                rowKey="_id"
              />
            </Card>
          </Col>
        </Row>

        {/* 快速操作 */}
        <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
          <Col xs={24}>
            <Card title="快速操作">
              <Space wrap>
                <Link to="/admin/activities">
                  <Button type="primary" icon={<CalendarOutlined />}>
                    管理活动
                  </Button>
                </Link>
                <Link to="/admin/users">
                  <Button icon={<UserOutlined />}>
                    管理用户
                  </Button>
                </Link>
                <Link to="/activities">
                  <Button icon={<FireOutlined />}>
                    浏览活动
                  </Button>
                </Link>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Dashboard;