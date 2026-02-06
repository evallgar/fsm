import {
  Text,
  View,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useLatestAppointmentsQueryOptions,
  useNewAppointmentsQueryOptions,
} from "@/services/appointments/queries";
import { WorkOrder } from "@/services/appointments/interfaces";
// Using formatDate from our config instead of direct format import
import { Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/Skeleton";

import { SwipableCard, CardData } from "@/components/reanimated/Card";
import PullToRefresh from "@/components/PullToRefresh";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Tabs";
import { router } from "expo-router";
import ThemedIcon from "@/components/ThemedIcon";
import { Badge } from "@/components/Badge";
import * as TablerIcons from "@tabler/icons-react-native";
import EmptyState from "@/components/states/Empty";
import { formatDate, formatDistanceToNowMethod } from "@/lib/date-fns-config";
import { useNotification } from "@/context/NotificationContext";
import * as Notifications from "expo-notifications";
import { useToast } from "@/components/Toast";

type Appointment = WorkOrder;

// Function to map WorkOrder to CardData (minimal data needed by SwipableCard)
const mapWorkOrderToCardData = (workOrder: WorkOrder): CardData => {
  // Format the date string here instead of in the component
  let formattedStartDate = "---";
  try {
    if (workOrder.startDate) {
      // Handle Firebase Timestamp objects
      if (typeof workOrder.startDate === 'object' && 
          workOrder.startDate !== null && 
          'toDate' in workOrder.startDate && 
          typeof workOrder.startDate.toDate === 'function') {
        formattedStartDate = formatDistanceToNowMethod(workOrder.startDate.toDate());
      }
      // Handle Date objects
      else if (workOrder.startDate instanceof Date) {
        formattedStartDate = formatDistanceToNowMethod(workOrder.startDate);
      }
      // Handle ISO string dates
      else if (typeof workOrder.startDate === 'string') {
        formattedStartDate = formatDistanceToNowMethod(new Date(workOrder.startDate));
      }
    }
  } catch (error) {
    console.error('Error formatting date in mapping function:', error);
  }

  return {
    id: workOrder.id,
    photoURL: workOrder.photoURL,
    title: workOrder.title,
    formattedStartDate: formattedStartDate,
    serviced: workOrder.serviced,
    customerName: workOrder.customerName,
    branchName: workOrder.branchName,
    description: workOrder.description
  };
};
const Index = () => {
  const { toast } = useToast();
  const { expoPushToken, notification, error: notificationError } = useNotification();

  const queryClient = useQueryClient();
  const {
    data: appointments,
    isFetching,
    error,
    refetch,
  } = useQuery(useNewAppointmentsQueryOptions());

  const {
    data: latestAppointments,
    isFetching: latestAppointmentsFetching,
    error: latestAppointmentsError,
    refetch: latestAppointmentsRefetch,
  } = useQuery(useLatestAppointmentsQueryOptions());

  const { t } = useTranslation();
  const [newAppointments, setNewAppointments] = useState<CardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activityIndex, setActivityIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const animatedValue = useSharedValue(0);
  const MAX = 3;

  const animatedStyle = useAnimatedStyle(() => {
    if (animatedValue.value > currentIndex + 0.5) {
      runOnJS(setActivityIndex)(currentIndex + 1);
    } else {
      runOnJS(setActivityIndex)(currentIndex);
    }
    const opacity = interpolate(
      animatedValue.value,
      [currentIndex, currentIndex + 0.3, currentIndex + 0.8, currentIndex + 1],
      [1, 0, 0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity: opacity,
    };
  });

  useEffect(() => {
    if (appointments) {
      // Map WorkOrder objects to CardData objects
      const cardData = appointments.map(appointment => mapWorkOrderToCardData(appointment));
      setNewAppointments(cardData);
    }
  }, [appointments]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    console.log("Refreshing...");
    try {
      // Use proper query key format for React Query v4
      await queryClient.invalidateQueries({queryKey: ["new-appointments"]});
      await queryClient.invalidateQueries({queryKey: ["latest-appointments"]});
      await refetch();
      await latestAppointmentsRefetch();
      
      // Reset the current index to ensure cards are visible after refresh
      setCurrentIndex(0);
      animatedValue.value = 0;
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, refetch, latestAppointmentsRefetch, animatedValue]);

  // if (error) return <Text>Error: {error.message}</Text>;

  // if (notificationError) return <Text>Error: {notificationError.message}</Text>;

  if (expoPushToken) {
    console.log("expoPushToken: ", expoPushToken);
  }

  // if (!notification) return <Text>Error: No notification</Text>;

  async function schedulePushNotification() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "You've got mail! 📬",
        body: 'Here is the notification body',
        data: { data: 'goes here', test: { test1: 'more data' } },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
  }

  useEffect(() => {
    if (notification) {
      console.log('notification: ', JSON.stringify(notification));
      // Using the correct toast function signature: message, variant, duration, position
      toast(
        notification.request.content.body as string,
        'info',
        5000,
        "top"
      );
    }
  }, [notification]);

  // return (
  //   <PullToRefresh onRefresh={handleRefresh} isRefreshing={refreshing || isFetching}>
  //     <SafeAreaView className="flex-1 bg-primary-foreground px-4 justify-center items-center">
  //       <Text className="text-xl font-manrope-medium text-primary">No appointments found</Text>
  //     </SafeAreaView>
  //   </PullToRefresh>
  // );

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-primary-foreground">
      <PullToRefresh
        onRefresh={handleRefresh}
        isRefreshing={refreshing || isFetching}
      >
        <View
          className="flex-1 px-4"
          style={{ paddingTop: Platform.OS === "ios" ? 10 : 0 }}
        >
          <Text className="text-3xl font-manrope-semibold tracking-tighter text-primary mb-6">
            {t("Today")}
          </Text>
          <Text className="text-2xl font-manrope-bold tracking-tighter text-primary mb-16">
            {t("NewOrdersTitle")}
          </Text>

          {isFetching && !refreshing ? (
            <Skeleton />
          ) : appointments && appointments?.length > 0 ? (
            <View className="flex-1 items-center h-[230px] min-h-[230px]">
              {newAppointments.map((item, index) => {
                if (index > currentIndex + MAX || index < currentIndex) {
                  return null;
                }
                return (
                  <SwipableCard
                    newData={newAppointments}
                    setNewData={setNewAppointments}
                    maxVisibleItems={MAX}
                    item={item}
                    index={index}
                    dataLength={newAppointments.length}
                    animatedValue={animatedValue}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                    key={index}
                  />
                );
              })}
            </View>
          ) : (
            <View className="flex-1 h-[150px] min-h-[150px] items-center">
              <EmptyState />
            </View>
          )}

          <View>
            <Text className="text-2xl font-manrope-semibold tracking-tight text-primary mb-4">
              {t("Recent")}
            </Text>
            <Tabs defaultValue="inProgress">
              <TabsList>
                <TabsTrigger value="inProgress" title={t("inProgress")} />
                <TabsTrigger value="Completed" title={t("Completed")} />
              </TabsList>
              <TabsContent
                className="border-0 -px-2 min-h-52"
                value="inProgress"
              >
                <ScrollView className="h-[230px] min-h-[230px]">
                  {latestAppointmentsFetching && (
                    <View className="flex-col gap-4">
                      <View className="flex-col gap-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-32 w-full" />
                      </View>
                      <View className="flex-col gap-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-32 w-full" />
                      </View>
                      <View className="flex-col gap-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-32 w-full" />
                      </View>
                    </View>
                  )}
                  {latestAppointments && latestAppointments.filter((item) => item.status !== "completed").length === 0 && (
                    <ScrollView className="h-[230px] min-h-[230px]">
                      <EmptyState />
                    </ScrollView>
                  )}
                  {latestAppointments && latestAppointments.filter((item) => item.status !== "completed").length > 0 && (
                    <View>
                      <View className="rounded-xl border border-muted-foreground/20 bg-card overflow-hidden shadow-sm">
                        {latestAppointments.filter(
                          (item) => item.status !== "completed"
                        ).map((item, itemIndex) => (
                          <View key={item.id}>
                            <Pressable
                              onPress={() => Platform.OS === 'ios' ? 
                                router.push({
                                  pathname: `/(details)/${item.id}`,
                                })
                              : null}
                              onPressOut={() => Platform.OS === 'android' ? 
                                router.push({
                                  pathname: `/(details)/${item.id}`,
                                })
                              : null}
                              className="py-3 px-4 flex-row items-center"
                            >
                              {/* Icon based on serviced type */}
                              <View className="w-8 justify-center items-center">
                                <ThemedIcon
                                  icon={
                                    item.serviced === "remote"
                                      ? TablerIcons.IconDeviceDesktop
                                      : TablerIcons.IconMapPin
                                  }
                                  size={16}
                                />
                              </View>

                              {/* Value & Title in the middle, start aligned */}
                              <View className="flex-col flex-1 ml-2">
                                <Text className="text-primary font-manrope-regular">
                                  {item.customerName || item.title}
                                </Text>
                                <Text className="text-muted-foreground text-xs font-manrope-regular">
                                  {item.description || item.subject}
                                </Text>
                                {/* Date and time information */}
                                {item.endDate && (
                                <View className="flex-row items-center mt-1">
                                  <Text className="text-muted-foreground text-xs">{t('DueDate')} </Text>
                                  <TablerIcons.IconCalendar
                                    size={12}
                                    color="#71717a"
                                  />
                                  <Text className="text-muted-foreground text-xs ml-1">
                                    {item.endDate
                                      ? formatDate(
                                          item.endDate.toDate(),
                                          "PPP"
                                        )
                                      :t("No date")}
                                  </Text>
                                  <TablerIcons.IconClock
                                    size={12}
                                    color="#71717a"
                                    className="ml-3"
                                  />
                                  <Text className="text-muted-foreground text-xs ml-1">
                                    {item.endDate
                                      ? formatDate(item.endDate.toDate(), "p")
                                      : t("No time")}
                                  </Text>
                                </View>
                                )}
                                <View className="flex-row mt-1">
                                  <Badge
                                    label={t(item.status)}
                                    variant={
                                      item.status === "inProgress"
                                        ? "default"
                                        : "secondary"
                                    }
                                  />
                                  {item.priority && (
                                    <Badge
                                      label={t(item.priority)}
                                      variant="destructive"
                                      className="ml-2"
                                    />
                                  )}
                                </View>
                              </View>

                              {/* Arrow at the right */}
                              <Text className="text-gray-400 ml-2">›</Text>
                            </Pressable>
                            {itemIndex < latestAppointments.length - 1 && (
                              <View className="h-px bg-muted-foreground/10 ml-12" />
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </ScrollView>
              </TabsContent>
              <TabsContent
                className="border-0 -px-2 min-h-52"
                value="Completed"
              >
                 <ScrollView className="h-[230px] min-h-[230px]">
                  {latestAppointmentsFetching && (
                    <View className="flex-col gap-4">
                      <View className="flex-col gap-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-32 w-full" />
                      </View>
                      <View className="flex-col gap-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-32 w-full" />
                      </View>
                      <View className="flex-col gap-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-32 w-full" />
                      </View>
                    </View>
                  )}
                  {latestAppointments && latestAppointments.filter((item) => item.status === "completed").length === 0 && (
                    <EmptyState />
                  )}
                  {latestAppointments && latestAppointments.filter((item) => item.status === "completed").length > 0 && (
                    <View>
                      <View className="rounded-xl border border-muted-foreground/20 bg-card overflow-hidden shadow-sm">
                        {latestAppointments.filter(
                          (item) => item.status === "completed"
                        ).map((item, itemIndex) => (
                          <View key={item.id}>
                            <Pressable
                              onPress={() => Platform.OS === 'ios' ? 
                                router.push({
                                  pathname: `/(details)/${item.id}`,
                                })
                              : null}
                              onPressOut={() => Platform.OS === 'android' ? 
                                router.push({
                                  pathname: `/(details)/${item.id}`,
                                })
                              : null}
                              className="py-3 px-4 flex-row items-center"
                            >
                              {/* Icon based on serviced type */}
                              <View className="w-8 justify-center items-center">
                                <ThemedIcon
                                  icon={
                                    item.serviced === "remote"
                                      ? TablerIcons.IconDeviceDesktop
                                      : TablerIcons.IconMapPin
                                  }
                                  size={16}
                                />
                              </View>

                              {/* Value & Title in the middle, start aligned */}
                              <View className="flex-col flex-1 ml-2">
                                <Text className="text-primary font-manrope-regular">
                                  {item.customerName || item.title}
                                </Text>
                                <Text className="text-muted-foreground text-xs font-manrope-regular">
                                  {item.description || item.subject}
                                </Text>
                                {/* Date and time information */}
                                <View className="flex-row items-center mt-1">
                                  <TablerIcons.IconCalendar
                                    size={12}
                                    color="#71717a"
                                  />
                                  <Text className="text-muted-foreground text-xs ml-1">
                                    {item.endDate
                                      ? formatDate(item.endDate.toDate(), "PPP")
                                      : t("No date")}
                                  </Text>
                                  <TablerIcons.IconClock
                                    size={12}
                                    color="#71717a"
                                    className="ml-3"
                                  />
                                  <Text className="text-muted-foreground text-xs ml-1">
                                    {item.endDate
                                      ? formatDate(item.endDate.toDate(), "p")
                                      : t("No time")}
                                  </Text>
                                </View>
                                <View className="flex-row mt-1">
                                  <Badge
                                    label={t(item.status)}
                                    variant={
                                      item.status === "inProgress"
                                        ? "default"
                                        : "secondary"
                                    }
                                  />
                                  {item.priority && (
                                    <Badge
                                      label={t(item.priority)}
                                      variant="destructive"
                                      className="ml-2"
                                    />
                                  )}
                                </View>
                              </View>

                              {/* Arrow at the right */}
                              <Text className="text-gray-400 ml-2">›</Text>
                            </Pressable>
                            {itemIndex < latestAppointments.length - 1 && (
                              <View className="h-px bg-muted-foreground/10 ml-12" />
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </ScrollView>
              </TabsContent>
            </Tabs>
          </View>
        </View>
      </PullToRefresh>
    </SafeAreaView>
  );
};

export default Index;

const styles = StyleSheet.create({
  activityContainer: {
    flex: 3 / 2,
  },
});
