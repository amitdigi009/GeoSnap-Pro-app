
import React, { useState, useEffect, useCallback } from 'react';
import CameraView from './components/CameraView';
import PhotoPreview from './components/PhotoPreview';
import { AppMode, CapturedPhoto } from './types';
import { getCurrentGeoData, startLocationTracking } from './services/geoService';
import { applyGeoOverlay } from './utils/imageProcessor';
import { reverseGeocodeAI } from './services/gemini';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.SPLASH);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<string>("");
  const [error, setError] = useState<{ message: string; sub: string } | null>(null);

  useEffect(() => {
    startLocationTracking();
    const timer = setTimeout(() => {
      setMode(AppMode.CAMERA);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleCapture = useCallback(async (dataUrl: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      setProcessStatus("LOCATING...");
      let coords;
      try {
        coords = await getCurrentGeoData();
      } catch (e) {
        coords = { latitude: 0, longitude: 0, timestamp: new Date().toISOString() };
      }
      
      setProcessStatus("TAGGING...");
      let geoInfo = { address: "Unknown Address", placeName: "Unknown Location", areaName: "Local Area" };
      
      if (coords.latitude !== 0 || coords.longitude !== 0) {
        try {
          const aiData = await reverseGeocodeAI(coords.latitude, coords.longitude);
          geoInfo = { 
            address: aiData.address, 
            placeName: aiData.placeName,
            areaName: aiData.areaName
          };
        } catch (e) {
          console.warn("Geocoding failed, using coordinates only.");
        }
      }
      
      const fullGeoData = { ...coords, ...geoInfo };
      const processedUrl = await applyGeoOverlay(dataUrl, fullGeoData);
      
      setCapturedPhoto({
        rawUrl: dataUrl,
        processedUrl,
        metadata: fullGeoData
      });
      
      setMode(AppMode.PREVIEW);
    } catch (err: any) {
      setError({
        message: "CAPTURE ERROR",
        sub: "Failed to process image metadata."
      });
    } finally {
      setIsProcessing(false);
      setProcessStatus("");
    }
  }, [isProcessing]);

  return (
    <div className="h-full bg-black overflow-hidden relative font-sans">
      {mode === AppMode.SPLASH && (
        <div className="flex flex-col items-center justify-center h-full bg-black text-white px-6">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-2xl animate-pulse">
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-black" fill="currentColor">
              <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-tighter">GeoSnap Pro</h1>
          <p className="text-zinc-500 text-xs mt-3 uppercase tracking-[0.3em]">Precision Imaging Engine</p>
          <div className="mt-16">
            <p className="text-white/40 text-[10px] font-medium tracking-wide">Made by Amit with ❤️</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center p-8 bg-black/95 backdrop-blur-xl">
          <div className="bg-zinc-900 border border-white/10 p-10 rounded-[40px] w-full max-w-xs text-center shadow-2xl">
            <h3 className="text-xl font-bold mb-3 uppercase text-white tracking-tight">{error.message}</h3>
            <p className="text-zinc-500 text-sm mb-10 leading-relaxed">{error.sub}</p>
            <button 
              onClick={() => setError(null)} 
              className="w-full py-5 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest active:scale-95 transition-all"
            >
              DISMISS
            </button>
          </div>
        </div>
      )}

      {mode === AppMode.CAMERA && (
        <CameraView onCapture={handleCapture} isProcessing={isProcessing} processStatus={processStatus} />
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
