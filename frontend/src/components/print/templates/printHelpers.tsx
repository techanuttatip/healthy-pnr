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
 * Format ISO date string into official Thai format with Arabic or Thai digits (e.g. 15 ตุลาคม 2569 or ๑๕ ตุลาคม ๒๕๖๙)
 */
export const formatThaiDate = (dateStr?: string, useThaiDigits = false) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return useThaiDigits ? toThaiDigits(dateStr) : dateStr;
  const [y, m, d] = parts;
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const day = parseInt(d, 10);
  const month = months[parseInt(m, 10) - 1] || '';
  const year = parseInt(y, 10) + 543;
  const res = `${day} ${month} ${year}`;
  return useThaiDigits ? toThaiDigits(res) : res;
};

/**
 * Parse village and address components
 */
export const parseAddressDetails = (rawAddress?: string, rawVillage?: string) => {
  const addr = (rawAddress || '').replace(/^เลขที่\s*/, '').trim();
  let v = (rawVillage || '').trim();
  const houseNo = addr.split(' ')[0] || addr || '-';

  if (!v && (addr.includes('หมู่') || addr.includes('บ้าน'))) {
    const mooMatch = addr.match(/(หมู่(?:ที่)?\s*\d+.*)$/);
    if (mooMatch) {
      v = mooMatch[1];
    }
  }

  let mooPart = '';
  let mooNumber = '';
  let villageNamePart = '';

  const match = v.match(/^(หมู่(?:ที่)?\s*(\d+))\s*(.*)$/);
  if (match) {
    mooPart = match[1].trim();
    mooNumber = match[2].trim();
    villageNamePart = (match[3] || '').trim();
  } else if (/^\d+$/.test(v)) {
    mooPart = `หมู่ที่ ${v}`;
    mooNumber = v;
  } else if (v.startsWith('บ้าน')) {
    villageNamePart = v;
  } else if (v) {
    mooPart = v.startsWith('หมู่') ? v : `หมู่ที่ ${v}`;
    const numMatch = v.match(/\d+/);
    if (numMatch) mooNumber = numMatch[0];
  }

  if (!mooNumber) {
    const addrMooMatch = addr.match(/หมู่(?:ที่)?\s*(\d+)/);
    if (addrMooMatch) {
      mooNumber = addrMooMatch[1];
      if (!mooPart) mooPart = `หมู่ที่ ${mooNumber}`;
    }
  }

  const combinedVillage = mooPart && villageNamePart
    ? `${mooPart} ${villageNamePart}`
    : (mooPart || villageNamePart || v || '-');

  const fullVillageDisplay: React.ReactNode = (
    <span className="whitespace-nowrap inline-block">
      {combinedVillage}
    </span>
  );

  return {
    houseNo,
    mooNumber,
    mooPart,
    villageNamePart,
    combinedVillage,
    fullVillageDisplay
  };
};

/**
 * Convert Arabic numbers to authentic Thai numerals (e.g. 1 -> ๑)
 */
export const toThaiDigits = (input?: string | number | null): string => {
  if (input === undefined || input === null) return '';
  const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return String(input).replace(/\d/g, (d) => thaiDigits[parseInt(d, 10)]);
};

/**
 * Format address into continuous, official Thai administrative phrasing without awkward spaces
 */
export const formatOfficialAddress = (
  rawAddress?: string,
  rawVillage?: string,
  district = 'อำเภอฝาง',
  province = 'จังหวัดเชียงใหม่'
) => {
  const parsed = parseAddressDetails(rawAddress, rawVillage);
  const parts: string[] = [];

  if (parsed.houseNo && parsed.houseNo !== '-') {
    parts.push(parsed.houseNo);
  }

  if (parsed.mooNumber) {
    parts.push(`หมู่ที่ ${parsed.mooNumber}`);
  }

  if (parsed.villageNamePart) {
    parts.push(parsed.villageNamePart);
  } else if (!parsed.mooNumber && parsed.combinedVillage && parsed.combinedVillage !== '-') {
    parts.push(parsed.combinedVillage);
  }

  const cleanDistrict = district.replace(/^อำเภอ/, '');
  const cleanProvince = province.replace(/^จังหวัด/, '');
  parts.push('ตำบลโป่งน้ำร้อน');
  parts.push(`อำเภอ${cleanDistrict}`);
  parts.push(`จังหวัด${cleanProvince}`);

  return {
    parsed,
    formatted: parts.join(' '),
    houseNo: parsed.houseNo,
    mooNumber: parsed.mooNumber,
    villageName: parsed.villageNamePart,
    subdistrict: 'ตำบลโป่งน้ำร้อน',
    district: `อำเภอ${cleanDistrict}`,
    province: `จังหวัด${cleanProvince}`
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
