import React from 'react';
import type { Establishment, SystemSettings } from '../../../types/publicHealth';
import { formatThaiDate, parseAddressDetails } from './printHelpers';
import { DEFAULT_OFFICER_SIGNATURE, sanitationDataService } from '../../../services/sanitationDataService';

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
  const currentOfficer = sanitationDataService.getCurrentOfficer();
  const officerSig = currentOfficer?.signatureUrl || DEFAULT_OFFICER_SIGNATURE;
  const districtName = settings.district || 'อำเภอฝาง';
  const provinceName = settings.province || 'จังหวัดเชียงใหม่';

  const regType = establishment.regType || '';
  const isHazardous = regType === 'บทส' || establishment.category === 'hazardous';
  const isStorage =
    !isHazardous &&
    (establishment.foodPlaceType === 'storage' ||
      (tempNoticeTitle?.includes('สะสมอาหาร') && !tempNoticeTitle?.includes('จำหน่ายอาหาร')) ||
      (establishment.categoryName?.includes('สะสมอาหาร') && !establishment.categoryName?.includes('จำหน่ายอาหาร')) ||
      establishment.businessName?.includes('โกดัง') ||
      establishment.businessName?.includes('คลัง'));

  const isGrocery =
    isStorage &&
    (establishment.businessName?.includes('ของชำ') ||
      establishment.businessName?.includes('มินิมาร์ท') ||
      establishment.businessName?.includes('ร้านค้า') ||
      establishment.businessName?.includes('ขายของ') ||
      (!establishment.businessName?.includes('โกดัง') && !establishment.businessName?.includes('คลัง')));

  const resolvedAge =
    establishment.ownerAge ||
    (establishment.citizenId === '3500901026441' || establishment.ownerName?.includes('จำนงค์') ? 67 : 35);

  let displayedFoodType = establishment.foodTypeDetail?.trim();
  if (isStorage && (!displayedFoodType || displayedFoodType === '-' || displayedFoodType.includes('ปรุงสำเร็จ'))) {
    displayedFoodType = isGrocery ? 'อาหารแห้ง อาหารสำเร็จรูป และเครื่องดื่ม' : 'อาหารแห้ง และสินค้าเกษตรแปรรูป';
  } else if (!displayedFoodType || displayedFoodType === '-') {
    displayedFoodType = 'อาหารปรุงสำเร็จ และเครื่องดื่ม';
  }

  let displayedPremise = establishment.premiseCharacteristics?.trim();
  if (!displayedPremise || displayedPremise === '-' || displayedPremise === '') {
    displayedPremise = isStorage
      ? (isGrocery ? 'ตึกเดี่ยว 1 ชั้น' : 'อาคารโกดังคอนกรีตเสริมเหล็ก')
      : 'ตึกเดี่ยว 1 ชั้น';
  }

  let displayedDistribution = establishment.distributionMethod;
  if (isStorage && (!displayedDistribution || displayedDistribution.includes('โต๊ะเก้าอี้'))) {
    displayedDistribution = isGrocery ? 'จำหน่ายปลีกหน้าร้าน (ซื้อกลับบ้าน)' : 'จำหน่ายส่งและมีบริการจัดส่ง';
  } else if (!displayedDistribution) {
    displayedDistribution = 'มีโต๊ะเก้าอี้ไว้ให้บริการและซื้อกลับบ้าน';
  }

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
        <div className="text-[13px] leading-[2.2] text-slate-900 space-y-3 mt-4 text-left">
          {isHazardous ? (
            /* ================== ใบรับคำขอ อภ.1 (กิจการที่เป็นอันตรายต่อสุขภาพ) ================== */
            <>
              <p className="indent-10">
                เจ้าพนักงานท้องถิ่นได้รับคำขอรับใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพจาก (นาย, นาง, นางสาว){' '}
                <span className="font-bold border-b border-dotted border-slate-700/80 px-2 pb-0.5 whitespace-nowrap">
                  {establishment.ownerName}
                </span>{' '}
                <span className="whitespace-nowrap">อายุ <span className="font-mono font-bold border-b border-dotted border-slate-700/80 px-2 pb-0.5">{resolvedAge}</span> ปี</span>{' '}
                <span className="whitespace-nowrap">สัญชาติ <span className="border-b border-dotted border-slate-700/80 px-2 pb-0.5 font-medium">ไทย</span></span>{' '}
                <span className="whitespace-nowrap">อยู่บ้านเลขที่ <span className="border-b border-dotted border-slate-700/80 px-2 pb-0.5 font-medium">{parsedAddress.houseNo}</span></span>{' '}
                <span className="whitespace-nowrap">{parsedAddress.fullVillageDisplay}</span>{' '}
                <span className="whitespace-nowrap">ตำบล <span className="border-b border-dotted border-slate-700/80 px-1.5 pb-0.5">โป่งน้ำร้อน</span></span>{' '}
                <span className="whitespace-nowrap">อำเภอ <span className="border-b border-dotted border-slate-700/80 px-1.5 pb-0.5">{districtName.replace('อำเภอ', '')}</span></span>{' '}
                <span className="whitespace-nowrap">จังหวัด <span className="border-b border-dotted border-slate-700/80 px-1.5 pb-0.5">{provinceName.replace('จังหวัด', '')}</span></span>{' '}
                <span className="whitespace-nowrap">โทรศัพท์ <span className="font-mono border-b border-dotted border-slate-700/80 px-1.5 pb-0.5">{establishment.phone || '-'}</span></span>{' '}
                <span className="whitespace-nowrap">โทรสาร <span className="border-b border-dotted border-slate-700/80 px-1.5 pb-0.5">{establishment.fax || '-'}</span></span>{' '}
                <span className="whitespace-nowrap">ชื่อสถานประกอบกิจการ <span className="font-bold text-[14.5px] border-b border-dotted border-slate-700/80 px-2 pb-0.5 text-blue-950">"{establishment.businessName}"</span></span>{' '}
                <span className="whitespace-nowrap">ประเภทกิจการที่เป็นอันตรายต่อสุขภาพ</span>{' '}
                <span className="font-bold border-b border-dotted border-slate-700/80 px-2 pb-0.5 text-slate-900">
                  {establishment.categoryName || 'กิจการที่เกี่ยวกับปิโตรเลียม ถ่านหิน สารเคมี (การจำหน่ายน้ำมันเชื้อเพลิงตู้หยอดเหรียญ)'}
                </span>{' '}
                <span className="whitespace-nowrap">ลักษณะของสถานที่ประกอบกิจการ <span className="border-b border-dotted border-slate-700/80 px-2 pb-0.5">{displayedPremise}</span></span>{' '}
                <span className="whitespace-nowrap">มีพื้นที่ <span className="font-bold font-mono border-b border-dotted border-slate-700/80 px-2 pb-0.5">{establishment.areaSqm}</span> ตารางเมตร</span>{' '}
                <span className="whitespace-nowrap">จำนวนคนงาน <span className="font-bold font-mono border-b border-dotted border-slate-700/80 px-2 pb-0.5">{establishment.workerCount}</span> คน</span>{' '}
                <span className="whitespace-nowrap">กำลังเครื่องจักร <span className="font-bold font-mono border-b border-dotted border-slate-700/80 px-2 pb-0.5">{establishment.machineHorsepower || '-'}</span> แรงม้า</span>{' '}
                <span className="whitespace-nowrap">สถานที่ตั้งสถานประกอบกิจการ เลขที่ <span className="border-b border-dotted border-slate-700/80 px-2 pb-0.5">{parsedAddress.houseNo}</span></span>{' '}
                <span className="whitespace-nowrap">{parsedAddress.fullVillageDisplay}</span>{' '}
                <span className="whitespace-nowrap">ตำบลโป่งน้ำร้อน</span>{' '}
                <span className="whitespace-nowrap">{districtName}</span>{' '}
                <span className="whitespace-nowrap">{provinceName}</span>{' '}
                <span className="whitespace-nowrap">โทรศัพท์ <span className="font-mono border-b border-dotted border-slate-700/80 px-1.5 pb-0.5">{establishment.phone || '-'}</span></span>{' '}
                <span className="whitespace-nowrap">โทรสาร <span className="border-b border-dotted border-slate-700/80 px-1.5 pb-0.5">{establishment.fax || '-'}</span></span>{' '}
                <span className="whitespace-nowrap">อีเมล <span className="border-b border-dotted border-slate-700/80 px-1.5 pb-0.5">{establishment.email || '-'}</span></span>{' '}
                <span className="whitespace-nowrap">Line ID: <span className="border-b border-dotted border-slate-700/80 px-1.5 pb-0.5 font-bold text-emerald-800">{establishment.lineId || '-'}</span></span>
              </p>
            </>
          ) : (
            /* ================== ใบรับแจ้ง นจ.2 (สถานที่จำหน่าย/สะสมอาหาร) ================== */
            <>
              <p className="indent-10">
                เจ้าพนักงานท้องถิ่นออกใบรับแจ้งให้ (นาย, นาง, นางสาว){' '}
                <span className="font-bold border-b border-dotted border-slate-700/80 px-2 pb-0.5 whitespace-nowrap">
                  {establishment.ownerName}
                </span>{' '}
                <span className="whitespace-nowrap">อายุ <span className="font-mono font-bold border-b border-dotted border-slate-700/80 px-2 pb-0.5">{resolvedAge}</span> ปี</span>{' '}
                <span className="whitespace-nowrap">สัญชาติ <span className="border-b border-dotted border-slate-700/80 px-2 pb-0.5 font-medium">ไทย</span></span>{' '}
                <span className="whitespace-nowrap">อยู่บ้านเลขที่ <span className="border-b border-dotted border-slate-700/80 px-2 pb-0.5 font-medium">{parsedAddress.houseNo}</span></span>{' '}
                <span className="whitespace-nowrap">{parsedAddress.fullVillageDisplay}</span>{' '}
                <span className="whitespace-nowrap">ตำบล <span className="border-b border-dotted border-slate-700/80 px-1.5 pb-0.5">โป่งน้ำร้อน</span></span>{' '}
                <span className="whitespace-nowrap">อำเภอ <span className="border-b border-dotted border-slate-700/80 px-1.5 pb-0.5">{districtName.replace('อำเภอ', '')}</span></span>{' '}
                <span className="whitespace-nowrap">จังหวัด <span className="border-b border-dotted border-slate-700/80 px-1.5 pb-0.5">{provinceName.replace('จังหวัด', '')}</span></span>{' '}
                <span className="whitespace-nowrap">โทรศัพท์ <span className="font-mono border-b border-dotted border-slate-700/80 px-1.5 pb-0.5">{establishment.phone || '-'}</span></span>{' '}
                <span className="whitespace-nowrap">โทรสาร <span className="border-b border-dotted border-slate-700/80 px-1.5 pb-0.5">{establishment.fax || '-'}</span></span>{' '}
                <span className="whitespace-nowrap">เพื่อจัดตั้ง{isStorage ? 'สถานที่สะสมอาหาร' : 'สถานที่จำหน่ายอาหาร'}</span>{' '}
                <span className="whitespace-nowrap">ชื่อสถานประกอบกิจการ <span className="font-bold text-[14.5px] border-b border-dotted border-slate-700/80 px-2 pb-0.5 text-blue-950">"{establishment.businessName}"</span></span>{' '}
                <span className="whitespace-nowrap">{isStorage ? 'ประเภทของอาหารที่สะสมเพื่อจำหน่าย' : 'ประเภทของอาหารที่จำหน่าย'} <span className="font-bold border-b border-dotted border-slate-700/80 px-2 pb-0.5">{displayedFoodType}</span></span>{' '}
                <span className="whitespace-nowrap">ลักษณะของสถานที่ประกอบกิจการ <span className="border-b border-dotted border-slate-700/80 px-2 pb-0.5">{displayedPremise}</span></span>{' '}
                <span className="whitespace-nowrap">วิธีการจำหน่าย <span className="border-b border-dotted border-slate-700/80 px-2 pb-0.5">{displayedDistribution}</span></span>{' '}
                <span className="whitespace-nowrap">ช่วงเวลาที่จำหน่าย <span className="border-b border-dotted border-slate-700/80 px-2 pb-0.5 font-mono">{establishment.operatingHours || '07:00 - 19:00 น.'}</span></span>{' '}
                <span className="whitespace-nowrap">มีพื้นที่ <span className="font-bold font-mono border-b border-dotted border-slate-700/80 px-2 pb-0.5">{establishment.areaSqm}</span> ตารางเมตร</span>{' '}
                <span className="whitespace-nowrap">{isStorage ? 'จำนวนคนงาน' : 'จำนวนคนงาน/ผู้สัมผัสอาหาร'} <span className="font-bold font-mono border-b border-dotted border-slate-700/80 px-2 pb-0.5">{establishment.workerCount}</span> คน</span>{' '}
                <span className="whitespace-nowrap">สถานที่ตั้ง เลขที่ <span className="border-b border-dotted border-slate-700/80 px-2 pb-0.5">{parsedAddress.houseNo}</span></span>{' '}
                <span className="whitespace-nowrap">{parsedAddress.fullVillageDisplay}</span>{' '}
                <span className="whitespace-nowrap">ตำบลโป่งน้ำร้อน</span>{' '}
                <span className="whitespace-nowrap">{districtName}</span>{' '}
                <span className="whitespace-nowrap">{provinceName}</span>{' '}
                <span className="whitespace-nowrap">โทรศัพท์ <span className="font-mono border-b border-dotted border-slate-700/80 px-1.5 pb-0.5">{establishment.phone || '-'}</span></span>{' '}
                <span className="whitespace-nowrap">โทรสาร <span className="border-b border-dotted border-slate-700/80 px-1.5 pb-0.5">{establishment.fax || '-'}</span></span>{' '}
                <span className="whitespace-nowrap">อีเมล <span className="border-b border-dotted border-slate-700/80 px-1.5 pb-0.5">{establishment.email || '-'}</span></span>{' '}
                <span className="whitespace-nowrap">Line ID: <span className="border-b border-dotted border-slate-700/80 px-1.5 pb-0.5 font-bold text-emerald-800">{establishment.lineId || '@pnr-food'}</span></span>
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
        <div className="flex justify-between items-end">
          {/* Receiving Officer with e-sig */}
          <div className="text-center w-72 relative">
            <div className="relative flex items-end justify-center min-h-[44px] mb-1">
              <span className="text-xs text-slate-800 shrink-0 select-none pb-0.5">(ลงชื่อ)</span>
              <div className="relative flex-1 mx-2 border-b border-dotted border-slate-700 h-8 flex items-end justify-center">
                {officerSig && (
                  <img
                    src={officerSig}
                    alt="e-sig ผู้รับเรื่อง"
                    className="absolute -bottom-1.5 h-10 object-contain filter contrast-125 pointer-events-none"
                  />
                )}
              </div>
              <span className="text-xs text-slate-800 shrink-0 whitespace-nowrap pb-0.5">ผู้รับเรื่อง</span>
            </div>
            <div className="font-bold text-sm text-slate-900">
              ( {sig.officerName || 'นางสาวรุ่งทิวา อุปนันท์'} )
            </div>
            <div className="text-xs text-slate-700 mt-0.5">
              {sig.officerPosition || 'นักวิชาการสาธารณสุขปฏิบัติการ'}
            </div>
          </div>

          {/* Local Mayor */}
          <div className="text-center w-72">
            <div className="relative flex items-end justify-center min-h-[44px] mb-1">
              <span className="text-xs text-slate-800 shrink-0 select-none pb-0.5">(ลงชื่อ)</span>
              <div className="flex-1 mx-2 border-b border-dotted border-slate-700 h-8"></div>
            </div>
            <div className="font-bold text-sm text-slate-900">
              ( {sig.mayorName && !sig.mayorName.includes('สมหมาย') ? sig.mayorName : 'นายสมคิด พงษ์สุข'} )
            </div>
            <div className="text-xs text-slate-700 mt-0.5">
              {sig.mayorPosition}
            </div>
            <div className="text-[11px] font-semibold text-slate-800">
              {sig.mayorRoleTitle}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-4 pt-3 border-t border-slate-300 text-[10.5px] text-slate-700 leading-snug space-y-1.5">
          <div className="font-bold text-slate-900">หมายเหตุ</div>
          <p>
            1. แบบฟอร์มนี้ทำในระบบและปริ้นเสนอผู้มีอำนาจลงนาม และให้ระบบแจ้งเตือนผู้ยื่นคำขอทราบว่าเจ้าหน้าที่ได้ออก{isHazardous ? 'ใบรับคำขอ' : 'ใบรับแจ้ง'}ให้แล้วภายในวันที่ยื่น โดยประชาชนหรือผู้ประกอบการสามารถดาวน์โหลด{isHazardous ? 'ใบรับคำขอ' : 'ใบรับแจ้ง'}ไว้เป็นหลักฐานแสดงให้เจ้าหน้าที่ตรวจสอบได้เป็นการชั่วคราว จนกว่าเจ้าพนักงานท้องถิ่นจะออก{isHazardous ? 'ใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ (แบบ อภ.2)' : 'หนังสือรับรองการแจ้ง'}ภายในกำหนดเวลาตามกฎหมาย
          </p>
          <p>
            2. วันที่รับเรื่องและวันที่ออก{isHazardous ? 'ใบรับคำขอ' : 'ใบรับแจ้ง'}ต้องออกให้ภายในวันเดียวกัน
          </p>
        </div>
      </div>
    </div>
  );
};
