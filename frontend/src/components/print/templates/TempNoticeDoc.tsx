import React from 'react';
import type { Establishment, SystemSettings } from '../../../types/publicHealth';
import {
  formatThaiDate,
  formatOfficialAddress,
  toThaiDigits
} from './printHelpers';
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

  const officialBadgeCode = toThaiDigits(tempNoticeCode);

  return (
    <div
      id="printable-temp-notice"
      className="printable-doc-root w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-8 sm:p-10 shadow-2xl border border-slate-300 print:shadow-none print:border-none print:w-full print:max-w-none print:p-0 print:m-0 flex flex-col justify-between relative overflow-hidden"
      style={{
        fontFamily: "'TH Sarabun New', 'TH Sarabun PSK', 'Sarabun', sans-serif",
        textAlign: 'left',
        fontSize: '16pt',
        lineHeight: '1.65',
        color: '#000000'
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
        <div className="flex justify-between items-start text-[15pt] text-black mb-1">
          <div className="font-bold">
            เลขรับคำขอที่: <span className="font-bold text-black px-1">{establishment.regNumber || '............'}</span>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="font-bold border border-black px-3 py-0.5 rounded text-[14pt]">
              {officialBadgeCode} (เอกสารชั่วคราว)
            </span>
            <div className="mt-0.5 text-[13pt] text-slate-700">
              ออกให้ ณ วันที่ยื่นเรื่อง (Day-1 Slip)
            </div>
          </div>
        </div>

        {/* Garuda Emblem */}
        <div className="garuda-emblem-container flex justify-center my-1 relative z-10">
          <img
            src="/garuda.png"
            alt="ตราครุฑประจำแบบพิมพ์ราชการ"
            className="w-[30mm] h-[30mm] object-contain filter contrast-125"
          />
        </div>

        {/* Title Header */}
        <div className="text-center my-2">
          <h1 className="text-[22pt] font-bold tracking-tight text-black leading-snug whitespace-pre-line">
            {tempNoticeTitle}
          </h1>
          <p className="text-[15pt] text-black mt-0.5">
            องค์การบริหารส่วนตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่
          </p>
        </div>

        {/* Body Content */}
        <div
          className="doc-body-content text-[16pt] text-black mt-3 text-left"
          style={{
            fontFamily: "'TH Sarabun New', 'TH Sarabun PSK', 'Sarabun', sans-serif",
            textAlign: 'left',
            lineHeight: '26pt'
          }}
        >
          {isHazardous ? (
            /* ================== ใบรับคำขอ อภ.1 (กิจการที่เป็นอันตรายต่อสุขภาพ) ================== */
            <p style={{ textIndent: '2.5cm', textAlign: 'left', lineHeight: '26pt', margin: 0 }}>
              เจ้าพนักงานท้องถิ่นได้รับคำขอรับใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพจาก{' '}
              <span className="font-bold">{establishment.ownerName}</span> อายุ{' '}
              <span className="font-bold">{resolvedAge}</span> ปี สัญชาติไทย อยู่บ้านเลขที่{' '}
              <span className="font-bold">{ownerAddr.formatted}</span>{' '}
              โทรศัพท์ <span className="font-bold">{establishment.phone || '-'}</span>{' '}
              {establishment.fax && establishment.fax !== '-' ? (
                <>โทรสาร <span className="font-bold">{establishment.fax}</span>{' '}</>
              ) : null}
              เพื่อประกอบกิจการที่เป็นอันตรายต่อสุขภาพ ประเภท{' '}
              <span className="font-bold">
                {establishment.categoryName || 'กิจการที่เกี่ยวกับปิโตรเลียม ถ่านหิน สารเคมี (การจำหน่ายน้ำมันเชื้อเพลิงตู้หยอดเหรียญ)'}
              </span>{' '}
              ชื่อสถานประกอบกิจการ <span className="font-bold">"{establishment.businessName}"</span>{' '}
              ลักษณะของสถานที่ประกอบกิจการ <span className="font-bold">{displayedPremise}</span>{' '}
              มีพื้นที่ <span className="font-bold">{establishment.areaSqm}</span> ตารางเมตร{' '}
              จำนวนคนงาน <span className="font-bold">{establishment.workerCount}</span> คน{' '}
              {establishment.machineHorsepower ? (
                <>กำลังเครื่องจักร <span className="font-bold">{establishment.machineHorsepower}</span> แรงม้า{' '}</>
              ) : null}
              สถานที่ตั้งสถานประกอบกิจการ เลขที่ <span className="font-bold">{premiseAddr.formatted}</span>{' '}
              โทรศัพท์ <span className="font-bold">{establishment.phone || '-'}</span>{' '}
              {establishment.email && establishment.email !== '-' ? (
                <>อีเมล <span className="font-bold">{establishment.email}</span>{' '}</>
              ) : null}
              {establishment.lineId && establishment.lineId !== '-' ? (
                <>Line ID: <span className="font-bold">{establishment.lineId}</span></>
              ) : null}
            </p>
          ) : (
            /* ================== ใบรับแจ้ง นจ.2 (สถานที่จำหน่าย/สะสมอาหาร) ================== */
            <p style={{ textIndent: '2.5cm', textAlign: 'left', lineHeight: '26pt', margin: 0 }}>
              เจ้าพนักงานท้องถิ่นออกใบรับแจ้งให้{' '}
              <span className="font-bold">{establishment.ownerName}</span> อายุ{' '}
              <span className="font-bold">{resolvedAge}</span> ปี สัญชาติไทย อยู่บ้านเลขที่{' '}
              <span className="font-bold">{ownerAddr.formatted}</span>{' '}
              โทรศัพท์ <span className="font-bold">{establishment.phone || '-'}</span>{' '}
              {establishment.fax && establishment.fax !== '-' ? (
                <>โทรสาร <span className="font-bold">{establishment.fax}</span>{' '}</>
              ) : null}
              เพื่อจัดตั้ง{isStorage ? 'สถานที่สะสมอาหาร' : 'สถานที่จำหน่ายอาหาร'}{' '}
              ชื่อสถานประกอบกิจการ <span className="font-bold">"{establishment.businessName}"</span>{' '}
              {isStorage ? 'ประเภทของอาหารที่สะสมเพื่อจำหน่าย' : 'ประเภทของอาหารที่จำหน่าย'}{' '}
              <span className="font-bold">{displayedFoodType}</span>{' '}
              ลักษณะของสถานที่ประกอบกิจการ <span className="font-bold">{displayedPremise}</span>{' '}
              วิธีการจำหน่าย <span className="font-bold">{displayedDistribution}</span>{' '}
              ช่วงเวลาที่จำหน่าย <span className="font-bold">{establishment.operatingHours || '07:00 - 19:00 น.'}</span>{' '}
              มีพื้นที่ <span className="font-bold">{establishment.areaSqm}</span> ตารางเมตร{' '}
              {isStorage ? 'จำนวนคนงาน' : 'จำนวนคนงาน/ผู้สัมผัสอาหาร'}{' '}
              <span className="font-bold">{establishment.workerCount}</span> คน{' '}
              สถานที่ตั้ง เลขที่ <span className="font-bold">{premiseAddr.formatted}</span>{' '}
              โทรศัพท์ <span className="font-bold">{establishment.phone || '-'}</span>
            </p>
          )}

          <div className="pt-3 border-t border-slate-300 mt-4 space-y-1 text-[15pt] text-black">
            <div>
              ได้รับเรื่องเมื่อวันที่{' '}
              <span className="font-bold">
                {formatThaiDate(establishment.applicationSubmissionDate || establishment.issueDate, false)}
              </span>
            </div>
            <div>
              ออกให้เมื่อวันที่{' '}
              <span className="font-bold">
                {formatThaiDate(establishment.temporarySlipIssuedDate || establishment.applicationSubmissionDate || establishment.issueDate, false)}
              </span>{' '}
              <span className="text-[13pt] text-emerald-800 font-bold">(ออกภายในวันเดียวกัน)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signature & Official Notes */}
      <div className="signatures-container relative z-10" style={{ marginTop: '20pt' }}>
        <div className="grid grid-cols-2 gap-8 items-end">
          {/* Receiving Officer with e-sig */}
          <div className="text-center w-full max-w-[280px] mx-auto relative">
            <div className="relative flex items-end justify-center min-h-[48px] mb-1">
              <span className="text-[15pt] text-black shrink-0 select-none pb-0.5">(ลงชื่อ)</span>
              <div className="relative flex-1 mx-2 border-b border-dotted border-black h-8 flex items-end justify-center">
                {officerSig && (
                  <img
                    src={officerSig}
                    alt="e-sig ผู้รับเรื่อง"
                    className="absolute -bottom-2 h-12 object-contain filter contrast-125 pointer-events-none"
                  />
                )}
              </div>
              <span className="text-[14pt] text-black shrink-0 whitespace-nowrap pb-0.5">ผู้รับเรื่อง</span>
            </div>
            <div className="font-bold text-[15pt] text-black">
              ( {sig.officerName || 'นางสาวรุ่งทิวา อุปนันท์'} )
            </div>
            <div className="text-[13pt] text-slate-700 mt-0.5">
              {sig.officerPosition || 'นักวิชาการสาธารณสุขปฏิบัติการ'}
            </div>
          </div>

          {/* Local Mayor */}
          <div className="text-center w-full max-w-[280px] mx-auto">
            <div className="relative flex items-end justify-center min-h-[48px] mb-1">
              <span className="text-[15pt] text-black shrink-0 select-none pb-0.5">(ลงชื่อ)</span>
              <div className="flex-1 mx-2 border-b border-dotted border-black h-8"></div>
              <span className="text-[14pt] text-black shrink-0 whitespace-nowrap pb-0.5">เจ้าพนักงาน</span>
            </div>
            <div className="font-bold text-[15pt] text-black">
              ( {sig.mayorName && !sig.mayorName.includes('สมหมาย') ? sig.mayorName : 'นายสมคิด พงษ์สุข'} )
            </div>
            <div className="text-[13pt] text-slate-700 mt-0.5">
              {sig.mayorPosition || 'นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน'}
            </div>
            <div className="text-[12pt] font-semibold text-black">
              {sig.mayorRoleTitle || 'เจ้าพนักงานท้องถิ่น'}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="border-t border-slate-300 text-[11pt] text-slate-700 leading-snug space-y-1" style={{ marginTop: '14pt', paddingTop: '6pt' }}>
          <div className="font-bold text-black">หมายเหตุ</div>
          <p>
            ๑. แบบฟอร์มนี้ทำในระบบและพิมพ์เสนอผู้มีอำนาจลงนาม และให้ระบบแจ้งเตือนผู้ยื่นคำขอทราบว่าเจ้าหน้าที่ได้ออก{isHazardous ? 'ใบรับคำขอ' : 'ใบรับแจ้ง'}ให้แล้วภายในวันที่ยื่น โดยประชาชนหรือผู้ประกอบการสามารถใช้เป็นหลักฐานแสดงให้เจ้าหน้าที่ตรวจสอบได้เป็นการชั่วคราว จนกว่าเจ้าพนักงานท้องถิ่นจะออก{isHazardous ? 'ใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ (แบบ อภ. ๒)' : 'หนังสือรับรองการแจ้ง (แบบ นจ. ๓)'}
          </p>
          <p>
            ๒. วันที่รับเรื่องและวันที่ออก{isHazardous ? 'ใบรับคำขอ' : 'ใบรับแจ้ง'}ต้องออกให้ภายในวันเดียวกัน
          </p>
        </div>
      </div>
    </div>
  );
};
