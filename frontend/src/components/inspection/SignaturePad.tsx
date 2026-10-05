import React, { useRef, useState, useEffect } from 'react';
import { Eraser, PenTool } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  signature: string | null;
  onSave: (dataUrl: string | null) => void;
  signedName?: string;
  onNameChange?: (name: string) => void;
  namePlaceholder?: string;
  titleRole?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  label,
  signature,
  onSave,
  signedName,
  onNameChange,
  namePlaceholder,
  titleRole
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(Boolean(signature));

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions based on client bounding rect
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      if (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height)) {
        canvas.width = Math.floor(rect.width);
        canvas.height = Math.floor(rect.height);
      }
    }

    if (signature) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasContent(true);
      };
      img.src = signature;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasContent(false);
    }
  }, [signature]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else if ('clientX' in e) {
      return {
        x: (e as React.MouseEvent<HTMLCanvasElement>).clientX - rect.left,
        y: (e as React.MouseEvent<HTMLCanvasElement>).clientY - rect.top
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasContent(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL('image/png'));
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasContent(false);
    onSave(null);
  };

  return (
    <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2 shadow-2xs">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-bold text-slate-800">{label}</span>
          {titleRole && <span className="text-[10px] text-slate-500">({titleRole})</span>}
        </div>
        {hasContent && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[10px] text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer font-medium hover:underline"
          >
            <Eraser className="w-3 h-3" />
            <span>ล้างลายเซ็น</span>
          </button>
        )}
      </div>

      {/* Signature Canvas */}
      <div className="relative border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-slate-50/70 hover:bg-white transition-colors touch-none">
        <canvas
          ref={canvasRef}
          className="w-full h-24 block cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={(e) => {
            e.preventDefault();
            startDrawing(e);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            draw(e);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            stopDrawing();
          }}
        />

        {!hasContent && !isDrawing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 text-xs italic select-none">
            <span>✍️ เซ็นลายมือชื่อด้วยนิ้ว ปากกา หรือเมาส์</span>
            <span className="text-[9px] text-slate-400 mt-0.5">ระบบจะบันทึกเป็นหลักฐานอิเล็กทรอนิกส์</span>
          </div>
        )}
      </div>

      {/* Signer Full Name */}
      {onNameChange && (
        <div className="pt-1">
          <input
            type="text"
            value={signedName || ''}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={namePlaceholder || 'ชื่อ-สกุล ผู้ลงนาม'}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
};
export default SignaturePad;
