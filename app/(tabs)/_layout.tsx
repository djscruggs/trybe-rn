import { useAuth } from '@clerk/clerk-expo';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Tabs, router } from 'expo-router';
import { View, StyleSheet } from 'react-native';

import { AppHeader } from '~/components/AppHeader';
import { TabBarIcon } from '~/components/TabBarIcon';
import { useCurrentUser } from '~/contexts/currentuser-context';

export default function TabsLayout() {
  const { currentUser } = useCurrentUser();
  const { isSignedIn } = useAuth();
  console.log('👤 TabsLayout: Current user:', currentUser ? 'Logged in' : 'Not logged in');

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <AppHeader />,
        tabBarActiveTintColor: 'red',
        tabBarInactiveTintColor: 'gray',
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="new"
        options={{
          title: 'Create',
          tabBarIcon: () => (
            <View style={styles.centerButton}>
              <AntDesign name="pluscircle" size={48} color="white" />
            </View>
          ),
        }}
        listeners={{
          tabPress: (e: any) => {
            if (!isSignedIn) {
              e.preventDefault();
              router.push('/sign-up');
            }
          },
        }}
      />
      <Tabs.Screen
        name="my-challenges"
        options={{
          title: 'My Challenges',
          tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="trophy" color={color} />,
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
        name="profile"
        options={{
          href: null,
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
        name="sign-in"
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

const styles = StyleSheet.create({
  centerButton: {
    backgroundColor: '#ef4444',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
