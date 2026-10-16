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
  Copy,
  Loader2,
  Check,
  X,
  FileCheck,
  ArrowLeft
} from 'lucide-react';

interface FieldInspectionViewProps {
  establishments: Establishment[];
  selectedEstablishment?: Establishment | null;
  onSelectEstablishment?: (est: Establishment) => void;
  onSaveInspection?: (record: InspectionRecord, newStatus: EstablishmentStatus) => void;
  onNavigateToTable?: () => void;
  settings?: SystemSettings;
}

// เกณฑ์ตรวจสถานที่สะสมอาหาร (Food Storage Premises Checklist)
const FOOD_STORAGE_CRITERIA_BASE: Omit<InspectionChecklistItem, 'passed'>[] = [
  {
    id: 's1',
    dimension: 'มิติที่ ๑: โครงสร้างและการจัดวางสินค้า',
    title: 'จัดวางอาหารบนพาเลทหรือชั้นวางสูงจากพื้นอย่างน้อย ๑๕ ซม.',
    description: 'ข้อกำหนดบังคับ: ห้ามวางอาหารติดพื้นโดยตรง และเว้นระยะห่างจากผนัง ≥ 30 ซม.',
    points: 10,
    isCritical: true
  },
  {
    id: 's2',
    dimension: 'มิติที่ ๑: โครงสร้างและการจัดวางสินค้า',
    title: 'อาคารคลัง ผนัง เพดาน สะอาด แข็งแรง และระบายอากาศเพียงพอ',
    description: 'ไม่มีรอยแตกร้าว รอยรั่วซึม ไม่มีหยากไย่ และมีระบบระบายอากาศลดความร้อนสะสม',
    points: 10
  },
  {
    id: 's3',
    dimension: 'มิติที่ ๑: โครงสร้างและการจัดวางสินค้า',
    title: 'แสงสว่างเพียงพอและหลอดไฟมีฝาครอบป้องกันการแตกกระจาย',
    description: 'ความสว่างเพียงพอต่อการตรวจสอบสภาพอาหาร และมีฝาครอบป้องกันเศษแก้วตกใส่อาหาร',
    points: 10
  },
  {
    id: 's4',
    dimension: 'มิติที่ ๒: การควบคุมอุณหภูมิและระบบการเก็บรักษา',
    title: 'ควบคุมอุณหภูมิห้องเย็น/ตู้แช่ตามมาตรฐาน (แช่เย็น < 5°C, แช่แข็ง < -18°C)',
    description: 'ข้อกำหนดบังคับ: มีเทอร์โมมิเตอร์แสดงอุณหภูมิที่เที่ยงตรง และมีบันทึกตรวจเช็กประจำวัน',
    points: 10,
    isCritical: true
  },
  {
    id: 's5',
    dimension: 'มิติที่ ๒: การควบคุมอุณหภูมิและระบบการเก็บรักษา',
    title: 'มีระบบหมุนเวียนสินค้า เข้าก่อน-ออกก่อน (FIFO)',
    description: 'มีการติดป้ายระบุวันที่รับเข้าและวันหมดอายุ (Expiry Date) ชัดเจน คัดแยกของเสียทันที',
    points: 10
  },
  {
    id: 's6',
    dimension: 'มิติที่ ๒: การควบคุมอุณหภูมิและระบบการเก็บรักษา',
    title: 'ควบคุมความชื้นในคลังอาหารแห้งเพื่อป้องกันเชื้อรา',
    description: 'ห้องเก็บอาหารแห้งและเมล็ดพืชไม่อับชื้น และมีแท่นรองรับน้ำหนักที่มั่นคง',
    points: 10
  },
  {
    id: 's7',
    dimension: 'มิติที่ ๓: การป้องกันสารเคมีและสัตว์นำโรค',
    title: 'ห้ามเก็บอาหารรวมกับสารเคมี ยาฆ่าแมลง ปุ๋ย หรือสารทำความสะอาดเด็ดขาด',
    description: 'ข้อกำหนดบังคับ: ต้องแยกห้องหรืออาคารเก็บสารเคมีออกจากพื้นที่เก็บอาหารโดยเด็ดขาด',
    points: 15,
    isCritical: true
  },
  {
    id: 's8',
    dimension: 'มิติที่ ๓: การป้องกันสารเคมีและสัตว์นำโรค',
    title: 'มีตะแกรง มุ้งลวด หรือม่านริ้วพลาสติกป้องกันแมลงและสัตว์นำโรค',
    description: 'ข้อกำหนดบังคับ: ประตูหน้าต่างมีมุ้งลวด ไม่พบมูลหนู แมลงสาบ หรือร่องรอยสัตว์รบกวน',
    points: 15,
    isCritical: true
  },
  {
    id: 's9',
    dimension: 'มิติที่ ๔: สุขอนามัยผู้ปฏิบัติงานและการจัดการขยะ',
    title: 'ผู้ปฏิบัติงานแต่งกายสะอาด มีสุขนิสัยที่ดี และผ่านการตรวจสุขภาพ',
    description: 'สวมเสื้อผ้าสะอาด สวมหมวกคลุมผม ไม่สูบบุหรี่ในบริเวณคลังสินค้า',
    points: 10
  }
];

