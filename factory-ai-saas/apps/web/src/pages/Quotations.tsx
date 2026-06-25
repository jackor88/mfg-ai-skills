import React, { useEffect, useState } from 'react';
import {
  Table, Card, Button, Space, Tag, Input, Modal, Form, Select, InputNumber,
  message, Popconfirm, Tabs, Spin, Drawer, List, Divider, Typography,
} from 'antd';
import {
  PlusOutlined, RobotOutlined, SearchOutlined, EyeOutlined,
  DeleteOutlined, SendOutlined, UserOutlined,
  AppstoreOutlined, ToolOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { quotationApi, billingApi } from '../api';

const { TextArea } = Input;
const { Text } = Typography;
const STATUS_MAP: Record<string, { color: string; label: string }> = {
  draft: { color: 'default', label: '草稿' },
  pending: { color: 'gold', label: '待审核' },
  reviewing: { color: 'blue', label: '审核中' },
  confirmed: { color: 'green', label: '已确认' },
  rejected: { color: 'red', label: '已驳回' },
  cancelled: { color: 'default', label: '已取消' },
};

export default function Quotations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [masterOpen, setMasterOpen] = useState(false);
  const [masterTab, setMasterTab] = useState('customers');
  const [customers, setCustomers] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [createLoading, setCreateLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await quotationApi.list({ page, pageSize: 10, keyword });
      setData(res.data.items);
      setTotal(res.data.total);
    } finally { setLoading(false); }
  };

  const loadCustomers = async () => {
    const res: any = await quotationApi.customers();
    setCustomers(res.data);
  };

  useEffect(() => { loadData(); }, [page]);
  useEffect(() => { if (modalOpen) loadCustomers(); }, [modalOpen]);

  const handleCreate = async () => {
    const values = await form.validateFields();
    setCreateLoading(true);
    try {
      const res: any = await quotationApi.create(values);
      message.success('创建成功');
      setModalOpen(false); form.resetFields();
      navigate(`/quotations/${res.data.id}`);
    } catch (e) { message.error('创建失败'); }
    finally { setCreateLoading(false); }
  };

  const handleAiCalculate = async (id: string) => {
    setAiLoading(id);
    try {
      const check: any = await billingApi.checkAi();
      if (!check.data.available) {
        message.warning(check.data.message || 'AI算力不足，请充值');
        navigate('/billing');
        return;
      }
      const res: any = await quotationApi.aiCalculate(id);
      message.success(`AI核价完成，建议报价：¥${res.data.suggestedPrice?.toLocaleString()}`);
      loadData();
    } catch (e: any) {
      message.error(e.response?.data?.message || 'AI核价失败');
    } finally { setAiLoading(null); }
  };

  const handleSubmit = async (id: string) => {
    await quotationApi.submit(id);
    message.success('已提交审核');
    loadData();
  };

  const handleDelete = async (id: string) => {
    await quotationApi.remove(id);
    message.success('已删除'); loadData();
  };

  const columns = [
    { title: '报价单号', dataIndex: 'quotationNo', width: 140 },
    { title: '产品名称', dataIndex: 'productName' },
    { title: '客户', dataIndex: 'customerName', width: 120 },
    { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' as const,
      render: (v: number) => v?.toLocaleString() },
    { title: '报价金额', dataIndex: 'totalPrice', width: 120, align: 'right' as const,
      render: (v: number) => v ? <Text strong>¥{v.toLocaleString()}</Text> : '—' },
    { title: '状态', dataIndex: 'status', width: 90, align: 'center' as const,
      render: (s: string) => <Tag color={STATUS_MAP[s]?.color}>{STATUS_MAP[s]?.label}</Tag> },
    { title: '创建时间', dataIndex: 'createdAt', width: 140,
      render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作', width: 240, fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/quotations/${record.id}`)}>查看</Button>
          {record.status === 'draft' && (
            <Button type="link" size="small" icon={<RobotOutlined />} loading={aiLoading === record.id}
              onClick={() => handleAiCalculate(record.id)}>AI核价</Button>
          )}
          {record.status === 'draft' && (
            <Button type="link" size="small" icon={<SendOutlined />} onClick={() => handleSubmit(record.id)}>提交</Button>
          )}
          {record.status === 'draft' && (
            <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="AI智能报价"
        extra={
          <Space>
            <Button icon={<AppstoreOutlined />} onClick={() => { setMasterOpen(true); setMasterTab('customers'); }}>主数据</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建报价</Button>
          </Space>
        }
      >
        <Input.Search
          placeholder="搜索产品/客户/报价单号"
          allowClear
          enterButton={<SearchOutlined />}
          style={{ width: 300, marginBottom: 16 }}
          onSearch={(v) => { setKeyword(v); setPage(1); setTimeout(loadData, 0); }}
        />
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{ current: page, total, pageSize: 10, onChange: setPage, showTotal: (t) => `共${t}条` }}
        />
      </Card>

      <Modal title="新建报价单" open={modalOpen} onOk={handleCreate} onCancel={() => setModalOpen(false)}
        confirmLoading={createLoading} width={600} okText="创建" cancelText="取消">
        <Form form={form} layout="vertical" initialValues={{ quantity: 100, profitMargin: 20 }}>
          <Form.Item name="productName" label="产品名称" rules={[{ required: true }]}>
            <Input placeholder="请输入产品名称" />
          </Form.Item>
          <Form.Item name="customerId" label="客户" rules={[{ required: true }]}>
            <Select placeholder="选择客户" showSearch optionFilterProp="label"
              options={customers.map(c => ({ value: c.id, label: c.name }))}
              dropdownRender={(menu) => <>
                {menu}
                <Divider style={{ margin: '8px 0' }} />
                <Button type="link" block icon={<PlusOutlined />}
                  onClick={() => { setMasterTab('customers'); setMasterOpen(true); }}>
                  新建客户
                </Button>
              </>}
            />
          </Form.Item>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="quantity" label="数量" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="profitMargin" label="毛利率(%)" style={{ flex: 1, marginLeft: 12 }}>
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} placeholder="产品规格、技术要求等" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title="主数据管理" open={masterOpen} onClose={() => setMasterOpen(false)} width={640}>
        <Tabs activeKey={masterTab} onChange={setMasterTab}
          items={[
            { key: 'customers', label: <span><UserOutlined />客户</span> },
            { key: 'materials', label: <span><AppstoreOutlined />物料</span> },
            { key: 'processes', label: <span><ToolOutlined />工序</span> },
          ]}
        />
        <MasterDataTab type={masterTab} onRefresh={loadCustomers} />
      </Drawer>
    </div>
  );
}

