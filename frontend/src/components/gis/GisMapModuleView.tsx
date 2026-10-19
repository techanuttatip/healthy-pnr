import React, { useState, useMemo } from 'react';
import {
  MapPin, X, ClipboardCheck, Printer, Search, Route as RouteIcon,
  Navigation, CheckCircle2, AlertTriangle, ExternalLink, Calendar,
  Clock, ArrowRight, CheckSquare, Square, RotateCcw, Sparkles
} from 'lucide-react';
import type { Establishment } from '../../types/publicHealth';
import { PublicHealthMap, type RouteWaypoint } from './PublicHealthMap';

interface GisMapModuleViewProps {
  establishments: Establishment[];
  selectedEstablishment: Establishment | null;
  selectedId: string | null;
  onSelectEstablishment: (est: Establishment) => void;
  onInspectEstablishment: (est: Establishment) => void;
  onPrintEstablishment: (est: Establishment) => void;
}

// Center point: Pong Nam Ron Subdistrict Administrative Organization
const PONG_NAM_RON_SAO = {
  lat: 19.93283454266061,
  lng: 99.17191325434383,
  name: 'ที่ทำการ อบต.โป่งน้ำร้อน (จุดเริ่มต้น)'
};

// Haversine formula to calculate distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

// Nearest Neighbor TSP Route Optimizer
function solveNearestNeighborRoute(
  startLat: number,
  startLng: number,
  items: Establishment[]
): {
  waypoints: RouteWaypoint[];
  totalDistanceKm: number;
  legDistances: number[];
  estimatedDriveMins: number;
  estimatedTotalMins: number;
} {
  const validItems = items.filter(
    (e) => typeof e.lat === 'number' && typeof e.lng === 'number' && !isNaN(e.lat) && !isNaN(e.lng)
  );

  const unvisited = [...validItems];
  const ordered: Establishment[] = [];
  const legDistances: number[] = [];
  let currentLat = startLat;
  let currentLng = startLng;
  let totalDistanceKm = 0;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let shortestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = calculateDistanceKm(currentLat, currentLng, unvisited[i].lat!, unvisited[i].lng!);
      if (dist < shortestDist) {
        shortestDist = dist;
        nearestIndex = i;
      }
    }

    const nextEst = unvisited.splice(nearestIndex, 1)[0];
    ordered.push(nextEst);
    legDistances.push(shortestDist);
    totalDistanceKm += shortestDist;
    currentLat = nextEst.lat!;
    currentLng = nextEst.lng!;
  }

  const waypoints: RouteWaypoint[] = ordered.map((est, idx) => ({
    id: est.id,
    lat: est.lat!,
    lng: est.lng!,
    label: est.businessName,
    order: idx + 1,
    village: est.village,
    regType: est.regType,
    ownerName: est.ownerName
  }));

  // Average 35 km/h driving speed + 15 mins inspection per stop
  const driveMins = Math.round((totalDistanceKm / 35) * 60);
  const inspectionMins = waypoints.length * 15;

  return {
    waypoints,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    legDistances,
    estimatedDriveMins: driveMins,
    estimatedTotalMins: driveMins + inspectionMins
  };
}

