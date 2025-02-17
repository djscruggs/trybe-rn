import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Tabs } from 'expo-router';
import Toast from 'react-native-toast-message';

import { TabBarIcon } from '~/components/TabBarIcon';

// Create a client
const queryClient = new QueryClient();

export default function TabLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toast />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: 'red',
          tabBarInactiveTintColor: 'gray',
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: '',
            tabBarIcon: ({ color }) => <TabBarIcon name="trophy" color={color} />,
          }}
        />
        <Tabs.Screen
          name="new"
          options={{
            title: '',
            tabBarIcon: ({ color }) => <TabBarIcon name="plus-circle" color={color} />,
          }}
        />
        <Tabs.Screen
          name="about"
          options={{
            title: 'About',
            tabBarIcon: ({ color }) => <TabBarIcon name="lightbulb-o" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: '',
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          }}
        />
        <Tabs.Screen
          name="challenges/[id]"
          options={{
            href: null,
          }}
        />
        {/* <Tabs.Screen
          name="challenges/[id]/about"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="challenges/[id]/chat"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="challenges/[id]/post"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="challenges/[id]/program"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="challenges/[id]/progress"
          options={{
            href: null,
          }}
        /> */}
      </Tabs>
    </QueryClientProvider>
  );
}
