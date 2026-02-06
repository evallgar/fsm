import { router } from "expo-router";
import { Text, TextInput, View, Pressable, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { useState } from "react";
import { useSession } from "@/context/auth-context";
import LoadingButton from "@/components/loading-button";
import { useTranslation } from "react-i18next";
import { IconEye, IconEyeOff } from "@tabler/icons-react-native";
import { useToast } from "@/components/Toast";

/**
 * SignIn component handles user authentication through email and password
 * @returns {JSX.Element} Sign-in form component
 */
export default function SignIn() {
  const { t } = useTranslation();
  // ============================================================================
  // Hooks & State
  // ============================================================================
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useSession();
  const { toast } = useToast();

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Handles the sign-in process
   * @returns {Promise<Models.User<Models.Preferences> | null>}
   */
  const handleLogin = async () => {
    try {
      return await signIn(email, password);
    } catch (err) {
      console.log("[handleLogin] ==>", err);
      // Get error message to display in toast
      let errorMessage = t("signin-error");
      if (err instanceof Error) {
        // Check for specific Firebase auth error codes
        if (err.message.includes("auth/user-not-found") || err.message.includes("auth/wrong-password")) {
          errorMessage = t("invalid-credentials");
        } else if (err.message.includes("auth/too-many-requests")) {
          errorMessage = t("too-many-attempts");
        } else if (err.message.includes("auth/invalid-email")) {
          errorMessage = t("invalid-email");
        } else if (err.message.includes("auth/network-request-failed")) {
          errorMessage = t("network-error");
        }
      }
      // Show toast with error message
      toast(errorMessage, "destructive", 4000);
      return null;
    }
  };

  /**
   * Handles the sign-in button press
   */
  const handleSignInPress = async () => {
    if (!email || !password) {
      toast(t("missing-credentials"), "default", 3000);
      return;
    }
    
    setIsSigningIn(true);
    const resp = await handleLogin();
    if (resp) {
      router.replace("/(tabs)");
    }
    setIsSigningIn(false);
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <View className="flex-1 justify-center items-center p-4">
      {/* Welcome Section */}
      <View className="items-center mb-8">
        <Text className="text-2xl font-manrope-bold tracking-tighter text-primary mb-2">
          {t("welcome-back")}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {t("signInToContinue")}
        </Text>
      </View>

      {/* Form Section */}
      <View className="w-full max-w-[300px] space-y-4 gap-6 mb-8">
        <View>
          <Text className="text-sm font-manrope-medium text-primary mb-1 ml-1">
            {t("emailAddress")}
          </Text>
          <TextInput
            placeholder={t("emailAddress")}
            value={email}
            onChangeText={setEmail}
            textContentType="emailAddress"
            keyboardType="email-address"
            autoCapitalize="none"
            className="w-full p-3 border border-muted-foreground/30 rounded-lg text-primary bg-card"
          />
        </View>

        <View>
          <Text className="text-sm font-manrope-medium text-primary mb-1 ml-1">
            {t("password")}
          </Text>
          <View className="relative flex-row items-center">
            <TextInput
              placeholder={t("password")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textContentType="password"
              className="w-full p-3 border border-muted-foreground/30 rounded-lg text-primary bg-card pr-10"
            />
            <Pressable 
              onPress={() => Platform.OS === 'ios' ? setShowPassword(!showPassword) : null}
              onPressOut={() => Platform.OS === 'android' ? setShowPassword(!showPassword) : null}
              className="absolute right-3"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showPassword ? 
                <IconEyeOff size={20} color="#6b7280" /> : 
                <IconEye size={20} color="#6b7280" />}
            </Pressable>
          </View>
        </View>
      </View>

      {/* Sign In Button */}
      <LoadingButton 
        title={t("signin")} 
        onPress={handleSignInPress} 
        loading={isSigningIn} 
      />

      {/* Sign Up Link */}
      {/* <View className="flex-row items-center mt-6">
        <Text className="text-gray-600">Don't have an account?</Text>
        <Link href="/sign-up" asChild>
          <Pressable className="ml-2">
            <Text className="text-blue-600 font-semibold">Sign Up</Text>
          </Pressable>
        </Link>
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
    activityIndicator: {
        flex: 1, 
        flexDirection: "row", 
        alignItems: "center", 
        justifyContent: "space-around"
    }
});
