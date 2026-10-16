import React, { useRef, useState, useEffect, useCallback } from 'react'
import { PenTool, RotateCcw, Check, Sparkles, ShieldCheck } from 'lucide-react'
import { triggerHaptic, playBeep } from '../utils/haptics'
import { OFFICIAL_NWK_SIGNATURE_DATA_URL, RUNGTHIWA_OFFICER } from '../constants/officialSignature'

interface SignaturePadProps {
  role?: 'officer' | 'owner'
  title?: string
  signerName?: string
  signerSubtitle?: string
  officerName?: string
  initialSignature?: string
  autoPreloadOfficer?: boolean
  canvasHeight?: number
  allowLandscapeModal?: boolean
  onSave?: (dataUrl: string) => void
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  role = 'officer',
  title,
  signerName,
  signerSubtitle,
  officerName = RUNGTHIWA_OFFICER.name,
  initialSignature,
  autoPreloadOfficer = true,
  canvasHeight = 130,
  allowLandscapeModal = true,
  onSave
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(Boolean(initialSignature))
  const [isAutoSigned, setIsAutoSigned] = useState(role === 'officer' && Boolean(initialSignature))

  // Draw realistic Thai official e-signature curve for นวก.รุ่งทิวา
  const autoSignOfficer = useCallback((playSound = true) => {
    if (playSound) {
      triggerHaptic(50)
      playBeep(880, 0.08)
    }
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1e40af'

    // Realistic cursive 'รุ่งทิวา' flourish
    ctx.beginPath()
    ctx.moveTo(40, 65)
    ctx.bezierCurveTo(60, 20, 80, 80, 110, 40)
    ctx.bezierCurveTo(130, 20, 140, 75, 170, 50)
    ctx.bezierCurveTo(190, 30, 210, 85, 230, 45)
    ctx.bezierCurveTo(245, 25, 260, 60, 280, 55)
    // Underline loop
    ctx.moveTo(35, 75)
    ctx.quadraticCurveTo(150, 95, 275, 68)
    // Thai diacritics
    ctx.moveTo(110, 32)
    ctx.arc(110, 32, 2.5, 0, Math.PI * 2)
    ctx.moveTo(172, 42)
    ctx.arc(172, 42, 2.5, 0, Math.PI * 2)
    ctx.stroke()

    setHasSignature(true)
    setIsAutoSigned(true)
    if (onSave) {
      onSave(canvas.toDataURL())
    }
  }, [onSave])

  // Initialize canvas & auto-preload signature
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = role === 'owner' ? '#047857' : '#1e40af'

