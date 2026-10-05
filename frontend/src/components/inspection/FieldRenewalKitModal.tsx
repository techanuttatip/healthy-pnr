import React, { useState } from 'react';
import type { Establishment, SystemSettings } from '../../types/publicHealth';
import { DEFAULT_SYSTEM_SETTINGS } from '../../types/publicHealth';
import { X, Printer, FileText, CheckSquare, ClipboardList, Layers } from 'lucide-react';
import { toThaiDigits, thaiBahtText, formatThaiDate, CitizenIdBoxes } from '../../utils/thaiFormatters';

interface FieldRenewalKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  establishment: Establishment;
  settings?: SystemSettings;
  targetYear?: number;
}

type PreviewTab = 'all' | 'form_app' | 'form_inspect' | 'form_memo';

export const FieldRenewalKitModal: React.FC<FieldRenewalKitModalProps> = ({
  isOpen,
  onClose,
  establishment,
  settings,
  targetYear = 2570
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<PreviewTab>('form_app');
  const [showStamp, setShowStamp] = useState<boolean>(true);

  const currentSettings = settings || DEFAULT_SYSTEM_SETTINGS;
  const orgName = currentSettings.organizationName || 'องค์การบริหารส่วนตำบลโป่งน้ำร้อน';
  const cleanDistrict = (currentSettings.district || 'อำเภอฝาง').replace(/^อำเภอ\s*/, '');
  const cleanProvince = (currentSettings.province || 'จังหวัดเชียงใหม่').replace(/^จังหวัด\s*/, '');
  const inspectorOfficer = currentSettings.signatories?.officerName || 'นางสาวรุ่งทิวา อุปนันท์';
  const inspectorPosition = currentSettings.signatories?.officerPosition || 'นักวิชาการสาธารณสุขปฏิบัติการ';

  const dateInfo = formatThaiDate();

  const isHazardous = establishment.category === 'hazardous' || establishment.regType === 'บทส';
  const isFoodNotice = establishment.category === 'food_notice' || establishment.regType === 'นจ';
  const formCodeName = isHazardous ? 'แบบ อภ.๑' : isFoodNotice ? 'แบบ นจ.๑' : 'แบบ บทอ.๑';
  const formTypeName = isHazardous
    ? 'ประกอบกิจการที่เป็นอันตรายต่อสุขภาพ'
    : isFoodNotice
    ? 'จัดตั้งสถานที่จำหน่ายหรือสะสมอาหาร (พื้นที่ไม่เกิน ๒๐๐ ตารางเมตร)'
    : 'จัดตั้งสถานที่จำหน่ายหรือสะสมอาหาร (พื้นที่เกิน ๒๐๐ ตารางเมตร)';

  const feeVal = establishment.feeAmount || 100;
  const feeText = thaiBahtText(feeVal);
  const houseNo = establishment.address.split(' ')[0] || '๒๑๔';

  const handlePrint = (tabToPrint?: PreviewTab) => {
    if (tabToPrint) {
      setActiveTab(tabToPrint);
      setTimeout(() => {
        window.print();
      }, 150);
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto modal-print-container print:p-0 print:bg-white print:static print:inset-auto">
      {/* Container */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[96vh] flex flex-col overflow-hidden border border-slate-200 modal-print-window print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* ================= TOP CONTROL BAR (Hidden in print) ================= */}
        <div className="p-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between shrink-0 print:hidden shadow-md gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center font-bold text-white text-base shadow-xs shrink-0">
              📋
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold flex items-center gap-2">
                <span>ชุดเอกสารเตรียมลงพื้นที่บุกต่ออายุ (Pre-filled Kit)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-mono">
                  ปีงบประมาณ พ.ศ. {toThaiDigits(targetYear)}
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                {establishment.businessName} • {establishment.ownerName} ({establishment.village})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Rubber Stamp */}
            <label className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-700">
              <input
                type="checkbox"
                checked={showStamp}
                onChange={(e) => setShowStamp(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-0 cursor-pointer"
              />
              <span>เลเยอร์ตรายาง อปท. (เอียง ๘°)</span>
            </label>

            {/* Print Current Tab */}
            <button
              type="button"
              onClick={() => handlePrint()}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
              title="สั่งพิมพ์หน้าตัวอย่างเอกสารฉบับปัจจุบัน"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ฉบับนี้ (A4)</span>
            </button>

            {/* Print Entire Kit */}
            <button
              type="button"
              onClick={() => handlePrint('all')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
              title="สั่งพิมพ์ชุดเอกสารครบทุกฉบับ (๓ หน้า A4)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>พิมพ์ทั้งชุด (๓ หน้า)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= DOCUMENT SELECTOR TABS (Hidden in print) ================= */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto print:hidden shrink-0">
          <span className="text-xs font-bold text-slate-600 shrink-0">สลับดูตัวอย่าง (Live Preview):</span>
          
          <button
            type="button"
            onClick={() => setActiveTab('form_app')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === 'form_app'
                ? 'bg-white text-blue-700 shadow-xs border border-blue-200 ring-2 ring-blue-500/20'
                : 'text-slate-600 hover:bg-white/80'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>ฉบับที่ ๑: แบบคำขอ ({formCodeName}) [A4 ๑ หน้า]</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('form_inspect')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === 'form_inspect'
                ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200 ring-2 ring-emerald-500/20'
                : 'text-slate-600 hover:bg-white/80'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>ฉบับที่ ๒: แบบตรวจประเมินสุขลักษณะ [A4 ๑ หน้า]</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('form_memo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === 'form_memo'
                ? 'bg-white text-amber-700 shadow-xs border border-amber-200 ring-2 ring-amber-500/20'
                : 'text-slate-600 hover:bg-white/80'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
            <span>ฉบับที่ ๓: บันทึกข้อความ & ใบรับคำขอ [A4 ๑ หน้า]</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ml-auto ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ดูต่อเนื่องทั้งชุด (๓ หน้า)</span>
          </button>
        </div>

        {/* ================= DOCUMENT VIEWER / SCROLL AREA ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/70 print:bg-white print:p-0 print:overflow-visible print:m-0">
          
          <div id="printable-field-kit" className="max-w-[210mm] mx-auto space-y-8 print:space-y-0 print:m-0 print:w-full">
            
            {/* ========================================================================= */}
            {/* ๑. ฉบับที่ ๑: แบบคำขอรับใบอนุญาต/ต่ออายุใบอนุญาต (A4 ๑ หน้า เป๊ะ) */}
            {/* ========================================================================= */}
            {(activeTab === 'all' || activeTab === 'form_app') && (
              <div className="bg-white mx-auto shadow-md border border-slate-300 print:shadow-none print:border-none print:m-0 text-slate-900 font-sans leading-relaxed relative page-break-after box-border p-8 sm:p-11 print:p-8 w-[210mm] min-h-[297mm] flex flex-col justify-between">
                <div>
                  {/* Top Header: Form Code (ขวาบน) - แบบคำขอต้องไม่มีตราครุฑ */}
                  <div className="flex justify-end mb-3">
                    <div className="text-right text-xs font-bold text-slate-800">
                      {formCodeName}
                    </div>
                  </div>

                  {/* Title Header */}
                  <div className="text-center font-bold space-y-0.5 mb-3">
                    <div className="text-base sm:text-lg">แบบคำขอรับใบอนุญาต / ต่ออายุใบอนุญาต</div>
                    <div className="text-xs sm:text-sm text-slate-800">
                      {formTypeName}
                    </div>
                  </div>

                  {/* Reference Box & Location Header */}
                  <div className="flex justify-between items-start my-3 text-xs">
                    {/* กล่อง (สำหรับเจ้าหน้าที่กรอก) แบบเดิม: คำขอเลขที่ เว้นว่างไว้สำหรับเขียนด้วยมือ */}
                    <div className="border border-slate-400 p-2.5 rounded-sm w-48 bg-slate-50/50">
                      <div className="text-[11px] text-slate-600 mb-1">(สำหรับเจ้าหน้าที่กรอก)</div>
                      <div className="flex items-baseline">
                        <span className="shrink-0">คำขอเลขที่</span>
                        <span className="flex-1 border-b border-dotted border-slate-600 ml-1.5 h-3.5"></span>
                      </div>
                    </div>

                    <div className="text-right space-y-1 text-xs">
                      <div>เขียนที่ <span className="font-bold">{orgName}</span></div>
                      <div>
                        วันที่ <span className="font-bold underline decoration-dotted px-1">{dateInfo.dayStr}</span> เดือน <span className="font-bold underline decoration-dotted px-1">{dateInfo.monthStr}</span> พ.ศ. <span className="font-bold underline decoration-dotted px-1">{toThaiDigits(targetYear)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Applicant Profile */}
                  <div className="space-y-2 mt-3 text-justify text-xs sm:text-[13px] leading-relaxed">
                    <div className="leading-loose">
                      <span className="font-bold mr-1">๑. ข้าพเจ้า</span>
                      <span className="font-bold underline decoration-dotted px-2">{establishment.ownerName}</span>
                      <span className="ml-2">อายุ</span> <span className="font-bold underline decoration-dotted px-2">๓๕</span> ปี
                      <span className="ml-2">สัญชาติ</span> <span className="font-bold underline decoration-dotted px-2">ไทย</span>
                    </div>

                    {/* เลขบัตรประชาชน: ๑๓ ช่องสี่เหลี่ยมแยกทางการ [ ๑ ] - [ ๔ ช่อง ] - [ ๕ ช่อง ] - [ ๒ ช่อง ] - [ ๑ ] */}
                    <div className="leading-loose flex items-center flex-wrap gap-1.5">
                      <span>เลขประจำตัวประชาชน</span>
                      <CitizenIdBoxes citizenId={establishment.citizenId} />
                    </div>

                    <div className="leading-loose">
                      อยู่บ้านเลขที่ <span className="font-bold underline decoration-dotted px-2">{toThaiDigits(houseNo)}</span>
                      <span className="ml-2">{establishment.village}</span>
                      <span className="ml-2">ตำบล <span className="font-bold underline decoration-dotted px-1">โป่งน้ำร้อน</span></span>
                      <span className="ml-2">อำเภอ <span className="font-bold underline decoration-dotted px-1">{cleanDistrict}</span></span>
                      <span className="ml-2">จังหวัด <span className="font-bold underline decoration-dotted px-1">{cleanProvince}</span></span>
                    </div>

                    <div className="leading-loose">
                      หมายเลขโทรศัพท์ <span className="font-bold font-mono underline decoration-dotted px-2">{toThaiDigits(establishment.phone)}</span>
                      <span className="ml-2">ขอยื่นคำขอต่ออายุใบอนุญาตสำหรับสถานประกอบการชื่อ</span>
                      <span className="font-bold underline decoration-dotted px-2">{establishment.businessName}</span>
                    </div>

                    <div className="leading-loose">
                      ประเภทกิจการ <span className="font-bold underline decoration-dotted px-2">{establishment.categoryName}</span>
                      {establishment.areaSqm ? <span className="ml-2">พื้นที่ประกอบการ <span className="font-bold underline decoration-dotted px-1">{toThaiDigits(establishment.areaSqm)}</span> ตารางเมตร</span> : null}
                      {establishment.workerCount ? <span className="ml-2">จำนวนคนงาน <span className="font-bold underline decoration-dotted px-1">{toThaiDigits(establishment.workerCount)}</span> คน</span> : null}
                    </div>

                    <div className="leading-loose">
                      อัตราค่าธรรมเนียมตามข้อบัญญัติท้องถิ่น: <span className="font-bold underline decoration-dotted px-2">{toThaiDigits(feeVal)}</span> บาท (<span className="font-bold underline decoration-dotted px-1">{feeText}</span>)
                    </div>

                    {/* Section 2: Attached Evidence Clauses (๑)-(๕) ตามกฎกระทรวงสุขลักษณะฯ พ.ศ. ๒๕๖๑ */}
                    <div className="pt-2">
                      <div className="font-bold mb-1">
                        ๒. พร้อมคำขอนี้ ข้าพเจ้าได้แนบเอกสารและหลักฐานต่างๆ ตามกฎกระทรวงสุขลักษณะฯ พ.ศ. ๒๕๖๑ มาด้วยแล้ว ดังนี้
                      </div>
                      <div className="space-y-1 pl-6 text-xs text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-base text-slate-800 font-mono">☐</span>
                          <span>(๑) สำเนาบัตรประจำตัวประชาชนของผู้ขอรับใบอนุญาต หรือผู้มีอำนาจลงนามแทนนิติบุคคล</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-base text-slate-800 font-mono">☐</span>
                          <span>(๒) สำเนาทะเบียนบ้านของสถานที่ตั้งสถานประกอบการ หรือหนังสือยินยอมให้ใช้อาคารสถานที่</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-base text-slate-800 font-mono">☐</span>
                          <span>(๓) หลักฐานการผ่านการอบรมสุขาภิบาลอาหาร หรือผลตรวจประเมินสุขลักษณะสถานที่ตามเกณฑ์มาตรฐาน</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-base text-slate-800 font-mono">☐</span>
                          <span>(๔) แผนที่สังเขปแสดงสถานที่ตั้งสถานประกอบการ พร้อมแผนผังแสดงบริเวณการดำเนินกิจการ</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-base text-slate-800 font-mono">☐</span>
                          <span>(๕) หนังสือมอบอำนาจพร้อมสำเนาบัตรประจำตัวประชาชนของผู้มอบและผู้รับมอบอำนาจ (กรณีดำเนินการแทน)</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 text-center text-xs font-semibold">
                      ขอรับรองว่าข้อความในคำขอนี้เป็นความจริงทุกประการ และยินยอมปฏิบัติตามกฎกระทรวงและข้อบัญญัติ อปท. ทุกประการ
                    </div>
                  </div>
                </div>

                {/* Bottom Signature Section */}
                <div className="pt-4 pb-2 border-t border-slate-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center space-y-1">
                      <div className="text-xs">
                        (ลงชื่อ) .............................................................. ผู้ขอรับใบอนุญาต
                      </div>
                      <div className="font-bold text-xs text-slate-800">
                        ( {establishment.ownerName} )
                      </div>
                    </div>

                    <div className="text-center space-y-1 relative">
                      {showStamp && (
                        <div className="absolute right-0 -top-8 pointer-events-none select-none opacity-40 transform rotate-[-8deg] print:opacity-35">
                          <div className="w-24 h-24 rounded-full border-2 border-dashed border-red-600 p-1 flex items-center justify-center">
                            <div className="w-full h-full rounded-full border border-red-600 p-1 flex flex-col items-center justify-center text-center text-red-600 text-[7px] font-bold leading-tight">
                              <div>กองสาธารณสุขและสิ่งแวดล้อม</div>
                              <div className="text-[9px] my-0.5 font-extrabold">★ อบต.โป่งน้ำร้อน ★</div>
                              <div className="text-[7.5px] text-red-700">รับคำขอตรวจสอบ</div>
                              <div className="text-[6.5px] text-red-600 font-mono">อ.ฝาง จ.เชียงใหม่</div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="text-xs">
                        (ลงชื่อ) .............................................................. เจ้าหน้าที่ผู้รับคำขอ
                      </div>
                      <div className="font-bold text-xs text-slate-800">
                        ( {inspectorOfficer} )
                      </div>
                      <div className="text-[10px] text-slate-600">
                        {inspectorPosition}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* ๒. ฉบับที่ ๒: แบบตรวจสอบสุขลักษณะสถานที่จริง (บีบเหลือ A4 ๑ หน้าจบ) */}
            {/* ========================================================================= */}
            {(activeTab === 'all' || activeTab === 'form_inspect') && (
              <div className="bg-white mx-auto shadow-md border border-slate-300 print:shadow-none print:border-none print:m-0 text-slate-900 font-sans leading-tight relative page-break-after box-border p-6 sm:p-8 print:p-6 w-[210mm] min-h-[297mm] flex flex-col justify-between">
                <div>
                  {/* Header */}
                  <div className="text-center space-y-0.5 mb-2 pb-1.5 border-b-2 border-slate-900">
                    <div className="font-bold text-sm sm:text-base">
                      แบบบันทึกผลการตรวจสอบการประกอบกิจการที่เป็นอันตรายต่อสุขภาพ / สุขาภิบาล
                    </div>
                    <div className="font-semibold text-[11px] sm:text-xs text-slate-800">
                      {orgName} อำเภอ{cleanDistrict} จังหวัด{cleanProvince}
                    </div>
                  </div>

                  {/* Metadata Card */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] mb-2 bg-slate-50/80 p-2.5 rounded-sm border border-slate-300 leading-tight">
                    <div>
                      <span className="font-semibold">ลักษณะของกิจการ:</span>{' '}
                      <span className="font-bold underline decoration-dotted">{establishment.categoryName}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">ประจำปีงบประมาณ:</span>{' '}
                      <span className="font-bold underline decoration-dotted">พ.ศ. {toThaiDigits(targetYear)}</span>
                    </div>

                    <div>
                      <span className="font-semibold">ประเภทการตรวจ:</span>{' '}
                      <span className="text-slate-800 mr-2">☐ ขออนุญาตใหม่</span>
                      <span className="text-slate-800">☑ ต่ออายุใบอนุญาต</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">วันที่ตรวจ:</span>{' '}
                      <span className="font-bold underline decoration-dotted">{dateInfo.fullThaiDate}</span>
                    </div>

                    <div className="col-span-2">
                      <span className="font-semibold">ชื่อสถานประกอบการ:</span>{' '}
                      <span className="font-bold underline decoration-dotted">{establishment.businessName}</span>
                      <span className="ml-4 font-semibold">ผู้ประกอบการ:</span>{' '}
                      <span className="font-bold underline decoration-dotted">{establishment.ownerName}</span>
                    </div>

                    <div className="col-span-2">
                      <span className="font-semibold">ที่ตั้งสถานที่:</span>{' '}
                      <span className="underline decoration-dotted">{establishment.address}</span>
                      <span className="ml-3 font-semibold">โทรศัพท์:</span>{' '}
                      <span className="font-bold font-mono underline decoration-dotted">{toThaiDigits(establishment.phone)}</span>
                    </div>
                  </div>

                  {/* Unified Checklist Table (All 4 Categories) */}
                  <table className="w-full border-collapse border border-slate-600 text-[10.5px] leading-tight mb-2">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-bold">
                        <th className="border border-slate-600 py-1 px-1.5 text-center w-32">หมวดข้อกำหนด</th>
                        <th className="border border-slate-600 py-1 px-1.5 text-center">รายการตรวจสอบสุขลักษณะและความปลอดภัย</th>
                        <th className="border border-slate-600 py-1 px-1.5 text-center w-12">ผ่าน</th>
                        <th className="border border-slate-600 py-1 px-1.5 text-center w-12">ไม่ผ่าน</th>
                        <th className="border border-slate-600 py-1 px-1.5 text-center w-24">ข้อเสนอแนะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-600 p-1.5 font-bold align-top bg-slate-50/40">
                          หมวดที่ ๑<br/>เอกสารและใบอนุญาต
                        </td>
                        <td className="border border-slate-600 p-1.5 space-y-0.5">
                          <div>๑) แสดงใบอนุญาตหรือหนังสือรับรองในที่เปิดเผยเห็นได้ง่าย</div>
                          <div>๒) มีสมุดบันทึกประวัติการบำรุงรักษาหรือการตรวจสอบประจำปี</div>
                          <div>๓) ผู้ปฏิบัติงานมีใบรับรองการอบรมหรือตรวจสุขภาพตามเกณฑ์</div>
                        </td>
                        <td className="border border-slate-600 p-1 text-center align-middle"></td>
                        <td className="border border-slate-600 p-1 text-center align-middle"></td>
                        <td className="border border-slate-600 p-1 text-center align-middle"></td>
                      </tr>

                      <tr>
                        <td className="border border-slate-600 p-1.5 font-bold align-top bg-slate-50/40">
                          หมวดที่ ๒<br/>สถานที่ตั้ง โครงสร้าง และสุขาภิบาล
                        </td>
                        <td className="border border-slate-600 p-1.5 space-y-0.5">
                          <div>๑) โครงสร้างอาคาร แท่นจ่าย หรือพื้นที่ปฏิบัติงานมั่นคงแข็งแรง</div>
                          <div>๒) มีการจัดแสงสว่างและการระบายอากาศอย่างเหมาะสม ไม่อับทึบ</div>
                          <div>๓) มีภาชนะรองรับขยะมูลฝอยที่มีฝาปิดมิดชิด ไม่รั่วซึม</div>
                          <div>๔) รักษาความสะอาดบริเวณโดยรอบอย่างต่อเนื่องสม่ำเสมอ</div>
                        </td>
                        <td className="border border-slate-600 p-1 text-center align-middle"></td>
                        <td className="border border-slate-600 p-1 text-center align-middle"></td>
                        <td className="border border-slate-600 p-1 text-center align-middle"></td>
                      </tr>

                      <tr>
                        <td className="border border-slate-600 p-1.5 font-bold align-top bg-slate-50/40">
                          หมวดที่ ๓<br/>การอาชีวอนามัย และความปลอดภัย
                        </td>
                        <td className="border border-slate-600 p-1.5 space-y-0.5">
                          <div>๑) เครื่องดับเพลิงพร้อมใช้งานในจุดที่หยิบใช้ง่าย (ไม่เกิน ๒๐ เมตร)</div>
                          <div>๒) มีป้ายเตือน "ห้ามสูบบุหรี่" และป้ายเตือนความปลอดภัยชัดเจน</div>
                          <div>๓) ระบบตัดวงจรไฟฟ้าฉุกเฉินและสายดินทำงานได้สมบูรณ์</div>
                        </td>
                        <td className="border border-slate-600 p-1 text-center align-middle"></td>
                        <td className="border border-slate-600 p-1 text-center align-middle"></td>
                        <td className="border border-slate-600 p-1 text-center align-middle"></td>
                      </tr>

                      <tr>
                        <td className="border border-slate-600 p-1.5 font-bold align-top bg-slate-50/40">
                          หมวดที่ ๔<br/>การควบคุมของเสีย มลพิษ และเหตุรำคาญ
                        </td>
                        <td className="border border-slate-600 p-1.5 space-y-0.5">
                          <div>๑) มีถาดหรือวัสดุดูดซับรองรับกรณีมีน้ำมันรั่วไหลหรือหยดเปื้อน</div>
                          <div>๒) ระบบระบายน้ำไม่ปล่อยคราบไขมันหรือสารเคมีลงทางสาธารณะ</div>
                          <div>๓) ไม่ก่อให้เกิดเสียง กลิ่น ควัน หรือเหตุรำคาญแก่ชุมชนข้างเคียง</div>
                        </td>
                        <td className="border border-slate-600 p-1 text-center align-middle"></td>
                        <td className="border border-slate-600 p-1 text-center align-middle"></td>
                        <td className="border border-slate-600 p-1 text-center align-middle"></td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Official Conclusion Box */}
                  <div className="border border-slate-700 p-2 rounded-sm space-y-1 text-[11px] mb-2 bg-slate-50/50 leading-tight">
                    <div className="font-bold text-slate-900">สรุปผลการตรวจและคำสั่งของเจ้าพนักงานสาธารณสุข:</div>
                    
                    <div className="space-y-1 pl-2">
                      <label className="flex items-center gap-2 text-slate-800">
                        <span className="text-sm font-mono">☐</span>
                        <span className="font-bold">เห็นสมควรอนุญาตต่ออายุใบอนุญาตได้ (ผ่านเกณฑ์มาตรฐาน ๑๐๐%)</span>
                      </label>
                      <label className="flex items-center gap-2 text-slate-800">
                        <span className="text-sm font-mono">☐</span>
                        <span className="font-bold">มีคำสั่งให้ปรับปรุงแก้ไขตามเงื่อนไข ให้แล้วเสร็จภายใน .......... วัน (ไม่เกิน ๓๐ วัน)</span>
                      </label>
                    </div>

                    <div className="pt-1 text-[10.5px] text-slate-700">
                      ข้อบกพร่องที่ต้องแก้ไข: ........................................................................................................................................................<br/>
                      ........................................................................................................................................................................................
                    </div>
                  </div>
                </div>

                {/* Signatures for Both Parties */}
                <div className="pt-2 border-t border-slate-300">
                  <div className="grid grid-cols-2 gap-6 text-center">
                    <div className="space-y-0.5">
                      <div className="text-[11px]">
                        (ลงชื่อ) ................................................................. เจ้าของ/ผู้ครอบครองสถานที่
                      </div>
                      <div className="font-bold text-[11px] text-slate-800">
                        ( {establishment.ownerName} )
                      </div>
                      <div className="text-[10px] text-slate-500">
                        วันที่ {dateInfo.fullThaiDate}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[11px]">
                        (ลงชื่อ) ................................................................. เจ้าพนักงานผู้ตรวจสุขลักษณะ
                      </div>
                      <div className="font-bold text-[11px] text-slate-800">
                        ( {inspectorOfficer} )
                      </div>
                      <div className="text-[10px] text-slate-700">
                        {inspectorPosition}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ๓. ฉบับที่ ๓: บันทึกข้อความตรวจสอบ & ใบรับคำขอชั่วคราว (A4 ๑ หน้า) */}
            {/* ========================================================================= */}
            {(activeTab === 'all' || activeTab === 'form_memo') && (
              <div className="bg-white mx-auto shadow-md border border-slate-300 print:shadow-none print:border-none print:m-0 text-slate-900 font-sans leading-relaxed relative page-break-after box-border p-8 sm:p-11 print:p-8 w-[210mm] min-h-[297mm] flex flex-col justify-between">
                <div>
                  {/* Top Garuda for Official Memorandum */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="pt-1">
                      <img
                        src="/garuda.png"
                        alt="ตราครุฑ"
                        className="h-16 w-auto object-contain select-none"
                      />
                    </div>
                    <div className="text-center font-bold text-lg pt-4 flex-1">
                      บันทึกข้อความ
                    </div>
                    <div className="w-16"></div>
                  </div>

                  {/* Memorandum Header Info */}
                  <div className="border-b border-slate-400 pb-2 text-xs space-y-1 mb-3">
                    <div className="flex">
                      <span className="font-bold w-24">ส่วนราชการ:</span>
                      <span>กองสาธารณสุขและสิ่งแวดล้อม {orgName} โทร. ๐๕๓-๘๑๐๓๑๗</span>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex">
                        <span className="font-bold w-24">ที่:</span>
                        <span>ชม ๗๗๖๐๔ / ....................................</span>
                      </div>
                      <div className="flex">
                        <span className="font-bold mr-2">วันที่:</span>
                        <span>{dateInfo.fullThaiDate}</span>
                      </div>
                    </div>
                    <div className="flex">
                      <span className="font-bold w-24">เรื่อง:</span>
                      <span className="font-bold">การตรวจประเมินสุขลักษณะสถานที่เพื่อพิจารณาต่ออายุใบอนุญาต ประจำปี พ.ศ. {toThaiDigits(targetYear)}</span>
                    </div>
                  </div>

                  {/* Memorandum Content */}
                  <div className="text-xs sm:text-[13px] text-justify space-y-2 leading-relaxed">
                    <p className="indent-8">
                      <span className="font-bold">เรียน</span> นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน
                    </p>
                    <p className="indent-8">
                      ตามที่ <span className="font-bold">{establishment.ownerName}</span> ผู้ประกอบการ <span className="font-bold">"{establishment.businessName}"</span> ตั้งอยู่เลขที่ {toThaiDigits(houseNo)} {establishment.village} ตำบลโป่งน้ำร้อน ได้ยื่นคำขอต่ออายุใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ/สุขาภิบาล ประจำปีงบประมาณ พ.ศ. {toThaiDigits(targetYear)} นั้น
                    </p>
                    <p className="indent-8">
                      เจ้าพนักงานสาธารณสุขได้ลงพื้นที่ตรวจสอบสภาพข้อเท็จจริงและความปลอดภัยของสถานประกอบการตามหลักเกณฑ์ของ พ.ร.บ.การสาธารณสุข พ.ศ. ๒๕๓๕ และกฎกระทรวงสุขลักษณะฯ พ.ศ. ๒๕๖๑ เรียบร้อยแล้ว ผลการตรวจปรากฏว่า <span className="font-bold underline decoration-dotted">เป็นไปตามเกณฑ์มาตรฐานสุขาภิบาล</span> และได้จัดเก็บค่าธรรมเนียมจำนวน <span className="font-bold">{toThaiDigits(feeVal)} บาท ({feeText})</span> ไว้เป็นหลักฐานแล้ว
                    </p>
                    <p className="indent-8">
                      จึงเรียนมาเพื่อโปรดพิจารณาลงนามในใบอนุญาตต่อไป
                    </p>

                    <div className="pt-4 flex justify-end">
                      <div className="text-center w-64 space-y-1">
                        <div>(ลงชื่อ) ................................................................</div>
                        <div className="font-bold">( {inspectorOfficer} )</div>
                        <div className="text-xs text-slate-600">{inspectorPosition}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Slip: ใบรับคำขอชั่วคราว (ฉีกให้ผู้ประกอบการ) */}
                <div className="border-t-2 border-dashed border-slate-500 pt-3 mt-4 text-xs">
                  <div className="text-center font-bold text-sm mb-1 text-slate-800">
                    ✂ ใบรับคำขอต่ออายุใบอนุญาตชั่วคราว (สำหรับผู้ประกอบการเก็บไว้เป็นหลักฐาน)
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-sm border border-slate-300 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <div>กองสาธารณสุขและสิ่งแวดล้อม {orgName}</div>
                      <div>วันที่รับคำขอ: {dateInfo.fullThaiDate}</div>
                    </div>
                    <div>
                      ได้รับคำขอและค่าธรรมเนียมต่ออายุของ <span className="font-bold">"{establishment.businessName}"</span> ({establishment.ownerName})
                    </div>
                    <div className="flex justify-between pt-1">
                      <div>ค่าธรรมเนียม: <span className="font-bold">{toThaiDigits(feeVal)} บาท</span> ({feeText})</div>
                      <div>ลงชื่อผู้รับเรื่อง: ............................................</div>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};
