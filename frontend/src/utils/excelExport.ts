import * as XLSX from 'xlsx';
import type { Establishment, YearDossier, AuditLog } from '../types/publicHealth';

const toThaiDigits = (num: number | string) =>
  String(num).replace(/[0-9]/g, (digit) => '๐๑๒๓๔๕๖๗๘๙'[parseInt(digit, 10)]);

const formatThaiDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return `${d.getDate()} ${months[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
  } catch {
    return dateStr;
  }
};

/**
 * ๑. ส่งออกทะเบียนสถานประกอบการเป็นไฟล์ Excel (.xlsx) คุณภาพสูง
 */
export function exportEstablishmentsToExcel(
  establishments: Establishment[],
  options?: {
    fiscalYear?: string;
    filterLabel?: string;
    includeSummarySheet?: boolean;
  }
) {
  const wb = XLSX.utils.book_new();
  const fyLabel = options?.fiscalYear && options.fiscalYear !== 'all'
    ? `ปีงบประมาณ พ.ศ. ${toThaiDigits(options.fiscalYear)}`
    : 'ทุกปีงบประมาณ';

  const statusLabels: Record<string, string> = {
    active: 'ได้รับอนุญาตปกติ',
    expiring: 'ใกล้สิ้นอายุ 30 วัน',
    awaiting_payment: 'รอชำระค่าธรรมเนียม',
    pending_inspection: 'รอนัดตรวจสุขลักษณะ',
    pending_correction: 'มีคำสั่งให้ปรับปรุง'
  };

  // Header Banner rows
  const headerRows: (string | number)[][] = [
    ['องค์การบริหารส่วนตำบลโป่งน้ำร้อน อำเภอแม่จัน จังหวัดเชียงราย'],
    [`ทะเบียนคุมสถานประกอบการตาม พ.ร.บ.การสาธารณสุข พ.ศ. ๒๕๓๕ (${fyLabel})`],
    [
      `วันที่ส่งออกข้อมูล: ${formatThaiDate(new Date().toISOString().split('T')[0])} | จำนวนทั้งหมด: ${establishments.length} แห่ง ${
        options?.filterLabel ? `| เงื่อนไข: ${options.filterLabel}` : ''
      }`
    ],
    [] // blank row
  ];

  // Column Headers
  const tableHeaders = [
    'ลำดับ',
    'เลขที่ทะเบียนคุม',
    'เลขที่คำขอ',
    'ประเภทใบอนุญาต',
    'หมวดหมู่กิจการ',
    'ชื่อสถานประกอบการ',
    'ชื่อผู้ขอรับใบอนุญาต',
    'เลขประจำตัวประชาชน (๑๓ หลัก)',
    'เบอร์โทรศัพท์',
    'ที่ตั้งสถานประกอบการ',
    'หมู่ที่',
    'พื้นที่ (ตร.ม.)',
    'จำนวนคนงาน (คน)',
    'วันที่ยื่นคำขอ',
    'วันที่ออกใบอนุญาต',
    'วันสิ้นอายุใบอนุญาต',
    'ค่าธรรมเนียม (บาท)',
    'เลขที่ใบเสร็จ (RCPT)',
    'คะแนนตรวจสุขลักษณะ',
    'ผลตรวจประเมิน',
    'สถานะใบอนุญาต',
    'หมายเหตุ'
  ];

  // Data rows
  let totalFee = 0;
  const dataRows = establishments.map((est, idx) => {
    const fee = est.feeAmount || 0;
    totalFee += fee;

    return [
      idx + 1,
      est.regNumber,
      est.docNo || '-',
      est.regType,
      est.categoryName,
      est.businessName,
      est.ownerName,
      est.citizenId,
      est.phone || '-',
      est.address || '-',
      est.village,
      est.areaSqm || 0,
      est.workerCount || 0,
      est.applicationSubmissionDate || est.temporarySlipIssuedDate || '-',
      est.issueDate || '-',
      est.expireDate || '-',
      fee,
      est.receiptNo || '-',
      est.inspectionScore !== undefined ? `${est.inspectionScore}/100` : '-',
      est.inspectionPassed
        ? 'ผ่านเกณฑ์มาตรฐาน'
        : est.status === 'pending_correction'
        ? 'อยู่ระหว่างปรับปรุง'
        : 'รอตรวจประเมิน',
      statusLabels[est.status] || est.status,
      est.notes || '-'
    ];
  });

  // Summary Row
  const summaryRow = [
    'รวมทั้งสิ้น',
    `${establishments.length} แห่ง`,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'รวมค่าธรรมเนียม:',
    totalFee,
    '',
    '',
    '',
    '',
    ''
  ];

  const wsData = [...headerRows, tableHeaders, ...dataRows, summaryRow];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column width calculations
  const colWidths = [
    { wch: 8 },  // ลำดับ
    { wch: 18 }, // เลขที่ทะเบียนคุม
    { wch: 15 }, // เลขที่คำขอ
    { wch: 14 }, // ประเภทใบอนุญาต
    { wch: 32 }, // หมวดหมู่กิจการ
    { wch: 35 }, // ชื่อสถานประกอบการ
    { wch: 28 }, // ชื่อผู้ขอ
    { wch: 20 }, // บัตรประชาชน
    { wch: 15 }, // เบอร์โทร
    { wch: 35 }, // ที่อยู่
    { wch: 22 }, // หมู่บ้าน
    { wch: 14 }, // พื้นที่
    { wch: 14 }, // คนงาน
    { wch: 15 }, // วันยื่น
    { wch: 15 }, // วันออก
    { wch: 15 }, // วันหมดอายุ
    { wch: 18 }, // ค่าธรรมเนียม
    { wch: 18 }, // เลขที่ใบเสร็จ
    { wch: 16 }, // คะแนน
    { wch: 20 }, // ผลตรวจ
    { wch: 22 }, // สถานะ
    { wch: 35 }  // หมายเหตุ
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'ทะเบียนสถานประกอบการ');

  // Sheet 2: สรุปสถิติตามหมู่บ้าน (Village Breakdown)
  const villageMap: Record<string, { count: number; fee: number }> = {};
  establishments.forEach((e) => {
    const v = e.village || 'ไม่ระบุหมู่บ้าน';
    if (!villageMap[v]) villageMap[v] = { count: 0, fee: 0 };
    villageMap[v].count += 1;
    villageMap[v].fee += e.feeAmount || 0;
  });

  const villageSummaryRows = [
    ['องค์การบริหารส่วนตำบลโป่งน้ำร้อน อำเภอแม่จัน จังหวัดเชียงราย'],
    [`รายงานสรุปสถานประกอบการแยกตามหมู่บ้าน (${fyLabel})`],
    [`วันที่ส่งออกข้อมูล: ${formatThaiDate(new Date().toISOString().split('T')[0])}`],
    [],
    ['ลำดับ', 'หมู่บ้าน / ชุมชน', 'จำนวนสถานประกอบการ (แห่ง)', 'สัดส่วน (%)', 'รวมค่าธรรมเนียม (บาท)'],
    ...Object.entries(villageMap)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([vName, stat], idx) => [
        idx + 1,
        vName,
        stat.count,
        establishments.length > 0
          ? `${((stat.count / establishments.length) * 100).toFixed(1)}%`
          : '0%',
        stat.fee
      ]),
    [
      'รวม',
      'ทุกหมู่บ้าน',
      establishments.length,
      '100%',
      totalFee
    ]
  ];

  const wsVillage = XLSX.utils.aoa_to_sheet(villageSummaryRows);
  wsVillage['!cols'] = [
    { wch: 8 },
    { wch: 30 },
    { wch: 25 },
    { wch: 15 },
    { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(wb, wsVillage, 'สถิติตามหมู่บ้าน');

  // Export file
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `ทะเบียนสถานประกอบการ_อบต_โป่งน้ำร้อน_${options?.fiscalYear || 'รวม'}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}

