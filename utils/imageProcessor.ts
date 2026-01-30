
import { GeoData } from '../types';

export async function applyGeoOverlay(imageSrc: string, geo: GeoData): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Canvas context failure"));
        return;
      }

      // 1. Render Base Frame
      ctx.drawImage(img, 0, 0);

      // 2. Scale font based on resolution - User requested 35 * scale
      const baseDim = Math.min(canvas.width, canvas.height);
      const scale = baseDim / 1000;
      
      const fontSize = 35 * scale; 
      const padding = 35 * scale;
      const lineSpacing = 1.3;
      const radius = 16 * scale;
      const margin = 40 * scale;

      // 3. Metadata Lines
      const lines = [
        { text: `📍 ${geo.placeName || 'Site Location'}`, color: '#FFFFFF', weight: '900' },
        { text: geo.address || 'Local Data Active', color: '#F3F4F6', weight: '500' },
        { text: `GPS: ${geo.latitude.toFixed(6)}, ${geo.longitude.toFixed(6)}`, color: '#E5E7EB', weight: '500' },
        { text: `DATE: ${geo.timestamp}`, color: '#D1D5DB', weight: '500' }
      ];

      // 4. Measure Box
      ctx.font = `900 ${fontSize}px "Inter", sans-serif`;
      let maxWidth = 0;
      lines.forEach(line => {
        ctx.font = `${line.weight} ${fontSize}px "Inter", sans-serif`;
        const width = ctx.measureText(line.text).width;
        if (width > maxWidth) maxWidth = width;
      });

      const boxW = maxWidth + (padding * 2);
      const boxH = (lines.length * fontSize * lineSpacing) + (padding * 1.5);
      
      const boxX = canvas.width - boxW - margin;
      const boxY = canvas.height - boxH - margin;

      // 5. High-Contrast Semi-Transparent Scrim
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(boxX, boxY, boxW, boxH, radius);
      } else {
        ctx.rect(boxX, boxY, boxW, boxH);
      }
      ctx.fill();
      ctx.restore();

      // 6. Draw Text
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const textX = boxX + padding;

      lines.forEach((line, i) => {
        ctx.font = `${line.weight} ${fontSize}px "Inter", sans-serif`;
        ctx.fillStyle = line.color;
        
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 6 * scale;
        
        ctx.fillText(
          line.text, 
          textX, 
          boxY + (padding * 0.75) + (i * fontSize * lineSpacing)
        );
      });

      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => reject(new Error("Base image load failure"));
    img.src = imageSrc;
  });
}
