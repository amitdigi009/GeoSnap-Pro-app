
import React, { useState } from 'react';
import { CapturedPhoto } from '../types';

interface PhotoPreviewProps {
  photo: CapturedPhoto;
  onDiscard: () => void;
  onSave: () => void;
}

const PhotoPreview: React.FC<PhotoPreviewProps> = ({ photo, onDiscard, onSave }) => {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const response = await fetch(photo.processedUrl);
      const blob = await response.blob();
      const file = new File([blob], `GeoSnap_${Date.now()}.jpg`, { type: 'image/jpeg' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'GeoSnap Pro Capture',
          text: `Verified capture at ${photo.metadata.placeName}`
        });
        onSave();
      } else {
        const link = document.createElement('a');
        link.href = photo.processedUrl;
        link.download = `GeoSnap_${Date.now()}.jpg`;
        link.click();
        onSave();
      }
    } catch (error) {
      console.error("Share failed:", error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-white overflow-hidden relative">
      
      {/* TOP ACTIONS */}
      <div className="absolute top-12 left-6 z-50">
        <button 
          onClick={onDiscard}
          className="w-14 h-14 bg-black/60 backdrop-blur-3xl rounded-full border border-white/10 flex items-center justify-center active:scale-90 transition-all shadow-xl"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="absolute top-12 right-6 z-40">
        <div className="bg-blue-600/20 backdrop-blur-xl px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.3em] text-blue-400 border border-blue-500/20 font-bold">
          LIVE <span className="text-white ml-1">PREVIEW</span>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="relative w-full max-w-lg">
          <div className="relative bg-zinc-900/40 p-1.5 rounded-[28px] border border-white/5 shadow-2xl overflow-hidden">
            <img 
              src={photo.processedUrl} 
              alt="GeoSnap Capture" 
              className="w-full h-auto rounded-[24px] object-contain shadow-2xl"
            />
          </div>
        </div>

        {/* Location Grounding Source Links */}
        {photo.metadata.sources && photo.metadata.sources.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-6 px-4">
            {photo.metadata.sources.map((source, idx) => (
              <a 
                key={idx}
                href={source.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[9px] bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-zinc-400 flex items-center gap-2 hover:bg-white/10 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
                {source.title || "Maps Source"}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* FLOATING SHARE BUTTON - MOVED TO BOTTOM LEFT */}
      <div className="absolute bottom-12 left-6 z-50">
        <button
          onClick={handleShare}
          disabled={isSharing}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all ${isSharing ? 'bg-zinc-800' : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/20'}`}
        >
          {isSharing ? (
            <div className="w-7 h-7 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          )}
        </button>
      </div>

      {/* No text labels in footer area for a clean professional look */}
    </div>
  );
};

export default PhotoPreview;
