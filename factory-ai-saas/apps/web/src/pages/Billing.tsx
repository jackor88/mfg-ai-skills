import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Button, Space, Tag, Table, Modal, List, message, Descriptions, Typography } from 'antd';
import { WalletOutlined, ThunderboltOutlined, CreditCardOutlined, HistoryOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { billingApi } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function Billing() {
  const [account, setAccount] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [paying, setPaying] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [a, p, o, l] = await Promise.all([
        billingApi.account(),
        billingApi.packages(),
        billingApi.orders({ pageSize: 10 }),
        billingApi.consumeLogs({ pageSize: 10 }),
      ]);
      setAccount(a.data);
      setPackages(p.data || []);
      setOrders(o.data?.items || []);
      setLogs(l.data?.items || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRecharge = async (method: string) => {
    if (!selectedPkg) return;
    setPaying(true);
    try {
      const res: any = await billingApi.recharge({ packageId: selectedPkg.id, paymentMethod: method });
      const orderNo = res.data.orderNo;
      message.info('正在跳转支付...');
      await new Promise(r => setTimeout(r, 500));
      window.open(`/api/v1/payment/mock-pay/${orderNo}`, '_blank');
      Modal.success({
        title: '支付模拟',
        content: (
          <div>
            <p>订单号：{orderNo}</p>
            <p>已为您打开模拟支付页面。支付完成后点击下方按钮刷新。</p>
          </div>
        ),
        okText: '已支付，刷新',
        onOk: () => { load(); setRechargeOpen(false); setSelectedPkg(null); },
      });
    } catch (e) {
      message.error('创建订单失败');
    } finally { setPaying(false); }
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="算力余额"
              value={account?.balance || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fa8c16', fontSize: 32 }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">累计充值：¥{account?.totalRecharged?.toLocaleString() || 0}</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="剩余核价次数"
              value={account?.quotaCount || 0}
              suffix="次"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1677ff', fontSize: 32 }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">已使用：{account?.totalUsedCount || 0}次 / 累计消费：¥{account?.totalConsumed?.toLocaleString() || 0}</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div style={{ textAlign: 'center', color: 'white' }}>
              <WalletOutlined style={{ fontSize: 40, marginBottom: 8 }} />
              <Title level={4} style={{ color: 'white', margin: '8px 0' }}>算力不足？立即充值</Title>
              <Button type="primary" size="large" onClick={() => setRechargeOpen(true)}>
                立即充值
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="充值套餐" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          {packages.map((pkg) => (
            <Col xs={24} sm={12} md={6} key={pkg.id}>
              <Card
                hoverable
                style={{
                  textAlign: 'center',
                  border: pkg.recommended ? '2px solid #1677ff' : undefined,
                  position: 'relative',
                }}
                onClick={() => { setSelectedPkg(pkg); setRechargeOpen(true); }}
              >
                {pkg.recommended && <Tag color="red" style={{ position: 'absolute', top: 8, right: 8 }}>推荐</Tag>}
                <Title level={4}>{pkg.name}</Title>
                <div style={{ fontSize: 32, color: '#fa8c16', fontWeight: 'bold' }}>
                  ¥{pkg.price}
                </div>
                <div style={{ margin: '8px 0' }}>
                  <Text strong style={{ fontSize: 18 }}>{pkg.count}次</Text> AI核价
                </div>
                {pkg.bonus > 0 && <Tag color="gold">赠送{pkg.bonus}次</Tag>}
                <div style={{ marginTop: 8 }}><Text type="secondary">{pkg.description}</Text></div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title="交易记录" style={{ marginBottom: 16 }}>
        <Table
          dataSource={orders}
          rowKey="id"
          size="small"
          pagination={false}
          columns={[
            { title: '订单号', dataIndex: 'orderNo', width: 160 },
            { title: '套餐', dataIndex: 'packageName' },
            { title: '金额', dataIndex: 'amount', align: 'right', render: (v: number) => `¥${v}` },
            { title: '方式', dataIndex: 'paymentMethod', width: 80 },
            { title: '状态', dataIndex: 'status', width: 80,
              render: (s: string) => s === 'paid' ? <Tag color="green"><CheckCircleOutlined /> 已支付</Tag> : <Tag color="gold">待支付</Tag> },
            { title: '时间', dataIndex: 'paidAt', width: 140, render: (d: string, r: any) => dayjs(d || r.createdAt).format('YYYY-MM-DD HH:mm') },
          ]}
        />
      </Card>

      <Card title="AI消费记录">
        <Table
          dataSource={logs}
          rowKey="id"
          size="small"
          pagination={false}
          columns={[
            { title: '时间', dataIndex: 'createdAt', width: 140, render: (d: string) => dayjs(d).format('MM-DD HH:mm') },
            { title: '服务类型', dataIndex: 'serviceType' },
            { title: '关联业务', dataIndex: 'bizName' },
            { title: '消耗金额', dataIndex: 'costAmount', align: 'right', render: (v: number) => <Text type="danger">¥{v}</Text> },
            { title: '消耗次数', dataIndex: 'costCount', align: 'right', render: (v: number) => `${v}次` },
            { title: '状态', dataIndex: 'status', width: 80,
              render: (s: string) => s === 'success' ? <Tag color="green">成功</Tag> : <Tag color="red">失败</Tag> },
          ]}
        />
      </Card>

      <Modal
        title="选择支付方式"
        open={rechargeOpen}
        onCancel={() => { setRechargeOpen(false); setSelectedPkg(null); }}
        footer={null}
      >
        {selectedPkg ? (
          <div>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="套餐">{selectedPkg.name}</Descriptions.Item>
              <Descriptions.Item label="核价次数">{selectedPkg.count}次 {selectedPkg.bonus > 0 && `(赠送${selectedPkg.bonus}次)`}</Descriptions.Item>
              <Descriptions.Item label="金额"><Text strong style={{ fontSize: 18, color: '#fa8c16' }}>¥{selectedPkg.price}</Text></Descriptions.Item>
            </Descriptions>
            <Title level={5} style={{ marginTop: 16 }}>选择支付方式：</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block size="large" icon={<CreditCardOutlined />} loading={paying} onClick={() => handleRecharge('alipay')}>
                支付宝支付
              </Button>
              <Button block size="large" icon={<CreditCardOutlined />} loading={paying} onClick={() => handleRecharge('wechat')}>
                微信支付
              </Button>
            </Space>
          </div>
        ) : (
          <List
            dataSource={packages}
            renderItem={(pkg) => (
              <List.Item
                actions={[<Button type="primary" onClick={() => setSelectedPkg(pkg)}>选择</Button>]}
              >
                <List.Item.Meta
                  title={<Space>{pkg.name} {pkg.recommended && <Tag color="red">推荐</Tag>}</Space>}
                  description={`${pkg.count}次核价 · ${pkg.description}`}
                />
                <div><Text strong style={{ color: '#fa8c16' }}>¥{pkg.price}</Text></div>
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  );
}
