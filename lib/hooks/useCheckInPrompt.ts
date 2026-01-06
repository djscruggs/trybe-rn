import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useCurrentUser } from '~/contexts/currentuser-context';
import { challengesApi } from '~/lib/api/challengesApi';
import { queryKeys } from '~/lib/api/queryKeys';
import { MemberChallenge } from '~/lib/types';

/**
 * Hook to automatically prompt user to check in when they visit a challenge
 * Returns a ref for the CheckInModal and whether to show the prompt
 */
export function useCheckInPrompt(
  challengeId: string | number,
  membership: MemberChallenge | null
) {
  const { currentUser, getToken } = useCurrentUser();
  const checkInModalRef = useRef<BottomSheetModal>(null);
  const [hasPrompted, setHasPrompted] = useState(false);

  // Fetch check-ins to see if user has checked in today
  const { data: checkIns } = useQuery({
    queryKey: queryKeys.challenges.checkIns(
      challengeId.toString(),
      currentUser?.id?.toString() || ''
    ),
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const token = await getToken();
      return challengesApi.getCheckIns(
        challengeId.toString(),
        currentUser.id.toString(),
        token,
        membership?.cohortId
      );
    },
    enabled: !!membership && !!currentUser?.id,
    staleTime: 0, // Always fetch fresh data to check today's status
  });

  useEffect(() => {
    // Only prompt if:
    // 1. User is a member
    // 2. Haven't prompted yet this visit
    // 3. Check-ins data is loaded
    if (!membership || hasPrompted || !checkIns) {
      return;
    }

    // Check if user has checked in today
    const hasCheckedInToday = checkIns.some((checkIn) => {
      const checkInDate = new Date(checkIn.createdAt);
      const today = new Date();
      return (
        checkInDate.getDate() === today.getDate() &&
        checkInDate.getMonth() === today.getMonth() &&
        checkInDate.getFullYear() === today.getFullYear()
      );
    });

    // If they haven't checked in today, show the modal
    if (!hasCheckedInToday) {
      // Small delay to ensure modal is ready
      setTimeout(() => {
        checkInModalRef.current?.present();
      }, 500);
      setHasPrompted(true);
    }
  }, [membership, checkIns, hasPrompted]);

  return { checkInModalRef };
}
