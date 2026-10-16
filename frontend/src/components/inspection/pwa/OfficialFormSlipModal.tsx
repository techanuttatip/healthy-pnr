import React from 'react'
import { Printer, X, Check, AlertTriangle, ShieldCheck, Download, Sparkles } from 'lucide-react'
import type { OfficialInspectionFormDef } from '../../../constants/officialForms'
import type { Establishment } from './pwaApi'
import { OFFICIAL_NWK_SIGNATURE_DATA_URL, RUNGTHIWA_OFFICER } from '../../../constants/officialSignature'

interface OfficialFormSlipModalProps {
  isOpen: boolean
  onClose: () => void
  formDef: OfficialInspectionFormDef
  establishment: Establishment
  inspectionDate?: string
  inspectorName?: string
  inspectorPosition?: string
  checkedItems: Record<string, boolean>
  itemNotes?: Record<string, string>
  summaryDecision?: 'approve' | 'reject'
  rejectReason?: string
  otherNotes?: string
  signatureUrl?: string
  areaSqm?: number
}

export const OfficialFormSlipModal: React.FC<OfficialFormSlipModalProps> = ({
  isOpen,
  onClose,
  formDef,
  establishment,
  inspectionDate = new Date().toISOString().split('T')[0],
  inspectorName = RUNGTHIWA_OFFICER.name,
  inspectorPosition = RUNGTHIWA_OFFICER.position,
  checkedItems,
  itemNotes = {},
  summaryDecision = 'approve',
  rejectReason = '',
  otherNotes = '',
  signatureUrl,
  areaSqm
}) => {
  if (!isOpen) return null

  // Auto-pull official signature of นวก. if not explicitly drawn
  const activeSignature = signatureUrl || OFFICIAL_NWK_SIGNATURE_DATA_URL
  const activeInspectorName = inspectorName || RUNGTHIWA_OFFICER.name
  const activeInspectorPosition = inspectorPosition || RUNGTHIWA_OFFICER.position

  const handlePrint = () => {
    window.print()
  }

  const allItems = formDef.categories.flatMap(c => c.items)
  const passedCount = allItems.filter(item => checkedItems[item.id] !== false).length
  const totalCount = allItems.length
  const passPercent = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 100

  // Format date in Thai
  const formatThaiDate = (dStr: string) => {
    try {
      const parts = dStr.split('-')
      if (parts.length < 3) return dStr
      const day = parseInt(parts[2], 10)
      const monthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ]
      const m = monthNames[parseInt(parts[1], 10) - 1] || ''
      const y = parseInt(parts[0], 10) + 543
      return `${day} ${m} ${y}`
    } catch {
      return dStr
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 print:shadow-none print:border-none print:max-w-none print:max-h-none print:w-full print:rounded-none">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="p-3 bg-white border-b border-slate-200 text-slate-800 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
              อบต.
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>{formDef.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  ผ่านเกณฑ์ {passedCount}/{totalCount} ({passPercent}%)
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                {establishment.name} • {formDef.orgName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์เอกสารราชการ (A4)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable A4 Document Sheet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
          {/* Page 1 */}
          <div className="bg-white max-w-[210mm] mx-auto p-8 sm:p-10 shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-4 print:m-0 print:w-full text-slate-900 font-sans text-xs leading-relaxed">
            
            {/* Header matching scanned form */}
            <div className="text-center pb-2 mb-3">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-wide">
                {formDef.title}
              </h1>
              <h2 className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5">
                {formDef.orgName} {formDef.districtName} {formDef.provinceName}
              </h2>
            </div>

            {/* Header info block */}
            {formDef.id === 'hazardous_health' ? (
              <div className="mb-3 space-y-1 text-xs text-slate-800">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold">ลักษณะของกิจการ:</span>{' '}
                    <span className="border-b border-dotted border-slate-600 px-2 font-medium">
                      {establishment.type || 'สถานที่ประกอบกิจการที่เป็นอันตรายต่อสุขภาพ'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">เลขที่ตรวจสอบ:</span>{' '}
                    <span className="border-b border-dotted border-slate-600 px-2 font-mono">
                      {establishment.permitNo || 'รอออกเลขที่'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">ประเภทการตรวจ:</span>
                    <label className="inline-flex items-center gap-1">
                      <input type="checkbox" checked={establishment.permitStatus === 'ปกติ'} readOnly />
                      <span>ขออนุญาตใหม่</span>
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input type="checkbox" checked={establishment.permitStatus !== 'ปกติ'} readOnly />
                      <span>ต่อใบอนุญาต</span>
                    </label>
                  </div>
                  <div>
                    <span className="font-semibold">วันที่ตรวจสอบ:</span>{' '}
                    <span className="border-b border-dotted border-slate-600 px-2">
                      {formatThaiDate(inspectionDate)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <span className="font-semibold">ชื่อสถานประกอบการ:</span>{' '}
                    <span className="border-b border-dotted border-slate-600 px-2 font-medium">
                      {establishment.name}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold">ผู้ครอบครอง:</span>{' '}
                    <span className="border-b border-dotted border-slate-600 px-2 font-medium">
                      {establishment.owner}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="font-semibold">ที่อยู่:</span>{' '}
                  <span className="border-b border-dotted border-slate-600 px-2">
                    {establishment.address} {establishment.village || ''} ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่
                  </span>
                  <span className="font-semibold ml-4">โทรศัพท์:</span>{' '}
                  <span className="border-b border-dotted border-slate-600 px-2 font-mono">
                    {establishment.phone || '-'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mb-3 space-y-1 text-xs text-slate-800">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-semibold">ชื่อสถานประกอบการ:</span>{' '}
                    <span className="border-b border-dotted border-slate-600 px-2 font-medium">
                      {establishment.name}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">ชื่อเจ้าของสถานประกอบการ:</span>{' '}
                    <span className="border-b border-dotted border-slate-600 px-2 font-medium">
                      {establishment.owner}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-semibold">วันที่ตรวจ:</span>{' '}
                    <span className="border-b border-dotted border-slate-600 px-2">
                      {formatThaiDate(inspectionDate)}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">ขนาดพื้นที่:</span>{' '}
                    <span className="border-b border-dotted border-slate-600 px-2 font-bold text-blue-900">
                      {areaSqm || establishment.areaSqm || '145'}
                    </span>{' '}
                    ตารางเมตร
                  </div>
                </div>
              </div>
            )}

            {/* Official Table Matching Scanned PDF */}
            <table className="w-full border-collapse border border-slate-900 text-[11px] mb-4">
              <thead>
                <tr className="bg-slate-50 text-slate-900 font-bold border-b border-slate-900">
                  <th className="border border-slate-900 p-1.5 text-center" style={{ width: formDef.id === 'hazardous_health' ? '18%' : '65%' }}>
                    {formDef.id === 'hazardous_health' ? 'หัวข้อ' : 'เกณฑ์พิจารณาอนุญาต'}
                  </th>
                  {formDef.id === 'hazardous_health' && (
                    <th className="border border-slate-900 p-1.5 text-center" style={{ width: '47%' }}>
                      รายละเอียด
                    </th>
                  )}
                  <th className="border border-slate-900 p-1 text-center" colSpan={2} style={{ width: '18%' }}>
                    ผลการตรวจ
                    <div className="flex border-t border-slate-900 mt-1">
                      <div className="w-1/2 text-center py-0.5 border-r border-slate-900">ผ่าน</div>
                      <div className="w-1/2 text-center py-0.5">ไม่ผ่าน</div>
                    </div>
                  </th>
                  <th className="border border-slate-900 p-1.5 text-center" style={{ width: '17%' }}>
                    หมายเหตุ
                  </th>
                </tr>
              </thead>
              <tbody>
                {formDef.categories.map(cat => (
                  <React.Fragment key={cat.id}>
                    {/* Category Title Row */}
                    <tr className="bg-slate-100 font-bold border-t border-b border-slate-900">
                      <td
                        colSpan={formDef.id === 'hazardous_health' ? 5 : 4}
                        className="border border-slate-900 px-2 py-1 text-slate-900 text-[11.5px]"
                      >
                        {cat.title}
                      </td>
                    </tr>

                    {/* Criteria Item Rows */}
                    {cat.items.map(item => {
                      const isPassed = checkedItems[item.id] !== false
                      const note = itemNotes[item.id] || ''

                      if (formDef.id === 'hazardous_health') {
                        return (
                          <tr key={item.id} className="border-b border-slate-400">
                            <td className="border border-slate-900 px-2 py-1 text-slate-600 text-center font-mono text-[10px]">
                              {cat.title.split(' ')[0]} {cat.title.split(' ')[1]}
                            </td>
                            <td className="border border-slate-900 px-2 py-1 text-slate-900">
                              <span className="font-bold mr-1.5">{item.code}</span>
                              <span>{item.label}</span>
                            </td>
                            <td className="border border-slate-900 p-1 text-center font-bold text-emerald-800">
                              {isPassed ? '✓' : ''}
                            </td>
                            <td className="border border-slate-900 p-1 text-center font-bold text-red-700">
                              {!isPassed ? '✗' : ''}
                            </td>
                            <td className="border border-slate-900 px-2 py-1 text-slate-600 text-[10.5px]">
                              {note || (isPassed ? 'ถูกต้อง' : 'ต้องแก้ไข')}
                            </td>
                          </tr>
                        )
                      }

                      return (
                        <tr key={item.id} className="border-b border-slate-400">
                          <td className="border border-slate-900 px-2 py-1 text-slate-900">
                            <span className="font-bold mr-1.5">{item.code}</span>
                            <span>{item.label}</span>
                          </td>
                          <td className="border border-slate-900 p-1 text-center font-bold text-emerald-800">
                            {isPassed ? '✓' : ''}
                          </td>
                          <td className="border border-slate-900 p-1 text-center font-bold text-red-700">
                            {!isPassed ? '✗' : ''}
                          </td>
                          <td className="border border-slate-900 px-2 py-1 text-slate-600 text-[10.5px]">
                            {note || (isPassed ? 'เรียบร้อย' : 'ต้องแก้ไข')}
                          </td>
                        </tr>
                      )
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* Summary & Suggestions for Hazardous Form */}
            {formDef.id === 'hazardous_health' && (
              <div className="space-y-2 mb-4 text-xs">
                <div className="p-2 border border-slate-900 rounded">
                  <div className="font-bold mb-1">สรุปผลการตรวจ:</div>
                  <div className="flex items-center gap-6">
                    <label className="inline-flex items-center gap-1.5">
                      <input type="checkbox" checked={summaryDecision === 'approve'} readOnly />
                      <span className="font-semibold text-emerald-900">เห็นสมควรอนุญาต</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5">
                      <input type="checkbox" checked={summaryDecision === 'reject'} readOnly />
                      <span className="font-semibold text-red-900">
                        ไม่เห็นสมควรอนุญาต เนื่องจาก: <span className="border-b border-dotted border-slate-600 px-2 font-normal">{rejectReason || '...................................................'}</span>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="p-2 border border-slate-900 rounded">
                  <div className="font-bold mb-0.5">ข้อเสนอแนะอื่นๆ:</div>
                  <p className="border-b border-dotted border-slate-600 pb-1 text-slate-700">
                    {otherNotes || 'ปฏิบัติตามมาตรฐานสุขอนามัยอย่างเคร่งครัด สวมอุปกรณ์คุ้มครองความปลอดภัยส่วนบุคคล (PPE) และบำรุงรักษาถังดับเพลิงประจำทุกเดือน'}
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Signatures Block */}
            <div className="pt-3 mt-4 border-t border-slate-400 grid grid-cols-2 gap-8 text-xs">
              <div className="text-center space-y-1">
                <div>ลงชื่อ.................................................... เจ้าของกิจการ</div>
                <div className="text-slate-600">({establishment.owner})</div>
              </div>

              <div className="text-center space-y-1">
                <div className="relative inline-block">
                  <div>ลงชื่อ.................................................... ผู้ตรวจ</div>
                  {activeSignature && (
                    <img
                      src={activeSignature}
                      alt="ลายเซ็นผู้ตรวจ (นวก.)"
                      className="absolute -top-7 left-1/2 -translate-x-1/2 h-11 object-contain pointer-events-none"
                    />
                  )}
                </div>
                <div className="font-semibold text-slate-900">({activeInspectorName})</div>
                <div className="text-[10px] text-slate-600">{activeInspectorPosition} • อบต.โป่งน้ำร้อน</div>
              </div>
            </div>

            {/* Page 2: Authorities Order (for Hazardous Health Form) */}
            {formDef.id === 'hazardous_health' && (
              <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-400 print:break-before-page">
                <div className="grid grid-cols-2 gap-4 border border-slate-900 p-4">
                  {/* Left Column: ความเห็นของเจ้าพนักงานสาธารณสุข */}
                  <div className="space-y-3 pr-2 border-r border-slate-900">
                    <h3 className="font-bold text-center text-slate-900">
                      ความเห็นของเจ้าพนักงานสาธารณสุข
                    </h3>
                    <p className="text-[11px] text-slate-700">จากการตรวจสอบสถานประกอบการ</p>
                    <div className="space-y-1.5 pl-2">
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" checked={summaryDecision === 'approve'} readOnly />
                        <span>เห็นสมควรอนุญาต</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" checked={summaryDecision === 'reject'} readOnly />
                        <span>เห็นไม่สมควรอนุญาต เพราะ........................</span>
                      </label>
                    </div>

                    <div className="pt-6 text-center space-y-1 text-xs">
                      <div className="relative inline-block">
                        <div>(ลงชื่อ)............................................เจ้าพนักงานสาธารณสุข</div>
                        {activeSignature && (
                          <img
                            src={activeSignature}
                            alt="ลายเซ็นเจ้าพนักงานสาธารณสุข (นวก.)"
                            className="absolute -top-7 left-1/2 -translate-x-1/2 h-11 object-contain pointer-events-none"
                          />
                        )}
                      </div>
                      <div className="font-semibold text-slate-900">({activeInspectorName})</div>
                      <div className="text-[10.5px] text-slate-600">ตำแหน่ง {activeInspectorPosition}</div>
                      <div className="text-[10px] text-slate-500">วันที่ {formatThaiDate(inspectionDate)}</div>
                    </div>
                  </div>

                  {/* Right Column: คำสั่งของพนักงานท้องถิ่น */}
                  <div className="space-y-3 pl-2">
                    <h3 className="font-bold text-center text-slate-900">
                      คำสั่งของพนักงานท้องถิ่น
                    </h3>
                    <div className="space-y-1.5 pl-2 pt-4">
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" checked={summaryDecision === 'approve'} readOnly />
                        <span className="font-bold text-emerald-900">เห็นสมควรอนุญาต</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" checked={summaryDecision === 'reject'} readOnly />
                        <span>เห็นไม่สมควรอนุญาต</span>
                      </label>
                    </div>

                    <div className="pt-6 text-center space-y-1 text-xs">
                      <div>(ลงชื่อ).......................................................</div>
                      <div className="font-bold">({formDef.councilLeaderName || 'นายสมคิด พงษ์สุข'})</div>
                      <div className="text-[10.5px] text-slate-700">ตำแหน่ง {formDef.councilLeaderPosition || 'นายกองค์การบริหารส่วนตำบล'}</div>
                      <div className="text-[10px] text-slate-500">วันที่ {formatThaiDate(inspectionDate)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}
