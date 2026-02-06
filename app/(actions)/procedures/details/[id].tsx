import { Text, View, SafeAreaView, ScrollView, useWindowDimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useProcedureByIdQueryOptions } from "@/services/procedures/queries";
import { Skeleton } from "@/components/Skeleton";
import { Platform } from "react-native";
import RenderHtml from "react-native-render-html";
import { useColorScheme } from "nativewind";

// Component to render HTML content with proper styling
const HtmlContent = ({ html }: { html: string }) => {
  const { width } = useWindowDimensions();
  const { colorScheme } = useColorScheme();
  
  const baseStyle = {
    color: colorScheme === 'dark' ? '#ffffff' : '#000000',
    fontFamily: 'manrope-regular',
  };
  
  return (
    <RenderHtml
      contentWidth={width - 32} // Account for padding
      source={{ html }}
      baseStyle={baseStyle}
      tagsStyles={{
        p: { marginBottom: 10 },
        ul: { marginLeft: 20 },
        ol: { marginLeft: 20 },
        li: { marginBottom: 5 },
        h1: { fontFamily: 'manrope-bold', fontSize: 20, marginVertical: 10 },
        h2: { fontFamily: 'manrope-semibold', fontSize: 18, marginVertical: 8 },
        h3: { fontFamily: 'manrope-medium', fontSize: 16, marginVertical: 6 },
        a: { color: '#0284c7' }, // sky-600 color for links
      }}
    />
  );
};

export default function ProcedureDetails() {
    const { id } = useLocalSearchParams() as { id: string };
    const { t } = useTranslation();
    
    const {
        data: procedure,
        isFetching,
        error,
    } = useQuery(useProcedureByIdQueryOptions(id));
    
    if (isFetching) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center px-4">
                <View className="flex-col gap-4 w-full">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-16 w-full" />
                </View>
            </SafeAreaView>
        );
    }
    
    if (error) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center px-4">
                <Text>Error: {error.message}</Text>
            </SafeAreaView>
        );
    }
    
    if (!procedure) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center px-4">
                <Text>{t('no records found')}</Text>
            </SafeAreaView>
        );
    }
    
    return (
        <SafeAreaView className="flex-1 items-center justify-center">
        <ScrollView 
            className="flex-1 bg-background w-full"
            contentContainerClassName="pb-12"
            style={{
                paddingTop: Platform.OS === 'android' ? 16 : 0,
            }}
        >
            <View className="px-4">
                {/* First inset list - Procedure details */}
                <View className="mb-12 mt-4">
                    <View className="rounded-xl border border-muted-foreground/20 bg-card overflow-hidden shadow-sm">
                        {/* Name item */}
                        <View>
                            <View className="py-3 px-4">
                                <View className="flex-col">
                                    <Text className="text-primary font-manrope-medium">{procedure.name}</Text>
                                    <Text className="text-muted-foreground text-xs font-manrope-regular">{t('ProcedureName')}</Text>
                                </View>
                            </View>
                            <View className="h-px bg-muted-foreground/10" />
                        </View>
                        
                        {/* Severity item */}
                        <View>
                            <View className="py-3 px-4 flex-row items-center">
                                <View className="flex-col flex-1">
                                    <Text className="text-primary font-manrope-medium capitalize">{procedure.severity}</Text>
                                    <Text className="text-muted-foreground text-xs font-manrope-regular">{t('SeverityLevel')}</Text>
                                </View>
                            </View>
                            <View className="h-px bg-muted-foreground/10" />
                        </View>
                        
                        {/* Description item */}
                        <View>
                            <View className="py-3 px-4">
                                <View className="flex-col">
                                    <Text className="text-primary font-manrope-medium">{procedure.description}</Text>
                                    <Text className="text-muted-foreground text-xs font-manrope-regular">{t('sharedDescription')}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
                
                {/* Section header */}
                <Text className="text-xs font-manrope-regular uppercase text-muted-foreground mb-4 px-2">
                    {t('Procedure')}
                </Text>
                
                {/* Second inset list - Procedure content */}
                <View className="mb-12">
                    <View className="overflow-hidden">
                        <View className="px-4">
                            {procedure.procedure ? (
                                <HtmlContent html={procedure.procedure} />
                            ) : (
                                <Text className="text-primary font-manrope-regular">
                                    {t('No procedure content available')}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
        </SafeAreaView>
    );
}