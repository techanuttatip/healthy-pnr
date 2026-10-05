import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  X,
  FileJson,
  Cloud,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { sanitationDataService } from '../../services/sanitationDataService';
import type { Establishment } from '../../types/publicHealth';

interface DataSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  establishments: Establishment[];
  onDataRestored?: () => void;
}

export const DataSafetyModal: React.FC<DataSafetyModalProps> = ({
  isOpen,
  onClose,
  establishments,
  onDataRestored
}) => {
  const [isCloud, setIsCloud] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });

  useEffect(() => {
    if (isOpen) {
      setIsCloud(sanitationDataService.isUsingCloud());
      setLastBackup(sanitationDataService.getLastBackupTime());
      setRestoreStatus({ loading: false });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadBackup = async () => {
    setIsDownloading(true);
    try {
      const res = await sanitationDataService.downloadBackupFile();
      setLastBackup(new Date().toISOString());
      setRestoreStatus({
        loading: false,
        success: true,
        message: `สำรองข้อมูลสำเร็จ! ดาวน์โหลดไฟล์ ${res.filename} (${res.sizeKb} KB) เรียบร้อยแล้ว`
      });
    } catch (err: any) {
      setRestoreStatus({
        loading: false,
        success: false,
        message: `เกิดข้อผิดพลาดในการสำรองข้อมูล: ${err.message}`
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreStatus({ loading: true });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const res = await sanitationDataService.restoreFullBackup(text);
        setRestoreStatus({
          loading: false,
          success: res.success,
          message: res.message
        });

        if (res.success && onDataRestored) {
          setTimeout(() => {
            onDataRestored();
          }, 1200);
        }
      } catch (err: any) {
        setRestoreStatus({
          loading: false,
          success: false,
          message: `ไฟล์ไม่ถูกต้อง: ${err.message}`
        });
      }
    };
    reader.readAsText(file);
  };

  const formatDateTime = (isoStr?: string | null) => {
    if (!isoStr) return 'ยังไม่เคยมีการสำรองข้อมูลในเครื่องนี้';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                ศูนย์ความปลอดภัยและสำรองข้อมูล (Data Safety)
              </h2>
              <p className="text-xs text-emerald-200/80">
                ระบบประกันความปลอดภัยข้อมูล ๑๐๐% • อบต.โป่งน้ำร้อน
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Cloud vs Local Persistence Status */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              สถานะการจัดเก็บข้อมูลสารบรรณปัจจุบัน
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                {isCloud ? (
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Cloud className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <HardDrive className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span>{isCloud ? 'Supabase Cloud Storage (เชื่อมต่อสมบูรณ์)' : 'Local Storage (เก็บบนเครื่องทำงานปลอดภัย)'}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="text-xs text-slate-500">
                    ข้อมูลสถานประกอบการทั้งหมด: <strong className="font-mono text-emerald-700 dark:text-emerald-400">{establishments.length}</strong> แห่ง
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  ระบบพร้อมใช้งาน
                </span>
              </div>
            </div>
          </div>

          {/* Feedback Banner */}
          {restoreStatus.message && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                restoreStatus.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300'
              }`}
            >
              {restoreStatus.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              )}
              <div className="font-medium leading-relaxed">{restoreStatus.message}</div>
            </div>
          )}

          {/* 1. Quick Backup Export */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>๑. ดาวน์โหลดไฟล์สำรองฉุกเฉิน (One-Click Backup)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ดาวน์โหลดข้อมูลร้านค้าทั้งหมด, ประวัติผลตรวจสุขาภิบาล, แฟ้มรายปี และประวัติ Audit Log เก็บไว้เป็นไฟล์ .json
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[11px] text-slate-500">
                สำรองข้อมูลล่าสุด: <strong className="text-slate-700 dark:text-slate-300">{formatDateTime(lastBackup)}</strong>
              </div>

              <button
                type="button"
                onClick={handleDownloadBackup}
                disabled={isDownloading}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังสร้างไฟล์...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>ดาวน์โหลดไฟล์สำรอง (.json)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2. Restore from Backup */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 bg-amber-50/30 dark:bg-amber-950/10">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-600" />
                <span>๒. กู้คืนข้อมูลจากไฟล์สำรอง (Disaster Recovery)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                หากเครื่องคอมพิวเตอร์เปลี่ยนเครื่องใหม่ หรือประวัติในเบราว์เซอร์ถูกล้าง สามารถนำไฟล์สำรอง .json มาโหลดกลับคืนได้ทันที
              </p>
            </div>

            <div className="pt-2 border-t border-amber-200/50 dark:border-amber-800/30 flex items-center justify-between">
              <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-amber-600 shadow-xs cursor-pointer transition-all">
                <FileJson className="w-4 h-4 text-amber-500" />
                <span>เลือกไฟล์สำรอง .json เพื่อกู้คืน</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <span className="text-[11px] text-slate-400">
                รองรับไฟล์ PNR_Health_Backup_*.json
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            กองสาธารณสุขและสิ่งแวดล้อม • อบต.โป่งน้ำร้อน
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
