import axios from 'axios';
import { message } from 'antd';

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const tenantCode = localStorage.getItem('tenantCode');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (tenantCode) {
    config.headers['X-Tenant-Code'] = tenantCode;
  }
  return config;
});

request.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code !== undefined && res.code !== 200) {
      message.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message));
    }
    return res;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else {
      message.error(error.response?.data?.message || error.message);
    }
    return Promise.reject(error);
  },
);

export default request;
