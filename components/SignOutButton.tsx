import { useClerk } from '@clerk/clerk-expo'
import * as Linking from 'expo-linking'
import { Button } from 'react-native'


export const SignOutButton = ({afterSignOut}: {afterSignOut: () => void}) => {
  const { signOut } = useClerk()

  const handleSignOut = async () => {
    try {
      await signOut()
      // Redirect to your desired page
      afterSignOut()
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }

  return <Button title="Sign out" onPress={handleSignOut} />
}