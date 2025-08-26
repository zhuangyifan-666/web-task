import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Form, 
  Input, 
  Button, 
  Select, 
  DatePicker, 
  InputNumber, 
  Typography, 
  Card, 
  message, 
  Space,
  Divider,
  Tag,
  Upload
} from 'antd';
import { 
  PlusOutlined, 
  UploadOutlined, 
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  TagOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { activityAPI } from '../api/activities';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const CreateActivityPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = React.useRef(null);

  useEffect(() => {
    // 如果用户未登录，重定向到登录页面
    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login', { state: { from: '/activities/create' } });
      return;
    }

    fetchCategories();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (inputVisible) {
      inputRef.current?.focus();
    }
  }, [inputVisible]);

  const fetchCategories = async () => {
    try {
      // 使用预定义的分类列表，与首页保持一致
      const predefinedCategories = [
        '篮球', '足球', '羽毛球', '乒乓球', '游泳', '跑步', '健身', '瑜伽'
      ];
      
      // 从API获取已有分类
      const response = await activityAPI.getCategories();
      
      // 合并预定义分类和已有分类，去重
      const allCategories = [...new Set([...predefinedCategories, ...response.data.categories])];
      
      setCategories(allCategories);
    } catch (error) {
      console.error('获取分类失败:', error);
      message.error('获取活动分类失败');
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // 处理日期范围
      const [startTime, endTime] = values.timeRange;
      
      // 构建活动数据
      const activityData = {
        ...values,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        tags,
      };
      
      // 移除timeRange字段
      delete activityData.timeRange;
      
      console.log('提交活动数据:', activityData);
      
      const response = await activityAPI.createActivity(activityData);
      
      // 根据响应消息显示不同的提示
      message.success(response.data.message);
      
      // 如果是管理员或活动已发布，跳转到活动详情页
      // 否则跳转到活动列表页
      if (response.data.activity.status === 'published') {
        navigate(`/activities/${response.data.activity._id}`);
      } else {
        navigate('/activities');
      }
    } catch (error) {
      console.error('创建活动失败:', error);
      const errorMsg = error.response?.data?.message || '创建活动失败，请稍后重试';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 标签相关处理函数
  const handleClose = (removedTag) => {
    const newTags = tags.filter(tag => tag !== removedTag);
    setTags(newTags);
  };

  const showInput = () => {
    setInputVisible(true);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputConfirm = () => {
    if (inputValue && !tags.includes(inputValue)) {
      setTags([...tags, inputValue]);
    }
    setInputVisible(false);
    setInputValue('');
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <div className="container">
        <Card>
          <Title level={2}>创建新活动</Title>
          <Paragraph type="secondary">
            填写以下表单，创建您的体育活动
          </Paragraph>
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              price: 0,
              maxParticipants: 10
            }}
          >
            {/* 基本信息 */}
            <Title level={4}>基本信息</Title>
            <Form.Item
              name="title"
              label="活动标题"
              rules={[
                { required: true, message: '请输入活动标题' },
                { min: 2, max: 100, message: '标题长度必须在2-100个字符之间' }
              ]}
            >
              <Input placeholder="请输入活动标题" maxLength={100} />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="活动描述"
              rules={[
                { required: true, message: '请输入活动描述' },
                { min: 10, max: 2000, message: '描述长度必须在10-2000个字符之间' }
              ]}
            >
              <TextArea 
                placeholder="请详细描述活动内容、规则等信息" 
                rows={6} 
                maxLength={2000} 
                showCount 
              />
            </Form.Item>
            
            <Form.Item
              name="category"
              label="活动分类"
              rules={[{ required: true, message: '请选择活动分类' }]}
            >
              <Select placeholder="请选择活动分类">
                {categories.map(category => (
                  <Option key={category} value={category}>{category}</Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="location"
              label="活动地点"
              rules={[
                { required: true, message: '请输入活动地点' },
                { min: 2, max: 200, message: '地点长度必须在2-200个字符之间' }
              ]}
            >
              <Input 
                placeholder="请输入活动地点" 
                prefix={<EnvironmentOutlined />} 
                maxLength={200} 
              />
            </Form.Item>
            
            <Form.Item
              name="timeRange"
              label="活动时间"
              rules={[
                { required: true, message: '请选择活动时间' },
                {
                  validator: (_, value) => {
                    if (!value || !value[0] || !value[1]) {
                      return Promise.reject('请选择开始和结束时间');
                    }
                    if (value[0].isAfter(value[1])) {
                      return Promise.reject('结束时间必须晚于开始时间');
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <RangePicker 
                showTime 
                format="YYYY-MM-DD HH:mm" 
                placeholder={['开始时间', '结束时间']}
                style={{ width: '100%' }}
              />
            </Form.Item>
            
            <Form.Item
              name="maxParticipants"
              label="最大参与人数"
              rules={[
                { required: true, message: '请输入最大参与人数' },
                { type: 'number', min: 1, max: 1000, message: '参与人数必须在1-1000之间' }
              ]}
            >
              <InputNumber 
                min={1} 
                max={1000} 
                style={{ width: '100%' }} 
                prefix={<TeamOutlined />} 
              />
            </Form.Item>
            
            <Form.Item
              name="price"
              label="活动价格"
              rules={[
                { required: true, message: '请输入活动价格' },
                { type: 'number', min: 0, message: '价格不能为负数' }
              ]}
            >
              <InputNumber 
                min={0} 
                step={10} 
                style={{ width: '100%' }} 
                prefix="¥" 
                placeholder="0表示免费活动" 
              />
            </Form.Item>
            
            <Divider />
            
            {/* 附加信息 */}
            <Title level={4}>附加信息</Title>
            <Form.Item
              name="requirements"
              label="活动要求"
            >
              <TextArea 
                placeholder="请输入参与者需要满足的条件或要求" 
                rows={3} 
                maxLength={500} 
                showCount 
              />
            </Form.Item>
            
            <Form.Item
              name="equipment"
              label="装备要求"
            >
              <TextArea 
                placeholder="请输入参与者需要准备的装备" 
                rows={3} 
                maxLength={500} 
                showCount 
              />
            </Form.Item>
            
            <Form.Item label="活动标签">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {tags.map((tag, index) => (
                  <Tag
                    key={tag}
                    closable
                    onClose={() => handleClose(tag)}
                    style={{ marginRight: 0 }}
                  >
                    {tag}
                  </Tag>
                ))}
                {inputVisible ? (
                  <Input
                    ref={inputRef}
                    type="text"
                    size="small"
                    style={{ width: 78 }}
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputConfirm}
                    onPressEnter={handleInputConfirm}
                  />
                ) : (
                  <Tag onClick={showInput} style={{ cursor: 'pointer' }}>
                    <PlusOutlined /> 添加标签
                  </Tag>
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                <Paragraph type="secondary" style={{ fontSize: '12px' }}>
                  标签可以帮助用户更好地找到您的活动，例如：初学者友好、专业教练、室内活动等
                </Paragraph>
              </div>
            </Form.Item>
            
            <Divider />
            
            {/* 提交按钮 */}
            <Form.Item>
              <Space size="large">
                <Button type="primary" htmlType="submit" loading={loading} size="large">
                  创建活动
                </Button>
                <Button onClick={() => navigate('/activities')} size="large">
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default CreateActivityPage;
