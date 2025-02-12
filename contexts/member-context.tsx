import axios from 'axios';
import { createContext, type ReactNode, useContext, useState } from 'react';

import { useCurrentUser } from '~/contexts/currentuser-context';
import { API_HOST } from '~/lib/environment';
import { type MemberChallenge, type CheckIn } from '~/lib/types';

export interface MemberContextType {
  membership: MemberChallenge | null;
  setMembership: React.Dispatch<React.SetStateAction<MemberChallenge | null>>;
  refreshUserCheckIns: () => Promise<CheckIn[]>;
  getUserCheckIns: () => CheckIn[];
  loading: boolean;
  updated: boolean;
}

const defaultValues: MemberContextType = {
  membership: null,
  setMembership: () => {},
  refreshUserCheckIns: async () => [],
  getUserCheckIns: () => [],
  loading: false,
  updated: false,
};

const MemberContext = createContext<MemberContextType>(defaultValues);

interface MemberContextProviderProps {
  children: ReactNode;
  membership: MemberChallenge | null;
  setMembership: React.Dispatch<React.SetStateAction<MemberChallenge | null>>;
}

export const MemberContextProvider = ({
  children,
  membership,
  setMembership,
}: MemberContextProviderProps): JSX.Element => {
  const { currentUser } = useCurrentUser();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);
  const refreshUserCheckIns = async (): Promise<CheckIn[]> => {
    if (
      !membership?.user &&
      !membership?.userId &&
      membership?.challenge.userId !== currentUser?.id
    ) {
      setCheckIns([]);
      return [];
    }
    setLoading(true);
    try {
      const uid = membership?.userId ?? currentUser?.id;
      let url = `${API_HOST}/api/checkins/${membership?.challengeId}/${uid}`;
      if (membership?.challenge.type === 'SELF_LED' && membership?.cohortId) {
        url += `/${membership.cohortId}`;
      }
      const response = await axios.get(url);
      setCheckIns(response.data.checkIns as CheckIn[]);
      setUpdated(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
    return checkIns;
  };

  const getUserCheckIns = (): CheckIn[] => {
    return checkIns;
  };

  return (
    <MemberContext.Provider
      value={{ membership, setMembership, refreshUserCheckIns, getUserCheckIns, loading, updated }}>
      {children}
    </MemberContext.Provider>
  );
};

export const useMemberContext = (): MemberContextType => {
  const context = useContext(MemberContext);
  if (!context) {
    throw new Error('useMemberContext must be used within a MemberContextProvider');
  }
  return context;
};
