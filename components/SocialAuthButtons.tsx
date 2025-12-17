import { Ionicons } from '@expo/vector-icons';
import { SocialIcon } from '@rneui/themed';
import { View, TouchableOpacity } from 'react-native';

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
      <TouchableOpacity
        onPress={() => onSocialSignIn('oauth_slack')}
        className="h-[60px] w-[60px] items-center justify-center rounded-[30px] bg-[#4A154B]">
        <Ionicons name="logo-slack" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
