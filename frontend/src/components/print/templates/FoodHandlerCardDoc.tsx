import React from 'react';
import type { Establishment, SystemSettings } from '../../../types/publicHealth';
import { formatThaiDate } from './printHelpers';
import { Scissors } from 'lucide-react';

interface FoodHandlerCardDocProps {
  establishment: Establishment;
  settings: SystemSettings;
}

export const FoodHandlerCardDoc: React.FC<FoodHandlerCardDocProps> = ({
  establishment,
  settings
}) => {
  const sig = settings.signatories;
  const orgName = settings.organizationName || 'องค์การบริหารส่วนตำบลโป่งน้ำร้อน';

  return (
    <div
      id="printable-food-card"
      className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-8 sm:p-10 shadow-2xl border border-slate-300 print:shadow-none print:border-none print:w-full print:max-w-none print:p-6 print:m-0 flex flex-col justify-between font-serif relative"
      style={{ fontFamily: "'Sarabun', 'TH Sarabun New', serif" }}
    >
      {/* Header note for printing */}
      <div className="text-center pb-4 border-b border-slate-300 print:hidden">
        <h2 className="text-base font-bold text-slate-800">
          บัตรประจำตัวผู้สัมผัสอาหาร (Food Handler Smart Card)
        </h2>
        <p className="text-xs text-slate-500">
          ขนาดมาตรฐาน CR80 (8.5 x 5.4 ซม.) พิมพ์คู่หน้า-หลัง พร้อมเส้นประสำหรับตัดเคลือบพลาสติกหรือทำบัตรคล้องคอ
        </p>
      </div>

      {/* Card Pair Layout */}
      <div className="flex-1 flex flex-col items-center justify-center py-6 gap-8">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 w-full max-w-4xl">
          {/* 1. FRONT CARD */}
          <div className="w-[85.6mm] h-[54mm] sm:w-[92mm] sm:h-[58mm] rounded-xl border-2 border-emerald-600 bg-gradient-to-br from-emerald-50 via-white to-amber-50 shadow-md p-3.5 flex flex-col justify-between relative overflow-hidden shrink-0">
            <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
              <img src="/pnr_logo.png" alt="" className="w-32 h-32 object-contain" />
            </div>

            <div className="flex items-center gap-2 border-b border-emerald-200 pb-1.5">
              <img src="/pnr_logo.png" alt="อบต." className="w-8 h-8 object-contain shrink-0" />
              <div className="min-w-0 flex-1 leading-none">
                <div className="text-[11px] font-bold text-emerald-950 truncate">
                  บัตรประจำตัวผู้สัมผัสอาหาร
                </div>
                <div className="text-[8px] font-bold text-emerald-700 tracking-wider font-sans">
                  FOOD HANDLER IDENTIFICATION CARD
                </div>
                <div className="text-[8px] text-slate-600 truncate mt-0.5">
                  กองสาธารณสุขและสิ่งแวดล้อม อบต.โป่งน้ำร้อน
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 my-1">
              <div className="w-16 h-20 rounded border-2 border-emerald-700 bg-emerald-100 flex flex-col items-center justify-center p-1 text-center shrink-0 shadow-2xs relative overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs mb-1">
                  👤
                </div>
                <span className="text-[8px] font-bold text-emerald-900 leading-tight">รูปถ่าย ๑ นิ้ว</span>
                <span className="text-[6px] text-emerald-700">ตรวจผ่านสุขภาพ</span>
              </div>

              <div className="min-w-0 flex-1 text-[10px] space-y-0.5 leading-tight">
                <div>
                  ชื่อ-สกุล: <strong className="text-slate-900 text-[11px]">{establishment.ownerName}</strong>
                </div>
                <div>
                  เลขบัตร ปชช: <span className="font-mono font-bold text-slate-800">{establishment.citizenId}</span>
                </div>
                <div className="truncate">
                  ร้าน: <strong className="text-blue-900">{establishment.businessName}</strong>
                </div>
                <div className="text-[9px] text-slate-600 truncate">
                  วุฒิบัตรเลขที่: <span className="font-mono font-bold text-emerald-800">{establishment.foodHandlerCertNo || `อบ.ผส.๖๗/${establishment.docNo}`}</span>
                </div>
                <div className="text-[9px] text-slate-700 flex justify-between pt-0.5">
                  <span>ออก: {formatThaiDate(establishment.issueDate, false)}</span>
                  <span className="font-bold text-red-700">หมด: {formatThaiDate(establishment.expireDate, false)}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-emerald-200 pt-1 flex items-center justify-between text-[8px] text-slate-600">
              <span className="font-mono text-emerald-800 font-bold">CFGT-CARD #{establishment.docNo}</span>
              <span className="text-emerald-900 font-bold">พ.ร.บ.สาธารณสุข ๒๕๓๕</span>
            </div>
          </div>

          {/* 2. BACK CARD */}
          <div className="w-[85.6mm] h-[54mm] sm:w-[92mm] sm:h-[58mm] rounded-xl border-2 border-emerald-600 bg-slate-50 shadow-md p-3 flex flex-col justify-between relative overflow-hidden shrink-0">
            <div>
              <div className="text-center border-b border-emerald-200 pb-1 mb-1.5">
                <div className="text-[10px] font-bold text-emerald-900">
                  สุขวิทยาส่วนบุคคล ๕ ประการ สำหรับผู้สัมผัสอาหาร
                </div>
                <div className="text-[7.5px] text-slate-500 font-sans">
                  ตามกฎกระทรวงสุขาภิบาลอาหาร พ.ศ. ๒๕๖๑
                </div>
              </div>

              <ol className="text-[8px] text-slate-800 space-y-0.5 leading-snug list-decimal list-inside pl-0.5">
                <li>แต่งกายสะอาด สวมเสื้อมีแขน ผูกผ้ากันเปื้อน สวมหมวกคลุมผม</li>
                <li>ล้างมือให้สะอาดด้วยน้ำและสบู่ ๗ ขั้นตอนก่อนปรุงและหลังเข้าห้องน้ำ</li>
                <li>ใช้อุปกรณ์คีบ ช้อนตัก หยิบจับอาหารสุก ห้ามใช้มือเปล่าสัมผัสอาหาร</li>
                <li>เล็บสั้นสะอาด ไม่ทาสีเล็บ ไม่สวมแหวน นาฬิกา หรือเครื่องประดับขณะปรุง</li>
                <li>ผ่านการตรวจสุขภาพประจำปี ปลอดโรคติดต่อสำคัญ ๔ โรค</li>
              </ol>
            </div>

            <div className="border-t border-emerald-200 pt-1 flex items-end justify-between text-[7.5px]">
              <div className="text-slate-500 text-[7px] max-w-[150px] leading-tight">
                * ต้องพกบัตรนี้ไว้ประจำตัวหรือแขวนแสดงในสถานประกอบการตลอดเวลาปฏิบัติงาน
              </div>

              <div className="text-center">
                <div className="font-bold text-slate-800 text-[8px]">( {sig.healthDirectorName || 'นางสาวกมลวรรณ ชัยมงคล'} )</div>
                <div className="text-slate-600 text-[7px]">{sig.healthDirectorPosition || 'ผู้อำนวยการกองสาธารณสุขและสิ่งแวดล้อม'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cutting & Lamination Guidelines */}
        <div className="text-center text-xs text-slate-500 border-t border-dashed border-slate-300 pt-4 max-w-lg">
          <div className="flex items-center justify-center gap-1.5 font-bold text-slate-700 mb-1">
            <Scissors className="w-3.5 h-3.5" />
            <span>แนวตัดกระดาษและคำแนะนำการเคลือบพลาสติก</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            ตัดตามกรอบขอบบัตร พับประกบหน้า-หลัง แล้วเคลือบพลาสติกแข็ง (Lamination) ขนาดบัตรประชาชน เพื่อให้ผู้สัมผัสอาหารพกพาหรือใส่ซองแขวนคอขณะประกอบอาหาร
          </p>
        </div>
      </div>

      {/* Bottom Official Footer */}
      <div className="border-t border-slate-300 pt-2 flex items-center justify-between text-[11px] text-slate-500">
        <span>{orgName} • {settings.departmentName}</span>
        <span>พิมพ์ออกเมื่อ: {formatThaiDate(new Date().toISOString().split('T')[0], false)}</span>
      </div>
    </div>
  );
};
