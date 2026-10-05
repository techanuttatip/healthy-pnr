import React from 'react';
import type { SystemSettings } from '../../../types/publicHealth';
import { thaiBahtText } from '../../../types/publicHealth';

export { thaiBahtText };

/**
 * Render 13-digit Thai Citizen ID into official individual boxes
 */
export const renderCitizenIdBoxes = (idStr?: string) => {
  const clean = (idStr || '').replace(/\D/g, '').padEnd(13, ' ').slice(0, 13);
  const toThaiDigits = (ch: string) =>
    ch === ' ' ? ' ' : String(ch).replace(/[0-9]/g, (digit) => '๐๑๒๓๔๕๖๗๘๙'[parseInt(digit, 10)]);

  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs align-middle">
      <span className="w-4.5 h-5 border border-slate-700 inline-flex items-center justify-center font-bold bg-white text-slate-900 text-[11px]">
        {toThaiDigits(clean[0])}
      </span>
      <span className="text-slate-400 font-bold text-xs">-</span>
      <span className="inline-flex">
        {[clean[1], clean[2], clean[3], clean[4]].map((ch, i) => (
          <span key={i} className="w-4.5 h-5 border border-slate-700 border-r-0 last:border-r inline-flex items-center justify-center font-bold bg-white text-slate-900 text-[11px]">
            {toThaiDigits(ch)}
          </span>
        ))}
      </span>
      <span className="text-slate-400 font-bold text-xs">-</span>
      <span className="inline-flex">
        {[clean[5], clean[6], clean[7], clean[8], clean[9]].map((ch, i) => (
          <span key={i} className="w-4.5 h-5 border border-slate-700 border-r-0 last:border-r inline-flex items-center justify-center font-bold bg-white text-slate-900 text-[11px]">
            {toThaiDigits(ch)}
          </span>
        ))}
      </span>
      <span className="text-slate-400 font-bold text-xs">-</span>
      <span className="inline-flex">
        {[clean[10], clean[11]].map((ch, i) => (
          <span key={i} className="w-4.5 h-5 border border-slate-700 border-r-0 last:border-r inline-flex items-center justify-center font-bold bg-white text-slate-900 text-[11px]">
            {toThaiDigits(ch)}
          </span>
        ))}
      </span>
      <span className="text-slate-400 font-bold text-xs">-</span>
      <span className="w-4.5 h-5 border border-slate-700 inline-flex items-center justify-center font-bold bg-white text-slate-900 text-[11px]">
        {toThaiDigits(clean[12])}
      </span>
    </span>
  );
};

/**
 * Format ISO date string into official Thai format (e.g. ๕ ตุลาคม ๒๕๖๙)
 */
export const formatThaiDate = (dateStr?: string, useThaiDigits = true) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const [y, m, d] = parts;
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const day = parseInt(d, 10);
  const month = months[parseInt(m, 10) - 1] || '';
  const year = parseInt(y, 10) + 543;
  if (!useThaiDigits) {
    return `${day} ${month} ${year}`;
  }
  const toThaiDigits = (num: number | string) =>
    String(num).replace(/[0-9]/g, (digit) => '๐๑๒๓๔๕๖๗๘๙'[parseInt(digit, 10)]);
  return `${toThaiDigits(day)} ${month} ${toThaiDigits(year)}`;
};

/**
 * Parse village and address components
 */
export const parseAddressDetails = (rawAddress?: string, rawVillage?: string) => {
  const addr = (rawAddress || '').replace(/^เลขที่\s*/, '').trim();
  const v = (rawVillage || '').trim();
  const houseNo = addr.split(' ')[0] || addr || '-';
  const fullVillageDisplay = v.startsWith('หมู่') ? v : `หมู่ที่ ${v || '-'}`;
  return {
    houseNo,
    fullVillageDisplay
  };
};

/**
 * Standard Dual-Signatures Block for Thai Administrative Documents
 */
export const OfficialSignaturesBlock: React.FC<{
  settings: SystemSettings;
  issueDate?: string;
  useThaiDigits?: boolean;
}> = ({ settings, issueDate, useThaiDigits = true }) => {
  const sig = settings.signatories;
  return (
    <div className="grid grid-cols-2 gap-8 pt-6 relative z-10 text-[13px] text-slate-900">
      <div className="flex flex-col items-center text-center">
        <div className="text-xs text-slate-600 mb-10">(ลายมือชื่อ) .................................................... ผู้ตรวจ</div>
        <div className="font-bold">({sig.officerName || 'นางสาวรุ่งทิวา อุปนันท์'})</div>
        <div className="text-xs text-slate-700">{sig.officerPosition || 'นักวิชาการสาธารณสุขปฏิบัติการ'}</div>
      </div>

      <div className="flex flex-col items-center text-center">
        <div className="text-xs text-slate-600 mb-10">(ลายมือชื่อ) .................................................... เจ้าพนักงานท้องถิ่น</div>
        <div className="font-bold">({sig.mayorName || 'นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน'})</div>
        <div className="text-xs text-slate-700">{sig.mayorPosition || 'นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน'}</div>
        <div className="text-xs text-slate-500 mt-1 font-mono">
          วันที่ {formatThaiDate(issueDate, useThaiDigits)}
        </div>
      </div>
    </div>
  );
};
