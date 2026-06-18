import axios from 'axios';

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (res) => {
    // 兼容 card_server.py 直接返回数据（无 code 包装）
    // 也兼容 NestJS 格式 { code: 0, data: ... }
    if (res.data && typeof res.data === 'object' && 'code' in res.data) {
      if (res.data.code === 0) return res.data.data;
      return Promise.reject(new Error(res.data.message || '请求失败'));
    }
    // card_server.py 直接返回 JSON，透传
    return res.data;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
      return new Promise(() => {});
    }
    return Promise.reject(err);
  },
);

export default request;
