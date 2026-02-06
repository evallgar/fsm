import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "react-native";
import { SafeAreaView } from "react-native";
import React, { useState } from "react";
import { startOfMonth, format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import {
  useAppointmentByDateQueryOptions,
  useAppointmentByMonthQueryOptions,
} from "@/services/appointments/queries";
import { Skeleton } from "@/components/Skeleton";
import EmptyState from "@/components/states/Empty";
import ThemedIcon from "@/components/ThemedIcon";
import {
  IconCalendarEvent,
  IconMapPin,
  IconClock,
  IconCalendar,
  IconDeviceDesktop,
} from "@tabler/icons-react-native";
import { Badge } from "@/components/Badge";
import { useRouter } from "expo-router";
import { CalendarMonth, MarkedDate } from "@/interfaces/calendar";
import { formatDate } from "@/lib/date-fns-config";
import { calendarLocaleEs, calendarLocaleEn } from "@/i18n/calendar";


// Separate Calendar component to isolate rendering
interface AppointmentCalendarProps {
  scheme: string | null | undefined;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedMonth: CalendarMonth;
  setSelectedMonth: (month: CalendarMonth) => void;
  setEnabled: (enabled: boolean) => void;
  setMonthEnabled: (enabled: boolean) => void;
  markedDates: MarkedDate;
}

const AppointmentCalendar = React.memo(({ 
  scheme, 
  selectedDate, 
  setSelectedDate, 
  selectedMonth, 
  setSelectedMonth, 
  setEnabled, 
  setMonthEnabled, 
  markedDates 
}: AppointmentCalendarProps) => {
  const { i18n } = useTranslation();
  
  // Set up calendar locales
  React.useEffect(() => {
    // Initialize the locale config first
    if (i18n.language.startsWith('es')) {
      LocaleConfig.locales['es'] = calendarLocaleEs;
      LocaleConfig.defaultLocale = 'es';
    } else {
      LocaleConfig.locales['en'] = calendarLocaleEn;
      LocaleConfig.defaultLocale = 'en';
    }
  }, [i18n.language]);

  return (
    <Calendar
      key="calendar-component"
      initialDate={new Date().toDateString()}
      minDate={startOfMonth(new Date()).toDateString()}
      onDayPress={(day) => {
        setSelectedDate(day.dateString);
        setEnabled(true);
      }}
      onMonthChange={(month) => {
        setSelectedMonth(month);
        setMonthEnabled(true);
      }}
      markingType={"multi-dot"}
      enableSwipeMonths={true}
      markedDates={markedDates}
      hideExtraDays={true}
      theme={{
        backgroundColor: scheme === "dark" ? "#050A1C" : "#ffffff",
        calendarBackground: "transparent",
        textSectionTitleColor: "#b6c1cd",
        selectedDayBackgroundColor: scheme === "dark" ? "#ffffff" : "#050A1C",
        selectedDayTextColor: scheme === "dark" ? "#050A1C" : "#ffffff",
        textSectionTitleDisabledColor: "#F1F5FB",
        todayTextColor: scheme === "dark" ? "#ffffff" : "#050A1C",
        dayTextColor: scheme === "dark" ? "#ffffff" : "#050A1C",
        textDisabledColor: "#dd99ee",
        arrowColor: scheme === "dark" ? "#ffffff" : "#050A1C",
        textDayFontFamily: "manrope",
        textMonthFontFamily: "manrope",
        textDayHeaderFontFamily: "manrope",
        textDayFontWeight: "300",
        textMonthFontWeight: "bold",
        textDayHeaderFontWeight: "300",
        textDayFontSize: 16,
        textMonthFontSize: 16,
        textDayHeaderFontSize: 12,
        textDayStyle: {
          marginTop: 4,
        },
      }}
    />
  );
});

const Scheduled = () => {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString()
  );
  //   Month Query
  const [monthEnabled, setMonthEnabled] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<CalendarMonth>({
    dateString: new Date().toISOString(),
    day: new Date().getDate(),
    month: new Date().getMonth() + 1,
    timestamp: new Date().getTime(),
    year: new Date().getFullYear(),
  });

  //   Date Query
  const [enabled, setEnabled] = useState<boolean>(true);
  const {
    data: selectedMonthData,
    isFetching: selectedMonthIsFetching,
    error: selectedMonthError,
  } = useQuery(useAppointmentByMonthQueryOptions(selectedMonth, enabled));
  const { data, isFetching, isError } = useQuery(
    useAppointmentByDateQueryOptions(selectedDate, enabled)
  );

  if (selectedMonthData) console.log("selectedMonthData", selectedMonthData);

  // Create a properly typed markedDates object
  let baseMarkedDates: Record<string, any> = {};

  // Add the selected month data if available
  if (selectedMonthData && typeof selectedMonthData === "object") {
    baseMarkedDates = { ...selectedMonthData };
  }

  // Always add the selected date
  baseMarkedDates[selectedDate] = {
    selected: true,
    disableTouchEvent: true,
    marked: true,
    selectedColor: scheme === "dark" ? "#ffffff" : "#050A1C",
  };

  // Cast to MarkedDate type
  const markedDates = baseMarkedDates as MarkedDate;

  return (
    <SafeAreaView key="scheduled-safe-area" className="flex-1 bg-primary-foreground px-4">
      <AppointmentCalendar 
        scheme={scheme}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        setEnabled={setEnabled}
        setMonthEnabled={setMonthEnabled}
        markedDates={markedDates}
      />
      {isFetching && (
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

      {isError && <Text className="text-red-500">Error</Text>}
      {!isFetching &&
        (data && data.length > 0 ? (
          <ScrollView className="mt-4 mx-4">
            <View className="mb-12">
              <View className="rounded-xl border border-muted-foreground/20 bg-card overflow-hidden shadow-sm">
                {data.map((item, itemIndex) => {
                  return (
                    <View key={item.id}>
                      <TouchableOpacity
                        className="py-3 px-4 flex-row items-center"
                        onPressOut={Platform.OS === 'android' ? () =>
                          router.push({
                            pathname: `/(details)/${item.id}`,
                            params: { returnTo: "scheduled" },
                          })
                        : undefined}
                        onPress={Platform.OS === 'ios' ? () =>
                          router.push({
                            pathname: `/(details)/${item.id}`,
                            params: { returnTo: "scheduled" },
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
                            {item.customerName || item.title || item.name || t("Unnamed Appointment")}
                          </Text>
                          <Text className="text-muted-foreground text-xs font-manrope-regular">
                            {item.description || item.subject || ""}
                          </Text>
                          {/* Date and time information */}
                          {item.startDate && (
                          <View className="flex-row items-center mt-1">
                            <Text className="text-muted-foreground text-xs">{t('DueDate')} </Text>
                            <IconCalendar
                              size={12}
                              color="#71717a"
                            />
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
                              variant={item.status === "inProgress" ? "default" : "secondary"}
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
                      {itemIndex < data.length - 1 && (
                        <View className="h-px bg-muted-foreground/10 ml-12" />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        ) : (
          <EmptyState />
        ))}
    </SafeAreaView>
  );
};

export default Scheduled;
