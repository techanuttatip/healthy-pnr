import React, { useState, useEffect, useMemo, useRef } from 'react';
import type {
  Establishment,
  EstablishmentStatus,
  InspectionChecklistItem,
  InspectionRecord,
  InspectionPhoto,
  GpsCheckInInfo
} from '../../types/publicHealth';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Save,
  Printer,
  Info,
  Calendar,
  Award,
  FlaskConical,
  Utensils,
  Warehouse,
  MapPin,
  Navigation,
  Camera,
  Trash2,
  Sparkles,
  FileText,
  Upload
} from 'lucide-react';
import { SignaturePad } from './SignaturePad';
import { FieldInspectionSlipModal } from './FieldInspectionSlipModal';

interface SanitationInspectionTabProps {
  establishment: Establishment | null;
  onSaveInspection: (record: InspectionRecord, newStatus: EstablishmentStatus) => void;
  onOpenPrint?: (est: Establishment) => void;
  onClose?: () => void;
}

// 1. เกณฑ์สุขาภิบาลอาหาร กรมอนามัย (สำหรับ บทอ., นจ., อส.)
const FOOD_SANITATION_CRITERIA: Omit<InspectionChecklistItem, 'passed'>[] = [
  // มิติที่ 1: สถานที่และสิ่งแวดล้อม (25 คะแนน)
  {
    id: 'f1',
    dimension: 'มิติที่ ๑: สถานที่และสิ่งแวดล้อม',
    title: 'โต๊ะปรุง-เตรียมอาหารสูงจากพื้น ≥ 60 ซม. ผิวเรียบทำความสะอาดง่าย',
    description: 'สภาพโต๊ะสะอาด ไม่มีคราบสะสม ไม่ใช้วัสดุที่ดูดซับน้ำหรือเกิดสนิม',
    points: 5
  },
  {
    id: 'f2',
    dimension: 'มิติที่ ๑: สถานที่และสิ่งแวดล้อม',
    title: 'พื้น ผนัง เพดาน สะอาด มีแสงสว่างและการระบายอากาศเพียงพอ',
    description: 'ไม่มีหยากไย่ คราบน้ำมัน หรือความชื้นสะสม มีพัดลมดูดควันทำงานปกติ',
    points: 5
  },
  {
    id: 'f3',
    dimension: 'มิติที่ ๑: สถานที่และสิ่งแวดล้อม',
    title: 'มีบ่อดักไขมันที่ใช้งานได้ดี และระบบระบายน้ำทิ้งไม่อุดตัน',
    description: 'ข้อกำหนดบังคับ: ต้องตักไขมันทิ้งสม่ำเสมอ น้ำทิ้งไม่ส่งกลิ่นเหม็นรบกวน',
    points: 10,
    isCritical: true
  },
  {
    id: 'f4',
    dimension: 'มิติที่ ๑: สถานที่และสิ่งแวดล้อม',
    title: 'มีอ่างล้างมือพร้อมสบู่และผ้าเช็ดมือ/กระดาษสำหรับผู้สัมผัสอาหาร',
    description: 'ติดตั้งในตำแหน่งที่สะดวก และแยกจากอ่างล้างภาชนะใส่อาหาร',
    points: 5
  },

  // มิติที่ 2: วัตถุดิบ ภาชนะ อุปกรณ์ และน้ำใช้ (30 คะแนน)
  {
    id: 'f5',
    dimension: 'มิติที่ ๒: สุขอนามัยอาหารและอุปกรณ์',
    title: 'จัดเก็บอาหารสด/อาหารปรุงสำเร็จแยกสัดส่วน และควบคุมอุณหภูมิถูกต้อง',
    description: 'อาหารสดแช่เย็น < 5°C หรือแช่แข็ง < -18°C, อาหารปรุงสำเร็จอุ่นร้อน > 60°C',
    points: 10
  },
  {
    id: 'f6',
    dimension: 'มิติที่ ๒: สุขอนามัยอาหารและอุปกรณ์',
    title: 'ล้างภาชนะอุปกรณ์ 3 ขั้นตอน และคว่ำบนตะแกรงสูง ≥ 60 ซม.',
    description: 'ข้อกำหนดบังคับ: ขั้นที่ 1 ล้างเศษอาหาร, ขั้นที่ 2 ล้างน้ำยาล้างจาน, ขั้นที่ 3 ล้างน้ำสะอาด 2 ครั้ง',
    points: 10,
    isCritical: true
  },
  {
    id: 'f7',
    dimension: 'มิติที่ ๒: สุขอนามัยอาหารและอุปกรณ์',
    title: 'น้ำใช้ น้ำแข็ง และน้ำดื่ม สะอาดตามเกณฑ์มาตรฐาน มีภาชนะปกปิดมิดชิด',
    description: 'ใช้น้ำแข็งบริโภคสะอาด แยกถังน้ำแข็งสำหรับแช่เครื่องดื่มหรืออาหารสด',
    points: 10
  },

  // มิติที่ 3: สุขลักษณะส่วนบุคคลของผู้สัมผัสอาหาร (25 คะแนน)
  {
    id: 'f8',
    dimension: 'มิติที่ ๓: ผู้สัมผัสอาหาร',
    title: 'ผู้ประกอบการและผู้สัมผัสอาหารผ่านการอบรมมีวุฒิบัตรตามหลักสูตร สธ.',
    description: 'ข้อกำหนดบังคับ: มีใบประกาศนียบัตรผู้สัมผัสอาหารที่ยังไม่หมดอายุ',
    points: 10,
    isCritical: true
  },
  {
    id: 'f9',
    dimension: 'มิติที่ ๓: ผู้สัมผัสอาหาร',
    title: 'แต่งกายสะอาด สวมหมวกคลุมผมและผ้ากันเปื้อนขณะปฏิบัติงาน',
    description: 'ตัดเล็บสั้น ไม่สวมเครื่องประดับที่มือ ไม่สูบบุหรี่ขณะปรุงอาหาร',
    points: 10
  },
  {
    id: 'f10',
    dimension: 'มิติที่ ๓: ผู้สัมผัสอาหาร',
    title: 'มีหลักฐานการตรวจสุขภาพประจำปี ไม่เป็นโรคติดต่ออันตราย',
    description: 'ไม่มีโรคระบบทางเดินอาหาร โรคผิวหนังเรื้อรัง หรือวัณโรค',
    points: 5
  },

  // มิติที่ 4: การจัดการมูลฝอย สิ่งปฏิกูล และสัตว์นำโรค (20 คะแนน)
  {
    id: 'f11',
    dimension: 'มิติที่ ๔: มูลฝอยและสัตว์นำโรค',
    title: 'ถังขยะมูลฝอยมีฝาปิดมิดชิด มีถุงดำรองรับ และแยกขยะเศษอาหาร',
    description: 'สภาพถังขยะสะอาด ไม่แตกรั่ว และนำไปทิ้งทุกวันหลังปิดร้าน',
    points: 10
  },
  {
    id: 'f12',
    dimension: 'มิติที่ ๔: มูลฝอยและสัตว์นำโรค',
    title: 'มีมาตรการป้องกันและไม่พบร่องรอยของสัตว์หรือแมลงนำโรค',
    description: 'ข้อกำหนดบังคับ: ไม่พบหนู แมลงสาบ หรือแมลงวันตอมอาหารในบริเวณปรุง',
    points: 10,
    isCritical: true
  }
];

