import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Establishment,
  InspectionRecord,
  SystemSettings,
  YearDossier,
  ArchiveDocumentType,
  AuditLog
} from '../types/publicHealth';
import { DEFAULT_SYSTEM_SETTINGS } from '../types/publicHealth';
import { INITIAL_ESTABLISHMENTS } from './publicHealthMockData';

export interface OfficerAccount {
  id: string;
  officerCode: string;
  name: string;
  position: string;
  role: 'inspector' | 'head' | 'director' | 'executive';
  roleName: string;
  phone: string;
  email: string;
  pinCode: string; // รหัสผ่านหรือ PIN
  avatarColor: string;
  avatarUrl?: string;
  signatureUrl?: string; // ลายมือชื่อดิจิทัลสำหรับลงนามในเอกสาร
  lineId?: string; // LINE ID สำหรับติดต่อประสานงาน
}

/**
 * ฟังก์ชันสร้าง SHA-256 Hash สำหรับรหัส PIN ของเจ้าหน้าที่ (Web Crypto API)
 */
export async function hashPin(pin: string): Promise<string> {
  const clean = pin.trim();
  if (!clean) return '';
  try {
    const msgBuffer = new TextEncoder().encode(clean);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return clean;
  }
}

// รายชื่อเจ้าหน้าที่จริง กองสาธารณสุข อบต.โป่งน้ำร้อน
export const DEFAULT_OFFICERS: OfficerAccount[] = [
  {
    id: 'off-1',
    officerCode: 'PNR-HL-01',
    name: 'นางสาวรุ่งทิวา อุปนันท์',
    position: 'นักวิชาการสาธารณสุขปฏิบัติการ',
    role: 'inspector',
    roleName: 'นักวิชาการสาธารณสุขปฏิบัติการ (ทุกบทบาท)',
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
    roleName: 'ผู้ช่วยเจ้าพนักงานสาธารณสุข (ทุกบทบาท)',
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
    roleName: 'พนักงานจ้างเหมาบริการ (ทุกบทบาท)',
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
    roleName: 'Dev & Admin ระบบงานสารบรรณ (ทุกบทบาท)',
    phone: '081-000-0000',
    email: 'techanut0@gmail.com',
    pinCode: 'admin123',
    avatarColor: 'bg-indigo-600'
  }
];

