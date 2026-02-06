import { Pressable, ActivityIndicator, Text, StyleSheet, StyleProp, ViewStyle, TextStyle, Platform } from "react-native";
import { useColorScheme } from "react-native";

const LoadingButton = ({ 
    title, 
    onPress, 
    loading, 
    style, 
    textStyle,
    indicatorColor = 'white'
  }: {
    title: string;
    onPress: () => void;
    loading: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    indicatorColor?: string;
  }) => {
    const colorScheme = useColorScheme();
    return (
      <Pressable
        style={[styles.button, style]}
        className="bg-primary w-full max-w-[300px] py-3 rounded-lg active:bg-primary"
        onPress={() => Platform.OS === 'ios' ? onPress() : null}
        onPressOut={() => Platform.OS === 'android' ? onPress() : null}
        android_ripple={{ color: '#ccc', radius: 10 }}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colorScheme === 'dark' ? 'white' : 'black'} />
        ) : (
          <Text className="text-primary-foreground font-manrope-semibold">{title}</Text>
        )}
      </Pressable>
    );
  };
  
  const styles = StyleSheet.create({
    button: {
      padding: 15,
      borderRadius: 5,
      alignItems: 'center', // This centers horizontally
      justifyContent: 'center', // This centers vertically
      minHeight: 50, // Ensure consistent height when loading
    },
    text: {
      color: 'white',
      fontSize: 16,
    },
  });
  
  export default LoadingButton;