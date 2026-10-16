import React, { useState, useEffect, useRef } from 'react'
import { QrCode, X, Camera, Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react'
import type { Establishment } from '../api'
import { playSuccessChime, triggerHaptic } from '../utils/haptics'

interface QrScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScanSuccess: (est: Establishment) => void
  establishments: Establishment[]
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  establishments
}) => {
  const [hasCamera, setHasCamera] = useState<boolean | null>(null)
  const [isScanning, setIsScanning] = useState(true)
  const [scannedEst, setScannedEst] = useState<Establishment | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setScannedEst(null)
      setIsScanning(true)
      return
    }

    let stream: MediaStream | null = null
    async function initCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          })
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.play()
            setHasCamera(true)
          }
        } else {
          setHasCamera(false)
        }
      } catch (e) {
        setHasCamera(false)
      }
    }

    initCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop())
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSimulateScan = (est: Establishment) => {
    setIsScanning(false)
    setScannedEst(est)
    playSuccessChime()
    triggerHaptic([60, 40, 80])

    setTimeout(() => {
      onScanSuccess(est)
      onClose()
    }, 900)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between text-white pt-2 px-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <QrCode className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold">สแกน QR ตรวจสอบใบอนุญาต</h3>
            <p className="text-[10.5px] text-slate-300">กล้องตรวจจับรหัสสถานประกอบการ</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Viewfinder */}
      <div className="relative w-full max-w-[310px] aspect-square rounded-3xl overflow-hidden border-2 border-white/30 flex items-center justify-center bg-slate-900/50 shadow-2xl my-auto">
        {/* Real Video or Simulated Background */}
        {hasCamera ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-gradient-to-b from-slate-900 to-slate-950">
            <QrCode className="w-20 h-20 text-slate-600 mb-2 animate-pulse" />
            <p className="text-xs font-semibold text-slate-300">
              หันกล้องไปที่ QR Code บนใบอนุญาต หรือป้ายหน้าร้าน
            </p>
          </div>
        )}

        {/* Reticle Corners */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-xl" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-xl" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-xl" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-xl" />

        {/* Animated Laser Scanline */}
        {isScanning && (
          <div
            className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse"
            style={{
              animation: 'scanAnimation 2.2s ease-in-out infinite alternate'
            }}
          />
        )}

        {/* Success Overlay when Scanned */}
        {scannedEst && (
          <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 text-white animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-2 shadow-lg animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 mb-1">
              {scannedEst.permitNo}
            </span>
            <h4 className="text-sm font-bold text-white line-clamp-1">{scannedEst.name}</h4>
            <p className="text-xs text-emerald-200">เปิดแบบตรวจสุขลักษณะทันที...</p>
          </div>
        )}
      </div>

      {/* Bottom Quick Test QR Selector */}
      <div className="w-full max-w-[340px] bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-2xl p-3.5 text-white space-y-2 mb-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>ทดสอบจำลองสแกน QR ร้านในพื้นที่:</span>
          </span>
          <span className="text-[10px] text-slate-400">คลิกเพื่อสแกน</span>
        </div>

        <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
          {establishments.slice(0, 3).map(est => (
            <button
              key={est.id}
              type="button"
              onClick={() => handleSimulateScan(est)}
              className="w-full py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-between text-left active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="min-w-0 pr-2">
                <p className="text-xs font-bold text-white truncate">{est.name}</p>
                <span className="text-[10px] text-slate-300">{est.permitNo} • {est.village}</span>
              </div>
              <span className="text-[10.5px] font-bold px-2 py-1 rounded-lg bg-blue-500/80 text-white shrink-0">
                สแกน
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
