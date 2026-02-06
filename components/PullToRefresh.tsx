import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { ReactNode, useCallback } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  refreshColor?: string;
  pullDistance?: number;
  isRefreshing?: boolean;
}

const PullToRefresh = ({ 
  onRefresh, 
  children, 
  refreshColor = '#0000ff',
  pullDistance = 25,
  isRefreshing: externalRefreshing
}: PullToRefreshProps) => {
  const translateY = useSharedValue(0);
  const isRefreshing = useSharedValue(externalRefreshing || false);
  
  // Update isRefreshing when external prop changes
  if (externalRefreshing !== undefined && isRefreshing.value !== externalRefreshing) {
    isRefreshing.value = externalRefreshing;
    if (!externalRefreshing) {
      translateY.value = withSpring(0);
    }
  }

  const handleRefresh = useCallback(async () => {
    try {
      await onRefresh();
    } finally {
      // Only reset if we're not controlled externally
      if (externalRefreshing === undefined) {
        isRefreshing.value = false;
        translateY.value = withSpring(0);
      }
    }
  }, [onRefresh, externalRefreshing]);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      // Only allow pull if we're not already refreshing
      return !isRefreshing.value;
    })
    .onUpdate((event) => {
      // Only allow pulling down when at the top
      if (event.translationY > 0) {
        // Add resistance to the pull
        translateY.value = event.translationY / 2;
      }
    })
    .onEnd(() => {
      if (translateY.value > pullDistance && !isRefreshing.value) {
        isRefreshing.value = true;
        runOnJS(handleRefresh)();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      opacity: translateY.value > 10 ? 1 : 0,
      transform: [
        { translateY: -50 + translateY.value / 2 },
        { scale: Math.min(1, translateY.value / pullDistance) }
      ],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.refreshIndicator, indicatorStyle]}>
        <ActivityIndicator />
      </Animated.View>
      
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.content, animatedStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  refreshIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});

export default PullToRefresh;