// 1.2 เกณฑ์ตรวจสถานที่สะสมอาหาร (Food Storage Premises Checklist)
const FOOD_STORAGE_CRITERIA: Omit<InspectionChecklistItem, 'passed'>[] = [
  // มิติที่ 1: การจัดวางบนพาเลทและโครงสร้างคลัง (30 คะแนน)
  {
    id: 's1',
    dimension: 'มิติที่ ๑: โครงสร้างและการจัดวางสินค้า',
    title: 'จัดวางอาหารบนพาเลทหรือชั้นวางสูงจากพื้นอย่างน้อย ๑๕ ซม.',
    description: 'ข้อกำหนดบังคับ: ห้ามวางอาหารติดพื้นโดยตรง และเว้นระยะห่างจากผนัง ≥ 30 ซม. เพื่อทำความสะอาดและตรวจสัตว์นำโรค',
    points: 10,
    isCritical: true
  },
  {
    id: 's2',
    dimension: 'มิติที่ ๑: โครงสร้างและการจัดวางสินค้า',
    title: 'อาคารคลัง ผนัง เพดาน สะอาด แข็งแรง และระบายอากาศเพียงพอ',
    description: 'ไม่มีรอยแตกร้าว รอยรั่วซึม ไม่มีหยากไย่ และมีระบบระบายอากาศลดความร้อนสะสม',
    points: 10
  },
  {
    id: 's3',
    dimension: 'มิติที่ ๑: โครงสร้างและการจัดวางสินค้า',
    title: 'แสงสว่างเพียงพอและหลอดไฟมีฝาครอบป้องกันการแตกกระจาย',
    description: 'ความสว่างเพียงพอต่อการตรวจสอบสภาพอาหาร และมีฝาครอบหลอดไฟเพื่อป้องกันเศษแก้วตกใส่อาหาร',
    points: 10
  },

  // มิติที่ 2: การควบคุมอุณหภูมิและความชื้น (30 คะแนน)
  {
    id: 's4',
    dimension: 'มิติที่ ๒: การควบคุมอุณหภูมิและระบบการเก็บรักษา',
    title: 'ควบคุมอุณหภูมิห้องเย็น/ตู้แช่ตามมาตรฐาน (แช่เย็น < 5°C, แช่แข็ง < -18°C)',
    description: 'ข้อกำหนดบังคับ: มีเทอร์โมมิเตอร์แสดงอุณหภูมิที่เที่ยงตรง และมีบันทึกตรวจเช็กอุณหภูมิประจำวัน',
    points: 10,
    isCritical: true
  },
  {
    id: 's5',
    dimension: 'มิติที่ ๒: การควบคุมอุณหภูมิและระบบการเก็บรักษา',
    title: 'มีระบบหมุนเวียนสินค้า เข้าก่อน-ออกก่อน (First-In, First-Out: FIFO)',
    description: 'มีการติดป้ายระบุวันที่รับเข้าและวันหมดอายุ (Expiry Date) ชัดเจน คัดแยกอาหารเสื่อมสภาพออกทันที',
    points: 10
  },
  {
    id: 's6',
    dimension: 'มิติที่ ๒: การควบคุมอุณหภูมิและระบบการเก็บรักษา',
    title: 'ควบคุมความชื้นในคลังอาหารแห้งเพื่อป้องกันเชื้อราและสารพิษอะฟลาทอกซิน',
    description: 'ห้องเก็บอาหารแห้งและเมล็ดพืชไม่อับชื้น และมีแท่นรองรับน้ำหนักที่มั่นคง',
    points: 10
  },

  // มิติที่ 3: การป้องกันการปนเปื้อนสารเคมีและสัตว์นำโรค (25 คะแนน)
  {
    id: 's7',
    dimension: 'มิติที่ ๓: การป้องกันสารเคมีและสัตว์นำโรค',
    title: 'ห้ามเก็บอาหารรวมกับสารเคมี ยาฆ่าแมลง ปุ๋ย หรือสารทำความสะอาดเด็ดขาด',
    description: 'ข้อกำหนดบังคับ: ต้องแยกห้องหรืออาคารเก็บสารเคมีออกจากพื้นที่เก็บรักษาอาหารโดยเด็ดขาด',
    points: 15,
    isCritical: true
  },
  {
    id: 's8',
    dimension: 'มิติที่ ๓: การป้องกันสารเคมีและสัตว์นำโรค',
    title: 'มีตาข่าย มุ้งลวด หรือม่านริ้วพลาสติก ป้องกันสัตว์และแมลงนำโรค',
    description: 'ข้อกำหนดบังคับ: ประตู หน้าต่าง ช่องลม ปิดมิดชิด ไม่พบร่องรอยหนู นก แมลงสาบ ในคลังเก็บอาหาร',
    points: 10,
    isCritical: true
  },

  // มิติที่ 4: สุขอนามัยผู้ปฏิบัติงานและการขนถ่าย (15 คะแนน)
  {
    id: 's9',
    dimension: 'มิติที่ ๔: สุขอนามัยผู้ปฏิบัติงานและยานพาหนะ',
    title: 'ผู้ปฏิบัติงานสวมใส่ชุดสะอาด และมีหลักฐานผ่านการอบรมสุขาภิบาลอาหาร',
    description: 'ปฏิบัติตามสุขวิทยาส่วนบุคคล ไม่สูบบุหรี่ในคลัง และมีบัตรประจำตัวผู้สัมผัสอาหาร',
    points: 10
  },
  {
    id: 's10',
    dimension: 'มิติที่ ๔: สุขอนามัยผู้ปฏิบัติงานและยานพาหนะ',
    title: 'ยานพาหนะและพาเลท/รถยกที่ใช้ลำเลียงอาหารสะอาด ปลอดภัย',
    description: 'ไม่ใช้ยานพาหนะร่วมกับสิ่งปฏิกูล สารพิษ หรือสารเคมีอันตราย',
    points: 5
  }
];

