import React, { useState, useMemo, useEffect } from 'react';
import type { Establishment, PrintDocumentMode } from '../../types/publicHealth';
import { EstablishmentForm, type EstablishmentFormValues } from '../archive/EstablishmentForm';
import { sanitationDataService } from '../../services/sanitationDataService';
import { showToast } from '../../utils/sweetAlert';
import {
  Building2,
  Search,
  Filter,
  Printer,
  Calendar,
  MapPin,
  Users,
  Maximize2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Store,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  LayoutGrid,
  List,
  FileEdit,
  X
} from 'lucide-react';

export interface SimpleEstablishmentDirectoryProps {
  establishments: Establishment[];
  onSelectEstablishment: (est: Establishment) => void;
  onPrintEstablishment: (est: Establishment, regType: string, docMode: PrintDocumentMode) => void;
  onPrintCategoryReport: (category: string, year: string) => void;
  onOpenArchive: (est: Establishment) => void;
  onUpdateEstablishment?: (est: Establishment) => void;
  activeCategoryFilter?: string;
  onCategoryFilterChange?: (cat: string) => void;
}

type CategoryTab = 'all' | 'food_notice' | 'food_license' | 'hazardous' | 'market' | 'public_sale' | 'waste_sewage';

const CATEGORY_TABS: { id: CategoryTab; label: string; badge: string; color: string; desc: string }[] = [
  { id: 'all', label: 'ทั้งหมดทุกหมวด', badge: 'รวม', color: 'bg-slate-800 text-white', desc: 'ทุกประเภทกิจการ' },
  { id: 'food_notice', label: 'อาหาร ≤ 200 ตร.ม. (นจ.)', badge: 'นจ.', color: 'bg-emerald-600 text-white', desc: 'หนังสือรับรองการแจ้ง' },
  { id: 'food_license', label: 'อาหาร > 200 ตร.ม. (บทอ.)', badge: 'บทอ.', color: 'bg-blue-600 text-white', desc: 'ใบอนุญาตจำหน่ายอาหาร' },
  { id: 'hazardous', label: 'อันตรายต่อสุขภาพ (บทส.)', badge: 'บทส.', color: 'bg-amber-600 text-white', desc: 'ใบอนุญาตกิจการอันตราย' },
  { id: 'market', label: 'ตลาดสด / นัด (อส.)', badge: 'อส.', color: 'bg-purple-600 text-white', desc: 'ใบอนุญาตจัดตั้งตลาด' },
  { id: 'public_sale', label: 'จำหน่ายที่สาธารณะ (นส.)', badge: 'นส.', color: 'bg-rose-600 text-white', desc: 'หนังสือรับรองแผงลอย' },
  { id: 'waste_sewage', label: 'สิ่งปฏิกูล / มูลฝอย (ปป.)', badge: 'ปป.', color: 'bg-indigo-600 text-white', desc: 'ใบอนุญาตกำจัดสิ่งปฏิกูล' }
];

