import { router } from "expo-router";
import { Text, TextInput, View, Pressable, ActivityIndicator, StyleSheet, Platform, KeyboardAvoidingView } from "react-native";
import { useState } from "react";
import { useSession } from "@/context/auth-context";
import LoadingButton from "@/components/loading-button";
import { useTranslation } from "react-i18next";
import { IconEye, IconEyeOff } from "@tabler/icons-react-native";
import { useToast } from "@/components/Toast";
import LegalSheet, { LegalKind } from "@/components/LegalSheet";
import ForgotPasswordSheet from "@/components/ForgotPasswordSheet";

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
  const [legal, setLegal] = useState<LegalKind | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
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
        // signIn reports the server's refusals itself; this only catches what escapes it
        if (/network request failed/i.test(err.message)) {
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
    <KeyboardAvoidingView behavior="padding" className="flex-1 justify-center items-center p-4">
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
              onPress={() => setShowPassword(!showPassword)}
              className="absolute right-3"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showPassword ? 
                <IconEyeOff size={20} color="#6b7280" /> : 
                <IconEye size={20} color="#6b7280" />}
            </Pressable>
          </View>
          {/* Reset password, as in the webapp */}
          <Pressable
            onPress={() => setForgotOpen(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="mt-2 self-end"
          >
            <Text className="text-sm font-manrope-medium text-muted-foreground">{t("web_loginReset")}</Text>
          </Pressable>
        </View>
      </View>

      {/* Sign In Button */}
      <LoadingButton 
        title={t("signin")} 
        onPress={handleSignInPress} 
        loading={isSigningIn} 
      />

      {/* Terms and privacy: each opens a full-height sheet with the same text as the webapp */}
      <Text className="mt-6 max-w-[300px] text-center text-xs text-muted-foreground leading-5">
        {t("web_termsAcceptanceParagraph")}{" "}
        <Text
          className="underline text-primary"
          onPress={() => setLegal("terms")}
          suppressHighlighting
        >
          {t("web_proTermsConditions")}
        </Text>{" "}
        {t("web_sharedAnd")}{" "}
        <Text
          className="underline text-primary"
          onPress={() => setLegal("privacy")}
          suppressHighlighting
        >
          {t("web_proPrivacy")}
        </Text>
        .
      </Text>
      <LegalSheet kind={legal} onClose={() => setLegal(null)} />
      <ForgotPasswordSheet visible={forgotOpen} onClose={() => setForgotOpen(false)} initialEmail={email} />

      {/* Sign Up Link */}
      {/* <View className="flex-row items-center mt-6">
        <Text className="text-gray-600">Don't have an account?</Text>
        <Link href="/sign-up" asChild>
          <Pressable className="ml-2">
            <Text className="text-blue-600 font-semibold">Sign Up</Text>
          </Pressable>
        </Link>
      </View> */}
    </KeyboardAvoidingView>
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
