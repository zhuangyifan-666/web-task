import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Typography, 
  Space, 
  Statistic, 
  Carousel,
  Tag,
  Avatar,
  Divider
} from 'antd';
import { 
  CalendarOutlined, 
  UserOutlined, 
  FireOutlined,
  TrophyOutlined,
  TeamOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { activityAPI } from '../api/activities';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;

const HomePage = () => {
  const { isAuthenticated, isAdmin, isSuperAdmin } = useAuth();
  const [recommendedActivities, setRecommendedActivities] = useState([]);
  const [stats, setStats] = useState({
    totalActivities: 0,
    totalUsers: 0,
    totalRegistrations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activitiesRes, statsRes] = await Promise.all([
          activityAPI.getRecommendedActivities({ limit: 6 }),
          activityAPI.getStats()
        ]);

        setRecommendedActivities(activitiesRes.data.activities);
        setStats(statsRes.data);
      } catch (error) {
        console.error('获取首页数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const categories = [
    { name: '篮球', icon: '🏀', color: '#1890ff' },
    { name: '足球', icon: '⚽', color: '#52c41a' },
    { name: '羽毛球', icon: '🏸', color: '#faad14' },
    { name: '乒乓球', icon: '🏓', color: '#f5222d' },
    { name: '游泳', icon: '🏊', color: '#722ed1' },
    { name: '跑步', icon: '🏃', color: '#13c2c2' },
    { name: '健身', icon: '💪', color: '#eb2f96' },
    { name: '瑜伽', icon: '🧘', color: '#fa8c16' }
  ];

  const renderActivityCard = (activity) => (
    <Card
      key={activity._id}
      hoverable
      cover={
        <div style={{ height: 200, overflow: 'hidden' }}>
          {activity.images && activity.images.length > 0 ? (
            <img
              alt={activity.title}
              src={activity.images[0]}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '48px'
            }}>
              🏃
            </div>
          )}
        </div>
      }
      actions={[
        <Link to={`/activities/${activity._id}`}>
          <Button type="primary">查看详情</Button>
        </Link>
      ]}
    >
      <Card.Meta
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{activity.title}</span>
            {activity.isFeatured && <Tag color="gold">推荐</Tag>}
          </div>
        }
        description={
          <div>
            <Paragraph ellipsis={{ rows: 2 }}>{activity.description}</Paragraph>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <CalendarOutlined /> {dayjs(activity.startTime).format('MM月DD日 HH:mm')}
              </div>
              <div>
                <EnvironmentOutlined /> {activity.location}
              </div>
              <div>
                <TeamOutlined /> {activity.currentParticipants}/{activity.maxParticipants} 人
              </div>
              <div>
                <Tag color="blue">{activity.category}</Tag>
                {activity.price > 0 && <Tag color="green">¥{activity.price}</Tag>}
              </div>
            </Space>
          </div>
        }
      />
    </Card>
  );

  return (
    <div style={{ padding: '24px 0' }}>
      {/* 英雄区域 */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '60px 0',
        textAlign: 'center',
        marginBottom: 48
      }}>
        <div className="container">
          <Title level={1} style={{ color: 'white', marginBottom: 16 }}>
            欢迎来到体育活动室
          </Title>
          <Paragraph style={{ color: 'white', fontSize: 18, marginBottom: 32 }}>
            发现精彩体育活动，结识志同道合的朋友，享受运动的乐趣
          </Paragraph>
          <Space size="large">
            <Link to="/activities">
              <Button type="primary" size="large" ghost>
                浏览活动
              </Button>
            </Link>
                {isAuthenticated ? (
              <>
                <Link to="/activities/create">
                  <Button size="large" ghost>
                    创建活动
                  </Button>
                </Link>
                {isAdmin() && (
                  <Link to="/admin/activities">
                    <Button size="large" ghost>
                      管理活动
                    </Button>
                  </Link>
                )}
                {isSuperAdmin && isSuperAdmin() && (
                  <>
                    <Link to="/admin">
                      <Button size="large" ghost>
                        管理仪表盘
                      </Button>
                    </Link>
                    <Link to="/admin/users">
                      <Button size="large" ghost>
                        用户管理
                      </Button>
                    </Link>
                  </>
                )}
              </>
            ) : (
              <Link to="/register">
                <Button size="large" ghost>
                  立即注册
                </Button>
              </Link>
            )}
          </Space>
        </div>
      </div>

      <div className="container">
        {/* 统计信息 */}
        <Row gutter={[24, 24]} style={{ marginBottom: 48 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="总活动数"
                value={stats.totalActivities}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="注册用户"
                value={stats.totalUsers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="总报名数"
                value={stats.totalRegistrations}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 活动分类 */}
        <div style={{ marginBottom: 48 }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
            活动分类
          </Title>
          <Row gutter={[16, 16]}>
            {categories.map(category => (
              <Col xs={12} sm={6} md={3} key={category.name}>
                <Link to={`/activities?category=${encodeURIComponent(category.name)}`}>
                  <Card
                    hoverable
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 8 }}>
                      {category.icon}
                    </div>
                    <div style={{ color: category.color, fontWeight: 'bold' }}>
                      {category.name}
                    </div>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        </div>

        {/* 推荐活动 */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Title level={2}>
              <FireOutlined style={{ color: '#fa541c', marginRight: 8 }} />
              推荐活动
            </Title>
            <Link to="/activities">
              <Button type="primary">查看更多</Button>
            </Link>
          </div>
          
          {loading ? (
            <Row gutter={[24, 24]}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Col xs={24} sm={12} md={8} key={i}>
                  <Card loading />
                </Col>
              ))}
            </Row>
          ) : (
            <Row gutter={[24, 24]}>
              {recommendedActivities.map(activity => (
                <Col xs={24} sm={12} md={8} key={activity._id}>
                  {renderActivityCard(activity)}
                </Col>
              ))}
            </Row>
          )}
        </div>

        {/* 特色功能 */}
        <div style={{ marginBottom: 48 }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
            为什么选择我们
          </Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card style={{ textAlign: 'center', height: '100%' }}>
                <TrophyOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }} />
                <Title level={3}>丰富活动</Title>
                <Paragraph>
                  涵盖篮球、足球、羽毛球等多种运动项目，满足不同爱好者的需求
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card style={{ textAlign: 'center', height: '100%' }}>
                <TeamOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                <Title level={3}>社交平台</Title>
                <Paragraph>
                  结识志同道合的朋友，分享运动心得，建立持久的友谊
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card style={{ textAlign: 'center', height: '100%' }}>
                <CalendarOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                <Title level={3}>便捷管理</Title>
                <Paragraph>
                  简单易用的报名系统，实时查看活动状态，轻松管理个人活动
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>

        {/* 快速开始 */}
        {!isAuthenticated && (
          <div style={{ 
            background: '#f5f5f5', 
            padding: 48, 
            borderRadius: 8, 
            textAlign: 'center' 
          }}>
            <Title level={2}>准备开始您的运动之旅？</Title>
            <Paragraph style={{ fontSize: 16, marginBottom: 24 }}>
              立即注册，发现更多精彩活动，结识运动伙伴
            </Paragraph>
            <Space size="large">
              <Link to="/register">
                <Button type="primary" size="large">
                  立即注册
                </Button>
              </Link>
              <Link to="/login">
                <Button size="large">
                  已有账户？登录
                </Button>
              </Link>
            </Space>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
