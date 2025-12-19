import React, { useMemo } from 'react';
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
 * Validates if a string is a valid URL
 */
function isValidUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Wrapper component for react-native-user-avatar that uses default parameters
 * instead of defaultProps to avoid React deprecation warnings.
 * Also validates image URLs to prevent AbortError warnings.
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
  // Only pass src if it's a valid URL, otherwise let it fall back to initials
  const validSrc = useMemo(() => {
    return isValidUrl(src) ? src : undefined;
  }, [src]);

  return (
    <UserAvatarLib
      size={size}
      name={name}
      src={validSrc}
      bgColor={bgColor}
      bgColors={bgColors}
      textColor={textColor}
      borderRadius={borderRadius}
      style={style}
    />
  );
}
