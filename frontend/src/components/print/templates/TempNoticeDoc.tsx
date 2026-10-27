import React from 'react';
import type { Establishment, SystemSettings } from '../../../types/publicHealth';
import { formatThaiDate, formatOfficialAddress, toThaiDigits } from './printHelpers';
import { DEFAULT_OFFICER_SIGNATURE, sanitationDataService } from '../../../services/sanitationDataService';

interface TempNoticeDocProps {
  establishment: Establishment;
  settings: SystemSettings;
  tempNoticeCode: string;
  tempNoticeTitle: string;
  verticalSpacing?: 'compact' | 'tight' | 'normal';
}

const SPACING_PRESETS = {
  tight: {
    lineHeight: '1.18',
    leadingClass: 'leading-[1.18]',
    spaceClass: 'space-y-0.5',
    titleMy: 'my-1',
    sectionMt: 'mt-1',
    sigPt: 'pt-1.5',
  },
  compact: {
    lineHeight: '1.25',
    leadingClass: 'leading-[1.25]',
    spaceClass: 'space-y-1',
    titleMy: 'my-1.5',
    sectionMt: 'mt-1.5',
    sigPt: 'pt-2.5',
  },
  normal: {
    lineHeight: '1.5',
    leadingClass: 'leading-[1.6]',
    spaceClass: 'space-y-1.5',
    titleMy: 'my-3',
    sectionMt: 'mt-3',
    sigPt: 'pt-3',
  }
};

