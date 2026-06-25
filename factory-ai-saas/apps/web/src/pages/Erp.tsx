import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Select, Switch, InputNumber, Button, Space, message, Table, Tag, Statistic, Row, Col, Modal, Timeline } from 'antd';
import { ApiOutlined, CloudSyncOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { erpApi } from '../api';

const STATUS_MAP: Record<string, { color: string; text: string; icon: any }> = {
  pending: { color: 'default', text: '等待', icon: SyncOutlined },
  syncing: { color: 'processing', text: '同步中', icon: SyncOutlined },
  success: { color: 'green', text: '成功', icon: CheckCircleOutlined },
  failed: { color: 'red', text: '失败', icon: CloseCircleOutlined },
};

const ENTITY_LABEL: Record<string, string> = {
  customer: '客户', material: '物料', process: '工序', order: '订单', quotation: '报价单',
};

export default function Erp() {
  const [config, setConfig] = useState<any>(null);
  const [types, setTypes] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [c, t, l] = await Promise.all([
        erpApi.config(),
        erpApi.types(),
        erpApi.syncLogs({ pageSize: 20 }),
      ]);
      setConfig(c.data);
      setTypes(t.data || []);
      setLogs(l.data?.items || []);
      form.setFieldsValue({
        ...c.data,
        appSecret: c.data?.appSecret ? '***' : undefined,
      });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    const values = await form.validateFields();
    if (values.appSecret === '***') delete values.appSecret;
    if (config?.id) {
      await erpApi.updateConfig(config.id, values);
    } else {
      await erpApi.saveConfig(values);
    }
    message.success('配置已保存');
    load();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res: any = await erpApi.testConnection();
      setTestResult(res.data);
      if (res.data.success) message.success(res.data.message);
    } catch (e: any) {
      setTestResult({ success: false, message: e.response?.data?.message || '连接失败' });
    } finally { setTesting(false); }
  };

  const handleSync = async (entityTypes: string[]) => {
    setSyncing(true);
    try {
      const res: any = await erpApi.sync({ entityTypes, direction: 'pull' });
      const failCount = res.data.filter((r: any) => r.status === 'failed').length;
      if (failCount === 0) message.success('同步完成');
      else message.warning(`同步完成，${failCount}项失败`);
      load();
    } catch (e: any) {
      message.error(e.response?.data?.message || '同步失败');
    } finally { setSyncing(false); }
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card><Statistic title="ERP连接状态" value={config?.enabled ? '已启用' : '未配置'}
            valueStyle={{ color: config?.enabled ? '#52c41a' : '#d9d9d9' }} prefix={<ApiOutlined />} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="最近同步" value={config?.lastSyncAt ? dayjs(config.lastSyncAt).format('YYYY-MM-DD HH:mm') : '从未'}
            prefix={<CloudSyncOutlined />} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="同步间隔" value={`${config?.syncInterval || 60}分钟`} /></Card>
        </Col>
      </Row>

      <Card title="ERP连接配置" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical" initialValues={{ enabled: true, syncInterval: 60 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="erpType" label="ERP类型" rules={[{ required: true }]}>
                <Select options={types.map(t => ({ value: t.type, label: `${t.name} - ${t.description}` }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="erpName" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="enabled" label="启用状态" valuePropName="checked"><Switch /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="apiUrl" label="API地址"><Input placeholder="https://" /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="appKey" label="AppKey"><Input /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="appSecret" label="AppSecret"><Input.Password placeholder="留空则不修改" /></Form.Item>
            </Col>
          </Row>
          <Card size="small" title="同步选项" style={{ marginBottom: 16 }}>
            <Space wrap>
              <Form.Item name="syncCustomers" valuePropName="checked" noStyle><Switch checkedChildren="同步客户" unCheckedChildren="不同步" /></Form.Item>
              <Form.Item name="syncMaterials" valuePropName="checked" noStyle><Switch checkedChildren="同步物料" unCheckedChildren="不同步" /></Form.Item>
              <Form.Item name="syncProcesses" valuePropName="checked" noStyle><Switch checkedChildren="同步工序" unCheckedChildren="不同步" /></Form.Item>
              <Form.Item name="syncOrders" valuePropName="checked" noStyle><Switch checkedChildren="同步订单" unCheckedChildren="不同步" /></Form.Item>
              <Form.Item name="autoPushQuotation" valuePropName="checked" noStyle><Switch checkedChildren="自动推送报价" unCheckedChildren="手动推送" /></Form.Item>
            </Space>
            <Form.Item name="syncInterval" label="同步间隔(分钟)" style={{ marginTop: 12, marginBottom: 0 }}>
              <InputNumber min={5} max={1440} />
            </Form.Item>
          </Card>
          <Space>
            <Button type="primary" onClick={handleSave}>保存配置</Button>
            <Button onClick={handleTest} loading={testing}>测试连接</Button>
            <Button type="primary" danger onClick={() => handleSync(['customer', 'material', 'process'])} loading={syncing}>
              <CloudSyncOutlined /> 立即同步全部
            </Button>
          </Space>
          {testResult && (
            <div style={{ marginTop: 12, padding: 12, background: testResult.success ? '#f6ffed' : '#fff2f0', borderRadius: 4 }}>
              {testResult.success
                ? <Tag color="green"><CheckCircleOutlined /> {testResult.message}（响应时间{testResult.responseTime}ms）</Tag>
                : <Tag color="red"><CloseCircleOutlined /> {testResult.message}</Tag>}
            </div>
          )}
        </Form>
      </Card>

      <Card title="快捷同步">
        <Space wrap>
          {[
            { key: 'customer', label: '同步客户' },
            { key: 'material', label: '同步物料' },
            { key: 'process', label: '同步工序' },
            { key: 'order', label: '同步订单' },
          ].map(s => (
            <Button key={s.key} onClick={() => handleSync([s.key])} loading={syncing}>
              <SyncOutlined spin={syncing} /> {s.label}
            </Button>
          ))}
        </Space>
      </Card>

      <Card title="同步日志" style={{ marginTop: 16 }}>
        <Table
          dataSource={logs}
          rowKey="id"
          size="small"
          pagination={false}
          columns={[
            { title: '时间', dataIndex: 'createdAt', width: 140, render: (d: string) => dayjs(d).format('MM-DD HH:mm') },
            { title: '数据类型', dataIndex: 'entityType', width: 80, render: (v: string) => ENTITY_LABEL[v] },
            { title: '方向', dataIndex: 'syncDirection', width: 60, render: (v: string) => v === 'pull' ? '拉取' : '推送' },
            { title: '状态', dataIndex: 'status', width: 80,
              render: (s: string) => <Tag color={STATUS_MAP[s]?.color}>{STATUS_MAP[s]?.text}</Tag> },
            { title: '结果', render: (_: any, r: any) => (
              <Space split={<span style={{ color: '#d9d9d9' }}>|</span>}>
                <span>总计{r.totalCount}</span>
                <span style={{ color: '#52c41a' }}>成功{r.successCount}</span>
                {r.failCount > 0 && <span style={{ color: '#ff4d4f' }}>失败{r.failCount}</span>}
              </Space>
            )},
            { title: '耗时', dataIndex: 'startedAt', width: 60, render: (_: any, r: any) => {
              if (!r.startedAt || !r.finishedAt) return '—';
              return `${Math.round((new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime()) / 1000)}s`;
            }},
            { title: '错误', dataIndex: 'error', ellipsis: true },
          ]}
        />
      </Card>
    </div>
  );
}
