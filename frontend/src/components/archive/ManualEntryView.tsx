import React, { useState } from 'react';
import type {
  Establishment,
  SystemSettings,
  YearDossier,
  ArchivedDocument
} from '../../types/publicHealth';
import { sanitationDataService } from '../../services/sanitationDataService';
import { showToast } from '../../utils/sweetAlert';
import { EstablishmentForm, type EstablishmentFormValues } from './EstablishmentForm';
import { FileEdit, Sparkles } from 'lucide-react';

interface ManualEntryViewProps {
  onSaveEstablishment: (est: Establishment) => void;
  onNavigateToPrint: (est: Establishment) => void;
  onNavigateToTable: () => void;
  settings?: SystemSettings;
}

export const ManualEntryView: React.FC<ManualEntryViewProps> = ({
  onSaveEstablishment,
  onNavigateToPrint,
  onNavigateToTable,
  settings
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [draftValues, setDraftValues] = useState<Partial<EstablishmentFormValues>>({
    regType: 'บทส',
    targetYear: 2569,
    feeAmount: 100,
    applicationSubmissionDate: new Date().toISOString().split('T')[0]
  });

  const handleFillSample = () => {
    setDraftValues({
      regType: 'นจ',
      category: 'food_notice',
      categoryName: 'สถานที่จำหน่ายอาหารและสถานที่สะสมอาหาร ไม่เกิน ๒๐๐ ตารางเมตร',
      docNo: '028/2569',
      targetYear: 2569,
      businessName: 'ร้านอาหารครัวแม่บัวผัน',
      ownerName: 'นางบัวผัน ใจเย็น',
      citizenId: '1500900334455',
      phone: '089-5551234',
      email: 'buaphan.food@gmail.com',
      houseNo: '55',
      village: 'หมู่ที่ 3 บ้านหัวฝาย',
      address: '55 หมู่ที่ 3 ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่',
      lat: 19.938,
      lng: 99.178,
      feeAmount: 500,
      receiptNo: 'RCPT-00028/69',
      applicationSubmissionDate: new Date().toISOString().split('T')[0]
    });
    showToast('กรอกข้อมูลตัวอย่างเรียบร้อยแล้ว', 'info');
  };

  const handleSave = async (values: EstablishmentFormValues, proceedToPrint: boolean) => {
    setIsSaving(true);
    try {
      const safeDocNo = values.docNo.trim() || `001/${values.targetYear}`;
      const docPrefix = safeDocNo.includes('/')
        ? safeDocNo.split('/')[0].padStart(4, '0')
        : safeDocNo.padStart(4, '0');
      const regNumber = `${values.regType}-${String(values.targetYear).slice(-2)}-${docPrefix}`;

      const issueDate = values.applicationSubmissionDate;
      const expireDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const docs: ArchivedDocument[] = [
        {
          id: `doc-app-${Date.now()}`,
          type: 'application',
          title: `แบบคำขอรับ/ต่ออายุใบอนุญาต (${values.regType} เลขที่ ${safeDocNo})`,
          fileName: 'application_form.pdf',
          uploadedAt: values.applicationSubmissionDate,
          uploadedBy: values.inspectorName,
          status: 'verified',
          notes: 'บันทึกข้อมูลเข้าระบบโดยตรง'
        }
      ];

      const dossier: YearDossier = {
        year: values.targetYear,
        status: 'pending_payment',
        applicationDate: values.applicationSubmissionDate,
        feeAmount: values.feeAmount,
        documents: docs
      };

      const newEst: Establishment = {
        id: `est-${Date.now()}`,
        regNumber,
        regType: values.regType,
        category: values.category,
        categoryName: values.categoryName,
        businessName: values.businessName,
        applicantType: 'individual',
        ownerName: values.ownerName,
        citizenId: values.citizenId,
        phone: values.phone,
        email: values.email,
        village: values.village,
        address: values.address,
        areaSqm: values.areaSqm || 50,
        workerCount: values.workerCount ?? 1,
        premiseCharacteristics: values.premiseCharacteristics || 'ตึกเดี่ยว 1 ชั้น',
        lat: values.lat,
        lng: values.lng,
        status: 'pending_inspection',
        issueDate,
        expireDate,
        annualFeeDue: expireDate,
        feeAmount: values.feeAmount,
        bookNo: '-',
        docNo: safeDocNo,
        receiptBookNo: '-',
        receiptNo: values.receiptNo,
        receiptDate: values.applicationSubmissionDate,
        applicationSubmissionDate: values.applicationSubmissionDate,
        temporarySlipIssuedDate: values.applicationSubmissionDate,
        foodPlaceType: 'selling',
        conditions: [
          'ผู้ประกอบการต้องปฏิบัติตามมาตรฐานสุขาภิบาลอย่างเคร่งครัด',
          'แสดงใบอนุญาตไว้ในที่เปิดเผยและเห็นได้ง่าย ณ สถานที่ประกอบการ'
        ],
        inspectionScore: 100,
        inspectionPassed: true,
        inspectionDate: issueDate,
        inspectorName: values.inspectorName,
        inspectorPosition: values.inspectorPosition,
        yearlyArchives: [dossier]
      };

      onSaveEstablishment(newEst);
      await sanitationDataService.saveEstablishment(newEst);
      showToast('บันทึกข้อมูลสถานประกอบการสำเร็จ!', 'success');

      if (proceedToPrint) {
        onNavigateToPrint(newEst);
      } else {
        onNavigateToTable();
      }
    } catch (err) {
      console.error('Save manual entry error:', err);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="ui-page">
      <div className="ui-page-narrow space-y-5">
        {/* Header */}
        <div className="ui-page-header">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <FileEdit className="w-5 h-5" />
              </div>
              <div>
                <h1 className="ui-title">บันทึกข้อมูลคำขอเอง</h1>
                <p className="ui-subtitle">
                  กรอกข้อมูลรับคำขอใหม่หรือต่ออายุใบอนุญาตโดยตรง ไม่ต้องใช้ไฟล์สแกน
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFillSample}
              className="ui-btn ui-btn-ghost ui-btn-sm"
              title="ใส่ข้อมูลตัวอย่างเพื่อทดสอบระบบรวดเร็ว"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>ใส่ข้อมูลตัวอย่าง</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToTable}
              className="ui-btn ui-btn-secondary ui-btn-sm"
            >
              กลับหน้ารายการ
            </button>
          </div>
        </div>

        {/* Form Body */}
        <EstablishmentForm
          initialValues={draftValues}
          onSave={handleSave}
          isSaving={isSaving}
          settings={settings}
          onCancel={onNavigateToTable}
          submitLabel="บันทึกข้อมูลเข้าระบบ"
        />
      </div>
    </div>
  );
};
