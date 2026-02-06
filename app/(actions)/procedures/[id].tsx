import { SafeAreaView, Text, View, TouchableOpacity, FlatList, Pressable, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useProceduresByEquipmentIdQueryOptions } from "@/services/procedures/queries";
import { Skeleton } from "@/components/Skeleton";
import { Procedure } from "@/services/procedures/interfaces";
import ThemedIcon from "@/components/ThemedIcon";
import { IconHandStop, IconAlertTriangle, IconBan, IconChevronRight } from "@tabler/icons-react-native";

export default function WorkOrderMethods() {
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();

  const {
    data: procedure,
    isFetching,
    error,
  } = useQuery(useProceduresByEquipmentIdQueryOptions(id.toString())) as {
    data: Procedure[];
    isFetching: boolean;
    error: any;
  };

  if (isFetching)
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-4">
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
      </SafeAreaView>
    );

  if (error)
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-4">
        <Text>Error: {error.message}</Text>
      </SafeAreaView>
    );

  if (!procedure || procedure.length === 0 && !isFetching)
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-4">
        <Text>{t('no records found')}</Text>
      </SafeAreaView>
    );

  // Function to handle procedure item press
  const handleProcedurePress = (procedure: Procedure) => {
    router.push(`/procedures/details/${procedure.id}`);
  };

  // Function to determine icon based on severity
  const getIconForSeverity = (severity: string) => {
    switch(severity) {
      case 'critical':
        return IconHandStop;
      case 'priority':
        return IconAlertTriangle;
      default:
        return IconBan;
    }
  };

  // Function to determine color class based on severity
  const getColorClassForSeverity = (severity: string) => {
    switch(severity) {
      case 'critical':
        return 'text-red-500';
      case 'priority':
        return 'text-amber-500';
      default:
        return 'text-green-500';
    }
  };

  return (
    <SafeAreaView className="flex-1 px-4">
      
      {/* Procedures List */}
      <FlatList
        data={procedure}
        keyExtractor={(item) => item.id}
        className="w-full mx-4"  
        renderItem={({ item }) => (
          <Pressable 
            onPressOut={Platform.OS === 'android' ? () => handleProcedurePress(item) : undefined}
            onPress={Platform.OS === 'ios' ? () => handleProcedurePress(item) : undefined}
            className="flex-row items-center py-4 border-b border-muted-foreground/20"
          >
            {/* Icon based on severity */}
            <View className="mr-4">
              <Text className={getColorClassForSeverity(item.severity)}>
                <ThemedIcon 
                  icon={getIconForSeverity(item.severity)} 
                  size={24} 
                />
              </Text>
            </View>
            
            {/* Content */}
            <View className="flex-1">
              <Text className="text-lg font-manrope-medium text-primary">{item.name}</Text>
              <Text className="text-sm text-muted-foreground mt-1">{item.description}</Text>
            </View>

            {/* Arrow at the right */}
            <View className="ml-auto mr-6">
              <IconChevronRight size={20} color="#64748b" />
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-8">
            <Text className="text-muted-foreground">{t('no records found')}</Text>
          </View>
        }
      />
      
      {/* Count indicator */}
      <Text className="text-center text-muted-foreground py-4">{procedure.length} {t('occurrences')}</Text>
    </SafeAreaView>
  );
}
