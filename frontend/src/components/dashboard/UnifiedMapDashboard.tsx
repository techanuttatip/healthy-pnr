import React, { useState, useMemo, useEffect } from 'react';
import type { Establishment } from '../../types/publicHealth';
import { OFFICIAL_VILLAGES } from '../../types/publicHealth';
import { PublicHealthMap } from '../gis/PublicHealthMap';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Plus,
  FolderOpen,
  Search,
  X,
  ChevronRight,
  BarChart3,
  FileText
} from 'lucide-react';
import { ExpiryNoticeModal } from './ExpiryNoticeModal';
import { GovSummaryReportModal } from './GovSummaryReportModal';

interface UnifiedMapDashboardProps {
  establishments: Establishment[];
  onOpenNewRequest: () => void;
  onNavigateToTable: (statusFilter?: string) => void;
  onPrintEstablishment: (est: Establishment) => void;
  onOpenArchive: (est: Establishment) => void;
  selectedId?: string | null;
}

export const UnifiedMapDashboard: React.FC<UnifiedMapDashboardProps> = ({
  establishments,
  onOpenNewRequest,
  onNavigateToTable,
  onPrintEstablishment,
  onOpenArchive,
  selectedId
}) => {
  // Selected establishment
  const [selectedEstId, setSelectedEstId] = useState<string | null>(selectedId || null);

  useEffect(() => {
    if (selectedId) {
      setSelectedEstId(selectedId);
    }
  }, [selectedId]);

  // Status Filter from KPI chips: 'all' | 'active' | 'expiring' | 'pending_inspection' | 'awaiting_payment' | 'pending_correction'
  const [activeKpiFilter, setActiveKpiFilter] = useState<string>('all');

  // Search & Category & Village filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Drawer toggles
  const [isListDrawerOpen, setIsListDrawerOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isExpiryRadarOpen, setIsExpiryRadarOpen] = useState(false);
  const [noticeTargetEst, setNoticeTargetEst] = useState<Establishment | null>(null);

  // KPI Calculations
  const totalCount = establishments.length;
  const activeCount = useMemo(() => establishments.filter((e) => e.status === 'active').length, [establishments]);
  const expiringCount = useMemo(() => establishments.filter((e) => e.status === 'expiring').length, [establishments]);
  const pendingInspectionCount = useMemo(() => establishments.filter((e) => e.status === 'pending_inspection').length, [establishments]);
  const awaitingPaymentCount = useMemo(() => establishments.filter((e) => e.status === 'awaiting_payment').length, [establishments]);

  // Filtered list for map & sidebar
  const filteredEstablishments = useMemo(() => {
    return establishments.filter((est) => {
      // KPI filter
      if (activeKpiFilter !== 'all' && est.status !== activeKpiFilter) {
        return false;
      }
      // Village filter
      if (selectedVillage !== 'all' && est.village !== selectedVillage) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && est.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          est.businessName.toLowerCase().includes(q) ||
          est.ownerName.toLowerCase().includes(q) ||
          (est.village || '').toLowerCase().includes(q) ||
          (est.regNumber || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [establishments, activeKpiFilter, selectedVillage, selectedCategory, searchQuery]);

  const selectedEstablishment = useMemo(() => {
    if (!selectedEstId) return null;
    return establishments.find((e) => e.id === selectedEstId) || null;
  }, [establishments, selectedEstId]);

  return (
    <div className="flex-1 h-full relative overflow-hidden flex flex-col md:flex-row bg-slate-950">
      {/* LEFT PANEL: ข้อมูลต่างๆ (4 Stacked Information Cards as requested) */}
      <div className="hidden md:flex md:w-96 shrink-0 h-full flex-col bg-slate-900 border-r border-slate-800 z-20 overflow-hidden shadow-2xl">
        {/* Block 1: Header & New Request Button */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">ภาพรวมงานทะเบียน & GIS</h2>
                <p className="text-[10px] text-slate-400">อบต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTable(activeKpiFilter)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer transition-all"
              title="ดูตารางเต็ม"
            >
              <span>ตาราง</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenNewRequest}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ บันทึกรับคำขอใหม่ (6 บริการ)</span>
          </button>
        </div>

        {/* Block 2: 4 Interactive KPI Counters */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* All */}
            <button
              type="button"
              onClick={() => setActiveKpiFilter('all')}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                activeKpiFilter === 'all'
                  ? 'bg-blue-600/30 border-blue-500 text-white ring-1 ring-blue-500/50'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="text-[10px] text-slate-400">ร้านทั้งหมด</div>
              <div className="text-lg font-bold font-mono text-white mt-0.5">{totalCount}</div>
            </button>

            {/* Active */}
            <button
              type="button"
              onClick={() => setActiveKpiFilter(activeKpiFilter === 'active' ? 'all' : 'active')}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                activeKpiFilter === 'active'
                  ? 'bg-emerald-600/30 border-emerald-500 text-white ring-1 ring-emerald-500/50'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>มีใบอนุญาต</span>
              </div>
              <div className="text-lg font-bold font-mono text-emerald-300 mt-0.5">{activeCount}</div>
            </button>

            {/* Expiring */}
            <button
              type="button"
              onClick={() => setActiveKpiFilter(activeKpiFilter === 'expiring' ? 'all' : 'expiring')}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                activeKpiFilter === 'expiring'
                  ? 'bg-amber-600/30 border-amber-500 text-white ring-1 ring-amber-500/50'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="text-[10px] text-amber-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>ใกล้สิ้นอายุ</span>
              </div>
              <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">{expiringCount}</div>
            </button>

            {/* Pending Inspection */}
            <button
              type="button"
              onClick={() => setActiveKpiFilter(activeKpiFilter === 'pending_inspection' ? 'all' : 'pending_inspection')}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                activeKpiFilter === 'pending_inspection'
                  ? 'bg-purple-600/30 border-purple-500 text-white ring-1 ring-purple-500/50'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="text-[10px] text-purple-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>รอนัดตรวจ</span>
              </div>
              <div className="text-lg font-bold font-mono text-purple-300 mt-0.5">{pendingInspectionCount}</div>
            </button>
          </div>

          {/* Quick Gov Tools Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setNoticeTargetEst(null);
                setIsExpiryRadarOpen(true);
              }}
              className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-[11px] font-bold flex items-center justify-between shadow-md transition-all cursor-pointer"
              title="เปิดเรดาร์ตรวจจับใบอนุญาตใกล้สิ้นอายุ & พิมพ์หนังสือแจ้งเตือนราชการ"
            >
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
                <span>เรดาร์เตือนหมดอายุ</span>
              </div>
              <span className="font-mono bg-black/20 px-1.5 py-0.2 rounded text-[10px]">
                {expiringCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsStatsModalOpen(true)}
              className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="เปิดรายงานสถิติราชการ 1-คลิก และส่งออก Excel / CSV"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-200" />
              <span>รายงานสถิติราชการ</span>
            </button>
          </div>
        </div>

        {/* Block 3: Search & Village Filters */}
        <div className="p-3 border-b border-slate-800 shrink-0 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาร้าน, เจ้าของ, เลขทะเบียน..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer truncate"
              title="กรองตามหมู่บ้าน"
            >
              <option value="all">ทุกหมู่บ้าน (7 หมู่)</option>
              {OFFICIAL_VILLAGES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer truncate"
              title="กรองตามหมวดกิจการ"
            >
              <option value="all">ทุกหมวดกิจการ</option>
              <option value="food_storage">📦 สะสมอาหาร</option>
              <option value="food_selling">🍽️ จำหน่ายอาหาร</option>
              <option value="hazardous">☣️ กิจการอันตราย</option>
              <option value="market">🏪 ตลาด</option>
            </select>
          </div>
        </div>

        {/* Block 4: Scrollable Store List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 px-1">
            <span>รายชื่อ ({filteredEstablishments.length} แห่ง)</span>
            {activeKpiFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setActiveKpiFilter('all')}
                className="text-blue-400 hover:underline cursor-pointer"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>

          {filteredEstablishments.map((est) => (
            <div
              key={est.id}
              onClick={() => setSelectedEstId(est.id)}
              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                selectedEstId === est.id
                  ? 'bg-blue-600/30 border-blue-400 text-white font-semibold ring-1 ring-blue-400/40 shadow-sm'
                  : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/70 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="font-bold line-clamp-1 flex-1 text-white">{est.businessName}</div>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-700/80 text-blue-300 font-bold shrink-0">
                  {est.regType}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span className="truncate max-w-[140px]">{est.ownerName}</span>
                <span className="text-slate-500 shrink-0">{est.village}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT AREA: GIS MAP with locked zoom */}
      <div className="flex-1 h-full relative overflow-hidden">
        <PublicHealthMap
          establishments={filteredEstablishments}
          selectedId={selectedEstId}
          onSelectEstablishment={(est) => setSelectedEstId(est.id)}
          onQuickPrint={(est) => onPrintEstablishment(est)}
          filterCategory="all"
          filterStatus="all"
          onToggleSidebar={() => setIsListDrawerOpen(true)}
        />

        {/* Top Right Quick Stats Button (Positioned left of the satellite switcher to prevent overlapping) */}
        <div className="absolute top-4 right-[280px] z-20 pointer-events-auto hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsStatsModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-slate-200 border border-slate-700/80 hover:bg-slate-800 text-xs font-bold shadow-lg backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
            <span>สถิติ</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Only on small screens) */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-40 w-80 max-w-[85vw] transition-transform duration-300 ${
          isListDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full bg-slate-900 border-r border-slate-700 p-4 flex flex-col text-white shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="font-bold text-sm">ข้อมูลสถานประกอบการ</span>
            <button
              type="button"
              onClick={() => setIsListDrawerOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="py-2">
            <button
              type="button"
              onClick={() => {
                setIsListDrawerOpen(false);
                onOpenNewRequest();
              }}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>บันทึกรับคำขอใหม่</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredEstablishments.map((est) => (
              <div
                key={est.id}
                onClick={() => {
                  setSelectedEstId(est.id);
                  setIsListDrawerOpen(false);
                }}
                className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs"
              >
                <div className="font-bold text-white">{est.businessName}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{est.ownerName} · {est.village}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. BOTTOM FLOATING ACTION CARD (When a shop is selected) */}
      {selectedEstablishment && (
        <div className="absolute bottom-4 right-3 left-3 md:left-auto md:w-[420px] z-20 bg-slate-900/95 backdrop-blur-xl rounded-2xl p-3.5 border border-slate-700/90 shadow-2xl text-white animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white truncate">
                  {selectedEstablishment.businessName}
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold shrink-0">
                  {selectedEstablishment.regType}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                ผู้ขออนุญาต: {selectedEstablishment.ownerName} · {selectedEstablishment.village}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedEstId(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer shrink-0"
              title="ปิดการเลือก"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Score & Status summary */}
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">สุขลักษณะ:</span>
              {selectedEstablishment.inspectionScore !== undefined ? (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] ${
                    selectedEstablishment.inspectionScore >= 80
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {selectedEstablishment.inspectionScore >= 80 ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  <span>{selectedEstablishment.inspectionScore}/100</span>
                </span>
              ) : (
                <span className="text-slate-400 text-[11px]">รอนัดตรวจ</span>
              )}
            </div>

            <div className="font-mono text-xs font-bold text-amber-300">
              ค่าธรรมเนียม: {selectedEstablishment.feeAmount?.toLocaleString() || 0} ฿
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onPrintEstablishment(selectedEstablishment)}
              className="py-2 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ใบอนุญาต</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenArchive(selectedEstablishment)}
              className="py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>แฟ้มรายปี</span>
            </button>

            {/* Quick Warning Notice Button if expiring or expired */}
            {(selectedEstablishment.status === 'expiring' ||
              selectedEstablishment.permitStatus === 'ใกล้หมดอายุ' ||
              selectedEstablishment.permitStatus === 'หมดอายุ') && (
              <button
                type="button"
                onClick={() => {
                  setNoticeTargetEst(selectedEstablishment);
                  setIsExpiryRadarOpen(true);
                }}
                className="col-span-2 py-2 px-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <FileText className="w-3.5 h-3.5 text-amber-200" />
                <span>ออกหนังสือแจ้งเตือนต่ออายุ (นจ.ราชการ)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Expiry Radar & Official Renewal Notice Generator Modal */}
      <ExpiryNoticeModal
        establishments={establishments}
        isOpen={isExpiryRadarOpen}
        onClose={() => {
          setIsExpiryRadarOpen(false);
          setNoticeTargetEst(null);
        }}
        initialEstablishment={noticeTargetEst}
      />

      {/* 1-Click Government Statistics & Sanitation Summary Export Modal */}
      <GovSummaryReportModal
        establishments={establishments}
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
      />

    </div>
  );
};
