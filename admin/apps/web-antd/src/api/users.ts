import { requestClient } from '#/api/request';

export async function getUsersApi() {
  return requestClient.get('/users');
}

export async function getUserByIdApi(id: number) {
  return requestClient.get(`/users/${id}`);
}

export async function createUserApi(data: { username: string; password: string; display_name?: string; role?: string }) {
  return requestClient.post('/users', data);
}

export async function updateUserApi(id: number, data: any) {
  return requestClient.put(`/users/${id}`, data);
}

export async function deleteUserApi(id: number) {
  return requestClient.delete(`/users/${id}`);
}
