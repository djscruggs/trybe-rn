import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import { createContext, ReactNode, useContext, useState, useEffect } from 'react';

import { apiClient } from '~/lib/api/client';
import { API_HOST } from '~/lib/environment';
import { setUser as setSentryUser } from '~/lib/sentry';
import { type CurrentUser } from '~/lib/types';

export interface CurrentUserContextType {
  currentUser: CurrentUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<CurrentUser | null>>;
  getToken: () => Promise<string | null>;
}

export const CurrentUserContext = createContext<CurrentUserContextType>({
  currentUser: null,
  setCurrentUser: () => {},
  getToken: () => Promise.resolve(null),
});

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userId, getToken } = useAuth();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Auto-fetch user data when userId is available
  const { data: userData } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) return null;
      try {
        const result = await apiClient.get(`${API_HOST}/api/clerk/${userId}`, {
          timeout: 5000, // 5 second timeout
        });
        return result.data;
      } catch (err: any) {
        console.error(err);
        // Don't throw - let the app continue without user data
        return null;
      }
    },
    enabled: !!userId,
    retry: 2,
    retryDelay: 1000,
  });

  // Update currentUser when userData is fetched
  useEffect(() => {
    if (userData) {
      setCurrentUser(userData);
      // Set Sentry user context for better error tracking
      setSentryUser({
        id: userData.id?.toString(),
        email: userData.email,
        username: userData.username,
      });
    } else {
      setSentryUser(null);
    }
  }, [userData]);

  return (
    <CurrentUserContext.Provider value={{ currentUser, setCurrentUser, getToken }}>
      {children}
    </CurrentUserContext.Provider>
  );
};

export const useCurrentUser = (): CurrentUserContextType => {
  return useContext(CurrentUserContext);
};
