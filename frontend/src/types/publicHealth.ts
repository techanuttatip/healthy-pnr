export type RegimeType = 'บทส' | 'บทอ' | 'นจ' | 'อส' | 'นส' | 'ปป' | 'ยล';

export type EstablishmentCategory =
  | 'hazardous' // แบบ บทส. กิจการที่เป็นอันตรายต่อสุขภาพ (13 หมวด 140+ ประเภท)
  | 'food_license' // แบบ บทอ. สถานที่จำหน่าย/สะสมอาหาร พื้นที่เกิน 200 ตร.ม.
  | 'food_notice' // แบบ นจ. สถานที่จำหน่าย/สะสมอาหาร พื้นที่ ≤ 200 ตร.ม.
  | 'market' // แบบ อส. ตลาดประเภทที่ 1 (มีโครงสร้าง) และประเภทที่ 2 (ตลาดนัด)
  | 'public_sale' // แบบ นส. การจำหน่ายสินค้าในที่หรือทางสาธารณะ (หาบเร่ แผงลอย)
  | 'waste_sewage' // แบบ ปป. การรับทำการกำจัดสิ่งปฏิกูลหรือมูลฝอย
  | 'terminate_transfer'; // แบบ ยล. การแจ้งเลิกหรือโอนกิจการ

export type EstablishmentStatus =
  | 'active' // ได้รับอนุญาต/หนังสือรับรองปกติ 🟢
  | 'expiring' // ใกล้สิ้นอายุใบอนุญาต (เตือนล่วงหน้า 60/30/15 วัน) 🟡
  | 'awaiting_payment' // ตรวจผ่านแล้ว รอชำระค่าธรรมเนียม 🔵
  | 'pending_inspection' // รอนัดตรวจสุขลักษณะสถานที่จริง 🟣
  | 'pending_correction'; // มีคำสั่งให้แก้ไขปรับปรุงสุขาภิบาล (15 หรือ 30 วัน) 🔴

export interface InspectionChecklistItem {
  id: string;
  dimension: string; // เช่น 'มิติที่ 1: สถานที่และสิ่งแวดล้อม'
  title: string;
  description: string;
  points: number;
  isCritical?: boolean; // ข้อกำหนดบังคับ ขาดไม่ได้
  passed: boolean;
  defectNote?: string;
}

export interface InspectionPhoto {
  id: string;
  url: string;
  category: 'pallet' | 'temperature' | 'screen' | 'cleanliness' | 'other';
  caption?: string;
  timestamp: string;
}

export interface GpsCheckInInfo {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
  distanceMeters?: number;
  isWithinPremises?: boolean;
}

export interface DualSignatures {
  inspectorSignature?: string; // base64 data url
  inspectorName?: string;
  inspectorSignedAt?: string;
  ownerSignature?: string; // base64 data url
  ownerSignedName?: string;
  ownerSignedAt?: string;
}

export interface InspectionRecord {
  id: string;
  establishmentId: string;
  inspectionDate: string;
  inspectorName: string;
  inspectorPosition: string;
  totalScore: number;
  maxScore: number;
  result: 'passed' | 'needs_correction';
  correctionDays?: 15 | 30;
  correctionDeadline?: string;
  defectsSummary?: string[];
  inspectorNotes?: string;
  checklistItems: InspectionChecklistItem[];
  // On-site field inspection data
  gpsCheckIn?: GpsCheckInInfo;
  photos?: InspectionPhoto[];
  signatures?: DualSignatures;
}

export type ArchiveDocumentType =
  | 'field_pack' // ชุดเอกสารลงพื้นที่ตรวจสนาม ๓ รายการใน ๑ ไฟล์ (คำขอ + สำเนาบัตร + ผลตรวจ)
  | 'application' // 01 แบบคำขอ (อภ.๑ / นจ.๑ / บทอ.๑)
  | 'id_card' // 02 สำเนาบัตรประจำตัวประชาชน / ทะเบียนบ้าน
  | 'inspection_slip' // 03 แบบตรวจประเมินสุขลักษณะหน้างาน
  | 'receipt' // 04 ใบเสร็จรับเงิน อปท. (RCPT)
  | 'license' // 05 สำเนาคู่ฉบับใบอนุญาต (อภ.๒ / นจ.๓ / บทอ.๒ ที่นายก อบต. ลงนามแล้ว)
  | 'license_copy' // ทางเลือกชื่อเรียกคู่ฉบับ
  | 'other'; // เอกสารแนบเพิ่มเติมอื่นๆ

