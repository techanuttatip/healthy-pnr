import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  X,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  ShieldCheck
} from 'lucide-react';
import { showToast } from '../../utils/sweetAlert';

interface PwaQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaQrModal: React.FC<PwaQrModalProps> = ({ isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Compute mobile LAN URL for phone scanning on current port
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const targetHost = isLocalhost ? '192.168.1.31' : (typeof window !== 'undefined' ? window.location.hostname : '192.168.1.31');
  const port = typeof window !== 'undefined' && window.location.port ? `:${window.location.port}` : '';
  const pwaMobileUrl = `${typeof window !== 'undefined' ? window.location.protocol : 'http:'}//${targetHost}${port}/?app=inspector`;
  const pwaLocalUrl = typeof window !== 'undefined' ? `${window.location.origin}/?app=inspector` : 'http://localhost:5175/?app=inspector';

  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(pwaMobileUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0c1a2e',
        light: '#ffffff'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate PWA QR', err));
  }, [isOpen, pwaMobileUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pwaMobileUrl);
    setCopied(true);
    showToast('คัดลอกลิงก์สำหรับมือถือเรียบร้อย!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenNewTab = () => {
    window.open(pwaLocalUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-md w-full p-5 text-white shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white leading-tight">
                แอปตรวจสนามบนมือถือ (Mobile PWA)
              </h3>
              <p className="text-[11px] text-blue-300">
                อบต.โป่งน้ำร้อน · ใช้งานแบบไร้กระดาษ 100%
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Canvas */}
        <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-inner">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code สำหรับเปิดแอปตรวจสนาม" className="w-56 h-56 rounded-lg" />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
              กำลังสร้าง QR Code...
            </div>
          )}
          <span className="text-slate-600 font-bold text-[11px] mt-2 flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5 text-blue-600" />
            <span>สแกนด้วยกล้องมือถือ เพื่อเปิดแอปทันที</span>
          </span>
          <div className="mt-2 px-3 py-1 bg-slate-100 rounded-lg text-slate-800 text-[11px] font-mono select-all text-center border border-slate-300">
            URL มือถือ: <strong>{pwaMobileUrl}</strong>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 text-xs text-slate-300 space-y-1.5">
          <div className="font-bold text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>วิธีติดตั้งเป็นแอปบนมือถือ (PWA):</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300 leading-relaxed pl-1">
            <li>เปิดกล้องมือถือแล้วสแกน QR Code ด้านบน</li>
            <li>กดปุ่มแชร์หรือเมนูเบราว์เซอร์ แล้วเลือก <strong>"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</strong></li>
            <li>แอปจะติดตั้งเป็นไอคอนบนมือถือ เปิดใช้งานตรวจสนาม เช็กอิน GPS และให้ผู้ประกอบการเซ็นบนจอได้ทันที</li>
          </ol>
        </div>

        {/* Link / Open buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewTab}
            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>เปิดทดสอบในแท็บใหม่</span>
          </button>
        </div>
      </div>
    </div>
  );
};
