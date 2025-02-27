import { Text } from 'react-native';

export default function ErrorText({ children }: { children: React.ReactNode }) {
  return <Text className="my-2 rounded-md border border-red p-2 text-red">{children}</Text>;
}
