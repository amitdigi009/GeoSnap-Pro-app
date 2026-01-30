
import { GoogleGenAI } from "@google/genai";

export async function reverseGeocodeAI(lat: number, lng: number): Promise<{ address: string; placeName: string; mapsUrl?: string; sources?: any[] }> {
  // Use process.env.API_KEY directly as per SDK requirements
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Identify the specific place or establishment at coordinates ${lat}, ${lng}. Format your response exactly as:
      NAME: [Establishment Name or Landmark]
      ADDR: [Full Postal Address]`,
      config: { 
        tools: [{ googleMaps: {} }],
        toolConfig: { 
          retrievalConfig: { 
            latLng: { latitude: lat, longitude: lng } 
          } 
        },
        temperature: 0,
        systemInstruction: "You are a high-speed reverse geocoding engine. Use Google Maps grounding to find the most accurate name and address for the given coordinates. Output only the requested NAME and ADDR fields. Be concise."
      }
    });

    const text = response.text || "";
    const nameMatch = text.match(/NAME:\s*(.*)/i);
    const addrMatch = text.match(/ADDR:\s*(.*)/i);
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const mapsChunk = chunks.find((c: any) => c.maps)?.maps;

    // Prioritize grounded data from Maps tool, fallback to text parsing
    const placeName = (nameMatch ? nameMatch[1].trim() : "") || mapsChunk?.title || "Site Location";
    const address = (addrMatch ? addrMatch[1].trim() : "") || mapsChunk?.title || "Local Area";

    return { 
      address: address.replace(/[\[\]]/g, ''), 
      placeName: placeName.replace(/[\[\]]/g, ''), 
      mapsUrl: mapsChunk?.uri, 
      sources: chunks.filter((c: any) => c.maps).map((c: any) => ({ 
        title: c.maps.title, 
        uri: c.maps.uri 
      })) 
    };
  } catch (error: any) {
    console.error("Gemini Geocoding Error:", error);
    // Graceful fallback to avoid breaking the UI pipeline
    return { 
      address: `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`, 
      placeName: "Coordinates Active", 
      sources: [] 
    };
  }
}
