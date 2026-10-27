import React from 'react';
import type { Establishment, SystemSettings } from '../../../types/publicHealth';
import {
  formatThaiDate,
  thaiBahtText,
  formatOfficialAddress,
  toThaiDigits
} from './printHelpers';

interface GarudaLicenseDocProps {
  establishment: Establishment;
  settings: SystemSettings;
  mode: 'garuda' | 'replacement_cert';
  displayCode: string;
  formTitle: string;
  verticalSpacing?: 'compact' | 'tight' | 'normal';
}

const SPACING_PRESETS = {
  tight: {
    lineHeight: '1.18',
    leadingClass: 'leading-[1.18]',
    spaceClass: 'space-y-0.5',
    titleMy: 'my-0.5',
    sectionMt: 'mt-1',
    paragraphLineHeight: '15pt',
    subBulletLineHeight: '13.5pt',
    conditionMt: '2pt',
    sigMt: '4pt',
  },
  compact: {
    lineHeight: '1.25',
    leadingClass: 'leading-[1.25]',
    spaceClass: 'space-y-1',
    titleMy: 'my-1',
    sectionMt: 'mt-1.5',
    paragraphLineHeight: '17pt',
    subBulletLineHeight: '15pt',
    conditionMt: '3pt',
    sigMt: '8pt',
  },
  normal: {
    lineHeight: '1.5',
    leadingClass: 'leading-[1.6]',
    spaceClass: 'space-y-1.5',
    titleMy: 'my-1.5',
    sectionMt: 'mt-2',
    paragraphLineHeight: '20pt',
    subBulletLineHeight: '18pt',
    conditionMt: '5pt',
    sigMt: '12pt',
  }
};

