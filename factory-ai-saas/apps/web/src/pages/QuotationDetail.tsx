import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Tag, Steps, Table, message, Modal, Form, InputNumber, Result, Spin, Typography } from 'antd';
import { RobotOutlined, ArrowLeftOutlined, CheckOutlined, CloseOutlined, FileTextOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { quotationApi, orderApi, billingApi } from '../api';

const { Title, Text } = Typography;
const STATUS_STEPS: Record<string, number> = { draft: 0, pending: 1, reviewing: 1, confirmed: 3, rejected: 4, cancelled: 4 };

export default function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [reviewForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await quotationApi.detail(id!);
      setData(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleAi = async () => {
    setAiLoading(true);
    try {
      const check: any = await billingApi.checkAi();
      if (!check.data.available) { message.warning(check.data.message); navigate('/billing'); return; }
      const res: any = await quotationApi.aiCalculate(id!);
      message.success(`AI核价完成，建议报价：¥${res.data.suggestedPrice?.toLocaleString()}`);
      load();
    } catch (e: any) { message.error(e.response?.data?.message || '失败'); }
    finally { setAiLoading(false); }
  };

  const handleReview = async (approved: boolean) => {
    if (approved) {
      const values = await reviewForm.validateFields();
      await quotationApi.review(id!, { approved: true, finalPrice: values.finalPrice, comment: values.comment });
      message.success('审核通过');
    } else {
      await quotationApi.review(id!, { approved: false, comment: '请修改后重新提交' });
      message.success('已驳回');
    }
    setReviewOpen(false); reviewForm.resetFields();
    load();
  };

  const handleConfirm = async () => {
    Modal.confirm({
      title: '确认报价并创建订单？',
      content: '确认后将自动创建生产订单',
      onOk: async () => {
        setConfirmLoading(true);
        try {
          await quotationApi.confirm(id!);
          message.success('已确认');
          const res: any = await orderApi.fromQuotation(id!);
          message.success('订单已创建');
          navigate(`/orders/${res.data.id}`);
        } finally { setConfirmLoading(false); }
      },
    });
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!data) return <Result status="404" title="报价单不存在" />;

  const stepStatus = data.status === 'rejected' ? 'error' : data.status === 'confirmed' ? 'finish' : 'process';

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/quotations')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>
          报价单 {data.quotationNo}
          <Tag color={data.status === 'confirmed' ? 'green' : data.status === 'rejected' ? 'red' : 'blue'} style={{ marginLeft: 12 }}>
            {data.status}
          </Tag>
        </Title>
      </Space>

      <Steps
        current={STATUS_STEPS[data.status] ?? 0}
        status={stepStatus as any}
        style={{ marginBottom: 24 }}
        items={[
          { title: '草稿' },
          { title: '待审核' },
          { title: '老板审核' },
          { title: '已确认' },
        ]}
      />

      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions column={3} bordered size="small">
          <Descriptions.Item label="产品名称">{data.productName}</Descriptions.Item>
          <Descriptions.Item label="客户">{data.customerName || '—'}</Descriptions.Item>
          <Descriptions.Item label="数量">{data.quantity?.toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="毛利率">{data.profitMargin}%</Descriptions.Item>
          <Descriptions.Item label="创建人">{data.createdByName || '—'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{dayjs(data.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="预估成本" span={1}>
            <Text type="danger">¥{data.estimatedCost?.toLocaleString() || '—'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="AI建议价" span={1}>
            {data.aiPrice ? <Text>¥{data.aiPrice.toLocaleString()}</Text> : <Text type="secondary">未核价</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="最终报价" span={1}>
            <Text strong style={{ fontSize: 16, color: '#52c41a' }}>¥{data.finalPrice?.toLocaleString() || data.totalPrice?.toLocaleString() || '—'}</Text>
          </Descriptions.Item>
          {data.remark && <Descriptions.Item label="备注" span={3}>{data.remark}</Descriptions.Item>}
        </Descriptions>
      </Card>

      <Card title="操作" style={{ marginBottom: 16 }}>
        <Space wrap>
          {data.status === 'draft' && (
            <Button type="primary" icon={<RobotOutlined />} loading={aiLoading} onClick={handleAi}>
              🤖 AI智能核价
            </Button>
          )}
          {(data.status === 'pending' || data.status === 'reviewing') && (
            <Button type="primary" icon={<CheckOutlined />} onClick={() => setReviewOpen(true)}>审核报价</Button>
          )}
          {data.status === 'reviewing' && (
            <Button danger icon={<CloseOutlined />} onClick={() => handleReview(false)}>驳回</Button>
          )}
          {data.status === 'confirmed' && (
            <Button type="primary" icon={<ShoppingCartOutlined />} loading={confirmLoading} onClick={handleConfirm}>
              转为订单
            </Button>
          )}
        </Space>
      </Card>

      <Card title="BOM物料清单">
        <Table
          dataSource={data.bomItems || []}
          rowKey="id"
          pagination={false}
          size="small"
          columns={[
            { title: '物料名称', dataIndex: 'name' },
            { title: '材质/规格', dataIndex: 'material' },
            { title: '数量', dataIndex: 'quantity', align: 'right' },
            { title: '单位', dataIndex: 'unit' },
            { title: '单价', dataIndex: 'unitPrice', align: 'right', render: (v: number) => v ? `¥${v}` : '—' },
            { title: '小计', dataIndex: 'totalPrice', align: 'right', render: (v: number) => v ? <Text>¥{v}</Text> : '—' },
          ]}
        />
      </Card>

      <Modal title="审核报价" open={reviewOpen} onCancel={() => setReviewOpen(false)} onOk={() => handleReview(true)} okText="通过" cancelText="取消">
        <Form form={reviewForm} layout="vertical" initialValues={{ finalPrice: data.aiPrice || data.totalPrice }}>
          <Form.Item name="finalPrice" label="最终报价（元）" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item name="comment" label="审核意见"><Input.TextArea rows={3} placeholder="请填写审核意见" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
