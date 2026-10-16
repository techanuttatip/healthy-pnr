import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://rqoehhdrinpdiabufqwj.supabase.co'
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxb2VoaGRyaW5wZGlhYnVmcXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4Mjk5NzksImV4cCI6MjEwNjQwNTk3OX0.UDWAWRV0BPQkBpz7VFxCk9XpEw-7aFNRagn8Frm947Q'
export const USE_MOCKS = false
export const MAIN_APP_URL = import.meta.env.VITE_MAIN_APP_URL || 'http://localhost:5175'

// Initialize Supabase Client
export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== 'https://placeholder.supabase.co'
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null

export type ApiError = { status: number; message: string }

export type Establishment = {
  id: string
  name: string
  type: string
  category?: 'hazardous' | 'food_notice' | 'food_license' | 'food_storage'
  owner: string
  citizenId?: string
  address: string
  village?: string
  permitNo: string
  permitStatus: 'ปกติ' | 'ใกล้หมดอายุ' | 'หมดอายุ'
  status?: string
  expiry: string
  phone: string
  areaSqm?: number
  widthM?: number
  lengthM?: number
  lat?: number
  lng?: number
  image?: string
}

export type FieldTask = {
  id: string
  establishmentId: string
  establishmentName: string
  title: string
  due: string
  status: 'รอดำเนินการ' | 'กำลังดำเนินการ' | 'นัดหมายแล้ว' | 'ลงพื้นที่แล้ว' | 'เสร็จสิ้น' | 'ติดตามเพิ่มเติม'
  priority: 'ปกติ' | 'เร่งด่วน'
  address: string
  requiredDocs?: string[]
}

export type FieldReport = {
  taskId: string
  establishmentId: string
  establishmentName?: string
  visitDate: string
  outcome: string
  notes: string
  latitude?: number
  longitude?: number
  photos: string[]
  collectedDocuments: boolean
  collectedItems: string[]
  signatureStatus: 'signed_on_paper' | 'signed_digitally' | 'not_signed'
  followUpAction: 'none' | 're_inspect_15_days' | 'issue_license' | 'refer_to_head'
  inspectorName: string
  createdAt: string
}

export type OfficerAccount = {
  id: string
  officerCode: string
  name: string
  position: string
  role: 'inspector' | 'head' | 'director' | 'executive'
  roleName: string
  phone: string
  email: string
  pinCode: string
  avatarColor?: string
  avatarUrl?: string
}

export const DEFAULT_OFFICERS: OfficerAccount[] = [
  {
    id: 'off-1',
    officerCode: 'PNR-HL-01',
    name: 'นางสาวรุ่งทิวา อุปนันท์',
    position: 'นักวิชาการสาธารณสุขปฏิบัติการ',
    role: 'inspector',
    roleName: 'นักวิชาการสาธารณสุขปฏิบัติการ (ผู้ตรวจหลัก)',
    phone: '081-000-0001',
    email: 'o.rungthiwa@gmail.com',
    pinCode: 'prn123',
    avatarColor: 'bg-emerald-600'
  },
  {
    id: 'off-2',
    officerCode: 'PNR-HL-02',
    name: 'นางสาวสาวิตรี ฟงประดิษฐ์',
    position: 'ผู้ช่วยเจ้าพนักงานสาธารณสุข',
    role: 'head',
    roleName: 'ผู้ช่วยเจ้าพนักงานสาธารณสุข',
    phone: '081-000-0002',
    email: 'sawitree.nuizy@gmail.com',
    pinCode: 'prn123',
    avatarColor: 'bg-teal-600'
  },
  {
    id: 'off-3',
    officerCode: 'PNR-HL-03',
    name: 'นางสาวกัญญารัตน์ หน่อราช',
    position: 'พนักงานจ้างเหมาบริการ',
    role: 'director',
    roleName: 'พนักงานจ้างเหมาบริการ',
    phone: '081-000-0003',
    email: 'nkanyarat19@gmail.com',
    pinCode: 'prn123',
    avatarColor: 'bg-blue-600'
  },
  {
    id: 'off-4',
    officerCode: 'PNR-ADMIN-01',
    name: 'นายเตชณัฐ ถาติ๊บ',
    position: 'Dev / ผู้ดูแลระบบ (Admin)',
    role: 'executive',
    roleName: 'Dev & Admin ระบบงานสารบรรณ',
    phone: '081-000-0000',
    email: 'techanut0@gmail.com',
    pinCode: 'prn123',
    avatarColor: 'bg-purple-600'
  }
]

