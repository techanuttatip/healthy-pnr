import React, { useState, useEffect } from 'react';
import { sanitationDataService, type SignatureRequest } from '../../services/sanitationDataService';
import { SignaturePad } from './SignaturePad';
import { CheckCircle2, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';

interface RemoteSignViewProps {
  token: string;
}

export const RemoteSignView: React.FC<RemoteSignViewProps> = ({ token }) => {
  const [request, setRequest] = useState<SignatureRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [signerName, setSignerName] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignedSuccess, setIsSignedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchReq = async () => {
      setLoading(true);
      try {
        const data = await sanitationDataService.getSignatureRequest(token);
        if (data) {
          setRequest(data);
          setSignerName(data.signerName || '');
          if (data.status === 'signed') {
            setIsSignedSuccess(true);
          }
        } else {
          setErrorMessage('ไม่พบข้อมูลคำขอลงนาม หรือลิงก์นี้หมดอายุแล้ว (เกิน ๒๔ ชั่วโมง)');
        }
      } catch (err) {
        console.error(err);
        setErrorMessage('ไม่สามารถโหลดข้อมูลคำขอลงนามได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
      } finally {
        setLoading(false);
      }
    };
    fetchReq();
  }, [token]);

  const handleSubmit = async () => {
    if (!signatureData) {
      alert('กรุณาลงลายมือชื่อในช่องลายเซ็นก่อนกดยืนยัน');
      return;
    }
    if (!signerName.trim()) {
      alert('กรุณากรอกชื่อ-สกุล ผู้ลงนาม');
      return;
    }

    setIsSubmitting(true);
    try {
      await sanitationDataService.submitRemoteSignature(token, signatureData, signerName.trim());
      setIsSignedSuccess(true);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกลายมือชื่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium text-slate-600">กำลังโหลดข้อมูลผลการตรวจสุขลักษณะ...</p>
      </div>
    );
  }

  if (errorMessage || !request) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="ui-card p-6 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">ไม่สามารถดำเนินการได้</h2>
          <p className="text-sm text-slate-600">{errorMessage || 'ไม่พบข้อมูล'}</p>
        </div>
      </div>
    );
  }

  if (isSignedSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="ui-card p-6 max-w-md w-full text-center space-y-4 shadow-md">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">ลงนามรับทราบเรียบร้อยแล้ว</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            ระบบได้บันทึกลายมือชื่อของท่าน ({signerName || request.signerName}) เข้าสู่ระบบสารบรรณสุขาภิบาล อบต.โป่งน้ำร้อน เรียบร้อยแล้ว ท่านสามารถปิดหน้าต่างนี้ได้ทันที
          </p>
          <div className="pt-2">
            <span className="ui-pill ui-pill-success">
              ✓ บันทึกสำเร็จลงฐานข้อมูลราชการ
            </span>
          </div>
        </div>
      </div>
    );
  }

  const isPassed = request.result === 'passed';

  return (
    <div className="min-h-screen bg-[#f3f5f8] p-4 sm:p-6 flex flex-col items-center justify-center font-sans">
      <div className="max-w-md w-full space-y-4">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400 bg-white shadow-xs mx-auto p-0.5">
            <img src="/pnr_logo.png" alt="อบต.โป่งน้ำร้อน" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-base font-bold text-slate-900 pt-1">
            ลงนามรับทราบผลการตรวจสุขลักษณะสถานที่
          </h1>
          <p className="text-xs text-slate-500">
            กองสาธารณสุขและสิ่งแวดล้อม อบต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่
          </p>
        </div>

        {/* Inspection Details Card */}
        <div className="ui-card p-4 space-y-3 bg-white">
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="min-w-0">
              <span className="text-[11px] text-slate-400 block">สถานประกอบการ</span>
              <span className="font-bold text-sm text-slate-900 truncate block">
                {request.establishmentName}
              </span>
            </div>
            <span
              className={`ui-pill shrink-0 ${
                isPassed ? 'ui-pill-success' : 'ui-pill-warning'
              }`}
            >
              {isPassed ? '✓ ผ่านเกณฑ์มาตรฐาน' : '⚠ ต้องปรับปรุงแก้ไข'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">วันที่ตรวจประเมิน</span>
              <span className="font-medium text-slate-800">{request.inspectionDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">คะแนนการประเมิน</span>
              <span className="font-bold text-slate-900">{request.totalScore} / 100 คะแนน</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block text-[11px]">เจ้าหน้าที่ผู้ตรวจสถานที่</span>
              <span className="font-medium text-slate-800">{request.inspectorName}</span>
            </div>
          </div>

          {request.defectsSummary && request.defectsSummary.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-amber-800 block mb-1">
                รายการที่ต้องปรับปรุงแก้ไข:
              </span>
              <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5">
                {request.defectsSummary.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Consent Text */}
        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/70 text-xs text-blue-950 leading-relaxed">
          ข้าพเจ้าในฐานะผู้ประกอบการหรือผู้แทน ได้ร่วมตรวจประเมินสุขลักษณะสถานที่จริงร่วมกับเจ้าหน้าที่ และรับทราบผลการตรวจประเมินตามรายละเอียดข้างต้น จึงได้ลงลายมือชื่อไว้เป็นหลักฐานอิเล็กทรอนิกส์
        </div>

        {/* Signature Pad */}
        <div className="ui-card p-4 space-y-3 bg-white">
          <SignaturePad
            label="ลายมือชื่อผู้ประกอบการ / ผู้รับผิดชอบสถานที่"
            signature={signatureData}
            onSave={(data) => setSignatureData(data)}
            signedName={signerName}
            onNameChange={(name) => setSignerName(name)}
            namePlaceholder="พิมพ์ชื่อ-นามสกุล ของท่าน"
            titleRole="ผู้ประกอบการ / ผู้แทน"
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !signatureData}
            className="ui-btn ui-btn-primary ui-btn-lg w-full mt-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
            <span>ยืนยันการลงลายมือชื่อ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
