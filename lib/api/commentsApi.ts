import { apiClient } from '~/lib/api/client';
import { API_HOST } from '~/lib/environment';
import type { Comment } from '~/lib/types';

export const commentsApi = {
  getForChallenge: async (challengeId: string, token: string | null): Promise<Comment[]> => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await apiClient.get(`${API_HOST}/api/comments/challenge/${challengeId}`, {
      headers,
    });
    return response.data || [];
  },

  create: async (data: FormData, token: string): Promise<Comment> => {
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    };
    const response = await apiClient.post(`${API_HOST}/api/comments`, data, { headers });
    return response.data;
  },

  delete: async (commentId: number, token: string): Promise<void> => {
    const formData = new FormData();
    formData.append('intent', 'delete');
    formData.append('id', String(commentId));

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    };
    await apiClient.post(`${API_HOST}/api/comments`, formData, { headers });
  },
};