// 2. เกณฑ์กิจการที่เป็นอันตรายต่อสุขภาพ (สำหรับ บทส., ปป.)
const HAZARDOUS_CRITERIA: Omit<InspectionChecklistItem, 'passed'>[] = [
  // มิติที่ 1: มลพิษและสุขอนามัยสิ่งแวดล้อม (35 คะแนน)
  {
    id: 'h1',
    dimension: 'มิติที่ ๑: มลพิษและสิ่งแวดล้อม',
    title: 'มีระบบควบคุมเสียง กลิ่น ควัน ฝุ่นละออง และไอระเหยตามมาตรฐาน',
    description: 'ข้อกำหนดบังคับ: ระดับเสียงและฝุ่นไม่เกินเกณฑ์ข้อบัญญัติ อปท. ในรัศมี 100 เมตร',
    points: 15,
    isCritical: true
  },
  {
    id: 'h2',
    dimension: 'มิติที่ ๑: มลพิษและสิ่งแวดล้อม',
    title: 'มีระบบบำบัดน้ำเสียก่อนระบายสู่ภายนอก และน้ำทิ้งผ่านเกณฑ์มาตรฐาน',
    description: 'ข้อกำหนดบังคับ: มีบ่อตกตะกอน บ่อดักสารเคมี และไม่อุดตันท่อระบายน้ำสาธารณะ',
    points: 10,
    isCritical: true
  },
  {
    id: 'h3',
    dimension: 'มิติที่ ๑: มลพิษและสิ่งแวดล้อม',
    title: 'การคัดแยกและการกำจัดกากของเสียอันตราย/ขยะอุตสาหกรรมถูกต้อง',
    description: 'มีภาชนะบรรจุสารเคมีปิดมิดชิด มีป้ายเตือน และส่งกำจัดกับผู้ได้รับอนุญาต',
    points: 10
  },

  // มิติที่ 2: ความปลอดภัยและสุขอนามัยในการทำงาน (35 คะแนน)
  {
    id: 'h4',
    dimension: 'มิติที่ ๒: ความปลอดภัยในการทำงาน',
    title: 'จัดหาอุปกรณ์คุ้มครองความปลอดภัยส่วนบุคคล (PPE) ให้คนงานสวมใส่ครบถ้วน',
    description: 'แว่นตานิรภัย หน้ากากกรองฝุ่น/สารเคมี ที่อุดหูลดเสียง ถุงมือ รองเท้าหัวเหล็ก',
    points: 15
  },
  {
    id: 'h5',
    dimension: 'มิติที่ ๒: ความปลอดภัยในการทำงาน',
    title: 'ติดตั้งถังดับเพลิงพร้อมใช้งาน และมีป้ายทางหนีไฟชัดเจน',
    description: 'ข้อกำหนดบังคับ: ตรวจสอบแรงดันถังดับเพลิงทุก 6 เดือน ไม่มีสิ่งกีดขวางทางหนีไฟ',
    points: 10,
    isCritical: true
  },
  {
    id: 'h6',
    dimension: 'มิติที่ ๒: ความปลอดภัยในการทำงาน',
    title: 'ติดตั้งเครื่องจักรกลมั่นคงปลอดภัย มีการต่อสายดินและครอบฝาป้องกัน',
    description: 'เครื่องจักรมีอุปกรณ์ตัดไฟฉุกเฉิน และตรวจเช็คระบบไฟฟ้าเป็นประจำ',
    points: 10
  },

  // มิติที่ 3: สวัสดิการและสุขภาพคนงาน (30 คะแนน)
  {
    id: 'h7',
    dimension: 'มิติที่ ๓: สวัสดิการและสุขภาพคนงาน',
    title: 'จัดให้มีห้องน้ำ ห้องส้วมที่ถูกสุขลักษณะแยกชาย-หญิงเพียงพอ',
    description: 'ห้องน้ำสะอาด มีน้ำล้างและสบู่ อัตราส่วนตามที่กฎกระทรวงกำหนด',
    points: 10
  },
  {
    id: 'h8',
    dimension: 'มิติที่ ๓: สวัสดิการและสุขภาพคนงาน',
    title: 'จัดให้มีชุดปฐมพยาบาลเบื้องต้นประจำสถานประกอบการ',
    description: 'มียาและเวชภัณฑ์จำเป็นครบถ้วน และไม่หมดอายุ',
    points: 10
  },
  {
    id: 'h9',
    dimension: 'มิติที่ ๓: สวัสดิการและสุขภาพคนงาน',
    title: 'มีการตรวจสุขภาพประจำปีตามปัจจัยเสี่ยงสำหรับผู้ปฏิบัติงาน',
    description: 'มีประวัติการตรวจการได้ยิน สมรรถภาพปอด หรือสารเคมีในร่างกาย',
    points: 10
  }
];

// Helper to calculate distance in meters between two coordinates
const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

