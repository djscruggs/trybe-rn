import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

export default function ChallengeIndex() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  React.useEffect(() => {
    console.log('pushing to about');
    router.push(`/challenges/${id}/about`);
  }, [id, router]);

  return null; // or a loading indicator if needed
}
