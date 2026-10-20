import React, { useState, useEffect } from 'react';
import type {
  RegimeType,
  EstablishmentCategory,
  SystemSettings
} from '../../types/publicHealth';
import { OFFICIAL_VILLAGES, DEFAULT_SYSTEM_SETTINGS } from '../../types/publicHealth';
import { sanitationDataService } from '../../services/sanitationDataService';
import { showWarningAlert } from '../../utils/sweetAlert';
import { Save, Printer, Loader2, MapPin } from 'lucide-react';

const VILLAGE_COORDS: Record<string, { lat: number; lng: number }> = {
  'หมู่ที่ 1 บ้านหนองพนัง': { lat: 19.9328, lng: 99.1719 },
  'หมู่ที่ 2 บ้านดอน': { lat: 19.9255, lng: 99.1652 },
  'หมู่ที่ 3 บ้านหัวฝาย': { lat: 19.9380, lng: 99.1780 },
  'หมู่ที่ 4 บ้านท่าหัด': { lat: 19.9412, lng: 99.1620 },
  'หมู่ที่ 5 บ้านต้นผึ้ง': { lat: 19.9300, lng: 99.1750 },
  'หมู่ที่ 6 บ้านเปียงกอก': { lat: 19.9190, lng: 99.1580 },
  'หมู่ที่ 7 บ้านต้นผึ้งใต้': { lat: 19.9288, lng: 99.1685 }
};

export interface EstablishmentFormValues {
  regType: RegimeType;
  category: EstablishmentCategory;
  categoryName: string;
  docNo: string;
  targetYear: number;
  businessName: string;
  ownerName: string;
  citizenId: string;
  phone: string;
  email: string;
  houseNo: string;
  village: string;
  address: string;
  lat: number;
  lng: number;
  areaSqm: number;
  workerCount: number;
  premiseCharacteristics: string;
  feeAmount: number;
  receiptNo: string;
  applicationSubmissionDate: string;
  inspectorName: string;
  inspectorPosition: string;
}

interface EstablishmentFormProps {
  initialValues?: Partial<EstablishmentFormValues>;
  onSave: (values: EstablishmentFormValues, proceedToPrint: boolean) => Promise<void> | void;
  isSaving?: boolean;
  settings?: SystemSettings;
  onCancel?: () => void;
  submitLabel?: string;
}

