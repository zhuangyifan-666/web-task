import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Typography, 
  Space, 
  Tag, 
  Divider,
  Progress,
  Avatar,
  List,
  Modal,
  message,
  Spin,
  Empty,
  Image,
  Tabs,
  Rate,
  Input,
  Form
} from 'antd';
import { 
  CalendarOutlined, 
  EnvironmentOutlined, 
  TeamOutlined,
  UserOutlined,
  LikeOutlined,
  DislikeOutlined,
  MessageOutlined,
  ShareAltOutlined,
  HeartOutlined,
  HeartFilled
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { activityAPI } from '../api/activities';
import { registrationAPI } from '../api/registrations';
import { commentAPI } from '../api/comments';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const ActivityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [activity, setActivity] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentForm] = Form.useForm();

  // 定义一个可以安全放入依赖数组的fetchComments函数引用
  const fetchCommentsRef = React.useCallback(async () => {
    try {
      console.log('开始获取活动评论，活动ID:', id);
      // 添加时间戳参数，防止浏览器缓存
      const timestamp = new Date().getTime();
      const response = await commentAPI.getActivityComments(id, { _t: timestamp });
      console.log('获取评论响应:', response.data);
      
      if (response.data && Array.isArray(response.data.comments)) {
        console.log(`获取到 ${response.data.comments.length} 条评论`);
        setComments(response.data.comments);
      } else {
        console.error('评论数据格式不正确:', response.data);
        setComments([]);
      }
    } catch (error) {
      console.error('获取评论失败:', error);
      setComments([]);
    }
  }, [id]);
  
  useEffect(() => {
    fetchActivityDetail();
    fetchCommentsRef();
    
    // 添加页面可见性变化监听器，当用户返回页面时刷新评论
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('页面重新可见，刷新评论');
        fetchCommentsRef();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 清理函数
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id, fetchCommentsRef]);

  const fetchActivityDetail = async () => {
    try {
      const response = await activityAPI.getActivityById(id);
      setActivity(response.data.activity);
    } catch (error) {
      console.error('获取活动详情失败:', error);
      message.error('获取活动详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      console.log('开始获取活动评论，活动ID:', id);
      // 添加时间戳参数，防止浏览器缓存
      const timestamp = new Date().getTime();
      const response = await commentAPI.getActivityComments(id, { _t: timestamp });
      console.log('获取评论响应:', response.data);
      
      if (response.data && Array.isArray(response.data.comments)) {
        console.log(`获取到 ${response.data.comments.length} 条评论`);
        setComments(response.data.comments);
      } else {
        console.error('评论数据格式不正确:', response.data);
        setComments([]);
      }
    } catch (error) {
      console.error('获取评论失败:', error);
      setComments([]);
    }
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login', { state: { from: `/activities/${id}` } });
      return;
    }

    setRegistering(true);
    try {
      await registrationAPI.registerActivity(id);
      message.success('报名成功！');
      fetchActivityDetail(); // 刷新活动信息
    } catch (error) {
      console.error('报名失败:', error);
      message.error(error.response?.data?.message || '报名失败');
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegister = async () => {
    Modal.confirm({
      title: '确认取消报名',
      content: '确定要取消报名吗？',
      onOk: async () => {
        try {
          await registrationAPI.cancelRegistration(id);
          message.success('取消报名成功');
          fetchActivityDetail();
        } catch (error) {
          console.error('取消报名失败:', error);
          // 显示服务器返回的具体错误信息
          const errorMessage = error.response?.data?.message || '取消报名失败';
          message.error(errorMessage);
        }
      }
    });
  };

  const handleComment = async (values) => {
    setCommenting(true);
    try {
      const response = await commentAPI.createComment(id, values);
      message.success('评论发表成功');
      setCommentModalVisible(false);
      commentForm.resetFields();
      
      console.log('评论已提交，正在获取最新评论...');
      
      // 确保新评论被添加到列表中
      if (response.data && response.data.comment) {
        const newComment = response.data.comment;
        
        // 确保评论有必要的属性
        newComment.likeCount = newComment.likes ? newComment.likes.length : 0;
        newComment.hasLiked = false;
        
        // 立即将新评论添加到列表中
        setComments(prevComments => [newComment, ...prevComments]);
        
        console.log('新评论已添加到列表，ID:', newComment._id);
      }
      
      // 延迟一秒后再次获取所有评论，确保与服务器同步
      setTimeout(() => {
        fetchComments();
        console.log('延迟获取评论完成');
      }, 1000);
      
    } catch (error) {
      console.error('发表评论失败:', error);
      // 显示服务器返回的具体错误信息，特别是对于被封禁的用户
      if (error.response?.data?.error === '账号已被封禁') {
        message.error(error.response.data.message || '您的账号已被封禁，无法发表评论');
        setCommentModalVisible(false); // 关闭评论窗口
      } else {
        message.error(error.response?.data?.message || '发表评论失败');
      }
    } finally {
      setCommenting(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      await commentAPI.toggleCommentLike(commentId);
      fetchComments();
    } catch (error) {
      console.error('点赞失败:', error);
      // 显示服务器返回的具体错误信息，特别是对于被封禁的用户
      if (error.response?.data?.error === '账号已被封禁') {
        message.error(error.response.data.message || '您的账号已被封禁，无法点赞评论');
      } else {
        message.error(error.response?.data?.message || '点赞失败');
      }
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Empty description="活动不存在" />
      </div>
    );
  }

  const isRegistered = activity.userRegistration;
  const isOrganizer = user && activity.organizer && activity.organizer._id === user._id;
  const canRegister = !isRegistered && !activity.isFull && !activity.hasStarted;

  return (
    <div style={{ padding: '24px 0' }}>
      <div className="container">
        <Row gutter={[24, 24]}>
          {/* 活动详情 */}
          <Col xs={24} lg={16}>
            <Card>
              {/* 活动图片 */}
              {activity.images && activity.images.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <Image.PreviewGroup>
                    <Image
                      width="100%"
                      height={400}
                      src={activity.images[0]}
                      style={{ objectFit: 'cover', borderRadius: 8 }}
                    />
                  </Image.PreviewGroup>
                </div>
              )}

              {/* 活动标题和基本信息 */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <Title level={2}>{activity.title}</Title>
                  <Space>
                    {activity.isFeatured && <Tag color="gold">推荐</Tag>}
                    <Tag color="blue">{activity.category}</Tag>
                    {activity.price > 0 && <Tag color="green">¥{activity.price}</Tag>}
                  </Space>
                </div>

                <Space size="large">
                  <div>
                    <CalendarOutlined /> {dayjs(activity.startTime).format('YYYY年MM月DD日 HH:mm')}
                  </div>
                  <div>
                    <EnvironmentOutlined /> {activity.location}
                  </div>
                  <div>
                    <TeamOutlined /> {activity.currentParticipants}/{activity.maxParticipants} 人
                  </div>
                </Space>
              </div>

              {/* 报名进度 */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>报名进度</Text>
                  <Text>{activity.progressPercentage}%</Text>
                </div>
                <Progress 
                  percent={activity.progressPercentage} 
                  status={activity.isFull ? 'exception' : 'active'}
                />
                <Text type="secondary">
                  剩余 {activity.remainingSpots} 个名额
                </Text>
              </div>

              {/* 活动描述 */}
              <div style={{ marginBottom: 24 }}>
                <Title level={4}>活动描述</Title>
                <Paragraph>{activity.description}</Paragraph>
              </div>

              {/* 活动要求 */}
              {activity.requirements && (
                <div style={{ marginBottom: 24 }}>
                  <Title level={4}>活动要求</Title>
                  <Paragraph>{activity.requirements}</Paragraph>
                </div>
              )}

              {/* 装备要求 */}
              {activity.equipment && (
                <div style={{ marginBottom: 24 }}>
                  <Title level={4}>装备要求</Title>
                  <Paragraph>{activity.equipment}</Paragraph>
                </div>
              )}

              {/* 标签 */}
              {activity.tags && activity.tags.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <Title level={4}>活动标签</Title>
                  <Space wrap>
                    {activity.tags.map(tag => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </Space>
                </div>
              )}
            </Card>
          </Col>

          {/* 侧边栏 */}
          <Col xs={24} lg={8}>
            {/* 组织者信息 */}
            <Card style={{ marginBottom: 24 }}>
              <Title level={4}>组织者</Title>
              {activity.organizer ? (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <Avatar 
                    size={64} 
                    src={activity.organizer.avatar}
                    icon={<UserOutlined />}
                  />
                  <div style={{ marginLeft: 16 }}>
                    <div style={{ fontWeight: 'bold' }}>{activity.organizer.username}</div>
                    {activity.organizer.bio && (
                      <div style={{ color: '#666', fontSize: '14px' }}>
                        {activity.organizer.bio}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>组织者信息不可用</div>
              )}
            </Card>

            {/* 报名操作 */}
            <Card style={{ marginBottom: 24 }}>
              <Title level={4}>报名信息</Title>
              
              {isRegistered ? (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <Tag color="orange">已报名</Tag>
                    <div>报名时间：{dayjs(activity.userRegistration.registrationTime).format('YYYY-MM-DD HH:mm')}</div>
                  </div>
                  <Button 
                    danger 
                    block 
                    onClick={handleCancelRegister}
                    disabled={activity.hasStarted}
                  >
                    取消报名
                  </Button>
                </div>
              ) : (
                <div>
                  {activity.isFull ? (
                    <div>
                      <Tag color="red">名额已满</Tag>
                      <Button block disabled>无法报名</Button>
                    </div>
                  ) : activity.hasStarted ? (
                    <div>
                      <Tag color="red">活动已开始</Tag>
                      <Button block disabled>无法报名</Button>
                    </div>
                  ) : (
                    <Button 
                      type="primary" 
                      size="large" 
                      block 
                      loading={registering}
                      onClick={handleRegister}
                    >
                      立即报名
                    </Button>
                  )}
                </div>
              )}
            </Card>

            {/* 已报名用户 */}
            {activity.registrations && activity.registrations.length > 0 && (
              <Card>
                <Title level={4}>已报名用户 ({activity.registrations.length})</Title>
                <List
                  size="small"
                  dataSource={activity.registrations.slice(0, 10)}
                  renderItem={registration => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar src={registration.user.avatar} icon={<UserOutlined />} />}
                        title={registration.user.username}
                        description={dayjs(registration.registrationTime).format('MM-DD HH:mm')}
                      />
                    </List.Item>
                  )}
                />
                {activity.registrations.length > 10 && (
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <Text type="secondary">还有 {activity.registrations.length - 10} 人...</Text>
                  </div>
                )}
              </Card>
            )}
          </Col>
        </Row>

        {/* 评论区域 */}
        <Card style={{ marginTop: 24 }}>
          <Tabs defaultActiveKey="comments">
            <TabPane tab="评论" key="comments">
              <div style={{ marginBottom: 16 }}>
                <Button 
                  type="primary" 
                  icon={<MessageOutlined />}
                  onClick={() => setCommentModalVisible(true)}
                  disabled={!isAuthenticated}
                >
                  发表评论
                </Button>
              </div>

              {comments.length > 0 ? (
                <List
                  itemLayout="vertical"
                  dataSource={comments}
                  renderItem={comment => (
                    <List.Item
                      actions={[
                        <Button 
                          type="text" 
                          icon={comment.hasLiked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                          onClick={() => handleLikeComment(comment._id)}
                        >
                          {comment.likeCount}
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar src={comment.user.avatar} icon={<UserOutlined />} />}
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{comment.user.username}</span>
                            <Rate disabled defaultValue={comment.rating} size="small" />
                          </div>
                        }
                        description={dayjs(comment.createdAt).format('YYYY-MM-DD HH:mm')}
                      />
                      <div>{comment.content}</div>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无评论" />
              )}
            </TabPane>
          </Tabs>
        </Card>

        {/* 评论模态框 */}
        <Modal
          title="发表评论"
          open={commentModalVisible}
          onCancel={() => setCommentModalVisible(false)}
          footer={null}
        >
          <Form form={commentForm} onFinish={handleComment}>
            <Form.Item
              name="rating"
              label="评分"
              initialValue={5}
            >
              <Rate />
            </Form.Item>
            <Form.Item
              name="content"
              label="评论内容"
              rules={[
                { required: true, message: '请输入评论内容' },
                { min: 1, max: 1000, message: '评论内容长度必须在1-1000个字符之间' }
              ]}
            >
              <TextArea rows={4} placeholder="分享您的活动体验..." />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={commenting} block>
                发表评论
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default ActivityDetailPage;
