import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Row, 
  Col, 
  Input, 
  Select, 
  Button, 
  Typography, 
  Space, 
  Tag,
  Pagination,
  Empty,
  Spin,
  DatePicker,
  Slider,
  Drawer,
  Form,
  message,
  Modal
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  FireOutlined
} from '@ant-design/icons';
import { activityAPI } from '../api/activities';
import { registrationAPI } from '../api/registrations';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { Title, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const ActivityListPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: 'published',
    sortBy: 'startTime',
    sortOrder: 'asc'
  });
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);

  useEffect(() => {
    fetchCategories();
    
    // 从URL参数中获取分类
    const urlParams = new URLSearchParams(location.search);
    const categoryParam = urlParams.get('category');
    console.log('URL category param:', categoryParam);
    
    if (categoryParam) {
      console.log('Setting category filter to:', categoryParam);
      setFilters(prev => {
        const newFilters = { ...prev, category: categoryParam };
        console.log('New filters:', newFilters);
        return newFilters;
      });
    } else {
      // 如果URL中没有分类参数，重置分类过滤器
      setFilters(prev => ({ ...prev, category: '' }));
    }
  }, [location.search]); // 使用location.search作为依赖项，当URL变化时重新获取分类

  useEffect(() => {
    fetchActivities();
  }, [pagination.page, filters]);

  const fetchCategories = async () => {
    try {
      const response = await activityAPI.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('获取分类失败:', error);
    }
  };

  const fetchActivities = async () => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        status: filters.status
      };
      
      // 只有当category不为空时才添加到查询参数中
      if (filters.category && filters.category.trim() !== '') {
        params.category = filters.category;
      }
      
      // 只有当search不为空时才添加到查询参数中
      if (filters.search && filters.search.trim() !== '') {
        params.search = filters.search;
      }
      
      console.log('Fetching activities with params:', params);
      
      const response = await activityAPI.getActivities(params);
      console.log('Response from server:', response.data);
      
      setActivities(response.data.activities);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (error) {
      console.error('获取活动列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCategoryChange = (value) => {
    setFilters(prev => ({ ...prev, category: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (value) => {
    const [sortBy, sortOrder] = value.split('-');
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleFilterDrawerClose = () => {
    setFilterDrawerVisible(false);
  };

  const handleFilterSubmit = (values) => {
    setFilters(prev => ({ ...prev, ...values }));
    setPagination(prev => ({ ...prev, page: 1 }));
    setFilterDrawerVisible(false);
  };

  const handleCancelRegistration = async (activityId) => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login', { state: { from: '/activities' } });
      return;
    }

    Modal.confirm({
      title: '确认取消报名',
      content: '确定要取消报名吗？取消后如需重新报名，可能会被加入等待队列。',
      okText: '确认取消',
      cancelText: '再想想',
      onOk: async () => {
        try {
          await registrationAPI.cancelRegistration(activityId);
          message.success('取消报名成功');
          fetchActivities(); // 刷新活动列表
        } catch (error) {
          console.error('取消报名失败:', error);
          message.error(error.response?.data?.message || '取消报名失败');
        }
      }
    });
  };

  const renderActivityCard = (activity) => {
    // 检查活动是否已开始
    const hasStarted = new Date() >= new Date(activity.startTime);
    
    // 准备操作按钮
    const actions = [
      <Link key="view" to={`/activities/${activity._id}`}>
        <Button type="primary" size="small">查看详情</Button>
      </Link>
    ];
    
    // 如果用户已报名且活动未开始，添加取消报名按钮
    if (activity.isRegistered && !hasStarted) {
      actions.push(
        <Button 
          key="cancel"
          type="default" 
          danger
          size="small"
          onClick={(e) => {
            e.preventDefault(); // 防止点击事件冒泡到卡片
            handleCancelRegistration(activity._id);
          }}
        >
          取消报名
        </Button>
      );
    }
    
    return (
      <Col xs={24} sm={12} md={8} lg={6} key={activity._id}>
        <Card
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
          actions={actions}
        >
          <Card.Meta
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{activity.title}</span>
                {activity.isFeatured && <FireOutlined style={{ color: '#fa541c' }} />}
              </div>
            }
            description={
              <div>
                <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
                  {activity.description}
                </Paragraph>
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
      </Col>
    );
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <div className="container">
        {/* 页面标题 */}
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2}>活动列表</Title>
            <Paragraph type="secondary">
              发现精彩体育活动，找到适合您的运动项目
            </Paragraph>
          </div>
          {isAuthenticated && (
            <Button 
              type="primary" 
              size="large"
              onClick={() => navigate('/activities/create')}
            >
              创建新活动
            </Button>
          )}
        </div>

        {/* 搜索和筛选 */}
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="搜索活动..."
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Select
                placeholder="选择分类"
                style={{ width: '100%' }}
                allowClear
                onChange={handleCategoryChange}
                value={filters.category || undefined}
              >
                {categories.map(category => (
                  <Option key={category} value={category}>{category}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Select
                placeholder="排序方式"
                style={{ width: '100%' }}
                defaultValue="startTime-asc"
                onChange={handleSortChange}
              >
                <Option value="startTime-asc">时间升序</Option>
                <Option value="startTime-desc">时间降序</Option>
                <Option value="currentParticipants-desc">参与人数</Option>
                <Option value="viewCount-desc">浏览次数</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space>
                <Button 
                  icon={<FilterOutlined />}
                  onClick={() => setFilterDrawerVisible(true)}
                >
                  更多筛选
                </Button>
                <Button 
                  onClick={() => {
                    setFilters({
                      search: '',
                      category: '',
                      status: 'published',
                      sortBy: 'startTime',
                      sortOrder: 'asc'
                    });
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                >
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 活动列表 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
          </div>
        ) : activities.length > 0 ? (
          <>
            <Row gutter={[24, 24]}>
              {activities.map(renderActivityCard)}
            </Row>
            
            {/* 分页 */}
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Pagination
                current={pagination.page}
                total={pagination.total}
                pageSize={pagination.limit}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total, range) => 
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                }
                onChange={handlePageChange}
              />
            </div>
          </>
        ) : (
          <Empty
            description="暂无活动"
            style={{ margin: '50px 0' }}
          />
        )}

        {/* 筛选抽屉 */}
        <Drawer
          title="高级筛选"
          placement="right"
          onClose={handleFilterDrawerClose}
          open={filterDrawerVisible}
          width={400}
        >
          <Form
            layout="vertical"
            onFinish={handleFilterSubmit}
            initialValues={filters}
          >
            <Form.Item name="dateRange" label="活动时间">
              <RangePicker 
                style={{ width: '100%' }}
                placeholder={['开始时间', '结束时间']}
              />
            </Form.Item>

            <Form.Item name="priceRange" label="价格范围">
              <Slider
                range
                min={0}
                max={1000}
                marks={{
                  0: '免费',
                  100: '100元',
                  500: '500元',
                  1000: '1000元'
                }}
              />
            </Form.Item>

            <Form.Item name="participantsRange" label="参与人数">
              <Slider
                range
                min={1}
                max={100}
                marks={{
                  1: '1人',
                  20: '20人',
                  50: '50人',
                  100: '100人'
                }}
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                应用筛选
              </Button>
            </Form.Item>
          </Form>
        </Drawer>
      </div>
    </div>
  );
};

export default ActivityListPage;
