import React, { useState } from 'react';
import {
  Type,
  Sliders,
  MoveVertical,
  MoveHorizontal,
  RotateCcw,
  Save,
  Edit3,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  Layers,
  Settings2
} from 'lucide-react';
import { showToast } from '../../utils/sweetAlert';

export interface PrintLayoutSettings {
  fontFamily: string;
  fontSizePt: number;
  lineSpacing: number;
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  garudaOffsetMm: number;
  garudaScale: number;
  showGaruda: boolean;
  showWatermark: boolean;
  watermarkOpacity: number;
  showSignature: boolean;
  isLiveEdit: boolean;
}

export const DEFAULT_PRINT_LAYOUT_SETTINGS: PrintLayoutSettings = {
  fontFamily: "'Sarabun', 'TH Sarabun New', serif",
  fontSizePt: 14,
  lineSpacing: 2.1,
  marginTopMm: 22,
  marginBottomMm: 18,
  marginLeftMm: 25,
  marginRightMm: 20,
  garudaOffsetMm: 0,
  garudaScale: 1.0,
  showGaruda: true,
  showWatermark: true,
  watermarkOpacity: 0.08,
  showSignature: true,
  isLiveEdit: false
};

const STORAGE_KEY = 'PNR_PRINT_LAYOUT_PRESET';

export function loadSavedPrintLayout(): PrintLayoutSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_PRINT_LAYOUT_SETTINGS, ...parsed, isLiveEdit: false };
    }
  } catch (e) {
    console.warn('Could not load saved print layout:', e);
  }
  return { ...DEFAULT_PRINT_LAYOUT_SETTINGS };
}

export function savePrintLayoutPreset(settings: PrintLayoutSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    showToast('บันทึกระยะหน้ากระดาษเป็นค่าเริ่มต้นแล้ว', 'success');
  } catch (e) {
    console.error('Failed to save print layout preset:', e);
    showToast('ไม่สามารถบันทึกการตั้งค่าได้', 'error');
  }
}

interface DocumentPageStylerToolbarProps {
  settings: PrintLayoutSettings;
  onChange: (newSettings: PrintLayoutSettings) => void;
  onResetContent?: () => void;
}

