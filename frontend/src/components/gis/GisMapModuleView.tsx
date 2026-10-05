import React from 'react';
import { MapPin } from 'lucide-react';
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
  return (
    <div className="flex-1 h-full flex overflow-hidden p-3 md:p-5 gap-4 bg-transparent">
      {/* Left Establishment Selector sidebar (320px) */}
      <div className="w-80 gov-card flex flex-col p-3.5 overflow-hidden border border-white/80 shadow-md backdrop-blur-xl bg-white/85 rounded-2xl shrink-0">
        <div className="font-bold text-xs text-slate-800 pb-2.5 mb-2 border-b border-slate-200/80 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-heading">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>พิกัดสถานประกอบการ</span>
          </span>
          <span className="text-[10px] text-blue-700 bg-blue-50/90 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">
            {establishments.length} แห่ง
          </span>
        </div>
        <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
          {establishments.map((est) => (
            <div
              key={est.id}
              onClick={() => onSelectEstablishment(est)}
              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                selectedId === est.id
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400 font-semibold text-blue-900 shadow-xs ring-1 ring-blue-400/30'
                  : 'bg-white/80 hover:bg-white border-slate-200/80 text-slate-700 hover:shadow-2xs'
              }`}
            >
              <div className="font-bold line-clamp-1">{est.businessName}</div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                <span>{est.village}</span>
                <span className="font-mono font-bold text-blue-700 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100">
                  {est.regType}
                </span>
              </div>
            </div>
          ))}
        </div>
        {selectedEstablishment && (
          <div className="pt-2.5 border-t border-slate-200/80 mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => onInspectEstablishment(selectedEstablishment)}
              className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm shadow-purple-600/20 cursor-pointer active:scale-95 transition-all"
            >
              ตรวจสถานที่
            </button>
            <button
              type="button"
              onClick={() => onPrintEstablishment(selectedEstablishment)}
              className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 cursor-pointer active:scale-95 transition-all"
            >
              พิมพ์ใบอนุญาต
            </button>
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="flex-1 h-full relative rounded-2xl overflow-hidden border border-white/80 shadow-md bg-white/40 backdrop-blur-xs">
        <PublicHealthMap
          establishments={establishments}
          selectedId={selectedId}
          onSelectEstablishment={onSelectEstablishment}
          onQuickPrint={(est) => onPrintEstablishment(est)}
          onInspect={onInspectEstablishment}
          filterCategory="all"
          filterStatus="all"
        />
      </div>
    </div>
  );
};
