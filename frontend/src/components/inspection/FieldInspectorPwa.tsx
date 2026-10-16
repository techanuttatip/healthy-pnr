import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import type {
  Establishment,
  EstablishmentStatus,
  InspectionChecklistItem,
  InspectionRecord,
  GpsCheckInInfo,
  SystemSettings,
  ArchivedDocument,
  YearDossier
} from '../../types/publicHealth';
import { sanitationDataService, type SignatureRequest } from '../../services/sanitationDataService';
import { showToast, showWarningAlert } from '../../utils/sweetAlert';
import { SignaturePad } from './SignaturePad';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Search,
  Warehouse,
  UtensilsCrossed,
  History,
  QrCode,
  Copy,
  Check,
  X,
  Loader2,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  Plus,
  Home,
  Sparkles
} from 'lucide-react';

interface FieldInspectorPwaProps {
  establishments: Establishment[];
  onSaveEstablishment?: (est: Establishment) => void;
  onExitPwa?: () => void;
  settings?: SystemSettings;
}

// 10 เกณฑ์ตรวจสุขลักษณะสถานที่สะสมอาหารและจำหน่ายอาหารตามระเบียบ อบต.โป่งน้ำร้อน (100 คะแนนเต็ม)
const FOOD_INSPECTION_CRITERIA_BASE: Omit<InspectionChecklistItem, 'passed'>[] = [
  {
    id: 's1',
    dimension: 'มิติที่ 1: โครงสร้างและการจัดวางสินค้า',
    title: 'จัดวางอาหารบนพาเลทหรือชั้นวางสูงจากพื้นอย่างน้อย 15 ซม.',
    description: 'ข้อกำหนดบังคับ: ห้ามวางอาหารติดพื้นโดยตรง และเว้นระยะห่างจากผนัง ≥ 30 ซม.',
    points: 10,
    isCritical: true
  },
  {
    id: 's2',
    dimension: 'มิติที่ 1: โครงสร้างและการจัดวางสินค้า',
    title: 'อาคาร ผนัง เพดาน สะอาด แข็งแรง และระบายอากาศเพียงพอ',
    description: 'ไม่มีรอยแตกร้าว รอยรั่วซึม ไม่มีหยากไย่ และมีระบบระบายอากาศลดความร้อนสะสม',
    points: 10
  },
  {
    id: 's3',
    dimension: 'มิติที่ 1: โครงสร้างและการจัดวางสินค้า',
    title: 'แสงสว่างเพียงพอและหลอดไฟมีฝาครอบป้องกันการแตกกระจาย',
    description: 'ความสว่างเพียงพอต่อการตรวจสอบสภาพอาหาร และมีฝาครอบป้องกันเศษแก้วตกใส่อาหาร',
    points: 10
  },
  {
    id: 's4',
    dimension: 'มิติที่ 2: การควบคุมอุณหภูมิและระบบการเก็บรักษา',
    title: 'ควบคุมอุณหภูมิห้องเย็น/ตู้แช่ตามมาตรฐาน (แช่เย็น < 5°C, แช่แข็ง < -18°C)',
    description: 'ข้อกำหนดบังคับ: มีเทอร์โมมิเตอร์แสดงอุณหภูมิที่เที่ยงตรง และมีบันทึกตรวจเช็กประจำวัน',
    points: 10,
    isCritical: true
  },
  {
    id: 's5',
    dimension: 'มิติที่ 2: การควบคุมอุณหภูมิและระบบการเก็บรักษา',
    title: 'มีระบบหมุนเวียนสินค้า เข้าก่อน-ออกก่อน (FIFO)',
    description: 'มีการติดป้ายระบุวันที่รับเข้าและวันหมดอายุ (Expiry Date) ชัดเจน คัดแยกของเสียทันที',
    points: 10
  },
  {
    id: 's6',
    dimension: 'มิติที่ 2: การควบคุมอุณหภูมิและระบบการเก็บรักษา',
    title: 'ควบคุมความชื้นในคลังอาหารแห้งเพื่อป้องกันเชื้อรา',
    description: 'ห้องเก็บอาหารแห้งและเมล็ดพืชไม่อับชื้น และมีแท่นรองรับน้ำหนักที่มั่นคง',
    points: 10
  },
  {
    id: 's7',
    dimension: 'มิติที่ 3: การป้องกันสารเคมีและสัตว์นำโรค',
    title: 'ห้ามเก็บอาหารรวมกับสารเคมี ยาฆ่าแมลง ปุ๋ย หรือสารทำความสะอาดเด็ดขาด',
    description: 'ข้อกำหนดบังคับ: ต้องแยกห้องหรืออาคารเก็บสารเคมีออกจากพื้นที่เก็บอาหารโดยเด็ดขาด',
    points: 15,
    isCritical: true
  },
  {
    id: 's8',
    dimension: 'มิติที่ 3: การป้องกันสารเคมีและสัตว์นำโรค',
    title: 'มีตะแกรง มุ้งลวด หรือม่านริ้วพลาสติกป้องกันแมลงและสัตว์นำโรค',
    description: 'ข้อกำหนดบังคับ: ประตูหน้าต่างมีมุ้งลวด ไม่พบมูลหนู แมลงสาบ หรือร่องรอยสัตว์รบกวน',
    points: 15,
    isCritical: true
  },
  {
    id: 's9',
    dimension: 'มิติที่ 4: สุขอนามัยผู้ปฏิบัติงานและการจัดการขยะ',
    title: 'ผู้ปฏิบัติงานแต่งกายสะอาด มีสุขนิสัยที่ดี และผ่านการตรวจสุขภาพ',
    description: 'สวมเสื้อผ้าสะอาด สวมหมวกคลุมผม ไม่สูบบุหรี่ในบริเวณคลังสินค้าหรือสถานที่ปรุง',
    points: 10
  },
  {
    id: 's10',
    dimension: 'มิติที่ 4: สุขอนามัยผู้ปฏิบัติงานและการจัดการขยะ',
    title: 'มีถังขยะที่มีฝาปิดมิดชิด มีการคัดแยก และกำจัดสิ่งปฏิกูลตามสุขาภิบาล',
    description: 'ถังขยะมีถุงดำรองรับ ไม่รั่วซึม และไม่มีขยะตกค้างส่งกลิ่นเหม็นรบกวน',
    points: 10
  }
];

