import React, { useMemo } from 'react';
import type { Establishment, SystemSettings } from '../../../types/publicHealth';
import { DEFAULT_OFFICER_SIGNATURE, sanitationDataService } from '../../../services/sanitationDataService';

interface RegisterReportDocProps {
  establishments: Establishment[];
  settings: SystemSettings;
  totalPassed: number;
  totalFees: number;
  selectedYear?: string;
  selectedCategory?: string;
}

export const RegisterReportDoc: React.FC<RegisterReportDocProps> = ({
  establishments,
  settings,
  totalPassed,
  totalFees,
  selectedYear = 'all',
  selectedCategory = 'all'
}) => {
  const sig = settings.signatories;
  const currentOfficer = sanitationDataService.getCurrentOfficer();
  const officerSig = sig.officerSignatureUrl || currentOfficer?.signatureUrl || DEFAULT_OFFICER_SIGNATURE;
  const orgName = settings.organizationName || 'องค์การบริหารส่วนตำบลโป่งน้ำร้อน';
  const districtName = settings.district || 'อำเภอฝาง';
  const provinceName = settings.province || 'จังหวัดเชียงใหม่';

  const thaiDigits = (str: string | number) => {
    return String(str).replace(/[0-9]/g, (d) => '๐๑๒๓๔๕๖๗๘๙'[parseInt(d, 10)]);
  };

  // Determine Title & Law Section based on Category
  let reportMainTitle = 'รายงานทะเบียนคุมสถานประกอบการ';
  let lawSection = 'ตามพระราชบัญญัติการสาธารณสุข พ.ศ. 2535';

  if (selectedCategory === 'food_notice') {
    reportMainTitle = 'รายงานทะเบียนคุมสถานที่จำหน่ายอาหารและสถานที่สะสมอาหาร (พื้นที่ไม่เกิน ๒๐๐ ตารางเมตร)';
    lawSection = 'ตามพระราชบัญญัติการสาธารณสุข พ.ศ. 2535 หมวด 8 (แบบ นจ.)';
  } else if (selectedCategory === 'food_license') {
    reportMainTitle = 'รายงานทะเบียนคุมสถานที่จำหน่ายอาหารและสถานที่สะสมอาหาร (พื้นที่เกิน ๒๐๐ ตารางเมตร)';
    lawSection = 'ตามพระราชบัญญัติการสาธารณสุข พ.ศ. 2535 หมวด 8 (แบบ บทอ.)';
  } else if (selectedCategory === 'food_all') {
    reportMainTitle = 'รายงานทะเบียนคุมสถานที่จำหน่ายอาหารและสถานที่สะสมอาหาร';
    lawSection = 'ตามพระราชบัญญัติการสาธารณสุข พ.ศ. 2535 หมวด 8';
  } else if (selectedCategory === 'hazardous') {
    reportMainTitle = 'รายงานทะเบียนคุมการประกอบกิจการที่เป็นอันตรายต่อสุขภาพ';
    lawSection = 'ตามพระราชบัญญัติการสาธารณสุข พ.ศ. 2535 หมวด 7 (แบบ บทส.)';
  } else if (selectedCategory === 'market') {
    reportMainTitle = 'รายงานทะเบียนคุมการจัดตั้งตลาด';
    lawSection = 'ตามพระราชบัญญัติการสาธารณสุข พ.ศ. 2535 หมวด 8 (แบบ อส.)';
  } else if (selectedCategory === 'public_sale') {
    reportMainTitle = 'รายงานทะเบียนคุมการจำหน่ายสินค้าในที่หรือทางสาธารณะ';
    lawSection = 'ตามพระราชบัญญัติการสาธารณสุข พ.ศ. 2535 หมวด 9 (แบบ นส.)';
  } else if (selectedCategory === 'waste_sewage') {
    reportMainTitle = 'รายงานทะเบียนคุมการรับทำการเก็บ ขน หรือกำจัดสิ่งปฏิกูลหรือมูลฝอย';
    lawSection = 'ตามพระราชบัญญัติการสาธารณสุข พ.ศ. 2535 หมวด 3 (แบบ ปป.)';
  } else {
    reportMainTitle = 'รายงานทะเบียนคุมสถานประกอบการและการจัดเก็บค่าธรรมเนียม';
    lawSection = 'ตามพระราชบัญญัติการสาธารณสุข พ.ศ. 2535 และข้อบัญญัติท้องถิ่น';
  }

  const yearLabel = selectedYear && selectedYear !== 'all'
    ? `ข้อมูลสารบรรณประจำปีงบประมาณ พ.ศ. ${thaiDigits(selectedYear)}`
    : `ข้อมูลสารบรรณทะเบียนคุมสะสม (รวมทุกปีงบประมาณ)`;

  // Grouping when selectedCategory === 'all'
  const groupedCategories = useMemo(() => {
    if (selectedCategory !== 'all') {
      return [{ key: selectedCategory, title: '', items: establishments }];
    }

    const groups: { key: string; title: string; items: Establishment[] }[] = [
      {
        key: 'food',
        title: 'หมวดที่ ๑: สถานที่จำหน่ายอาหารและสถานที่สะสมอาหาร (แบบ นจ. และ บทอ.)',
        items: establishments.filter((e) => e.category === 'food_notice' || e.category === 'food_license' || e.regType === 'นจ' || e.regType === 'บทอ')
      },
      {
        key: 'hazardous',
        title: 'หมวดที่ ๒: กิจการที่เป็นอันตรายต่อสุขภาพ (แบบ บทส.)',
        items: establishments.filter((e) => e.category === 'hazardous' || e.regType === 'บทส')
      },
      {
        key: 'market_public',
        title: 'หมวดที่ ๓: กิจการตลาดและการจำหน่ายสินค้าในที่หรือทางสาธารณะ (แบบ อส. และ นส.)',
        items: establishments.filter((e) => e.category === 'market' || e.category === 'public_sale' || e.regType === 'อส' || e.regType === 'นส')
      },
      {
        key: 'waste',
        title: 'หมวดที่ ๔: การรับทำการเก็บ ขน หรือกำจัดสิ่งปฏิกูลหรือมูลฝอย (แบบ ปป.)',
        items: establishments.filter((e) => e.category === 'waste_sewage' || e.regType === 'ปป')
      }
    ];

    const activeGroups = groups.filter((g) => g.items.length > 0);
    return activeGroups.length > 0 ? activeGroups : [{ key: 'all', title: '', items: establishments }];
  }, [establishments, selectedCategory]);

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
              {reportMainTitle}
            </h1>
            <p className="text-xs font-bold text-slate-800 mt-0.5">
              {orgName} {districtName} {provinceName}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
              {lawSection} • {yearLabel}
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
            <span>ผ่านเกณฑ์สุขลักษณะ (≥ 80 คะแนน): <strong className="font-mono text-emerald-800">{totalPassed}</strong> แห่ง ({establishments.length > 0 ? Math.round((totalPassed / establishments.length) * 100) : 0}%)</span>
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
            {establishments.length === 0 ? (
              <tr>
                <td colSpan={9} className="border border-slate-300 py-8 text-center text-slate-400 italic">
                  ไม่พบรายการสถานประกอบการตามเงื่อนไขปีและหมวดหมู่ที่เลือก
                </td>
              </tr>
            ) : (
              groupedCategories.map((group, groupIdx) => {
                let runningIndex = 0;
                return (
                  <React.Fragment key={group.key || groupIdx}>
                    {group.title && selectedCategory === 'all' && (
                      <tr className="bg-slate-100/90 font-bold text-slate-900 border border-slate-400">
                        <td colSpan={9} className="py-1.5 px-3 text-left bg-slate-200/70 border-y border-slate-400">
                          {group.title} ({group.items.length} แห่ง)
                        </td>
                      </tr>
                    )}
                    {group.items.map((est) => {
                      runningIndex += 1;
                      return (
                        <tr key={est.id} className="hover:bg-slate-50">
                          <td className="border border-slate-300 py-1 px-2 text-center font-mono">{runningIndex}</td>
                          <td className="border border-slate-300 py-1 px-2 text-center font-mono font-semibold">{est.regNumber}</td>
                          <td className="border border-slate-300 py-1 px-2 font-bold text-slate-900">{est.businessName}</td>
                          <td className="border border-slate-300 py-1 px-2 text-[11px] text-slate-700">{est.categoryName} ({est.areaSqm} ตร.ม.)</td>
                          <td className="border border-slate-300 py-1 px-2 font-medium">{est.ownerName}</td>
                          <td className="border border-slate-300 py-1 px-2 text-[11px] text-slate-600">{est.village}</td>
                          <td className="border border-slate-300 py-1 px-2 text-center font-mono font-bold">
                            {est.inspectionScore !== undefined ? (
                              <span className={est.inspectionScore >= 80 ? 'text-emerald-800' : 'text-red-700'}>
                                {est.inspectionScore}/100
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
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Signatures for Register Report */}
      <div className="pt-6 mt-4 border-t border-slate-300">
        <div className="grid grid-cols-3 gap-6 text-xs text-center items-end">
          <div className="text-center">
            <div className="text-slate-800 font-medium mb-1">ผู้จัดทำรายงานทะเบียนคุม</div>
            <div className="relative flex items-end justify-center min-h-[44px] mb-1">
              <span className="text-xs text-slate-700 shrink-0 select-none pb-0.5">(ลงชื่อ)</span>
              <div className="relative flex-1 mx-2 border-b border-dotted border-slate-700 h-8 flex items-end justify-center">
                {officerSig && (
                  <img
                    src={officerSig}
                    alt="ลายเซ็นผู้จัดทำรายงาน"
                    className="absolute -bottom-1.5 h-10 object-contain filter contrast-125 pointer-events-none"
                  />
                )}
              </div>
            </div>
            <div className="font-bold text-slate-900">( {sig.officerName || currentOfficer?.name} )</div>
            <div className="text-[11px] text-slate-600">{sig.officerPosition || currentOfficer?.position}</div>
          </div>

          <div className="text-center">
            <div className="text-slate-800 font-medium mb-1">ผู้ตรวจสอบข้อมูลสารบรรณ</div>
            <div className="relative flex items-end justify-center min-h-[44px] mb-1">
              <span className="text-xs text-slate-700 shrink-0 select-none pb-0.5">(ลงชื่อ)</span>
              <div className="flex-1 mx-2 border-b border-dotted border-slate-700 h-8"></div>
            </div>
            <div className="font-bold text-slate-900">( {sig.healthChiefName} )</div>
            <div className="text-[11px] text-slate-600">{sig.healthChiefPosition}</div>
          </div>

          <div className="text-center">
            <div className="text-slate-800 font-medium mb-1">ผู้รับรองรายงานทะเบียน</div>
            <div className="relative flex items-end justify-center min-h-[44px] mb-1">
              <span className="text-xs text-slate-700 shrink-0 select-none pb-0.5">(ลงชื่อ)</span>
              <div className="flex-1 mx-2 border-b border-dotted border-slate-700 h-8"></div>
            </div>
            <div className="font-bold text-slate-900">( {sig.healthDirectorName} )</div>
            <div className="text-[11px] text-slate-600">{sig.healthDirectorPosition}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
