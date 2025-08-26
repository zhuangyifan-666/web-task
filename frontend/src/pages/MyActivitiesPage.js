import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Tabs, 
  List, 
  Tag, 
  Space, 
  Button, 
  Empty, 
  Spin, 
  message,
  Tooltip,
  Modal
} from 'antd';
import { 
  CalendarOutlined, 
  EnvironmentOutlined, 
  TeamOutlined, 
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { activityAPI } from '../api/activities';
import { registrationAPI } from '../api/registrations';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;
const { confirm } = Modal;

const MyActivitiesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [organizedActivities, setOrganizedActivities] = useState([]);
  const [registeredActivities, setRegisteredActivities] = useState([]);
  const [loadingOrganized, setLoadingOrganized] = useState(false);
  const [loadingRegistered, setLoadingRegistered] = useState(false);

  useEffect(() => {
    fetchOrganizedActivities();
    fetchRegisteredActivities();
  }, []);

  const fetchOrganizedActivities = async () => {
    setLoadingOrganized(true);
    try {
      const response = await activityAPI.getUserActivities();
      setOrganizedActivities(response.data.activities);
    } catch (error) {
      console.error('获取我组织的活动失败:', error);
      message.error('获取我组织的活动失败');
    } finally {
      setLoadingOrganized(false);
    }
  };

  const fetchRegisteredActivities = async () => {
    setLoadingRegistered(true);
    try {
      const response = await registrationAPI.getUserRegistrations();
      // 过滤掉activity为null的registration，避免渲染错误
      const validRegistrations = response.data.registrations.filter(reg => reg.activity !== null);
      setRegisteredActivities(validRegistrations.map(reg => reg.activity));
    } catch (error) {
      console.error('获取我报名的活动失败:', error);
      message.error('获取我报名的活动失败');
    } finally {
      setLoadingRegistered(false);
    }
  };

  const handleCancelRegistration = (activityId) => {
    confirm({
      title: '确定要取消报名吗？',
      icon: <ExclamationCircleOutlined />,
      content: '取消报名后，如果活动名额已满，可能无法再次报名。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await registrationAPI.cancelRegistration(activityId);
          message.success('已取消报名');
          fetchRegisteredActivities();
        } catch (error) {
          console.error('取消报名失败:', error);
          message.error('取消报名失败');
        }
      }
    });
  };

  const renderActivityItem = (activity, isRegistered = false) => (
    <List.Item
      key={activity._id}
      actions={[
        <Link to={`/activities/${activity._id}`}>
          <Button type="link">查看详情</Button>
        </Link>,
        isRegistered && (
          <Button 
            type="link" 
            danger 
            onClick={() => handleCancelRegistration(activity._id)}
          >
            取消报名
          </Button>
        ),
        !isRegistered && (
          <Button 
            type="link" 
            onClick={() => navigate(`/activities/${activity._id}/edit`)}
          >
            编辑
          </Button>
        )
      ]}
    >
      <List.Item.Meta
        title={
          <Space>
            <Link to={`/activities/${activity._id}`}>{activity.title}</Link>
            <Tag color={activity.approvalStatus === 'approved' ? 'green' : activity.approvalStatus === 'pending' ? 'orange' : 'red'}>
              {activity.approvalStatus === 'approved' ? '已审核' : activity.approvalStatus === 'pending' ? '待审核' : '已拒绝'}
            </Tag>
          </Space>
        }
        description={
          <Space direction="vertical" size={2}>
            <Space>
              <CalendarOutlined /> 
              <span>{dayjs(activity.startTime).format('YYYY-MM-DD HH:mm')}</span>
            </Space>
            <Space>
              <EnvironmentOutlined /> 
              <span>{activity.location}</span>
            </Space>
            <Space>
              <ClockCircleOutlined /> 
              <span>持续时间: {activity.endTime && activity.startTime ? 
                Math.round((new Date(activity.endTime) - new Date(activity.startTime)) / (1000 * 60)) : 0} 分钟</span>
            </Space>
            <Space>
              <TeamOutlined /> 
              <span>
                {activity.currentParticipants}/{activity.maxParticipants} 人已报名
              </span>
            </Space>
          </Space>
        }
      />
    </List.Item>
  );

  return (
    <div style={{ padding: '24px 0' }}>
      <div className="container">
        <Card>
          <Title level={2}>我的活动</Title>
          <Paragraph type="secondary">
            查看我组织和参与的所有活动
          </Paragraph>

          <Tabs defaultActiveKey="organized">
            <TabPane tab="我组织的活动" key="organized">
              <Spin spinning={loadingOrganized}>
                {organizedActivities.length > 0 ? (
                  <List
                    itemLayout="vertical"
                    dataSource={organizedActivities}
                    renderItem={(activity) => renderActivityItem(activity)}
                    pagination={{
                      pageSize: 5,
                      hideOnSinglePage: true
                    }}
                  />
                ) : (
                  <Empty 
                    description="您还没有组织过活动" 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Button 
                      type="primary" 
                      onClick={() => navigate('/activities/create')}
                    >
                      创建活动
                    </Button>
                  </Empty>
                )}
              </Spin>
            </TabPane>
            
            <TabPane tab="我报名的活动" key="registered">
              <Spin spinning={loadingRegistered}>
                {registeredActivities.length > 0 ? (
                  <List
                    itemLayout="vertical"
                    dataSource={registeredActivities}
                    renderItem={(activity) => renderActivityItem(activity, true)}
                    pagination={{
                      pageSize: 5,
                      hideOnSinglePage: true
                    }}
                  />
                ) : (
                  <Empty 
                    description="您还没有报名参加任何活动" 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Button 
                      type="primary" 
                      onClick={() => navigate('/activities')}
                    >
                      浏览活动
                    </Button>
                  </Empty>
                )}
              </Spin>
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default MyActivitiesPage;
