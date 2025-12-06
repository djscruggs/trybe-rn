import { Tabs } from 'expo-router';
import { TabBarIcon } from '~/components/TabBarIcon';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useCurrentUser } from '~/contexts/currentuser-context';

export default function TabsLayout() {
  console.log('📱 TabsLayout: Rendering tabs navigation');
  
  const { currentUser } = useCurrentUser();
  console.log('👤 TabsLayout: Current user:', currentUser ? 'Logged in' : 'Not logged in');

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
          title: 'Home',
          tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-challenges"
        options={{
          title: 'My Challenges',
          tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="users" color={color} />,
        }}
      />
      <Tabs.Screen
        name="new"
        options={{
          title: 'Create',
          tabBarIcon: ({ color }: { color: string }) => (
            <TabBarIcon name="pluscircle" type="antdesign" color={color} size={36} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="user" color={color} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="sign-up"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          href: null,
          tabBarStyle: { display: 'flex' },
        }}
      />
    </Tabs>
  );
}
