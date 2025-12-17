import { useAuth } from '@clerk/clerk-expo';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Tabs, router } from 'expo-router';
import { View } from 'react-native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppHeader } from '~/components/AppHeader';
import { TabBarIcon } from '~/components/TabBarIcon';
import { useCurrentUser } from '~/contexts/currentuser-context';
import {
  NewChallengeSheetProvider,
  useNewChallengeSheet,
} from '~/contexts/new-challenge-sheet-context';
import { NewChallengeSheet } from '~/components/NewChallengeSheet';
import { AuthSheetProvider, useAuthSheet } from '~/contexts/auth-sheet-context';
import { AuthSheet } from '~/components/AuthSheet';

function TabsContent() {
  const { currentUser } = useCurrentUser();
  const { isSignedIn } = useAuth();
  const { openSheet, sheetRef } = useNewChallengeSheet();
  const { openSignUp, sheetRef: authSheetRef } = useAuthSheet();
  console.log('👤 TabsLayout: Current user:', currentUser ? 'Logged in' : 'Not logged in');

  return (
    <>
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
              <View className="mb-5 h-[60px] w-[60px] items-center justify-center rounded-[30px] bg-red-500 shadow-lg">
                <AntDesign name="pluscircle" size={48} color="white" />
              </View>
            ),
          }}
          listeners={{
            tabPress: (e: any) => {
              e.preventDefault();
              if (!isSignedIn) {
                openSignUp();
              } else {
                openSheet();
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
    <NewChallengeSheet ref={sheetRef} />
    <AuthSheet ref={authSheetRef} />
  </>
  );
}

export default function TabsLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthSheetProvider>
        <NewChallengeSheetProvider>
          <BottomSheetModalProvider>
            <TabsContent />
          </BottomSheetModalProvider>
        </NewChallengeSheetProvider>
      </AuthSheetProvider>
    </GestureHandlerRootView>
  );
}

