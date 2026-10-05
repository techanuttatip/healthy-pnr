-- ==============================================================================
-- ฐานข้อมูลระบบสารบรรณและใบอนุญาตสุขาภิบาล กองสาธารณสุข อบต.โป่งน้ำร้อน
-- SUPABASE MASTER DATABASE SETUP (เวอร์ชันใช้งานจริง ๑๐๐%)
-- คัดลอกคำสั่งทั้งหมดนี้ไปวางใน Supabase SQL Editor แล้วกด "Run" เพียงครั้งเดียว
-- ==============================================================================

-- ๑. เปิด Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ๒. ตารางข้อมูลเจ้าหน้าที่ผู้ปฏิบัติงาน (Officers)
CREATE TABLE IF NOT EXISTS public.officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'inspector', -- inspector | head | director | executive
  role_name TEXT,
  phone TEXT,
  email TEXT,
  pin_code TEXT NOT NULL,
  avatar_color TEXT DEFAULT 'bg-emerald-600',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ๓. ตารางข้อมูลสถานประกอบการ (Establishments)
CREATE TABLE IF NOT EXISTS public.establishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reg_number TEXT UNIQUE NOT NULL,        -- เช่น บทส-69-0044
  reg_type TEXT NOT NULL DEFAULT 'บทส',   -- บทส | บทอ | นจ | อส | นส | ปป
  category TEXT NOT NULL,                 -- hazardous | food_license | food_notice | market | etc.
  category_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  applicant_type TEXT DEFAULT 'individual',
  owner_name TEXT NOT NULL,
  citizen_id TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  village TEXT NOT NULL,
  address TEXT NOT NULL,
  area_sqm NUMERIC DEFAULT 0,
  worker_count INTEGER DEFAULT 1,
  machine_horsepower NUMERIC DEFAULT 0,
  food_handler_cert_no TEXT,
  lat DOUBLE PRECISION DEFAULT 19.9288,
  lng DOUBLE PRECISION DEFAULT 99.1685,
  status TEXT NOT NULL DEFAULT 'active',  -- active | expiring | awaiting_payment | pending_inspection | pending_correction
  issue_date DATE,
  expire_date DATE,
  annual_fee_due DATE,
  fee_amount NUMERIC DEFAULT 100,
  book_no TEXT DEFAULT '-',
  doc_no TEXT,
  receipt_book_no TEXT DEFAULT '-',
  receipt_no TEXT,
  receipt_date DATE,
  application_submission_date DATE,
  temporary_slip_issued_date DATE,
  food_place_type TEXT DEFAULT 'selling',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ๔. ตารางผลการตรวจสุขลักษณะสถานที่จริง (Inspections)
CREATE TABLE IF NOT EXISTS public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  inspector_name TEXT NOT NULL,
  inspector_position TEXT NOT NULL,
  total_score NUMERIC NOT NULL DEFAULT 100,
  max_score NUMERIC NOT NULL DEFAULT 100,
  result TEXT NOT NULL DEFAULT 'passed',  -- passed | needs_correction
  correction_days INTEGER,
  correction_deadline DATE,
  defects_summary TEXT[],
  inspector_notes TEXT,
  checklist_data JSONB,
  signatures JSONB,
  gps_checkin JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ๕. ตารางแฟ้มเอกสารรายปี ๕ ฉบับ (Yearly Archives & Documents)
CREATE TABLE IF NOT EXISTS public.yearly_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,                  -- เช่น 2568, 2569, 2570
  status TEXT NOT NULL DEFAULT 'complete', -- complete | in_progress | pending_field_visit | pending_payment
  application_date DATE,
  inspection_date DATE,
  payment_date DATE,
  receipt_no TEXT,
  fee_amount NUMERIC DEFAULT 100,
  license_no TEXT,
  license_issue_date DATE,
  license_expire_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(establishment_id, year)
);

