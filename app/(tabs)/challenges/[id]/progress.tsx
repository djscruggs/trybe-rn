import { View, Text } from 'react-native';

import CircleExample from '~/components/circle-example';
import { useMemberContext } from '~/contexts/member-context';
import { textToJSX } from '~/lib/helpers';
export default function ChallengeProgress() {
  const { challenge } = useMemberContext();
  return (
    <View className="flex-1 items-center justify-center bg-white" key={`progress-${challenge?.id}`}>
      <Text className="min-h-100 mb-6 text-base leading-6 text-gray-700">FOOBAR</Text>
      <CircleExample />
    </View>
  );
}
