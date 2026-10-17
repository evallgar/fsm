import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { requestPasswordReset } from "@/lib/onemap-api";
import { SheetFrame } from "@/components/LegalSheet";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "Reset password", as in the webapp: the server emails a link, which opens the webapp to choose the new password. */
export default function ForgotPasswordSheet({ visible, onClose, initialEmail = "" }: { visible: boolean; onClose: () => void; initialEmail?: string }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible) {
      setEmail(initialEmail);
      setSent(false);
      setError("");
    }
  }, [visible, initialEmail]);

  const send = async () => {
    if (!email.trim()) return setError(t("web_loginEmptyEmail"));
    if (!EMAIL.test(email.trim())) return setError(t("web_loginFailedEmail"));
    setError("");
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch {
      setError(t("web_errorGeneral"));
    } finally {
      setBusy(false);
    }
  };

  const press = (action: () => void) => ({
    onPress: () => (Platform.OS === "ios" ? action() : null),
    onPressOut: () => (Platform.OS === "android" ? action() : null),
  });

  return (
    <SheetFrame title={t("forgotPasswordTitle")} visible={visible} onClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <View className="gap-5 px-4 py-6">
          {sent ? (
            <>
              <Text className="text-primary leading-5">{t("web_forgotPasswordEmailSent")}</Text>
              <Pressable {...press(onClose)} className="items-center rounded-lg bg-primary py-3">
                <Text className="font-manrope-medium text-primary-foreground">{t("forgotPasswordDone")}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text className="text-muted-foreground leading-5">{t("web_loginResetInstructions")}</Text>
              <View>
                <Text className="mb-1 ml-1 text-sm font-manrope-medium text-primary">{t("emailAddress")}</Text>
                <TextInput
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setError("");
                  }}
                  placeholder={t("emailAddress")}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="w-full rounded-lg border border-muted-foreground/30 bg-card p-3 text-primary"
                />
                {!!error && <Text className="mt-2 text-sm text-red-500">{error}</Text>}
              </View>
              <Pressable {...press(send)} disabled={busy} className="items-center rounded-lg bg-primary py-3">
                {busy ? <ActivityIndicator color="white" /> : <Text className="font-manrope-medium text-primary-foreground">{t("web_sendLoginResetLink")}</Text>}
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SheetFrame>
  );
}
