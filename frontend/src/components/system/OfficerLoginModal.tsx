import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Eye,
  EyeOff,
  User,
  Camera,
  Save
} from 'lucide-react';
import { sanitationDataService, DEFAULT_OFFICERS, type OfficerAccount } from '../../services/sanitationDataService';

interface OfficerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOfficer: OfficerAccount;
  onOfficerChange: (officer: OfficerAccount) => void;
}

export const OfficerLoginModal: React.FC<OfficerLoginModalProps> = ({
  isOpen,
  onClose,
  currentOfficer,
  onOfficerChange
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'profile'>('login');
  const [officersList, setOfficersList] = useState<OfficerAccount[]>(DEFAULT_OFFICERS);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>(currentOfficer.id);
  const [pinCode, setPinCode] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Profile Edit State
  const [profileName, setProfileName] = useState<string>(currentOfficer.name);
  const [profilePosition, setProfilePosition] = useState<string>(currentOfficer.position);
  const [profilePhone, setProfilePhone] = useState<string>(currentOfficer.phone || '');
  const [profileEmail, setProfileEmail] = useState<string>(currentOfficer.email || '');
  const [profilePin, setProfilePin] = useState<string>(currentOfficer.pinCode);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string>(currentOfficer.avatarUrl || '');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      sanitationDataService.getOfficers().then((list) => {
        if (list && list.length > 0) setOfficersList(list);
      });
      setProfileName(currentOfficer.name);
      setProfilePosition(currentOfficer.position);
      setProfilePhone(currentOfficer.phone || '');
      setProfileEmail(currentOfficer.email || '');
      setProfilePin(currentOfficer.pinCode);
      setProfileAvatarUrl(currentOfficer.avatarUrl || '');
    }
  }, [isOpen, currentOfficer]);

  if (!isOpen) return null;

  const targetOfficer = officersList.find(o => o.id === selectedOfficerId || o.officerCode === selectedOfficerId) || officersList[0] || currentOfficer;

  // Handle Verify & Switch Login
  const handleVerifyAndLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (pinCode.trim() === targetOfficer.pinCode) {
      setSuccessMessage(`เข้าสู่ระบบในนาม "${targetOfficer.name}" สำเร็จ!`);
      localStorage.setItem('PNR_CURRENT_OFFICER', JSON.stringify(targetOfficer));
      setTimeout(() => {
        onOfficerChange(targetOfficer);
        setSuccessMessage(null);
        setPinCode('');
        onClose();
      }, 600);
    } else {
      setErrorMessage(`รหัสผ่านไม่ถูกต้อง (รหัสผ่านสำหรับ ${targetOfficer.name.split(' ')[0]} คือ "${targetOfficer.pinCode}")`);
    }
  };

  const handleQuickSwitch = (officer: OfficerAccount) => {
    setSelectedOfficerId(officer.id);
    setPinCode('');
    setErrorMessage(null);
  };

  // Handle Profile Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setProfileAvatarUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    const updatedOfficer: OfficerAccount = {
      ...currentOfficer,
      name: profileName.trim(),
      position: profilePosition.trim(),
      phone: profilePhone.trim(),
      email: profileEmail.trim(),
      pinCode: profilePin.trim(),
      avatarUrl: profileAvatarUrl
    };

    await sanitationDataService.saveOfficer(updatedOfficer);
    localStorage.setItem('PNR_CURRENT_OFFICER', JSON.stringify(updatedOfficer));
    onOfficerChange(updatedOfficer);

    setIsSavingProfile(false);
    setSuccessMessage('✓ บันทึกข้อมูลส่วนตัวและรูปโปรไฟล์เรียบร้อยแล้ว');
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">ระบบเจ้าหน้าที่ อบต.โป่งน้ำร้อน</h3>
              <p className="text-xs text-emerald-200">กองสาธารณสุขและสิ่งแวดล้อม อบต.โป่งน้ำร้อน</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'login'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>สลับบัญชีผู้ใช้งาน (PIN)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>จัดการข้อมูลส่วนตัว & รูปถ่าย</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {successMessage && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: LOGIN / SWITCH ACCOUNT */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              {/* Officer Selector Cards */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  ๑. เลือกบัญชีเจ้าหน้าที่ผู้ปฏิบัติงาน:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {officersList.map((off) => {
                    const isSelected = off.id === selectedOfficerId;
                    const isCurrentActive = off.id === currentOfficer.id;
                    return (
                      <button
                        key={off.id}
                        type="button"
                        onClick={() => handleQuickSwitch(off)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                            {off.officerCode}
                          </span>
                          {isCurrentActive && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
                              ใช้งานอยู่
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {off.avatarUrl ? (
                            <img src={off.avatarUrl} alt={off.name} className="w-7 h-7 rounded-full object-cover border border-emerald-400 shrink-0" />
                          ) : (
                            <div className={`w-7 h-7 rounded-full ${off.avatarColor || 'bg-emerald-600'} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                              {off.name[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-900 truncate">{off.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">{off.position}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PIN Code Form */}
              <form onSubmit={handleVerifyAndLogin} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                      <span>๒. ป้อนรหัสผ่าน / PIN เพื่อเข้าใช้งาน:</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      (รหัสผ่าน: <strong className="text-emerald-700 font-mono">{targetOfficer.pinCode}</strong>)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      maxLength={30}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.trim())}
                      placeholder="กรอกรหัสผ่าน..."
                      className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono tracking-wider text-center font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      autoFocus
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 absolute right-3 top-2.5 cursor-pointer"
                      title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>ยืนยันเข้าใช้งานในชื่อ {targetOfficer.name.split(' ')[0]}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: PROFILE & PHOTO MANAGEMENT */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Photo Upload Area */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="relative group">
                  {profileAvatarUrl ? (
                    <img
                      src={profileAvatarUrl}
                      alt={profileName}
                      className="w-20 h-20 rounded-full object-cover border-3 border-emerald-500 shadow-md"
                    />
                  ) : (
                    <div className={`w-20 h-20 rounded-full ${currentOfficer.avatarColor || 'bg-emerald-700'} text-white flex items-center justify-center font-bold text-2xl shadow-md`}>
                      {profileName ? profileName[0] : 'จ'}
                    </div>
                  )}
                  <label className="absolute inset-0 rounded-full bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span className="text-[9px] font-bold">เปลี่ยนรูป</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="font-bold text-xs text-slate-800">รูปภาพประจำตัวเจ้าหน้าที่</div>
                  <p className="text-[11px] text-slate-500">
                    รูปจะแสดงที่มุมล่างแถบเมนู และเชื่อมโยงกับประวัติการบันทึกเอกสาร
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold cursor-pointer transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                    <span>เลือกรูปภาพจากอุปกรณ์...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Profile Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">ชื่อ-นามสกุล:</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">ตำแหน่งราชการ:</label>
                  <input
                    type="text"
                    value={profilePosition}
                    onChange={(e) => setProfilePosition(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">เบอร์โทรศัพท์ติดต่อ:</label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">อีเมล:</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">รหัสผ่าน / PIN (สำหรับเข้าใช้งาน):</label>
                  <input
                    type="text"
                    value={profilePin}
                    onChange={(e) => setProfilePin(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono font-bold text-emerald-800"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกข้อมูลส่วนตัว & รูปถ่าย</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 text-[11px]">
            รหัสประจำตัว: <strong className="font-mono text-slate-700">{currentOfficer.officerCode}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfficerLoginModal;
