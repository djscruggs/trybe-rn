import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

import { useAuthSheet } from '~/contexts/auth-sheet-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  image: any;
}

const STEPS: OnboardingStep[] = [
  {
    id: '1',
    title: 'WELCOME TO',
    subtitle: 'Trybe',
    description: 'Discover your next challenge.\nFind your Trybe.',
    image: require('~/assets/step-1.png'),
  },
  {
    id: '2',
    title: 'What you can do with',
    subtitle: 'Trybe',
    description:
      'Our intentional design lets you\nget what you need, no matter\nwhat #mood you\'re in',
    image: require('~/assets/step-2.png'),
  },
  {
    id: '3',
    title: 'We\'re in',
    subtitle: 'Beta',
    description:
      'There\'s a reason our motto is\n"progress, not perfection"\n\nWe\'re in BETA and we have a long\nways to go. We\'d love to hear any\nand all feedback along the way to\nmake it the best place for you and\nyour Trybe <3',
    image: require('~/assets/step-3.png'),
  },
];

export default function About() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { openSignUp } = useAuthSheet();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const goToNext = () => {
    if (currentIndex < STEPS.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
      });
    }
  };

  const handleSkipOrDone = () => {
    router.back();
  };

  const handleGetStarted = () => {
    if (isSignedIn) {
      // User is logged in - navigate to My Challenges
      router.push('/(tabs)/my-challenges');
    } else {
      // User is NOT logged in - open sign-up modal
      openSignUp();
    }
  };

  const renderStep = ({ item, index }: { item: OnboardingStep; index: number }) => {
    const isFirstStep = index === 0;
    const isSecondStep = index === 1;
    const isLastStep = index === STEPS.length - 1;

    return (
      <View style={{ width: SCREEN_WIDTH }} className="flex-1 bg-white px-6 pt-16">
        {/* Header */}
        <View className="items-center">
          {/* Logo */}
          <Image source={require('~/assets/icon.png')} className="mb-8 h-16 w-16" />

          {/* Title */}
          <View className="items-center">
            {isFirstStep && (
              <>
                <Text className="font-source text-sm tracking-widest text-red">
                  {item.title}
                </Text>
                <Text className="font-reklame text-6xl text-red" style={{ marginTop: 8 }}>
                  {item.subtitle}
                </Text>
                <Text className="font-source mt-2 text-lg text-gray-500">(BETA)</Text>
              </>
            )}
            {isSecondStep && (
              <View className="items-center">
                <Text className="font-source text-center text-xl font-bold text-gray-800">
                  {item.title}{' '}
                  <Text className="font-reklame text-xl text-red">{item.subtitle}</Text>
                </Text>
              </View>
            )}
            {isLastStep && (
              <Text className="font-source text-center text-3xl font-bold text-gray-800">
                {item.title}{' '}
                <Text className="font-reklame text-3xl text-red">{item.subtitle}</Text>
              </Text>
            )}
          </View>

          {/* Description */}
          <Text
            className={`font-source mt-8 text-center ${isLastStep ? 'text-base' : 'text-lg'} leading-7 text-gray-600`}>
            {item.description}
          </Text>
        </View>

        {/* Image */}
        <View className="mt-8 flex-1 items-center justify-center">
          <Image
            source={item.image}
            resizeMode={isFirstStep ? 'contain' : 'contain'}
            className={isFirstStep ? 'h-64 w-full' : isLastStep ? 'h-48 w-64' : 'h-80 w-full'}
          />
        </View>

        {/* Pagination dots */}
        <View className="mb-8 flex-row items-center justify-center">
          {STEPS.map((_, idx) => (
            <View
              key={idx}
              className={`mx-1 h-2 rounded-full ${
                idx === index ? 'w-8 bg-red' : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Back button (only show after first step) */}
      {currentIndex > 0 && (
        <TouchableOpacity
          onPress={goToPrevious}
          className="absolute left-4 top-12 z-10 p-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text className="text-2xl text-gray-600">{'<'}</Text>
        </TouchableOpacity>
      )}

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={STEPS}
        renderItem={renderStep}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      />

      {/* Bottom navigation */}
      <View className="absolute bottom-8 left-6 right-6 flex-row items-center justify-between">
        {currentIndex < STEPS.length - 1 ? (
          <>
            {/* Skip button */}
            <TouchableOpacity onPress={handleSkipOrDone}>
              <Text className="font-source text-base text-gray-400">SKIP</Text>
            </TouchableOpacity>

            {/* Next button */}
            <TouchableOpacity
              onPress={goToNext}
              className="h-12 w-12 items-center justify-center rounded-full bg-red">
              <Text className="text-xl font-bold text-white">→</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Done button */}
            <TouchableOpacity onPress={handleSkipOrDone}>
              <Text className="font-source text-base text-gray-400">DONE</Text>
            </TouchableOpacity>

            {/* Get Started button */}
            <TouchableOpacity
              onPress={handleGetStarted}
              className="rounded-full bg-red px-6 py-3">
              <Text className="font-source text-base font-semibold text-white">
                GET STARTED
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}
