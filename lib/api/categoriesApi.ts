import { apiClient } from '~/lib/api/client';
import { API_HOST } from '~/lib/environment';
import type { Category } from '~/lib/types';

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await apiClient.get(`${API_HOST}/api/categories`);
    return response.data.categories || [];
  },
};
