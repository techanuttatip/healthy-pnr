import React from 'react';
import type { SystemSettings } from '../../../types/publicHealth';
import { thaiBahtText } from '../../../types/publicHealth';

export { thaiBahtText };

import { DEFAULT_OFFICER_SIGNATURE, sanitationDataService } from '../../../services/sanitationDataService';

/**
 * Render 13-digit Thai Citizen ID into official individual boxes (Arabic Numerals)
 */
export const renderCitizenIdBoxes = (idStr?: string) => {
  const clean = (idStr || '').replace(/\D/g, '').padEnd(13, ' ').slice(0, 13);

  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs align-middle">
      <span className="w-4.5 h-5 border border-slate-700 inline-flex items-center justify-center font-bold bg-white text-slate-900 text-[11px]">
        {clean[0]}
      </span>
      <span className="text-slate-400 font-bold text-xs">-</span>
      <span className="inline-flex">
        {[clean[1], clean[2], clean[3], clean[4]].map((ch, i) => (
          <span key={i} className="w-4.5 h-5 border border-slate-700 border-r-0 last:border-r inline-flex items-center justify-center font-bold bg-white text-slate-900 text-[11px]">
            {ch}
          </span>
        ))}
      </span>
      <span className="text-slate-400 font-bold text-xs">-</span>
      <span className="inline-flex">
        {[clean[5], clean[6], clean[7], clean[8], clean[9]].map((ch, i) => (
          <span key={i} className="w-4.5 h-5 border border-slate-700 border-r-0 last:border-r inline-flex items-center justify-center font-bold bg-white text-slate-900 text-[11px]">
            {ch}
          </span>
        ))}
      </span>
      <span className="text-slate-400 font-bold text-xs">-</span>
      <span className="inline-flex">
        {[clean[10], clean[11]].map((ch, i) => (
          <span key={i} className="w-4.5 h-5 border border-slate-700 border-r-0 last:border-r inline-flex items-center justify-center font-bold bg-white text-slate-900 text-[11px]">
            {ch}
          </span>
        ))}
      </span>
      <span className="text-slate-400 font-bold text-xs">-</span>
      <span className="w-4.5 h-5 border border-slate-700 inline-flex items-center justify-center font-bold bg-white text-slate-900 text-[11px]">
        {clean[12]}
      </span>
    </span>
  );
};

/**
 * Format ISO date string into official Thai format with Arabic digits (e.g. 15 ตุลาคม 2569)
 */
export const formatThaiDate = (dateStr?: string, _useThaiDigits = false) => {
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
  return `${day} ${month} ${year}`;
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
 * Standard Dual-Signatures Block for Thai Administrative Documents with Electronic Signature
 */
export const OfficialSignaturesBlock: React.FC<{
  settings: SystemSettings;
  issueDate?: string;
  useThaiDigits?: boolean;
}> = ({ settings, issueDate }) => {
  const sig = settings.signatories;
  const currentOfficer = sanitationDataService.getCurrentOfficer();
  const officerSig = currentOfficer?.signatureUrl || DEFAULT_OFFICER_SIGNATURE;

  return (
    <div className="grid grid-cols-2 gap-8 pt-6 relative z-10 text-[13px] text-slate-900">
      <div className="flex flex-col items-center text-center relative w-full max-w-[280px] mx-auto">
        <div className="relative flex items-end justify-center min-h-[44px] mb-1 w-full">
          <span className="text-xs text-slate-800 shrink-0 select-none pb-0.5">(ลายมือชื่อ)</span>
          <div className="relative flex-1 mx-2 border-b border-dotted border-slate-700 h-8 flex items-end justify-center">
            {officerSig && (
              <img
                src={officerSig}
                alt="e-sig ผู้ตรวจ"
                className="absolute -bottom-1.5 h-10 object-contain filter contrast-125 pointer-events-none"
              />
            )}
          </div>
          <span className="text-xs text-slate-800 shrink-0 whitespace-nowrap pb-0.5">ผู้ตรวจ</span>
        </div>
        <div className="font-bold">({sig.officerName || 'นางสาวรุ่งทิวา อุปนันท์'})</div>
        <div className="text-xs text-slate-700">{sig.officerPosition || 'นักวิชาการสาธารณสุขปฏิบัติการ'}</div>
      </div>

      <div className="flex flex-col items-center text-center w-full max-w-[280px] mx-auto">
        <div className="relative flex items-end justify-center min-h-[44px] mb-1 w-full">
          <span className="text-xs text-slate-800 shrink-0 select-none pb-0.5">(ลายมือชื่อ)</span>
          <div className="flex-1 mx-2 border-b border-dotted border-slate-700 h-8"></div>
          <span className="text-xs text-slate-800 shrink-0 whitespace-nowrap pb-0.5">เจ้าพนักงานท้องถิ่น</span>
        </div>
        <div className="font-bold">({sig.mayorName && !sig.mayorName.includes('สมหมาย') ? sig.mayorName : 'นายสมคิด พงษ์สุข'})</div>
        <div className="text-xs text-slate-700">{sig.mayorPosition || 'นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน'}</div>
        <div className="text-[11px] font-semibold text-slate-800">{sig.mayorRoleTitle || 'เจ้าพนักงานท้องถิ่น'}</div>
        <div className="text-xs text-slate-500 mt-1 font-mono">
          วันที่ {formatThaiDate(issueDate, false)}
        </div>
      </div>
    </div>
  );
};
