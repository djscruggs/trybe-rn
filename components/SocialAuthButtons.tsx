import { Ionicons } from '@expo/vector-icons';
import { SocialIcon } from '@rneui/themed';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

type SocialAuthStrategy = 'oauth_google' | 'oauth_linkedin_oidc' | 'oauth_slack';

interface SocialAuthButtonsProps {
  onSocialSignIn: (strategy: SocialAuthStrategy) => void;
}

export function SocialAuthButtons({ onSocialSignIn }: SocialAuthButtonsProps) {
  return (
    <View className="mb-6 flex-row justify-center gap-4">
      <SocialIcon
        type="google"
        iconType="font-awesome"
        style={{ width: 60, height: 60, borderRadius: 30 }}
        button
        onPress={() => onSocialSignIn('oauth_google')}
      />
      <SocialIcon
        type="linkedin"
        iconType="font-awesome"
        style={{ width: 60, height: 60, borderRadius: 30 }}
        button
        onPress={() => onSocialSignIn('oauth_linkedin_oidc')}
      />
      <TouchableOpacity onPress={() => onSocialSignIn('oauth_slack')} style={styles.slackButton}>
        <Ionicons name="logo-slack" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  slackButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A154B',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
