import React from 'react';
import UserAvatarLib from 'react-native-user-avatar';

interface UserAvatarProps {
  size?: number;
  name?: string;
  src?: string;
  bgColor?: string;
  bgColors?: string[];
  textColor?: string;
  borderRadius?: number;
  style?: any;
}

/**
 * Wrapper component for react-native-user-avatar that uses default parameters
 * instead of defaultProps to avoid React deprecation warnings
 */
export default function UserAvatar({
  size = 50,
  name = '',
  src,
  bgColor,
  bgColors,
  textColor,
  borderRadius,
  style,
}: UserAvatarProps) {
  return (
    <UserAvatarLib
      size={size}
      name={name}
      src={src}
      bgColor={bgColor}
      bgColors={bgColors}
      textColor={textColor}
      borderRadius={borderRadius}
      style={style}
    />
  );
}