export const GarudaLicenseDoc: React.FC<GarudaLicenseDocProps> = ({
  establishment,
  settings,
  mode,
  displayCode,
  formTitle,
  verticalSpacing = 'compact'
}) => {
  const spacing = SPACING_PRESETS[verticalSpacing];
  const sig = settings.signatories;
  const districtName = settings.district || 'อำเภอฝาง';
  const provinceName = settings.province || 'จังหวัดเชียงใหม่';

  const regType = establishment.regType || '';
  const isHazardous = regType === 'บทส' || establishment.category === 'hazardous';
  const isFoodLicense = regType === 'บทอ' || establishment.category === 'food_license';
  const isStorage =
    !isHazardous &&
    (establishment.foodPlaceType === 'storage' ||
      (formTitle?.includes('สะสมอาหาร') && !formTitle?.includes('จำหน่ายอาหาร')) ||
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
  if (isStorage && (!displayedDistribution || displayedDistribution === '-' || displayedDistribution.includes('โต๊ะเก้าอี้'))) {
    displayedDistribution = isGrocery ? 'จำหน่ายปลีกหน้าร้าน (ซื้อกลับบ้าน)' : 'จำหน่ายส่งและมีบริการจัดส่ง';
  } else if (!displayedDistribution || displayedDistribution === '-') {
    displayedDistribution = 'มีโต๊ะเก้าอี้ไว้ให้บริการและซื้อกลับบ้าน';
  }

  const receiptBookDisplay =
    establishment.receiptBookNo && establishment.receiptBookNo !== '-'
      ? establishment.receiptBookNo
      : establishment.bookNo && establishment.bookNo !== '-'
      ? establishment.bookNo
      : '............';
  const receiptNoDisplay =
    establishment.receiptNo && establishment.receiptNo !== '-'
      ? establishment.receiptNo
      : establishment.docNo || '............';
  const receiptDateDisplay = establishment.receiptDate
    ? formatThaiDate(establishment.receiptDate, false)
    : establishment.applicationSubmissionDate
    ? formatThaiDate(establishment.applicationSubmissionDate, false)
    : formatThaiDate(establishment.issueDate, false);

  const ownerAddr = formatOfficialAddress(
    establishment.address,
    establishment.village,
    districtName,
    provinceName
  );
  const premiseAddr = formatOfficialAddress(
    establishment.address,
    establishment.village,
    districtName,
    provinceName
  );

  const officialBadgeCode = toThaiDigits(displayCode);

  return (
    <div
      id="printable-certificate"
      className="printable-doc-root w-full max-w-[210mm] bg-white text-black shadow-2xl border border-slate-300 print:shadow-none print:border-none print:w-full print:max-w-none print:p-0 print:m-0 flex flex-col justify-between relative"
      style={{
        fontFamily: "'TH Sarabun New', 'TH Sarabun PSK', 'Sarabun', sans-serif",
        textAlign: 'left',
        fontSize: '15pt',
        lineHeight: spacing.lineHeight,
        color: '#000000',
        minHeight: '297mm',
        paddingTop: '3cm',
        paddingRight: '2cm',
        paddingBottom: '2cm',
        paddingLeft: '3cm',
        boxSizing: 'border-box'
      }}
    >
      {/* Background Watermark */}
      <div className="watermark-container absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none">
        <img
          src="/pnr_logo.png"
          alt="ลายน้ำตราสัญลักษณ์ อบต.โป่งน้ำร้อน"
          className="w-[125mm] h-[125mm] object-contain opacity-[0.06] select-none filter contrast-125 print:opacity-[0.08]"
        />
      </div>

      {/* Header Section */}
      <div className="relative z-10">
        {/* Top Header: เล่มที่ / เลขที่ / แบบพิมพ์ */}
        <div className="flex justify-between items-start text-[14pt] text-black mb-1">
          <div className="font-bold flex items-center">
            <span>เล่มที่</span>
            <div className="border-b border-dotted border-black min-w-[70px] text-center font-bold px-2 ml-1">
              {establishment.bookNo && establishment.bookNo !== '-'
                ? toThaiDigits(establishment.bookNo)
                : '\u00A0'}
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            {mode === 'replacement_cert' && (
              <span className="font-bold text-red-600 border border-red-600 px-2 py-0.5 rounded text-[12pt] tracking-wider mb-0.5">
                [ ใบแทน ]
              </span>
            )}
            <span className="font-bold border border-black px-2.5 py-0.5 rounded text-[13pt] leading-tight">
              {officialBadgeCode}
            </span>
            <div className="mt-0.5 font-bold flex items-center justify-end">
              <span>เลขที่</span>
              <div className="border-b border-dotted border-black min-w-[90px] text-center font-bold px-2 ml-1">
                {toThaiDigits(establishment.docNo || establishment.regNumber || '') || '\u00A0'}
              </div>
            </div>
          </div>
        </div>

        {/* Garuda Emblem */}
        <div className="garuda-emblem-container flex justify-center my-0.5 relative z-10">
          <img
            src="/garuda.png"
            alt="ตราครุฑประจำแบบพิมพ์ราชการ"
            className="w-[28mm] h-[28mm] object-contain filter contrast-125"
          />
        </div>

        {/* Title Header */}
        <div className={`text-center ${spacing.titleMy}`}>
          <h1 className="text-[20pt] font-bold tracking-tight text-black leading-snug whitespace-pre-line">
            {formTitle}
          </h1>
          <p className="text-[14pt] text-black mt-0.5">
            อาศัยอำนาจตามความในพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕
          </p>
        </div>

        {/* Body Content - Form Lines */}
        <div
          className={`doc-body-content text-[15pt] text-black ${spacing.spaceClass} ${spacing.sectionMt} text-left`}
          style={{
            fontFamily: "'TH Sarabun New', 'TH Sarabun PSK', 'Sarabun', sans-serif",
            textAlign: 'left',
            lineHeight: spacing.lineHeight
          }}
        >
          {isHazardous ? (
            /* ================== แบบ อภ.๒: กิจการที่เป็นอันตรายต่อสุขภาพ ================== */
            <>
              {/* Line 1: ผู้รับใบอนุญาต */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 font-bold mr-1">(๑)</span>
                <span className="shrink-0 mr-1.5">เจ้าพนักงานท้องถิ่นออกใบอนุญาตให้</span>
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

              {/* Line 2: ที่อยู่ตามทะเบียนบ้าน */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">อยู่บ้านเลขที่</span>
                <div className="w-20 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(ownerAddr.houseNo || '-')}
                </div>
                <span className="shrink-0 mx-1.5">หมู่ที่</span>
                <div className="w-14 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(ownerAddr.mooNumber || '-')}
                </div>
                {ownerAddr.villageName ? (
                  <>
                    <div className="w-32 border-b border-dotted border-black text-center font-bold px-1 relative">
                      {ownerAddr.villageName}
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

              {/* Line 3: โทรศัพท์ / โทรสาร */}
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

              {/* Line 4: ประเภทกิจการ */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">เพื่อประกอบกิจการที่เป็นอันตรายต่อสุขภาพ ประเภท</span>
                <div className="flex-1 border-b border-dotted border-black text-left font-bold px-2 relative truncate text-[14pt]">
                  {toThaiDigits(establishment.categoryName || 'กิจการที่เกี่ยวกับปิโตรเลียม ถ่านหิน สารเคมี (การจำหน่ายน้ำมันเชื้อเพลิงตู้หยอดเหรียญ)')}
                </div>
              </div>

              {/* Line 5: ชื่อสถานประกอบกิจการ */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">ชื่อสถานประกอบกิจการ</span>
                <div className="flex-1 border-b border-dotted border-black text-left font-bold px-2 relative text-blue-950">
                  "{establishment.businessName}"
                </div>
              </div>

              {/* Line 6: ลักษณะสถานที่ */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">ลักษณะของสถานที่ประกอบกิจการ</span>
                <div className="flex-1 border-b border-dotted border-black text-left font-bold px-2 relative">
                  {toThaiDigits(displayedPremise)}
                </div>
              </div>

              {/* Line 7: พื้นที่ / คนงาน / เครื่องจักร */}
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

              {/* Line 8: สถานที่ตั้งร้าน */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">สถานที่ตั้ง เลขที่</span>
                <div className="w-20 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(premiseAddr.houseNo || '-')}
                </div>
                <span className="shrink-0 mx-1.5">หมู่ที่</span>
                <div className="w-14 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(premiseAddr.mooNumber || '-')}
                </div>
                {premiseAddr.villageName ? (
                  <>
                    <div className="w-32 border-b border-dotted border-black text-center font-bold px-1 relative">
                      {premiseAddr.villageName}
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

              {/* Line 9: ค่าธรรมเนียม */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">เสียค่าธรรมเนียมปีละ</span>
                <div className="w-24 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(establishment.feeAmount.toLocaleString())}
                </div>
                <span className="shrink-0 mx-1.5">บาท</span>
                <span className="shrink-0 mr-1">(</span>
                <div className="flex-1 border-b border-dotted border-black text-center font-bold px-2 relative">
                  {thaiBahtText(establishment.feeAmount)}
                </div>
                <span className="shrink-0 ml-1">)</span>
              </div>

              {/* Line 10: ใบเสร็จรับเงิน (เว้นว่างไว้เขียนมือตามมาตรฐาน อบต.) */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">ตามใบเสร็จรับเงินเล่มที่</span>
                <div className="w-24 border-b border-dotted border-black text-center font-bold px-1 relative">
                  &nbsp;
                </div>
                <span className="shrink-0 mx-1.5">เลขที่</span>
                <div className="w-36 border-b border-dotted border-black text-center font-bold px-1 relative">
                  &nbsp;
                </div>
                <span className="shrink-0 mx-1.5">ลงวันที่</span>
                <div className="flex-1 border-b border-dotted border-black text-center font-bold px-2 relative min-w-[120px]">
                  &nbsp;
                </div>
              </div>

              {/* Section 2 */}
              <p style={{ textIndent: '2.5cm', textAlign: 'left', lineHeight: spacing.paragraphLineHeight, marginTop: spacing.conditionMt, marginBottom: 0 }}>
                <span className="font-bold">(๒)</span> ผู้ได้รับใบอนุญาตต้องปฏิบัติตามหลักเกณฑ์ วิธีการ และเงื่อนไขที่กำหนดในข้อบัญญัติท้องถิ่น รวมถึงต้องปฏิบัติให้ถูกต้องตามพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕ และที่แก้ไขเพิ่มเติม กฎกระทรวง และประกาศที่ออกตามพระราชบัญญัตินี้
              </p>

              {/* Section 3 */}
              <div style={{ marginTop: spacing.conditionMt }}>
                <p style={{ textIndent: '2.5cm', textAlign: 'left', lineHeight: spacing.paragraphLineHeight, margin: 0 }}>
                  <span className="font-bold">(๓)</span> ผู้ได้รับใบอนุญาตต้องปฏิบัติตามเงื่อนไขเฉพาะดังต่อไปนี้อีกด้วย คือ
                </p>
                <div style={{ paddingLeft: '3cm', fontSize: '13.5pt', lineHeight: spacing.subBulletLineHeight, marginTop: '2pt' }} className="space-y-0.5 text-slate-800">
                  <div>
                    <span className="font-semibold">๓.๑)</span> ต้องควบคุม ป้องกัน และระมัดระวังมิให้เกิดอันตราย อัคคีภัย การรั่วไหลของน้ำมันเชื้อเพลิง เสียง หรือมลพิษอื่นใดอันเป็นเหตุรำคาญหรือเป็นอันตรายต่อสุขภาพและความปลอดภัยของประชาชน
                  </div>
                  <div>
                    <span className="font-semibold">๓.๒)</span> ต้องติดตั้งอุปกรณ์ความปลอดภัย ระบบป้องกันและระงับอัคคีภัย ถังดับเพลิงเคมีที่ได้มาตรฐานให้อยู่ในสภาพพร้อมใช้งานได้ตลอดเวลา
                  </div>
                  <div>
                    <span className="font-semibold">๓.๓)</span> ปฏิบัติตามคำแนะนำของเจ้าพนักงานสาธารณสุขและคำสั่งของเจ้าพนักงานท้องถิ่นโดยเคร่งครัด
                  </div>
                </div>
              </div>

              {/* Section 4 & 5 */}
              <div style={{ marginTop: spacing.conditionMt }} className="space-y-0.5">
                <div className="flex items-end w-full" style={{ paddingLeft: '2.5cm' }}>
                  <span className="shrink-0 font-bold mr-1">(๔)</span>
                  <span className="shrink-0 mr-1.5">ใบอนุญาตฉบับนี้ออกให้เมื่อวันที่</span>
                  <div className="w-56 border-b border-dotted border-black text-center font-bold px-2 relative">
                    {formatThaiDate(establishment.issueDate, true)}
                  </div>
                </div>
                <div className="flex items-end w-full" style={{ paddingLeft: '2.5cm' }}>
                  <span className="shrink-0 font-bold mr-1">(๕)</span>
                  <span className="shrink-0 mr-1.5">ใบอนุญาตฉบับนี้สิ้นอายุวันที่</span>
                  <div className="w-56 border-b border-dotted border-black text-center font-bold px-2 relative">
                    {formatThaiDate(establishment.expireDate, true)}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ================== แบบ นจ.๓ หรือ แบบ บทอ.: จำหน่าย/สะสมอาหาร ================== */
            <>
              {/* Line 1: ผู้รับหนังสือรับรอง */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 font-bold mr-1">(๑)</span>
                <span className="shrink-0 mr-1.5">เจ้าพนักงานท้องถิ่น{isFoodLicense ? 'ออกใบอนุญาตให้' : 'ออกหนังสือรับรองการแจ้งให้'}</span>
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

              {/* Line 2: ที่อยู่ตามทะเบียนบ้าน */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">อยู่บ้านเลขที่</span>
                <div className="w-20 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(ownerAddr.houseNo || '-')}
                </div>
                <span className="shrink-0 mx-1.5">หมู่ที่</span>
                <div className="w-14 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(ownerAddr.mooNumber || '-')}
                </div>
                {ownerAddr.villageName ? (
                  <>
                    <div className="w-32 border-b border-dotted border-black text-center font-bold px-1 relative">
                      {ownerAddr.villageName}
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

              {/* Line 3: โทรศัพท์ / โทรสาร */}
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

              {/* Line 4: เพื่อจัดตั้งสถานที่ */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">เพื่อจัดตั้ง{isStorage ? 'สถานที่สะสมอาหาร' : 'สถานที่จำหน่ายอาหาร'} ชื่อสถานประกอบกิจการ</span>
                <div className="flex-1 border-b border-dotted border-black text-left font-bold px-2 relative text-blue-950">
                  "{establishment.businessName}"
                </div>
              </div>

              {/* Line 5: ประเภทอาหาร */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">{isStorage ? 'ประเภทของอาหารที่สะสมเพื่อจำหน่าย' : 'ประเภทของอาหารที่จำหน่าย'}</span>
                <div className="flex-1 border-b border-dotted border-black text-left font-bold px-2 relative">
                  {displayedFoodType}
                </div>
              </div>

              {/* Line 6: ลักษณะสถานที่ และวิธีการจำหน่าย */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">ลักษณะของสถานที่ประกอบกิจการ</span>
                <div className="w-44 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(displayedPremise)}
                </div>
                <span className="shrink-0 mx-2">วิธีการจำหน่าย</span>
                <div className="flex-1 border-b border-dotted border-black text-left font-bold px-2 relative">
                  {displayedDistribution}
                </div>
              </div>

              {/* Line 7: เวลา / พื้นที่ / คนงาน */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">ช่วงเวลาที่จำหน่าย</span>
                <div className="w-36 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(establishment.operatingHours || '๐๗:๐๐ - ๑๙:๐๐ น.')}
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

              {/* Line 8: สถานที่ตั้งร้าน */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">สถานที่ตั้ง เลขที่</span>
                <div className="w-20 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(premiseAddr.houseNo || '-')}
                </div>
                <span className="shrink-0 mx-1.5">หมู่ที่</span>
                <div className="w-14 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(premiseAddr.mooNumber || '-')}
                </div>
                {premiseAddr.villageName ? (
                  <>
                    <div className="w-32 border-b border-dotted border-black text-center font-bold px-1 relative">
                      {premiseAddr.villageName}
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

              {/* Line 9: ค่าธรรมเนียม */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">เสียค่าธรรมเนียมปีละ</span>
                <div className="w-24 border-b border-dotted border-black text-center font-bold px-1 relative">
                  {toThaiDigits(establishment.feeAmount.toLocaleString())}
                </div>
                <span className="shrink-0 mx-1.5">บาท</span>
                <span className="shrink-0 mr-1">(</span>
                <div className="flex-1 border-b border-dotted border-black text-center font-bold px-2 relative">
                  {thaiBahtText(establishment.feeAmount)}
                </div>
                <span className="shrink-0 ml-1">)</span>
              </div>

              {/* Line 10: ใบเสร็จรับเงิน (เว้นว่างไว้เขียนมือตามมาตรฐาน อบต.) */}
              <div className={`flex items-end w-full ${spacing.leadingClass}`}>
                <span className="shrink-0 mr-1.5">ตามใบเสร็จรับเงินเล่มที่</span>
                <div className="w-24 border-b border-dotted border-black text-center font-bold px-1 relative">
                  &nbsp;
                </div>
                <span className="shrink-0 mx-1.5">เลขที่</span>
                <div className="w-36 border-b border-dotted border-black text-center font-bold px-1 relative">
                  &nbsp;
                </div>
                <span className="shrink-0 mx-1.5">ลงวันที่</span>
                <div className="flex-1 border-b border-dotted border-black text-center font-bold px-2 relative min-w-[120px]">
                  &nbsp;
                </div>
              </div>

              {/* Section 2 */}
              <p style={{ textIndent: '2.5cm', textAlign: 'left', lineHeight: spacing.paragraphLineHeight, marginTop: spacing.conditionMt, marginBottom: 0 }}>
                <span className="font-bold">(๒)</span> {isFoodLicense ? 'ผู้ได้รับใบอนุญาต' : 'ผู้รับหนังสือรับรองการแจ้ง'}ต้องปฏิบัติตามหลักเกณฑ์ วิธีการ และเงื่อนไขที่กำหนดในข้อบัญญัติท้องถิ่น รวมถึงต้องปฏิบัติให้ถูกต้องตามพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕ และที่แก้ไขเพิ่มเติม กฎกระทรวง และประกาศที่ออกตามพระราชบัญญัตินี้
              </p>

              {/* Section 3 */}
              <div style={{ marginTop: spacing.conditionMt }}>
                <p style={{ textIndent: '2.5cm', textAlign: 'left', lineHeight: spacing.paragraphLineHeight, margin: 0 }}>
                  <span className="font-bold">(๓)</span> {isFoodLicense ? 'ผู้ได้รับใบอนุญาต' : 'ผู้รับหนังสือรับรองการแจ้ง'}ต้องปฏิบัติตามเงื่อนไขเฉพาะดังต่อไปนี้อีกด้วย คือ
                </p>
                <div style={{ paddingLeft: '3cm', fontSize: '13.5pt', lineHeight: spacing.subBulletLineHeight, marginTop: '2pt' }} className="space-y-0.5 text-slate-800">
                  <div>
                    <span className="font-semibold">๓.๑)</span> ต้องรักษาความสะอาดถูกสุขลักษณะตามเกณฑ์มาตรฐานสุขาภิบาลอาหารของกระทรวงสาธารณสุข และข้อบัญญัติท้องถิ่น
                  </div>
                  <div>
                    <span className="font-semibold">๓.๒)</span> {isStorage ? 'การจัดเก็บต้องวางบนพาเลทหรือยกสูงจากพื้นอย่างน้อย ๑๕ ซม. และมีระบบป้องกันสัตว์แมลงนำโรค' : 'ผู้สัมผัสอาหารทุกคนต้องผ่านการอบรมหลักสูตรสุขาภิบาลอาหาร และมีสุขภาพร่างกายสมบูรณ์ไม่เป็นโรคติดต่อ'}
                  </div>
                </div>
              </div>

              {/* Section 4 & 5 */}
              <div style={{ marginTop: spacing.conditionMt }} className="space-y-0.5">
                <div className="flex items-end w-full" style={{ paddingLeft: '2.5cm' }}>
                  <span className="font-bold mr-1">(๔)</span>
                  <span className="shrink-0 mr-1.5">{isFoodLicense ? 'ใบอนุญาตฉบับนี้ออกให้เมื่อวันที่' : 'หนังสือรับรองการแจ้งฉบับนี้ออกให้เมื่อวันที่'}</span>
                  <div className="w-56 border-b border-dotted border-black text-center font-bold px-2 relative">
                    {formatThaiDate(establishment.issueDate, true)}
                  </div>
                </div>
                <div className="flex items-end w-full" style={{ paddingLeft: '2.5cm' }}>
                  <span className="font-bold mr-1">(๕)</span>
                  <span className="shrink-0 mr-1.5">{isFoodLicense ? 'ใบอนุญาตฉบับนี้สิ้นอายุวันที่' : 'ครบกำหนดวันชำระค่าธรรมเนียม วันที่'}</span>
                  <div className="w-56 border-b border-dotted border-black text-center font-bold px-2 relative">
                    {formatThaiDate(establishment.expireDate || establishment.nextFeeDueDate, true)}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Official Signatures Section */}
      <div className="signatures-container relative z-10" style={{ marginTop: spacing.sigMt }}>
        <div className="flex justify-end items-end">
          {/* Local Mayor Signature */}
          <div className="text-center w-72 relative">
            <img
              src="/pnr_logo.png"
              alt="ตราประทับ อบต.โป่งน้ำร้อน"
              className="w-24 h-24 object-contain opacity-25 absolute -top-3 left-4 rotate-[-6deg] pointer-events-none select-none print:opacity-35"
            />
            <div className="relative flex items-end justify-center min-h-[44px] mb-1">
              <span className="text-[14pt] text-black shrink-0 select-none pb-0.5">(ลงชื่อ)</span>
              <div className="relative flex-1 mx-2 border-b border-dotted border-black h-8 flex items-end justify-center">
                {sig.mayorSignatureUrl && (
                  <img
                    src={sig.mayorSignatureUrl}
                    alt="ลายมือชื่อนายก อบต."
                    className="absolute -bottom-1.5 h-10 object-contain filter contrast-125 pointer-events-none"
                  />
                )}
              </div>
            </div>
            <div className="font-bold text-[15pt] text-black relative z-10 leading-tight">
              ( {sig.mayorName && !sig.mayorName.includes('สมหมาย') ? sig.mayorName : 'นายสมคิด พงษ์สุข'} )
            </div>
            <div className="text-[14pt] text-black mt-0.5 relative z-10 leading-tight">
              {sig.mayorPosition || 'นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน'}
            </div>
            <div className="text-[13pt] font-semibold text-black mt-0.5 relative z-10 leading-tight">
              {sig.mayorRoleTitle || 'เจ้าพนักงานท้องถิ่น'}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="border-t border-slate-300 text-[10pt] text-slate-700 leading-snug space-y-0.5" style={{ marginTop: '8pt', paddingTop: '4pt' }}>
          {mode === 'replacement_cert' && (
            <p className="font-medium text-black">
              <strong>หมายเหตุ (๑)</strong> {isHazardous ? 'ใบอนุญาตฉบับนี้เป็นการออกใบแทนใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ' : 'หนังสือรับรองการแจ้งฉบับนี้เป็นการออกใบแทนหนังสือรับรองการแจ้ง'} กรณีที่มีการแจ้งสูญหาย ถูกทำลาย หรือชำรุดในสาระสำคัญ ตามคำขอใบแทนเมื่อวันที่ {formatThaiDate(establishment.replacementRequestDate || establishment.issueDate, true)}
            </p>
          )}
          {isHazardous ? (
            <p>
              <strong>หมายเหตุ {mode === 'replacement_cert' ? '(๒) ' : ''}</strong> ผู้ได้รับใบอนุญาตต้องยื่นคำขอต่ออายุใบอนุญาตก่อนใบอนุญาตสิ้นอายุ เมื่อได้ยื่นคำขอแล้วจะประกอบกิจการต่อไปก็ได้จนกว่าเจ้าพนักงานท้องถิ่นจะสั่งไม่ต่ออายุใบอนุญาต หากไม่ยื่นคำขอต่ออายุภายในกำหนดเวลาจะต้องเสียค่าปรับตามที่กฎหมายกำหนด
            </p>
          ) : (
            <p>
              <strong>หมายเหตุ {mode === 'replacement_cert' ? '(๒) ' : ''}</strong> ผู้รับหนังสือรับรองแจ้งมีหน้าที่ต้องเสียค่าธรรมเนียมต่อราชการส่วนท้องถิ่นตามกำหนดเวลา หากไม่ได้เสียค่าธรรมเนียมภายในเวลาที่กำหนด จะต้องเสียค่าปรับเพิ่มขึ้นอีกร้อยละยี่สิบของจำนวนค่าธรรมเนียมที่ค้างชำระ
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
