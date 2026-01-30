
import React, { useState, useEffect, useCallback } from 'react';
import CameraView from './components/CameraView';
import PhotoPreview from './components/PhotoPreview';
import { AppMode, CapturedPhoto } from './types';
import { getCurrentGeoData } from './services/geoService';
import { applyGeoOverlay } from './utils/imageProcessor';
import { reverseGeocodeAI } from './services/gemini';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.SPLASH);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Faster splash transition for better UX
    const timer = setTimeout(() => {
      setMode(AppMode.CAMERA);
      // Pre-warm location immediately
      getCurrentGeoData().catch(() => {});
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleCapture = useCallback(async (dataUrl: string) => {
    setIsProcessing(true);
    try {
      // Parallel execution: Get GPS + Start Geocoding
      const coords = await getCurrentGeoData();
      
      // AI Reverse Geocoding
      let geoInfo = { address: "Precision Coordinates", placeName: "Satellite Locked" };
      try {
        geoInfo = await reverseGeocodeAI(coords.latitude, coords.longitude);
      } catch (e) {
        console.warn("AI metadata fallback active");
      }
      
      const fullGeoData = { ...coords, ...geoInfo };
      const processedUrl = await applyGeoOverlay(dataUrl, fullGeoData);
      
      setCapturedPhoto({
        rawUrl: dataUrl,
        processedUrl,
        metadata: fullGeoData
      });
      
      setMode(AppMode.PREVIEW);
    } catch (error: any) {
      console.error("System Capture Error:", error);
      alert(error.message || "Capture Error: Check GPS/Camera permissions.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return (
    <div className="h-full bg-black overflow-hidden relative">
      {mode === AppMode.SPLASH && (
        <div className="flex flex-col items-center justify-center h-full bg-black text-white px-6">
          <div className="relative w-32 h-32 mb-12">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              <rect x="10" y="30" width="80" height="55" rx="12" fill="#1a1a1a" stroke="#333" strokeWidth="1.5" />
              <path d="M35 30 L35 22 Q35 18 40 18 L60 18 Q65 18 65 22 L65 30" fill="#1a1a1a" stroke="#333" strokeWidth="1.5" />
              <circle cx="50" cy="57" r="22" fill="#0a0a0a" stroke="#444" strokeWidth="1" />
              <circle cx="50" cy="57" r="18" fill="#111" stroke="#22d3ee" strokeWidth="0.5" strokeOpacity="0.4" />
              <circle cx="50" cy="57" r="8" fill="#000" />
              <circle cx="47" cy="54" r="2" fill="white" fillOpacity="0.2" />
              <rect x="72" y="38" width="8" height="4" rx="1" fill="#22d3ee" className="animate-pulse" />
              <circle cx="20" cy="40" r="2" fill="#22d3ee" fillOpacity="0.6" />
              <circle cx="50" cy="57" r="28" fill="none" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="4 8" className="animate-[spin_10s_linear_infinite]" opacity="0.2" />
            </svg>
          </div>
          
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">GeoSnap Pro</h1>
            <p className="text-cyan-400 text-xs tracking-[0.05em] font-medium">Made by Amit with ❤️</p>
          </div>

          <div className="absolute bottom-20 flex space-x-2">
            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
          </div>
        </div>
      )}

      {mode === AppMode.CAMERA && (
        <CameraView onCapture={handleCapture} isProcessing={isProcessing} />
      )}

      {mode === AppMode.PREVIEW && capturedPhoto && (
        <PhotoPreview 
          photo={capturedPhoto} 
          onDiscard={() => setMode(AppMode.CAMERA)} 
          onSave={() => setMode(AppMode.CAMERA)} 
        />
      )}
    </div>
  );
};

export default App;
