
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CameraViewProps {
  onCapture: (dataUrl: string) => void;
  isProcessing: boolean;
  processStatus?: string;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, isProcessing, processStatus }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  const initLockRef = useRef(false);
  
  const [status, setStatus] = useState<'init' | 'ready' | 'error'>('init');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shutter, setShutter] = useState(false);

  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.debug(`[Camera] Track stopped: ${track.label}`);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const initCamera = useCallback(async () => {
    if (initLockRef.current) return;
    initLockRef.current = true;
    
    setStatus('init');
    setErrorMsg(null);
    stopTracks();

    // Small delay to allow hardware to reset from previous sessions
    await new Promise(resolve => setTimeout(resolve, 100));

    const constraintsList = [
      { video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false },
      { video: { facingMode: 'environment' }, audio: false },
      { video: { facingMode: 'user' }, audio: false },
      { video: true, audio: false }
    ];

    let lastErr: any = null;
    let stream: MediaStream | null = null;

    for (const constraints of constraintsList) {
      if (!mountedRef.current) break;
      try {
        console.debug("[Camera] Requesting constraints:", constraints);
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) break;
      } catch (err: any) {
        lastErr = err;
        console.warn(`[Camera] Constraint set rejected: ${err.name}`);
      }
    }

    if (stream && mountedRef.current && videoRef.current) {
      streamRef.current = stream;
      const video = videoRef.current;
      
      video.muted = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.srcObject = stream;
      
      try {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        
        // Wait for actual video signal
        let signalWait = 0;
        const checkSignal = () => {
          if (!mountedRef.current) return;
          if (video.videoWidth > 0) {
            setStatus('ready');
            initLockRef.current = false;
          } else if (signalWait < 50) {
            signalWait++;
            requestAnimationFrame(checkSignal);
          } else {
            setStatus('ready');
            initLockRef.current = false;
          }
        };
        checkSignal();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Playback error:", err);
          setErrorMsg("Failed to start optical stream.");
          setStatus('error');
          initLockRef.current = false;
        }
      }
    } else {
      if (mountedRef.current) {
        setErrorMsg(lastErr?.name === 'NotReadableError' ? "Hardware is busy" : "Camera not found");
        setStatus('error');
      }
      initLockRef.current = false;
    }
  }, [stopTracks]);

  useEffect(() => {
    mountedRef.current = true;
    initCamera();
    return () => {
      mountedRef.current = false;
      stopTracks();
    };
  }, [initCamera, stopTracks]);

  const capture = () => {
    if (!videoRef.current || isProcessing || status !== 'ready') return;
    setShutter(true);
    setTimeout(() => setShutter(false), 80);
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      onCapture(canvas.toDataURL('image/jpeg', 0.9));
    }
  };

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black text-white p-8">
        <p className="text-sm font-bold uppercase mb-4 text-zinc-500">{errorMsg}</p>
        <button onClick={() => window.location.reload()} className="px-10 py-4 bg-white text-black rounded-full text-xs font-black uppercase tracking-widest active:scale-95 transition-all">Retry Link</button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black overflow-hidden">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      {shutter && <div className="absolute inset-0 bg-white z-[100]" />}
      
      {status === 'init' && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-2 border-white/5 border-t-white rounded-full animate-spin mb-4" />
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Hardware Sync</p>
        </div>
      )}

      {status === 'ready' && !isProcessing && (
        <div className="absolute inset-0 flex flex-col justify-end items-center pb-24">
          <button 
            onClick={capture} 
            className="w-20 h-20 bg-white rounded-full border-[6px] border-black/20 shadow-2xl active:scale-90 transition-transform" 
          />
        </div>
      )}

      {isProcessing && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-[200]">
          <div className="w-10 h-10 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin mb-4" />
          <p className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">{processStatus}</p>
        </div>
      )}
    </div>
  );
};

export default CameraView;
