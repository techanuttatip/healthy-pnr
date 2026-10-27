import React from 'react';
import type { Establishment, SystemSettings } from '../../../types/publicHealth';
import {
  formatThaiDate,
  parseAddressDetails,
  thaiBahtText
} from './printHelpers';

interface GarudaLicenseDocProps {
  establishment: Establishment;
  settings: SystemSettings;
  mode: 'garuda' | 'replacement_cert';
  displayCode: string;
  formTitle: string;
}

export const GarudaLicenseDoc: React.FC<GarudaLicenseDocProps> = ({
  establishment,
  settings,
  mode,
  displayCode,
  formTitle
}) => {
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

  const receiptBookDisplay = establishment.receiptBookNo && establishment.receiptBookNo !== '-' ? establishment.receiptBookNo : (establishment.bookNo && establishment.bookNo !== '-' ? establishment.bookNo : '-');
  const receiptNoDisplay = establishment.receiptNo && establishment.receiptNo !== '-' ? establishment.receiptNo : (establishment.docNo || '-');
  const receiptDateDisplay = establishment.receiptDate ? formatThaiDate(establishment.receiptDate, false) : (establishment.applicationSubmissionDate ? formatThaiDate(establishment.applicationSubmissionDate, false) : formatThaiDate(establishment.issueDate, false));

  const parsedAddress = parseAddressDetails(establishment.address, establishment.village);

  return (
    <div
      id="printable-certificate"
      className="printable-doc-root w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-10 sm:p-14 shadow-2xl border border-slate-300 print:shadow-none print:border-none print:w-full print:max-w-none print:p-6 print:m-0 flex flex-col justify-between font-serif relative overflow-hidden"
      style={{ fontFamily: "'Sarabun', 'TH Sarabun New', serif" }}
    >
      {/* Background Watermark */}
      <div className="watermark-container absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none">
        <img
          src="/pnr_logo.png"
          alt="ลายน้ำตราสัญลักษณ์ อบต.โป่งน้ำร้อน"
          className="w-[130mm] h-[130mm] object-contain opacity-[0.08] select-none filter contrast-125 print:opacity-[0.09]"
        />
      </div>

      {/* Header Section */}
      <div className="relative z-10">
        <div className="flex justify-between items-start text-xs text-slate-700 mb-2">
          <div className="font-bold">
            เล่มที่{' '}
            <span className="font-mono text-sm border-b border-dotted border-slate-600 px-4 inline-block min-w-[70px] text-center font-bold text-slate-900">
              {establishment.bookNo && establishment.bookNo !== '-' ? establishment.bookNo : (establishment.receiptBookNo && establishment.receiptBookNo !== '-' ? establishment.receiptBookNo : '-')}
            </span>
          </div>
          <div className="text-right flex flex-col items-end">
            {mode === 'replacement_cert' && (
              <span className="font-extrabold text-red-600 border-2 border-red-600 px-3 py-0.5 rounded-xs text-xs tracking-wider mb-1">
                [ ใบแทน ]
              </span>
            )}
            <span className="font-bold border border-slate-600 px-2.5 py-0.5 rounded-xs text-xs">
              {displayCode}
            </span>
            <div className="mt-1 font-bold">
              เลขที่{' '}
              <span className="font-mono font-bold text-sm border-b border-dotted border-slate-600 px-4 inline-block min-w-[110px] text-center text-slate-900">
                {establishment.docNo || establishment.regNumber || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Garuda Emblem */}
        <div className="garuda-emblem-container flex justify-center my-2 relative z-10 transition-transform">
          <img
            src="/garuda.png"
            alt="ตราครุฑประจำแบบพิมพ์ราชการ"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain filter contrast-125"
          />
        </div>

        {/* Title Header */}
        <div className="text-center my-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug whitespace-pre-line">
            {formTitle}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            อาศัยอำนาจตามความในพระราชบัญญัติการสาธารณสุข พ.ศ. 2535
          </p>
        </div>

        {/* Body Content */}
        <div className="doc-body-content text-[14px] leading-[2.2] text-slate-900 space-y-3 mt-4 text-left font-serif">
          {isHazardous ? (
            /* ================== แบบ อภ.2: กิจการที่เป็นอันตรายต่อสุขภาพ ================== */
            <>
              <p className="indent-10">
                (1) เจ้าพนักงานท้องถิ่นออกใบอนุญาตให้{' '}
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
                <span className="whitespace-nowrap">เพื่อประกอบกิจการที่เป็นอันตรายต่อสุขภาพ ประเภท</span>{' '}
                <span className="font-bold border-b border-dotted border-slate-700/80 px-2 pb-0.5 text-slate-900">
                  {establishment.categoryName || 'กิจการที่เกี่ยวกับปิโตรเลียม ถ่านหิน สารเคมี (การจำหน่ายน้ำมันเชื้อเพลิงตู้หยอดเหรียญ)'}
                </span>{' '}
                <span className="whitespace-nowrap">ชื่อสถานประกอบกิจการ <span className="font-bold text-[14.5px] border-b border-dotted border-slate-700/80 px-2 pb-0.5 text-blue-950">"{establishment.businessName}"</span></span>{' '}
                <span className="whitespace-nowrap">ลักษณะของสถานที่ประกอบกิจการ <span className="border-b border-dotted border-slate-700/80 px-2 pb-0.5">{displayedPremise}</span></span>{' '}
                <span className="whitespace-nowrap">มีพื้นที่ <span className="font-bold font-mono border-b border-dotted border-slate-700/80 px-2 pb-0.5">{establishment.areaSqm}</span> ตารางเมตร</span>{' '}
                <span className="whitespace-nowrap">จำนวนคนงาน <span className="font-bold font-mono border-b border-dotted border-slate-700/80 px-2 pb-0.5">{establishment.workerCount}</span> คน</span>{' '}
                <span className="whitespace-nowrap">กำลังเครื่องจักร <span className="font-bold font-mono border-b border-dotted border-slate-700/80 px-2 pb-0.5">{establishment.machineHorsepower || '-'}</span> แรงม้า</span>{' '}
                <span className="whitespace-nowrap">สถานที่ตั้ง เลขที่ <span className="border-b border-dotted border-slate-700/80 px-2 pb-0.5">{parsedAddress.houseNo}</span></span>{' '}
                <span className="whitespace-nowrap">{parsedAddress.fullVillageDisplay}</span>{' '}
                <span className="whitespace-nowrap">ตำบลโป่งน้ำร้อน</span>{' '}
                <span className="whitespace-nowrap">{districtName}</span>{' '}
                <span className="whitespace-nowrap">{provinceName}</span>{' '}
                <span className="whitespace-nowrap">โทรศัพท์ <span className="font-mono border-b border-dotted border-slate-700/80 px-1.5 pb-0.5">{establishment.phone || '-'}</span></span>{' '}
                เสียค่าธรรมเนียมปีละ{' '}
                <span className="font-bold font-mono border-b border-dotted border-slate-700/80 px-2 pb-0.5 text-slate-950">
                  {establishment.feeAmount.toLocaleString()}
                </span>{' '}
                บาท ({thaiBahtText(establishment.feeAmount)}){' '}
                <span className="whitespace-nowrap">ตามใบเสร็จรับเงินเล่มที่ <span className="border-b border-dotted border-slate-700/80 px-2 font-mono pb-0.5">{receiptBookDisplay}</span></span>{' '}
                <span className="whitespace-nowrap">เลขที่ <span className="border-b border-dotted border-slate-700/80 px-2 font-mono pb-0.5">{receiptNoDisplay}</span></span>{' '}
                <span className="whitespace-nowrap">ลงวันที่ <span className="border-b border-dotted border-slate-700/80 px-2 pb-0.5">{receiptDateDisplay || '........................'}</span></span>
              </p>

              <p className="indent-10">
                (2) ผู้ได้รับใบอนุญาตต้องปฏิบัติตามหลักเกณฑ์ วิธีการ และเงื่อนไขที่กำหนดในข้อบัญญัติท้องถิ่น รวมถึงต้องปฏิบัติให้ถูกต้องตามพระราชบัญญัติการสาธารณสุข พ.ศ. 2535 และที่แก้ไขเพิ่มเติม กฎกระทรวง และประกาศที่ออกตามพระราชบัญญัตินี้
              </p>

              <div>
                <p className="indent-10">
                  (3) ผู้ได้รับใบอนุญาตต้องปฏิบัติตามเงื่อนไขเฉพาะดังต่อไปนี้อีกด้วย คือ
                </p>
                <div className="pl-14 space-y-1 text-[13px] text-slate-800 pt-1">
                  <div>3.1) ต้องควบคุม ป้องกัน และระมัดระวังมิให้เกิดอันตราย อัคคีภัย การรั่วไหลของน้ำมันเชื้อเพลิง เสียง หรือมลพิษอื่นใดอันเป็นเหตุรำคาญหรือเป็นอันตรายต่อสุขภาพและความปลอดภัยของประชาชน</div>
                  <div>3.2) ต้องติดตั้งอุปกรณ์ความปลอดภัย ระบบป้องกันและระงับอัคคีภัย ถังดับเพลิงเคมีที่ได้มาตรฐานให้อยู่ในสภาพพร้อมใช้งานได้ตลอดเวลา</div>
                  <div>3.3) ปฏิบัติตามคำแนะนำของเจ้าพนักงานสาธารณสุขและคำสั่งของเจ้าพนักงานท้องถิ่นโดยเคร่งครัด</div>
                </div>
              </div>

              <div className="space-y-1 text-[13px] text-slate-800 pt-1 font-medium">
                <p className="indent-10">
                  (4) ใบอนุญาตฉบับนี้ออกให้เมื่อวันที่{' '}
                  <span className="font-mono font-bold border-b border-dotted border-slate-700/80 px-2 pb-0.5 whitespace-nowrap text-slate-950">
                    {formatThaiDate(establishment.issueDate, false)}
                  </span>
                </p>
                <p className="indent-10">
                  (5) ใบอนุญาตฉบับนี้สิ้นอายุวันที่{' '}
                  <span className="font-mono font-bold border-b border-dotted border-slate-700/80 px-2 pb-0.5 whitespace-nowrap text-slate-950">
                    {formatThaiDate(establishment.expireDate, false)}
                  </span>
                </p>
              </div>
            </>
          ) : (
            /* ================== แบบ นจ.3 หรือ บทอ.: จำหน่าย/สะสมอาหาร ================== */
            <>
              <p className="indent-10">
                (1) เจ้าพนักงานท้องถิ่น{isFoodLicense ? 'ออกใบอนุญาตให้' : 'ออกใบรับแจ้งให้'}{' '}
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
                เสียค่าธรรมเนียมปีละ{' '}
                <span className="font-bold font-mono border-b border-dotted border-slate-700/80 px-2 pb-0.5 text-slate-950">
                  {establishment.feeAmount.toLocaleString()}
                </span>{' '}
                บาท ({thaiBahtText(establishment.feeAmount)}){' '}
                <span className="whitespace-nowrap">ตามใบเสร็จรับเงินเล่มที่ <span className="border-b border-dotted border-slate-700/80 px-2 font-mono pb-0.5">{receiptBookDisplay}</span></span>{' '}
                <span className="whitespace-nowrap">เลขที่ <span className="border-b border-dotted border-slate-700/80 px-2 font-mono pb-0.5">{receiptNoDisplay}</span></span>{' '}
                <span className="whitespace-nowrap">ลงวันที่ <span className="border-b border-dotted border-slate-700/80 px-2 pb-0.5">{receiptDateDisplay || '........................'}</span></span>
              </p>

              <p className="indent-10">
                (2) {isFoodLicense ? 'ผู้ได้รับใบอนุญาต' : 'ผู้รับหนังสือรับรองการแจ้ง'}ต้องปฏิบัติตามหลักเกณฑ์ วิธีการ และเงื่อนไขที่กำหนดในข้อบัญญัติท้องถิ่น รวมถึงต้องปฏิบัติให้ถูกต้องตามพระราชบัญญัติการสาธารณสุข พ.ศ. 2535 และที่แก้ไขเพิ่มเติม กฎกระทรวง และประกาศที่ออกตามพระราชบัญญัตินี้
              </p>

              <div>
                <p className="indent-10">
                  (3) {isFoodLicense ? 'ผู้ได้รับใบอนุญาต' : 'ผู้รับหนังสือรับรองการแจ้ง'}ต้องปฏิบัติตามเงื่อนไขเฉพาะดังต่อไปนี้อีกด้วย คือ
                </p>
                <div className="pl-14 space-y-1 text-[13px] text-slate-800 pt-1">
                  <div>3.1) ต้องรักษาความสะอาดถูกสุขลักษณะตามเกณฑ์มาตรฐานสุขาภิบาลอาหารของกระทรวงสาธารณสุข และข้อบัญญัติท้องถิ่น</div>
                  <div>3.2) {isStorage ? 'การจัดเก็บต้องวางบนพาเลทหรือยกสูงจากพื้นอย่างน้อย 15 ซม. และมีระบบป้องกันสัตว์แมลงนำโรค' : 'ผู้สัมผัสอาหารทุกคนต้องผ่านการอบรมหลักสูตรสุขาภิบาลอาหาร และมีสุขภาพร่างกายสมบูรณ์ไม่เป็นโรคติดต่อ'}</div>
                </div>
              </div>

              <div className="space-y-1 text-[13px] text-slate-800 pt-1 font-medium">
                <p className="indent-10">
                  (4) {isFoodLicense ? 'ใบอนุญาตฉบับนี้ออกให้เมื่อวันที่' : 'หนังสือรับรองการแจ้งฉบับนี้ออกให้เมื่อวันที่'}{' '}
                  <span className="font-mono font-bold border-b border-dotted border-slate-700/80 px-2 pb-0.5 whitespace-nowrap text-slate-950">
                    {formatThaiDate(establishment.issueDate, false)}
                  </span>
                </p>
                <p className="indent-10">
                  (5) {isFoodLicense ? 'ใบอนุญาตฉบับนี้สิ้นอายุวันที่' : 'ครบกำหนดวันชำระค่าธรรมเนียม วันที่'}{' '}
                  <span className="font-mono font-bold border-b border-dotted border-slate-700/80 px-2 pb-0.5 whitespace-nowrap text-slate-950">
                    {formatThaiDate(establishment.expireDate || establishment.nextFeeDueDate, false)}
                  </span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Official Signatures Section (No QR Codes) */}
      <div className="signatures-container relative z-10 pt-4">
        <div className="flex justify-end items-end">
          {/* Local Mayor Signature */}
          <div className="text-center w-72 relative">
            <img
              src="/pnr_logo.png"
              alt="ตราประทับ อบต.โป่งน้ำร้อน"
              className="w-24 h-24 object-contain opacity-25 absolute -top-4 right-4 rotate-[-8deg] pointer-events-none select-none print:opacity-35"
            />
            <div className="relative flex items-end justify-center min-h-[44px] mb-1">
              <span className="text-xs text-slate-800 shrink-0 select-none pb-0.5">(ลงชื่อ)</span>
              <div className="relative flex-1 mx-2 border-b border-dotted border-slate-700 h-8 flex items-end justify-center">
                {sig.mayorSignatureUrl && (
                  <img
                    src={sig.mayorSignatureUrl}
                    alt="ลายมือชื่อนายก อบต."
                    className="absolute -bottom-1.5 h-10 object-contain filter contrast-125 pointer-events-none"
                  />
                )}
              </div>
            </div>
            <div className="font-bold text-sm text-slate-900 relative z-10">
              ( {sig.mayorName && !sig.mayorName.includes('สมหมาย') ? sig.mayorName : 'นายสมคิด พงษ์สุข'} )
            </div>
            <div className="text-xs text-slate-700 mt-0.5 relative z-10">
              {sig.mayorPosition}
            </div>
            <div className="text-[11px] font-semibold text-slate-800 relative z-10">
              {sig.mayorRoleTitle}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-4 pt-2 border-t border-slate-300 text-[10px] text-slate-600 leading-snug space-y-1">
          {mode === 'replacement_cert' && (
            <p className="font-medium text-slate-800">
              <strong>หมายเหตุ (1)</strong> {isHazardous ? 'ใบอนุญาตฉบับนี้เป็นการออกใบแทนใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ' : 'หนังสือรับรองการแจ้งฉบับนี้เป็นการออกใบแทนหนังสือรับรองการแจ้ง'} กรณีที่มีการแจ้งสูญหาย ถูกทำลาย หรือชำรุดในสาระสำคัญ ตามคำขอใบแทนเมื่อวันที่ {formatThaiDate(establishment.replacementRequestDate || establishment.issueDate, false)}
            </p>
          )}
          {isHazardous ? (
            <p>
              <strong>หมายเหตุ {mode === 'replacement_cert' ? '(2) ' : ''}</strong> ผู้ได้รับใบอนุญาตต้องยื่นคำขอต่ออายุใบอนุญาตก่อนใบอนุญาตสิ้นอายุ เมื่อได้ยื่นคำขอแล้วจะประกอบกิจการต่อไปก็ได้จนกว่าเจ้าพนักงานท้องถิ่นจะสั่งไม่ต่ออายุใบอนุญาต หากไม่ยื่นคำขอต่ออายุภายในกำหนดเวลาจะต้องเสียค่าปรับตามที่กฎหมายกำหนด
            </p>
          ) : (
            <p>
              <strong>หมายเหตุ {mode === 'replacement_cert' ? '(2) ' : ''}</strong> ผู้รับหนังสือรับรองแจ้งมีหน้าที่ต้องเสียค่าธรรมเนียมต่อราชการส่วนท้องถิ่นตามกำหนดเวลา หากไม่ได้เสียค่าธรรมเนียมภายในเวลาที่กำหนด จะต้องเสียค่าปรับเพิ่มขึ้นอีกร้อยละยี่สิบของจำนวนค่าธรรมเนียมที่ค้างชำระ
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
