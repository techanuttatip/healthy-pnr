import React from 'react';
import type { Establishment, SystemSettings } from '../../../types/publicHealth';
import { formatThaiDate, thaiBahtText } from './printHelpers';

interface FieldRenewalPackDocProps {
  establishment: Establishment;
  settings: SystemSettings;
}

export const FieldRenewalPackDoc: React.FC<FieldRenewalPackDocProps> = ({
  establishment,
  settings
}) => {
  const orgName = settings.organizationName || 'องค์การบริหารส่วนตำบลโป่งน้ำร้อน';
  const regType = establishment.regType || '';
  const isHazardous = regType === 'บทส' || establishment.category === 'hazardous';

  return (
    <div
      id="printable-field-pack"
      className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-10 sm:p-14 shadow-2xl border border-slate-300 print:shadow-none print:border-none print:w-full print:max-w-none print:p-6 print:m-0 flex flex-col gap-4 font-serif"
      style={{ fontFamily: "'Sarabun', 'TH Sarabun New', serif" }}
    >
      {/* Cover Sheet Header */}
      <div className="border-2 border-slate-800 rounded-sm p-4 text-center">
        <div className="flex justify-center mb-2">
          <img src="/pnr_logo.png" alt="ตราสัญลักษณ์ อบต." className="w-14 h-14 object-contain" />
        </div>
        <div className="font-bold text-base">{orgName}</div>
        <div className="text-xs text-slate-600">{settings.departmentName || 'กองสาธารณสุขและสิ่งแวดล้อม'}</div>
        <div className="mt-2 text-sm font-bold border-t border-slate-400 pt-2">
          ชุดเอกสารเตรียมลงพื้นที่บุกต่ออายุ
        </div>
        <div className="text-xs text-slate-600 mt-0.5">(Pre-filled Renewal Kit สำหรับเจ้าหน้าที่ลงพื้นที่)</div>
      </div>

      {/* Establishment Info Card */}
      <div className="border border-slate-400 rounded-sm p-4 space-y-1 text-sm">
        <div className="font-bold text-sm border-b border-slate-300 pb-1.5 mb-2">ข้อมูลสถานประกอบการ</div>
        <div className="flex gap-2">
          <span className="w-36 shrink-0 font-semibold text-slate-700">ชื่อสถานประกอบการ:</span>
          <span className="font-bold">{establishment.businessName}</span>
        </div>
        <div className="flex gap-2">
          <span className="w-36 shrink-0 font-semibold text-slate-700">เลขทะเบียนคุม:</span>
          <span className="font-mono font-bold">{establishment.regNumber}</span>
        </div>
        <div className="flex gap-2">
          <span className="w-36 shrink-0 font-semibold text-slate-700">ผู้ประกอบการ:</span>
          <span>{establishment.ownerName}</span>
        </div>
        <div className="flex gap-2">
          <span className="w-36 shrink-0 font-semibold text-slate-700">สถานที่ตั้ง:</span>
          <span>{establishment.village}</span>
        </div>
        <div className="flex gap-2">
          <span className="w-36 shrink-0 font-semibold text-slate-700">โทรศัพท์:</span>
          <span className="font-mono">{establishment.phone || '-'}</span>
        </div>
        <div className="flex gap-2">
          <span className="w-36 shrink-0 font-semibold text-slate-700">ประเภทกิจการ:</span>
          <span>{establishment.categoryName}</span>
        </div>
        <div className="flex gap-2">
          <span className="w-36 shrink-0 font-semibold text-slate-700">วันหมดอายุ:</span>
          <span className="font-bold text-red-700">{formatThaiDate(establishment.expireDate, true)}</span>
        </div>
        <div className="flex gap-2">
          <span className="w-36 shrink-0 font-semibold text-slate-700">ค่าธรรมเนียม:</span>
          <span className="font-bold">{establishment.feeAmount?.toLocaleString('th-TH')} บาท ({thaiBahtText(establishment.feeAmount || 0)})</span>
        </div>
      </div>

      {/* แบบคำขอ (ฉบับย่อ) */}
      <div className="border border-slate-400 rounded-sm p-4 text-xs space-y-2">
        <div className="font-bold text-sm text-center border-b border-slate-300 pb-2 mb-2">
          {isHazardous ? 'คำขอรับใบอนุญาต/ต่ออายุใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ' : 'คำขอต่ออายุหนังสือรับรองการแจ้งจัดตั้งสถานที่จำหน่ายอาหาร'}
        </div>
        <div className="flex justify-between items-start">
          <div className="border border-slate-400 p-2 rounded-sm w-48 bg-slate-50/50">
            <div className="text-[10px] text-slate-600 mb-0.5">(สำหรับเจ้าหน้าที่กรอก)</div>
            <div className="flex items-baseline">
              <span className="shrink-0 text-[11px]">คำขอเลขที่</span>
              <span className="flex-1 border-b border-dotted border-slate-600 ml-1.5 h-3.5"></span>
            </div>
          </div>
          <div className="text-right space-y-1 text-[11px]">
            <div>เขียนที่ <span className="font-bold">{orgName}</span></div>
            <div>วันที่ <span className="border-b border-dotted border-slate-600 px-6"></span> เดือน <span className="border-b border-dotted border-slate-600 px-6"></span> พ.ศ. <span className="border-b border-dotted border-slate-600 px-4"></span></div>
          </div>
        </div>
        <div className="leading-relaxed">
          ข้าพเจ้า{' '}
          <span className="font-bold border-b border-dotted border-slate-700 px-2">{establishment.ownerName}</span>{' '}
          มีความประสงค์ขอต่ออายุ {isHazardous ? 'ใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ' : 'หนังสือรับรองการแจ้งจัดตั้งสถานที่จำหน่ายอาหาร'}{' '}
          ชื่อสถานประกอบกิจการ{' '}
          <span className="font-bold border-b border-dotted border-slate-700 px-2">{establishment.businessName}</span>{' '}
          เลขทะเบียนคุม{' '}
          <span className="font-mono font-bold border-b border-dotted border-slate-700 px-2">{establishment.regNumber}</span>{' '}
          ตั้งอยู่ {establishment.village} ขอยื่นคำขอต่ออายุเพื่อประกอบกิจการต่อไป
        </div>
        <div className="flex justify-end mt-4">
          <div className="text-center w-48">
            <div className="border-b border-slate-700 mb-1 pb-6"></div>
            <div className="text-[11px]">(ลายมือชื่อผู้ยื่นคำขอ)</div>
            <div className="text-[10px] text-slate-500">({establishment.ownerName})</div>
          </div>
        </div>
      </div>

      {/* Document Checklist */}
      <div className="border border-slate-400 rounded-sm p-3 text-xs space-y-1.5">
        <div className="font-bold text-sm border-b border-slate-300 pb-1.5 mb-2">เอกสารประกอบคำขอต่ออายุ (กรุณาเตรียมมาให้ครบ)</div>
        {[
          'สำเนาบัตรประจำตัวประชาชน ๑ ฉบับ (รับรองสำเนาถูกต้อง)',
          isHazardous ? 'ใบอนุญาตฉบับเดิม (ต้นฉบับ)' : 'หนังสือรับรองฉบับเดิม (ต้นฉบับ)',
          'สำเนาทะเบียนบ้าน ๑ ฉบับ',
          'รูปถ่ายสถานประกอบการ ขนาด 3×4 ซม. จำนวน ๒ ใบ',
          `ค่าธรรมเนียม ${establishment.feeAmount?.toLocaleString('th-TH') || '100'} บาท`
        ].map((doc, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="border border-slate-500 w-3.5 h-3.5 shrink-0 mt-0.5 rounded-xs"></span>
            <span>{doc}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-300 pt-2 text-[11px] text-slate-500 flex justify-between">
        <span>{orgName} • {settings.departmentName}</span>
        <span>พิมพ์เมื่อ: {formatThaiDate(new Date().toISOString().split('T')[0], false)}</span>
      </div>
    </div>
  );
};
