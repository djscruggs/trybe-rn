import { useAuth } from '@clerk/clerk-expo';
import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { type CurrentUser } from '~/lib/types';
import { API_HOST } from '~/lib/environment';

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
  console.log('👤 UserProvider: Initializing user context');

  const { userId, getToken } = useAuth();
  console.log('🔑 UserProvider: User ID:', userId ? 'Present' : 'Not present');

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Auto-fetch user data when userId is available
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      console.log('🌐 UserProvider: Fetching user data for userId:', userId);
      if (!userId) return null;
      try {
        const result = await axios.get(`${API_HOST}/api/clerk/${userId}`, {
          timeout: 5000, // 5 second timeout
        });
        console.log('✅ UserProvider: User data fetched successfully');
        return result.data;
      } catch (err: any) {
        console.error('❌ UserProvider: Failed to fetch user data:', err.message);
        // Don't throw - let the app continue without user data
        return null;
      }
    },
    enabled: !!userId,
    retry: 2,
    retryDelay: 1000,
  });

  console.log('📊 UserProvider: Query state:', { isLoading, error: !!error, hasData: !!userData });

  // Update currentUser when userData is fetched
  useEffect(() => {
    if (userData) {
      console.log('👤 UserProvider: Setting current user data');
      setCurrentUser(userData);
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
