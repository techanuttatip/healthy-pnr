import React from 'react';
import {
  UploadCloud,
  PanelLeftClose,
  PanelLeftOpen,
  Building2,
  FolderOpen,
  MapPin,
  Printer,
  Settings,
  History,
  User,
  LogOut,
  Clock,
  FileEdit,
  Smartphone,
  QrCode
} from 'lucide-react';
import type { OfficerAccount } from '../../services/sanitationDataService';
import { LiveClock } from './LiveClock';

export type AppModuleType =
  | 'dashboard'
  | 'table'
  | 'upload_pdf'
  | 'manual_entry'
  | 'field_inspection'
  | 'archive'
  | 'map'
  | 'print'
  | 'intake';

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
  onOpenPwaQr?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isSidebarCollapsed,
  onToggleCollapse,
  activeModule,
  onSelectModule,
  establishmentsCount,
  currentOfficer,
  onOpenProfile,
  onOpenSettings,
  onOpenAuditLog,
  onLogout,
  onFilterTableByStatus,
  onOpenPwaQr
}) => {
  const isCurrent = (mod: AppModuleType) => {
    if (mod === 'upload_pdf') return activeModule === 'upload_pdf' || activeModule === 'intake';
    return activeModule === mod;
  };

  return (
    <aside
      className={`${
        isSidebarCollapsed ? 'w-16' : 'w-[250px]'
      } shrink-0 h-full bg-[#0c1a2e] border-r border-slate-800 text-white flex flex-col justify-between z-30 transition-all duration-200 print:hidden relative`}
    >
      {/* Top: Emblem, Organization Branding & Collapse Toggle */}
      <div className={`p-3.5 border-b border-slate-800/80 ${isSidebarCollapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-amber-400 bg-white shadow-xs shrink-0 flex items-center justify-center p-0.5">
              <img
                src="/pnr_logo.png"
                alt="ตราสัญลักษณ์ อบต.โป่งน้ำร้อน"
                className="w-full h-full object-contain"
              />
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <div className="font-bold text-xs text-white tracking-tight truncate font-heading">
                  ระบบสารบรรณ & ทะเบียน
                </div>
                <div className="text-[11px] text-blue-300 font-medium truncate">
                  อบต.โป่งน้ำร้อน อ.ฝาง
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
      </div>

      {/* Middle: Navigation Modules */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 no-scrollbar">
        {/* 1: ภาพรวมงานทะเบียน & แผนที่ GIS (Merged into unified Command Center Map) */}
        <button
          type="button"
          onClick={() => onSelectModule('dashboard')}
          className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-150 cursor-pointer ${
            isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
          } ${
            isCurrent('dashboard') || isCurrent('map')
              ? 'bg-blue-600 text-white font-bold shadow-sm'
              : 'text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
          title="ภาพรวมงานทะเบียน & แผนที่พิกัด GIS ตำบล"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">ภาพรวม & แผนที่ GIS</span>}
          </div>
        </button>

        {/* 2: ทะเบียนคำขอ & สารบรรณ */}
        <button
          type="button"
          onClick={() => {
            onFilterTableByStatus('all');
            onSelectModule('table');
          }}
          className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-150 cursor-pointer ${
            isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
          } ${
            isCurrent('table')
              ? 'bg-blue-600 text-white font-bold shadow-sm'
              : 'text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
          title="ทะเบียนคำขอ & สารบรรณ"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Building2 className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">ทะเบียนคำขอ & สารบรรณ</span>}
          </div>
          {!isSidebarCollapsed && (
            <span
              className={`text-[11px] font-mono px-2 py-0.2 rounded-full font-bold ${
                isCurrent('table') ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {establishmentsCount}
            </span>
          )}
        </button>

        <div className="pt-2 pb-1">
          {!isSidebarCollapsed && (
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1">
              การรับเรื่อง & บันทึกข้อมูล
            </div>
          )}
        </div>

        {/* 3: อัปโหลดไฟล์ PDF */}
        <button
          type="button"
          onClick={() => onSelectModule('upload_pdf')}
          className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-150 cursor-pointer ${
            isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
          } ${
            isCurrent('upload_pdf')
              ? 'bg-blue-600 text-white font-bold shadow-sm'
              : 'text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
          title="อัปโหลดไฟล์ PDF (Auto-fill)"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <UploadCloud className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">อัปโหลดไฟล์ PDF</span>}
          </div>
          {!isSidebarCollapsed && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-300 font-medium">
              Auto-fill
            </span>
          )}
        </button>

        {/* 4: บันทึกข้อมูลเอง */}
        <button
          type="button"
          onClick={() => onSelectModule('manual_entry')}
          className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-150 cursor-pointer ${
            isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
          } ${
            isCurrent('manual_entry')
              ? 'bg-blue-600 text-white font-bold shadow-sm'
              : 'text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
          title="บันทึกข้อมูลเอง (กรอกฟอร์ม)"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <FileEdit className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">บันทึกข้อมูลเอง</span>}
          </div>
        </button>

        <div className="pt-2 pb-1">
          {!isSidebarCollapsed && (
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1">
              งานเอกสาร & รายงาน
            </div>
          )}
        </div>

        {/* แฟ้มเอกสารรายปี */}
        <button
          type="button"
          onClick={() => onSelectModule('archive')}
          className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-150 cursor-pointer ${
            isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
          } ${
            isCurrent('archive')
              ? 'bg-blue-600 text-white font-bold shadow-sm'
              : 'text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
          title="แฟ้มเอกสารรายปี"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <FolderOpen className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">แฟ้มเอกสารรายปี</span>}
          </div>
        </button>

        {/* 7: พิมพ์เอกสารราชการ */}
        <button
          type="button"
          onClick={() => onSelectModule('print')}
          className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-150 cursor-pointer ${
            isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
          } ${
            isCurrent('print')
              ? 'bg-blue-600 text-white font-bold shadow-sm'
              : 'text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
          title="พิมพ์เอกสารราชการ (ใบอนุญาต, ใบเสร็จ, บัตร, ป้าย)"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Printer className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">พิมพ์เอกสารราชการ</span>}
          </div>
        </button>


      </div>

      {/* Bottom: Officer Profile Card & Logout */}
      <div className="p-3 border-t border-slate-800 bg-[#0a1526] text-xs">
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-2 min-w-0 text-left hover:opacity-85 transition-opacity cursor-pointer group"
            title="ข้อมูลประจำตัวเจ้าหน้าที่"
          >
            {currentOfficer.avatarUrl ? (
              <img
                src={currentOfficer.avatarUrl}
                alt={currentOfficer.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
              />
            ) : (
              <div
                className={`w-8 h-8 rounded-full ${
                  currentOfficer.avatarColor || 'bg-blue-600'
                } text-white flex items-center justify-center font-bold text-xs shrink-0`}
              >
                <User className="w-4 h-4" />
              </div>
            )}
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <div className="font-bold text-white truncate text-[11px] group-hover:text-blue-300">
                  {currentOfficer.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {currentOfficer.position}
                </div>
              </div>
            )}
          </button>

          {!isSidebarCollapsed && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={onOpenSettings}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                title="ตั้งค่าระบบ"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onOpenAuditLog}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                title="ประวัติราชการ (Audit)"
              >
                <History className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {!isSidebarCollapsed && (
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" />
              <LiveClock className="text-slate-300 font-semibold" />
            </span>
            <span className="text-[9px] text-slate-500">อบต.โป่งน้ำร้อน</span>
          </div>
        )}
      </div>
    </aside>
  );
};
