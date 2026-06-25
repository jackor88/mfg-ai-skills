import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Badge, theme } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  CalculatorOutlined,
  WalletOutlined,
  SettingOutlined,
  ApiOutlined,
  LogoutOutlined,
  UserOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const { token } = theme.useToken();

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
    { key: '/quotations', icon: <FileTextOutlined />, label: 'AI报价', permission: 'quotation:view' },
    { key: '/orders', icon: <ShoppingCartOutlined />, label: '订单跟踪', permission: 'order:view' },
    { key: '/cost', icon: <CalculatorOutlined />, label: '成本核算', permission: 'cost:view' },
    { key: '/billing', icon: <WalletOutlined />, label: '算力充值', permission: 'payment:view' },
    { key: '/erp', icon: <ApiOutlined />, label: 'ERP同步', permission: 'system:settings' },
    { key: '/settings', icon: <SettingOutlined />, label: '系统设置', permission: 'user:view' },
  ].filter((item) => !item.permission || hasPermission(item.permission));

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: `${user?.realName || user?.username}（${user?.roles?.[0]?.name || '用户'}）`,
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => { logout(); navigate('/login'); },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="light" style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.06)' }}>
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
          gap: 8,
        }}>
          <RobotOutlined style={{ fontSize: 28, color: token.colorPrimary }} />
          <Text strong style={{ fontSize: 18 }}>工厂AI SaaS</Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <Text type="secondary">智能报价 · 高效跟单 · 精准算账</Text>
          <Space size="large">
            <Badge count="AI" offset={[0, 4]}>
              <Text style={{ color: token.colorPrimary }}>
                <RobotOutlined /> AI辅助已就绪
              </Text>
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary }} />
                <span>{user?.realName || user?.username}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: 24, background: '#fff', borderRadius: 8, padding: 24, minHeight: 'calc(100vh - 112px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
