import React from 'react';
import type { Establishment, SystemSettings } from '../../../types/publicHealth';
import { renderCitizenIdBoxes, formatThaiDate, parseAddressDetails } from './printHelpers';

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
  const districtName = settings.district || 'อำเภอฝาง';
  const provinceName = settings.province || 'จังหวัดเชียงใหม่';
  const parsedAddress = parseAddressDetails(establishment.address, establishment.village);

  const regType = establishment.regType || '';
  const isHazardous = regType === 'บทส' || establishment.category === 'hazardous';
  const isStorage = !isHazardous && (establishment.foodPlaceType === 'storage');

  return (
    <div
      id="printable-application-form"
      className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-10 sm:p-14 shadow-2xl border border-slate-300 print:shadow-none print:border-none print:w-full print:max-w-none print:p-6 print:m-0 flex flex-col justify-between font-serif relative overflow-hidden"
      style={{ fontFamily: "'Sarabun', 'TH Sarabun New', serif" }}
    >
      <div className="relative z-10">
        {/* Form Code Header */}
        <div className="flex justify-between items-start text-xs text-slate-700 mb-1">
          <div>
            <div>เลขรับคำขอ: <span className="font-mono font-bold border-b border-dotted border-slate-600 px-2">{establishment.regNumber}</span></div>
            <div className="mt-0.5">วันที่รับเรื่อง: <span className="font-mono border-b border-dotted border-slate-600 px-2">{formatThaiDate(establishment.applicationSubmissionDate || establishment.issueDate, false)}</span></div>
          </div>
          <div className="text-right">
            <span className="font-bold border border-slate-700 px-2.5 py-0.5 rounded-xs text-xs">
              {applicationCode}
            </span>
          </div>
        </div>

        {/* Title Header */}
        <div className="text-center my-2">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-snug whitespace-pre-line">
            {applicationTitle}
          </h1>
          <p className="text-xs text-slate-700 mt-1">
            วันที่ <span className="border-b border-dotted border-slate-700 px-4 font-mono">{formatThaiDate(establishment.applicationSubmissionDate || establishment.issueDate, false)}</span>
          </p>
        </div>

        {/* Body Content */}
        <div className="text-[12.5px] leading-relaxed text-slate-900 space-y-2 mt-3">
          {/* 1. Applicant Section */}
          <div>
            <div className="font-bold">
              {isHazardous ? '๑. ข้อมูลผู้ขอรับใบอนุญาต/ต่ออายุใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ' : `๑. ชื่อผู้ขอจัดตั้งสถานที่${isStorage ? 'สะสมอาหาร' : 'จำหน่ายอาหาร'}`}
            </div>
            <div className="pl-4 mt-0.5 leading-relaxed">
              ข้าพเจ้า{' '}
              <span className="font-bold border-b border-dotted border-slate-700 px-2">{establishment.ownerName}</span>{' '}
              อายุ <span className="border-b border-dotted border-slate-700 px-1.5 font-mono">๓๕</span> ปี สัญชาติ{' '}
              <span className="border-b border-dotted border-slate-700 px-1.5">ไทย</span>
              <div className="mt-1 flex items-center gap-2">
                <span>เลขหมายประจำตัวประชาชน เลขที่</span>
                {renderCitizenIdBoxes(establishment.citizenId)}
              </div>
              <div className="mt-0.5">
                อยู่บ้านเลขที่ <span className="border-b border-dotted border-slate-700 px-2">{parsedAddress.houseNo}</span>{' '}
                {parsedAddress.fullVillageDisplay} ตำบล/แขวง <span className="border-b border-dotted border-slate-700 px-1.5">โป่งน้ำร้อน</span>{' '}
                อำเภอ/เขต <span className="border-b border-dotted border-slate-700 px-1.5">{districtName.replace('อำเภอ', '')}</span>{' '}
                จังหวัด <span className="border-b border-dotted border-slate-700 px-1.5">{provinceName.replace('จังหวัด', '')}</span>{' '}
                โทรศัพท์ <span className="border-b border-dotted border-slate-700 px-1.5 font-mono">{establishment.phone}</span>{' '}
                โทรสาร <span className="border-b border-dotted border-slate-700 px-1.5">{establishment.fax || '-'}</span>
              </div>
            </div>
          </div>

          {/* 2. Business Details */}
          <div>
            <div className="font-bold">๒. ข้อมูลสถานประกอบกิจการ</div>
            <div className="pl-4 space-y-0.5 mt-0.5">
              <div>
                ชื่อสถานประกอบกิจการ:{' '}
                <span className="font-bold text-sm border-b border-dotted border-slate-700 px-2 text-blue-950">
                  "{establishment.businessName}"
                </span>
              </div>

              {isHazardous ? (
                <>
                  <div>
                    ประเภทกิจการที่เป็นอันตรายต่อสุขภาพ:{' '}
                    <span className="font-bold border-b border-dotted border-slate-700 px-2 text-slate-900">
                      {establishment.categoryName || 'กิจการที่เกี่ยวกับปิโตรเลียม ถ่านหิน สารเคมี (การจำหน่ายน้ำมันเชื้อเพลิงตู้หยอดเหรียญ)'}
                    </span>
                  </div>
                  <div>
                    ลักษณะของสถานที่ประกอบกิจการ:{' '}
                    <span className="border-b border-dotted border-slate-700 px-2">
                      {establishment.premiseCharacteristics || 'อาคารพาณิชย์/ติดตั้งตู้จ่ายน้ำมันเชื้อเพลิงอัตโนมัติชนิดหยอดเหรียญและธนบัตร'}
                    </span>
                  </div>
                  <div>
                    มีพื้นที่ประกอบกิจการ:{' '}
                    <span className="font-bold font-mono border-b border-dotted border-slate-700 px-2">
                      {establishment.areaSqm}
                    </span>{' '}
                    ตารางเมตร จำนวนคนงาน:{' '}
                    <span className="font-bold font-mono border-b border-dotted border-slate-700 px-2">
                      {establishment.workerCount}
                    </span>{' '}
                    คน กำลังเครื่องจักร:{' '}
                    <span className="font-bold font-mono border-b border-dotted border-slate-700 px-2">
                      {establishment.machineHorsepower || '-'}
                    </span>{' '}
                    แรงม้า
                  </div>
                  <div>
                    เวลาทำการ:{' '}
                    <span className="border-b border-dotted border-slate-700 px-2 font-mono">
                      {establishment.operatingHours || 'ตลอด ๒๔ ชั่วโมง (ระบบอัตโนมัติ)'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    {isStorage ? 'ประเภทของอาหารที่สะสมเพื่อจำหน่าย (เช่น อาหารสด อาหารแห้ง):' : 'ประเภทของอาหารที่จำหน่าย (เช่น อาหารปรุงสำเร็จ เครื่องดื่ม):'}{' '}
                    <span className="font-bold border-b border-dotted border-slate-700 px-2">
                      {establishment.foodTypeDetail || (isStorage ? 'อาหารแห้ง และสินค้าเกษตรแปรรูป' : 'อาหารปรุงสำเร็จ และเครื่องดื่ม')}
                    </span>
                  </div>
                  <div>
                    ลักษณะของสถานที่ประกอบกิจการ ({isStorage ? 'เช่น อยู่ในอาคาร ซุ้ม/แผง' : 'เช่น อยู่ในอาคาร บนยานพาหนะ Food truck'}):{' '}
                    <span className="border-b border-dotted border-slate-700 px-2">
                      {establishment.premiseCharacteristics || (isStorage ? 'อยู่ในอาคารโกดัง' : 'อยู่ในอาคารพาณิชย์')}
                    </span>
                  </div>
                  <div>
                    วิธีการจำหน่าย ({isStorage ? 'เช่น มีบริการจัดส่งถึงบ้าน' : 'เช่น มีโต๊ะเก้าอี้ไว้ให้บริการ ให้ลูกค้าซื้อกลับไปบริโภคที่บ้าน'}):{' '}
                    <span className="border-b border-dotted border-slate-700 px-2">
                      {establishment.distributionMethod || (isStorage ? 'จำหน่ายส่งและมีบริการจัดส่ง' : 'มีโต๊ะเก้าอี้ไว้ให้บริการ')}
                    </span>
                  </div>
                  <div>
                    ช่วงเวลาที่จำหน่าย:{' '}
                    <span className="border-b border-dotted border-slate-700 px-2 font-mono">
                      {establishment.operatingHours || '๐๗:๐๐ - ๑๙:๐๐ น.'}
                    </span>{' '}
                    มีพื้นที่:{' '}
                    <span className="font-bold font-mono border-b border-dotted border-slate-700 px-2">
                      {establishment.areaSqm}
                    </span>{' '}
                    ตารางเมตร (ไม่เกิน ๒๐๐ ตร.ม.){' '}
                    {isStorage ? 'จำนวนคนงาน:' : 'จำนวนคนงาน/ผู้สัมผัสอาหาร:'}{' '}
                    <span className="font-bold font-mono border-b border-dotted border-slate-700 px-2">
                      {establishment.workerCount}
                    </span>{' '}
                    คน
                  </div>
                </>
              )}

              <div>
                สถานที่ตั้ง: เลขที่{' '}
                <span className="border-b border-dotted border-slate-700 px-2">{parsedAddress.houseNo}</span>{' '}
                {parsedAddress.fullVillageDisplay} ตำบลโป่งน้ำร้อน {districtName} {provinceName} โทรศัพท์{' '}
                <span className="font-mono border-b border-dotted border-slate-700 px-1.5">{establishment.phone}</span>{' '}
                อีเมล <span className="border-b border-dotted border-slate-700 px-1.5">{establishment.email || '-'}</span>{' '}
                ID: Line <span className="border-b border-dotted border-slate-700 px-1.5 font-bold text-emerald-800">{establishment.lineId || '-'}</span>
              </div>
            </div>
          </div>

          {/* 3. Document Checklist */}
          <div>
            <div className="font-bold">๓. พร้อมคำขอนี้ ข้าพเจ้าได้แนบเอกสารหลักฐานต่าง ๆ มาด้วยแล้ว ดังนี้:</div>
            <div className="pl-4 grid grid-cols-1 sm:grid-cols-2 gap-0.5 mt-0.5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-emerald-700">☑</span>
                <span>หนังสือมอบอำนาจ (ในกรณีที่มีการมอบอำนาจ)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-emerald-700">☑</span>
                <span>หลักฐานรับรองการจดทะเบียนเป็นนิติบุคคล (ถ้ามี)</span>
              </div>

              {isHazardous ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-emerald-700">☑</span>
                    <span>สำเนาบัตรประจำตัวประชาชน / ทะเบียนบ้านของผู้ขอรับใบอนุญาต</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-emerald-700">☑</span>
                    <span>แผนผังแสดงที่ตั้งสถานประกอบกิจการและอาคารข้างเคียง</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <span className="font-bold text-emerald-700">☑</span>
                    <span>สำเนาใบอนุญาตตามกฎหมายอื่นที่เกี่ยวข้อง (กรมธุรกิจพลังงาน/ควบคุมอาคาร)</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <span className="font-bold text-emerald-700">☑</span>
                    <span>แบบตรวจประเมินสุขลักษณะสถานประกอบกิจการที่เป็นอันตรายต่อสุขภาพ (ผลตรวจ ๙๕ คะแนน ผ่านเกณฑ์)</span>
                  </div>
                </>
              ) : (
                <>
                  {!isStorage && (
                    <div className="flex items-center gap-1.5 sm:col-span-2">
                      <span className="font-bold text-emerald-700">☑</span>
                      <span>
                        หลักฐานการผ่านการอบรมผู้ประกอบกิจการและผู้สัมผัสอาหาร (เลขที่ {establishment.foodHandlerCertNo || 'ผส.๖๗-๐๐๑๒'})
                        <span className="text-[10px] text-slate-500 ml-1">*(เชื่อมฐานข้อมูล ไม่ต้องยื่นซ้ำ)*</span>
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <span className="font-bold text-emerald-700">☑</span>
                    <span>สัญญาเช่าอาคารหรือสถานที่ใช้ในการจัดตั้งสถานที่{isStorage ? 'สะสมอาหาร' : 'จำหน่ายอาหาร'} (ถ้ามี)</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <span className="font-bold text-emerald-700">☑</span>
                    <span>
                      แบบตรวจประเมินตนเองตามมาตรฐานสุขาภิบาลอาหาร
                      {isStorage ? 'สถานที่สะสมอาหาร' : 'สถานที่จำหน่ายอาหารตามกฎกระทรวงสุขลักษณะของสถานที่จำหน่ายอาหาร พ.ศ. ๒๕๖๑'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-emerald-700">☑</span>
                    <span>หลักฐานการตรวจสุขภาพตามที่ราชการส่วนท้องถิ่นกำหนด</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 4. Consent & Affirmation */}
          <div className="pt-1">
            <div className="font-bold">๔. การยินยอมและการรับรอง:</div>
            <p className="indent-6 text-xs text-justify mt-0.5">
              ข้าพเจ้ายินยอมให้ องค์การบริหารส่วนตำบลโป่งน้ำร้อน ตรวจสอบเอกสารหลักฐานของทางราชการที่เกี่ยวข้องกับการขอรับ{isHazardous ? 'ใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ' : 'หนังสือรับรองการแจ้ง'}
            </p>
            <p className="indent-6 text-xs text-justify font-semibold mt-0.5">
              ขอรับรองว่าข้อความในคำขอนี้เป็นความจริงทุกประการ
            </p>
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="relative z-10 pt-3">
        <div className="flex justify-end">
          <div className="text-center w-64">
            <div className="text-xs text-slate-800 mb-8">
              (ลงชื่อ) .................................................... {isHazardous ? 'ผู้ขอรับใบอนุญาต' : 'ผู้ขอแจ้ง'}
            </div>
            <div className="font-bold text-sm text-slate-900">
              ( {establishment.ownerName} )
            </div>
          </div>
        </div>

        {/* Detachable Receipt Slip */}
        <div className="border-t-2 border-dashed border-slate-400 pt-2 mt-3 text-xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 mb-1">
            <span>(ส่วนฉีกให้ผู้ยื่นคำขอเก็บไว้เป็นหลักฐาน)</span>
            <span>ใบรับคำขอ {applicationCode}</span>
          </div>
          <div className="bg-slate-50 border border-slate-300 p-2 rounded-xs leading-relaxed text-[11px]">
            อบต.โป่งน้ำร้อน ได้รับ{isHazardous ? 'คำขอรับใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ (แบบ อภ.๑)' : `คำขอจัดตั้งสถานที่${isStorage ? 'สะสมอาหาร' : 'จำหน่ายอาหาร'}`} ของ <strong>{establishment.ownerName}</strong> กิจการ <strong>"{establishment.businessName}"</strong> เลขรับที่ <strong>{establishment.regNumber}</strong> ไว้เรียบร้อยแล้วเมื่อวันที่ <strong>{formatThaiDate(establishment.applicationSubmissionDate || establishment.issueDate, false)}</strong> และได้ออก{isHazardous ? 'ใบรับคำขอชั่วคราว' : 'ใบรับแจ้งชั่วคราว'}ให้เรียบร้อยแล้ว
          </div>
        </div>
      </div>
    </div>
  );
};
