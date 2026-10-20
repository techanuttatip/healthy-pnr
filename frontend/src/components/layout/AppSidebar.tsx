import React, { useState } from 'react';
import {
  UploadCloud,
  Printer,
  Settings,
  History,
  User,
  LogOut,
  Clock,
  FileEdit,
  Folder,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  Home,
  FileText,
  MapPin
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
  { id: 'all', label: 'ทั้งหมดทุกหมวด', dot: 'bg-white' },
  { id: 'food_notice', label: 'อาหาร ≤ 200 ตร.ม. (นจ.)', dot: 'bg-[#22c55e]' },
  { id: 'food_license', label: 'อาหาร > 200 ตร.ม. (บทอ.)', dot: 'bg-[#06b6d4]' },
  { id: 'hazardous', label: 'อันตรายต่อสุขภาพ (บทส.)', dot: 'bg-[#f59e0b]' },
  { id: 'market', label: 'ตลาดสด / นัด (อส.)', dot: 'bg-[#ec4899]' },
  { id: 'public_sale', label: 'จำหน่ายที่สาธารณะ (นส.)', dot: 'bg-[#a855f7]' },
  { id: 'waste_sewage', label: 'สิ่งปฏิกูล / มูลฝอย (ปป.)', dot: 'bg-[#14b8a6]' }
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
  selectedCategory = 'all',
  onSelectCategory,
  availableYears = [2570, 2569, 2568, 2567],
  selectedYear = 2569,
  onSelectYear
}) => {
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(true);
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
        isSidebarCollapsed ? 'w-16' : 'w-[280px]'
      } shrink-0 h-full relative overflow-hidden text-white flex flex-col justify-between z-30 transition-all duration-200 print:hidden shadow-2xl border-r border-indigo-950/80 bg-[#070d24]`}
    >
      {/* ๑. Top Header: Scenic Mountain Banner with Golden Emblem Logo & Rainbow Accent */}
      <div className="relative z-20 shrink-0 border-b border-indigo-900/60 bg-[#091129]">
        <div className="relative h-20 w-full overflow-hidden">
          {/* Mountain & nature background */}
          <img
            src="/pnr_landscape_bg.png"
            alt="ทัศนียภาพ อบต.โป่งน้ำร้อน"
            className="w-full h-full object-cover object-center filter brightness-95 contrast-110"
          />
          {/* Deep oceanic sapphire gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#060c20]/95 via-[#0b153b]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070d24] via-transparent to-black/30" />

          {/* Header Content */}
          <div className="absolute inset-0 p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Golden Ring Emblem Logo */}
              <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-amber-300 via-amber-500 to-yellow-200 shadow-lg shadow-amber-500/30 shrink-0 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-white p-0.5 overflow-hidden flex items-center justify-center">
                  <img
                    src="/pnr_logo.png"
                    alt="ตราสัญลักษณ์ อบต.โป่งน้ำร้อน"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <div className="font-extrabold text-[13px] text-white tracking-tight truncate leading-tight drop-shadow-md">
                    ระบบสารบรรณ & ทะเบียน
                  </div>
                  <div className="text-[11px] text-cyan-200 font-semibold truncate leading-tight drop-shadow-sm">
                    อบต.โป่งน้ำร้อน อ.ฝาง
                  </div>
                  <div className="text-[8.5px] text-slate-300 truncate font-medium mt-0.5 tracking-tight flex items-center gap-1 opacity-90">
                    <span>บริการประชาชน</span>
                    <span>•</span>
                    <span>โปร่งใส</span>
                    <span>•</span>
                    <span>ใส่ใจ</span>
                    <span>•</span>
                    <span>เทคโนโลยี</span>
                  </div>
                </div>
              )}
            </div>

            {/* Collapse / Expand Toggle Button */}
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-6 h-6 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer shrink-0 shadow-md"
              title={isSidebarCollapsed ? 'ขยายแถบเมนู' : 'พับเก็บแถบเมนู'}
            >
              {isSidebarCollapsed ? (
                <ChevronsRight className="w-3.5 h-3.5 text-cyan-300" />
              ) : (
                <ChevronsLeft className="w-3.5 h-3.5 text-slate-200" />
              )}
            </button>
          </div>
        </div>

        {/* Luminous Rainbow Accent Separator (Magenta -> Purple -> Blue -> Cyan -> Yellow) */}
        <div className="h-[2px] w-full bg-gradient-to-r from-pink-500 via-purple-500 via-blue-500 via-cyan-400 to-amber-300 shadow-sm shadow-cyan-500/40" />
      </div>

      {/* ๒. Middle: Navigation Items */}
      <div className="relative z-10 flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
        {/* Menu 1: หน้าหลัก (Home) */}
        <button
          type="button"
          onClick={() => onSelectModule('dashboard')}
          className={`w-full relative group rounded-2xl p-2.5 flex items-center transition-all duration-150 cursor-pointer ${
            isSidebarCollapsed ? 'justify-center' : 'justify-between'
          } ${
            isCurrent('dashboard')
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-950/60 border border-white/25'
              : 'text-slate-200 hover:text-white hover:bg-white/[0.08] border border-transparent'
          }`}
          title="หน้าหลัก"
        >
          {/* Active Cyan-Pink Glow Indicator Bar on Left */}
          {isCurrent('dashboard') && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-r-full bg-gradient-to-b from-cyan-400 to-pink-500 shadow-sm shadow-cyan-400/80" />
          )}

          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 p-0.5 shadow-md flex items-center justify-center text-white shrink-0">
              <Home className="w-4 h-4" />
            </div>
            {!isSidebarCollapsed && <span className="truncate font-semibold text-xs">หน้าหลัก</span>}
          </div>
          {!isSidebarCollapsed && (
            <ChevronRight className={`w-4 h-4 ${isCurrent('dashboard') ? 'text-white' : 'text-slate-400'} shrink-0`} />
          )}
        </button>

        {/* Menu 2: งานสารบรรณ & สถิติ */}
        <button
          type="button"
          onClick={() => onSelectModule('table')}
          className={`w-full relative group rounded-2xl p-2.5 flex items-center transition-all duration-150 cursor-pointer ${
            isSidebarCollapsed ? 'justify-center' : 'justify-between'
          } ${
            isCurrent('table')
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-950/60 border border-white/25'
              : 'text-slate-200 hover:text-white hover:bg-white/[0.08] border border-transparent'
          }`}
          title="งานสารบรรณ & สถิติ"
        >
          {isCurrent('table') && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-r-full bg-gradient-to-b from-cyan-400 to-pink-500 shadow-sm shadow-cyan-400/80" />
          )}

          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 shadow-md flex items-center justify-center text-white shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            {!isSidebarCollapsed && <span className="truncate font-semibold text-xs">งานสารบรรณ & สถิติ</span>}
          </div>
          {!isSidebarCollapsed && (
            <ChevronRight className={`w-4 h-4 ${isCurrent('table') ? 'text-white' : 'text-slate-400'} shrink-0`} />
          )}
        </button>

        {/* Menu 3: ทะเบียนหนังสือราชการ (ทะเบียนคำขอ + Dropdown) */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={handleDirectoryClick}
            className={`w-full relative group rounded-2xl p-2.5 flex items-center transition-all duration-150 cursor-pointer ${
              isSidebarCollapsed ? 'justify-center' : 'justify-between'
            } ${
              isCurrent('directory')
                ? 'bg-gradient-to-r from-teal-400 via-cyan-500 to-indigo-600 text-white font-extrabold shadow-lg shadow-cyan-950/60 border border-white/30'
                : 'text-slate-200 hover:text-white hover:bg-white/[0.08] border border-transparent'
            }`}
            title="ทะเบียนหนังสือราชการ"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-white shadow-md shadow-amber-500/25 shrink-0">
                <Folder className="w-5 h-5 fill-white text-amber-500" />
              </div>
              {!isSidebarCollapsed && <span className="truncate font-bold text-xs">ทะเบียนหนังสือราชการ</span>}
            </div>

            {!isSidebarCollapsed && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-6 h-6 rounded-full bg-cyan-400/40 border border-cyan-200/60 text-white font-mono text-xs font-bold flex items-center justify-center">
                  {establishmentsCount}
                </span>
                {isCategoryDropdownOpen ? (
                  <ChevronUp className="w-4 h-4 text-white" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white/80" />
                )}
              </div>
            )}
          </button>

          {/* Submenu Dropdown Container */}
          {!isSidebarCollapsed && isCategoryDropdownOpen && (
            <div className="border-2 border-indigo-500/40 rounded-2xl p-2 bg-[#0b122e]/95 backdrop-blur-md shadow-2xl space-y-1.5 animate-fadeIn">
              {/* 1. All Categories Pill */}
              <button
                type="button"
                onClick={(e) => handleCategoryClick('all', e)}
                className={`w-full rounded-xl py-2 px-3 flex items-center justify-between text-xs transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md border border-blue-400/50'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-white shrink-0" />
                  <span className="truncate">ทั้งหมดทุกหมวด</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/80 shrink-0" />
              </button>

              {/* 2. Specific Categories */}
              {CATEGORY_ITEMS.filter((c) => c.id !== 'all').map((cat) => {
                const isCatActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={(e) => handleCategoryClick(cat.id, e)}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-[11px] flex items-center justify-between transition-all cursor-pointer ${
                      isCatActive
                        ? 'bg-white/10 border border-purple-400/40 text-white font-bold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full ${cat.dot} shrink-0 shadow-xs`} />
                      <span className="truncate">{cat.label}</span>
                    </div>
                    {isCatActive && <ChevronRight className="w-3.5 h-3.5 text-purple-300 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Menu 4: แฟ้มเอกสาร */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={handleArchiveClick}
            className={`w-full relative group rounded-2xl p-2.5 flex items-center transition-all duration-150 cursor-pointer ${
              isSidebarCollapsed ? 'justify-center' : 'justify-between'
            } ${
              isCurrent('archive')
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-950/60 border border-white/25'
                : 'text-slate-200 hover:text-white hover:bg-white/[0.08] border border-transparent'
            }`}
            title="แฟ้มเอกสาร"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
                <Folder className="w-5 h-5 fill-white text-amber-500" />
              </div>
              {!isSidebarCollapsed && <span className="truncate font-semibold text-xs">แฟ้มเอกสาร</span>}
            </div>

            {!isSidebarCollapsed && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="bg-indigo-600/70 border border-indigo-400/40 text-white font-mono text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {selectedYear}
                </span>
                {isYearDropdownOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-300" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            )}
          </button>

          {/* Submenu Dropdown for Years */}
          {!isSidebarCollapsed && isYearDropdownOpen && (
            <div className="border-2 border-amber-500/40 rounded-2xl p-2 bg-[#0b122e]/95 backdrop-blur-md shadow-2xl space-y-1 animate-fadeIn">
              {availableYears.map((yr) => {
                const isYrActive = selectedYear === yr;
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={(e) => handleYearClick(yr, e)}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                      isYrActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md border border-blue-400/50'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className={`w-3.5 h-3.5 ${isYrActive ? 'text-amber-300' : 'text-slate-400'} shrink-0`} />
                      <span>แฟ้มปี พ.ศ. {yr}</span>
                    </div>
                    {isYrActive && <ChevronRight className="w-3.5 h-3.5 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 1: การรับเรื่อง & บันทึกข้อมูล */}
        <div className="pt-2">
          {!isSidebarCollapsed && (
            <div className="text-[11px] font-bold text-cyan-400 tracking-wider px-3 mb-1.5 flex items-center justify-between">
              <span>การรับเรื่อง & บันทึกข้อมูล</span>
            </div>
          )}

          {/* 1. อัปโหลดไฟล์ PDF */}
          <button
            type="button"
            onClick={() => onSelectModule('upload_pdf')}
            className={`w-full rounded-2xl p-2.5 flex items-center transition-all duration-150 cursor-pointer ${
              isSidebarCollapsed ? 'justify-center' : 'justify-between'
            } ${
              isCurrent('upload_pdf')
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-950/60 border border-white/25'
                : 'text-slate-200 hover:text-white hover:bg-white/[0.08]'
            }`}
            title="อัปโหลดไฟล์ PDF"
          >
            <div className="flex items-center gap-3 min-w-0">
              <UploadCloud className="w-5 h-5 text-cyan-300 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate text-xs font-semibold">อัปโหลดไฟล์ PDF</span>}
            </div>
            {!isSidebarCollapsed && (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold text-[10px] px-2 py-0.5 rounded-full shrink-0">
                Auto-fill
              </span>
            )}
          </button>

          {/* 2. บันทึกข้อมูลเอง */}
          <button
            type="button"
            onClick={() => onSelectModule('manual_entry')}
            className={`w-full rounded-2xl p-2.5 flex items-center transition-all duration-150 cursor-pointer ${
              isSidebarCollapsed ? 'justify-center' : 'justify-between'
            } ${
              isCurrent('manual_entry')
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-950/60 border border-white/25'
                : 'text-slate-200 hover:text-white hover:bg-white/[0.08]'
            }`}
            title="บันทึกข้อมูลเอง"
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileEdit className="w-5 h-5 text-amber-300 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate text-xs font-semibold">บันทึกข้อมูลเอง</span>}
            </div>
            {!isSidebarCollapsed && <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
          </button>
        </div>

        {/* Section 2: งานเอกสาร & รายงาน */}
        <div className="pt-2">
          {!isSidebarCollapsed && (
            <div className="text-[11px] font-bold text-cyan-400 tracking-wider px-3 mb-1.5 flex items-center justify-between">
              <span>งานเอกสาร & รายงาน</span>
            </div>
          )}

          {/* พิมพ์เอกสารราชการ */}
          <button
            type="button"
            onClick={() => onSelectModule('print')}
            className={`w-full rounded-2xl p-2.5 flex items-center transition-all duration-150 cursor-pointer ${
              isSidebarCollapsed ? 'justify-center' : 'justify-between'
            } ${
              isCurrent('print')
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-950/60 border border-white/25'
                : 'text-slate-200 hover:text-white hover:bg-white/[0.08]'
            }`}
            title="พิมพ์เอกสารราชการ"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Printer className="w-5 h-5 text-purple-300 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate text-xs font-semibold">พิมพ์เอกสารราชการ</span>}
            </div>
            {!isSidebarCollapsed && <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
          </button>
        </div>
      </div>

      {/* ๓. Bottom Area: Officer Profile Card, Clock & Radiant Lotus Ornament */}
      <div className="relative z-20 shrink-0 p-3 pt-2 border-t border-indigo-900/40 bg-[#070e28]/95 backdrop-blur-md">
        {/* Officer Profile Card */}
        <div className="border border-white/10 bg-white/[0.05] hover:bg-white/[0.09] transition-all rounded-2xl p-2.5 backdrop-blur-md shadow-xl flex items-center justify-between gap-2 mb-2">
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer group flex-1"
            title="ข้อมูลประจำตัวเจ้าหน้าที่"
          >
            {/* Avatar with Online Pulse Badge */}
            <div className="relative shrink-0">
              {currentOfficer.avatarUrl ? (
                <img
                  src={currentOfficer.avatarUrl}
                  alt={currentOfficer.name}
                  className="w-9 h-9 rounded-full object-cover border-2 border-cyan-400/60 shadow-md"
                />
              ) : (
                <div
                  className={`w-9 h-9 rounded-full ${
                    currentOfficer.avatarColor || 'bg-blue-600'
                  } text-white flex items-center justify-center font-bold text-xs border border-white/20 shadow-md`}
                >
                  <User className="w-4 h-4" />
                </div>
              )}
              {/* Online Green Pulsing Indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#070e28] shadow-sm animate-pulse" />
            </div>

            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <div className="font-bold text-white truncate text-xs group-hover:text-cyan-200 transition-colors">
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

        {/* Live Clock & Municipality Location Bar */}
        {!isSidebarCollapsed && (
          <div className="flex items-center justify-between px-1 text-[11px] text-slate-300/90 font-medium">
            <span className="flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <LiveClock className="text-white font-bold" />
            </span>
            <span className="flex items-center gap-1 text-cyan-300 text-[10.5px]">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              อบต.โป่งน้ำร้อน
            </span>
          </div>
        )}

        {/* Glowing Neon Purple & Cyan Lotus Wave Ornament at the Bottom */}
        {!isSidebarCollapsed && (
          <div className="relative w-full h-11 pointer-events-none overflow-hidden flex items-end justify-center select-none mt-1">
            {/* Ambient Neon Glow Orbs */}
            <div className="absolute bottom-0 w-36 h-10 bg-purple-600/25 rounded-full blur-xl" />
            <div className="absolute bottom-1 w-20 h-6 bg-cyan-400/20 rounded-full blur-md" />

            {/* Glowing Lotus Petals and Waves SVG */}
            <svg className="w-full h-10" viewBox="0 0 280 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.7" />
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="lotusGrad" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#f472b6" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>

              {/* Dynamic Wave Lines */}
              <path d="M 0 36 Q 70 16 140 30 T 280 26" stroke="url(#waveGrad)" strokeWidth="1.5" fill="none" opacity="0.65" />
              <path d="M 0 40 Q 80 24 140 34 T 280 32" stroke="url(#waveGrad)" strokeWidth="1.2" fill="none" opacity="0.45" />

              {/* Center Radiant Lotus Petals */}
              <g transform="translate(140, 28)">
                <path d="M 0 -14 C -2.5 -9 -4 -3 0 2 C 4 -3 2.5 -9 0 -14 Z" fill="url(#lotusGrad)" opacity="0.95" />
                <path d="M -3 -11 C -7 -7 -6 -1 -1 2 C -2 -1 -3 -6 -3 -11 Z" fill="url(#lotusGrad)" opacity="0.8" />
                <path d="M 3 -11 C 7 -7 6 -1 1 2 C 2 -1 3 -6 3 -11 Z" fill="url(#lotusGrad)" opacity="0.8" />
                <path d="M -7 -7 C -12 -4 -10 0 -2 3 C -5 0 -6 -4 -7 -7 Z" fill="url(#lotusGrad)" opacity="0.6" />
                <path d="M 7 -7 C 12 -4 10 0 2 3 C 5 0 6 -4 7 -7 Z" fill="url(#lotusGrad)" opacity="0.6" />
                <path d="M -11 -3 C -15 1 -11 3 -3 3 C -7 2 -10 0 -11 -3 Z" fill="url(#lotusGrad)" opacity="0.45" />
                <path d="M 11 -3 C 15 1 11 3 3 3 C 7 2 10 0 11 -3 Z" fill="url(#lotusGrad)" opacity="0.45" />
              </g>
            </svg>
          </div>
        )}
      </div>
    </aside>
  );
};