export const FieldInspectorPwa: React.FC<FieldInspectorPwaProps> = ({
  establishments,
  onSaveEstablishment,
  onExitPwa,
  settings
}) => {
  const currentOfficer = sanitationDataService.getCurrentOfficer();

  // Navigation tabs tailored to OUR actual system:
  // 'home' (ร้านค้า/งานตรวจ) | 'inspect' (แบบตรวจสุขลักษณะ) | 'new_request' (ลงทะเบียนใหม่) | 'history' (ประวัติการตรวจ)
  type PwaTab = 'home' | 'inspect' | 'new_request' | 'history';
  const [activeTab, setActiveTab] = useState<PwaTab>('home');

  // Selected establishment for active inspection
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(
    establishments[0] || null
  );

  // List filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');

  // Inspection form state (สอ.3)
  const [checklist, setChecklist] = useState<InspectionChecklistItem[]>(() =>
    FOOD_INSPECTION_CRITERIA_BASE.map((item) => ({ ...item, passed: true, defectNote: '' }))
  );
  const [gps, setGps] = useState<GpsCheckInInfo | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [inspectorName] = useState(
    currentOfficer?.name || settings?.signatories?.officerName || 'นางสาวรุ่งทิวา อุปนันท์'
  );
  const [inspectorSig] = useState<string | null>(
    currentOfficer?.signatureUrl || null
  );
  const [ownerSig, setOwnerSig] = useState<string | null>(null);
  const [ownerSignedName, setOwnerSignedName] = useState('');
  const [inspectorNotes, setInspectorNotes] = useState('');
  const [correctionDays, setCorrectionDays] = useState<15 | 30>(15);
  const [isSaving, setIsSaving] = useState(false);

  // Remote QR Signature state
  const [remoteRequest, setRemoteRequest] = useState<SignatureRequest | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // New Request Form state (ลงทะเบียนร้านใหม่หน้างาน)
  const [newStoreForm, setNewStoreForm] = useState({
    businessName: '',
    ownerName: '',
    citizenId: '',
    phone: '',
    village: 'หมู่ที่ 1 บ้านหนองผึ้ง',
    address: '',
    category: 'food_notice' as Establishment['category'],
    foodPlaceType: 'selling' as 'selling' | 'storage' | 'both',
    areaSqm: 45,
    lat: 19.9124,
    lng: 99.1235
  });

  // KPI Counts from OUR real establishments database
  const activeCount = useMemo(() => establishments.filter((e) => e.status === 'active').length, [establishments]);
  const pendingCount = useMemo(() => establishments.filter((e) => e.status === 'pending_inspection').length, [establishments]);
  const correctionCount = useMemo(
    () => establishments.filter((e) => e.status === 'pending_correction' || (e.inspectionScore !== undefined && e.inspectionScore < 80)).length,
    [establishments]
  );

  // Filtered establishments list
  const filteredEstablishments = useMemo(() => {
    return establishments.filter((est) => {
      // Village filter
      if (selectedVillage !== 'all' && est.village !== selectedVillage) {
        return false;
      }

      // Category filter
      if (categoryFilter === 'storage') {
        const isStorage =
          est.foodPlaceType === 'storage' ||
          est.foodPlaceType === 'both' ||
          est.businessName.includes('สะสม') ||
          est.businessName.includes('คลัง') ||
          est.businessName.includes('โกดัง');
        if (!isStorage) return false;
      } else if (categoryFilter === 'selling') {
        const isSelling =
          est.foodPlaceType === 'selling' ||
          est.foodPlaceType === 'both' ||
          est.category === 'food_license' ||
          est.category === 'food_notice';
        if (!isSelling) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          est.businessName.toLowerCase().includes(q) ||
          est.ownerName.toLowerCase().includes(q) ||
          (est.village || '').toLowerCase().includes(q) ||
          (est.regNumber || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [establishments, selectedVillage, categoryFilter, searchQuery]);

  // Score calculations
  const totalScore = useMemo(() => {
    return checklist.reduce((sum, item) => (item.passed ? sum + item.points : sum), 0);
  }, [checklist]);

  const criticalFailed = useMemo(() => {
    return checklist.some((item) => item.isCritical && !item.passed);
  }, [checklist]);

  const isPassed = totalScore >= 80 && !criticalFailed;

  // Toggle checklist item
  const toggleItemPassed = (id: string, passed: boolean) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, passed } : item))
    );
  };

  const updateDefectNote = (id: string, note: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, defectNote: note } : item))
    );
  };

  // GPS Check-in
  const handleCheckInGps = () => {
    if (!navigator.geolocation) {
      showToast('อุปกรณ์ไม่รองรับการระบุพิกัด GPS', 'error');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const info: GpsCheckInInfo = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: new Date().toISOString()
        };
        setGps(info);
        setIsLocating(false);
        showToast(`บันทึกพิกัดตรวจสนามสำเร็จ (ความแม่นยำ ±${info.accuracy} ม.)`, 'success');
      },
      (err) => {
        setIsLocating(false);
        showToast(`ไม่สามารถดึงพิกัด GPS ได้: ${err.message}`, 'error');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Generate QR for remote signature
  const handleGenerateRemoteQr = async () => {
    if (!selectedEstablishment) return;
    setIsGeneratingQr(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const req = await sanitationDataService.createSignatureRequest({
        establishmentId: selectedEstablishment.id,
        establishmentName: selectedEstablishment.businessName,
        inspectionDate: today,
        inspectorName,
        totalScore,
        result: isPassed ? 'passed' : 'needs_correction',
        defectsSummary: checklist.filter((c) => !c.passed).map((c) => c.title)
      });
      setRemoteRequest(req);

      const signUrl = `${window.location.origin}/?signToken=${req.token}`;
      const qrUrl = await QRCode.toDataURL(signUrl, {
        width: 280,
        margin: 2,
        color: { dark: '#0c1a2e', light: '#ffffff' }
      });
      setQrDataUrl(qrUrl);
      showToast('สร้าง QR Code สำหรับเซ็นผ่านมือถือสำเร็จ!', 'success');
    } catch (e) {
      console.error(e);
      showToast('ไม่สามารถสร้าง QR Code ได้', 'error');
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // Poll remote signature
  useEffect(() => {
    if (!remoteRequest || remoteRequest.status === 'signed') return;
    const interval = setInterval(async () => {
      const updated = await sanitationDataService.getSignatureRequest(remoteRequest.token);
      if (updated && updated.status === 'signed' && updated.signatureData) {
        setRemoteRequest(updated);
        setOwnerSig(updated.signatureData);
        if (updated.signerName) setOwnerSignedName(updated.signerName);
        showToast(`ผู้ประกอบการ (${updated.signerName || 'เจ้าของกิจการ'}) ลงลายมือชื่อผ่านมือถือเรียบร้อยแล้ว!`, 'success');
        clearInterval(interval);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [remoteRequest]);

  // Start inspecting a shop
  const handleStartInspection = (est: Establishment) => {
    setSelectedEstablishment(est);
    setChecklist(
      FOOD_INSPECTION_CRITERIA_BASE.map((item) => ({ ...item, passed: true, defectNote: '' }))
    );
    setGps(null);
    setOwnerSig(null);
    setOwnerSignedName(est.ownerName);
    setRemoteRequest(null);
    setQrDataUrl('');
    setActiveTab('inspect');
  };

  // Save inspection result
  const handleSaveInspection = async () => {
    if (!selectedEstablishment) return;
    if (!ownerSig) {
      showWarningAlert('กรุณาให้ผู้ประกอบการลงลายมือชื่อก่อนบันทึกผลการตรวจ');
      return;
    }

    setIsSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const newStatus: EstablishmentStatus = isPassed ? 'awaiting_payment' : 'pending_correction';

    const record: InspectionRecord = {
      id: `insp-${Date.now()}`,
      establishmentId: selectedEstablishment.id,
      inspectionDate: today,
      inspectorName,
      inspectorPosition: currentOfficer?.position || 'นักวิชาการสาธารณสุขปฏิบัติการ',
      totalScore,
      maxScore: 100,
      result: isPassed ? 'passed' : 'needs_correction',
      correctionDays: !isPassed ? correctionDays : undefined,
      defectsSummary: checklist.filter((c) => !c.passed).map((c) => c.title),
      inspectorNotes,
      checklistItems: checklist,
      gpsCheckIn: gps || undefined,
      signatures: {
        inspectorSignature: inspectorSig || undefined,
        inspectorName,
        inspectorSignedAt: today,
        ownerSignature: ownerSig,
        ownerSignedName: ownerSignedName.trim() || selectedEstablishment.ownerName,
        ownerSignedAt: today
      }
    };

    const slipDoc: ArchivedDocument = {
      id: `doc-insp-${Date.now()}`,
      type: 'inspection_slip',
      title: `ผลตรวจประเมินสุขลักษณะสถานที่จริง (${totalScore}/100 คะแนน - ${isPassed ? 'ผ่านเกณฑ์' : 'ต้องปรับปรุง'})`,
      fileName: `inspection_slip_${today}.pdf`,
      uploadedAt: today,
      uploadedBy: inspectorName,
      status: 'verified',
      notes: `ตรวจสุขลักษณะหน้างานผ่าน Mobile PWA โดย ${inspectorName}`
    };

    const targetYear = new Date().getFullYear() + 543;
    let archives = selectedEstablishment.yearlyArchives ? [...selectedEstablishment.yearlyArchives] : [];
    const archIdx = archives.findIndex((a) => a.year === targetYear);
    if (archIdx >= 0) {
      archives[archIdx] = {
        ...archives[archIdx],
        status: isPassed ? 'pending_payment' : 'pending_field_visit',
        inspectionDate: today,
        documents: [
          ...archives[archIdx].documents.filter((d) => d.type !== 'inspection_slip'),
          slipDoc
        ]
      };
    } else {
      const newDossier: YearDossier = {
        year: targetYear,
        status: isPassed ? 'pending_payment' : 'pending_field_visit',
        inspectionDate: today,
        feeAmount: selectedEstablishment.feeAmount || 100,
        documents: [slipDoc]
      };
      archives.push(newDossier);
    }

    const updatedEstablishment: Establishment = {
      ...selectedEstablishment,
      status: newStatus,
      inspectionScore: totalScore,
      inspectionPassed: isPassed,
      inspectionDate: today,
      inspectorName,
      yearlyArchives: archives
    };

    try {
      await sanitationDataService.saveInspectionRecord(record);
      await sanitationDataService.saveEstablishment(updatedEstablishment);
      if (onSaveEstablishment) onSaveEstablishment(updatedEstablishment);
      showToast('บันทึกผลการตรวจสุขลักษณะและแนบเข้าแฟ้มสารบรรณเรียบร้อย!', 'success');
      setActiveTab('home');
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Save new establishment from field survey
  const handleSaveNewStore = async () => {
    if (!newStoreForm.businessName.trim() || !newStoreForm.ownerName.trim()) {
      showWarningAlert('กรุณากรอกชื่อร้านและชื่อผู้ขออนุญาต');
      return;
    }

    const newId = `pnr-field-${Date.now().toString().slice(-4)}`;
    const newEst: Establishment = {
      id: newId,
      docNo: (establishments.length + 1).toString().padStart(4, '0'),
      bookNo: '01',
      regNumber: `นจ-68-${(establishments.length + 1).toString().padStart(4, '0')}`,
      businessName: newStoreForm.businessName,
      ownerName: newStoreForm.ownerName,
      applicantType: 'individual',
      citizenId: newStoreForm.citizenId || '1-5009-00123-45-6',
      phone: newStoreForm.phone || '081-0000000',
      village: newStoreForm.village,
      address: newStoreForm.address || `${newStoreForm.village} ต.โป่งน้ำร้อน อ.ฝาง`,
      category: newStoreForm.category,
      categoryName: newStoreForm.category === 'food_notice' ? 'สถานที่จำหน่ายอาหาร (≤ 200 ตร.ม.)' : 'สถานที่สะสมอาหาร',
      regType: 'นจ',
      foodPlaceType: newStoreForm.foodPlaceType,
      areaSqm: Number(newStoreForm.areaSqm) || 45,
      workerCount: 1,
      annualFeeDue: `${new Date().getFullYear() + 1}-12-31`,
      feeAmount: (Number(newStoreForm.areaSqm) || 45) > 200 ? 3000 : 1000,
      lat: newStoreForm.lat,
      lng: newStoreForm.lng,
      status: 'pending_inspection',
      conditions: ['ปฏิบัติตามมาตรฐานสุขาภิบาลอาหารตาม พ.ร.บ.การสาธารณสุข พ.ศ. 2535'],
      issueDate: new Date().toISOString().split('T')[0],
      expireDate: `${new Date().getFullYear() + 1}-12-31`,
      inspectorName
    };

    try {
      await sanitationDataService.saveEstablishment(newEst);
      if (onSaveEstablishment) onSaveEstablishment(newEst);
      setSelectedEstablishment(newEst);
      showToast('บันทึกร้านใหม่เข้าสู่ระบบ อบต.โป่งน้ำร้อน สำเร็จ!', 'success');
      setActiveTab('inspect');
    } catch (e) {
      console.error(e);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f8f9fc] text-slate-800 flex flex-col font-sans overflow-hidden">
      {/* 1. MODERN PURPLE APP HEADER (ADAPTED STYLING) */}
      <div className="relative bg-gradient-to-b from-[#3b0764] via-[#581c87] to-[#7e22ce] text-white pt-3 pb-6 px-4 shadow-lg shrink-0">
        <div className="max-w-md mx-auto">
          {/* Top Officer Pill and Exit Button */}
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-bold text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>ระบบตรวจสุขลักษณะสนาม (Mobile Paperless)</span>
            </div>

            {onExitPwa && (
              <button
                type="button"
                onClick={onExitPwa}
                className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] text-white font-bold transition-all cursor-pointer flex items-center gap-1 border border-white/20"
                title="กลับสู่ระบบคอมพิวเตอร์"
              >
                <ExternalLink className="w-3 h-3" />
                <span>ระบบหลัก</span>
              </button>
            )}
          </div>

          {/* Title & Officer Name */}
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-white leading-tight">
            อบต.โป่งน้ำร้อน — งานสาธารณสุข
          </h1>
          <p className="text-[11.5px] text-purple-200 mt-0.5 leading-snug">
            ผู้ตรวจ: <strong className="text-white">{inspectorName}</strong> · นักวิชาการสาธารณสุข
          </p>

          {/* 4 Status Counters from OUR Database */}
          <div className="grid grid-cols-4 gap-2 mt-3.5">
            <div
              onClick={() => {
                setActiveTab('home');
                setCategoryFilter('all');
              }}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-2 text-center shadow-sm border border-white/40 cursor-pointer active:scale-95 transition-all"
            >
              <div className="text-lg font-black text-purple-900 font-mono leading-none">
                {pendingCount}
              </div>
              <div className="text-[10px] text-slate-600 font-bold mt-1 truncate">
                รอนัดตรวจ
              </div>
            </div>

            <div
              onClick={() => {
                setActiveTab('home');
                setCategoryFilter('all');
              }}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-2 text-center shadow-sm border border-white/40 cursor-pointer active:scale-95 transition-all"
            >
              <div className="text-lg font-black text-emerald-800 font-mono leading-none">
                {activeCount}
              </div>
              <div className="text-[10px] text-slate-600 font-bold mt-1 truncate">
                มีใบอนุญาต
              </div>
            </div>

            <div
              onClick={() => {
                setActiveTab('home');
                setCategoryFilter('all');
              }}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-2 text-center shadow-sm border border-white/40 cursor-pointer active:scale-95 transition-all"
            >
              <div className="text-lg font-black text-rose-700 font-mono leading-none">
                {correctionCount}
              </div>
              <div className="text-[10px] text-slate-600 font-bold mt-1 truncate">
                สั่งปรับปรุง
              </div>
            </div>

            <div
              onClick={() => {
                setActiveTab('home');
                setCategoryFilter('all');
              }}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-2 text-center shadow-sm border border-white/40 cursor-pointer active:scale-95 transition-all"
            >
              <div className="text-lg font-black text-blue-900 font-mono leading-none">
                {establishments.length}
              </div>
              <div className="text-[10px] text-slate-600 font-bold mt-1 truncate">
                ร้านทั้งหมด
              </div>
            </div>
          </div>
        </div>

        {/* Wavy bottom divider */}
        <div className="absolute -bottom-1 inset-x-0 h-3.5 bg-[#f8f9fc] rounded-t-3xl" />
      </div>

      {/* 2. SCROLLABLE CONTENT BODY */}
      <div className="flex-1 overflow-y-auto pb-24 px-3.5 pt-1.5 max-w-md mx-auto w-full space-y-3.5">
        {/* ========================================================= */}
        {/* TAB 1: HOME / STORE DIRECTORY (งานตรวจและรายชื่อร้าน) */}
        {/* ========================================================= */}
        {activeTab === 'home' && (
          <div className="space-y-3 animate-fadeIn">
            {/* Quick Action Cards: Start Inspection & New Survey */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (selectedEstablishment) {
                    handleStartInspection(selectedEstablishment);
                  } else if (establishments[0]) {
                    handleStartInspection(establishments[0]);
                  }
                }}
                className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-3.5 rounded-2xl shadow-sm text-left flex flex-col justify-between cursor-pointer active:scale-98 transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                  <ClipboardCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-black">ตรวจสุขลักษณะสนาม</div>
                  <div className="text-[10px] text-purple-200 mt-0.5">
                    10 ข้อ สอ.3 + ลายเซ็นดิจิทัล
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('new_request')}
                className="bg-white hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200 shadow-2xs text-left flex flex-col justify-between cursor-pointer active:scale-98 transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">ลงทะเบียนร้านใหม่</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    สำรวจหน้างาน + พิกัด GPS
                  </div>
                </div>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อร้าน, เจ้าของ, ทะเบียนคุม..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl shadow-2xs outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                ทั้งหมด ({establishments.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('storage')}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1 ${
                  categoryFilter === 'storage'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                <Warehouse className="w-3.5 h-3.5" />
                <span>สะสมอาหาร (คลัง/โกดัง)</span>
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('selling')}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1 ${
                  categoryFilter === 'selling'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>จำหน่ายอาหาร</span>
              </button>
            </div>

            {/* Village Selector */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="font-bold text-slate-700">พื้นที่ตำบลโป่งน้ำร้อน:</span>
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
              >
                <option value="all">ทุกหมู่บ้าน (ม.1 - ม.12)</option>
                {[
                  'หมู่ที่ 1 บ้านหนองผึ้ง',
                  'หมู่ที่ 2 บ้านโป่งน้ำร้อน',
                  'หมู่ที่ 3 บ้านหัวฝาย',
                  'หมู่ที่ 4 บ้านสันต้นเปา',
                  'หมู่ที่ 5 บ้านด่านดั่ง',
                  'หมู่ที่ 6 บ้านเปียงกอก',
                  'หมู่ที่ 7 บ้านห้วยจะค่าน',
                  'หมู่ที่ 8 บ้านสันมะกรูด',
                  'หมู่ที่ 9 บ้านหนองขวาง',
                  'หมู่ที่ 10 บ้านป่าบง',
                  'หมู่ที่ 11 บ้านทุ่งหลุก',
                  'หมู่ที่ 12 บ้านโป่งใหม่'
                ].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Establishments List */}
            <div className="space-y-2 pt-1">
              {filteredEstablishments.map((est) => (
                <div
                  key={est.id}
                  onClick={() => handleStartInspection(est)}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-purple-300 active:bg-purple-50/40 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {est.businessName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {est.ownerName} · {est.village}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold shrink-0">
                      {est.regType}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      {est.inspectionScore !== undefined ? (
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded font-bold text-[10px] ${
                            est.inspectionScore >= 80
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {est.inspectionScore >= 80 ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          <span>{est.inspectionScore}/100</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">ยังไม่ตรวจ</span>
                      )}
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 truncate max-w-[140px]">{est.address}</span>
                    </div>

                    <button
                      type="button"
                      className="px-2.5 py-1 bg-purple-600 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                    >
                      <span>ตรวจ</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ACTIVE INSPECTION (แบบตรวจสุขลักษณะ 10 ข้อ สอ.3) */}
        {/* ========================================================= */}
        {activeTab === 'inspect' && selectedEstablishment && (
          <div className="space-y-3.5 animate-fadeIn">
            {/* Active Store Card */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-slate-900 truncate">
                    {selectedEstablishment.businessName}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    ผู้ประกอบการ: {selectedEstablishment.ownerName} · {selectedEstablishment.village}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('home')}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
                  title="เปลี่ยนร้าน"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              {/* GPS Check-in */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleCheckInGps}
                  disabled={isLocating}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    gps
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-purple-50 text-purple-800 border border-purple-300 hover:bg-purple-100'
                  }`}
                >
                  {isLocating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5 text-purple-600" />
                  )}
                  <span>{gps ? `✓ พิกัดบันทึกแล้ว (±${gps.accuracy}ม.)` : 'เช็กอินพิกัด GPS หน้างาน'}</span>
                </button>
              </div>
            </div>

            {/* Score Sticky Banner */}
            <div
              className={`p-3.5 rounded-2xl border text-white shadow-sm flex items-center justify-between ${
                isPassed
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 border-emerald-500'
                  : 'bg-gradient-to-r from-red-600 to-rose-700 border-red-500'
              }`}
            >
              <div>
                <div className="text-[11px] text-emerald-100 font-medium">คะแนนประเมินสุขลักษณะ</div>
                <div className="text-2xl font-black font-mono leading-tight">
                  {totalScore} / 100 คะแนน
                </div>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold shadow-xs">
                  {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  <span>{isPassed ? 'ผ่านเกณฑ์' : 'ต้องแก้ไขปรับปรุง'}</span>
                </div>
              </div>
            </div>

            {/* Checklist Items (10 Items) */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-800 px-1 flex items-center justify-between">
                <span>เกณฑ์มาตรฐานสุขาภิบาลอาหาร ({checklist.length} ข้อ)</span>
                <span className="text-[11px] text-slate-500 font-mono">100 คะแนน</span>
              </div>

              {checklist.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    item.passed
                      ? 'bg-white border-slate-200'
                      : 'bg-red-50/60 border-red-200 ring-1 ring-red-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">
                        {item.dimension}
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">
                        {idx + 1}. {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {item.description}
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-600 px-1.5 py-0.5 rounded bg-slate-100 shrink-0">
                      {item.points} คะแนน
                    </span>
                  </div>

                  {/* Big Touch Buttons: Pass / Fail */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => toggleItemPassed(item.id, true)}
                      className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        item.passed
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>ผ่าน</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleItemPassed(item.id, false)}
                      className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        !item.passed
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      <X className="w-4 h-4" />
                      <span>ไม่ผ่าน</span>
                    </button>
                  </div>

                  {!item.passed && (
                    <div className="mt-2.5 pt-2 border-t border-red-200">
                      <input
                        type="text"
                        value={item.defectNote || ''}
                        onChange={(e) => updateDefectNote(item.id, e.target.value)}
                        placeholder="ระบุข้อบกพร่องที่ต้องปรับปรุง..."
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-red-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* If failed: Correction Days */}
            {!isPassed && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>กำหนดเวลาแก้ไขปรับปรุงตามกฎหมาย</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrectionDays(15)}
                    className={`py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      correctionDays === 15
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white border border-amber-300 text-amber-900'
                    }`}
                  >
                    15 วัน
                  </button>
                  <button
                    type="button"
                    onClick={() => setCorrectionDays(30)}
                    className={`py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      correctionDays === 30
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white border border-amber-300 text-amber-900'
                    }`}
                  >
                    30 วัน
                  </button>
                </div>
              </div>
            )}

            {/* Operator Signature Section */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">ลายมือชื่อผู้ประกอบการ</div>
                  <div className="text-[11px] text-slate-500">เซ็นบนจอมือถือ หรือ ให้สแกน QR</div>
                </div>
                {ownerSig && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    ✓ เซ็นแล้ว
                  </span>
                )}
              </div>

              {/* Signature Pad */}
              <div className="space-y-1.5">
                <SignaturePad
                  label="ลงลายมือชื่อผู้ประกอบการ (ใช้นิ้วเขียนบนหน้าจอ)"
                  signature={ownerSig}
                  onSave={(dataUrl) => setOwnerSig(dataUrl)}
                  signedName={ownerSignedName}
                  onNameChange={setOwnerSignedName}
                  namePlaceholder="ชื่อ-สกุล ผู้ลงนาม"
                  titleRole="ผู้ประกอบการ / ผู้รับผิดชอบสถานที่"
                />
              </div>

              {/* Or Remote QR */}
              <div className="pt-2 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={handleGenerateRemoteQr}
                  disabled={isGeneratingQr}
                  className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-purple-200"
                >
                  <QrCode className="w-3.5 h-3.5 text-purple-600" />
                  <span>สร้าง QR Code ให้ผู้ประกอบการสแกนเซ็นผ่านมือถือตัวเอง</span>
                </button>

                {qrDataUrl && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center">
                    <img src={qrDataUrl} alt="QR Code ลายมือชื่อ" className="w-48 h-48 rounded-xl shadow-sm" />
                    <p className="text-[11px] text-slate-500 mt-2">
                      ให้ผู้ประกอบการเปิดกล้องสแกน QR เพื่อเซ็นบนมือถือตัวเอง
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!remoteRequest) return;
                        const link = `${window.location.origin}/?signToken=${remoteRequest.token}`;
                        navigator.clipboard.writeText(link);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                        showToast('คัดลอกลิงก์เซ็นชื่อแล้ว', 'success');
                      }}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 font-medium cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์ส่งทาง LINE'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Officer Notes */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
              <label className="text-xs font-bold text-slate-800">บันทึกเพิ่มเติมของเจ้าหน้าที่</label>
              <textarea
                value={inspectorNotes}
                onChange={(e) => setInspectorNotes(e.target.value)}
                placeholder="ข้อคิดเห็นหรือคำแนะนำเพิ่มเติม..."
                rows={2}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSaveInspection}
              disabled={isSaving}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
              <span>บันทึกผลการตรวจสุขลักษณะเข้าแฟ้มสารบรรณ</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: NEW STORE REGISTRATION (สำรวจร้านใหม่หน้างาน) */}
        {/* ========================================================= */}
        {activeTab === 'new_request' && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3.5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('home')}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">สำรวจและลงทะเบียนร้านใหม่</h2>
                  <p className="text-[11px] text-slate-500">บันทึกคำขอ พิกัด GPS และสุขาภิบาลหน้างาน</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-lg font-mono">
                แบบ นจ. 1
              </span>
            </div>

            {/* GPS Fetch Banner */}
            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] text-purple-700 font-bold uppercase">พิกัดสถานที่จริง</div>
                <div className="text-xs font-mono font-bold text-slate-900">
                  Lat: {newStoreForm.lat.toFixed(5)}, Lng: {newStoreForm.lng.toFixed(5)}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCheckInGps}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>ดึง GPS ตอนนี้</span>
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อร้าน / สถานประกอบการ *</label>
                <input
                  type="text"
                  value={newStoreForm.businessName}
                  onChange={(e) => setNewStoreForm({ ...newStoreForm, businessName: e.target.value })}
                  placeholder="เช่น สวนอาหารดอยสวย, คลังข้าวสาร อบต."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ชื่อผู้ขออนุญาต *</label>
                  <input
                    type="text"
                    value={newStoreForm.ownerName}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, ownerName: e.target.value })}
                    placeholder="นาย/นาง/นางสาว"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={newStoreForm.phone}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, phone: e.target.value })}
                    placeholder="08X-XXXXXXX"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">เลขประจำตัวประชาชน (13 หลัก)</label>
                <input
                  type="text"
                  value={newStoreForm.citizenId}
                  onChange={(e) => setNewStoreForm({ ...newStoreForm, citizenId: e.target.value })}
                  placeholder="X-XXXX-XXXXX-XX-X"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">หมู่บ้าน (ต.โป่งน้ำร้อน)</label>
                  <select
                    value={newStoreForm.village}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, village: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    {[
                      'หมู่ที่ 1 บ้านหนองผึ้ง',
                      'หมู่ที่ 2 บ้านโป่งน้ำร้อน',
                      'หมู่ที่ 3 บ้านหัวฝาย',
                      'หมู่ที่ 4 บ้านสันต้นเปา',
                      'หมู่ที่ 5 บ้านด่านดั่ง',
                      'หมู่ที่ 6 บ้านเปียงกอก',
                      'หมู่ที่ 7 บ้านห้วยจะค่าน',
                      'หมู่ที่ 8 บ้านสันมะกรูด',
                      'หมู่ที่ 9 บ้านหนองขวาง',
                      'หมู่ที่ 10 บ้านป่าบง',
                      'หมู่ที่ 11 บ้านทุ่งหลุก',
                      'หมู่ที่ 12 บ้านโป่งใหม่'
                    ].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">พื้นที่ใช้สอย (ตร.ม.)</label>
                  <input
                    type="number"
                    value={newStoreForm.areaSqm}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, areaSqm: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ประเภทสถานประกอบการ</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStoreForm({ ...newStoreForm, foodPlaceType: 'selling', category: 'food_notice' })}
                    className={`py-2 px-3 rounded-xl border font-bold text-center cursor-pointer transition-all ${
                      newStoreForm.foodPlaceType === 'selling'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    จำหน่ายอาหาร
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStoreForm({ ...newStoreForm, foodPlaceType: 'storage', category: 'food_notice' })}
                    className={`py-2 px-3 rounded-xl border font-bold text-center cursor-pointer transition-all ${
                      newStoreForm.foodPlaceType === 'storage'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    สะสมอาหาร (คลัง/โกดัง)
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveNewStore}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>บันทึกและเปิดตรวจสุขลักษณะทันที</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: INSPECTION HISTORY (ประวัติการตรวจในระบบ) */}
        {/* ========================================================= */}
        {activeTab === 'history' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">ประวัติงานตรวจสุขลักษณะ</h2>
                <p className="text-[11px] text-slate-500">ผลการตรวจสนามที่บันทึกแล้วในแฟ้มสารบรรณ</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg font-mono">
                {establishments.filter((e) => e.inspectionScore !== undefined).length} ร้าน
              </span>
            </div>

            <div className="space-y-2">
              {establishments
                .filter((e) => e.inspectionScore !== undefined)
                .map((est) => (
                  <div key={est.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-900 truncate">{est.businessName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {est.ownerName} · {est.village}
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          est.inspectionPassed
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        {est.inspectionScore}/100
                      </span>
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>ตรวจเมื่อ: {est.inspectionDate || '-'}</span>
                      <span>ผู้ตรวจ: {est.inspectorName || inspectorName}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. MODERN PURPLE BOTTOM NAVIGATION (STREAMLINED FOR OUR SYSTEM) */}
      <nav className="fixed bottom-0 inset-x-0 bg-[#4a148c] text-white py-2 px-3 flex items-center justify-around shadow-2xl z-50 border-t border-purple-800">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl cursor-pointer transition-all ${
            activeTab === 'home'
              ? 'text-white bg-white/20 font-bold scale-105'
              : 'text-purple-200 hover:text-white'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[10px]">ร้านค้า</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (selectedEstablishment) {
              handleStartInspection(selectedEstablishment);
            } else if (establishments[0]) {
              handleStartInspection(establishments[0]);
            }
          }}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl cursor-pointer transition-all ${
            activeTab === 'inspect'
              ? 'text-white bg-white/20 font-bold scale-105'
              : 'text-purple-200 hover:text-white'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span className="text-[10px]">ตรวจ สอ.3</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('new_request')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl cursor-pointer transition-all ${
            activeTab === 'new_request'
              ? 'text-white bg-white/20 font-bold scale-105'
              : 'text-purple-200 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span className="text-[10px]">ลงทะเบียนใหม่</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl cursor-pointer transition-all ${
            activeTab === 'history'
              ? 'text-white bg-white/20 font-bold scale-105'
              : 'text-purple-200 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span className="text-[10px]">ประวัติ</span>
        </button>

        {onExitPwa && (
          <button
            type="button"
            onClick={onExitPwa}
            className="flex flex-col items-center gap-0.5 px-2.5 py-1 text-amber-300 hover:text-white transition-all cursor-pointer"
            title="สลับไปยังแดชบอร์ดหลัก"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="text-[9px]">ระบบหลัก</span>
          </button>
        )}
      </nav>
    </div>
  );
};
