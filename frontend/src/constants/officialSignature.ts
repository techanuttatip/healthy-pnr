/**
 * Official Public Health Officer (นวก.) Signature Asset
 * นางสาวรุ่งทิวา อุปนันท์ (นักวิชาการสาธารณสุขชำนาญการ)
 * องค์การบริหารส่วนตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่
 */

export const RUNGTHIWA_OFFICER = {
  name: 'นางสาวรุ่งทิวา อุปนันท์',
  shortTitle: 'นวก.รุ่งทิวา',
  position: 'นักวิชาการสาธารณสุขชำนาญการ (นวก.)',
  code: 'PNR-HL-01',
  org: 'องค์การบริหารส่วนตำบลโป่งน้ำร้อน',
  district: 'อำเภอฝาง',
  province: 'จังหวัดเชียงใหม่'
};

// Crisp official vector e-signature in Government Registrar Blue (#1e40af)
export const OFFICIAL_NWK_SIGNATURE_DATA_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 110" width="320" height="110">
      <defs>
        <filter id="inkGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0.5" dy="0.5" stdDeviation="0.4" flood-color="#1e3a8a" flood-opacity="0.3"/>
        </filter>
      </defs>
      <g filter="url(#inkGlow)">
        <!-- Elegant cursive flourish for "รุ่งทิวา" -->
        <path d="M 40 68 C 60 18, 78 82, 110 38 C 130 18, 142 78, 172 48 C 192 28, 212 86, 234 42 C 248 24, 262 62, 282 56" fill="none" stroke="#1e40af" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Sweeping underline loop -->
        <path d="M 32 78 Q 155 98, 288 66" fill="none" stroke="#1e40af" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Thai vowel accents / diacritics -->
        <path d="M 108 34 Q 112 24, 118 34" fill="none" stroke="#1e40af" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M 170 42 Q 174 32, 180 42" fill="none" stroke="#1e40af" stroke-width="2.5" stroke-linecap="round"/>
      </g>
    </svg>`
  );
