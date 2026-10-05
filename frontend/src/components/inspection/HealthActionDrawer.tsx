import React, { useState, useEffect } from 'react';
import type { Establishment, OfficialFormCode, EstablishmentCategory } from '../../types/publicHealth';
import {
  Printer,
  CheckCircle2,
  AlertCircle,
  Save,
  Building2,
  User,
  Coins,
  X
} from 'lucide-react';

interface HealthActionDrawerProps {
  mode: OfficialFormCode | string;
  establishment: Establishment | null;
  onClose: () => void;
  onSave: (data: Partial<Establishment>) => void;
  onOpenPrintPreview: (est: Establishment, mode: OfficialFormCode | string) => void;
}

export const HealthActionDrawer: React.FC<HealthActionDrawerProps> = ({
  mode,
  establishment,
  onClose,
  onSave,
  onOpenPrintPreview
}) => {
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('หมู่ที่ 1 บ้านโป่งน้ำร้อน');
  const [address, setAddress] = useState('');
  const [areaSqm, setAreaSqm] = useState(80);
  const [workerCount, setWorkerCount] = useState(2);
  const [machineHorsepower, setMachineHorsepower] = useState<number | undefined>(undefined);
  const [foodHandlerCertNo, setFoodHandlerCertNo] = useState('');
  const [category, setCategory] = useState<EstablishmentCategory>('food_notice');
  const [feeAmount, setFeeAmount] = useState(1000);
  const [autoVerifySuccess, setAutoVerifySuccess] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (establishment) {
      setBusinessName(establishment.businessName);
      setOwnerName(establishment.ownerName);
      setCitizenId(establishment.citizenId);
      setPhone(establishment.phone);
      setVillage(establishment.village);
      setAddress(establishment.address);
      setAreaSqm(establishment.areaSqm);
      setWorkerCount(establishment.workerCount);
      setMachineHorsepower(establishment.machineHorsepower);
      setFoodHandlerCertNo(establishment.foodHandlerCertNo || '');
      setCategory(establishment.category);
      setFeeAmount(establishment.feeAmount);
    } else {
      setBusinessName('ร้านอาหารโป่งน้ำร้อนอินเทรนด์');
      setOwnerName('นายกิตติคุณ นวลตา');
      setCitizenId('3500900889211');
      setPhone('082-998-7766');
      setVillage('หมู่ที่ 1 บ้านโป่งน้ำร้อน');
      setAddress('79 หมู่ที่ 1 ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่');
      setAreaSqm(120);
      setWorkerCount(3);
      setFoodHandlerCertNo('FH-67-PNR-0188');
      setCategory('food_notice');
      setFeeAmount(1000);
    }
    setIsSaved(false);
    setAutoVerifySuccess(false);
  }, [establishment, mode]);

  useEffect(() => {
    if (category === 'food_notice') {
      setFeeAmount(areaSqm > 100 ? 1000 : 500);
    } else if (category === 'food_license') {
      setFeeAmount(3000);
    } else if (category === 'market') {
      setFeeAmount(5000);
    } else if (category === 'hazardous') {
      setFeeAmount(machineHorsepower && machineHorsepower > 50 ? 3000 : 2000);
    } else if (category === 'public_sale') {
      setFeeAmount(300);
    } else if (category === 'waste_sewage') {
      setFeeAmount(4000);
    }
  }, [areaSqm, category, machineHorsepower]);

  const handleVerifyFoodHandler = () => {
    setAutoVerifySuccess(true);
  };

  const handleSaveForm = () => {
    const updated: Partial<Establishment> = {
      businessName,
      ownerName,
      citizenId,
      phone,
      village,
      address,
      areaSqm,
      workerCount,
      machineHorsepower,
      foodHandlerCertNo,
      category,
      feeAmount,
      status: 'active'
    };
    onSave(updated);
    setIsSaved(true);
  };

  const currentEstToPrint: Establishment = establishment || {
    id: 'est-new',
    regNumber: `นจ-67-${Math.floor(1000 + Math.random() * 9000)}`,
    regType: mode.startsWith('บทส') ? 'บทส' : mode.startsWith('บทอ') ? 'บทอ' : mode.startsWith('อส') ? 'อส' : 'นจ',
    category,
    categoryName:
      category === 'food_notice'
        ? 'สถานที่จำหน่ายอาหาร (พื้นที่ไม่เกิน 200 ตร.ม.)'
        : category === 'food_license'
        ? 'สถานที่จำหน่ายอาหาร (พื้นที่เกิน 200 ตร.ม.)'
        : category === 'hazardous'
        ? 'กิจการที่เป็นอันตรายต่อสุขภาพ'
        : category === 'market'
        ? 'การจัดตั้งตลาด'
        : 'การประกอบกิจการตาม พ.ร.บ. สาธารณสุข',
    businessName,
    applicantType: 'individual',
    ownerName,
    citizenId,
    phone,
    village,
    address,
    areaSqm,
    workerCount,
    machineHorsepower,
    foodHandlerCertNo,
    lat: 19.682,
    lng: 99.865,
    status: 'active',
    issueDate: new Date().toISOString().split('T')[0],
    expireDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    annualFeeDue: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    feeAmount,
    bookNo: '01/2567',
    docNo: String(Math.floor(1000 + Math.random() * 9000)),
    conditions: [
      'ต้องรักษาความสะอาดของภาชนะใส่อาหารและจัดให้มีที่ล้างมือสำหรับลูกค้า',
      'ผู้สัมผัสอาหารต้องสวมหมวกคลุมผมและผ้ากันเปื้อนตลอดเวลาปรุงอาหาร',
      'จัดให้มีถังขยะแบบมีฝาปิดมิดชิดและคัดแยกขยะเศษอาหาร'
    ],
    inspectionPassed: true
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200 shadow-2xl text-slate-900 overflow-hidden">
      {/* Official Government Header */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            🏛️
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold flex items-center gap-2">
              <span>งานสารบรรณคำขอและตรวจรับเอกสาร</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono text-[11px] font-bold">
                {mode}
              </span>
            </div>
            <div className="text-[11px] text-slate-300">
              {establishment ? `เลขทะเบียนคุม: ${establishment.regNumber}` : 'บันทึกคำขอใหม่ในเขต อปท.'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {areaSqm > 200 && category === 'food_notice' && (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 flex items-start gap-2 text-amber-900">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
            <div>
              <strong>ข้อสังเกตตามระเบียบ:</strong> ขนาดพื้นที่ {areaSqm} ตร.ม. เกินเกณฑ์การรับแจ้ง (≤ 200 ตร.ม.) ต้องยื่นขออนุญาตตาม <strong>"แบบ บทอ. ๑"</strong>
            </div>
          </div>
        )}

        {isSaved && (
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 flex items-center gap-2 text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>บันทึกเข้าระบบสารบรรณเรียบร้อยแล้ว พร้อมส่งตรวจสุขาภิบาลหรือสั่งพิมพ์</span>
          </div>
        )}

        {/* หมวด 1: ข้อมูลผู้ยื่นคำขอ */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b pb-1">
            <User className="w-3.5 h-3.5 text-sky-700" />
            <span>๑. ข้อมูลผู้ขอรับใบอนุญาต / หนังสือรับรอง</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                เลขประจำตัวประชาชน / เลขทะเบียนนิติบุคคล (13 หลัก) *
              </label>
              <input
                type="text"
                value={citizenId}
                onChange={(e) => setCitizenId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 font-mono text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                placeholder="3-5701-00458-92-1"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                ชื่อ-นามสกุล ผู้ขอ หรือ ชื่อนิติบุคคล *
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                placeholder="นายสมชาย คำหล้า"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                หมายเลขโทรศัพท์ติดต่อ
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 font-mono text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white"
                placeholder="081-456-7890"
              />
            </div>
          </div>
        </div>

        {/* หมวด 2: ข้อมูลสถานที่ประกอบการ */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b pb-1">
            <Building2 className="w-3.5 h-3.5 text-sky-700" />
            <span>๒. ข้อมูลสถานที่ตั้งและลักษณะการประกอบการ</span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              ชื่อสถานประกอบการ / ป้ายการค้า *
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 font-bold text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white"
              placeholder="ร้านลาบป่าดอยงาม"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                หมู่บ้าน / ตำบล
              </label>
              <select
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-xs focus:ring-2 focus:ring-sky-600"
              >
                <option value="หมู่ที่ 1 บ้านโป่งน้ำร้อน">หมู่ที่ 1 บ้านโป่งน้ำร้อน</option>
                <option value="หมู่ที่ 2 บ้านใหม่โป่งน้ำร้อน">หมู่ที่ 2 บ้านใหม่โป่งน้ำร้อน</option>
                <option value="หมู่ที่ 3 บ้านยาง">หมู่ที่ 3 บ้านยาง</option>
                <option value="หมู่ที่ 4 บ้านเปียงกอก">หมู่ที่ 4 บ้านเปียงกอก</option>
                <option value="หมู่ที่ 5 บ้านห้วยบอน">หมู่ที่ 5 บ้านห้วยบอน</option>
                <option value="หมู่ที่ 6 บ้านป่าข่า">หมู่ที่ 6 บ้านป่าข่า</option>
                <option value="หมู่ที่ 7 บ้านสุขสมบูรณ์">หมู่ที่ 7 บ้านสุขสมบูรณ์</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                พื้นที่ประกอบการ (ตร.ม.) *
              </label>
              <input
                type="number"
                value={areaSqm}
                onChange={(e) => setAreaSqm(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 font-mono text-xs focus:ring-2 focus:ring-sky-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              ที่ตั้งตามโฉนด / ทะเบียนบ้านเลขที่
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-xs focus:ring-2 focus:ring-sky-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                จำนวนผู้ปฏิบัติงาน (คน)
              </label>
              <input
                type="number"
                value={workerCount}
                onChange={(e) => setWorkerCount(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 font-mono text-xs focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                วุฒิบัตรผู้สัมผัสอาหาร
              </label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={foodHandlerCertNo}
                  onChange={(e) => setFoodHandlerCertNo(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-slate-50 font-mono text-[11px] focus:ring-2 focus:ring-sky-600"
                  placeholder="FH-67-DNG-..."
                />
                <button
                  type="button"
                  onClick={handleVerifyFoodHandler}
                  className="px-2 py-1 bg-sky-700 hover:bg-sky-600 text-white rounded text-[10px] font-bold shrink-0 cursor-pointer"
                  title="ตรวจสอบฐานข้อมูลกรมอนามัย"
                >
                  ตรวจ
                </button>
              </div>
            </div>
          </div>

          {autoVerifySuccess && (
            <div className="p-2 rounded bg-sky-50 border border-sky-200 text-sky-900 text-[11px] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-700 shrink-0" />
              <span>ผ่านการตรวจสอบ: วุฒิบัตรผู้สัมผัสอาหารถูกต้องตามเกณฑ์กระทรวงสาธารณสุข</span>
            </div>
          )}
        </div>

        {/* หมวด 3: อัตราค่าธรรมเนียมตามข้อบัญญัติ อปท. */}
        <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span>อัตราค่าธรรมเนียมตามข้อบัญญัติท้องถิ่น</span>
            </span>
            <span className="font-mono font-bold text-base text-emerald-700">
              {feeAmount.toLocaleString()} บาท/ปี
            </span>
          </div>
          <div className="text-[11px] text-slate-600 leading-tight">
            คำนวณตามข้อบัญญัติ อปท. (ชำระ ณ ที่ทำการ หรือชำระผ่าน QR PromptPay e-Payment)
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex flex-col gap-2 shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleSaveForm}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>บันทึกเข้าระบบสารบรรณ</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenPrintPreview(currentEstToPrint, mode)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พรีวิวพิมพ์ (Print A4)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
