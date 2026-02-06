import { Image, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

export default function EmptyState() {
    const { t } = useTranslation();
    return (
        <View className="flex-1 items-center justify-center">
             <Image source={require("../../assets/empty-box.png")} className="w-36 h-36 opacity-80" />
            <Text className="text-center text-lg text-muted-foreground font-manrope-semibold">{t("responses.Nodatafound")}</Text>
        </View>
    )
}