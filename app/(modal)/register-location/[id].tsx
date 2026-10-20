import { Platform, SafeAreaView, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import ThemedIcon from "@/components/ThemedIcon";
import { IconLocationPin, IconCheck, IconAlertCircle } from "@tabler/icons-react-native";
import { Button } from "@/components/Button";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { deviceKnown, loadTracking, reportPosition } from "@/lib/tracking";

export default function RegisterLocation() {
  const [registering, setRegistering] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { id, action } = params;
  // the phone reports as a device of the server; until a manager adds it, no position is accepted
  const [deviceId, setDeviceId] = useState("");
  const [known, setKnown] = useState<boolean | null>(null);

  useEffect(() => {
    loadTracking().then(async (s) => {
      setDeviceId(s.deviceId);
      setKnown(await deviceKnown(s.deviceId));
    });
  }, []);
  

  const handleRegisterLocation = async () => {
    try {
      setRegistering(true);
      setError(null);

      // One position, taken and sent by the Traccar client SDK as this phone's device, tagged with the action
      const settings = await loadTracking();
      const accepted = await reportPosition(action as string);
      if (!accepted) {
        // the server refuses positions of a device id nobody added to the platform
        setError(t("trackingNotRegistered").replace("{id}", settings.deviceId));
        return;
      }

      setSuccess(true);

      // Close modal after success
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setRegistering(false);
    }
  };

  const actionText = action === "checkIn" ? t("CheckIn") : t("CheckOut");

  return (
    <SafeAreaView className="flex-1 items-center justify-center px-4">
      <View className="flex-row items-start justify-around bg-muted rounded-full p-6 mt-4">
        <ThemedIcon 
          icon={success ? IconCheck : IconLocationPin} 
          size={56} 
          className={success ? "text-green-500" : undefined} 
        />
      </View>
      
      <Text className="text-muted-foreground font-manrope-semibold m-6 text-center">
        {success ? t("RegisterLocationSuccess") : t("RegisterLocationDescription")}
      </Text>
      
      {/* {!success && (
        <Text className="text-muted-foreground font-manrope-regular text-sm mt-2 mb-6 text-center">
          {t("RegisterLocationDescription")}
        </Text>
      )} */}
      
      {known === false && !success && (
        <View className="w-full gap-2 rounded-lg bg-amber-500/10 p-4 my-2">
          <View className="flex-row items-start">
            <ThemedIcon icon={IconAlertCircle} size={20} className="text-amber-600" />
            <Text className="flex-1 text-primary font-manrope-medium text-sm ml-2">
              {t("trackingDeviceUnknown").replace("{id}", deviceId).replace(/\s*Send them these details:?$|\s*Envíale estos datos:?$/, "")}
            </Text>
          </View>
          <Text
            className="text-primary underline text-sm"
            onPress={() => router.push("/tracking")}
            suppressHighlighting
          >
            {t("trackingOpen")}
          </Text>
        </View>
      )}

      {error && (
        <View className="bg-destructive/10 rounded-lg p-4 my-4 flex-row items-center">
          <ThemedIcon icon={IconAlertCircle} size={20} className="text-destructive" />
          <Text className="text-destructive font-manrope-medium text-sm ml-2">{error}</Text>
        </View>
      )}
      
      {!success && (
        <Button
          variant="default"
          label={registering ? t("Processing...") : actionText}
          onPress={handleRegisterLocation}
          disabled={registering}
        />
      )}
    </SafeAreaView>
  );
}


