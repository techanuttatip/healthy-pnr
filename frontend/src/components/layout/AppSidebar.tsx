import React, { useState } from 'react';
import {
  UploadCloud,
  PanelLeftClose,
  PanelLeftOpen,
  Building2,
  MapPin,
  Printer,
  Settings,
  History,
  User,
  LogOut,
  Clock,
  FileEdit,
  Smartphone,
  QrCode,
  LayoutDashboard,
  Store,
  FolderOpen,
  Folder,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import type { OfficerAccount } from '../../services/sanitationDataService';
import { LiveClock } from './LiveClock';

export type AppModuleType =
  | 'dashboard'
  | 'directory'
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
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  availableYears?: number[];
  selectedYear?: number;
  onSelectYear?: (year: number) => void;
}

const CATEGORY_ITEMS = [
  { id: 'all', label: 'ทั้งหมดทุกหมวด', dot: 'bg-slate-300' },
  { id: 'food_notice', label: 'อาหาร ≤ 200 ตร.ม. (นจ.)', dot: 'bg-teal-400' },
  { id: 'food_license', label: 'อาหาร > 200 ตร.ม. (บทอ.)', dot: 'bg-blue-400' },
  { id: 'hazardous', label: 'อันตรายต่อสุขภาพ (บทส.)', dot: 'bg-amber-400' },
  { id: 'market', label: 'ตลาดสด / นัด (อส.)', dot: 'bg-purple-400' },
  { id: 'public_sale', label: 'จำหน่ายที่สาธารณะ (นส.)', dot: 'bg-rose-400' },
  { id: 'waste_sewage', label: 'สิ่งปฏิกูล / มูลฝอย (ปป.)', dot: 'bg-indigo-400' }
];

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
  selectedCategory = 'all',
  onSelectCategory,
  availableYears = [2570, 2569, 2568, 2567],
  selectedYear = 2569,
  onSelectYear
}) => {
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  const isCurrent = (mod: AppModuleType) => {
    if (mod === 'upload_pdf') return activeModule === 'upload_pdf' || activeModule === 'intake';
    return activeModule === mod;
  };

  const handleDirectoryClick = () => {
    onSelectModule('directory');
    setIsCategoryDropdownOpen((prev) => !prev);
    setIsYearDropdownOpen(false);
  };

  const handleArchiveClick = () => {
    onSelectModule('archive');
    setIsYearDropdownOpen((prev) => !prev);
    setIsCategoryDropdownOpen(false);
  };

  const handleCategoryClick = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
    onSelectModule('directory');
  };

  const handleYearClick = (year: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectYear) {
      onSelectYear(year);
    }
    onSelectModule('archive');
  };

  return (
    <aside
      className={`${
        isSidebarCollapsed ? 'w-16' : 'w-[260px]'
      } shrink-0 h-full relative overflow-hidden text-white flex flex-col justify-between z-30 transition-all duration-200 print:hidden shadow-2xl border-r border-white/10`}
    >
      {/* ๑. Scenic Hot Springs / Pong Nam Ron Landscape Background with Frosted Glass Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <img
          src="/pnr_landscape_bg.png"
          alt="ทัศนียภาพ อบต.โป่งน้ำร้อน"
          className="w-full h-full object-cover object-center scale-105 opacity-55 filter brightness-95 saturate-125"
        />
        {/* Deep Sapphire & Royal Slate Frosted Glass Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-indigo-950/75 to-blue-950/85 backdrop-blur-md" />
        {/* Subtle glass reflection sheen */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-blue-400/10 pointer-events-none" />
        {/* Luminous Ambient Glow Orbs */}
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-blue-500/25 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-10 w-48 h-48 bg-indigo-500/25 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 left-5 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl" />
      </div>

      {/* ๒. Top: Emblem, Organization Branding & Collapse Toggle */}
      <div className={`relative z-10 p-3.5 border-b border-white/10 bg-white/[0.04] backdrop-blur-md ${isSidebarCollapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-amber-300/90 bg-white/95 shadow-md shadow-blue-950/40 shrink-0 flex items-center justify-center p-0.5">
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
                <div className="text-[11px] text-blue-200 font-medium truncate">
                  อบต.โป่งน้ำร้อน อ.ฝาง
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title={isSidebarCollapsed ? 'ขยายแถบเมนู (Expand)' : 'พับเก็บแถบเมนู (Collapse)'}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-blue-300" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-slate-300" />
            )}
          </button>
        </div>
      </div>

      {/* ๓. Middle: Navigation Modules */}
      <div className="relative z-10 flex-1 overflow-y-auto p-2.5 space-y-1.5 no-scrollbar">
        {/* 1: ภาพรวมระบบ & สถิติ (Dashboard) */}
        <button
          type="button"
          onClick={() => onSelectModule('dashboard')}
          className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-150 cursor-pointer ${
            isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
          } ${
            isCurrent('dashboard')
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold shadow-lg shadow-blue-900/40 border border-white/25 backdrop-blur-md'
              : 'text-slate-200 hover:bg-white/10 hover:text-white backdrop-blur-xs'
          }`}
          title="ภาพรวมงานทะเบียน & สถิติสุขาภิบาล"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <LayoutDashboard className="w-4 h-4 shrink-0 text-amber-300" />
            {!isSidebarCollapsed && <span className="truncate">ภาพรวมระบบ & สถิติ</span>}
          </div>
        </button>

        {/* 2: ทะเบียนคำขอ (คลิกแล้วกาง Dropdown ทันที) */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={handleDirectoryClick}
            className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-150 cursor-pointer ${
              isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
            } ${
              isCurrent('directory') || isCurrent('table')
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold shadow-lg shadow-blue-900/40 border border-white/25 backdrop-blur-md'
                : 'text-slate-200 hover:bg-white/10 hover:text-white backdrop-blur-xs'
            }`}
            title="ทะเบียนคำขอ (คลิกเพื่อเปิดหน้าทะเบียนและเลือกหมวด)"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Store className="w-4 h-4 shrink-0 text-cyan-300" />
              {!isSidebarCollapsed && <span className="truncate">ทะเบียนคำขอ</span>}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full font-bold bg-white/20 text-white border border-white/20">
                  {establishmentsCount}
                </span>
                <span
                  className={`p-0.5 rounded text-slate-300 hover:text-white transition-transform duration-200 ${
                    isCategoryDropdownOpen ? 'rotate-180' : ''
                  }`}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </span>
              </div>
            )}
          </button>

          {/* Sub-menu: Category Dropdown List */}
          {!isSidebarCollapsed && isCategoryDropdownOpen && (
            <div className="pl-4 pr-1 space-y-0.5 py-1.5 animate-fadeIn border-l-2 border-cyan-400/60 ml-4 my-1 bg-slate-900/70 backdrop-blur-xl rounded-r-xl border-y border-r border-white/10 shadow-lg">
              {CATEGORY_ITEMS.map((cat) => {
                const isActiveCat =
                  (isCurrent('directory') || isCurrent('table')) && selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={(e) => handleCategoryClick(cat.id, e)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-2 transition-all cursor-pointer ${
                      isActiveCat
                        ? 'bg-gradient-to-r from-blue-600/80 to-indigo-600/80 text-white font-bold border border-blue-400/50 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cat.dot} shrink-0`} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3: แฟ้มเอกสาร (คลิกแล้วกาง Dropdown ทันที) */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={handleArchiveClick}
            className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-150 cursor-pointer ${
              isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
            } ${
              isCurrent('archive')
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold shadow-lg shadow-blue-900/40 border border-white/25 backdrop-blur-md'
                : 'text-slate-200 hover:bg-white/10 hover:text-white backdrop-blur-xs'
            }`}
            title="แฟ้มเอกสาร (คลิกเพื่อเปิดหน้าแฟ้มและเลือกปี)"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <FolderOpen className="w-4 h-4 shrink-0 text-amber-300" />
              {!isSidebarCollapsed && <span className="truncate">แฟ้มเอกสาร</span>}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full font-bold bg-white/20 text-white border border-white/20">
                  {selectedYear}
                </span>
                <span
                  className={`p-0.5 rounded text-slate-300 hover:text-white transition-transform duration-200 ${
                    isYearDropdownOpen ? 'rotate-180' : ''
                  }`}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </span>
              </div>
            )}
          </button>

          {/* Sub-menu: Years Dropdown List */}
          {!isSidebarCollapsed && isYearDropdownOpen && (
            <div className="pl-4 pr-1 space-y-0.5 py-1.5 animate-fadeIn border-l-2 border-amber-400/60 ml-4 my-1 bg-slate-900/70 backdrop-blur-xl rounded-r-xl border-y border-r border-white/10 shadow-lg">
              {availableYears.map((yr) => {
                const isActiveYr = isCurrent('archive') && selectedYear === yr;
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={(e) => handleYearClick(yr, e)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-2 transition-all cursor-pointer ${
                      isActiveYr
                        ? 'bg-gradient-to-r from-blue-600/80 to-indigo-600/80 text-white font-bold border border-blue-400/50 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Folder className={`w-3 h-3 ${isActiveYr ? 'text-amber-300' : 'text-slate-400'} shrink-0`} />
                    <span>แฟ้มปี พ.ศ. {yr}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-2 pb-1">
          {!isSidebarCollapsed && (
            <div className="text-[10px] font-bold text-indigo-300/90 uppercase tracking-wider px-3 mb-1 font-mono">
              การรับเรื่อง & บันทึกข้อมูล
            </div>
          )}
        </div>

        {/* 4: อัปโหลดไฟล์ PDF */}
        <button
          type="button"
          onClick={() => onSelectModule('upload_pdf')}
          className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-150 cursor-pointer ${
            isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
          } ${
            isCurrent('upload_pdf')
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold shadow-lg shadow-blue-900/40 border border-white/25 backdrop-blur-md'
              : 'text-slate-200 hover:bg-white/10 hover:text-white backdrop-blur-xs'
          }`}
          title="อัปโหลดไฟล์ PDF (Auto-fill)"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <UploadCloud className="w-4 h-4 shrink-0 text-cyan-300" />
            {!isSidebarCollapsed && <span className="truncate">อัปโหลดไฟล์ PDF</span>}
          </div>
          {!isSidebarCollapsed && (
            <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
              Auto-fill
            </span>
          )}
        </button>

        {/* 5: บันทึกข้อมูลเอง */}
        <button
          type="button"
          onClick={() => onSelectModule('manual_entry')}
          className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-150 cursor-pointer ${
            isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
          } ${
            isCurrent('manual_entry')
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold shadow-lg shadow-blue-900/40 border border-white/25 backdrop-blur-md'
              : 'text-slate-200 hover:bg-white/10 hover:text-white backdrop-blur-xs'
          }`}
          title="บันทึกข้อมูลเอง (กรอกฟอร์ม)"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <FileEdit className="w-4 h-4 shrink-0 text-amber-300" />
            {!isSidebarCollapsed && <span className="truncate">บันทึกข้อมูลเอง</span>}
          </div>
        </button>

        <div className="pt-2 pb-1">
          {!isSidebarCollapsed && (
            <div className="text-[10px] font-bold text-indigo-300/90 uppercase tracking-wider px-3 mb-1 font-mono">
              งานเอกสาร & รายงาน
            </div>
          )}
        </div>

        {/* 6: พิมพ์เอกสารราชการ */}
        <button
          type="button"
          onClick={() => onSelectModule('print')}
          className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-150 cursor-pointer ${
            isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
          } ${
            isCurrent('print')
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold shadow-lg shadow-blue-900/40 border border-white/25 backdrop-blur-md'
              : 'text-slate-200 hover:bg-white/10 hover:text-white backdrop-blur-xs'
          }`}
          title="พิมพ์เอกสารราชการ (ใบอนุญาต, ใบเสร็จ, บัตร, ป้าย)"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Printer className="w-4 h-4 shrink-0 text-violet-300" />
            {!isSidebarCollapsed && <span className="truncate">พิมพ์เอกสารราชการ</span>}
          </div>
        </button>
      </div>

      {/* ๔. Bottom: Officer Profile Card & Logout */}
      <div className="relative z-10 p-3 border-t border-white/10 bg-white/[0.04] backdrop-blur-md text-xs">
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-2 min-w-0 text-left hover:opacity-90 transition-opacity cursor-pointer group"
            title="ข้อมูลประจำตัวเจ้าหน้าที่"
          >
            {currentOfficer.avatarUrl ? (
              <img
                src={currentOfficer.avatarUrl}
                alt={currentOfficer.name}
                className="w-8 h-8 rounded-full object-cover border border-blue-300/60 shadow-xs shrink-0"
              />
            ) : (
              <div
                className={`w-8 h-8 rounded-full ${
                  currentOfficer.avatarColor || 'bg-blue-600'
                } text-white flex items-center justify-center font-bold text-xs shrink-0 border border-white/20`}
              >
                <User className="w-4 h-4" />
              </div>
            )}
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <div className="font-bold text-white truncate text-[11px] group-hover:text-blue-200">
                  {currentOfficer.name}
                </div>
                <div className="text-[10px] text-blue-200/80 truncate">
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
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/15 cursor-pointer"
                title="ตั้งค่าระบบ"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onOpenAuditLog}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/15 cursor-pointer"
                title="ประวัติราชการ (Audit)"
              >
                <History className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="p-1 rounded-lg text-slate-300 hover:text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {!isSidebarCollapsed && (
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/10 text-[10px] text-slate-300/80 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-300" />
              <LiveClock className="text-white font-semibold" />
            </span>
            <span className="text-[9px] text-blue-300">อบต.โป่งน้ำร้อน</span>
          </div>
        )}
      </div>
    </aside>
  );
};
