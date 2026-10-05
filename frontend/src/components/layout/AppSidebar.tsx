import React from 'react';
import {
  UploadCloud,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  Building2,
  FolderOpen,
  MapPin,
  Printer,
  Settings,
  History,
  User,
  LogOut,
  Clock,
  ChevronRight
} from 'lucide-react';
import type { OfficerAccount } from '../../services/sanitationDataService';
import { LiveClock } from './LiveClock';

export type AppModuleType = 'dashboard' | 'table' | 'intake' | 'archive' | 'map' | 'print';

interface AppSidebarProps {
  isSidebarCollapsed: boolean;
  onToggleCollapse: () => void;
  activeModule: AppModuleType;
  onSelectModule: (mod: AppModuleType) => void;
  establishmentsCount: number;
  activeCount: number;
  inspectionCount: number;
  correctionCount: number;
  currentOfficer: OfficerAccount;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenAuditLog: () => void;
  onLogout: () => void;
  onFilterTableByStatus: (status: string) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isSidebarCollapsed,
  onToggleCollapse,
  activeModule,
  onSelectModule,
  establishmentsCount,
  activeCount,
  inspectionCount,
  correctionCount,
  currentOfficer,
  onOpenProfile,
  onOpenSettings,
  onOpenAuditLog,
  onLogout,
  onFilterTableByStatus
}) => {
  return (
    <aside
      className={`${
        isSidebarCollapsed ? 'w-16' : 'w-[250px]'
      } shrink-0 h-full gov-sidebar-glass text-white flex flex-col justify-between z-30 transition-all duration-200 print:hidden relative`}
    >
      {/* Top: Emblem, Organization Branding & Collapse Toggle */}
      <div className={`p-3.5 border-b border-white/10 ${isSidebarCollapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400 bg-white shadow-md shrink-0 flex items-center justify-center p-0.5">
              <img
                src="/pnr_logo.png"
                alt="ตราสัญลักษณ์ อบต.โป่งน้ำร้อน"
                className="w-full h-full object-contain"
              />
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <div className="font-extrabold text-xs text-white tracking-tight truncate font-heading">
                  ระบบสารบรรณ & ทะเบียน
                </div>
                <div className="text-[11px] text-blue-300 font-semibold truncate">
                  อบต.โป่งน้ำร้อน อ.ฝาง
                </div>
                <div className="text-[9px] text-slate-400 font-mono">
                  e-Service พ.ร.บ.สาธารณสุข
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title={isSidebarCollapsed ? 'ขยายแถบเมนู (Expand)' : 'พับเก็บแถบเมนู (Collapse)'}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-blue-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>

        {/* Primary Action Button: + นำเข้าเอกสาร PDF (Auto-fill) */}
        <button
          type="button"
          onClick={() => onSelectModule('intake')}
          className={`mt-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-400 text-white font-bold text-xs shadow-lg shadow-blue-500/40 border border-white/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 hover:shadow-blue-500/50 ${
            isSidebarCollapsed ? 'w-10 h-10 p-0 mx-auto' : 'w-full px-3'
          }`}
          title="นำเข้าเอกสารสแกน PDF และตรวจสอบข้อมูล Auto-fill แบบ Side-by-Side"
        >
          <UploadCloud className="w-4 h-4 stroke-[2.2] animate-pulse" />
          {!isSidebarCollapsed && <span>+ นำเข้าเอกสาร PDF (Auto-fill)</span>}
        </button>
      </div>

      {/* Middle: Navigation Modules */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3 no-scrollbar">
        <div>
          {!isSidebarCollapsed && (
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5 flex items-center justify-between">
              <span>เมนูการปฏิบัติงานหลัก</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            </div>
          )}
          <nav className="space-y-1.5">
            {/* Tab 1: ศูนย์บัญชาการภาพรวมงานทะเบียน */}
            <button
              type="button"
              onClick={() => onSelectModule('dashboard')}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-200 cursor-pointer ${
                isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
              } ${
                activeModule === 'dashboard'
                  ? 'gov-active-glow font-bold scale-[1.02]'
                  : 'text-slate-300 hover:bg-white/12 hover:text-white hover:translate-x-1'
              }`}
              title="ศูนย์บัญชาการภาพรวมงานทะเบียน"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeModule === 'dashboard' ? 'text-white' : 'text-blue-400'}`} />
                {!isSidebarCollapsed && <span className="truncate">ศูนย์บัญชาการภาพรวมงานทะเบียน</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${activeModule === 'dashboard' ? 'bg-white/25 text-white' : 'bg-white/10 text-slate-300'}`}>
                  หน้าแรก
                </span>
              )}
            </button>

            {/* Tab 2: ทะเบียนคำขอ & สารบรรณ */}
            <button
              type="button"
              onClick={() => {
                onFilterTableByStatus('all');
                onSelectModule('table');
              }}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-200 cursor-pointer ${
                isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
              } ${
                activeModule === 'table'
                  ? 'gov-active-glow font-bold scale-[1.02]'
                  : 'text-slate-300 hover:bg-white/12 hover:text-white hover:translate-x-1'
              }`}
              title="ทะเบียนคำขอ & สารบรรณ"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Building2 className={`w-4 h-4 shrink-0 ${activeModule === 'table' ? 'text-white' : 'text-emerald-400'}`} />
                {!isSidebarCollapsed && <span className="truncate">ทะเบียนคำขอ & สารบรรณ</span>}
              </div>
              {!isSidebarCollapsed && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 font-bold ${
                    activeModule === 'table'
                      ? 'bg-white/25 text-white'
                      : 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/30'
                  }`}
                >
                  {establishmentsCount}
                </span>
              )}
            </button>

            {/* Tab 3: นำเข้าเอกสาร PDF (Auto-fill) */}
            <button
              type="button"
              onClick={() => onSelectModule('intake')}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-200 cursor-pointer ${
                isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
              } ${
                activeModule === 'intake'
                  ? 'gov-active-glow font-bold scale-[1.02]'
                  : 'text-slate-300 hover:bg-white/12 hover:text-white hover:translate-x-1'
              }`}
              title="นำเข้าเอกสาร PDF (Auto-fill)"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <UploadCloud className={`w-4 h-4 shrink-0 ${activeModule === 'intake' ? 'text-white' : 'text-cyan-400'}`} />
                {!isSidebarCollapsed && <span className="truncate">นำเข้าเอกสาร PDF (Auto-fill)</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${activeModule === 'intake' ? 'bg-white/25 text-white' : 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/30'}`}>
                  Auto-fill
                </span>
              )}
            </button>

            {/* Tab 4: แฟ้มเอกสารรายปี */}
            <button
              type="button"
              onClick={() => onSelectModule('archive')}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-200 cursor-pointer ${
                isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
              } ${
                activeModule === 'archive'
                  ? 'gov-active-glow font-bold scale-[1.02]'
                  : 'text-slate-300 hover:bg-white/12 hover:text-white hover:translate-x-1'
              }`}
              title="แฟ้มเอกสารรายปี"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FolderOpen className={`w-4 h-4 shrink-0 ${activeModule === 'archive' ? 'text-white' : 'text-amber-400'}`} />
                {!isSidebarCollapsed && <span className="truncate">แฟ้มเอกสารรายปี</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${activeModule === 'archive' ? 'bg-white/25 text-white' : 'bg-amber-500/30 text-amber-200 border border-amber-400/30'}`}>
                  ๕ ฉบับ
                </span>
              )}
            </button>

            {/* Tab 5: แผนที่พิกัด GIS ตำบล */}
            <button
              type="button"
              onClick={() => onSelectModule('map')}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-200 cursor-pointer ${
                isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
              } ${
                activeModule === 'map'
                  ? 'gov-active-glow font-bold scale-[1.02]'
                  : 'text-slate-300 hover:bg-white/12 hover:text-white hover:translate-x-1'
              }`}
              title="แผนที่พิกัด GIS ตำบล"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <MapPin className={`w-4 h-4 shrink-0 ${activeModule === 'map' ? 'text-white' : 'text-rose-400'}`} />
                {!isSidebarCollapsed && <span className="truncate">แผนที่พิกัด GIS ตำบล</span>}
              </div>
              {!isSidebarCollapsed && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            </button>

            {/* Tab 6: พิมพ์เอกสารราชการ */}
            <button
              type="button"
              onClick={() => onSelectModule('print')}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-200 cursor-pointer ${
                isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
              } ${
                activeModule === 'print'
                  ? 'gov-active-glow font-bold scale-[1.02]'
                  : 'text-slate-300 hover:bg-white/12 hover:text-white hover:translate-x-1'
              }`}
              title="พิมพ์เอกสารราชการ"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Printer className={`w-4 h-4 shrink-0 ${activeModule === 'print' ? 'text-white' : 'text-purple-400'}`} />
                {!isSidebarCollapsed && <span className="truncate">พิมพ์เอกสารราชการ</span>}
              </div>
              {!isSidebarCollapsed && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            </button>

            {/* Tab 7: ตั้งค่าระบบ & ค่าธรรมเนียม */}
            <button
              type="button"
              onClick={onOpenSettings}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-200 cursor-pointer ${
                isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
              } text-slate-300 hover:bg-white/12 hover:text-white hover:translate-x-1 group`}
              title="ตั้งค่าระบบ & ค่าธรรมเนียม"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Settings className="w-4 h-4 shrink-0 text-slate-400 group-hover:rotate-45 transition-transform" />
                {!isSidebarCollapsed && <span className="truncate">ตั้งค่าระบบ & ค่าธรรมเนียม</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-semibold border border-white/10 shrink-0">
                  ตั้งค่า
                </span>
              )}
            </button>

            {/* Tab 8: บันทึกประวัติราชการ (Audit Trail Logs) */}
            <button
              type="button"
              onClick={onOpenAuditLog}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-200 cursor-pointer ${
                isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
              } text-slate-300 hover:bg-white/12 hover:text-white hover:translate-x-1 group`}
              title="สมุดบันทึกประวัติการดำเนินงานราชการ (Audit Trail Logs)"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <History className="w-4 h-4 shrink-0 text-indigo-400 group-hover:rotate-[-20deg] transition-transform" />
                {!isSidebarCollapsed && <span className="truncate">ประวัติราชการ (Audit)</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-400/30 shrink-0">
                  Audit
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Daily Status summary in sidebar (Only when expanded) */}
        {!isSidebarCollapsed && (
          <div className="pt-2.5 border-t border-white/10">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
              สถานะงานราชการประจำวัน
            </div>
            <div className="space-y-1.5 text-xs">
              {/* 1. รอตรวจสถานที่ */}
              <div
                onClick={() => {
                  onFilterTableByStatus('pending_inspection');
                  onSelectModule('table');
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 flex items-center justify-between cursor-pointer transition-all border border-purple-500/30"
                role="button"
                tabIndex={0}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 shadow-sm" />
                  <span>รอตรวจสถานที่</span>
                </span>
                <span className="font-mono font-bold text-purple-300">{inspectionCount}</span>
              </div>

              {/* 2. มีคำสั่งให้ปรับปรุง */}
              <div
                onClick={() => {
                  onFilterTableByStatus('pending_correction');
                  onSelectModule('table');
                }}
                className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-200 flex items-center justify-between cursor-pointer transition-all border border-red-500/30"
                role="button"
                tabIndex={0}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 shadow-sm" />
                  <span>มีคำสั่งให้ปรับปรุง</span>
                </span>
                <span className="font-mono font-bold text-red-300">{correctionCount}</span>
              </div>

              {/* 3. ได้รับอนุญาตแล้ว */}
              <div
                onClick={() => {
                  onFilterTableByStatus('active');
                  onSelectModule('table');
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-200 flex items-center justify-between cursor-pointer transition-all border border-emerald-500/30"
                role="button"
                tabIndex={0}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
                  <span>ได้รับอนุญาตแล้ว</span>
                </span>
                <span className="font-mono font-bold text-emerald-300">{activeCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Local Identity Card */}
      {!isSidebarCollapsed && (
        <div className="p-2 mx-2 mb-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2.5 hover:bg-slate-800 transition-all cursor-pointer shadow-sm">
          <img
            src="/pnr_landscape_bg.png"
            alt="อบต.โป่งน้ำร้อน"
            className="w-10 h-10 rounded-lg object-cover border border-slate-600 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="font-bold text-[11px] text-white truncate font-heading">
              อบต.โป่งน้ำร้อน
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              อ.ฝาง จ.เชียงใหม่
            </div>
            <div className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ระบบปกติ</span>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>
      )}

      {/* Bottom: Officer Profile Card & Clock */}
      <div className="p-3 border-t border-white/10 bg-slate-900/80 text-xs relative z-10">
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-2 min-w-0 text-left hover:opacity-85 transition-opacity cursor-pointer group"
            title="ข้อมูลประจำตัวเจ้าหน้าที่และลายมือชื่อดิจิทัล"
          >
            {currentOfficer.avatarUrl ? (
              <img
                src={currentOfficer.avatarUrl}
                alt={currentOfficer.name}
                className="w-8 h-8 rounded-full object-cover border border-blue-400 shadow-2xs group-hover:ring-2 group-hover:ring-blue-500 shrink-0"
              />
            ) : (
              <div
                className={`w-8 h-8 rounded-full ${
                  currentOfficer.avatarColor || 'bg-blue-600'
                } text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs group-hover:ring-2 group-hover:ring-blue-500`}
              >
                <User className="w-4 h-4" />
              </div>
            )}
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <div className="font-bold text-white truncate text-[11px] group-hover:text-blue-300 flex items-center gap-1">
                  <span className="truncate">{currentOfficer.name}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-200 font-mono font-bold shrink-0">
                    จนท.
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {currentOfficer.position}
                </div>
              </div>
            )}
          </button>

          {!isSidebarCollapsed && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onOpenProfile}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="ข้อมูลประจำตัวเจ้าหน้าที่ & ลายมือชื่อดิจิทัล"
              >
                <User className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onOpenSettings}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="ตั้งค่าระบบและผู้ลงนาม"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="ออกจากระบบ (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
          {isSidebarCollapsed && (
            <button
              type="button"
              onClick={onLogout}
              className="mt-1 p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="ออกจากระบบ (Logout)"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {!isSidebarCollapsed && (
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/10 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" />
              <LiveClock className="font-mono text-slate-300 font-bold" />
            </span>
            <span className="text-[9px] text-slate-500">v1.0.0</span>
          </div>
        )}
      </div>
    </aside>
  );
};
