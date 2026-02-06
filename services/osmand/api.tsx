import { getAuth } from "firebase/auth";
import { useMutation } from "@tanstack/react-query";
import * as Battery from 'expo-battery';

// Base URLs for the OsmAnd tracking server - try both HTTP and HTTPS
const BASE_URL_HTTPS = "https://platform.onemap8.com:5055";
const BASE_URL_HTTP = "http://platform.onemap8.com:5055";

// For debugging network issues
const DEBUG_NETWORK = true;

/**
 * OsmAnd Protocol Interface
 * Based on https://www.traccar.org/osmand/
 */
export interface OsmAndLocationPayload {
  id: string;         // Device identifier (using Firebase auth user ID)
  lat: number;        // Latitude
  lon: number;        // Longitude
  timestamp?: number; // Unix timestamp in seconds (optional, server can use current time)
  altitude?: number;  // Altitude in meters (optional)
  speed?: number;     // Speed in knots (optional)
  bearing?: number;   // Bearing in degrees (optional)
  accuracy?: number;  // Accuracy in meters (optional)
  batt?: number;      // Battery level in percentage (optional)
  charging?: boolean;   // Device charging status (optional)
  action?: string; // Custom action field (e.g., 'checkIn', 'checkOut')
  appointmentId?: string; // Custom field for appointment ID
  result?: string; // Custom field for result
  alarm?: string; // Custom field for alarm
}

/**
 * Posts location data to the OsmAnd tracking server
 * @param payload The location data to send
 * @returns Promise with the response
 */
export const postOsmAndLocation = async (payload: OsmAndLocationPayload): Promise<Response> => {
  // If no ID is provided, use the current user's ID from Firebase Auth
  if (!payload.id) {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }
    payload.id = currentUser.uid;
  }

  // Get battery information using async methods instead of hooks
  try {
    const batteryLevel = await Battery.getBatteryLevelAsync();
    const batteryState = await Battery.getBatteryStateAsync();
    
    // Add battery info to payload
    payload.batt = Math.round(Math.abs(Number((batteryLevel * 100).toFixed(2))));
    payload.charging = batteryState === Battery.BatteryState.CHARGING || false;
  } catch (error) {
    // If we can't get battery info, just continue without it
    console.log('Could not get battery info:', error);
  }

  // Construct the URL with query parameters according to OsmAnd protocol
  // Use HTTP since the server only supports HTTP GET calls
  const urlParams = new URLSearchParams();
  
  // Add all payload properties as query parameters
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      urlParams.append(key, value.toString());
    }
  });
  
  // For debugging
  if (DEBUG_NETWORK) {
    console.log('OsmAnd payload:', payload);
    console.log('OsmAnd URL params:', urlParams.toString());
  }

  // Try HTTP first since server only allows HTTP GET calls
  try {
    const httpUrl = `${BASE_URL_HTTP}/?${urlParams.toString()}`;
    if (DEBUG_NETWORK) console.log('Trying HTTP URL:', httpUrl);
    
    const response = await fetch(httpUrl, {
      method: "GET", // OsmAnd protocol uses GET with query parameters
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    
    if (DEBUG_NETWORK) console.log('HTTP response status:', response.status);
    return response;
  } catch (error) {
    if (DEBUG_NETWORK) console.log('HTTP request failed:', error);
    
    // Fallback to HTTPS if HTTP fails
    const httpsUrl = `${BASE_URL_HTTPS}/?${urlParams.toString()}`;
    if (DEBUG_NETWORK) console.log('Trying HTTPS URL:', httpsUrl);
    
    const response = await fetch(httpsUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    
    if (DEBUG_NETWORK) console.log('HTTPS response status:', response.status);
    return response;
  }

  // This code is unreachable as the function will return from either the try or catch block above
  // But TypeScript doesn't know that, so we need to satisfy it
  throw new Error("Unreachable code");
};

/**
 * React Query mutation hook for posting location data
 */
export const usePostLocationMutation = () => {
  return useMutation({
    mutationFn: postOsmAndLocation,
    onError: (error) => {
      console.error("Error posting location:", error);
    },
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: 1000, // Wait 1 second between retries
  });
};

// Mock function for testing when server is not available
export const mockPostLocation = async (payload: OsmAndLocationPayload): Promise<Response> => {
  console.log('MOCK: Location data would be sent to server:', payload);
  // Simulate a successful response after a short delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
