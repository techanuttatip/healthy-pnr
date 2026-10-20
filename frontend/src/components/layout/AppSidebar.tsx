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
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(true);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(true);

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
      } shrink-0 h-full bg-gradient-to-b from-[#091124] via-[#0f1b38] to-[#070c1a] border-r border-slate-700/60 text-white flex flex-col justify-between z-30 transition-all duration-200 print:hidden relative shadow-2xl`}
    >
      {/* Top: Emblem, Organization Branding & Collapse Toggle */}
      <div className={`p-3.5 border-b border-slate-800/80 bg-white/[0.02] ${isSidebarCollapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-amber-400/90 bg-white shadow-md shadow-amber-500/20 shrink-0 flex items-center justify-center p-0.5">
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
        {/* 1: ภาพรวมระบบ & สถิติ (Dashboard) */}
        <button
          type="button"
          onClick={() => onSelectModule('dashboard')}
          className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-150 cursor-pointer ${
            isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
          } ${
            isCurrent('dashboard')
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-900/50 border border-blue-400/30'
              : 'text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
          title="ภาพรวมงานทะเบียน & สถิติสุขาภิบาล"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <LayoutDashboard className="w-4 h-4 text-amber-400 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">ภาพรวมระบบ & สถิติ</span>}
          </div>
        </button>

        {/* 2: ทะเบียนคำขอ (พร้อม Dropdown หมวดหมู่ด้านล่าง) */}
        <div className="space-y-1">
          <div
            onClick={() => {
              if (isSidebarCollapsed) {
                onSelectModule('directory');
              } else {
                onSelectModule('directory');
                setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
              }
            }}
            className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-150 cursor-pointer ${
              isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
            } ${
              isCurrent('directory') || isCurrent('table')
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-900/50 border border-blue-400/30'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="ทะเบียนคำขอ (คลิกเพื่อดูหมวดหมู่)"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Store className="w-4 h-4 text-emerald-400 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">ทะเบียนคำขอ</span>}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full font-bold bg-white/20 text-white">
                  {establishmentsCount}
                </span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                  }}
                  className="p-0.5 rounded text-slate-300 hover:text-white hover:bg-white/10"
                >
                  {isCategoryDropdownOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Sub-menu: Category Dropdown List */}
          {!isSidebarCollapsed && isCategoryDropdownOpen && (
            <div className="pl-6 pr-1 space-y-0.5 py-1 animate-fadeIn border-l-2 border-blue-500/30 ml-4 my-1">
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
                        ? 'bg-blue-500/25 text-white font-bold border border-blue-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
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
            onClick={() => {
              if (isSidebarCollapsed) {
                onSelectModule('archive');
              } else {
                onSelectModule('archive');
                setIsYearDropdownOpen(!isYearDropdownOpen);
              }
            }}
            className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-150 cursor-pointer ${
              isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
            } ${
              isCurrent('archive')
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-900/50 border border-emerald-400/30'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="แฟ้มเอกสาร (คลิกเพื่อเลือกปีงบประมาณ)"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">แฟ้มเอกสาร</span>}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full font-bold bg-white/20 text-white">
                  {selectedYear}
                </span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsYearDropdownOpen(!isYearDropdownOpen);
                  }}
                  className="p-0.5 rounded text-slate-300 hover:text-white hover:bg-white/10"
                >
                  {isYearDropdownOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Sub-menu: Years Dropdown List */}
          {!isSidebarCollapsed && isYearDropdownOpen && (
            <div className="pl-6 pr-1 space-y-0.5 py-1 animate-fadeIn border-l-2 border-emerald-500/30 ml-4 my-1">
              {availableYears.map((yr) => {
                const isActiveYr = isCurrent('archive') && selectedYear === yr;
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={(e) => handleYearClick(yr, e)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-2 transition-all cursor-pointer ${
                      isActiveYr
                        ? 'bg-emerald-500/25 text-emerald-200 font-bold border border-emerald-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Folder className={`w-3 h-3 ${isActiveYr ? 'text-emerald-300' : 'text-slate-500'} shrink-0`} />
                    <span>แฟ้มปี พ.ศ. {yr}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-2 pb-1">
          {!isSidebarCollapsed && (
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1">
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
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-900/50 border border-blue-400/30'
              : 'text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
          title="อัปโหลดไฟล์ PDF (Auto-fill)"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <UploadCloud className="w-4 h-4 shrink-0 text-cyan-400" />
            {!isSidebarCollapsed && <span className="truncate">อัปโหลดไฟล์ PDF</span>}
          </div>
          {!isSidebarCollapsed && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-300 font-medium">
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
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-900/50 border border-blue-400/30'
              : 'text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
          title="บันทึกข้อมูลเอง (กรอกฟอร์ม)"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <FileEdit className="w-4 h-4 shrink-0 text-amber-400" />
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

        {/* 6: พิมพ์เอกสารราชการ */}
        <button
          type="button"
          onClick={() => onSelectModule('print')}
          className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center transition-all duration-150 cursor-pointer ${
            isSidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3'
          } ${
            isCurrent('print')
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-900/50 border border-blue-400/30'
              : 'text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
          title="พิมพ์เอกสารราชการ (ใบอนุญาต, ใบเสร็จ, บัตร, ป้าย)"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Printer className="w-4 h-4 shrink-0 text-purple-400" />
            {!isSidebarCollapsed && <span className="truncate">พิมพ์เอกสารราชการ</span>}
          </div>
        </button>
      </div>

      {/* Bottom: Officer Profile Card & Logout */}
      <div className="p-3 border-t border-slate-700/60 bg-black/35 backdrop-blur-md text-xs">
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
                className="w-8 h-8 rounded-full object-cover border border-slate-600 shrink-0"
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
