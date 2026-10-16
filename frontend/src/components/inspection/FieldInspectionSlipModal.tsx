import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Establishment, InspectionRecord, SystemSettings } from '../../types/publicHealth';
import { DEFAULT_SYSTEM_SETTINGS } from '../../types/publicHealth';
import {
  ALL_OFFICIAL_FORMS,
  OFFICIAL_FOOD_SERVICE_FORM,
  OFFICIAL_FOOD_STORAGE_FORM,
  OFFICIAL_HAZARDOUS_HEALTH_FORM,
  resolveInspectionForm,
  type OfficialInspectionFormDef
} from '../../types/officialInspectionForms';
import { Printer, X, MapPin } from 'lucide-react';
import { OFFICIAL_NWK_SIGNATURE_DATA_URL } from '../../constants/officialSignature';

interface FieldInspectionSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  establishment: Establishment;
  inspectionRecord?: InspectionRecord;
  settings?: SystemSettings;
  activeCategory?: 'selling' | 'storage' | 'hazardous';
}

const toThaiDigits = (num: number | string) =>
  String(num).replace(/[0-9]/g, (digit) => '๐๑๒๓๔๕๖๗๘๙'[parseInt(digit, 10)]);

const formatThaiDate = (dateStr?: string, useThaiDigits = false) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const [y, m, d] = parts;
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const day = parseInt(d, 10);
  const month = months[parseInt(m, 10) - 1] || '';
  const year = parseInt(y, 10) + 543;
  if (!useThaiDigits) {
    return `${day} ${month} ${year}`;
  }
  return `${toThaiDigits(day)} ${month} ${toThaiDigits(year)}`;
};

