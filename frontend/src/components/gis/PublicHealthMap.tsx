import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Establishment, EstablishmentStatus } from '../../types/publicHealth';
import { Layers, Navigation, ChevronDown, ChevronUp, Satellite, Globe } from 'lucide-react';

interface PublicHealthMapProps {
  establishments: Establishment[];
  selectedId: string | null;
  onSelectEstablishment: (est: Establishment) => void;
  onQuickPrint: (est: Establishment) => void;
  onInspect?: (est: Establishment) => void;
  filterCategory: string;
  filterStatus: string;
}

export type SatelliteMode = 'google_hybrid' | 'esri_sat';

export const PublicHealthMap: React.FC<PublicHealthMapProps> = ({
  establishments,
  selectedId,
  onSelectEstablishment,
  onQuickPrint,
  onInspect,
  filterCategory,
  filterStatus
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
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

    // Interactive GIS Map with responsive zoom level and intuitive navigation
    const map = L.map(mapContainerRef.current, {
      center: PONG_NAM_RON_CENTER,
      zoom: 14,
      minZoom: 11,
      maxZoom: 18,
      zoomControl: true, // Enable +/- zoom controls
      scrollWheelZoom: true, // Enable mouse wheel zoom
      doubleClickZoom: true, // Enable double-click zoom
      touchZoom: true, // Enable pinch-to-zoom on mobile/tablet
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

    return () => {
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
      const color = getStatusColor(est.status);
      const isSelected = est.id === selectedId;
      const isExpiring = est.status === 'expiring';
      const isPendingCorrection = est.status === 'pending_correction';

      // Crisp circular badge visible against satellite photography
      const customIcon = L.divIcon({
        className: `custom-pin-${est.id}`,
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            ${
              isExpiring || isPendingCorrection
                ? `<div style="
                    position: absolute;
                    width: ${isSelected ? '28px' : '22px'};
                    height: ${isSelected ? '28px' : '22px'};
                    border-radius: 50%;
                    background: ${color};
                    opacity: 0.45;
                    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                  "></div>`
                : ''
            }
            <div style="
              width: ${isSelected ? '22px' : '16px'};
              height: ${isSelected ? '22px' : '16px'};
              border-radius: 50%;
              background: ${color};
              border: 2px solid #ffffff;
              box-shadow: 0 2px 8px rgba(0,0,0,0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 800;
              font-size: ${isSelected ? '10px' : '8px'};
              transition: all 0.2s ease;
              transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
            ">
              ${isSelected ? est.regType : ''}
            </div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
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
            <button id="btn-inspect-${est.id}" style="
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
            <button id="btn-print-${est.id}" style="
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

      // Event listeners
      const inspectBtn = popupContent.querySelector(`#btn-inspect-${est.id}`);
      if (inspectBtn) {
        inspectBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectEstablishment(est);
          if (onInspect) onInspect(est);
          map.closePopup();
        });
      }

      const printBtn = popupContent.querySelector(`#btn-print-${est.id}`);
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
    if (est) {
      // Pan smoothly to location, strictly keeping zoom locked at 15
      mapInstanceRef.current.panTo([est.lat, est.lng], { animate: true, duration: 0.4 });
      const marker = markersRef.current[est.id];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedId, establishments]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left: Quick Reset Center View Button */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
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

        {/* Locked Zoom Level Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/80 text-slate-300 px-3 py-2 rounded-xl border border-slate-800 text-[11px] backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>ล็อกระดับมุมมองตำบล (คงที่)</span>
        </div>
      </div>

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
