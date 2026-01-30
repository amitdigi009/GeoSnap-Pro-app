
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CameraViewProps {
  onCapture: (blobUrl: string) => void;
  isProcessing: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, isProcessing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not available in this environment.");
      }
      
      const constraints = {
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError(err.message || "Camera access denied.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const takePhoto = () => {
    if (!videoRef.current || isProcessing) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      onCapture(dataUrl);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-950 text-center p-8 text-white">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-zinc-400 mb-6 font-light leading-relaxed">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-zinc-900 px-8 py-3 rounded-2xl border border-zinc-800 text-sm font-medium uppercase tracking-widest active:scale-95 transition-all"
        >
          Reset Camera
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black overflow-hidden flex flex-col">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      
      {/* HUD - Minimalist view without footer text */}
      <div className="absolute top-0 left-0 w-full p-6 pt-12 flex justify-center items-start pointer-events-none">
        <div className="bg-black/20 backdrop-blur-md px-4 py-1 rounded-full border border-white/5">
           <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Capture Button Area - Clean footer */}
      <div className="absolute bottom-0 left-0 w-full p-12 pb-16 flex justify-center items-center bg-gradient-to-t from-black/40 to-transparent">
        <div className="relative">
          <button
            onClick={takePhoto}
            disabled={isProcessing}
            className={`w-20 h-20 rounded-full border-[3px] border-white/40 flex items-center justify-center active:scale-90 transition-all ${isProcessing ? 'opacity-30' : 'opacity-100'}`}
          >
            <div className="w-16 h-16 bg-white rounded-full shadow-lg shadow-white/20"></div>
          </button>
        </div>
      </div>

      {isProcessing && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-zinc-200 text-[10px] font-bold uppercase tracking-[0.4em]">Locking Location</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraView;