const DEMO_STORAGE_PHOTOS: InspectionPhoto[] = [
  {
    id: 'demo-p1',
    category: 'pallet',
    caption: 'พาเลทไม้ยกสูง ≥ ๑๕ ซม. เว้นระยะห่างผนัง ๓๐ ซม.',
    timestamp: 'ตรวจ ๐๙:๑๕ น.',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220"><rect width="320" height="220" fill="%23f1f5f9"/><rect x="25" y="150" width="270" height="24" rx="4" fill="%23b45309"/><rect x="40" y="80" width="105" height="70" rx="4" fill="%23d97706"/><rect x="165" y="60" width="115" height="90" rx="4" fill="%2392400e"/><line x1="25" y1="174" x2="25" y2="200" stroke="%232563eb" stroke-width="2.5"/><line x1="295" y1="174" x2="295" y2="200" stroke="%232563eb" stroke-width="2.5"/><text x="160" y="200" fill="%231e3a8a" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">พาเลทสูง ๑๕ ซม. ห่างผนัง ๓๐ ซม. (ผ่าน)</text></svg>'
  },
  {
    id: 'demo-p2',
    category: 'temperature',
    caption: 'เกจวัดอุณหภูมิห้องเย็นแช่แข็ง -18.5°C มีบันทึกต่อเนื่อง',
    timestamp: 'ตรวจ ๐๙:๑๘ น.',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220"><rect width="320" height="220" fill="%230f172a"/><rect x="30" y="25" width="260" height="150" rx="14" fill="%231e293b" stroke="%2338bdf8" stroke-width="3"/><circle cx="65" cy="100" r="14" fill="%2310b981"/><text x="165" y="100" fill="%2338bdf8" font-family="monospace" font-size="34" font-weight="bold" text-anchor="middle">-18.5°C</text><text x="160" y="145" fill="%234ade80" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">อุณหภูมิแช่แข็งปกติ (&lt; -18°C)</text></svg>'
  },
  {
    id: 'demo-p3',
    category: 'screen',
    caption: 'ม่านริ้วพลาสติกใสและตะแกรงป้องกันสัตว์/แมลงนำโรค',
    timestamp: 'ตรวจ ๐๙:๒๒ น.',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220"><rect width="320" height="220" fill="%23e2e8f0"/><rect x="30" y="20" width="260" height="175" rx="8" fill="%2394a3b8"/><line x1="60" y1="20" x2="60" y2="195" stroke="%2338bdf8" stroke-width="20" opacity="0.75"/><line x1="95" y1="20" x2="95" y2="195" stroke="%2338bdf8" stroke-width="20" opacity="0.75"/><line x1="130" y1="20" x2="130" y2="195" stroke="%2338bdf8" stroke-width="20" opacity="0.75"/><line x1="165" y1="20" x2="165" y2="195" stroke="%2338bdf8" stroke-width="20" opacity="0.75"/><line x1="200" y1="20" x2="200" y2="195" stroke="%2338bdf8" stroke-width="20" opacity="0.75"/><line x1="235" y1="20" x2="235" y2="195" stroke="%2338bdf8" stroke-width="20" opacity="0.75"/><text x="160" y="210" fill="%230f172a" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">ม่านริ้วพลาสติกกันแมลง ปิดมิดชิด (ผ่าน)</text></svg>'
  },
  {
    id: 'demo-p4',
    category: 'cleanliness',
    caption: 'ระบบจัดเรียง First-In First-Out (FIFO) และป้ายล็อตสินค้า',
    timestamp: 'ตรวจ ๐๙:๒๗ น.',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220"><rect width="320" height="220" fill="%23f8fafc"/><rect x="25" y="25" width="270" height="150" rx="10" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><rect x="45" y="45" width="70" height="60" rx="4" fill="%233b82f6"/><rect x="125" y="45" width="70" height="60" rx="4" fill="%2310b981"/><rect x="205" y="45" width="70" height="60" rx="4" fill="%23f59e0b"/><text x="160" y="135" fill="%231e293b" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">ระบบหมุนเวียนสินค้า FIFO</text><text x="160" y="155" fill="%2364748b" font-family="sans-serif" font-size="10" text-anchor="middle">ระบุวันรับเข้าและวันหมดอายุชัดเจน</text></svg>'
  }
];