export const SimpleEstablishmentDirectory: React.FC<SimpleEstablishmentDirectoryProps> = ({
  establishments,
  onSelectEstablishment,
  onPrintEstablishment,
  onPrintCategoryReport,
  onOpenArchive,
  onUpdateEstablishment,
  activeCategoryFilter,
  onCategoryFilterChange
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>(() => {
    if (activeCategoryFilter && CATEGORY_TABS.some((t) => t.id === activeCategoryFilter)) {
      return activeCategoryFilter as CategoryTab;
    }
    return 'all';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Edit Modal State
  const [editingEst, setEditingEst] = useState<Establishment | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    if (activeCategoryFilter && CATEGORY_TABS.some((t) => t.id === activeCategoryFilter)) {
      setSelectedCategory(activeCategoryFilter as CategoryTab);
    }
  }, [activeCategoryFilter]);

  const handleCategoryTabClick = (tabId: CategoryTab) => {
    setSelectedCategory(tabId);
    if (onCategoryFilterChange) {
      onCategoryFilterChange(tabId);
    }
  };

  const handleSaveEdit = async (values: EstablishmentFormValues) => {
    if (!editingEst) return;
    setIsSavingEdit(true);
    try {
      const safePremise = (values.premiseCharacteristics && values.premiseCharacteristics !== '-')
        ? values.premiseCharacteristics.trim()
        : 'อยู่ในอาคารพาณิชย์';

      const updated: Establishment = {
        ...editingEst,
        businessName: values.businessName,
        ownerName: values.ownerName,
        citizenId: values.citizenId,
        phone: values.phone,
        email: values.email,
        village: values.village,
        address: values.address,
        areaSqm: values.areaSqm || 50,
        workerCount: values.workerCount ?? 1,
        premiseCharacteristics: safePremise,
        foodPlaceType: values.foodPlaceType || editingEst.foodPlaceType || 'selling',
        foodTypeDetail: values.foodTypeDetail || editingEst.foodTypeDetail || '',
        distributionMethod: values.distributionMethod || editingEst.distributionMethod || '',
        operatingHours: values.operatingHours || editingEst.operatingHours || '',
        lat: values.lat,
        lng: values.lng,
        regType: values.regType,
        category: values.category,
        categoryName: values.categoryName,
        feeAmount: values.feeAmount,
        bookNo: values.bookNo || editingEst.bookNo || '๑',
        docNo: values.docNo,
        receiptBookNo: values.receiptBookNo || editingEst.receiptBookNo || '๑',
        receiptNo: values.receiptNo,
        receiptDate: values.receiptDate || editingEst.receiptDate || values.applicationSubmissionDate,
        applicationSubmissionDate: values.applicationSubmissionDate,
        inspectorName: values.inspectorName,
        inspectorPosition: values.inspectorPosition,
        lineId: values.lineId || editingEst.lineId || '',
        fax: values.fax || editingEst.fax || ''
      };

      await sanitationDataService.saveEstablishment(updated);
      if (onUpdateEstablishment) {
        onUpdateEstablishment(updated);
      }
      showToast('บันทึกการแก้ไขข้อมูลสำเร็จ!', 'success');
      setEditingEst(null);
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Extract available years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    establishments.forEach((e) => {
      const regMatch = e.regNumber?.match(/[-_](\d{2})[-_]/);
      if (regMatch) {
        years.add(String(2500 + parseInt(regMatch[1], 10)));
      } else if (e.issueDate) {
        const y = parseInt(e.issueDate.substring(0, 4), 10);
        years.add(String(y > 2400 ? y : y + 543));
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [establishments]);

  // Extract available villages
  const availableVillages = useMemo(() => {
    const vils = new Set<string>();
    establishments.forEach((e) => {
      if (e.village) vils.add(e.village.trim());
    });
    return Array.from(vils).sort();
  }, [establishments]);

  // Filter establishments
  const filteredList = useMemo(() => {
    return establishments.filter((est) => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (est.category !== selectedCategory) return false;
      }

      // Year filter
      if (selectedYear !== 'all') {
        const regMatch = est.regNumber?.match(/[-_](\d{2})[-_]/);
        const estYear = regMatch
          ? String(2500 + parseInt(regMatch[1], 10))
          : est.issueDate
          ? String(parseInt(est.issueDate.substring(0, 4), 10) > 2400 ? parseInt(est.issueDate.substring(0, 4), 10) : parseInt(est.issueDate.substring(0, 4), 10) + 543)
          : '';
        if (estYear !== selectedYear) return false;
      }

      // Village filter
      if (selectedVillage !== 'all' && est.village !== selectedVillage) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'active' && est.status !== 'active') return false;
        if (selectedStatus === 'expiring' && est.status !== 'expiring') return false;
        if (selectedStatus === 'pending' && est.status !== 'pending_inspection') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = est.businessName?.toLowerCase().includes(q);
        const matchOwner = est.ownerName?.toLowerCase().includes(q);
        const matchReg = est.regNumber?.toLowerCase().includes(q);
        const matchAddr = est.address?.toLowerCase().includes(q);
        const matchVillage = est.village?.toLowerCase().includes(q);
        return matchName || matchOwner || matchReg || matchAddr || matchVillage;
      }

      return true;
    });
  }, [establishments, selectedCategory, selectedYear, selectedVillage, selectedStatus, searchQuery]);

  // Summary stats for current filter
  const stats = useMemo(() => {
    const total = filteredList.length;
    const active = filteredList.filter((e) => e.status === 'active').length;
    const totalArea = filteredList.reduce((acc, cur) => acc + (cur.areaSqm || 50), 0);
    const totalWorkers = filteredList.reduce((acc, cur) => acc + (cur.workerCount || 1), 0);
    return { total, active, totalArea, totalWorkers };
  }, [filteredList]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { all: establishments.length };
    CATEGORY_TABS.forEach((t) => {
      if (t.id !== 'all') {
        map[t.id] = establishments.filter((e) => e.category === t.id).length;
      }
    });
    return map;
  }, [establishments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            อนุญาตแล้ว
          </span>
        );
      case 'expiring':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            ใกล้หมดอายุ
          </span>
        );
      case 'pending_inspection':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <Clock className="w-3 h-3 text-purple-600" />
            รอนัดตรวจ
          </span>
        );
      case 'pending_correction':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            สั่งปรับปรุง
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
            ปกติ
          </span>
        );
    }
  };

  const getCategoryBadge = (cat?: string, regType?: string) => {
    switch (cat) {
      case 'food_notice':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px]">นจ. (อาหาร ≤ 200 ตร.ม.)</span>;
      case 'food_license':
        return <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[11px]">บทอ. (อาหาร &gt; 200 ตร.ม.)</span>;
      case 'hazardous':
        return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[11px]">บทส. (อันตรายต่อสุขภาพ)</span>;
      case 'market':
        return <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[11px]">อส. (ตลาด)</span>;
      case 'public_sale':
        return <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[11px]">นส. (แผงลอย)</span>;
      case 'waste_sewage':
        return <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-[11px]">ปป. (สิ่งปฏิกูล)</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">{regType || 'ทั่วไป'}</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/70">
      {/* Top Header Card */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4 shadow-2xs shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Title & description */}
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                <Store className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 font-heading tracking-tight flex items-center gap-2">
                  ทะเบียนสถานประกอบการ (ดูง่าย / แยกหมวด)
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono font-semibold">
                    {establishments.length} ร้าน
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  แสดงข้อมูลสำคัญ: ชื่อร้าน เจ้าของ ที่ตั้ง พื้นที่ (ตร.ม.) จำนวนคนงาน ลักษณะสถานที่ และสั่งพิมพ์แยกหมวด
                </p>
              </div>
            </div>
          </div>

          {/* Action: Print Category Register Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onPrintCategoryReport(selectedCategory, selectedYear)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer hover:shadow"
              title="สั่งพิมพ์ทะเบียนคุมสถานประกอบการ A4 แนวนอน สำหรับหมวดที่เลือก"
            >
              <Printer className="w-4 h-4 text-emerald-100" />
              <span>พิมพ์ทะเบียนคุมหมวดนี้ (A4)</span>
            </button>

            {/* View Mode Switcher */}
            <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="มุมมองการ์ด (อ่านสบาย)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="มุมมองตารางสรุปย่อ"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Tabs (Scrollable on mobile) */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.id;
            const count = categoryCounts[tab.id] || 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                  isSelected
                    ? `${tab.color} border-transparent shadow-2xs font-bold scale-[1.02]`
                    : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                }`}
                title={tab.desc}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-100/80 px-4 py-2.5 sm:px-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อร้าน, เจ้าของ, เลขที่คำขอ..."
            className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right: Dropdown filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Village Filter */}
          <select
            value={selectedVillage}
            onChange={(e) => setSelectedVillage(e.target.value)}
            className="bg-white border border-slate-300 text-xs rounded-xl px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
          >
            <option value="all">ทุกหมู่บ้าน</option>
            {availableVillages.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white border border-slate-300 text-xs rounded-xl px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
          >
            <option value="all">ทุกปี พ.ศ.</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                ปี พ.ศ. {yr}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white border border-slate-300 text-xs rounded-xl px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="active">ได้รับอนุญาต</option>
            <option value="expiring">ใกล้หมดอายุ</option>
            <option value="pending">รอนัดตรวจ</option>
          </select>
        </div>
      </div>

      {/* KPI Mini Bar */}
      <div className="px-4 py-2 sm:px-6 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between text-xs text-slate-600 shrink-0">
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          <div>
            พบข้อมูลในหมวดนี้: <strong className="text-slate-900 font-mono">{stats.total}</strong> แห่ง
          </div>
          <div>
            ได้รับอนุญาตแล้ว: <strong className="text-emerald-700 font-mono">{stats.active}</strong> แห่ง
          </div>
          <div className="hidden sm:inline">
            พื้นที่รวม: <strong className="text-blue-700 font-mono">{stats.totalArea.toLocaleString()}</strong> ตร.ม.
          </div>
          <div className="hidden sm:inline">
            ผู้สัมผัส/คนงานรวม: <strong className="text-indigo-700 font-mono">{stats.totalWorkers.toLocaleString()}</strong> คน
          </div>
        </div>
        <div className="text-[11px] text-slate-500 font-medium">
          {selectedYear !== 'all' ? `ปีงบประมาณ ${selectedYear}` : 'ทุกปีงบประมาณ'}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {filteredList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8 shadow-xs">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800 font-heading">ไม่พบสถานประกอบการตามเงื่อนไขที่เลือก</h3>
            <p className="text-xs text-slate-500 mt-1">ลองเปลี่ยนหมวดหมู่ ล้างคำค้นหา หรือเลือกปีงบประมาณอื่น</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setSelectedVillage('all');
                setSelectedYear('all');
                setSelectedStatus('all');
              }}
              className="mt-4 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs cursor-pointer border border-blue-200"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Cards Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredList.map((est) => (
              <div
                key={est.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:border-blue-300"
              >
                {/* Card Top: Badges & Reg No */}
                <div className="p-4 pb-3 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    {getCategoryBadge(est.category, est.regType)}
                    {getStatusBadge(est.status)}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 font-heading">
                    {est.businessName || 'ไม่ระบุชื่อร้าน'}
                  </h3>

                  <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center justify-between">
                    <span>เลขคำขอ: {est.regNumber || est.docNo || '-'}</span>
                    {est.village && <span className="text-blue-600 font-sans font-medium">{est.village}</span>}
                  </div>
                </div>

                {/* Card Middle: Key User-Requested Details */}
                <div className="p-4 space-y-2 text-xs flex-1 bg-slate-50/40">
                  {/* Owner */}
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="text-slate-400 font-medium w-16 shrink-0">ผู้ขออนุญาต:</span>
                    <strong className="text-slate-800 truncate">{est.ownerName || '-'}</strong>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{est.address || est.village || '-'}</span>
                  </div>

                  {/* Highlighted Metrics: Area, Workers, Characteristics */}
                  <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Maximize2 className="w-3 h-3 text-blue-500" />
                        <span>พื้นที่สถานประกอบการ</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">
                        <span className="font-mono text-sm text-blue-600">{est.areaSqm || 50}</span> ตร.ม.
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3 text-emerald-500" />
                        <span>จำนวนคนงาน/ผู้สัมผัส</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">
                        <span className="font-mono text-sm text-emerald-600">{est.workerCount || 1}</span> คน
                      </div>
                    </div>
                  </div>

                  {/* Premise Characteristics */}
                  <div className="bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block leading-tight">ลักษณะสถานที่:</span>
                      <span className="text-xs font-semibold text-slate-800 truncate block">
                        {(!est.premiseCharacteristics || est.premiseCharacteristics === '-') ? 'อยู่ในอาคารพาณิชย์' : est.premiseCharacteristics}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Quick Actions */}
                <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingEst(est)}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-amber-200 hover:border-amber-500 shadow-2xs"
                      title="แก้ไขข้อมูลสถานประกอบการและคำขอ"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>แก้ไข</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenArchive(est)}
                      className="px-2.5 py-1.5 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 border border-slate-200/80"
                      title="เปิดดูแฟ้มคำขอ & ประวัติเอกสาร"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>แฟ้มเอกสาร</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectEstablishment(est);
                      onPrintEstablishment(est, est.regType, 'garuda');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-blue-200 hover:border-blue-600 shadow-2xs"
                    title="พิมพ์ใบอนุญาต/หนังสือรับรอง (ครุฑ)"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>พิมพ์ใบอนุญาต</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Clean Simple Table View */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 border-collapse">
                <thead className="bg-slate-100/90 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">ลำดับ</th>
                    <th className="py-3 px-3">หมวด</th>
                    <th className="py-3 px-3 min-w-[160px]">ชื่อสถานประกอบการ</th>
                    <th className="py-3 px-3">ผู้ขออนุญาต</th>
                    <th className="py-3 px-3">ที่ตั้ง / หมู่บ้าน</th>
                    <th className="py-3 px-3 text-right">พื้นที่ (ตร.ม.)</th>
                    <th className="py-3 px-3 text-center">คนงาน (คน)</th>
                    <th className="py-3 px-3">ลักษณะสถานที่</th>
                    <th className="py-3 px-3 text-center">สถานะ</th>
                    <th className="py-3 px-3 text-center w-32">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((est, idx) => (
                    <tr key={est.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-3 whitespace-nowrap">{getCategoryBadge(est.category, est.regType)}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 line-clamp-1">{est.businessName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{est.regNumber || est.docNo || '-'}</div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">{est.ownerName || '-'}</td>
                      <td className="py-3 px-3 text-slate-600">{est.village || est.address || '-'}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-blue-600">
                        {est.areaSqm || 50}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600">
                        {est.workerCount || 1}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">
                        {(!est.premiseCharacteristics || est.premiseCharacteristics === '-') ? 'อยู่ในอาคารพาณิชย์' : est.premiseCharacteristics}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">{getStatusBadge(est.status)}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingEst(est)}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white transition-colors cursor-pointer"
                            title="แก้ไขข้อมูลร้าน"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectEstablishment(est);
                              onPrintEstablishment(est, est.regType, 'garuda');
                            }}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white transition-colors cursor-pointer"
                            title="พิมพ์ใบอนุญาต"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenArchive(est)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            title="เปิดแฟ้มคำขอ"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Establishment Modal */}
      {editingEst && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/15">
                  <FileEdit className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base font-heading">
                    แก้ไขข้อมูลสถานประกอบการ: {editingEst.businessName}
                  </h3>
                  <p className="text-xs text-blue-100">
                    เลขที่คำขอ: {editingEst.regNumber || editingEst.docNo || '-'} | {editingEst.categoryName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingEst(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: EstablishmentForm */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/60">
              <EstablishmentForm
                key={editingEst.id}
                initialValues={{
                  regType: editingEst.regType,
                  category: editingEst.category,
                  categoryName: editingEst.categoryName,
                  bookNo: editingEst.bookNo && editingEst.bookNo !== '-' ? editingEst.bookNo : '๑',
                  docNo: editingEst.docNo || editingEst.regNumber?.split('-').pop() || '001',
                  targetYear: parseInt(editingEst.regNumber?.match(/[-_](\d{2})[-_]/)?.[1] || '69', 10) + 2500,
                  businessName: editingEst.businessName,
                  ownerName: editingEst.ownerName,
                  citizenId: editingEst.citizenId,
                  phone: editingEst.phone,
                  email: editingEst.email || '',
                  lineId: editingEst.lineId || '',
                  fax: editingEst.fax || '',
                  village: editingEst.village,
                  address: editingEst.address,
                  lat: editingEst.lat,
                  lng: editingEst.lng,
                  areaSqm: editingEst.areaSqm || 50,
                  workerCount: editingEst.workerCount ?? 1,
                  premiseCharacteristics: (editingEst.premiseCharacteristics && editingEst.premiseCharacteristics !== '-') ? editingEst.premiseCharacteristics : 'อยู่ในอาคารพาณิชย์',
                  foodPlaceType: editingEst.foodPlaceType || 'selling',
                  foodTypeDetail: editingEst.foodTypeDetail || (editingEst.foodPlaceType === 'storage' ? 'อาหารแห้ง อาหารสำเร็จรูป และเครื่องดื่ม' : 'อาหารปรุงสำเร็จ และเครื่องดื่ม'),
                  distributionMethod: editingEst.distributionMethod || 'จำหน่ายปลีกหน้าร้าน (ซื้อกลับบ้าน)',
                  operatingHours: editingEst.operatingHours || '07:00 - 19:00 น.',
                  feeAmount: editingEst.feeAmount || 100,
                  receiptBookNo: editingEst.receiptBookNo && editingEst.receiptBookNo !== '-' ? editingEst.receiptBookNo : (editingEst.bookNo && editingEst.bookNo !== '-' ? editingEst.bookNo : '๑'),
                  receiptNo: editingEst.receiptNo || editingEst.docNo || '',
                  receiptDate: editingEst.receiptDate || editingEst.applicationSubmissionDate || editingEst.issueDate || new Date().toISOString().split('T')[0],
                  applicationSubmissionDate: editingEst.applicationSubmissionDate || editingEst.issueDate || new Date().toISOString().split('T')[0],
                  inspectorName: editingEst.inspectorName || '',
                  inspectorPosition: editingEst.inspectorPosition || 'นักวิชาการสาธารณสุขปฏิบัติการ'
                }}
                onSave={(values) => handleSaveEdit(values)}
                isSaving={isSavingEdit}
                onCancel={() => setEditingEst(null)}
                submitLabel="บันทึกการแก้ไขข้อมูล"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
