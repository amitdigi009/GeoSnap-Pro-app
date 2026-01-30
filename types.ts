
export interface GeoData {
  latitude: number;
  longitude: number;
  address: string;
  placeName: string;
  timestamp: string;
  mapsUrl?: string;
  sources?: Array<{ title: string; uri: string }>;
}

export interface CapturedPhoto {
  rawUrl: string; // The original capture
  processedUrl: string; // Captured with overlay
  metadata: GeoData;
}

export enum AppMode {
  SPLASH = 'SPLASH',
  CAMERA = 'CAMERA',
  PREVIEW = 'PREVIEW',
  SETTINGS = 'SETTINGS'
}
