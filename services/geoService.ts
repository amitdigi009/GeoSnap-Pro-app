
import { GeoData } from '../types';

export async function getCurrentGeoData(): Promise<{ latitude: number; longitude: number; timestamp: string }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location services not supported."));
      return;
    }

    // High accuracy settings optimized for speed and battery
    const options = {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 5000 // Allow 5-second old cache for significantly faster response
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
        let message = "Please enable GPS/Location permissions.";
        if (error.code === error.TIMEOUT) message = "GPS signal weak. Try moving outdoors.";
        reject(new Error(message));
      },
      options
    );
  });
}
