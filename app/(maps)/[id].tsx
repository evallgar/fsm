import { Platform, Pressable, Text, View } from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker, Callout, Region } from "react-native-maps";
import { StyleSheet } from "react-native";
import { useEffect, useRef, useState } from "react";
import { useAppointmentByIdQueryOptions } from "@/services/appointments/queries";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { WorkOrder } from "@/services/appointments/interfaces";
import { Skeleton } from "@/components/Skeleton";
import { useWorkOrderPoint } from "@/services/appointments/use-work-order-point";

type Appointment = WorkOrder;

const INITIAL_REGION = {
    latitude: 23.6,
    longitude: -102.6,
    latitudeDelta: 18,
    longitudeDelta: 32,
}
/** About 500 m across: street level */
const STREET_DELTA = 0.005;

export default function Map() {
    const mapRef = useRef<MapView>(null);
    const currentRegion = useRef<Region | null>(null);
    // satellite with street names is the easiest way to recognise a place
    const [satellite, setSatellite] = useState(true);

    const zoom = (factor: number) => {
        const r = currentRegion.current;
        if (!r) return;
        mapRef.current?.animateToRegion(
            {
                ...r,
                latitudeDelta: Math.min(Math.max(r.latitudeDelta * factor, 0.0005), 120),
                longitudeDelta: Math.min(Math.max(r.longitudeDelta * factor, 0.0005), 120),
            },
            250
        );
    };

    const { id } = useLocalSearchParams() as { id: string };
    const { data, isFetching, isError } = useQuery(
        useAppointmentByIdQueryOptions(id)
    ) as { data: Appointment; isFetching: boolean; isError: boolean };

    const { point, lookingUp } = useWorkOrderPoint(data);
    // 0,0 is what a place without coordinates holds: it is in the sea off Africa, not a real location
    const hasPoint =
        typeof point?.latitude === "number" &&
        typeof point?.longitude === "number" &&
        !(point.latitude === 0 && point.longitude === 0);

    // The map is only mounted once the work order has loaded, so it starts on its location instead of moving there
    const region = hasPoint
        ? { latitude: point.latitude, longitude: point.longitude, latitudeDelta: STREET_DELTA, longitudeDelta: STREET_DELTA }
        : INITIAL_REGION;

    // Keep it on the work order when its location changes while the screen is open (works on Apple and Google maps)
    useEffect(() => {
        if (hasPoint) mapRef.current?.animateToRegion(region, 600);
    }, [point?.latitude, point?.longitude]);

    if (isFetching) {
        return <Skeleton />;
    }
    if (isError) {
        return <Text>Error fetching data</Text>;
    }
    return (
        <View className="flex-1">
            <MapView style={StyleSheet.absoluteFill} 
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
            initialRegion={region}
            mapType={satellite ? "hybrid" : "standard"}
            showsMyLocationButton={true}
            ref={mapRef}
            onRegionChangeComplete={(r) => { currentRegion.current = r; }}
            >
                <Marker
                    coordinate={{
                        latitude: hasPoint ? point.latitude : 23.6,
                        longitude: hasPoint ? point.longitude : -102.6,
                    }}
                >
                    <Callout>
                        <Text>{data?.location?.name}</Text>
                        {data?.location?.notes && (
                            <Text>{data?.location?.notes}</Text>
                        )}
                    </Callout>
                </Marker>
            </MapView>
            <View style={styles.zoomBox} pointerEvents="box-none">
                <Pressable style={styles.zoomButton} onPress={() => setSatellite((v) => !v)} accessibilityLabel="Map type">
                    <Text style={styles.layerText}>{satellite ? "Map" : "Sat"}</Text>
                </Pressable>
                <Pressable style={styles.zoomButton} onPress={() => zoom(0.5)} accessibilityLabel="Zoom in">
                    <Text style={styles.zoomText}>+</Text>
                </Pressable>
                <Pressable style={styles.zoomButton} onPress={() => zoom(2)} accessibilityLabel="Zoom out">
                    <Text style={styles.zoomText}>−</Text>
                </Pressable>
            </View>
            {!hasPoint && !lookingUp && (
                <View style={styles.notice}>
                    <Text style={styles.noticeText}>
                        This work order's location has no coordinates yet. Set the customer location on a map in the web app.
                    </Text>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    zoomBox: { position: "absolute", right: 16, bottom: 40, gap: 8 },
    zoomButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.95)",
        alignItems: "center",
        justifyContent: "center",
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
    },
    layerText: { fontSize: 12, fontWeight: "600", color: "#111" },
    zoomText: { fontSize: 26, lineHeight: 30, color: "#111" },
    notice: {
        position: "absolute",
        left: 16,
        right: 16,
        top: 16,
        padding: 12,
        borderRadius: 8,
        backgroundColor: "rgba(255,255,255,0.95)",
    },
    noticeText: { color: "#111", fontSize: 13 },
});
