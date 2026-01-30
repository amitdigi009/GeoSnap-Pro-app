
import React, { useState } from 'react';
import { CapturedPhoto } from '../types';

interface PhotoPreviewProps {
  photo: CapturedPhoto;
  onDiscard: () => void;
  onSave: () => void;
}

const PhotoPreview: React.FC<PhotoPreviewProps> = ({ photo, onDiscard, onSave }) => {
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const response = await fetch(photo.processedUrl);
      const blob = await response.blob();
      const file = new File([blob], `GeoSnap_${Date.now()}.jpg`, { type: 'image/jpeg' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ 
          files: [file], 
          title: 'GeoSnap Pro Capture'
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
      console.warn("Sharing failed:", error);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-white relative">
      {/* Top Left Discard Button */}
      <div className="absolute top-12 left-6 z-50">
        <button 
          onClick={onDiscard} 
          className="p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 active:scale-90 transition-all shadow-lg"
          aria-label="Discard photo"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main Image Display */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full h-full max-w-sm max-h-[75vh] rounded-[32px] overflow-hidden shadow-2xl border border-white/5">
          <img src={photo.processedUrl} alt="Captured" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Bottom Left Minimalist Blue Share Icon Button */}
      <div className="absolute bottom-12 left-6 z-50">
        <button
          onClick={handleShare}
          disabled={sharing}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center active:scale-95 transition-all shadow-xl shadow-blue-900/40"
          aria-label="Share photo"
        >
          {sharing ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default PhotoPreview;
