import React, { useEffect, useState } from 'react';
import { Card, Tabs, Table, Button, Space, Modal, Form, Input, Tag, message, Popconfirm } from 'antd';
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
      const res: any = await userApi.list({ pageSize: 50 });
      setUsers(res.data.items || []);
    } finally { setUserLoading(false); }
  };

  const loadRoles = async () => {
    const res: any = await rbacApi.roles();
    setRoles(res.data || []);
  };

  useEffect(() => { loadUsers(); loadRoles(); }, []);

  const handleCreateUser = async () => {
    const values = await form.validateFields();
    await userApi.create(values);
    message.success('创建成功');
    setModalOpen(false); form.resetFields();
    loadUsers();
  };

  const handleResetPwd = async (id: string) => {
    await userApi.resetPassword(id);
    message.success('密码已重置为123456');
  };

  const handleDelete = async (id: string) => {
    await userApi.remove(id);
    message.success('已删除');
    loadUsers();
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
                <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 12 }} onClick={() => setModalOpen(true)}>
                  新增用户
                </Button>
                <Table
                  dataSource={users}
                  rowKey="id"
                  size="small"
                  loading={userLoading}
                  pagination={false}
                  columns={[
                    { title: '用户名', dataIndex: 'username', width: 120 },
                    { title: '姓名', dataIndex: 'realName', width: 100 },
                    { title: '手机', dataIndex: 'phone', width: 130 },
                    { title: '邮箱', dataIndex: 'email' },
                    { title: '角色', dataIndex: 'roles',
                      render: (rs: any[]) => rs?.map(r => <Tag key={r.id} color="blue">{r.name}</Tag>) },
                    { title: '状态', dataIndex: 'status', width: 80,
                      render: (s: string) => s === 'active' ? <Tag color="green">正常</Tag> : <Tag color="red">禁用</Tag> },
                    { title: '创建时间', dataIndex: 'createdAt', width: 140,
                      render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm') },
                    {
                      title: '操作', width: 180, fixed: 'right' as const,
                      render: (_: any, record: any) => (
                        <Space size="small">
                          <Button type="link" size="small" onClick={() => handleResetPwd(record.id)}>重置密码</Button>
                          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
                            <Button type="link" size="small" danger>删除</Button>
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
                <Modal title="新增用户" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleCreateUser}>
                  <Form form={form} layout="vertical" initialValues={{ status: 'active' }}>
                    <Form.Item name="username" label="用户名" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="realName" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="password" label="初始密码"><Input.Password placeholder="留空默认123456" /></Form.Item>
                    <Form.Item name="phone" label="手机"><Input /></Form.Item>
                    <Form.Item name="email" label="邮箱"><Input /></Form.Item>
                    <Form.Item name="roleIds" label="角色">
                      <Space wrap>
                        {roles.map(r => (
                          <Form.Item key={r.id} name="roleIds" noStyle valuePropName="checked">
                            <input type="checkbox" value={r.id} style={{ marginRight: 4 }} />
                            {r.name}
                          </Form.Item>
                        ))}
                      </Space>
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
                  { title: '角色名称', dataIndex: 'name', width: 120 },
                  { title: '编码', dataIndex: 'code', width: 120 },
                  { title: '描述', dataIndex: 'description' },
                  { title: '系统角色', dataIndex: 'isSystem', width: 80,
                    render: (v: boolean) => v ? <Tag color="blue">系统</Tag> : <Tag>自定义</Tag> },
                  { title: '权限数量', dataIndex: 'permissions', width: 80, align: 'right' as const,
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
