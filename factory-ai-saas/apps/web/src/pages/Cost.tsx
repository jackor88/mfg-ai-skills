import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Tabs, Table, Button, Space, Modal, Form, Input, InputNumber, Select, DatePicker, message, Tag } from 'antd';
import { PlusOutlined, DollarOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { costApi } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const { TextArea } = Input;

export default function Cost() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [profit, setProfit] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordOpen, setRecordOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [recordForm] = Form.useForm();
  const [paymentForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [d, r, p, pa] = await Promise.all([
        costApi.dashboard(),
        costApi.records({ pageSize: 20 }),
        costApi.payments({ pageSize: 20 }),
        costApi.profitAnalysis({ months: 6 }),
      ]);
      setDashboard(d.data);
      setRecords(r.data.items || []);
      setPayments(p.data.items || []);
      setProfit(pa.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAddRecord = async () => {
    const values = await recordForm.validateFields();
    await costApi.addRecord({
      ...values,
      date: values.date.format('YYYY-MM-DD'),
    });
    message.success('成本记录已添加');
    setRecordOpen(false); recordForm.resetFields();
    load();
  };

  const handleAddPayment = async () => {
    const values = await paymentForm.validateFields();
    await costApi.addPayment({
      ...values,
      paymentDate: values.paymentDate.format('YYYY-MM-DD'),
    });
    message.success('收款记录已添加');
    setPaymentOpen(false); paymentForm.resetFields();
    load();
  };

  const costColumns = [
    { title: '日期', dataIndex: 'date', width: 100, render: (d: string) => dayjs(d).format('MM-DD') },
    { title: '订单', dataIndex: 'orderNo', width: 130 },
    { title: '类型', dataIndex: 'category', width: 100,
      render: (c: string) => <Tag color={c === '原料' ? 'orange' : c === '人工' ? 'blue' : 'default'}>{c}</Tag> },
    { title: '描述', dataIndex: 'description' },
    { title: '金额', dataIndex: 'amount', align: 'right' as const, width: 100,
      render: (v: number) => <span style={{ color: '#ff4d4f' }}>¥{v?.toLocaleString()}</span> },
  ];

  const paymentColumns = [
    { title: '收款日期', dataIndex: 'paymentDate', width: 110, render: (d: string) => dayjs(d).format('YYYY-MM-DD') },
    { title: '订单', dataIndex: 'orderNo', width: 130 },
    { title: '客户', dataIndex: 'customerName' },
    { title: '金额', dataIndex: 'amount', align: 'right' as const, width: 120,
      render: (v: number) => <span style={{ color: '#52c41a' }}>¥{v?.toLocaleString()}</span> },
    { title: '方式', dataIndex: 'method', width: 80 },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="本月收款" value={dashboard?.monthlyIncome || 0} prefix="¥" precision={0}
          valueStyle={{ color: '#52c41a' }} prefixEl={<ArrowUpOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="本月成本" value={dashboard?.monthlyCost || 0} prefix="¥" precision={0}
          valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="本月利润" value={dashboard?.monthlyProfit || 0} prefix="¥" precision={0}
          valueStyle={{ color: '#1677ff' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="利润率" value={dashboard?.profitRate || 0} suffix="%" precision={1} /></Card></Col>
      </Row>

      <Card title="利润趋势（近6个月）" style={{ marginBottom: 16 }}>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={profit}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v: number) => `¥${v?.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="income" name="收入" fill="#52c41a" />
              <Bar dataKey="cost" name="成本" fill="#ff4d4f" />
              <Bar dataKey="profit" name="利润" fill="#1677ff" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <Tabs
          items={[
            {
              key: 'costs',
              label: '成本记录',
              children: (
                <>
                  <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 12 }} onClick={() => setRecordOpen(true)}>
                    记一笔成本
                  </Button>
                  <Table columns={costColumns} dataSource={records} rowKey="id" pagination={false} size="small" />
                </>
              ),
            },
            {
              key: 'payments',
              label: '收款记录',
              children: (
                <>
                  <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 12 }} onClick={() => setPaymentOpen(true)}>
                    记一笔收款
                  </Button>
                  <Table columns={paymentColumns} dataSource={payments} rowKey="id" pagination={false} size="small" />
                </>
              ),
            },
          ]}
        />
      </Card>

      <Modal title="记成本" open={recordOpen} onCancel={() => setRecordOpen(false)} onOk={handleAddRecord}>
        <Form form={recordForm} layout="vertical" initialValues={{ date: dayjs(), category: '原料' }}>
          <Form.Item name="date" label="日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="category" label="类型" rules={[{ required: true }]}>
            <Select options={[
              { value: '原料', label: '原料' },
              { value: '人工', label: '人工' },
              { value: '设备', label: '设备' },
              { value: '运费', label: '运费' },
              { value: '其他', label: '其他' },
            ]} />
          </Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item name="description" label="描述"><TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="记收款" open={paymentOpen} onCancel={() => setPaymentOpen(false)} onOk={handleAddPayment}>
        <Form form={paymentForm} layout="vertical" initialValues={{ paymentDate: dayjs(), method: '银行转账' }}>
          <Form.Item name="paymentDate" label="收款日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item name="method" label="收款方式" rules={[{ required: true }]}>
            <Select options={[
              { value: '银行转账', label: '银行转账' },
              { value: '微信', label: '微信' },
              { value: '支付宝', label: '支付宝' },
              { value: '现金', label: '现金' },
            ]} />
          </Form.Item>
          <Form.Item name="remark" label="备注"><TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
