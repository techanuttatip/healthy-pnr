import React, { useState, useRef, useEffect } from 'react';
import type { OfficerAccount } from '../../services/sanitationDataService';
import { sanitationDataService } from '../../services/sanitationDataService';
import {
  showSuccessAlert,
  showWarningAlert,
  showToast
} from '../../utils/sweetAlert';
import {
  X,
  User,
  ShieldCheck,
  KeyRound,
  Camera,
  Phone,
  Mail,
  PenTool,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Check,
  Sparkles,
  MessageSquare,
  Award
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOfficer: OfficerAccount;
  onOfficerChange: (officer: OfficerAccount) => void;
}

const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-teal-600',
  'bg-cyan-700',
  'bg-blue-600',
  'bg-indigo-600',
  'bg-violet-600',
  'bg-amber-600',
  'bg-rose-600'
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentOfficer,
  onOfficerChange
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'signature'>('info');

  // Form states
  const [name, setName] = useState(currentOfficer.name);
  const [position, setPosition] = useState(currentOfficer.position);
  const [phone, setPhone] = useState(currentOfficer.phone || '');
  const [email, setEmail] = useState(currentOfficer.email || '');
  const [lineId, setLineId] = useState(currentOfficer.lineId || '');
  const [avatarColor, setAvatarColor] = useState(currentOfficer.avatarColor || 'bg-emerald-600');
  const [avatarUrl, setAvatarUrl] = useState(currentOfficer.avatarUrl || '');

  // Security / PIN states
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Signature state
  const [signatureUrl, setSignatureUrl] = useState<string>(currentOfficer.signatureUrl || '');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync state whenever opened
  useEffect(() => {
    if (isOpen) {
      setName(currentOfficer.name);
      setPosition(currentOfficer.position);
      setPhone(currentOfficer.phone || '');
      setEmail(currentOfficer.email || '');
      setLineId(currentOfficer.lineId || '');
      setAvatarColor(currentOfficer.avatarColor || 'bg-emerald-600');
      setAvatarUrl(currentOfficer.avatarUrl || '');
      setSignatureUrl(currentOfficer.signatureUrl || '');
      setCurrentPinInput('');
      setNewPin('');
      setConfirmPin('');
    }
  }, [isOpen, currentOfficer]);

  if (!isOpen) return null;

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showWarningAlert('ไฟล์ไม่ถูกต้อง', 'กรุณาเลือกไฟล์รูปภาพ (JPEG, PNG) เท่านั้น');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAvatarUrl(dataUrl);
        showToast('อัปโหลดรูปโปรไฟล์แล้ว', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Signature Image Upload
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setSignatureUrl(dataUrl);
        showToast('อัปโหลดลายมือชื่อดิจิทัลแล้ว', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Canvas Drawing Handlers for Digital Signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a'; // Deep Navy slate
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignatureUrl('');
  };

  // Handle Save Profile
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!name.trim()) {
      showWarningAlert('กรุณาระบุชื่อ-นามสกุล', 'ชื่อเจ้าหน้าที่ต้องไม่เว้นว่าง');
      return;
    }

    // Check PIN change if entered
    let finalPin = currentOfficer.pinCode;
    if (newPin.trim()) {
      if (newPin.trim().length < 4) {
        showWarningAlert('รหัส PIN สั้นเกินไป', 'รหัส PIN ใหม่ต้องมีความยาวอย่างน้อย ๔ หลัก');
        return;
      }
      if (newPin !== confirmPin) {
        showWarningAlert('รหัส PIN ไม่ตรงกัน', 'กรุณากรอกรหัส PIN ใหม่และยืนยันรหัสให้ตรงกัน');
        return;
      }
      if (currentPinInput.trim() && currentPinInput.trim() !== currentOfficer.pinCode) {
        showWarningAlert('รหัส PIN เดิมไม่ถูกต้อง', 'กรุณาระบุรหัส PIN ปัจจุบันให้ถูกต้องก่อนเปลี่ยนรหัส');
        return;
      }
      finalPin = newPin.trim();
    }

    const updatedOfficer: OfficerAccount = {
      ...currentOfficer,
      name: name.trim(),
      position: position.trim(),
      phone: phone.trim(),
      email: email.trim(),
      lineId: lineId.trim(),
      pinCode: finalPin,
      avatarColor,
      avatarUrl,
      signatureUrl
    };

    // ๑. Save updated officer in service & storage
    await sanitationDataService.saveOfficer(updatedOfficer);
    localStorage.setItem('PNR_CURRENT_OFFICER', JSON.stringify(updatedOfficer));

    // ๒. Auto-sync officer name & position to user's personal signatory settings
    try {
      const userSettings = await sanitationDataService.getSettings(updatedOfficer.id);
      if (userSettings) {
        const syncedSettings = {
          ...userSettings,
          signatories: {
            ...userSettings.signatories,
            officerName: updatedOfficer.name,
            officerPosition: updatedOfficer.position
          }
        };
        await sanitationDataService.saveSettings(syncedSettings, updatedOfficer.id);
      }
    } catch (err) {
      console.warn('Could not auto-sync signatories:', err);
    }

    // ๓. Propagate change to App state
    onOfficerChange(updatedOfficer);

    showSuccessAlert(
      'บันทึกข้อมูลผู้ปฏิบัติงานสำเร็จ!',
      `อัปเดตข้อมูลและบันทึกการตั้งค่าของ "${updatedOfficer.name}" เรียบร้อยแล้ว ระบบจะนำลายมือชื่อดิจิทัลและข้อมูลเจ้าหน้าที่ไปใช้ในเอกสารราชการโดยอัตโนมัติ`
    );

    setCurrentPinInput('');
    setNewPin('');
    setConfirmPin('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm font-sans animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* ================= 1. HEADER (EMERALD GRADIENT) ================= */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white flex items-center justify-between shrink-0 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-inner overflow-hidden">
              <User className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="font-bold text-base sm:text-lg flex items-center gap-2 font-heading tracking-tight">
                <span>ข้อมูลผู้ปฏิบัติงาน & ลายมือชื่อดิจิทัล</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 border border-emerald-400/40 font-bold">
                  {currentOfficer.role === 'head' ? 'หัวหน้างานสุขาภิบาล' : currentOfficer.role === 'director' ? 'ผู้อำนวยการกอง' : currentOfficer.role === 'executive' ? 'ผู้บริหาร' : 'เจ้าหน้าที่ผู้ตรวจ'}
                </span>
              </div>
              <p className="text-xs text-emerald-100/90">
                {currentOfficer.name} • {currentOfficer.position} ({currentOfficer.officerCode})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="relative z-10 p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= 2. NAVIGATION TABS ================= */}
        <div className="flex items-center bg-slate-100/90 border-b border-slate-200/80 px-6 py-2 gap-2 text-xs shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'info'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>๑. ข้อมูลประจำตัว & ภาพถ่าย</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>๒. ความปลอดภัย & รหัส PIN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('signature')}
            className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'signature'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>๓. ลายมือชื่อดิจิทัล</span>
          </button>
        </div>

        {/* ================= 3. TAB BODY (SCROLLABLE) ================= */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/60 text-xs">
          
          {/* ----------------- TAB 1: PERSONAL INFO & PHOTO ----------------- */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Photo & Avatar Customization Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-5">
                <div className="relative group">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                    />
                  ) : (
                    <div className={`w-20 h-20 rounded-2xl ${avatarColor} text-white flex items-center justify-center font-bold text-2xl shadow-md`}>
                      {name.charAt(0) || '👤'}
                    </div>
                  )}

                  <label className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-slate-900 text-white hover:bg-emerald-600 transition-colors shadow-md cursor-pointer">
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="font-bold text-sm text-slate-800">{name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                      {currentOfficer.officerCode}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    เลือกสีประจำตัว หรืออัปโหลดรูปถ่ายหน้าตรงเพื่อใช้เป็นภาพโปรไฟล์ในระบบ
                  </div>

                  {/* Preset Colors */}
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 pt-1">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => { setAvatarColor(c); setAvatarUrl(''); }}
                        className={`w-6 h-6 rounded-full ${c} transition-all cursor-pointer flex items-center justify-center ${
                          avatarColor === c && !avatarUrl ? 'ring-2 ring-offset-2 ring-emerald-600 scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                        title={c}
                      >
                        {avatarColor === c && !avatarUrl && <Check className="w-3 h-3 text-white" />}
                      </button>
                    ))}
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="text-[10px] text-red-600 hover:underline ml-2 cursor-pointer"
                      >
                        นำรูปออก
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Data Form Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="font-bold text-sm text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>ข้อมูลประจำตัวทางการ (ใช้แสดงในเอกสารราชการ)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      ชื่อ - สกุล ทางการ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                      placeholder="เช่น นางสาวรุ่งทิวา อุปนันท์"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      ตำแหน่งราชการ / งานที่รับผิดชอบ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                      placeholder="เช่น นักวิชาการสาธารณสุขปฏิบัติการ"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      เบอร์โทรศัพท์ติดต่อ
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                      placeholder="เช่น 088-xxx-xxxx"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                      อีเมลติดต่อราชการ
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                      placeholder="user@pongnamron.go.th"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      LINE ID (สำหรับประสานงานผู้ประกอบการ)
                    </label>
                    <input
                      type="text"
                      value={lineId}
                      onChange={(e) => setLineId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                      placeholder="เช่น health_prn"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TAB 2: SECURITY & PIN ----------------- */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl text-emerald-950 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <div className="font-bold text-sm text-emerald-900 mb-0.5">การรักษาความปลอดภัยประจำบัญชี</div>
                  รหัส PIN ใช้สำหรับยืนยันตัวตนเข้าใช้งานระบบ และรับรองความถูกต้องในการลงลายมือชื่อในเอกสารราชการเฉพาะเจ้าหน้าที่ผู้ได้รับมอบหมาย
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="font-bold text-sm text-slate-800 flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    <span>เปลี่ยนรหัส PIN ประจำตัว</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-slate-400 hover:text-emerald-700 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPin ? 'ซ่อนรหัส' : 'แสดงรหัส'}</span>
                  </button>
                </div>

                <div className="space-y-3.5 max-w-md mx-auto">
                  <div className="space-y-1">
                    <label className="text-slate-700 font-bold">รหัส PIN ปัจจุบัน</label>
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={currentPinInput}
                      onChange={(e) => setCurrentPinInput(e.target.value)}
                      placeholder="กรอกรหัส PIN ปัจจุบัน"
                      className="w-full px-3.5 py-2.5 font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-bold">รหัส PIN ใหม่ (๔ - ๘ หลัก)</label>
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="ตั้งรหัส PIN ใหม่"
                      className="w-full px-3.5 py-2.5 font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-bold">ยืนยันรหัส PIN ใหม่</label>
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      placeholder="กรอกรหัส PIN ใหม่อีกครั้ง"
                      className="w-full px-3.5 py-2.5 font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {newPin && confirmPin && newPin !== confirmPin && (
                    <div className="text-[11px] text-red-600 font-bold">
                      ⚠️ รหัส PIN ใหม่ทั้งสองช่องไม่ตรงกัน
                    </div>
                  )}

                  {newPin && confirmPin && newPin === confirmPin && (
                    <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>รหัส PIN ตรงกัน พร้อมบันทึก</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TAB 3: DIGITAL SIGNATURE ----------------- */}
          {activeTab === 'signature' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl text-emerald-950 flex items-start gap-3">
                <PenTool className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <div className="font-bold text-sm text-emerald-900 mb-0.5">ลายมือชื่ออิเล็กทรอนิกส์ (Digital Signature)</div>
                  ท่านสามารถเซ็นชื่อสดบนหน้าจอ หรืออัปโหลดไฟล์รูปภาพลายเซ็น (PNG โปร่งแสง) เพื่อใช้ประทับลงในช่องลงนามเจ้าหน้าที่ผู้ตรวจและผู้รับคำขอโดยอัตโนมัติ
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-emerald-600" />
                    <span>วาดลายมือชื่อ หรืออัปโหลดรูปภาพ</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" />
                      <span>อัปโหลดรูปภาพลายเซ็น</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={clearCanvasSignature}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>ล้างลายเซ็น</span>
                    </button>
                  </div>
                </div>

                {/* Drawing Canvas Area */}
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50/50 flex flex-col items-center justify-center">
                  <div className="text-[11px] text-slate-400 mb-2 font-medium">
                    (ใช้เมาส์ หรือนิ้วมือเซ็นชื่อลงในกรอบสี่เหลี่ยมด้านล่างนี้)
                  </div>

                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="bg-white rounded-xl border border-slate-200 shadow-inner cursor-crosshair touch-none w-full max-w-md h-36"
                  />

                  {signatureUrl && (
                    <div className="mt-3 text-center">
                      <div className="text-[10px] text-slate-400 mb-1">ตัวอย่างการแสดงผลบนเอกสาร:</div>
                      <div className="inline-block p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <img
                          src={signatureUrl}
                          alt="ตัวอย่างลายเซ็น"
                          className="h-10 object-contain mx-auto"
                        />
                        <div className="text-[11px] font-bold text-slate-800 mt-1">
                          ( {name} )
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {position}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ================= 4. MODAL FOOTER ================= */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">
            บันทึกเฉพาะบัญชี: <span className="font-bold text-emerald-800">{currentOfficer.name}</span>
          </div>

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
              onClick={() => handleSaveProfile()}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกข้อมูลผู้ปฏิบัติงาน</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserProfileModal;
