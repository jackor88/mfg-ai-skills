import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Space, List, Tag, Empty, Button } from 'antd';
import {
  FileTextOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  RobotOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import dayjs from 'dayjs';
import { quotationApi, orderApi, costApi, billingApi } from '../api';

const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  draft: '#d9d9d9', pending: '#faad14', reviewing: '#1890ff',
  confirmed: '#52c41a', rejected: '#ff4d4f', cancelled: '#8c8c8c',
  production: '#1890ff', shipped: '#722ed1', delivered: '#13c2c2', completed: '#52c41a',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>({ q: null, o: null, c: null, b: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      quotationApi.statistics(),
      orderApi.dashboard(),
      costApi.dashboard(),
      billingApi.account(),
    ]).then((results) => {
      setStats({
        q: results[0].status === 'fulfilled' ? results[0].value.data : null,
        o: results[1].status === 'fulfilled' ? results[1].value.data : null,
        c: results[2].status === 'fulfilled' ? results[2].value.data : null,
        b: results[3].status === 'fulfilled' ? results[3].value.data : null,
      });
      setLoading(false);
    });
  }, []);

  const trendData = stats.q?.recentQuotations?.map((q: any, i: number) => ({
    name: dayjs(q.createdAt).format('MM-DD'),
    报价: q.totalPrice || 0,
    成本: q.estimatedCost || 0,
  })) || Array.from({ length: 7 }, (_, i) => ({
    name: dayjs().subtract(6 - i, 'day').format('MM-DD'),
    报价: Math.round(Math.random() * 50000 + 20000),
    成本: Math.round(Math.random() * 30000 + 15000),
  }));

  const orderStatusData = [
    { name: '待审核', value: stats.o?.byStatus?.pending || 0, color: '#faad14' },
    { name: '生产中', value: stats.o?.byStatus?.production || 0, color: '#1890ff' },
    { name: '已发货', value: stats.o?.byStatus?.shipped || 0, color: '#722ed1' },
    { name: '已完成', value: stats.o?.byStatus?.completed || 0, color: '#52c41a' },
  ];

  const recentItems = [
    ...(stats.q?.items || []).slice(0, 3).map((q: any) => ({ ...q, type: 'quotation' })),
    ...(stats.o?.items || []).slice(0, 3).map((o: any) => ({ ...o, type: 'order' })),
  ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>工作台</Title>
        <Text type="secondary">欢迎回来，今天也让AI帮您搞定报价吧！</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/quotations')}>
            <Statistic
              title="本月报价单"
              value={stats.q?.total || 0}
              prefix={<FileTextOutlined />}
              suffix="份"
              valueStyle={{ color: '#1677ff' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <ArrowUpOutlined style={{ color: '#52c41a' }} /> 待审核 {stats.q?.pending || 0} 份
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/orders')}>
            <Statistic
              title="进行中订单"
              value={stats.o?.activeOrders || 0}
              prefix={<ShoppingCartOutlined />}
              suffix="单"
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <ClockCircleOutlined /> 生产中 {stats.o?.byStatus?.production || 0} 单
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/cost')}>
            <Statistic
              title="本月利润"
              value={stats.c?.monthlyProfit || 0}
              precision={0}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                利润率 {stats.c?.profitRate?.toFixed(1) || 0}%
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/billing')}>
            <Statistic
              title="AI算力余额"
              value={stats.b?.balance || 0}
              precision={2}
              prefix={<RobotOutlined />}
              suffix="元"
              valueStyle={{ color: '#fa8c16' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                剩余核价次数 <Text strong>{stats.b?.quotaCount || 0}</Text> 次
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="报价/成本趋势" extra={<Button type="link" onClick={() => navigate('/quotations')}>查看全部</Button>}>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="c1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1677ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="c2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff4d4f" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ff4d4f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Area type="monotone" dataKey="报价" stroke="#1677ff" fill="url(#c1)" strokeWidth={2} />
                  <Area type="monotone" dataKey="成本" stroke="#ff4d4f" fill="url(#c2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="订单状态分布">
            <div style={{ height: 280, display: 'flex', alignItems: 'center' }}>
              {orderStatusData.every(d => d.value === 0) ? (
                <Empty description="暂无订单数据" style={{ margin: 'auto' }} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {orderStatusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="最近动态" style={{ marginTop: 16 }}>
        <List
          dataSource={recentItems}
          locale={{ emptyText: <Empty description="暂无数据，开始创建第一份报价吧！" /> }}
          renderItem={(item: any) => (
            <List.Item
              actions={[
                <Button type="link" size="small" onClick={() => navigate(`/${item.type === 'quotation' ? 'quotations' : 'orders'}/${item.id}`)}>
                  查看详情
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  item.type === 'quotation'
                    ? <FileTextOutlined style={{ fontSize: 24, color: '#1677ff' }} />
                    : <ShoppingCartOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                }
                title={
                  <Space>
                    <Tag color={item.type === 'quotation' ? 'blue' : 'purple'}>
                      {item.type === 'quotation' ? '报价单' : '订单'}
                    </Tag>
                    <span>{item.productName}</span>
                    <Tag color={STATUS_COLORS[item.status] || 'default'}>{item.status}</Tag>
                  </Space>
                }
                description={
                  <Space split={<span style={{ color: '#d9d9d9' }}>|</span>}>
                    <Text type="secondary">客户：{item.customerName || '—'}</Text>
                    <Text type="secondary">金额：¥{item.totalPrice?.toLocaleString() || item.orderAmount?.toLocaleString() || 0}</Text>
                    <Text type="secondary">{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
