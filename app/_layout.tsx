import { router, Stack } from "expo-router";
import { Pressable, TouchableOpacity, useColorScheme } from "react-native";
import "@/global.css";
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { StyledStack } from "@/components/navigation/stack";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n/i18n";
import { SessionProvider } from "@/context/auth-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import ThemedIcon from "@/components/ThemedIcon";
import { IconX } from "@tabler/icons-react-native";
import { Platform } from "react-native";
import { useEffect } from "react";
import { initializeI18nAndDateFns } from "@/lib/i18n-init";
import { ToastProvider } from "@/components/Toast";
import { NotificationProvider } from "@/context/NotificationContext";
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const InitialLayout = () => {
  const { t } = useTranslation();
  return (
    <StyledStack contentClassName="bg-card text-primary">
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(details)/[id]"
        options={{
          headerShown: true,

          headerTitle: t("Details"),
          headerLargeTitle: Platform.OS === "ios" ? true : false,
          headerTransparent: Platform.OS === "ios" ? true : false,
          headerBlurEffect: "regular",
          headerLargeTitleShadowVisible: false,
          headerLargeTitleStyle: {
            fontFamily: "manrope-semibold",
          },
          headerBackButtonDisplayMode: "default",
          headerBackTitle: t("back"),
          headerTitleStyle: {
            fontFamily: "manrope-semibold",
          },
          headerBackTitleStyle: {
            fontFamily: "manrope-medium",
          },
        }}
      />
      <Stack.Screen
        name="(actions)/procedures/[id]"
        options={{
          headerShown: true,
          headerTitle: t("Procedures"),
          headerLargeTitle: Platform.OS === "ios" ? true : false,
          headerTransparent: Platform.OS === "ios" ? true : false,
          headerBlurEffect: "regular",
          headerLargeTitleShadowVisible: false,
          headerLargeTitleStyle: {
            fontFamily: "manrope-semibold",
          },
          headerBackButtonDisplayMode: "default",
          headerBackTitle: t("back"),
          headerTitleStyle: {
            fontFamily: "manrope-semibold",
          },
          headerBackTitleStyle: {
            fontFamily: "manrope-medium",
          },
        }}
      />
      <Stack.Screen
        name="(actions)/procedures/details/[id]"
        options={{
          headerShown: true,
          headerTitle: t("Details"),
          headerLargeTitle: Platform.OS === "ios" ? true : false,
          headerTransparent: Platform.OS === "ios" ? true : false,
          headerBlurEffect: "regular",
          headerLargeTitleShadowVisible: false,
          headerLargeTitleStyle: {
            fontFamily: "manrope-semibold",
          },
          headerBackButtonDisplayMode: "default",
          headerBackTitle: t("back"),
          headerTitleStyle: {
            fontFamily: "manrope-semibold",
          },
          headerBackTitleStyle: {
            fontFamily: "manrope-medium",
          },
        }}
      />
      <Stack.Screen
        name="(actions)/spare-parts/[id]"
        options={{
          headerShown: true,
          headerTitle: t("spareParts"),
          headerLargeTitle: Platform.OS === "ios" ? true : false,
          headerTransparent: Platform.OS === "ios" ? true : false,
          headerBlurEffect: "regular",
          headerLargeTitleShadowVisible: false,
          headerLargeTitleStyle: {
            fontFamily: "manrope-semibold",
          },
          headerBackButtonDisplayMode: "default",
          headerBackTitle: t("back"),
          headerTitleStyle: {
            fontFamily: "manrope-semibold",
          },
          headerBackTitleStyle: {
            fontFamily: "manrope-medium",
          },
        }}
      />
      <Stack.Screen
        name="(actions)/results/[id]"
        options={{
          headerShown: true,
          headerTitle: t("Results"),
          headerLargeTitle: Platform.OS === "ios" ? true : false,
          headerTransparent: Platform.OS === "ios" ? true : false,
          headerBlurEffect: "regular",
          headerLargeTitleShadowVisible: false,
          headerLargeTitleStyle: {
            fontFamily: "manrope-semibold",
          },
          headerBackButtonDisplayMode: "default",
          headerBackTitle: t("back"),
          headerTitleStyle: {
            fontFamily: "manrope-semibold",
          },
          headerBackTitleStyle: {
            fontFamily: "manrope-medium",
          },
        }}
      />
      <Stack.Screen
        name="(actions)/findings/[id]"
        options={{
          headerShown: true,
          headerTitle: t("Findings"),
          headerLargeTitle: Platform.OS === "ios" ? true : false,
          headerTransparent: Platform.OS === "ios" ? true : false,
          headerBlurEffect: "regular",
          headerLargeTitleShadowVisible: false,
          headerLargeTitleStyle: {
            fontFamily: "manrope-semibold",
          },
          headerBackButtonDisplayMode: "default",
          headerBackTitle: t("back"),
          headerTitleStyle: {
            fontFamily: "manrope-semibold",
          },
          headerBackTitleStyle: {
            fontFamily: "manrope-medium",
          },
        }}
      />
      <Stack.Screen
        name="(modal)/register-location/[id]"
        options={{
          presentation: Platform.OS === "ios" ? "formSheet" : "containedModal",
          sheetAllowedDetents: [0.45, 0.95],
          sheetInitialDetentIndex: 0,
          sheetGrabberVisible: true,
          headerLeft: () => (
            <Pressable onPressOut={() => Platform.OS === 'android' ? router.dismiss() : null} onPress={() => Platform.OS === 'ios' ? router.dismiss() : null}> 
              <ThemedIcon icon={IconX} size={24} />
            </Pressable>
          ),
          headerShown: true,
          headerTitle: t("RegisterLocation"),
          headerLargeTitle: false,
          headerTransparent: Platform.OS === "ios" ? true : false,
          headerBlurEffect: "regular",
          headerBackButtonDisplayMode: "default",
          headerBackTitle: t("back"),
          headerTitleStyle: {
            fontFamily: "manrope-semibold",
          },
          headerBackTitleStyle: {
            fontFamily: "manrope-medium",
          },
        }}
      />
      <Stack.Screen
        name="(maps)/[id]"
        options={{
          headerShown: true,
          headerTitle: t("sharedLocation"),
          headerLargeTitle: Platform.OS === "ios" ? true : false,
          headerTransparent: Platform.OS === "ios" ? true : false,
          headerBlurEffect: "regular",
          headerLargeTitleShadowVisible: false,
          headerLargeTitleStyle: {
            fontFamily: "manrope-semibold",
          },
          headerBackButtonDisplayMode: "default",
          headerBackTitle: t("back"),
          headerTitleStyle: {
            fontFamily: "manrope-semibold",
          },
          headerBackTitleStyle: {
            fontFamily: "manrope-medium",
          },
        }}
      />
      <Stack.Screen name="signin" options={{ headerShown: false }} />
    </StyledStack>
  );
};

const RootLayout = () => {
  const queryClient = new QueryClient({});
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    "Manrope-Regular": Manrope_400Regular,
    "Manrope-Medium": Manrope_500Medium,
    "Manrope-SemiBold": Manrope_600SemiBold,
    "Manrope-Bold": Manrope_700Bold,
  });

  // Initialize i18n and date-fns locale on app startup
  useEffect(() => {
    initializeI18nAndDateFns();
  }, []);

  if (!fontsLoaded) {
    return null; // Or a loading screen
  }
  return (
    <NotificationProvider>
      <QueryClientProvider client={queryClient}>
        {/* 
        GestureHandlerRootView is required for:
        - Drawer navigation gestures
        - Swipe gestures
        - Other gesture-based interactions
        Must wrap the entire app to function properly
      */}
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <I18nextProvider i18n={i18n}>
              <ToastProvider position="bottom">
                <SessionProvider>
                  <InitialLayout />
                </SessionProvider>
              </ToastProvider>
            </I18nextProvider>
          </ThemeProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </NotificationProvider>
  );
};

export default RootLayout;