export const DocumentPageStylerToolbar: React.FC<DocumentPageStylerToolbarProps> = ({
  settings,
  onChange,
  onResetContent
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'font' | 'margin' | 'garuda' | 'preset'>('font');

  const update = (partial: Partial<PrintLayoutSettings>) => {
    onChange({ ...settings, ...partial });
  };

  const applyPreset = (presetName: 'standard' | 'compact' | 'narrow') => {
    if (presetName === 'standard') {
      update({
        fontSizePt: 14,
        lineSpacing: 2.1,
        marginTopMm: 25,
        marginBottomMm: 20,
        marginLeftMm: 28,
        marginRightMm: 20,
        garudaOffsetMm: 0,
        garudaScale: 1.0,
        showGaruda: true
      });
      showToast('ปรับเป็น: ระยะมาตรฐานระเบียบสารบรรณ', 'info');
    } else if (presetName === 'compact') {
      update({
        fontSizePt: 13.5,
        lineSpacing: 1.85,
        marginTopMm: 16,
        marginBottomMm: 14,
        marginLeftMm: 22,
        marginRightMm: 16,
        garudaOffsetMm: -4,
        garudaScale: 0.92,
        showGaruda: true
      });
      showToast('ปรับเป็น: ระยะกระชับ (พอดี 1 หน้าจบ)', 'info');
    } else if (presetName === 'narrow') {
      update({
        fontSizePt: 13,
        lineSpacing: 1.7,
        marginTopMm: 12,
        marginBottomMm: 12,
        marginLeftMm: 18,
        marginRightMm: 14,
        garudaOffsetMm: -8,
        garudaScale: 0.85,
        showGaruda: true
      });
      showToast('ปรับเป็น: ระยะขอบแคบพิเศษ', 'info');
    }
  };

  const handleResetToDefault = () => {
    localStorage.removeItem(STORAGE_KEY);
    onChange({ ...DEFAULT_PRINT_LAYOUT_SETTINGS });
    showToast('คืนค่ามาตรฐานโรงงานเรียบร้อยแล้ว', 'info');
  };

  return (
    <div className="bg-white/95 border border-slate-200/90 shadow-sm rounded-2xl mb-3 shrink-0 print:hidden backdrop-blur-xl overflow-hidden transition-all text-xs text-slate-800">
      {/* Top Header / Quick Bar */}
      <div className="px-3.5 py-2.5 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-2xs">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-900 flex items-center gap-1.5 font-heading">
            แถบเครื่องมือจัดหน้ากระดาษ (Page Layout &amp; Live Styler)
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded-md">
              สไตล์ Word / Docs
            </span>
          </span>
        </div>

        {/* Quick Toolbar Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Live Edit Toggle */}
          <button
            type="button"
            onClick={() => update({ isLiveEdit: !settings.isLiveEdit })}
            className={`px-2.5 py-1.2 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              settings.isLiveEdit
                ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-300'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
            title="เปิดโหมดให้คลิกแก้ไขข้อความบนหน้ากระดาษสดๆ ได้ทันที"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{settings.isLiveEdit ? 'กำลังเปิดโหมดพิมพ์สด' : '✏️ คลิกแก้ข้อความสด'}</span>
          </button>

          {settings.isLiveEdit && onResetContent && (
            <button
              type="button"
              onClick={onResetContent}
              className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-[11px] font-medium transition-colors cursor-pointer"
              title="ยกเลิกการพิมพ์สด แล้วดึงข้อมูลจากระบบกลับมาใหม่"
            >
              <RotateCcw className="w-3 h-3 inline mr-1" />
              คืนค่าข้อความ
            </button>
          )}

          {/* Preset Buttons */}
          <button
            type="button"
            onClick={() => applyPreset('compact')}
            className="px-2.5 py-1.2 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold transition-all cursor-pointer text-[11px]"
            title="บีบระยะขอบและฟอนต์ให้พอดี 1 หน้ากระดาษอัตโนมัติ"
          >
            <Sparkles className="w-3 h-3 inline mr-1 text-emerald-600" />
            จัดพอดี 1 หน้า
          </button>

          <button
            type="button"
            onClick={() => applyPreset('standard')}
            className="px-2.5 py-1.2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium transition-all cursor-pointer text-[11px]"
            title="คืนค่าระยะขอบตามมาตรฐานงานสารบรรณราชการ"
          >
            มาตรฐานราชการ
          </button>

          {/* Save Preset */}
          <button
            type="button"
            onClick={() => savePrintLayoutPreset(settings)}
            className="px-2.5 py-1.2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer text-[11px]"
            title="บันทึกระยะนี้เป็นค่าเริ่มต้นสำหรับพิมพ์ครั้งต่อไป"
          >
            <Save className="w-3 h-3" />
            <span>จำระยะนี้</span>
          </button>

          {/* Toggle Expand */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/80 transition-colors cursor-pointer ml-1"
            title={isExpanded ? 'ย่อแถบเครื่องมือ' : 'ขยายแถบเครื่องมือปรับแต่ง'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Detailed Tooling Controls */}
      {isExpanded && (
        <div className="p-3 bg-white space-y-3">
          {/* Tab Selector */}
          <div className="flex items-center gap-1 border-b border-slate-100 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('font')}
              className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'font'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Type className="w-3.5 h-3.5 text-blue-600" />
              <span>แบบอักษร &amp; ขนาด (Font)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('margin')}
              className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'margin'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <MoveHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              <span>ระยะขอบกระดาษ (Margins)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('garuda')}
              className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'garuda'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>ตราครุฑ &amp; ลายน้ำ (Emblems)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preset')}
              className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'preset'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>จัดการค่าติดตั้ง (Presets)</span>
            </button>
          </div>

          {/* TAB 1: FONT & TYPOGRAPHY */}
          {activeTab === 'font' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              {/* Font Family */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  แบบอักษร (Font):
                </label>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => update({ fontFamily: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="'Sarabun', 'TH Sarabun New', serif">TH Sarabun (มาตรฐานราชการ)</option>
                  <option value="'Prompt', sans-serif">Prompt (โมเดิร์นทางการ)</option>
                  <option value="'Kanit', sans-serif">Kanit (คมชัดทันสมัย)</option>
                  <option value="'Noto Serif Thai', serif">Noto Serif Thai (มีเชิง ทางการ)</option>
                  <option value="'Angsana New', 'Cordia New', serif">Angsana / Cordia (คลาสสิก)</option>
                </select>
              </div>

              {/* Font Size with +/- */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  ขนาดอักษร: <span className="font-mono text-blue-600 font-bold">{settings.fontSizePt} pt</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => update({ fontSizePt: Math.max(11, Number((settings.fontSizePt - 0.5).toFixed(1))) })}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center transition-colors cursor-pointer"
                    title="ลดขนาดฟอนต์ 0.5pt"
                  >
                    A-
                  </button>
                  <input
                    type="range"
                    min="11"
                    max="18"
                    step="0.5"
                    value={settings.fontSizePt}
                    onChange={(e) => update({ fontSizePt: parseFloat(e.target.value) })}
                    className="flex-1 accent-blue-600 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => update({ fontSizePt: Math.min(20, Number((settings.fontSizePt + 0.5).toFixed(1))) })}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center transition-colors cursor-pointer"
                    title="เพิ่มขนาดฟอนต์ 0.5pt"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Line Spacing */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  ระยะห่างบรรทัด (Line Height): <span className="font-mono text-blue-600 font-bold">{settings.lineSpacing}</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="range"
                    min="1.5"
                    max="2.6"
                    step="0.05"
                    value={settings.lineSpacing}
                    onChange={(e) => update({ lineSpacing: parseFloat(e.target.value) })}
                    className="flex-1 accent-blue-600 cursor-pointer"
                  />
                  <div className="flex gap-1">
                    {[1.8, 2.0, 2.2].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => update({ lineSpacing: val })}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                          settings.lineSpacing === val ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Edit Banner */}
              <div className="flex flex-col justify-center bg-amber-50/70 border border-amber-200/80 rounded-xl p-2 text-[11px] text-amber-900">
                <span className="font-bold flex items-center gap-1">
                  <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                  โหมดแก้ข้อความสด:
                </span>
                <p className="text-[10px] text-amber-800 mt-0.5 leading-tight">
                  {settings.isLiveEdit
                    ? 'เปิดอยู่! คุณสามารถคลิกข้อความในหน้ากระดาษเพื่อพิมพ์แก้ได้โดยตรง'
                    : 'คลิกปุ่ม "✏️ คลิกแก้ข้อความสด" ด้านบนเพื่อพิมพ์แก้ข้อความในหน้ากระดาษได้ทันที'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: MARGINS */}
          {activeTab === 'margin' && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Top Margin */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-slate-700">ขอบบน (Top):</span>
                    <span className="font-mono text-blue-700 font-bold">{settings.marginTopMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="45"
                    step="1"
                    value={settings.marginTopMm}
                    onChange={(e) => update({ marginTopMm: parseInt(e.target.value, 10) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                    <span>8mm</span>
                    <span>หลบครุฑ</span>
                    <span>45mm</span>
                  </div>
                </div>

                {/* Bottom Margin */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-slate-700">ขอบล่าง (Bottom):</span>
                    <span className="font-mono text-blue-700 font-bold">{settings.marginBottomMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="35"
                    step="1"
                    value={settings.marginBottomMm}
                    onChange={(e) => update({ marginBottomMm: parseInt(e.target.value, 10) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                    <span>8mm</span>
                    <span>มาตรฐาน 20</span>
                    <span>35mm</span>
                  </div>
                </div>

                {/* Left Margin */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-slate-700">ขอบซ้าย (Left/เย็บเล่ม):</span>
                    <span className="font-mono text-blue-700 font-bold">{settings.marginLeftMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="45"
                    step="1"
                    value={settings.marginLeftMm}
                    onChange={(e) => update({ marginLeftMm: parseInt(e.target.value, 10) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                    <span>10mm</span>
                    <span>สารบรรณ 30</span>
                    <span>45mm</span>
                  </div>
                </div>

                {/* Right Margin */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-slate-700">ขอบขวา (Right):</span>
                    <span className="font-mono text-blue-700 font-bold">{settings.marginRightMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="35"
                    step="1"
                    value={settings.marginRightMm}
                    onChange={(e) => update({ marginRightMm: parseInt(e.target.value, 10) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                    <span>8mm</span>
                    <span>มาตรฐาน 20</span>
                    <span>35mm</span>
                  </div>
                </div>
              </div>

              {/* Presets Row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500">ชุดระยะขอบสำเร็จรูป:</span>
                <button
                  type="button"
                  onClick={() => applyPreset('standard')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 rounded-lg border border-slate-200 text-xs font-medium cursor-pointer"
                >
                  🏛️ มาตรฐานระเบียบสารบรรณ (ซ้าย 3.0 / ขวา 2.0 / บน 2.5 ซม.)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('compact')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 rounded-lg border border-slate-200 text-xs font-medium cursor-pointer"
                >
                  📄 กระชับพอดี 1 หน้า (ซ้าย 2.2 / ขวา 1.6 / บน 1.6 ซม.)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('narrow')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-amber-50 text-slate-800 hover:text-amber-700 rounded-lg border border-slate-200 text-xs font-medium cursor-pointer"
                >
                  📏 ขอบแคบพิเศษ (สำหรับข้อความยาว)
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: GARUDA & EMBLEMS */}
          {activeTab === 'garuda' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Garuda Visibility & Offset */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">การแสดงตราครุฑ:</span>
                  <button
                    type="button"
                    onClick={() => update({ showGaruda: !settings.showGaruda })}
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] cursor-pointer ${
                      settings.showGaruda
                        ? 'bg-blue-600 text-white'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {settings.showGaruda ? '✓ พิมพ์พร้อมตราครุฑ' : '⊘ ซ่อนครุฑ (ใช้กระดาษหัวครุฑสำเร็จ)'}
                  </button>
                </div>

                {settings.showGaruda && (
                  <>
                    <div className="pt-1">
                      <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                        <span>เลื่อนตำแหน่งครุฑ (แนวตั้ง):</span>
                        <span className="font-mono text-blue-700 font-bold">{settings.garudaOffsetMm} mm</span>
                      </div>
                      <input
                        type="range"
                        min="-15"
                        max="25"
                        step="1"
                        value={settings.garudaOffsetMm}
                        onChange={(e) => update({ garudaOffsetMm: parseInt(e.target.value, 10) })}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>-15mm (เลื่อนขึ้น)</span>
                        <span>0 (กลาง)</span>
                        <span>+25mm (เลื่อนลง)</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                        <span>ขนาดตราครุฑ:</span>
                        <span className="font-mono text-blue-700 font-bold">{Math.round(settings.garudaScale * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.75"
                        max="1.3"
                        step="0.05"
                        value={settings.garudaScale}
                        onChange={(e) => update({ garudaScale: parseFloat(e.target.value) })}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Watermark Visibility & Opacity */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">ลายน้ำตรา อบต. (Watermark):</span>
                  <button
                    type="button"
                    onClick={() => update({ showWatermark: !settings.showWatermark })}
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] cursor-pointer ${
                      settings.showWatermark
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {settings.showWatermark ? '✓ แสดงลายน้ำ' : 'ปิดลายน้ำ'}
                  </button>
                </div>

                {settings.showWatermark && (
                  <div className="pt-1">
                    <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                      <span>ความเข้ม/จางของลายน้ำ:</span>
                      <span className="font-mono text-blue-700 font-bold">{Math.round(settings.watermarkOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.03"
                      max="0.22"
                      step="0.01"
                      value={settings.watermarkOpacity}
                      onChange={(e) => update({ watermarkOpacity: parseFloat(e.target.value) })}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>3% (จางมาก)</span>
                      <span>8% (มาตรฐาน)</span>
                      <span>22% (ชัดเจน)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Signature Visibility */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-700">ลายมือชื่อดิจิทัล (Signature):</span>
                    <button
                      type="button"
                      onClick={() => update({ showSignature: !settings.showSignature })}
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] cursor-pointer ${
                        settings.showSignature
                          ? 'bg-blue-600 text-white'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {settings.showSignature ? '✓ แสดงลายเซ็น' : 'เว้นว่าง (เซ็นสด)'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                    หากเลือก "เว้นว่าง (เซ็นสด)" ระบบจะเว้นช่องว่างลายมือชื่อนายก อบต. ไว้สำหรับลงนามด้วยปากกาจริง
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRESETS & MEMORY */}
          {activeTab === 'preset' && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <h4 className="font-bold text-slate-900 text-xs">บันทึกหรือคืนค่าการจัดหน้ากระดาษ</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ระบบจะจดจำค่าระยะขอบ ฟอนต์ และตำแหน่งตราครุฑไว้ในบราวเซอร์ของเครื่องนี้โดยอัตโนมัติ
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>คืนค่ามาตรฐานโรงงาน</span>
                </button>

                <button
                  type="button"
                  onClick={() => savePrintLayoutPreset(settings)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกค่าหน้านี้เป็นค่าเริ่มต้น (Save)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Edit Mode Helper Notice */}
      {settings.isLiveEdit && (
        <div className="bg-amber-500 text-white px-3.5 py-1.5 text-xs flex items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="font-bold">โหมดพิมพ์แก้ไขสด (Live Edit Mode):</span>
            <span className="text-amber-100 hidden sm:inline">
              คุณสามารถคลิกบนหน้ากระดาษ A4 ด้านล่างเพื่อแก้ไขคำ เคาะขึ้นบรรทัดใหม่ หรือปรับแก้ข้อความได้โดยตรงเหมือน Microsoft Word
            </span>
          </div>
          <button
            type="button"
            onClick={() => update({ isLiveEdit: false })}
            className="px-2 py-0.5 bg-black/20 hover:bg-black/40 rounded text-[11px] font-bold transition-colors cursor-pointer"
          >
            เสร็จสิ้นการแก้ไข
          </button>
        </div>
      )}
    </div>
  );
};
