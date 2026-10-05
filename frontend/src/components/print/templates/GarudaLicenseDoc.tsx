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
            เล่มที่ <span className="font-mono text-sm">{establishment.receiptBookNo || establishment.bookNo || '๐๑'}</span>
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
              เลขที่ <span className="font-mono font-bold text-sm">{establishment.receiptNo || establishment.docNo}</span>
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
            อาศัยอำนาจตามความในพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕
          </p>
        </div>

        {/* Body Content */}
        <div className="text-[13px] leading-relaxed text-slate-900 space-y-2.5 mt-4">
          {isHazardous ? (
            /* ================== แบบ อภ.๒: กิจการที่เป็นอันตรายต่อสุขภาพ ================== */
            <>
              <p className="indent-8 text-justify">
                (๑) เจ้าพนักงานท้องถิ่นออกใบอนุญาตให้{' '}
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
                <span className="font-mono font-bold border-b border-dotted border-slate-700 px-1.5">
                  {establishment.receiptBookNo || establishment.bookNo || '-'}
                </span>{' '}
                เลขที่{' '}
                <span className="font-mono font-bold border-b border-dotted border-slate-700 px-1.5">
                  {establishment.receiptNo || establishment.docNo || 'RCPT-00602/69'}
                </span>{' '}
                ลงวันที่{' '}
                <span className="border-b border-dotted border-slate-700 px-2 font-mono">
                  {formatThaiDate(establishment.receiptDate || establishment.issueDate, false)}
                </span>
              </p>

              <p className="text-justify indent-8">
                (๒) ผู้ได้รับใบอนุญาตต้องปฏิบัติตามหลักเกณฑ์ วิธีการ และเงื่อนไขที่กำหนดในข้อบัญญัติท้องถิ่น รวมถึงต้องปฏิบัติให้ถูกต้องตามพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕ และที่แก้ไขเพิ่มเติม กฎกระทรวง และประกาศที่ออกตามพระราชบัญญัตินี้
              </p>

              <p className="text-justify indent-8">
                (๓) ผู้ได้รับใบอนุญาตต้องปฏิบัติตามเงื่อนไขเฉพาะดังต่อไปนี้อีกด้วย คือ
              </p>
              <div className="pl-12 space-y-1 text-xs text-slate-800">
                <div>๓.๑) ต้องควบคุม ป้องกัน และระมัดระวังมิให้เกิดอันตราย อัคคีภัย การรั่วไหลของน้ำมันเชื้อเพลิง เสียง หรือมลพิษอื่นใดอันเป็นเหตุรำคาญหรือเป็นอันตรายต่อสุขภาพและความปลอดภัยของประชาชน</div>
                <div>๓.๒) ต้องติดตั้งอุปกรณ์ความปลอดภัย ระบบป้องกันและระงับอัคคีภัย ถังดับเพลิงเคมีที่ได้มาตรฐานให้อยู่ในสภาพพร้อมใช้งานได้ตลอดเวลา</div>
                <div>๓.๓) ปฏิบัติตามคำแนะนำของเจ้าพนักงานสาธารณสุขและคำสั่งของเจ้าพนักงานท้องถิ่นโดยเคร่งครัด</div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-800 pt-2 font-medium">
                <div>
                  (๔) ใบอนุญาตฉบับนี้ออกให้เมื่อวันที่{' '}
                  <span className="font-mono font-bold border-b border-dotted border-slate-700 px-2">
                    {formatThaiDate(establishment.issueDate, false)}
                  </span>
                </div>
                <div>
                  (๕) ใบอนุญาตฉบับนี้สิ้นอายุวันที่{' '}
                  <span className="font-mono font-bold text-red-900 border-b border-dotted border-slate-700 px-2">
                    {formatThaiDate(establishment.expireDate, false)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* ================== แบบ นจ.๓ หรือ บทอ.: จำหน่าย/สะสมอาหาร ================== */
            <>
              <p className="indent-8 text-justify">
                (๑) เจ้าพนักงานท้องถิ่น{isFoodLicense ? 'ออกใบอนุญาตให้' : 'ออกใบรับแจ้งให้'}{' '}
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
                <span className="font-mono border-b border-dotted border-slate-700 px-1.5">{establishment.phone}</span>
              </p>

              <p className="text-justify">
                เสียค่าธรรมเนียมปีละ{' '}
                <span className="font-bold font-mono border-b border-dotted border-slate-700 px-2 text-emerald-900">
                  {establishment.feeAmount.toLocaleString()}
                </span>{' '}
                บาท ({thaiBahtText(establishment.feeAmount)}) ตามใบเสร็จรับเงินเล่มที่{' '}
                <span className="font-mono font-bold border-b border-dotted border-slate-700 px-1.5">
                  {establishment.receiptBookNo || establishment.bookNo || '๐๑'}
                </span>{' '}
                เลขที่{' '}
                <span className="font-mono font-bold border-b border-dotted border-slate-700 px-1.5">
                  {establishment.receiptNo || establishment.docNo || '๐๐๔๕'}
                </span>{' '}
                ลงวันที่{' '}
                <span className="border-b border-dotted border-slate-700 px-2 font-mono">
                  {formatThaiDate(establishment.receiptDate || establishment.issueDate, false)}
                </span>
              </p>

              <p className="text-justify indent-8">
                (๒) {isFoodLicense ? 'ผู้ได้รับใบอนุญาต' : 'ผู้รับหนังสือรับรองการแจ้ง'}ต้องปฏิบัติตามหลักเกณฑ์ วิธีการและเงื่อนไขที่กำหนดในข้อบัญญัติท้องถิ่น รวมถึงต้องปฏิบัติให้ถูกต้องตามพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕ และที่แก้ไขเพิ่มเติม กฎกระทรวงและประกาศที่ออกตามพระราชบัญญัตินี้
              </p>

              <p className="text-justify indent-8">
                (๓) {isFoodLicense ? 'ผู้ได้รับใบอนุญาต' : 'ผู้รับหนังสือรับรองการแจ้ง'}ต้องปฏิบัติตามเงื่อนไขเฉพาะดังต่อไปนี้อีกด้วย คือ
              </p>
              <div className="pl-12 space-y-1 text-xs text-slate-800">
                <div>๓.๑) ต้องรักษาความสะอาดถูกสุขลักษณะตามเกณฑ์มาตรฐานสุขาภิบาลอาหารของกระทรวงสาธารณสุข และข้อบัญญัติ อปท.</div>
                <div>๓.๒) {isStorage ? 'การจัดเก็บต้องวางบนพาเลทหรือยกสูงจากพื้นอย่างน้อย ๑๕ ซม. และมีระบบป้องกันสัตว์แมลงนำโรค' : 'ผู้สัมผัสอาหารทุกคนต้องผ่านการอบรมหลักสูตรสุขาภิบาลอาหาร และมีสุขภาพร่างกายสมบูรณ์ไม่เป็นโรคติดต่อ'}</div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-800 pt-2 font-medium">
                <div>
                  (๔) {isFoodLicense ? 'ใบอนุญาตฉบับนี้ออกให้เมื่อวันที่' : 'หนังสือรับรองการแจ้งฉบับนี้ออกให้เมื่อวันที่'}{' '}
                  <span className="font-mono font-bold border-b border-dotted border-slate-700 px-2">
                    {formatThaiDate(establishment.issueDate, false)}
                  </span>
                </div>
                <div>
                  (๕) {isFoodLicense ? 'ใบอนุญาตฉบับนี้สิ้นอายุวันที่' : 'ครบกำหนดวันชำระค่าธรรมเนียม วันที่'}{' '}
                  <span className="font-mono font-bold text-red-900 border-b border-dotted border-slate-700 px-2">
                    {formatThaiDate(establishment.expireDate || establishment.nextFeeDueDate, false)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Official Signatures & Dual QR Code Section */}
      <div className="relative z-10 pt-4">
        <div className="flex justify-between items-end">
          {/* DUAL QR CODE */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="w-20 h-20 border border-slate-300 rounded p-1 bg-white shadow-2xs flex flex-col items-center justify-between">
                <svg className="w-13 h-13 text-slate-800" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm13-2h3v3h-3v-3zm0 5h3v3h-3v-3zm-3-5h2v2h-2v-2zm0 4h2v4h-2v-4zm5 0h2v4h-2v-4zM5 5h2v2H5V5zm12 0h2v2h-2V5zM5 17h2v2H5v-2z" />
                </svg>
                <div className="text-[7px] font-bold text-blue-900">QR จทน. ตรวจสอบ</div>
              </div>
              <div className="text-[8px] text-slate-500 mt-0.5">ตรวจสถานะ/ประวัติ</div>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 border border-slate-300 rounded p-1 bg-white shadow-2xs flex flex-col items-center justify-between">
                <svg className="w-13 h-13 text-teal-800" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm11-1h2v3h-2v-3zm2 3h3v2h-3v-2zm-3 3h2v2h-2v-2zm3 0h3v2h-3v-2zm-1 3h4v1h-4v-1zM5 5h2v2H5V5zm12 0h2v2h-2V5zM5 17h2v2H5v-2z" />
                </svg>
                <div className="text-[7px] font-bold text-emerald-800">QR ติชม/ร้องเรียน</div>
              </div>
              <div className="text-[8px] text-slate-500 mt-0.5">ประเมินถึง อบต.</div>
            </div>
          </div>

          {/* Local Mayor Signature */}
          <div className="text-center w-64 relative">
            <img
              src="/pnr_logo.png"
              alt="ตราประทับ อบต.โป่งน้ำร้อน"
              className="w-24 h-24 object-contain opacity-25 absolute -top-4 right-4 rotate-[-8deg] pointer-events-none select-none print:opacity-35"
            />
            <div className="text-xs text-slate-800 mb-8 relative z-10">
              (ลงชื่อ) ....................................................
            </div>
            <div className="font-bold text-sm text-slate-900 relative z-10">
              ( {sig.mayorName} )
            </div>
            <div className="text-xs text-slate-700 mt-0.5 relative z-10">
              ตำแหน่ง {sig.mayorPosition}
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
