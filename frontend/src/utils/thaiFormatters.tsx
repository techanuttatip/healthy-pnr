import React from 'react';

/**
 * แปลงเลขอารบิกเป็นเลขไทย
 */
export const toThaiDigits = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return '';
  return String(num).replace(/[0-9]/g, (digit) => '๐๑๒๓๔๕๖๗๘๙'[parseInt(digit, 10)]);
};

/**
 * แปลงจำนวนเงินตัวเลขเป็นข้อความภาษาไทย (เช่น 100 -> หนึ่งร้อยบาทถ้วน, 1,000 -> หนึ่งพันบาทถ้วน)
 * ตามมาตรฐานงานสารบรรณและการเงินการคลังภาครัฐ
 */
export const thaiBahtText = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null || amount === '') return '-';
  const num = Math.round(Number(amount) * 100) / 100;
  if (isNaN(num)) return '-';
  if (num === 0) return 'ศูนย์บาทถ้วน';

  const digits = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  function convertGroup(nStr: string): string {
    let result = '';
    const len = nStr.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(nStr[i], 10);
      const pos = len - i - 1;
      if (digit !== 0) {
        if (pos === 1 && digit === 1) {
          result += 'สิบ';
        } else if (pos === 1 && digit === 2) {
          result += 'ยี่สิบ';
        } else if (pos === 0 && digit === 1 && parseInt(nStr, 10) > 10) {
          result += 'เอ็ด';
        } else {
          result += digits[digit] + units[pos];
        }
      }
    }
    return result;
  }

  const [intPart] = num.toFixed(2).split('.');
  const bahtStr = convertGroup(intPart) + 'บาทถ้วน';
  return bahtStr;
};

/**
 * จัดรูปแบบวันที่ภาษาไทยทางการ (ปฏิทินสุริยคติไทย)
 */
export const formatThaiDate = (inputDate?: Date | string | null) => {
  const d = inputDate ? new Date(inputDate) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const day = validDate.getDate();
  const month = months[validDate.getMonth()];
  const year = validDate.getFullYear() + 543;
  return {
    day,
    month,
    year,
    dayStr: toThaiDigits(day),
    monthStr: month,
    yearStr: toThaiDigits(year),
    fullThaiDate: `${toThaiDigits(day)} ${month} พ.ศ. ${toThaiDigits(year)}`
  };
};

/**
 * เรนเดอร์เลขประจำตัวประชาชน ๑๓ ช่องสี่เหลี่ยมแยกตามมาตรฐานแบบฟอร์มราชการ
 * รูปแบบทางการ: [ ๑ ] - [ ๔ ช่อง ] - [ ๕ ช่อง ] - [ ๒ ช่อง ] - [ ๑ ]
 */
export const CitizenIdBoxes: React.FC<{
  citizenId?: string;
  useThaiDigits?: boolean;
  boxClassName?: string;
}> = ({ citizenId = '', useThaiDigits = true, boxClassName = '' }) => {
  const cleanDigits = (citizenId || '').replace(/\D/g, '').split('');
  // กลุ่ม ๑๓ ช่องมาตรฐานราชการ: 1 - 4 - 5 - 2 - 1
  const groups = [
    [0],
    [1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11],
    [12]
  ];

  return (
    <span className="inline-flex items-center gap-1 font-mono align-middle select-none">
      {groups.map((group, gIdx) => (
        <React.Fragment key={gIdx}>
          <span className="inline-flex items-center border border-slate-700 bg-white rounded-[1px] overflow-hidden">
            {group.map((idx) => {
              const rawDigit = cleanDigits[idx];
              const displayDigit =
                rawDigit !== undefined
                  ? useThaiDigits
                    ? toThaiDigits(rawDigit)
                    : rawDigit
                  : '';
              return (
                <span
                  key={idx}
                  className={`w-4 h-5 sm:w-4.5 sm:h-5.5 flex items-center justify-center border-r last:border-r-0 border-slate-400 font-bold text-slate-900 text-xs sm:text-[13px] leading-none ${boxClassName}`}
                >
                  {displayDigit || <span className="opacity-0">0</span>}
                </span>
              );
            })}
          </span>
          {gIdx < groups.length - 1 && <span className="text-slate-700 font-bold text-xs">-</span>}
        </React.Fragment>
      ))}
    </span>
  );
};
