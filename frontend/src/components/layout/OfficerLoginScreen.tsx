import React, { useState } from 'react';
import { ShieldCheck, User, KeyRound, Eye, EyeOff } from 'lucide-react';
import { sanitationDataService, DEFAULT_OFFICERS, type OfficerAccount } from '../../services/sanitationDataService';

interface OfficerLoginScreenProps {
  onLoginSuccess: (officer: OfficerAccount) => void;
}

export const OfficerLoginScreen: React.FC<OfficerLoginScreenProps> = ({ onLoginSuccess }) => {
  const [loginOfficerId, setLoginOfficerId] = useState<string>(DEFAULT_OFFICERS[0].id);
  const [loginPin, setLoginPin] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [showLoginPin, setShowLoginPin] = useState<boolean>(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const officersList = await sanitationDataService.getOfficers();
      const target =
        officersList.find((o) => o.id === loginOfficerId || o.officerCode === loginOfficerId) ||
        DEFAULT_OFFICERS.find((o) => o.id === loginOfficerId);

      if (!target) {
        setLoginError('ไม่พบข้อมูลเจ้าหน้าที่');
        setLoginLoading(false);
        return;
      }

      const isPinValid = await sanitationDataService.verifyPin(target, loginPin.trim());
      if (!isPinValid) {
        setLoginError('รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        setLoginPin('');
        setLoginLoading(false);
        return;
      }

      // PIN ถูกต้อง ส่งกลับให้ App
      onLoginSuccess(target);
    } catch {
      setLoginError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Pong Nam Ron Visual Identity Background with Calm Gradient Overlay */}
      <div className="pnr-login-bg" />
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs pointer-events-none" />

      {/* Subtle Watermark & Background Glow */}
      <div className="absolute inset-0 opacity-5 pointer-events-none select-none flex items-center justify-center">
        <img src="/pnr_logo.png" alt="" className="w-[50vw] h-[50vw] object-contain filter grayscale" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden">
          {/* Header Banner - Deep Government Navy */}
          <div className="bg-[#0F2942] px-8 py-7 text-white text-center border-b-2 border-amber-500/80 relative">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full bg-white border-2 border-amber-400/90 flex items-center justify-center shadow-md overflow-hidden p-1">
                <img src="/pnr_logo.png" alt="ตรา อบต.โป่งน้ำร้อน" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="font-bold text-lg leading-tight font-heading tracking-tight">
              องค์การบริหารส่วนตำบลโป่งน้ำร้อน
            </div>
            <div className="text-slate-300 text-xs mt-0.5">
              งานสาธารณสุขและสิ่งแวดล้อม สำนักปลัด • อำเภอฝาง จังหวัดเชียงใหม่
            </div>
            <div className="mt-3.5 inline-flex items-center justify-center gap-2 bg-white/10 rounded-lg px-3.5 py-1.5 border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11.5px] font-medium text-slate-100">
                ระบบงานทะเบียนใบอนุญาต (พ.ร.บ.สาธารณสุข ๒๕๓๕)
              </span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="px-8 py-7 space-y-5">
            <div className="text-center">
              <div className="text-slate-900 font-bold text-base font-heading">เข้าสู่ระบบเจ้าหน้าที่ผู้ปฏิบัติงาน</div>
              <div className="text-slate-500 text-xs mt-0.5">กรุณาเลือกบัญชีเจ้าหน้าที่และกรอกรหัส PIN ประจำตัว</div>
            </div>

            {/* Officer Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#0F2942]" />
                <span>เจ้าหน้าที่ผู้เข้าสู่ระบบ:</span>
              </label>
              <select
                value={loginOfficerId}
                onChange={(e) => {
                  setLoginOfficerId(e.target.value);
                  setLoginError(null);
                  setLoginPin('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/70 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F2942] focus:border-[#0F2942] transition-all cursor-pointer"
              >
                {DEFAULT_OFFICERS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} — {o.position}
                  </option>
                ))}
              </select>
            </div>

            {/* PIN Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#0F2942]" />
                <span>รหัส PIN ประจำตัว:</span>
              </label>
              <div className="relative">
                <input
                  type={showLoginPin ? 'text' : 'password'}
                  value={loginPin}
                  onChange={(e) => {
                    setLoginPin(e.target.value);
                    setLoginError(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="กรอกรหัส PIN 4-8 หลัก"
                  className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-mono tracking-widest text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F2942] focus:border-[#0F2942] transition-all"
                  autoFocus
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPin((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showLoginPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 text-xs font-medium animate-in fade-in">
                <span className="text-red-500 shrink-0">⚠️</span>
                <span>{loginError}</span>
              </div>
            )}

            {/* Submit Button - Deep Navy */}
            <button
              type="submit"
              disabled={loginLoading || loginPin.trim().length < 4}
              className="w-full py-2.5 rounded-xl bg-[#0F2942] hover:bg-[#1E3A8A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
            >
              {loginLoading ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />{' '}
                  กำลังตรวจสอบข้อมูล...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> ยืนยันตัวตนเข้าสู่ระบบปฏิบัติงาน
                </>
              )}
            </button>

            <div className="text-center text-[11px] text-slate-400 pt-1">
              องค์การบริหารส่วนตำบลโป่งน้ำร้อน
            </div>
          </form>
        </div>

        {/* Version Badge */}
        <div className="text-center mt-4 text-[11px] text-slate-400">
          v1.0.0 • พ.ร.บ.การสาธารณสุข พ.ศ. ๒๕๓๕
        </div>
      </div>
    </div>
  );
};
