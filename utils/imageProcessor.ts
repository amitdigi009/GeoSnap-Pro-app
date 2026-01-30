
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

      // 2. Scale font based on resolution - Maintained at 20 * scale per request
      const baseDim = Math.min(canvas.width, canvas.height);
      const scale = baseDim / 1000;
      
      const fontSize = 20 * scale; 
      const padding = 20 * scale;
      const lineSpacing = 1.35;
      const radius = 12 * scale;
      const margin = 25 * scale;

      // 3. Metadata Lines - Updated with specific user labels
      const lines = [
        { text: `📍 PLACE AREA: ${geo.placeName.toUpperCase()}`, color: '#FFFFFF', weight: '900' },
        { text: `LOCATION: ${(geo.areaName || "JALANDHAR").toUpperCase()}`, color: '#3B82F6', weight: '800' },
        { text: geo.address, color: '#D1D5DB', weight: '500' },
        { text: `GPS: ${geo.latitude.toFixed(6)}, ${geo.longitude.toFixed(6)}`, color: '#9CA3AF', weight: '500' },
        { text: `DATE: ${geo.timestamp}`, color: '#9CA3AF', weight: '500' }
      ];

      // 4. Measure Box Dimensions
      ctx.font = `900 ${fontSize}px "Inter", sans-serif`;
      let maxWidth = 0;
      lines.forEach(line => {
        ctx.font = `${line.weight} ${fontSize}px "Inter", sans-serif`;
        const width = ctx.measureText(line.text).width;
        if (width > maxWidth) maxWidth = width;
      });

      const boxW = maxWidth + (padding * 2);
      const boxH = (lines.length * fontSize * lineSpacing) + (padding * 1.5);
      
      // Positioned on the right side (bottom-right)
      const boxX = canvas.width - boxW - margin;
      const boxY = canvas.height - boxH - margin;

      // 5. Professional Scrim
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(boxX, boxY, boxW, boxH, radius);
      } else {
        ctx.rect(boxX, boxY, boxW, boxH);
      }
      ctx.fill();
      ctx.restore();

      // 6. Draw Text Overlay
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const textX = boxX + padding;

      lines.forEach((line, i) => {
        ctx.font = `${line.weight} ${fontSize}px "Inter", sans-serif`;
        ctx.fillStyle = line.color;
        
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4 * scale;
        
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
