
import { GoogleGenAI } from "@google/genai";

// Cache for stability and quota saving
interface GeocodeCache {
  lat: number;
  lng: number;
  data: { address: string; placeName: string; mapsUrl?: string; sources?: any[] };
  timestamp: number;
}

let lastGeocode: GeocodeCache | null = null;

const CACHE_THRESHOLD_METERS = 20; 
const CACHE_EXPIRY_MS = 1000 * 60 * 15; // 15 minutes cache
const MAX_RETRIES = 2;

/**
 * Calculates distance between two points in meters (Haversine Formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Internal helper to call the AI with exponential backoff retry logic
 */
async function fetchWithRetry(qLat: number, qLng: number, attempt: number = 0): Promise<any> {
  // Always create a fresh instance to ensure latest API key access
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: `Perform high-precision reverse geocoding for coordinates: ${qLat}, ${qLng}. 
      Identify the specific building, business, or landmark at this spot and its full verified address.
      
      Response Format:
      NAME: [Building or Place Name]
      ADDR: [Full Street Address, City, Region]`,
      config: { 
        tools: [{ googleMaps: {} }],
        toolConfig: { retrievalConfig: { latLng: { latitude: qLat, longitude: qLng } } },
        temperature: 0.1,
        // Ensure the model doesn't get creative with formatting
        systemInstruction: "You are a professional geocoding engine. Provide only the NAME and ADDR fields. No markdown bolding, no introductory text."
      }
    });
    return response;
  } catch (error: any) {
    if ((error.status === 429 || error.status >= 500) && attempt < MAX_RETRIES) {
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(qLat, qLng, attempt + 1);
    }
    throw error;
  }
}

export async function reverseGeocodeAI(lat: number, lng: number): Promise<{ address: string; placeName: string; mapsUrl?: string; sources?: any[] }> {
  const qLat = parseFloat(lat.toFixed(5));
  const qLng = parseFloat(lng.toFixed(5));

  // 1. Cache Check
  if (lastGeocode) {
    const distance = calculateDistance(qLat, qLng, lastGeocode.lat, lastGeocode.lng);
    const isRecent = (Date.now() - lastGeocode.timestamp) < CACHE_EXPIRY_MS;
    if (distance < CACHE_THRESHOLD_METERS && isRecent) {
      return lastGeocode.data;
    }
  }

  try {
    const response = await fetchWithRetry(qLat, qLng);
    const text = response.text || "";
    
    // 2. Extract Grounding Metadata (Highest Confidence)
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const mapsChunks = chunks.filter((c: any) => c.maps);
    
    const primaryPlace = mapsChunks[0]?.maps;
    const mapsUrl = primaryPlace?.uri;
    const sources = mapsChunks.map((c: any) => ({
        title: c.maps.title,
        uri: c.maps.uri
    }));

    // 3. Resilient Text Parsing
    // Handles **NAME:**, NAME:, Name:, etc.
    const nameMatch = text.match(/(?:\*\*?)?NAME(?:\*\*?)?:\s*(.*)/i);
    const addrMatch = text.match(/(?:\*\*?)?ADDR(?:\*\*?)?:\s*(.*)/i);
    
    // 4. Intelligence-led Fallback Selection
    // Priority: Grounding Title -> Text Match -> "Verified Location"
    const placeName = primaryPlace?.title || (nameMatch ? nameMatch[1].trim() : "Verified Location");
    const address = (addrMatch ? addrMatch[1].trim() : "") || (primaryPlace?.title ? `Near ${primaryPlace.title}` : `Lat: ${qLat}, Lng: ${qLng}`);

    const result = {
      address,
      placeName,
      mapsUrl,
      sources: sources.length > 0 ? sources : []
    };

    lastGeocode = { lat: qLat, lng: qLng, data: result, timestamp: Date.now() };
    return result;

  } catch (error: any) {
    console.error("Geocoding Logic Error:", error);
    return {
      address: `${qLat}, ${qLng}`,
      placeName: "GPS Satellite Lock",
      sources: []
    };
  }
}