function MasterDataTab({ type, onRefresh }: { type: string; onRefresh?: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const api = type === 'customers' ? quotationApi.customers
        : type === 'materials' ? quotationApi.materials : quotationApi.processes;
      const res: any = await api();
      setItems(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [type]);

  const handleAdd = async () => {
    const values = await form.validateFields();
    const api = type === 'customers' ? quotationApi.createCustomer
      : type === 'materials' ? () => Promise.reject() : () => Promise.reject();
    try {
      if (type === 'customers') {
        await api(values);
        message.success('添加成功'); setAddOpen(false); form.resetFields();
        load(); onRefresh?.();
      }
    } catch (e) { message.error('添加失败'); }
  };

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 12 }} onClick={() => setAddOpen(true)}>
        新增{type === 'customers' ? '客户' : type === 'materials' ? '物料' : '工序'}
      </Button>
      <List
        loading={loading}
        dataSource={items}
        locale={{ emptyText: '暂无数据' }}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={item.name}
              description={
                type === 'customers' ? `${item.contact || ''} ${item.phone || ''}`
                  : type === 'materials' ? `${item.category || ''} ${item.spec || ''} ${item.price ? '¥' + item.price : ''}`
                  : `${item.category || ''} ${item.unitPrice ? '¥' + item.unitPrice + '/h' : ''}`
              }
            />
          </List.Item>
        )}
      />
      <Modal title="新增" open={addOpen} onOk={handleAdd} onCancel={() => setAddOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          {type === 'customers' && <>
            <Form.Item name="contact" label="联系人"><Input /></Form.Item>
            <Form.Item name="phone" label="电话"><Input /></Form.Item>
          </>}
        </Form>
      </Modal>
    </div>
  );
}
