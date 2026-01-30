
export async function reverseGeocodeAI(lat: number, lng: number): Promise<{ address: string; placeName: string; areaName: string; mapsUrl?: string; sources?: any[] }> {
  // Static location data as requested, removing all external API dependencies
  try {
    return {
      address: "Bashirpura, Jalandhar",
      placeName: "Power Cabin",
      areaName: "Bashirpura, Jalandhar",
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      sources: []
    };
  } catch (error: any) {
    console.error("Geocoding logic error:", error);
    return { 
      address: "Bashirpura, Jalandhar", 
      placeName: "Power Cabin", 
      areaName: "Bashirpura, Jalandhar",
      sources: [] 
    };
  }
}