class SanitationDataService {
  private supabase: SupabaseClient | null = null;
  private isCloudActive = false;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co') {
      try {
        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
        this.isCloudActive = true;
        console.log('✓ Sanitation Data Service: Supabase Cloud Connected');
      } catch (err) {
        console.warn('Supabase init failed, falling back to LocalStorage:', err);
        this.isCloudActive = false;
      }
    } else {
      this.isCloudActive = false;
      console.log('⚡ Sanitation Data Service: Running in Local Persistence Mode (Zero Cost)');
    }
  }

  isUsingCloud(): boolean {
    return this.isCloudActive;
  }

  // ๑. ดึงรายชื่อเจ้าหน้าที่ทั้งหมด (ดึงจาก Supabase Cloud หรือ LocalStorage)
  async getOfficers(): Promise<OfficerAccount[]> {
    if (this.isCloudActive && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('officers')
          .select('*')
          .eq('is_active', true)
          .order('officer_code', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({
            id: row.id,
            officerCode: row.officer_code,
            name: row.name,
            position: row.position,
            role: row.role,
            roleName: row.role_name || row.position,
            phone: row.phone || '',
            email: row.email || '',
            pinCode: row.pin_code,
            avatarColor: row.avatar_color || 'bg-emerald-600'
          }));
        }
      } catch (err) {
        console.warn('Cloud officers fetch fallback to local:', err);
      }
    }

    try {
      const saved = localStorage.getItem('PNR_OFFICERS_LIST');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }

    return DEFAULT_OFFICERS;
  }

  // บันทึก / เพิ่มเจ้าหน้าที่ใหม่
  async saveOfficer(officer: OfficerAccount): Promise<boolean> {
    try {
      const list = await this.getOfficers();
      const idx = list.findIndex(o => o.officerCode === officer.officerCode || o.id === officer.id);
      let updated: OfficerAccount[];
      if (idx >= 0) {
        updated = [...list];
        updated[idx] = officer;
      } else {
        updated = [...list, officer];
      }
      localStorage.setItem('PNR_OFFICERS_LIST', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    if (this.isCloudActive && this.supabase) {
      try {
        await this.supabase.from('officers').upsert({
          officer_code: officer.officerCode,
          name: officer.name,
          position: officer.position,
          role: officer.role,
          role_name: officer.roleName,
          phone: officer.phone,
          email: officer.email,
          pin_code: officer.pinCode,
          avatar_color: officer.avatarColor,
          is_active: true
        }, { onConflict: 'officer_code' });
      } catch (err) {
        console.warn('Could not sync officer to cloud:', err);
      }
    }

    return true;
  }

  // ตรวจสอบความถูกต้องของรหัส PIN (รองรับทั้ง Plain Text และ SHA-256 Hash)
  async verifyPin(officer: OfficerAccount, pin: string): Promise<boolean> {
    const cleanPin = pin.trim();
    if (!cleanPin) return false;

    // 1. ตรวจสอบรหัสเดิมแบบ Plain text (สำหรับค่าเริ่มต้นระบบ)
    if (officer.pinCode === cleanPin) return true;

    // 2. ตรวจสอบรหัสแบบ SHA-256 Hash
    const hashedInput = await hashPin(cleanPin);
    if (officer.pinCode === hashedInput) return true;

    return false;
  }

  // ยืนยันตัวตนเจ้าหน้าที่ด้วย Email / รหัสเจ้าหน้าที่ + รหัสผ่าน
  async authenticateOfficer(identifier: string, pinCode: string): Promise<OfficerAccount | null> {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPin = pinCode.trim();
    if (!cleanPin) return null;

    const officersList = await this.getOfficers();
    const officer = officersList.find(
      (o) =>
        o.officerCode.toLowerCase() === cleanId ||
        o.email.toLowerCase() === cleanId ||
        o.phone === cleanId ||
        o.id === cleanId
    );

    if (!officer) return null;

    const isValid = await this.verifyPin(officer, cleanPin);
    if (isValid) {
      // Auto-migrate: ถ้ารหัสเดิมยังเป็น Plain Text ให้แปลงเป็น SHA-256 ทันที
      if (officer.pinCode === cleanPin) {
        const hashed = await hashPin(cleanPin);
        officer.pinCode = hashed;
        await this.saveOfficer(officer);
      }
      localStorage.setItem('PNR_CURRENT_OFFICER', JSON.stringify(officer));
      return officer;
    }

    return null;
  }

  getCurrentOfficer(): OfficerAccount | null {
    try {
      const saved = localStorage.getItem('PNR_CURRENT_OFFICER');
      if (saved) {
        const parsed: OfficerAccount = JSON.parse(saved);
        const listStr = localStorage.getItem('PNR_OFFICERS_LIST');
        if (listStr) {
          const list: OfficerAccount[] = JSON.parse(listStr);
          const matched = list.find(o => o.officerCode === parsed.officerCode || o.id === parsed.id);
          if (matched) return { ...matched, ...parsed };
        }
        return parsed;
      }
    } catch {
      // fallback
    }
    const listStr = localStorage.getItem('PNR_OFFICERS_LIST');
    if (listStr) {
      try {
        const list: OfficerAccount[] = JSON.parse(listStr);
        if (list && list.length > 0) return list[0];
      } catch {}
    }
    return DEFAULT_OFFICERS[0]; // ค่าเริ่มต้น: นางสาวรุ่งทิวา อุปนันท์
  }

  logoutOfficer() {
    localStorage.removeItem('PNR_CURRENT_OFFICER');
  }

  // แปลงข้อมูลจาก Frontend Establishment เป็น Supabase Row
  private mapToDbRow(est: Establishment): Record<string, any> {
    return {
      reg_number: est.regNumber,
      reg_type: est.regType,
      category: est.category,
      category_name: est.categoryName,
      business_name: est.businessName,
      applicant_type: est.applicantType || 'individual',
      owner_name: est.ownerName,
      citizen_id: est.citizenId,
      phone: est.phone || '',
      email: est.email || null,
      village: est.village || '',
      address: est.address || '',
      area_sqm: est.areaSqm || 0,
      worker_count: est.workerCount || 1,
      machine_horsepower: est.machineHorsepower || 0,
      lat: est.lat || 19.9288,
      lng: est.lng || 99.1685,
      status: est.status || 'active',
      issue_date: est.issueDate || null,
      expire_date: est.expireDate || null,
      annual_fee_due: est.annualFeeDue || est.expireDate || null,
      fee_amount: est.feeAmount || 100,
      book_no: est.bookNo || '-',
      doc_no: est.docNo || null,
      food_place_type: est.foodPlaceType || 'selling',
      notes: est.notes || ''
    };
  }

  // แปลงข้อมูลจาก Supabase Row + Archives กลับมาเป็น Frontend Establishment
  private mapFromDbRow(row: any, fallbackEst?: Establishment): Establishment {
    let archives: YearDossier[] = [];

    if (row.yearly_archives && Array.isArray(row.yearly_archives) && row.yearly_archives.length > 0) {
      archives = row.yearly_archives.map((ya: any) => ({
        year: ya.year,
        status: ya.status || 'complete',
        applicationDate: ya.application_date || '',
        inspectionDate: ya.inspection_date || '',
        paymentDate: ya.payment_date || '',
        receiptNo: ya.receipt_no || '',
        feeAmount: ya.fee_amount || 100,
        licenseNo: ya.license_no || '',
        licenseIssueDate: ya.license_issue_date || '',
        licenseExpireDate: ya.license_expire_date || '',
        notes: ya.notes || '',
        documents: (ya.archived_documents || []).map((doc: any) => ({
          id: doc.id,
          type: doc.document_type as ArchiveDocumentType,
          title: doc.title,
          fileName: doc.file_name,
          fileSize: doc.file_size || '',
          fileUrl: doc.file_url || '',
          uploadedAt: doc.uploaded_at || '',
          uploadedBy: doc.uploaded_by || '',
          status: doc.status || 'verified',
          notes: doc.notes || ''
        }))
      }));
    } else if (fallbackEst?.yearlyArchives) {
      archives = fallbackEst.yearlyArchives;
    }

    return {
      id: row.id || fallbackEst?.id || `est-${Date.now()}`,
      regNumber: row.reg_number || fallbackEst?.regNumber || '',
      regType: row.reg_type || fallbackEst?.regType || 'บทส',
      category: row.category || fallbackEst?.category || 'hazardous',
      categoryName: row.category_name || fallbackEst?.categoryName || 'กิจการที่เป็นอันตรายต่อสุขภาพ',
      businessName: row.business_name || fallbackEst?.businessName || '',
      applicantType: row.applicant_type || fallbackEst?.applicantType || 'individual',
      ownerName: row.owner_name || fallbackEst?.ownerName || '',
      citizenId: row.citizen_id || fallbackEst?.citizenId || '',
      phone: row.phone || fallbackEst?.phone || '',
      email: row.email || fallbackEst?.email || '',
      village: row.village || fallbackEst?.village || 'หมู่ที่ 7 บ้านต้นผึ้งใต้',
      address: row.address || fallbackEst?.address || '',
      areaSqm: row.area_sqm || fallbackEst?.areaSqm || 0,
      workerCount: row.worker_count || fallbackEst?.workerCount || 1,
      machineHorsepower: row.machine_horsepower || fallbackEst?.machineHorsepower || 0,
      lat: row.lat || fallbackEst?.lat || 19.9288,
      lng: row.lng || fallbackEst?.lng || 99.1685,
      status: row.status || fallbackEst?.status || 'active',
      issueDate: row.issue_date || fallbackEst?.issueDate || '',
      expireDate: row.expire_date || fallbackEst?.expireDate || '',
      annualFeeDue: row.annual_fee_due || fallbackEst?.annualFeeDue || row.expire_date || '',
      feeAmount: row.fee_amount || fallbackEst?.feeAmount || 100,
      bookNo: row.book_no || fallbackEst?.bookNo || '-',
      docNo: row.doc_no || fallbackEst?.docNo || '',
      conditions: fallbackEst?.conditions || [
        'ผู้ประกอบการต้องปฏิบัติตามมาตรฐานสุขาภิบาลอย่างเคร่งครัด',
        'แสดงใบอนุญาตไว้ในที่เปิดเผยและเห็นได้ง่าย ณ สถานที่ประกอบการ'
      ],
      foodPlaceType: row.food_place_type || fallbackEst?.foodPlaceType || 'selling',
      notes: row.notes || fallbackEst?.notes || '',
      inspectionScore: fallbackEst?.inspectionScore || 100,
      inspectionPassed: fallbackEst?.inspectionPassed ?? true,
      inspectionDate: fallbackEst?.inspectionDate || row.issue_date,
      inspectorName: fallbackEst?.inspectorName || 'นางสาวรุ่งทิวา อุปนันท์',
      yearlyArchives: archives
    };
  }

  // ๒. ดึงข้อมูลสถานประกอบการทั้งหมดพร้อมแฟ้มเอกสารรายปี
  async getEstablishments(): Promise<Establishment[]> {
    const deletedIds: string[] = JSON.parse(localStorage.getItem('PNR_DELETED_ESTABLISHMENT_IDS') || '[]');

    let localCache: Establishment[] = [];
    try {
      const localData = localStorage.getItem('PNR_SANITATION_ESTABLISHMENTS');
      if (localData) {
        localCache = JSON.parse(localData);
      }
    } catch (e) {
      console.error('Error reading local cache:', e);
    }

    // กรองข้อมูลตัวอย่าง (Mock) และข้อมูลที่ถูกลบออกทั้งหมด
    localCache = localCache.filter(item => 
      !['est-001', 'est-002', 'est-003', 'est-004', 'est-005', 'est-006'].includes(item.id) &&
      !deletedIds.includes(item.id) &&
      !deletedIds.includes(item.regNumber)
    );

    if (localCache.length === 0 && !deletedIds.includes('est-044') && !deletedIds.includes('บทส-69-0044')) {
      localCache = INITIAL_ESTABLISHMENTS;
      localStorage.setItem('PNR_SANITATION_ESTABLISHMENTS', JSON.stringify(localCache));
      localStorage.setItem('PNR_SYSTEM_SEEDED', 'true');
    }

    if (this.isCloudActive && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('establishments')
          .select(`
            *,
            yearly_archives (
              id,
              year,
              status,
              application_date,
              inspection_date,
              payment_date,
              receipt_no,
              fee_amount,
              license_no,
              license_issue_date,
              license_expire_date,
              notes,
              archived_documents (
                id,
                document_type,
                title,
                file_name,
                file_size,
                file_url,
                uploaded_at,
                uploaded_by,
                status,
                notes
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const nonDeletedData = data.filter((row: any) => 
            !deletedIds.includes(row.id) && !deletedIds.includes(row.reg_number)
          );
          const merged = nonDeletedData.map((row: any) => {
            const matchedLocal = localCache.find(
              l => l.regNumber === row.reg_number || l.businessName === row.business_name
            );
            return this.mapFromDbRow(row, matchedLocal);
          });
          // เก็บแคชล่าสุด
          localStorage.setItem('PNR_SANITATION_ESTABLISHMENTS', JSON.stringify(merged));
        } else if (!error && (!data || data.length === 0) && deletedIds.length === 0) {
          const isSeeded = localStorage.getItem('PNR_SYSTEM_SEEDED') === 'true';
          if (!isSeeded) {
            // ถ้า Cloud ว่างและไม่เคยซี้ด ให้ซี้ดข้อมูลจริง
            for (const item of localCache) {
              await this.saveEstablishmentToCloud(item);
            }
            localStorage.setItem('PNR_SYSTEM_SEEDED', 'true');
          }
        }
      } catch (err) {
        console.warn('Cloud fetch failed, using local cache:', err);
      }
    }

    return localCache;
  }

  // อัปโหลดไฟล์เอกสารเข้าสู่ Supabase Storage Bucket 'pnr-documents'
  async uploadDocumentFile(
    file: File,
    regNumber: string,
    year: number,
    slotType: string
  ): Promise<string | null> {
    if (!this.isCloudActive || !this.supabase) return null;
    try {
      const fileExt = file.name.split('.').pop() || 'pdf';
      const cleanReg = regNumber ? regNumber.replace(/[\/\\]/g, '-').trim() : 'general';
      const filePath = `${cleanReg}/FY_${year}/${slotType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await this.supabase.storage
        .from('pnr-documents')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type || 'application/pdf'
        });

      if (uploadError) {
        console.warn('Supabase storage upload error:', uploadError);
        return null;
      }

      const { data: pubData } = this.supabase.storage
        .from('pnr-documents')
        .getPublicUrl(filePath);

      return pubData.publicUrl;
    } catch (err) {
      console.warn('Document upload failed:', err);
      return null;
    }
  }

  // ซิงค์สถานประกอบการและแฟ้มประวัติรายปีขึ้น Supabase Cloud
  private async saveEstablishmentToCloud(est: Establishment) {
    if (!this.isCloudActive || !this.supabase) return;
    try {
      const dbRow = this.mapToDbRow(est);
      let estId: string = est.id;

      // ๑. ตรวจสอบข้อมูลในตาราง establishments
      const { data: existing } = await this.supabase
        .from('establishments')
        .select('id')
        .eq('reg_number', est.regNumber)
        .limit(1);

      if (existing && existing.length > 0) {
        estId = existing[0].id;
        await this.supabase
          .from('establishments')
          .update(dbRow)
          .eq('id', estId);
      } else {
        const { data: inserted, error: insErr } = await this.supabase
          .from('establishments')
          .insert([dbRow])
          .select('id');
        if (!insErr && inserted && inserted.length > 0) {
          estId = inserted[0].id;
        }
      }

      // ๒. ซิงค์ Yearly Archives และ Archived Documents ถ้ามี
      if (est.yearlyArchives && est.yearlyArchives.length > 0 && estId) {
        for (const dossier of est.yearlyArchives) {
          const { data: archData, error: archErr } = await this.supabase
            .from('yearly_archives')
            .upsert({
              establishment_id: estId,
              year: dossier.year,
              status: dossier.status || 'complete',
              fee_amount: dossier.feeAmount || est.feeAmount || 100,
              receipt_no: dossier.receiptNo || est.receiptNo || null,
              license_no: dossier.licenseNo || est.docNo || null,
              license_issue_date: dossier.licenseIssueDate || est.issueDate || null,
              license_expire_date: dossier.licenseExpireDate || est.expireDate || null,
              notes: dossier.notes || null
            }, { onConflict: 'establishment_id,year' })
            .select('id');

          if (!archErr && archData && archData.length > 0) {
            const archId = archData[0].id;
            for (const doc of dossier.documents) {
              const { data: existingDoc } = await this.supabase
                .from('archived_documents')
                .select('id')
                .eq('archive_id', archId)
                .eq('document_type', doc.type)
                .maybeSingle();

              const enhancedPayload = {
                reg_number: est.regNumber || null,
                business_name: est.businessName || null,
                fiscal_year: dossier.year,
                title: doc.title,
                file_name: doc.fileName,
                file_size: doc.fileSize || '1.0 MB',
                file_url: doc.fileUrl,
                uploaded_by: doc.uploadedBy || 'เจ้าหน้าที่สาธารณสุข',
                status: doc.status || 'verified',
                notes: doc.notes || null
              };

              const fallbackPayload = {
                title: doc.title,
                file_name: doc.fileName,
                file_size: doc.fileSize || '1.0 MB',
                file_url: doc.fileUrl,
                uploaded_by: doc.uploadedBy || 'เจ้าหน้าที่สาธารณสุข',
                status: doc.status || 'verified',
                notes: doc.notes || null
              };

              if (existingDoc && existingDoc.id) {
                const { error: updErr } = await this.supabase
                  .from('archived_documents')
                  .update(enhancedPayload)
                  .eq('id', existingDoc.id);

                if (updErr) {
                  await this.supabase
                    .from('archived_documents')
                    .update(fallbackPayload)
                    .eq('id', existingDoc.id);
                }
              } else {
                const { error: insErr } = await this.supabase
                  .from('archived_documents')
                  .insert({
                    archive_id: archId,
                    document_type: doc.type,
                    ...enhancedPayload
                  });

                if (insErr) {
                  await this.supabase
                    .from('archived_documents')
                    .insert({
                      archive_id: archId,
                      document_type: doc.type,
                      ...fallbackPayload
                    });
                }
              }
            }
          }
        }
      }
    } catch (cloudErr) {
      console.warn('Cloud sync error:', cloudErr);
    }
  }

  // ๓. บันทึก / อัปเดตข้อมูลสถานประกอบการ
  async saveEstablishment(est: Establishment): Promise<Establishment> {
    try {
      const currentList = await this.getEstablishments();
      const existingIdx = currentList.findIndex(item => item.id === est.id || item.regNumber === est.regNumber);
      let updatedList: Establishment[];

      if (existingIdx >= 0) {
        updatedList = [...currentList];
        updatedList[existingIdx] = est;
      } else {
        updatedList = [est, ...currentList];
      }

      localStorage.setItem('PNR_SANITATION_ESTABLISHMENTS', JSON.stringify(updatedList));
    } catch (e) {
      console.error('Error saving local establishment:', e);
    }

    // ซิงค์ขึ้น Supabase Cloud
    await this.saveEstablishmentToCloud(est);

    return est;
  }

  // ๓.๑ ลบข้อมูลสถานประกอบการ (ลบจริงทั้งใน Supabase Cloud และ Local Cache ถาวร)
  async deleteEstablishment(idOrRegNumber: string, regNumberFallback?: string): Promise<boolean> {
    try {
      // ๑. บันทึกลง Blacklist / Deleted Set ทันที เพื่อป้องกันไม่ให้ถูกซี้ดกลับมา
      const deletedIds: string[] = JSON.parse(localStorage.getItem('PNR_DELETED_ESTABLISHMENT_IDS') || '[]');
      if (!deletedIds.includes(idOrRegNumber)) deletedIds.push(idOrRegNumber);
      if (regNumberFallback && !deletedIds.includes(regNumberFallback)) deletedIds.push(regNumberFallback);
      localStorage.setItem('PNR_SYSTEM_SEEDED', 'true');

      // ๒. ดึงและอัปเดต Local Cache ทันที
      const rawLocal = localStorage.getItem('PNR_SANITATION_ESTABLISHMENTS');
      let currentList: Establishment[] = rawLocal ? JSON.parse(rawLocal) : [];
      const target = currentList.find(
        item => item.id === idOrRegNumber ||
                item.regNumber === idOrRegNumber ||
                (regNumberFallback && item.regNumber === regNumberFallback)
      );
      const targetReg = target?.regNumber || regNumberFallback || idOrRegNumber;
      if (target?.regNumber && !deletedIds.includes(target.regNumber)) {
        deletedIds.push(target.regNumber);
      }
      if (target?.id && !deletedIds.includes(target.id)) {
        deletedIds.push(target.id);
      }
      localStorage.setItem('PNR_DELETED_ESTABLISHMENT_IDS', JSON.stringify(deletedIds));

      const updatedList = currentList.filter(
        item => item.id !== idOrRegNumber &&
                item.regNumber !== targetReg &&
                (target ? item.id !== target.id : true)
      );
      localStorage.setItem('PNR_SANITATION_ESTABLISHMENTS', JSON.stringify(updatedList));

      // ๓. ลบใน Supabase Cloud แบบ Cascade ครบถ้วน
      if (this.supabase) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrRegNumber);
        let dbId: string | null = isUUID ? idOrRegNumber : (target?.id && /^[0-9a-f-]{36}$/i.test(target.id) ? target.id : null);

        if (!dbId && targetReg) {
          const { data } = await this.supabase
            .from('establishments')
            .select('id')
            .eq('reg_number', targetReg)
            .maybeSingle();
          if (data?.id) dbId = data.id;
        }

        // ลบข้อมูลที่เกี่ยวข้องและตารางหลัก
        if (dbId) {
          try {
            await this.supabase.from('inspections').delete().eq('establishment_id', dbId);
            const { data: archs } = await this.supabase.from('yearly_archives').select('id').eq('establishment_id', dbId);
            if (archs && archs.length > 0) {
              const archIds = archs.map((a: any) => a.id);
              await this.supabase.from('archived_documents').delete().in('archive_id', archIds);
              await this.supabase.from('yearly_archives').delete().eq('establishment_id', dbId);
            }
          } catch (cascadeErr) {
            console.warn('Sub-table delete note:', cascadeErr);
          }

          const { error: delErr } = await this.supabase
            .from('establishments')
            .delete()
            .eq('id', dbId);

          if (delErr) {
            console.warn('Failed to delete by dbId, trying reg_number fallback:', delErr);
            if (targetReg) {
              await this.supabase.from('establishments').delete().eq('reg_number', targetReg);
            }
          }
        } else if (targetReg) {
          await this.supabase.from('establishments').delete().eq('reg_number', targetReg);
        }
      }
      return true;
    } catch (e) {
      console.error('Error deleting establishment:', e);
      return false;
    }
  }

  // ๓.๒ ลบแฟ้มเอกสารประจำปี
  async deleteYearArchive(establishmentId: string, year: number): Promise<boolean> {
    try {
      const establishments = await this.getEstablishments();
      const target = establishments.find(e => e.id === establishmentId || e.regNumber === establishmentId);
      if (target && target.yearlyArchives) {
        target.yearlyArchives = target.yearlyArchives.filter(a => a.year !== year);
        await this.saveEstablishment(target);
      }

      if (this.supabase && target) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target.id);
        let dbId: string | null = isUUID ? target.id : null;
        if (!dbId) {
          const { data } = await this.supabase
            .from('establishments')
            .select('id')
            .eq('reg_number', target.regNumber)
            .maybeSingle();
          if (data?.id) dbId = data.id;
        }

        if (dbId) {
          const { data: arch } = await this.supabase
            .from('yearly_archives')
            .select('id')
            .eq('establishment_id', dbId)
            .eq('year', year)
            .maybeSingle();

          if (arch?.id) {
            await this.supabase.from('archived_documents').delete().eq('archive_id', arch.id);
            await this.supabase.from('yearly_archives').delete().eq('id', arch.id);
          }
        }
      }
      return true;
    } catch (err) {
      console.error('Error deleting year archive:', err);
      return true;
    }
  }

  // ๔. บันทึกผลการตรวจสุขลักษณะสถานที่จริง
  async saveInspectionRecord(record: InspectionRecord): Promise<InspectionRecord> {
    try {
      const savedInspections = localStorage.getItem('PNR_SANITATION_INSPECTIONS');
      const list: InspectionRecord[] = savedInspections ? JSON.parse(savedInspections) : [];
      list.unshift(record);
      localStorage.setItem('PNR_SANITATION_INSPECTIONS', JSON.stringify(list));

      // อัปเดตสถานะในสถานประกอบการ
      const establishments = await this.getEstablishments();
      const target = establishments.find(e => e.id === record.establishmentId);
      if (target) {
        target.inspectionScore = record.totalScore;
        target.inspectionPassed = record.result === 'passed';
        target.inspectorName = record.inspectorName;
        target.inspectionDate = record.inspectionDate;
        target.status = record.result === 'passed' ? 'awaiting_payment' : 'pending_correction';
        await this.saveEstablishment(target);
      }

      // บันทึกลง Supabase
      if (this.isCloudActive && this.supabase && target) {
        const { data: estData } = await this.supabase
          .from('establishments')
          .select('id')
          .eq('reg_number', target.regNumber)
          .limit(1);

        const estDbId = estData?.[0]?.id || target.id;
        await this.supabase.from('inspections').insert({
          establishment_id: estDbId,
          inspection_date: record.inspectionDate,
          inspector_name: record.inspectorName,
          inspector_position: record.inspectorPosition || 'นักวิชาการสาธารณสุขปฏิบัติการ',
          total_score: record.totalScore,
          max_score: record.maxScore || 100,
          result: record.result,
          correction_days: record.correctionDays || null,
          correction_deadline: record.correctionDeadline || null,
          defects_summary: record.defectsSummary || [],
          inspector_notes: record.inspectorNotes || '',
          checklist_data: record.checklistItems || [],
          signatures: record.signatures || null,
          gps_checkin: record.gpsCheckIn || null
        });
      }
    } catch (e) {
      console.error('Error saving inspection record:', e);
    }

    return record;
  }

  // ๕. โหลดและบันทึกการตั้งค่าระบบและผู้ลงนาม (System Settings - user ใคร user มัน)
  async getSettings(officerId?: string): Promise<SystemSettings> {
    const currentOfficer = this.getCurrentOfficer();
    const resolvedId = officerId || currentOfficer?.id;

    if (this.isCloudActive && this.supabase && resolvedId) {
      try {
        const { data, error } = await this.supabase
          .from('system_settings')
          .select('*')
          .eq('id', `settings_${resolvedId}`)
          .maybeSingle();

        if (!error && data) {
          return {
            organizationName: data.organization_name || DEFAULT_SYSTEM_SETTINGS.organizationName,
            departmentName: data.department_name || DEFAULT_SYSTEM_SETTINGS.departmentName,
            district: data.district || DEFAULT_SYSTEM_SETTINGS.district,
            province: data.province || DEFAULT_SYSTEM_SETTINGS.province,
            fiscalYear: DEFAULT_SYSTEM_SETTINGS.fiscalYear,
            phoneNumber: data.phone_number || DEFAULT_SYSTEM_SETTINGS.phoneNumber,
            email: DEFAULT_SYSTEM_SETTINGS.email,
            website: DEFAULT_SYSTEM_SETTINGS.website,
            signatories: data.signatories || {
              ...DEFAULT_SYSTEM_SETTINGS.signatories,
              officerName: currentOfficer?.name || DEFAULT_SYSTEM_SETTINGS.signatories.officerName,
              officerPosition: currentOfficer?.position || DEFAULT_SYSTEM_SETTINGS.signatories.officerPosition
            },
            fees: data.fees || DEFAULT_SYSTEM_SETTINGS.fees,
            inspectionRules: data.inspection_rules || DEFAULT_SYSTEM_SETTINGS.inspectionRules
          };
        }
      } catch (err) {
        console.warn('Failed to load user settings from Supabase:', err);
      }
    }

    // Try officer-specific local cache
    try {
      if (resolvedId) {
        const userSaved = localStorage.getItem(`pnr_health_food_settings_${resolvedId}`);
        if (userSaved) return JSON.parse(userSaved);
      }
      const saved = localStorage.getItem('pnr_health_food_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (currentOfficer) {
          parsed.signatories = {
            ...parsed.signatories,
            officerName: currentOfficer.name,
            officerPosition: currentOfficer.position
          };
        }
        return parsed;
      }
    } catch {
      // fallback
    }

    // Default with current officer name and position
    if (currentOfficer) {
      return {
        ...DEFAULT_SYSTEM_SETTINGS,
        signatories: {
          ...DEFAULT_SYSTEM_SETTINGS.signatories,
          officerName: currentOfficer.name,
          officerPosition: currentOfficer.position
        }
      };
    }

    return DEFAULT_SYSTEM_SETTINGS;
  }

  async saveSettings(settings: SystemSettings, officerId?: string): Promise<boolean> {
    const currentOfficer = this.getCurrentOfficer();
    const resolvedId = officerId || currentOfficer?.id;

    try {
      if (resolvedId) {
        localStorage.setItem(`pnr_health_food_settings_${resolvedId}`, JSON.stringify(settings));
      }
      localStorage.setItem('pnr_health_food_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings locally:', e);
    }

    if (this.isCloudActive && this.supabase) {
      try {
        const payload = {
          organization_name: settings.organizationName,
          department_name: settings.departmentName,
          district: settings.district,
          province: settings.province,
          phone_number: settings.phoneNumber,
          signatories: settings.signatories,
          fees: settings.fees,
          inspection_rules: settings.inspectionRules
        };

        if (resolvedId) {
          await this.supabase
            .from('system_settings')
            .upsert({ id: `settings_${resolvedId}`, ...payload }, { onConflict: 'id' });
        }
        await this.supabase
          .from('system_settings')
          .upsert({ id: 'current', ...payload }, { onConflict: 'id' });
        return true;
      } catch (err) {
        console.warn('Failed to save settings to Supabase:', err);
      }
    }

    return true;
  }

  // ==================== AUDIT TRAIL SYSTEM ====================
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      if (this.isCloudActive && this.supabase) {
        const { data, error } = await this.supabase
          .from('audit_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(200);
        if (!error && data && data.length > 0) {
          return data.map((item: any) => ({
            id: item.id,
            timestamp: item.timestamp,
            action: item.action,
            actionTitle: item.action_title || item.actionTitle,
            establishmentId: item.establishment_id || item.establishmentId,
            establishmentName: item.establishment_name || item.establishmentName,
            officerName: item.officer_name || item.officerName,
            officerRole: item.officer_role || item.officerRole,
            details: item.details
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to load audit logs from cloud, fallback to local:', e);
    }

    try {
      const local = localStorage.getItem('pnr_health_audit_logs');
      if (local) {
        return JSON.parse(local);
      }
    } catch {
      // fallback
    }

    // Default Seed Logs for immediate demonstration
    const seedLogs: AuditLog[] = [
      {
        id: 'log-1',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        action: 'login',
        actionTitle: 'เข้าสู่ระบบ e-Service',
        officerName: 'นางสาวรุ่งทิวา อุปนันท์',
        officerRole: 'นักวิชาการสาธารณสุขปฏิบัติการ',
        details: 'เข้าสู่ระบบด้วยรหัส PIN เจ้าหน้าที่ สำเร็จ'
      },
      {
        id: 'log-2',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        action: 'upload_doc',
        actionTitle: 'อัปโหลดชุดเอกสารลงพื้นที่ตรวจสนาม ๓ รายการ',
        establishmentId: 'est-044',
        establishmentName: 'สถานีบริการน้ำมัน ปตท. โป่งน้ำร้อน',
        officerName: 'นางสาวรุ่งทิวา อุปนันท์',
        officerRole: 'นักวิชาการสาธารณสุขปฏิบัติการ',
        details: 'อัปโหลดไฟล์ชุดลงพื้นที่ตรวจสนามรอบปี พ.ศ. ๒๕๖๙ ครบถ้วน (คำขอ + บัตร + ผลตรวจ)'
      },
      {
        id: 'log-3',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        action: 'inspect',
        actionTitle: 'บันทึกผลการตรวจประเมินสุขลักษณะสถานที่',
        establishmentId: 'est-044',
        establishmentName: 'สถานีบริการน้ำมัน ปตท. โป่งน้ำร้อน',
        officerName: 'นางสาวรุ่งทิวา อุปนันท์',
        officerRole: 'นักวิชาการสาธารณสุขปฏิบัติการ',
        details: 'ผลการตรวจผ่านเกณฑ์มาตรฐาน ได้คะแนน ๙๕/๑๐๐ คะแนน'
      }
    ];

    try {
      localStorage.setItem('pnr_health_audit_logs', JSON.stringify(seedLogs));
    } catch {}

    return seedLogs;
  }

  async logAuditAction(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };

    // Save to LocalStorage
    try {
      const existing = await this.getAuditLogs();
      const updated = [newLog, ...existing].slice(0, 300);
      localStorage.setItem('pnr_health_audit_logs', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save audit log locally:', e);
    }

    // Save to Cloud if available
    if (this.isCloudActive && this.supabase) {
      try {
        await this.supabase.from('audit_logs').insert({
          id: newLog.id,
          timestamp: newLog.timestamp,
          action: newLog.action,
          action_title: newLog.actionTitle,
          establishment_id: newLog.establishmentId,
          establishment_name: newLog.establishmentName,
          officer_name: newLog.officerName,
          officer_role: newLog.officerRole,
          details: newLog.details
        });
      } catch (err) {
        console.warn('Failed to save audit log to Supabase:', err);
      }
    }

    return newLog;
  }

  // ==================== RENEWAL PIPELINE AUTOMATION ====================
  async renewEstablishmentLicense(
    establishmentId: string,
    targetYear: number,
    officerName: string
  ): Promise<Establishment | null> {
    const list = await this.getEstablishments();
    const estIndex = list.findIndex(e => e.id === establishmentId);
    if (estIndex === -1) return null;

    const est = list[estIndex];
    // Calculate new expire date: +1 year from current or next fiscal year
    const currentExpire = est.expireDate ? new Date(est.expireDate) : new Date();
    const newExpire = new Date(currentExpire);
    newExpire.setFullYear(newExpire.getFullYear() + 1);
    const newExpireStr = newExpire.toISOString().split('T')[0];
    const newIssueStr = new Date().toISOString().split('T')[0];

    // Update archives
    const currentArchives = est.yearlyArchives || [];
    const yearIndex = currentArchives.findIndex(a => a.year === targetYear);
    let updatedArchives: YearDossier[];

    if (yearIndex >= 0) {
      updatedArchives = [...currentArchives];
      updatedArchives[yearIndex] = {
        ...updatedArchives[yearIndex],
        status: 'complete',
        licenseExpireDate: newExpireStr,
        licenseIssueDate: newIssueStr,
        notes: `ต่ออายุใบอนุญาตประจำปี พ.ศ. ${targetYear} สำเร็จสมบูรณ์ โดย ${officerName}`
      };
    } else {
      updatedArchives = [
        ...currentArchives,
        {
          year: targetYear,
          status: 'complete',
          licenseExpireDate: newExpireStr,
          licenseIssueDate: newIssueStr,
          documents: [],
          notes: `ต่ออายุใบอนุญาตประจำปี พ.ศ. ${targetYear} สำเร็จสมบูรณ์ โดย ${officerName}`
        }
      ];
    }

    const updatedEst: Establishment = {
      ...est,
      status: 'active',
      issueDate: newIssueStr,
      expireDate: newExpireStr,
      yearlyArchives: updatedArchives
    };

    await this.saveEstablishment(updatedEst);

    // Auto-log audit action
    await this.logAuditAction({
      action: 'renew_license',
      actionTitle: `อนุมัติและต่ออายุใบอนุญาตประจำปี พ.ศ. ${targetYear}`,
      establishmentId: est.id,
      establishmentName: est.businessName,
      officerName: officerName,
      officerRole: 'เจ้าหน้าที่สาธารณสุข',
      details: `ต่ออายุใบอนุญาตสำเร็จ วันสิ้นอายุใหม่: ${newExpireStr} (สถานะ: ปกติ)`
    });

    return updatedEst;
  }

  // ==================== SSSS ZERO-LOSS BACKUP & RECOVERY ENGINE ====================
  async exportFullBackup(): Promise<string> {
    const establishments = await this.getEstablishments();
    const settings = await this.getSettings();
    const officers = await this.getOfficers();
    const auditLogs = await this.getAuditLogs();
    const currentOfficer = this.getCurrentOfficer();

    let inspections: InspectionRecord[] = [];
    try {
      const saved = localStorage.getItem('PNR_SANITATION_INSPECTIONS');
      if (saved) inspections = JSON.parse(saved);
    } catch {}

    const backupPayload = {
      version: '2.0-ssss',
      app: 'PongNamRon-Health-eService',
      organization: settings.organizationName || 'องค์การบริหารส่วนตำบลโป่งน้ำร้อน',
      exportedAt: new Date().toISOString(),
      exportedBy: currentOfficer ? `${currentOfficer.name} (${currentOfficer.position})` : 'เจ้าหน้าที่ผู้ดูแลระบบ',
      stats: {
        totalEstablishments: establishments.length,
        totalInspections: inspections.length,
        totalAuditLogs: auditLogs.length
      },
      data: {
        establishments,
        inspections,
        settings,
        officers,
        auditLogs
      }
    };

    return JSON.stringify(backupPayload, null, 2);
  }

  async downloadBackupFile(): Promise<{ filename: string; sizeKb: number }> {
    const jsonStr = await this.exportFullBackup();
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `PNR_Health_Backup_${dateStr}.json`;

    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Save timestamp of last backup
    localStorage.setItem('pnr_last_backup_time', now.toISOString());

    // Log to audit trail
    const officer = this.getCurrentOfficer();
    await this.logAuditAction({
      action: 'settings',
      actionTitle: 'สำรองฐานข้อมูลฉุกเฉินระดับระบบ (Full Data Backup)',
      officerName: officer?.name || 'เจ้าหน้าที่ระบบ',
      officerRole: officer?.position || 'Admin',
      details: `ส่งออกไฟล์สำรอง ${filename} เรียบร้อยแล้ว (ขนาด ~${Math.round(blob.size / 1024)} KB)`
    });

    return {
      filename,
      sizeKb: Math.round(blob.size / 1024)
    };
  }

  async restoreFullBackup(jsonString: string): Promise<{ success: boolean; message: string; count: number }> {
    try {
      const parsed = JSON.parse(jsonString);
      const data = parsed.data || parsed;

      if (!data || !Array.isArray(data.establishments)) {
        return {
          success: false,
          message: 'โครงสร้างไฟล์ไม่ถูกต้อง ไม่พบข้อมูลสถานประกอบการ (establishments)',
          count: 0
        };
      }

      // Restore to LocalStorage (both naming formats for absolute reliability)
      localStorage.setItem('pnr_health_establishments', JSON.stringify(data.establishments));
      localStorage.setItem('PNR_SANITATION_ESTABLISHMENTS', JSON.stringify(data.establishments));
      
      if (Array.isArray(data.inspections)) {
        localStorage.setItem('PNR_SANITATION_INSPECTIONS', JSON.stringify(data.inspections));
        localStorage.setItem('pnr_health_inspections', JSON.stringify(data.inspections));
      }
      if (data.settings && typeof data.settings === 'object') {
        localStorage.setItem('pnr_health_food_settings', JSON.stringify(data.settings));
        localStorage.setItem('pnr_health_system_settings', JSON.stringify(data.settings));
      }
      if (Array.isArray(data.officers)) {
        localStorage.setItem('PNR_OFFICERS_LIST', JSON.stringify(data.officers));
      }

      // Sync to cloud if active
      if (this.isCloudActive && this.supabase) {
        try {
          for (const est of data.establishments) {
            await this.saveEstablishment(est);
          }
        } catch (err) {
          console.warn('Could not sync restored establishments to cloud:', err);
        }
      }

      // Log to audit
      const officer = this.getCurrentOfficer();
      await this.logAuditAction({
        action: 'settings',
        actionTitle: 'กู้คืนฐานข้อมูลจากไฟล์สำรอง (System Data Restoration)',
        officerName: officer?.name || 'ผู้ดูแลระบบ',
        officerRole: officer?.position || 'Admin',
        details: `กู้คืนสถานประกอบการสำเร็จ ${data.establishments.length} แห่ง และแฟ้มสารบรรณที่เกี่ยวข้อง`
      });

      return {
        success: true,
        message: `กู้คืนข้อมูลสำเร็จ ${data.establishments.length} รายการ`,
        count: data.establishments.length
      };
    } catch (e: any) {
      return {
        success: false,
        message: `เกิดข้อผิดพลาดในการอ่านไฟล์: ${e.message}`,
        count: 0
      };
    }
  }

  getLastBackupTime(): string | null {
    try {
      return localStorage.getItem('pnr_last_backup_time');
    } catch {
      return null;
    }
  }
}

export const sanitationDataService = new SanitationDataService();

