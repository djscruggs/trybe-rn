import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';

/**
 * Preloads the browser for Android devices to reduce authentication load time
 * See: https://docs.expo.dev/guides/authentication/#improving-user-experience
 */
export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};
