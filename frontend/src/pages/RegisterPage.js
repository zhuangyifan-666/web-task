import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Divider, 
  message,
  Checkbox
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  PhoneOutlined 
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title, Paragraph } = Typography;

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await register(values);
      if (result.success) {
        message.success('注册成功！');
        navigate('/');
      }
    } catch (error) {
      console.error('注册失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          width: '100%', 
          maxWidth: 450,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2}>创建账户</Title>
          <Paragraph type="secondary">
            加入我们，开始您的运动之旅
          </Paragraph>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, max: 20, message: '用户名长度必须在3-20个字符之间' },
              { 
                pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, 
                message: '用户名只能包含字母、数字、下划线和中文' 
              }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱地址"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="请输入邮箱地址"
            />
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
            <Input
              prefix={<PhoneOutlined />}
              placeholder="请输入手机号码（可选）"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
              { 
                pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, 
                message: '密码必须包含字母和数字' 
              }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入密码"
            />
          </Form.Item>

          <Form.Item
            name="agreement"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value ? Promise.resolve() : Promise.reject(new Error('请阅读并同意用户协议')),
              },
            ]}
          >
            <Checkbox>
              我已阅读并同意{' '}
              <Link to="/terms" target="_blank">
                用户协议
              </Link>
              {' '}和{' '}
              <Link to="/privacy" target="_blank">
                隐私政策
              </Link>
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%' }}
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <Divider>或者</Divider>

        <div style={{ textAlign: 'center' }}>
          <Paragraph>
            已有账户？{' '}
            <Link to="/login" style={{ color: '#1890ff', fontWeight: 'bold' }}>
              立即登录
            </Link>
          </Paragraph>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link to="/">
            <Button type="link">
              ← 返回首页
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;