import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { IconAlertTriangle, IconCircleCheck, IconRefresh } from "@tabler/icons-react-native";
import ThemedIcon from "@/components/ThemedIcon";
import {
  deviceKnown,
  deviceSummary,
  ID_PATTERN,
  loadTracking,
  newDeviceId,
  saveTracking,
  TrackingAccuracy,
  TrackingSettings,
} from "@/lib/tracking";

const ACCURACY: TrackingAccuracy[] = ["HIGHEST", "HIGH", "MEDIUM", "LOW"];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View className="mb-8">
    <Text className="mb-3 px-2 text-xs font-manrope-regular uppercase text-muted-foreground">{title}</Text>
    <View className="gap-4 rounded-xl border border-muted-foreground/20 bg-card p-4">{children}</View>
  </View>
);

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <View>
    <Text className="mb-1 text-sm font-manrope-medium text-primary">{label}</Text>
    {children}
    {!!hint && <Text className="mt-1 text-xs text-muted-foreground">{hint}</Text>}
  </View>
);

const inputClass = "w-full rounded-lg border border-muted-foreground/30 bg-background p-3 text-primary";

/** The tracking settings of this phone: the device it reports as, and when it reports its position. */
export default function Tracking() {
  const { t } = useTranslation();
  const [form, setForm] = useState<TrackingSettings | null>(null);
  const [numbers, setNumbers] = useState({ distance: "", interval: "" });
  const [saving, setSaving] = useState(false);
  const [known, setKnown] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  const check = (id: string) => {
    setKnown(null);
    deviceKnown(id).then(setKnown);
  };

  useEffect(() => {
    loadTracking().then((s) => {
      setForm(s);
      setNumbers({ distance: String(s.distanceMeters), interval: String(s.intervalSeconds) });
      check(s.deviceId);
    });
  }, []);

  if (!form) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  const set = (patch: Partial<TrackingSettings>) => {
    setError("");
    setForm({ ...form, ...patch });
  };

  const save = async () => {
    if (!ID_PATTERN.test(form.deviceId)) return setError(t("trackingDeviceIdInvalid"));
    setSaving(true);
    setError("");
    try {
      const saved = await saveTracking({
        ...form,
        distanceMeters: Number(numbers.distance),
        intervalSeconds: Number(numbers.interval),
      });
      setForm(saved);
      setNumbers({ distance: String(saved.distanceMeters), interval: String(saved.intervalSeconds) });
      check(saved.deviceId);
      Alert.alert(t("trackingSaved"), saved.enabled ? t("trackingSavedOn") : t("trackingSavedOff"));
    } catch (e) {
      setError((e as Error).message || t("errorGeneral"));
      // the switch must show what is really happening
      setForm((f) => (f ? { ...f, enabled: false } : f));
    } finally {
      setSaving(false);
    }
  };

  const press = (action: () => void) => ({
    onPress: () => (Platform.OS === "ios" ? action() : null),
    onPressOut: () => (Platform.OS === "android" ? action() : null),
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="px-4 pt-4 pb-32" keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic">
        <Section title={t("trackingStatus")}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="font-manrope-medium text-primary">{t("trackingActive")}</Text>
              <Text className="mt-1 text-xs text-muted-foreground">{t("trackingActiveHint")}</Text>
            </View>
            <Switch value={form.enabled} onValueChange={(enabled) => set({ enabled })} />
          </View>
        </Section>

        <Section title={t("trackingDevice")}>
          {known === true ? (
            <View className="flex-row items-start gap-2 rounded-lg bg-green-500/10 p-3">
              <ThemedIcon icon={IconCircleCheck} size={18} className="text-green-600" />
              <Text className="flex-1 text-sm text-primary">{t("trackingDeviceKnown")}</Text>
            </View>
          ) : (
            <View className="gap-2 rounded-lg bg-amber-500/10 p-3">
              <View className="flex-row items-start gap-2">
                <ThemedIcon icon={IconAlertTriangle} size={18} className="text-amber-600" />
                <Text className="flex-1 text-sm text-primary">
                  {t("trackingDeviceUnknown").replace("{id}", form.deviceId)}
                </Text>
              </View>
              <Text selectable className="rounded bg-background/70 p-2 text-xs text-primary">
                {deviceSummary(form)}
              </Text>
            </View>
          )}
          <Field label={t("trackingDeviceId")} hint={t("trackingDeviceIdHint")}>
            <View className="flex-row items-center gap-2">
              <TextInput
                value={form.deviceId}
                onChangeText={(deviceId) => set({ deviceId: deviceId.trim() })}
                autoCapitalize="characters"
                autoCorrect={false}
                className={`${inputClass} flex-1`}
              />
              <Pressable {...press(() => set({ deviceId: newDeviceId() }))} hitSlop={10} accessibilityLabel={t("trackingNewId")} className="rounded-lg border border-muted-foreground/30 p-3">
                <ThemedIcon icon={IconRefresh} size={18} />
              </Pressable>
            </View>
          </Field>
          <Field label={t("trackingName")}>
            <TextInput value={form.name} onChangeText={(name) => set({ name })} className={inputClass} />
          </Field>
          <Field label={t("trackingModel")}>
            <TextInput value={form.model} onChangeText={(model) => set({ model })} className={inputClass} />
          </Field>
        </Section>

        <Section title={t("trackingWhen")}>
          <Field label={t("trackingDistance")} hint={t("trackingDistanceHint")}>
            <TextInput value={numbers.distance} onChangeText={(distance) => setNumbers({ ...numbers, distance })} keyboardType="number-pad" className={inputClass} />
          </Field>
          <Field label={t("trackingInterval")} hint={t("trackingIntervalHint")}>
            <TextInput value={numbers.interval} onChangeText={(interval) => setNumbers({ ...numbers, interval })} keyboardType="number-pad" className={inputClass} />
          </Field>
          <Field label={t("trackingAccuracy")} hint={t("trackingAccuracyHint")}>
            <View className="flex-row flex-wrap gap-2">
              {ACCURACY.map((level) => (
                <Pressable
                  key={level}
                  {...press(() => set({ accuracy: level }))}
                  className={`rounded-full border px-3 py-2 ${form.accuracy === level ? "border-primary bg-primary" : "border-muted-foreground/30"}`}
                >
                  <Text className={`text-sm ${form.accuracy === level ? "text-primary-foreground" : "text-primary"}`}>{t(`trackingAccuracy_${level}`)}</Text>
                </Pressable>
              ))}
            </View>
          </Field>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="font-manrope-medium text-primary">{t("trackingStopDetection")}</Text>
              <Text className="mt-1 text-xs text-muted-foreground">{t("trackingStopDetectionHint")}</Text>
            </View>
            <Switch value={form.stopDetection} onValueChange={(stopDetection) => set({ stopDetection })} />
          </View>
        </Section>

        {!!error && <Text className="mb-4 text-sm text-red-500">{error}</Text>}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-muted-foreground/10 bg-background p-4 pb-8">
        <Pressable {...press(save)} disabled={saving} className="items-center rounded-lg bg-primary py-4" style={{ opacity: saving ? 0.7 : 1 }}>
          {saving ? <ActivityIndicator color="white" /> : <Text className="font-manrope-medium text-primary-foreground">{t("trackingSave")}</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
