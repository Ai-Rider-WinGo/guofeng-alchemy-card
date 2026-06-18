import { requestClient } from '#/api/request';

export async function getConfigsApi(category?: string) {
  return requestClient.get('/configs', { params: { category } });
}

export async function getConfigByKeyApi(key: string) {
  return requestClient.get(`/configs/${key}`);
}

export async function setConfigApi(data: { key: string; value: string; description?: string; category?: string }) {
  return requestClient.post('/configs', data);
}

export async function batchSetConfigsApi(items: { config_key: string; config_value: string; description?: string; category?: string }[]) {
  return requestClient.post('/configs/batch', items);
}
