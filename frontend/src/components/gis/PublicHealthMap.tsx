import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Establishment, EstablishmentStatus } from '../../types/publicHealth';
import { Layers, Navigation, ChevronDown, ChevronUp, Satellite, Globe, List, Route as RouteIcon, ExternalLink, X } from 'lucide-react';

export interface RouteWaypoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  order: number;
  village?: string;
  regType?: string;
  ownerName?: string;
}

interface PublicHealthMapProps {
  establishments: Establishment[];
  selectedId: string | null;
  onSelectEstablishment: (est: Establishment) => void;
  onQuickPrint: (est: Establishment) => void;
  onInspect?: (est: Establishment) => void;
  filterCategory: string;
  filterStatus: string;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  routeWaypoints?: RouteWaypoint[];
  onClearRoute?: () => void;
  onOpenRoutePlanner?: () => void;
}

export type SatelliteMode = 'google_hybrid' | 'esri_sat';

export const PublicHealthMap: React.FC<PublicHealthMapProps> = ({
  establishments,
  selectedId,
  onSelectEstablishment,
  onQuickPrint,
  onInspect,
  filterCategory,
  filterStatus,
  onToggleSidebar,
  isSidebarOpen,
  routeWaypoints,
  onClearRoute,
  onOpenRoutePlanner
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [satelliteMode, setSatelliteMode] = useState<SatelliteMode>('google_hybrid');

  // Center on Tambon Pong Nam Ron, Fang District, Chiang Mai
  const PONG_NAM_RON_CENTER: [number, number] = [19.93283454266061, 99.17191325434383];

  // Status color badge
  const getStatusColor = (status: EstablishmentStatus) => {
    switch (status) {
      case 'active':
        return '#10b981'; // Emerald Green
      case 'expiring':
        return '#f59e0b'; // Amber Warning
      case 'awaiting_payment':
        return '#0284c7'; // Sky Blue
      case 'pending_inspection':
        return '#8b5cf6'; // Purple
      case 'pending_correction':
        return '#ef4444'; // Red Alert
      default:
        return '#64748b';
    }
  };

  const getStatusLabel = (status: EstablishmentStatus) => {
    switch (status) {
      case 'active':
        return 'ได้รับอนุญาตปกติ';
      case 'expiring':
        return 'ใกล้สิ้นอายุ (เตือน 30 วัน)';
      case 'awaiting_payment':
        return 'ตรวจผ่านแล้ว รอชำระเงิน';
      case 'pending_inspection':
        return 'รอนัดตรวจสุขลักษณะ';
      case 'pending_correction':
        return 'สั่งแก้ไขปรับปรุง (15/30 วัน)';
      default:
        return status;
    }
  };

  // Helper to get Tile Layer instance
  const createTileLayer = (mode: SatelliteMode): L.TileLayer => {
    if (mode === 'esri_sat') {
      return L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          attribution: 'Tiles &copy; Esri World Imagery'
        }
      );
    }
    // Default: Google Hybrid Satellite (Has Thai road & village labels)
    return L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: 'Google Hybrid Satellite'
    });
  };

  // Initialize Leaflet Map with Satellite Imagery & LOCKED ZOOM LEVEL (No zoom in / out)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // GIS Map with flexible zoom for field navigation & route inspection
    const map = L.map(mapContainerRef.current, {
      center: PONG_NAM_RON_CENTER,
      zoom: 14,
      minZoom: 11,
      maxZoom: 19,
      zoomControl: false, // Clean UI without +/- buttons
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
      boxZoom: true,
      keyboard: true,
      attributionControl: false
    });

    const tile = createTileLayer('google_hybrid').addTo(map);
    currentTileLayerRef.current = tile;

    // Add Pong Nam Ron Municipality Landmark Pin
    const lguIcon = L.divIcon({
      className: 'custom-lgu-marker',
      html: `
        <div style="
          background: linear-gradient(135deg, #1e3a8a, #0f172a);
          color: #ffffff;
          padding: 6px 14px;
          border-radius: 9999px;
          border: 2.5px solid #fbbf24;
          font-weight: 800;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.6);
          white-space: nowrap;
          text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        ">
          🏛️ <span>ที่ทำการ อบต. โป่งน้ำร้อน</span>
        </div>
      `,
      iconSize: [195, 34],
      iconAnchor: [97, 17]
    });
    L.marker(PONG_NAM_RON_CENTER, { icon: lguIcon }).addTo(map);

    mapInstanceRef.current = map;

    // ResizeObserver to ensure map tiles adapt seamlessly to container resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }
    const initialTimer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(initialTimer);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle switching satellite mode (Google Hybrid vs Esri)
  const handleChangeSatelliteMode = (mode: SatelliteMode) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const newTile = createTileLayer(mode).addTo(map);
    newTile.bringToBack();
    currentTileLayerRef.current = newTile;
    setSatelliteMode(mode);
  };

  // Update Markers when establishments, filter, or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Filter establishments
    const filtered = establishments.filter((est) => {
      const matchCat = filterCategory === 'all' || est.category === filterCategory || est.regType === filterCategory;
      const matchStat = filterStatus === 'all' || est.status === filterStatus;
      return matchCat && matchStat;
    });

    filtered.forEach((est) => {
      // Validate coordinates to prevent Leaflet crash
      if (
        typeof est.lat !== 'number' ||
        typeof est.lng !== 'number' ||
        isNaN(est.lat) ||
        isNaN(est.lng) ||
        est.lat === 0 ||
        est.lng === 0
      ) {
        return;
      }

      const color = getStatusColor(est.status);
      const isSelected = est.id === selectedId;

      // Compact, elegant store point dot (จุดร้านค้าเล็กๆ ไม่ใหญ่เกินไป)
      const customIcon = L.divIcon({
        className: `custom-pin-${est.id}`,
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="
              width: ${isSelected ? '14px' : '9px'};
              height: ${isSelected ? '14px' : '9px'};
              border-radius: 50%;
              background: ${color};
              border: 1.5px solid #ffffff;
              box-shadow: 0 1px 4px rgba(0,0,0,0.65);
              transition: all 0.2s ease;
              transform: ${isSelected ? 'scale(1.25)' : 'scale(1)'};
            "></div>
          </div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = L.marker([est.lat, est.lng], { icon: customIcon }).addTo(map);

      // Clean Tooltip on Hover
      marker.bindTooltip(
        `<div style="font-family: 'Sarabun', sans-serif; font-size: 12px; font-weight: bold; color: #0f172a; padding: 2px 4px;">
          ${est.businessName}
          <div style="font-size: 10px; font-weight: normal; color: ${color};">● ${getStatusLabel(est.status)}</div>
        </div>`,
        { direction: 'top', offset: [0, -14], opacity: 0.95 }
      );

      // Clean Popup Card on Click
      const popupContent = document.createElement('div');
      popupContent.className = 'est-clean-popup';
      popupContent.innerHTML = `
        <div style="font-family: 'Sarabun', sans-serif; min-width: 250px; padding: 3px;">
          <div style="display: flex; align-items: start; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 8px;">
            <div>
              <div style="font-weight: 800; color: #0f172a; font-size: 13px; line-height: 1.3;">${est.businessName}</div>
              <div style="font-size: 11px; color: #64748b; font-family: monospace;">${est.regNumber}</div>
            </div>
            <span style="font-size: 10px; padding: 2px 8px; border-radius: 9999px; background: ${color}15; color: ${color}; font-weight: bold; border: 1px solid ${color}30; white-space: nowrap;">
              ${est.regType}
            </span>
          </div>

          <div style="font-size: 11px; color: #475569; line-height: 1.6; margin-bottom: 10px;">
            <div>👤 <strong>ผู้ประกอบการ:</strong> ${est.ownerName}</div>
            <div>📍 <strong>ที่ตั้ง:</strong> ${est.village}</div>
            <div>🔍 <strong>ผลตรวจสุขลักษณะ:</strong> ${
              est.inspectionScore !== undefined
                ? `<strong style="color: ${est.inspectionScore >= 80 ? '#10b981' : '#ef4444'}">${est.inspectionScore}/100 คะแนน</strong>`
                : '<span style="color: #8b5cf6;">รอนัดตรวจ</span>'
            }</div>
            ${
              est.correctionDays
                ? `<div style="color: #ef4444; font-weight: bold; background: #fef2f2; padding: 2px 6px; border-radius: 4px; margin-top: 4px;">⚠️ ต้องแก้ไขใน ${est.correctionDays} วัน (ครบกำหนด ${est.correctionDeadline || '-'})</div>`
                : ''
            }
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <button type="button" data-action="inspect" style="
              background: #8b5cf6;
              color: white;
              font-size: 11px;
              font-weight: bold;
              border: none;
              padding: 7px 10px;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s;
            ">
              🔍 ตรวจสุขลักษณะ
            </button>
            <button type="button" data-action="print" style="
              background: #10b981;
              color: white;
              font-size: 11px;
              font-weight: bold;
              border: none;
              padding: 7px 10px;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s;
            ">
              🖨️ พิมพ์ใบอนุญาต
            </button>
          </div>

          <a href="https://www.google.com/maps/dir/?api=1&destination=${est.lat},${est.lng}" target="_blank" rel="noopener noreferrer" style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            background: #0284c7;
            color: #ffffff;
            font-size: 11px;
            font-weight: bold;
            text-decoration: none;
            padding: 7px 10px;
            border-radius: 8px;
            margin-top: 6px;
            text-align: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          ">
            🧭 นำทาง Google Maps ลงพื้นที่จริง ↗
          </a>
        </div>
      `;

      // Event listeners via data-action attributes (immune to ID escape issues)
      const inspectBtn = popupContent.querySelector('[data-action="inspect"]');
      if (inspectBtn) {
        inspectBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectEstablishment(est);
          if (onInspect) onInspect(est);
          map.closePopup();
        });
      }

      const printBtn = popupContent.querySelector('[data-action="print"]');
      if (printBtn) {
        printBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectEstablishment(est);
          onQuickPrint(est);
          map.closePopup();
        });
      }

      marker.bindPopup(popupContent, { maxWidth: 300 });

      marker.on('click', () => {
        onSelectEstablishment(est);
      });

      markersRef.current[est.id] = marker;
    });
  }, [establishments, selectedId, filterCategory, filterStatus, onSelectEstablishment, onQuickPrint, onInspect]);

  // Center on selected establishment using panTo WITHOUT changing zoom level
  useEffect(() => {
    if (!selectedId || !mapInstanceRef.current) return;
    const est = establishments.find((e) => e.id === selectedId);
    if (est && typeof est.lat === 'number' && typeof est.lng === 'number' && !isNaN(est.lat) && !isNaN(est.lng)) {
      // Pan smoothly to location, strictly keeping zoom locked at 14
      mapInstanceRef.current.panTo([est.lat, est.lng], { animate: true, duration: 0.4 });
      const marker = markersRef.current[est.id];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedId, establishments]);

  // Draw route polyline and waypoint markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (!routeWaypoints || routeWaypoints.length === 0) return;

    const layerGroup = L.layerGroup();
    const latlngs: [number, number][] = [
      PONG_NAM_RON_CENTER,
      ...routeWaypoints.map((w) => [w.lat, w.lng] as [number, number])
    ];

    // Glow line underlay
    L.polyline(latlngs, {
      color: '#60a5fa',
      weight: 9,
      opacity: 0.45,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(layerGroup);

    // Main route polyline
    L.polyline(latlngs, {
      color: '#1d4ed8',
      weight: 4.5,
      opacity: 0.95,
      dashArray: '8, 8',
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(layerGroup);

    // Numbered marker pins
    routeWaypoints.forEach((wp) => {
      const numIcon = L.divIcon({
        className: 'route-num-marker',
        html: `
          <div style="
            width: 30px;
            height: 30px;
            background: linear-gradient(135deg, #1d4ed8, #2563eb);
            color: #ffffff;
            border-radius: 50%;
            border: 2.5px solid #ffffff;
            box-shadow: 0 4px 14px rgba(29,78,216,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 13px;
            cursor: pointer;
          ">
            ${wp.order}
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const wpMarker = L.marker([wp.lat, wp.lng], { icon: numIcon, zIndexOffset: 2500 });
      wpMarker.bindTooltip(
        `<div style="font-family: 'Sarabun', sans-serif; font-size: 11px;">
          <strong>ลำดับที่ ${wp.order}</strong>: ${wp.label}<br/>
          <span style="color: #64748b;">${wp.village || ''}</span>
        </div>`,
        { direction: 'top', offset: [0, -16], opacity: 0.95 }
      );
      wpMarker.addTo(layerGroup);
    });

    layerGroup.addTo(map);
    routeLayerRef.current = layerGroup;

    // Fit bounds smoothly to show entire route
    try {
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    } catch {}

    return () => {
      if (routeLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }
    };
  }, [routeWaypoints]);

  const googleMapsRouteUrl = React.useMemo(() => {
    if (!routeWaypoints || routeWaypoints.length === 0) return '';
    const origin = `${PONG_NAM_RON_CENTER[0]},${PONG_NAM_RON_CENTER[1]}`;
    const destination = `${routeWaypoints[routeWaypoints.length - 1].lat},${routeWaypoints[routeWaypoints.length - 1].lng}`;
    const intermediate = routeWaypoints.slice(0, -1);
    const waypointsParam = intermediate.map((w) => `${w.lat},${w.lng}`).join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${
      waypointsParam ? `&waypoints=${encodeURIComponent(waypointsParam)}` : ''
    }&travelmode=driving`;
  }, [routeWaypoints]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left: Navigation Controls Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 flex-wrap">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg border backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 ${
              isSidebarOpen
                ? 'bg-blue-600 text-white border-blue-400'
                : 'bg-slate-900/90 hover:bg-slate-900 text-white hover:text-amber-300 border-slate-700/80'
            }`}
            title="เปิด/ปิด แถบรายชื่อร้านค้า"
          >
            <List className="w-3.5 h-3.5 text-amber-400" />
            <span>รายชื่อร้าน ({establishments.length})</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.panTo(PONG_NAM_RON_CENTER, { animate: true, duration: 0.4 });
            }
          }}
          className="bg-slate-900/90 hover:bg-slate-900 text-white hover:text-amber-300 px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-lg hover:shadow-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer backdrop-blur-md"
          title="จัดกึ่งกลาง อบต. โป่งน้ำร้อน"
        >
          <Navigation className="w-3.5 h-3.5 text-amber-400" />
          <span>กึ่งกลาง อบต. โป่งน้ำร้อน</span>
        </button>

        {onOpenRoutePlanner && (
          <button
            type="button"
            onClick={onOpenRoutePlanner}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3.5 py-2 rounded-xl border border-blue-400/40 shadow-lg hover:shadow-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer backdrop-blur-md"
            title="เปิดเครื่องมือจัดเส้นทางตรวจสนามอัจฉริยะ"
          >
            <RouteIcon className="w-3.5 h-3.5 text-amber-300" />
            <span>จัดเส้นทางตรวจสนาม</span>
          </button>
        )}
      </div>

      {/* Route Active Floating Banner */}
      {routeWaypoints && routeWaypoints.length > 0 && (
        <div className="absolute top-16 left-4 right-4 md:right-auto md:w-[480px] z-20 bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl border border-blue-500/50 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <RouteIcon className="w-4 h-4 text-blue-400" />
              <span>เส้นทางตรวจสนาม ({routeWaypoints.length} จุด)</span>
            </div>
            <div className="text-[11px] text-slate-300 truncate mt-0.5">
              เริ่ม: อบต.โป่งน้ำร้อน ➔ {routeWaypoints.map((w) => w.label).join(' ➔ ')}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {googleMapsRouteUrl && (
              <a
                href={googleMapsRouteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-all"
                title="เปิดนำทางแบบเลี้ยวต่อเลี้ยวใน Google Maps"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Google Maps</span>
              </a>
            )}
            {onClearRoute && (
              <button
                type="button"
                onClick={onClearRoute}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="ยกเลิกเส้นทาง"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Right: Satellite Layer Switcher */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 shadow-lg backdrop-blur-md text-xs">
        <button
          type="button"
          onClick={() => handleChangeSatelliteMode('google_hybrid')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            satelliteMode === 'google_hybrid'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="ภาพถ่ายดาวเทียม พร้อมชื่อถนน/หมู่บ้านภาษาไทย"
        >
          <Satellite className="w-3.5 h-3.5" />
          <span>ดาวเทียมกูเกิล (มีชื่อไทย)</span>
        </button>

        <button
          type="button"
          onClick={() => handleChangeSatelliteMode('esri_sat')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            satelliteMode === 'esri_sat'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="ภาพถ่ายดาวเทียมความคมชัดสูง Esri World Imagery"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>ดาวเทียม Esri</span>
        </button>
      </div>

      {/* Bottom Left: Clean Collapsible Legend */}
      <div className="absolute bottom-4 left-4 z-20">
        <div className="bg-slate-900/90 backdrop-blur-md text-slate-100 border border-slate-700/80 rounded-xl shadow-xl transition-all overflow-hidden">
          <button
            type="button"
            onClick={() => setIsLegendOpen(!isLegendOpen)}
            className="w-full px-3.5 py-2 text-xs font-bold flex items-center justify-between gap-3 text-slate-200 hover:text-white cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>สัญลักษณ์สีสถานประกอบการ ({establishments.length} แห่ง)</span>
            </div>
            {isLegendOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {isLegendOpen && (
            <div className="p-3 pt-0 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] border-t border-slate-800 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs" />
                <span className="text-slate-200">ปกติ (Active)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-2xs" />
                <span className="text-blue-300 font-medium">รอชำระค่าธรรมเนียม</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-2xs" />
                <span className="text-amber-300 font-medium">ใกล้สิ้นอายุ 30 วัน</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-2xs" />
                <span className="text-purple-300 font-medium">รอนัดตรวจสถานที่</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-2xs" />
                <span className="text-red-300 font-medium">สั่งแก้ไข 15/30 วัน</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
