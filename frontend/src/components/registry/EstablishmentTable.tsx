import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  Printer,
  ClipboardCheck,
  MapPin,
  FileText,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Receipt,
  Contact,
  BellRing,
  Award,
  ChevronDown,
  Warehouse,
  FolderOpen,
  Trash2,
  Calendar,
  FileSpreadsheet,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';
import type {
  Establishment,
  PrintDocumentMode
} from '../../types/publicHealth';
import { exportEstablishmentsToExcel } from '../../utils/excelExport';
import { showToast } from '../../utils/sweetAlert';

interface EstablishmentTableProps {
  establishments: Establishment[];
  selectedId: string | null;
  onSelect: (est: Establishment) => void;
  onInspect: (est: Establishment) => void;
  onPrint: (est: Establishment, docMode?: PrintDocumentMode) => void;
  onPrintReport?: () => void;
  onEdit: (est: Establishment) => void;
  onViewMap: (est: Establishment) => void;
  onNewRequest: () => void;
  onOpenArchive?: (est: Establishment) => void;
  onOpenFieldKit?: (est: Establishment) => void;
  onDelete?: (est: Establishment) => void;
  initialStatusFilter?: string;
  searchQuery?: string;
  onSearchQueryChange?: (val: string) => void;
}

export const EstablishmentTable: React.FC<EstablishmentTableProps> = ({
  establishments,
  selectedId,
  onSelect,
  onInspect,
  onPrint,
  onPrintReport,
  onEdit: _onEdit,
  onViewMap,
  onNewRequest,
  onOpenArchive,
  onOpenFieldKit,
  onDelete,
  initialStatusFilter,
  searchQuery: externalSearchQuery,
  onSearchQueryChange
}) => {
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || '');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [fiscalYearFilter, setFiscalYearFilter] = useState<string>('all'); // all | 2570 | 2569 | 2568
  const [recordTypeFilter, setRecordTypeFilter] = useState<'all' | 'renewal' | 'new'>('all'); // all | renewal | new
  const [archiveFilter, setArchiveFilter] = useState<'all' | 'complete' | 'missing_receipt' | 'missing_license' | 'incomplete'>('all');
  const [openPrintMenuId, setOpenPrintMenuId] = useState<string | null>(null);
  const [estToDelete, setEstToDelete] = useState<Establishment | null>(null);
  const [maskCitizenId, setMaskCitizenId] = useState<boolean>(true);

  // PDPA Formatter: ปิดบังเลขบัตรประชาชน ๑๓ หลักเพื่อความปลอดภัย
  const formatCitizenId = (id?: string) => {
    if (!id) return '-';
    const clean = id.trim();
    if (maskCitizenId) {
      if (clean.length === 13) {
        return `${clean[0]}-${clean.slice(1, 5)}-*****--${clean.slice(10, 12)}-${clean[12]}`;
      }
      return clean.replace(/(\d{3})\d{4,8}(\d{2})/, '$1-******-$2');
    }
    if (clean.length === 13) {
      return `${clean[0]}-${clean.slice(1, 5)}-${clean.slice(5, 10)}-${clean.slice(10, 12)}-${clean[12]}`;
    }
    return clean;
  };

  React.useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  React.useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  // ตรวจสอบว่าสถานประกอบการเป็น "รายเก่า (ต่ออายุ)" หรือ "รายใหม่ (ขอรับใบอนุญาต)"
  const isRenewalEst = (est: Establishment): boolean => {
    if (est.yearlyArchives && est.yearlyArchives.length > 1) return true;
    if (est.status === 'expiring') return true;
    if (est.yearlyArchives?.some((a) => a.year < 2570)) return true;
    if (est.notes && (est.notes.includes('ต่ออายุ') || est.notes.includes('เดิม'))) return true;
    return false;
  };

  // ดึงปีงบประมาณไทยของสถานประกอบการ
  const getEstFiscalYear = (est: Establishment): string => {
    if (est.yearlyArchives && est.yearlyArchives.length > 0) {
      const sorted = [...est.yearlyArchives].sort((a, b) => b.year - a.year);
      return String(sorted[0].year);
    }
    const regMatch = est.regNumber.match(/[-_](\d{2})[-_]/);
    if (regMatch) {
      return String(2500 + parseInt(regMatch[1], 10));
    }
    if (est.issueDate) {
      return String(new Date(est.issueDate).getFullYear() + 543);
    }
    return '๒๕๖๙';
  };

  // ตรวจสอบการตรงกับปีงบประมาณไทยที่เลือก
  const matchesFiscalYear = (est: Establishment, fy: string): boolean => {
    if (fy === 'all') return true;
    const target = parseInt(fy, 10);
    if (est.yearlyArchives?.some((a) => a.year === target)) return true;
    const regMatch = est.regNumber.match(/[-_](\d{2})[-_]/);
    if (regMatch && 2500 + parseInt(regMatch[1], 10) === target) return true;
    if (est.issueDate && new Date(est.issueDate).getFullYear() + 543 === target) return true;
    return false;
  };

  // ตรวจสอบความสมบูรณ์ของแฟ้มเอกสารรอบปี (ชุดตรวจสนาม ๑ ไฟล์ + ใบเสร็จ + สำเนาคู่ฉบับ)
  const getEstablishmentDossierStatus = (est: Establishment, targetYearStr?: string) => {
    const archives = est.yearlyArchives || [];
    if (archives.length === 0) {
      return {
        isComplete: false,
        count: 0,
        hasFieldPack: false,
        hasReceipt: false,
        hasLicense: false,
        missingList: ['ชุดตรวจสนาม', 'ใบเสร็จ', 'คู่ฉบับ'],
        missingText: 'ยังไม่มีแฟ้มปี'
      };
    }

    const targetYear = targetYearStr && targetYearStr !== 'all' ? parseInt(targetYearStr, 10) : undefined;
    const sorted = [...archives].sort((a, b) => b.year - a.year);
    const dossier = targetYear
      ? archives.find((a) => a.year === targetYear) || sorted[0]
      : sorted[0];

    const docs = dossier.documents || [];
    const hasFieldPack = docs.some(
      (d) =>
        d.type === 'field_pack' ||
        d.type === 'application' ||
        d.title.includes('ชุดเอกสาร') ||
        d.title.includes('ลงพื้นที่') ||
        d.title.includes('คำขอ')
    );
    const hasReceipt = docs.some((d) => d.type === 'receipt' || d.title.includes('ใบเสร็จ'));
    const hasLicense = docs.some(
      (d) =>
        d.type === 'license' ||
        d.type === 'license_copy' ||
        d.title.includes('คู่ฉบับ') ||
        d.title.includes('ใบอนุญาต')
    );

    const count = [hasFieldPack, hasReceipt, hasLicense].filter(Boolean).length;
    const isComplete = count === 3;

    const missingList: string[] = [];
    if (!hasFieldPack) missingList.push('ชุดตรวจสนาม (คำขอ+บัตร+ผลตรวจ)');
    if (!hasReceipt) missingList.push('ใบเสร็จรับเงิน');
    if (!hasLicense) missingList.push('คู่ฉบับใบอนุญาต');

    return {
      year: dossier.year,
      isComplete,
      count,
      hasFieldPack,
      hasReceipt,
      hasLicense,
      missingList,
      missingText:
        missingList.slice(0, 2).join(', ') +
        (missingList.length > 2 ? ` (+${missingList.length - 2})` : '')
    };
  };

  // Export to Excel (.xlsx) คุณภาพสูง พร้อมสูตรสรุป และรายงานแยกตามหมู่บ้าน
  const handleExportExcel = () => {
    try {
      const filename = exportEstablishmentsToExcel(filteredEstablishments, {
        fiscalYear: fiscalYearFilter !== 'all' ? fiscalYearFilter : undefined,
        filterLabel: `ปีงบประมาณ: ${fiscalYearFilter}, สถานะ: ${statusFilter}, หมวด: ${categoryFilter}`
      });
      showToast(`สร้างและดาวน์โหลดไฟล์ "${filename}" สำเร็จแล้ว`, 'success');
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel', 'error');
    }
  };

  const filteredEstablishments = useMemo(() => {
    return establishments.filter((est) => {
      // 1. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          est.businessName.toLowerCase().includes(q) ||
          est.ownerName.toLowerCase().includes(q) ||
          est.citizenId.includes(q) ||
          est.regNumber.toLowerCase().includes(q) ||
          est.village.toLowerCase().includes(q);
        if (!match) return false;
      }

      // 2. Fiscal Year Filter (ปีงบประมาณไทย)
      if (fiscalYearFilter !== 'all' && !matchesFiscalYear(est, fiscalYearFilter)) {
        return false;
      }

      // 3. Record Type Filter (รายเก่า ต่ออายุ vs รายใหม่ ขอรับใบอนุญาต)
      if (recordTypeFilter === 'renewal' && !isRenewalEst(est)) {
        return false;
      }
      if (recordTypeFilter === 'new' && isRenewalEst(est)) {
        return false;
      }

      // 4. Status Filter
      if (statusFilter !== 'all' && est.status !== statusFilter) {
        return false;
      }

      // 5. Category Filter
      if (categoryFilter !== 'all') {
        const isStorage =
          est.foodPlaceType === 'storage' ||
          (est.categoryName + ' ' + est.businessName).includes('สะสมอาหาร') ||
          (est.categoryName + ' ' + est.businessName).includes('คลัง') ||
          (est.categoryName + ' ' + est.businessName).includes('โกดัง') ||
          (est.categoryName + ' ' + est.businessName).includes('ห้องเย็น');

        if (categoryFilter === 'food_storage') {
          if (!isStorage) return false;
        } else if (categoryFilter === 'food_selling') {
          if (isStorage || (!est.categoryName.includes('จำหน่ายอาหาร') && est.category !== 'food_notice' && est.category !== 'food_license')) return false;
        } else if (est.category !== categoryFilter && est.regType !== categoryFilter) {
          return false;
        }
      }

      // 6. Archive Completeness Filter (ความสมบูรณ์ของแฟ้ม ๕ รายการ)
      if (archiveFilter !== 'all') {
        const dStatus = getEstablishmentDossierStatus(est, fiscalYearFilter);
        if (archiveFilter === 'complete' && !dStatus.isComplete) return false;
        if (archiveFilter === 'missing_receipt' && dStatus.hasReceipt) return false;
        if (archiveFilter === 'missing_license' && dStatus.hasLicense) return false;
        if (archiveFilter === 'incomplete' && dStatus.isComplete) return false;
      }

      return true;
    });
  }, [establishments, searchQuery, statusFilter, categoryFilter, fiscalYearFilter, recordTypeFilter, archiveFilter]);

  const activeCount = establishments.filter((e) => e.status === 'active').length;
  const expiringCount = establishments.filter((e) => e.status === 'expiring').length;
  const inspectionCount = establishments.filter((e) => e.status === 'pending_inspection').length;
  const correctionCount = establishments.filter((e) => e.status === 'pending_correction').length;
  const awaitingCount = establishments.filter((e) => e.status === 'awaiting_payment').length;
  const renewalCount = establishments.filter((e) => isRenewalEst(e)).length;
  const newCount = establishments.filter((e) => !isRenewalEst(e)).length;
  const storageCount = establishments.filter((e) =>
    e.foodPlaceType === 'storage' ||
    (e.categoryName + ' ' + e.businessName).includes('สะสมอาหาร') ||
    (e.categoryName + ' ' + e.businessName).includes('คลัง') ||
    (e.categoryName + ' ' + e.businessName).includes('โกดัง') ||
    (e.categoryName + ' ' + e.businessName).includes('ห้องเย็น')
  ).length;

  return (
    <div className="flex-1 flex flex-col bg-transparent overflow-hidden font-sans p-4 md:p-5 space-y-4">
      {/* 1. TOP CONTROL BAR */}
      <div className="gov-card p-4 md:p-5 space-y-3.5 shrink-0 border border-white/80 shadow-md bg-white/85 backdrop-blur-xl rounded-2xl">
        {/* Row 1: Title, Search, Primary Action Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-gov badge-gov-neutral">
                งานสารบรรณทะเบียน
              </span>
              <span className="text-[11px] text-slate-400 font-mono">•</span>
              <span className="text-[11px] text-slate-500 font-medium">
                ตำบลโป่งน้ำร้อน ({filteredEstablishments.length} แห่ง)
              </span>
            </div>
            <h1 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2 font-heading">
              <Building2 className="w-5 h-5 text-blue-700" />
              <span>ทะเบียนคุมสถานประกอบการและสารบรรณคำขอ</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ระบบตรวจสอบข้อมูลคำขอ นัดตรวจประเมินสุขลักษณะ อนุมัติ และออกใบอนุญาตตามระเบียบราชการ
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative w-64 lg:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (onSearchQueryChange) onSearchQueryChange(e.target.value);
                }}
                placeholder="ค้นหาชื่อร้าน, ผู้ขอ, เลข 13 หลัก, เลขทะเบียน..."
                className="w-full pl-8 pr-8 py-2 bg-white/90 border border-slate-200/90 focus:border-blue-500 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all shadow-2xs font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    if (onSearchQueryChange) onSearchQueryChange('');
                  }}
                  aria-label="ล้างคำค้นหา"
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Action: ส่งออก Excel (.xlsx) */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-white/95 hover:bg-emerald-50 text-emerald-800 hover:text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95"
              title="ส่งออกทะเบียนสถานประกอบการทั้งหมด/ที่กรองอยู่เป็นไฟล์ Excel (.xlsx คุณภาพสูง พร้อมสูตรสรุป)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>ส่งออก Excel (XLSX)</span>
            </button>

            {/* Action: พิมพ์เอกสารรายการทะเบียนคุม */}
            {onPrintReport && (
              <button
                type="button"
                onClick={onPrintReport}
                className="px-3.5 py-2 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/90 rounded-xl text-xs font-semibold shadow-2xs hover:shadow-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                title="พิมพ์รายงานเอกสารรายการทะเบียนคุมสถานประกอบการทั้งหมด (A4 แนวนอน)"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>พิมพ์เอกสารรายการ</span>
              </button>
            )}

            {/* Primary Action: รับคำขอใหม่ */}
            <button
              type="button"
              onClick={onNewRequest}
              className="px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ นำเข้าเอกสาร PDF (Auto-fill)</span>
            </button>
          </div>
        </div>

        {/* Row 2: แถบเลือกปีงบประมาณไทย & สลับประเภทคำขอ (รายเก่า ต่ออายุ vs รายใหม่) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 bg-white/60 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-2xs">
          {/* ตัวเลือกปีงบประมาณไทย */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1 text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-blue-700" />
              <span>ปีงบประมาณ:</span>
            </span>
            <div className="flex items-center gap-1 bg-white/90 p-0.5 rounded-lg border border-slate-200 shadow-2xs">
              {[
                { id: 'all', label: 'ทุกปีงบประมาณ' },
                { id: '2570', label: 'ปีงบ ๒๕๗๐' },
                { id: '2569', label: 'ปีงบ ๒๕๖๙' },
                { id: '2568', label: 'ปีงบ ๒๕๖๘' }
              ].map((fy) => (
                <button
                  key={fy.id}
                  type="button"
                  onClick={() => setFiscalYearFilter(fy.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    fiscalYearFilter === fy.id
                      ? 'bg-[#0F2942] text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {fy.label}
                </button>
              ))}
            </div>
          </div>

          {/* สลับประเภทคำขอ: รายเก่า (ต่ออายุ) vs รายใหม่ */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-700 text-[11px]">ประเภทคำขอ:</span>
            <div className="flex items-center gap-1 bg-white/90 p-0.5 rounded-lg border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setRecordTypeFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  recordTypeFilter === 'all'
                    ? 'bg-[#0F2942] text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                ทั้งหมด ({establishments.length})
              </button>
              <button
                type="button"
                onClick={() => setRecordTypeFilter('renewal')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  recordTypeFilter === 'renewal'
                    ? 'bg-[#0F2942] text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                title="แสดงเฉพาะสถานประกอบการรายเก่าที่มีประวัติต่ออายุ"
              >
                <span>รายเก่า (ต่ออายุ) ({renewalCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setRecordTypeFilter('new')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  recordTypeFilter === 'new'
                    ? 'bg-[#0F2942] text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                title="แสดงเฉพาะสถานประกอบการรายใหม่ที่ยื่นขอครั้งแรก"
              >
                <span>รายใหม่ ({newCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 3: Status Filter Tabs & Category Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-gradient-to-r from-[#0F2942] to-blue-950 text-white font-bold shadow-sm shadow-slate-900/20 ring-1 ring-blue-500/30'
                  : 'bg-white/80 hover:bg-white border border-slate-200/80 text-slate-700 backdrop-blur-xs hover:shadow-2xs'
              }`}
            >
              ทั้งหมด ({establishments.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending_inspection')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'pending_inspection'
                  ? 'bg-gradient-to-r from-[#0F2942] to-blue-950 text-white font-bold shadow-sm shadow-slate-900/20 ring-1 ring-blue-500/30'
                  : 'bg-white/80 hover:bg-white border border-slate-200/80 text-slate-700 backdrop-blur-xs hover:shadow-2xs'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-500 shadow-2xs" />
              <span>รอนัดตรวจสถานที่ ({inspectionCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('pending_correction')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'pending_correction'
                  ? 'bg-gradient-to-r from-[#0F2942] to-blue-950 text-white font-bold shadow-sm shadow-slate-900/20 ring-1 ring-blue-500/30'
                  : 'bg-white/80 hover:bg-white border border-slate-200/80 text-slate-700 backdrop-blur-xs hover:shadow-2xs'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-2xs" />
              <span>มีคำสั่งให้ปรับปรุง ({correctionCount})</span>
            </button>

            {awaitingCount > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter('awaiting_payment')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'awaiting_payment'
                    ? 'bg-gradient-to-r from-[#0F2942] to-blue-950 text-white font-bold shadow-sm shadow-slate-900/20 ring-1 ring-blue-500/30'
                    : 'bg-white/80 hover:bg-white border border-slate-200/80 text-slate-700 backdrop-blur-xs hover:shadow-2xs'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-2xs" />
                <span>รอชำระค่าธรรมเนียม ({awaitingCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setStatusFilter('expiring')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'expiring'
                  ? 'bg-gradient-to-r from-[#0F2942] to-blue-950 text-white font-bold shadow-sm shadow-slate-900/20 ring-1 ring-blue-500/30'
                  : 'bg-white/80 hover:bg-white border border-slate-200/80 text-slate-700 backdrop-blur-xs hover:shadow-2xs'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-2xs" />
              <span>ใกล้สิ้นอายุ 30 วัน ({expiringCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'active'
                  ? 'bg-gradient-to-r from-[#0F2942] to-blue-950 text-white font-bold shadow-sm shadow-slate-900/20 ring-1 ring-blue-500/30'
                  : 'bg-white/80 hover:bg-white border border-slate-200/80 text-slate-700 backdrop-blur-xs hover:shadow-2xs'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-2xs" />
              <span>ได้รับอนุญาตแล้ว ({activeCount})</span>
            </button>

            {/* Quick Storage Highlight Button */}
            <button
              type="button"
              onClick={() => setCategoryFilter(categoryFilter === 'food_storage' ? 'all' : 'food_storage')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === 'food_storage'
                  ? 'bg-gradient-to-r from-[#0F2942] to-blue-950 text-white font-bold shadow-sm shadow-slate-900/20 ring-1 ring-blue-500/30'
                  : 'bg-white/80 hover:bg-white border border-slate-200/80 text-slate-700 backdrop-blur-xs hover:shadow-2xs'
              }`}
              title="กรองเฉพาะสถานที่สะสมอาหาร (คลังสินค้า, โกดังข้าวสาร, ห้องเย็นแช่แข็ง) เพื่อเตรียมลงพื้นที่ตรวจ"
            >
              <Warehouse className="w-3.5 h-3.5 text-slate-500" />
              <span>สถานที่สะสมอาหาร ({storageCount})</span>
            </button>
          </div>

          {/* Category Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>ประเภทกิจการ:</span>
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-white/90 border border-slate-200/90 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-2xs"
            >
              <option value="all">ทุกหมวดกิจการ (ทั้งหมด)</option>
              <option value="food_storage">📦 สถานที่สะสมอาหาร (คลัง/โกดัง/ห้องเย็น)</option>
              <option value="food_selling">🍽️ สถานที่จำหน่ายอาหาร (ร้านอาหาร/ภัตตาคาร)</option>
              <option value="food_notice">แบบ นจ. อาหาร ≤ ๒๐๐ ตร.ม.</option>
              <option value="food_license">แบบ บทอ. อาหาร &gt; ๒๐๐ ตร.ม.</option>
              <option value="hazardous">แบบ บทส. กิจการอันตรายต่อสุขภาพ</option>
              <option value="market">แบบ อส. จัดตั้งตลาดสด/นัด</option>
              <option value="public_sale">แบบ นส. จำหน่ายสินค้าที่สาธารณะ</option>
              <option value="waste_sewage">แบบ ปป. เก็บขนสิ่งปฏิกูล</option>
              <option value="terminate_transfer">แบบ ยล. แจ้งเลิก/โอนกิจการ</option>
            </select>
          </div>

          {/* Archive Dossier Completeness Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>สถานะแฟ้มเอกสาร:</span>
            </span>
            <select
              value={archiveFilter}
              onChange={(e) => setArchiveFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-white/90 border border-slate-200/90 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-2xs"
            >
              <option value="all">ทุกสถานะแฟ้ม (ทั้งหมด)</option>
              <option value="complete">✓ เสร็จสมบูรณ์ (มีชุดตรวจสนาม, ใบเสร็จ, คู่ฉบับ)</option>
              <option value="incomplete">⏳ ยังไม่ครบถ้วน</option>
              <option value="missing_receipt">⚠️ ขาดใบเสร็จรับเงิน อปท.</option>
              <option value="missing_license">⚠️ ขาดสำเนาคู่ฉบับใบอนุญาต</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. OFFICIAL GOVERNMENT DATA TABLE */}
      <div className="flex-1 overflow-auto gov-card flex flex-col border border-white/80 shadow-md bg-white/90 backdrop-blur-xl rounded-2xl" onClick={() => setOpenPrintMenuId(null)}>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 backdrop-blur-sm border-b border-slate-200/90 text-slate-700 font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10 shadow-2xs">
                <th className="py-3.5 px-3 text-center w-12 font-heading">ลำดับ</th>
                <th className="py-3.5 px-3 font-heading">เลขที่สารบรรณ / รหัสคุม</th>
                <th className="py-3.5 px-4 min-w-[200px] font-heading">ชื่อสถานประกอบการ / ร้าน</th>
                <th className="py-3.5 px-4 min-w-[190px] font-heading">
                  <div className="flex items-center justify-between gap-1">
                    <span>ผู้ขออนุญาต / เลข ๑๓ หลัก</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMaskCitizenId((prev) => !prev);
                      }}
                      className="p-1 rounded-md hover:bg-slate-200/90 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      title={maskCitizenId ? 'คลิกเพื่อดูเลขบัตร ปชช. ฉบับเต็ม ๑๓ หลัก' : 'คลิกเพื่อปิดบังเลขบัตร ปชช. (PDPA)'}
                    >
                      {maskCitizenId ? (
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                      )}
                    </button>
                  </div>
                </th>
                <th className="py-3.5 px-3 text-center font-heading">ประเภท</th>
                <th className="py-3.5 px-3 font-heading">ที่ตั้ง (ต.โป่งน้ำร้อน)</th>
                <th className="py-3.5 px-3 text-center font-heading">ผลตรวจสุขลักษณะ</th>
                <th className="py-3.5 px-3 text-center font-heading">สถานะ & แฟ้ม ๕ รายการ</th>
                <th className="py-3.5 px-3 text-right font-heading">ค่าธรรมเนียม</th>
                <th className="py-3.5 px-4 text-center min-w-[220px] font-heading">การจัดการคำขอ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 font-sans">
              {filteredEstablishments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-500">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-sm text-slate-800 font-heading">ไม่พบข้อมูลตามเงื่อนไขที่ค้นหา</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      ไม่พบสถานประกอบการที่ตรงกับคำค้นหาหรือตัวกรองที่เลือก กรุณาลองล้างคำค้นหาหรือเลือกตัวกรองเป็น "ทั้งหมด"
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('all');
                          setCategoryFilter('all');
                          setFiscalYearFilter('all');
                          setRecordTypeFilter('all');
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
                      >
                        ล้างตัวกรองทั้งหมด
                      </button>
                      <button
                        type="button"
                        onClick={onNewRequest}
                        className="px-3.5 py-1.5 rounded-lg bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                      >
                        + รับคำขอใหม่
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEstablishments.map((est, idx) => {
                  const isSelected = selectedId === est.id;
                  return (
                    <tr
                      key={est.id}
                      onClick={() => onSelect(est)}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/90 font-medium ring-1 ring-blue-400/40'
                          : est.status === 'pending_inspection'
                          ? 'bg-purple-50/30 hover:bg-purple-50/70 border-l-2 border-l-purple-400'
                          : est.status === 'pending_correction'
                          ? 'bg-red-50/30 hover:bg-red-50/70 border-l-2 border-l-red-400'
                          : est.status === 'expiring'
                          ? 'bg-amber-50/30 hover:bg-amber-50/70 border-l-2 border-l-amber-400'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* 1. ลำดับ */}
                      <td className="py-3 px-3 text-center text-slate-500 font-mono">
                        {idx + 1}
                      </td>

                      {/* 2. เลขสารบรรณ */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-900">{est.regNumber}</div>
                        <div className="text-[10px] text-slate-400">เล่มที่ {est.bookNo}</div>
                        <div className="mt-1 flex items-center gap-1 flex-wrap">
                          {isRenewalEst(est) ? (
                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                              🔄 รายเก่า (ต่ออายุ)
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              🆕 รายใหม่
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            ปี {getEstFiscalYear(est)}
                          </span>
                        </div>
                      </td>

                      {/* 3. ชื่อสถานประกอบการ */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs hover:text-blue-700 flex items-center gap-1.5 flex-wrap">
                          <span>{est.businessName}</span>
                          {(est.foodPlaceType === 'storage' || est.categoryName.includes('สะสมอาหาร')) && (
                            <span className="px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold border border-indigo-200 flex items-center gap-0.5">
                              <Warehouse className="w-2.5 h-2.5" />
                              <span>สะสมอาหาร</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{est.categoryName}</div>
                      </td>

                      {/* 4. ผู้ขออนุญาต */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{est.ownerName}</div>
                        <div className="text-[10.5px] text-slate-600 font-mono flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{formatCitizenId(est.citizenId)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">โทร: {est.phone || '-'}</div>
                      </td>

                      {/* 5. ประเภทแบบฟอร์ม */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md font-mono font-bold text-[11px] border ${
                            est.regType === 'บทส'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : est.regType === 'บทอ'
                              ? 'bg-sky-50 text-sky-800 border-sky-300'
                              : est.regType === 'อส'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : est.regType === 'นส'
                              ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                              : est.regType === 'ปป'
                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                              : 'bg-teal-50 text-teal-800 border-teal-300'
                          }`}
                        >
                          {est.regType}
                        </span>
                      </td>

                      {/* 6. ที่ตั้ง */}
                      <td className="py-3 px-3 text-slate-700">
                        <div className="font-medium">{est.village}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]" title={est.address}>{est.address}</div>
                      </td>

                      {/* 7. ผลตรวจสุขลักษณะ */}
                      <td className="py-3 px-3 text-center">
                        {est.inspectionScore !== undefined ? (
                          <div>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] ${
                                est.inspectionScore >= 80
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-red-100 text-red-800 border border-red-300'
                              }`}
                            >
                              {est.inspectionScore >= 80 ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <AlertTriangle className="w-3 h-3" />
                              )}
                              <span>{est.inspectionScore}/100</span>
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {est.inspectionScore >= 80 ? 'ผ่านเกณฑ์' : `แก้ใน ${est.correctionDays || 15} วัน`}
                            </div>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium text-[10px]">
                            รอนัดตรวจ
                          </span>
                        )}
                      </td>

                      {/* 8. สถานะใบอนุญาต & แฟ้ม ๕ รายการ */}
                      <td className="py-3 px-3 text-center">
                        {est.status === 'active' && (
                          <span className="badge-gov badge-gov-success">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>ได้รับอนุญาต</span>
                          </span>
                        )}
                        {est.status === 'expiring' && (
                          <span className="badge-gov badge-gov-warning">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>ใกล้หมดอายุ</span>
                          </span>
                        )}
                        {est.status === 'pending_inspection' && (
                          <span className="badge-gov badge-gov-purple">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            <span>รอนัดตรวจ</span>
                          </span>
                        )}
                        {est.status === 'pending_correction' && (
                          <span className="badge-gov badge-gov-danger">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span>สั่งปรับปรุง</span>
                          </span>
                        )}
                        {est.status === 'awaiting_payment' && (
                          <span className="badge-gov badge-gov-info">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>รอชำระเงิน</span>
                          </span>
                        )}

                        {/* Archive Dossier Completeness Badge */}
                        {(() => {
                          const archiveInfo = getEstablishmentDossierStatus(est, fiscalYearFilter);
                          return (
                            <div className="mt-1 flex justify-center">
                              {archiveInfo.isComplete ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onOpenArchive) onOpenArchive(est);
                                    else onSelect(est);
                                  }}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
                                  title="เอกสารครบถ้วนสมบูรณ์: มีชุดเอกสารลงพื้นที่ตรวจสนาม (คำขอ+บัตร+ผลตรวจ), ใบเสร็จรับเงิน และสำเนาคู่ฉบับใบอนุญาต (คลิกเพื่อเปิดแฟ้ม)"
                                >
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>แฟ้มครบสมบูรณ์ (มีคู่ฉบับ)</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onOpenArchive) onOpenArchive(est);
                                    else onSelect(est);
                                  }}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-all cursor-pointer shadow-2xs"
                                  title={`ยังขาดเอกสารในแฟ้ม: ${archiveInfo.missingList.join(', ')} (คลิกเพื่อเปิดแฟ้มอัปโหลด)`}
                                >
                                  <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                  <span>ขาด: {archiveInfo.missingText}</span>
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* 9. ค่าธรรมเนียม */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {est.feeAmount.toLocaleString()} ฿
                      </td>

                      {/* 10. ปุ่มจัดการคำขอ */}
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {/* ปุ่มแฟ้มประวัติเอกสารรายปี */}
                          <button
                            type="button"
                            onClick={() => onOpenArchive ? onOpenArchive(est) : onSelect(est)}
                            className="px-2 py-1 rounded-lg font-bold text-[11px] bg-slate-50 hover:bg-emerald-600 text-slate-700 hover:text-white border border-slate-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="เปิดดูแฟ้มจัดเก็บเอกสารรายปี (๕ รายการ: คำขอ, บัตร ปชช., ผลตรวจ, ใบเสร็จ, ใบอนุญาต)"
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
                            <span>แฟ้มปี</span>
                          </button>

                          {/* ปุ่มตรวจประเมินลงพื้นที่ */}
                          <button
                            type="button"
                            onClick={() => onOpenFieldKit ? onOpenFieldKit(est) : onInspect(est)}
                            className="px-2 py-1 rounded-lg font-bold text-[11px] bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white border border-amber-300 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="พิมพ์ชุดเอกสารลงพื้นที่ตรวจจริง (แบบ อภ.๑ + แบบตรวจสุขลักษณะ ๒ หน้า)"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-700" />
                            <span>ชุดตรวจสนาม</span>
                          </button>

                          {/* ปุ่มดูพิกัด GIS บนแผนที่ */}
                          <button
                            type="button"
                            onClick={() => onViewMap(est)}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-blue-600 text-slate-500 hover:text-white border border-slate-200 transition-all cursor-pointer shadow-2xs"
                            title="ดูพิกัด GIS บนแผนที่ ๗ หมู่บ้าน"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </button>

                          {/* ปุ่มพิมพ์เอกสารราชการพร้อมเมนูด่วน */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenPrintMenuId(openPrintMenuId === est.id ? null : est.id);
                              }}
                              className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 border ${
                                est.status === 'expiring'
                                    ? 'bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white border-amber-300'
                                    : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border-emerald-200'
                              }`}
                              title="เลือกพิมพ์เอกสารราชการ (ใบอนุญาต, ใบเสร็จ, บัตรผู้สัมผัส, ป้าย, หนังสือเตือน)"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>พิมพ์</span>
                              <ChevronDown className="w-3 h-3 opacity-70" />
                            </button>

                            {/* Dropdown Menu for Documents */}
                            {openPrintMenuId === est.id && (
                              <div
                                className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 truncate">
                                  {est.businessName}
                                </div>

                                {/* Item 0: ชุดลงพื้นที่ต่ออายุ */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenPrintMenuId(null);
                                    if (onOpenFieldKit) {
                                      onOpenFieldKit(est);
                                    } else {
                                      onPrint(est, 'field_pack');
                                    }
                                  }}
                                  className="w-full px-3 py-2 text-xs text-amber-900 bg-amber-50/80 hover:bg-amber-100 font-bold flex items-center gap-2 transition-colors cursor-pointer border-b border-amber-200"
                                >
                                  <ClipboardCheck className="w-4 h-4 text-amber-700 shrink-0" />
                                  <span>★ ชุดลงพื้นที่ต่ออายุ (Pre-filled Kit)</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenPrintMenuId(null);
                                    onPrint(est, 'garuda');
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-medium flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span>๑. ใบอนุญาตตราครุฑ (A4)</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenPrintMenuId(null);
                                    onPrint(est, 'receipt');
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Receipt className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                  <span>๒. ใบเสร็จค่าธรรมเนียม ({est.feeAmount.toLocaleString()} ฿)</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenPrintMenuId(null);
                                    onPrint(est, 'food_card');
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-700 font-medium flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Contact className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>๓. บัตรผู้สัมผัสอาหาร (CR80)</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenPrintMenuId(null);
                                    onPrint(est, 'cleanfood');
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-700 font-medium flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Award className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                  <span>๔. ป้าย Clean Food Good Taste</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenPrintMenuId(null);
                                    onPrint(est, 'renewal_notice');
                                  }}
                                  className={`w-full px-3 py-1.5 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                                    est.status === 'expiring'
                                      ? 'text-red-700 bg-red-50 hover:bg-red-100 font-bold'
                                      : 'text-slate-700 hover:bg-red-50 hover:text-red-700'
                                  }`}
                                >
                                  <BellRing className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                  <span>๕. หนังสือเตือนต่ออายุ (ครุฑ A4)</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* ปุ่มลบสถานประกอบการ (สีแดง ชัดเจน ใช้งานได้จริง) */}
                          {onDelete && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setEstToDelete(est);
                              }}
                              className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 font-bold text-[11px] transition-all cursor-pointer shadow-2xs flex items-center gap-1 shrink-0 active:scale-95"
                              title="ลบข้อมูลสถานประกอบการนี้ออกจากระบบ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ลบ</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. TABLE FOOTER / STATS SUMMARY */}
      <div className="gov-card px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-700 shrink-0 border border-white/80 shadow-xs bg-white/85 backdrop-blur-xl rounded-xl gap-2">
        <div>
          แสดง <strong>{filteredEstablishments.length}</strong> จากทั้งหมด <strong>{establishments.length}</strong> รายการ (ฐานข้อมูล อบต.โป่งน้ำร้อน)
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {onPrintReport && (
            <button
              type="button"
              onClick={onPrintReport}
              className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="เปิดศูนย์พิมพ์เพื่อพิมพ์รายงานทะเบียนคุมสถานประกอบการ"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์เอกสารรายการทะเบียนคุม ({filteredEstablishments.length} รายการ)</span>
            </button>
          )}
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>ระบบพร้อมออกใบอนุญาตและสารบรรณอิเล็กทรอนิกส์</span>
          </span>
        </div>
      </div>

      {/* 4. MODAL ยืนยันการลบสถานประกอบการ (In-App Confirmation Modal ไม่ใช้ window.confirm) */}
      {estToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-red-200 max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">ยืนยันการลบสถานประกอบการ</h3>
                <p className="text-xs text-slate-500">การดำเนินการนี้จะลบข้อมูลออกจากฐานข้อมูลถาวร</p>
              </div>
            </div>

            <div className="bg-red-50/70 border border-red-200 rounded-xl p-3.5 space-y-1 text-xs">
              <div className="font-bold text-red-900 text-sm">{estToDelete.businessName}</div>
              <div className="text-red-700">เลขทะเบียนคุม: <span className="font-mono font-bold">{estToDelete.regNumber}</span></div>
              <div className="text-red-600">ผู้ประกอบการ: {estToDelete.ownerName} ({estToDelete.village})</div>
              <div className="text-[11px] text-red-500 pt-1.5 border-t border-red-200">
                ⚠️ ประวัติคำขอ แฟ้มเอกสารรายปี และผลการตรวจทั้งหมดในระบบ Supabase Cloud จะถูกลบถาวร
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEstToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = estToDelete;
                  setEstToDelete(null);
                  if (onDelete && target) {
                    onDelete(target);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>ยืนยันลบข้อมูลถาวร</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

