import React, { useState, useEffect } from 'react';
import type {
  Establishment,
  OfficialFormCode,
  EstablishmentCategory,
  RegimeType,
  EstablishmentStatus
} from '../../types/publicHealth';
import { OFFICIAL_VILLAGES } from '../../types/publicHealth';
import { showWarningAlert, showSuccessAlert } from '../../utils/sweetAlert';
import {
  Save,
  Printer,
  FileText,
  ClipboardCheck,
  ArrowLeft,
  CheckCircle2,
  Building2,
  User,
  MapPin,
  Coins,
  ShieldCheck,
  CheckSquare,
  RotateCcw
} from 'lucide-react';

interface OfficialApplicationFormProps {
  mode: OfficialFormCode | string;
  establishment: Establishment | null;
  onSave: (data: Partial<Establishment>) => void;
  onCancel: () => void;
  onInspect?: (est: Establishment) => void;
  onPrint?: (est: Establishment, mode?: string, docMode?: 'garuda' | 'application' | 'register_report' | 'cleanfood') => void;
}

const VILLAGES = OFFICIAL_VILLAGES;

export const OfficialApplicationForm: React.FC<OfficialApplicationFormProps> = ({
  mode,
  establishment,
  onSave,
  onCancel,
  onInspect,
  onPrint
}) => {
  // Form State
  const [currentFormCode, setCurrentFormCode] = useState<string>(mode || 'นจ.1');
  const [applicantType, setApplicantType] = useState<'individual' | 'juristic'>('individual');
  const [citizenId, setCitizenId] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<EstablishmentCategory>('food_notice');
  const [village, setVillage] = useState(VILLAGES[0]);
  const [address, setAddress] = useState('');
  const [areaSqm, setAreaSqm] = useState(120);
  const [workerCount, setWorkerCount] = useState(3);
  const [machineHorsepower, setMachineHorsepower] = useState<number | undefined>(undefined);
  const [foodHandlerCertNo, setFoodHandlerCertNo] = useState('');
  const [isCertVerified, setIsCertVerified] = useState(false);
  const [lat, setLat] = useState(19.932835);
  const [lng, setLng] = useState(99.171913);
  const [feeAmount, setFeeAmount] = useState(1000);
  const [status, setStatus] = useState<EstablishmentStatus>('pending_inspection');
  const [conditions, setConditions] = useState<string>('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Document checklist
  const [docIdCard, setDocIdCard] = useState(true);
  const [docHouseReg, setDocHouseReg] = useState(true);
  const [docLeaseAgreement, setDocLeaseAgreement] = useState(true);
  const [docSitePlan, setDocSitePlan] = useState(true);
  const [docMedicalCert, setDocMedicalCert] = useState(false);

  // Food place specific fields matching official government forms
  const [foodPlaceType, setFoodPlaceType] = useState<'selling' | 'storage' | 'both'>('selling');
  const [foodTypeDetail, setFoodTypeDetail] = useState('');
  const [premiseCharacteristics, setPremiseCharacteristics] = useState('');
  const [distributionMethod, setDistributionMethod] = useState('');
  const [operatingHours, setOperatingHours] = useState('๐๗:๐๐ - ๑๙:๐๐ น.');
  const [lineId, setLineId] = useState('');
  const [fax, setFax] = useState('');
  const [receiptBookNo, setReceiptBookNo] = useState('๐๑');
  const [receiptNo, setReceiptNo] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  const [nextFeeDueDate, setNextFeeDueDate] = useState('');
  const [isReplacementCert, setIsReplacementCert] = useState(false);
  const [replacementReason, setReplacementReason] = useState('lost');
  const [replacementRequestDate, setReplacementRequestDate] = useState('');
  const [applicationSubmissionDate, setApplicationSubmissionDate] = useState('');

  // Initialize or populate data
  useEffect(() => {
    if (establishment) {
      setCurrentFormCode(establishment.regType);
      setApplicantType(establishment.applicantType || 'individual');
      setCitizenId(establishment.citizenId);
      setOwnerName(establishment.ownerName);
      setPhone(establishment.phone);
      setEmail(establishment.email || '');
      setBusinessName(establishment.businessName);
      setCategory(establishment.category);
      setVillage(establishment.village);
      setAddress(establishment.address);
      setAreaSqm(establishment.areaSqm);
      setWorkerCount(establishment.workerCount);
      setMachineHorsepower(establishment.machineHorsepower);
      setFoodHandlerCertNo(establishment.foodHandlerCertNo || '');
      setIsCertVerified(Boolean(establishment.foodHandlerCertNo));
      setLat(establishment.lat);
      setLng(establishment.lng);
      setFeeAmount(establishment.feeAmount);
      setStatus(establishment.status);
      setConditions(establishment.conditions?.join('\n') || '');

      setFoodPlaceType(establishment.foodPlaceType || (establishment.categoryName?.includes('สะสมอาหาร') ? 'storage' : 'selling'));
      setFoodTypeDetail(establishment.foodTypeDetail || (establishment.categoryName?.includes('สะสมอาหาร') ? 'อาหารสด และอาหารแห้ง' : 'อาหารปรุงสำเร็จ และเครื่องดื่ม'));
      setPremiseCharacteristics(establishment.premiseCharacteristics || (establishment.categoryName?.includes('สะสมอาหาร') ? 'อยู่ในอาคารโกดังคอนกรีต' : 'อยู่ในอาคารพาณิชย์'));
      setDistributionMethod(establishment.distributionMethod || (establishment.categoryName?.includes('สะสมอาหาร') ? 'จำหน่ายส่งและมีบริการจัดส่ง' : 'มีโต๊ะเก้าอี้ไว้ให้บริการและซื้อกลับบ้าน'));
      setOperatingHours(establishment.operatingHours || '๐๗:๐๐ - ๑๙:๐๐ น.');
      setLineId(establishment.lineId || '@pnr-food');
      setFax(establishment.fax || '');
      setReceiptBookNo(establishment.receiptBookNo || establishment.bookNo || '๐๑');
      setReceiptNo(establishment.receiptNo || establishment.docNo || '๐๐๔๕');
      setReceiptDate(establishment.receiptDate || establishment.issueDate);
      setNextFeeDueDate(establishment.nextFeeDueDate || establishment.expireDate);
      setIsReplacementCert(Boolean(establishment.isReplacementCert));
      setReplacementReason(establishment.replacementReason || 'lost');
      setReplacementRequestDate(establishment.replacementRequestDate || '');
      setApplicationSubmissionDate(establishment.applicationSubmissionDate || establishment.issueDate);
    } else {
      // New Application Defaults
      setCurrentFormCode(mode || 'นจ.1');
      setApplicantType('individual');
      setCitizenId('3500900' + Math.floor(100000 + Math.random() * 900000));
      setOwnerName('');
      setPhone('081-');
      setEmail('');
      setBusinessName('');
      setVillage(VILLAGES[0]);
      setAddress('ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่');
      setAreaSqm(100);
      setWorkerCount(2);
      setFoodHandlerCertNo('FH-67-PNR-' + Math.floor(1000 + Math.random() * 9000));
      setIsCertVerified(false);
      setLat(19.932835 + (Math.random() - 0.5) * 0.008);
      setLng(99.171913 + (Math.random() - 0.5) * 0.008);
      setStatus('pending_inspection');
      setConditions(
        '๑. ต้องรักษาความสะอาดของภาชนะใส่อาหารและจัดให้มีที่ล้างมือสำหรับลูกค้า\n๒. ผู้สัมผัสอาหารต้องสวมหมวกคลุมผมและผ้ากันเปื้อนตลอดเวลาปรุงอาหาร\n๓. จัดให้มีถังขยะแบบมีฝาปิดมิดชิดและคัดแยกขยะเศษอาหาร'
      );
      setFoodPlaceType(mode?.includes('สะสม') ? 'storage' : 'selling');
      setFoodTypeDetail('อาหารปรุงสำเร็จ และเครื่องดื่ม');
      setPremiseCharacteristics('อยู่ในอาคารพาณิชย์');
      setDistributionMethod('มีโต๊ะเก้าอี้ไว้ให้บริการและซื้อกลับบ้าน');
      setOperatingHours('๐๗:๐๐ - ๑๙:๐๐ น.');
      setLineId('@pnr-food');
      setFax('');
      setReceiptBookNo('๐๑');
      setReceiptNo('๐๐' + Math.floor(10 + Math.random() * 90));
      setReceiptDate(new Date().toISOString().split('T')[0]);
      setNextFeeDueDate(new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0]);
      setIsReplacementCert(false);
      setReplacementReason('lost');
      setReplacementRequestDate('');
      setApplicationSubmissionDate(new Date().toISOString().split('T')[0]);
    }
    setSaveSuccessNotice(false);
  }, [establishment, mode]);

  // Helper to calculate standard fee according to Pong Nam Ron municipal ordinance
  const getStandardFee = (code: string, area: number, hp?: number): number => {
    if (code.startsWith('นจ')) {
      return area > 100 ? 1000 : 500;
    } else if (code.startsWith('บทอ')) {
      return 3000;
    } else if (code.startsWith('บทส')) {
      return hp && hp > 50 ? 3000 : 2000;
    } else if (code.startsWith('อส')) {
      return 5000;
    } else if (code.startsWith('นส')) {
      return 300;
    } else if (code.startsWith('ปป')) {
      return 4000;
    }
    return 1000;
  };

  const handleRecalculateStandardFee = () => {
    const std = getStandardFee(currentFormCode, Number(areaSqm), Number(machineHorsepower));
    setFeeAmount(std);
  };

  // Sync category when currentFormCode changes
  useEffect(() => {
    if (currentFormCode.startsWith('นจ')) {
      setCategory('food_notice');
    } else if (currentFormCode.startsWith('บทอ')) {
      setCategory('food_license');
    } else if (currentFormCode.startsWith('บทส')) {
      setCategory('hazardous');
    } else if (currentFormCode.startsWith('อส')) {
      setCategory('market');
    } else if (currentFormCode.startsWith('นส')) {
      setCategory('public_sale');
    } else if (currentFormCode.startsWith('ปป')) {
      setCategory('waste_sewage');
    }
  }, [currentFormCode]);

  const handleVerifyFoodCert = () => {
    setIsCertVerified(true);
  };

  const handleSave = () => {
    if (!businessName || !ownerName || !citizenId) {
      showWarningAlert(
        'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน',
        'ต้องระบุชื่อสถานประกอบการ, ผู้ขอรับใบอนุญาต และเลขบัตรประชาชน ๑๓ หลัก'
      );
      return;
    }

    const regTypeMatch: RegimeType = currentFormCode.startsWith('บทส')
      ? 'บทส'
      : currentFormCode.startsWith('บทอ')
      ? 'บทอ'
      : currentFormCode.startsWith('อส')
      ? 'อส'
      : currentFormCode.startsWith('นส')
      ? 'นส'
      : currentFormCode.startsWith('ปป')
      ? 'ปป'
      : 'นจ';

    const conditionsArray = conditions
      .split('\n')
      .map((c) => c.trim())
      .filter(Boolean);

    const formData: Partial<Establishment> = {
      regType: regTypeMatch,
      applicantType,
      citizenId,
      ownerName,
      phone,
      email,
      businessName,
      category,
      village,
      address,
      areaSqm: Number(areaSqm),
      workerCount: Number(workerCount),
      machineHorsepower: machineHorsepower ? Number(machineHorsepower) : undefined,
      foodHandlerCertNo,
      lat: Number(lat),
      lng: Number(lng),
      feeAmount: Number(feeAmount),
      status,
      conditions: conditionsArray,
      foodPlaceType,
      foodTypeDetail,
      premiseCharacteristics,
      distributionMethod,
      operatingHours,
      lineId,
      fax,
      receiptBookNo,
      receiptNo,
      receiptDate,
      nextFeeDueDate,
      isReplacementCert,
      replacementReason,
      replacementRequestDate,
      applicationSubmissionDate
    };

    onSave(formData);
    setSaveSuccessNotice(true);
    showSuccessAlert(
      'บันทึกข้อมูลคำขอสำเร็จ!',
      'ข้อมูลสถานประกอบการและสารบรรณได้รับการบันทึกเข้าสู่ระบบเรียบร้อยแล้ว'
    );
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-100 flex flex-col font-sans">
      {/* 1. TOP HEADER & BREADCRUMB BAR */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 shadow-2xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="กลับหน้าตารางสารบรรณ"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับสู่ทะเบียนคุม</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">📝</span>
                <h1 className="text-base font-bold text-slate-900">
                  {establishment
                    ? `แก้ไขแฟ้มข้อมูลคำขอ — ${establishment.businessName} (${establishment.regNumber})`
                    : 'บันทึกรับคำขอใหม่และลงทะเบียนสารบรรณ (งานสาธารณสุขและสิ่งแวดล้อม)'}
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                องค์การบริหารส่วนตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่ — พ.ร.บ. การสาธารณสุข พ.ศ. ๒๕๓๕
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>💾 บันทึกข้อมูลคำขอเข้าระบบ</span>
            </button>

            {establishment && onPrint && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onPrint(establishment, currentFormCode, 'application')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="พิมพ์แบบคำขอพร้อมรายการเอกสารหลักฐานที่ต้องแนบ"
                >
                  <FileText className="w-4 h-4 text-blue-700" />
                  <span>พิมพ์แบบคำขอ & เอกสาร</span>
                </button>
                <button
                  type="button"
                  onClick={() => onPrint(establishment, currentFormCode, 'garuda')}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="พิมพ์ใบอนุญาต/หนังสือรับรองตราครุฑ (A4)"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์ใบอนุญาต (A4)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Save success banner */}
        {saveSuccessNotice && (
          <div className="max-w-6xl mx-auto mt-3 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>บันทึกข้อมูลสำเร็จ!</strong> ระบบได้บันทึกแฟ้มข้อมูลคำขอเข้าสู่ระบบสารบรรณ อบต.โป่งน้ำร้อน
                เรียบร้อยแล้ว
              </span>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 text-[11px]"
            >
              ไปยังหน้าตารางสารบรรณ →
            </button>
          </div>
        )}
      </div>

      {/* 2. MAIN FORM BODY (SPACIOUS FULL-WIDTH GRID) */}
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* Form Selector Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-full overflow-hidden border-2 border-amber-400 bg-white p-0.5 shadow-md shrink-0 flex items-center justify-center">
                <img
                  src="/pnr_logo.png"
                  alt="ตราสัญลักษณ์ อบต.โป่งน้ำร้อน"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="text-xs text-blue-200 font-mono">
                  {establishment?.regNumber || 'คำขอใหม่ประจำปีงบประมาณ ๒๕๖๗'}
                </div>
                <div className="text-base font-bold text-white tracking-tight">
                  แบบฟอร์มคำขอและหนังสือรับรองราชการ
                </div>
                <div className="text-xs text-blue-200 mt-0.5">
                  เลือกแบบฟอร์มที่ต้องการบันทึกเพื่อปรับข้อกำหนดและอัตราค่าธรรมเนียมอัตโนมัติ
                </div>
              </div>
            </div>

            {/* Form Code Picker */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-blue-200 font-semibold whitespace-nowrap">
                ประเภทแบบคำขอ:
              </label>
              <select
                value={currentFormCode}
                onChange={(e) => setCurrentFormCode(e.target.value)}
                className="bg-white text-slate-900 text-xs font-bold px-3 py-2 rounded-xl border border-blue-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="นจ.1">แบบ นจ.๑ — สถานที่จำหน่ายอาหาร (ไม่เกิน ๒๐๐ ตร.ม.)</option>
                <option value="บทอ.1">แบบ บทอ.๑ — สถานที่จำหน่ายอาหาร (เกิน ๒๐๐ ตร.ม.)</option>
                <option value="บทส.1">แบบ บทส.๑ — กิจการอันตรายต่อสุขภาพ (๑๔๐+ ประเภท)</option>
                <option value="อส.1">แบบ อส.๑ — จัดตั้งตลาดประเภท ๑ และ ๒ (ตลาดนัด)</option>
                <option value="นส.1">แบบ นส.๑ — จำหน่ายสินค้าในที่หรือทางสาธารณะ</option>
                <option value="ปป.1">แบบ ปป.๑ — การรับทำการกำจัดสิ่งปฏิกูลหรือมูลฝอย</option>
                <option value="บทส.2">แบบ บทส.๒ — คำขอต่ออายุใบอนุญาตกิจการอันตราย</option>
                <option value="บทอ.2">แบบ บทอ.๒ — คำขอต่ออายุใบอนุญาตจัดตั้งสถานที่อาหาร</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* CARD 1: ข้อมูลผู้ยื่นคำขอ */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <User className="w-4 h-4 text-blue-700" />
                  <span>๑. ข้อมูลผู้ขอรับใบอนุญาต / ผู้ยื่นคำขอ</span>
                </div>
                {/* Applicant Type Toggle */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setApplicantType('individual')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      applicantType === 'individual'
                        ? 'bg-blue-700 text-white font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    บุคคลธรรมดา
                  </button>
                  <button
                    type="button"
                    onClick={() => setApplicantType('juristic')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      applicantType === 'juristic'
                        ? 'bg-blue-700 text-white font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    นิติบุคคล
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    เลขประจำตัวประชาชน / เลขทะเบียนนิติบุคคล (๑๓ หลัก) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={citizenId}
                    onChange={(e) => setCitizenId(e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={13}
                    placeholder="เช่น 3500900123456"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {applicantType === 'individual' ? 'ชื่อ-นามสกุล ผู้ขอรับใบอนุญาต' : 'ชื่อนิติบุคคล / ห้างหุ้นส่วนจำกัด'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder={applicantType === 'individual' ? 'เช่น นายสมชาย คำหล้า' : 'เช่น บริษัท โป่งน้ำร้อนการเกษตร จำกัด'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      หมายเลขโทรศัพท์ติดต่อ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="เช่น 081-456-7890"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      อีเมล (ถ้ามี)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="เช่น owner@pongnamron.go.th"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* วุฒิบัตรผู้สัมผัสอาหาร (ตามเกณฑ์ สธ.) */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                      <span>เลขที่วุฒิบัตรผู้ผ่านการอบรมผู้สัมผัสอาหาร (กรมอนามัย)</span>
                    </label>
                    {isCertVerified ? (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                        ✓ ยืนยันแล้ว
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        รอตรวจสอบ
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={foodHandlerCertNo}
                      onChange={(e) => {
                        setFoodHandlerCertNo(e.target.value);
                        setIsCertVerified(false);
                      }}
                      placeholder="เช่น FH-67-PNR-0089"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyFoodCert}
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-xl font-bold text-xs cursor-pointer whitespace-nowrap"
                    >
                      ตรวจสอบวุฒิบัตร
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: ข้อมูลสถานที่ประกอบการ */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <span>๒. ข้อมูลสถานประกอบการและที่ตั้งในตำบลโป่งน้ำร้อน</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  อ.ฝาง จ.เชียงใหม่
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ชื่อสถานที่ประกอบการ / ป้ายชื่อร้านค้า <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="เช่น ร้านลาบป่าโป่งน้ำร้อน & อาหารพื้นเมือง"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      หมู่บ้านในตำบลโป่งน้ำร้อน <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      {VILLAGES.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      พื้นที่ประกอบการ (ตารางเมตร) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={areaSqm}
                      onChange={(e) => setAreaSqm(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* หมวดหมู่ตาม พ.ร.บ. สาธารณสุข พ.ศ. ๒๕๓๕ หมวด ๘ */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="block text-slate-700 font-semibold mb-2">
                    หมวดหมู่สถานที่ตาม พ.ร.บ. การสาธารณสุข (ม.๓๘)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFoodPlaceType('selling')}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        foodPlaceType === 'selling'
                          ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs">
                        <span>🍽️</span>
                        <span>สถานที่จำหน่ายอาหาร</span>
                      </div>
                      <div className="text-[10.5px] text-slate-500 font-normal mt-0.5">
                        ร้านอาหาร คาเฟ่ ซุ้มเครื่องดื่ม Food Truck
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFoodPlaceType('storage')}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        foodPlaceType === 'storage'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs">
                        <span>📦</span>
                        <span>สถานที่สะสมอาหาร</span>
                      </div>
                      <div className="text-[10.5px] text-slate-500 font-normal mt-0.5">
                        โกดัง คลังสินค้า ห้องเย็น สถานที่เก็บอาหาร
                      </div>
                    </button>
                  </div>
                </div>

                {/* รายละเอียดประกอบกิจการตามกฎกระทรวง */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      {foodPlaceType === 'storage' ? 'ประเภทของอาหารที่สะสมเพื่อจำหน่าย' : 'ประเภทของอาหารที่จำหน่าย'}
                    </label>
                    <input
                      type="text"
                      value={foodTypeDetail}
                      onChange={(e) => setFoodTypeDetail(e.target.value)}
                      placeholder={foodPlaceType === 'storage' ? 'เช่น อาหารสด, อาหารแห้ง, พืชผลการเกษตร' : 'เช่น อาหารปรุงสำเร็จ, เครื่องดื่ม'}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      ลักษณะของสถานที่ประกอบกิจการ
                    </label>
                    <input
                      type="text"
                      value={premiseCharacteristics}
                      onChange={(e) => setPremiseCharacteristics(e.target.value)}
                      placeholder={foodPlaceType === 'storage' ? 'เช่น อยู่ในอาคาร, ซุ้ม/แผง' : 'เช่น อยู่ในอาคาร, บนยานพาหนะ (Food truck)'}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      วิธีการจำหน่าย
                    </label>
                    <input
                      type="text"
                      value={distributionMethod}
                      onChange={(e) => setDistributionMethod(e.target.value)}
                      placeholder={foodPlaceType === 'storage' ? 'เช่น มีบริการจัดส่งถึงบ้าน, ค้าส่ง' : 'เช่น มีโต๊ะเก้าอี้ไว้ให้บริการ, ซื้อกลับบ้าน'}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      ช่วงเวลาที่จำหน่าย
                    </label>
                    <input
                      type="text"
                      value={operatingHours}
                      onChange={(e) => setOperatingHours(e.target.value)}
                      placeholder="เช่น ๐๗:๐๐ - ๑๙:๐๐ น."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      LINE ID ติดต่อ
                    </label>
                    <input
                      type="text"
                      value={lineId}
                      onChange={(e) => setLineId(e.target.value)}
                      placeholder="เช่น @pnr-food หรือ pnr_store"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      หมายเลขโทรสาร (Fax)
                    </label>
                    <input
                      type="text"
                      value={fax}
                      onChange={(e) => setFax(e.target.value)}
                      placeholder="เช่น 053-810318"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* ข้อมูลใบเสร็จรับเงินและการต่ออายุ */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mt-2">
                  <div className="font-bold text-slate-800 mb-2 flex items-center justify-between">
                    <span>ข้อมูลใบเสร็จรับเงินค่าธรรมเนียม และการต่ออายุ</span>
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-bold">ระเบียบการเงิน</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">ใบเสร็จเล่มที่</label>
                      <input
                        type="text"
                        value={receiptBookNo}
                        onChange={(e) => setReceiptBookNo(e.target.value)}
                        placeholder="๐๑"
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">ใบเสร็จเลขที่</label>
                      <input
                        type="text"
                        value={receiptNo}
                        onChange={(e) => setReceiptNo(e.target.value)}
                        placeholder="๐๐๔๕"
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">วันที่ใบเสร็จ</label>
                      <input
                        type="date"
                        value={receiptDate}
                        onChange={(e) => setReceiptDate(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">ครบกำหนดชำระปีถัดไป</label>
                      <input
                        type="date"
                        value={nextFeeDueDate}
                        onChange={(e) => setNextFeeDueDate(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* กรณีออกใบแทน */}
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 mt-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs select-none">
                      <input
                        type="checkbox"
                        checked={isReplacementCert}
                        onChange={(e) => setIsReplacementCert(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600"
                      />
                      <span>คำขอออกใบแทนหนังสือรับรอง (กรณีสูญหาย / ถูกทำลาย / ชำรุด)</span>
                    </label>
                    {isReplacementCert && (
                      <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                        โหมดใบแทน
                      </span>
                    )}
                  </div>
                  {isReplacementCert && (
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-amber-200">
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-0.5">สาเหตุการขอใบแทน</label>
                        <select
                          value={replacementReason}
                          onChange={(e) => setReplacementReason(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        >
                          <option value="lost">สูญหาย</option>
                          <option value="destroyed">ถูกทำลาย</option>
                          <option value="damaged">ชำรุดในสาระสำคัญ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-0.5">วันที่ยื่นคำขอใบแทน</label>
                        <input
                          type="date"
                          value={replacementRequestDate}
                          onChange={(e) => setReplacementRequestDate(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ที่ตั้งตามทะเบียนราษฎร์ / บ้านเลขที่ / ซอย / ถนน
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="เช่น 45/1 หมู่ที่ 1 ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      จำนวนคนงาน / ผู้ปฏิบัติงาน (คน)
                    </label>
                    <input
                      type="number"
                      value={workerCount}
                      onChange={(e) => setWorkerCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      กำลังเครื่องจักร (แรงม้า) {currentFormCode.startsWith('บทส') && <span className="text-amber-600 font-bold">(บทส.)</span>}
                    </label>
                    <input
                      type="number"
                      value={machineHorsepower ?? ''}
                      onChange={(e) => setMachineHorsepower(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="ระบุเฉพาะกิจการอันตราย"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* พิกัด GPS */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-semibold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-700" />
                      <span>พิกัดภูมิศาสตร์ตำบลโป่งน้ำร้อน (GPS Coordinates)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setLat(19.932835);
                        setLng(99.171913);
                      }}
                      className="text-[10px] text-blue-700 hover:underline font-bold"
                    >
                      ใช้พิกัดที่ทำการ อบต.
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
                      <span className="text-[10px] text-slate-400 font-mono mr-2">Lat:</span>
                      <input
                        type="number"
                        step="any"
                        value={lat}
                        onChange={(e) => setLat(Number(e.target.value))}
                        className="w-full bg-transparent font-mono text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
                      <span className="text-[10px] text-slate-400 font-mono mr-2">Lng:</span>
                      <input
                        type="number"
                        step="any"
                        value={lng}
                        onChange={(e) => setLng(Number(e.target.value))}
                        className="w-full bg-transparent font-mono text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: เอกสารหลักฐานประกอบคำขอ & สถานะ */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <CheckSquare className="w-4 h-4 text-blue-700" />
                  <span>๓. รายการตรวจสอบเอกสารหลักฐานประกอบคำขอ</span>
                </div>
                <span className="text-[11px] text-slate-500">ตามระเบียบสารบรรณ</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={docIdCard}
                    onChange={(e) => setDocIdCard(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>สำเนาบัตรประจำตัวประชาชนผู้ขอรับใบอนุญาต</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={docHouseReg}
                    onChange={(e) => setDocHouseReg(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>สำเนาทะเบียนบ้านของสถานที่ประกอบการ</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={docLeaseAgreement}
                    onChange={(e) => setDocLeaseAgreement(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>สัญญาเช่า / หนังสือยินยอมให้ใช้สถานที่</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={docSitePlan}
                    onChange={(e) => setDocSitePlan(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>แผนผังแสดงที่ตั้งและแผนผังภายในสถานประกอบการ</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={docMedicalCert}
                    onChange={(e) => setDocMedicalCert(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>ใบรับรองแพทย์ตรวจสุขภาพผู้สัมผัสอาหาร (โรคติดต่อ ๕ โรค)</span>
                </label>
              </div>

              {/* เงื่อนไขแนบท้ายใบอนุญาต */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-slate-700 font-semibold mb-1 text-xs">
                  เงื่อนไขเฉพาะการประกอบกิจการ (ระบุในใบอนุญาต)
                </label>
                <textarea
                  rows={3}
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  placeholder="ระบุข้อกำหนดสุขาภิบาล..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* CARD 4: ค่าธรรมเนียมตามข้อบัญญัติท้องถิ่น & ขั้นตอนปฏิบัติงาน */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Coins className="w-4 h-4 text-emerald-700" />
                  <span>๔. อัตราค่าธรรมเนียมและสถานะคำขอ</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300">
                  ข้อบัญญัติ อบต.โป่งน้ำร้อน
                </span>
              </div>

              {/* Fee Box - Editable */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 via-teal-50/60 to-emerald-50 border border-emerald-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-900 font-bold">
                      <Coins className="w-3.5 h-3.5 text-emerald-700" />
                      <span>อัตราค่าธรรมเนียมใบอนุญาตประจำปี</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">
                      ตามประเภท {currentFormCode} ขนาดพื้นที่ {areaSqm} ตร.ม. (แก้ไขยอดเงินได้อิสระ)
                    </div>
                  </div>

                  {/* Editable Fee Input */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={feeAmount === 0 ? '' : feeAmount}
                        placeholder="0"
                        onChange={(e) => setFeeAmount(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                        className="w-36 text-right pr-3 pl-2 py-1.5 text-xl font-bold font-mono text-emerald-950 bg-white border-2 border-emerald-400 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                        title="คลิกเพื่อพิมพ์แก้ไขยอดเงินค่าธรรมเนียม"
                      />
                    </div>
                    <span className="text-xs font-bold text-emerald-900">บาท / ปี</span>
                  </div>
                </div>

                {/* Quick adjustments & presets */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-600 text-[10px]">ทางลัดยอดเงิน:</span>
                    <button
                      type="button"
                      onClick={() => setFeeAmount(0)}
                      className="px-2 py-0.5 rounded bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      ยกเว้น (0 ฿)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeeAmount(300)}
                      className="px-2 py-0.5 rounded bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      300 ฿
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeeAmount(500)}
                      className="px-2 py-0.5 rounded bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      500 ฿
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeeAmount(1000)}
                      className="px-2 py-0.5 rounded bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      1,000 ฿
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeeAmount(2000)}
                      className="px-2 py-0.5 rounded bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      2,000 ฿
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeeAmount(3000)}
                      className="px-2 py-0.5 rounded bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      3,000 ฿
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeeAmount(5000)}
                      className="px-2 py-0.5 rounded bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      5,000 ฿
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleRecalculateStandardFee}
                    className="px-2.5 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                    title="คำนวณตามเกณฑ์ข้อบัญญัติ อบต. อัตโนมัติ"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>คำนวณเกณฑ์ อบต.</span>
                  </button>
                </div>

                <div className="mt-2 text-[10px] text-emerald-800/90 bg-emerald-100/70 border border-emerald-200 rounded px-2.5 py-1">
                  💡 <strong>เจ้าหน้าที่สามารถพิมพ์แก้ไขยอดเงินได้:</strong> กำหนดตามใบเสร็จรับเงินจริง หรือระเบียบลดหย่อน/ยกเว้นค่าธรรมเนียมของ อปท.
                </div>
              </div>

              {/* Status Picker */}
              <div className="space-y-2 text-xs">
                <label className="block text-slate-700 font-semibold">
                  กำหนดสถานะคำขอในระบบสารบรรณ:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('pending_inspection')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      status === 'pending_inspection'
                        ? 'bg-purple-50 border-purple-500 text-purple-800 ring-2 ring-purple-300'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span>รอนัดตรวจสถานที่</span>
                    </div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                      ส่งเจ้าพนักงานลงพื้นที่
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('active')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      status === 'active'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-300'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>ได้รับอนุญาตแล้ว</span>
                    </div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                      ออกใบอนุญาตตราครุฑ
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('pending_correction')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      status === 'pending_correction'
                        ? 'bg-red-50 border-red-500 text-red-800 ring-2 ring-red-300'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span>สั่งแก้ไขปรับปรุง</span>
                    </div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                      มีข้อบกพร่อง ๑๕/๓๐ วัน
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('awaiting_payment')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      status === 'awaiting_payment'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-300'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>รอชำระค่าธรรมเนียม</span>
                    </div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                      ตรวจผ่านแล้วรอใบเสร็จ
                    </div>
                  </button>
                </div>
              </div>

              {/* Action buttons inside card */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>เจ้าพนักงานสาธารณสุขผู้รับคำขอ:</span>
                <span className="font-bold text-slate-800">นายนพดล สุขเกษม (จพง.ชำนาญงาน)</span>
              </div>
            </div>
          </div>

          {/* 3. BOTTOM STICKY ACTION BAR */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <span className="text-blue-700 font-bold">ℹ️ หมายเหตุ:</span>
              <span>
                เมื่อกดบันทึก ข้อมูลจะถูกบรรจุเข้าสู่สารบรรณและแสดงในตารางคุมและแผนที่ GIS ตำบลโป่งน้ำร้อนทันที
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                ยกเลิก
              </button>

              {establishment && onInspect && (
                <button
                  type="button"
                  onClick={() => onInspect(establishment)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>🔍 ส่งตรวจสุขลักษณะ</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSave}
                className="flex-1 sm:flex-initial px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>💾 บันทึกคำขอเข้าระบบ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
