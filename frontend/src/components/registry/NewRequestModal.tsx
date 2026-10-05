import React, { useState, useEffect } from 'react';
import {
  X,
  UtensilsCrossed,
  Store,
  Factory,
  ShoppingBag,
  Truck,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import type { OfficialFormCode } from '../../types/publicHealth';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectForm: (code: OfficialFormCode | string) => void;
}

interface ServiceOption {
  code: OfficialFormCode | string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  category: 'new' | 'renew' | 'other';
  feeNote: string;
  validityNote: string;
}

export const NewRequestModal: React.FC<NewRequestModalProps> = ({
  isOpen,
  onClose,
  onSelectForm
}) => {
  const [activeTab, setActiveTab] = useState<'new' | 'renew'>('new');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const services: ServiceOption[] = [
    {
      code: 'นจ.1',
      badge: 'แบบ นจ.๑',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-300',
      title: 'สถานที่จำหน่ายอาหาร / สะสมอาหาร (≤ ๒๐๐ ตร.ม.)',
      subtitle: 'การแจ้งจัดตั้งตามมาตรา ๓๘',
      description: 'สำหรับร้านอาหารทั่วไป คาเฟ่ ร้านก๋วยเตี๋ยว แผงอาหาร ที่มีพื้นที่ไม่เกิน 200 ตร.ม.',
      icon: <UtensilsCrossed className="w-5 h-5 text-teal-700" />,
      category: 'new',
      feeNote: 'ค่าธรรมเนียม ๕๐๐ - ๑,๐๐๐ บาท/ปี',
      validityNote: 'หนังสือรับรองการแจ้ง (แบบ นจ.๓)'
    },
    {
      code: 'บทอ.1',
      badge: 'แบบ บทอ.๑',
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-300',
      title: 'สถานที่จำหน่ายอาหาร / สะสมอาหาร (> ๒๐๐ ตร.ม.)',
      subtitle: 'คำขอรับใบอนุญาตตามมาตรา ๓๘',
      description: 'สำหรับภัตตาคาร สวนอาหาร ห้องอาหารโรงแรม หรือศูนย์อาหารขนาดเกิน 200 ตร.ม.',
      icon: <Store className="w-5 h-5 text-sky-700" />,
      category: 'new',
      feeNote: 'ค่าธรรมเนียม ๓,๐๐๐ บาท/ปี',
      validityNote: 'ใบอนุญาตมีอายุ ๑ ปี (แบบ บทอ.)'
    },
    {
      code: 'บทส.1',
      badge: 'แบบ บทส.๑',
      badgeColor: 'bg-amber-50 text-amber-900 border-amber-300',
      title: 'กิจการที่เป็นอันตรายต่อสุขภาพ (๑๔๐+ ประเภท)',
      subtitle: 'คำขอรับใบอนุญาตตามมาตรา ๓๑, ๓๒',
      description: 'โรงอบผลไม้/กระเทียม, อู่เคาะพ่นสี, ฟาร์มปศุสัตว์, โรงสีข้าว, โรงกลึง, กิจการคัดแยกขยะ',
      icon: <Factory className="w-5 h-5 text-amber-700" />,
      category: 'new',
      feeNote: 'ค่าธรรมเนียมตามแรงม้า/จำนวนคน (๕๐๐ - ๑๐,๐๐๐ บาท)',
      validityNote: 'ใบอนุญาตมีอายุ ๑ ปี (แบบ บทส.)'
    },
    {
      code: 'อส.1',
      badge: 'แบบ อส.๑',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      title: 'การจัดตั้งตลาดประเภทที่ ๑ และ ๒',
      subtitle: 'คำขอรับใบอนุญาตตามมาตรา ๓๔',
      description: 'ตลาดสดถาวรมีโครงสร้างอาคาร หรือตลาดนัดชุมชนที่จัดเป็นประจำ',
      icon: <Store className="w-5 h-5 text-emerald-700" />,
      category: 'new',
      feeNote: 'ค่าธรรมเนียม ๒,๕๐๐ - ๕,๐๐๐ บาท/ปี',
      validityNote: 'ใบอนุญาตมีอายุ ๑ ปี (แบบ อส.)'
    },
    {
      code: 'นส.1',
      badge: 'แบบ นส.๑',
      badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-300',
      title: 'จำหน่ายสินค้าในที่หรือทางสาธารณะ (หาบเร่ แผงลอย)',
      subtitle: 'คำขอรับใบอนุญาตตามมาตรา ๔๑',
      description: 'แผงลอยจำหน่ายผลไม้ อาหาร หรือสินค้าในจุดผ่อนผันของ อปท.',
      icon: <ShoppingBag className="w-5 h-5 text-cyan-700" />,
      category: 'new',
      feeNote: 'ค่าธรรมเนียม ๑๐๐ - ๕๐๐ บาท/ปี',
      validityNote: 'ใบอนุญาตมีอายุ ๑ ปี (แบบ นส.)'
    },
    {
      code: 'ปป.1',
      badge: 'แบบ ปป.๑',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
      title: 'รับทำการเก็บ ขน หรือกำจัดสิ่งปฏิกูล/มูลฝอย',
      subtitle: 'คำขอรับใบอนุญาตตามมาตรา ๑๙',
      description: 'ผู้ประกอบการเอกชนรับสูบส้วม กำจัดขยะอันตราย หรือมูลฝอยติดเชื้อ',
      icon: <Truck className="w-5 h-5 text-purple-700" />,
      category: 'new',
      feeNote: 'ค่าธรรมเนียม ๒,๐๐๐ - ๕,๐๐๐ บาท/ปี',
      validityNote: 'ใบอนุญาตมีอายุ ๑ ปี (แบบ ปป.)'
    },

    // Renew category
    {
      code: 'บทส.2',
      badge: 'แบบ บทส.๒',
      badgeColor: 'bg-amber-50 text-amber-900 border-amber-300',
      title: 'ขอต่ออายุใบอนุญาตกิจการอันตรายต่อสุขภาพ',
      subtitle: 'ยื่นคำขอล่วงหน้าก่อนใบอนุญาตเดิมสิ้นอายุ (มาตรา ๓๑, ๓๒)',
      description: 'ดึงข้อมูลเดิมจากทะเบียนคุม ปรับปรุงข้อมูลสุขลักษณะ และออกใบอนุญาตต่ออายุอีก ๑ ปี',
      icon: <RotateCcw className="w-5 h-5 text-amber-700" />,
      category: 'renew',
      feeNote: 'ชำระค่าธรรมเนียมประจำปีตามอัตราเดิม',
      validityNote: 'ต่ออายุครั้งละ ๑ ปี'
    },
    {
      code: 'บทอ.2',
      badge: 'แบบ บทอ.๒',
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-300',
      title: 'ขอต่ออายุใบอนุญาตสถานที่จำหน่ายอาหาร (> ๒๐๐ ตร.ม.)',
      subtitle: 'ยื่นคำขอล่วงหน้าก่อนใบอนุญาตเดิมสิ้นอายุ (มาตรา ๓๘)',
      description: 'ตรวจสอบผลตรวจสุขลักษณะย้อนหลัง สุขภาพผู้สัมผัสอาหาร และออกใบอนุญาตต่ออายุ',
      icon: <RotateCcw className="w-5 h-5 text-sky-700" />,
      category: 'renew',
      feeNote: 'ชำระค่าธรรมเนียมประจำปี ๓,๐๐๐ บาท',
      validityNote: 'ต่ออายุครั้งละ ๑ ปี'
    },
    {
      code: 'ยล.1',
      badge: 'แบบ ยล.๑',
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-300',
      title: 'คำขอเลิกกิจการ / โอนใบอนุญาต / เปลี่ยนผู้ดำเนินกิจการ',
      subtitle: 'การเปลี่ยนแปลงสถานะทะเบียนตามระเบียบ',
      description: 'บันทึกการส่งคืนใบอนุญาต การปิดกิจการถาวร หรือการโอนสิทธิ์ให้ทายาท/ผู้รับโอน',
      icon: <RotateCcw className="w-5 h-5 text-rose-700" />,
      category: 'renew',
      feeNote: 'ค่าธรรมเนียมคำขอ ๕๐ - ๑๐๐ บาท',
      validityNote: 'สลักหลังหรือออกหนังสืออนุญาตใหม่'
    }
  ];

  const filteredServices = services.filter((s) => s.category === activeTab);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-request-modal-title"
        className="bg-white border border-slate-300 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-800"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-amber-400 bg-white shadow-sm shrink-0 flex items-center justify-center p-0.5">
              <img
                src="/pnr_logo.png"
                alt="ตราสัญลักษณ์ อบต.โป่งน้ำร้อน"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 id="new-request-modal-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>บันทึกรับคำขอใหม่ — งานสาธารณสุขและสิ่งแวดล้อม</span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  อบต.โป่งน้ำร้อน
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                เลือกแบบฟอร์มตาม พ.ร.บ. การสาธารณสุข พ.ศ. ๒๕๓๕ เพื่อเปิดบันทึกคำขอและดำเนินการทันที
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection: ขอรับใหม่ vs ขอต่ออายุ */}
        <div className="px-6 pt-3 pb-2 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'new'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>คำขอรับใหม่ / แจ้งจัดตั้ง (๖ บริการ)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('renew')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'renew'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>คำขอต่ออายุ / เลิก / โอนกิจการ (๓ บริการ)</span>
          </button>
        </div>

        {/* Cards Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 bg-slate-50">
          {filteredServices.map((service) => (
            <div
              key={service.code}
              onClick={() => {
                onSelectForm(service.code);
                onClose();
              }}
              className="group p-4 rounded-xl bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-md hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-blue-100 transition-colors">
                    {service.icon}
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${service.badgeColor}`}
                  >
                    {service.badge}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                  {service.title}
                </h3>
                <div className="text-[11px] text-blue-600 font-medium mt-0.5">
                  {service.subtitle}
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1 text-[11px]">
                <div className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{service.feeNote}</span>
                </div>
                <div className="text-slate-500 flex items-center justify-between mt-1">
                  <span className="text-[10px] truncate">{service.validityNote}</span>
                  <span className="text-blue-700 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                    เปิดแบบฟอร์ม <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>องค์การบริหารส่วนตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium transition-all cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
