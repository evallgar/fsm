import { TouchableOpacity, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAppointmentByIdQueryOptions } from "@/services/appointments/queries";
import { Skeleton } from "@/components/Skeleton";
import { ScrollView } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import ThemedIcon from "@/components/ThemedIcon";
import * as TablerIcons from "@tabler/icons-react-native";
import { format } from "date-fns";

type Section = {
  title: string;
  data: {
    id: string;
    title: string;
    icon?: TablerIcons.Icon;
    value?: string;
    link?: string;
  }[];
};
const AppointmentDetails = () => {
  const { id } = useLocalSearchParams() as { id: string };
  const { data, isFetching, isError } = useQuery(
    useAppointmentByIdQueryOptions(id)
  );

  const { t } = useTranslation();

  if (isFetching)
    return (
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
    );

  const sections: Section[] = [
    {
      title: "sharedInfoTitle",
      data: [
        {
          id: "1",
          title: "sharedName",
          icon: TablerIcons.IconUser,
          value: data?.name,
        },
        {
          id: "2",
          title: "sharedLocation",
          icon: TablerIcons.IconMap,
          value: data?.equipment?.locationName || null,
          link: "/(tabs)/(index)/[id]/location",
        },
        {
            id: "21",
            title: "EventType",
            icon: TablerIcons.IconTool,
            value: t(data?.type),
          },
          {
            id: "22",
            title: "DueDate",
            icon: TablerIcons.IconCalendar,
            value: data?.endTime && typeof data.endTime.toDate === 'function' ? format(data.endTime.toDate(), 'PPP p') : '--'
          }
      ],
    },
    {
      title: "sharedDescription",
      data: [
        {
          id: "3",
          title: "sharedDescription",
          icon: TablerIcons.IconMessageCircle,
          value: data?.description,
        }
      ],
    },
    {
      title: "equipment.Singular",
      data: [
        {
          id: "5",
          title: "equipment.Manufacturer",
          icon: TablerIcons.IconTrademark,
          value: data?.equipment?.manufacturer,
        },
        {
          id: "6",
          title: "equipment.Model",
          icon: TablerIcons.IconBlocks,
          value: data?.equipment?.model,
        },
        {
            id: "61",
            title: "equipment.SerialNumber",
            icon: TablerIcons.IconBarcode,
            value: data?.equipment?.serialNumber,
          },
      ],
    },
    {
      title: "actions.Title",
      data: [
        {
          id: "7",
          title: "Procedures",
          link: `/appointment/${id}/procedures`,
        },
        {
          id: "8",
          title: "spareParts",
          link: `/appointment/${id}/spareParts`,
        },
        {
            id: "9",
            title: "Findings",
            link: `/appointment/${id}/findings`,
          },
          {
            id: "10",
            title: "Results",
            link: `/appointment/${id}/results`,
          },
      ],
    },
  ];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="bg-card p-4"
    >
      <View className="px-2">
        {sections.map((section, sectionIndex) => (
          <View key={section.title} className="mb-12">
            <Text className="text-xs font-manrope-regular uppercase text-muted-foreground mb-4 px-2">
              {t(section.title)}
            </Text>
            <View className="rounded-xl border border-muted-foreground/20 bg-card overflow-hidden shadow-sm">
              {section.data.map((item, itemIndex) => (
                <View key={item.id}>
                  <TouchableOpacity className="py-3 px-4 flex-row items-center">
                    {/* Icon at the left */}
                    { item.icon && <View className="w-8 justify-center items-center">
                      <ThemedIcon icon={item.icon} size={16} />
                    </View>}
                    
                    {/* Value & Title in the middle, start aligned */}
                    <View className="flex-col flex-1 ml-2">
                      {item.value ? (
                        <>
                          <Text className="text-primary font-manrope-regular">{item.value}</Text>
                          <Text className="text-muted-foreground text-xs font-manrope-regular">{t(item.title)}</Text>
                        </>
                      ) : (
                        <Text className="text-primary font-manrope-regular">{t(item.title)}</Text>
                      )}
                    </View>
                    
                    {/* Arrow at the right if item is a link */}
                    {item.link && (
                      <Text className="text-gray-400 ml-2">›</Text>
                    )}
                  </TouchableOpacity>
                  {itemIndex < section.data.length - 1 && (
                    <View className="h-px bg-muted-foreground/10 ml-12" />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default AppointmentDetails;