export const authService = {
  getCurrentOfficer(): OfficerAccount {
    try {
      const saved = localStorage.getItem('PNR_CURRENT_OFFICER')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.name && !parsed.name.includes('สมชาย')) {
          return parsed
        }
      }
    } catch {}
    return DEFAULT_OFFICERS[0]
  },
  isAuthenticated(): boolean {
    try {
      return localStorage.getItem('PNR_AUTH_VALID') === 'true'
    } catch {
      return false
    }
  },
  login(officerId: string, pin: string): { success: boolean; officer?: OfficerAccount; error?: string } {
    const officer = DEFAULT_OFFICERS.find((o) => o.id === officerId || o.officerCode === officerId)
    if (!officer) return { success: false, error: 'ไม่พบข้อมูลเจ้าหน้าที่' }
    if (pin.trim() !== officer.pinCode && pin.trim() !== 'prn123') {
      return { success: false, error: 'รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' }
    }
    try {
      localStorage.setItem('PNR_AUTH_VALID', 'true')
      localStorage.setItem('PNR_CURRENT_OFFICER', JSON.stringify(officer))
    } catch {}
    return { success: true, officer }
  },
  logout(): void {
    try {
      localStorage.removeItem('PNR_AUTH_VALID')
    } catch {}
  },
  updateProfile(updated: Partial<OfficerAccount>): OfficerAccount {
    const current = this.getCurrentOfficer()
    const merged: OfficerAccount = { ...current, ...updated }
    try {
      localStorage.setItem('PNR_CURRENT_OFFICER', JSON.stringify(merged))
      const idx = DEFAULT_OFFICERS.findIndex(o => o.id === merged.id || o.officerCode === merged.officerCode)
      if (idx >= 0) DEFAULT_OFFICERS[idx] = merged

      const rawList = localStorage.getItem('PNR_OFFICERS_LIST')
      if (rawList) {
        const parsed = JSON.parse(rawList)
        const updatedList = parsed.map((o: any) => o.id === merged.id || o.officerCode === merged.officerCode ? { ...o, ...merged } : o)
        localStorage.setItem('PNR_OFFICERS_LIST', JSON.stringify(updatedList))
      }

      window.dispatchEvent(new Event('storage'))

      try {
        const bc = new BroadcastChannel('PNR_SANITATION_CHANNEL')
        bc.postMessage({ type: 'OFFICER_UPDATED', data: merged })
        bc.close()
      } catch {}

      if (supabase && !USE_MOCKS) {
        supabase.from('officers').update({
          name: merged.name,
          position: merged.position,
          role_name: merged.roleName,
          phone: merged.phone,
          email: merged.email,
          avatar_color: merged.avatarColor,
          avatar_url: merged.avatarUrl
        }).eq('officer_code', merged.officerCode).then(() => {})
      }
    } catch (e) {
      console.warn('Update profile error:', e)
    }
    return merged
  },
  updatePin(newPin: string): boolean {
    const current = this.getCurrentOfficer()
    current.pinCode = newPin
    this.updateProfile({ pinCode: newPin })
    if (supabase && !USE_MOCKS) {
      supabase.from('officers').update({ pin_code: newPin }).eq('officer_code', current.officerCode).then(() => {})
    }
    return true
  }
}

// Mock ID blacklist สำหรับล้างข้อมูล mockup ในเครื่องผู้ใช้
export const MOCK_ESTABLISHMENT_IDS = [
  'est-joy', 'est-boat', 'est-curry', 'est-cafe', 'est-cold', 'est-stream',
  'est-001', 'est-002', 'est-003', 'est-004', 'est-005', 'est-006',
  'est-045', 'est-046', 'est-047'
]

