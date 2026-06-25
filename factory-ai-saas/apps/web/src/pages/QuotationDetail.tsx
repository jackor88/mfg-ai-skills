import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Tag, Steps, Table, message, Modal, Form, Input, InputNumber, Result, Spin, Typography, Divider } from 'antd';
import { RobotOutlined, ArrowLeftOutlined, CheckOutlined, CloseOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { quotationApi, orderApi, billingApi } from '../api';

const { Title, Text, Paragraph } = Typography;

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  draft: { color: 'default', label: '草稿' },
  ai_calculating: { color: 'processing', label: 'AI核价中' },
  completed: { color: 'blue', label: '已核价' },
  pending: { color: 'gold', label: '待审核' },
  reviewed: { color: 'cyan', label: '已审核' },
  confirmed: { color: 'green', label: '已确认' },
  rejected: { color: 'red', label: '已驳回' },
};

const STATUS_STEPS: Record<string, number> = {
  draft: 0,
  ai_calculating: 1,
  completed: 1,
  pending: 2,
  reviewed: 3,
  confirmed: 4,
  rejected: 3,
};

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
      if (!check.data.available) {
        message.warning(check.data.message || 'AI算力不足，请充值');
        navigate('/billing');
        return;
      }
      const res: any = await quotationApi.aiCalculate(id!);
      message.success(`AI核价完成，建议报价：¥${Number(res.data.suggestedPrice).toLocaleString()}`);
      load();
    } catch (e: any) {
      message.error(e.response?.data?.message || 'AI核价失败');
    } finally { setAiLoading(false); }
  };

  const handleSubmit = async () => {
    try {
      await quotationApi.submit(id!);
      message.success('已提交审核');
      load();
    } catch (e: any) {
      message.error(e.response?.data?.message || '提交失败');
    }
  };

  const handleReview = async (approved: boolean) => {
    try {
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
    } catch (e: any) {
      message.error(e.response?.data?.message || '操作失败');
    }
  };

  const handleConfirm = async () => {
    Modal.confirm({
      title: '确认报价并创建订单？',
      content: '确认后将自动创建生产订单',
      onOk: async () => {
        setConfirmLoading(true);
        try {
          await quotationApi.confirm(id!);
          const res: any = await orderApi.fromQuotation(id!);
          message.success('订单已创建');
          navigate(`/orders/${res.data.id}`);
        } catch (e: any) {
          message.error(e.response?.data?.message || '创建订单失败');
        } finally { setConfirmLoading(false); }
      },
    });
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!data) return <Result status="404" title="报价单不存在" />;

  const stepStatus = data.status === 'rejected' ? 'error' : data.status === 'confirmed' ? 'finish' : 'process';
  const statInfo = STATUS_MAP[data.status] || { color: 'default', label: data.status };

  const costColumns = [
    { title: '成本项', dataIndex: 'label', key: 'label' },
    { title: '金额', dataIndex: 'value', key: 'value', align: 'right' as const, render: (v: any) => typeof v === 'number' ? <Text type="danger">¥{Number(v).toLocaleString()}</Text> : v },
  ];
  const costData = data.totalCost ? [
    { key: 'material', label: '材料成本', value: data.materialCost || 0 },
    { key: 'labor', label: '人工成本', value: data.laborCost || 0 },
    { key: 'overhead', label: '制造费用', value: data.overheadCost || 0 },
    { key: 'logistics', label: '包装物流', value: data.logisticsCost || 0 },
    { key: 'total', label: <Text strong>总成本</Text>, value: <Text strong>¥{Number(data.totalCost).toLocaleString()}</Text> },
  ] : [];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/quotations')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>
          报价单 {data.quoteNo}
          <Tag color={statInfo.color} style={{ marginLeft: 12 }}>{statInfo.label}</Tag>
        </Title>
      </Space>

      <Steps
        current={STATUS_STEPS[data.status] ?? 0}
        status={stepStatus as any}
        style={{ marginBottom: 24 }}
        items={[
          { title: '草稿' },
          { title: 'AI核价' },
          { title: '提交审核' },
          { title: '老板审核' },
          { title: '已确认' },
        ]}
      />

      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions column={3} bordered size="small">
          <Descriptions.Item label="产品名称">{data.productName}</Descriptions.Item>
          <Descriptions.Item label="客户">{data.customerName || '—'}</Descriptions.Item>
          <Descriptions.Item label="数量">{data.quantity ? Number(data.quantity).toLocaleString() : '—'}</Descriptions.Item>
          <Descriptions.Item label="目标毛利率">{data.profitMargin}%</Descriptions.Item>
          <Descriptions.Item label="创建人">{data.createdByName || '—'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{dayjs(data.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="预估成本" span={1}>
            {data.totalCost ? <Text type="danger">¥{Number(data.totalCost).toLocaleString()}</Text> : <Text type="secondary">未核价</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="AI建议价" span={1}>
            {data.suggestedPrice ? <Text>¥{Number(data.suggestedPrice).toLocaleString()}</Text> : <Text type="secondary">未核价</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="最终报价" span={1}>
            {data.finalPrice ? (
              <Text strong style={{ fontSize: 16, color: '#52c41a' }}>¥{Number(data.finalPrice).toLocaleString()}</Text>
            ) : data.suggestedPrice ? (
              <Text strong>¥{Number(data.suggestedPrice).toLocaleString()}</Text>
            ) : <Text type="secondary">—</Text>}
          </Descriptions.Item>
          {data.description && <Descriptions.Item label="产品描述" span={3}>{data.description}</Descriptions.Item>}
          {data.reviewComment && <Descriptions.Item label="审核意见" span={3}>{data.reviewComment}</Descriptions.Item>}
        </Descriptions>
      </Card>

      <Card title="操作区" style={{ marginBottom: 16 }}>
        <Space wrap>
          {(data.status === 'draft' || data.status === 'rejected') && (
            <Button type="primary" icon={<RobotOutlined />} loading={aiLoading} onClick={handleAi}>
              🤖 AI智能核价
            </Button>
          )}
          {data.status === 'ai_calculating' && (
            <Button type="primary" loading icon={<RobotOutlined />}>AI核价中...</Button>
          )}
          {data.status === 'completed' && (
            <Button type="primary" onClick={handleSubmit}>📤 提交审核</Button>
          )}
          {data.status === 'pending' && (
            <>
              <Button type="primary" icon={<CheckOutlined />} onClick={() => { reviewForm.setFieldsValue({ finalPrice: data.suggestedPrice }); setReviewOpen(true); }}>审核通过</Button>
              <Button danger icon={<CloseOutlined />} onClick={() => handleReview(false)}>驳回</Button>
            </>
          )}
          {data.status === 'reviewed' && (
            <Button type="primary" icon={<ShoppingCartOutlined />} loading={confirmLoading} onClick={handleConfirm}>
              确认报价并转订单
            </Button>
          )}
        </Space>
      </Card>

      {data.totalCost && (
        <Card title="AI核价成本明细" style={{ marginBottom: 16 }}>
          <Table
            dataSource={costData}
            pagination={false}
            size="small"
            columns={costColumns}
          />
          {data.estimatedLeadDays && (
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">预计交期：</Text>
              <Text strong>{data.estimatedLeadDays} 天</Text>
            </div>
          )}
        </Card>
      )}

      {data.aiAnalysis && (
        <Card title="AI分析报告" style={{ marginBottom: 16 }}>
          <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'monospace', fontSize: 13 }}>
            {data.aiAnalysis}
          </Paragraph>
        </Card>
      )}

      <Card title="BOM物料清单">
        <Table
          dataSource={data.bomItems || []}
          rowKey={(r: any, i: number) => r.id || i}
          pagination={false}
          size="small"
          locale={{ emptyText: '暂无BOM数据，AI将基于产品名称智能估算成本' }}
          columns={[
            { title: '物料名称', dataIndex: 'name' },
            { title: '材质/规格', dataIndex: 'material' },
            { title: '数量', dataIndex: 'quantity', align: 'right' },
            { title: '单位', dataIndex: 'unit' },
            { title: '单价', dataIndex: 'unitPrice', align: 'right', render: (v: number) => v ? `¥${v}` : '—' },
          ]}
        />
      </Card>

      <Modal
        title="审核报价"
        open={reviewOpen}
        onCancel={() => setReviewOpen(false)}
        onOk={() => handleReview(true)}
        okText="通过"
        cancelText="取消"
      >
        <Form form={reviewForm} layout="vertical" initialValues={{ finalPrice: data.suggestedPrice }}>
          <Form.Item name="finalPrice" label="最终报价（元）" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item name="comment" label="审核意见"><Input.TextArea rows={3} placeholder="请填写审核意见（可选）" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
