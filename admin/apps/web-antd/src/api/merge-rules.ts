import { requestClient } from '#/api/request';

export async function getMergeRulesApi() {
  return requestClient.get('/merge-rules');
}

export async function getMergeRuleByIdApi(id: number) {
  return requestClient.get(`/merge-rules/${id}`);
}

export async function createMergeRuleApi(data: any) {
  return requestClient.post('/merge-rules', data);
}

export async function updateMergeRuleApi(id: number, data: any) {
  return requestClient.put(`/merge-rules/${id}`, data);
}

export async function deleteMergeRuleApi(id: number) {
  return requestClient.delete(`/merge-rules/${id}`);
}
