/**
 * Position tracking of the engineer's phone with the Traccar Client SDK (background tracking, and the single position
 * of a check-in or check-out). The phone reports as a device of the OneMap server: a manager has to add the device id
 * below to the platform before its positions are accepted.
 * @module
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Location from "expo-location";
import * as Traccar from "react-native-traccar-client-sdk";
import { ONEMAP_URL, request } from "@/lib/onemap-api";

export type TrackingAccuracy = "HIGHEST" | "HIGH" | "MEDIUM" | "LOW";

export interface TrackingSettings {
  /** keep reporting the position in the background */
  enabled: boolean;
  /** the id the server knows this phone by: FSM-<6 digits> unless the manager gave another one */
  deviceId: string;
  /** what the device is called and which model it is, for the manager to add it */
  name: string;
  model: string;
  /** a position is sent after the phone moved this many meters... */
  distanceMeters: number;
  /** ...or after this many seconds, whichever comes first */
  intervalSeconds: number;
  accuracy: TrackingAccuracy;
  /** pause the GPS while the phone is not moving */
  stopDetection: boolean;
}

const KEY = "tracking_settings";

export const DEFAULTS: Omit<TrackingSettings, "deviceId" | "name" | "model"> = {
  enabled: false,
  distanceMeters: 75,
  intervalSeconds: 300,
  accuracy: "MEDIUM",
  stopDetection: true,
};

/** FSM- and six random digits. */
export const newDeviceId = () => `FSM-${String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0")}`;

export const ID_PATTERN = /^[A-Za-z0-9._-]{3,32}$/;

const clamp = (value: number, min: number, max: number, fallback: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;

/** Makes whatever was stored (or typed) a valid configuration. */
export function normalize(raw: Partial<TrackingSettings>): TrackingSettings {
  return {
    enabled: !!raw.enabled,
    deviceId: ID_PATTERN.test(raw.deviceId ?? "") ? (raw.deviceId as string) : newDeviceId(),
    name: (raw.name ?? "").trim() || Device.deviceName || "Field Service phone",
    model: (raw.model ?? "").trim() || Device.modelName || "",
    distanceMeters: clamp(Number(raw.distanceMeters), 0, 100000, DEFAULTS.distanceMeters),
    intervalSeconds: clamp(Number(raw.intervalSeconds), 0, 86400, DEFAULTS.intervalSeconds),
    accuracy: (["HIGHEST", "HIGH", "MEDIUM", "LOW"] as const).includes(raw.accuracy as TrackingAccuracy)
      ? (raw.accuracy as TrackingAccuracy)
      : DEFAULTS.accuracy,
    stopDetection: raw.stopDetection ?? DEFAULTS.stopDetection,
  };
}

/**
 * The saved settings. The first time there are none, so a device id is made and kept: it must not change on its own,
 * because the manager adds that very id to the platform.
 */
export async function loadTracking(): Promise<TrackingSettings> {
  let stored: Partial<TrackingSettings> = {};
  try {
    stored = JSON.parse((await AsyncStorage.getItem(KEY)) ?? "{}");
  } catch {
    // unreadable: start again
  }
  const settings = normalize(stored);
  if (stored.deviceId !== settings.deviceId || !stored.name) await AsyncStorage.setItem(KEY, JSON.stringify(settings));
  return settings;
}

const toConfig = (s: TrackingSettings): Traccar.Config => ({
  // the web address of the server accepts the same simple protocol the SDK speaks
  serverUrl: ONEMAP_URL,
  deviceId: s.deviceId,
  buffer: true,
  location: {
    accuracy: s.accuracy,
    distanceMeters: s.distanceMeters,
    intervalSeconds: s.intervalSeconds,
    stopDetection: s.stopDetection,
  },
  notification: { text: s.name },
});

async function ensurePermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") throw new Error("Permission to access location was denied");
}

/** Saves the settings and makes the tracker follow them: starts it when active, stops it when not. */
export async function saveTracking(next: Partial<TrackingSettings>): Promise<TrackingSettings> {
  const settings = normalize(next);
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
  await Traccar.init(toConfig(settings));
  await Traccar.setConfig(toConfig(settings));
  if (settings.enabled) {
    await ensurePermission();
    await Traccar.start();
  } else if (await Traccar.isTracking()) {
    await Traccar.stop();
  }
  return settings;
}

/** At launch: brings the tracker back as the engineer left it. */
export async function restoreTracking(): Promise<void> {
  const settings = await loadTracking();
  await Traccar.init(toConfig(settings));
  if (settings.enabled && !(await Traccar.isTracking())) await Traccar.start();
}

export async function isTrackingNow(): Promise<boolean> {
  try {
    return await Traccar.isTracking();
  } catch {
    return false;
  }
}

/**
 * One position, sent now and tagged with `alarm` (checkIn, checkOut). Resolves with whether the server accepted it,
 * which it does not for a device id nobody added to the platform.
 */
export async function reportPosition(alarm?: string): Promise<boolean> {
  const settings = await loadTracking();
  await ensurePermission();
  await Traccar.init(toConfig(settings));
  return Traccar.requestPosition(alarm);
}

/**
 * Whether the device id exists among the devices this engineer can see on the server. A device the manager added but
 * did not share with this engineer is not seen, so a `false` is "not found yet", not proof that it is missing.
 */
export async function deviceKnown(deviceId: string): Promise<boolean> {
  try {
    const devices = await request<{ uniqueId?: string }[]>("GET", "/devices", { params: { uniqueId: deviceId } });
    return devices.some((d) => d.uniqueId === deviceId);
  } catch {
    return false;
  }
}

/** The text a manager needs to add this phone as a device. */
export const deviceSummary = (s: TrackingSettings) => `${s.name} · ${s.model || "-"} · ${s.deviceId}`;
