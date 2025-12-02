import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_HOST } from '~/lib/environment';

interface UserContextType {
  currentUser: any;
  setCurrentUser: (user: any) => void;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  setCurrentUser: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  console.log('👤 UserProvider: Initializing user context');
  
  const { userId } = useAuth();
  console.log('🔑 UserProvider: User ID:', userId ? 'Present' : 'Not present');
  
  const [currentUser, setCurrentUser] = useState<any>(null);

  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      console.log('🌐 UserProvider: Fetching user data for userId:', userId);
      if (!userId) return null;
      const result = await axios.get(`${API_HOST}/api/clerk/${userId}`);
      console.log('✅ UserProvider: User data fetched successfully');
      return result.data;
    },
    enabled: !!userId,
  });

  console.log('📊 UserProvider: Query state:', { isLoading, error: !!error, hasData: !!userData });

  useEffect(() => {
    if (userData) {
      console.log('👤 UserProvider: Setting current user data');
      setCurrentUser(userData);
    }
  }, [userData]);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useCurrentUser = () => useContext(UserContext);