export const FieldInspectionSlipModal: React.FC<FieldInspectionSlipModalProps> = ({
  isOpen,
  onClose,
  establishment,
  inspectionRecord,
  settings,
  activeCategory
}) => {
  const getInitialForm = () => {
    if (activeCategory === 'hazardous') return OFFICIAL_HAZARDOUS_HEALTH_FORM;
    if (activeCategory === 'storage') return OFFICIAL_FOOD_STORAGE_FORM;
    if (activeCategory === 'selling') return OFFICIAL_FOOD_SERVICE_FORM;
    return resolveInspectionForm(
      establishment.categoryName || establishment.category || establishment.businessName
    );
  };

  const [activeFormDef, setActiveFormDef] = useState<OfficialInspectionFormDef>(getInitialForm());

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('has-print-modal');
      return () => {
        document.body.classList.remove('has-print-modal');
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setActiveFormDef(getInitialForm());
    }
  }, [isOpen, activeCategory, establishment]);

  if (!isOpen) return null;

  const currentSettings = settings || DEFAULT_SYSTEM_SETTINGS;
  const orgName = currentSettings.organizationName || 'องค์การบริหารส่วนตำบลโป่งน้ำร้อน';
  const districtName = currentSettings.district || 'อำเภอฝาง';
  const provinceName = currentSettings.province || 'จังหวัดเชียงใหม่';

  const isPassed = inspectionRecord ? inspectionRecord.result === 'passed' : (establishment.inspectionScore || 0) >= 80;

  const handlePrint = () => {
    window.print();
  };

  const gps = inspectionRecord?.gpsCheckIn;
  const photos = inspectionRecord?.photos || [];
  const signatures = inspectionRecord?.signatures;

  // Build checklist pass lookup from inspectionRecord.checklistItems if available
  const itemPassMap: Record<string, boolean> = {};
  const itemNoteMap: Record<string, string> = {};
  if (inspectionRecord?.checklistItems) {
    inspectionRecord.checklistItems.forEach((it) => {
      itemPassMap[it.id] = it.passed;
      if (it.defectNote) itemNoteMap[it.id] = it.defectNote;
    });
  }

  const allItems = activeFormDef.categories.flatMap((c) => c.items);
  const totalItems = allItems.length;
  const passedItemsCount = allItems.filter((i) => itemPassMap[i.id] !== false).length;
  const passPercent = totalItems > 0 ? Math.round((passedItemsCount / totalItems) * 100) : 100;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto modal-print-container print:p-0 print:bg-white print:static print:inset-auto">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 modal-print-window print:shadow-none print:border-none print:max-w-none print:max-h-none print:w-full print:rounded-none">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="p-3 bg-white border-b border-slate-200 text-slate-800 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
              อบต.
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>แบบตรวจสุขลักษณะ อบต.โป่งน้ำร้อน (เอกสารทางการ)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  ผ่าน {passedItemsCount}/{totalItems} ({passPercent}%)
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                {establishment.businessName} • {establishment.regNumber} ({establishment.village})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Form switcher pills on top bar */}
            <div className="hidden md:flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
              {ALL_OFFICIAL_FORMS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFormDef(f)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    activeFormDef.id === f.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.id === 'food_service' ? 'จำหน่ายอาหาร' : f.id === 'food_storage' ? 'สะสมอาหาร' : 'กิจการอันตราย'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์เอกสาร A4</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
          {/* A4 Sheet Paper */}
          <div id="printable-field-inspection-slip" className="bg-white max-w-[210mm] mx-auto p-8 sm:p-10 shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-6 print:m-0 print:w-full text-slate-900 font-sans text-xs leading-relaxed">
            
            {/* Header Matching Official Scanned Form */}
            <div className="text-center pb-2 mb-3">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-wide">
                {activeFormDef.title}
              </h1>
              <h2 className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5">
                {orgName} {districtName} {provinceName}
              </h2>
            </div>

            {/* Header Form Metadata Fields */}
            {activeFormDef.id === 'hazardous_health' ? (
              <div className="mb-3 space-y-1 text-xs text-slate-800">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold">ลักษณะของกิจการ:</span>{' '}
                    <span className="border-b border-dotted border-slate-600 px-2 font-medium">
                      {establishment.categoryName || establishment.businessName}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">เลขที่ตรวจสอบ:</span>{' '}
                    <span className="border-b border-dotted border-slate-600 px-2 font-mono">
                      {establishment.regNumber}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">ประเภทการตรวจ:</span>
                    {(() => {
                      const isRenewal = (establishment.yearlyArchives && establishment.yearlyArchives.length > 1) || establishment.status === 'expiring';
                      return (
                        <>
                          <label className="inline-flex items-center gap-1">
                            <input type="checkbox" checked={!isRenewal} readOnly />
                            <span>ขออนุญาตใหม่</span>
                          </label>
                          <label className="inline-flex items-center gap-1">
                            <input type="checkbox" checked={isRenewal} readOnly />
                            <span>ต่อใบอนุญาต</span>
                          </label>
                        </>
                      );
                    })()}
                  </div>
                  <div>
                    <span className="font-semibold">วันที่ตรวจสอบ:</span>{' '}
                    <span className="border-b border-dotted border-slate-600 px-2">
                      {formatThaiDate(inspectionRecord?.inspectionDate || establishment.inspectionDate)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <span className="font-semibold">ชื่อสถานประกอบการ:</span>{' '}
                    <span className="border-b border-dotted border-slate-600 px-2 font-medium">
                      {establishment.businessName}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold">ผู้ครอบครอง:</span>{' '}
                    <span className="border-b border-dotted border-slate-600 px-2 font-medium">
                      {establishment.ownerName}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="font-semibold">ที่อยู่:</span>{' '}
                  <span className="border-b border-dotted border-slate-600 px-2">
                    {establishment.address} {establishment.village} ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่
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
                    <span className="border-b border-dotted border-slate-600 px-2 font-medium text-blue-900">
                      {establishment.businessName}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">ชื่อเจ้าของสถานประกอบการ:</span>{' '}
                    <span className="border-b border-dotted border-slate-600 px-2 font-medium">
                      {establishment.ownerName}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-semibold">วันที่ตรวจ:</span>{' '}
                    <span className="border-b border-dotted border-slate-600 px-2">
                      {formatThaiDate(inspectionRecord?.inspectionDate || establishment.inspectionDate)}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">ขนาดพื้นที่:</span>{' '}
                    <span className="border-b border-dotted border-slate-600 px-2 font-bold text-blue-900">
                      {establishment.areaSqm || 145}
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
                  <th
                    className="border border-slate-900 p-1.5 text-center"
                    style={{ width: activeFormDef.id === 'hazardous_health' ? '18%' : '65%' }}
                  >
                    {activeFormDef.id === 'hazardous_health' ? 'หัวข้อ' : 'เกณฑ์พิจารณาอนุญาต'}
                  </th>
                  {activeFormDef.id === 'hazardous_health' && (
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
                {activeFormDef.categories.map((cat) => (
                  <React.Fragment key={cat.id}>
                    {/* Category Title Row */}
                    <tr className="bg-slate-100 font-bold border-t border-b border-slate-900">
                      <td
                        colSpan={activeFormDef.id === 'hazardous_health' ? 5 : 4}
                        className="border border-slate-900 px-2 py-1 text-slate-900 text-[11.5px]"
                      >
                        {cat.title}
                      </td>
                    </tr>

                    {/* Criteria Item Rows */}
                    {cat.items.map((item) => {
                      const itemPassed = itemPassMap[item.id] !== false;
                      const note = itemNoteMap[item.id] || '';

                      if (activeFormDef.id === 'hazardous_health') {
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
                              {itemPassed ? '✓' : ''}
                            </td>
                            <td className="border border-slate-900 p-1 text-center font-bold text-red-700">
                              {!itemPassed ? '✗' : ''}
                            </td>
                            <td className="border border-slate-900 px-2 py-1 text-slate-600 text-[10.5px]">
                              {note || (itemPassed ? 'ถูกต้อง' : 'ต้องแก้ไข')}
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={item.id} className="border-b border-slate-400">
                          <td className="border border-slate-900 px-2 py-1 text-slate-900">
                            <span className="font-bold mr-1.5">{item.code}</span>
                            <span>{item.label}</span>
                          </td>
                          <td className="border border-slate-900 p-1 text-center font-bold text-emerald-800">
                            {itemPassed ? '✓' : ''}
                          </td>
                          <td className="border border-slate-900 p-1 text-center font-bold text-red-700">
                            {!itemPassed ? '✗' : ''}
                          </td>
                          <td className="border border-slate-900 px-2 py-1 text-slate-600 text-[10.5px]">
                            {note || (itemPassed ? 'เรียบร้อย' : 'ต้องแก้ไข')}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* Summary & Suggestions for Hazardous Form */}
            {activeFormDef.id === 'hazardous_health' && (
              <div className="space-y-2 mb-4 text-xs">
                <div className="p-2 border border-slate-900 rounded">
                  <div className="font-bold mb-1">สรุปผลการตรวจ:</div>
                  <div className="flex items-center gap-6">
                    <label className="inline-flex items-center gap-1.5">
                      <input type="checkbox" checked={isPassed} readOnly />
                      <span className="font-semibold text-emerald-900">เห็นสมควรอนุญาต</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5">
                      <input type="checkbox" checked={!isPassed} readOnly />
                      <span className="font-semibold text-red-900">
                        ไม่เห็นสมควรอนุญาต เนื่องจาก:{' '}
                        <span className="border-b border-dotted border-slate-600 px-2 font-normal">
                          {inspectionRecord?.inspectorNotes || '...................................................'}
                        </span>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="p-2 border border-slate-900 rounded">
                  <div className="font-bold mb-0.5">ข้อเสนอแนะอื่นๆ:</div>
                  <p className="border-b border-dotted border-slate-600 pb-1 text-slate-700">
                    {inspectionRecord?.inspectorNotes ||
                      'ปฏิบัติตามมาตรฐานสุขอนามัยอย่างเคร่งครัด สวมอุปกรณ์คุ้มครองความปลอดภัยส่วนบุคคล (PPE) และบำรุงรักษาถังดับเพลิงประจำทุกเดือน'}
                  </p>
                </div>
              </div>
            )}

            {/* GPS Geotag info if present */}
            {gps && (
              <div className="mb-3 p-2 bg-slate-50 border border-slate-300 rounded text-[11px] text-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    <strong>พิกัดเช็กอินหน้างานจริง:</strong>{' '}
                    <span className="font-mono">{gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}</span> (ความแม่นยำ ±{Math.round(gps.accuracy)} ม.)
                  </span>
                </div>
                {gps.distanceMeters !== undefined && (
                  <span className="font-mono text-slate-600">
                    ระยะห่างจากพิกัดทะเบียน: {Math.round(gps.distanceMeters)} ม.
                  </span>
                )}
              </div>
            )}

            {/* Photographic Evidence if present */}
            {photos.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-bold text-slate-900 mb-1.5">
                  ภาพถ่ายหลักฐานการตรวจประเมินสถานที่จริง ({photos.length} รูป):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {photos.map((p) => (
                    <div key={p.id} className="border border-slate-300 rounded p-1 bg-slate-50 text-center">
                      <div className="h-20 bg-slate-200 rounded overflow-hidden flex items-center justify-center">
                        <img src={p.url} alt={p.caption || 'หลักฐานหน้างาน'} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-[10px] font-semibold text-slate-800 truncate mt-1">
                        {p.caption || p.category}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Signatures Block */}
            <div className="pt-3 mt-4 border-t border-slate-400 grid grid-cols-2 gap-8 text-xs">
              <div className="text-center space-y-1">
                <div className="relative inline-block">
                  <div>ลงชื่อ.................................................... เจ้าของกิจการ</div>
                  {signatures?.ownerSignature && (
                    <img
                      src={signatures.ownerSignature}
                      alt="ลายมือชื่อเจ้าของกิจการ"
                      className="absolute -top-6 left-1/2 -translate-x-1/2 h-10 object-contain pointer-events-none"
                    />
                  )}
                </div>
                <div className="text-slate-600">({signatures?.ownerSignedName || establishment.ownerName})</div>
              </div>

              <div className="text-center space-y-1">
                <div className="relative inline-block">
                  <div>ลงชื่อ.................................................... ผู้ตรวจ</div>
                  <img
                    src={signatures?.inspectorSignature || OFFICIAL_NWK_SIGNATURE_DATA_URL}
                    alt="ลายเซ็นผู้ตรวจ (นวก.)"
                    className="absolute -top-7 left-1/2 -translate-x-1/2 h-11 object-contain pointer-events-none"
                  />
                </div>
                <div className="text-slate-900 font-semibold">
                  ({inspectionRecord?.inspectorName || establishment.inspectorName || 'นางสาวรุ่งทิวา อุปนันท์'})
                </div>
                <div className="text-[10px] text-slate-500">
                  {inspectionRecord?.inspectorPosition || 'นักวิชาการสาธารณสุขปฏิบัติการ (นวก.)'} • อบต.โป่งน้ำร้อน
                </div>
              </div>
            </div>

            {/* Page 2: Authorities Review & Order (for Hazardous Health Form) */}
            {activeFormDef.id === 'hazardous_health' && (
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
                        <input type="checkbox" checked={isPassed} readOnly />
                        <span>เห็นสมควรอนุญาต</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" checked={!isPassed} readOnly />
                        <span>เห็นไม่สมควรอนุญาต เพราะ........................</span>
                      </label>
                    </div>

                    <div className="pt-6 text-center space-y-1 text-xs">
                      <div className="relative inline-block">
                        <div>(ลงชื่อ)............................................เจ้าพนักงานสาธารณสุข</div>
                        <img
                          src={signatures?.inspectorSignature || OFFICIAL_NWK_SIGNATURE_DATA_URL}
                          alt="ลายเซ็นเจ้าพนักงานสาธารณสุข (นวก.)"
                          className="absolute -top-7 left-1/2 -translate-x-1/2 h-11 object-contain pointer-events-none"
                        />
                      </div>
                      <div className="font-semibold text-slate-900">({inspectionRecord?.inspectorName || establishment.inspectorName || 'นางสาวรุ่งทิวา อุปนันท์'})</div>
                      <div className="text-[10.5px] text-slate-500">
                        ตำแหน่ง {inspectionRecord?.inspectorPosition || 'นักวิชาการสาธารณสุขปฏิบัติการ (นวก.)'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        วันที่ {formatThaiDate(inspectionRecord?.inspectionDate || establishment.inspectionDate)}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: คำสั่งของพนักงานท้องถิ่น */}
                  <div className="space-y-3 pl-2">
                    <h3 className="font-bold text-center text-slate-900">
                      คำสั่งของพนักงานท้องถิ่น
                    </h3>
                    <div className="space-y-1.5 pl-2 pt-4">
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" checked={isPassed} readOnly />
                        <span className="font-bold text-emerald-900">เห็นสมควรอนุญาต</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" checked={!isPassed} readOnly />
                        <span>เห็นไม่สมควรอนุญาต</span>
                      </label>
                    </div>

                    <div className="pt-6 text-center space-y-1 text-xs">
                      <div>(ลงชื่อ).......................................................</div>
                      <div className="font-bold">({activeFormDef.councilLeaderName || 'นายสมคิด พงษ์สุข'})</div>
                      <div className="text-[10.5px] text-slate-700">
                        ตำแหน่ง {activeFormDef.councilLeaderPosition || 'นายกองค์การบริหารส่วนตำบล'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        วันที่ {formatThaiDate(inspectionRecord?.inspectionDate || establishment.inspectionDate)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer note */}
            <div className="mt-6 pt-3 border-t border-dotted border-slate-300 text-[10px] text-slate-500 text-center">
              แบบตรวจสุขลักษณะนี้จัดทำขึ้นตามแบบมาตรฐานของ {orgName} {districtName} {provinceName}
            </div>

          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default FieldInspectionSlipModal;
