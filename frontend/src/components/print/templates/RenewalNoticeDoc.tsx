import React from 'react';
import type { Establishment, SystemSettings } from '../../../types/publicHealth';
import { formatThaiDate, parseAddressDetails, thaiBahtText } from './printHelpers';

interface RenewalNoticeDocProps {
  establishment: Establishment;
  settings: SystemSettings;
  formTitle: string;
}

export const RenewalNoticeDoc: React.FC<RenewalNoticeDocProps> = ({
  establishment,
  settings,
  formTitle
}) => {
  const sig = settings.signatories;
  const districtName = settings.district || 'อำเภอฝาง';
  const provinceName = settings.province || 'จังหวัดเชียงใหม่';
  const parsedAddress = parseAddressDetails(establishment.address, establishment.village);

  return (
    <div
      id="printable-renewal-notice"
      className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-12 sm:p-16 shadow-2xl border border-slate-300 print:shadow-none print:border-none print:w-full print:max-w-none print:p-8 print:m-0 flex flex-col justify-between font-serif relative overflow-hidden"
      style={{ fontFamily: "'Sarabun', 'TH Sarabun New', serif" }}
    >
      <div>
        {/* Garuda Emblem Top Center (Height 3cm) */}
        <div className="flex justify-center mb-6">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/8/87/Garuda_Emb_Thailand.svg"
            alt="ตราครุฑ"
            className="w-20 h-20 object-contain"
          />
        </div>

        {/* Letter Top Reference and Address */}
        <div className="flex justify-between items-start text-sm leading-relaxed mb-6">
          <div className="w-1/2">
            <div>ที่ ชม ๗๒๒๐๒ / ว {establishment.docNo || '๐๔๑๒'}</div>
          </div>
          <div className="w-1/2 text-left pl-8">
            <div>ที่ทำการองค์การบริหารส่วนตำบลโป่งน้ำร้อน</div>
            <div>ตำบลโป่งน้ำร้อน อำเภอฝาง</div>
            <div>จังหวัดเชียงใหม่ ๕๐๑๑๐</div>
          </div>
        </div>

        {/* Date */}
        <div className="text-center text-sm mb-6 pl-24">
          {formatThaiDate(new Date().toISOString().split('T')[0], true)}
        </div>

        {/* Subject, To, Reference, Attachments */}
        <div className="text-sm space-y-2 mb-6">
          <div className="flex">
            <span className="w-24 shrink-0 font-bold">เรื่อง</span>
            <span>
              แจ้งเตือนการต่ออายุใบอนุญาตและชำระค่าธรรมเนียมประจำปี ตาม พ.ร.บ.การสาธารณสุข พ.ศ. ๒๕๓๕
            </span>
          </div>
          <div className="flex">
            <span className="w-24 shrink-0 font-bold">เรียน</span>
            <span className="font-bold">{establishment.ownerName}</span>
          </div>
          <div className="flex">
            <span className="w-24 shrink-0 font-bold">อ้างถึง</span>
            <span>
              {formTitle} ({establishment.regType}) เล่มที่ {establishment.bookNo} เลขที่ {establishment.regNumber}
            </span>
          </div>
          <div className="flex">
            <span className="w-24 shrink-0 font-bold">สิ่งที่ส่งมาด้วย</span>
            <span>๑. แบบคำขอต่ออายุใบอนุญาต จำนวน ๑ ชุด</span>
          </div>
        </div>

        {/* Letter Body Paragraphs */}
        <div className="text-sm text-justify leading-relaxed space-y-4 indent-8">
          <p>
            ตามที่ท่านได้รับอนุญาตให้จัดตั้งหรือประกอบกิจการ{' '}
            <strong className="font-bold">{establishment.businessName}</strong> ประเภท{' '}
            {establishment.categoryName} ตั้งอยู่เลขที่ {parsedAddress.houseNo}{' '}
            {parsedAddress.fullVillageDisplay} ตำบลโป่งน้ำร้อน {districtName} {provinceName} โดยใบอนุญาตหรือหนังสือรับรองการแจ้งดังกล่าวจะสิ้นอายุลงในวันที่{' '}
            <strong className="font-bold text-red-900 font-mono">
              {formatThaiDate(establishment.expireDate, true)}
            </strong>{' '}
            นั้น
          </p>

          <p>
            เพื่อให้การดำเนินกิจการของท่านเป็นไปอย่างถูกต้องตามพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕
            และข้อบัญญัติองค์การบริหารส่วนตำบลโป่งน้ำร้อน กองสาธารณสุขและสิ่งแวดล้อม
            จึงขอแจ้งเตือนให้ท่านหรือผู้รับมอบอำนาจ เดินทางมายื่นคำขอต่ออายุใบอนุญาต พร้อมนำหลักฐานประกอบ
            และชำระค่าธรรมเนียมประจำปี เป็นจำนวนเงิน{' '}
            <strong>{establishment.feeAmount.toLocaleString('th-TH')} บาท ({thaiBahtText(establishment.feeAmount)})</strong>{' '}
            ณ ที่ทำการกองสาธารณสุขและสิ่งแวดล้อม องค์การบริหารส่วนตำบลโป่งน้ำร้อน{' '}
            <span className="underline font-bold">ก่อนใบอนุญาตสิ้นอายุไม่น้อยกว่า ๓๐ วัน</span>
          </p>

          <p>
            อนึ่ง หากพ้นกำหนดระยะเวลาดังกล่าวและท่านยังมิได้ดำเนินการต่ออายุ
            ท่านจะต้องระวางโทษปรับตามกฎหมาย หรืออาจถูกสั่งระงับการดำเนินกิจการตามพระราชบัญญัติการสาธารณสุข
            พ.ศ. ๒๕๓๕ ต่อไป
          </p>

          <p className="indent-8">
            จึงเรียนมาเพื่อโปรดทราบและดำเนินการต่อไป
          </p>
        </div>

        {/* Sign-off */}
        <div className="mt-12 text-center ml-auto w-64 text-sm space-y-1">
          <div className="mb-14">ขอแสดงความนับถือ</div>
          <div className="font-bold">( {sig.mayorName || 'นายสมหมาย มงคลกุล'} )</div>
          <div className="text-xs text-slate-700">{sig.mayorPosition || 'นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน'}</div>
          <div className="text-xs text-slate-700">{sig.mayorRoleTitle || 'เจ้าพนักงานท้องถิ่น'}</div>
        </div>
      </div>

      {/* Contact details bottom left */}
      <div className="border-t border-slate-200 pt-3 text-xs text-slate-600 space-y-0.5">
        <div className="font-bold">{settings.departmentName || 'กองสาธารณสุขและสิ่งแวดล้อม'}</div>
        <div>โทรศัพท์ {settings.phoneNumber || '053-810317'}</div>
        <div>อีเมล {settings.email || 'health@pongnamron.go.th'}</div>
      </div>
    </div>
  );
};
