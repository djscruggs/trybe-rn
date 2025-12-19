import axios from 'axios';

import { API_HOST } from '~/lib/environment';
import type { Challenge, ChallengeInputs, CheckIn, MemberChallenge } from '~/lib/types';

interface JoinChallengeParams {
  userId: string;
  notificationHour: number;
  notificationMinute: number;
  startAt?: string;
}

interface JoinChallengeResponse {
  membership: MemberChallenge;
}

export const challengesApi = {
  getActive: async (): Promise<Challenge[]> => {
    const result = await axios.get(`${API_HOST}/api/challenges/active`);
    return result.data.challenges || [];
  },

  get: async (id: string): Promise<Challenge> => {
    const response = await axios.get(`${API_HOST}/api/challenges/v/${id}`);
    return response.data;
  },

  getProgram: async (id: string): Promise<any> => {
    const response = await axios.get(`${API_HOST}/api/challenges/v/${id}/program`);
    return response.data;
  },

  getPost: async (id: string): Promise<any> => {
    const response = await axios.get(`${API_HOST}/api/posts/${id}`);
    return response.data;
  },

  getMembership: async (id: string, token: string): Promise<MemberChallenge | null> => {
    const headers = { Authorization: `Bearer ${token}` };
    const response = await axios.get(`${API_HOST}/api/challenges/v/${id}/membership`, {
      headers,
    });
    return response.data.membership;
  },

  create: async (data: FormData, token: string): Promise<Challenge> => {
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    };
    const response = await axios.post(`${API_HOST}/api/challenges`, data, { headers });
    return response.data.challenge;
  },

  joinOrLeave: async (
    id: string,
    data: FormData | Record<string, never>,
    token: string
  ): Promise<JoinChallengeResponse | null> => {
    const headers = { Authorization: `Bearer ${token}` };
    const response = await axios.post(`${API_HOST}/api/challenges/join-unjoin/${id}`, data, {
      headers,
    });
    return response.data;
  },

  getCheckIns: async (
    challengeId: string,
    userId: string,
    token: string | null,
    cohortId?: number | null
  ): Promise<CheckIn[]> => {
    let url = `${API_HOST}/api/checkins/${challengeId}/${userId}`;
    if (cohortId) {
      url += `/${cohortId}`;
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else if (userId) {
      headers.Authorization = `Bearer ${userId}`;
    }

    const response = await axios.get(url, { headers });
    return response.data.checkIns || [];
  },

  updateMembership: async (membershipId: string, data: any): Promise<any> => {
    const response = await axios.post(`${API_HOST}/api/membership/${membershipId}`, data);
    return response.data;
  },
};
