import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Search,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  UploadCloud,
  FileText,
  KeyRound,
  Edit3,
  Clock,
  User,
  Building2,
  Trash2
} from 'lucide-react';
import type { AuditLog } from '../../types/publicHealth';
import { sanitationDataService } from '../../services/sanitationDataService';
import { exportAuditLogsToExcel } from '../../utils/excelExport';
import { showToast } from '../../utils/sweetAlert';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEstablishment?: (establishmentId: string) => void;
}

const toThaiDigits = (num: number | string) =>
  String(num).replace(/[0-9]/g, (digit) => '๐๑๒๓๔๕๖๗๘๙'[parseInt(digit, 10)]);

const formatThaiDateTime = (isoStr: string) => {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const months = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${toThaiDigits(d.getDate())} ${months[d.getMonth()]} ${toThaiDigits(d.getFullYear() + 543)} เวลา ${toThaiDigits(hours)}:${toThaiDigits(minutes)} น.`;
  } catch {
    return isoStr;
  }
};

const ACTION_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  all: {
    label: 'ทั้งหมด',
    color: 'text-slate-300',
    bg: 'bg-slate-800/60',
    border: 'border-slate-700/60',
    icon: History
  },
  renew_license: {
    label: 'ต่ออายุใบอนุญาต',
    color: 'text-emerald-300',
    bg: 'bg-emerald-950/50',
    border: 'border-emerald-500/30',
    icon: CheckCircle2
  },
  inspect: {
    label: 'ตรวจสุขลักษณะ',
    color: 'text-purple-300',
    bg: 'bg-purple-950/50',
    border: 'border-purple-500/30',
    icon: FileText
  },
  upload_doc: {
    label: 'อัปโหลดแฟ้มเอกสาร',
    color: 'text-cyan-300',
    bg: 'bg-cyan-950/50',
    border: 'border-cyan-500/30',
    icon: UploadCloud
  },
  delete_doc: {
    label: 'ลบเอกสาร/ข้อมูล',
    color: 'text-rose-300',
    bg: 'bg-rose-950/50',
    border: 'border-rose-500/30',
    icon: Trash2
  },
  update: {
    label: 'แก้ไขข้อมูล',
    color: 'text-amber-300',
    bg: 'bg-amber-950/50',
    border: 'border-amber-500/30',
    icon: Edit3
  },
  login: {
    label: 'เข้าสู่ระบบ',
    color: 'text-blue-300',
    bg: 'bg-blue-950/50',
    border: 'border-blue-500/30',
    icon: KeyRound
  }
};

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  onSelectEstablishment
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await sanitationDataService.getAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filtering
  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      !searchQuery.trim() ||
      (log.actionTitle && log.actionTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.establishmentName && log.establishmentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.officerName && log.officerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchAction = selectedAction === 'all' || log.action === selectedAction;

    return matchSearch && matchAction;
  });

  const handleExportExcel = () => {
    if (filteredLogs.length === 0) {
      showToast('ไม่พบรายการบันทึกประวัติตามเงื่อนไขที่เลือก', 'warning');
      return;
    }
    const fileName = exportAuditLogsToExcel(filteredLogs);
    showToast(`ส่งออกบันทึกประวัติราชการสำเร็จ (${fileName})`, 'success');
  };

  // Summary counts
  const renewCount = logs.filter((l) => l.action === 'renew_license').length;
  const inspectCount = logs.filter((l) => l.action === 'inspect').length;
  const docCount = logs.filter((l) => l.action === 'upload_doc' || l.action === 'delete_doc').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  สมุดบันทึกประวัติการดำเนินงานราชการ (Audit Trail Logs)
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-400/30">
                  e-Service Audit
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ระบบบันทึกความปลอดภัยและประวัติการทำงานของเจ้าหน้าที่ อบต.โป่งน้ำร้อน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="ส่งออกรายงานเป็น Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>ส่งออก Excel</span>
            </button>
            <button
              type="button"
              onClick={loadLogs}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800/60 grid grid-cols-4 gap-3 shrink-0">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">บันทึกทั้งหมด</div>
              <div className="text-base font-bold text-white font-mono">{toThaiDigits(logs.length)} รายการ</div>
            </div>
            <History className="w-5 h-5 text-slate-400" />
          </div>

          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-emerald-300">ต่ออายุใบอนุญาต</div>
              <div className="text-base font-bold text-emerald-200 font-mono">{toThaiDigits(renewCount)} รายการ</div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-purple-300">ตรวจสุขลักษณะ</div>
              <div className="text-base font-bold text-purple-200 font-mono">{toThaiDigits(inspectCount)} รายการ</div>
            </div>
            <FileText className="w-5 h-5 text-purple-400" />
          </div>

          <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-cyan-300">จัดการแฟ้มเอกสาร</div>
              <div className="text-base font-bold text-cyan-200 font-mono">{toThaiDigits(docCount)} รายการ</div>
            </div>
            <UploadCloud className="w-5 h-5 text-cyan-400" />
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-900/40 border-b border-slate-800 flex flex-wrap items-center gap-3 shrink-0">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาตามชื่อร้าน, เจ้าหน้าที่, หรือคำสำคัญ..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Action Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {Object.entries(ACTION_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const isSelected = selectedAction === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedAction(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? `${cfg.bg} ${cfg.color} border ${cfg.border} shadow-sm ring-1 ring-white/10`
                      : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Logs List Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400 mb-3" />
              <p className="text-sm">กำลังโหลดประวัติการดำเนินงานราชการ...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-slate-800/20 border border-slate-800 rounded-2xl">
              <History className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-300">ไม่พบรายการประวัติที่ตรงกับเงื่อนไข</p>
              <p className="text-xs text-slate-500 mt-1">ลองเปลี่ยนคำค้นหาหรือเลือกประเภทการดำเนินงานอื่น</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.all;
              const Icon = cfg.icon;

              return (
                <div
                  key={log.id}
                  className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/60 rounded-xl p-4 transition-all duration-200 hover:border-slate-600 flex items-start gap-4 shadow-sm"
                >
                  {/* Action Icon Badge */}
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0 shadow-inner`}>
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                        <h3 className="text-sm font-bold text-white truncate">
                          {log.actionTitle}
                        </h3>
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{formatThaiDateTime(log.timestamp)}</span>
                      </div>
                    </div>

                    {/* Establishment Name if present */}
                    {log.establishmentName && (
                      <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-semibold mb-1">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{log.establishmentName}</span>
                        {log.establishmentId && onSelectEstablishment && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectEstablishment(log.establishmentId!);
                              onClose();
                            }}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 underline ml-1 cursor-pointer"
                          >
                            (ดูหน้าร้าน)
                          </button>
                        )}
                      </div>
                    )}

                    {/* Officer info */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1.5">
                      <User className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="text-slate-300 font-medium">{log.officerName}</span>
                      {log.officerRole && (
                        <span className="text-slate-500">({log.officerRole})</span>
                      )}
                    </div>

                    {/* Note / Details */}
                    {log.details && (
                      <div className="text-xs text-slate-300 bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 font-sans leading-relaxed">
                        {log.details}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
            <span>แสดง {toThaiDigits(filteredLogs.length)} จากทั้งหมด {toThaiDigits(logs.length)} รายการ</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
