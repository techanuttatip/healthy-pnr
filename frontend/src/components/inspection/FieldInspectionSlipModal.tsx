import React from 'react';
import type { Establishment, InspectionRecord, SystemSettings } from '../../types/publicHealth';
import { DEFAULT_SYSTEM_SETTINGS } from '../../types/publicHealth';
import { Printer, X, MapPin, CheckCircle2, AlertTriangle, Warehouse } from 'lucide-react';

interface FieldInspectionSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  establishment: Establishment;
  inspectionRecord?: InspectionRecord;
  settings?: SystemSettings;
}

const toThaiDigits = (num: number | string) =>
  String(num).replace(/[0-9]/g, (digit) => '๐๑๒๓๔๕๖๗๘๙'[parseInt(digit, 10)]);

const formatThaiDate = (dateStr?: string, useThaiDigits = true) => {
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
  settings
}) => {
  if (!isOpen) return null;

  const currentSettings = settings || DEFAULT_SYSTEM_SETTINGS;
  const orgName = currentSettings.organizationName || 'องค์การบริหารส่วนตำบลโป่งน้ำร้อน';
  const districtName = currentSettings.district || 'อำเภอฝาง';
  const provinceName = currentSettings.province || 'จังหวัดเชียงใหม่';

  const isPassed = inspectionRecord ? inspectionRecord.result === 'passed' : (establishment.inspectionScore || 0) >= 80;
  const score = inspectionRecord?.totalScore ?? establishment.inspectionScore ?? 0;
  const maxScore = inspectionRecord?.maxScore ?? 100;
  const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  const isStorage = establishment.foodPlaceType === 'storage' ||
    establishment.businessName.includes('สะสมอาหาร') ||
    establishment.businessName.includes('คลัง') ||
    establishment.businessName.includes('โกดัง') ||
    establishment.businessName.includes('ห้องเย็น');

  const gps = inspectionRecord?.gpsCheckIn;
  const photos = inspectionRecord?.photos || [];
  const signatures = inspectionRecord?.signatures;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 print:shadow-none print:border-none print:max-w-none print:max-h-none print:w-full print:rounded-none">
        {/* Top Control Bar (Hidden on print) */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center font-bold text-white text-sm shadow-xs">
              <Warehouse className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                <span>แบบบันทึกผลการตรวจประเมินสุขลักษณะสถานที่จริง (Field Inspection Slip)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {isStorage ? 'สถานที่สะสมอาหาร' : 'สถานที่จำหน่ายอาหาร'}
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                {establishment.businessName} • {establishment.regNumber} ({establishment.village})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์เอกสาร A4</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50 print:bg-white print:p-0 print:overflow-visible">
          {/* A4 Sheet Paper */}
          <div className="bg-white max-w-[210mm] mx-auto p-8 sm:p-10 shadow-md border border-slate-200 print:shadow-none print:border-none print:p-6 print:m-0 print:w-full text-slate-900 font-sans text-xs sm:text-sm leading-relaxed">
            
            {/* Header with Garuda */}
            <div className="text-center relative pb-3 border-b-2 border-slate-900">
              <div className="flex justify-center mb-2">
                <img
                  src="/garuda.png"
                  alt="ตราครุฑ"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain filter contrast-125"
                />
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                แบบบันทึกผลการตรวจประเมินสุขลักษณะ{isStorage ? 'สถานที่สะสมอาหาร' : 'สถานที่จำหน่ายอาหาร'}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5">
                {orgName} {districtName} {provinceName}
              </p>
              <p className="text-[11px] text-slate-600">
                ตามความในพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕ (มาตรา ๓๘) และข้อบัญญัติท้องถิ่น
              </p>
              <div className="absolute top-0 right-0 text-right text-[10px] text-slate-500 font-mono">
                <div>แบบ สส.สต-๑</div>
                <div>เลขที่: {establishment.regNumber}</div>
              </div>
            </div>

            {/* Section 1: Establishment Info */}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  <span className="font-bold text-slate-800">ชื่อสถานประกอบการ/คลัง:</span>{' '}
                  <span className="font-semibold text-blue-900">{establishment.businessName}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800">ประเภท:</span>{' '}
                  <span>{establishment.categoryName} ({establishment.regType})</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800">ผู้ประกอบการ/ผู้ดูแล:</span>{' '}
                  <span>{establishment.ownerName}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800">โทรศัพท์:</span>{' '}
                  <span className="font-mono">{establishment.phone}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold text-slate-800">ที่ตั้งสถานประกอบการ:</span>{' '}
                  <span>{establishment.address} {establishment.village} ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800">วันที่ตรวจประเมินหน้างาน:</span>{' '}
                  <span>{formatThaiDate(inspectionRecord?.inspectionDate || establishment.inspectionDate, false)}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800">เจ้าหน้าที่ผู้ตรวจ:</span>{' '}
                  <span>{inspectionRecord?.inspectorName || establishment.inspectorName || 'นายนพดล สุขเกษม'}</span>
                </div>
              </div>

              {/* GPS Geotag info */}
              {gps && (
                <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-700 flex items-center justify-between">
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
            </div>

            {/* Section 2: Inspection Scores & 4 Dimensions */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                  สรุปผลคะแนนการตรวจประเมินตามเกณฑ์มาตรฐานสุขาภิบาล (๔ มิติ)
                </h2>
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 border border-slate-300">
                  {score}/{maxScore} คะแนน ({percent}%)
                </span>
              </div>

              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-300 p-1.5 text-center w-12">มิติ</th>
                    <th className="border border-slate-300 p-1.5 text-left">หมวดหมู่เกณฑ์มาตรฐานสุขลักษณะ</th>
                    <th className="border border-slate-300 p-1.5 text-center w-24">คะแนนเต็ม</th>
                    <th className="border border-slate-300 p-1.5 text-center w-24">คะแนนที่ได้</th>
                    <th className="border border-slate-300 p-1.5 text-center w-24">ผลการประเมิน</th>
                  </tr>
                </thead>
                <tbody>
                  {isStorage ? (
                    <>
                      <tr>
                        <td className="border border-slate-300 p-1.5 text-center font-bold">๑</td>
                        <td className="border border-slate-300 p-1.5">
                          <strong>โครงสร้างและการจัดวางสินค้า:</strong> วางบนพาเลทสูง ≥ ๑๕ ซม. เว้นผนัง ≥ ๓๐ ซม., คลังสะอาด, แสงสว่างและฝาครอบหลอดไฟ
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono">๓๐</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-blue-800">
                          {inspectionRecord?.checklistItems
                            ? inspectionRecord.checklistItems.filter(i => i.id.startsWith('s') && ['s1','s2','s3'].includes(i.id) && i.passed).reduce((s,i)=>s+i.points,0)
                            : 30}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold text-emerald-700">ผ่าน</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 text-center font-bold">๒</td>
                        <td className="border border-slate-300 p-1.5">
                          <strong>การควบคุมอุณหภูมิและระบบการเก็บรักษา:</strong> แช่เย็น &lt; ๕°C / แช่แข็ง &lt; -๑๘°C, ระบบเข้าก่อน-ออกก่อน (FIFO), ควบคุมความชื้น
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono">๓๐</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-blue-800">
                          {inspectionRecord?.checklistItems
                            ? inspectionRecord.checklistItems.filter(i => i.id.startsWith('s') && ['s4','s5','s6'].includes(i.id) && i.passed).reduce((s,i)=>s+i.points,0)
                            : 30}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold text-emerald-700">ผ่าน</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 text-center font-bold">๓</td>
                        <td className="border border-slate-300 p-1.5">
                          <strong>การป้องกันสารเคมีและสัตว์นำโรค:</strong> ห้ามเก็บอาหารรวมกับปุ๋ย/ยาฆ่าแมลงเด็ดขาด, ม่านริ้วพลาสติก/มุ้งลวดป้องกันหนู-แมลง
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono">๒๕</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-blue-800">
                          {inspectionRecord?.checklistItems
                            ? inspectionRecord.checklistItems.filter(i => i.id.startsWith('s') && ['s7','s8'].includes(i.id) && i.passed).reduce((s,i)=>s+i.points,0)
                            : 25}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold text-emerald-700">ผ่าน</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 text-center font-bold">๔</td>
                        <td className="border border-slate-300 p-1.5">
                          <strong>สุขอนามัยผู้ปฏิบัติงานและยานพาหนะ:</strong> สุขวิทยาส่วนบุคคล, ผ่านการอบรมผู้สัมผัสอาหาร, ยานพาหนะ/พาเลทลำเลียงสะอาด
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono">๑๕</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-blue-800">
                          {inspectionRecord?.checklistItems
                            ? inspectionRecord.checklistItems.filter(i => i.id.startsWith('s') && ['s9','s10'].includes(i.id) && i.passed).reduce((s,i)=>s+i.points,0)
                            : 15}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold text-emerald-700">ผ่าน</td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr>
                        <td className="border border-slate-300 p-1.5 text-center font-bold">๑</td>
                        <td className="border border-slate-300 p-1.5">สถานที่และสิ่งแวดล้อม (โต๊ะปรุงสูง ≥ 60 ซม., บ่อดักไขมัน, อ่างล้างมือ)</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono">๒๕</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-blue-800">๒๕</td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold text-emerald-700">ผ่าน</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 text-center font-bold">๒</td>
                        <td className="border border-slate-300 p-1.5">วัตถุดิบ ภาชนะ อุปกรณ์ และน้ำใช้ (ล้าง 3 ขั้นตอน, อุณหภูมิอาหาร)</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono">๓๐</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-blue-800">๓๐</td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold text-emerald-700">ผ่าน</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 text-center font-bold">๓</td>
                        <td className="border border-slate-300 p-1.5">สุขลักษณะส่วนบุคคลของผู้สัมผัสอาหาร (มีวุฒิบัตร สธ., แต่งกายสะอาด)</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono">๒๕</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-blue-800">๒๕</td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold text-emerald-700">ผ่าน</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 text-center font-bold">๔</td>
                        <td className="border border-slate-300 p-1.5">การจัดการมูลฝอย สิ่งปฏิกูล และสัตว์นำโรค (ถังขยะปิดมิดชิด, ปลอดสัตว์นำโรค)</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono">๒๐</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-blue-800">๒๐</td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold text-emerald-700">ผ่าน</td>
                      </tr>
                    </>
                  )}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={2} className="border border-slate-300 p-1.5 text-right">
                      รวมคะแนนการประเมินสุขลักษณะทั้ง ๔ มิติ:
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center font-mono">{maxScore}</td>
                    <td className="border border-slate-300 p-1.5 text-center font-mono text-sm text-blue-900">{score}</td>
                    <td className={`border border-slate-300 p-1.5 text-center ${isPassed ? 'text-emerald-700' : 'text-red-700'}`}>
                      {isPassed ? 'ผ่านเกณฑ์ (≥๘๐%)' : 'ไม่ผ่านเกณฑ์'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 3: Result & Correction Order */}
            <div className="mt-4 p-3 rounded-lg border border-slate-300 bg-white text-xs">
              <div className="font-bold text-slate-900 mb-1 flex items-center justify-between">
                <span>สรุปผลการพิจารณาของเจ้าพนักงานสาธารณสุข:</span>
                {isPassed ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ผ่านเกณฑ์มาตรฐานสุขลักษณะ เห็นควรออกใบอนุญาต/หนังสือรับรองการแจ้ง</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-700 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>ไม่ผ่านเกณฑ์มาตรฐาน ออกคำสั่งให้แก้ไขปรับปรุงภายใน {inspectionRecord?.correctionDays || establishment.correctionDays || 15} วัน</span>
                  </span>
                )}
              </div>

              {/* Defect items if any */}
              {inspectionRecord?.defectsSummary && inspectionRecord.defectsSummary.length > 0 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-900">
                  <div className="font-bold text-[11px] mb-0.5">รายการข้อบกพร่องที่ต้องดำเนินการแก้ไขปรับปรุง:</div>
                  <ol className="list-decimal pl-5 space-y-0.5 text-[11px]">
                    {inspectionRecord.defectsSummary.map((defect, idx) => (
                      <li key={idx}>{defect}</li>
                    ))}
                  </ol>
                  <div className="text-[10px] text-red-700 mt-1 font-semibold">
                    *กำหนดให้แก้ไขให้แล้วเสร็จภายในวันที่: {formatThaiDate(inspectionRecord.correctionDeadline || establishment.correctionDeadline, false) || '๑๕ วันนับแต่วันตรวจ'}
                  </div>
                </div>
              )}

              {/* Notes */}
              {inspectionRecord?.inspectorNotes && (
                <div className="mt-2 text-[11px] text-slate-700">
                  <span className="font-bold">ข้อเสนอแนะเพิ่มเติม:</span> {inspectionRecord.inspectorNotes}
                </div>
              )}
            </div>

            {/* Section 4: Photographic Evidence */}
            {photos.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-bold text-slate-900 mb-2">
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
                      <div className="text-[9px] text-slate-500 font-mono">{p.timestamp}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 5: Dual Signatures */}
            <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
              {/* Left: Facility Representative */}
              <div className="flex flex-col items-center">
                <div className="text-slate-800 font-bold mb-1">
                  ผู้รับการตรวจประเมิน / ผู้แทนสถานที่
                </div>
                <div className="w-48 h-16 border-b border-slate-700 flex items-center justify-center relative">
                  {signatures?.ownerSignature ? (
                    <img
                      src={signatures.ownerSignature}
                      alt="ลายมือชื่อผู้ประกอบการ"
                      className="max-h-14 max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">(ลงลายมือชื่อ)</span>
                  )}
                </div>
                <div className="mt-2 font-medium text-slate-900">
                  ({signatures?.ownerSignedName || establishment.ownerName})
                </div>
                <div className="text-[11px] text-slate-500">
                  {isStorage ? 'ผู้จัดการคลัง / เจ้าของสถานที่สะสมอาหาร' : 'ผู้ประกอบการ / ผู้รับมอบอำนาจ'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  วันที่: {formatThaiDate(inspectionRecord?.inspectionDate || establishment.inspectionDate, false)}
                </div>
              </div>

              {/* Right: Public Health Officer */}
              <div className="flex flex-col items-center">
                <div className="text-slate-800 font-bold mb-1">
                  เจ้าพนักงานสาธารณสุขผู้ตรวจประเมิน
                </div>
                <div className="w-48 h-16 border-b border-slate-700 flex items-center justify-center relative">
                  {signatures?.inspectorSignature ? (
                    <img
                      src={signatures.inspectorSignature}
                      alt="ลายมือชื่อเจ้าหน้าที่"
                      className="max-h-14 max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">(ลงลายมือชื่อ)</span>
                  )}
                </div>
                <div className="mt-2 font-medium text-slate-900">
                  ({inspectionRecord?.inspectorName || establishment.inspectorName || 'นายนพดล สุขเกษม'})
                </div>
                <div className="text-[11px] text-slate-500">
                  {inspectionRecord?.inspectorPosition || 'เจ้าพนักงานสาธารณสุขชำนาญงาน'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  วันที่: {formatThaiDate(inspectionRecord?.inspectionDate || establishment.inspectionDate, false)}
                </div>
              </div>
            </div>

            {/* Footer note */}
            <div className="mt-6 pt-3 border-t border-dotted border-slate-300 text-[10px] text-slate-500 text-center">
              บันทึกฉบับนี้จัดทำขึ้น ๒ ฉบับ เพื่อให้เจ้าพนักงานสาธารณสุขเก็บไว้ในสำนวนทะเบียน ๑ ฉบับ และมอบให้ผู้ประกอบการ/ผู้ดูแลสถานที่ ๑ ฉบับ
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default FieldInspectionSlipModal;
