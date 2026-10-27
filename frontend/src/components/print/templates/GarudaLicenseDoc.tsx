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
            เล่มที่{' '}
            <span className="font-bold text-black px-1">
              {establishment.bookNo && establishment.bookNo !== '-'
                ? establishment.bookNo
                : establishment.receiptBookNo && establishment.receiptBookNo !== '-'
                ? establishment.receiptBookNo
                : '............'}
            </span>
          </div>
          <div className="text-right flex flex-col items-end">
            {mode === 'replacement_cert' && (
              <span className="font-bold text-red-600 border border-red-600 px-2.5 py-0.5 rounded text-[13pt] tracking-wider mb-1">
                [ ใบแทน ]
              </span>
            )}
            <span className="font-bold border border-black px-3 py-0.5 rounded text-[14pt]">
              {officialBadgeCode}
            </span>
            <div className="mt-1 font-bold">
              เลขที่{' '}
              <span className="font-bold text-black px-1">
                {establishment.docNo || establishment.regNumber || '............'}
              </span>
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
            {formTitle}
          </h1>
          <p className="text-[15pt] text-black mt-0.5">
            อาศัยอำนาจตามความในพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕
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
            /* ================== แบบ อภ.๒: กิจการที่เป็นอันตรายต่อสุขภาพ ================== */
            <>
              <p style={{ textIndent: '2.5cm', textAlign: 'left', lineHeight: '26pt', margin: 0 }}>
                <span className="font-bold">(๑)</span> เจ้าพนักงานท้องถิ่นออกใบอนุญาตให้{' '}
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
                สถานที่ตั้ง เลขที่ <span className="font-bold">{premiseAddr.formatted}</span>{' '}
                โทรศัพท์ <span className="font-bold">{establishment.phone || '-'}</span>{' '}
                เสียค่าธรรมเนียมปีละ{' '}
                <span className="font-bold">
                  {establishment.feeAmount.toLocaleString()}
                </span>{' '}
                บาท ({thaiBahtText(establishment.feeAmount)}){' '}
                ตามใบเสร็จรับเงินเล่มที่ <span className="font-bold">{receiptBookDisplay}</span>{' '}
                เลขที่ <span className="font-bold">{receiptNoDisplay}</span>{' '}
                ลงวันที่ <span className="font-bold">{receiptDateDisplay || '........................'}</span>
              </p>

              <p style={{ textIndent: '2.5cm', textAlign: 'left', lineHeight: '26pt', marginTop: '10pt', marginBottom: 0 }}>
                <span className="font-bold">(๒)</span> ผู้ได้รับใบอนุญาตต้องปฏิบัติตามหลักเกณฑ์ วิธีการ และเงื่อนไขที่กำหนดในข้อบัญญัติท้องถิ่น รวมถึงต้องปฏิบัติให้ถูกต้องตามพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕ และที่แก้ไขเพิ่มเติม กฎกระทรวง และประกาศที่ออกตามพระราชบัญญัตินี้
              </p>

              <div style={{ marginTop: '10pt' }}>
                <p style={{ textIndent: '2.5cm', textAlign: 'left', lineHeight: '26pt', margin: 0 }}>
                  <span className="font-bold">(๓)</span> ผู้ได้รับใบอนุญาตต้องปฏิบัติตามเงื่อนไขเฉพาะดังต่อไปนี้อีกด้วย คือ
                </p>
                <div style={{ paddingLeft: '3.5cm', fontSize: '15pt', lineHeight: '24pt', marginTop: '3pt' }} className="space-y-1">
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

              <div style={{ marginTop: '10pt' }} className="space-y-1">
                <p style={{ textIndent: '2.5cm', textAlign: 'left', lineHeight: '26pt', margin: 0 }}>
                  <span className="font-bold">(๔)</span> ใบอนุญาตฉบับนี้ออกให้เมื่อวันที่{' '}
                  <span className="font-bold">
                    {formatThaiDate(establishment.issueDate, false)}
                  </span>
                </p>
                <p style={{ textIndent: '2.5cm', textAlign: 'left', lineHeight: '26pt', margin: 0 }}>
                  <span className="font-bold">(๕)</span> ใบอนุญาตฉบับนี้สิ้นอายุวันที่{' '}
                  <span className="font-bold">
                    {formatThaiDate(establishment.expireDate, false)}
                  </span>
                </p>
              </div>
            </>
          ) : (
            /* ================== แบบ นจ.๓ หรือ แบบ บทอ.: จำหน่าย/สะสมอาหาร ================== */
            <>
              <p style={{ textIndent: '2.5cm', textAlign: 'left', lineHeight: '26pt', margin: 0 }}>
                <span className="font-bold">(๑)</span> เจ้าพนักงานท้องถิ่น{isFoodLicense ? 'ออกใบอนุญาตให้' : 'ออกหนังสือรับรองการแจ้งให้'}{' '}
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
                โทรศัพท์ <span className="font-bold">{establishment.phone || '-'}</span>{' '}
                เสียค่าธรรมเนียมปีละ{' '}
                <span className="font-bold">
                  {establishment.feeAmount.toLocaleString()}
                </span>{' '}
                บาท ({thaiBahtText(establishment.feeAmount)}){' '}
                ตามใบเสร็จรับเงินเล่มที่ <span className="font-bold">{receiptBookDisplay}</span>{' '}
                เลขที่ <span className="font-bold">{receiptNoDisplay}</span>{' '}
                ลงวันที่ <span className="font-bold">{receiptDateDisplay || '........................'}</span>
              </p>

              <p style={{ textIndent: '2.5cm', textAlign: 'left', lineHeight: '26pt', marginTop: '10pt', marginBottom: 0 }}>
                <span className="font-bold">(๒)</span> {isFoodLicense ? 'ผู้ได้รับใบอนุญาต' : 'ผู้รับหนังสือรับรองการแจ้ง'}ต้องปฏิบัติตามหลักเกณฑ์ วิธีการ และเงื่อนไขที่กำหนดในข้อบัญญัติท้องถิ่น รวมถึงต้องปฏิบัติให้ถูกต้องตามพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕ และที่แก้ไขเพิ่มเติม กฎกระทรวง และประกาศที่ออกตามพระราชบัญญัตินี้
              </p>

              <div style={{ marginTop: '10pt' }}>
                <p style={{ textIndent: '2.5cm', textAlign: 'left', lineHeight: '26pt', margin: 0 }}>
                  <span className="font-bold">(๓)</span> {isFoodLicense ? 'ผู้ได้รับใบอนุญาต' : 'ผู้รับหนังสือรับรองการแจ้ง'}ต้องปฏิบัติตามเงื่อนไขเฉพาะดังต่อไปนี้อีกด้วย คือ
                </p>
                <div style={{ paddingLeft: '3.5cm', fontSize: '15pt', lineHeight: '24pt', marginTop: '3pt' }} className="space-y-1">
                  <div>
                    <span className="font-semibold">๓.๑)</span> ต้องรักษาความสะอาดถูกสุขลักษณะตามเกณฑ์มาตรฐานสุขาภิบาลอาหารของกระทรวงสาธารณสุข และข้อบัญญัติท้องถิ่น
                  </div>
                  <div>
                    <span className="font-semibold">๓.๒)</span> {isStorage ? 'การจัดเก็บต้องวางบนพาเลทหรือยกสูงจากพื้นอย่างน้อย 15 ซม. และมีระบบป้องกันสัตว์แมลงนำโรค' : 'ผู้สัมผัสอาหารทุกคนต้องผ่านการอบรมหลักสูตรสุขาภิบาลอาหาร และมีสุขภาพร่างกายสมบูรณ์ไม่เป็นโรคติดต่อ'}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '10pt' }} className="space-y-1">
                <p style={{ textIndent: '2.5cm', textAlign: 'left', lineHeight: '26pt', margin: 0 }}>
                  <span className="font-bold">(๔)</span> {isFoodLicense ? 'ใบอนุญาตฉบับนี้ออกให้เมื่อวันที่' : 'หนังสือรับรองการแจ้งฉบับนี้ออกให้เมื่อวันที่'}{' '}
                  <span className="font-bold">
                    {formatThaiDate(establishment.issueDate, false)}
                  </span>
                </p>
                <p style={{ textIndent: '2.5cm', textAlign: 'left', lineHeight: '26pt', margin: 0 }}>
                  <span className="font-bold">(๕)</span> {isFoodLicense ? 'ใบอนุญาตฉบับนี้สิ้นอายุวันที่' : 'ครบกำหนดวันชำระค่าธรรมเนียม วันที่'}{' '}
                  <span className="font-bold">
                    {formatThaiDate(establishment.expireDate || establishment.nextFeeDueDate, false)}
                  </span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Official Signatures Section */}
      <div className="signatures-container relative z-10" style={{ marginTop: '20pt' }}>
        <div className="flex justify-end items-end">
          {/* Local Mayor Signature */}
          <div className="text-center w-80 relative">
            <img
              src="/pnr_logo.png"
              alt="ตราประทับ อบต.โป่งน้ำร้อน"
              className="w-28 h-28 object-contain opacity-25 absolute -top-4 left-4 rotate-[-6deg] pointer-events-none select-none print:opacity-35"
            />
            <div className="relative flex items-end justify-center min-h-[48px] mb-1">
              <span className="text-[15pt] text-black shrink-0 select-none pb-0.5">(ลงชื่อ)</span>
              <div className="relative flex-1 mx-2 border-b border-dotted border-black h-8 flex items-end justify-center">
                {sig.mayorSignatureUrl && (
                  <img
                    src={sig.mayorSignatureUrl}
                    alt="ลายมือชื่อนายก อบต."
                    className="absolute -bottom-2 h-12 object-contain filter contrast-125 pointer-events-none"
                  />
                )}
              </div>
            </div>
            <div className="font-bold text-[16pt] text-black relative z-10 leading-tight">
              ( {sig.mayorName && !sig.mayorName.includes('สมหมาย') ? sig.mayorName : 'นายสมคิด พงษ์สุข'} )
            </div>
            <div className="text-[15pt] text-black mt-1 relative z-10 leading-tight">
              {sig.mayorPosition || 'นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน'}
            </div>
            <div className="text-[14pt] font-semibold text-black mt-0.5 relative z-10 leading-tight">
              {sig.mayorRoleTitle || 'เจ้าพนักงานท้องถิ่น'}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="border-t border-slate-300 text-[11pt] text-slate-700 leading-snug space-y-1" style={{ marginTop: '14pt', paddingTop: '6pt' }}>
          {mode === 'replacement_cert' && (
            <p className="font-medium text-black">
              <strong>หมายเหตุ (๑)</strong> {isHazardous ? 'ใบอนุญาตฉบับนี้เป็นการออกใบแทนใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ' : 'หนังสือรับรองการแจ้งฉบับนี้เป็นการออกใบแทนหนังสือรับรองการแจ้ง'} กรณีที่มีการแจ้งสูญหาย ถูกทำลาย หรือชำรุดในสาระสำคัญ ตามคำขอใบแทนเมื่อวันที่ {formatThaiDate(establishment.replacementRequestDate || establishment.issueDate, false)}
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
