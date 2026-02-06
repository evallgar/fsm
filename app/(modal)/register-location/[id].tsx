import { Platform, SafeAreaView, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import ThemedIcon from "@/components/ThemedIcon";
import { IconLocationPin, IconCheck, IconAlertCircle } from "@tabler/icons-react-native";
import { Button } from "@/components/Button";
import useLocation from "@/hooks/useLocation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getAuth } from "firebase/auth";
import { usePostLocationMutation } from "@/services/osmand/api";

export default function RegisterLocation() {
  const [registering, setRegistering] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getLocation, loading: locationLoading } = useLocation();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { id, action } = params;
  
  // Get the mutation hook
  const { mutateAsync: postLocation, isPending } = usePostLocationMutation();
  

  const handleRegisterLocation = async () => {
    try {
      setRegistering(true);
      setError(null);
      
      // Get current location
      const locationData = await getLocation();
      if (!locationData) {
        setError("Could not get location");
        return;
      }
      
      // Get current user ID
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        setError("User not authenticated");
        return;
      }
      
      // Post location to OsmAnd server
      await postLocation({
        id: userId,
        lat: locationData.coords.latitude,
        lon: locationData.coords.longitude,
        altitude: locationData.coords.altitude || undefined,
        accuracy: locationData.coords.accuracy || undefined,
        speed: locationData.coords.speed || undefined,
        bearing: locationData.coords.heading || undefined,
        timestamp: Math.floor(locationData.timestamp / 1000), // Convert to seconds
        action: action as string,
        result: action as string,
        appointmentId: id as string,
        alarm: action as string,
      });
      
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
      
      {error && (
        <View className="bg-destructive/10 rounded-lg p-4 my-4 flex-row items-center">
          <ThemedIcon icon={IconAlertCircle} size={20} className="text-destructive" />
          <Text className="text-destructive font-manrope-medium text-sm ml-2">{error}</Text>
        </View>
      )}
      
      {!success && (
        <Button
          variant="default"
          label={registering || locationLoading || isPending ? t("Processing...") : actionText}
          onPressOut={Platform.OS === 'android' ? handleRegisterLocation : undefined}
          onPress={Platform.OS === 'ios' ? handleRegisterLocation : undefined}
          disabled={registering || locationLoading || isPending}
        />
      )}
    </SafeAreaView>
  );
}


