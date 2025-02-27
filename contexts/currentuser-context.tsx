import { useAuth } from '@clerk/clerk-react';
import { createContext, ReactNode, useContext, useState } from 'react';

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
  const [currentUser, setCurrentUser] = useState<any>(null); // Replace 'any' with your user type
  const { getToken } = useAuth();

  return (
    <CurrentUserContext.Provider value={{ currentUser, setCurrentUser, getToken }}>
      {children}
    </CurrentUserContext.Provider>
  );
};
export const useCurrentUser = (): CurrentUserContextType => {
  return useContext(CurrentUserContext);
};