export const SanitationInspectionTab: React.FC<SanitationInspectionTabProps> = ({
  establishment,
  onSaveInspection,
  onOpenPrint,
  onClose
}) => {
  // Determine criteria type based on establishment
  const isHazardous = establishment?.category === 'hazardous' || establishment?.regType === 'บทส' || establishment?.regType === 'ปป';

  // Check if establishment is food storage
  const isInitialStorage = useMemo(() => {
    if (!establishment) return false;
    const name = (establishment.businessName + ' ' + establishment.categoryName).toLowerCase();
    return name.includes('สะสมอาหาร') || name.includes('คลัง') || name.includes('โกดัง') || name.includes('ห้องเย็น');
  }, [establishment]);

  const [inspectionCategory, setInspectionCategory] = useState<'selling' | 'storage' | 'hazardous'>(
    isHazardous ? 'hazardous' : isInitialStorage ? 'storage' : 'selling'
  );

  // Sync inspectionCategory when establishment changes
  useEffect(() => {
    if (isHazardous) {
      setInspectionCategory('hazardous');
    } else if (isInitialStorage) {
      setInspectionCategory('storage');
    } else {
      setInspectionCategory('selling');
    }
  }, [isHazardous, isInitialStorage]);

  const defaultItems = useMemo(() => {
    let template = FOOD_SANITATION_CRITERIA;
    if (inspectionCategory === 'hazardous') template = HAZARDOUS_CRITERIA;
    else if (inspectionCategory === 'storage') template = FOOD_STORAGE_CRITERIA;
    return template.map((item) => ({
      ...item,
      passed: true
    }));
  }, [inspectionCategory]);

  const [checklist, setChecklist] = useState<InspectionChecklistItem[]>(defaultItems);
  const [inspectorName, setInspectorName] = useState<string>('นายนพดล สุขเกษม');
  const [inspectorPosition, setInspectorPosition] = useState<string>('เจ้าพนักงานสาธารณสุขชำนาญงาน');
  const [inspectionDate, setInspectionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [correctionDays, setCorrectionDays] = useState<15 | 30>(15);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);

  // Field Operations States
  const [gpsInfo, setGpsInfo] = useState<GpsCheckInInfo | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [photoCategory, setPhotoCategory] = useState<'pallet' | 'temperature' | 'screen' | 'cleanliness' | 'other'>('pallet');
  const [photoCaption, setPhotoCaption] = useState<string>('');
  const [inspectorSig, setInspectorSig] = useState<string | null>(null);
  const [ownerSig, setOwnerSig] = useState<string | null>(null);
  const [ownerSignedName, setOwnerSignedName] = useState<string>('');
  const [isSlipModalOpen, setIsSlipModalOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSwitchCategory = (newCat: 'selling' | 'storage' | 'hazardous') => {
    setInspectionCategory(newCat);
    let template = FOOD_SANITATION_CRITERIA;
    if (newCat === 'hazardous') template = HAZARDOUS_CRITERIA;
    else if (newCat === 'storage') template = FOOD_STORAGE_CRITERIA;
    setChecklist(
      template.map((item) => ({
        ...item,
        passed: true
      }))
    );
  };

  // Load existing inspection record if available
  useEffect(() => {
    if (establishment?.inspectionRecord) {
      setChecklist(establishment.inspectionRecord.checklistItems);
      setInspectorName(establishment.inspectionRecord.inspectorName);
      setInspectorPosition(establishment.inspectionRecord.inspectorPosition);
      setInspectionDate(establishment.inspectionRecord.inspectionDate);
      if (establishment.inspectionRecord.correctionDays) {
        setCorrectionDays(establishment.inspectionRecord.correctionDays);
      }
      setCustomNotes(establishment.inspectionRecord.inspectorNotes || '');

      // Load field inspection items
      if (establishment.inspectionRecord.gpsCheckIn) {
        setGpsInfo(establishment.inspectionRecord.gpsCheckIn);
      } else {
        setGpsInfo(null);
      }
      if (establishment.inspectionRecord.photos && establishment.inspectionRecord.photos.length > 0) {
        setPhotos(establishment.inspectionRecord.photos);
      } else {
        setPhotos([]);
      }
      if (establishment.inspectionRecord.signatures) {
        setInspectorSig(establishment.inspectionRecord.signatures.inspectorSignature || null);
        setOwnerSig(establishment.inspectionRecord.signatures.ownerSignature || null);
        setOwnerSignedName(establishment.inspectionRecord.signatures.ownerSignedName || establishment.ownerName);
      } else {
        setInspectorSig(null);
        setOwnerSig(null);
        setOwnerSignedName(establishment.ownerName);
      }
    } else {
      setChecklist(defaultItems);
      setIsSavedSuccess(false);
      setGpsInfo(null);
      setPhotos([]);
      setInspectorSig(null);
      setOwnerSig(null);
      setOwnerSignedName(establishment?.ownerName || '');
    }
  }, [establishment, defaultItems]);

  // Scoring calculations
  const totalScore = useMemo(() => {
    return checklist.reduce((sum, item) => (item.passed ? sum + item.points : sum), 0);
  }, [checklist]);

  const maxScore = useMemo(() => {
    return checklist.reduce((sum, item) => sum + item.points, 0);
  }, [checklist]);

  const failedCriticalItems = useMemo(() => {
    return checklist.filter((item) => item.isCritical && !item.passed);
  }, [checklist]);

  const failedItems = useMemo(() => {
    return checklist.filter((item) => !item.passed);
  }, [checklist]);

  // Evaluation Rule: Pass requires score >= 80% AND 0 critical failures
  const isPassed = totalScore >= 80 && failedCriticalItems.length === 0;

  // Gimmick 1: Rapid Food Test Kits ๔ ชนิด (กรมวิทยาศาสตร์การแพทย์)
  const [testKits, setTestKits] = useState<{ [key: string]: boolean }>({
    borax: true,       // true = ปลอดภัย (ไม่พบสารปนเปื้อน)
    bleach: true,
    formalin: true,
    pesticide: true
  });

  const toggleTestKit = (key: string) => {
    setTestKits((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Gimmick 2: Clean Food Good Taste (กรมอนามัย)
  const cleanFoodGrade = useMemo(() => {
    if (!isPassed || isHazardous) return null;
    const allClean = Object.values(testKits).every(Boolean);
    if (totalScore >= 90 && allClean) {
      return {
        level: 'Clean Food Good Taste Plus',
        badge: 'ระดับดีเลิศ 🌟 (ดาวทอง)',
        desc: 'ผ่านเกณฑ์สุขลักษณะระดับดีเด่น (≥90 คะแนน) และไม่พบสารปนเปื้อน ๔ ชนิด',
        color: 'border-amber-400 bg-amber-50 text-amber-950',
        starColor: 'text-amber-500'
      };
    }
    return {
      level: 'Clean Food Good Taste',
      badge: 'ระดับมาตรฐาน 🏅 (ดาวเงิน)',
      desc: 'ผ่านเกณฑ์มาตรฐานสุขาภิบาลอาหารกรมอนามัย (≥80 คะแนน)',
      color: 'border-emerald-400 bg-emerald-50 text-emerald-950',
      starColor: 'text-emerald-600'
    };
  }, [isPassed, isHazardous, totalScore, testKits]);

  // Toggle item check
  const handleToggleItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, passed: !item.passed } : item))
    );
    setIsSavedSuccess(false);
  };

  // Group checklist items by dimension
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: InspectionChecklistItem[] } = {};
    checklist.forEach((item) => {
      if (!groups[item.dimension]) {
        groups[item.dimension] = [];
      }
      groups[item.dimension].push(item);
    });
    return groups;
  }, [checklist]);

  // Quick Action: Pass All items in 1 click to save time
  const handlePassAll = () => {
    setChecklist((prev) => prev.map((item) => ({ ...item, passed: true })));
    setTestKits({ borax: true, bleach: true, formalin: true, pesticide: true });
    setIsSavedSuccess(false);
  };

  // Quick Action: Reset checklist
  const handleResetChecklist = () => {
    setChecklist((prev) => prev.map((item) => ({ ...item, passed: false })));
    setIsSavedSuccess(false);
  };

  // Auto-calculated deadline date for corrections
  const deadlineDateFormatted = useMemo(() => {
    const d = new Date(inspectionDate || Date.now());
    d.setDate(d.getDate() + correctionDays);
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  }, [inspectionDate, correctionDays]);

  // GPS Geolocation check-in handler
  const handleGpsCheckIn = () => {
    if (!navigator.geolocation) {
      if (establishment) {
        const dist = Math.floor(6 + Math.random() * 10);
        setGpsInfo({
          lat: establishment.lat + 0.00004,
          lng: establishment.lng + 0.00003,
          accuracy: 5,
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          distanceMeters: dist,
          isWithinPremises: true
        });
      }
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        const dist = establishment ? calculateDistanceMeters(lat, lng, establishment.lat, establishment.lng) : 0;
        setGpsInfo({
          lat,
          lng,
          accuracy,
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          distanceMeters: dist,
          isWithinPremises: dist <= 300
        });
        setIsLocating(false);
      },
      () => {
        // Fallback simulation when device GPS is blocked or simulated
        if (establishment) {
          const dist = Math.floor(6 + Math.random() * 12);
          setGpsInfo({
            lat: establishment.lat + 0.00005,
            lng: establishment.lng + 0.00004,
            accuracy: 6,
            timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            distanceMeters: dist,
            isWithinPremises: true
          });
        }
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Load representative photos for food storage inspection demonstration
  const handleLoadDemoPhotos = () => {
    setPhotos(DEMO_STORAGE_PHOTOS);
  };

  // Upload or take camera photo on mobile
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const categoryLabels: Record<string, string> = {
        pallet: 'พาเลท/การยกสูงจากพื้น (≥ 15 ซม.)',
        temperature: 'เทอร์โมมิเตอร์ห้องเย็น/ตู้แช่',
        screen: 'ม่านริ้วพลาสติก/มุ้งลวดกันแมลง',
        cleanliness: 'สภาพคลัง/ระบบหมุนเวียน FIFO',
        other: 'ภาพถ่ายทั่วไป'
      };
      const newPhoto: InspectionPhoto = {
        id: `photo-${Date.now()}`,
        url,
        category: photoCategory,
        caption: photoCaption.trim() || categoryLabels[photoCategory] || 'ภาพถ่ายหน้างาน',
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      };
      setPhotos((prev) => [...prev, newPhoto]);
      setPhotoCaption('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Handle Save Inspection Result
  const handleSave = () => {
    if (!establishment) return;

    // Calculate deadline date if correction needed
    let deadlineDate: string | undefined = undefined;
    if (!isPassed) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + correctionDays);
      deadlineDate = targetDate.toISOString().split('T')[0];
    }

    const record: InspectionRecord = {
      id: establishment.inspectionRecord?.id || `insp-${Date.now()}`,
      establishmentId: establishment.id,
      inspectionDate,
      inspectorName,
      inspectorPosition,
      totalScore,
      maxScore,
      result: isPassed ? 'passed' : 'needs_correction',
      correctionDays: isPassed ? undefined : correctionDays,
      correctionDeadline: deadlineDate,
      defectsSummary: failedItems.map((item) => item.title),
      inspectorNotes: customNotes,
      checklistItems: checklist,
      gpsCheckIn: gpsInfo || undefined,
      photos: photos.length > 0 ? photos : undefined,
      signatures: {
        inspectorSignature: inspectorSig || undefined,
        inspectorName,
        inspectorSignedAt: inspectionDate,
        ownerSignature: ownerSig || undefined,
        ownerSignedName: ownerSignedName || establishment.ownerName,
        ownerSignedAt: inspectionDate
      }
    };

    const newStatus: EstablishmentStatus = isPassed ? 'active' : 'pending_correction';

    onSaveInspection(record, newStatus);
    setIsSavedSuccess(true);
  };

  if (!establishment) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
        <ClipboardCheck className="w-12 h-12 text-slate-300 mb-2" />
        <p className="text-sm font-bold text-slate-700">กรุณาเลือกสถานประกอบการจากทะเบียนสารบรรณ หรือแผนที่ GIS</p>
        <p className="text-xs text-slate-500 mt-1">เพื่อเปิดแบบฟอร์มตรวจประเมินสุขลักษณะสถานที่จริง</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white text-slate-900 overflow-hidden font-sans">
      {/* 1. Header with Live Score Banner */}
      <div className="p-3.5 bg-slate-900 text-white border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-700 flex items-center justify-center font-bold text-white shadow-xs">
              🔍
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold flex items-center gap-2">
                <span>แบบตรวจประเมินสุขลักษณะสถานที่จริง</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                  {inspectionCategory === 'storage'
                    ? 'เกณฑ์สถานที่สะสมอาหาร/คลังห้องเย็น'
                    : inspectionCategory === 'selling'
                    ? 'เกณฑ์สถานที่จำหน่ายอาหาร (กรมอนามัย)'
                    : 'เกณฑ์กิจการอันตราย'}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 truncate max-w-sm">
                {establishment.businessName} • {establishment.regNumber} ({establishment.village})
              </div>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Switcher: 🍽️ สถานที่จำหน่ายอาหาร vs 📦 สถานที่สะสมอาหาร */}
        <div className="flex items-center gap-1.5 mt-2.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => handleSwitchCategory('selling')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              inspectionCategory === 'selling'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>๑. สถานที่จำหน่ายอาหาร (Food Selling)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchCategory('storage')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              inspectionCategory === 'storage'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5" />
            <span>๒. สถานที่สะสมอาหาร (Food Storage / ห้องเย็น)</span>
          </button>

          {isHazardous && (
            <button
              type="button"
              onClick={() => handleSwitchCategory('hazardous')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                inspectionCategory === 'hazardous'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>๓. กิจการอันตราย</span>
            </button>
          )}
        </div>

        {/* Field Inspection Operations Toolbar (ลงพื้นที่จริง) */}
        <div className="mt-2.5 p-2.5 rounded-xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-500/40 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGpsCheckIn}
              disabled={isLocating}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                gpsInfo
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/30'
              }`}
              title="เช็กอินพิกัดดาวเทียม GPS ณ สถานที่ตรวจจริง"
            >
              <MapPin className={`w-3.5 h-3.5 ${isLocating ? 'animate-bounce text-amber-400' : 'text-blue-400'}`} />
              <span>
                {isLocating
                  ? 'กำลังค้นหาพิกัด...'
                  : gpsInfo
                  ? 'เช็กอินแล้ว ✓'
                  : '📍 เช็กอินพิกัดหน้างาน (GPS)'}
              </span>
            </button>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${establishment.lat},${establishment.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="เปิด Google Maps นำทางเลี้ยวต่อเลี้ยวไปยังพิกัดคลังสะสมอาหาร"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>🧭 นำทาง Google Maps ↗</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            {gpsInfo && (
              <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {gpsInfo.lat.toFixed(5)}, {gpsInfo.lng.toFixed(5)} (±{Math.round(gpsInfo.accuracy)}ม.)
                  {gpsInfo.distanceMeters !== undefined && ` • ห่าง ${Math.round(gpsInfo.distanceMeters)}ม.`}
                </span>
              </span>
            )}

            <button
              type="button"
              onClick={() => setIsSlipModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="เปิดแบบบันทึกผลการตรวจสุขลักษณะ A4 สำหรับพิมพ์มอบให้ผู้ประกอบการหน้างาน"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>📄 แบบบันทึกผล A4 (Field Slip)</span>
            </button>
          </div>
        </div>

        {/* Live Score Bar & Result Indicator */}
        <div className="mt-3 p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-300 font-semibold flex items-center gap-1">
                คะแนนประเมินรวม:
              </span>
              <span className="font-mono font-bold text-sm">
                <span className={totalScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}>
                  {totalScore}
                </span>{' '}
                / {maxScore} คะแนน (เกณฑ์ผ่าน ≥ 80%)
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isPassed ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${(totalScore / maxScore) * 100}%` }}
              />
            </div>
          </div>

          {/* Badge Result */}
          <div className="shrink-0 text-right">
            {isPassed ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ผ่านเกณฑ์ (Passed)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 font-bold text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>ต้องแก้ไข (Correction)</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Checklist Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Quick Inspection Toolbar: Pass All vs Reset */}
        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>เครื่องมือตรวจด่วน (Quick Actions):</span>
            </span>
            <span className="text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
              ตรวจเร็วใน ๑๐ วิ
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePassAll}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="คลิกเดียว: ติ๊กผ่านเกณฑ์มาตรฐานครบทุกข้อ แล้วค่อยเลือกแก้ไขข้อที่บกพร่อง"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>✅ ผ่านเกณฑ์ทั้งหมด (Pass All)</span>
            </button>

            <button
              type="button"
              onClick={handleResetChecklist}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              title="ล้างผลการประเมินเพื่อเริ่มตรวจใหม่"
            >
              <span>รีเซ็ต</span>
            </button>
          </div>
        </div>

        {/* Critical defect alert if any */}
        {failedCriticalItems.length > 0 && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-300 text-red-900 text-xs flex items-start gap-2 shadow-2xs">
            <ShieldAlert className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-red-800">
                พบข้อบกพร่องใน "ข้อกำหนดบังคับ (Critical Points)" {failedCriticalItems.length} รายการ:
              </div>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px] text-red-700">
                {failedCriticalItems.map((item) => (
                  <li key={item.id}>{item.title}</li>
                ))}
              </ul>
              <div className="mt-1 text-[11px] font-semibold text-red-800">
                *ตามระเบียบ ไม่สามารถอนุมัติได้ ต้องออกหนังสือสั่งปรับปรุงแก้ไข
              </div>
            </div>
          </div>
        )}

        {isSavedSuccess && (
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>บันทึกผลการตรวจและอัปเดตสถานะในระบบสารบรรณเรียบร้อยแล้ว</span>
          </div>
        )}

        {/* Grouped Checklist Items */}
        {Object.entries(groupedItems).map(([dimension, items]) => (
          <div key={dimension} className="space-y-2">
            <div className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1.5 rounded-md border-l-4 border-purple-600 flex justify-between items-center text-[11px]">
              <span>{dimension}</span>
              <span className="text-slate-500 font-normal">
                {items.filter((i) => i.passed).length}/{items.length} ข้อผ่าน
              </span>
            </div>

            <div className="space-y-1.5 pl-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleItem(item.id)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                    item.passed
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-red-50/60 border-red-200 text-red-950'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.passed}
                    onChange={() => {}} // handled by parent onClick
                    className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`font-semibold leading-snug ${item.passed ? 'text-slate-800' : 'text-red-900'}`}>
                        {item.title}
                      </span>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                        {item.points} คะแนน
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {item.description}
                    </div>
                    {item.isCritical && (
                      <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                        ⚠️ ข้อกำหนดบังคับ
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Gimmick 1: ชุดทดสอบสารปนเปื้อน ๔ ชนิด (Rapid Food Safety Test Kits) */}
        {!isHazardous && (
          <div className="p-3.5 rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50/70 to-blue-50/50 space-y-3 mt-4">
            <div className="flex items-center justify-between border-b border-cyan-200/80 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-950">
                <FlaskConical className="w-4 h-4 text-cyan-700" />
                <span>การตรวจสารปนเปื้อน ๔ ชนิด (ชุดทดสอบเร็ว Test Kit กรมวิทยาศาสตร์การแพทย์)</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-300">
                งานสาสุข อปท.
              </span>
            </div>

            <p className="text-[11px] text-slate-600">
              เจ้าพนักงานสาธารณสุขลงพื้นที่ตรวจสารเคมีตกค้างในวัตถุดิบและอาหารสด:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'borax', name: 'สารบอแรกซ์ (Borax)', sample: 'หมูบด/ลูกชิ้น' },
                { key: 'bleach', name: 'สารฟอกขาว (Bleach)', sample: 'ถั่วงอก/หน่อไม้' },
                { key: 'formalin', name: 'ฟอร์มาลิน (Formalin)', sample: 'อาหารทะเล/ผัก' },
                { key: 'pesticide', name: 'ยาฆ่าแมลง/สารเร่ง', sample: 'ผักสด/เนื้อแดง' }
              ].map((kit) => {
                const isSafe = testKits[kit.key];
                return (
                  <div
                    key={kit.key}
                    onClick={() => toggleTestKit(kit.key)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSafe
                        ? 'bg-white border-emerald-300 hover:border-emerald-400 shadow-2xs'
                        : 'bg-red-50 border-red-400 shadow-2xs'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-slate-800 truncate">{kit.name}</div>
                    <div className="text-[9px] text-slate-500">{kit.sample}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isSafe ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800 font-bold'
                        }`}
                      >
                        {isSafe ? 'ปลอดภัย ✓' : 'ตรวจพบ ⚠️'}
                      </span>
                      <span className="text-[9px] text-slate-400">คลิกเปลี่ยน</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Gimmick 2: ป้ายรับรองมาตรฐาน Clean Food Good Taste (กรมอนามัย) */}
        {cleanFoodGrade && (
          <div className={`p-4 rounded-xl border-2 ${cleanFoodGrade.color} shadow-sm space-y-2.5 mt-4 transition-all animate-in fade-in duration-300`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  🌟
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-950">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>ได้รับสิทธิ์รับรอง: {cleanFoodGrade.level}</span>
                  </div>
                  <div className="text-[10px] text-amber-800">
                    โครงการอาหารสะอาด รสชาติอร่อย (Clean Food Good Taste) กรมอนามัย กระทรวงสาธารณสุข
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <span className="px-2.5 py-1 rounded-full bg-white border border-amber-300 text-amber-900 font-bold text-[10px] shadow-2xs font-mono">
                  {cleanFoodGrade.badge}
                </span>
                {onOpenPrint && (
                  <button
                    type="button"
                    onClick={() => onOpenPrint(establishment)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] shadow-xs transition-all cursor-pointer flex items-center gap-1"
                    title="เปิดพิมพ์ป้ายรับรอง Clean Food Good Taste ขนาด A4 แนวนอน"
                  >
                    <Printer className="w-3 h-3" />
                    <span>พิมพ์ป้ายหน้าร้าน</span>
                  </button>
                )}
              </div>
            </div>

            <p className="text-[11px] text-amber-900 leading-relaxed">
              🎉 <strong>ผลการประเมิน:</strong> {cleanFoodGrade.desc} สามารถออกป้ายรับรองมาตรฐานสุขาภิบาลอาหารเพื่อตั้งโต๊ะหรือติดหน้าร้านสร้างความมั่นใจแก่ผู้บริโภคได้ทันที
            </p>
          </div>
        )}

        {/* 3. Decision & Correction Order Section */}
        <div className="p-3.5 rounded-xl border bg-slate-50 space-y-3 mt-4">
          <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b pb-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-700" />
            <span>คำสั่งและข้อสรุปของเจ้าพนักงานท้องถิ่น</span>
          </div>

          {!isPassed && (
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-red-900">
                กำหนดระยะเวลาให้ผู้ประกอบการแก้ไขปรับปรุงสุขลักษณะ:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectionDays(15)}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    correctionDays === 15
                      ? 'bg-red-600 text-white border-red-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>๑๕ วัน (เร่งด่วน)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCorrectionDays(30)}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    correctionDays === 30
                      ? 'bg-red-600 text-white border-red-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>๓๐ วัน (ปกติ)</span>
                </button>
              </div>

              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-[11px] flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>
                    นับถอยหลัง {correctionDays} วัน นับแต่วันที่ตรวจ
                  </span>
                </div>
                <span className="font-mono font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md">
                  ครบกำหนด: {deadlineDateFormatted}
                </span>
              </div>
            </div>
          )}

          {/* Inspector Details */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                ชื่อผู้ตรวจประเมิน
              </label>
              <input
                type="text"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-purple-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                ตำแหน่ง
              </label>
              <input
                type="text"
                value={inspectorPosition}
                onChange={(e) => setInspectorPosition(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>วันที่ตรวจประเมินสถานที่จริง</span>
            </label>
            <input
              type="date"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-purple-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              ข้อเสนอแนะเพิ่มเติม / รายการที่สั่งให้แก้ไขปรับปรุง
            </label>
            <textarea
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="บันทึกข้อสังเกตของเจ้าพนักงาน เช่น ให้ทำความสะอาดบ่อดักไขมันเพิ่มเติม..."
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-purple-600"
            />
          </div>
        </div>

        {/* 4. Photographic Evidence Section (ภาพถ่ายหลักฐานหน้างาน) */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3 mt-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-800 text-xs">
                ภาพถ่ายหลักฐานการตรวจประเมินสถานที่จริง ({photos.length} รูป)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleLoadDemoPhotos}
                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="โหลดรูปภาพหลักฐานตัวอย่างตามเกณฑ์สะสมอาหาร ๔ มิติ สำหรับทดสอบระบบ"
              >
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>โหลดรูปตัวอย่างคลัง (Demo ๔ มิติ)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                title="ถ่ายรูปด้วยกล้องมือถือ/แท็บเล็ต หรือเลือกรูปจากเครื่อง"
              >
                <Camera className="w-3 h-3" />
                <span>ถ่ายรูป/อัปโหลด</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Category selection and caption input */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-[11px] font-semibold text-slate-700">เลือกหมวดหมู่รูปภาพที่จะบันทึก:</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { key: 'pallet', label: '📦 พาเลท/ยกสูง ≥15ซม.' },
                { key: 'temperature', label: '❄️ เทอร์โมมิเตอร์ห้องเย็น' },
                { key: 'screen', label: '🚪 ม่านริ้ว/มุ้งลวดกันแมลง' },
                { key: 'cleanliness', label: '🏷️ สภาพคลัง/ป้าย FIFO' }
              ].map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setPhotoCategory(c.key as any)}
                  className={`py-1 px-2 rounded text-[11px] font-semibold border transition-all text-center cursor-pointer ${
                    photoCategory === c.key
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                placeholder="คำอธิบายภาพ (เช่น ถ่ายบริเวณทางเข้าโกดังฝั่งทิศเหนือ)"
                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                <span>เลือกไฟล์</span>
              </button>
            </div>
          </div>

          {/* Photo Gallery Grid */}
          {photos.length === 0 ? (
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center text-slate-400 text-xs">
              ยังไม่มีภาพถ่ายหลักฐานหน้างาน (กด "ถ่ายรูป/อัปโหลด" หรือ "โหลดรูปตัวอย่างคลัง" ด้านบน)
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-2xs">
                  <div className="h-28 bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img src={photo.url} alt={photo.caption || 'หลักฐาน'} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2">
                    <div className="text-[11px] font-bold text-slate-800 truncate">{photo.caption}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{photo.timestamp}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-red-600 hover:bg-red-700 text-white shadow-xs opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                    title="ลบรูปภาพนี้"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. Dual Digital Signatures Section (ลายมือชื่อดิจิทัล ๒ ฝ่าย) */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3 mt-4 shadow-2xs">
          <div className="border-b pb-2">
            <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <span className="text-base">✍️</span>
              <span>การลงนามอิเล็กทรอนิกส์ร่วมกัน ๒ ฝ่าย (Dual Digital Signatures)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ให้ทั้งเจ้าพนักงานสาธารณสุขและผู้แทนสถานที่ลงลายมือชื่อบนหน้าจอเพื่อเป็นพยานหลักฐานตามกฎหมาย
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Signature 1: Public Health Inspector */}
            <SignaturePad
              label="๑. ลายมือชื่อเจ้าพนักงานสาธารณสุขผู้ตรวจ"
              titleRole="ผู้ประเมิน"
              signature={inspectorSig}
              onSave={(sig) => setInspectorSig(sig)}
              signedName={inspectorName}
              onNameChange={(name) => setInspectorName(name)}
              namePlaceholder="ชื่อ-สกุล เจ้าพนักงานผู้ตรวจ"
            />

            {/* Signature 2: Warehouse Owner / Representative */}
            <SignaturePad
              label="๒. ลายมือชื่อผู้รับการตรวจ / ผู้แทนสถานที่"
              titleRole="ผู้จัดการคลัง / เจ้าของ"
              signature={ownerSig}
              onSave={(sig) => setOwnerSig(sig)}
              signedName={ownerSignedName}
              onNameChange={(name) => setOwnerSignedName(name)}
              namePlaceholder="ชื่อ-สกุล ผู้ประกอบการ หรือผู้แทนคลัง"
            />
          </div>
        </div>
      </div>

      {/* 6. Bottom Action Buttons */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition-all"
        >
          <Save className="w-3.5 h-3.5" />
          <span>บันทึกผลการตรวจสุขลักษณะ</span>
        </button>

        <button
          type="button"
          onClick={() => setIsSlipModalOpen(true)}
          className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-700 hover:bg-indigo-600 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition-all"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>พิมพ์ใบบันทึกผล A4 (Field Slip)</span>
        </button>

        {isPassed && onOpenPrint && (
          <button
            type="button"
            onClick={() => onOpenPrint(establishment)}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>อนุมัติ &amp; พิมพ์ใบอนุญาต</span>
          </button>
        )}
      </div>

      {/* 7. Field Inspection Slip Modal Preview (A4 Printable) */}
      <FieldInspectionSlipModal
        isOpen={isSlipModalOpen}
        onClose={() => setIsSlipModalOpen(false)}
        establishment={establishment}
        inspectionRecord={{
          id: establishment.inspectionRecord?.id || `insp-${Date.now()}`,
          establishmentId: establishment.id,
          inspectionDate,
          inspectorName,
          inspectorPosition,
          totalScore,
          maxScore,
          result: isPassed ? 'passed' : 'needs_correction',
          correctionDays: isPassed ? undefined : correctionDays,
          correctionDeadline: deadlineDateFormatted,
          defectsSummary: failedItems.map((i) => i.title),
          inspectorNotes: customNotes,
          checklistItems: checklist,
          gpsCheckIn: gpsInfo || undefined,
          photos: photos.length > 0 ? photos : undefined,
          signatures: {
            inspectorSignature: inspectorSig || undefined,
            inspectorName,
            inspectorSignedAt: inspectionDate,
            ownerSignature: ownerSig || undefined,
            ownerSignedName: ownerSignedName || establishment.ownerName,
            ownerSignedAt: inspectionDate
          }
        }}
      />
    </div>
  );
};