CREATE TABLE IF NOT EXISTS public.archived_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_id UUID REFERENCES public.yearly_archives(id) ON DELETE CASCADE,
  reg_number TEXT,                        -- เลขทะเบียนร้าน เช่น บทส-69-0044 (อ่านง่าย แยกร้านทันที)
  business_name TEXT,                     -- ชื่อร้านค้า เช่น ปั๊มน้ำมันหยอดเหรียญ
  fiscal_year INTEGER,                    -- ปีงบประมาณ พ.ศ. เช่น 2568, 2569, 2570
  document_type TEXT NOT NULL,            -- application | id_card | inspection_slip | receipt | license | other
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size TEXT,
  file_url TEXT,                          -- ลิงก์ไฟล์ใน Supabase Storage หรือ Data URL
  uploaded_at DATE DEFAULT CURRENT_DATE,
  uploaded_by TEXT,
  status TEXT DEFAULT 'verified',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ๖. ตารางตั้งค่าระบบและผู้ลงนาม (System Settings)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id TEXT PRIMARY KEY DEFAULT 'current',
  organization_name TEXT NOT NULL DEFAULT 'องค์การบริหารส่วนตำบลโป่งน้ำร้อน',
  department_name TEXT NOT NULL DEFAULT 'กองสาธารณสุขและสิ่งแวดล้อม',
  district TEXT NOT NULL DEFAULT 'อำเภอฝาง',
  province TEXT NOT NULL DEFAULT 'จังหวัดเชียงใหม่',
  phone_number TEXT DEFAULT '053-810317',
  signatories JSONB NOT NULL,
  fees JSONB,
  inspection_rules JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ๗. เปิดสิทธิ์ RLS ให้ระบบหน้าบ้านอ่าน/เขียนได้สะดวก ๑๐๐%
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yearly_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all on officers" ON public.officers;
CREATE POLICY "Allow anon all on officers" ON public.officers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on establishments" ON public.establishments;
CREATE POLICY "Allow anon all on establishments" ON public.establishments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on inspections" ON public.inspections;
CREATE POLICY "Allow anon all on inspections" ON public.inspections FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on yearly_archives" ON public.yearly_archives;
CREATE POLICY "Allow anon all on yearly_archives" ON public.yearly_archives FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on archived_documents" ON public.archived_documents;
CREATE POLICY "Allow anon all on archived_documents" ON public.archived_documents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on system_settings" ON public.system_settings;
CREATE POLICY "Allow anon all on system_settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

-- ๘. สร้าง Storage Bucket สำหรับเก็บเอกสาร PDF / รูปภาพ (ชื่อ: pnr-documents)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pnr-documents', 'pnr-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public storage upload" ON storage.objects;
CREATE POLICY "Allow public storage upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pnr-documents');

DROP POLICY IF EXISTS "Allow public storage select" ON storage.objects;
CREATE POLICY "Allow public storage select" ON storage.objects FOR SELECT USING (bucket_id = 'pnr-documents');

DROP POLICY IF EXISTS "Allow public storage update" ON storage.objects;
CREATE POLICY "Allow public storage update" ON storage.objects FOR UPDATE USING (bucket_id = 'pnr-documents');

DROP POLICY IF EXISTS "Allow public storage delete" ON storage.objects;
CREATE POLICY "Allow public storage delete" ON storage.objects FOR DELETE USING (bucket_id = 'pnr-documents');

-- ๙. นำเข้าข้อมูลเจ้าหน้าที่จริง ๔ ท่าน (Seeding Real Officers)
INSERT INTO public.officers (officer_code, name, position, role, role_name, phone, email, pin_code, avatar_color)
VALUES
  ('PNR-HL-01', 'นางสาวรุ่งทิวา อุปนันท์', 'นักวิชาการสาธารณสุขปฏิบัติการ', 'inspector', 'นักวิชาการสาธารณสุขปฏิบัติการ (ทุกบทบาท)', '081-000-0001', 'o.rungthiwa@gmail.com', 'prn123', 'bg-emerald-600'),
  ('PNR-HL-02', 'นางสาวสาวิตรี ฟงประดิษฐ์', 'ผู้ช่วยเจ้าพนักงานสาธารณสุข', 'head', 'ผู้ช่วยเจ้าพนักงานสาธารณสุข (ทุกบทบาท)', '081-000-0002', 'sawitree.nuizy@gmail.com', 'prn123', 'bg-teal-600'),
  ('PNR-HL-03', 'นางสาวกัญญารัตน์ หน่อราช', 'พนักงานจ้างเหมาบริการ', 'director', 'พนักงานจ้างเหมาบริการ (ทุกบทบาท)', '081-000-0003', 'nkanyarat19@gmail.com', 'prn123', 'bg-blue-600'),
  ('PNR-ADMIN-01', 'นายเตชณัฐ ถาติ๊บ', 'Dev / ผู้ดูแลระบบ (Admin)', 'executive', 'Dev & Admin ระบบงานสารบรรณ (ทุกบทบาท)', '081-000-0000', 'techanut0@gmail.com', 'admin123', 'bg-indigo-600')