export const FieldInspectionView: React.FC<FieldInspectionViewProps> = ({
  establishments,
  selectedEstablishment: initialSelected,
  onSelectEstablishment,
  onSaveInspection,
  onNavigateToTable,
  settings
}) => {
  const currentOfficer = sanitationDataService.getCurrentOfficer();

  // Active target establishment
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (initialSelected) return initialSelected.id;
    if (establishments.length > 0) return establishments[0].id;
    return '';
  });

  const targetEst = useMemo(() => {
    return establishments.find((e) => e.id === selectedId) || establishments[0] || null;
  }, [establishments, selectedId]);

  // Inspection Checklist State
  const [checklist, setChecklist] = useState<InspectionChecklistItem[]>(() => {
    return FOOD_STORAGE_CRITERIA_BASE.map((item) => ({
      ...item,
      passed: true,
      defectNote: ''
    }));
  });

  // GPS Check-in State
  const [gps, setGps] = useState<GpsCheckInInfo | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Inspector & Signatures
  const [inspectorName, setInspectorName] = useState<string>(
    currentOfficer?.name || settings?.signatories?.officerName || 'นางสาวรุ่งทิวา อุปนันท์'
  );
  const [inspectorPosition] = useState<string>(
    currentOfficer?.position || settings?.signatories?.officerPosition || 'นักวิชาการสาธารณสุขปฏิบัติการ'
  );
  const [inspectorSig, setInspectorSig] = useState<string | null>(
    currentOfficer?.signatureUrl || null
  );

  // Operator Signature mode: 'on_device' | 'remote_link'
  const [signMode, setSignMode] = useState<'on_device' | 'remote_link'>('on_device');
  const [ownerSig, setOwnerSig] = useState<string | null>(null);
  const [ownerSignedName, setOwnerSignedName] = useState<string>(targetEst?.ownerName || '');

  // Remote QR / Link state
  const [remoteRequest, setRemoteRequest] = useState<SignatureRequest | null>(null);
  const [remoteQrDataUrl, setRemoteQrDataUrl] = useState<string>('');
  const [isCreatingRemote, setIsCreatingRemote] = useState<boolean>(false);
  const [hasCopiedLink, setHasCopiedLink] = useState<boolean>(false);

  // Defect summary and correction days
  const [correctionDays, setCorrectionDays] = useState<15 | 30>(15);
  const [inspectorNotes, setInspectorNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Update owner name default when target changes
  useEffect(() => {
    if (targetEst) {
      setOwnerSignedName(targetEst.ownerName);
    }
  }, [targetEst]);

  // Calculate score and result
  const { totalScore, passedAllCritical, isPassed, defectsSummary } = useMemo(() => {
    let score = 0;
    let critFailed = false;
    const defects: string[] = [];

    checklist.forEach((item) => {
      if (item.passed) {
        score += item.points;
      } else {
        if (item.isCritical) critFailed = true;
        defects.push(item.defectNote ? `${item.title}: ${item.defectNote}` : item.title);
      }
    });

    const passed = score >= 80 && !critFailed;
    return {
      totalScore: score,
      passedAllCritical: !critFailed,
      isPassed: passed,
      defectsSummary: defects
    };
  }, [checklist]);

  // Handle GPS location
  const handleCheckInGps = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGps({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            timestamp: new Date().toISOString(),
            isWithinPremises: true
          });
          setIsLocating(false);
          showToast(`เช็กอิน GPS สำเร็จ (ความแม่นยำ ±${Math.round(pos.coords.accuracy)} ม.)`, 'success');
        },
        () => {
          // Fallback to establishment coords
          setGps({
            lat: targetEst?.lat || 19.9288,
            lng: targetEst?.lng || 99.1685,
            accuracy: 10,
            timestamp: new Date().toISOString(),
            isWithinPremises: true
          });
          setIsLocating(false);
          showToast('ใช้พิกัดตามทะเบียนสถานประกอบการ', 'info');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setGps({
        lat: targetEst?.lat || 19.9288,
        lng: targetEst?.lng || 99.1685,
        accuracy: 10,
        timestamp: new Date().toISOString()
      });
      setIsLocating(false);
    }
  };

  // Toggle item passed/fail
  const toggleItem = (id: string, pass: boolean) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, passed: pass } : item))
    );
  };

  const updateDefectNote = (id: string, note: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, defectNote: note } : item))
    );
  };

  // Generate remote signature link & QR
  const handleCreateRemoteRequest = async () => {
    if (!targetEst) return;
    setIsCreatingRemote(true);
    try {
      const req = await sanitationDataService.createSignatureRequest({
        establishmentId: targetEst.id,
        establishmentName: targetEst.businessName,
        inspectionDate: new Date().toISOString().split('T')[0],
        inspectorName,
        totalScore,
        result: isPassed ? 'passed' : 'needs_correction',
        defectsSummary
      });

      setRemoteRequest(req);

      // Generate local QR code
      const currentOrigin = window.location.origin;
      const signUrl = `${currentOrigin}/?signToken=${req.token}`;
      const qrData = await QRCode.toDataURL(signUrl, { width: 260, margin: 2 });
      setRemoteQrDataUrl(qrData);

      showToast('สร้าง QR Code สำหรับลงนามผ่านมือถือแล้ว', 'success');
    } catch (err) {
      console.error(err);
      showToast('ไม่สามารถสร้าง QR Code ได้', 'error');
    } finally {
      setIsCreatingRemote(false);
    }
  };

  // Polling for remote signature completion
  useEffect(() => {
    if (!remoteRequest || remoteRequest.status === 'signed') return;

    const interval = setInterval(async () => {
      const updated = await sanitationDataService.getSignatureRequest(remoteRequest.token);
      if (updated && updated.status === 'signed' && updated.signatureData) {
        setRemoteRequest(updated);
        setOwnerSig(updated.signatureData);
        if (updated.signerName) setOwnerSignedName(updated.signerName);
        showToast(`ผู้ประกอบการ (${updated.signerName}) ลงนามเรียบร้อยแล้ว!`, 'success');
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [remoteRequest]);

  const getSignLink = () => {
    if (!remoteRequest) return '';
    return `${window.location.origin}/?signToken=${remoteRequest.token}`;
  };

  const handleCopyLink = () => {
    const link = getSignLink();
    if (link) {
      navigator.clipboard.writeText(link);
      setHasCopiedLink(true);
      showToast('คัดลอกลิงก์เรียบร้อยแล้ว ส่งให้ผู้ประกอบการผ่าน LINE ได้ทันที', 'info');
      setTimeout(() => setHasCopiedLink(false), 3000);
    }
  };

  // Save the full inspection
  const handleSaveInspection = async () => {
    if (!targetEst) return;

    if (!ownerSig) {
      showWarningAlert(
        'ยังไม่มีลายมือชื่อผู้ประกอบการ',
        'กรุณาให้ผู้ประกอบการเซ็นบนหน้าจอนี้ หรือสแกน QR Code เพื่อเซ็นผ่านมือถือ'
      );
      return;
    }

    setIsSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const newStatus: EstablishmentStatus = isPassed ? 'awaiting_payment' : 'pending_correction';

    const record: InspectionRecord = {
      id: `insp-${Date.now()}`,
      establishmentId: targetEst.id,
      inspectionDate: today,
      inspectorName,
      inspectorPosition,
      totalScore,
      maxScore: 100,
      result: isPassed ? 'passed' : 'needs_correction',
      correctionDays: !isPassed ? correctionDays : undefined,
      correctionDeadline: !isPassed
        ? new Date(Date.now() + correctionDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : undefined,
      defectsSummary,
      inspectorNotes,
      checklistItems: checklist,
      gpsCheckIn: gps || undefined,
      signatures: {
        inspectorSignature: inspectorSig || undefined,
        inspectorName,
        inspectorSignedAt: today,
        ownerSignature: ownerSig,
        ownerSignedName: ownerSignedName.trim() || targetEst.ownerName,
        ownerSignedAt: today
      }
    };

    // Auto-attach inspection_slip to targetEst's yearly archive
    const slipDoc: ArchivedDocument = {
      id: `doc-insp-${Date.now()}`,
      type: 'inspection_slip',
      title: `ผลตรวจประเมินสุขลักษณะสถานที่จริง (ได้ ${totalScore}/๑๐๐ คะแนน - ${isPassed ? 'ผ่านเกณฑ์' : 'ต้องปรับปรุง'})`,
      fileName: `inspection_slip_${today}.pdf`,
      uploadedAt: today,
      uploadedBy: inspectorName,
      status: 'verified',
      notes: `ตรวจสถานที่จริงโดย ${inspectorName} ลายมือชื่ออิเล็กทรอนิกส์ครบถ้วน`
    };

    const targetYear = new Date().getFullYear() + 543;
    let archives = targetEst.yearlyArchives ? [...targetEst.yearlyArchives] : [];
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
        feeAmount: targetEst.feeAmount || 100,
        documents: [slipDoc]
      };
      archives.push(newDossier);
    }

    const updatedEstablishment: Establishment = {
      ...targetEst,
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
      if (onSaveInspection) onSaveInspection(record, newStatus);
      showToast('บันทึกผลการตรวจและลายมือชื่อเข้าสู่แฟ้มสารบรรณสำเร็จ!', 'success');
      if (onNavigateToTable) onNavigateToTable();
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="ui-page max-w-4xl mx-auto space-y-5">
      {/* 1. Header Bar */}
      <div className="ui-page-header">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="ui-title">ตรวจสุขลักษณะสถานที่สะสมอาหาร (Mobile Paperless)</h1>
              <p className="ui-subtitle">
                ตรวจประเมินหน้างานผ่านมือถือ ให้ผู้ประกอบการเซ็นดิจิทัล ไม่ต้องใช้กระดาษ
              </p>
            </div>
          </div>
        </div>

        {onNavigateToTable && (
          <button
            type="button"
            onClick={onNavigateToTable}
            className="ui-btn ui-btn-secondary ui-btn-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับทะเบียน</span>
          </button>
        )}
      </div>

      {/* 2. Establishment Selector & GPS Check-in Card */}
      <div className="ui-card ui-card-pad space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <label className="ui-label">เลือกสถานประกอบการที่ต้องการตรวจ</label>
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                const est = establishments.find((x) => x.id === e.target.value);
                if (est && onSelectEstablishment) onSelectEstablishment(est);
              }}
              className="ui-input font-bold"
            >
              {establishments.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.businessName} ({est.ownerName} - {est.village})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:self-end">
            <button
              type="button"
              onClick={handleCheckInGps}
              disabled={isLocating}
              className={`ui-btn ${gps ? 'ui-btn-success' : 'ui-btn-primary'} w-full sm:w-auto`}
            >
              {isLocating ? (
                <Loader2 className="animate-spin" />
              ) : (
                <MapPin />
              )}
              <span>{gps ? `✓ เช็กอินแล้ว (±${gps.accuracy}ม.)` : 'เช็กอินพิกัด GPS'}</span>
            </button>
          </div>
        </div>

        {targetEst && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
            <span><strong>เลขทะเบียน:</strong> {targetEst.regNumber}</span>
            <span><strong>เจ้าของ:</strong> {targetEst.ownerName}</span>
            <span><strong>ที่ตั้ง:</strong> {targetEst.address}</span>
          </div>
        )}
      </div>

      {/* 3. Sticky Score Banner */}
      <div className="sticky top-2 z-10 ui-card p-3.5 bg-slate-900 text-white shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-xl sm:text-2xl font-black font-mono tracking-tight">
            {totalScore}
            <span className="text-xs text-slate-400 font-normal"> / 100</span>
          </div>
          <div>
            <div className="text-xs font-semibold flex items-center gap-1.5">
              {isPassed ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> ผ่านเกณฑ์มาตรฐาน
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> ต้องปรับปรุงแก้ไข
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              {!passedAllCritical && '⚠ ไม่ผ่านข้อกำหนดบังคับ'}
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-300">เกณฑ์ผ่าน: ๘๐ คะแนนขึ้นไป</span>
        </div>
      </div>

      {/* 4. Inspection Checklist Items */}
      <div className="space-y-3">
        <h2 className="ui-section-title px-1">
          รายการตรวจสุขลักษณะสถานที่สะสมอาหาร ({checklist.length} ข้อ)
        </h2>

        {checklist.map((item, idx) => (
          <div
            key={item.id}
            className={`ui-card p-4 transition-all ${
              !item.passed ? 'border-amber-300 bg-amber-50/20' : ''
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-400">
                    ข้อที่ {idx + 1}
                  </span>
                  {item.isCritical && (
                    <span className="ui-pill ui-pill-danger text-[10px]">
                      ข้อกำหนดบังคับ
                    </span>
                  )}
                  <span className="text-xs font-mono text-slate-400">
                    ({item.points} คะแนน)
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-900 leading-snug">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Pass / Fail Big Toggle Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => toggleItem(item.id, true)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    item.passed
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>ผ่าน</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleItem(item.id, false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    !item.passed
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <X className="w-4 h-4" />
                  <span>ไม่ผ่าน</span>
                </button>
              </div>
            </div>

            {/* Note input when failed */}
            {!item.passed && (
              <div className="mt-3 pt-3 border-t border-amber-200/80 space-y-2 animate-in fade-in">
                <label className="text-xs font-semibold text-amber-900 block">
                  ระบุข้อบกพร่องที่ตรวจพบ:
                </label>
                <input
                  type="text"
                  value={item.defectNote || ''}
                  onChange={(e) => updateDefectNote(item.id, e.target.value)}
                  placeholder="เช่น ไม่พบตะแกรงมุ้งลวด มีช่องว่างแมลงเข้าได้"
                  className="ui-input text-xs"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 5. Summary & Correction Period */}
      {!isPassed && (
        <div className="ui-card ui-card-pad bg-amber-50/50 border-amber-300 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>คำสั่งให้ดำเนินการปรับปรุงแก้ไข</span>
          </div>

          <div className="text-xs text-amber-950">
            ตรวจพบข้อบกพร่อง {defectsSummary.length} รายการ เจ้าหน้าที่ออกคำสั่งให้ปรับปรุงภายใน:
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="radio"
                name="correction_period"
                checked={correctionDays === 15}
                onChange={() => setCorrectionDays(15)}
                className="w-4 h-4 text-blue-600"
              />
              <span>๑๕ วัน (ข้อบกพร่องทั่วไป)</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="radio"
                name="correction_period"
                checked={correctionDays === 30}
                onChange={() => setCorrectionDays(30)}
                className="w-4 h-4 text-blue-600"
              />
              <span>๓๐ วัน (ต้องปรับปรุงโครงสร้าง/เครื่องมือ)</span>
            </label>
          </div>
        </div>
      )}

      {/* 6. General Remarks */}
      <div className="ui-card ui-card-pad space-y-2">
        <label className="ui-label">หมายเหตุ / คำแนะนำเพิ่มเติมของเจ้าหน้าที่</label>
        <textarea
          value={inspectorNotes}
          onChange={(e) => setInspectorNotes(e.target.value)}
          placeholder="บันทึกข้อสังเกตหน้างาน หรือข้อตกลงร่วมกับผู้ประกอบการ..."
          className="ui-input"
        />
      </div>

      {/* 7. Signatures Section (Dual: On-device OR Remote QR) */}
      <div className="ui-card ui-card-pad space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h3 className="ui-section-title">การลงลายมือชื่อรับทราบผลการตรวจ</h3>
            <p className="ui-hint">
              ให้ผู้ประกอบการเซ็นบนหน้าจอนี้ หรือสแกน QR Code เพื่อเปิดเซ็นในมือถือของผู้ประกอบการเอง
            </p>
          </div>

          <div className="ui-tabs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSignMode('on_device')}
              aria-selected={signMode === 'on_device'}
              className="ui-tab"
            >
              เซ็นบนเครื่องนี้
            </button>
            <button
              type="button"
              onClick={() => {
                setSignMode('remote_link');
                if (!remoteRequest) handleCreateRemoteRequest();
              }}
              aria-selected={signMode === 'remote_link'}
              className="ui-tab"
            >
              สแกน QR / ส่งลิงก์
            </button>
          </div>
        </div>

        {/* Option A: On-Device Signature */}
        {signMode === 'on_device' && (
          <div className="space-y-4">
            <SignaturePad
              label="ลายมือชื่อผู้ประกอบการ / ผู้รับผิดชอบสถานที่"
              signature={ownerSig}
              onSave={(data) => setOwnerSig(data)}
              signedName={ownerSignedName}
              onNameChange={(name) => setOwnerSignedName(name)}
              namePlaceholder="ชื่อ-สกุล ผู้ประกอบการ"
              titleRole="ผู้ประกอบการ / ผู้แทน"
            />
          </div>
        )}

        {/* Option B: Remote QR Code & Link */}
        {signMode === 'remote_link' && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-4">
            {isCreatingRemote ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="text-xs text-slate-500">กำลังสร้าง QR Code...</span>
              </div>
            ) : remoteQrDataUrl ? (
              <div className="space-y-4">
                <div className="inline-block p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <img src={remoteQrDataUrl} alt="QR Code สำหรับลงนาม" className="w-48 h-48 mx-auto" />
                </div>

                <div className="max-w-md mx-auto space-y-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    ให้ผู้ประกอบการสแกน QR Code ด้วยกล้องมือถือ
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    เมื่อผู้ประกอบการเปิดลิงก์ จะเห็นสรุปผลการตรวจและสามารถใช้นิ้วเซ็นได้ทันที เมื่อเซ็นเสร็จระบบจะตรวจจับอัตโนมัติ
                  </p>
                </div>

                {/* Status indicator */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs shadow-2xs">
                  {ownerSig ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ได้รับลายมือชื่อแล้ว ({ownerSignedName})
                    </span>
                  ) : (
                    <span className="text-amber-700 flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" /> รอผู้ประกอบการเซ็นผ่านมือถือ...
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="ui-btn ui-btn-secondary ui-btn-sm"
                  >
                    {hasCopiedLink ? <Check className="text-emerald-600" /> : <Copy />}
                    <span>{hasCopiedLink ? 'คัดลอกลิงก์แล้ว' : 'คัดลอกลิงก์ส่งทาง LINE'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateRemoteRequest}
                    className="ui-btn ui-btn-ghost ui-btn-sm"
                    title="สร้าง QR Code ใหม่"
                  >
                    รีเฟรช
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Inspector's Signature Pad */}
        <div className="pt-2 border-t border-slate-100">
          <SignaturePad
            label="ลายมือชื่อเจ้าหน้าที่ผู้ตรวจสถานที่"
            signature={inspectorSig}
            onSave={(data) => setInspectorSig(data)}
            signedName={inspectorName}
            onNameChange={(name) => setInspectorName(name)}
            titleRole={inspectorPosition}
          />
        </div>
      </div>

      {/* 8. Save & Complete Bar */}
      <div className="ui-actionbar">
        {onNavigateToTable && (
          <button
            type="button"
            onClick={onNavigateToTable}
            className="ui-btn ui-btn-ghost"
          >
            ยกเลิก
          </button>
        )}

        <button
          type="button"
          onClick={handleSaveInspection}
          disabled={isSaving}
          className="ui-btn ui-btn-primary ui-btn-lg"
        >
          {isSaving ? <Loader2 className="animate-spin" /> : <FileCheck />}
          <span>บันทึกผลการตรวจสุขลักษณะ (Paperless)</span>
        </button>
      </div>
    </div>
  );
};