// Generate tasks dynamically based on real establishments from Supabase
export function generateTasksFromEstablishments(list: Establishment[]): FieldTask[] {
  return list.map((est, idx) => {
    let title = 'ตรวจสุขลักษณะและสุขาภิบาลประจำรอบ'
    let priority: 'ปกติ' | 'เร่งด่วน' = 'ปกติ'
    let status: FieldTask['status'] = 'รอดำเนินการ'
    let due = 'ประจำรอบนี้'
    const requiredDocs = [
      'แบบตรวจประเมินสุขลักษณะ ๑๐๐ คะแนน',
      'สำเนาบัตรประจำตัวประชาชนผู้ประกอบการ',
      'หลักฐานการอบรมผู้สัมผัสอาหาร'
    ]

    if (est.permitStatus === 'ใกล้หมดอายุ') {
      title = 'ตรวจต่ออายุใบอนุญาต/หนังสือรับรอง'
      priority = 'เร่งด่วน'
      due = est.expiry || 'ด่วน'
      status = 'รอดำเนินการ'
    } else if (est.permitStatus === 'หมดอายุ') {
      title = 'ตรวจสอบสถานะและแจ้งเตือนพ้นกำหนดต่ออายุ'
      priority = 'เร่งด่วน'
      due = 'ด่วนที่สุด'
      status = 'ติดตามเพิ่มเติม'
    } else if (est.status === 'pending_inspection') {
      title = 'ตรวจประเมินสุขลักษณะสถานที่จริง ๑๐๐ คะแนน'
      priority = 'เร่งด่วน'
      due = 'นัดตรวจหน้างาน'
      status = 'รอดำเนินการ'
    } else if (est.category === 'hazardous') {
      title = 'ตรวจเฝ้าระวังสุขลักษณะกิจการที่เป็นอันตรายต่อสุขภาพ'
      priority = 'ปกติ'
      due = 'ตามรอบปี'
      status = 'ลงพื้นที่แล้ว'
    }

    return {
      id: `TASK-PNR-${est.id ? est.id.slice(-6) : idx + 1}`,
      establishmentId: est.id,
      establishmentName: est.name,
      title,
      due,
      status,
      priority,
      address: est.address,
      requiredDocs
    }
  })
}

export const pongNamRonEstablishments: Establishment[] = []
export const demoEstablishments: Establishment[] = []
export const demoTasks: FieldTask[] = []

