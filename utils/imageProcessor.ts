
import { GeoData } from '../types';

export async function applyGeoOverlay(imageSrc: string, geo: GeoData): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Maintain native aspect ratio for high-fidelity capture
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // 1. Draw original high-res capture
      ctx.drawImage(img, 0, 0);

      // 2. Metadata Scale Calculation
      // Target a 'professional small' look relative to image resolution.
      const scale = canvas.height / 1080; 
      const fontSize = 13 * scale; // Reduced for "small font" requirement
      const padding = 16 * scale;
      const lineSpacing = 1.35;
      const radius = 6 * scale;

      // 3. Define Metadata Lines
      const lines = [
        { text: `📍 ${geo.placeName}`, color: '#FFFFFF', weight: '600' },
        { text: geo.address, color: '#E5E7EB', weight: '400' },
        { text: `${geo.latitude.toFixed(6)}, ${geo.longitude.toFixed(6)}`, color: '#D1D5DB', weight: '400' },
        { text: geo.timestamp, color: '#9CA3AF', weight: '400' }
      ];

      // 4. Measuring for Layout
      ctx.font = `600 ${fontSize}px "Inter", -apple-system, sans-serif`;
      let maxLineWidth = 0;
      lines.forEach(line => {
        const width = ctx.measureText(line.text).width;
        if (width > maxLineWidth) maxLineWidth = width;
      });

      const boxWidth = maxLineWidth + (padding * 2);
      const boxHeight = (lines.length * fontSize * lineSpacing) + (padding * 1.0);
      
      // Bottom-Right Anchoring with tight margins
      const margin = 20 * scale;
      const boxX = canvas.width - boxWidth - margin;
      const boxY = canvas.height - boxHeight - margin;

      // 5. Sophisticated Frosted Backdrop
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 10 * scale;
      
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
      ctx.fill();

      // Sharp glass border for premium look
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 0.5 * scale;
      ctx.stroke();
      ctx.restore();

      // 6. Metadata Text Rendering (Right-Aligned)
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      
      const textX = canvas.width - margin - padding; 

      lines.forEach((line, index) => {
        ctx.font = `${line.weight} ${fontSize}px "Inter", -apple-system, sans-serif`;
        ctx.fillStyle = line.color;
        
        // High-contrast protection for readability on any background
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 2 * scale;
        
        ctx.fillText(
          line.text,
          textX,
          boxY + (padding * 0.5) + (index * fontSize * lineSpacing)
        );
      });

      // Output high-quality JPEG
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => reject(new Error("Image load error"));
    img.src = imageSrc;
  });
}
