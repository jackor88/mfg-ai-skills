import React, { useState } from 'react';
import { Form, Input, Button, Card, Tabs, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, BankOutlined, RobotOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await login(values.username, values.password, values.tenantCode || 'DEMO');
      message.success('登录成功');
      navigate('/dashboard');
    } catch (e: any) {
      message.error(e.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (username: string) => {
    onFinish({ username, password: '123456', tenantCode: 'DEMO' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: 'white' }}>
        <div style={{ maxWidth: 480 }}>
          <Space align="center" style={{ marginBottom: 24 }}>
            <RobotOutlined style={{ fontSize: 48 }} />
            <Title level={1} style={{ color: 'white', margin: 0 }}>工厂AI SaaS</Title>
          </Space>
          <Title level={3} style={{ color: 'white', fontWeight: 300, marginBottom: 32 }}>
            让工厂老板从繁琐的<br />报价、跟单、算账中解放出来
          </Title>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { icon: '🤖', title: 'AI智能核价', desc: '10秒生成精准报价' },
              { icon: '📦', title: '订单跟踪', desc: '生产进度实时掌握' },
              { icon: '💰', title: '成本核算', desc: '利润分析一目了然' },
              { icon: '🔗', title: 'ERP对接', desc: '数据自动同步' },
            ].map((f) => (
              <div key={f.title} style={{
                background: 'rgba(255,255,255,0.15)',
                padding: 16,
                borderRadius: 8,
                backdropFilter: 'blur(10px)',
              }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{f.icon}</div>
                <div style={{ fontWeight: 600 }}>{f.title}</div>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>{f.desc}</Text>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <Card style={{ width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>欢迎登录</Title>
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
            请使用您的账号登录
          </Text>
          <Form name="login" onFinish={onFinish} size="large" initialValues={{ tenantCode: 'DEMO' }}>
            <Form.Item name="tenantCode" rules={[{ required: true, message: '请输入租户编码' }]}>
              <Input prefix={<BankOutlined />} placeholder="租户编码（默认DEMO）" />
            </Form.Item>
            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input prefix={<UserOutlined />} placeholder="用户名" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                登 录
              </Button>
            </Form.Item>
          </Form>
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>快速体验演示账号：</Text>
            <Space wrap>
              <Button size="small" onClick={() => quickLogin('boss')}>老板 (boss)</Button>
              <Button size="small" onClick={() => quickLogin('sales')}>业务员 (sales)</Button>
              <Button size="small" onClick={() => quickLogin('merch')}>跟单员 (merch)</Button>
              <Button size="small" onClick={() => quickLogin('finance')}>财务 (finance)</Button>
            </Space>
            <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>密码统一为：123456</Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
