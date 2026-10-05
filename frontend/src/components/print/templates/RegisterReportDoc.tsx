import React from 'react';
import type { Establishment, SystemSettings } from '../../../types/publicHealth';

interface RegisterReportDocProps {
  establishments: Establishment[];
  settings: SystemSettings;
  totalPassed: number;
  totalFees: number;
}

export const RegisterReportDoc: React.FC<RegisterReportDocProps> = ({
  establishments,
  settings,
  totalPassed,
  totalFees
}) => {
  const sig = settings.signatories;
  const orgName = settings.organizationName || 'องค์การบริหารส่วนตำบลโป่งน้ำร้อน';
  const districtName = settings.district || 'อำเภอฝาง';
  const provinceName = settings.province || 'จังหวัดเชียงใหม่';

  return (
    <div
      id="printable-register-report"
      className="w-full max-w-[297mm] min-h-[210mm] bg-white text-black p-8 sm:p-10 shadow-2xl border border-slate-300 print:shadow-none print:border-none print:w-full print:max-w-none print:p-4 print:m-0 flex flex-col justify-between font-serif relative overflow-hidden"
      style={{ fontFamily: "'Sarabun', 'TH Sarabun New', serif" }}
    >
      <div>
        {/* Header with Garuda Seal */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-800 mb-4">
          <div className="w-16 h-16 flex items-center justify-center shrink-0">
            <img
              src="/garuda.png"
              alt="ตราครุฑประจำแบบพิมพ์ราชการ"
              className="w-14 h-14 object-contain filter contrast-125"
            />
          </div>
          <div className="text-center flex-1 px-4">
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 leading-snug">
              รายงานทะเบียนคุมสถานที่จำหน่ายอาหารและสถานที่สะสมอาหาร
            </h1>
            <p className="text-xs font-bold text-slate-800 mt-0.5">
              {orgName} {districtName} {provinceName}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              ตามพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕ หมวด ๘ • ข้อมูลสารบรรณประจำปีงบประมาณ {settings.fiscalYear}
            </p>
          </div>
          <div className="w-16 h-16 flex items-center justify-center shrink-0">
            <img
              src="/pnr_logo.png"
              alt="ตรา อบต.โป่งน้ำร้อน"
              className="w-14 h-14 object-contain"
            />
          </div>
        </div>

        {/* Summary Stats Pill Bar */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-xs text-xs text-slate-700 mb-3 print:bg-transparent">
          <div className="flex items-center gap-4">
            <span>จำนวนสถานประกอบการในบัญชี: <strong className="font-mono text-sm">{establishments.length}</strong> แห่ง</span>
            <span>ผ่านเกณฑ์สุขลักษณะ (๑๐๐ คะแนน): <strong className="font-mono text-emerald-800">{totalPassed}</strong> แห่ง ({establishments.length > 0 ? Math.round((totalPassed / establishments.length) * 100) : 0}%)</span>
          </div>
          <div>
            รวมค่าธรรมเนียมจัดเก็บทั้งสิ้น: <strong className="font-mono text-sm text-blue-900">{totalFees.toLocaleString()}</strong> บาท
          </div>
        </div>

        {/* Table of Establishments */}
        <table className="w-full border-collapse border border-slate-400 text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-900 print:bg-slate-200">
              <th className="border border-slate-400 py-1.5 px-2 text-center w-8">ที่</th>
              <th className="border border-slate-400 py-1.5 px-2 text-center w-28">เลขทะเบียนคุม</th>
              <th className="border border-slate-400 py-1.5 px-2 text-left">ชื่อสถานประกอบการ</th>
              <th className="border border-slate-400 py-1.5 px-2 text-left">ประเภทกิจการ</th>
              <th className="border border-slate-400 py-1.5 px-2 text-left">ชื่อผู้ขออนุญาต</th>
              <th className="border border-slate-400 py-1.5 px-2 text-left">ที่ตั้ง / หมู่บ้าน</th>
              <th className="border border-slate-400 py-1.5 px-2 text-center w-20">คะแนนสุขลักษณะ</th>
              <th className="border border-slate-400 py-1.5 px-2 text-center w-24">สถานะ</th>
              <th className="border border-slate-400 py-1.5 px-2 text-right w-20">ค่าธรรมเนียม</th>
            </tr>
          </thead>
          <tbody>
            {establishments.map((est, idx) => (
              <tr key={est.id} className="hover:bg-slate-50">
                <td className="border border-slate-300 py-1 px-2 text-center font-mono">{idx + 1}</td>
                <td className="border border-slate-300 py-1 px-2 text-center font-mono font-semibold">{est.regNumber}</td>
                <td className="border border-slate-300 py-1 px-2 font-bold text-slate-900">{est.businessName}</td>
                <td className="border border-slate-300 py-1 px-2 text-[11px] text-slate-700">{est.categoryName} ({est.areaSqm} ตร.ม.)</td>
                <td className="border border-slate-300 py-1 px-2 font-medium">{est.ownerName}</td>
                <td className="border border-slate-300 py-1 px-2 text-[11px] text-slate-600">{est.village}</td>
                <td className="border border-slate-300 py-1 px-2 text-center font-mono font-bold">
                  {est.inspectionScore !== undefined ? (
                    <span className={est.inspectionScore >= 80 ? 'text-emerald-800' : 'text-red-700'}>
                      {est.inspectionScore}/๑๐๐
                    </span>
                  ) : (
                    <span className="text-slate-400">รอนัดตรวจ</span>
                  )}
                </td>
                <td className="border border-slate-300 py-1 px-2 text-center text-[11px]">
                  {est.status === 'active' && 'ได้รับอนุญาต'}
                  {est.status === 'expiring' && 'ใกล้หมดอายุ'}
                  {est.status === 'pending_inspection' && 'รอนัดตรวจ'}
                  {est.status === 'pending_correction' && 'สั่งปรับปรุง'}
                  {est.status === 'awaiting_payment' && 'รอชำระเงิน'}
                </td>
                <td className="border border-slate-300 py-1 px-2 text-right font-mono font-semibold">
                  {est.feeAmount.toLocaleString()} ฿
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Signatures for Register Report */}
      <div className="pt-6 mt-4 border-t border-slate-300">
        <div className="grid grid-cols-3 gap-6 text-xs text-center">
          <div>
            <div className="mb-7">ผู้จัดทำรายงานทะเบียนคุม</div>
            <div className="border-b border-dotted border-slate-600 w-44 mx-auto mb-1" />
            <div className="font-bold">( {sig.officerName} )</div>
            <div className="text-[11px] text-slate-600">{sig.officerPosition}</div>
          </div>

          <div>
            <div className="mb-7">ผู้ตรวจสอบข้อมูลสารบรรณ</div>
            <div className="border-b border-dotted border-slate-600 w-44 mx-auto mb-1" />
            <div className="font-bold">( {sig.healthChiefName} )</div>
            <div className="text-[11px] text-slate-600">{sig.healthChiefPosition}</div>
          </div>

          <div>
            <div className="mb-7">ผู้รับรองรายงานทะเบียน</div>
            <div className="border-b border-dotted border-slate-600 w-44 mx-auto mb-1" />
            <div className="font-bold">( {sig.healthDirectorName} )</div>
            <div className="text-[11px] text-slate-600">{sig.healthDirectorPosition}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