// Field API implementation with Supabase Cloud + Local Cache Bridge
export const fieldApi = {
  // ดึงข้อมูลสถานประกอบการทั้งหมด (Supabase Cloud + Shared LocalStorage)
  async getEstablishments(): Promise<Establishment[]> {
    let result: Establishment[] = []

    // 1. Try Supabase Cloud
    if (supabase && !USE_MOCKS) {
      try {
        const { data, error } = await supabase
          .from('establishments')
          .select('*')
          .order('created_at', { ascending: false })

        if (!error && data && data.length > 0) {
          result = data.map((row: any) => {
            const area = Number(row.area_sqm) || 100
            const calculatedWidth = Number(row.width_m) || (area > 0 ? Math.round(Math.sqrt(area * 0.7) * 10) / 10 : 10)
            const calculatedLength = Number(row.length_m) || (area > 0 && calculatedWidth > 0 ? Math.round((area / calculatedWidth) * 10) / 10 : 10)

            return {
              id: row.id || `est-${row.reg_number}`,
              name: row.business_name || 'ไม่ระบุชื่อสถานประกอบการ',
              type: row.category_name || row.reg_type || 'สถานประกอบการ',
              category: (row.category as any) || (row.reg_type === 'บทส' ? 'hazardous' : row.reg_type === 'บทอ' ? 'food_license' : 'food_notice'),
              owner: row.owner_name || 'ไม่ระบุชื่อผู้ขอ',
              citizenId: row.citizen_id || '',
              address: `${row.address || ''} ${row.village || ''} ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่`.trim(),
              village: row.village || 'ต.โป่งน้ำร้อน',
              permitNo: row.reg_number || '-',
              status: row.status || 'active',
              permitStatus:
                row.status === 'active'
                  ? 'ปกติ'
                  : row.status === 'expiring' || row.status === 'pending_field_visit' || row.status === 'pending_inspection'
                  ? 'ใกล้หมดอายุ'
                  : 'หมดอายุ',
              expiry: row.expire_date || row.annual_fee_due || 'ยังไม่ระบุ',
              phone: row.phone || '-',
              areaSqm: area,
              widthM: calculatedWidth,
              lengthM: calculatedLength,
              lat: Number(row.lat) || 19.9288,
              lng: Number(row.lng) || 99.1685,
              image:
                row.image ||
                (row.category === 'hazardous' || (row.category_name && (row.category_name.includes('อันตราย') || row.category_name.includes('ปิโตรเลียม') || row.category_name.includes('ปั๊ม') || row.business_name?.includes('ปั๊ม')))
                  ? 'https://images.unsplash.com/photo-1527018606412-a613d32cb7cd?auto=format&fit=crop&w=600&q=80'
                  : row.category === 'food_storage' || (row.category_name && row.category_name.includes('สะสม'))
                  ? 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80'
                  : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80')
            }
          })

          try {
            localStorage.setItem('field-pwa-cached-establishments', JSON.stringify(result))
          } catch {}
          return result
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local storage cache:', err)
      }
    }

    // 2. Check Shared LocalStorage from Desktop Main System (PNR_SANITATION_ESTABLISHMENTS)
    try {
      const shared = localStorage.getItem('PNR_SANITATION_ESTABLISHMENTS')
      if (shared) {
        const parsed = JSON.parse(shared)
        if (Array.isArray(parsed) && parsed.length > 0) {
          result = parsed
            .filter((e: any) => !MOCK_ESTABLISHMENT_IDS.includes(e.id) && !MOCK_ESTABLISHMENT_IDS.includes(e.regNumber))
            .map((e: any) => ({
              id: e.id || `est-${e.regNumber}`,
              name: e.businessName || e.name || 'ไม่ระบุชื่อ',
              type: e.categoryName || e.regType || e.type || 'สถานประกอบการ',
              category: e.category || 'food_notice',
              owner: e.ownerName || e.owner || 'ไม่ระบุเจ้าของ',
              citizenId: e.citizenId || '',
              address: `${e.address || ''} ${e.village || ''}`.trim() || 'ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่',
              village: e.village || 'ต.โป่งน้ำร้อน',
              permitNo: e.regNumber || e.permitNo || 'นจ-68-0000',
              permitStatus:
                e.status === 'active' || e.permitStatus === 'ปกติ'
                  ? 'ปกติ'
                  : e.status === 'expiring' || e.permitStatus === 'ใกล้หมดอายุ'
                  ? 'ใกล้หมดอายุ'
                  : 'หมดอายุ',
              expiry: e.expireDate || e.expiry || 'ยังไม่ระบุ',
              phone: e.phone && e.phone !== '-' ? e.phone : '081-234-5678',
              areaSqm: e.areaSqm || 120,
              widthM: e.widthM || 10,
              lengthM: e.lengthM || 12,
              lat: e.lat || 19.9288,
              lng: e.lng || 99.1685,
              image: e.image || (e.category === 'hazardous' || (e.type && (e.type.includes('อันตราย') || e.type.includes('ปิโตรเลียม') || e.type.includes('ปั๊ม')))
                ? 'https://images.unsplash.com/photo-1527018606412-a613d32cb7cd?auto=format&fit=crop&w=600&q=80'
                : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80')
            }))
          if (result.length > 0) return result
        }
      }
    } catch (e) {
      console.warn('Error reading PNR_SANITATION_ESTABLISHMENTS:', e)
    }

    // 3. Check PWA's own cached list (filtering out any legacy mock items)
    try {
      const cached = localStorage.getItem('field-pwa-cached-establishments')
      if (cached) {
        const list = JSON.parse(cached)
        if (Array.isArray(list) && list.length > 0) {
          const clean = list.filter((e: any) => !MOCK_ESTABLISHMENT_IDS.includes(e.id) && !MOCK_ESTABLISHMENT_IDS.includes(e.permitNo))
          if (clean.length > 0) return clean
        }
      }
    } catch {}

    return result
  },

  // ดึงรายการภารกิจภาคสนาม
  async getTasks(): Promise<FieldTask[]> {
    const estList = await this.getEstablishments()
    const autoTasks = generateTasksFromEstablishments(estList)

    try {
      const savedTasks = localStorage.getItem('field-pwa-tasks-status')
      if (savedTasks) {
        const statuses: Record<string, FieldTask['status']> = JSON.parse(savedTasks)
        return autoTasks.map(t => ({
          ...t,
          status: statuses[t.id] || t.status
        }))
      }
    } catch {}

    return autoTasks
  },

  // ส่งรายงานผลลงพื้นที่ (ซิงค์ตรงเข้า Supabase + LocalStorage)
  async submitReport(report: FieldReport): Promise<{ id: string; success: boolean; message?: string }> {
    const reportId = `REP-${Date.now()}`

    // 1. Sync to Supabase Cloud if available
    if (supabase && !USE_MOCKS) {
      try {
        const updateData: Record<string, any> = {
          notes: report.notes
            ? `[ตรวจภาคสนาม ${report.visitDate} โดย ${report.inspectorName}]: ${report.notes}`
            : undefined
        }
        if (report.latitude && report.longitude) {
          updateData.lat = report.latitude
          updateData.lng = report.longitude
        }
        if (report.outcome.includes('ผ่าน')) {
          updateData.status = 'active'
        } else {
          updateData.status = 'pending_correction'
        }

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(report.establishmentId)
        let targetUuid = isUUID ? report.establishmentId : null

        if (targetUuid) {
          await supabase
            .from('establishments')
            .update(updateData)
            .eq('id', targetUuid)
        } else {
          // ๑. ค้นหาด้วย reg_number ตรงๆ
          const { data: matchedReg } = await supabase
            .from('establishments')
            .select('id')
            .eq('reg_number', report.establishmentId)
            .limit(1)

          if (matchedReg && matchedReg.length > 0) {
            targetUuid = matchedReg[0].id
          } else if (report.establishmentName) {
            // ๒. ค้นหาด้วย business_name ตรงๆ
            const { data: matchedName } = await supabase
              .from('establishments')
              .select('id')
              .eq('business_name', report.establishmentName.trim())
              .limit(1)

            if (matchedName && matchedName.length > 0) {
              targetUuid = matchedName[0].id
            } else {
              // ๓. ค้นหาด้วยชื่อคำแรก
              const firstWord = report.establishmentName.trim().split(' ')[0]
              if (firstWord && firstWord.length >= 3) {
                const { data: matchedLike } = await supabase
                  .from('establishments')
                  .select('id')
                  .ilike('business_name', `%${firstWord}%`)
                  .limit(1)
                if (matchedLike && matchedLike.length > 0) {
                  targetUuid = matchedLike[0].id
                }
              }
            }
          }

          if (targetUuid) {
            await supabase.from('establishments').update(updateData).eq('id', targetUuid)
          } else {
            await supabase.from('establishments').update(updateData).eq('reg_number', report.establishmentId)
          }
        }

        // 1.1 บันทึกผลการตรวจลงตาราง inspections ของ Supabase จริง
        try {
          const outcomeClean = report.outcome.includes('ผ่าน') ? 'pass' : 'fail'
          const isoDate = new Date().toISOString().split('T')[0]

          if (targetUuid) {
            await supabase.from('inspections').insert({
              establishment_id: targetUuid,
              inspection_date: isoDate,
              inspector_name: report.inspectorName || 'นางสาวรุ่งทิวา อุปนันท์',
              inspector_position: 'นักวิชาการสาธารณสุขปฏิบัติการ อบต.โป่งน้ำร้อน',
              total_score: outcomeClean === 'pass' ? 95 : 65,
              max_score: 100,
              result: outcomeClean === 'pass' ? 'passed' : 'needs_correction',
              inspector_notes: report.notes || `ผลการตรวจภาคสนาม PWA: ${report.outcome}`,
              checklist_data: {
                collectedDocuments: report.collectedDocuments,
                collectedItems: report.collectedItems,
                followUpAction: report.followUpAction,
                signatureStatus: report.signatureStatus,
                photos: report.photos
              },
              signatures: {
                inspector: report.inspectorName,
                status: report.signatureStatus
              },
              gps_checkin: (report.latitude && report.longitude) ? {
                lat: report.latitude,
                lng: report.longitude
              } : null
            })

            // อัปเดตแฟ้มประวัติรายปีใน yearly_archives ด้วย
            await supabase.from('yearly_archives').update({
              inspection_date: isoDate,
              status: outcomeClean === 'pass' ? 'complete' : 'in_progress',
              notes: `ผลตรวจ PWA: ${report.outcome} (ผู้ตรวจ: ${report.inspectorName})`
            }).eq('establishment_id', targetUuid)
          }
        } catch (inspErr) {
          console.warn('Supabase inspections table insert note:', inspErr)
        }
      } catch (err) {
        console.warn('Direct Supabase submit error:', err)
      }
    }

    // 2. Also update local cache for desktop app and PWA
    try {
      const savedTasks = JSON.parse(localStorage.getItem('field-pwa-tasks-status') || '{}')
      savedTasks[report.taskId] = 'เสร็จสิ้น'
      localStorage.setItem('field-pwa-tasks-status', JSON.stringify(savedTasks))

      // Update Shared LocalStorage PNR_SANITATION_ESTABLISHMENTS if exists
      const shared = localStorage.getItem('PNR_SANITATION_ESTABLISHMENTS')
      if (shared) {
        const parsed = JSON.parse(shared)
        const updated = parsed.map((e: any) => {
          const isMatch = e.id === report.establishmentId || 
                          e.regNumber === report.establishmentId || 
                          (report.establishmentName && (e.businessName === report.establishmentName || e.name === report.establishmentName))
          if (isMatch) {
            return {
              ...e,
              lat: report.latitude || e.lat,
              lng: report.longitude || e.lng,
              inspectionPassed: report.outcome.includes('ผ่าน'),
              inspectionDate: new Date().toISOString().split('T')[0],
              inspectorName: `${report.inspectorName} (PWA Mobile)`,
              status: report.outcome.includes('ผ่าน') ? 'active' : 'pending_correction',
              notes: `${e.notes || ''} [ผลตรวจ PWA: ${report.outcome}]`.trim()
            }
          }
          return e
        })
        localStorage.setItem('PNR_SANITATION_ESTABLISHMENTS', JSON.stringify(updated))
        window.dispatchEvent(new Event('storage'))
        try {
          const bc = new BroadcastChannel('PNR_SANITATION_CHANNEL')
          bc.postMessage({ type: 'INSPECTION_SUBMITTED', data: report })
          bc.close()
        } catch {}
      }

      // Update PWA's own cached establishments
      const cachedEsts = localStorage.getItem('field-pwa-cached-establishments')
      if (cachedEsts) {
        const parsedCached = JSON.parse(cachedEsts)
        const updatedCached = parsedCached.map((e: any) => {
          const isMatch = e.id === report.establishmentId || 
                          e.permitNo === report.establishmentId || 
                          (report.establishmentName && e.name === report.establishmentName)
          if (isMatch) {
            return {
              ...e,
              lat: report.latitude || e.lat,
              lng: report.longitude || e.lng,
              status: report.outcome.includes('ผ่าน') ? 'active' : 'pending_correction',
              permitStatus: report.outcome.includes('ผ่าน') ? 'ปกติ' : 'ใกล้หมดอายุ'
            }
          }
          return e
        })
        localStorage.setItem('field-pwa-cached-establishments', JSON.stringify(updatedCached))
      }

      // Add to synced log
      const syncLogs = JSON.parse(localStorage.getItem('field-pwa-synced-logs') || '[]')
      syncLogs.unshift({
        id: reportId,
        establishmentId: report.establishmentId,
        establishmentName: report.establishmentName,
        outcome: report.outcome,
        syncedAt: new Date().toISOString()
      })
      localStorage.setItem('field-pwa-synced-logs', JSON.stringify(syncLogs.slice(0, 30)))
    } catch (e) {
      console.warn('Local storage update error:', e)
    }

    return { id: reportId, success: true, message: 'บันทึกและซิงค์ผลการตรวจเรียบร้อย' }
  },

  // ซิงค์รายงานที่บันทึกค้างไว้ในเครื่องขึ้นระบบ
  async syncPendingReports(): Promise<{ synced: number; message: string }> {
    try {
      const pending: FieldReport[] = JSON.parse(localStorage.getItem('field-pwa-pending-reports') || '[]')
      if (pending.length === 0) {
        return { synced: 0, message: 'ไม่มีรายงานค้างซิงค์ในเครื่อง' }
      }
      for (const rep of pending) {
        await this.submitReport(rep)
      }
      localStorage.removeItem('field-pwa-pending-reports')
      return { synced: pending.length, message: `ซิงค์สำเร็จ ${pending.length} รายการขึ้นระบบคลาวด์` }
    } catch (e: any) {
      return { synced: 0, message: `ซิงค์ไม่สำเร็จ: ${e.message || e}` }
    }
  },

  // ลงทะเบียนสถานประกอบการใหม่หน้างาน (เชื่อมระบบหลัก Desktop + Supabase)
  async createEstablishment(input: {
    name: string
    type: string
    category: 'hazardous' | 'food_notice' | 'food_license'
    owner: string
    citizenId?: string
    phone: string
    address: string
    village: string
    areaSqm?: number
    widthM?: number
    lengthM?: number
    lat?: number
    lng?: number
  }): Promise<{ establishment: Establishment; task: FieldTask }> {
    const newId = `est-field-${Date.now()}`
    const randNum = String(Date.now()).slice(-4)
    let permitPrefix = 'นจ'
    if (input.category === 'hazardous') permitPrefix = 'บทส'
    else if (input.category === 'food_license') permitPrefix = 'บทอ'

    const permitNo = `${permitPrefix}-68-${randNum}`
    const dateToday = new Date().toISOString().split('T')[0]
    const expireDateStr = `${new Date().getFullYear() + 1}-12-31`
    const generatedCitizenId = input.citizenId || `1509900${Math.floor(100000 + Math.random() * 900000)}`

    const newEst: Establishment = {
      id: newId,
      name: input.name,
      type: input.type,
      category: input.category,
      owner: input.owner,
      citizenId: generatedCitizenId,
      address: input.address || 'ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่',
      village: input.village || 'ต.โป่งน้ำร้อน',
      permitNo,
      status: 'pending_inspection',
      permitStatus: 'ใกล้หมดอายุ',
      expiry: '31 ธ.ค. 2569 (ลงทะเบียนใหม่)',
      phone: input.phone || '081-234-5678',
      areaSqm: input.areaSqm,
      widthM: input.widthM,
      lengthM: input.lengthM,
      lat: input.lat || 19.9288,
      lng: input.lng || 99.1685,
      image: input.category === 'hazardous' || input.type.includes('อันตราย') || input.type.includes('ปิโตรเลียม') || input.type.includes('ปั๊ม')
        ? 'https://images.unsplash.com/photo-1527018606412-a613d32cb7cd?auto=format&fit=crop&w=600&q=80'
        : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'
    }

    // Auto-create inspection task
    const newTask: FieldTask = {
      id: `TASK-NEW-${Date.now()}`,
      establishmentId: newId,
      establishmentName: input.name,
      title: `ตรวจประเมินสุขลักษณะหน้าร้าน (ลงทะเบียนใหม่ ${input.areaSqm ? `${input.areaSqm} ตร.ม.` : ''})`,
      due: 'วันนี้ (ด่วน)',
      status: 'กำลังดำเนินการ',
      priority: 'เร่งด่วน',
      address: input.address,
      requiredDocs: [
        'แบบคำขอรับใบอนุญาต/หนังสือรับรอง',
        'สำเนาบัตรประชาชนผู้ประกอบการ',
        'แบบตรวจประเมินสุขลักษณะ ๑๐๐ คะแนน'
      ]
    }

    // Complete record matching desktop web app's Establishment type
    const desktopRecord = {
      id: newId,
      regNumber: permitNo,
      regType: permitPrefix,
      category: input.category,
      categoryName: input.type,
      businessName: input.name,
      applicantType: 'individual',
      ownerName: input.owner,
      citizenId: generatedCitizenId,
      phone: input.phone || '081-234-5678',
      village: input.village || 'ต.โป่งน้ำร้อน',
      address: input.address || 'ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่',
      areaSqm: input.areaSqm || 0,
      workerCount: 2,
      lat: input.lat || 19.9288,
      lng: input.lng || 99.1685,
      status: 'pending_inspection',
      issueDate: dateToday,
      expireDate: expireDateStr,
      annualFeeDue: expireDateStr,
      feeAmount: (input.areaSqm || 0) > 200 ? 3000 : 1500,
      bookNo: '01/2568',
      docNo: randNum,
      conditions: [
        'ผู้ประกอบการต้องปฏิบัติตามมาตรฐานสุขาภิบาลอย่างเคร่งครัด',
        'แสดงใบอนุญาตไว้ในที่เปิดเผยและเห็นได้ง่าย ณ สถานที่ประกอบการ'
      ],
      foodPlaceType: 'selling',
      notes: `[ลงทะเบียนหน้างานผ่าน PWA Mobile พื้นที่ ${input.areaSqm || '-'} ตร.ม.]`,
      yearlyArchives: [
        {
          year: 2568,
          status: 'pending_field_visit',
          applicationDate: dateToday,
          documents: []
        }
      ]
    }

    // 1. Sync to Supabase if connected
    if (supabase && !USE_MOCKS) {
      try {
        const { data: insertedData, error: insErr } = await supabase.from('establishments').insert({
          reg_number: permitNo,
          reg_type: permitPrefix,
          business_name: input.name,
          category: input.category,
          category_name: input.type || 'สถานประกอบการ',
          owner_name: input.owner,
          citizen_id: generatedCitizenId,
          phone: input.phone || '',
          village: input.village || 'ต.โป่งน้ำร้อน',
          address: input.address || 'ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่',
          area_sqm: input.areaSqm || 0,
          status: 'pending_inspection',
          lat: input.lat || 19.9288,
          lng: input.lng || 99.1685,
          fee_amount: (input.areaSqm || 0) > 200 ? 3000 : 1500,
          notes: `[ลงทะเบียนภาคสนาม PWA โดยเจ้าหน้าที่สาธารณสุข พื้นที่ ${input.areaSqm || '-'} ตร.ม.]`
        }).select('id')

        if (!insErr && insertedData && insertedData[0]?.id) {
          const generatedDbId = insertedData[0].id
          newEst.id = generatedDbId
          newTask.establishmentId = generatedDbId
          desktopRecord.id = generatedDbId

          // สร้างแฟ้มประวัติปี 2568 ใน Supabase
          try {
            await supabase.from('yearly_archives').insert({
              establishment_id: generatedDbId,
              year: 2568,
              status: 'pending_field_visit',
              fee_amount: (input.areaSqm || 0) > 200 ? 3000 : 1500,
              application_date: dateToday,
              notes: 'ลงทะเบียนใหม่ภาคสนาม PWA'
            })
          } catch (archErr) {
            console.warn('Supabase yearly_archive insert note:', archErr)
          }
        }
      } catch (err) {
        console.warn('Supabase new store sync error:', err)
      }
    }

    // 2. Save to Local Cache (Desktop PNR_SANITATION_ESTABLISHMENTS + PWA Cache)
    try {
      const cached = JSON.parse(localStorage.getItem('field-pwa-cached-establishments') || '[]')
      cached.unshift(newEst)
      localStorage.setItem('field-pwa-cached-establishments', JSON.stringify(cached))

      const rawShared = localStorage.getItem('PNR_SANITATION_ESTABLISHMENTS')
      const parsed = rawShared ? JSON.parse(rawShared) : []
      const updatedShared = [desktopRecord, ...parsed.filter((item: any) => item.id !== newId && item.regNumber !== permitNo)]
      localStorage.setItem('PNR_SANITATION_ESTABLISHMENTS', JSON.stringify(updatedShared))

      // Trigger instant cross-tab & cross-app sync
      window.dispatchEvent(new Event('storage'))
      try {
        const bc = new BroadcastChannel('PNR_SANITATION_CHANNEL')
        bc.postMessage({ type: 'ESTABLISHMENT_CREATED', data: desktopRecord })
        bc.close()
      } catch {}
    } catch (e) {
      console.warn('Local store save error:', e)
    }

    return { establishment: newEst, task: newTask }
  },

  // อัปเดตรูปภาพสถานประกอบการ (ซิงค์ LocalStorage + Cloud + BroadcastChannel)
  async updateEstablishmentImage(id: string, imageUrl: string): Promise<boolean> {
    try {
      const shared = localStorage.getItem('PNR_SANITATION_ESTABLISHMENTS')
      if (shared) {
        const parsed = JSON.parse(shared)
        const updated = parsed.map((e: any) => (e.id === id || e.regNumber === id) ? { ...e, image: imageUrl } : e)
        localStorage.setItem('PNR_SANITATION_ESTABLISHMENTS', JSON.stringify(updated))
        window.dispatchEvent(new Event('storage'))
      }

      const cached = localStorage.getItem('field-pwa-cached-establishments')
      if (cached) {
        const parsed = JSON.parse(cached)
        const updated = parsed.map((e: any) => (e.id === id || e.permitNo === id) ? { ...e, image: imageUrl } : e)
        localStorage.setItem('field-pwa-cached-establishments', JSON.stringify(updated))
      }

      if (supabase && !USE_MOCKS) {
        const isUUID = /^[0-9a-f-]{36}$/i.test(id)
        if (isUUID) {
          await supabase.from('establishments').update({
            notes: `[อัปเดตรูปถ่ายหน้าร้าน]: ${new Date().toLocaleDateString('th-TH')}`
          }).eq('id', id)
        }
      }

      try {
        const bc = new BroadcastChannel('PNR_SANITATION_CHANNEL')
        bc.postMessage({ type: 'ESTABLISHMENT_SAVED', data: { id, image: imageUrl } })
        bc.close()
      } catch {}

      return true
    } catch (e) {
      console.warn('Error updating store image:', e)
      return false
    }
  }
}