import { StyledTabs } from "@/components/navigation/tabs";
import { Tabs } from "expo-router";
import {
  IconLayoutDashboard,
  IconCalendarClock,
  IconArchive,
  IconUserCog,
} from "@tabler/icons-react-native";
import { useTranslation } from "react-i18next";
import { useSession } from "@/context/auth-context";
import { Redirect } from "expo-router";
import { Platform, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Scheduled from "./scheduled";
import AppointmentDetails from "./(index)/[id]";
import History from "./history";

export default function Layout() {
  const { t } = useTranslation();

  const Tab = createBottomTabNavigator();
  const ScheduledStack = createNativeStackNavigator();
  function ScheduledStackScreen() {
    return (
      <ScheduledStack.Navigator>
        <ScheduledStack.Screen name="scheduled" component={Scheduled} />
        <ScheduledStack.Screen name="history" component={History} 
        options={{
          headerShown: true,
          headerTitle: t("tabs.history"),
          headerLargeTitle: true,
          headerTransparent: Platform.OS === 'ios' ? true : false,
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
        <ScheduledStack.Screen name="Details" component={AppointmentDetails} />
      </ScheduledStack.Navigator>
    );
  }

  const { user, isLoading } = useSession();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!user) {
    return <Redirect href="/signin" />;
  }

  return (
      <StyledTabs tabBarClassName="bg-card text-primary">
      <Tabs.Screen
        name="(index)"
        options={{
          headerShown: false,
          title: t("tabs.today"),
          tabBarIcon: ({ color, size }) => (
            <IconLayoutDashboard size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scheduled"
        options={{
          headerShown: false,
          headerTitle: t("Scheduled"),
          title: t("Scheduled"),
          headerTransparent: false,
          headerTitleStyle: {
            fontFamily: "manrope-semibold",
          },
          tabBarIcon: ({ color, size }) => (
            <IconCalendarClock size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t("tabs.history"),
          tabBarIcon: ({ color, size }) => (
            <IconArchive size={size} color={color} />
          ),
          headerShown: false,
          headerTitle: t("tabs.history"),
          headerTransparent: false,
          headerTitleStyle: {
            fontFamily: "manrope-semibold",
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size }) => (
            <IconUserCog size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
    </StyledTabs>
  );
}
