import React, { useState } from 'react';
import type {
  Establishment,
  YearDossier,
  ArchivedDocument,
  SystemSettings,
  PrintDocumentMode,
  ArchiveDocumentType
} from '../../types/publicHealth';
import { DEFAULT_SYSTEM_SETTINGS } from '../../types/publicHealth';
import { sanitationDataService } from '../../services/sanitationDataService';
import { showConfirmDialog, showToast } from '../../utils/sweetAlert';
import {
  Folder,
  Trash2,
  FolderOpen,
  UploadCloud,
  CheckCircle2,
  Clock,
  Printer,
  Eye,
  Plus,
  Receipt,
  Award,
  Search,
  X,
  FileCheck,
  Calendar,
  Loader2,
  Download,
  ExternalLink,
  AlertTriangle,
  Sparkles,
  FileUp,
  Layers,
  FileSpreadsheet,
  RotateCw,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { FieldRenewalKitModal } from '../inspection/FieldRenewalKitModal';
import { exportDossierReportToExcel } from '../../utils/excelExport';

interface YearlyDocumentArchiveTabProps {
  establishments: Establishment[];
  selectedEstablishment: Establishment | null;
  onSelectEstablishment: (est: Establishment) => void;
  onUpdateEstablishment: (est: Establishment) => void;
  onOpenPrint: (est: Establishment, docMode: PrintDocumentMode) => void;
  settings?: SystemSettings;
}

const toThaiDigits = (num: number | string) =>
  String(num).replace(/[0-9]/g, (digit) => '๐๑๒๓๔๕๖๗๘๙'[parseInt(digit, 10)]);

// คำจำกัดความ ๓ ช่องจัดเก็บเอกสารทางการหลัก (ตามกระบวนการทำงานจริงของ อปท.)
interface OfficialSlotConfig {
  slotNumber: number;
  type: ArchiveDocumentType;
  title: string;
  shortTitle: string;
  badge: string;
  description: string;
  subItems: string[];
  icon: React.ElementType;
  uploadButtonText: string;
  helpHint: string;
}

const OFFICIAL_SLOTS: OfficialSlotConfig[] = [
  {
    slotNumber: 1,
    type: 'field_pack',
    title: 'ชุดเอกสารลงพื้นที่ตรวจสนาม (คำขอ + สำเนาบัตร + ผลตรวจสุขลักษณะ)',
    shortTitle: 'ชุดเอกสารลงพื้นที่ (๑ ไฟล์)',
    badge: 'รวม ๓ รายการใน ๑ ไฟล์ (หน้างาน)',
    description: 'สแกนรวมเป็น ๑ ไฟล์ (PDF หรือรูปภาพ) จากการลงพื้นที่ตรวจจริง ไม่ต้องแยกไฟล์',
    subItems: [
      'แบบคำขอรับ/ต่ออายุใบอนุญาต (ฉบับลงลายมือชื่อผู้ขอรับใบอนุญาต)',
      'สำเนาบัตรประจำตัวประชาชน / ทะเบียนบ้าน (ลงชื่อรับรองสำเนาถูกต้อง)',
      'บันทึกผลการตรวจประเมินสุขลักษณะสถานที่จริง (ลงนามเจ้าหน้าที่และผู้ขอ)'
    ],
    icon: Layers,
    uploadButtonText: '+ อัปโหลดชุดเอกสารลงพื้นที่ (๑ ไฟล์รวม ๓ ฉบับ)',
    helpHint: 'สแกนเอกสารทั้ง ๓ ฉบับรวมเป็น ๑ ไฟล์ (PDF) จากการลงพื้นที่ตรวจหน้างาน'
  },
  {
    slotNumber: 2,
    type: 'receipt',
    title: 'ใบเสร็จรับเงินค่าธรรมเนียมราชการ อปท. (RCPT)',
    shortTitle: 'ใบเสร็จรับเงิน (RCPT)',
    badge: 'ขั้นตอนที่ ๕ (ชำระค่าธรรมเนียม)',
    description: 'ใบเสร็จรับเงินที่กองคลังออกให้เมื่อผู้ประกอบการชำระค่าธรรมเนียมราชการ อบต.โป่งน้ำร้อน เรียบร้อยแล้ว',
    subItems: [
      'สำเนาใบเสร็จรับเงินค่าธรรมเนียมราชการ (ออกโดยกองคลัง อบต.โป่งน้ำร้อน)',
      'ระบุเลขที่ใบเสร็จ (RCPT) และยอดชำระเงินค่าธรรมเนียมถูกต้อง'
    ],
    icon: Receipt,
    uploadButtonText: '+ อัปโหลดไฟล์ใบเสร็จ (สแกน/รูป)',
    helpHint: 'หลักฐานการชำระเงินค่าธรรมเนียมราชการ อบต.โป่งน้ำร้อน'
  },
  {
    slotNumber: 3,
    type: 'license',
    title: 'สำเนาคู่ฉบับใบอนุญาต (ฉบับนายก อบต. ลงนามแล้ว — เก็บสารบรรณ)',
    shortTitle: 'สำเนาคู่ฉบับใบอนุญาต',
    badge: 'ขั้นตอนที่ ๕ (คู่ฉบับสารบรรณ อบต.)',
    description: 'สำเนาคู่ฉบับใบอนุญาต (แบบ อภ.๒ หรือ นจ.๓) ที่นายก อบต. ลงนามและออกเลขสารบรรณแล้ว (ตามที่หน่วยงานราชการต้องมีเก็บไว้)',
    subItems: [
      'สำเนาคู่ฉบับใบอนุญาตตัวจริง (แบบ อภ.๒ หรือ แบบ นจ.๓)',
      'นายก อบต. ลงนามแล้ว พร้อมลงวันที่และออกเลขที่สารบรรณราชการ'
    ],
    icon: Award,
    uploadButtonText: '+ อัปโหลดสำเนาคู่ฉบับ (ฉบับนายกฯ เซ็นแล้ว)',
    helpHint: 'สำเนาคู่ฉบับที่นายก อบต. ลงนามและออกเลขสารบรรณแล้ว (หน่วยงานราชการต้องมีเก็บไว้)'
  }
];

export const YearlyDocumentArchiveTab: React.FC<YearlyDocumentArchiveTabProps> = ({
  establishments,
  selectedEstablishment,
  onSelectEstablishment,
  onUpdateEstablishment,
  onOpenPrint,
  settings
}) => {
  const currentSettings = settings || DEFAULT_SYSTEM_SETTINGS;
  const activeEst = selectedEstablishment || establishments[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [villageFilter, setVillageFilter] = useState('all');
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (activeEst?.yearlyArchives && activeEst.yearlyArchives.length > 0) {
      return activeEst.yearlyArchives[activeEst.yearlyArchives.length - 1].year;
    }
    return 2569;
  });

  // Modal states
  const [isFieldKitModalOpen, setIsFieldKitModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ArchivedDocument | null>(null);
  const [previewRotation, setPreviewRotation] = useState<number>(0);
  const [previewZoom, setPreviewZoom] = useState<number>(1);
  const [isUploadingCustom, setIsUploadingCustom] = useState(false);
  const [uploadingSlotNum, setUploadingSlotNum] = useState<number | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const handleOpenPreview = (doc: ArchivedDocument) => {
    setPreviewRotation(0);
    setPreviewZoom(1);
    setPreviewDoc(doc);
  };

  const handleExportDossierExcel = () => {
    try {
      const fileName = exportDossierReportToExcel(establishments, selectedYear);
      showToast(
        `สร้างรายงานสรุปแฟ้มปี พ.ศ. ${toThaiDigits(selectedYear)} เรียบร้อยแล้ว (${fileName})`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการสร้างไฟล์รายงาน Excel', 'error');
    }
  };

  // Automated License Renewal Handler (Pipeline Automation)
  const handleAutomatedRenewal = async () => {
    if (!activeEst) return;
    const officerName = currentSettings.signatories?.officerName || 'เจ้าหน้าที่สาธารณสุข';

    const isConfirmed = await showConfirmDialog({
      title: `อนุมัติและต่ออายุใบอนุญาตประจำปี พ.ศ. ${toThaiDigits(selectedYear)}?`,
      text: `ระบบจะทำการต่ออายุใบอนุญาตให้แก่ "${activeEst.businessName}" ปรับสถานะเป็นได้รับอนุญาตปกติ (Active) และคำนวณวันสิ้นอายุรอบใหม่ (+๑ ปี) ให้อัตโนมัติ พร้อมบันทึกประวัติราชการ`,
      confirmText: 'ใช่, อนุมัติต่ออายุ (+๑ ปี)',
      cancelText: 'ยกเลิก',
      icon: 'question'
    });
    if (!isConfirmed) return;

    try {
      const updated = await sanitationDataService.renewEstablishmentLicense(
        activeEst.id,
        selectedYear,
        officerName
      );

      if (updated) {
        onUpdateEstablishment(updated);
        showToast(
          `✓ อนุมัติและต่ออายุใบอนุญาตให้ "${updated.businessName}" สำเร็จเรียบร้อยแล้ว`,
          'success'
        );
      }
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการต่ออายุใบอนุญาต', 'error');
    }
  };


  // Quick Action form states: Payment & Receipt
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentReceiptNo, setPaymentReceiptNo] = useState(() => {
    return activeEst?.receiptNo || `RCPT-00602/${String(selectedYear).slice(-2)}`;
  });
  const [paymentAmount, setPaymentAmount] = useState(() => activeEst?.feeAmount || 100);

  // Filtered establishments list
  const filteredList = establishments.filter((est) => {
    if (villageFilter !== 'all' && est.village !== villageFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        est.businessName.toLowerCase().includes(q) ||
        est.ownerName.toLowerCase().includes(q) ||
        est.regNumber.toLowerCase().includes(q) ||
        est.citizenId.includes(q)
      );
    }
    return true;
  });

  // Current year dossier
  const currentArchives = activeEst?.yearlyArchives || [];
  const currentDossier = currentArchives.find((a) => a.year === selectedYear) || {
    year: selectedYear,
    status: 'pending_field_visit',
    documents: [],
    feeAmount: activeEst?.feeAmount || 100
  };

  // Helper function to match document to the 3 standard slots (with backward compatibility)
  const findDocsForSlot = (slotNumber: number): ArchivedDocument[] => {
    const allDocs = currentDossier.documents || [];

    if (slotNumber === 1) {
      // Slot 1: ชุดเอกสารลงพื้นที่ตรวจสนาม (คำขอ + บัตร + ผลตรวจ)
      // Matches single field pack file, or files belonging to application/id_card/inspection_slip
      return allDocs.filter((d) => {
        return (
          d.type === 'field_pack' ||
          d.type === 'application' ||
          d.type === 'id_card' ||
          d.type === 'inspection_slip' ||
          d.title.includes('ชุดเอกสาร') ||
          d.title.includes('ลงพื้นที่') ||
          d.title.includes('คำขอ') ||
          d.title.includes('บัตร') ||
          d.title.includes('ตรวจ') ||
          d.fileName.toLowerCase().includes('field') ||
          d.fileName.toLowerCase().includes('aph1') ||
          d.fileName.toLowerCase().includes('dossier')
        );
      });
    }

    if (slotNumber === 2) {
      // Slot 2: ใบเสร็จรับเงิน อปท. (RCPT)
      return allDocs.filter((d) => {
        return (
          d.type === 'receipt' ||
          d.title.includes('ใบเสร็จ') ||
          d.fileName.toLowerCase().includes('rcpt') ||
          d.fileName.toLowerCase().includes('receipt')
        );
      });
    }

    if (slotNumber === 3) {
      // Slot 3: สำเนาคู่ฉบับใบอนุญาต (ฉบับลงนามแล้ว — เก็บสารบรรณ)
      return allDocs.filter((d) => {
        return (
          d.type === 'license' ||
          d.type === 'license_copy' ||
          d.title.includes('คู่ฉบับ') ||
          d.title.includes('ใบอนุญาต') ||
          d.fileName.toLowerCase().includes('license')
        );
      });
    }

    return [];
  };

  // Calculate completeness for the 3 core official slots
  const slot1Docs = findDocsForSlot(1);
  const slot2Docs = findDocsForSlot(2);
  const slot3Docs = findDocsForSlot(3);

  const hasSlot1 = slot1Docs.length > 0;
  const hasSlot2 = slot2Docs.length > 0;
  const hasSlot3 = slot3Docs.length > 0;

  const fulfilledCount = [hasSlot1, hasSlot2, hasSlot3].filter(Boolean).length;
  const isDossierComplete = fulfilledCount === 3;

  const missingList: string[] = [];
  if (!hasSlot1) missingList.push('ชุดเอกสารลงพื้นที่ตรวจสนาม (คำขอ + สำเนาบัตร + ผลตรวจ)');
  if (!hasSlot2) missingList.push('ใบเสร็จรับเงิน อปท. (RCPT)');
  if (!hasSlot3) missingList.push('สำเนาคู่ฉบับใบอนุญาต (ฉบับนายก อบต. ลงนามแล้ว)');

  // Supplementary documents (not in Slots 1, 2, 3)
  const officialMatchedDocIds = new Set([
    ...slot1Docs.map((d) => d.id),
    ...slot2Docs.map((d) => d.id),
    ...slot3Docs.map((d) => d.id)
  ]);
  const supplementaryDocs = (currentDossier.documents || []).filter(
    (d) => !officialMatchedDocIds.has(d.id)
  );

  const isHazardous = activeEst?.category === 'hazardous' || activeEst?.regType === 'บทส';

  // Add new year dossier folder
  const handleAddNewYearFolder = () => {
    if (!activeEst) return;
    const existingYears = (activeEst.yearlyArchives || []).map((a) => a.year);
    const nextYear = existingYears.length > 0 ? Math.max(...existingYears) + 1 : 2570;

    const newDossier: YearDossier = {
      year: nextYear,
      status: 'pending_field_visit',
      feeAmount: activeEst.feeAmount || 100,
      notes: `รอบต่ออายุ พ.ศ. ${toThaiDigits(nextYear)} เตรียมชุดลงพื้นที่และแบบตรวจสุขลักษณะ`,
      documents: []
    };

    const updatedArchives = [...(activeEst.yearlyArchives || []), newDossier];
    onUpdateEstablishment({
      ...activeEst,
      yearlyArchives: updatedArchives
    });
    setSelectedYear(nextYear);
    showToast(`เปิดแฟ้มรอบปีงบประมาณ พ.ศ. ${toThaiDigits(nextYear)} เรียบร้อยแล้ว`, 'success');
  };

  // Handler to delete an entire year archive
  const handleDeleteYearArchive = async () => {
    if (!activeEst) return;
    const isConfirmed = await showConfirmDialog({
      title: 'ยืนยันการลบแฟ้มเอกสารประจำปี?',
      text: `คุณแน่ใจหรือไม่ว่าต้องการลบแฟ้มเอกสารประจำปี พ.ศ. ${toThaiDigits(selectedYear)} ของ "${activeEst.businessName}"? ข้อมูลเอกสารในแฟ้มรอบปีนี้จะถูกลบทั้งหมด`,
      confirmText: 'ใช่, ลบแฟ้มเอกสาร',
      cancelText: 'ยกเลิก',
      icon: 'warning',
      isDanger: true
    });
    if (!isConfirmed) return;

    await sanitationDataService.deleteYearArchive(activeEst.id, selectedYear);
    const remainingArchives = (activeEst.yearlyArchives || []).filter((a) => a.year !== selectedYear);
    const updatedEst: Establishment = {
      ...activeEst,
      yearlyArchives: remainingArchives
    };
    onUpdateEstablishment(updatedEst);
    if (remainingArchives.length > 0) {
      setSelectedYear(remainingArchives[remainingArchives.length - 1].year);
    }
    showToast(`ลบแฟ้มเอกสารรอบปี พ.ศ. ${toThaiDigits(selectedYear)} เรียบร้อยแล้ว`, 'success');
  };

  // Upload document directly into a designated slot
  const handleUploadSlotDoc = async (
    slot: OfficialSlotConfig,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !activeEst) return;

    setUploadingSlotNum(slot.slotNumber);
    let fileUrl = URL.createObjectURL(file);

    try {
      const cleanDocNo = activeEst.docNo?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'doc';
      const cloudUrl = await sanitationDataService.uploadDocumentFile(
        file,
        cleanDocNo,
        selectedYear,
        slot.type
      );
      if (cloudUrl) {
        fileUrl = cloudUrl;
      }
    } catch (err) {
      console.warn('Storage upload fallback:', err);
    }

    // Custom titles per slot
    let docTitle = `${toThaiDigits(slot.slotNumber)}. ${slot.title}`;
    if (slot.slotNumber === 1) {
      docTitle = `๑. ชุดเอกสารลงพื้นที่ตรวจสนาม (คำขอ + บัตร ปชช. + ผลตรวจ ๓ ฉบับใน ๑ ไฟล์)`;
    } else if (slot.slotNumber === 2) {
      docTitle = `๒. สำเนาใบเสร็จรับเงิน อปท. (RCPT)`;
    } else if (slot.slotNumber === 3) {
      docTitle = `๓. สำเนาคู่ฉบับใบอนุญาต (ฉบับนายก อบต. ลงนามแล้ว — เก็บสารบรรณ)`;
    }

    const newDoc: ArchivedDocument = {
      id: `doc-${slot.type}-${Date.now()}`,
      type: slot.type,
      title: docTitle,
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      uploadedAt: new Date().toISOString().split('T')[0],
      uploadedBy: currentSettings.signatories?.officerName || 'เจ้าหน้าที่สาธารณสุข',
      fileUrl: fileUrl,
      status: 'verified',
      notes:
        slot.slotNumber === 1
          ? `ชุดเอกสารลงพื้นที่ ๓ รายการใน ๑ ไฟล์ (คำขอ + บัตร + ผลตรวจ) รอบปี ${toThaiDigits(selectedYear)}`
          : `แนบเข้าช่องที่ ${toThaiDigits(slot.slotNumber)}: ${slot.shortTitle} (รอบปี ${toThaiDigits(selectedYear)})`
    };

    const currentArchives = activeEst.yearlyArchives || [];
    const existingYearIndex = currentArchives.findIndex((a) => a.year === selectedYear);

    let existingDocs: ArchivedDocument[] = [];
    if (existingYearIndex >= 0) {
      existingDocs = currentArchives[existingYearIndex].documents || [];
    }

    // Remove existing docs of this slot if replacing with new single file
    const filteredDocs = existingDocs.filter((d) => {
      if (slot.slotNumber === 1) {
        return (
          d.type !== 'field_pack' &&
          d.type !== 'application' &&
          d.type !== 'id_card' &&
          d.type !== 'inspection_slip' &&
          !d.title.includes('ชุดเอกสาร') &&
          !d.title.includes('ลงพื้นที่')
        );
      }
      if (slot.slotNumber === 2) {
        return d.type !== 'receipt' && !d.title.includes('ใบเสร็จ');
      }
      if (slot.slotNumber === 3) {
        return (
          d.type !== 'license' &&
          d.type !== 'license_copy' &&
          !d.title.includes('คู่ฉบับ') &&
          !d.title.includes('ใบอนุญาต')
        );
      }
      return d.type !== slot.type;
    });

    const updatedDocs = [...filteredDocs, newDoc];

    // Check completeness: Slot 1 (field pack), Slot 2 (receipt), Slot 3 (license)
    const checkHasSlot1 = updatedDocs.some(
      (d) =>
        d.type === 'field_pack' ||
        d.type === 'application' ||
        d.title.includes('ชุดเอกสาร') ||
        d.title.includes('คำขอ')
    );
    const checkHasSlot2 = updatedDocs.some(
      (d) => d.type === 'receipt' || d.title.includes('ใบเสร็จ')
    );
    const checkHasSlot3 = updatedDocs.some(
      (d) =>
        d.type === 'license' ||
        d.type === 'license_copy' ||
        d.title.includes('คู่ฉบับ') ||
        d.title.includes('ใบอนุญาต')
    );

    const checkAllFulfilled = checkHasSlot1 && checkHasSlot2 && checkHasSlot3;

    const updatedDossier: YearDossier = {
      ...(existingYearIndex >= 0
        ? currentArchives[existingYearIndex]
        : { year: selectedYear, feeAmount: activeEst.feeAmount || 100 }),
      year: selectedYear,
      status: checkAllFulfilled ? 'complete' : 'in_progress',
      documents: updatedDocs,
      notes: checkAllFulfilled
        ? `เอกสารครบถ้วนตามระเบียบราชการ ๑๐๐% (ชุดลงพื้นที่ ๓ รายการ + ใบเสร็จ + สำเนาคู่ฉบับ)`
        : currentArchives[existingYearIndex]?.notes
    };

    let updatedArchives: YearDossier[];
    if (existingYearIndex >= 0) {
      updatedArchives = [...currentArchives];
      updatedArchives[existingYearIndex] = updatedDossier;
    } else {
      updatedArchives = [...currentArchives, updatedDossier];
    }

    const updatedEst: Establishment = {
      ...activeEst,
      status: checkAllFulfilled ? 'active' : activeEst.status,
      yearlyArchives: updatedArchives
    };

    onUpdateEstablishment(updatedEst);
    setUploadingSlotNum(null);

    if (checkAllFulfilled) {
      setUploadNotice(
        `✓ ยอดเยี่ยม! แฟ้มรอบปี พ.ศ. ${toThaiDigits(selectedYear)} ครบถ้วนสมบูรณ์ ๑๐๐% (มีชุดตรวจสนาม ๓ รายการ, ใบเสร็จ, และสำเนาคู่ฉบับครบ)`
      );
      showToast(
        `✓ แฟ้มปี ${toThaiDigits(selectedYear)} เสร็จสมบูรณ์ ๑๐๐% ไม่ขาดเอกสารใด`,
        'success'
      );
    } else {
      setUploadNotice(
        `✓ อัปโหลด "${slot.title}" เข้าช่องที่ ${toThaiDigits(slot.slotNumber)} เรียบร้อยแล้ว`
      );
      showToast(`แนบ "${slot.shortTitle}" สำเร็จ`, 'success');
    }
  };

  // Handler to upload any custom/supplementary document into current dossier
  const handleUploadCustomDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeEst) return;

    setIsUploadingCustom(true);
    let fileUrl = URL.createObjectURL(file);

    try {
      const cleanDocNo = activeEst.docNo?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'doc';
      const cloudUrl = await sanitationDataService.uploadDocumentFile(
        file,
        cleanDocNo,
        selectedYear,
        'other'
      );
      if (cloudUrl) {
        fileUrl = cloudUrl;
      }
    } catch (err) {
      console.warn('Storage upload fallback:', err);
    }

    const newDoc: ArchivedDocument = {
      id: `doc-extra-${Date.now()}`,
      type: 'other',
      title: file.name.replace(/\.[^/.]+$/, ''),
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      uploadedAt: new Date().toISOString().split('T')[0],
      uploadedBy: currentSettings.signatories?.officerName || 'เจ้าหน้าที่สาธารณสุข',
      fileUrl: fileUrl,
      status: 'verified',
      notes: `เอกสารแนบเพิ่มเติม (${file.name}) แฟ้มปี ${selectedYear}`
    };

    const currentArchives = activeEst.yearlyArchives || [];
    const existingYearIndex = currentArchives.findIndex((a) => a.year === selectedYear);
    let updatedArchives: YearDossier[];

    if (existingYearIndex >= 0) {
      const currentDocs = currentArchives[existingYearIndex].documents || [];
      const updatedDossier: YearDossier = {
        ...currentArchives[existingYearIndex],
        documents: [...currentDocs, newDoc]
      };
      updatedArchives = [...currentArchives];
      updatedArchives[existingYearIndex] = updatedDossier;
    } else {
      const newDossier: YearDossier = {
        year: selectedYear,
        status: 'in_progress',
        documents: [newDoc]
      };
      updatedArchives = [...currentArchives, newDossier];
    }

    const updatedEst: Establishment = {
      ...activeEst,
      yearlyArchives: updatedArchives
    };

    onUpdateEstablishment(updatedEst);
    setIsUploadingCustom(false);
    setUploadNotice(`✓ เพิ่มเอกสารแนบ "${file.name}" เข้าแฟ้มเรียบร้อยแล้ว`);
  };

  // Handler to delete a single document from current dossier
  const handleDeleteDoc = async (docId: string, docTitle: string) => {
    if (!activeEst) return;
    const isConfirmed = await showConfirmDialog({
      title: 'ยืนยันการลบเอกสาร?',
      text: `คุณแน่ใจหรือไม่ว่าต้องการลบเอกสาร "${docTitle}" ออกจากแฟ้มปีนี้?`,
      confirmText: 'ใช่, ลบเอกสาร',
      cancelText: 'ยกเลิก',
      icon: 'warning',
      isDanger: true
    });
    if (!isConfirmed) return;

    const currentArchives = activeEst.yearlyArchives || [];
    const existingYearIndex = currentArchives.findIndex((a) => a.year === selectedYear);
    if (existingYearIndex < 0) return;

    const remainingDocs = currentArchives[existingYearIndex].documents.filter(
      (d) => d.id !== docId
    );

    // ตรวจสอบความครบถ้วนของ ๓ ช่องหลักราชการอีกครั้ง
    const hasSlot1 = remainingDocs.some(
      (d) =>
        d.type === 'field_pack' ||
        d.type === 'application' ||
        d.title.includes('ชุดเอกสาร') ||
        d.title.includes('ลงพื้นที่') ||
        d.title.includes('คำขอ')
    );
    const hasSlot2 = remainingDocs.some(
      (d) => d.type === 'receipt' || d.title.includes('ใบเสร็จ')
    );
    const hasSlot3 = remainingDocs.some(
      (d) =>
        d.type === 'license' ||
        d.type === 'license_copy' ||
        d.title.includes('คู่ฉบับ') ||
        d.title.includes('ใบอนุญาต')
    );
    const isAllFulfilled = hasSlot1 && hasSlot2 && hasSlot3;

    const updatedDossier: YearDossier = {
      ...currentArchives[existingYearIndex],
      status: isAllFulfilled ? 'complete' : 'in_progress',
      documents: remainingDocs,
      notes: isAllFulfilled
        ? 'เอกสารครบถ้วนตามระเบียบราชการ ๑๐๐% (ชุดลงพื้นที่ ๓ รายการ + ใบเสร็จ + สำเนาคู่ฉบับ)'
        : 'อยู่ระหว่างรวบรวมเอกสารเข้าแฟ้ม'
    };
    const updatedArchives = [...currentArchives];
    updatedArchives[existingYearIndex] = updatedDossier;

    const updatedEst: Establishment = {
      ...activeEst,
      yearlyArchives: updatedArchives
    };
    onUpdateEstablishment(updatedEst);
    showToast(`ลบเอกสาร "${docTitle}" ออกจากแฟ้มแล้ว`, 'success');
  };

  // Quick action: Save payment & receipt into Slot 2
  const handleSavePayment = () => {
    if (!activeEst) return;
    const existingYearIndex = currentArchives.findIndex((a) => a.year === selectedYear);
    const newReceiptDoc: ArchivedDocument = {
      id: `doc-rcpt-${Date.now()}`,
      type: 'receipt',
      title: `๒. สำเนาใบเสร็จรับเงิน อปท. (เลขที่ ${paymentReceiptNo})`,
      fileName: `receipt_${paymentReceiptNo.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
      fileSize: '0.85 MB',
      uploadedAt: new Date().toISOString().split('T')[0],
      uploadedBy: currentSettings.signatories?.officerName || 'เจ้าหน้าที่การเงิน/สาธารณสุข',
      status: 'verified',
      notes: `ชำระค่าธรรมเนียมเรียบร้อย ยอด ${paymentAmount.toLocaleString()} บาท (เลขที่ ${paymentReceiptNo})`
    };

    let updatedArchives = [...currentArchives];
    let updatedDocs: ArchivedDocument[] = [];

    if (existingYearIndex >= 0) {
      const existingDocs = currentArchives[existingYearIndex].documents.filter(
        (d) => d.type !== 'receipt' && !d.title.includes('ใบเสร็จ')
      );
      updatedDocs = [...existingDocs, newReceiptDoc];

      const checkHasSlot1 = updatedDocs.some(
        (d) =>
          d.type === 'field_pack' ||
          d.type === 'application' ||
          d.title.includes('ชุดเอกสาร') ||
          d.title.includes('คำขอ')
      );
      const checkHasSlot3 = updatedDocs.some(
        (d) =>
          d.type === 'license' ||
          d.type === 'license_copy' ||
          d.title.includes('คู่ฉบับ') ||
          d.title.includes('ใบอนุญาต')
      );
      const checkAllFulfilled = checkHasSlot1 && checkHasSlot3;

      updatedArchives[existingYearIndex] = {
        ...currentArchives[existingYearIndex],
        paymentDate: new Date().toISOString().split('T')[0],
        receiptNo: paymentReceiptNo,
        feeAmount: paymentAmount,
        status: checkAllFulfilled ? 'complete' : 'in_progress',
        documents: updatedDocs
      };
    }

    onUpdateEstablishment({
      ...activeEst,
      receiptNo: paymentReceiptNo,
      receiptDate: new Date().toISOString().split('T')[0],
      yearlyArchives: updatedArchives
    });
    setIsPaymentModalOpen(false);
    showToast(
      `บันทึกใบเสร็จรับเงินเลขที่ ${paymentReceiptNo} เข้าช่องที่ ๒ เรียบร้อยแล้ว`,
      'success'
    );
  };

  return (
    <div className="flex-1 flex h-full bg-transparent overflow-hidden font-sans p-3 md:p-5 gap-4">
      {/* ================= LEFT SIDEBAR: Establishment Switcher ================= */}
      <div className="w-80 shrink-0 gov-card flex flex-col h-full overflow-hidden border border-white/80 shadow-md bg-white/85 backdrop-blur-xl rounded-2xl">
        {/* Search & Filter Header */}
        <div className="p-3.5 border-b border-slate-200/80 bg-white/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-heading">
              <Folder className="w-4 h-4 text-emerald-600" />
              <span>เลือกร้านค้าเพื่อดูแฟ้มประวัติ</span>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              {filteredList.length} แห่ง
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อร้าน, เจ้าของ, เลขคำขอ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200/90 text-xs bg-white/90 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
            />
          </div>

          {/* Village Filter */}
          <select
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200/90 text-xs bg-white/90 text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden cursor-pointer"
          >
            <option value="all">ทุกหมู่บ้าน (๗ หมู่)</option>
            <option value="หมู่ที่ 1 บ้านหนองพนัง">หมู่ที่ ๑ บ้านหนองพนัง</option>
            <option value="หมู่ที่ 2 บ้านดอน">หมู่ที่ ๒ บ้านดอน</option>
            <option value="หมู่ที่ 3 บ้านหัวฝาย">หมู่ที่ ๓ บ้านหัวฝาย</option>
            <option value="หมู่ที่ 4 บ้านท่าหัด">หมู่ที่ ๔ บ้านท่าหัด</option>
            <option value="หมู่ที่ 5 บ้านต้นผึ้ง">หมู่ที่ ๕ บ้านต้นผึ้ง</option>
            <option value="หมู่ที่ 6 บ้านเปียงกอก">หมู่ที่ ๖ บ้านเปียงกอก</option>
            <option value="หมู่ที่ 7 บ้านต้นผึ้งใต้">หมู่ที่ ๗ บ้านต้นผึ้งใต้</option>
          </select>
        </div>

        {/* List of establishments */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
          {filteredList.map((est) => {
            const isSelected = est.id === activeEst?.id;
            const years = (est.yearlyArchives || []).map((y) => y.year);
            const isTargetHazardous = est.category === 'hazardous' || est.regType === 'บทส';

            // Check if latest year dossier is complete (has field pack, receipt, and license)
            const latestDossier = est.yearlyArchives?.[est.yearlyArchives.length - 1];
            const latestDocs = latestDossier?.documents || [];
            const hasLField = latestDocs.some(
              (d) =>
                d.type === 'field_pack' ||
                d.type === 'application' ||
                d.title.includes('ชุดเอกสาร') ||
                d.title.includes('คำขอ')
            );
            const hasLReceipt = latestDocs.some(
              (d) => d.type === 'receipt' || d.title.includes('ใบเสร็จ')
            );
            const hasLLicense = latestDocs.some(
              (d) =>
                d.type === 'license' ||
                d.type === 'license_copy' ||
                d.title.includes('คู่ฉบับ') ||
                d.title.includes('ใบอนุญาต')
            );
            const isLatestComplete = hasLField && hasLReceipt && hasLLicense;

            return (
              <button
                key={est.id}
                type="button"
                onClick={() => {
                  onSelectEstablishment(est);
                  if (est.yearlyArchives && est.yearlyArchives.length > 0) {
                    setSelectedYear(est.yearlyArchives[est.yearlyArchives.length - 1].year);
                  }
                }}
                className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex flex-col gap-1 border ${
                  isSelected
                    ? 'bg-emerald-50/90 border-emerald-400 shadow-2xs font-semibold'
                    : 'border-transparent hover:bg-white/80'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="font-bold text-xs text-slate-900 line-clamp-1">
                    {est.businessName}
                  </span>
                  {isTargetHazardous ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold shrink-0">
                      บทส (อภ.๑)
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-900 font-bold shrink-0">
                      {est.regType}
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-600 flex items-center justify-between">
                  <span>{est.ownerName}</span>
                  <span className="text-slate-400 text-[10px]">
                    {est.village.replace('หมู่ที่ ', 'ม.')}
                  </span>
                </div>

                {/* Years badge pill & Completeness badge */}
                <div className="flex items-center justify-between gap-1 mt-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    <FolderOpen className="w-3 h-3 text-slate-400 shrink-0" />
                    {years.length > 0 ? (
                      years.map((y) => (
                        <span
                          key={y}
                          className="text-[9px] px-1.5 py-0.2 rounded-sm bg-slate-200 text-slate-700 font-mono"
                        >
                          {toThaiDigits(y)}
                        </span>
                      ))
                    ) : (
                      <span className="text-[9px] text-slate-400">ยังไม่มีแฟ้มปี</span>
                    )}
                  </div>

                  {isLatestComplete ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-0.5 shrink-0">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>แฟ้มสมบูรณ์</span>
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200 shrink-0">
                      รอเอกสาร
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= RIGHT MAIN PANEL: Yearly Dossier & Document Slots ================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden space-y-3.5">
        {/* Top Header of Selected Establishment */}
        <div className="gov-card p-4 md:p-5 shrink-0 border border-white/80 shadow-md bg-white/85 backdrop-blur-xl rounded-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                  {activeEst?.businessName}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {activeEst?.categoryName}
                </span>
                {activeEst?.id === 'est-044' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500 text-white font-bold animate-pulse">
                    ★ เอกสารชุดจริงครบถ้วน
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>👤 ผู้ประกอบการ: <b>{activeEst?.ownerName}</b></span>
                <span>🪪 เลข ปชช: <b className="font-mono">{toThaiDigits(activeEst?.citizenId || '')}</b></span>
                <span>📍 ที่อยู่: <b>{activeEst?.address} {activeEst?.village}</b></span>
                <span>📞 โทร: <b className="font-mono">{toThaiDigits(activeEst?.phone || '')}</b></span>
              </div>
            </div>

            {/* Proactive Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleExportDossierExcel}
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
                title={`ส่งออกรายงานความครบถ้วนของแฟ้มเอกสารประจำปี พ.ศ. ${toThaiDigits(selectedYear)} เป็นไฟล์ Excel (.xlsx)`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>รายงานแฟ้มปี {toThaiDigits(selectedYear)} (Excel)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFieldKitModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-600/30 transition-all cursor-pointer active:scale-95"
                title="พิมพ์แบบคำขอ อภ.๑ พร้อมแบบตรวจสุขลักษณะเพื่อนำไปให้เจ้าของร้านเซ็นหน้างาน"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์ชุดลงพื้นที่ต่ออายุ (Pre-filled Kit)</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenPrint(activeEst, isHazardous ? 'hazardous_license' : 'garuda')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
                title="พิมพ์ใบอนุญาตเพื่อเสนอนายก อบต. ลงนาม"
              >
                <Award className="w-4 h-4" />
                <span>พิมพ์ใบอนุญาตเสนอนายกฯ ({isHazardous ? 'แบบ อภ.๒' : 'แบบ นจ.๓'})</span>
              </button>
            </div>
          </div>

          {uploadNotice && (
            <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>{uploadNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setUploadNotice(null)}
                className="text-emerald-100 hover:text-white cursor-pointer px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Year Folders Selector Bar */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200/60 flex-wrap">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-blue-700" />
                <span>แฟ้มประจำปีงบประมาณ พ.ศ.:</span>
              </span>

              {currentArchives.map((dossier) => {
                const isCurrent = dossier.year === selectedYear;
                const dDocs = dossier.documents || [];
                const dHasField = dDocs.some(
                  (d) =>
                    d.type === 'field_pack' ||
                    d.type === 'application' ||
                    d.title.includes('ชุดเอกสาร') ||
                    d.title.includes('คำขอ')
                );
                const dHasReceipt = dDocs.some(
                  (d) => d.type === 'receipt' || d.title.includes('ใบเสร็จ')
                );
                const dHasLicense = dDocs.some(
                  (d) =>
                    d.type === 'license' ||
                    d.type === 'license_copy' ||
                    d.title.includes('คู่ฉบับ') ||
                    d.title.includes('ใบอนุญาต')
                );
                const isComplete = dHasField && dHasReceipt && dHasLicense;
                const count = [dHasField, dHasReceipt, dHasLicense].filter(Boolean).length;

                return (
                  <button
                    key={dossier.year}
                    type="button"
                    onClick={() => setSelectedYear(dossier.year)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border shrink-0 ${
                      isCurrent
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-md shadow-emerald-600/25'
                        : 'bg-white/80 text-slate-700 hover:bg-white border-slate-200/90 backdrop-blur-xs hover:shadow-2xs'
                    }`}
                  >
                    <span>📁 พ.ศ. {toThaiDigits(dossier.year)}</span>
                    {isComplete ? (
                      <span
                        className={`text-[10px] rounded-full px-1.5 py-0.2 ${
                          isCurrent
                            ? 'bg-white/20 text-white font-bold'
                            : 'bg-emerald-100 text-emerald-800 font-bold'
                        }`}
                      >
                        ๓/๓ สมบูรณ์
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] rounded-full px-1.5 py-0.2 ${
                          isCurrent
                            ? 'bg-amber-400 text-slate-900 font-bold'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {toThaiDigits(count)}/๓ ช่อง
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={handleAddNewYearFolder}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/70 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-dashed border-slate-300 flex items-center gap-1 transition-all cursor-pointer shadow-2xs shrink-0"
                title="สร้างแฟ้มประวัติรอบต่ออายุปีถัดไป"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มแฟ้มปีใหม่</span>
              </button>
            </div>

            {/* Delete Year Folder Button */}
            {currentArchives.length > 1 && (
              <button
                type="button"
                onClick={handleDeleteYearArchive}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                title={`ลบแฟ้มเอกสารรอบปี พ.ศ. ${toThaiDigits(selectedYear)}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบแฟ้มปี {toThaiDigits(selectedYear)}</span>
              </button>
            )}
          </div>
        </div>

        {/* ================= FLOW STEPPER & COMPLETENESS TRACKING BAR ================= */}
        <div className="gov-card p-4 shrink-0 border border-white/80 shadow-md bg-white/90 backdrop-blur-xl rounded-2xl space-y-3">
          {/* Header Row: Title & Completeness Status */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="font-bold text-xs sm:text-sm text-slate-900 font-heading">
                ขั้นตอนการปฏิบัติงาน & ตรวจสอบความสมบูรณ์ของแฟ้ม (รอบปี พ.ศ. {toThaiDigits(selectedYear)})
              </div>
            </div>

            {/* Overall Completeness Pill */}
            {isDossierComplete ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>✓ เสร็จสมบูรณ์ ๑๐๐% (ครบถ้วนตามระเบียบราชการ ไม่ขาดอะไร)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-2xs">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>
                  อยู่ระหว่างดำเนินการ (ครบแล้ว {toThaiDigits(fulfilledCount)}/๓ ช่อง — ขาดอีก {toThaiDigits(missingList.length)} รายการ)
                </span>
              </div>
            )}
          </div>

          {/* Missing items warning pills */}
          {!isDossierComplete && missingList.length > 0 && (
            <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-2.5 text-xs text-amber-900 flex flex-wrap items-center gap-2">
              <span className="font-bold flex items-center gap-1 text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>เอกสารที่ยังขาดในแฟ้มรอบปีนี้:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {missingList.map((m, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-md bg-amber-100/90 text-amber-900 border border-amber-300 font-bold text-[11px]"
                  >
                    ⚠️ {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 5-Step Renewal Pipeline Visual Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
            {/* Step 1: Pre-filled Kit */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[11px] text-slate-700">๑. ปริ้น Prefix ร้าน</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                  Pre-filled
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                พิมพ์คำขอ + แบบตรวจสุขลักษณะ ถือลงพื้นที่
              </p>
              <button
                type="button"
                onClick={() => setIsFieldKitModalOpen(true)}
                className="w-full py-1 px-2 rounded-lg bg-white hover:bg-amber-500 hover:text-white text-slate-700 border border-slate-200 hover:border-amber-500 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
              >
                <Printer className="w-3 h-3" />
                <span>พิมพ์ชุดตรวจสนาม</span>
              </button>
            </div>

            {/* Step 2: Field Visit */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[11px] text-slate-700">๒. ลงพื้นที่ตรวจจริง</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">
                  หน้างาน
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                ตรวจสุขลักษณะ ๘๐ คะแนน + ให้ผู้ขอลงนามในคำขอ
              </p>
              <div className="text-[10px] text-slate-600 bg-white p-1 rounded border border-slate-100 text-center font-semibold">
                🛵 ลงตรวจ {activeEst?.village.replace('หมู่ที่ ', 'ม.')}
              </div>
            </div>

            {/* Step 3: Upload Field Scans (1 file bundle) */}
            <div
              className={`p-2.5 rounded-xl border flex flex-col justify-between text-xs transition-colors ${
                hasSlot1
                  ? 'bg-emerald-50/80 border-emerald-300'
                  : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[11px] text-slate-700">๓. อัปโหลดตรวจสนาม</span>
                {hasSlot1 ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-800 font-bold flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>แนบแล้ว</span>
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                    รอสแกน
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                สแกนรวม ๑ ไฟล์ (คำขอ + บัตร + ผลตรวจ)
              </p>
              <div className="text-[10px] text-center font-bold text-slate-600">
                ช่องที่ ๑ ด้านล่าง
              </div>
            </div>

            {/* Step 4: Print License for Mayor Signature */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[11px] text-slate-700">๔. ปริ้นให้นายกฯ เซ็น</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold">
                  เสนอแฟ้ม
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                พิมพ์ใบอนุญาต ({isHazardous ? 'อภ.๒' : 'นจ.๓'}) เสนอนายก อบต.
              </p>
              <button
                type="button"
                onClick={() => onOpenPrint(activeEst, isHazardous ? 'hazardous_license' : 'garuda')}
                className="w-full py-1 px-2 rounded-lg bg-white hover:bg-blue-600 hover:text-white text-slate-700 border border-slate-200 hover:border-blue-600 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
              >
                <Award className="w-3 h-3" />
                <span>พิมพ์ใบอนุญาต</span>
              </button>
            </div>

            {/* Step 5: Upload Receipt & Signed Office Duplicate Copy */}
            <div
              className={`p-2.5 rounded-xl border flex flex-col justify-between text-xs transition-colors ${
                hasSlot2 && hasSlot3
                  ? 'bg-emerald-50/80 border-emerald-300'
                  : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[11px] text-slate-700">๕. ใบเสร็จ & คู่ฉบับ</span>
                {hasSlot2 && hasSlot3 ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-800 font-bold flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>สมบูรณ์</span>
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                    รอจัดเก็บ
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                แนบใบเสร็จ (RCPT) + สำเนาคู่ฉบับนายกฯ เซ็น
              </p>
              <div className="text-[10px] text-center font-bold text-slate-600">
                ช่องที่ ๒ & ๓ ด้านล่าง
              </div>
            </div>
          </div>
        </div>

        {/* ================= RENEWAL PIPELINE AUTOMATION BANNER ================= */}
        {isDossierComplete && (
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-emerald-400/50 flex flex-wrap items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3.5 min-w-[280px]">
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
                <Award className="w-6 h-6 text-amber-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-bold shadow-xs">
                    ★ ต่ออายุอัตโนมัติ (Renewal Automation)
                  </span>
                  <span className="text-xs text-emerald-200 font-semibold">
                    แฟ้มรอบปี พ.ศ. {toThaiDigits(selectedYear)} ครบ ๑๐๐%
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                  เอกสารครบถ้วนตามระเบียบราชการ พร้อมบันทึกอนุมัติต่ออายุใบอนุญาต (+๑ ปี)
                </h3>
                <p className="text-xs text-emerald-100/90 mt-0.5">
                  เมื่อกดอนุมัติ ระบบจะต่ออายุให้อัตโนมัติ ปรับสถานะเป็นปกติ (Active) และบันทึกประวัติราชการ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onOpenPrint(activeEst, isHazardous ? 'hazardous_license' : 'garuda')}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Printer className="w-4 h-4 text-emerald-300" />
                <span>พิมพ์ใบอนุญาตเสนอนายกฯ</span>
              </button>
              <button
                type="button"
                onClick={handleAutomatedRenewal}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-amber-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-950/40 hover:scale-[1.03] active:scale-95 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-900" />
                <span>บันทึกอนุมัติต่ออายุ (+๑ ปี) ทันที</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= 3 OFFICIAL REQUIRED DOSSIER SLOTS ================= */}
        <div className="gov-card flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 border border-white/80 shadow-md bg-white/85 backdrop-blur-xl rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-heading">
                <FolderOpen className="w-4 h-4 text-emerald-600" />
                <span>ช่องจัดเก็บเอกสารทางการ (รอบปี พ.ศ. {toThaiDigits(selectedYear)})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                จัดเก็บชุดเอกสารตรวจสนามรวม ๑ ไฟล์ + ช่องใบเสร็จรับเงิน อปท. + ช่องสำเนาคู่ฉบับใบอนุญาตที่นายก อบต. ลงนามแล้ว
              </p>
            </div>

            {/* Add Extra/Custom Document Button */}
            <label
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all shrink-0 ${
                isUploadingCustom
                  ? 'bg-amber-600 text-white cursor-wait'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs hover:shadow-xs active:scale-95'
              }`}
            >
              {isUploadingCustom ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังอัปโหลด...</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>+ แนบเอกสารเพิ่มเติมอื่นๆ</span>
                </span>
              )}
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={handleUploadCustomDoc}
                disabled={isUploadingCustom}
                className="hidden"
              />
            </label>
          </div>

          {/* 3 Core Slots */}
          <div className="space-y-3.5">
            {OFFICIAL_SLOTS.map((slot) => {
              const currentDocs = findDocsForSlot(slot.slotNumber);
              const isFulfilled = currentDocs.length > 0;
              const isSlotUploading = uploadingSlotNum === slot.slotNumber;

              return (
                <div
                  key={slot.slotNumber}
                  className={`rounded-2xl border transition-all p-4 ${
                    isFulfilled
                      ? 'bg-white/95 border-emerald-300 shadow-xs hover:border-emerald-400'
                      : 'bg-amber-50/40 border-dashed border-amber-300/90 hover:bg-amber-50/70'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    {/* Left: Slot Info & Checklist */}
                    <div className="flex items-start gap-3 flex-1 min-w-[280px]">
                      {/* Slot Number Avatar */}
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border shadow-2xs ${
                          isFulfilled
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {toThaiDigits(slot.slotNumber)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 font-heading">
                            ช่องที่ {toThaiDigits(slot.slotNumber)}: {slot.title}
                          </span>
                          {isFulfilled ? (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>
                                {slot.slotNumber === 1
                                  ? 'อัปโหลดแล้ว (ครอบคลุม ๓ รายการครบ)'
                                  : 'อัปโหลดเรียบร้อย'}
                              </span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>ยังขาดเอกสารช่องนี้</span>
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 font-mono">
                            [{slot.badge}]
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-1">{slot.description}</p>

                        {/* Checklist sub-items breakdown */}
                        <div className="mt-2 grid grid-cols-1 gap-1 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                          <div className="text-[10.5px] font-bold text-slate-600 mb-0.5">
                            {slot.slotNumber === 1
                              ? '📋 รายการเอกสารที่รวมในไฟล์นี้ (อัปโหลด ๑ ไฟล์ ไม่ต้องแยกจากกัน):'
                              : '📋 ข้อกำหนดตามระเบียบงานสารบรรณ:'}
                          </div>
                          {slot.subItems.map((sub, sIdx) => (
                            <div
                              key={sIdx}
                              className="text-xs text-slate-700 flex items-center gap-1.5"
                            >
                              <span className={isFulfilled ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                                {isFulfilled ? '✓' : '•'}
                              </span>
                              <span>{sub}</span>
                            </div>
                          ))}
                        </div>

                        {/* List of uploaded files in this slot */}
                        {isFulfilled && (
                          <div className="mt-2.5 space-y-2">
                            {currentDocs.map((doc) => (
                              <div
                                key={doc.id}
                                className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200 flex flex-wrap items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2">
                                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <div>
                                    <div className="text-xs font-bold text-slate-800">
                                      {doc.title}
                                    </div>
                                    <div className="text-[10px] text-slate-500 flex items-center gap-2 flex-wrap font-mono">
                                      <span>ไฟล์: {doc.fileName}</span>
                                      <span>•</span>
                                      <span>ขนาด: {doc.fileSize || '1.0 MB'}</span>
                                      <span>•</span>
                                      <span>วันที่: {doc.uploadedAt}</span>
                                      <span>•</span>
                                      <span>ผู้บันทึก: {doc.uploadedBy || 'เจ้าหน้าที่'}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {doc.notes && (
                                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hidden sm:inline-block">
                                      📌 {doc.notes}
                                    </span>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleOpenPreview(doc)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                    title="เปิดดูไฟล์ (PDF / รูปภาพ)"
                                  >
                                    <Eye className="w-3 h-3 text-emerald-700" />
                                    <span>ดูไฟล์</span>
                                  </button>

                                  {doc.fileUrl && (
                                    <a
                                      href={doc.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download={doc.fileName}
                                      className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors border border-slate-200"
                                      title="ดาวน์โหลดไฟล์"
                                    >
                                      <Download className="w-3 h-3" />
                                    </a>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDoc(doc.id, doc.title)}
                                    className="p-1 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 transition-colors cursor-pointer"
                                    title="ลบเอกสารนี้"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 flex-wrap self-center sm:self-start">
                      {/* Upload / Replace Button */}
                      <label
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all ${
                          isSlotUploading
                            ? 'bg-amber-600 text-white cursor-wait'
                            : isFulfilled
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 shadow-2xs'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 active:scale-95'
                        }`}
                      >
                        {isSlotUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>กำลังอัปโหลด...</span>
                          </>
                        ) : isFulfilled ? (
                          <>
                            <FileUp className="w-3.5 h-3.5 text-slate-600" />
                            <span>+ อัปโหลดแทนที่ / แนบเพิ่ม</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-4 h-4" />
                            <span>{slot.uploadButtonText}</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          onChange={(e) => handleUploadSlotDoc(slot, e)}
                          disabled={isSlotUploading}
                          className="hidden"
                        />
                      </label>

                      {/* Contextual Shortcut Buttons */}
                      {slot.slotNumber === 1 && (
                        <button
                          type="button"
                          onClick={() => setIsFieldKitModalOpen(true)}
                          className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          title="พิมพ์ชุดตรวจสนามเพื่อนำไปให้ลงชื่อหน้างาน"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-600" />
                          <span>พิมพ์ชุดตรวจสนาม</span>
                        </button>
                      )}

                      {slot.slotNumber === 2 && (
                        <button
                          type="button"
                          onClick={() => setIsPaymentModalOpen(true)}
                          className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          title="ลงบันทึกเลขที่ใบเสร็จรับเงิน อปท."
                        >
                          <Receipt className="w-3.5 h-3.5 text-blue-600" />
                          <span>บันทึกเลขที่ใบเสร็จ</span>
                        </button>
                      )}

                      {slot.slotNumber === 3 && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenPrint(activeEst, isHazardous ? 'hazardous_license' : 'garuda')
                          }
                          className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          title="พิมพ์ใบอนุญาตเพื่อเสนอนายก อบต. ลงนาม"
                        >
                          <Award className="w-3.5 h-3.5 text-purple-600" />
                          <span>พิมพ์เสนอนายกฯ</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Supplementary Attachments List (If any) */}
          {supplementaryDocs.length > 0 && (
            <div className="pt-4 border-t border-slate-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Folder className="w-4 h-4 text-slate-500" />
                <span>เอกสารแนบเพิ่มเติมอื่นๆ ({supplementaryDocs.length} ฉบับ)</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {supplementaryDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-slate-500 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-slate-800">{doc.title}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          ไฟล์: {doc.fileName} ({doc.fileSize || '1.0 MB'}) • วันที่: {doc.uploadedAt}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(doc)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>ดูไฟล์</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc.id, doc.title)}
                        className="p-1 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white cursor-pointer transition-colors"
                        title="ลบเอกสารนี้"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. Field Renewal Kit Modal */}
      {isFieldKitModalOpen && activeEst && (
        <FieldRenewalKitModal
          isOpen={isFieldKitModalOpen}
          onClose={() => setIsFieldKitModalOpen(false)}
          establishment={activeEst}
          settings={currentSettings}
          targetYear={selectedYear}
        />
      )}

      {/* 2. Payment & Receipt Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 font-heading">
                <Receipt className="w-4 h-4 text-blue-600" />
                <span>บันทึกใบเสร็จรับเงิน อปท. (ช่องที่ ๒)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  เลขที่ใบเสร็จรับเงิน (RCPT)
                </label>
                <input
                  type="text"
                  value={paymentReceiptNo}
                  onChange={(e) => setPaymentReceiptNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="เช่น RCPT-00602/69"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  จำนวนเงินค่าธรรมเนียมราชการ (บาท)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-xl text-blue-900 text-[11px] leading-relaxed">
                ℹ️ การบันทึกใบเสร็จจะอัปเดตช่องที่ ๒ (สำเนาใบเสร็จรับเงิน อปท.) ให้โดยอัตโนมัติ สำหรับแฟ้มรอบปี พ.ศ. {toThaiDigits(selectedYear)}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSavePayment}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                บันทึกใบเสร็จรับเงิน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. High-Fidelity In-App Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[96vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-xs sm:text-sm">{previewDoc.title}</span>
                  <div className="text-[10px] text-slate-300">
                    ไฟล์: {previewDoc.fileName} • ขนาด: {previewDoc.fileSize || '1.0 MB'} • ผู้บันทึก:{' '}
                    {previewDoc.uploadedBy || 'เจ้าหน้าที่สาธารณสุข'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Image tools: Rotate and Zoom */}
                {previewDoc.fileUrl && (previewDoc.fileUrl.startsWith('data:image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(previewDoc.fileName || '')) && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPreviewRotation((r) => (r + 90) % 360)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="หมุนภาพ 90 องศา (กรณีสแกนมาแนวตะแคง)"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>หมุนภาพ {previewRotation > 0 ? `(${previewRotation}°)` : ''}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom((z) => Math.min(z + 0.25, 2.5))}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
                      title="ขยายรูปภาพ"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom((z) => Math.max(z - 0.25, 0.5))}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
                      title="ย่อรูปภาพ"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                {previewDoc.fileUrl && (
                  <a
                    href={previewDoc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>เปิดแท็บใหม่ / โหลด</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden p-2 sm:p-4 bg-slate-100 flex flex-col items-center justify-center min-h-[500px]">
              {previewDoc.fileUrl &&
              (previewDoc.fileUrl.endsWith('.pdf') ||
                previewDoc.fileUrl.includes('application/pdf') ||
                previewDoc.fileUrl.includes('/pnr-documents/') ||
                previewDoc.fileName?.toLowerCase().endsWith('.pdf')) ? (
                <iframe
                  src={previewDoc.fileUrl}
                  title={previewDoc.title}
                  className="w-full h-[78vh] rounded-xl border border-slate-300 shadow-sm bg-white"
                />
              ) : previewDoc.fileUrl && (previewDoc.fileUrl.startsWith('data:image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(previewDoc.fileName || '')) ? (
                <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                  <img
                    src={previewDoc.fileUrl}
                    alt={previewDoc.title}
                    style={{
                      transform: `rotate(${previewRotation}deg) scale(${previewZoom})`,
                      transition: 'transform 0.2s ease-in-out'
                    }}
                    className="max-w-full max-h-[76vh] object-contain rounded-lg shadow-md"
                  />
                </div>
              ) : (
                <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200 max-w-lg w-full text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl font-bold">
                    📄
                  </div>
                  <div className="font-bold text-sm text-slate-900">{previewDoc.title}</div>
                  <div className="text-xs text-slate-500 font-mono">
                    ไฟล์: {previewDoc.fileName} • ขนาด: {previewDoc.fileSize || '1.2 MB'}
                  </div>
                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 text-left">
                    <div>📅 วันที่บันทึก: {previewDoc.uploadedAt}</div>
                    <div>👤 บันทึกโดย: {previewDoc.uploadedBy || 'เจ้าหน้าที่ อบต.'}</div>
                    <div>📌 หมายเหตุ: {previewDoc.notes || 'เอกสารในแฟ้มราชการ'}</div>
                  </div>
                  {previewDoc.fileUrl && (
                    <a
                      href={previewDoc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>เปิดดูเอกสารต้นฉบับ</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const toDelete = previewDoc;
                  setPreviewDoc(null);
                  handleDeleteDoc(toDelete.id, toDelete.title);
                }}
                className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-700 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-red-200 hover:border-red-600 shadow-2xs"
                title="ลบเอกสารนี้ออกจากแฟ้ม"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบเอกสารนี้</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
