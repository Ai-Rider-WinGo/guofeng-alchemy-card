import { requestClient } from '#/api/request';

export async function getPoolsApi() {
  return requestClient.get('/pools');
}

export async function getPoolByIdApi(id: number) {
  return requestClient.get(`/pools/${id}`);
}

export async function createPoolApi(data: any) {
  return requestClient.post('/pools', data);
}

export async function updatePoolApi(id: number, data: any) {
  return requestClient.put(`/pools/${id}`, data);
}

export async function deletePoolApi(id: number) {
  return requestClient.delete(`/pools/${id}`);
}
