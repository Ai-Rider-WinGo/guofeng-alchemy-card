import { requestClient } from '#/api/request';

export interface CardItem {
  id: number;
  card_id: string;
  name: string;
  quality: string;
  dynasty: string;
  level: number;
  type: string;
  image_url?: string;
  thumbnail_url?: string;
  story?: string;
  knowledge_point?: string;
  tags?: string[];
  related_cards?: string[];
  merge_hint?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CardListResult {
  list: CardItem[];
  total: number;
  page: number;
  limit: number;
}

export async function getCardsApi(params?: any) {
  return requestClient.get<CardListResult>('/cards', { params });
}

export async function getCardByIdApi(id: number) {
  return requestClient.get<CardItem>(`/cards/${id}`);
}

export async function createCardApi(data: any) {
  return requestClient.post<CardItem>('/cards', data);
}

export async function updateCardApi(id: number, data: any) {
  return requestClient.put<CardItem>(`/cards/${id}`, data);
}

export async function deleteCardApi(id: number) {
  return requestClient.delete(`/cards/${id}`);
}

export async function batchImportCardsApi(cards: any[]) {
  return requestClient.post('/cards/batch-import', cards);
}
