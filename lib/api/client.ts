import axios from 'axios';

import { logger } from '~/lib/logger';

// Create axios instance with interceptors for debugging
const apiClient = axios.create();

// Request interceptor - logs all outgoing requests
apiClient.interceptors.request.use(
  (config) => {
    const method = config.method?.toUpperCase();
    const url = config.url;
    const fullUrl = config.baseURL ? `${config.baseURL}${url}` : url;

    logger.debug(`🌐 API Request: ${method} ${fullUrl}`);

    // Log request data if present
    if (config.data) {
      logger.debug('📤 Request data:', config.data);
    }

    // Log query params if present
    if (config.params) {
      logger.debug('🔍 Query params:', config.params);
    }

    return config;
  },
  (error) => {
    logger.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - logs all responses
apiClient.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toUpperCase();
    const url = response.config.url;
    const status = response.status;

    logger.debug(`✅ API Response: ${method} ${url} - ${status}`);

    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const method = error.config?.method?.toUpperCase();
      const url = error.config?.url;
      const status = error.response.status;

      logger.error(`❌ API Error: ${method} ${url} - ${status}`);
      logger.error('Error data:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      logger.error('❌ API No Response:', error.request);
    } else {
      // Something else happened
      logger.error('❌ API Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export { apiClient };
