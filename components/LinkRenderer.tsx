import React from 'react';
import { Image, View, TouchableOpacity, Linking } from 'react-native';

// convert url query param &t=10s to &start=10 because embeds use different query params
export const youtubeRegex =
  /((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+).*?/;

interface LinkRendererProps {
  text: string;
}

const LinkRenderer: React.FC<LinkRendererProps> = ({ text }) => {
  const matchYouTube = text.match(youtubeRegex);

  if (matchYouTube) {
    const fullUrl = matchYouTube[0];

    // Extract video ID - works for both youtube.com and youtu.be
    let videoId = '';

    // Try youtu.be format first
    const youtuBeMatch = fullUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (youtuBeMatch) {
      videoId = youtuBeMatch[1];
    } else {
      // Try youtube.com format
      const youtubeComMatch = fullUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      if (youtubeComMatch) {
        videoId = youtubeComMatch[1];
      }
    }

    // Extract timestamp if present (supports both &t=123 and &t=123s formats)
    const timestampMatch = fullUrl.match(/[?&]t=(\d+)s?/);
    const timestamp = timestampMatch ? timestampMatch[1] : null;

    if (!videoId) {
      return null;
    }

    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    const youtubeUrl = timestamp
      ? `https://www.youtube.com/watch?v=${videoId}&t=${timestamp}s`
      : `https://www.youtube.com/watch?v=${videoId}`;

    return (
      <View className="mt-2 w-full items-center">
        <TouchableOpacity onPress={() => Linking.openURL(youtubeUrl)}>
          <Image
            source={{ uri: `${thumbnailUrl}` }}
            style={{ width: 320, height: 240 }}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

export default LinkRenderer;
