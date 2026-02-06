import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useCompletedAppointmentsQueryOptions } from "@/services/appointments/queries";
import { Skeleton } from "@/components/Skeleton";
import EmptyState from "@/components/states/Empty";
import ThemedIcon from "@/components/ThemedIcon";
import {
  IconCalendar,
  IconClock,
  IconDeviceDesktop,
  IconMapPin,
} from "@tabler/icons-react-native";
import { Badge } from "@/components/Badge";
import { useRouter } from "expo-router";
import { formatDate } from "@/lib/date-fns-config";

const History = () => {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const router = useRouter();

  // Query for completed appointments
  const completedAppointmentsQuery = useQuery(
    useCompletedAppointmentsQueryOptions()
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {completedAppointmentsQuery.isLoading ? (
        <View className="p-4">
          <Skeleton className="h-20 w-full rounded-md mb-4" />
          <Skeleton className="h-20 w-full rounded-md mb-4" />
          <Skeleton className="h-20 w-full rounded-md" />
        </View>
      ) : completedAppointmentsQuery.isError ? (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-primary text-center mb-2">
            {t("ErrorLoadingData")}
          </Text>
          <TouchableOpacity
            className="bg-primary px-4 py-2 rounded-md"
            onPressOut={Platform.OS === 'android' ? () => completedAppointmentsQuery.refetch() : undefined}
            onPress={Platform.OS === 'ios' ? () => completedAppointmentsQuery.refetch() : undefined}
          >
            <Text className="text-primary-foreground">{t("TryAgain")}</Text>
          </TouchableOpacity>
        </View>
      ) : completedAppointmentsQuery.data?.length ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          className="flex-1"
        >
          <View className="p-4">
            <Text className="text-xl font-bold text-primary mb-4">
              {t("CompletedWorkOrders")}
            </Text>
            <View className="bg-card rounded-lg overflow-hidden shadow-sm border border-border">
              {completedAppointmentsQuery.data.map((item, itemIndex) => {
                return (
                  <View key={item.id}>
                    <TouchableOpacity
                      className="py-3 px-4 flex-row items-center"
                      onPressOut={Platform.OS === 'android' ? () =>
                        router.push({
                          pathname: `/(details)/${item.id}`,
                          params: { returnTo: "history" },
                        })
                      : undefined}
                      onPress={Platform.OS === 'ios' ? () =>
                        router.push({
                          pathname: `/(details)/${item.id}`,
                          params: { returnTo: "history" },
                        })
                      : undefined}
                      >
                      {/* Icon based on serviced type */}
                      <View className="w-8 justify-center items-center">
                        <ThemedIcon
                          icon={
                            item.serviced === "remote"
                              ? IconDeviceDesktop
                              : IconMapPin
                          }
                          size={16}
                        />
                      </View>

                      {/* Value & Title in the middle, start aligned */}
                      <View className="flex-col flex-1 ml-2">
                        <Text className="text-primary font-manrope-regular">
                          {item.customerName ||
                            item.title ||
                            item.name ||
                            t("Unnamed Appointment")}
                        </Text>
                        <Text className="text-muted-foreground text-xs font-manrope-regular">
                          {item.description || item.subject || ""}
                        </Text>
                        {/* Date and time information */}
                        {item.startDate && (
                          <View className="flex-row items-center mt-1">
                            <Text className="text-muted-foreground text-xs">
                              {t("CompletedDate")}{" "}
                            </Text>
                            <IconCalendar size={12} color="#71717a" />
                            <Text className="text-muted-foreground text-xs ml-1">
                              {item.startDate
                                ? formatDate(item.startDate.toDate(), "PPP")
                                : t("No date")}
                            </Text>
                            <IconClock
                              size={12}
                              color="#71717a"
                              className="ml-3"
                            />
                            <Text className="text-muted-foreground text-xs ml-1">
                              {item.startDate
                                ? formatDate(item.startDate.toDate(), "p")
                                : t("No time")}
                            </Text>
                          </View>
                        )}
                        <View className="flex-row mt-1">
                          <Badge
                            label={t(item.status)}
                            variant="secondary"
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
                    </TouchableOpacity>
                    {itemIndex < completedAppointmentsQuery.data.length - 1 && (
                      <View className="h-px bg-muted-foreground/10 ml-12" />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-xl font-bold text-primary mb-2">
            {t("NoCompletedWorkOrders")}
          </Text>
          <Text className="text-muted-foreground text-center">
            {t("CompletedWorkOrdersWillAppearHere")}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default History;