    if (initialSignature) {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        setHasSignature(true)
      }
      img.src = initialSignature
    } else if (role === 'officer' && autoPreloadOfficer) {
      autoSignOfficer(false)
    }
  }, [role, autoPreloadOfficer, autoSignOfficer, initialSignature])

  const getCoords = (canvas: HTMLCanvasElement, e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1
    const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    setIsAutoSigned(false)
    ctx.strokeStyle = role === 'owner' ? '#047857' : '#1e40af'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const { x, y } = getCoords(canvas, e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoords(canvas, e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDraw = () => {
    if (isDrawing) {
      setIsDrawing(false)
      triggerHaptic(20)
      if (onSave && canvasRef.current) {
        onSave(canvasRef.current.toDataURL())
      }
    }
  }

  const clearCanvas = () => {
    triggerHaptic(30)
    playBeep(600, 0.05)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    setIsAutoSigned(false)
    if (onSave) onSave('')
  }

  const [isLandscapeModalOpen, setIsLandscapeModalOpen] = useState(false)
  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isModalDrawing, setIsModalDrawing] = useState(false)

  const clearModalCanvas = () => {
    triggerHaptic(30)
    playBeep(600, 0.05)
    const canvas = modalCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const saveModalSignature = () => {
    triggerHaptic(35)
    playBeep(880, 0.05)
    const mCanvas = modalCanvasRef.current
    const mainCanvas = canvasRef.current
    if (mCanvas && mainCanvas) {
      const dataUrl = mCanvas.toDataURL()
      const ctx = mainCanvas.getContext('2d')
      if (ctx) {
        const img = new Image()
        img.onload = () => {
          ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height)
          ctx.drawImage(img, 0, 0, mainCanvas.width, mainCanvas.height)
          setHasSignature(true)
        }
        img.src = dataUrl
      }
      if (onSave) onSave(dataUrl)
    }
    setIsLandscapeModalOpen(false)
  }

  const resolvedTitle = title || (role === 'owner' ? 'ลายมือชื่อผู้รับการตรวจ (เจ้าของร้าน / ผู้ประกอบการ)' : 'ลายมือชื่อพนักงานเจ้าหน้าที่ผู้ตรวจ')
  const resolvedSigner = signerName || (role === 'owner' ? 'ผู้รับการตรวจ / ผู้แทน' : officerName)

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {role === 'owner' ? (
            <PenTool size={16} color="#059669" />
          ) : (
            <ShieldCheck size={16} color="#2563eb" />
          )}
          <div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
              {resolvedTitle}
            </span>
            <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>
              {resolvedSigner} {signerSubtitle ? `• ${signerSubtitle}` : ''}
            </p>
          </div>
        </div>

        {hasSignature && (
          <span style={{
            fontSize: '9.5px',
            fontWeight: 800,
            color: '#059669',
            background: '#ecfdf5',
            padding: '2px 8px',
            borderRadius: '10px',
            border: '1px solid #a7f3d0',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Check size={12} />
            <span>ลงชื่อเรียบร้อย</span>
          </span>
        )}
      </div>

      {/* Signature Canvas Box (Horizontal Landscape by default) */}
      <div style={{
        position: 'relative',
        border: '1.5px dashed ' + (hasSignature ? '#10b981' : '#cbd5e1'),
        borderRadius: '12px',
        background: '#f8fafc',
        overflow: 'hidden',
        touchAction: 'none'
      }}>
        <canvas
          ref={canvasRef}
          width={420}
          height={canvasHeight}
          style={{ width: '100%', height: `${canvasHeight}px`, display: 'block', cursor: 'crosshair' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />

        {!hasSignature && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            color: '#94a3b8'
          }}>
            <PenTool size={22} style={{ opacity: 0.4, marginBottom: '6px' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
              {role === 'owner' ? '✍️ ให้เจ้าของร้าน/ผู้แทน ใช้นิ้วเซ็นชื่อแนวนอนที่นี่' : 'ใช้นิ้วมือวาดลายเซ็นที่นี่'}
            </span>
            <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
              (พื้นที่เซ็นชื่อแนวนอนกว้างพิเศษ สะดวกต่อนิ้วสัมผัส)
            </span>
          </div>
        )}

        {isAutoSigned && (
          <div style={{
            position: 'absolute',
            bottom: '4px',
            right: '8px',
            pointerEvents: 'none',
            fontSize: '9px',
            fontWeight: 800,
            color: '#1d4ed8',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            ✓ e-Signature: {officerName}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <button
          type="button"
          onClick={clearCanvas}
          style={{
            padding: '6px 12px',
            borderRadius: '10px',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            color: '#475569',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer'
          }}
        >
          <RotateCcw size={12} />
          <span>เซ็นใหม่</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {role === 'owner' && allowLandscapeModal && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(20)
                setIsLandscapeModalOpen(true)
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '10px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#047857',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
            >
              <span>🔄 หมุนเซ็นแนวนอนเต็มจอ</span>
            </button>
          )}

          {role === 'officer' && (
            <button
              type="button"
              onClick={() => autoSignOfficer(true)}
              style={{
                padding: '6px 12px',
                borderRadius: '10px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1d4ed8',
                fontSize: '11px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(29, 78, 216, 0.12)'
              }}
            >
              <Sparkles size={12} color="#2563eb" />
              <span>✍️ ลายเซ็นทางการ (นวก.รุ่งทิวา)</span>
            </button>
          )}
        </div>
      </div>

      {/* Fullscreen Landscape Signature Modal */}
      {isLandscapeModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '560px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  ✍️ ลายมือชื่อผู้รับการตรวจ (เจ้าของร้าน / ผู้มีอำนาจ)
                </h4>
                <p style={{ fontSize: '10.5px', color: '#64748b', margin: '2px 0 0' }}>
                  {resolvedSigner} • เซ็นชื่อแนวนอนให้ชัดเจน
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLandscapeModalOpen(false)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '10px',
                  background: '#f1f5f9',
                  border: 'none',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Big Landscape Canvas */}
            <div style={{
              position: 'relative',
              border: '2px dashed #059669',
              borderRadius: '14px',
              background: '#f8fafc',
              overflow: 'hidden',
              touchAction: 'none'
            }}>
              <canvas
                ref={modalCanvasRef}
                width={520}
                height={220}
                style={{ width: '100%', height: '220px', display: 'block', cursor: 'crosshair' }}
                onMouseDown={e => {
                  const canvas = modalCanvasRef.current
                  if (!canvas) return
                  const ctx = canvas.getContext('2d')
                  if (!ctx) return
                  setIsModalDrawing(true)
                  ctx.strokeStyle = '#047857'
                  ctx.lineWidth = 3
                  ctx.lineCap = 'round'
                  ctx.lineJoin = 'round'
                  const { x, y } = getCoords(canvas, e)
                  ctx.beginPath()
                  ctx.moveTo(x, y)
                }}
                onMouseMove={e => {
                  if (!isModalDrawing) return
                  const canvas = modalCanvasRef.current
                  if (!canvas) return
                  const ctx = canvas.getContext('2d')
                  if (!ctx) return
                  const { x, y } = getCoords(canvas, e)
                  ctx.lineTo(x, y)
                  ctx.stroke()
                }}
                onMouseUp={() => setIsModalDrawing(false)}
                onTouchStart={e => {
                  const canvas = modalCanvasRef.current
                  if (!canvas) return
                  const ctx = canvas.getContext('2d')
                  if (!ctx) return
                  setIsModalDrawing(true)
                  ctx.strokeStyle = '#047857'
                  ctx.lineWidth = 3
                  ctx.lineCap = 'round'
                  ctx.lineJoin = 'round'
                  const { x, y } = getCoords(canvas, e)
                  ctx.beginPath()
                  ctx.moveTo(x, y)
                }}
                onTouchMove={e => {
                  if (!isModalDrawing) return
                  const canvas = modalCanvasRef.current
                  if (!canvas) return
                  const ctx = canvas.getContext('2d')
                  if (!ctx) return
                  const { x, y } = getCoords(canvas, e)
                  ctx.lineTo(x, y)
                  ctx.stroke()
                }}
                onTouchEnd={() => setIsModalDrawing(false)}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={clearModalCanvas}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ล้างลายเซ็น
              </button>
              <button
                type="button"
                onClick={saveModalSignature}
                style={{
                  padding: '8px 20px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                }}
              >
                ✓ บันทึกลายเซ็นแนวนอน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