ON CONFLICT (officer_code) DO UPDATE SET
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  pin_code = EXCLUDED.pin_code,
  email = EXCLUDED.email;

-- ๑๐. นำเข้าข้อมูลสถานประกอบการจริง (Seeding Real Establishment)
INSERT INTO public.establishments (
  reg_number, reg_type, category, category_name, business_name, applicant_type,
  owner_name, citizen_id, phone, email, village, address, area_sqm, worker_count,
  lat, lng, status, issue_date, expire_date, annual_fee_due, fee_amount, doc_no,
  receipt_no, receipt_date, application_submission_date, temporary_slip_issued_date,
  notes
) VALUES (
  'บทส-69-0044', 'บทส', 'hazardous',
  'กิจการที่เกี่ยวกับปิโตรเลียม ถ่านหิน สารเคมี (ลำดับที่ ๑๑๐: ปั๊มน้ำมันหยอดเหรียญ)',
  'ปั๊มน้ำมันหยอดเหรียญ นายอิทธิพล ขันคำกาศ', 'individual',
  'นายอิทธิพล ขันคำกาศ', '1500900146471', '088-7694944', 'itthiphon.oil@gmail.com',
  'หมู่ที่ 7 บ้านต้นผึ้งใต้', '214 หมู่ที่ 7 ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่', 2, 1,
  19.9288, 99.1685, 'active', '2026-09-25', '2027-09-24', '2027-09-24', 100, '044/2569',
  'RCPT-00602/69', '2026-09-25', '2026-09-11', '2026-09-11',
  'เอกสารชุดจริง พ.ศ. ๒๕๖๙ ครบ ๕ รายการ (คำขอ อภ.๑, บัตร ปชช., ผลตรวจ, ใบเสร็จ ๑๐๐ บาท, ใบอนุญาต อภ.๒)'
) ON CONFLICT (reg_number) DO NOTHING;

-- ๑๑. การอัปเกรดตาราง archived_documents ให้มีคอลัมน์ชื่อร้านและปีงบประมาณ (Migration)
ALTER TABLE public.archived_documents 
ADD COLUMN IF NOT EXISTS reg_number TEXT,
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS fiscal_year INTEGER;

-- อัปเดตข้อมูลเอกสารที่มีอยู่เดิมให้ดึงชื่อร้านและปีงบประมาณมาเติมทันที
UPDATE public.archived_documents ad
SET 
  reg_number = e.reg_number,
  business_name = e.business_name,
  fiscal_year = ya.year
FROM public.yearly_archives ya
JOIN public.establishments e ON ya.establishment_id = e.id
WHERE ad.archive_id = ya.id
  AND (ad.reg_number IS NULL OR ad.fiscal_year IS NULL);

-- ๑๒. สร้าง View รวมศูนย์ แยกร้าน แยกปีงบประมาณ ภาษาไทยชัดเจน
CREATE OR REPLACE VIEW public.v_archived_documents_by_store AS
SELECT 
  e.reg_number AS "เลขทะเบียน",
  e.business_name AS "ชื่อสถานประกอบการ",
  e.owner_name AS "ผู้ประกอบการ",
  ya.year AS "ปีงบประมาณ",
  ad.document_type AS "รหัสประเภท",
  ad.title AS "ชื่อเอกสาร",
  ad.file_name AS "ชื่อไฟล์",
  ad.file_size AS "ขนาดไฟล์",
  ad.file_url AS "ลิงก์ไฟล์_PDF",
  ad.uploaded_at AS "วันที่อัปโหลด",
  ad.status AS "สถานะตรวจรับ"
FROM public.archived_documents ad
JOIN public.yearly_archives ya ON ad.archive_id = ya.id
JOIN public.establishments e ON ya.establishment_id = e.id
ORDER BY ya.year DESC, e.reg_number ASC;
