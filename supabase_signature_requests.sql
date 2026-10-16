-- ==============================================================================
-- ตารางสำหรับระบบลงนามผลการตรวจสุขลักษณะผ่านมือถือระยะไกล (Mobile Remote Signature)
-- องค์การบริหารส่วนตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.signature_requests (
  token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id TEXT,
  establishment_name TEXT NOT NULL,
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  inspector_name TEXT NOT NULL,
  total_score NUMERIC NOT NULL DEFAULT 100,
  result TEXT NOT NULL DEFAULT 'passed',       -- passed | needs_correction
  defects_summary TEXT[],
  status TEXT NOT NULL DEFAULT 'pending',      -- pending | signed | expired
  signer_name TEXT,
  signature_data TEXT,                          -- base64 png data url
  signed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies: อนุญาตให้สร้าง อ่าน และอัปเดตลายเซ็นผ่าน token ได้
ALTER TABLE public.signature_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read signature requests by token" ON public.signature_requests;
CREATE POLICY "Public can read signature requests by token"
  ON public.signature_requests FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can update signature requests by token" ON public.signature_requests;
CREATE POLICY "Public can update signature requests by token"
  ON public.signature_requests FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Officers can insert signature requests" ON public.signature_requests;
CREATE POLICY "Officers can insert signature requests"
  ON public.signature_requests FOR INSERT
  WITH CHECK (true);
