import React, { useState, useEffect, useRef } from 'react'
import { QrCode, X, Search, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react'
import type { Establishment } from './pwaApi'
import { playSuccessChime, triggerHaptic } from '../../../utils/haptics'

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
  const [showManualSearch, setShowManualSearch] = useState(false)
  const [manualSearchQuery, setManualSearchQuery] = useState('')
  const [searchError, setSearchError] = useState('')
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const handleProcessScan = (est: Establishment) => {
    setIsScanning(false)
    setScannedEst(est)
    playSuccessChime()
    triggerHaptic([60, 40, 80])

    setTimeout(() => {
      onScanSuccess(est)
      onClose()
    }, 900)
  }

  useEffect(() => {
    if (!isOpen) {
      setScannedEst(null)
      setIsScanning(true)
      setShowManualSearch(false)
      setManualSearchQuery('')
      setSearchError('')
      return
    }

    let stream: MediaStream | null = null
    let scanInterval: any = null

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

            // Real-time Barcode / QR Code detector if supported by browser/device
            if ('BarcodeDetector' in window) {
              try {
                const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
                scanInterval = setInterval(async () => {
                  if (videoRef.current && videoRef.current.readyState >= 2) {
                    try {
                      const barcodes = await barcodeDetector.detect(videoRef.current)
                      if (barcodes && barcodes.length > 0) {
                        const raw = String(barcodes[0].rawValue || '')
                        const matched = establishments.find(e =>
                          e.id === raw ||
                          e.permitNo === raw ||
                          raw.includes(e.id) ||
                          raw.includes(e.permitNo)
                        )
                        if (matched) {
                          clearInterval(scanInterval)
                          handleProcessScan(matched)
                        }
                      }
                    } catch {}
                  }
                }, 400)
              } catch {}
            }
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
      if (scanInterval) clearInterval(scanInterval)
      if (stream) {
        stream.getTracks().forEach(t => t.stop())
      }
    }
  }, [isOpen, establishments])

  if (!isOpen) return null

  function handleManualSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSearchError('')
    const q = manualSearchQuery.trim().toLowerCase()
    if (!q) {
      setSearchError('กรุณากรอกเลขที่ใบอนุญาตหรือชื่อร้าน')
      return
    }

    const found = establishments.find(e =>
      e.permitNo.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      (e.id && e.id.toLowerCase().includes(q))
    )

    if (found) {
      handleProcessScan(found)
    } else {
      setSearchError('ไม่พบข้อมูลสถานประกอบการที่ตรงกับเงื่อนไข')
      triggerHaptic(40)
    }
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
          type="button"
          aria-label="ปิดกล้อง"
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
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

      {/* Bottom Guidance & Manual Search Fallback */}
      <div className="w-full max-w-[340px] space-y-2 mb-2">
        {!showManualSearch ? (
          <div className="bg-slate-900/85 backdrop-blur-xl border border-white/15 rounded-2xl p-3.5 text-center text-white shadow-xl">
            <p className="text-xs font-semibold text-slate-100">
              จัดตำแหน่ง QR Code ให้อยู่กึ่งกลางกรอบสแกน
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              ระบบจะตรวจจับอัตโนมัติและเปิดแบบประเมินสุขลักษณะทันที
            </p>
            <button
              type="button"
              onClick={() => setShowManualSearch(true)}
              className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-300 hover:text-blue-200 underline cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>หรือค้นหาด้วยเลขที่ใบอนุญาต / ชื่อร้าน</span>
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleManualSearchSubmit}
            className="bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-2xl p-3 text-white space-y-2 shadow-xl animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300">ค้นหาเลขที่ใบอนุญาต / ชื่อร้าน</span>
              <button
                type="button"
                onClick={() => setShowManualSearch(false)}
                className="text-[10px] text-slate-400 hover:text-white"
              >
                ปิดช่องค้นหา
              </button>
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={manualSearchQuery}
                onChange={e => {
                  setManualSearchQuery(e.target.value)
                  setSearchError('')
                }}
                placeholder="เช่น บท-69-0044 หรือชื่อร้าน"
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-400"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shrink-0 cursor-pointer"
              >
                ค้นหา
              </button>
            </div>
            {searchError && (
              <p className="text-[10.5px] text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{searchError}</span>
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
