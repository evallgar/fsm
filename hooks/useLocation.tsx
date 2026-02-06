import { useState } from "react";
import * as Location from "expo-location";

const useLocation = () => {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    
    const getLocation = async () => {
        setLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status !== 'granted') {
                setError('Permission to access location was denied');
                return;
            }
            
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
            });
            setLocation(location);
            return location
        } catch (error: unknown) {
            // Safely handle the unknown error type
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return {
        location,
        error,
        loading,
        getLocation,
    };
};

export default useLocation;