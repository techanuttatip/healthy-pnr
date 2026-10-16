import React from 'react';
import type { Establishment, SystemSettings } from '../../../types/publicHealth';
import { formatThaiDate, parseAddressDetails, thaiBahtText } from './printHelpers';
import { DEFAULT_OFFICER_SIGNATURE, sanitationDataService } from '../../../services/sanitationDataService';
import { Scissors } from 'lucide-react';

interface ReceiptDocProps {
  establishment: Establishment;
  settings: SystemSettings;
  formTitle: string;
}

export const ReceiptDoc: React.FC<ReceiptDocProps> = ({
  establishment,
  settings,
  formTitle
}) => {
  const sig = settings.signatories;
  const currentOfficer = sanitationDataService.getCurrentOfficer();
  const officerSig = currentOfficer?.signatureUrl || DEFAULT_OFFICER_SIGNATURE;
  const orgName = settings.organizationName || 'องค์การบริหารส่วนตำบลโป่งน้ำร้อน';
  const districtName = settings.district || 'อำเภอฝาง';
  const provinceName = settings.province || 'จังหวัดเชียงใหม่';
  const parsedAddress = parseAddressDetails(establishment.address, establishment.village);

  const renderReceiptBlock = (titleType: string, isOriginal: boolean) => (
    <div className="flex-1 flex flex-col justify-between border-2 border-slate-700 rounded-lg p-5 bg-white relative">
      {/* Watermark in background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 select-none">
        <img src="/pnr_logo.png" alt="" className="w-40 h-40 object-contain" />
      </div>

      {/* Receipt Header */}
      <div>
        <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-3">
            <img
              src="/pnr_logo.png"
              alt="ตรา อบต.โป่งน้ำร้อน"
              className="w-14 h-14 object-contain shrink-0"
            />
            <div>
              <div className="text-base font-bold text-slate-900 leading-tight">
                {orgName}
              </div>
              <div className="text-xs text-slate-700">
                {settings.departmentName || 'กองสาธารณสุขและสิ่งแวดล้อม'} {districtName} {provinceName}
              </div>
              <div className="text-[11px] text-slate-600 font-mono">
                โทร. {settings.phoneNumber || '053-810317'}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold border mb-1.5 ${
                isOriginal
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                  : 'bg-blue-50 text-blue-800 border-blue-400'
              }`}
            >
              {titleType}
            </span>
            <div className="text-xs space-y-1">
              <div>
                เล่มที่ <span className="font-mono text-sm border-b border-dotted border-slate-600 px-6 inline-block min-w-[70px] text-center">&nbsp;</span>
              </div>
              <div>
                เลขที่ <span className="font-mono text-sm border-b border-dotted border-slate-600 px-8 inline-block min-w-[90px] text-center">&nbsp;</span>
              </div>
              <div className="text-[11px] text-slate-700">
                วันที่ <strong>{formatThaiDate(establishment.issueDate, false)}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center my-2">
          <h2 className="text-lg font-bold tracking-wide">ใบเสร็จรับเงิน</h2>
          <p className="text-xs text-slate-700">
            ค่าธรรมเนียมตามพระราชบัญญัติการสาธารณสุข พ.ศ. 2535 และข้อบัญญัติท้องถิ่น
          </p>
        </div>

        {/* Payer Info Grid */}
        <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-xs mb-3 space-y-1">
          <div className="flex justify-between">
            <span>
              ได้รับเงินจาก: <strong className="text-slate-900">{establishment.ownerName}</strong>
            </span>
            <span>
              เลขบัตรประชาชน/นิติบุคคล: <strong className="font-mono">{establishment.citizenId}</strong>
            </span>
          </div>
          <div className="flex justify-between">
            <span>
              ชื่อสถานประกอบการ: <strong className="text-slate-900">{establishment.businessName}</strong>
            </span>
            <span>
              รหัสสารบรรณ: <strong className="font-mono">{establishment.regNumber}</strong>
            </span>
          </div>
          <div className="text-slate-700 text-[11px]">
            สถานที่ตั้ง: เลขที่ {parsedAddress.houseNo} {parsedAddress.fullVillageDisplay} ตำบลโป่งน้ำร้อน {districtName} {provinceName}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-xs border border-slate-700 mb-3">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-700">
              <th className="py-1.5 px-2 text-center w-12 border-r border-slate-700">ลำดับ</th>
              <th className="py-1.5 px-3 text-left border-r border-slate-700">รายการรับชำระ</th>
              <th className="py-1.5 px-3 text-right w-32">จำนวนเงิน (บาท)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="py-2 px-2 text-center border-r border-slate-700 font-mono">1</td>
              <td className="py-2 px-3 border-r border-slate-700">
                <div className="font-bold text-slate-900">
                  ค่าธรรมเนียม{formTitle.replace('\n', ' ')} ({establishment.regType})
                </div>
                <div className="text-[11px] text-slate-600">
                  ประจำปีงบประมาณ พ.ศ. {settings.fiscalYear ? settings.fiscalYear.replace(/[๐-๙]/g, (d) => '0123456789'['๐๑๒๓๔๕๖๗๘๙'.indexOf(d)]) : '2569'} (พื้นที่ {establishment.areaSqm} ตร.ม.)
                </div>
              </td>
              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                {establishment.feeAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr className="bg-slate-50 font-bold border-t-2 border-slate-700">
              <td colSpan={2} className="py-1.5 px-3 text-right border-r border-slate-700">
                รวมเงินทั้งสิ้น ( {thaiBahtText(establishment.feeAmount)} )
              </td>
              <td className="py-1.5 px-3 text-right font-mono text-emerald-800 text-sm">
                {establishment.feeAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signatures & Official Validation (No QR code, blank manual fill) */}
      <div className="flex items-end justify-between pt-2 border-t border-slate-200 text-xs">
        <div className="text-[11px] text-slate-600 leading-tight">
          <div className="font-bold text-slate-800">กองสาธารณสุขและสิ่งแวดล้อม อบต.โป่งน้ำร้อน</div>
          <div className="font-mono text-[10px] text-slate-500">รหัสคุม: {establishment.regNumber}</div>
          <div className="text-emerald-700 font-bold mt-0.5">รับชำระเงินตามระเบียบเรียบร้อยแล้ว</div>
        </div>

        <div className="flex items-end gap-8">
          <div className="text-center w-56 relative">
            <div className="relative flex items-end justify-center min-h-[40px] mb-1">
              <span className="text-[11px] text-slate-600 shrink-0 select-none pb-0.5">(ลงชื่อ)</span>
              <div className="relative flex-1 mx-1.5 border-b border-dotted border-slate-700 h-7 flex items-end justify-center">
                {officerSig && (
                  <img
                    src={officerSig}
                    alt="e-sig"
                    className="absolute -bottom-1 h-8 object-contain filter contrast-125 pointer-events-none"
                  />
                )}
              </div>
              <span className="text-[11px] text-slate-600 shrink-0 whitespace-nowrap pb-0.5">ผู้รับเงิน</span>
            </div>
            <div className="font-bold text-slate-900">( {sig.officerName || 'นางสาวรุ่งทิวา อุปนันท์'} )</div>
            <div className="text-[10px] text-slate-600">{sig.officerPosition || 'นักวิชาการสาธารณสุขปฏิบัติการ'}</div>
          </div>
          <div className="text-center w-56">
            <div className="relative flex items-end justify-center min-h-[40px] mb-1">
              <span className="text-[11px] text-slate-600 shrink-0 select-none pb-0.5">(ลงชื่อ)</span>
              <div className="flex-1 mx-1.5 border-b border-dotted border-slate-700 h-7"></div>
              <span className="text-[11px] text-slate-600 shrink-0 whitespace-nowrap pb-0.5">ผู้ตรวจเงิน</span>
            </div>
            <div className="font-bold text-slate-900">( {sig.healthChiefName || 'นายสุรชัย วงศ์ใหญ่'} )</div>
            <div className="text-[10px] text-slate-600">{sig.healthChiefPosition || 'หัวหน้าฝ่ายบริการสาธารณสุข'}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      id="printable-receipt"
      className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-8 sm:p-10 shadow-2xl border border-slate-300 print:shadow-none print:border-none print:w-full print:max-w-none print:p-6 print:m-0 flex flex-col justify-between font-serif relative"
      style={{ fontFamily: "'Sarabun', 'TH Sarabun New', serif" }}
    >
      <div className="flex-1 flex flex-col justify-between gap-4">
        {/* 1. ต้นฉบับ */}
        {renderReceiptBlock('ต้นฉบับ (สำหรับผู้ชำระเงิน)', true)}

        {/* Perforation line */}
        <div className="border-t-2 border-dashed border-slate-400 my-1 flex items-center justify-between text-[10px] text-slate-500 font-sans select-none">
          <span className="flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-slate-500" />
            <span>รอยปรุตัดแยก (ต้นฉบับมอบให้ผู้ประกอบการ / สำเนาจัดเก็บเข้าบัญชีคลัง อบต.โป่งน้ำร้อน)</span>
          </span>
          <span className="font-mono">อบต.โป่งน้ำร้อน • เอกสารการเงินราชการ</span>
        </div>

        {/* 2. สำเนา */}
        {renderReceiptBlock('สำเนา (สำหรับ อบต.โป่งน้ำร้อน จัดเก็บเข้าบัญชีคลัง)', false)}
      </div>
    </div>
  );
};
