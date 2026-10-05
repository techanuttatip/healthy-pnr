import React, { useState, useMemo } from 'react';
import {
  Building2,
  ClipboardCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MapPin,
  PieChart,
  Printer,
  FileText,
  Sparkles,
  Plus,
  ArrowRight,
  Settings,
  FolderOpen,
  Receipt,
  Search
} from 'lucide-react';
import type { Establishment } from '../../types/publicHealth';
import { OFFICIAL_VILLAGES } from '../../types/publicHealth';

interface PublicHealthDashboardProps {
  establishments: Establishment[];
  onOpenNewRequest: () => void;
  onNavigateToTable: (statusFilter?: string) => void;
  onNavigateToMap: () => void;
  onInspectEstablishment: (est: Establishment) => void;
  onPrintEstablishment: (est: Establishment) => void;
  onPrintReport?: () => void;
  onOpenSettings?: () => void;
  onEditEstablishment: (est: Establishment) => void;
  onOpenArchive?: (est?: Establishment) => void;
}

const VILLAGES_LIST = OFFICIAL_VILLAGES;

export const PublicHealthDashboard: React.FC<PublicHealthDashboardProps> = ({
  establishments,
  onOpenNewRequest,
  onNavigateToTable,
  onNavigateToMap,
  onInspectEstablishment,
  onPrintEstablishment,
  onPrintReport,
  onOpenSettings,
  onEditEstablishment,
  onOpenArchive
}) => {
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'pending_inspection' | 'pending_correction' | 'expiring'>('all');
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [dashboardInstantSearch, setDashboardInstantSearch] = useState('');

  const instantSearchResults = useMemo(() => {
    if (!dashboardInstantSearch.trim()) return [];
    const q = dashboardInstantSearch.toLowerCase();
    return establishments
      .filter(
        (e) =>
          e.businessName?.toLowerCase().includes(q) ||
          e.ownerName?.toLowerCase().includes(q) ||
          e.regNumber?.toLowerCase().includes(q) ||
          e.village?.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [establishments, dashboardInstantSearch]);

  // 1. Executive Summary Statistics
  const totalCount = establishments.length;
  const activeCount = establishments.filter((e) => e.status === 'active').length;
  const pendingInspectionCount = establishments.filter((e) => e.status === 'pending_inspection').length;
  const pendingCorrectionCount = establishments.filter((e) => e.status === 'pending_correction').length;
  const expiringCount = establishments.filter((e) => e.status === 'expiring').length;
  const awaitingPaymentCount = establishments.filter((e) => e.status === 'awaiting_payment').length;

  // 2. Category Breakdown (พ.ร.บ. สาธารณสุข ๒๕๓๕)
  const categoryStats = useMemo(() => {
    const counts: Record<string, { label: string; count: number; fee: number; color: string; bg: string }> = {
      food_notice: { label: 'สถานที่จำหน่ายอาหาร ≤ 200 ตร.ม. (นจ.)', count: 0, fee: 0, color: '#2563eb', bg: 'bg-blue-500' },
      food_license: { label: 'สถานที่จำหน่ายอาหาร > 200 ตร.ม. (บทอ.)', count: 0, fee: 0, color: '#0d9488', bg: 'bg-teal-500' },
      hazardous: { label: 'กิจการที่เป็นอันตรายต่อสุขภาพ (บทส.)', count: 0, fee: 0, color: '#7c3aed', bg: 'bg-purple-500' },
      market: { label: 'ตลาดเอกชน/ตลาดนัดชุมชน (อส.)', count: 0, fee: 0, color: '#f59e0b', bg: 'bg-amber-500' },
      public_sale: { label: 'จำหน่ายสินค้าในที่สาธารณะ (นส.)', count: 0, fee: 0, color: '#ec4899', bg: 'bg-pink-500' },
      waste_sewage: { label: 'รับทำการกำจัดสิ่งปฏิกูล/มูลฝอย (ปป.)', count: 0, fee: 0, color: '#10b981', bg: 'bg-emerald-500' }
    };

    establishments.forEach((e) => {
      const cat = e.category in counts ? e.category : 'food_notice';
      counts[cat].count += 1;
      counts[cat].fee += Number(e.feeAmount) || 0;
    });

    return counts;
  }, [establishments]);

  // 3. Actionable Sanitation & Field Inspection List
  const scheduledInspections = useMemo(() => {
    return establishments.filter((est) => {
      const matchesFilter =
        scheduleFilter === 'all'
          ? est.status === 'pending_inspection' || est.status === 'pending_correction' || est.status === 'expiring'
          : est.status === scheduleFilter;

      if (!matchesFilter) return false;

      if (!scheduleSearch.trim()) return true;
      const q = scheduleSearch.toLowerCase();
      return (
        est.businessName?.toLowerCase().includes(q) ||
        est.ownerName?.toLowerCase().includes(q) ||
        est.village?.toLowerCase().includes(q) ||
        est.regNumber?.toLowerCase().includes(q)
      );
    });
  }, [establishments, scheduleFilter, scheduleSearch]);

  // 4. Village Breakdown (12 Villages)
  const villageStats = useMemo(() => {
    const counts: Record<string, number> = {};
    VILLAGES_LIST.forEach((v) => (counts[v] = 0));
    establishments.forEach((e) => {
      const v = e.village || VILLAGES_LIST[0];
      counts[v] = (counts[v] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      shortName: name.replace('หมู่ที่ ', 'ม.'),
      count,
      percent: Math.round((count / Math.max(totalCount, 1)) * 100)
    }));
  }, [establishments, totalCount]);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-transparent p-4 md:p-6 space-y-5 font-sans relative no-scrollbar">
      {/* 1. EXECUTIVE WELCOME BANNER (GLASSMORPHISM STYLE) */}
      <div className="gov-card p-5 md:p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative overflow-hidden rounded-2xl">
        {/* Subtle Watermark of Pong Nam Ron Landscape */}
        <div className="pnr-hero-backdrop" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-full border-2 border-amber-400 bg-white shadow-md shrink-0 flex items-center justify-center p-1">
            <img
              src="/pnr_logo.png"
              alt="ตราสัญลักษณ์ อบต.โป่งน้ำร้อน"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-semibold mb-0.5">
              ยินดีต้อนรับเข้าสู่ระบบ
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight font-heading">
              ศูนย์บัญชาการและแผนบูรณาการงานทะเบียน
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>องค์การบริหารส่วนตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่</span>
            </p>
          </div>
        </div>

        {/* Center Quote in Italic Script Style */}
        <div className="hidden 2xl:block relative z-10 italic text-slate-600 text-xs border-l-2 border-amber-400 pl-4 py-1 font-serif leading-relaxed max-w-xs">
          “เอกสารทุกฉบับ คือรอยต่อของการพัฒนาท้องถิ่น”
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start xl:self-auto relative z-10">
          {/* Primary Action Button: Blue Glow Gradient */}
          <button
            type="button"
            onClick={onOpenNewRequest}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="บันทึกรับคำขอใบอนุญาตใหม่ (นจ.๑, บทอ.๑, บทส.๑)"
          >
            <Plus className="w-4 h-4" />
            <span>+ บันทึกรับคำขอใหม่</span>
          </button>

          {/* Secondary Action: ทะเบียนเอกสาร */}
          <button
            type="button"
            onClick={() => onNavigateToTable()}
            className="px-3.5 py-2.5 rounded-xl bg-white/90 hover:bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>ทะเบียนเอกสาร</span>
          </button>

          {/* Secondary Action: แฟ้มเอกสารรายปี */}
          {onOpenArchive && (
            <button
              type="button"
              onClick={() => onOpenArchive()}
              className="px-3.5 py-2.5 rounded-xl bg-white/90 hover:bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="เปิดแฟ้มจัดเก็บเอกสารรายปี ๕ ฉบับ (คำขอ, บัตร ปชช., ผลตรวจ, ใบเสร็จ, ใบอนุญาต)"
            >
              <FolderOpen className="w-4 h-4 text-slate-500" />
              <span>แฟ้มเอกสารรายปี</span>
            </button>
          )}

          {/* Secondary Action: ตั้งค่าระบบ */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl bg-white/90 hover:bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-xs cursor-pointer"
              title="ตั้งค่าระบบ ข้อมูลองค์กร และอัตราค่าธรรมเนียม"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 1.5 SSSS FAST-TRACK SERVICE WIZARD (แผนผังทางลัดปฏิบัติงาน ๓ ขั้นตอน) */}
      <div className="gov-card p-4 sm:p-5 rounded-2xl bg-white/95 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5 font-heading">
              <span>⚡ แผนผังทางลัดปฏิบัติงาน ๓ สเต็ป</span>
              <span className="text-xs font-normal text-slate-500 hidden sm:inline">(Fast-Track e-Service Flow)</span>
            </h2>
          </div>
          {/* Quick Filter Search */}
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={dashboardInstantSearch}
              onChange={(e) => setDashboardInstantSearch(e.target.value)}
              placeholder="ค้นหาร้านด่วน (ชื่อร้าน, เจ้าของ, ม.)..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-all font-sans"
            />
            {dashboardInstantSearch && (
              <button
                type="button"
                onClick={() => setDashboardInstantSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-3.5">
          {/* Step 1 */}
          <div
            onClick={onOpenNewRequest}
            className="p-3.5 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-white to-blue-50/30 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0 group-hover:scale-105 transition-transform">
              ๑
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-blue-950 flex items-center justify-between">
                <span>รับคำขอ / ต่ออายุใหม่</span>
                <span className="text-[10px] text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">คลิกเริ่ม ➔</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                บันทึกคำขอ นจ.๑, บทอ.๑, บทส.๑ ออกใบรับแจ้งชั่วคราว Day-1 ได้ทันที
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => onNavigateToTable('pending_inspection')}
            className="p-3.5 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0 group-hover:scale-105 transition-transform">
              ๒
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-amber-950 flex items-center justify-between">
                <span>ตรวจประเมินสุขลักษณะ</span>
                {pendingInspectionCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold font-mono">
                    {pendingInspectionCount} คิว
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                ลงพื้นที่ตรวจสถานที่ บันทึกคะแนน และเซ็นชื่อดิจิทัลผ่านแท็บเล็ต
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div
            onClick={() => {
              if (onPrintReport) {
                onPrintReport();
              } else {
                onNavigateToTable('active');
              }
            }}
            className="p-3.5 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0 group-hover:scale-105 transition-transform">
              ๓
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-emerald-950 flex items-center justify-between">
                <span>สั่งพิมพ์ใบเสร็จ & ใบอนุญาต</span>
                <span className="text-[10px] text-emerald-600 font-semibold group-hover:translate-x-0.5 transition-transform">คลิกพิมพ์ ➔</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                ออกใบเสร็จรับเงิน ใบอนุญาตตราครุฑ ป้าย Clean Food Good Taste
              </p>
            </div>
          </div>
        </div>

        {/* Instant Search Results Dropdown */}
        {dashboardInstantSearch.trim().length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
              <span>ผลการค้นหาด่วน ({instantSearchResults.length} รายการ):</span>
              <span className="text-[11px] text-slate-400 font-normal">กดปุ่มพิมพ์หรือตรวจได้ทันที</span>
            </div>
            {instantSearchResults.length === 0 ? (
              <div className="text-xs text-slate-400 py-3 text-center">
                ไม่พบร้านค้าที่ตรงกับ "{dashboardInstantSearch}"
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {instantSearchResults.map((est) => (
                  <div
                    key={est.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-blue-400 transition-all text-xs flex flex-col justify-between gap-2 shadow-2xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 truncate">{est.businessName}</div>
                      <div className="text-[11px] text-slate-500 truncate">{est.ownerName} • {est.village}</div>
                      <div className="text-[10px] font-mono text-blue-700 mt-0.5">{est.regNumber}</div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => onPrintEstablishment(est)}
                        className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold text-center transition-colors cursor-pointer"
                      >
                        🖨️ พิมพ์
                      </button>
                      <button
                        type="button"
                        onClick={() => onInspectEstablishment(est)}
                        className="flex-1 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold text-center transition-colors cursor-pointer"
                      >
                        📋 ตรวจ
                      </button>
                      {onOpenArchive && (
                        <button
                          type="button"
                          onClick={() => onOpenArchive(est)}
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold text-center transition-colors cursor-pointer"
                          title="ดูแฟ้มรายปี"
                        >
                          📁
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. TOP 6 KPI SUMMARY CARDS (GLASSMORPHISM STYLE WITH ORIGINAL CONTENT) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: สถานประกอบการทั้งหมด (Solid Blue Square Icon) */}
        <div
          onClick={() => onNavigateToTable('all')}
          className="gov-card gov-card-interactive p-4 cursor-pointer group rounded-2xl"
        >
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-500/25 text-white flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700 leading-tight">
              สถานประกอบการทั้งหมด
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900 tracking-tight my-1">
            {totalCount}
          </div>
          <div className="text-[10px] mt-1 flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">↑ ๑๒%</span>
            <span className="text-slate-500 truncate">เทียบจากเดือนที่แล้ว</span>
          </div>
        </div>

        {/* Card 2: ได้รับอนุญาตปกติ (Solid Emerald Green Square Icon) */}
        <div
          onClick={() => onNavigateToTable('active')}
          className="gov-card gov-card-interactive p-4 cursor-pointer group rounded-2xl"
        >
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/25 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-emerald-900 leading-tight">
              ได้รับอนุญาตปกติ
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-700 tracking-tight my-1">
            {activeCount}
          </div>
          <div className="text-[10px] mt-1 flex items-center gap-1.5 pt-1.5 border-t border-emerald-50">
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">↑ ๘%</span>
            <span className="text-slate-500 truncate">มีผลบังคับใช้</span>
          </div>
        </div>

        {/* Card 3: รอนัดตรวจสถานที่ (Solid Purple Square Icon) */}
        <div
          onClick={() => onNavigateToTable('pending_inspection')}
          className="gov-card gov-card-interactive p-4 cursor-pointer group rounded-2xl"
        >
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-md shadow-purple-500/25 text-white flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-purple-900 leading-tight">
              รอนัดตรวจสถานที่
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-purple-700 tracking-tight my-1">
            {pendingInspectionCount}
          </div>
          <div className="text-[10px] mt-1 flex items-center gap-1.5 pt-1.5 border-t border-purple-50">
            <span className="text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded">↑ ๑๕%</span>
            <span className="text-slate-500 truncate">คิวตรวจรอบแรก</span>
          </div>
        </div>

        {/* Card 4: สั่งแก้ไขปรับปรุง (Solid Amber/Orange Square Icon) */}
        <div
          onClick={() => onNavigateToTable('pending_correction')}
          className="gov-card gov-card-interactive p-4 cursor-pointer group rounded-2xl"
        >
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/25 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-amber-900 leading-tight">
              สั่งแก้ไขปรับปรุง
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-700 tracking-tight my-1">
            {pendingCorrectionCount}
          </div>
          <div className="text-[10px] mt-1 flex items-center gap-1.5 pt-1.5 border-t border-amber-50">
            <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">↑ ๕%</span>
            <span className="text-slate-500 truncate">กำหนด ๑๕-๓๐ วัน</span>
          </div>
        </div>

        {/* Card 5: รอต่ออายุ (เตือน 30 วัน) (Solid Rose/Red Square Icon) */}
        <div
          onClick={() => onNavigateToTable('expiring')}
          className="gov-card gov-card-interactive p-4 cursor-pointer group rounded-2xl"
        >
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-md shadow-rose-500/25 text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-rose-900 leading-tight">
              รอต่ออายุ (เตือน 30 วัน)
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-rose-700 tracking-tight my-1">
            {expiringCount}
          </div>
          <div className="text-[10px] mt-1 flex items-center gap-1.5 pt-1.5 border-t border-rose-50">
            <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded">↓ ๒๐%</span>
            <span className="text-slate-500 truncate">ใกล้สิ้นอายุ</span>
          </div>
        </div>

        {/* Card 6: รอชำระค่าธรรมเนียม (Solid Cyan Square Icon) */}
        <div
          onClick={() => onNavigateToTable('awaiting_payment')}
          className="gov-card gov-card-interactive p-4 cursor-pointer group rounded-2xl"
        >
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-md shadow-cyan-500/25 text-white flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-cyan-900 leading-tight">
              รอชำระค่าธรรมเนียม
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-cyan-700 tracking-tight my-1">
            {awaitingPaymentCount}
          </div>
          <div className="text-[10px] mt-1 flex items-center gap-1.5 pt-1.5 border-t border-cyan-50">
            <span className="text-cyan-700 font-bold bg-cyan-50 px-1.5 py-0.5 rounded">เลขที่คลัง</span>
            <span className="text-slate-500 truncate">ผ่านตรวจแล้ว</span>
          </div>
        </div>
      </div>

      {/* 3. CHARTS & OPERATIONS SECTION (ORIGINAL 2 COLS: SANITATION INSPECTION BOARD & CATEGORY BREAKDOWN) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Sanitation Inspection & Operations Board */}
        <div className="lg:col-span-2 gov-card p-5 flex flex-col justify-between rounded-2xl">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 font-heading">
                      แผนปฏิบัติการและกำหนดการลงพื้นที่ตรวจสุขลักษณะ
                    </h3>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      งานตรวจภาคสนาม
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ติดตามคิวตรวจสุขาภิบาลรอบแรก คำสั่งปรับปรุง ๑๕-๓๐ วัน และการตรวจต่ออายุประจำปีในพื้นที่ ๑๒ หมู่บ้าน
                  </p>
                </div>
              </div>

              {/* Status summary pill indicators */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                  รอตรวจ {pendingInspectionCount}
                </span>
                <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                  สั่งปรับปรุง {pendingCorrectionCount}
                </span>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  เตือนต่ออายุ {expiringCount}
                </span>
              </div>
            </div>

            {/* Pill Filter Tabs Bar & Search Box */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                <button
                  type="button"
                  onClick={() => setScheduleFilter('all')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    scheduleFilter === 'all'
                      ? 'bg-[#0c1a2e] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  ทั้งหมดที่ต้องลงพื้นที่ ({pendingInspectionCount + pendingCorrectionCount + expiringCount})
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleFilter('pending_inspection')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    scheduleFilter === 'pending_inspection'
                      ? 'bg-[#0c1a2e] text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  รอนัดตรวจรอบแรก ({pendingInspectionCount})
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleFilter('pending_correction')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    scheduleFilter === 'pending_correction'
                      ? 'bg-[#0c1a2e] text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  คำสั่งปรับปรุง ({pendingCorrectionCount})
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleFilter('expiring')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    scheduleFilter === 'expiring'
                      ? 'bg-[#0c1a2e] text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  ใกล้สิ้นอายุ ({expiringCount})
                </button>
              </div>

              {/* Quick Search */}
              <div className="relative w-full sm:w-52">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={scheduleSearch}
                  onChange={(e) => setScheduleSearch(e.target.value)}
                  placeholder="ค้นหาชื่อร้าน / เจ้าของ / เลขทะเบียน..."
                  className="w-full pl-8 pr-3 py-1 bg-white/90 border border-slate-200 rounded-full text-xs text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Scheduled Inspection Cards / Empty State */}
            <div className="min-h-[220px] flex flex-col justify-center">
              {scheduledInspections.length === 0 ? (
                <div className="p-10 text-center bg-slate-50/60 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 mb-3 shadow-inner">
                    <CheckCircle2 className="w-7 h-7 stroke-[1.8]" />
                  </div>
                  <div className="text-sm font-bold text-slate-800">ไม่มีรายการค้างตรวจในหมวดนี้</div>
                  <div className="text-xs text-slate-500 mt-1">
                    สถานประกอบการได้รับการตรวจติดตามสุขลักษณะและปฏิบัติถูกต้องครบถ้วนตามเกณฑ์
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {scheduledInspections.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white/90 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 group-hover:text-blue-800">
                            {item.businessName}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                            {item.regNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              item.status === 'pending_inspection'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : item.status === 'pending_correction'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {item.status === 'pending_inspection'
                              ? 'รอนัดตรวจรอบแรก'
                              : item.status === 'pending_correction'
                              ? 'คำสั่งปรับปรุง ๑๕-๓๐ วัน'
                              : 'ใกล้สิ้นอายุ (เตือนต่ออายุ)'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                          <span>เจ้าของ: <strong className="text-slate-700">{item.ownerName}</strong></span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-red-500" />
                            <span>{item.village}</span>
                          </span>
                          {item.phone && (
                            <>
                              <span>•</span>
                              <span>โทร: {item.phone}</span>
                            </>
                          )}
                          {item.inspectionScore !== undefined && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-semibold">
                                คะแนนตรวจ: {item.inspectionScore}/๑๐๐
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Operational Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => onInspectEstablishment(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-semibold shadow-2xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                          title="ลงพื้นที่ตรวจสุขลักษณะ / บันทึกผลตรวจ"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          <span>ตรวจสุขลักษณะ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onPrintEstablishment(item)}
                          className="px-2 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="พิมพ์ชุดเอกสารลงพื้นที่ตรวจสถานที่"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-500" />
                          <span className="hidden sm:inline">ชุดตรวจ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => (onOpenArchive ? onOpenArchive(item) : onEditEstablishment(item))}
                          className="px-2 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="เปิดแฟ้มจัดเก็บเอกสารรายปี"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                          <span className="hidden sm:inline">แฟ้ม</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Info Bar */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>ระบบบริหารจัดการและติดตามงานทะเบียนใบอนุญาต พ.ร.บ. การสาธารณสุข พ.ศ. ๒๕๓๕</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTable()}
              className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-1 rounded-full flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>ดูงานค้างทั้งหมด ({pendingInspectionCount + pendingCorrectionCount + expiringCount})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right 1 Col: Category Distribution (ORIGINAL CONTENT) */}
        <div className="gov-card p-5 flex flex-col justify-between rounded-2xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  สัดส่วนประเภทสถานประกอบการ
                </h3>
              </div>
              <span className="badge-gov badge-gov-neutral">
                ตาม พ.ร.บ. ๒๕๓๕
              </span>
            </div>

            {/* List of categories with visual bars */}
            <div className="space-y-3">
              {Object.entries(categoryStats).map(([key, cat]) => {
                const percent = Math.round((cat.count / Math.max(totalCount, 1)) * 100);
                return (
                  <div
                    key={key}
                    onClick={() => onNavigateToTable()}
                    className="space-y-1 p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    title={`คลิกเพื่อดูรายการสถานประกอบการ: ${cat.label}`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 group-hover:text-blue-700 truncate max-w-[210px]" title={cat.label}>
                        {cat.label}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-slate-900 group-hover:text-blue-700 font-mono">{cat.count} แห่ง</span>
                        <span className="text-[10px] text-slate-400 font-mono">({percent}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${cat.bg} rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/60 rounded-xl p-3 text-[11px] text-slate-700 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-900">สถานประกอบการที่ได้รับอนุญาตแล้ว:</span> {activeCount} แห่ง (คิดเป็น {Math.round((activeCount / Math.max(totalCount, 1)) * 100)}%)
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTable('active')}
              className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <span>ดูรายการ</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. LOWER ROW: 12 VILLAGES DISTRIBUTION & QUICK LAUNCHPAD (ORIGINAL CONTENT) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: 12 Villages Breakdown */}
        <div className="gov-card p-5 flex flex-col justify-between rounded-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                สถิติการกระจายตัว ๑๒ หมู่บ้าน (ต.โป่งน้ำร้อน)
              </h3>
            </div>
            <button
              type="button"
              onClick={onNavigateToMap}
              className="text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1 rounded-full cursor-pointer transition-all flex items-center gap-1"
            >
              <span>เปิดแผนที่ดาวเทียม GIS</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-2">
            {villageStats.map((v) => (
              <div
                key={v.name}
                onClick={onNavigateToMap}
                className="p-2.5 rounded-xl border border-slate-200/80 bg-white/90 hover:bg-white hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="text-[11px] font-semibold text-slate-700 truncate group-hover:text-blue-700">
                  {v.shortName}
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-base font-bold font-mono text-slate-900 group-hover:text-blue-700">
                    {v.count} <span className="text-[10px] font-normal text-slate-500">แห่ง</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{v.percent}%</span>
                </div>
                <div className="w-full h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-blue-700 rounded-full group-hover:bg-blue-600 transition-all"
                    style={{ width: `${Math.max(10, v.percent * 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>ครอบคลุมครบทั้ง ๑๒ เขตปกครองท้องที่ในสังกัด อบต.โป่งน้ำร้อน</span>
            <span className="text-blue-700 font-semibold">ระบบพิกัดดาวเทียม GIS ความละเอียดสูง</span>
          </div>
        </div>

        {/* Right: Quick Operations Launchpad (ORIGINAL 6 OPERATIONS) */}
        <div className="gov-card p-5 flex flex-col justify-between rounded-2xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  เมนูด่วนสำหรับเจ้าพนักงานสาธารณสุขและสารบรรณ
                </h3>
              </div>
              <span className="badge-gov badge-gov-neutral">
                Quick Launchpad
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-1">
              <button
                type="button"
                onClick={onOpenNewRequest}
                className="p-3 rounded-xl border border-slate-200/80 bg-white/90 hover:bg-white hover:border-slate-300 text-slate-800 transition-all text-left flex flex-col justify-between cursor-pointer group shadow-2xs active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center mb-2 shadow-2xs group-hover:bg-blue-600 transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">บันทึกรับคำขอใหม่</div>
                  <div className="text-[10px] text-slate-500">นจ.๑, บทอ.๑, บทส.๑</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateToTable()}
                className="p-3 rounded-xl border border-slate-200/80 bg-white/90 hover:bg-white hover:border-slate-300 text-slate-800 transition-all text-left flex flex-col justify-between cursor-pointer group shadow-2xs active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center mb-2 shadow-2xs group-hover:bg-slate-700 transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">ทะเบียนคุมสารบรรณ</div>
                  <div className="text-[10px] text-slate-500">ค้นหาและประวัติ</div>
                </div>
              </button>

              {onPrintReport && (
                <button
                  type="button"
                  onClick={onPrintReport}
                  className="p-3 rounded-xl border border-slate-200/80 bg-white/90 hover:bg-white hover:border-slate-300 text-slate-800 transition-all text-left flex flex-col justify-between cursor-pointer group shadow-2xs active:scale-95"
                  title="พิมพ์รายงานเอกสารรายการทะเบียนคุมสถานประกอบการทั้งหมด (A4 แนวนอน)"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center mb-2 shadow-2xs group-hover:bg-blue-600 transition-colors">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">พิมพ์ทะเบียนคุม</div>
                    <div className="text-[10px] text-slate-500">รายงาน A4 แนวนอน</div>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (establishments.length > 0) onPrintEstablishment(establishments[0]);
                }}
                className="p-3 rounded-xl border border-slate-200/80 bg-white/90 hover:bg-white hover:border-slate-300 text-slate-800 transition-all text-left flex flex-col justify-between cursor-pointer group shadow-2xs active:scale-95"
                title="เปิดศูนย์การพิมพ์เอกสารราชการ"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center mb-2 shadow-2xs group-hover:bg-slate-700 transition-colors">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">ศูนย์พิมพ์เอกสาร</div>
                  <div className="text-[10px] text-slate-500">ใบเสร็จ/บัตร/หนังสือเตือน</div>
                </div>
              </button>

              <button
                type="button"
                onClick={onNavigateToMap}
                className="p-3 rounded-xl border border-slate-200/80 bg-white/90 hover:bg-white hover:border-slate-300 text-slate-800 transition-all text-left flex flex-col justify-between cursor-pointer group shadow-2xs active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center mb-2 shadow-2xs group-hover:bg-blue-600 transition-colors">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">แผนที่พิกัด GIS</div>
                  <div className="text-[10px] text-slate-500">ภาพถ่ายดาวเทียม</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenArchive && establishments.length > 0) {
                    onOpenArchive(establishments[0]);
                  } else {
                    onOpenNewRequest();
                  }
                }}
                className="p-3 rounded-xl border border-slate-200/80 bg-white/90 hover:bg-white hover:border-slate-300 text-slate-800 transition-all text-left flex flex-col justify-between cursor-pointer group shadow-2xs active:scale-95"
                title="เปิดแฟ้มจัดเก็บเอกสารรายปี (๕ รายการ: คำขอ, บัตร ปชช., ผลตรวจ, ใบเสร็จ, ใบอนุญาต)"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center mb-2 shadow-2xs group-hover:bg-slate-700 transition-colors">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">แฟ้มเอกสารรายปี</div>
                  <div className="text-[10px] text-slate-500">จัดเก็บ ๕ รายการสมบูรณ์</div>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>ทางลัดเข้าถึงงานสารบรรณสาธารณสุข</span>
            <span className="text-blue-700 font-semibold">๖ เมนูปฏิบัติการหลัก</span>
          </div>
        </div>
      </div>
    </div>
  );
};
