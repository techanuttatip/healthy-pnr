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
  { id: 'food_notice', label: 'อาหาร ≤ 200 ตร.ม. (นจ.)', dot: 'bg-emerald-400' },
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
        isSidebarCollapsed ? 'w-16' : 'w-[255px]'
      } shrink-0 h-full bg-gradient-to-b from-[#065f46] via-[#047857] to-[#064e3b] border-r border-emerald-500/30 text-white flex flex-col justify-between z-30 transition-all duration-200 print:hidden relative shadow-2xl`}
    >
      {/* Top: Emblem, Organization Branding & Collapse Toggle */}
      <div className={`p-3.5 border-b border-emerald-500/30 bg-black/10 ${isSidebarCollapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-amber-300 bg-white shadow-md shadow-emerald-950/30 shrink-0 flex items-center justify-center p-0.5">
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
                <div className="text-[11px] text-emerald-200 font-medium truncate">
                  อบต.โป่งน้ำร้อน อ.ฝาง
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0"
            title={isSidebarCollapsed ? 'ขยายแถบเมนู (Expand)' : 'พับเก็บแถบเมนู (Collapse)'}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-amber-300" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-emerald-200" />
            )}
          </button>
        </div>
      </div>

      {/* Middle: Navigation Modules */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 no-scrollbar">
        {/* 1: ภาพรวมระบบ & สถิติ (Dashboard) */}
        <button
          type="button"
          onClick={() => onSelectModule('dashboard')}
          className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-150 cursor-pointer ${
            isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
          } ${
            isCurrent('dashboard')
              ? 'bg-white text-emerald-950 font-bold shadow-md shadow-emerald-950/30 border border-white/60'
              : 'text-emerald-100 hover:bg-white/15 hover:text-white'
          }`}
          title="ภาพรวมงานทะเบียน & สถิติสุขาภิบาล"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <LayoutDashboard className={`w-4 h-4 shrink-0 ${isCurrent('dashboard') ? 'text-emerald-700' : 'text-amber-300'}`} />
            {!isSidebarCollapsed && <span className="truncate">ภาพรวมระบบ & สถิติ</span>}
          </div>
        </button>

        {/* 2: ทะเบียนคำขอ (พร้อม Dropdown หมวดหมู่ด้านล่าง) */}
        <div className="space-y-1">
          <div
            onClick={() => onSelectModule('directory')}
            className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-150 cursor-pointer ${
              isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
            } ${
              isCurrent('directory') || isCurrent('table')
                ? 'bg-white text-emerald-950 font-bold shadow-md shadow-emerald-950/30 border border-white/60'
                : 'text-emerald-100 hover:bg-white/15 hover:text-white'
            }`}
            title="ทะเบียนคำขอ (คลิกเพื่อเปิดหน้าทะเบียน)"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Store className={`w-4 h-4 shrink-0 ${isCurrent('directory') || isCurrent('table') ? 'text-emerald-700' : 'text-emerald-300'}`} />
              {!isSidebarCollapsed && <span className="truncate">ทะเบียนคำขอ</span>}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full font-bold ${
                  isCurrent('directory') || isCurrent('table')
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-black/25 text-emerald-100 border border-emerald-400/30'
                }`}>
                  {establishmentsCount}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                  }}
                  className={`p-1 rounded-md transition-colors ${
                    isCurrent('directory') || isCurrent('table')
                      ? 'text-emerald-800 hover:bg-emerald-100'
                      : 'text-emerald-200 hover:text-white hover:bg-white/20'
                  }`}
                  title={isCategoryDropdownOpen ? 'ซ่อนหมวดหมู่' : 'แสดงหมวดหมู่'}
                >
                  {isCategoryDropdownOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Sub-menu: Category Dropdown List (Only visible when explicitly toggled open) */}
          {!isSidebarCollapsed && isCategoryDropdownOpen && (
            <div className="pl-5 pr-1 space-y-0.5 py-1.5 animate-fadeIn border-l-2 border-emerald-300/60 ml-4 my-1 bg-black/15 rounded-r-xl">
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
                        ? 'bg-white/25 text-white font-bold border border-white/40 shadow-xs'
                        : 'text-emerald-100/90 hover:text-white hover:bg-white/10'
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

        {/* 3: แฟ้มเอกสาร (พร้อม Dropdown รายปีด้านล่าง) */}
        <div className="space-y-1">
          <div
            onClick={() => onSelectModule('archive')}
            className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-150 cursor-pointer ${
              isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
            } ${
              isCurrent('archive')
                ? 'bg-white text-emerald-950 font-bold shadow-md shadow-emerald-950/30 border border-white/60'
                : 'text-emerald-100 hover:bg-white/15 hover:text-white'
            }`}
            title="แฟ้มเอกสาร (คลิกเพื่อเปิดหน้าแฟ้ม)"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <FolderOpen className={`w-4 h-4 shrink-0 ${isCurrent('archive') ? 'text-emerald-700' : 'text-amber-300'}`} />
              {!isSidebarCollapsed && <span className="truncate">แฟ้มเอกสาร</span>}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full font-bold ${
                  isCurrent('archive')
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-black/25 text-emerald-100 border border-emerald-400/30'
                }`}>
                  {selectedYear}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsYearDropdownOpen(!isYearDropdownOpen);
                  }}
                  className={`p-1 rounded-md transition-colors ${
                    isCurrent('archive')
                      ? 'text-emerald-800 hover:bg-emerald-100'
                      : 'text-emerald-200 hover:text-white hover:bg-white/20'
                  }`}
                  title={isYearDropdownOpen ? 'ซ่อนปี' : 'แสดงปี'}
                >
                  {isYearDropdownOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Sub-menu: Years Dropdown List (Only visible when explicitly toggled open) */}
          {!isSidebarCollapsed && isYearDropdownOpen && (
            <div className="pl-5 pr-1 space-y-0.5 py-1.5 animate-fadeIn border-l-2 border-emerald-300/60 ml-4 my-1 bg-black/15 rounded-r-xl">
              {availableYears.map((yr) => {
                const isActiveYr = isCurrent('archive') && selectedYear === yr;
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={(e) => handleYearClick(yr, e)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-2 transition-all cursor-pointer ${
                      isActiveYr
                        ? 'bg-white/25 text-white font-bold border border-white/40 shadow-xs'
                        : 'text-emerald-100/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Folder className={`w-3 h-3 ${isActiveYr ? 'text-amber-300' : 'text-emerald-300'} shrink-0`} />
                    <span>แฟ้มปี พ.ศ. {yr}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-2 pb-1">
          {!isSidebarCollapsed && (
            <div className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider px-3 mb-1">
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
              ? 'bg-white text-emerald-950 font-bold shadow-md shadow-emerald-950/30 border border-white/60'
              : 'text-emerald-100 hover:bg-white/15 hover:text-white'
          }`}
          title="อัปโหลดไฟล์ PDF (Auto-fill)"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <UploadCloud className={`w-4 h-4 shrink-0 ${isCurrent('upload_pdf') ? 'text-emerald-700' : 'text-cyan-300'}`} />
            {!isSidebarCollapsed && <span className="truncate">อัปโหลดไฟล์ PDF</span>}
          </div>
          {!isSidebarCollapsed && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
              isCurrent('upload_pdf')
                ? 'bg-emerald-100 text-emerald-900 font-bold'
                : 'bg-black/25 text-cyan-200 border border-cyan-400/30'
            }`}>
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
              ? 'bg-white text-emerald-950 font-bold shadow-md shadow-emerald-950/30 border border-white/60'
              : 'text-emerald-100 hover:bg-white/15 hover:text-white'
          }`}
          title="บันทึกข้อมูลเอง (กรอกฟอร์ม)"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <FileEdit className={`w-4 h-4 shrink-0 ${isCurrent('manual_entry') ? 'text-emerald-700' : 'text-amber-300'}`} />
            {!isSidebarCollapsed && <span className="truncate">บันทึกข้อมูลเอง</span>}
          </div>
        </button>

        <div className="pt-2 pb-1">
          {!isSidebarCollapsed && (
            <div className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider px-3 mb-1">
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
              ? 'bg-white text-emerald-950 font-bold shadow-md shadow-emerald-950/30 border border-white/60'
              : 'text-emerald-100 hover:bg-white/15 hover:text-white'
          }`}
          title="พิมพ์เอกสารราชการ (ใบอนุญาต, ใบเสร็จ, บัตร, ป้าย)"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Printer className={`w-4 h-4 shrink-0 ${isCurrent('print') ? 'text-emerald-700' : 'text-purple-300'}`} />
            {!isSidebarCollapsed && <span className="truncate">พิมพ์เอกสารราชการ</span>}
          </div>
        </button>
      </div>

      {/* Bottom: Officer Profile Card & Logout */}
      <div className="p-3 border-t border-emerald-500/30 bg-black/20 backdrop-blur-md text-xs">
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
                className="w-8 h-8 rounded-full object-cover border border-emerald-300 shrink-0"
              />
            ) : (
              <div
                className={`w-8 h-8 rounded-full ${
                  currentOfficer.avatarColor || 'bg-emerald-600'
                } text-white flex items-center justify-center font-bold text-xs shrink-0 border border-white/20`}
              >
                <User className="w-4 h-4" />
              </div>
            )}
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <div className="font-bold text-white truncate text-[11px] group-hover:text-amber-200">
                  {currentOfficer.name}
                </div>
                <div className="text-[10px] text-emerald-200 truncate">
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
                className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/15 cursor-pointer"
                title="ตั้งค่าระบบ"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onOpenAuditLog}
                className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/15 cursor-pointer"
                title="ประวัติราชการ (Audit)"
              >
                <History className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="p-1 rounded-lg text-emerald-200 hover:text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {!isSidebarCollapsed && (
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-emerald-500/30 text-[10px] text-emerald-200/80 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-300" />
              <LiveClock className="text-white font-semibold" />
            </span>
            <span className="text-[9px] text-emerald-200">อบต.โป่งน้ำร้อน</span>
          </div>
        )}
      </div>
    </aside>
  );
};
