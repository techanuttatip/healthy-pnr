import React from 'react';
import type { Establishment, SystemSettings } from '../../../types/publicHealth';
import { formatThaiDate, parseAddressDetails } from './printHelpers';

interface TempNoticeDocProps {
  establishment: Establishment;
  settings: SystemSettings;
  tempNoticeCode: string;
  tempNoticeTitle: string;
}

export const TempNoticeDoc: React.FC<TempNoticeDocProps> = ({
  establishment,
  settings,
  tempNoticeCode,
  tempNoticeTitle
}) => {
  const sig = settings.signatories;
  const districtName = settings.district || 'อำเภอฝาง';
  const provinceName = settings.province || 'จังหวัดเชียงใหม่';

  const regType = establishment.regType || '';
  const isHazardous = regType === 'บทส' || establishment.category === 'hazardous';
  const isStorage = !isHazardous && (establishment.foodPlaceType === 'storage');

  const parsedAddress = parseAddressDetails(establishment.address, establishment.village);

  return (
    <div
      id="printable-temp-notice"
      className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-10 sm:p-14 shadow-2xl border border-slate-300 print:shadow-none print:border-none print:w-full print:max-w-none print:p-6 print:m-0 flex flex-col justify-between font-serif relative overflow-hidden"
      style={{ fontFamily: "'Sarabun', 'TH Sarabun New', serif" }}
    >
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none">
        <img
          src="/pnr_logo.png"
          alt="ลายน้ำตราสัญลักษณ์ อบต.โป่งน้ำร้อน"
          className="w-[130mm] h-[130mm] object-contain opacity-[0.07] select-none filter contrast-125 print:opacity-[0.08]"
        />
      </div>

      {/* Header Section */}
      <div className="relative z-10">
        <div className="flex justify-between items-start text-xs text-slate-700 mb-2">
          <div className="font-bold">
            เลขรับคำขอที่: <span className="font-mono text-sm">{establishment.regNumber}</span>
          </div>
          <div className="text-right">
            <span className="font-bold border border-cyan-700 text-cyan-900 bg-cyan-50 px-2 py-0.5 rounded-xs text-xs">
              {tempNoticeCode} (เอกสารชั่วคราว)
            </span>
            <div className="mt-1 text-[11px] text-slate-500">
              ออกให้ ณ วันที่ยื่นเรื่อง (Day-1 Slip)
            </div>
          </div>
        </div>

        {/* Garuda Emblem */}
        <div className="flex justify-center my-3 relative z-10">
          <img
            src="/garuda.png"
            alt="ตราครุฑประจำแบบพิมพ์ราชการ"
            className="w-22 h-22 sm:w-26 sm:h-26 object-contain filter contrast-125"
          />
        </div>

        {/* Title Header */}
        <div className="text-center my-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
            {tempNoticeTitle}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            องค์การบริหารส่วนตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่
          </p>
        </div>

        {/* Body Content */}
        <div className="text-[13px] leading-relaxed text-slate-900 space-y-3 mt-5">
          {isHazardous ? (
            /* ================== ใบรับคำขอ อภ.๑ (กิจการที่เป็นอันตรายต่อสุขภาพ) ================== */
            <>
              <p className="indent-8 text-justify">
                เจ้าพนักงานท้องถิ่นได้รับคำขอรับใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพจาก (นาย, นาง, นางสาว){' '}
                <span className="font-bold border-b border-dotted border-slate-700 px-2">
                  {establishment.ownerName}
                </span>{' '}
                อายุ <span className="font-mono border-b border-dotted border-slate-700 px-1.5">๓๕</span> ปี สัญชาติ{' '}
                <span className="border-b border-dotted border-slate-700 px-1.5 font-medium">ไทย</span>{' '}
                อยู่บ้านเลขที่{' '}
                <span className="border-b border-dotted border-slate-700 px-2 font-medium">
                  {parsedAddress.houseNo}
                </span>{' '}
                {parsedAddress.fullVillageDisplay} ตำบล{' '}
                <span className="border-b border-dotted border-slate-700 px-1.5">โป่งน้ำร้อน</span>{' '}
                อำเภอ <span className="border-b border-dotted border-slate-700 px-1.5">{districtName.replace('อำเภอ', '')}</span>{' '}
                จังหวัด <span className="border-b border-dotted border-slate-700 px-1.5">{provinceName.replace('จังหวัด', '')}</span>{' '}
                โทรศัพท์ <span className="font-mono border-b border-dotted border-slate-700 px-1.5">{establishment.phone}</span>{' '}
                โทรสาร <span className="border-b border-dotted border-slate-700 px-1.5">{establishment.fax || '-'}</span>
              </p>

              <p className="text-justify">
                ชื่อสถานประกอบกิจการ{' '}
                <span className="font-bold text-sm border-b border-dotted border-slate-700 px-2 text-blue-950">
                  "{establishment.businessName}"
                </span>{' '}
                ประเภทกิจการที่เป็นอันตรายต่อสุขภาพ{' '}
                <span className="font-bold border-b border-dotted border-slate-700 px-2 text-slate-900">
                  {establishment.categoryName || 'กิจการที่เกี่ยวกับปิโตรเลียม ถ่านหิน สารเคมี (การจำหน่ายน้ำมันเชื้อเพลิงตู้หยอดเหรียญ)'}
                </span>{' '}
                ลักษณะของสถานที่ประกอบกิจการ{' '}
                <span className="border-b border-dotted border-slate-700 px-2">
                  {establishment.premiseCharacteristics || 'อาคารพาณิชย์/ติดตั้งตู้จ่ายน้ำมันเชื้อเพลิงอัตโนมัติชนิดหยอดเหรียญและธนบัตร'}
                </span>
              </p>

              <p className="text-justify">
                มีพื้นที่{' '}
                <span className="font-bold font-mono border-b border-dotted border-slate-700 px-2">
                  {establishment.areaSqm}
                </span>{' '}
                ตารางเมตร จำนวนคนงาน{' '}
                <span className="font-bold font-mono border-b border-dotted border-slate-700 px-2">
                  {establishment.workerCount}
                </span>{' '}
                คน กำลังเครื่องจักร{' '}
                <span className="font-bold font-mono border-b border-dotted border-slate-700 px-2">
                  {establishment.machineHorsepower || '-'}
                </span>{' '}
                แรงม้า
              </p>

              <p className="text-justify">
                สถานที่ตั้งสถานประกอบกิจการ เลขที่{' '}
                <span className="border-b border-dotted border-slate-700 px-2">
                  {parsedAddress.houseNo}
                </span>{' '}
                {parsedAddress.fullVillageDisplay} ตำบลโป่งน้ำร้อน {districtName} {provinceName} โทรศัพท์{' '}
                <span className="font-mono border-b border-dotted border-slate-700 px-1.5">{establishment.phone}</span>{' '}
                โทรสาร <span className="border-b border-dotted border-slate-700 px-1.5">{establishment.fax || '-'}</span>{' '}
                อีเมล <span className="border-b border-dotted border-slate-700 px-1.5">{establishment.email || '-'}</span>{' '}
                ID: Line <span className="border-b border-dotted border-slate-700 px-1.5 font-bold text-emerald-800">{establishment.lineId || '-'}</span>
              </p>
            </>
          ) : (
            /* ================== ใบรับแจ้ง นจ.๒ (สถานที่จำหน่าย/สะสมอาหาร) ================== */
            <>
              <p className="indent-8 text-justify">
                เจ้าพนักงานท้องถิ่นออกใบรับแจ้งให้ (นาย, นาง, นางสาว){' '}
                <span className="font-bold border-b border-dotted border-slate-700 px-2">
                  {establishment.ownerName}
                </span>{' '}
                อายุ <span className="font-mono border-b border-dotted border-slate-700 px-1.5">๓๕</span> ปี สัญชาติ{' '}
                <span className="border-b border-dotted border-slate-700 px-1.5 font-medium">ไทย</span>{' '}
                อยู่บ้านเลขที่{' '}
                <span className="border-b border-dotted border-slate-700 px-2 font-medium">
                  {parsedAddress.houseNo}
                </span>{' '}
                {parsedAddress.fullVillageDisplay} ตำบล{' '}
                <span className="border-b border-dotted border-slate-700 px-1.5">โป่งน้ำร้อน</span>{' '}
                อำเภอ <span className="border-b border-dotted border-slate-700 px-1.5">{districtName.replace('อำเภอ', '')}</span>{' '}
                จังหวัด <span className="border-b border-dotted border-slate-700 px-1.5">{provinceName.replace('จังหวัด', '')}</span>{' '}
                โทรศัพท์ <span className="font-mono border-b border-dotted border-slate-700 px-1.5">{establishment.phone}</span>{' '}
                โทรสาร <span className="border-b border-dotted border-slate-700 px-1.5">{establishment.fax || '-'}</span>
              </p>

              <p className="text-justify">
                ชื่อสถานประกอบกิจการ{' '}
                <span className="font-bold text-sm border-b border-dotted border-slate-700 px-2 text-blue-950">
                  "{establishment.businessName}"
                </span>{' '}
                {isStorage ? 'ประเภทของอาหารที่สะสมเพื่อจำหน่าย' : 'ประเภทของอาหารที่จำหน่าย'}{' '}
                <span className="font-bold border-b border-dotted border-slate-700 px-2">
                  {establishment.foodTypeDetail || (isStorage ? 'อาหารแห้ง และสินค้าเกษตรแปรรูป' : 'อาหารปรุงสำเร็จ และเครื่องดื่ม')}
                </span>{' '}
                ลักษณะของสถานที่ประกอบกิจการ{' '}
                <span className="border-b border-dotted border-slate-700 px-2">
                  {establishment.premiseCharacteristics || (isStorage ? 'อยู่ในอาคารโกดัง' : 'อยู่ในอาคารพาณิชย์')}
                </span>
              </p>

              <p className="text-justify">
                วิธีการจำหน่าย{' '}
                <span className="border-b border-dotted border-slate-700 px-2">
                  {establishment.distributionMethod || (isStorage ? 'จำหน่ายส่งและมีบริการจัดส่ง' : 'มีโต๊ะเก้าอี้ไว้ให้บริการ')}
                </span>{' '}
                ช่วงเวลาที่จำหน่าย{' '}
                <span className="border-b border-dotted border-slate-700 px-2 font-mono">
                  {establishment.operatingHours || '๐๗:๐๐ - ๑๙:๐๐ น.'}
                </span>{' '}
                มีพื้นที่{' '}
                <span className="font-bold font-mono border-b border-dotted border-slate-700 px-2">
                  {establishment.areaSqm}
                </span>{' '}
                ตารางเมตร {isStorage ? 'จำนวนคนงาน' : 'จำนวนคนงาน/ผู้สัมผัสอาหาร'}{' '}
                <span className="font-bold font-mono border-b border-dotted border-slate-700 px-2">
                  {establishment.workerCount}
                </span>{' '}
                คน
              </p>

              <p className="text-justify">
                สถานที่ตั้ง เลขที่{' '}
                <span className="border-b border-dotted border-slate-700 px-2">
                  {parsedAddress.houseNo}
                </span>{' '}
                {parsedAddress.fullVillageDisplay} ตำบลโป่งน้ำร้อน {districtName} {provinceName} โทรศัพท์{' '}
                <span className="font-mono border-b border-dotted border-slate-700 px-1.5">{establishment.phone}</span>{' '}
                โทรสาร <span className="border-b border-dotted border-slate-700 px-1.5">{establishment.fax || '-'}</span>{' '}
                อีเมล <span className="border-b border-dotted border-slate-700 px-1.5">{establishment.email || '-'}</span>{' '}
                ID: Line <span className="border-b border-dotted border-slate-700 px-1.5 font-bold text-emerald-800">{establishment.lineId || '@pnr-food'}</span>
              </p>
            </>
          )}

          <div className="pt-2 border-t border-slate-200 mt-4 space-y-1.5 text-xs text-slate-800">
            <div>
              ได้รับเรื่องเมื่อวันที่{' '}
              <span className="font-mono font-bold border-b border-dotted border-slate-700 px-2">
                {formatThaiDate(establishment.applicationSubmissionDate || establishment.issueDate, false)}
              </span>
            </div>
            <div>
              ออกให้เมื่อวันที่{' '}
              <span className="font-mono font-bold border-b border-dotted border-slate-700 px-2">
                {formatThaiDate(establishment.temporarySlipIssuedDate || establishment.applicationSubmissionDate || establishment.issueDate, false)}
              </span>{' '}
              <span className="text-[11px] text-emerald-700 font-bold">(ออกภายในวันเดียวกัน)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signature & Official Notes */}
      <div className="relative z-10 pt-4">
        <div className="flex justify-end">
          <div className="text-center w-64">
            <div className="text-xs text-slate-800 mb-8">
              (ลงชื่อ) ....................................................
            </div>
            <div className="font-bold text-sm text-slate-900">
              ( {sig.mayorName} )
            </div>
            <div className="text-xs text-slate-700 mt-0.5">
              ตำแหน่ง {sig.mayorPosition}
            </div>
            <div className="text-[11px] font-semibold text-slate-800">
              {sig.mayorRoleTitle}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 italic">
              *(ใบรับแจ้งที่ดาวน์โหลดผ่านระบบนี้จะไม่มีลายเซ็นของเจ้าพนักงานท้องถิ่น)*
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-4 pt-3 border-t border-slate-300 text-[10.5px] text-slate-700 leading-snug space-y-1.5">
          <div className="font-bold text-slate-900">หมายเหตุ</div>
          <p>
            ๑. แบบฟอร์มนี้ทำในระบบและปริ้นเสนอผู้มีอำนาจลงนาม และให้ระบบแจ้งเตือนผู้ยื่นคำขอทราบว่าเจ้าหน้าที่ได้ออก{isHazardous ? 'ใบรับคำขอ' : 'ใบรับแจ้ง'}ให้แล้วภายในวันที่ยื่นโดยประชาชนหรือผู้ประกอบการสามารถดาวน์โหลด{isHazardous ? 'ใบรับคำขอ' : 'ใบรับแจ้ง'}ไว้เป็นหลักฐานแสดงให้เจ้าหน้าที่ตรวจสอบได้เป็นการชั่วคราว จนกว่าเจ้าพนักงานท้องถิ่นจะออก{isHazardous ? 'ใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ (แบบ อภ.๒)' : 'หนังสือรับรองการแจ้ง'}ภายในกำหนดเวลาตามกฎหมาย ทั้งนี้{isHazardous ? 'ใบรับคำขอ' : 'ใบรับแจ้ง'}ที่ดาวน์โหลดผ่านระบบนี้จะไม่มีลายเซ็นของเจ้าพนักงานท้องถิ่น
          </p>
          <p>
            ๒. วันที่รับเรื่องและวันที่ออก{isHazardous ? 'ใบรับคำขอ' : 'ใบรับแจ้ง'}ต้องออกให้ภายในวันเดียวกัน
          </p>
        </div>
      </div>
    </div>
  );
};