export const EstablishmentForm: React.FC<EstablishmentFormProps> = ({
  initialValues,
  onSave,
  isSaving = false,
  settings,
  onCancel,
  submitLabel = 'บันทึกเข้าระบบ'
}) => {
  const currentSettings = settings || DEFAULT_SYSTEM_SETTINGS;
  const currentOfficer = sanitationDataService.getCurrentOfficer();

  const [regType, setRegType] = useState<RegimeType>(initialValues?.regType || 'บทส');
  const [category, setCategory] = useState<EstablishmentCategory>(initialValues?.category || 'hazardous');
  const [categoryName, setCategoryName] = useState<string>(
    initialValues?.categoryName || 'กิจการที่เป็นอันตรายต่อสุขภาพ'
  );
  const [docNo, setDocNo] = useState<string>(initialValues?.docNo || '');
  const [targetYear, setTargetYear] = useState<number>(initialValues?.targetYear || 2569);

  const [businessName, setBusinessName] = useState<string>(initialValues?.businessName || '');
  const [ownerName, setOwnerName] = useState<string>(initialValues?.ownerName || '');
  const [citizenId, setCitizenId] = useState<string>(initialValues?.citizenId || '');
  const [phone, setPhone] = useState<string>(initialValues?.phone || '');
  const [email, setEmail] = useState<string>(initialValues?.email || '');

  const [houseNo, setHouseNo] = useState<string>(initialValues?.houseNo || '');
  const [village, setVillage] = useState<string>(initialValues?.village || OFFICIAL_VILLAGES[0]);
  const [address, setAddress] = useState<string>(initialValues?.address || '');
  const [lat, setLat] = useState<number>(initialValues?.lat || 19.9328);
  const [lng, setLng] = useState<number>(initialValues?.lng || 99.1719);
  const [areaSqm, setAreaSqm] = useState<number>(initialValues?.areaSqm ?? 50);
  const [workerCount, setWorkerCount] = useState<number>(initialValues?.workerCount ?? 1);
  const [premiseCharacteristics, setPremiseCharacteristics] = useState<string>(
    initialValues?.premiseCharacteristics || 'อยู่ในอาคารพาณิชย์'
  );

  const [feeAmount, setFeeAmount] = useState<number>(initialValues?.feeAmount || 100);
  const [receiptNo, setReceiptNo] = useState<string>(initialValues?.receiptNo || '');
  const [applicationSubmissionDate, setApplicationSubmissionDate] = useState<string>(
    initialValues?.applicationSubmissionDate || new Date().toISOString().split('T')[0]
  );
  const [inspectorName, setInspectorName] = useState<string>(
    initialValues?.inspectorName || currentOfficer?.name || currentSettings.signatories?.officerName || 'นางสาวรุ่งทิวา อุปนันท์'
  );
  const [inspectorPosition, setInspectorPosition] = useState<string>(
    initialValues?.inspectorPosition || currentOfficer?.position || currentSettings.signatories?.officerPosition || 'นักวิชาการสาธารณสุขปฏิบัติการ'
  );

  // Sync when initialValues changes (e.g. from Auto-fill PDF extract)
  useEffect(() => {
    if (initialValues) {
      if (initialValues.regType) setRegType(initialValues.regType);
      if (initialValues.category) setCategory(initialValues.category);
      if (initialValues.categoryName !== undefined) setCategoryName(initialValues.categoryName);
      if (initialValues.docNo !== undefined) setDocNo(initialValues.docNo);
      if (initialValues.targetYear !== undefined) setTargetYear(initialValues.targetYear);
      if (initialValues.businessName !== undefined) setBusinessName(initialValues.businessName);
      if (initialValues.ownerName !== undefined) setOwnerName(initialValues.ownerName);
      if (initialValues.citizenId !== undefined) setCitizenId(initialValues.citizenId);
      if (initialValues.phone !== undefined) setPhone(initialValues.phone);
      if (initialValues.email !== undefined) setEmail(initialValues.email);
      if (initialValues.houseNo !== undefined) setHouseNo(initialValues.houseNo);
      if (initialValues.village !== undefined) setVillage(initialValues.village);
      if (initialValues.address !== undefined) setAddress(initialValues.address);
      if (initialValues.lat !== undefined) setLat(initialValues.lat);
      if (initialValues.lng !== undefined) setLng(initialValues.lng);
      if (initialValues.areaSqm !== undefined) setAreaSqm(initialValues.areaSqm);
      if (initialValues.workerCount !== undefined) setWorkerCount(initialValues.workerCount);
      if (initialValues.premiseCharacteristics !== undefined) setPremiseCharacteristics(initialValues.premiseCharacteristics);
      if (initialValues.feeAmount !== undefined) setFeeAmount(initialValues.feeAmount);
      if (initialValues.receiptNo !== undefined) setReceiptNo(initialValues.receiptNo);
      if (initialValues.applicationSubmissionDate !== undefined) {
        setApplicationSubmissionDate(initialValues.applicationSubmissionDate);
      }
      if (initialValues.inspectorName !== undefined) setInspectorName(initialValues.inspectorName);
      if (initialValues.inspectorPosition !== undefined) setInspectorPosition(initialValues.inspectorPosition);
    }
  }, [initialValues]);

  const handleVillageChange = (newVillage: string) => {
    setVillage(newVillage);
    const coords = VILLAGE_COORDS[newVillage] || { lat: 19.9328, lng: 99.1719 };
    setLat(coords.lat);
    setLng(coords.lng);
    const hn = houseNo ? `${houseNo} ` : '';
    setAddress(`${hn}${newVillage} ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่`);
  };

  const handleHouseNoChange = (newHouseNo: string) => {
    setHouseNo(newHouseNo);
    const hn = newHouseNo ? `${newHouseNo} ` : '';
    setAddress(`${hn}${village} ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่`);
  };

  const handleRegTypeChange = (t: RegimeType) => {
    setRegType(t);
    if (t === 'บทส') {
      setCategory('hazardous');
      setCategoryName('กิจการที่เป็นอันตรายต่อสุขภาพ');
      setFeeAmount(100);
    } else if (t === 'บทอ') {
      setCategory('food_license');
      setCategoryName('สถานที่จำหน่ายอาหารและสถานที่สะสมอาหาร เกินกว่า ๒๐๐ ตารางเมตร');
      setFeeAmount(1000);
    } else if (t === 'นจ') {
      setCategory('food_notice');
      setCategoryName('สถานที่จำหน่ายอาหารและสถานที่สะสมอาหาร ไม่เกิน ๒๐๐ ตารางเมตร');
      setFeeAmount(500);
    } else if (t === 'อส') {
      setCategory('market');
      setCategoryName('ตลาดเอกชนและตลาดชุมชน');
      setFeeAmount(500);
    } else if (t === 'นส') {
      setCategory('public_sale');
      setCategoryName('การจำหน่ายสินค้าในที่หรือทางสาธารณะ');
      setFeeAmount(100);
    } else if (t === 'ปป') {
      setCategory('waste_sewage');
      setCategoryName('การรับทำการกำจัดสิ่งปฏิกูลหรือมูลฝอย');
      setFeeAmount(1000);
    }
  };

  const handleSubmit = (proceedToPrint: boolean) => {
    if (!businessName.trim() || !ownerName.trim() || !citizenId.trim()) {
      showWarningAlert(
        'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน',
        'ต้องระบุชื่อสถานประกอบการ, ผู้ขอรับใบอนุญาต และเลขบัตรประชาชน ๑๓ หลัก'
      );
      return;
    }

    const payload: EstablishmentFormValues = {
      regType,
      category,
      categoryName,
      docNo: docNo.trim(),
      targetYear,
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      citizenId: citizenId.trim(),
      phone: phone.trim(),
      email: email.trim(),
      houseNo: houseNo.trim(),
      village,
      address: address.trim() || `${houseNo} ${village} ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่`,
      lat,
      lng,
      areaSqm: Number(areaSqm) || 0,
      workerCount: Number(workerCount) || 0,
      premiseCharacteristics: premiseCharacteristics.trim() || 'อยู่ในอาคารพาณิชย์',
      feeAmount,
      receiptNo: receiptNo.trim(),
      applicationSubmissionDate,
      inspectorName: inspectorName.trim(),
      inspectorPosition: inspectorPosition.trim()
    };

    onSave(payload, proceedToPrint);
  };

  return (
    <div className="space-y-4">
      {/* การ์ด 1: ข้อมูลคำขอและประเภทใบอนุญาต */}
      <div className="ui-card ui-card-pad space-y-4">
        <h3 className="ui-section-title">ข้อมูลคำขอและประเภทใบอนุญาต</h3>

        <div className="ui-grid-3">
          <div>
            <label className="ui-label">
              ประเภทคำขอ (Regime)<span className="req">*</span>
            </label>
            <select
              value={regType}
              onChange={(e) => handleRegTypeChange(e.target.value as RegimeType)}
              className="ui-input font-medium"
            >
              <option value="บทส">แบบ บทส. (อันตรายต่อสุขภาพ)</option>
              <option value="บทอ">แบบ บทอ. (อาหาร &gt; 200 ตร.ม.)</option>
              <option value="นจ">แบบ นจ. (อาหาร ≤ 200 ตร.ม.)</option>
              <option value="อส">แบบ อส. (ตลาด)</option>
              <option value="นส">แบบ นส. (ขายที่สาธารณะ)</option>
              <option value="ปป">แบบ ปป. (สิ่งปฏิกูล)</option>
            </select>
          </div>

          <div>
            <label className="ui-label">เลขที่คำขอ / ใบอนุญาต</label>
            <input
              type="text"
              value={docNo}
              onChange={(e) => setDocNo(e.target.value)}
              placeholder="เช่น 044/2569"
              className="ui-input"
            />
          </div>

          <div>
            <label className="ui-label">รอบปี พ.ศ.</label>
            <input
              type="number"
              value={targetYear}
              onChange={(e) => setTargetYear(Number(e.target.value))}
              className="ui-input"
            />
          </div>
        </div>

        <div>
          <label className="ui-label">หมวด / ประเภทกิจการ</label>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="เช่น กิจการที่เกี่ยวกับปิโตรเลียม ถ่านหิน สารเคมี (ปั๊มน้ำมันหยอดเหรียญ)"
            className="ui-input"
          />
        </div>
      </div>

      {/* การ์ด 2: ข้อมูลสถานประกอบการและผู้ขออนุญาต */}
      <div className="ui-card ui-card-pad space-y-4">
        <h3 className="ui-section-title">ข้อมูลสถานประกอบการและผู้ขออนุญาต</h3>

        <div className="ui-grid-2">
          <div>
            <label className="ui-label">
              ชื่อสถานประกอบการ / ร้าน<span className="req">*</span>
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="เช่น ปั๊มน้ำมันหยอดเหรียญ นายอิทธิพล"
              className="ui-input"
            />
          </div>

          <div>
            <label className="ui-label">
              ชื่อผู้ขอรับใบอนุญาต (เจ้าของ)<span className="req">*</span>
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="เช่น นายอิทธิพล ขันคำกาศ"
              className="ui-input"
            />
          </div>

          <div>
            <label className="ui-label">
              เลขประจำตัวประชาชน (๑๓ หลัก)<span className="req">*</span>
            </label>
            <input
              type="text"
              value={citizenId}
              onChange={(e) => setCitizenId(e.target.value.replace(/[^0-9]/g, '').slice(0, 13))}
              maxLength={13}
              placeholder="1500900146471"
              className="ui-input font-mono"
            />
          </div>

          <div>
            <label className="ui-label">หมายเลขโทรศัพท์</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="เช่น 088-7694944"
              className="ui-input font-mono"
            />
          </div>

          <div>
            <label className="ui-label">
              มีพื้นที่ (ตารางเมตร)<span className="req">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                value={areaSqm}
                onChange={(e) => setAreaSqm(Number(e.target.value) || 0)}
                placeholder="50"
                className="ui-input pr-12 font-mono font-bold"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                ตร.ม.
              </span>
            </div>
          </div>

          <div>
            <label className="ui-label">
              จำนวนคนงาน (คน)<span className="req">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                value={workerCount}
                onChange={(e) => setWorkerCount(Number(e.target.value) || 0)}
                placeholder="1"
                className="ui-input pr-10 font-mono font-bold"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                คน
              </span>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="ui-label">ลักษณะของสถานที่ประกอบกิจการ</label>
            <input
              type="text"
              value={premiseCharacteristics}
              onChange={(e) => setPremiseCharacteristics(e.target.value)}
              placeholder="เช่น อยู่ในอาคารพาณิชย์"
              className="ui-input font-medium"
            />
          </div>
        </div>
      </div>

      {/* การ์ด 3: ที่ตั้งสถานประกอบการ */}
      <div className="ui-card ui-card-pad space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="ui-section-title">ที่ตั้งสถานประกอบการ & พิกัดแผนที่ GIS</h3>
          <span className="ui-hint flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-blue-600" /> ต.โป่งน้ำร้อน อ.ฝาง
          </span>
        </div>

        <div className="ui-grid-3">
          <div>
            <label className="ui-label">บ้านเลขที่</label>
            <input
              type="text"
              value={houseNo}
              onChange={(e) => handleHouseNoChange(e.target.value)}
              placeholder="เช่น 214"
              className="ui-input"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="ui-label">หมู่ที่ / ชื่อหมู่บ้าน</label>
            <select
              value={village}
              onChange={(e) => handleVillageChange(e.target.value)}
              className="ui-input"
            >
              {OFFICIAL_VILLAGES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="ui-label">ที่อยู่ฉบับเต็ม</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="214 หมู่ที่ 7 ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่"
            className="ui-input"
          />
        </div>

        <div className="ui-grid-2">
          <div>
            <label className="ui-label">พิกัดละติจูด (Lat)</label>
            <input
              type="number"
              step="0.000001"
              value={lat}
              onChange={(e) => setLat(Number(e.target.value))}
              className="ui-input font-mono"
            />
          </div>
          <div>
            <label className="ui-label">พิกัดลองจิจูด (Lng)</label>
            <input
              type="number"
              step="0.000001"
              value={lng}
              onChange={(e) => setLng(Number(e.target.value))}
              className="ui-input font-mono"
            />
          </div>
        </div>
      </div>

      {/* การ์ด 4: ข้อมูลการยื่นคำขอและเจ้าหน้าที่ */}
      <div className="ui-card ui-card-pad space-y-4">
        <h3 className="ui-section-title">ข้อมูลการยื่นคำขอ & ค่าธรรมเนียม</h3>

        <div className="ui-grid-2">
          <div>
            <label className="ui-label">วันที่ยื่นคำขอ</label>
            <input
              type="date"
              value={applicationSubmissionDate}
              onChange={(e) => setApplicationSubmissionDate(e.target.value)}
              className="ui-input"
            />
          </div>

          <div>
            <label className="ui-label">ค่าธรรมเนียม (บาท)</label>
            <input
              type="number"
              value={feeAmount}
              onChange={(e) => setFeeAmount(Number(e.target.value))}
              className="ui-input font-mono"
            />
          </div>
        </div>

        <div className="ui-grid-2">
          <div>
            <label className="ui-label">เจ้าหน้าที่ผู้รับเรื่อง</label>
            <input
              type="text"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              className="ui-input"
            />
          </div>

          <div>
            <label className="ui-label">ตำแหน่ง</label>
            <input
              type="text"
              value={inspectorPosition}
              onChange={(e) => setInspectorPosition(e.target.value)}
              className="ui-input"
            />
          </div>
        </div>
      </div>

      {/* แถบปุ่มบันทึก (Sticky Actionbar) */}
      <div className="ui-actionbar">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="ui-btn ui-btn-ghost"
          >
            ยกเลิก
          </button>
        )}

        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={isSaving}
          className="ui-btn ui-btn-primary"
        >
          {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
          <span>{submitLabel}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={isSaving}
          className="ui-btn ui-btn-secondary"
        >
          <Printer />
          <span>บันทึกแล้วไปพิมพ์</span>
        </button>
      </div>
    </div>
  );
};