export interface ArchivedDocument {
  id: string;
  type: ArchiveDocumentType;
  title: string;
  fileName: string;
  fileSize?: string;
  uploadedAt: string;
  uploadedBy?: string;
  fileUrl?: string; // base64 or object url
  thumbnailUrl?: string;
  status: 'verified' | 'pending' | 'missing';
  notes?: string;
}

export type AuditActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'inspect'
  | 'upload_doc'
  | 'delete_doc'
  | 'print_license'
  | 'renew_license'
  | 'login'
  | 'settings';

export interface AuditLog {
  id: string;
  timestamp: string;
  action: AuditActionType;
  actionTitle: string;
  establishmentId?: string;
  establishmentName?: string;
  officerName: string;
  officerRole?: string;
  details?: string;
}

export interface YearDossier {
  year: number; // e.g. 2568, 2569, 2570
  status: 'complete' | 'in_progress' | 'pending_field_visit' | 'pending_payment';
  applicationDate?: string;
  inspectionDate?: string;
  paymentDate?: string;
  receiptNo?: string;
  feeAmount?: number;
  licenseNo?: string;
  licenseIssueDate?: string;
  licenseExpireDate?: string;
  documents: ArchivedDocument[];
  notes?: string;
}

export interface Establishment {
  id: string;
  regNumber: string; // เลขที่คำขอ/เลขที่ใบอนุญาต เช่น บทส-67-0012, นจ-67-0045
  regType: RegimeType;
  category: EstablishmentCategory;
  categoryName: string;
  businessName: string;
  applicantType: 'individual' | 'juristic';
  ownerName: string;
  citizenId: string; // เลขบัตรประชาชน หรือเลขทะเบียนนิติบุคคล 13 หลัก
  phone: string;
  email?: string;
  village: string; // หมู่ที่ / ชุมชน
  address: string;
  areaSqm: number;
  workerCount: number;
  machineHorsepower?: number; // แรงม้าเครื่องจักร (สำหรับ บทส.)
  foodHandlerCertNo?: string; // เลขวุฒิบัตรผู้สัมผัสอาหาร (บทอ. และ นจ.)
  lat: number;
  lng: number;
  status: EstablishmentStatus;
  issueDate: string; // YYYY-MM-DD
  expireDate: string; // YYYY-MM-DD
  annualFeeDue: string;
  feeAmount: number;
  bookNo: string;
  docNo: string;
  conditions: string[];
  inspectionPassed?: boolean;
  inspectorName?: string;
  inspectionDate?: string;
  inspectionScore?: number;
  correctionDays?: 15 | 30;
  correctionDeadline?: string;
  inspectionRecord?: InspectionRecord;
  cleanFoodGrade?: 'standard' | 'plus' | null;
  testKitsPassed?: boolean;
  foodPlaceType?: 'selling' | 'storage' | 'both'; // สถานที่จำหน่ายอาหาร | สถานที่สะสมอาหาร | ทั้งสองอย่าง
  foodTypeDetail?: string; // ประเภทอาหาร (เช่น อาหารปรุงสำเร็จ เครื่องดื่ม อาหารสด อาหารแห้ง)
  premiseCharacteristics?: string; // ลักษณะสถานที่ (เช่น ในอาคาร ยานพาหนะ Food truck ซุ้ม/แผง)
  distributionMethod?: string; // วิธีการจำหน่าย (มีโต๊ะเก้าอี้ ซื้อกลับบ้าน บริการจัดส่ง)
  operatingHours?: string; // ช่วงเวลาที่จำหน่าย (เช่น ๐๗:๐๐ - ๑๙:๐๐ น.)
  lineId?: string; // ID: Line
  fax?: string; // โทรสาร
  receiptBookNo?: string; // ใบเสร็จรับเงินเล่มที่
  receiptNo?: string; // ใบเสร็จรับเงินเลขที่
  receiptDate?: string; // วันที่ออกใบเสร็จรับเงิน
  nextFeeDueDate?: string; // ครบกำหนดวันชำระค่าธรรมเนียมครั้งถัดไป
  isReplacementCert?: boolean; // ออกใบแทนหนังสือรับรองการแจ้ง
  replacementReason?: 'lost' | 'destroyed' | 'damaged' | string; // เหตุที่ขอใบแทน (สูญหาย ถูกทำลาย ชำรุดในสาระสำคัญ)
  replacementRequestDate?: string; // วันที่ยื่นคำขอใบแทน
  applicationSubmissionDate?: string; // วันที่รับเรื่องคำขอ
  temporarySlipIssuedDate?: string; // วันที่ออกใบรับแจ้ง (ต้องเป็นวันเดียวกับวันที่รับเรื่อง)
  notes?: string;
  yearlyArchives?: YearDossier[]; // แฟ้มประวัติรายปี
}

