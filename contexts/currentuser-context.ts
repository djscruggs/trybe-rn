import { createContext, useContext } from 'react';

import { type CurrentUser } from '~/lib/types';

export interface CurrentUserContextType {
  currentUser: CurrentUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<CurrentUser | null>>;
}
export const CurrentUserContext = createContext<CurrentUserContextType>({
  currentUser: null,
  setCurrentUser: () => {},
});

export const useCurrentUser = (): CurrentUserContextType => {
  return useContext(CurrentUserContext);
};
