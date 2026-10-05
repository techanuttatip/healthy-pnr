import React, { useState, useEffect, useMemo } from 'react';
import type { Establishment, OfficialFormCode, SystemSettings, PrintDocumentMode } from '../../types/publicHealth';
import { DEFAULT_SYSTEM_SETTINGS } from '../../types/publicHealth';
import {
  Printer,
  X,
  Award,
  ShieldCheck,
  FileText,
  FileCheck2,
  TableProperties,
  Receipt,
  Contact,
  BellRing
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
  settings?: SystemSettings;
}

export const OfficialCertificatePrint: React.FC<OfficialCertificatePrintProps> = ({
  establishment,
  establishments = [],
  formCode = 'นจ.3',
  onClose,
  municipalityName = 'องค์การบริหารส่วนตำบลโป่งน้ำร้อน',
  initialMode,
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

  const [reportCategoryFilter, setReportCategoryFilter] = useState<string>('all');
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('all');

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
      activeEstablishment?.categoryName?.includes('สะสมอาหาร') ||
      activeEstablishment?.businessName?.includes('โกดัง') ||
      activeEstablishment?.businessName?.includes('คลัง')
    );

  let formTitle = 'หนังสือรับรองการแจ้ง\nจัดตั้งสถานที่จำหน่ายอาหาร';
  let tempNoticeTitle = 'ใบรับแจ้งจัดตั้งสถานที่จำหน่ายอาหาร';
  let applicationTitle = 'แบบคำขอแจ้ง\nจัดตั้งสถานที่จำหน่ายอาหาร\n(มีพื้นที่ไม่เกิน ๒๐๐ ตารางเมตร)';
  let displayCode = 'แบบ นจ. ๓ (จำหน่ายอาหาร)';
  let tempNoticeCode = 'แบบ นจ. ๒ (จำหน่ายอาหาร)';
  let applicationCode = 'แบบ นจ. ๑ (จำหน่ายอาหาร)';

  if (isHazardous) {
    formTitle = 'ใบอนุญาต\nประกอบกิจการที่เป็นอันตรายต่อสุขภาพ';
    displayCode = 'แบบ อภ.๒';
    tempNoticeTitle = 'ใบรับคำขอรับใบอนุญาต\nประกอบกิจการที่เป็นอันตรายต่อสุขภาพ';
    tempNoticeCode = 'แบบ อภ.๑ (ใบรับคำขอ)';
    applicationTitle = 'คำขอรับใบอนุญาต/ต่ออายุใบอนุญาต\nประกอบกิจการที่เป็นอันตรายต่อสุขภาพ';
    applicationCode = 'แบบ อภ.๑';
  } else if (isFoodLicense) {
    formTitle = 'ใบอนุญาตจัดตั้งสถานที่จำหน่ายอาหารหรือสถานที่สะสมอาหาร';
    displayCode = 'แบบ บทอ.';
    tempNoticeTitle = 'ใบรับคำขอรับใบอนุญาตจัดตั้งสถานที่จำหน่ายอาหารหรือสถานที่สะสมอาหาร';
    tempNoticeCode = 'แบบ บทอ. ๑ (ใบรับ)';
    applicationTitle = 'คำขอรับใบอนุญาตจัดตั้งสถานที่จำหน่ายอาหารหรือสถานที่สะสมอาหาร';
    applicationCode = 'แบบ บทอ. ๑';
  } else if (isMarket) {
    formTitle = 'ใบอนุญาตจัดตั้งตลาด';
    displayCode = 'แบบ อส.';
    tempNoticeTitle = 'ใบรับคำขอรับใบอนุญาตจัดตั้งตลาด';
    tempNoticeCode = 'แบบ อส. ๑ (ใบรับ)';
    applicationTitle = 'คำขอรับใบอนุญาตจัดตั้งตลาด';
    applicationCode = 'แบบ อส. ๑';
  } else if (isPublicSale) {
    formTitle = 'ใบอนุญาตจำหน่ายสินค้าในที่หรือทางสาธารณะ';
    displayCode = 'แบบ นส.';
    tempNoticeTitle = 'ใบรับคำขอรับใบอนุญาตจำหน่ายสินค้าในที่หรือทางสาธารณะ';
    tempNoticeCode = 'แบบ นส. ๑ (ใบรับ)';
    applicationTitle = 'คำขอรับใบอนุญาตจำหน่ายสินค้าในที่หรือทางสาธารณะ';
    applicationCode = 'แบบ นส. ๑';
  } else if (isWaste) {
    formTitle = 'ใบอนุญาตรับทำการเก็บ ขน หรือกำจัดสิ่งปฏิกูลหรือมูลฝอย';
    displayCode = 'แบบ ปป.';
    tempNoticeTitle = 'ใบรับคำขอรับใบอนุญาตเก็บ ขน หรือกำจัดสิ่งปฏิกูลหรือมูลฝอย';
    tempNoticeCode = 'แบบ ปป. ๑ (ใบรับ)';
    applicationTitle = 'คำขอรับใบอนุญาตรับทำการเก็บ ขน หรือกำจัดสิ่งปฏิกูลหรือมูลฝอย';
    applicationCode = 'แบบ ปป. ๑';
  } else if (isStorage) {
    formTitle = 'หนังสือรับรองการแจ้ง\nจัดตั้งสถานที่สะสมอาหาร';
    displayCode = 'แบบ นจ. ๓ (สะสมอาหาร)';
    tempNoticeTitle = 'ใบรับแจ้งจัดตั้งสถานที่สะสมอาหาร';
    tempNoticeCode = 'แบบ นจ. ๒ (สะสมอาหาร)';
    applicationTitle = 'แบบคำขอแจ้ง\nจัดตั้งสถานที่สะสมอาหาร\n(มีพื้นที่ไม่เกิน ๒๐๐ ตารางเมตร)';
    applicationCode = 'แบบ นจ. ๑ (สะสมอาหาร)';
  }

  const handlePrint = () => {
    window.print();
  };

  const filteredReportList = useMemo(() => {
    return allList.filter((e) => {
      if (reportCategoryFilter !== 'all' && e.category !== reportCategoryFilter) return false;
      if (reportStatusFilter !== 'all' && e.status !== reportStatusFilter) return false;
      return true;
    });
  }, [allList, reportCategoryFilter, reportStatusFilter]);

  const totalPassed = filteredReportList.filter((e) => (e.inspectionScore ?? 0) >= 80).length;
  const totalFees = filteredReportList.reduce((acc, curr) => acc + (curr.feeAmount || 0), 0);

  return (
    <div className="flex flex-col h-full bg-transparent text-slate-800">
      <style>{`
        @media print {
          @page {
            size: ${printViewMode === 'cleanfood' || printViewMode === 'register_report' ? 'landscape' : 'portrait'};
            margin: 8mm;
          }
        }
      `}</style>

      {/* Top Action Bar (Hidden when printing) */}
      <div className="gov-card mb-3.5 px-4 py-3 bg-slate-900/90 text-white border border-white/10 shrink-0 print:hidden shadow-md gap-3 rounded-2xl backdrop-blur-xl flex flex-wrap items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center font-bold text-white shadow-xs">
            🖨️
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm leading-tight flex items-center gap-2">
              <span>ศูนย์การพิมพ์และออกเอกสารสาธารณสุข</span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                {printViewMode === 'garuda'
                  ? displayCode
                  : printViewMode === 'temp_notice'
                  ? tempNoticeCode
                  : printViewMode === 'replacement_cert'
                  ? `${displayCode} (ใบแทน)`
                  : printViewMode === 'application'
                  ? applicationCode
                  : printViewMode === 'register_report'
                  ? 'ทะเบียนคุมรายการ (ทุกแห่ง)'
                  : printViewMode === 'cleanfood'
                  ? 'Clean Food Good Taste'
                  : printViewMode === 'receipt'
                  ? 'ใบเสร็จรับเงิน อปท.'
                  : printViewMode === 'food_card'
                  ? 'บัตรผู้สัมผัสอาหาร'
                  : 'หนังสือแจ้งเตือนต่ออายุ'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {printViewMode === 'garuda' && (isHazardous ? 'ใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ ฉบับจริงพร้อม Dual QR Code (A4 แนวตั้ง)' : 'หนังสือรับรองการแจ้งตราครุฑ ฉบับจริงพร้อม Dual QR Code (A4 แนวตั้ง)')}
              {printViewMode === 'temp_notice' && (isHazardous ? 'ใบรับคำขอรับใบอนุญาต (แบบ อภ.๑) ออกให้ในวันเดียวกันเพื่อเป็นหลักฐานชั่วคราว (A4 แนวตั้ง)' : 'ใบรับแจ้งจัดตั้งฯ ออกให้ในวันเดียวกันเพื่อเป็นหลักฐานชั่วคราว (A4 แนวตั้ง)')}
              {printViewMode === 'replacement_cert' && (isHazardous ? 'ใบแทนใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ กรณีสูญหาย/ชำรุด (A4 แนวตั้ง)' : 'ใบแทนหนังสือรับรองการแจ้ง กรณีสูญหาย/ชำรุด (A4 แนวตั้ง)')}
              {printViewMode === 'application' && (isHazardous ? 'แบบคำขอรับใบอนุญาต/ต่ออายุใบอนุญาต (แบบ อภ.๑) (A4 แนวตั้ง)' : 'แบบคำขอแจ้งจัดตั้งสถานที่จำหน่าย/สะสมอาหาร พื้นที่ ≤ 200 ตร.ม. (A4 แนวตั้ง)')}
              {printViewMode === 'register_report' && 'รายงานทะเบียนคุมรายการสถานประกอบการทั้งหมด (A4 แนวนอน)'}
              {printViewMode === 'cleanfood' && 'ป้ายรับรองมาตรฐานสุขาภิบาลอาหาร กรมอนามัย (A4 แนวนอน)'}
              {printViewMode === 'receipt' && 'ใบเสร็จรับเงินค่าธรรมเนียมราชการ (A4 แนวตั้ง ๒ ตอน: ต้นฉบับ/สำเนา)'}
              {printViewMode === 'food_card' && 'บัตรประจำตัวผู้สัมผัสอาหารตามกฎกระทรวง (ขนาดมาตรฐาน CR80 หน้า-หลัง)'}
              {printViewMode === 'renewal_notice' && 'หนังสือราชการตราครุฑ แจ้งเตือนต่ออายุและชำระค่าธรรมเนียม (A4 แนวตั้ง)'}
            </div>
          </div>
        </div>

        {/* Center: Document Mode Switchers */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 gap-1 overflow-x-auto max-w-3xl">
          <button
            type="button"
            onClick={() => setPrintViewMode('garuda')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              printViewMode === 'garuda' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>๑. {isHazardous ? 'ใบอนุญาตตัวจริง (อภ.๒)' : isFoodLicense ? 'ใบอนุญาตตัวจริง (บทอ.)' : 'หนังสือรับรองตัวจริง'}</span>
          </button>

          <button
            type="button"
            onClick={() => setPrintViewMode('temp_notice')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              printViewMode === 'temp_notice' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 text-cyan-200" />
            <span>๒. {isHazardous ? 'ใบรับคำขอ (Day-1)' : 'ใบรับแจ้งชั่วคราว (Day-1)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setPrintViewMode('replacement_cert')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              printViewMode === 'replacement_cert' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-rose-200" />
            <span>๓. {isHazardous ? 'ใบแทนใบอนุญาต (อภ.๒)' : 'ใบแทนหนังสือรับรอง'}</span>
          </button>

          <button
            type="button"
            onClick={() => setPrintViewMode('application')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              printViewMode === 'application' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>๔. {isHazardous ? 'แบบคำขอ (อภ.๑)' : 'แบบคำขอแจ้ง (นจ.๑)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setPrintViewMode('receipt')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              printViewMode === 'receipt' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-indigo-300" />
            <span>๕. ใบเสร็จค่าธรรมเนียม</span>
          </button>

          <button
            type="button"
            onClick={() => setPrintViewMode('register_report')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              printViewMode === 'register_report' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TableProperties className="w-3.5 h-3.5" />
            <span>๖. ทะเบียนคุม A4</span>
          </button>

          <button
            type="button"
            onClick={() => setPrintViewMode('cleanfood')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              printViewMode === 'cleanfood' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-200" />
            <span>๗. ป้าย Clean Food</span>
          </button>

          <button
            type="button"
            onClick={() => setPrintViewMode('food_card')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              printViewMode === 'food_card' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Contact className="w-3.5 h-3.5 text-purple-200" />
            <span>๘. บัตรผู้สัมผัส</span>
          </button>

          <button
            type="button"
            onClick={() => setPrintViewMode('renewal_notice')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              printViewMode === 'renewal_notice' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BellRing className="w-3.5 h-3.5 text-rose-200" />
            <span>๙. เตือนต่ออายุ</span>
          </button>

          <button
            type="button"
            onClick={() => setPrintViewMode('field_pack')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              printViewMode === 'field_pack' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 text-amber-200" />
            <span>๑๐. ชุดลงพื้นที่ (Field Kit)</span>
          </button>
        </div>

        {/* Right: Quick Establishment Switcher / Filters + Print Trigger */}
        <div className="flex items-center gap-2">
          {printViewMode === 'register_report' && (
            <div className="flex items-center gap-1.5">
              <select
                value={reportCategoryFilter}
                onChange={(e) => setReportCategoryFilter(e.target.value)}
                className="bg-slate-800 text-white border border-slate-700 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[170px] truncate"
                title="กรองประเภทกิจการในรายงาน"
              >
                <option value="all">ทุกประเภทกิจการ ({allList.length})</option>
                <option value="food_notice">นจ. (อาหาร ≤ ๒๐๐ ตร.ม.)</option>
                <option value="food_license">บทอ. (อาหาร &gt; ๒๐๐ ตร.ม.)</option>
                <option value="hazardous">บทส. (อันตรายต่อสุขภาพ)</option>
                <option value="market">อส. (ตลาดสด/นัด)</option>
                <option value="public_sale">นส. (ขายที่สาธารณะ)</option>
                <option value="waste_sewage">ปป. (สิ่งปฏิกูล)</option>
              </select>
              <select
                value={reportStatusFilter}
                onChange={(e) => setReportStatusFilter(e.target.value)}
                className="bg-slate-800 text-white border border-slate-700 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[130px] truncate"
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
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-600/80 hover:border-emerald-500/80 rounded-xl px-2.5 py-1.5 transition-all shadow-xs">
              <span className="text-emerald-400 font-bold flex items-center gap-1 text-xs shrink-0">
                <span className="text-sm">🏪</span>
                <span className="hidden xl:inline text-slate-300 font-medium">ร้าน:</span>
              </span>
              <select
                value={selectedEstId}
                onChange={(e) => setSelectedEstId(e.target.value)}
                className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer max-w-[190px] sm:max-w-[260px] truncate"
                title="เลือกร้านค้าที่ต้องการพิมพ์เอกสาร"
              >
                {allList.map((est) => (
                  <option key={est.id} value={est.id} className="bg-slate-900 text-white py-1">
                    {est.businessName} ({est.regNumber || est.regType})
                  </option>
                ))}
              </select>
              {allList.length > 1 ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold shrink-0 border border-emerald-500/30">
                  {allList.length} ร้าน
                </span>
              ) : (
                <span className="text-[10px] bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded font-mono shrink-0">
                  ๑ ร้าน
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all text-xs cursor-pointer active:scale-95 whitespace-nowrap"
            title="กดเพื่อสั่งพิมพ์ออกเครื่องพิมพ์ A4 หรือบันทึก PDF"
          >
            <Printer className="w-4 h-4" />
            <span>สั่งพิมพ์เอกสาร (Print / PDF)</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              title="ปิดหน้าพรีวิว"
            >
              <X className="w-5 h-5" />
            </button>
          )}
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
