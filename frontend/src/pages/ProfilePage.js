import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Avatar, 
  Button, 
  Space, 
  Tag, 
  Divider,
  List,
  Modal,
  Form,
  Input,
  message,
  Tabs,
  Statistic,
  Progress,
  Rate
} from 'antd';
import { 
  UserOutlined, 
  EditOutlined, 
  CalendarOutlined,
  TeamOutlined,
  TrophyOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { registrationAPI } from '../api/registrations';
import { commentAPI } from '../api/comments';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    fetchUserData();
    
    // 添加页面可见性变化监听器，当用户返回页面时刷新数据
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('个人资料页面重新可见，刷新数据');
        fetchUserData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 清理函数
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const [registrationsRes, commentsRes] = await Promise.all([
        registrationAPI.getUserRegistrations({ limit: 10 }),
        commentAPI.getUserComments({ limit: 10 })
      ]);
      
      setRegistrations(registrationsRes.data.registrations);
      setComments(commentsRes.data.comments);
    } catch (error) {
      console.error('获取用户数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = async (values) => {
    try {
      await updateProfile(values);
      message.success('个人信息更新成功');
      setEditModalVisible(false);
    } catch (error) {
      console.error('更新失败:', error);
    }
  };

  const handleChangePassword = async (values) => {
    try {
      await changePassword(values);
      message.success('密码修改成功');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      console.error('密码修改失败:', error);
    }
  };

  const handleCancelRegistration = async (activityId) => {
    Modal.confirm({
      title: '确认取消报名',
      content: '确定要取消报名吗？取消后如需重新报名，可能会被加入等待队列。',
      okText: '确认取消',
      cancelText: '再想想',
      onOk: async () => {
        try {
          await registrationAPI.cancelRegistration(activityId);
          message.success('取消报名成功');
          fetchUserData(); // 刷新数据
        } catch (error) {
          console.error('取消报名失败:', error);
          message.error(error.response?.data?.message || '取消报名失败');
        }
      }
    });
  };

  const renderRegistrationItem = (registration) => {
    // 检查活动是否已开始
    const hasStarted = registration.activity && 
      new Date() >= new Date(registration.activity.startTime);
    
    // 准备操作按钮
    const actions = [];
    
    // 查看活动按钮
    if (registration.activity) {
      actions.push(
        <Button 
          key="view"
          type="link" 
          size="small"
          onClick={() => window.open(`/activities/${registration.activity._id}`, '_blank')}
        >
          查看活动
        </Button>
      );
    }
    
    // 取消报名按钮 - 只有未开始且未取消的活动才显示
    if (registration.activity && !hasStarted && registration.status !== 'cancelled') {
      actions.push(
        <Button 
          key="cancel"
          type="link" 
          size="small"
          danger
          onClick={() => handleCancelRegistration(registration.activity._id)}
        >
          取消报名
        </Button>
      );
    }
    
    // 不再显示状态标签
    
    return (
      <List.Item key={registration._id} actions={actions}>
        <List.Item.Meta
          title={registration.activity ? registration.activity.title : '(活动已删除)'}
          description={
            <Space direction="vertical" size="small">
              {registration.activity ? (
                <>
                  <div>
                    <CalendarOutlined /> {dayjs(registration.activity.startTime).format('YYYY-MM-DD HH:mm')}
                  </div>
                  <div>
                    <TeamOutlined /> {registration.activity.location}
                  </div>
                </>
              ) : (
                <div>活动信息不可用</div>
              )}
              {/* 状态标签已移除 */}
            </Space>
          }
        />
      </List.Item>
    );
  };

  const renderCommentItem = (comment) => (
    <List.Item
      key={comment._id}
      actions={[
        comment.activity && (
          <Button 
            key="view"
            type="link" 
            size="small"
            onClick={() => window.open(`/activities/${comment.activity._id}`, '_blank')}
          >
            查看活动
          </Button>
        )
      ].filter(Boolean)}
    >
      <List.Item.Meta
        title={
          <Space>
            <span>{comment.activity ? comment.activity.title : '(活动已删除)'}</span>
            <Rate disabled defaultValue={comment.rating} size="small" />
          </Space>
        }
        description={
          <Space direction="vertical" size="small">
            <div>{dayjs(comment.createdAt).format('YYYY-MM-DD HH:mm')}</div>
            <div>{comment.content}</div>
          </Space>
        }
      />
    </List.Item>
  );

  return (
    <div style={{ padding: '24px 0' }}>
      <div className="container">
        <Row gutter={[24, 24]}>
          {/* 个人信息卡片 */}
          <Col xs={24} lg={8}>
            <Card>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Avatar 
                  size={120} 
                  src={user?.avatar}
                  icon={<UserOutlined />}
                  style={{ marginBottom: 16 }}
                />
                <Title level={3}>{user?.username}</Title>
                <Paragraph type="secondary">{user?.email}</Paragraph>
                <Space>
                  <Tag color="blue">{user?.role === 'admin' ? '管理员' : '用户'}</Tag>
                  {user?.phone && <Tag color="green">{user?.phone}</Tag>}
                  {user?.isBanned && <Tag color="red">账号已封禁</Tag>}
                </Space>
                {user?.isBanned && (
                  <div style={{ marginTop: 8 }}>
                    <Tag color="red">封禁原因: {user.banReason || '违反社区规定'}</Tag>
                  </div>
                )}
              </div>

              {user?.bio && (
                <div style={{ marginBottom: 24 }}>
                  <Title level={5}>个人简介</Title>
                  <Paragraph>{user.bio}</Paragraph>
                </div>
              )}

              <Space direction="vertical" style={{ width: '100%' }}>
                <Button 
                  type="primary" 
                  icon={<EditOutlined />}
                  block
                  onClick={() => setEditModalVisible(true)}
                >
                  编辑资料
                </Button>
                <Button 
                  icon={<SettingOutlined />}
                  block
                  onClick={() => setPasswordModalVisible(true)}
                >
                  修改密码
                </Button>
              </Space>

              <Divider />

              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">
                  注册时间：{dayjs(user?.createdAt).format('YYYY-MM-DD')}
                </Text>
                {user?.lastLogin && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      最后登录：{dayjs(user.lastLogin).format('YYYY-MM-DD HH:mm')}
                    </Text>
                  </div>
                )}
              </div>
            </Card>
          </Col>

          {/* 统计信息 */}
          <Col xs={24} lg={16}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8}>
                <Card>
                  <Statistic
                    title="参与活动"
                    value={registrations ? registrations.filter(r => r && r.status === 'confirmed').length : 0}
                    prefix={<TeamOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card>
                  <Statistic
                    title="等待队列"
                    value={registrations ? registrations.filter(r => r && r.status === 'waitlist').length : 0}
                    prefix={<CalendarOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card>
                  <Statistic
                    title="发表评论"
                    value={comments ? comments.length : 0}
                    prefix={<TrophyOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 详细信息标签页 */}
            <Card style={{ marginTop: 16 }}>
              <Tabs defaultActiveKey="registrations">
                <TabPane tab="我的报名" key="registrations">
                  {registrations && registrations.length > 0 ? (
                    <List
                      dataSource={registrations.filter(item => item && item._id && item.activity)}
                      renderItem={renderRegistrationItem}
                      rowKey={item => item._id}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <Text type="secondary">暂无报名记录</Text>
                    </div>
                  )}
                </TabPane>
                
                <TabPane tab="我的评论" key="comments">
                  {comments && comments.length > 0 ? (
                    <List
                      dataSource={comments.filter(item => item && item._id && (item.activity || !item.activity))}
                      renderItem={renderCommentItem}
                      rowKey={item => item._id}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <Text type="secondary">暂无评论记录</Text>
                    </div>
                  )}
                </TabPane>
              </Tabs>
            </Card>
          </Col>
        </Row>

        {/* 编辑资料模态框 */}
        <Modal
          title="编辑个人资料"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          footer={null}
        >
          <Form
            form={editForm}
            layout="vertical"
            initialValues={{
              username: user?.username,
              phone: user?.phone,
              bio: user?.bio
            }}
            onFinish={handleEditProfile}
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, max: 20, message: '用户名长度必须在3-20个字符之间' }
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="phone"
              label="手机号码"
              rules={[
                { 
                  pattern: /^1[3-9]\d{9}$/, 
                  message: '请输入有效的手机号码' 
                }
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="bio"
              label="个人简介"
              rules={[
                { max: 200, message: '个人简介最多200个字符' }
              ]}
            >
              <Input.TextArea rows={4} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                保存修改
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* 修改密码模态框 */}
        <Modal
          title="修改密码"
          open={passwordModalVisible}
          onCancel={() => setPasswordModalVisible(false)}
          footer={null}
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleChangePassword}
          >
            <Form.Item
              name="currentPassword"
              label="当前密码"
              rules={[
                { required: true, message: '请输入当前密码' }
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码至少6个字符' },
                { 
                  pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, 
                  message: '密码必须包含字母和数字' 
                }
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="确认新密码"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default ProfilePage;