export type OfficialFormCode =
  | 'บทส.1' // ขอรับใบอนุญาตกิจการอันตราย
  | 'บทส.2' // ต่ออายุใบอนุญาตกิจการอันตราย
  | 'บทอ.1' // ขอรับใบอนุญาตอาหาร > 200 ตร.ม.
  | 'บทอ.2' // ต่ออายุใบอนุญาตอาหาร > 200 ตร.ม.
  | 'นจ.1'  // คำขอแจ้งจัดตั้งอาหาร ≤ 200 ตร.ม.
  | 'นจ.2'  // ใบรับแจ้งการจัดตั้ง
  | 'นจ.3'  // หนังสือรับรองการแจ้ง
  | 'อส.1'  // ขอรับใบอนุญาตจัดตั้งตลาด
  | 'นส.1'  // ขอรับใบอนุญาตจำหน่ายสินค้าที่สาธารณะ
  | 'ปป.1'  // ขอรับใบอนุญาตกำจัดสิ่งปฏิกูล/มูลฝอย
  | 'ยล.1'; // ขอแจ้งเลิกหรือโอนกิจการ

export const OFFICIAL_VILLAGES = [
  'หมู่ที่ 1 บ้านหนองพนัง',
  'หมู่ที่ 2 บ้านดอน',
  'หมู่ที่ 3 บ้านหัวฝาย',
  'หมู่ที่ 4 บ้านท่าหัด',
  'หมู่ที่ 5 บ้านต้นผึ้ง',
  'หมู่ที่ 6 บ้านเปียงกอก',
  'หมู่ที่ 7 บ้านต้นผึ้งใต้'
];

export interface SignatorySettings {
  mayorName: string; // นายก อบต. (เจ้าพนักงานท้องถิ่น)
  mayorPosition: string; // นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน
  mayorRoleTitle: string; // เจ้าพนักงานท้องถิ่น
  healthDirectorName: string; // ผู้อำนวยการกองสาธารณสุขและสิ่งแวดล้อม
  healthDirectorPosition: string; // ผู้อำนวยการกองสาธารณสุขและสิ่งแวดล้อม
  healthChiefName: string; // หัวหน้าฝ่ายบริการสาธารณสุข
  healthChiefPosition: string; // หัวหน้าฝ่ายบริการสาธารณสุข
  officerName: string; // เจ้าพนักงานสาธารณสุขผู้รับคำขอ
  officerPosition: string; // เจ้าพนักงานสาธารณสุขชำนาญงาน
}

export interface FeeRatesSettings {
  foodNoticeSmall: number; // นจ. ≤ 100 ตร.ม.
  foodNoticeLarge: number; // นจ. 101-200 ตร.ม.
  foodLicense: number; // บทอ. > 200 ตร.ม.
  foodStorage: number; // สถานที่สะสมอาหาร
  hazardousBase: number; // บทส. ทั่วไป
  hazardousHeavy: number; // บทส. เครื่องจักร > 50 แรงม้า
  marketRate: number; // อส. ตลาด
  publicSaleRate: number; // นส. ขายที่สาธารณะ
  wasteSewageRate: number; // ปป. กำจัดสิ่งปฏิกูล
}

export interface InspectionRulesSettings {
  passingScore: number; // เกณฑ์ผ่านการตรวจสุขลักษณะ (คะแนนเต็ม 100)
  cleanFoodPlusScore: number; // เกณฑ์คะแนนระดับดีเลิศ Clean Food Plus
  standardCorrectionDays: number; // ระยะเวลาให้ปรับปรุงแก้ไข (วัน)
  maxCorrectionDays: number; // ระยะเวลาปรับปรุงสูงสุด (วัน)
  expiryWarningDays: number; // ระยะเวลาแจ้งเตือนล่วงหน้าก่อนสิ้นอายุ (วัน)
}

