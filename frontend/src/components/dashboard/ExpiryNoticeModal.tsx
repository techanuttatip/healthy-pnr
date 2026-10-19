import React, { useState, useMemo } from 'react';
import type { Establishment } from '../../types/publicHealth';
import {
  AlertTriangle,
  Printer,
  X,
  Search,
  Calendar,
  FileText,
  Clock,
  Building,
  CheckCircle2,
  Copy,
  Check,
  Send,
  Download
} from 'lucide-react';
import { OFFICIAL_NWK_SIGNATURE_DATA_URL } from '../../constants/officialSignature';

interface ExpiryNoticeModalProps {
  establishments: Establishment[];
  isOpen: boolean;
  onClose: () => void;
  initialEstablishment?: Establishment | null;
  officerName?: string;
  officerPosition?: string;
  signatureUrl?: string;
}

export const ExpiryNoticeModal: React.FC<ExpiryNoticeModalProps> = ({
  establishments,
  isOpen,
  onClose,
  initialEstablishment,
  officerName = 'นางสาวรุ่งทิวา อุปนันท์',
  officerPosition = 'นักวิชาการสาธารณสุขปฏิบัติการ',
  signatureUrl = OFFICIAL_NWK_SIGNATURE_DATA_URL
}) => {
  const [selectedEst, setSelectedEst] = useState<Establishment | null>(() => {
    return initialEstablishment || null;
  });
  const [filterMode, setFilterMode] = useState<'all' | 'expired' | 'urgent30' | 'warning60'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedNotice, setCopiedNotice] = useState(false);

  // Helper to calculate days remaining until expiry
  const calculateDaysRemaining = (expiryDateStr?: string) => {
    if (!expiryDateStr) return 999;
    try {
      let d = new Date(expiryDateStr);
      // If date is invalid or in Thai Buddhist year (e.g. 2568)
      if (isNaN(d.getTime())) {
        const parts = expiryDateStr.split(/[-/]/);
        if (parts.length === 3) {
          let y = parseInt(parts[0], 10);
          if (y > 2400) y -= 543;
          d = new Date(y, parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        }
      }
      const now = new Date();
      const diffTime = d.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 999;
    }
  };

  // Filter establishments that are expired or expiring within 60 days
  const expiringEstablishments = useMemo(() => {
    return establishments
      .map((e) => {
        const days = calculateDaysRemaining(e.expiryDate);
        return {
          ...e,
          daysRemaining: days
        };
      })
      .filter((e) => {
        // Either status is marked expiring/expired, or days remaining <= 60
        const isExpiringState =
          e.status === 'expiring' ||
          e.permitStatus === 'ใกล้หมดอายุ' ||
          e.permitStatus === 'หมดอายุ' ||
          e.daysRemaining <= 60;
        if (!isExpiringState) return false;

        if (filterMode === 'expired') {
          return e.daysRemaining <= 0 || e.permitStatus === 'หมดอายุ';
        }
        if (filterMode === 'urgent30') {
          return e.daysRemaining > 0 && e.daysRemaining <= 30;
        }
        if (filterMode === 'warning60') {
          return e.daysRemaining > 30 && e.daysRemaining <= 60;
        }
        return true;
      })
      .filter((e) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          e.businessName.toLowerCase().includes(q) ||
          e.ownerName.toLowerCase().includes(q) ||
          (e.village || '').toLowerCase().includes(q) ||
          (e.regNumber || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [establishments, filterMode, searchQuery]);

  // Set default selected establishment if none chosen
  React.useEffect(() => {
    if (!selectedEst && expiringEstablishments.length > 0) {
      setSelectedEst(expiringEstablishments[0]);
    }
  }, [expiringEstablishments, selectedEst]);

  if (!isOpen) return null;

  const currentEst = selectedEst || expiringEstablishments[0];

  const handlePrintNotice = () => {
    window.print();
  };

  const handleCopyNoticeText = () => {
    if (!currentEst) return;
    const text = `[หนังสือแจ้งเตือนต่ออายุใบอนุญาตราชการ]\nเรียน ${currentEst.ownerName} (${currentEst.businessName})\nอบต.โป่งน้ำร้อน ขอแจ้งเตือนว่าใบอนุญาตเลขที่ ${currentEst.regNumber} จะสิ้นอายุในวันที่ ${currentEst.expiryDate || 'ตามที่กำหนด'}\nขอความกรุณาติดต่อยื่นต่ออายุและชำระค่าธรรมเนียม ณ กองสาธารณสุข อบต.โป่งน้ำร้อน ล่วงหน้า 30 วัน โทร 053-010-555 ต่อ 12`;
    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  const todayThai = new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-3.5 bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
              <AlertTriangle className="w-4 h-4 text-amber-200" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
                <span>เรดาร์แจ้งเตือนใบอนุญาตใกล้หมดอายุ & ออกหนังสือราชการ</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                  พบ {expiringEstablishments.length} แห่ง
                </span>
              </h3>
              <p className="text-[11px] text-amber-100">
                ระบบสแกนและพิมพ์หนังสือแจ้งเตือนต่ออายุตาม พ.ร.บ. การสาธารณสุข พ.ศ. ๒๕๓๕ พร้อมตราครุฑ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Left List + Right Official Letter Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Expiring Establishments List */}
          <div className="w-80 md:w-96 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
            {/* Filter Chips */}
            <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-center transition-all cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ทั้งหมด ({expiringEstablishments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('urgent30')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-center transition-all cursor-pointer ${
                    filterMode === 'urgent30'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  &lt; 30 วัน
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('expired')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-center transition-all cursor-pointer ${
                    filterMode === 'expired'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  สิ้นอายุแล้ว
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาร้านค้า, เจ้าของ, หมู่บ้าน..."
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {expiringEstablishments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  ไม่พบสถานประกอบการในเงื่อนไขนี้
                </div>
              ) : (
                expiringEstablishments.map((est) => {
                  const isSelected = currentEst?.id === est.id;
                  const isExpired = est.daysRemaining <= 0;
                  const isUrgent = est.daysRemaining > 0 && est.daysRemaining <= 30;

                  return (
                    <div
                      key={est.id}
                      onClick={() => setSelectedEst(est)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-50/90 border-amber-400 shadow-xs ring-1 ring-amber-400/30'
                          : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="font-bold line-clamp-1 text-slate-900">
                          {est.businessName}
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                            isExpired
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : isUrgent
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}
                        >
                          {isExpired ? 'สิ้นอายุแล้ว' : `อีก ${est.daysRemaining} วัน`}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                        <span>{est.ownerName}</span>
                        <span>{est.village}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        สิ้นอายุ: {est.expiryDate || '๓๑ ธันวาคม ๒๕๖๘'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Official Renewal Notice Letter (แบบหนังสือแจ้งเตือน ตราครุฑ A4) */}
          <div className="flex-1 bg-slate-100 p-4 overflow-y-auto flex flex-col items-center">
            {/* Action Bar for the Letter */}
            <div className="w-full max-w-[210mm] mb-3 flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">
                  แบบหนังสือแจ้งเตือนราชการ (นจ.ต่ออายุ)
                </span>
                <span className="text-[11px] text-slate-500">
                  {currentEst ? currentEst.businessName : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyNoticeText}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="คัดลอกข้อความสรุปส่ง LINE / SMS"
                >
                  {copiedNotice ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedNotice ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintNotice}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์หนังสือราชการ (A4)</span>
                </button>
              </div>
            </div>

            {/* Official Notice Paper (A4 Style) */}
            {currentEst ? (
              <div
                id="official-notice-print-area"
                className="w-full max-w-[210mm] bg-white shadow-xl rounded-sm p-10 md:p-14 border border-slate-300 text-slate-900 font-serif leading-relaxed text-[13.5px] print:shadow-none print:border-none print:p-0 print:m-0"
                style={{ fontFamily: "'Sarabun', 'TH Sarabun New', serif" }}
              >
                {/* Garuda Seal */}
                <div className="flex justify-center mb-4">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Garuda_Embarkment_of_Thailand.svg/200px-Garuda_Embarkment_of_Thailand.svg.png"
                    alt="ตราครุฑ"
                    className="w-16 h-18 object-contain"
                  />
                </div>

                {/* Letter Header */}
                <div className="flex justify-between items-start text-xs mb-6">
                  <div>
                    <div>ที่ ชม ๗๕๙๐๓/ว ๑๐๘/๒๕๖๙</div>
                  </div>
                  <div className="text-right">
                    <div>ที่ทำการองค์การบริหารส่วนตำบลโป่งน้ำร้อน</div>
                    <div>อำเภอฝาง จังหวัดเชียงใหม่ ๕๐๑๑๐</div>
                  </div>
                </div>

                <div className="text-right mb-6 text-xs">
                  <div>{todayThai}</div>
                </div>

                {/* Subject & Recipient */}
                <div className="space-y-1.5 mb-6 text-xs">
                  <div>
                    <span className="font-bold">เรื่อง </span>
                    <span>แจ้งเตือนการต่ออายุใบอนุญาต/หนังสือรับรองการแจ้งประกอบกิจการตามพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕</span>
                  </div>
                  <div>
                    <span className="font-bold">เรียน </span>
                    <span>ผู้ประกอบกิจการ ({currentEst.ownerName}) ร้าน &ldquo;{currentEst.businessName}&rdquo;</span>
                  </div>
                  <div>
                    <span className="font-bold">อ้างถึง </span>
                    <span>ใบอนุญาต/หนังสือรับรองการแจ้ง เลขที่ {currentEst.regNumber}</span>
                  </div>
                </div>

                {/* Letter Body */}
                <div className="text-justify space-y-4 text-xs leading-6 indent-8">
                  <p>
                    ตามที่ท่านได้รับใบอนุญาต/หนังสือรับรองการแจ้งให้ดำเนินกิจการประเภท{' '}
                    <span className="font-bold">{currentEst.regType || 'สถานที่จำหน่ายอาหาร'}</span> ในชื่อสถานประกอบกิจการ{' '}
                    <span className="font-bold">&ldquo;{currentEst.businessName}&rdquo;</span> ตั้งอยู่เลขที่{' '}
                    {currentEst.address || '-'} {currentEst.village} ตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่ โดยใบอนุญาตดังกล่าวมีกำหนดจะสิ้นอายุลงในวันที่{' '}
                    <span className="font-bold text-red-700 underline">{currentEst.expiryDate || '๓๑ ธันวาคม ๒๕๖๘'}</span> นั้น
                  </p>

                  <p>
                    เพื่อให้การประกอบกิจการของท่านเป็นไปด้วยความถูกต้องตามพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕ และที่แก้ไขเพิ่มเติม และข้อบัญญัติองค์การบริหารส่วนตำบลโป่งน้ำร้อน งานสุขาภิบาลและอนามัยสิ่งแวดล้อม กองสาธารณสุข จึงขอแจ้งเตือนให้ท่านมายื่นคำขอต่ออายุใบอนุญาต (แบบ บท.๓) ล่วงหน้าอย่างน้อย ๓๐ วันก่อนวันสิ้นอายุ พร้อมชำระค่าธรรมเนียมประกอบกิจการประจำปี ณ ที่ทำการองค์การบริหารส่วนตำบลโป่งน้ำร้อน ในวันและเวลาราชการ
                  </p>

                  <p className="indent-0">
                    <span className="font-bold">เอกสารและหลักฐานที่ต้องนำมาแสดงในการยื่นต่ออายุ:</span>
                  </p>
                  <ol className="list-decimal pl-8 space-y-1 indent-0">
                    <li>ใบอนุญาตหรือหนังสือรับรองการแจ้งฉบับเดิม (ตัวจริง)</li>
                    <li>สำเนาบัตรประจำตัวประชาชนและสำเนาทะเบียนบ้านของผู้ประกอบการ (รับรองสำเนาถูกต้อง)</li>
                    <li>ใบรับรองแพทย์ของผู้ประกอบการและผู้สัมผัสอาหารทุกคน (ตรวจสุขภาพประจำปี)</li>
                    <li>วุฒิบัตรหรือหนังสือรับรองผ่านการอบรมหลักสูตรสุขาภิบาลอาหารตามเกณฑ์กรมอนามัย</li>
                    <li>แผนผังและรูปถ่ายการปรับปรุงสุขลักษณะสถานที่ (ถ้ามี)</li>
                  </ol>

                  <p>
                    อนึ่ง หากท่านไม่มายื่นคำขอต่ออายุใบอนุญาตภายในกำหนดเวลาดังกล่าว ท่านจะต้องเสียค่าปรับตามที่กฎหมายบัญญัติไว้ในอัตราร้อยละ ๒๐ ของจำนวนเงินค่าธรรมเนียมที่ค้างชำระ และหากประกอบกิจการโดยไม่มีใบอนุญาตต่อไป จะมีโทษจำคุกไม่เกิน ๖ เดือน หรือปรับไม่เกิน ๕๐,๐๐๐ บาท หรือทั้งจำทั้งปรับ ตามมาตรา ๗๑ แห่งพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕
                  </p>

                  <p>
                    จึงเรียนมาเพื่อโปรดทราบและดำเนินการต่อไป
                  </p>
                </div>

                {/* Sign-off */}
                <div className="mt-8 flex justify-end">
                  <div className="text-center w-64 space-y-1">
                    <div className="text-xs">ขอแสดงความนับถือ</div>
                    <div className="h-16 flex items-center justify-center my-1">
                      {signatureUrl ? (
                        <img src={signatureUrl} alt="ลายมือชื่อ" className="max-h-14 object-contain" />
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">(ลงลายมือชื่อ)</div>
                      )}
                    </div>
                    <div className="text-xs font-bold">({officerName})</div>
                    <div className="text-[11px] text-slate-600">{officerPosition}</div>
                    <div className="text-[11px] text-slate-500">
                      ปฏิบัติราชการแทน นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน
                    </div>
                  </div>
                </div>

                {/* Footer Notes */}
                <div className="mt-10 pt-4 border-t border-slate-200 text-[10.5px] text-slate-500 space-y-0.5">
                  <div>กองสาธารณสุขและสิ่งแวดล้อม</div>
                  <div>งานสุขาภิบาลและอนามัยสิ่งแวดล้อม โทร. ๐๕๓-๐๑๐-๕๕๕ ต่อ ๑๒</div>
                  <div>ศูนย์บริการสาธารณสุขดิจิทัล อบต.โป่งน้ำร้อน: https://health.pongnamron.go.th</div>
                </div>
              </div>
            ) : (
              <div className="m-auto text-slate-400 text-xs">
                กรุณาเลือกสถานประกอบการจากรายการทางซ้าย
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
