import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import AntDesign from '@expo/vector-icons/AntDesign';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';

import { TabBarIcon } from '~/components/TabBarIcon';
import { useCurrentUser, UserProvider } from '~/contexts/currentuser-context';
import { tokenCache } from '~/lib/cache';
import { API_HOST, CLERK_PUBLISHABLE_KEY } from '~/lib/environment';
// Create a client
const queryClient = new QueryClient();

function TabScreens() {
  const { userId } = useAuth();
  const { currentUser, setCurrentUser } = useCurrentUser();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await axios.get(`${API_HOST}/api/clerk/${userId}`);
        const data = result.data;
        setCurrentUser(data);
      } catch (err) {
        console.error('err', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);
  return (
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
      {currentUser && (
        <Tabs.Screen
          name="new"
          options={{
            title: '',
            tabBarIcon: ({ color }) => <TabBarIcon name="plus-circle" color={color} />,
          }}
        />
      )}
      {!currentUser && (
        <Tabs.Screen
          name="new"
          options={{
            title: '',
            href: null,
          }}
        />
      )}
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
          href: currentUser ? '/profile' : null,
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />

      <Tabs.Screen
        name="sign-up"
        options={{
          href: !currentUser ? '/sign-up' : null,
          title: '',
          tabBarIcon: ({ color }) => <AntDesign name="login" size={24} color={color} />,
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
  );
}

export default function TabLayout() {
  const publishableKey = CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error('Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your ~/lib/environment.ts');
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
        <UserProvider>
          <Toast />
          <ClerkLoaded>
            <TabScreens />
          </ClerkLoaded>
        </UserProvider>
      </ClerkProvider>
    </QueryClientProvider>
  );
}
