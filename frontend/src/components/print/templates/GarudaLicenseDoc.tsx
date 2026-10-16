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
  const isStorage = !isHazardous && (establishment.foodPlaceType === 'storage');

  const parsedAddress = parseAddressDetails(establishment.address, establishment.village);

  return (
    <div
      id="printable-certificate"
      className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-10 sm:p-14 shadow-2xl border border-slate-300 print:shadow-none print:border-none print:w-full print:max-w-none print:p-6 print:m-0 flex flex-col justify-between font-serif relative overflow-hidden"
      style={{ fontFamily: "'Sarabun', 'TH Sarabun New', serif" }}
    >
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none">
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
            <span className="font-mono text-sm border-b border-dotted border-slate-600 px-6 inline-block min-w-[70px] text-center">
              &nbsp;
            </span>
          </div>
          <div className="text-right flex flex-col items-end">
            {mode === 'replacement_cert' && (
              <span className="font-extrabold text-red-600 border-2 border-red-600 px-3 py-0.5 rounded-xs text-xs tracking-wider mb-1">
                [ ใบแทน ]
              </span>
            )}
            <span className="font-bold border border-slate-600 px-2 py-0.5 rounded-xs text-xs">
              {displayCode}
            </span>
            <div className="mt-1">
              เลขที่{' '}
              <span className="font-mono font-bold text-sm border-b border-dotted border-slate-600 px-8 inline-block min-w-[110px] text-center">
                &nbsp;
              </span>
            </div>
          </div>
        </div>

        {/* Garuda Emblem */}
        <div className="flex justify-center my-2 relative z-10">
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
        <div className="text-[13px] leading-relaxed text-slate-900 space-y-2.5 mt-4">
          {isHazardous ? (
            /* ================== แบบ อภ.2: กิจการที่เป็นอันตรายต่อสุขภาพ ================== */
            <>
              <p className="indent-8 text-justify">
                (1) เจ้าพนักงานท้องถิ่นออกใบอนุญาตให้{' '}
                <span className="font-bold border-b border-dotted border-slate-700 px-2">
                  {establishment.ownerName}
                </span>{' '}
                อายุ <span className="font-mono border-b border-dotted border-slate-700 px-1.5">35</span> ปี สัญชาติ{' '}
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
                เพื่อประกอบกิจการที่เป็นอันตรายต่อสุขภาพ ประเภท{' '}
                <span className="font-bold border-b border-dotted border-slate-700 px-2 text-slate-900">
                  {establishment.categoryName || 'กิจการที่เกี่ยวกับปิโตรเลียม ถ่านหิน สารเคมี (การจำหน่ายน้ำมันเชื้อเพลิงตู้หยอดเหรียญ)'}
                </span>{' '}
                ชื่อสถานประกอบกิจการ{' '}
                <span className="font-bold text-sm border-b border-dotted border-slate-700 px-2 text-blue-950">
                  "{establishment.businessName}"
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
                สถานที่ตั้ง เลขที่{' '}
                <span className="border-b border-dotted border-slate-700 px-2">
                  {parsedAddress.houseNo}
                </span>{' '}
                {parsedAddress.fullVillageDisplay} ตำบลโป่งน้ำร้อน {districtName} {provinceName} โทรศัพท์{' '}
                <span className="font-mono border-b border-dotted border-slate-700 px-1.5">{establishment.phone}</span>
              </p>

              <p className="text-justify">
                เสียค่าธรรมเนียมปีละ{' '}
                <span className="font-bold font-mono border-b border-dotted border-slate-700 px-2 text-emerald-900">
                  {establishment.feeAmount.toLocaleString()}
                </span>{' '}
                บาท ({thaiBahtText(establishment.feeAmount)}) ตามใบเสร็จรับเงินเล่มที่{' '}
                <span className="border-b border-dotted border-slate-700 px-6 font-mono inline-block min-w-[70px] text-center">
                  &nbsp;
                </span>{' '}
                เลขที่{' '}
                <span className="border-b border-dotted border-slate-700 px-10 font-mono inline-block min-w-[120px] text-center">
                  &nbsp;
                </span>{' '}
                ลงวันที่{' '}
                <span className="border-b border-dotted border-slate-700 px-8 font-mono inline-block min-w-[100px] text-center">
                  &nbsp;
                </span>
              </p>

              <p className="text-justify indent-8">
                (2) ผู้ได้รับใบอนุญาตต้องปฏิบัติตามหลักเกณฑ์ วิธีการ และเงื่อนไขที่กำหนดในข้อบัญญัติท้องถิ่น รวมถึงต้องปฏิบัติให้ถูกต้องตามพระราชบัญญัติการสาธารณสุข พ.ศ. 2535 และที่แก้ไขเพิ่มเติม กฎกระทรวง และประกาศที่ออกตามพระราชบัญญัตินี้
              </p>

              <p className="text-justify indent-8">
                (3) ผู้ได้รับใบอนุญาตต้องปฏิบัติตามเงื่อนไขเฉพาะดังต่อไปนี้อีกด้วย คือ
              </p>
              <div className="pl-6 space-y-1 text-xs text-slate-800">
                <div>3.1) ต้องควบคุม ป้องกัน และระมัดระวังมิให้เกิดอันตราย อัคคีภัย การรั่วไหลของน้ำมันเชื้อเพลิง เสียง หรือมลพิษอื่นใดอันเป็นเหตุรำคาญหรือเป็นอันตรายต่อสุขภาพและความปลอดภัยของประชาชน</div>
                <div>3.2) ต้องติดตั้งอุปกรณ์ความปลอดภัย ระบบป้องกันและระงับอัคคีภัย ถังดับเพลิงเคมีที่ได้มาตรฐานให้อยู่ในสภาพพร้อมใช้งานได้ตลอดเวลา</div>
                <div>3.3) ปฏิบัติตามคำแนะนำของเจ้าพนักงานสาธารณสุขและคำสั่งของเจ้าพนักงานท้องถิ่นโดยเคร่งครัด</div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-800 pt-2 font-medium">
                <div>
                  (4) ใบอนุญาตฉบับนี้ออกให้เมื่อวันที่{' '}
                  <span className="font-mono font-bold border-b border-dotted border-slate-700 px-2 whitespace-nowrap">
                    {formatThaiDate(establishment.issueDate, false)}
                  </span>
                </div>
                <div>
                  (5) ใบอนุญาตฉบับนี้สิ้นอายุวันที่{' '}
                  <span className="font-mono font-bold text-red-900 border-b border-dotted border-slate-700 px-2 whitespace-nowrap">
                    {formatThaiDate(establishment.expireDate, false)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* ================== แบบ นจ.3 หรือ บทอ.: จำหน่าย/สะสมอาหาร ================== */
            <>
              <p className="indent-8 text-justify">
                (1) เจ้าพนักงานท้องถิ่น{isFoodLicense ? 'ออกใบอนุญาตให้' : 'ออกใบรับแจ้งให้'}{' '}
                <span className="font-bold border-b border-dotted border-slate-700 px-2">
                  {establishment.ownerName}
                </span>{' '}
                อายุ <span className="font-mono border-b border-dotted border-slate-700 px-1.5">35</span> ปี สัญชาติ{' '}
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
                  {establishment.premiseCharacteristics || (isStorage ? 'อยู่ในอาคารโกดังคอนกรีตเสริมเหล็ก' : 'อยู่ในอาคารพาณิชย์')}
                </span>
              </p>

              <p className="text-justify">
                วิธีการจำหน่าย{' '}
                <span className="border-b border-dotted border-slate-700 px-2">
                  {establishment.distributionMethod || (isStorage ? 'จำหน่ายส่งและมีบริการจัดส่ง' : 'มีโต๊ะเก้าอี้ไว้ให้บริการและซื้อกลับบ้าน')}
                </span>{' '}
                ช่วงเวลาที่จำหน่าย{' '}
                <span className="border-b border-dotted border-slate-700 px-2 font-mono">
                  {establishment.operatingHours || '07:00 - 19:00 น.'}
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
                <span className="font-mono border-b border-dotted border-slate-700 px-1.5">{establishment.phone}</span>
              </p>

              <p className="text-justify leading-relaxed">
                เสียค่าธรรมเนียมปีละ{' '}
                <span className="font-bold font-mono border-b border-dotted border-slate-700 px-2 text-emerald-900">
                  {establishment.feeAmount.toLocaleString()}
                </span>{' '}
                บาท ({thaiBahtText(establishment.feeAmount)}) ตามใบเสร็จรับเงินเล่มที่{' '}
                <span className="border-b border-dotted border-slate-700 px-2 font-mono inline-block min-w-[36px] text-center">
                  {establishment.receiptBookNo || '\u00A0'}
                </span>{' '}
                เลขที่{' '}
                <span className="border-b border-dotted border-slate-700 px-3 font-mono inline-block min-w-[48px] text-center">
                  {establishment.receiptNo || '\u00A0'}
                </span>{' '}
                ลงวันที่{' '}
                <span className="border-b border-dotted border-slate-700 px-3 font-mono inline-block min-w-[80px] text-center whitespace-nowrap">
                  {establishment.receiptDate ? formatThaiDate(establishment.receiptDate, false) : '\u00A0'}
                </span>
              </p>

              <p className="text-justify indent-8">
                (2) {isFoodLicense ? 'ผู้ได้รับใบอนุญาต' : 'ผู้รับหนังสือรับรองการแจ้ง'}ต้องปฏิบัติตามหลักเกณฑ์ วิธีการและเงื่อนไขที่กำหนดในข้อบัญญัติท้องถิ่น รวมถึงต้องปฏิบัติให้ถูกต้องตามพระราชบัญญัติการสาธารณสุข พ.ศ. 2535 และที่แก้ไขเพิ่มเติม กฎกระทรวงและประกาศที่ออกตามพระราชบัญญัตินี้
              </p>

              <p className="text-justify indent-8">
                (3) {isFoodLicense ? 'ผู้ได้รับใบอนุญาต' : 'ผู้รับหนังสือรับรองการแจ้ง'}ต้องปฏิบัติตามเงื่อนไขเฉพาะดังต่อไปนี้อีกด้วย คือ
              </p>
              <div className="pl-6 space-y-1 text-xs text-slate-800">
                <div>3.1) ต้องรักษาความสะอาดถูกสุขลักษณะตามเกณฑ์มาตรฐานสุขาภิบาลอาหารของกระทรวงสาธารณสุขและข้อบัญญัติ อปท.</div>
                <div>3.2) {isStorage ? 'การจัดเก็บต้องวางบนพาเลทหรือยกสูงจากพื้นอย่างน้อย 15 ซม. และมีระบบป้องกันสัตว์แมลงนำโรค' : 'ผู้สัมผัสอาหารทุกคนต้องผ่านการอบรมหลักสูตรสุขาภิบาลอาหาร และมีสุขภาพร่างกายสมบูรณ์ไม่เป็นโรคติดต่อ'}</div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-800 pt-2 font-medium">
                <div>
                  (4) {isFoodLicense ? 'ใบอนุญาตฉบับนี้ออกให้เมื่อวันที่' : 'หนังสือรับรองการแจ้งฉบับนี้ออกให้เมื่อวันที่'}{' '}
                  <span className="font-mono font-bold border-b border-dotted border-slate-700 px-2 whitespace-nowrap">
                    {formatThaiDate(establishment.issueDate, false)}
                  </span>
                </div>
                <div>
                  (5) {isFoodLicense ? 'ใบอนุญาตฉบับนี้สิ้นอายุวันที่' : 'ครบกำหนดวันชำระค่าธรรมเนียม วันที่'}{' '}
                  <span className="font-mono font-bold text-red-900 border-b border-dotted border-slate-700 px-2 whitespace-nowrap">
                    {formatThaiDate(establishment.expireDate || establishment.nextFeeDueDate, false)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Official Signatures Section (No QR Codes) */}
      <div className="relative z-10 pt-4">
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
              <div className="flex-1 mx-2 border-b border-dotted border-slate-700 h-8"></div>
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