export interface SystemSettings {
  organizationName: string; // องค์การบริหารส่วนตำบลโป่งน้ำร้อน
  departmentName: string; // กองสาธารณสุขและสิ่งแวดล้อม
  district: string; // อำเภอฝาง
  province: string; // จังหวัดเชียงใหม่
  fiscalYear: string; // ๒๕๖๗
  phoneNumber: string; // เบอร์โทรศัพท์
  email: string; // อีเมล
  website: string; // เว็บไซต์
  signatories: SignatorySettings;
  fees: FeeRatesSettings;
  inspectionRules: InspectionRulesSettings;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  organizationName: 'องค์การบริหารส่วนตำบลโป่งน้ำร้อน',
  departmentName: 'กองสาธารณสุขและสิ่งแวดล้อม',
  district: 'อำเภอฝาง',
  province: 'จังหวัดเชียงใหม่',
  fiscalYear: '๒๕๖๗',
  phoneNumber: '053-810317',
  email: 'health@pongnamron.go.th',
  website: 'www.pongnamron.go.th',
  signatories: {
    mayorName: 'นายสมหมาย มงคลกุล',
    mayorPosition: 'นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน',
    mayorRoleTitle: 'เจ้าพนักงานท้องถิ่น',
    healthDirectorName: 'นางสาวกมลวรรณ ชัยมงคล',
    healthDirectorPosition: 'ผู้อำนวยการกองสาธารณสุขและสิ่งแวดล้อม',
    healthChiefName: 'นายสุรชัย วงศ์ใหญ่',
    healthChiefPosition: 'หัวหน้าฝ่ายบริการสาธารณสุข',
    officerName: 'นางสาวรุ่งทิวา อุปนันท์',
    officerPosition: 'นักวิชาการสาธารณสุขปฏิบัติการ'
  },
  fees: {
    foodNoticeSmall: 500,
    foodNoticeLarge: 1000,
    foodLicense: 3000,
    foodStorage: 1500,
    hazardousBase: 2000,
    hazardousHeavy: 3000,
    marketRate: 5000,
    publicSaleRate: 300,
    wasteSewageRate: 4000
  },
  inspectionRules: {
    passingScore: 80,
    cleanFoodPlusScore: 90,
    standardCorrectionDays: 15,
    maxCorrectionDays: 30,
    expiryWarningDays: 30
  }
};

export type PrintDocumentMode =
  | 'garuda'
  | 'temp_notice'
  | 'replacement_cert'
  | 'application'
  | 'register_report'
  | 'cleanfood'
  | 'receipt'
  | 'food_card'
  | 'renewal_notice'
  | 'field_pack'
  | 'hazardous_license';

export function thaiBahtText(num: number): string {
  if (isNaN(num)) return '';
  if (num === 0) return 'ศูนย์บาทถ้วน';

  const numbers = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const places = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  const rounded = Math.round(num * 100) / 100;
  const parts = rounded.toFixed(2).split('.');
  const integerPart = parseInt(parts[0], 10);
  const satangPart = parseInt(parts[1], 10);

  function convertGroup(val: number): string {
    if (val === 0) return '';
    let result = '';
    const digits = String(val).split('').map(Number);
    const len = digits.length;

    for (let i = 0; i < len; i++) {
      const d = digits[i];
      const place = len - 1 - i;
      if (d === 0) continue;

      if (place === 0) {
        if (d === 1 && len > 1 && digits[len - 2] !== 0) {
          result += 'เอ็ด';
        } else {
          result += numbers[d];
        }
      } else if (place === 1) {
        if (d === 1) {
          result += 'สิบ';
        } else if (d === 2) {
          result += 'ยี่สิบ';
        } else {
          result += numbers[d] + 'สิบ';
        }
      } else {
        result += numbers[d] + places[place];
      }
    }
    return result;
  }

  let text = '';
  if (integerPart > 0) {
    if (integerPart >= 1000000) {
      const millions = Math.floor(integerPart / 1000000);
      const remainder = integerPart % 1000000;
      text += convertGroup(millions) + 'ล้าน' + convertGroup(remainder) + 'บาท';
    } else {
      text += convertGroup(integerPart) + 'บาท';
    }
  }

  if (satangPart === 0) {
    text += 'ถ้วน';
  } else {
    text += convertGroup(satangPart) + 'สตางค์';
  }

  return text;
}

