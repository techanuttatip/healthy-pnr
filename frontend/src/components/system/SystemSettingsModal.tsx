import React, { useState } from 'react';
import type { SystemSettings, Establishment } from '../../types/publicHealth';
import { DEFAULT_SYSTEM_SETTINGS } from '../../types/publicHealth';
import { sanitationDataService } from '../../services/sanitationDataService';
import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmDialog,
  showToast
} from '../../utils/sweetAlert';
import {
  X,
  Save,
  RotateCcw,
  Building2,
  PenTool,
  Coins,
  ShieldCheck,
  Database,
  Download,
  Upload,
  Phone,
  Mail,
  Globe,
  Calendar,
  MapPin,
  UserCheck,
  User,
  Sparkles,
  Layers,
  Store,
  Factory
} from 'lucide-react';

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onSaveSettings: (settings: SystemSettings) => void;
  establishments?: Establishment[];
  onImportEstablishments?: (data: Establishment[]) => void;
  onOpenProfile?: () => void;
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  establishments = [],
  onImportEstablishments,
  onOpenProfile
}) => {
  const [activeTab, setActiveTab] = useState<'org' | 'signatories' | 'fees' | 'inspection' | 'data'>('org');
  const [formData, setFormData] = useState<SystemSettings>(settings);
  const currentOfficer = sanitationDataService.getCurrentOfficer();

  // Sync when opened or settings change
  React.useEffect(() => {
    if (isOpen) {
      setFormData(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  // Handle Save with SweetAlert2
  const handleSave = () => {
    onSaveSettings(formData);
    showSuccessAlert(
      'บันทึกการตั้งค่าสำเร็จ!',
      'ข้อมูลองค์กร ผู้มีอำนาจลงนาม และอัตราค่าธรรมเนียมได้รับการอัปเดตและมีผลทั่วทั้งระบบเรียบร้อยแล้ว'
    );
  };

  // Handle Reset to Default with SweetAlert2 Confirmation
  const handleResetToDefault = async () => {
    const isConfirmed = await showConfirmDialog({
      title: 'ยืนยันการคืนค่าเริ่มต้น?',
      text: 'คุณต้องการคืนค่าการตั้งค่าทั้งหมดกลับสู่ค่ามาตรฐานของ อบต.โป่งน้ำร้อน ใช่หรือไม่? ข้อมูลที่แก้ไขไว้จะถูกแทนที่ด้วยค่าตั้งต้น',
      confirmText: 'ใช่, คืนค่าเริ่มต้น',
      cancelText: 'ยกเลิก',
      icon: 'warning',
      isDanger: true
    });

    if (isConfirmed) {
      setFormData(DEFAULT_SYSTEM_SETTINGS);
      onSaveSettings(DEFAULT_SYSTEM_SETTINGS);
      showSuccessAlert('คืนค่าเริ่มต้นเรียบร้อย', 'ระบบได้นำการตั้งค่ามาตรฐานของ อบต.โป่งน้ำร้อน กลับมาใช้งานแล้ว');
    }
  };

  // Export database as JSON file with SweetAlert toast
  const handleExportBackup = () => {
    try {
      const backupData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        organization: formData.organizationName,
        settings: formData,
        establishmentsCount: establishments.length,
        establishments: establishments
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `pnr_health_backup_${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('ส่งออกไฟล์สำรองข้อมูล (.json) เรียบร้อยแล้ว', 'success');
    } catch (err) {
      showErrorAlert('เกิดข้อผิดพลาดในการสำรองข้อมูล', 'กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Import JSON file with SweetAlert confirmation & feedback
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isConfirmed = await showConfirmDialog({
      title: 'ยืนยันการนำเข้าไฟล์สำรอง?',
      text: `คุณต้องการนำเข้าข้อมูลจากไฟล์ "${file.name}" ใช่หรือไม่? ข้อมูลการตั้งค่าและรายการสถานประกอบการจะถูกอัปเดตตามไฟล์นี้`,
      confirmText: 'ยืนยันนำเข้า',
      cancelText: 'ยกเลิก',
      icon: 'question'
    });

    if (!isConfirmed) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.settings) {
          setFormData(json.settings);
          onSaveSettings(json.settings);
        }
        if (Array.isArray(json.establishments) && onImportEstablishments) {
          onImportEstablishments(json.establishments);
        }
        showSuccessAlert(
          'นำเข้าข้อมูลสำเร็จ!',
          `พบสถานประกอบการจำนวน ${json.establishments?.length || 0} แห่ง และอัปเดตค่าตั้งค่าระบบเรียบร้อยแล้ว`
        );
      } catch (err) {
        showErrorAlert('ไฟล์ไม่ถูกต้อง', 'ไม่สามารถอ่านโครงสร้างไฟล์ JSON ได้ กรุณาตรวจสอบไฟล์สำรองข้อมูล');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm font-sans animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* ================= 1. MODAL HEADER (EMERALD GOV THEME) ================= */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white flex items-center justify-between shrink-0 shadow-sm relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 pointer-events-none flex items-center justify-end pr-6">
            <img src="/pnr_logo.png" alt="" className="h-32 object-contain" />
          </div>

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-inner overflow-hidden p-1">
              <img src="/pnr_logo.png" alt="ตรา อบต." className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-bold text-base sm:text-lg flex items-center gap-2 font-heading tracking-tight">
                <span>ตั้งค่าระบบงานสุขาภิบาลและใบอนุญาต</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-100 border border-white/25 font-mono font-medium">
                  {formData.fiscalYear ? `ปีงบประมาณ ${formData.fiscalYear}` : 'พ.ร.บ.สาธารณสุข'}
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium">
                {formData.organizationName} • {formData.departmentName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="relative z-10 p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
            aria-label="ปิดหน้าต่างตั้งค่า"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= USER IDENTITY STRIP ================= */}
        {currentOfficer && (
          <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-2.5 flex items-center justify-between text-xs shrink-0 flex-wrap gap-2">
            <div className="flex items-center gap-2 text-slate-700 flex-wrap">
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-500">บัญชีผู้ปฏิบัติงานขณะนี้:</span>
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                {currentOfficer.name} ({currentOfficer.position})
              </span>
              <span className="text-[11px] text-slate-400">
                • การตั้งค่าที่บันทึกจะซิงค์ไปยังเอกสารราชการและทะเบียนคุมทุกฉบับ
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onOpenProfile && (
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition-all shadow-2xs cursor-pointer active:scale-95"
                  title="เปิดหน้าต่างข้อมูลประจำตัวเจ้าหน้าที่และลายมือชื่อ"
                >
                  <User className="w-3 h-3" />
                  <span>ข้อมูลผู้ปฏิบัติงาน & ลายมือชื่อ</span>
                </button>
              )}
              <span className="text-[10px] font-mono text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs font-bold">
                รหัส: {currentOfficer.officerCode}
              </span>
            </div>
          </div>
        )}

        {/* ================= 2. NAVIGATION PILL TABS ================= */}
        <div className="flex items-center bg-slate-100/90 border-b border-slate-200/80 px-6 py-2 gap-1.5 overflow-x-auto text-xs shrink-0 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('org')}
            className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'org'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>๑. ข้อมูล อปท. / องค์กร</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('signatories')}
            className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'signatories'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>๒. ผู้มีอำนาจลงนาม</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fees')}
            className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'fees'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>๓. อัตราค่าธรรมเนียม</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inspection')}
            className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'inspection'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>๔. เกณฑ์สุขลักษณะ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'data'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>๕. สำรอง & กู้คืนข้อมูล</span>
          </button>
        </div>

        {/* ================= 3. TAB CONTENTS (SCROLLABLE) ================= */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/60 text-xs">
          
          {/* ----------------- TAB 1: ORGANIZATION PROFILE ----------------- */}
          {activeTab === 'org' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="p-4 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl text-emerald-950 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <div className="font-bold text-sm text-emerald-900 mb-0.5">ส่วนหัวและข้อมูลทางการของ อปท.</div>
                  ข้อมูลนี้จะถูกนำไปใช้อัตโนมัติในส่วนหัวเอกสารราชการ, ใบเสร็จรับเงิน, ใบอนุญาตตราครุฑ (อภ.๒, นจ.๓, บทอ.) และตรายางประทับ อปท.
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="font-bold text-sm text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>ข้อมูลหน่วยงานและสถานที่ตั้ง</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      ชื่อองค์กรปกครองส่วนท้องถิ่น <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.organizationName}
                      onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
                      placeholder="เช่น องค์การบริหารส่วนตำบลโป่งน้ำร้อน"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      สำนักงาน / กองที่รับผิดชอบ
                    </label>
                    <input
                      type="text"
                      value={formData.departmentName}
                      onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
                      placeholder="เช่น กองสาธารณสุขและสิ่งแวดล้อม"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      อำเภอ
                    </label>
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
                      placeholder="เช่น อำเภอฝาง"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      จังหวัด
                    </label>
                    <input
                      type="text"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
                      placeholder="เช่น จังหวัดเชียงใหม่"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      ปีงบประมาณปัจจุบัน (พ.ศ.)
                    </label>
                    <input
                      type="text"
                      value={formData.fiscalYear}
                      onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
                      placeholder="เช่น ๒๕๖๙ หรือ 2569"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      หมายเลขโทรศัพท์ติดต่อ อบต.
                    </label>
                    <input
                      type="text"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
                      placeholder="เช่น 053-810317"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                      อีเมลติดต่อราชการ
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
                      placeholder="health@pongnamron.go.th"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-600" />
                      เว็บไซต์หน่วยงาน
                    </label>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
                      placeholder="www.pongnamron.go.th"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TAB 2: SIGNATORIES & OFFICIAL AUTHORITY ----------------- */}
          {activeTab === 'signatories' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="p-4 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl text-emerald-950 flex items-start gap-3">
                <PenTool className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <div className="font-bold text-sm text-emerald-900 mb-0.5">ผู้มีอำนาจลงนามและเจ้าหน้าที่ผู้ปฏิบัติงาน</div>
                  กำหนดชื่อและตำแหน่งที่ปรากฏในช่องลงนามของใบอนุญาตตราครุฑ, ใบรับรอง, ทะเบียนคุมสารบรรณ และรายงานสรุปประจำปี
                </div>
              </div>

              {/* 1. นายก อบต. */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="font-bold text-xs text-slate-900 flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span className="text-sm font-bold text-slate-800">๑. เจ้าพนักงานท้องถิ่น (ผู้อนุมัติและลงนามใบอนุญาตตราครุฑ)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    ผู้บริหารสูงสุด
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">ชื่อ-นามสกุล</label>
                    <input
                      type="text"
                      value={formData.signatories.mayorName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: { ...formData.signatories, mayorName: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">ตำแหน่งทางการบริหาร</label>
                    <input
                      type="text"
                      value={formData.signatories.mayorPosition}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: { ...formData.signatories, mayorPosition: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">ตำแหน่งตามกฎหมายสาธารณสุข</label>
                    <input
                      type="text"
                      value={formData.signatories.mayorRoleTitle}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: { ...formData.signatories, mayorRoleTitle: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. ผู้อำนวยการกองสาธารณสุข */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="font-bold text-xs text-slate-900 flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                    <span className="text-sm font-bold text-slate-800">๒. ผู้อำนวยการกองสาธารณสุขและสิ่งแวดล้อม (ผู้รับรองรายงาน)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-bold border border-teal-200">
                    หัวหน้าส่วนราชการ
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">ชื่อ-นามสกุล</label>
                    <input
                      type="text"
                      value={formData.signatories.healthDirectorName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: { ...formData.signatories, healthDirectorName: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">ตำแหน่ง</label>
                    <input
                      type="text"
                      value={formData.signatories.healthDirectorPosition}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: { ...formData.signatories, healthDirectorPosition: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. หัวหน้าฝ่ายบริการสาธารณสุข */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="font-bold text-xs text-slate-900 flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span className="text-sm font-bold text-slate-800">๓. หัวหน้าฝ่ายบริการสาธารณสุข (ผู้ตรวจสอบสารบรรณ)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
                    ผู้ตรวจกลั่นกรอง
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">ชื่อ-นามสกุล</label>
                    <input
                      type="text"
                      value={formData.signatories.healthChiefName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: { ...formData.signatories, healthChiefName: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">ตำแหน่ง</label>
                    <input
                      type="text"
                      value={formData.signatories.healthChiefPosition}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: { ...formData.signatories, healthChiefPosition: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 4. เจ้าพนักงานสาธารณสุขผู้ปฏิบัติงาน */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="font-bold text-xs text-slate-900 flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span className="text-sm font-bold text-slate-800">๔. เจ้าพนักงานสาธารณสุขผู้รับคำขอ / ผู้ตรวจสถานที่จริง (ผู้จัดทำรายงาน)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    เจ้าหน้าที่ผู้ปฏิบัติงาน
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">ชื่อ-นามสกุล</label>
                    <input
                      type="text"
                      value={formData.signatories.officerName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: { ...formData.signatories, officerName: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">ตำแหน่ง</label>
                    <input
                      type="text"
                      value={formData.signatories.officerPosition}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: { ...formData.signatories, officerPosition: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TAB 3: FEE RATES SCHEDULE ----------------- */}
          {activeTab === 'fees' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="p-4 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl text-emerald-950 flex items-start gap-3">
                <Coins className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <div className="font-bold text-sm text-emerald-900 mb-0.5">อัตราค่าธรรมเนียมตามข้อบัญญัติท้องถิ่น อบต.โป่งน้ำร้อน</div>
                  ระบบจะใช้อัตราค่าธรรมเนียมเหล่านี้คำนวณยอดเงินและออกใบเสร็จรับเงินให้อัตโนมัติเมื่อมีการบันทึกคำขอใหม่หรือต่ออายุใบอนุญาต
                </div>
              </div>

              {/* Group A: กิจการอาหาร */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="font-bold text-sm text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>๑. สถานที่จำหน่ายอาหารและสะสมอาหาร (แบบ นจ. และ บทอ.)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-700">แบบ นจ. อาหาร ≤ ๑๐๐ ตร.ม.</label>
                      <span className="text-[10px] text-slate-400 font-mono">บาท/ปี</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.fees.foodNoticeSmall}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fees: { ...formData.fees, foodNoticeSmall: Number(e.target.value) }
                          })
                        }
                        className="w-full pl-3 pr-10 py-2 font-mono font-bold bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">฿</span>
                    </div>
                  </div>

                  <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-700">แบบ นจ. อาหาร ๑๐๑-๒๐๐ ตร.ม.</label>
                      <span className="text-[10px] text-slate-400 font-mono">บาท/ปี</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.fees.foodNoticeLarge}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fees: { ...formData.fees, foodNoticeLarge: Number(e.target.value) }
                          })
                        }
                        className="w-full pl-3 pr-10 py-2 font-mono font-bold bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">฿</span>
                    </div>
                  </div>

                  <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-700">แบบ บทอ. อาหาร &gt; ๒๐๐ ตร.ม.</label>
                      <span className="text-[10px] text-slate-400 font-mono">บาท/ปี</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.fees.foodLicense}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fees: { ...formData.fees, foodLicense: Number(e.target.value) }
                          })
                        }
                        className="w-full pl-3 pr-10 py-2 font-mono font-bold bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">฿</span>
                    </div>
                  </div>

                  <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-700">สถานที่สะสมอาหาร / คลังห้องเย็น</label>
                      <span className="text-[10px] text-slate-400 font-mono">บาท/ปี</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.fees.foodStorage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fees: { ...formData.fees, foodStorage: Number(e.target.value) }
                          })
                        }
                        className="w-full pl-3 pr-10 py-2 font-mono font-bold bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">฿</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group B: กิจการอันตรายต่อสุขภาพ & อื่นๆ */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="font-bold text-sm text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Factory className="w-4 h-4 text-emerald-600" />
                  <span>๒. กิจการอันตราย ตลาด และการจำหน่ายสินค้าในที่สาธารณะ</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-700">แบบ บทส. กิจการอันตรายทั่วไป (บาท)</label>
                      <span className="text-[10px] text-slate-400 font-mono">บาท/ปี</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.fees.hazardousBase}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fees: { ...formData.fees, hazardousBase: Number(e.target.value) }
                          })
                        }
                        className="w-full pl-3 pr-10 py-2 font-mono font-bold bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">฿</span>
                    </div>
                  </div>

                  <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-700">แบบ บทส. เครื่องจักร &gt; ๕๐ แรงม้า</label>
                      <span className="text-[10px] text-slate-400 font-mono">บาท/ปี</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.fees.hazardousHeavy}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fees: { ...formData.fees, hazardousHeavy: Number(e.target.value) }
                          })
                        }
                        className="w-full pl-3 pr-10 py-2 font-mono font-bold bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">฿</span>
                    </div>
                  </div>

                  <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-700">แบบ อส. จัดตั้งตลาดสด/ตลาดนัด</label>
                      <span className="text-[10px] text-slate-400 font-mono">บาท/ปี</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.fees.marketRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fees: { ...formData.fees, marketRate: Number(e.target.value) }
                          })
                        }
                        className="w-full pl-3 pr-10 py-2 font-mono font-bold bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">฿</span>
                    </div>
                  </div>

                  <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-700">แบบ นส. จำหน่ายสินค้าในที่สาธารณะ</label>
                      <span className="text-[10px] text-slate-400 font-mono">บาท/ปี</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.fees.publicSaleRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fees: { ...formData.fees, publicSaleRate: Number(e.target.value) }
                          })
                        }
                        className="w-full pl-3 pr-10 py-2 font-mono font-bold bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">฿</span>
                    </div>
                  </div>

                  <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 md:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-700">แบบ ปป. รับทำการเก็บ ขน หรือกำจัดสิ่งปฏิกูลหรือมูลฝอย</label>
                      <span className="text-[10px] text-slate-400 font-mono">บาท/ปี</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.fees.wasteSewageRate || 4000}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fees: { ...formData.fees, wasteSewageRate: Number(e.target.value) }
                          })
                        }
                        className="w-full pl-3 pr-10 py-2 font-mono font-bold bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">฿</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TAB 4: INSPECTION & SANITATION RULES ----------------- */}
          {activeTab === 'inspection' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="p-4 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl text-emerald-950 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <div className="font-bold text-sm text-emerald-900 mb-0.5">เกณฑ์การตรวจประเมินสุขลักษณะและรอบการเตือน</div>
                  กำหนดคะแนนขั้นต่ำมาตรฐานกรมอนามัย เกณฑ์ระดับดีเลิศ และกรอบเวลากฎหมายสำหรับการแจ้งเตือนผู้ประกอบการ
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                  <label className="block font-bold text-slate-800">
                    เกณฑ์คะแนนผ่านการประเมินสุขลักษณะ (จาก ๑๐๐)
                  </label>
                  <input
                    type="number"
                    min={60}
                    max={100}
                    value={formData.inspectionRules.passingScore}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inspectionRules: {
                          ...formData.inspectionRules,
                          passingScore: Number(e.target.value)
                        }
                      })
                    }
                    className="w-full px-3.5 py-2.5 font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl text-xs text-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <div className="text-[11px] text-slate-500">เกณฑ์มาตรฐานกรมอนามัยคือ ๘๐ คะแนนขึ้นไป</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                  <label className="block font-bold text-slate-800">
                    เกณฑ์คะแนนระดับดีเลิศ Clean Food Plus
                  </label>
                  <input
                    type="number"
                    min={80}
                    max={100}
                    value={formData.inspectionRules.cleanFoodPlusScore}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inspectionRules: {
                          ...formData.inspectionRules,
                          cleanFoodPlusScore: Number(e.target.value)
                        }
                      })
                    }
                    className="w-full px-3.5 py-2.5 font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl text-xs text-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <div className="text-[11px] text-slate-500">เกณฑ์ระดับเกียรติบัตรมาตรฐานดีเลิศคือ ๙๐ คะแนนขึ้นไป</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                  <label className="block font-bold text-slate-800">
                    ระยะเวลาคำสั่งให้ปรับปรุงแก้ไขมาตรฐาน (วัน)
                  </label>
                  <input
                    type="number"
                    min={7}
                    max={30}
                    value={formData.inspectionRules.standardCorrectionDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inspectionRules: {
                          ...formData.inspectionRules,
                          standardCorrectionDays: Number(e.target.value)
                        }
                      })
                    }
                    className="w-full px-3.5 py-2.5 font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl text-xs text-red-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <div className="text-[11px] text-slate-500">รอบการนัดหมายลงตรวจซ้ำมาตรฐานคือ ๑๕ วัน</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                  <label className="block font-bold text-slate-800">
                    ระยะเวลาแจ้งเตือนก่อนสิ้นอายุใบอนุญาต (วัน)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={90}
                    value={formData.inspectionRules.expiryWarningDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inspectionRules: {
                          ...formData.inspectionRules,
                          expiryWarningDays: Number(e.target.value)
                        }
                      })
                    }
                    className="w-full px-3.5 py-2.5 font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl text-xs text-amber-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <div className="text-[11px] text-slate-500">แจ้งเตือนผู้ประกอบการเตรียมเอกสารต่ออายุล่วงหน้า ๓๐ วัน</div>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TAB 5: DATABASE BACKUP & RESTORE ----------------- */}
          {activeTab === 'data' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="p-4 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl text-emerald-950 flex items-start gap-3">
                <Database className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <div className="font-bold text-sm text-emerald-900 mb-0.5">การสำรองและกู้คืนข้อมูล (Backup & Restore)</div>
                  สามารถส่งออกฐานข้อมูลสถานประกอบการและสารบรรณเป็นไฟล์ JSON เพื่อเก็บบนเครื่อง หรือนำเข้าไฟล์สำรองเพื่อกู้คืนข้อมูล
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export Backup Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">สำรองข้อมูลระบบ (Export JSON)</div>
                        <div className="text-[11px] text-slate-500">บันทึกข้อมูลทุกรายการลงเครื่อง</div>
                      </div>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      ดาวน์โหลดฐานข้อมูลสถานประกอบการ ({establishments.length} แห่ง) และค่าตั้งค่าระบบ เพื่อเก็บเป็นไฟล์สำรองความปลอดภัย (.json)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>ดาวน์โหลดไฟล์สำรองข้อมูล (.json)</span>
                  </button>
                </div>

                {/* Import Restore Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">กู้คืนข้อมูล (Import JSON)</div>
                        <div className="text-[11px] text-slate-500">นำเข้าไฟล์สำรองเพื่อกู้คืน</div>
                      </div>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      เลือกไฟล์สำรองข้อมูล (.json) ที่เคยส่งออกไว้ เพื่อนำเข้าข้อมูลกลับคืนสู่ระบบสารบรรณ (ระบบจะถามยืนยันก่อนบันทึก)
                    </p>
                  </div>
                  <label className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all active:scale-95 text-center">
                    <Upload className="w-4 h-4" />
                    <span>เลือกไฟล์เพื่อนำเข้าข้อมูล</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ================= 4. MODAL FOOTER ACTION BAR ================= */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
          {/* Reset Button on the Left */}
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            title="คืนค่าการตั้งค่าทั้งหมดกลับสู่ค่ามาตรฐาน"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนค่าเริ่มต้น</span>
          </button>

          {/* Action Buttons on the Right */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการตั้งค่าระบบ</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SystemSettingsModal;
