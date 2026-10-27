import React, { useState, useEffect, useMemo } from 'react';
import type { Establishment, OfficialFormCode, SystemSettings, PrintDocumentMode } from '../../types/publicHealth';
import { DEFAULT_SYSTEM_SETTINGS } from '../../types/publicHealth';
import {
  Printer,
  X,
  FileText,
  ShieldCheck,
  FileCheck2,
  TableProperties
} from 'lucide-react';
import {
  GarudaLicenseDoc,
  TempNoticeDoc,
  ApplicationDoc,
  ReceiptDoc,
  RegisterReportDoc,
  CleanFoodBannerDoc,
  FoodHandlerCardDoc,
  RenewalNoticeDoc,
  FieldRenewalPackDoc
} from './templates';

interface OfficialCertificatePrintProps {
  establishment?: Establishment | null;
  establishments?: Establishment[];
  formCode?: OfficialFormCode | string;
  onClose?: () => void;
  municipalityName?: string;
  initialMode?: PrintDocumentMode;
  initialReportCategory?: string;
  initialReportYear?: string;
  settings?: SystemSettings;
}

export const OfficialCertificatePrint: React.FC<OfficialCertificatePrintProps> = ({
  establishment,
  establishments = [],
  formCode = 'นจ.3',
  onClose,
  municipalityName = 'องค์การบริหารส่วนตำบลโป่งน้ำร้อน',
  initialMode,
  initialReportCategory,
  initialReportYear,
  settings
}) => {
  const currentSettings = settings || DEFAULT_SYSTEM_SETTINGS;
  const orgName = currentSettings.organizationName || municipalityName;

  const allList = establishments.length > 0 ? establishments : establishment ? [establishment] : [];
  const [selectedEstId, setSelectedEstId] = useState<string>(
    establishment?.id || allList[0]?.id || ''
  );

  const [printViewMode, setPrintViewMode] = useState<PrintDocumentMode>(
    initialMode || (establishment ? 'garuda' : 'register_report')
  );

  const [reportCategoryFilter, setReportCategoryFilter] = useState<string>(initialReportCategory || 'all');
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('all');
  const [reportYearFilter, setReportYearFilter] = useState<string>(initialReportYear || 'all');

  useEffect(() => {
    if (initialMode) setPrintViewMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (initialReportCategory) setReportCategoryFilter(initialReportCategory);
  }, [initialReportCategory]);

  useEffect(() => {
    if (initialReportYear) setReportYearFilter(initialReportYear);
  }, [initialReportYear]);

  const availableYears = useMemo(() => {
    const set = new Set<string>();
    allList.forEach((e) => {
      const regMatch = e.regNumber?.match(/[-_](\d{2})[-_]/);
      if (regMatch) {
        set.add(String(2500 + parseInt(regMatch[1], 10)));
      } else if (e.issueDate) {
        set.add(String(new Date(e.issueDate).getFullYear() + 543));
      } else if (e.applicationSubmissionDate) {
        set.add(String(new Date(e.applicationSubmissionDate).getFullYear() + 543));
      }
      if (e.yearlyArchives) {
        e.yearlyArchives.forEach((a) => set.add(String(a.year)));
      }
    });
    set.add('2570');
    set.add('2569');
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [allList]);

  useEffect(() => {
    if (initialMode) {
      setPrintViewMode(initialMode);
    }
  }, [initialMode]);

  useEffect(() => {
    if (establishment?.id) {
      setSelectedEstId(establishment.id);
    } else if (allList.length > 0 && !selectedEstId) {
      setSelectedEstId(allList[0].id);
    }
  }, [establishment?.id, allList]);

  const activeEstablishment = allList.find((e) => e.id === selectedEstId) || allList[0] || establishment;

  if (!activeEstablishment && printViewMode !== 'register_report') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 text-center">
        <p className="text-sm text-slate-600 mb-4">ไม่พบข้อมูลสถานประกอบการสำหรับพิมพ์เอกสาร</p>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-bold"
        >
          กลับสู่หน้าทะเบียน
        </button>
      </div>
    );
  }

  // Determine regimes & categories
  const regType = activeEstablishment?.regType || (typeof formCode === 'string' ? formCode : '') || 'นจ';
  const isHazardous = regType === 'บทส' || (typeof formCode === 'string' && formCode.startsWith('บทส')) || activeEstablishment?.category === 'hazardous';
  const isFoodLicense = regType === 'บทอ' || (typeof formCode === 'string' && formCode.startsWith('บทอ')) || activeEstablishment?.category === 'food_license';
  const isMarket = regType === 'อส' || (typeof formCode === 'string' && formCode.startsWith('อส')) || activeEstablishment?.category === 'market';
  const isPublicSale = regType === 'นส' || (typeof formCode === 'string' && formCode.startsWith('นส')) || activeEstablishment?.category === 'public_sale';
  const isWaste = regType === 'ปป' || (typeof formCode === 'string' && formCode.startsWith('ปป')) || activeEstablishment?.category === 'waste_sewage';

  const isStorage =
    !isHazardous && (
      activeEstablishment?.foodPlaceType === 'storage' ||
      (activeEstablishment?.categoryName?.includes('สะสมอาหาร') && !activeEstablishment?.categoryName?.includes('จำหน่ายอาหาร')) ||
      activeEstablishment?.businessName?.includes('โกดัง') ||
      activeEstablishment?.businessName?.includes('คลัง')
    );

  let formTitle = 'หนังสือรับรองการแจ้ง\nจัดตั้งสถานที่จำหน่ายอาหาร';
  let tempNoticeTitle = 'ใบรับแจ้งจัดตั้งสถานที่จำหน่ายอาหาร';
  let applicationTitle = 'แบบคำขอแจ้ง\nจัดตั้งสถานที่จำหน่ายอาหาร\n(มีพื้นที่ไม่เกิน 200 ตารางเมตร)';
  let displayCode = 'แบบ นจ. 3 (จำหน่ายอาหาร)';
  let tempNoticeCode = 'แบบ นจ. 2 (จำหน่ายอาหาร)';
  let applicationCode = 'แบบ นจ. 1 (จำหน่ายอาหาร)';

  if (isHazardous) {
    formTitle = 'ใบอนุญาต\nประกอบกิจการที่เป็นอันตรายต่อสุขภาพ';
    displayCode = 'แบบ อภ. 2';
    tempNoticeTitle = 'ใบรับคำขอรับใบอนุญาต\nประกอบกิจการที่เป็นอันตรายต่อสุขภาพ';
    tempNoticeCode = 'แบบ อภ. 1 (ใบรับคำขอ)';
    applicationTitle = 'คำขอรับใบอนุญาต/ต่ออายุใบอนุญาต\nประกอบกิจการที่เป็นอันตรายต่อสุขภาพ';
    applicationCode = 'แบบ อภ. 1';
  } else if (isFoodLicense) {
    formTitle = 'ใบอนุญาตจัดตั้งสถานที่จำหน่ายอาหารหรือสถานที่สะสมอาหาร';
    displayCode = 'แบบ บทอ.';
    tempNoticeTitle = 'ใบรับคำขอรับใบอนุญาตจัดตั้งสถานที่จำหน่ายอาหารหรือสถานที่สะสมอาหาร';
    tempNoticeCode = 'แบบ บทอ. 1 (ใบรับ)';
    applicationTitle = 'คำขอรับใบอนุญาตจัดตั้งสถานที่จำหน่ายอาหารหรือสถานที่สะสมอาหาร';
    applicationCode = 'แบบ บทอ. 1';
  } else if (isMarket) {
    formTitle = 'ใบอนุญาตจัดตั้งตลาด';
    displayCode = 'แบบ อส.';
    tempNoticeTitle = 'ใบรับคำขอรับใบอนุญาตจัดตั้งตลาด';
    tempNoticeCode = 'แบบ อส. 1 (ใบรับ)';
    applicationTitle = 'คำขอรับใบอนุญาตจัดตั้งตลาด';
    applicationCode = 'แบบ อส. 1';
  } else if (isPublicSale) {
    formTitle = 'ใบอนุญาตจำหน่ายสินค้าในที่หรือทางสาธารณะ';
    displayCode = 'แบบ นส.';
    tempNoticeTitle = 'ใบรับคำขอรับใบอนุญาตจำหน่ายสินค้าในที่หรือทางสาธารณะ';
    tempNoticeCode = 'แบบ นส. 1 (ใบรับ)';
    applicationTitle = 'คำขอรับใบอนุญาตจำหน่ายสินค้าในที่หรือทางสาธารณะ';
    applicationCode = 'แบบ นส. 1';
  } else if (isWaste) {
    formTitle = 'ใบอนุญาตรับทำการเก็บ ขน หรือกำจัดสิ่งปฏิกูลหรือมูลฝอย';
    displayCode = 'แบบ ปป.';
    tempNoticeTitle = 'ใบรับคำขอรับใบอนุญาตเก็บ ขน หรือกำจัดสิ่งปฏิกูลหรือมูลฝอย';
    tempNoticeCode = 'แบบ ปป. 1 (ใบรับ)';
    applicationTitle = 'คำขอรับใบอนุญาตรับทำการเก็บ ขน หรือกำจัดสิ่งปฏิกูลหรือมูลฝอย';
    applicationCode = 'แบบ ปป. 1';
  } else if (isStorage) {
    formTitle = 'หนังสือรับรองการแจ้ง\nจัดตั้งสถานที่สะสมอาหาร';
    displayCode = 'แบบ นจ. 3 (สะสมอาหาร)';
    tempNoticeTitle = 'ใบรับแจ้งจัดตั้งสถานที่สะสมอาหาร';
    tempNoticeCode = 'แบบ นจ. 2 (สะสมอาหาร)';
    applicationTitle = 'แบบคำขอแจ้ง\nจัดตั้งสถานที่สะสมอาหาร\n(มีพื้นที่ไม่เกิน 200 ตารางเมตร)';
    applicationCode = 'แบบ นจ. 1 (สะสมอาหาร)';
  }

  const handlePrint = () => {
    window.print();
  };

  const filteredReportList = useMemo(() => {
    return allList.filter((e) => {
      // Category filter
      if (reportCategoryFilter !== 'all') {
        if (reportCategoryFilter === 'food_all') {
          const isFood = e.category === 'food_notice' || e.category === 'food_license' || e.regType === 'นจ' || e.regType === 'บทอ';
          if (!isFood) return false;
        } else if (reportCategoryFilter === 'food_notice') {
          if (e.category !== 'food_notice' && e.regType !== 'นจ') return false;
        } else if (reportCategoryFilter === 'food_license') {
          if (e.category !== 'food_license' && e.regType !== 'บทอ') return false;
        } else if (reportCategoryFilter === 'hazardous') {
          if (e.category !== 'hazardous' && e.regType !== 'บทส') return false;
        } else if (reportCategoryFilter === 'market') {
          if (e.category !== 'market' && e.regType !== 'อส') return false;
        } else if (reportCategoryFilter === 'public_sale') {
          if (e.category !== 'public_sale' && e.regType !== 'นส') return false;
        } else if (reportCategoryFilter === 'waste_sewage') {
          if (e.category !== 'waste_sewage' && e.regType !== 'ปป') return false;
        } else if (e.category !== reportCategoryFilter) {
          return false;
        }
      }

      // Status filter
      if (reportStatusFilter !== 'all' && e.status !== reportStatusFilter) return false;

      // Year filter
      if (reportYearFilter !== 'all') {
        const target = parseInt(reportYearFilter, 10);
        let matches = false;
        if (e.yearlyArchives?.some((a) => a.year === target)) matches = true;
        const regMatch = e.regNumber?.match(/[-_](\d{2})[-_]/);
        if (regMatch && 2500 + parseInt(regMatch[1], 10) === target) matches = true;
        if (e.issueDate && new Date(e.issueDate).getFullYear() + 543 === target) matches = true;
        if (e.applicationSubmissionDate && new Date(e.applicationSubmissionDate).getFullYear() + 543 === target) matches = true;
        if (!matches) return false;
      }

      return true;
    });
  }, [allList, reportCategoryFilter, reportStatusFilter, reportYearFilter]);

  const totalPassed = filteredReportList.filter((e) => (e.inspectionScore ?? 0) >= 80).length;
  const totalFees = filteredReportList.reduce((acc, curr) => acc + (curr.feeAmount || 0), 0);

  return (
    <div className="flex flex-col h-full bg-transparent text-slate-800">
      <style>{`
        @media print {
          @page {
            size: ${printViewMode === 'cleanfood' || printViewMode === 'register_report' ? 'landscape' : 'portrait'};
            margin: ${printViewMode === 'cleanfood' || printViewMode === 'register_report' ? '10mm 12mm 10mm 15mm' : '18mm 18mm 16mm 22mm'};
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-certificate,
          #printable-temp-notice,
          #printable-application-form,
          .printable-doc-root {
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: none !important;
            min-height: auto !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            font-family: 'TH Sarabun New', 'TH Sarabun PSK', 'Sarabun', sans-serif !important;
            text-align: left !important;
          }
          .printable-doc-root p,
          #printable-certificate p,
          #printable-temp-notice p,
          #printable-application-form p {
            text-align: left !important;
            text-justify: none !important;
            word-break: normal !important;
          }
        }
      `}</style>

      {/* Top Action Bar (Hidden when printing) */}
      <div className="bg-white/95 border border-slate-200/90 shadow-sm rounded-2xl px-4 py-3 mb-3.5 shrink-0 print:hidden flex flex-col gap-2.5 backdrop-blur-xl">
        {/* Row 1: Title, Active Document Badge, Shop Selector & Print Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow-xs shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                  ศูนย์การพิมพ์และออกเอกสารราชการ
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-extrabold border border-emerald-300 shadow-2xs font-mono tracking-wide">
                  {printViewMode === 'garuda'
                    ? displayCode
                    : printViewMode === 'temp_notice'
                    ? tempNoticeCode
                    : printViewMode === 'replacement_cert'
                    ? `${displayCode} (ใบแทน)`
                    : printViewMode === 'application'
                    ? applicationCode
                    : printViewMode === 'register_report'
                    ? (reportYearFilter !== 'all' ? `ทะเบียนคุม ปี ${reportYearFilter}` : 'ทะเบียนคุมรายการ (ทุกปี)')
                    : displayCode}
                </span>
              </div>
            </div>
          </div>

          {/* Shop Switcher & Print Button */}
          <div className="flex items-center gap-2">
            {printViewMode === 'register_report' && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Year Filter */}
                <select
                  value={reportYearFilter}
                  onChange={(e) => setReportYearFilter(e.target.value)}
                  className="bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-600 cursor-pointer max-w-[130px] truncate shadow-2xs"
                  title="เลือกปีงบประมาณสำหรับพิมพ์ทะเบียนคุม"
                >
                  <option value="all">ทุกปีงบประมาณ</option>
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      ปี พ.ศ. {yr}
                    </option>
                  ))}
                </select>

                {/* Category Filter */}
                <select
                  value={reportCategoryFilter}
                  onChange={(e) => setReportCategoryFilter(e.target.value)}
                  className="bg-slate-50 text-slate-800 border border-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[170px] truncate font-medium shadow-2xs"
                  title="กรองประเภทกิจการในรายงาน (แยกหมวด)"
                >
                  <option value="all">ทุกหมวด (แยกหมวดอัตโนมัติ)</option>
                  <option value="food_all">หมวดอาหาร (นจ. + บทอ.)</option>
                  <option value="food_notice">นจ. (อาหาร ≤ 200 ตร.ม.)</option>
                  <option value="food_license">บทอ. (อาหาร &gt; 200 ตร.ม.)</option>
                  <option value="hazardous">บทส. (อันตรายต่อสุขภาพ)</option>
                  <option value="market">อส. (ตลาดสด/นัด)</option>
                  <option value="public_sale">นส. (ขายที่สาธารณะ)</option>
                  <option value="waste_sewage">ปป. (สิ่งปฏิกูล)</option>
                </select>

                {/* Status Filter */}
                <select
                  value={reportStatusFilter}
                  onChange={(e) => setReportStatusFilter(e.target.value)}
                  className="bg-slate-50 text-slate-800 border border-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[120px] truncate font-medium shadow-2xs"
                  title="กรองสถานะคำขอในรายงาน"
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="active">ได้รับอนุญาต</option>
                  <option value="pending_inspection">รอนัดตรวจ</option>
                  <option value="pending_correction">สั่งปรับปรุง</option>
                  <option value="expiring">ใกล้หมดอายุ</option>
                  <option value="awaiting_payment">รอชำระเงิน</option>
                </select>
              </div>
            )}

            {printViewMode !== 'register_report' && allList.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 transition-all shadow-2xs">
                <span className="text-emerald-700 font-bold text-xs shrink-0">🏪 ร้านค้า:</span>
                <select
                  value={selectedEstId}
                  onChange={(e) => setSelectedEstId(e.target.value)}
                  className="bg-transparent text-slate-900 font-bold text-xs focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[260px] truncate"
                  title="เลือกร้านค้าที่ต้องการพิมพ์เอกสาร"
                >
                  {allList.map((est) => (
                    <option key={est.id} value={est.id} className="bg-white text-slate-900 py-1 font-medium">
                      {est.businessName} ({est.regNumber || est.regType})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all text-xs cursor-pointer active:scale-95 whitespace-nowrap"
              title="กดเพื่อสั่งพิมพ์ออกเครื่องพิมพ์ A4 หรือบันทึก PDF"
            >
              <Printer className="w-4 h-4" />
              <span>สั่งพิมพ์ (Print / PDF)</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                title="ปิดหน้าพรีวิว"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Official Document Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/90 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setPrintViewMode('garuda')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                printViewMode === 'garuda' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
              title="ใบอนุญาตตัวจริง / หนังสือรับรองตัวจริงพร้อมตราครุฑ"
            >
              <FileText className={`w-3.5 h-3.5 ${printViewMode === 'garuda' ? 'text-white' : 'text-blue-600'}`} />
              <span>{isHazardous ? 'ใบอนุญาตจริง (อภ. 2)' : isFoodLicense ? 'ใบอนุญาตจริง (บทอ.)' : 'หนังสือรับรองจริง'}</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintViewMode('temp_notice')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                printViewMode === 'temp_notice' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
              title="ใบรับคำขอออกในวันเดียวกัน (Day-1)"
            >
              <FileCheck2 className={`w-3.5 h-3.5 ${printViewMode === 'temp_notice' ? 'text-white' : 'text-cyan-600'}`} />
              <span>{isHazardous ? 'ใบรับคำขอ (Day-1)' : 'ใบรับแจ้งชั่วคราว (Day-1)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintViewMode('application')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                printViewMode === 'application' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
              title="แบบคำขอรับใบอนุญาต/ต่ออายุ"
            >
              <FileText className={`w-3.5 h-3.5 ${printViewMode === 'application' ? 'text-white' : 'text-emerald-600'}`} />
              <span>{isHazardous ? 'แบบคำขอ (อภ. 1)' : 'แบบคำขอแจ้ง (นจ. 1)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintViewMode('replacement_cert')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                printViewMode === 'replacement_cert' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
              title="ใบแทนใบอนุญาต กรณีสูญหาย/ชำรุด"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${printViewMode === 'replacement_cert' ? 'text-white' : 'text-rose-600'}`} />
              <span>{isHazardous ? 'ใบแทน (อภ. 2)' : 'ใบแทนหนังสือรับรอง'}</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintViewMode('register_report')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                printViewMode === 'register_report' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
              title="รายงานทะเบียนคุมรายการทั้งหมด A4 แนวนอน"
            >
              <TableProperties className={`w-3.5 h-3.5 ${printViewMode === 'register_report' ? 'text-white' : 'text-teal-600'}`} />
              <span>ทะเบียนคุม A4</span>
            </button>
          </div>
        </div>
      </div>


      {/* A4 Paper Viewport */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex justify-center bg-slate-900/10 backdrop-blur-xs rounded-2xl print:p-0 print:bg-white print:overflow-visible border border-white/60">
        {(printViewMode === 'garuda' || printViewMode === 'replacement_cert') && activeEstablishment && (
          <GarudaLicenseDoc
            establishment={activeEstablishment}
            settings={currentSettings}
            mode={printViewMode}
            displayCode={displayCode}
            formTitle={formTitle}
          />
        )}

        {printViewMode === 'temp_notice' && activeEstablishment && (
          <TempNoticeDoc
            establishment={activeEstablishment}
            settings={currentSettings}
            tempNoticeCode={tempNoticeCode}
            tempNoticeTitle={tempNoticeTitle}
          />
        )}

        {printViewMode === 'application' && activeEstablishment && (
          <ApplicationDoc
            establishment={activeEstablishment}
            settings={currentSettings}
            applicationCode={applicationCode}
            applicationTitle={applicationTitle}
          />
        )}

        {printViewMode === 'register_report' && (
          <RegisterReportDoc
            establishments={filteredReportList}
            settings={currentSettings}
            totalPassed={totalPassed}
            totalFees={totalFees}
            selectedYear={reportYearFilter}
            selectedCategory={reportCategoryFilter}
          />
        )}

        {printViewMode === 'cleanfood' && activeEstablishment && (
          <CleanFoodBannerDoc
            establishment={activeEstablishment}
            settings={currentSettings}
            municipalityName={orgName}
          />
        )}

        {printViewMode === 'receipt' && activeEstablishment && (
          <ReceiptDoc
            establishment={activeEstablishment}
            settings={currentSettings}
            formTitle={formTitle}
          />
        )}

        {printViewMode === 'food_card' && activeEstablishment && (
          <FoodHandlerCardDoc
            establishment={activeEstablishment}
            settings={currentSettings}
          />
        )}

        {printViewMode === 'renewal_notice' && activeEstablishment && (
          <RenewalNoticeDoc
            establishment={activeEstablishment}
            settings={currentSettings}
            formTitle={formTitle}
          />
        )}

        {printViewMode === 'field_pack' && activeEstablishment && (
          <FieldRenewalPackDoc
            establishment={activeEstablishment}
            settings={currentSettings}
          />
        )}
      </div>
    </div>
  );
};

export default OfficialCertificatePrint;
