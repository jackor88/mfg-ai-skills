import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Tag, Input, Modal, Form, InputNumber, DatePicker, message, Select, Progress, Timeline } from 'antd';
import { SearchOutlined, EyeOutlined, TruckOutlined, CheckCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { orderApi } from '../api';

const { RangePicker } = DatePicker;
const STATUS_MAP: Record<string, { color: string; label: string; progress: number }> = {
  pending: { color: 'gold', label: '待排产', progress: 10 },
  production: { color: 'blue', label: '生产中', progress: 40 },
  shipped: { color: 'purple', label: '已发货', progress: 70 },
  delivered: { color: 'cyan', label: '已送达', progress: 85 },
  completed: { color: 'green', label: '已完成', progress: 100 },
  cancelled: { color: 'default', label: '已取消', progress: 0 },
};

export default function Orders() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [progressOpen, setProgressOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [progressForm] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await orderApi.list({ page, pageSize: 10, keyword });
      setData(res.data.items);
      setTotal(res.data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [page]);

  const handleUpdateProgress = async () => {
    const values = await progressForm.validateFields();
    await orderApi.updateProgress(currentOrder.id, {
      stage: values.stage,
      progress: values.progress,
      remark: values.remark,
      estimatedDate: values.estimatedDate?.format('YYYY-MM-DD'),
    });
    message.success('进度已更新');
    setProgressOpen(false); progressForm.resetFields();
    loadData();
  };

  const handleShip = async (id: string) => {
    Modal.confirm({
      title: '确认发货？',
      content: '确认后订单状态变为已发货',
      onOk: async () => {
        await orderApi.ship(id, { shippedAt: new Date() });
        message.success('发货成功'); loadData();
      },
    });
  };

  const handleComplete = async (id: string) => {
    Modal.confirm({
      title: '确认订单完成？',
      onOk: async () => {
        await orderApi.complete(id);
        message.success('订单已完成'); loadData();
      },
    });
  };

  const columns = [
    { title: '订单号', dataIndex: 'orderNo', width: 140 },
    { title: '产品', dataIndex: 'productName' },
    { title: '客户', dataIndex: 'customerName', width: 120 },
    { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' as const,
      render: (v: number) => v?.toLocaleString() },
    { title: '金额', dataIndex: 'orderAmount', width: 120, align: 'right' as const,
      render: (v: number) => v ? `¥${v.toLocaleString()}` : '—' },
    { title: '状态', dataIndex: 'status', width: 180,
      render: (s: string, r: any) => (
        <div>
          <Tag color={STATUS_MAP[s]?.color}>{STATUS_MAP[s]?.label}</Tag>
          <Progress percent={STATUS_MAP[s]?.progress || r.progress || 0} size="small" style={{ width: 100 }} />
        </div>
      )},
    { title: '交货期', dataIndex: 'deliveryDate', width: 110,
      render: (d: string) => d ? dayjs(d).format('MM-DD') : '—' },
    {
      title: '操作', width: 260, fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/orders/${record.id}`)}>详情</Button>
          {record.status === 'production' && (
            <Button type="link" size="small" icon={<PlusOutlined />}
              onClick={() => { setCurrentOrder(record); setProgressOpen(true); }}>更新进度</Button>
          )}
          {record.status === 'production' && (
            <Button type="link" size="small" icon={<TruckOutlined />} onClick={() => handleShip(record.id)}>发货</Button>
          )}
          {(record.status === 'shipped' || record.status === 'delivered') && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleComplete(record.id)}>完成</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="订单跟踪">
        <Input.Search
          placeholder="搜索订单号/产品/客户"
          allowClear enterButton={<SearchOutlined />}
          style={{ width: 300, marginBottom: 16 }}
          onSearch={(v) => { setKeyword(v); setPage(1); setTimeout(loadData, 0); }}
        />
        <Table
          columns={columns} dataSource={data} rowKey="id" loading={loading}
          scroll={{ x: 1100 }}
          pagination={{ current: page, total, pageSize: 10, onChange: setPage, showTotal: (t) => `共${t}条` }}
        />
      </Card>

      <Modal title="更新生产进度" open={progressOpen} onCancel={() => setProgressOpen(false)} onOk={handleUpdateProgress}>
        <Form form={progressForm} layout="vertical" initialValues={{ stage: '生产中', progress: 50 }}>
          <Form.Item name="stage" label="当前阶段" rules={[{ required: true }]}>
            <Select options={[
              { value: '备料', label: '备料' },
              { value: '生产中', label: '生产中' },
              { value: '质检', label: '质检' },
              { value: '包装', label: '包装' },
              { value: '待发货', label: '待发货' },
            ]} />
          </Form.Item>
          <Form.Item name="progress" label="进度(%)" rules={[{ required: true }]}>
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="estimatedDate" label="预计完成日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
