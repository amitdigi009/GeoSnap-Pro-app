
let lastKnownLocation: { latitude: number; longitude: number; timestamp: string } | null = null;
let watcherId: number | null = null;

export function startLocationTracking() {
  if (watcherId !== null || !navigator.geolocation) return;

  const updateLocation = (pos: GeolocationPosition) => {
    lastKnownLocation = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      timestamp: new Date().toLocaleString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      })
    };
  };

  watcherId = navigator.geolocation.watchPosition(
    updateLocation,
    (err) => console.warn("Location Watcher Error:", err),
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
  );
}

export async function getCurrentGeoData(): Promise<{ latitude: number; longitude: number; timestamp: string }> {
  // If we have a warm location, return it immediately
  if (lastKnownLocation) {
    return { ...lastKnownLocation };
  }

  // Fallback if tracker hasn't fired yet
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const data = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timestamp: new Date().toLocaleString('en-IN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
          })
        };
        lastKnownLocation = data;
        resolve(data);
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 3000 }
    );
  });
}
