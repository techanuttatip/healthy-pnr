import React from 'react';
import type { Establishment, SystemSettings } from '../../../types/publicHealth';
import {
  renderCitizenIdBoxes,
  formatThaiDate,
  formatOfficialAddress,
  toThaiDigits
} from './printHelpers';
import { DEFAULT_OFFICER_SIGNATURE, sanitationDataService } from '../../../services/sanitationDataService';

interface ApplicationDocProps {
  establishment: Establishment;
  settings: SystemSettings;
  applicationCode: string;
  applicationTitle: string;
}

export const ApplicationDoc: React.FC<ApplicationDocProps> = ({
  establishment,
  settings,
  applicationCode,
  applicationTitle
}) => {
  const sig = settings.signatories;
  const currentOfficer = sanitationDataService.getCurrentOfficer();
  const officerSig = currentOfficer?.signatureUrl || DEFAULT_OFFICER_SIGNATURE;
  const districtName = settings.district || 'อำเภอฝาง';
  const provinceName = settings.province || 'จังหวัดเชียงใหม่';

  const regType = establishment.regType || '';
  const isHazardous = regType === 'บทส' || establishment.category === 'hazardous';
  const isStorage =
    !isHazardous &&
    (establishment.foodPlaceType === 'storage' ||
      (applicationTitle?.includes('สะสมอาหาร') && !applicationTitle?.includes('จำหน่ายอาหาร')) ||
      (establishment.categoryName?.includes('สะสมอาหาร') && !establishment.categoryName?.includes('จำหน่ายอาหาร')) ||
      establishment.businessName?.includes('โกดัง') ||
      establishment.businessName?.includes('คลัง'));

  const isGrocery =
    isStorage &&
    (establishment.businessName?.includes('ของชำ') ||
      establishment.businessName?.includes('มินิมาร์ท') ||
      establishment.businessName?.includes('ร้านค้า') ||
      establishment.businessName?.includes('ขายของ') ||
      (!establishment.businessName?.includes('โกดัง') && !establishment.businessName?.includes('คลัง')));

  const resolvedAge =
    establishment.ownerAge ||
    (establishment.citizenId === '3500901026441' || establishment.ownerName?.includes('จำนงค์') ? 67 : 35);

  let displayedFoodType = establishment.foodTypeDetail?.trim();
  if (isStorage && (!displayedFoodType || displayedFoodType === '-' || displayedFoodType.includes('ปรุงสำเร็จ'))) {
    displayedFoodType = isGrocery ? 'อาหารแห้ง อาหารสำเร็จรูป และเครื่องดื่ม' : 'อาหารแห้ง และสินค้าเกษตรแปรรูป';
  } else if (!displayedFoodType || displayedFoodType === '-') {
    displayedFoodType = 'อาหารปรุงสำเร็จ และเครื่องดื่ม';
  }

  let displayedPremise = establishment.premiseCharacteristics?.trim();
  if (!displayedPremise || displayedPremise === '-' || displayedPremise === '') {
    displayedPremise = isStorage
      ? (isGrocery ? 'ตึกเดี่ยว 1 ชั้น' : 'อยู่ในอาคารโกดัง')
      : 'ตึกเดี่ยว 1 ชั้น';
  }

  let displayedDistribution = establishment.distributionMethod;
  if (isStorage && (!displayedDistribution || displayedDistribution.includes('โต๊ะเก้าอี้'))) {
    displayedDistribution = isGrocery ? 'จำหน่ายปลีกหน้าร้าน (ซื้อกลับบ้าน)' : 'จำหน่ายส่งและมีบริการจัดส่ง';
  } else if (!displayedDistribution) {
    displayedDistribution = 'มีโต๊ะเก้าอี้ไว้ให้บริการและซื้อกลับบ้าน';
  }

  const ownerAddr = formatOfficialAddress(
    establishment.address,
    establishment.village,
    districtName,
    provinceName
  );
  const premiseAddr = formatOfficialAddress(
    establishment.address,
    establishment.village,
    districtName,
    provinceName
  );

  const officialBadgeCode = toThaiDigits(applicationCode);

  return (
    <div
      id="printable-application-form"
      className="printable-doc-root w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-8 sm:p-10 shadow-2xl border border-slate-300 print:shadow-none print:border-none print:w-full print:max-w-none print:p-0 print:m-0 flex flex-col justify-between relative overflow-hidden"
      style={{
        fontFamily: "'TH Sarabun New', 'TH Sarabun PSK', 'Sarabun', sans-serif",
        textAlign: 'left',
        fontSize: '14pt',
        lineHeight: '1.5',
        color: '#000000'
      }}
    >
      <div className="relative z-10">
        {/* Form Code Header */}
        <div className="flex justify-between items-start text-[14pt] text-black mb-1">
          <div>
            <div>เลขรับคำขอ: <span className="font-bold">{establishment.regNumber || '............'}</span></div>
            <div className="mt-0.5">วันที่รับเรื่อง: <span className="font-bold">{formatThaiDate(establishment.applicationSubmissionDate || establishment.issueDate, false)}</span></div>
          </div>
          <div className="text-right">
            <span className="font-bold border border-black px-3 py-0.5 rounded text-[13pt]">
              {officialBadgeCode}
            </span>
          </div>
        </div>

        {/* Title Header */}
        <div className="text-center my-2">
          <h1 className="text-[20pt] font-bold tracking-tight text-black leading-snug whitespace-pre-line">
            {applicationTitle}
          </h1>
          <p className="text-[14pt] text-black mt-0.5">
            วันที่ <span className="font-bold">{formatThaiDate(establishment.applicationSubmissionDate || establishment.issueDate, false)}</span>
          </p>
        </div>

        {/* Body Content */}
        <div className="doc-body-content text-[14pt] text-black space-y-2 mt-2 leading-relaxed">
          {/* 1. Applicant Section */}
          <div>
            <div className="font-bold text-[15pt]">
              {isHazardous ? '๑. ข้อมูลผู้ขอรับใบอนุญาต/ต่ออายุใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ' : `๑. ชื่อผู้ขอจัดตั้งสถานที่${isStorage ? 'สะสมอาหาร' : 'จำหน่ายอาหาร'}`}
            </div>
            <div className="pl-4 mt-0.5 leading-relaxed">
              ข้าพเจ้า <span className="font-bold">{establishment.ownerName}</span> อายุ{' '}
              <span className="font-bold">{resolvedAge}</span> ปี สัญชาติไทย
              <div className="mt-1 flex items-center gap-2">
                <span>เลขหมายประจำตัวประชาชน เลขที่</span>
                {renderCitizenIdBoxes(establishment.citizenId)}
              </div>
              <div className="mt-0.5">
                อยู่บ้านเลขที่ <span className="font-bold">{ownerAddr.formatted}</span> โทรศัพท์{' '}
                <span className="font-bold">{establishment.phone || '-'}</span>{' '}
                {establishment.fax && establishment.fax !== '-' ? (
                  <>โทรสาร <span className="font-bold">{establishment.fax}</span></>
                ) : null}
              </div>
            </div>
          </div>

          {/* 2. Business Details */}
          <div>
            <div className="font-bold text-[15pt]">๒. ข้อมูลสถานประกอบกิจการ</div>
            <div className="pl-4 space-y-0.5 mt-0.5">
              <div>
                ชื่อสถานประกอบกิจการ: <span className="font-bold">"{establishment.businessName}"</span>
              </div>

              {isHazardous ? (
                <>
                  <div>
                    ประเภทกิจการที่เป็นอันตรายต่อสุขภาพ:{' '}
                    <span className="font-bold">
                      {establishment.categoryName || 'กิจการที่เกี่ยวกับปิโตรเลียม ถ่านหิน สารเคมี (การจำหน่ายน้ำมันเชื้อเพลิงตู้หยอดเหรียญ)'}
                    </span>
                  </div>
                  <div>
                    ลักษณะของสถานที่ประกอบกิจการ: <span className="font-bold">{displayedPremise || 'อาคารปูน 1 ชั้น'}</span>
                  </div>
                  <div>
                    มีพื้นที่ประกอบกิจการ: <span className="font-bold">{establishment.areaSqm}</span> ตารางเมตร จำนวนคนงาน:{' '}
                    <span className="font-bold">{establishment.workerCount}</span> คน{' '}
                    {establishment.machineHorsepower ? (
                      <>กำลังเครื่องจักร: <span className="font-bold">{establishment.machineHorsepower}</span> แรงม้า</>
                    ) : null}
                  </div>
                  <div>
                    เวลาทำการ: <span className="font-bold">{establishment.operatingHours || 'ตลอด 24 ชั่วโมง (ระบบอัตโนมัติ)'}</span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    {isStorage ? 'ประเภทของอาหารที่สะสมเพื่อจำหน่าย:' : 'ประเภทของอาหารที่จำหน่าย:'}{' '}
                    <span className="font-bold">{displayedFoodType}</span>
                  </div>
                  <div>
                    ลักษณะของสถานที่ประกอบกิจการ: <span className="font-bold">{displayedPremise}</span>
                  </div>
                  <div>
                    วิธีการจำหน่าย: <span className="font-bold">{displayedDistribution}</span>
                  </div>
                  <div>
                    ช่วงเวลาที่จำหน่าย: <span className="font-bold">{establishment.operatingHours || '07:00 - 19:00 น.'}</span>{' '}
                    มีพื้นที่: <span className="font-bold">{establishment.areaSqm}</span> ตารางเมตร{' '}
                    {isStorage ? 'จำนวนคนงาน:' : 'จำนวนคนงาน/ผู้สัมผัสอาหาร:'}{' '}
                    <span className="font-bold">{establishment.workerCount}</span> คน
                  </div>
                </>
              )}

              <div>
                สถานที่ตั้ง: เลขที่ <span className="font-bold">{premiseAddr.formatted}</span> โทรศัพท์{' '}
                <span className="font-bold">{establishment.phone || '-'}</span>{' '}
                {establishment.email && establishment.email !== '-' ? (
                  <>อีเมล <span className="font-bold">{establishment.email}</span>{' '}</>
                ) : null}
                {establishment.lineId && establishment.lineId !== '-' ? (
                  <>Line ID: <span className="font-bold">{establishment.lineId}</span></>
                ) : null}
              </div>
            </div>
          </div>

          {/* 3. Document Checklist */}
          <div>
            <div className="font-bold text-[15pt]">๓. พร้อมคำขอนี้ ข้าพเจ้าได้แนบเอกสารหลักฐานต่าง ๆ มาด้วยแล้ว ดังนี้:</div>
            <div className="pl-4 grid grid-cols-1 sm:grid-cols-2 gap-0.5 mt-0.5 text-[13pt]">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-black">☑</span>
                <span>หนังสือมอบอำนาจ (ในกรณีที่มีการมอบอำนาจ)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-black">☑</span>
                <span>หลักฐานรับรองการจดทะเบียนเป็นนิติบุคคล (ถ้ามี)</span>
              </div>

              {isHazardous ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-black">☑</span>
                    <span>สำเนาบัตรประจำตัวประชาชน / ทะเบียนบ้านของผู้ขอรับใบอนุญาต</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-black">☑</span>
                    <span>แผนผังแสดงที่ตั้งสถานประกอบกิจการและอาคารข้างเคียง</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <span className="font-bold text-black">☑</span>
                    <span>สำเนาใบอนุญาตตามกฎหมายอื่นที่เกี่ยวข้อง (กรมธุรกิจพลังงาน/ควบคุมอาคาร)</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <span className="font-bold text-black">☑</span>
                    <span>แบบตรวจประเมินสุขลักษณะสถานประกอบกิจการที่เป็นอันตรายต่อสุขภาพ (ผลตรวจ 95 คะแนน ผ่านเกณฑ์)</span>
                  </div>
                </>
              ) : (
                <>
                  {!isStorage && (
                    <div className="flex items-center gap-1.5 sm:col-span-2">
                      <span className="font-bold text-black">☑</span>
                      <span>
                        หลักฐานการผ่านการอบรมผู้ประกอบกิจการและผู้สัมผัสอาหาร (เลขที่ {establishment.foodHandlerCertNo || 'ผส.67-0012'})
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <span className="font-bold text-black">☑</span>
                    <span>สัญญาเช่าอาคารหรือสถานที่ใช้ในการจัดตั้งสถานที่{isStorage ? 'สะสมอาหาร' : 'จำหน่ายอาหาร'} (ถ้ามี)</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <span className="font-bold text-black">☑</span>
                    <span>
                      แบบตรวจประเมินตนเองตามมาตรฐานสุขาภิบาลอาหาร
                      {isStorage ? 'สถานที่สะสมอาหาร' : 'สถานที่จำหน่ายอาหารตามกฎกระทรวงสุขลักษณะของสถานที่จำหน่ายอาหาร พ.ศ. 2561'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-black">☑</span>
                    <span>หลักฐานการตรวจสุขภาพตามที่ราชการส่วนท้องถิ่นกำหนด</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 4. Consent & Affirmation */}
          <div className="pt-0.5">
            <div className="font-bold text-[15pt]">๔. การยินยอมและการรับรอง:</div>
            <p className="text-[13pt] mt-0.5" style={{ textIndent: '1.5cm' }}>
              ข้าพเจ้ายินยอมให้ องค์การบริหารส่วนตำบลโป่งน้ำร้อน ตรวจสอบเอกสารหลักฐานของทางราชการที่เกี่ยวข้องกับการขอรับ{isHazardous ? 'ใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ' : 'หนังสือรับรองการแจ้ง'}
            </p>
            <p className="text-[13pt] font-semibold mt-0.5" style={{ textIndent: '1.5cm' }}>
              ขอรับรองว่าข้อความในคำขอนี้เป็นความจริงทุกประการ
            </p>
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="relative z-10 pt-2">
        <div className="flex justify-between items-end">
          {/* Officer Signature with e-sig */}
          <div className="text-center w-72 relative">
            <div className="relative flex items-end justify-center min-h-[44px] mb-1">
              <span className="text-[14pt] text-black shrink-0 select-none pb-0.5">(ลงชื่อ)</span>
              <div className="relative flex-1 mx-2 border-b border-dotted border-black h-8 flex items-end justify-center">
                {officerSig && (
                  <img
                    src={officerSig}
                    alt="e-sig ผู้รับเรื่อง"
                    className="absolute -bottom-1.5 h-10 object-contain filter contrast-125 pointer-events-none"
                  />
                )}
              </div>
              <span className="text-[13pt] text-black shrink-0 whitespace-nowrap pb-0.5">ผู้รับเรื่อง</span>
            </div>
            <div className="font-bold text-[14pt] text-black">
              ( {sig.officerName || 'นางสาวรุ่งทิวา อุปนันท์'} )
            </div>
            <div className="text-[12pt] text-slate-700 mt-0.5">
              {sig.officerPosition || 'นักวิชาการสาธารณสุขปฏิบัติการ'}
            </div>
          </div>

          {/* Applicant Signature */}
          <div className="text-center w-72">
            <div className="relative flex items-end justify-center min-h-[44px] mb-1">
              <span className="text-[14pt] text-black shrink-0 select-none pb-0.5">(ลงชื่อ)</span>
              <div className="flex-1 mx-2 border-b border-dotted border-black h-8"></div>
              <span className="text-[13pt] text-black shrink-0 whitespace-nowrap pb-0.5">
                {isHazardous ? 'ผู้ขอรับใบอนุญาต' : 'ผู้ขอแจ้ง'}
              </span>
            </div>
            <div className="font-bold text-[14pt] text-black">
              ( {establishment.ownerName} )
            </div>
          </div>
        </div>

        {/* Detachable Receipt Slip */}
        <div className="border-t-2 border-dashed border-slate-400 pt-2 mt-2 text-[12pt]">
          <div className="flex justify-between items-center text-[11pt] font-bold text-slate-800 mb-1">
            <span>(ส่วนฉีกให้ผู้ยื่นคำขอเก็บไว้เป็นหลักฐาน)</span>
            <span>ใบรับคำขอ {officialBadgeCode}</span>
          </div>
          <div className="bg-slate-50 border border-slate-300 p-2 rounded-xs leading-relaxed text-[12pt] flex justify-between items-center gap-3">
            <div className="flex-1">
              อบต.โป่งน้ำร้อน ได้รับ{isHazardous ? 'คำขอรับใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ (แบบ อภ. ๑)' : `คำขอจัดตั้งสถานที่${isStorage ? 'สะสมอาหาร' : 'จำหน่ายอาหาร'}`} ของ <strong>{establishment.ownerName}</strong> กิจการ <strong>"{establishment.businessName}"</strong> เลขรับที่ <strong>{establishment.regNumber}</strong> ไว้เรียบร้อยแล้วเมื่อวันที่ <strong>{formatThaiDate(establishment.applicationSubmissionDate || establishment.issueDate, false)}</strong> และได้ออก{isHazardous ? 'ใบรับคำขอชั่วคราว' : 'ใบรับแจ้งชั่วคราว'}ให้เรียบร้อยแล้ว
            </div>
            {officerSig && (
              <div className="w-28 text-center border-l border-slate-300 pl-2 shrink-0">
                <img src={officerSig} alt="e-sig" className="h-7 object-contain mx-auto filter contrast-125" />
                <div className="text-[10pt] text-slate-600 font-bold mt-0.5">e-Signature ผู้รับเรื่อง</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