export const TempNoticeDoc: React.FC<TempNoticeDocProps> = ({
  establishment,
  settings,
  tempNoticeCode,
  tempNoticeTitle,
  verticalSpacing = 'compact'
}) => {
  const spacing = SPACING_PRESETS[verticalSpacing];
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

  const parsedAddress = formatOfficialAddress(establishment.address, establishment.village, districtName, provinceName);

  return (
    <div
      id="printable-temp-notice"
      className="printable-doc-root w-full max-w-[210mm] bg-white text-black shadow-2xl border border-slate-300 print:shadow-none print:border-none print:w-full print:max-w-none print:p-0 print:m-0 flex flex-col justify-between relative"
      style={{
        fontFamily: "'TH Sarabun New', 'TH Sarabun PSK', 'Sarabun', sans-serif",
        textAlign: 'left',
        fontSize: '15pt',
        lineHeight: spacing.lineHeight,
        color: '#000000',
        minHeight: '297mm',
        boxSizing: 'border-box'
      }}
    >
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none">
        <img
          src="/pnr_logo.png"
          alt="ลายน้ำตราสัญลักษณ์ อบต.โป่งน้ำร้อน"
          className="w-[130mm] h-[130mm] object-contain opacity-[0.07] select-none filter contrast-125 print:opacity-[0.08]"
        />
      </div>

      {/* Header Section (ระยะรวมจากหัวกระดาษถึงชื่อเรื่อง 3 ซม. พอดี) */}
      <div className="relative z-10">
        <div className="relative flex justify-between items-start text-xs text-slate-700 mb-1 min-h-[24mm] w-full">
          <div className="font-bold text-[14pt] pt-1 z-10 shrink-0">
            เลขรับคำขอที่: <span className="font-bold border-b border-dotted border-black px-2">{toThaiDigits(establishment.docNo || establishment.regNumber)}</span>
          </div>
          <div className="garuda-emblem-container absolute left-1/2 -translate-x-1/2 top-0 flex justify-center items-center pointer-events-none z-0">
            <img
              src="/garuda.png"
              alt="ตราครุฑประจำแบบพิมพ์ราชการ"
              className="w-[24mm] h-[24mm] object-contain filter contrast-125"
            />
          </div>
          <div className="text-right z-10 shrink-0">
            <span className="font-bold border border-black px-2.5 py-0.5 rounded text-[13pt] leading-tight whitespace-nowrap">
              {toThaiDigits(tempNoticeCode)} (เอกสารชั่วคราว)
            </span>
            <div className="mt-0.5 text-[11pt] text-slate-600 whitespace-nowrap">
              ออกให้ ณ วันที่ยื่นเรื่อง (Day-1 Slip)
            </div>
          </div>
        </div>

        {/* Title Header */}
        <div className={`text-center ${spacing.titleMy}`}>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
            {tempNoticeTitle}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            องค์การบริหารส่วนตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่
          </p>
        </div>

        {/* Body Content - Structured Form Rows */}
        <div
          className={`doc-body-content text-[15pt] text-black ${spacing.spaceClass} ${spacing.sectionMt} text-left`}
          style={{
            fontFamily: "'TH Sarabun New', 'TH Sarabun PSK', 'Sarabun', sans-serif",
            textAlign: 'left',
            lineHeight: spacing.lineHeight
          }}
        >
          {isHazardous ? (
            /* ================== ใบรับคำขอ อภ.1 (กิจการที่เป็นอันตรายต่อสุขภาพ) ================== */
            <>
              {/* Line 1 */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">เจ้าพนักงานท้องถิ่นได้รับคำขอรับใบอนุญาตจาก</span>
                <div className="flex-1 border-b border-dotted border-black text-center font-bold px-2 relative min-w-[120px]">
                  {establishment.ownerName}
                </div>
                <span className="shrink-0 mx-1.5">อายุ</span>
                <div className="w-16 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(resolvedAge)}
                </div>
                <span className="shrink-0 mx-1.5">ปี</span>
                <span className="shrink-0 mr-1.5">สัญชาติ</span>
                <div className="w-20 border-b border-dotted border-black text-center font-bold px-1 relative">
                  ไทย
                </div>
              </div>

              {/* Line 2 */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">อยู่บ้านเลขที่</span>
                <div className="w-20 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(parsedAddress.houseNo || '-')}
                </div>
                <span className="shrink-0 mx-1.5">หมู่ที่</span>
                <div className="w-14 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(parsedAddress.mooNumber || '-')}
                </div>
                {parsedAddress.villageName ? (
                  <>
                    <div className="w-32 border-b border-dotted border-black text-center font-bold px-1 relative">
                      {parsedAddress.villageName}
                    </div>
                    <span className="shrink-0 mx-0.5"></span>
                  </>
                ) : null}
                <span className="shrink-0 mx-1.5">ตำบล</span>
                <div className="w-24 border-b border-dotted border-black text-center font-bold px-1 relative">
                  โป่งน้ำร้อน
                </div>
                <span className="shrink-0 mx-1.5">อำเภอ</span>
                <div className="w-20 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {districtName.replace('อำเภอ', '')}
                </div>
                <span className="shrink-0 mx-1.5">จังหวัด</span>
                <div className="flex-1 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {provinceName.replace('จังหวัด', '')}
                </div>
              </div>

              {/* Line 3 */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">โทรศัพท์</span>
                <div className="flex-1 border-b border-dotted border-black text-center font-bold px-2 relative min-w-[120px]">
                  {toThaiDigits(establishment.phone || '-')}
                </div>
                <span className="shrink-0 mx-3">โทรสาร</span>
                <div className="flex-1 border-b border-dotted border-black text-center font-bold px-2 relative min-w-[120px]">
                  {toThaiDigits(establishment.fax && establishment.fax !== '-' ? establishment.fax : '-')}
                </div>
              </div>

              {/* Line 4 */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">เพื่อประกอบกิจการที่เป็นอันตรายต่อสุขภาพ ประเภท</span>
                <div className="flex-1 border-b border-dotted border-black text-left font-bold px-2 relative truncate text-[14pt]">
                  {establishment.categoryName || 'กิจการที่เกี่ยวกับปิโตรเลียม ถ่านหิน สารเคมี (การจำหน่ายน้ำมันเชื้อเพลิงตู้หยอดเหรียญ)'}
                </div>
              </div>

              {/* Line 5 */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">ชื่อสถานประกอบกิจการ</span>
                <div className="flex-1 border-b border-dotted border-black text-left font-bold px-2 relative text-blue-950">
                  "{establishment.businessName}"
                </div>
              </div>

              {/* Line 6 */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">ลักษณะของสถานที่ประกอบกิจการ</span>
                <div className="flex-1 border-b border-dotted border-black text-left font-bold px-2 relative">
                  {displayedPremise}
                </div>
              </div>

              {/* Line 7 */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">มีพื้นที่</span>
                <div className="w-20 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(establishment.areaSqm)}
                </div>
                <span className="shrink-0 mx-1.5">ตารางเมตร</span>
                <span className="shrink-0 mx-1.5">จำนวนคนงาน</span>
                <div className="w-16 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(establishment.workerCount)}
                </div>
                <span className="shrink-0 mx-1.5">คน</span>
                <span className="shrink-0 mx-1.5">กำลังเครื่องจักร</span>
                <div className="flex-1 border-b border-dotted border-black text-center font-bold px-1 relative min-w-[60px]">
                  {toThaiDigits(establishment.machineHorsepower || '-')}
                </div>
                <span className="shrink-0 ml-1.5">แรงม้า</span>
              </div>

              {/* Line 8 */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">สถานที่ตั้ง เลขที่</span>
                <div className="w-20 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(parsedAddress.houseNo || '-')}
                </div>
                <span className="shrink-0 mx-1.5">หมู่ที่</span>
                <div className="w-14 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(parsedAddress.mooNumber || '-')}
                </div>
                {parsedAddress.villageName ? (
                  <>
                    <div className="w-32 border-b border-dotted border-black text-center font-bold px-1 relative">
                      {parsedAddress.villageName}
                    </div>
                    <span className="shrink-0 mx-0.5"></span>
                  </>
                ) : null}
                <span className="shrink-0 mx-1.5">ตำบล</span>
                <div className="w-24 border-b border-dotted border-black text-center font-bold px-1 relative">
                  โป่งน้ำร้อน
                </div>
                <span className="shrink-0 mx-1.5">อำเภอ</span>
                <div className="w-20 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {districtName.replace('อำเภอ', '')}
                </div>
                <span className="shrink-0 mx-1.5">จังหวัด</span>
                <div className="flex-1 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {provinceName.replace('จังหวัด', '')}
                </div>
              </div>

              {/* Line 9: Contact */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">อีเมล</span>
                <div className="w-48 border-b border-dotted border-black text-center font-bold px-1 relative truncate">
                  {establishment.email && establishment.email !== '-' ? establishment.email : '-'}
                </div>
                <span className="shrink-0 mx-2">Line ID:</span>
                <div className="flex-1 border-b border-dotted border-black text-center font-bold px-2 relative text-emerald-800">
                  {establishment.lineId && establishment.lineId !== '-' ? establishment.lineId : '-'}
                </div>
              </div>
            </>
          ) : (
            /* ================== ใบรับแจ้ง นจ.2 (สถานที่จำหน่าย/สะสมอาหาร) ================== */
            <>
              {/* Line 1 */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">เจ้าพนักงานท้องถิ่นออกใบรับแจ้งให้</span>
                <div className="flex-1 border-b border-dotted border-black text-center font-bold px-2 relative min-w-[120px]">
                  {establishment.ownerName}
                </div>
                <span className="shrink-0 mx-1.5">อายุ</span>
                <div className="w-16 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(resolvedAge)}
                </div>
                <span className="shrink-0 mx-1.5">ปี</span>
                <span className="shrink-0 mr-1.5">สัญชาติ</span>
                <div className="w-20 border-b border-dotted border-black text-center font-bold px-1 relative">
                  ไทย
                </div>
              </div>

              {/* Line 2 */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">อยู่บ้านเลขที่</span>
                <div className="w-20 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(parsedAddress.houseNo || '-')}
                </div>
                <span className="shrink-0 mx-1.5">หมู่ที่</span>
                <div className="w-14 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(parsedAddress.mooNumber || '-')}
                </div>
                {parsedAddress.villageName ? (
                  <>
                    <div className="w-32 border-b border-dotted border-black text-center font-bold px-1 relative">
                      {parsedAddress.villageName}
                    </div>
                    <span className="shrink-0 mx-0.5"></span>
                  </>
                ) : null}
                <span className="shrink-0 mx-1.5">ตำบล</span>
                <div className="w-24 border-b border-dotted border-black text-center font-bold px-1 relative">
                  โป่งน้ำร้อน
                </div>
                <span className="shrink-0 mx-1.5">อำเภอ</span>
                <div className="w-20 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {districtName.replace('อำเภอ', '')}
                </div>
                <span className="shrink-0 mx-1.5">จังหวัด</span>
                <div className="flex-1 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {provinceName.replace('จังหวัด', '')}
                </div>
              </div>

              {/* Line 3 */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">โทรศัพท์</span>
                <div className="flex-1 border-b border-dotted border-black text-center font-bold px-2 relative min-w-[120px]">
                  {toThaiDigits(establishment.phone || '-')}
                </div>
                <span className="shrink-0 mx-3">โทรสาร</span>
                <div className="flex-1 border-b border-dotted border-black text-center font-bold px-2 relative min-w-[120px]">
                  {toThaiDigits(establishment.fax && establishment.fax !== '-' ? establishment.fax : '-')}
                </div>
              </div>

              {/* Line 4 */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">เพื่อจัดตั้ง{isStorage ? 'สถานที่สะสมอาหาร' : 'สถานที่จำหน่ายอาหาร'} ชื่อสถานประกอบกิจการ</span>
                <div className="flex-1 border-b border-dotted border-black text-left font-bold px-2 relative text-blue-950">
                  "{establishment.businessName}"
                </div>
              </div>

              {/* Line 5 */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">{isStorage ? 'ประเภทของอาหารที่สะสมเพื่อจำหน่าย' : 'ประเภทของอาหารที่จำหน่าย'}</span>
                <div className="flex-1 border-b border-dotted border-black text-left font-bold px-2 relative">
                  {displayedFoodType}
                </div>
              </div>

              {/* Line 6 */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1">ลักษณะของสถานที่ประกอบกิจการ</span>
                <div className="w-28 shrink-0 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(displayedPremise)}
                </div>
                <span className="shrink-0 mx-1.5">วิธีการจำหน่าย</span>
                <div className="flex-1 border-b border-dotted border-black text-left font-bold px-1.5 relative whitespace-nowrap overflow-visible">
                  {displayedDistribution}
                </div>
              </div>

              {/* Line 7 */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">ช่วงเวลาที่จำหน่าย</span>
                <div className="w-36 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(establishment.operatingHours || '07:00 - 19:00 น.')}
                </div>
                <span className="shrink-0 mx-1.5">มีพื้นที่</span>
                <div className="w-20 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(establishment.areaSqm)}
                </div>
                <span className="shrink-0 mx-1.5">ตารางเมตร</span>
                <span className="shrink-0 mx-1.5">{isStorage ? 'จำนวนคนงาน' : 'จำนวนคนงาน/ผู้สัมผัสอาหาร'}</span>
                <div className="flex-1 border-b border-dotted border-black text-center font-bold px-1 relative min-w-[50px]">
                  {toThaiDigits(establishment.workerCount)}
                </div>
                <span className="shrink-0 ml-1.5">คน</span>
              </div>

              {/* Line 8 */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">สถานที่ตั้ง เลขที่</span>
                <div className="w-20 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(parsedAddress.houseNo || '-')}
                </div>
                <span className="shrink-0 mx-1.5">หมู่ที่</span>
                <div className="w-14 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(parsedAddress.mooNumber || '-')}
                </div>
                {parsedAddress.villageName ? (
                  <>
                    <div className="w-32 border-b border-dotted border-black text-center font-bold px-1 relative">
                      {parsedAddress.villageName}
                    </div>
                    <span className="shrink-0 mx-0.5"></span>
                  </>
                ) : null}
                <span className="shrink-0 mx-1.5">ตำบล</span>
                <div className="w-24 border-b border-dotted border-black text-center font-bold px-1 relative">
                  โป่งน้ำร้อน
                </div>
                <span className="shrink-0 mx-1.5">อำเภอ</span>
                <div className="w-20 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {districtName.replace('อำเภอ', '')}
                </div>
                <span className="shrink-0 mx-1.5">จังหวัด</span>
                <div className="flex-1 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {provinceName.replace('จังหวัด', '')}
                </div>
              </div>

              {/* Line 9: Contact */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">อีเมล</span>
                <div className="w-48 border-b border-dotted border-black text-center font-bold px-1 relative truncate">
                  {establishment.email && establishment.email !== '-' ? establishment.email : '-'}
                </div>
                <span className="shrink-0 mx-2">Line ID:</span>
                <div className="flex-1 border-b border-dotted border-black text-center font-bold px-2 relative text-emerald-800">
                  {establishment.lineId && establishment.lineId !== '-' ? establishment.lineId : '-'}
                </div>
              </div>
            </>
          )}

          <div className="pt-2 border-t border-black/30 mt-3 space-y-1 text-[13.5pt] text-black">
            <div className="flex items-end">
              <span>ได้รับเรื่องเมื่อวันที่</span>
              <div className="border-b border-dotted border-black px-3 font-bold ml-1.5">
                {formatThaiDate(establishment.applicationSubmissionDate || establishment.issueDate, true)}
              </div>
            </div>
            <div className="flex items-end">
              <span>ออกให้เมื่อวันที่</span>
              <div className="border-b border-dotted border-black px-3 font-bold ml-1.5">
                {formatThaiDate(establishment.temporarySlipIssuedDate || establishment.applicationSubmissionDate || establishment.issueDate, true)}
              </div>
              <span className="text-[12pt] text-emerald-800 font-bold ml-2">(ออกภายในวันเดียวกัน)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signature & Official Notes */}
      <div className={`relative z-10 ${spacing.sigPt}`}>
        <div className="flex justify-between items-end">
          {/* Receiving Officer with e-sig */}
          <div className="text-center w-72 relative">
            <div className="relative flex items-end justify-center min-h-[44px] mb-1">
              <span className="text-[14pt] text-black shrink-0 select-none pb-0.5">(ลงชื่อ)</span>
              <div className="relative flex-1 mx-2 border-b border-dotted border-black h-8 flex items-end justify-center">
                {officerSig && (
                  <img
                    src={officerSig}
                    alt="e-sig ผู้รับเรื่อง"
                    className="absolute -bottom-1.5 h-10 object-contain filter contrast-125 pointer-events-none"
                  />
                )}
              </div>
              <span className="text-[14pt] text-black shrink-0 whitespace-nowrap pb-0.5">ผู้รับเรื่อง</span>
            </div>
            <div className="font-bold text-[15pt] text-black leading-tight">
              ( {sig.officerName || 'นางสาวรุ่งทิวา อุปนันท์'} )
            </div>
            <div className="text-[14pt] text-black mt-0.5 leading-tight">
              {sig.officerPosition || 'นักวิชาการสาธารณสุขปฏิบัติการ'}
            </div>
          </div>

          {/* Local Mayor */}
          <div className="text-center w-72">
            <div className="relative flex items-end justify-center min-h-[44px] mb-1">
              <span className="text-[14pt] text-black shrink-0 select-none pb-0.5">(ลงชื่อ)</span>
              <div className="flex-1 mx-2 border-b border-dotted border-black h-8"></div>
            </div>
            <div className="font-bold text-[15pt] text-black leading-tight">
              ( {sig.mayorName && !sig.mayorName.includes('สมหมาย') ? sig.mayorName : 'นายสมคิด พงษ์สุข'} )
            </div>
            <div className="text-[14pt] text-black mt-0.5 leading-tight">
              {sig.mayorPosition || 'นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน'}
            </div>
            <div className="text-[13pt] font-semibold text-black mt-0.5 leading-tight">
              {sig.mayorRoleTitle || 'เจ้าพนักงานท้องถิ่น'}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-3 pt-2 border-t border-slate-300 text-[10pt] text-slate-700 leading-snug space-y-0.5">
          <div className="font-bold text-black">หมายเหตุ</div>
          <p>
            ๑. แบบฟอร์มนี้ออกโดยระบบอิเล็กทรอนิกส์และเสนอผู้มีอำนาจลงนาม เพื่อเป็นหลักฐานแสดงให้เจ้าหน้าที่ตรวจสอบได้เป็นการชั่วคราว จนกว่าเจ้าพนักงานท้องถิ่นจะออก{isHazardous ? 'ใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ (แบบ อภ.๒)' : 'หนังสือรับรองการแจ้ง'}ภายในกำหนดเวลาตามกฎหมาย
          </p>
          <p>
            ๒. วันที่รับเรื่องและวันที่ออก{isHazardous ? 'ใบรับคำขอ' : 'ใบรับแจ้ง'}ต้องออกให้ภายในวันเดียวกัน
          </p>
        </div>
      </div>
    </div>
  );
};
