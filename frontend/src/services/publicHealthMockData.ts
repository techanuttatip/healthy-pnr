import type { Establishment } from '../types/publicHealth';

// ข้อมูลสถานประกอบการจริง กองสาธารณสุขและสิ่งแวดล้อม อบต.โป่งน้ำร้อน
export const INITIAL_ESTABLISHMENTS: Establishment[] = [
  {
    id: 'est-044',
    regNumber: 'บทส-69-0044',
    regType: 'บทส',
    category: 'hazardous',
    categoryName: 'กิจการที่เกี่ยวกับปิโตรเลียม ถ่านหิน สารเคมี (ลำดับที่ ๑๑๐: ปั๊มน้ำมันหยอดเหรียญ)',
    businessName: 'ปั๊มน้ำมันหยอดเหรียญ นายอิทธิพล ขันคำกาศ',
    applicantType: 'individual',
    ownerName: 'นายอิทธิพล ขันคำกาศ',
    citizenId: '1500900146471',
    phone: '088-7694944',
    email: 'itthiphon.oil@gmail.com',
    village: 'หมู่ที่ 7 บ้านต้นผึ้งใต้',
    address: '214 หมู่ที่ 7 ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่',
    areaSqm: 2,
    workerCount: 1,
    lat: 19.9288,
    lng: 99.1685,
    status: 'active',
    issueDate: '2026-09-25',
    expireDate: '2027-09-24',
    annualFeeDue: '2027-09-24',
    feeAmount: 100,
    bookNo: '-',
    docNo: '044/2569',
    receiptBookNo: '-',
    receiptNo: 'RCPT-00602/69',
    receiptDate: '2026-09-25',
    applicationSubmissionDate: '2026-09-11',
    temporarySlipIssuedDate: '2026-09-11',
    inspectionPassed: true,
    inspectorName: 'นางสาวรุ่งทิวา อุปนันท์ (นักวิชาการสาธารณสุขปฏิบัติการ)',
    inspectionDate: '2026-09-11',
    inspectionScore: 95,
    conditions: [
      'ปฏิบัติตามคำแนะนำของเจ้าพนักงานสาธารณสุขและคำสั่งของเจ้าพนักงานท้องถิ่น',
      'หากมีเหตุอื่นใดนอกเหนือกฎระเบียบให้แจ้งเจ้าพนักงานท้องถิ่น'
    ],
    notes: 'เอกสารชุดจริง พ.ศ. ๒๕๖๙ ครบ ๕ รายการ (คำขอ อภ.๑, บัตร ปชช., ผลตรวจ, ใบเสร็จ ๑๐๐ บาท, ใบอนุญาต อภ.๒)',
    yearlyArchives: [
      {
        year: 2568,
        status: 'complete',
        applicationDate: '2025-09-15',
        inspectionDate: '2025-09-15',
        paymentDate: '2025-09-26',
        receiptNo: 'RCPT-00481/68',
        feeAmount: 100,
        licenseNo: '042/2568',
        licenseIssueDate: '2025-09-26',
        licenseExpireDate: '2026-09-24',
        notes: 'ประวัติการต่ออายุประจำปี พ.ศ. ๒๕๖๘ เรียบร้อยครบถ้วน',
        documents: [
          { id: 'doc-68-1', type: 'application', title: '๑. แบบ อภ.๑ คำขอต่ออายุใบอนุญาต (พ.ศ. ๒๕๖๘)', fileName: '01_aph1_request_2568.pdf', fileSize: '1.2 MB', uploadedAt: '2025-09-15', status: 'verified' },
          { id: 'doc-68-2', type: 'id_card', title: '๒. สำเนาบัตรประจำตัวประชาชน นายอิทธิพล ขันคำกาศ', fileName: '02_id_card_itthiphon_2568.pdf', fileSize: '480 KB', uploadedAt: '2025-09-15', status: 'verified' },
          { id: 'doc-68-3', type: 'inspection_slip', title: '๓. แบบตรวจประเมินสุขลักษณะกิจการอันตรายต่อสุขภาพ', fileName: '03_inspection_slip_2568.pdf', fileSize: '850 KB', uploadedAt: '2025-09-15', status: 'verified' },
          { id: 'doc-68-4', type: 'receipt', title: '๔. ใบเสร็จรับเงิน อปท. ค่าธรรมเนียม ๑๐๐ บาท', fileName: '04_rcpt_00481_68.pdf', fileSize: '620 KB', uploadedAt: '2025-09-26', status: 'verified' },
          { id: 'doc-68-5', type: 'license', title: '๕. คู่ฉบับใบอนุญาต แบบ อภ.๒ (เลขที่ ๐๔๒/๒๕๖๘)', fileName: '05_license_aph2_2568.pdf', fileSize: '1.4 MB', uploadedAt: '2025-09-26', status: 'verified' }
        ]
      },
      {
        year: 2569,
        status: 'complete',
        applicationDate: '2026-09-11',
        inspectionDate: '2026-09-11',
        paymentDate: '2026-09-25',
        receiptNo: 'RCPT-00602/69',
        feeAmount: 100,
        licenseNo: '044/2569',
        licenseIssueDate: '2026-09-25',
        licenseExpireDate: '2027-09-24',
        notes: 'ชุดเอกสารตัวจริง ๕ ฉบับ ตามที่แนบมา (แบบ อภ.๑, บัตร ปชช., แบบตรวจ, ใบเสร็จ, คู่ฉบับ อภ.๒)',
        documents: [
          { id: 'doc-69-1', type: 'application', title: '๑. แบบ อภ.๑ คำขอรับ/ต่ออายุใบอนุญาต (เลขที่ ๐๔๔/๒๕๖๙)', fileName: '01_aph1_request_044_2569.pdf', fileSize: '1.4 MB', uploadedAt: '2026-09-11', status: 'verified', notes: 'เจ้าของเซ็นชื่อหน้างาน เขียนที่ อบต.โป่งน้ำร้อน' },
          { id: 'doc-69-2', type: 'id_card', title: '๒. สำเนาบัตรประจำตัวประชาชน นายอิทธิพล ขันคำกาศ', fileName: '02_id_card_itthiphon.pdf', fileSize: '520 KB', uploadedAt: '2026-09-11', status: 'verified', notes: 'เซ็นสำเนาถูกต้อง วันที่ ๑๑ ก.ย. ๒๕๖๙' },
          { id: 'doc-69-3', type: 'inspection_slip', title: '๓. แบบตรวจสอบการประกอบกิจการที่เป็นอันตรายต่อสุขภาพ', fileName: '03_field_inspection_slip_2569.pdf', fileSize: '1.1 MB', uploadedAt: '2026-09-11', status: 'verified', notes: 'เห็นสมควรอนุญาต นวก.สาธารณสุข รุ่งทิวา ผู้ตรวจ' },
          { id: 'doc-69-4', type: 'receipt', title: '๔. สำเนาใบเสร็จรับเงิน อบต. (เลขที่ RCPT-00602/69)', fileName: '04_receipt_rcpt_00602_69.pdf', fileSize: '680 KB', uploadedAt: '2026-09-25', status: 'verified', notes: 'ยอด ๑๐๐.๐๐ บาท บมจ.ธนาคารกรุงไทย สาขาฝาง' },
          { id: 'doc-69-5', type: 'license', title: '๕. คู่ฉบับใบอนุญาต แบบ อภ.๒ (เลขที่ ๐๔๔/๒๕๖๙)', fileName: '05_official_license_aph2_044.pdf', fileSize: '1.6 MB', uploadedAt: '2026-09-25', status: 'verified', notes: 'นายก อบต. ลงนาม ใช้ได้ถึง ๒๔ ก.ย. ๒๕๗๐' }
        ]
      },
      {
        year: 2570,
        status: 'pending_field_visit',
        feeAmount: 100,
        notes: 'รอบต่ออายุ พ.ศ. ๒๕๗๐: รอกด "พิมพ์ชุดลงพื้นที่ (Pre-filled Kit)" เพื่อให้เจ้าหน้าที่นำไปให้เซ็นหน้างาน',
        documents: []
      }
    ]
  }
];
