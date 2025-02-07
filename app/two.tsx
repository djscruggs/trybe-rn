import { Stack } from 'expo-router';

import { Container } from '~/components/Container';
import { ScreenContent } from '~/components/ScreenContent';
import { Text } from '~/components/nativewindui/Text';
export default function Home() {
  return (
    <>
      <Stack.Screen options={{ title: 'Tab Two' }} />
      <Container>
        <ScreenContent title="Tab Two" path="app/two.tsx" />
        <Text>I am tab two</Text>
      </Container>
    </>
  );
}