/**
 * ๒. ส่งออกรายงานความครบถ้วนแฟ้มเอกสารประจำปี (Dossier Completeness Report)
 */
export function exportDossierReportToExcel(
  establishments: Establishment[],
  targetYear: number
) {
  const wb = XLSX.utils.book_new();

  let completeCount = 0;
  let incompleteCount = 0;
  let totalFee = 0;

  const dataRows = establishments.map((est, idx) => {
    const archives = est.yearlyArchives || [];
    const dossier: YearDossier | undefined = archives.find((a) => a.year === targetYear);
    const docs = dossier?.documents || [];

    const hasSlot1 = docs.some(
      (d) =>
        d.type === 'field_pack' ||
        d.type === 'application' ||
        d.title.includes('ชุดเอกสาร') ||
        d.title.includes('ลงพื้นที่') ||
        d.title.includes('คำขอ')
    );
    const hasSlot2 = docs.some((d) => d.type === 'receipt' || d.title.includes('ใบเสร็จ'));
    const hasSlot3 = docs.some(
      (d) =>
        d.type === 'license' ||
        d.type === 'license_copy' ||
        d.title.includes('คู่ฉบับ') ||
        d.title.includes('ใบอนุญาต')
    );

    const isComplete = hasSlot1 && hasSlot2 && hasSlot3;
    if (isComplete) completeCount++;
    else incompleteCount++;

    const fee = est.feeAmount || 100;
    totalFee += fee;

    return [
      idx + 1,
      est.regNumber,
      est.businessName,
      est.ownerName,
      est.village,
      est.regType,
      hasSlot1 ? '✓ มีครบ (๓ ฉบับใน ๑ ไฟล์)' : '✗ ยังไม่มีชุดลงพื้นที่',
      hasSlot2 ? `✓ มีแล้ว (${est.receiptNo || 'ชำระแล้ว'})` : '✗ ขาดใบเสร็จ',
      hasSlot3 ? '✓ มีแล้ว (นายกฯ เซ็น)' : '✗ ขาดสำเนาคู่ฉบับ',
      docs.length,
      isComplete ? 'ครบถ้วนสมบูรณ์ ๑๐๐%' : 'ยังค้างส่งเอกสาร',
      est.receiptNo || '-',
      fee,
      dossier?.notes || '-'
    ];
  });

  const completenessPercentage = establishments.length > 0
    ? ((completeCount / establishments.length) * 100).toFixed(1)
    : '0';

  const headerRows: (string | number)[][] = [
    ['องค์การบริหารส่วนตำบลโป่งน้ำร้อน อำเภอแม่จัน จังหวัดเชียงราย'],
    ['กองสาธารณสุขและสิ่งแวดล้อม — ระบบสารบรรณทะเบียนใบอนุญาต'],
    [`รายงานสรุปสถานะแฟ้มเอกสารประจำปีงบประมาณ พ.ศ. ${toThaiDigits(targetYear)} (${targetYear})`],
    [
      `วันที่ออกรายงาน: ${formatThaiDate(new Date().toISOString().split('T')[0])} | ร้านค้าทั้งหมด: ${
        establishments.length
      } แห่ง`
    ],
    [
      `สถานะภาพรวม: สมบูรณ์ ๑๐๐% จำนวน ${completeCount} แห่ง (${completenessPercentage}%) | ยังไม่สมบูรณ์ ${incompleteCount} แห่ง`
    ],
    [] // blank row
  ];

  const tableHeaders = [
    'ลำดับ',
    'เลขที่ทะเบียน',
    'ชื่อสถานประกอบการ',
    'ชื่อผู้ประกอบการ',
    'หมู่บ้าน',
    'ประเภท',
    'ช่อง ๑: ชุดลงพื้นที่ ๓ รายการ',
    'ช่อง ๒: ใบเสร็จรับเงิน (RCPT)',
    'ช่อง ๓: สำเนาคู่ฉบับนายกฯ เซ็น',
    'จำนวนเอกสารในแฟ้ม (ไฟล์)',
    'สถานะความสมบูรณ์',
    'เลขที่ใบเสร็จ',
    'ค่าธรรมเนียม (บาท)',
    'หมายเหตุประจำแฟ้ม'
  ];

  const summaryRow = [
    'รวมสรุป',
    `${establishments.length} แห่ง`,
    `สมบูรณ์ ${completeCount} แห่ง (${completenessPercentage}%)`,
    `ค้างส่ง ${incompleteCount} แห่ง`,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'รวมค่าธรรมเนียม:',
    totalFee,
    ''
  ];

  const wsData = [...headerRows, tableHeaders, ...dataRows, summaryRow];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 8 },  // ลำดับ
    { wch: 18 }, // เลขทะเบียน
    { wch: 35 }, // ชื่อร้าน
    { wch: 28 }, // ผู้ขอ
    { wch: 22 }, // หมู่บ้าน
    { wch: 12 }, // ประเภท
    { wch: 28 }, // ช่อง 1
    { wch: 26 }, // ช่อง 2
    { wch: 26 }, // ช่อง 3
    { wch: 22 }, // รวมเอกสาร
    { wch: 22 }, // สถานะ
    { wch: 18 }, // เลขที่ใบเสร็จ
    { wch: 18 }, // ค่าธรรมเนียม
    { wch: 35 }  // หมายเหตุ
  ];

  XLSX.utils.book_append_sheet(wb, ws, `แฟ้มเอกสารปี_${targetYear}`);

  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `รายงานความสมบูรณ์แฟ้มเอกสาร_ปี_${targetYear}_อบต_โป่งน้ำร้อน_${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}

/**
 * ๓. ส่งออกประวัติการดำเนินงานราชการ (Audit Trail Logs) เป็นไฟล์ Excel (.xlsx)
 */
export function exportAuditLogsToExcel(logs: AuditLog[]) {
  const wb = XLSX.utils.book_new();

  const actionLabels: Record<string, string> = {
    create: 'รับคำขอ/สร้างร้านใหม่',
    update: 'แก้ไขข้อมูลสถานประกอบการ',
    delete: 'ลบข้อมูล',
    inspect: 'ตรวจสุขลักษณะสถานที่',
    upload_doc: 'อัปโหลดเอกสารเข้าแฟ้ม',
    delete_doc: 'ลบเอกสารออกจากแฟ้ม',
    print_license: 'พิมพ์ใบอนุญาต/เอกสารราชการ',
    renew_license: 'ต่ออายุใบอนุญาตประจำปี',
    login: 'เข้าสู่ระบบ',
    settings: 'ปรับปรุงการตั้งค่าระบบ'
  };

  const headerRows: (string | number)[][] = [
    ['องค์การบริหารส่วนตำบลโป่งน้ำร้อน อำเภอแม่จัน จังหวัดเชียงราย'],
    ['สมุดบันทึกประวัติการดำเนินงานราชการ (e-Service Audit Trail Logs)'],
    [`วันที่ส่งออกข้อมูล: ${formatThaiDate(new Date().toISOString().split('T')[0])} | จำนวนรายการ: ${logs.length} รายการ`],
    []
  ];

  const tableHeaders = [
    'ลำดับ',
    'วันเวลาที่เกิดรายการ',
    'ประเภทการดำเนินงาน',
    'หัวข้อรายการ',
    'สถานประกอบการ',
    'ผู้ดำเนินการ (เจ้าหน้าที่)',
    'ตำแหน่ง',
    'รายละเอียดการบันทึก'
  ];

  const dataRows = logs.map((log, idx) => {
    let thaiTime = '-';
    try {
      const d = new Date(log.timestamp);
      thaiTime = `${formatThaiDate(log.timestamp)} เวลา ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} น.`;
    } catch {
      thaiTime = log.timestamp;
    }

    return [
      idx + 1,
      thaiTime,
      actionLabels[log.action] || log.action,
      log.actionTitle,
      log.establishmentName || '-',
      log.officerName,
      log.officerRole || '-',
      log.details || '-'
    ];
  });

  const wsData = [...headerRows, tableHeaders, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 8 },  // ลำดับ
    { wch: 30 }, // วันเวลา
    { wch: 24 }, // ประเภท
    { wch: 38 }, // หัวข้อ
    { wch: 35 }, // ร้าน
    { wch: 28 }, // เจ้าหน้าที่
    { wch: 26 }, // ตำแหน่ง
    { wch: 55 }  // รายละเอียด
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Audit_Trail');

  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `ประวัติการดำเนินงาน_AuditLog_อบต_โป่งน้ำร้อน_${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}

