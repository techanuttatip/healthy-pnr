import React, { useState } from 'react';
import { MapPin, X, ClipboardCheck, Printer, Search } from 'lucide-react';
import type { Establishment } from '../../types/publicHealth';
import { PublicHealthMap } from './PublicHealthMap';

interface GisMapModuleViewProps {
  establishments: Establishment[];
  selectedEstablishment: Establishment | null;
  selectedId: string | null;
  onSelectEstablishment: (est: Establishment) => void;
  onInspectEstablishment: (est: Establishment) => void;
  onPrintEstablishment: (est: Establishment) => void;
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
      {/* Collapsible Establishment Selector Sidebar (Desktop dockable, Notebook/Mobile slide-over) */}
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
                  // On small screens, auto-close after picking
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
    </div>
  );
};