export const GisMapModuleView: React.FC<GisMapModuleViewProps> = ({
  establishments,
  selectedEstablishment,
  selectedId,
  onSelectEstablishment,
  onInspectEstablishment,
  onPrintEstablishment
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filterText, setFilterText] = useState('');

  // Route Planning States
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [routePreset, setRoutePreset] = useState<'urgent' | 'village' | 'all'>('urgent');
  const [selectedVillageFilter, setSelectedVillageFilter] = useState('ทั้งหมด');
  const [selectedStoreIdsForRoute, setSelectedStoreIdsForRoute] = useState<Record<string, boolean>>({});
  const [activeWaypoints, setActiveWaypoints] = useState<RouteWaypoint[]>([]);
  const [routeStats, setRouteStats] = useState<{
    totalKm: number;
    legs: number[];
    driveMins: number;
    totalMins: number;
  } | null>(null);

  // Village list
  const villageList = useMemo(() => {
    const set = new Set<string>();
    establishments.forEach((e) => {
      if (e.village) set.add(e.village);
    });
    return Array.from(set).sort();
  }, [establishments]);

  // Candidates for routing based on preset
  const candidateEstablishments = useMemo(() => {
    const withGps = establishments.filter((e) => typeof e.lat === 'number' && typeof e.lng === 'number');
    if (routePreset === 'urgent') {
      return withGps.filter(
        (e) =>
          e.status === 'expiring' ||
          e.status === 'pending_inspection' ||
          e.status === 'pending_correction' ||
          e.permitStatus === 'ใกล้หมดอายุ' ||
          e.permitStatus === 'หมดอายุ'
      );
    }
    if (routePreset === 'village' && selectedVillageFilter !== 'ทั้งหมด') {
      return withGps.filter((e) => e.village === selectedVillageFilter);
    }
    return withGps;
  }, [establishments, routePreset, selectedVillageFilter]);

  // Handle open route planner modal
  const handleOpenRoutePlanner = () => {
    const initSelected: Record<string, boolean> = {};
    candidateEstablishments.slice(0, 10).forEach((e) => {
      initSelected[e.id] = true;
    });
    setSelectedStoreIdsForRoute(initSelected);
    setIsRouteModalOpen(true);
  };

  // Calculate optimized route
  const handleCalculateRoute = () => {
    const picked = establishments.filter((e) => selectedStoreIdsForRoute[e.id]);
    if (picked.length === 0) {
      alert('กรุณาเลือกสถานประกอบการอย่างน้อย 1 แห่งเพื่อจัดเส้นทาง');
      return;
    }
    const result = solveNearestNeighborRoute(PONG_NAM_RON_SAO.lat, PONG_NAM_RON_SAO.lng, picked);
    setActiveWaypoints(result.waypoints);
    setRouteStats({
      totalKm: result.totalDistanceKm,
      legs: result.legDistances,
      driveMins: result.estimatedDriveMins,
      totalMins: result.estimatedTotalMins
    });
    setIsRouteModalOpen(false);
  };

  // Google Maps navigation URL for current route
  const googleMapsUrl = useMemo(() => {
    if (activeWaypoints.length === 0) return '';
    const origin = `${PONG_NAM_RON_SAO.lat},${PONG_NAM_RON_SAO.lng}`;
    const destination = `${activeWaypoints[activeWaypoints.length - 1].lat},${activeWaypoints[activeWaypoints.length - 1].lng}`;
    const intermediate = activeWaypoints.slice(0, -1);
    const waypointsParam = intermediate.map((w) => `${w.lat},${w.lng}`).join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${
      waypointsParam ? `&waypoints=${encodeURIComponent(waypointsParam)}` : ''
    }&travelmode=driving`;
  }, [activeWaypoints]);

  const filteredEstablishments = establishments.filter((est) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    return (
      est.businessName.toLowerCase().includes(q) ||
      est.ownerName.toLowerCase().includes(q) ||
      (est.village || '').toLowerCase().includes(q) ||
      (est.regNumber || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 h-full flex overflow-hidden p-2 sm:p-4 gap-3 bg-transparent relative">
      {/* Collapsible Establishment Selector Sidebar */}
      <div
        className={`fixed md:relative inset-y-0 left-0 z-30 md:z-auto transition-all duration-300 ease-in-out flex flex-col ${
          isSidebarOpen ? 'w-80 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:pointer-events-none'
        } ${isSidebarOpen ? 'md:w-80 md:opacity-100 md:pointer-events-auto' : ''}`}
      >
        <div className="w-80 h-full ui-card flex flex-col p-3.5 overflow-hidden shadow-lg border border-slate-200/90 bg-white">
          <div className="font-bold text-xs text-slate-800 pb-2.5 mb-2 border-b border-slate-100 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-heading">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>พิกัดสถานประกอบการ</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="ui-pill text-blue-700 bg-blue-50 border-blue-200">
                {establishments.length} แห่ง
              </span>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="ปิดแถบรายชื่อ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Route Planner trigger inside sidebar */}
          <div className="mb-2">
            <button
              type="button"
              onClick={handleOpenRoutePlanner}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-between shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <RouteIcon className="w-4 h-4 text-amber-300" />
                <span>จัดเส้นทางตรวจสนาม</span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                {activeWaypoints.length > 0 ? `${activeWaypoints.length} จุด` : 'อัจฉริยะ'}
              </span>
            </button>
          </div>

          {/* Quick Search in Map List */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="ค้นหาร้าน, เจ้าของ, หมู่บ้าน..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
            {filteredEstablishments.map((est) => (
              <div
                key={est.id}
                onClick={() => {
                  onSelectEstablishment(est);
                  if (window.innerWidth < 768) {
                    setIsSidebarOpen(false);
                  }
                }}
                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedId === est.id
                    ? 'bg-blue-50/80 border-blue-400 font-semibold text-blue-900 shadow-xs ring-1 ring-blue-400/30'
                    : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700 hover:shadow-2xs'
                }`}
              >
                <div className="font-bold line-clamp-1">{est.businessName}</div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>{est.village}</span>
                  <span className="font-mono font-bold text-blue-700 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100">
                    {est.regType}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {selectedEstablishment && (
            <div className="pt-2.5 border-t border-slate-100 mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => onInspectEstablishment(selectedEstablishment)}
                className="flex-1 ui-btn ui-btn-primary ui-btn-sm"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>ตรวจสถานที่</span>
              </button>
              <button
                type="button"
                onClick={() => onPrintEstablishment(selectedEstablishment)}
                className="flex-1 ui-btn ui-btn-success ui-btn-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์ใบอนุญาต</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 h-full relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
        <PublicHealthMap
          establishments={establishments}
          selectedId={selectedId}
          onSelectEstablishment={onSelectEstablishment}
          onQuickPrint={(est) => onPrintEstablishment(est)}
          onInspect={onInspectEstablishment}
          filterCategory="all"
          filterStatus="all"
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          routeWaypoints={activeWaypoints}
          onClearRoute={() => {
            setActiveWaypoints([]);
            setRouteStats(null);
          }}
          onOpenRoutePlanner={handleOpenRoutePlanner}
        />

        {/* Floating Quick Action Card on Map Bottom when an establishment is selected */}
        {selectedEstablishment && (
          <div className="absolute bottom-4 right-4 left-4 md:left-auto md:w-96 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {selectedEstablishment.businessName}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {selectedEstablishment.ownerName} · {selectedEstablishment.village}
                </div>
              </div>
              <span className="ui-pill text-blue-700 bg-blue-50 border-blue-200 shrink-0">
                {selectedEstablishment.regType}
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onInspectEstablishment(selectedEstablishment)}
                className="flex-1 ui-btn ui-btn-primary ui-btn-sm"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>ตรวจสถานที่</span>
              </button>
              <button
                type="button"
                onClick={() => onPrintEstablishment(selectedEstablishment)}
                className="flex-1 ui-btn ui-btn-secondary ui-btn-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์เอกสาร</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          Route Planner Modal / Slide-over Drawer
          ======================================================== */}
      {isRouteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <RouteIcon className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-white">
                    วางแผนเส้นทางตรวจสนามอัจฉริยะ (Smart Route Planner)
                  </h3>
                  <p className="text-[11px] text-blue-100">
                    คำนวณลำดับจุดตรวจที่ประหยัดเวลาและน้ำมันที่สุดจาก อบต.โป่งน้ำร้อน
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRouteModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets & Filter */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>เลือกกลุ่มเป้าหมายการลงพื้นที่:</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  จุดเริ่มต้น: 🏛️ อบต.โป่งน้ำร้อน
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRoutePreset('urgent');
                    const init: Record<string, boolean> = {};
                    establishments
                      .filter(
                        (e) =>
                          e.lat &&
                          e.lng &&
                          (e.status === 'expiring' ||
                            e.status === 'pending_inspection' ||
                            e.status === 'pending_correction' ||
                            e.permitStatus === 'ใกล้หมดอายุ' ||
                            e.permitStatus === 'หมดอายุ')
                      )
                      .slice(0, 10)
                      .forEach((e) => {
                        init[e.id] = true;
                      });
                    setSelectedStoreIdsForRoute(init);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    routePreset === 'urgent'
                      ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>งานด่วน (ใกล้หมดอายุ/รอตรวจ)</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    จัดลำดับร้านที่ต้องเร่งตรวจก่อน
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRoutePreset('village');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    routePreset === 'village'
                      ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>เจาะจงตามหมู่บ้าน</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    ลงตรวจรวดเดียวในพื้นที่เดียว
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRoutePreset('all');
                    const init: Record<string, boolean> = {};
                    establishments
                      .filter((e) => e.lat && e.lng)
                      .slice(0, 10)
                      .forEach((e) => {
                        init[e.id] = true;
                      });
                    setSelectedStoreIdsForRoute(init);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    routePreset === 'all'
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ร้านทั้งหมดที่มีพิกัด</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    เลือกเองจากรายชื่อในระบบ
                  </div>
                </button>
              </div>

              {routePreset === 'village' && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-semibold text-slate-600">เลือกหมู่บ้าน:</span>
                  <select
                    value={selectedVillageFilter}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSelectedVillageFilter(v);
                      const init: Record<string, boolean> = {};
                      establishments
                        .filter((est) => est.lat && est.lng && (v === 'ทั้งหมด' || est.village === v))
                        .slice(0, 10)
                        .forEach((est) => {
                          init[est.id] = true;
                        });
                      setSelectedStoreIdsForRoute(init);
                    }}
                    className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ทั้งหมด">ทุกหมู่บ้าน (ม.๑ - ม.๗)</option>
                    {villageList.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Candidate List with Checkboxes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
                <span className="font-bold text-slate-700">
                  รายชื่อร้านที่จะนำมาจัดเส้นทาง ({candidateEstablishments.length} แห่ง)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const all: Record<string, boolean> = {};
                      candidateEstablishments.slice(0, 15).forEach((e) => {
                        all[e.id] = true;
                      });
                      setSelectedStoreIdsForRoute(all);
                    }}
                    className="text-blue-600 hover:underline font-bold"
                  >
                    เลือกทั้งหมด
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedStoreIdsForRoute({})}
                    className="text-slate-500 hover:underline"
                  >
                    ล้างการเลือก
                  </button>
                </div>
              </div>

              {candidateEstablishments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  ไม่มีสถานประกอบการที่มีพิกัดในกลุ่มนี้
                </div>
              ) : (
                candidateEstablishments.map((est) => {
                  const isChecked = !!selectedStoreIdsForRoute[est.id];
                  const distFromOffice = calculateDistanceKm(
                    PONG_NAM_RON_SAO.lat,
                    PONG_NAM_RON_SAO.lng,
                    est.lat!,
                    est.lng!
                  );

                  return (
                    <div
                      key={est.id}
                      onClick={() => {
                        setSelectedStoreIdsForRoute((prev) => ({
                          ...prev,
                          [est.id]: !prev[est.id]
                        }));
                      }}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                          : 'bg-white border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">
                            {est.businessName}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {est.ownerName} · {est.village}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10.5px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          ~{distFromOffice} กม. จาก อบต.
                        </span>
                        <span className="ui-pill text-blue-700 bg-blue-50 border-blue-200">
                          {est.regType}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Summary & Action */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  เลือกแล้ว {Object.values(selectedStoreIdsForRoute).filter(Boolean).length} แห่ง
                </div>
                <div className="text-[11px] text-slate-500">
                  ระบบจะคำนวณเส้นทางวนรอบที่สั้นที่สุดโดยอัตโนมัติ
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRouteModalOpen(false)}
                  className="ui-btn ui-btn-secondary ui-btn-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleCalculateRoute}
                  className="ui-btn ui-btn-primary ui-btn-sm flex items-center gap-1.5"
                >
                  <RouteIcon className="w-4 h-4" />
                  <span>คำนวณเส้นทางตรวจ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
