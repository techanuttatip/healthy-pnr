import React from 'react';
import { LayoutDashboard, Search, Bell, Settings } from 'lucide-react';
import type { OfficerAccount } from '../../services/sanitationDataService';
import type { AppModuleType } from './AppSidebar';
import { LiveClock } from './LiveClock';

interface AppHeaderProps {
  activeModule: AppModuleType;
  onNavigateHome: () => void;
  organizationName?: string;
  globalSearch: string;
  onSearchChange: (query: string) => void;
  onSelectTableModule: () => void;
  currentOfficer: OfficerAccount;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenDataSafety?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeModule,
  onNavigateHome,
  organizationName = 'อบต.โป่งน้ำร้อน',
  globalSearch,
  onSearchChange,
  onSelectTableModule,
  currentOfficer,
  onOpenProfile,
  onOpenSettings,
  onOpenDataSafety
}) => {
  return (
    <header className="gov-glass mx-4 mt-3 rounded-2xl h-14 px-5 flex items-center justify-between shrink-0 z-20 print:hidden gap-4 border border-white/70 shadow-sm">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs shrink-0">
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
          <span>หน้าหลัก</span>
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-slate-500 hidden md:inline">{organizationName}</span>
        <span className="text-slate-300 hidden md:inline">/</span>
        <span className="font-bold text-slate-900 flex items-center gap-1.5">
          {activeModule === 'dashboard' && '๑. ศูนย์บัญชาการภาพรวมงานทะเบียน'}
          {activeModule === 'table' && '๒. ทะเบียนคำขอ & สารบรรณ'}
          {activeModule === 'intake' && '๓. นำเข้าเอกสาร PDF (Auto-fill)'}
          {activeModule === 'archive' && '๔. แฟ้มเอกสารรายปี'}
          {activeModule === 'map' && '๕. แผนที่พิกัด GIS ตำบล'}
          {activeModule === 'print' && '๖. พิมพ์เอกสารราชการ'}
        </span>
      </div>

      {/* Center: Search Bar with Pill shape & Ctrl + K */}
      <div className="relative flex-1 max-w-sm hidden sm:block">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={globalSearch}
          onChange={(e) => {
            onSearchChange(e.target.value);
            if (activeModule !== 'table' && e.target.value.trim().length > 0) {
              onSelectTableModule();
            }
          }}
          placeholder="ค้นหาเลขที่เอกสาร ชื่อร้าน หรือผู้รับผิดชอบ..."
          className="w-full pl-8 pr-16 py-1.5 bg-white/90 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-blue-500 rounded-full text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all shadow-xs font-sans"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-slate-400 pointer-events-none">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 font-mono">
            Ctrl + K
          </kbd>
        </div>
        {globalSearch && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-16 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            title="ล้างคำค้นหา"
          >
            ✕
          </button>
        )}
      </div>

      {/* Right Header: Notifications, Cloud Status, Date, Officer Profile & Settings */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Notification Bell */}
        <div
          className="relative p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/60 transition-colors cursor-pointer"
          title="การแจ้งเตือนงานสารบรรณ (๓ รายการ)"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
        </div>

        {/* Supabase Cloud Connection & Data Safety Indicator */}
        <button
          type="button"
          onClick={onOpenDataSafety}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-semibold shadow-2xs transition-all cursor-pointer group"
          title="สถานะความปลอดภัยข้อมูล และระบบสำรองฉุกเฉิน (คลิกเพื่อเปิดศูนย์สำรองข้อมูล)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-mono text-[10.5px] group-hover:underline">🛡️ ปลอดภัย (Auto-Backup)</span>
        </button>

        {/* Officer Profile Button */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="px-2.5 py-1.5 rounded-full bg-white/90 hover:bg-white border border-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          title="ข้อมูลประจำตัวเจ้าหน้าที่และลายมือชื่อดิจิทัล"
        >
          {currentOfficer.avatarUrl ? (
            <img
              src={currentOfficer.avatarUrl}
              alt=""
              className="w-5 h-5 rounded-full object-cover border border-slate-300 shrink-0"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
              {currentOfficer.name.slice(0, 1)}
            </div>
          )}
          <span className="truncate max-w-[120px] hidden xl:inline text-[11px]">{currentOfficer.name}</span>
        </button>

        {/* Date & Time */}
        <div className="hidden md:flex flex-col text-right text-[11px] text-slate-600 font-mono leading-tight">
          <LiveClock className="font-bold text-slate-900" />
          <span className="text-[9px] text-slate-500">
            {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* System Settings Launch Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-1.5 rounded-xl bg-white/90 hover:bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-xs cursor-pointer"
          title="ตั้งค่าหน่วยงาน อัตราค่าธรรมเนียม และผู้ลงนามราชการ"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
