import React, { useEffect, useState } from 'react';
import { Card, Tabs, Table, Button, Space, Modal, Form, Input, Tag, message, Popconfirm, Checkbox } from 'antd';
import { UserOutlined, SafetyOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { userApi, rbacApi } from '../api';

export default function Settings() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const loadUsers = async () => {
    setUserLoading(true);
    try {
      const res: any = await userApi.list({ page: 1, pageSize: 50 });
      setUsers(res.data?.items || res.data || []);
    } catch (e: any) {
      message.error(e.response?.data?.message || '加载用户失败');
    } finally { setUserLoading(false); }
  };

  const loadRoles = async () => {
    try {
      const res: any = await rbacApi.roles();
      setRoles(Array.isArray(res.data) ? res.data : (res.data?.items || []));
    } catch (e: any) {
      message.error(e.response?.data?.message || '加载角色失败');
    }
  };

  useEffect(() => { loadUsers(); loadRoles(); }, []);

  const handleCreateUser = async () => {
    try {
      const values = await form.validateFields();
      const payload: any = { ...values };
      if (!payload.password) payload.password = '123456';
      await userApi.create(payload);
      message.success('创建成功');
      setModalOpen(false);
      form.resetFields();
      loadUsers();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e.response?.data?.message || '创建失败');
    }
  };

  const handleResetPwd = async (id: string) => {
    try {
      await userApi.resetPassword(id);
      message.success('密码已重置为123456');
    } catch (e: any) {
      message.error(e.response?.data?.message || '重置失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await userApi.remove(id);
      message.success('已删除');
      loadUsers();
    } catch (e: any) {
      message.error(e.response?.data?.message || '删除失败');
    }
  };

  return (
    <Card title="系统设置">
      <Tabs
        items={[
          {
            key: 'users',
            label: <span><UserOutlined /> 用户管理</span>,
            children: (
              <>
                <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 12 }} onClick={() => { form.resetFields(); setModalOpen(true); }}>
                  新增用户
                </Button>
                <Table
                  dataSource={users}
                  rowKey="id"
                  size="small"
                  loading={userLoading}
                  pagination={{ pageSize: 10, showTotal: (t) => `共${t}位用户` }}
                  columns={[
                    { title: '用户名', dataIndex: 'username', width: 120 },
                    { title: '姓名', dataIndex: 'realName', width: 100 },
                    { title: '手机', dataIndex: 'phone', width: 130 },
                    { title: '邮箱', dataIndex: 'email' },
                    { title: '角色', dataIndex: 'roles',
                      render: (rs: any[]) => rs?.length ? rs.map(r => <Tag key={r.id} color="blue">{r.name}</Tag>) : <Tag>未分配</Tag> },
                    { title: '状态', dataIndex: 'status', width: 80,
                      render: (s: string) => s === 'active' ? <Tag color="green">正常</Tag> : <Tag color="red">禁用</Tag> },
                    { title: '创建时间', dataIndex: 'createdAt', width: 160,
                      render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '—' },
                    {
                      title: '操作', width: 180, fixed: 'right' as const,
                      render: (_: any, record: any) => (
                        <Space size="small">
                          <Button type="link" size="small" onClick={() => handleResetPwd(record.id)}>重置密码</Button>
                          <Popconfirm title="确认删除该用户？" onConfirm={() => handleDelete(record.id)}>
                            <Button type="link" size="small" danger>删除</Button>
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
                <Modal
                  title="新增用户"
                  open={modalOpen}
                  onCancel={() => setModalOpen(false)}
                  onOk={handleCreateUser}
                  okText="创建"
                  cancelText="取消"
                  destroyOnClose
                >
                  <Form form={form} layout="vertical" initialValues={{ status: 'active', roleIds: [] }}>
                    <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                      <Input placeholder="请输入登录用户名" />
                    </Form.Item>
                    <Form.Item name="realName" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                      <Input placeholder="请输入真实姓名" />
                    </Form.Item>
                    <Form.Item name="password" label="初始密码">
                      <Input.Password placeholder="留空则默认123456" />
                    </Form.Item>
                    <Form.Item name="phone" label="手机">
                      <Input placeholder="请输入手机号" />
                    </Form.Item>
                    <Form.Item name="email" label="邮箱">
                      <Input placeholder="请输入邮箱" />
                    </Form.Item>
                    <Form.Item name="roleIds" label="分配角色">
                      <Checkbox.Group style={{ width: '100%' }}>
                        <Space wrap>
                          {roles.map(r => (
                            <Checkbox key={r.id} value={r.id}>{r.name}</Checkbox>
                          ))}
                        </Space>
                      </Checkbox.Group>
                    </Form.Item>
                  </Form>
                </Modal>
              </>
            ),
          },
          {
            key: 'roles',
            label: <span><SafetyOutlined /> 角色权限</span>,
            children: (
              <Table
                dataSource={roles}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  { title: '角色名称', dataIndex: 'name', width: 140 },
                  { title: '编码', dataIndex: 'code', width: 140 },
                  { title: '描述', dataIndex: 'description' },
                  { title: '系统角色', dataIndex: 'isSystem', width: 90,
                    render: (v: boolean) => v ? <Tag color="blue">系统</Tag> : <Tag>自定义</Tag> },
                  { title: '权限数量', dataIndex: 'permissions', width: 90, align: 'right' as const,
                    render: (p: any[]) => p?.length || 0 },
                ]}
              />
            ),
          },
        ]}
      />
    </Card>
  );
}
