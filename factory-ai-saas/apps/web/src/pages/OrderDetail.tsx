import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Tag, Steps, Timeline, Spin, Result, Table, Typography, Row, Col, Statistic } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { orderApi, costApi } from '../api';

const { Title, Text } = Typography;

const STAGES = [
  { status: 'pending', title: '待排产' },
  { status: 'production', title: '生产中' },
  { status: 'shipped', title: '已发货' },
  { status: 'delivered', title: '已送达' },
  { status: 'completed', title: '已完成' },
];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [costData, setCostData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [orderRes, costRes] = await Promise.allSettled([
        orderApi.detail(id!),
        costApi.orderCost(id!).catch(() => ({ data: null })),
      ]);
      if (orderRes.status === 'fulfilled') setData(orderRes.value.data);
      if (costRes.status === 'fulfilled') setCostData(costRes.value.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!data) return <Result status="404" title="订单不存在" />;

  const currentIdx = STAGES.findIndex(s => s.status === data.status);

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>订单 {data.orderNo}</Title>
        <Tag color={data.status === 'completed' ? 'green' : data.status === 'cancelled' ? 'red' : 'blue'}>
          {STAGES.find(s => s.status === data.status)?.title || data.status}
        </Tag>
      </Space>

      <Steps current={currentIdx < 0 ? 0 : currentIdx} style={{ marginBottom: 24 }}
        items={STAGES.map(s => ({ title: s.title }))} />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="订单金额" value={data.orderAmount || 0} prefix="¥" precision={0} /></Card></Col>
        <Col span={6}><Card><Statistic title="已收款" value={costData?.totalReceived || 0} prefix="¥" precision={0} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="成本" value={costData?.totalCost || 0} prefix="¥" precision={0} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="利润" value={(data.orderAmount || 0) - (costData?.totalCost || 0)} prefix="¥" precision={0} valueStyle={{ color: '#1677ff' }} /></Card></Col>
      </Row>

      <Card title="订单信息" style={{ marginBottom: 16 }}>
        <Descriptions column={3} bordered size="small">
          <Descriptions.Item label="产品名称">{data.productName}</Descriptions.Item>
          <Descriptions.Item label="客户">{data.customerName || '—'}</Descriptions.Item>
          <Descriptions.Item label="数量">{data.quantity?.toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="交货期">{data.deliveryDate ? dayjs(data.deliveryDate).format('YYYY-MM-DD') : '—'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{dayjs(data.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="备注">{data.remark || '—'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="生产进度追踪">
        <Timeline
          items={(data.productionLogs || []).map((log: any) => ({
            color: log.stage === '完成' ? 'green' : 'blue',
            children: (
              <div>
                <Text strong>{log.stage}</Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>{dayjs(log.createdAt).format('YYYY-MM-DD HH:mm')}</Text>
                {log.remark && <div><Text type="secondary">{log.remark}</Text></div>}
                {log.operatorName && <div><Text type="secondary">操作人：{log.operatorName}</Text></div>}
              </div>
            ),
          }))}
        />
        {(!data.productionLogs || data.productionLogs.length === 0) && (
          <Text type="secondary">暂无进度记录</Text>
        )}
      </Card>
    </div>
  );
}
