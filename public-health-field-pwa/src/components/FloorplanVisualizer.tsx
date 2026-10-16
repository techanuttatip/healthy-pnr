import React from 'react'
import { Ruler, Sparkles, Sliders, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import { triggerHaptic, playBeep } from '../utils/haptics'

interface FloorplanVisualizerProps {
  widthM: number
  lengthM: number
  onChangeWidth: (w: number) => void
  onChangeLength: (l: number) => void
}

export const FloorplanVisualizer: React.FC<FloorplanVisualizerProps> = ({
  widthM,
  lengthM,
  onChangeWidth,
  onChangeLength
}) => {
  const area = Math.round(widthM * lengthM * 10) / 10
  const isOver200 = area > 200

  // Standard presets for field municipal inspections
  const presets = [
    { label: 'แผงลอย / ซุ้มกาแฟ', w: 4, l: 5, area: 20, icon: '☕' },
    { label: 'ปั๊มน้ำมันหยอดเหรียญ', w: 5, l: 10, area: 50, icon: '⛽' },
    { label: 'ร้านของชำ / มินิมาร์ท', w: 8, l: 10, area: 80, icon: '🏪' },
    { label: 'ร้านอาหารขนาดเล็ก', w: 10, l: 10, area: 100, icon: '🍽️' },
    { label: 'ร้านอาหารมาตรฐาน', w: 10, l: 15, area: 150, icon: '🍜' },
    { label: 'เพดานสูงสุด (แจ้งจัดตั้ง)', w: 10, l: 20, area: 200, icon: '📋' },
    { label: 'ร้านใหญ่ (ต้องขออนุญาต)', w: 12, l: 20, area: 240, icon: '🏢' },
    { label: 'ภัตตาคาร / อู่ซ่อมรถ', w: 15, l: 20, area: 300, icon: '🚗' },
    { label: 'คลังสินค้า / โรงงาน', w: 20, l: 25, area: 500, icon: '🏭' }
  ]

  const handlePreset = (w: number, l: number) => {
    triggerHaptic(30)
    playBeep(750, 0.05)
    onChangeWidth(w)
    onChangeLength(l)
  }

  // Calculate proportional visual box dimensions for the preview canvas (container: 100% x 140px)
  const maxDim = Math.max(widthM, lengthM, 20)
  const previewW = Math.min(Math.max((widthM / maxDim) * 220, 70), 220)
  const previewH = Math.min(Math.max((lengthM / maxDim) * 110, 50), 105)

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '20px',
      border: '1px solid #e2e8f0',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      boxShadow: '0 3px 12px rgba(15, 23, 42, 0.04)'
    }}>
      {/* Header with Title and Legal Status Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: isOver200 ? '#eff6ff' : '#ecfdf5',
            color: isOver200 ? '#1d4ed8' : '#059669',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0
          }}>
            <Ruler size={18} />
          </div>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              ขนาดพื้นที่ & คำนวณเกณฑ์กฎหมาย
            </h4>
            <p style={{ fontSize: '10.5px', color: '#64748b', margin: '2px 0 0 0' }}>
              พ.ร.บ. การสาธารณสุข พ.ศ. ๒๕๓๕
            </p>
          </div>
        </div>

        <span style={{
          fontSize: '10px',
          fontWeight: 800,
          padding: '4px 9px',
          borderRadius: '12px',
          background: isOver200 ? '#eff6ff' : '#ecfdf5',
          color: isOver200 ? '#1d4ed8' : '#059669',
          border: '1px solid ' + (isOver200 ? '#bfdbfe' : '#a7f3d0'),
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          {isOver200 ? 'เกิน ๒๐๐ ตร.ม. (ขอใบอนุญาต)' : 'ไม่เกิน ๒๐๐ ตร.ม. (แจ้งจัดตั้ง)'}
        </span>
      </div>

      {/* Spacious, Minimalist Interactive Store Visualizer Card */}
      <div style={{
        background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '130px',
        position: 'relative'
      }}>
        {/* Proportional Store Box */}
        <div style={{
          width: `${previewW}px`,
          height: `${previewH}px`,
          borderRadius: '12px',
          background: isOver200 ? '#dbeafe' : '#d1fae5',
          border: `2.5px solid ${isOver200 ? '#2563eb' : '#10b981'}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOver200 ? '0 4px 14px rgba(37, 99, 235, 0.15)' : '0 4px 14px rgba(16, 185, 129, 0.15)',
          position: 'relative'
        }}>
          {/* Main Area Readout */}
          <span style={{
            fontSize: '22px',
            fontWeight: 900,
            color: isOver200 ? '#1e40af' : '#065f46',
            lineHeight: 1
          }}>
            {area}
          </span>
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            color: isOver200 ? '#2563eb' : '#047857',
            marginTop: '3px'
          }}>
            ตารางเมตร
          </span>

          {/* Width Indicator Badge (Top) */}
          <span style={{
            position: 'absolute',
            top: '-18px',
            fontSize: '9.5px',
            fontWeight: 800,
            color: '#475569',
            background: '#ffffff',
            padding: '1px 6px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            whiteSpace: 'nowrap'
          }}>
            กว้าง {widthM} ม.
          </span>

          {/* Length Indicator Badge (Right) */}
          <span style={{
            position: 'absolute',
            right: '-18px',
            fontSize: '9.5px',
            fontWeight: 800,
            color: '#475569',
            background: '#ffffff',
            padding: '1px 6px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            transform: 'translateX(50%)',
            whiteSpace: 'nowrap'
          }}>
            ยาว {lengthM} ม.
          </span>

          {/* Minimal Entrance Door Indicator */}
          <div style={{
            position: 'absolute',
            bottom: '-4px',
            width: '28px',
            height: '6px',
            borderRadius: '3px',
            background: '#f59e0b'
          }} />
        </div>

        {/* Live Bottom Calculation Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginTop: '14px',
          paddingTop: '8px',
          borderTop: '1px solid #e2e8f0',
          fontSize: '11px'
        }}>
          <span style={{ color: '#64748b', fontWeight: 600 }}>
            แบบฟอร์ม: <strong style={{ color: '#0f172a' }}>{isOver200 ? 'แบบ บทอ.๒ (ใบอนุญาต)' : 'แบบ นจ.๓ (หนังสือรับรองการแจ้ง)'}</strong>
          </span>
          <span style={{ color: '#64748b', fontWeight: 600 }}>
            ค่าธรรมเนียม: <strong style={{ color: isOver200 ? '#1d4ed8' : '#059669' }}>{isOver200 ? '๓,๐๐๐ บาท/ปี' : '๑,๕๐๐ บาท/ปี'}</strong>
          </span>
        </div>
      </div>

      {/* Touch-Friendly Controls & Large Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Width Control Box */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '12px 14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>
              ความกว้าง (เมตร)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="number"
                min="1"
                max="100"
                step="0.5"
                value={widthM}
                onChange={e => onChangeWidth(Math.max(1, parseFloat(e.target.value) || 1))}
                style={{
                  width: '64px',
                  padding: '3px 6px',
                  borderRadius: '8px',
                  border: '1.5px solid #bfdbfe',
                  background: '#ffffff',
                  color: '#1d4ed8',
                  fontSize: '13px',
                  fontWeight: 800,
                  textAlign: 'center'
                }}
              />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>ม.</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <input
              type="range"
              min="1"
              max="30"
              step="0.5"
              value={widthM}
              onChange={e => {
                triggerHaptic(10)
                onChangeWidth(parseFloat(e.target.value) || 1)
              }}
              className="mobile-range-slider"
              style={{ flex: 1 }}
            />
          </div>

          {/* Quick Increment Buttons for Width */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
            {[-5, -1, -0.5, 0.5, 1, 5].map(step => (
              <button
                key={step}
                type="button"
                onClick={() => {
                  triggerHaptic(15)
                  onChangeWidth(Math.max(1, Math.round((widthM + step) * 10) / 10))
                }}
                style={{
                  padding: '5px 0',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: step > 0 ? '#1d4ed8' : '#b91c1c',
                  cursor: 'pointer'
                }}
              >
                {step > 0 ? `+${step}` : step}
              </button>
            ))}
          </div>
        </div>

        {/* Length Control Box */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '12px 14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>
              ความยาว / ความลึก (เมตร)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="number"
                min="1"
                max="100"
                step="0.5"
                value={lengthM}
                onChange={e => onChangeLength(Math.max(1, parseFloat(e.target.value) || 1))}
                style={{
                  width: '64px',
                  padding: '3px 6px',
                  borderRadius: '8px',
                  border: '1.5px solid #bfdbfe',
                  background: '#ffffff',
                  color: '#1d4ed8',
                  fontSize: '13px',
                  fontWeight: 800,
                  textAlign: 'center'
                }}
              />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>ม.</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <input
              type="range"
              min="1"
              max="30"
              step="0.5"
              value={lengthM}
              onChange={e => {
                triggerHaptic(10)
                onChangeLength(parseFloat(e.target.value) || 1)
              }}
              className="mobile-range-slider"
              style={{ flex: 1 }}
            />
          </div>

          {/* Quick Increment Buttons for Length */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
            {[-5, -1, -0.5, 0.5, 1, 5].map(step => (
              <button
                key={step}
                type="button"
                onClick={() => {
                  triggerHaptic(15)
                  onChangeLength(Math.max(1, Math.round((lengthM + step) * 10) / 10))
                }}
                style={{
                  padding: '5px 0',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: step > 0 ? '#1d4ed8' : '#b91c1c',
                  cursor: 'pointer'
                }}
              >
                {step > 0 ? `+${step}` : step}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preset Buttons Grid (ปุ่มขนาดสำเร็จรูปยอดนิยม กดคลิกเดียวได้ทันที) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={14} className="text-amber-500" />
            <span>ปุ่มลัดเลือกขนาดพื้นที่สำเร็จรูป (แตะเลือกทันที):</span>
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px'
        }}>
          {presets.map(p => {
            const isMatch = widthM === p.w && lengthM === p.l
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => handlePreset(p.w, p.l)}
                style={{
                  padding: '8px 6px',
                  borderRadius: '12px',
                  background: isMatch ? 'linear-gradient(135deg, #1d4ed8, #2563eb)' : '#f8fafc',
                  color: isMatch ? '#ffffff' : '#334155',
                  border: '1px solid ' + (isMatch ? '#1e40af' : '#e2e8f0'),
                  fontSize: '10.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  boxShadow: isMatch ? '0 3px 8px rgba(37, 99, 235, 0.25)' : 'none',
                  transition: 'all 0.15s',
                  textAlign: 'center'
                }}
              >
                <span style={{ fontSize: '14px' }}>{p.icon}</span>
                <span style={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                  {p.area} ตร.ม.
                </span>
                <span style={{ fontSize: '9px', opacity: isMatch ? 0.9 : 0.65, whiteSpace: 'nowrap' }}>
                  {p.w}×{p.l} ม.
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
