import { requestClient } from '#/api/request';

export async function getDashboardOverviewApi() {
  return requestClient.get('/dashboard/overview');
}
