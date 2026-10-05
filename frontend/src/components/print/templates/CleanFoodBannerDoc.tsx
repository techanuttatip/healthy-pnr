import React from 'react';
import type { Establishment, SystemSettings } from '../../../types/publicHealth';
import { formatThaiDate, parseAddressDetails } from './printHelpers';
import { Sparkles } from 'lucide-react';

interface CleanFoodBannerDocProps {
  establishment: Establishment;
  settings: SystemSettings;
  municipalityName?: string;
}

export const CleanFoodBannerDoc: React.FC<CleanFoodBannerDocProps> = ({
  establishment,
  settings,
  municipalityName = 'องค์การบริหารส่วนตำบลโป่งน้ำร้อน'
}) => {
  const districtName = settings.district || 'อำเภอฝาง';
  const provinceName = settings.province || 'จังหวัดเชียงใหม่';
  const parsedAddress = parseAddressDetails(establishment.address, establishment.village);
  const isPlusGrade = (establishment.inspectionScore || 0) >= 95;

  return (
    <div
      id="printable-cleanfood-sign"
      className="w-full max-w-[297mm] min-h-[210mm] bg-[#FAFDF7] text-slate-900 p-8 sm:p-12 shadow-2xl border-8 border-emerald-800 rounded-sm print:shadow-none print:w-full print:max-w-none print:p-6 print:m-0 flex flex-col justify-between relative overflow-hidden font-sans"
      style={{ fontFamily: "'Sarabun', 'TH Sarabun New', sans-serif" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 select-none">
        <img
          src="/pnr_logo.png"
          alt="ลายน้ำตราสัญลักษณ์ อบต.โป่งน้ำร้อน"
          className="w-[125mm] h-[125mm] object-contain opacity-[0.07] select-none filter contrast-125 print:opacity-[0.08]"
        />
      </div>

      <div className="border-2 border-amber-600/60 p-6 sm:p-8 flex-1 flex flex-col justify-between relative z-10 bg-white/70 backdrop-blur-xs rounded-xs">
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-600" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-600" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-600" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-600" />

        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b-2 border-emerald-800/20 pb-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-16 h-16 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-center text-[10px] p-1 shadow-md border-2 border-amber-400">
              <div>
                <div className="text-amber-300 font-bold text-xs">MOPH</div>
                <div className="text-[9px] leading-tight">กรมอนามัย</div>
              </div>
            </div>
            <div>
              <div className="font-extrabold text-xs sm:text-sm text-emerald-950 uppercase tracking-wider">
                กรมอนามัย กระทรวงสาธารณสุข
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                สำนักสุขาภิบาลอาหารและน้ำ
              </div>
            </div>
          </div>

          <div className="text-center flex-1 px-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>เกณฑ์มาตรฐานสุขาภิบาลอาหารแห่งชาติ</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight">
              ป้ายรับรองมาตรฐานสุขาภิบาลอาหาร
            </h1>
            <p className="text-xs text-slate-600 font-semibold mt-0.5">
              ตามพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕ ร่วมกับ {municipalityName}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="font-extrabold text-xs sm:text-sm text-blue-950">
                อบต.โป่งน้ำร้อน
              </div>
              <div className="text-[11px] text-slate-500">
                อ.ฝาง จ.เชียงใหม่
              </div>
            </div>
            <div className="w-16 h-16 rounded-full bg-white shadow-md border-2 border-amber-400 p-1 flex items-center justify-center">
              <img
                src="/pnr_logo.png"
                alt="ตราสัญลักษณ์ อบต.โป่งน้ำร้อน"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Center Banner: Logo Clean Food Good Taste */}
        <div className="my-6 text-center">
          <div className="inline-block bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white px-10 py-4 rounded-2xl shadow-xl border-4 border-amber-400">
            <div className="text-xs sm:text-sm font-bold tracking-widest uppercase text-amber-300">
              CERTIFICATE OF FOOD SANITATION
            </div>
            <div className="text-3xl sm:text-4xl font-black tracking-tight my-1 flex items-center justify-center gap-3">
              <span>CLEAN FOOD GOOD TASTE</span>
              {isPlusGrade && (
                <span className="text-amber-300 text-2xl font-extrabold bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-400">
                  PLUS
                </span>
              )}
            </div>
            <div className="text-sm sm:text-base font-bold text-emerald-100">
              "สะอาด ปลอดภัย ได้มาตรฐานสุขาภิบาลอาหาร"
            </div>
          </div>

          {/* Establishment Name & Details */}
          <div className="mt-6 space-y-2">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">
              ป้ายรับรองนี้ออกให้เพื่อแสดงว่า สถานประกอบการ
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 text-emerald-900">
              "{establishment.businessName}"
            </div>
            <div className="text-sm font-bold text-slate-700">
              ผู้ประกอบการ / ผู้รับผิดชอบ:{' '}
              <span className="text-blue-900 font-extrabold">
                {establishment.ownerName}
              </span>
            </div>
            <div className="text-xs text-slate-600">
              ตั้งอยู่เลขที่ {parsedAddress.houseNo} {parsedAddress.fullVillageDisplay} ตำบลโป่งน้ำร้อน {districtName} {provinceName}
            </div>
          </div>
        </div>

        {/* Bottom Signboard Info */}
        <div className="border-t-2 border-emerald-800/20 pt-4 flex items-end justify-between text-xs text-slate-700">
          <div className="text-left space-y-1">
            <div>
              รหัสรับรองสุขาภิบาล:{' '}
              <span className="font-mono font-bold text-sm text-emerald-900">
                CFGT-PNR-{establishment.regNumber}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              ผลตรวจประเมินสุขาภิบาล:{' '}
              <span className="font-bold text-emerald-700">
                {establishment.inspectionScore || 95} / ๑๐๐ คะแนน
              </span>{' '}
              (ผ่านเกณฑ์มาตรฐานดีเยี่ยม)
            </div>
            <div className="text-[10px] text-slate-400">
              โปรดแสดงป้ายนี้ไว้ในที่เปิดเผยเห็นได้ชัดเจนหน้าร้าน
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className="text-xs">
              วันรับรอง:{' '}
              <span className="font-mono font-bold">
                {formatThaiDate(establishment.issueDate, false)}
              </span>
            </div>
            <div className="text-xs font-bold text-emerald-800">
              มีผลใช้ได้ถึง:{' '}
              <span className="font-mono">
                {formatThaiDate(establishment.expireDate, false)}
              </span>
            </div>
            <div className="text-[10px] text-slate-500">
              ออกโดย กองสาธารณสุขและสิ่งแวดล้อม อบต.โป่งน้ำร้อน
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
