import {Image, Text, TouchableOpacity, View, useWindowDimensions} from 'react-native';
import React from 'react';
import Animated, {
  SharedValue,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {Gesture, GestureDetector, Pressable} from 'react-native-gesture-handler';
import {Badge} from '@/components/Badge';
import { useTranslation } from 'react-i18next';
import { IconBuildingBank, IconMap, IconMapPin } from '@tabler/icons-react-native';
import { Link } from 'expo-router';
import ThemedIcon from '../ThemedIcon';
import { formatDate } from '@/lib/date-fns-config';

// Simplified type with only the fields needed by the Card component
export type CardData = {
  id: string;
  photoURL?: string;
  title?: string;
  formattedStartDate?: string; // Pre-formatted date string instead of complex object
  serviced?: string;
  customerName?: string;
  branchName?: string;
  description?: string;
};

type Props = {
  newData: CardData[];
  setNewData: React.Dispatch<React.SetStateAction<CardData[]>>;
  maxVisibleItems: number;
  item: CardData;
  index: number;
  dataLength: number;
  animatedValue: SharedValue<number>;
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
};


export const SwipableCard = ({
  newData,
  setNewData,
  maxVisibleItems,
  item,
  index,
  dataLength,
  animatedValue,
  currentIndex,
  setCurrentIndex,
}: Props) => {
  const translateX = useSharedValue(0);
  const direction = useSharedValue(0);
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const pan = Gesture.Pan()
    .onUpdate(e => {
      // e.translationX is the distance of the swipe
      // e.translationX is positive if the swipe is to the right
      // isSwipeRight is true if the swipe is to the right
      const isSwipeRight = e.translationX > 0;

      // direction 1 is right, -1 is left
      direction.value = isSwipeRight ? 1 : -1;

      // If the current index is the same as the index of the card
      if (currentIndex === index) {
        translateX.value = e.translationX;
        animatedValue.value = interpolate(
          Math.abs(e.translationX),
          [0, width],
          [index, index + 1],
        );
      }
    })
    .onEnd(e => {
      if (currentIndex === index) {
        // If the swipe distance is greater than 150 or the swipe velocity is greater than 1000
        // go to the next card
        if (Math.abs(e.translationX) > 150 || Math.abs(e.velocityX) > 1000) {
          translateX.value = withTiming(width * direction.value, {}, () => {
            runOnJS(setNewData)([...newData, newData[currentIndex]]);
            console.log('New data: ', newData);
            runOnJS(setCurrentIndex)(currentIndex + 1);
          });
          animatedValue.value = withTiming(currentIndex + 1);
          // If the swipe distance is less than 150 or the swipe velocity is less than 1000
          // go back to the original position
        } else {
          translateX.value = withTiming(0, {duration: 500});
          animatedValue.value = withTiming(currentIndex, {duration: 500});
        }
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const currentItem = index === currentIndex;

    const translateY = interpolate(
      animatedValue.value,
      [index - 1, index],
      [-30, 0],
    );

    const scale = interpolate(
      animatedValue.value,
      [index - 1, index],
      [0.9, 1],
    );

    const rotateZ = interpolate(
      Math.abs(translateX.value),
      [0, width],
      [0, 20],
    );

    const opacity = interpolate(
      animatedValue.value + maxVisibleItems,
      [index, index + 1],
      [0, 1],
    );

    return {
      transform: [
        {translateY: currentItem ? 0 : translateY},
        {scale: currentItem ? 1 : scale},
        {translateX: translateX.value},
        {
          rotateZ: currentItem ? `${direction.value * rotateZ}deg` : '0deg',
        },
      ],
      opacity: index < currentIndex + maxVisibleItems ? 1 : opacity,
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
            {zIndex: dataLength - index},
          animatedStyle,
        ]}
        className="bg-card absolute border border-1 border-muted-foreground/30 w-[360px] h-[200px] rounded-xl p-4"
        >
        {/* Card Header */}
        <View className="p-0 py-2">
          <View className="flex-row items-center">
            <View className="mr-3 border-2 border-muted-foreground rounded-full p-0.5">
              <Image 
                source={{uri: item.photoURL}} 
                className="w-8 h-8 rounded-full" 
              />
            </View>
            <View className="flex-1">
              <Text className="font-manrope-semibold text-base text-primary leading-5">
                {item.title}
              </Text>
              {item.formattedStartDate && (
                <View className="flex-row items-center">
                  <Text className="text-xs text-muted-foreground font-manrope leading-4">
                    {t('beginsAt') + ' '}
                  </Text>
                  <Text className="text-xs text-muted-foreground font-manrope leading-4">
                    {item.formattedStartDate}
                  </Text>
                </View>
              )}
            </View>
            <Badge className="p-2 text-primary"
              label={item.serviced ? t(item.serviced) : ''}
              variant="secondary"
              icon={IconMap}
            />
          </View>
        </View>

        {/* Card Content */}
        <View className="px-3 py-2">
          <View className="flex-col items-start gap-2">
            <View className="flex-row items-center -mx-2 space-x-3">
              <ThemedIcon icon={IconBuildingBank}/>
              <Text className="text-primary font-manrope-regular flex-row items-start">
                {typeof item.customerName === 'string' ? item.customerName : ''}
              </Text>
            </View>
            {item.branchName && (
            <View className="flex-row items-center -mx-2 space-x-3">
              <ThemedIcon icon={IconMapPin} />
              <Text className="text-primary font-manrope-regular flex-row items-center">
                {item.branchName}
              </Text>
            </View>
            )}
            <View className="flex-row items-center">
            <Text className="text-primary font-manrope-regular">
              {typeof item.description === 'string' ? item.description : ''}
            </Text>
            </View>
          </View>
        </View>

        {/* Card Actions */}
        <View className="absolute bottom-4 right-4">
          <Link href={`/(details)/${item.id}`} asChild>
          <TouchableOpacity className="flex-row items-center gap-4 flex-wrap">
            <View className="flex-row items-center">
              <Text className="text-sm text-primary font-manrope-semibold">
                {t('Details')}
              </Text>
              <Text className="ml-1 text-primary">→</Text>
            </View>
            </TouchableOpacity>
          </Link>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

// Default export removed as we're using named exports

// All styles converted to NativeWind classes