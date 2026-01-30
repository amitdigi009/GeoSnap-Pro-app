
import { GeoData } from '../types';

export async function getCurrentGeoData(): Promise<{ latitude: number; longitude: number; timestamp: string }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location services not supported."));
      return;
    }

    // High accuracy settings optimized for rapid capture
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000 // Allow 1-second old cache for faster response
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toLocaleString()
        });
      },
      (error) => {
        console.error("Geolocation Error:", error);
        
        // Handle common GPS errors with specific instructions
        let message = "Please enable GPS/Location permissions.";
        if (error.code === error.TIMEOUT) message = "GPS signal weak. Try moving outdoors.";
        
        reject(new Error(message));
      },
      options
    );
  });
}
