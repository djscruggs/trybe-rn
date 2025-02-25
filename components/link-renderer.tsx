import { Link } from 'expo-router';
import React from 'react';
import { Image, View } from 'react-native';

// convert url query param &t=10s to &start=10 because embeds use different query params
export const youtubeRegex =
  /((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+).*?/;

interface LinkRendererProps {
  text: string;
}

const LinkRenderer: React.FC<LinkRendererProps> = ({ text }) => {
  // const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\.+)?/
  const matchYouTube = text.match(youtubeRegex);

  if (matchYouTube) {
    const videoId = matchYouTube[0]?.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)?.[1] ?? '';
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    return (
      <View className="flex w-full items-center">
        <Link href={`https://www.youtube.com/watch?v=${videoId}`}>
          <Image source={{ uri: `${thumbnailUrl}` }} style={{ width: 300, height: 300 }} />
        </Link>
      </View>
    );
  }

  return null;
};

export default LinkRenderer;
