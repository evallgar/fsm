import { Text, View } from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker, Callout } from "react-native-maps";
import { StyleSheet } from "react-native";
import { useEffect, useRef } from "react";
import { useAppointmentByIdQueryOptions } from "@/services/appointments/queries";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { WorkOrder } from "@/services/appointments/interfaces";
import { Skeleton } from "@/components/Skeleton";

type Appointment = WorkOrder;

const INITIAL_REGION = {
    latitude: 23.6,
    longitude: -102.6,
    latitudeDelta: 18,
    longitudeDelta: 32,
}
export default function Map() {
    const mapRef = useRef<MapView>(null);

    const { id } = useLocalSearchParams() as { id: string };
    const { data, isFetching, isError } = useQuery(
        useAppointmentByIdQueryOptions(id)
    ) as { data: Appointment; isFetching: boolean; isError: boolean };

    useEffect(() => {
        handleWorkOrderLocation();
    }, [data]);

    const handleWorkOrderLocation = () => {
        
        mapRef.current?.animateCamera({
            center: {
            latitude: data?.location?.location?.latitude || 23.6,
            longitude: data?.location?.location?.longitude || -102.6,
            },
            zoom: 15
        }, {
            duration: 1000,
        })
    }
    if (isFetching) {
        return <Skeleton />;
    }
    if (isError) {
        return <Text>Error fetching data</Text>;
    }
    return (
        <View className="flex-1">
            <MapView style={StyleSheet.absoluteFill} 
            provider={PROVIDER_GOOGLE} 
            initialRegion={INITIAL_REGION} 
            showsMyLocationButton={true}
            ref={mapRef}
            >
                <Marker
                    coordinate={{
                        latitude: data?.location?.location?.latitude || 23.6,
                        longitude: data?.location?.location?.longitude || -102.6,
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
        </View>
    )
}   