import React, { useMemo, useState, useEffect } from 'react'
import QRCode from 'qrcode'
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight,
  Camera, Check, CheckCircle2, ChevronDown, ChevronRight, ClipboardCheck,
  ClipboardList, Clock3, Cloud, CloudOff, FileCheck2, FileText, Filter, ListTodo,
  LocateFixed, LogOut, Map, MapPin, Navigation, Plus, PlusCircle, RefreshCw,
  Search, Settings, ShieldCheck, Smartphone, Store, UserRound, Users, Wifi,
  X, CalendarDays, Phone, Mail, ExternalLink, Image as ImageIcon, Save, Sparkles, CheckSquare,
  Lock, KeyRound, Monitor, Eye, EyeOff, Download, Info, Ruler, Building, ArrowUpRight,
  QrCode, Zap, Compass, Share2, Award, HardDrive, Cpu, Radio, CheckCheck, Trash2,
  Bookmark, Menu, Share, Bell, BarChart3, PieChart, FileCode, CheckCircle, HelpCircle, PenTool, Home,
  UtensilsCrossed, Warehouse, ShieldAlert
} from 'lucide-react'
import {
  demoEstablishments, demoTasks, USE_MOCKS, MAIN_APP_URL, fieldApi, supabase,
  authService, DEFAULT_OFFICERS,
  type Establishment, type FieldReport, type FieldTask, type OfficerAccount
} from './pwaApi'
import { LiveFieldMap } from './LiveFieldMap'
import { FloorplanVisualizer } from './FloorplanVisualizer'
import { QrScannerModal } from './QrScannerModal'
import { PwaSignaturePad as SignaturePad } from './PwaSignaturePad'
import { playBeep, playSuccessChime, playCameraShutter, triggerHaptic } from '../../../utils/haptics'
import {
  ALL_OFFICIAL_FORMS,
  OFFICIAL_FOOD_SERVICE_FORM,
  OFFICIAL_FOOD_STORAGE_FORM,
  OFFICIAL_HAZARDOUS_HEALTH_FORM,
  resolveInspectionForm,
  type OfficialInspectionFormDef
} from '../../../constants/officialForms'
import { OFFICIAL_NWK_SIGNATURE_DATA_URL, RUNGTHIWA_OFFICER } from '../../../constants/officialSignature'
import './field-pwa.css'

// 5 Main Navigation Tabs from Mockup Graphic:
// 1. หน้าหลัก (home) | 2. ร้านค้า (stores) | 3. แผนที่ (map) | 4. งานตรวจ (tasks) | 5. โปรไฟล์/เพิ่มเติม (profile)
type MobileTab = 'home' | 'stores' | 'map' | 'tasks' | 'profile'

// Sub-Screens matching Graphic screens:
// detail (Screen 4) | prep (Screen 7) | report (Screen 8) | forms (Screen 9) | analytics (Screen 10) | new_store (Registration Wizard)
type ActiveSubScreen = 'none' | 'detail' | 'prep' | 'report' | 'forms' | 'analytics' | 'new_store'

const VILLAGES = [
  'ทั้งหมด',
  'หมู่ที่ 1 บ้านหนองพนัง',
  'หมู่ที่ 2 บ้านใหม่ผาใต้',
  'หมู่ที่ 3 บ้านหัวฝาย',
  'หมู่ที่ 4 บ้านลาน',
  'หมู่ที่ 5 บ้านต้นผึ้ง',
  'หมู่ที่ 6 บ้านปางป๋อ',
  'หมู่ที่ 7 บ้านต้นผึ้งใต้ (ที่ทำการ อบต.)'
]

// Official Government Forms (Screen 9: แบบฟอร์มราชการ)
const GOV_FORMS = [
  {
    id: 'f1',
    code: 'แบบ บท.๑',
    title: 'ใบอนุญาตจัดตั้งสถานที่จำหน่ายอาหาร',
    category: 'license',
    desc: 'สำหรับขอจัดตั้งสถานที่จำหน่ายอาหารหรือภัตตาคาร พื้นที่เกิน ๒๐๐ ตร.ม.',
    fee: '๓,๐๐๐ บาท/ปี',
    period: '๑ ปี',
    law: 'พ.ร.บ.การสาธารณสุข พ.ศ. ๒๕๓๕ มาตรา ๓๘'
  },
  {
    id: 'f2',
    code: 'แบบ บท.๒',
    title: 'ใบอนุญาตต่ออายุ',
    category: 'renew',
    desc: 'สำหรับยื่นขอต่ออายุใบอนุญาตจำหน่ายอาหารและสถานที่สะสมอาหารประจำปี',
    fee: 'ตามอัตรากำหนด',
    period: '๑ ปี',
    law: 'ยื่นล่วงหน้าก่อนสิ้นอายุไม่น้อยกว่า ๓๐ วัน'
  },
  {
    id: 'f3',
    code: 'แบบ บท.๓',
    title: 'แบบคำขอเปลี่ยนแปลงรายการ',
    category: 'change',
    desc: 'แจ้งเปลี่ยนชื่อร้าน ย้ายที่ตั้ง ขยายพื้นที่ หรือเพิ่มประเภทอาหาร',
    fee: '๕๐๐ บาท',
    period: 'ตามวาระ',
    law: 'ข้อบัญญัติท้องถิ่น'
  },
  {
    id: 'f4',
    code: 'แบบ บท.๔',
    title: 'แบบคำขอโอนกิจการ',
    category: 'change',
    desc: 'โอนสิทธิ์การครอบครองและใบอนุญาตประกอบกิจการให้ทายาทหรือบุคคลอื่น',
    fee: '๑,๐๐๐ บาท',
    period: 'ถาวร',
    law: 'ต้องได้รับความยินยอมจากเจ้าพนักงานท้องถิ่น'
  },
  {
    id: 'f5',
    code: 'แบบ บท.๕',
    title: 'แบบคำขอรับใบแทนใบอนุญาต',
    category: 'license',
    desc: 'กรณีใบอนุญาตสูญหาย ถูกทำลาย หรือชำรุดเสียหายในสาระสำคัญ',
    fee: '๓๐๐ บาท',
    period: 'เท่าอายุเดิม',
    law: 'พร้อมแนบหลักฐานการแจ้งความ'
  },
  {
    id: 'f6',
    code: 'แบบ บท.๖',
    title: 'แบบแจ้งยกเลิกใบอนุญาต',
    category: 'change',
    desc: 'แจ้งเลิกประกอบกิจการหรือยุติการดำเนินการในเขตพื้นที่ อบต.โป่งน้ำร้อน',
    fee: 'ไม่มีค่าธรรมเนียม',
    period: '-',
    law: 'แจ้งภายใน ๑๕ วันนับแต่วันเลิกกิจการ'
  }
]

// 10 เกณฑ์สุขลักษณะสำหรับตรวจสถานที่สะสมอาหาร ๑๐๐ คะแนนเต็ม
const CRITERIA = [
  { id: 'c1', label: '1. จัดวางสินค้าสูงจากพื้นอย่างน้อย 15 ซม. ห่างผนัง 30 ซม.', points: 10, category: 'โครงสร้าง' },
  { id: 'c2', label: '2. อาคาร ผนัง เพดาน แข็งแรง สะอาด ระบายอากาศดี ไม่อับชื้น', points: 10, category: 'โครงสร้าง' },
  { id: 'c3', label: '3. แสงสว่างเพียงพอ หลอดไฟมีฝาครอบป้องกันการแตกกระจาย', points: 10, category: 'โครงสร้าง' },
  { id: 'c4', label: '4. ควบคุมอุณหภูมิห้องเย็น/ตู้แช่ตามเกณฑ์ (<5°C หรือ <-18°C)', points: 10, category: 'อุณหภูมิ' },
  { id: 'c5', label: '5. มีระบบหมุนเวียนสินค้า เข้าก่อน-ออกก่อน (FIFO) ชัดเจน', points: 10, category: 'การจัดเก็บ' },
  { id: 'c6', label: '6. ควบคุมความชื้นในคลังอาหารแห้ง ป้องกันเชื้อรา', points: 10, category: 'การจัดเก็บ' },
  { id: 'c7', label: '7. ห้ามเก็บอาหารรวมกับสารเคมี ยาฆ่าแมลง หรือปุ๋ยเด็ดขาด', points: 15, category: 'สุขอนามัย' },
  { id: 'c8', label: '8. มีมาตรการและอุปกรณ์ป้องกันแมลงและสัตว์นำโรค', points: 10, category: 'สุขอนามัย' },
  { id: 'c9', label: '9. ผู้สัมผัสอาหารแต่งกายสะอาด สวมผ้ากันเปื้อน/หมวก', points: 10, category: 'สุขอนามัย' },
  { id: 'c10', label: '10. มีถังขยะแบบมีฝาปิดมิดชิด และการจัดการน้ำเสียถูกต้อง', points: 5, category: 'สุขอนามัย' }
]

const QUICK_NOTES = [
  'สถานที่สะอาด ถูกสุขลักษณะ อุปกรณ์ครบถ้วน',
  'มีการจัดวางวัตถุดิบสูงจากพื้นเกิน ๑๕ ซม.',
  'ผู้สัมผัสอาหารสวมหมวกและผ้ากันเปื้อนถูกต้อง',
  'แนะนำให้ยกพาเลทอาหารขึ้นสูงจากพื้นอย่างน้อย 15 ซม.',
  'ตู้แช่อาหารสดต้องติดเทอร์โมมิเตอร์แสดงอุณหภูมิให้ชัดเจน',
  'แยกพื้นที่จัดเก็บน้ำยาทำความสะอาดออกจากอาหารโดยเด็ดขาด'
]

export interface PublicHealthFieldPwaAppProps {
  mode?: 'standalone' | 'embedded';
}

export function PublicHealthFieldPwaApp({
  mode = 'standalone'
}: PublicHealthFieldPwaAppProps = {}) {
  // Shared Officer Authentication Gate
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated())
  const [currentOfficer, setCurrentOfficer] = useState<OfficerAccount>(() => authService.getCurrentOfficer())
  const [officersList, setOfficersList] = useState<OfficerAccount[]>(() => authService.getOfficersSync())
  const [loginOfficerId, setLoginOfficerId] = useState<string>(() => authService.getOfficersSync()[0]?.id || DEFAULT_OFFICERS[0].id)
  const [loginPin, setLoginPin] = useState<string>('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [showPin, setShowPin] = useState<boolean>(false)

  // 5 Main Navigation Tabs matching graphic: 'home' | 'stores' | 'map' | 'tasks' | 'profile'
  const [tab, setTab] = useState<MobileTab>('home')
  const [subScreen, setSubScreen] = useState<ActiveSubScreen>('none')

  useEffect(() => {
    if (mode === 'standalone') {
      document.body.classList.add('pwa-standalone-active')
      return () => {
        document.body.classList.remove('pwa-standalone-active')
      }
    }
  }, [mode])

  // Feature Modals & Toggles
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false)
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>(OFFICIAL_NWK_SIGNATURE_DATA_URL)
  const [ownerSignatureDataUrl, setOwnerSignatureDataUrl] = useState<string>('')
  const [activeCatIndex, setActiveCatIndex] = useState<number>(0)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [selectedGovForm, setSelectedGovForm] = useState<typeof GOV_FORMS[0] | null>(null)

  // Sub-screen Sub-tabs
  const [detailSubTab, setDetailSubTab] = useState<'license' | 'docs' | 'history'>('license')
  const [prepStep, setPrepStep] = useState<1 | 2 | 3 | 4>(2) // Step 2: เตรียมเอกสาร is active in mockup
  const [prepCheckedDocs, setPrepCheckedDocs] = useState<Record<string, boolean>>({
    doc1: true,
    doc2: true,
    doc3: true,
    doc4: true
  })

  // Data States
  const [tasks, setTasks] = useState<FieldTask[]>(demoTasks)
  const [establishments, setEstablishments] = useState<Establishment[]>(demoEstablishments)
  const [selectedEst, setSelectedEst] = useState<Establishment | null>(demoEstablishments[0])
  const [selectedTask, setSelectedTask] = useState<FieldTask | null>(demoTasks[0])

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [storeCategoryFilter, setStoreCategoryFilter] = useState<'ทั้งหมด' | 'ร้านอาหาร' | 'สถานที่สะสมอาหาร' | 'กิจการอันตราย'>('ทั้งหมด')
  const [storeStatusFilter, setStoreStatusFilter] = useState<'ทั้งหมด' | 'ใช้งานได้' | 'ใกล้หมดอายุ' | 'หมดอายุ'>('ทั้งหมด')
  const [villageFilter, setVillageFilter] = useState('ทั้งหมด')
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'progress'>('all')
  const [formsFilter, setFormsFilter] = useState<'all' | 'license' | 'renew' | 'change'>('all')

  // Connectivity & Sync
  const [offline, setOffline] = useState(!navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [syncCount, setSyncCount] = useState(() => {
    try {
      const p = JSON.parse(localStorage.getItem('field-pwa-pending-reports') || '[]')
      return p.length
    } catch {
      return 0
    }
  })

  // Multi-step Wizard: New Store Registration
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1)
  const [newStoreName, setNewStoreName] = useState('')
  const [newStoreType, setNewStoreType] = useState('สถานที่จำหน่ายอาหาร (ร้านอาหาร)')
  const [newOwner, setNewOwner] = useState('')
  const [newCitizenId, setNewCitizenId] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [newVillage, setNewVillage] = useState(VILLAGES[1])
  const [newLat, setNewLat] = useState<string>('19.9123')
  const [newLng, setNewLng] = useState<string>('99.8321')
  const [newWidthM, setNewWidthM] = useState<number>(10)
  const [newLengthM, setNewLengthM] = useState<number>(15)
  const [isCapturingGps, setIsCapturingGps] = useState(false)

  // Area calculation
  const calculatedArea = useMemo(() => {
    const w = Number(newWidthM) || 0
    const l = Number(newLengthM) || 0
    return Math.round(w * l * 100) / 100
  }, [newWidthM, newLengthM])

  // Inspection Report State (Screen 8)
  const [reportOutcome, setReportOutcome] = useState('ผ่าน')
  const [reportNotes, setReportNotes] = useState('สถานที่สะอาด ถูกสุขลักษณะ อุปกรณ์ครบถ้วน')
  const [reportGps, setReportGps] = useState<{ lat: number; lng: number } | null>({ lat: 19.9123, lng: 99.8321 })
  const [inspectWizardStep, setInspectWizardStep] = useState<1 | 2 | 3 | 4>(1)

  // 3 Official Forms from Subdistrict Administrative Organization Pong Nam Ron
  const [selectedFormDef, setSelectedFormDef] = useState<OfficialInspectionFormDef>(OFFICIAL_FOOD_SERVICE_FORM)
  const [checkedCriteria, setCheckedCriteria] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    OFFICIAL_FOOD_SERVICE_FORM.categories.forEach(c => c.items.forEach(i => { init[i.id] = true }))
    return init
  })
  const [criterionNotes, setCriterionNotes] = useState<Record<string, string>>({})
  const [summaryDecision, setSummaryDecision] = useState<'approve' | 'reject'>('approve')
  const [rejectReason, setRejectReason] = useState<string>('')
  const [otherNotes, setOtherNotes] = useState<string>('')

  // 1-Click Quick Inspection Picker States
  const [isQuickInspectModalOpen, setIsQuickInspectModalOpen] = useState<boolean>(false)
  const [quickInspectQuery, setQuickInspectQuery] = useState<string>('')
  const [quickTargetFormId, setQuickTargetFormId] = useState<'food_service' | 'food_storage' | 'hazardous_health'>('food_service')

  const [inspectWidthM, setInspectWidthM] = useState<number>(10)
  const [inspectLengthM, setInspectLengthM] = useState<number>(14.5)

  // Store Management Modals (Edit Store, More Actions, Store QR Code)
  const [isEditStoreModalOpen, setIsEditStoreModalOpen] = useState(false)
  const [isMoreActionsModalOpen, setIsMoreActionsModalOpen] = useState(false)
  const [isStoreQrModalOpen, setIsStoreQrModalOpen] = useState(false)
  const [storeQrDataUrl, setStoreQrDataUrl] = useState('')

  // Edit Store Form Fields
  const [editStoreName, setEditStoreName] = useState('')
  const [editStoreType, setEditStoreType] = useState('')
  const [editStoreCategory, setEditStoreCategory] = useState<'hazardous' | 'food_notice' | 'food_license' | 'food_storage'>('food_notice')
  const [editStoreOwner, setEditStoreOwner] = useState('')
  const [editStorePhone, setEditStorePhone] = useState('')
  const [editStoreAddress, setEditStoreAddress] = useState('')
  const [editStoreVillage, setEditStoreVillage] = useState(VILLAGES[1])
  const [editStoreLat, setEditStoreLat] = useState('19.9288')
  const [editStoreLng, setEditStoreLng] = useState('99.1685')
  const [editStoreWidthM, setEditStoreWidthM] = useState(10)
  const [editStoreLengthM, setEditStoreLengthM] = useState(15)
  const [editStoreStatus, setEditStoreStatus] = useState<'ปกติ' | 'ใกล้หมดอายุ' | 'หมดอายุ'>('ปกติ')
  const [isCapturingEditGps, setIsCapturingEditGps] = useState(false)

  // Profile & Personal Settings Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false)
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false)
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState<boolean>(false)
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false)
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState<boolean>(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  // Edit Profile Form State
  const [profileName, setProfileName] = useState<string>(currentOfficer.name)
  const [profilePosition, setProfilePosition] = useState<string>(currentOfficer.position)
  const [profileRole, setProfileRole] = useState<string>(currentOfficer.roleName)
  const [profilePhone, setProfilePhone] = useState<string>(currentOfficer.phone || '053-010-555')
  const [profileEmail, setProfileEmail] = useState<string>(currentOfficer.email || 'health@pongnamron.go.th')
  const [profileSignature, setProfileSignature] = useState<string>(currentOfficer.signatureUrl || OFFICIAL_NWK_SIGNATURE_DATA_URL)
  const [isSigningInProfile, setIsSigningInProfile] = useState<boolean>(false)

  // Change PIN Form State
  const [currentPinInput, setCurrentPinInput] = useState<string>('')
  const [newPinInput, setNewPinInput] = useState<string>('')
  const [confirmPinInput, setConfirmPinInput] = useState<string>('')
  const [pinError, setPinError] = useState<string>('')

  // 4 Photo Inspection Slots (Start clean so officer can shoot or upload)
  const [inspectPhotos, setInspectPhotos] = useState<Record<string, string>>({
    p1: '',
    p2: '',
    p3: '',
    p4: ''
  })

  const inspectAreaSqm = useMemo(() => {
    const w = Number(inspectWidthM) || 0
    const l = Number(inspectLengthM) || 0
    return Math.round(w * l * 100) / 100
  }, [inspectWidthM, inspectLengthM])

  const { totalPassedCount, totalCriteriaCount, passPercentage } = useMemo(() => {
    const all = selectedFormDef.categories.flatMap(c => c.items)
    const passed = all.filter(item => checkedCriteria[item.id] !== false).length
    return {
      totalPassedCount: passed,
      totalCriteriaCount: all.length,
      passPercentage: all.length > 0 ? Math.round((passed / all.length) * 100) : 100
    }
  }, [selectedFormDef, checkedCriteria])

  // Dynamic Real Metrics computed from live Supabase data
  const { totalEstCount, activeLicenseCount, expiringCount, expiredCount, pendingTasksCount, completedTasksCount } = useMemo(() => {
    const total = establishments.length
    const active = establishments.filter(e => e.permitStatus === 'ปกติ' || e.status === 'active').length
    const expiring = establishments.filter(e => e.permitStatus === 'ใกล้หมดอายุ' || e.status === 'expiring').length
    const expired = establishments.filter(e => e.permitStatus === 'หมดอายุ' || e.status === 'expired').length
    const pending = tasks.filter(t => t.status === 'รอดำเนินการ' || t.status === 'กำลังดำเนินการ').length
    const completed = tasks.filter(t => t.status === 'เสร็จสิ้น' || t.status === 'ลงพื้นที่แล้ว').length
    return {
      totalEstCount: total,
      activeLicenseCount: active,
      expiringCount: expiring,
      expiredCount: expired,
      pendingTasksCount: pending,
      completedTasksCount: completed
    }
  }, [establishments, tasks])

  // Online / Offline Listeners
  useEffect(() => {
    const on = () => setOffline(!navigator.onLine)
    window.addEventListener('online', on)
    window.addEventListener('offline', on)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', on)
    }
  }, [])

  // Load Real Data on Start & Listen for Cross-App / Cross-Tab updates
  useEffect(() => {
    async function refreshData() {
      try {
        const ests = await fieldApi.getEstablishments()
        if (ests && ests.length > 0) {
          setEstablishments(ests)
          setSelectedEst(prev => (prev && ests.some(e => e.id === prev.id) ? prev : ests[0]))
        }
        const t = await fieldApi.getTasks()
        if (t && t.length > 0) {
          setTasks(t)
          setSelectedTask(prev => (prev && t.some(x => x.id === prev.id) ? prev : t[0]))
        }
        // Sync officers list and current profile
        const freshOfficers = await authService.getOfficers()
        if (freshOfficers && freshOfficers.length > 0) {
          setOfficersList(freshOfficers)
          const cur = authService.getCurrentOfficer()
          const matched = freshOfficers.find(o => o.officerCode === cur.officerCode || o.id === cur.id)
          if (matched) {
            authService.saveCurrentOfficer({ ...cur, ...matched })
            setCurrentOfficer({ ...cur, ...matched })
          }
        }
      } catch (e) {
        console.warn('Data sync error:', e)
      }
    }
    refreshData()

    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'PNR_SANITATION_ESTABLISHMENTS' || e.key === 'field-pwa-cached-establishments') {
        refreshData()
      }
      if (e.key === 'PNR_CURRENT_OFFICER' || e.key === 'PNR_OFFICERS_LIST') {
        setCurrentOfficer(authService.getCurrentOfficer())
        setOfficersList(authService.getOfficersSync())
      }
    }
    window.addEventListener('storage', onStorage)

    let bc: BroadcastChannel | null = null
    try {
      bc = new BroadcastChannel('PNR_SANITATION_CHANNEL')
      bc.onmessage = (event: MessageEvent) => {
        if (event.data?.type === 'OFFICER_UPDATED' && event.data?.data) {
          authService.saveCurrentOfficer(event.data.data)
          setCurrentOfficer(event.data.data)
        }
        refreshData()
      }
    } catch {}

    // Supabase Cloud Realtime listener
    let realtimeChannel: any = null
    if (supabase && !USE_MOCKS) {
      try {
        realtimeChannel = supabase
          .channel('pwa-live-sync')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'establishments' }, () => {
            refreshData()
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'inspections' }, () => {
            refreshData()
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'officers' }, async () => {
            const list = await authService.getOfficers()
            if (list && list.length > 0) {
              setOfficersList(list)
              const cur = authService.getCurrentOfficer()
              const matched = list.find(o => o.officerCode === cur.officerCode || o.id === cur.id)
              if (matched) {
                authService.saveCurrentOfficer(matched)
                setCurrentOfficer(matched)
              }
            }
          })
          .subscribe()
      } catch {}
    }

    const onFocus = () => {
      refreshData()
    }
    window.addEventListener('focus', onFocus)

    const pollTimer = setInterval(() => {
      refreshData()
    }, 5000)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', onFocus)
      if (bc) bc.close()
      if (realtimeChannel && supabase) {
        try { supabase.removeChannel(realtimeChannel) } catch {}
      }
      clearInterval(pollTimer)
    }
  }, [])

  function notify(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  // Handle Login
  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError(null)
    const res = authService.login(loginOfficerId, loginPin)
    if (res.success && res.officer) {
      triggerHaptic(50)
      playSuccessChime()
      setIsAuthenticated(true)
      setCurrentOfficer(res.officer)
      setLoginPin('')
      notify(`ยินดีต้อนรับ ${res.officer.name}`)
    } else {
      triggerHaptic([60, 40, 60])
      playBeep(400, 0.15)
      setLoginError(res.error || 'รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง')
    }
  }

  function handleLogout() {
    triggerHaptic(30)
    authService.logout()
    setIsAuthenticated(false)
    setTab('home')
    setSubScreen('none')
    notify('ออกจากระบบเรียบร้อย')
  }

  // Open Store Details Screen (Screen 4)
  function openStoreDetail(est: Establishment) {
    triggerHaptic(20)
    setSelectedEst(est)
    setSubScreen('detail')
  }

  // Open Edit Store Form
  function openEditStore(est?: Establishment | null) {
    const target = est || selectedEst
    if (!target) return
    triggerHaptic(20)
    setEditStoreName(target.name || '')
    setEditStoreType(target.type || '')
    setEditStoreCategory(target.category || 'food_notice')
    setEditStoreOwner(target.owner || '')
    setEditStorePhone(target.phone || '')
    setEditStoreAddress(target.address || '')
    setEditStoreVillage(target.village || VILLAGES[1])
    setEditStoreLat(target.lat ? String(target.lat) : '19.9288')
    setEditStoreLng(target.lng ? String(target.lng) : '99.1685')
    setEditStoreWidthM(target.widthM || 10)
    setEditStoreLengthM(target.lengthM || 15)
    setEditStoreStatus((target.permitStatus as 'ปกติ' | 'ใกล้หมดอายุ' | 'หมดอายุ') || 'ปกติ')
    setIsMoreActionsModalOpen(false)
    setIsEditStoreModalOpen(true)
  }

  // Save Store Edit
  async function handleSaveStoreEdit() {
    if (!selectedEst) return
    if (!editStoreName.trim()) {
      notify('กรุณาระบุชื่อสถานประกอบการ')
      return
    }
    triggerHaptic(30)
    playSuccessChime()
    const updates: Partial<Establishment> = {
      name: editStoreName.trim(),
      type: editStoreType.trim(),
      category: editStoreCategory,
      owner: editStoreOwner.trim(),
      phone: editStorePhone.trim(),
      address: editStoreAddress.trim(),
      village: editStoreVillage,
      lat: Number(editStoreLat) || selectedEst.lat || 19.9288,
      lng: Number(editStoreLng) || selectedEst.lng || 99.1685,
      widthM: Number(editStoreWidthM) || 10,
      lengthM: Number(editStoreLengthM) || 15,
      permitStatus: editStoreStatus
    }

    const updatedEst: Establishment = {
      ...selectedEst,
      ...updates
    }

    setSelectedEst(updatedEst)
    setEstablishments(prev => prev.map(e => e.id === selectedEst.id ? updatedEst : e))
    await fieldApi.updateEstablishment(selectedEst.id, updates)
    setIsEditStoreModalOpen(false)
    notify(`✓ บันทึกการแก้ไขร้าน "${updatedEst.name}" เรียบร้อยแล้ว`)
  }

  // Capture GPS in Edit Form
  function handleCaptureEditGps() {
    triggerHaptic(20)
    if (!navigator.geolocation) {
      notify('อุปกรณ์ไม่รองรับระบบ GPS Geolocation')
      return
    }
    setIsCapturingEditGps(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setIsCapturingEditGps(false)
        playSuccessChime()
        const lat = Number(pos.coords.latitude.toFixed(6))
        const lng = Number(pos.coords.longitude.toFixed(6))
        setEditStoreLat(String(lat))
        setEditStoreLng(String(lng))
        notify(`✓ ระบุพิกัด GPS สำเร็จ: ${lat}, ${lng}`)
      },
      err => {
        setIsCapturingEditGps(false)
        console.warn('GPS Error:', err)
        notify('ไม่สามารถระบุพิกัด GPS ได้ (ใช้พิกัดเริ่มต้น ต.โป่งน้ำร้อน)')
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }

  // Open Store QR Code Modal
  async function openStoreQrModal(est?: Establishment | null) {
    const target = est || selectedEst
    if (!target) return
    triggerHaptic(25)
    setIsMoreActionsModalOpen(false)
    try {
      const qrTarget = `${window.location.origin}/?app=inspector&storeId=${encodeURIComponent(target.id)}&permit=${encodeURIComponent(target.permitNo || '')}`
      const url = await QRCode.toDataURL(qrTarget, {
        width: 320,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' }
      })
      setStoreQrDataUrl(url)
      setIsStoreQrModalOpen(true)
    } catch (e) {
      console.warn('QR error:', e)
      notify('ไม่สามารถสร้าง QR Code ได้')
    }
  }

  // Delete Store
  async function handleDeleteSelectedStore() {
    if (!selectedEst) return
    triggerHaptic([60, 40, 60])
    if (window.confirm(`ยืนยันการลบสถานประกอบการ "${selectedEst.name}" ออกจากระบบ หรือไม่?\n\nข้อมูลในฐานข้อมูลและใบอนุญาตจะถูกลบ`)) {
      const deletedId = selectedEst.id
      setEstablishments(prev => prev.filter(e => e.id !== deletedId))
      await fieldApi.deleteEstablishment(deletedId)
      setIsMoreActionsModalOpen(false)
      setSelectedEst(null)
      setSubScreen('none')
      setTab('stores')
      notify(`ลบสถานประกอบการ "${selectedEst.name}" สำเร็จ`)
    }
  }

  // Open Field Prep Wizard (Screen 7)
  function openFieldPrep(est?: Establishment) {
    triggerHaptic(25)
    if (est) setSelectedEst(est)
    else if (!selectedEst && establishments.length > 0) setSelectedEst(establishments[0])
    setPrepStep(2)
    setSubScreen('prep')
  }

  // Start Inspection Form for an Establishment (Screen 8)
  function startReport(est: Establishment, task?: FieldTask, explicitForm?: OfficialInspectionFormDef) {
    triggerHaptic(40)
    playBeep(880, 0.06)
    setSelectedEst(est)
    const activeTask = task || tasks.find(t => t.establishmentId === est.id) || {
      id: `TASK-${Date.now()}`,
      establishmentId: est.id,
      establishmentName: est.name,
      title: `ตรวจสุขลักษณะ ${est.name}`,
      due: 'วันนี้',
      status: 'กำลังดำเนินการ',
      priority: 'ปกติ',
      address: est.address
    }
    setSelectedTask(activeTask)
    setReportOutcome('ผ่าน')
    setReportNotes('สถานที่สะอาด ถูกสุขลักษณะ อุปกรณ์ครบถ้วน')
    setReportGps(est.lat && est.lng ? { lat: est.lat, lng: est.lng } : { lat: 19.9123, lng: 99.8321 })
    setInspectWidthM(est.widthM || 10)
    setInspectLengthM(est.lengthM || 14.5)

    const formDef = explicitForm || resolveInspectionForm(est.type, est.category)
    setSelectedFormDef(formDef)
    const init: Record<string, boolean> = {}
    formDef.categories.forEach(c => c.items.forEach(i => { init[i.id] = true }))
    setCheckedCriteria(init)
    setCriterionNotes({})
    setSummaryDecision('approve')
    setRejectReason('')
    setOtherNotes('')
    setActiveCatIndex(0)
    setInspectWizardStep(1)
    setSignatureDataUrl(currentOfficer.signatureUrl || OFFICIAL_NWK_SIGNATURE_DATA_URL)
    setOwnerSignatureDataUrl('')
    setInspectPhotos({ p1: '', p2: '', p3: '', p4: '' })
    setIsQuickInspectModalOpen(false)
    setSubScreen('report')
  }

  // Mark all criteria as passed across entire form in 1 click
  function handlePassAllCriteria() {
    triggerHaptic(40)
    playSuccessChime()
    const all = selectedFormDef.categories.flatMap(c => c.items)
    const next: Record<string, boolean> = {}
    all.forEach(i => { next[i.id] = true })
    setCheckedCriteria(next)
    notify(`✓ ผ่านเกณฑ์ทั้งหมด ${all.length} ข้อเรียบร้อย (ติ๊กแก้เฉพาะข้อที่มีปัญหาได้)`)
  }

  // Helper: Read and compress image for fast mobile performance and local storage safety
  function readFileAsCompressedDataUrl(file: File, maxDim = 1200, quality = 0.82): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = ev => {
        const img = new Image()
        img.onload = () => {
          let { width, height } = img
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(ev.target?.result as string)
            return
          }
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', quality))
        }
        img.onerror = () => resolve(ev.target?.result as string)
        img.src = ev.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Update store photo (from mobile camera or gallery)
  async function handleStoreImageFileChange(e: React.ChangeEvent<HTMLInputElement>, estId: string) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      playCameraShutter()
      triggerHaptic(40)
      notify('กำลังประมวลผลรูปถ่ายหน้าร้าน...')
      const dataUrl = await readFileAsCompressedDataUrl(file, 1200, 0.85)

      setSelectedEst(prev => (prev && prev.id === estId ? { ...prev, image: dataUrl } : prev))
      setEstablishments(prev => prev.map(item => (item.id === estId ? { ...item, image: dataUrl } : item)))

      await fieldApi.updateEstablishmentImage(estId, dataUrl)
      playSuccessChime()
      triggerHaptic([40, 60])
      notify('✓ บันทึกรูปถ่ายหน้าร้านสำเร็จ ซิงค์ระบบหลักแล้ว')
    } catch (err) {
      console.error(err)
      notify('เกิดข้อผิดพลาดในการโหลดรูปภาพ')
    } finally {
      e.target.value = ''
    }
  }

  // Update officer avatar (from mobile camera or gallery)
  async function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      playCameraShutter()
      triggerHaptic(40)
      notify('กำลังอัปเดตรูปโปรไฟล์...')
      const dataUrl = await readFileAsCompressedDataUrl(file, 400, 0.85)

      const updated = await authService.updateProfile({ avatarUrl: dataUrl })
      setCurrentOfficer(updated)
      playSuccessChime()
      triggerHaptic([40, 60])
      notify('✓ อัปเดตรูปโปรไฟล์สำเร็จ เชื่อมโยงกับระบบหลักแล้ว')
    } catch (err) {
      console.error(err)
      notify('เกิดข้อผิดพลาดในการอัปเดตรูปโปรไฟล์')
    } finally {
      e.target.value = ''
    }
  }

  // Save personal profile info
  async function handleSaveProfile() {
    if (!profileName.trim()) {
      notify('กรุณากรอกชื่อ-นามสกุล')
      return
    }
    const updated = await authService.updateProfile({
      name: profileName.trim(),
      position: profilePosition.trim(),
      roleName: profileRole.trim(),
      phone: profilePhone.trim(),
      email: profileEmail.trim(),
      signatureUrl: profileSignature
    })
    setCurrentOfficer(updated)
    setIsProfileModalOpen(false)
    playSuccessChime()
    triggerHaptic([40, 60])
    notify('✓ บันทึกข้อมูลส่วนตัวเรียบร้อย ซิงค์กับระบบหลักแล้ว')
  }

  // Save change PIN
  async function handleSavePin() {
    setPinError('')
    if (currentPinInput.trim() !== currentOfficer.pinCode && currentPinInput.trim() !== 'prn123') {
      setPinError('รหัส PIN เดิมไม่ถูกต้อง')
      triggerHaptic(60)
      return
    }
    if (newPinInput.trim().length < 4) {
      setPinError('รหัส PIN ใหม่ต้องมีอย่างน้อย ๔ หลัก')
      triggerHaptic(60)
      return
    }
    if (newPinInput.trim() !== confirmPinInput.trim()) {
      setPinError('รหัส PIN ใหม่ไม่ตรงกัน')
      triggerHaptic(60)
      return
    }
    await authService.updatePin(newPinInput.trim())
    setCurrentOfficer(authService.getCurrentOfficer())
    setIsPinModalOpen(false)
    setCurrentPinInput('')
    setNewPinInput('')
    setConfirmPinInput('')
    playSuccessChime()
    triggerHaptic([50, 40, 80])
    notify('✓ เปลี่ยนรหัสผ่าน PIN สำเร็จ')
  }

  // Inspection Photo slot captured via camera or selected from album
  async function handleInspectPhotoFileChange(e: React.ChangeEvent<HTMLInputElement>, slotKey: string) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      playCameraShutter()
      triggerHaptic(40)
      notify('กำลังบันทึกภาพถ่ายหลักฐาน...')
      const dataUrl = await readFileAsCompressedDataUrl(file, 1200, 0.82)
      setInspectPhotos(prev => ({ ...prev, [slotKey]: dataUrl }))
      playSuccessChime()
      triggerHaptic(40)
      notify('✓ บันทึกภาพถ่ายหลักฐานเรียบร้อย')
    } catch (err) {
      console.error(err)
      notify('เกิดข้อผิดพลาดในการโหลดภาพ')
    } finally {
      e.target.value = ''
    }
  }

  // Clear single inspection photo slot
  function handleClearInspectPhotoSlot(slotKey: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation()
    setInspectPhotos(prev => ({ ...prev, [slotKey]: '' }))
    triggerHaptic(30)
    notify('ลบภาพถ่ายหลักฐานแล้ว')
  }

  // Quick mock shortcut for testing
  function handleUseMockPhotoSlot(slotKey: string, sampleUrl: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation()
    playCameraShutter()
    triggerHaptic(40)
    setInspectPhotos(prev => ({ ...prev, [slotKey]: sampleUrl }))
    notify('✓ ใช้ภาพถ่ายตัวอย่างเรียบร้อย')
  }

  // Backward compatibility wrapper
  function handleCapturePhotoSlot(slotKey: string, sampleUrl: string) {
    if (inspectPhotos[slotKey]) {
      handleClearInspectPhotoSlot(slotKey)
    } else {
      handleUseMockPhotoSlot(slotKey, sampleUrl)
    }
  }

  // GPS Satellite Capture
  function captureGps(isForWizard = false) {
    if (!navigator.geolocation) {
      notify('อุปกรณ์นี้ไม่รองรับการตรวจจับ GPS')
      return
    }
    if (isForWizard) setIsCapturingGps(true)
    notify('กำลังเชื่อมต่อดาวเทียม GPS...')
    triggerHaptic(20)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = Number(pos.coords.latitude.toFixed(6))
        const lng = Number(pos.coords.longitude.toFixed(6))
        if (isForWizard) {
          setNewLat(lat.toString())
          setNewLng(lng.toString())
          setIsCapturingGps(false)
        } else {
          setReportGps({ lat, lng })
        }
        playSuccessChime()
        triggerHaptic(40)
        notify(`✓ พิกัด GPS จริง: ${lat}, ${lng}`)
      },
      () => {
        if (isForWizard) {
          setNewLat('19.9123')
          setNewLng('99.8321')
          setIsCapturingGps(false)
        } else {
          setReportGps({ lat: 19.9123, lng: 99.8321 })
        }
        notify('บันทึกพิกัดมาตรฐาน (19.9123, 99.8321)')
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  // Save New Store from Wizard
  async function handleSaveNewStore(startInspectImmediately = false) {
    if (!newStoreName.trim()) {
      notify('กรุณาระบุชื่อสถานประกอบการ')
      setWizardStep(1)
      return
    }
    if (!newOwner.trim()) {
      notify('กรุณาระบุชื่อผู้ประกอบการ')
      setWizardStep(1)
      return
    }

    const isHazardous = newStoreType.includes('อันตราย') || newStoreType.includes('ปั๊มน้ำมัน') || newStoreType.includes('หยอดเหรียญ') || newStoreType.includes('ปิโตรเลียม')
    const newCategory: 'hazardous' | 'food_notice' | 'food_license' =
      isHazardous ? 'hazardous' : calculatedArea <= 200 ? 'food_notice' : 'food_license'

    try {
      const { establishment: createdEst, task: createdTask } = await fieldApi.createEstablishment({
        name: newStoreName.trim(),
        type: newStoreType,
        category: newCategory,
        owner: newOwner.trim(),
        citizenId: newCitizenId.trim(),
        phone: newPhone.trim() || '081-234-5678',
        address: newAddress.trim() || '123 หมู่ที่ 5 ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่ 50110',
        village: newVillage || 'ต.โป่งน้ำร้อน',
        areaSqm: calculatedArea,
        widthM: newWidthM,
        lengthM: newLengthM,
        lat: Number(newLat) || 19.9288,
        lng: Number(newLng) || 99.1685
      })

      setEstablishments(prev => [createdEst, ...prev.filter(e => e.id !== createdEst.id)])
      setTasks(prev => [createdTask, ...prev.filter(t => t.id !== createdTask.id)])
      playSuccessChime()
      triggerHaptic([50, 40, 80])
      notify(`✓ ลงทะเบียนร้าน "${createdEst.name}" สำเร็จ เชื่อมโยงระบบหลักแล้ว!`)

      setWizardStep(1)
      setNewStoreName('')
      setNewOwner('')
      setNewCitizenId('')
      setNewPhone('')
      setNewAddress('')

      if (startInspectImmediately) {
        startReport(createdEst, createdTask)
      } else {
        setSubScreen('none')
        setTab('stores')
      }
    } catch (err: any) {
      console.error('Error saving new store:', err)
      notify('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง')
    }
  }

  // Submit Inspection Report (Screen 8)
  async function submitReport() {
    if (!selectedEst || !selectedTask) return
    setIsSyncing(true)
    triggerHaptic(50)

    const areaSuffix = selectedFormDef.id === 'hazardous_health'
      ? ''
      : (inspectAreaSqm ? ` [พื้นที่ตรวจวัด: ${inspectAreaSqm} ตร.ม.]` : '')
    const finalNotes = `${reportNotes}${areaSuffix}${ownerSignatureDataUrl ? ' [มีลายมือชื่อผู้ประกอบการ]' : ''}`
    const activePhotos = Object.values(inspectPhotos).filter(Boolean)

    const report: FieldReport = {
      taskId: selectedTask.id,
      establishmentId: selectedEst.id,
      establishmentName: selectedEst.name,
      visitDate: new Intl.DateTimeFormat('th-TH', { dateStyle: 'short', timeStyle: 'short' }).format(new Date()),
      outcome: reportOutcome,
      notes: finalNotes,
      latitude: reportGps?.lat,
      longitude: reportGps?.lng,
      photos: activePhotos,
      collectedDocuments: true,
      collectedItems: [selectedFormDef.title, 'บัตรประชาชน', 'ตารางวัดพื้นที่ประกอบการ'],
      signatureStatus: signatureDataUrl ? 'signed_digitally' : 'signed_on_paper',
      followUpAction: reportOutcome === 'ผ่าน' ? 'issue_license' : 're_inspect_15_days',
      inspectorName: currentOfficer.name,
      createdAt: new Date().toISOString()
    }

    try {
      if (!offline) {
        await fieldApi.submitReport(report)
        playSuccessChime()
        notify('✓ ส่งผลตรวจขึ้นระบบเรียบร้อย')
      } else {
        const queue = JSON.parse(localStorage.getItem('field-pwa-pending-reports') || '[]')
        queue.push(report)
        localStorage.setItem('field-pwa-pending-reports', JSON.stringify(queue))
        setSyncCount(queue.length)
        notify('บันทึกในเครื่องออฟไลน์แล้ว — รอซิงค์เมื่อออนไลน์')
      }
      setTasks(old => old.map(t => t.id === selectedTask.id ? { ...t, status: 'เสร็จสิ้น' } : t))
      setSubScreen('none')
      setTab('tasks')
    } catch {
      const queue = JSON.parse(localStorage.getItem('field-pwa-pending-reports') || '[]')
      queue.push(report)
      localStorage.setItem('field-pwa-pending-reports', JSON.stringify(queue))
      setSyncCount(queue.length)
      setSubScreen('none')
      notify('บันทึกในคิวรอ Sync เรียบร้อย')
    } finally {
      setIsSyncing(false)
    }
  }

  // Filtered Establishments (Screen 3)
  const filteredEsts = useMemo(() => {
    return establishments.filter(e => {
      const matchQuery = `${e.name} ${e.owner} ${e.permitNo} ${e.address} ${e.village || ''}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      
      const matchCategory =
        storeCategoryFilter === 'ทั้งหมด'
          ? true
          : storeCategoryFilter === 'ร้านอาหาร'
          ? e.category === 'food_notice' || e.category === 'food_license' || e.type.includes('ร้านอาหาร') || e.type.includes('จำหน่ายอาหาร') || e.type.includes('เครื่องดื่ม')
          : storeCategoryFilter === 'สถานที่สะสมอาหาร'
          ? (e.category === 'food_storage' || e.type.includes('สะสมอาหาร') || e.type.includes('คลัง') || e.type.includes('ห้องเย็น')) && !e.type.includes('ปิโตรเลียม') && !e.type.includes('น้ำมัน') && !e.type.includes('หยอดเหรียญ') && !e.type.includes('อันตราย')
          : e.category === 'hazardous' || e.type.includes('อันตราย') || e.type.includes('ปิโตรเลียม') || e.type.includes('น้ำมัน') || e.type.includes('หยอดเหรียญ') || e.type.includes('สารเคมี') || (e.permitNo && e.permitNo.startsWith('บทส'))

      const matchStatus =
        storeStatusFilter === 'ทั้งหมด'
          ? true
          : storeStatusFilter === 'ใช้งานได้'
          ? e.permitStatus === 'ปกติ'
          : e.permitStatus === storeStatusFilter

      const matchVillage = villageFilter === 'ทั้งหมด' || e.village === villageFilter

      return matchQuery && matchCategory && matchStatus && matchVillage
    })
  }, [establishments, searchQuery, storeCategoryFilter, storeStatusFilter, villageFilter])

  // Filtered Tasks (Screen 6)
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (taskFilter === 'pending') return t.status === 'รอดำเนินการ'
      if (taskFilter === 'progress') return t.status === 'กำลังดำเนินการ' || t.status === 'นัดหมายแล้ว'
      return true
    })
  }, [tasks, taskFilter])

  // =========================================================
  // SCREEN 1: LOGIN & SPLASH SCREEN (เมื่อยังไม่เข้าสู่ระบบ)
  // =========================================================
  if (!isAuthenticated) {
    return (
      <div className={`mobile-app-root ${mode === 'embedded' ? 'pwa-embedded' : 'pwa-standalone'}`}>
        <div className="mobile-screen-viewport">
          {/* SCREEN 1: SPLASH & LOGIN CONTAINER (2026 LIGHT MODE) */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(180deg, #f0f7ff 0%, #ffffff 42%, #f8fafc 100%)',
              padding: '24px 18px 20px',
              overflowY: 'auto',
              justifyContent: 'space-between'
            }}>
              {/* Header Seal & Titles */}
              <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                <div style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  padding: '7px',
                  margin: '0 auto 12px',
                  boxShadow: '0 10px 25px -4px rgba(37, 99, 235, 0.22)',
                  border: '2px solid #dbeafe',
                  display: 'grid',
                  placeItems: 'center'
                }}>
                  <img src="/pnr_logo.png" alt="ตรางานสาธารณสุข องค์การบริหารส่วนตำบลโป่งน้ำร้อน" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <h1 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px', marginBottom: '4px', color: '#0f172a' }}>
                  งานสาธารณสุข องค์การบริหารส่วนตำบลโป่งน้ำร้อน
                </h1>
                <p style={{ fontSize: '11.5px', color: '#475569', maxWidth: '290px', margin: '0 auto', lineHeight: 1.45, fontWeight: 500 }}>
                  ระบบบริหารจัดการสถานประกอบการด้านอาหารและสุขลักษณะ อบต.โป่งน้ำร้อน
                </p>
              </div>

              {/* Photo of Municipal Office Card */}
              <div style={{
                background: '#ffffff',
                borderRadius: '22px',
                padding: '16px',
                boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)',
                border: '1px solid #e2e8f0',
                margin: '20px 0 16px'
              }}>
                <div style={{
                  width: '100%',
                  height: '140px',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  position: 'relative',
                  marginBottom: '16px'
                }}>
                  <img
                    src="https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80"
                    alt="ที่ทำการ องค์การบริหารส่วนตำบลโป่งน้ำร้อน"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '8px 12px',
                    background: 'linear-gradient(to top, rgba(15, 23, 42, 0.75), transparent)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    ที่ทำการองค์การบริหารส่วนตำบล / เทศบาล
                  </div>
                </div>

                {loginError && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AlertTriangle size={14} />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      เลือกบัญชีเจ้าหน้าที่
                    </label>
                    <select
                      value={loginOfficerId}
                      onChange={e => setLoginOfficerId(e.target.value)}
                      className="mobile-input"
                    >
                      {officersList.map(off => (
                        <option key={off.id} value={off.id}>
                          {off.name} ({off.position})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                        รหัส PIN เจ้าหน้าที่
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        style={{ fontSize: '11px', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
                      >
                        {showPin ? <EyeOff size={13} /> : <Eye size={13} />}
                        <span>{showPin ? 'ซ่อน' : 'แสดง'}</span>
                      </button>
                    </div>
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={loginPin}
                      onChange={e => setLoginPin(e.target.value)}
                      placeholder="กรอกรหัส PIN"
                      className="mobile-input"
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                      color: '#ffffff',
                      borderRadius: '14px',
                      padding: '12px',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                      marginTop: '4px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span>เข้าสู่ระบบ</span>
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>
                      สำหรับเจ้าหน้าที่สาธารณสุข
                    </span>
                  </div>
                </form>
              </div>

              {/* Version & Seal Footer */}
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: '10.5px' }}>
                <p>ที่ทำการองค์การบริหารส่วนตำบล / เทศบาล</p>
                <p style={{ marginTop: '2px', color: '#94a3b8' }}>เวอร์ชัน 1.0.0 (PWA Mobile)</p>
              </div>
            </div>
          </div>
        </div>
    )
  }

  // =========================================================
  // MAIN AUTHENTICATED APP (5 TABS & SUB-SCREENS)
  // =========================================================
  return (
    <div className={`mobile-app-root ${mode === 'embedded' ? 'pwa-embedded' : 'pwa-standalone'}`}>
      <div className="mobile-screen-viewport">
        {/* Toast Notification */}
      {toastMsg && (
        <div className="mobile-toast">
          <CheckCircle2 size={16} color="#10b981" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* QR Code Scanner Viewfinder Modal */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScanSuccess={est => startReport(est)}
        establishments={establishments}
      />

      {/* 1-Click Quick Inspection Store & Form Picker Modal (Redesigned 2026 Bottom Sheet) */}
      {isQuickInspectModalOpen && (
        <div
          className="quick-inspect-backdrop"
          onClick={e => {
            if (e.target === e.currentTarget) setIsQuickInspectModalOpen(false)
          }}
        >
          <div className="quick-inspect-sheet" role="dialog" aria-modal="true">
            {/* Grabber handle */}
            <div className="quick-inspect-handle-bar" onClick={() => setIsQuickInspectModalOpen(false)}>
              <div className="quick-inspect-handle-pill" />
            </div>

            {/* Header */}
            <div className="quick-inspect-header">
              <div>
                <div className="quick-inspect-badge">
                  <ShieldCheck size={13} color="#2563eb" />
                  <span>งานตรวจสุขลักษณะภาคสนาม • อบต.โป่งน้ำร้อน</span>
                </div>
                <h3 className="quick-inspect-title">ตรวจสนาม / ประเมินสุขลักษณะ</h3>
                <p className="quick-inspect-subtitle">
                  เลือกแบบฟอร์ม พ.ร.บ.สาธารณสุข และสถานประกอบการเพื่อเริ่มตรวจ
                </p>
              </div>
              <button
                type="button"
                className="quick-inspect-close-btn"
                onClick={() => setIsQuickInspectModalOpen(false)}
                title="ปิดหน้าต่าง"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Selection Segment */}
            <div className="quick-inspect-forms-section">
              <div className="quick-inspect-section-label">
                <span>เลือกแบบฟอร์มที่ต้องการตรวจ:</span>
                <span style={{ fontSize: '10.5px', color: '#64748b' }}>มาตรฐาน อบต.โป่งน้ำร้อน</span>
              </div>
              <div className="quick-inspect-form-grid">
                {/* 1. จำหน่ายอาหาร */}
                <div
                  className={`quick-inspect-form-tile ${quickTargetFormId === 'food_service' ? 'active-food-service' : ''}`}
                  onClick={() => {
                    triggerHaptic(20)
                    setQuickTargetFormId('food_service')
                  }}
                >
                  {quickTargetFormId === 'food_service' && (
                    <div className="quick-inspect-tile-check" style={{ background: '#16a34a' }}>
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                  <div
                    className="quick-inspect-tile-icon"
                    style={{
                      background: quickTargetFormId === 'food_service' ? '#dcfce7' : '#f0fdf4',
                      color: '#16a34a'
                    }}
                  >
                    <UtensilsCrossed size={18} />
                  </div>
                  <div
                    className="quick-inspect-tile-title"
                    style={{ color: quickTargetFormId === 'food_service' ? '#15803d' : '#1e293b' }}
                  >
                    จำหน่ายอาหาร
                  </div>
                  <div
                    className="quick-inspect-tile-meta"
                    style={{ color: quickTargetFormId === 'food_service' ? '#166534' : '#64748b' }}
                  >
                    ๒๑ ข้อ • นจ.๓
                  </div>
                </div>

                {/* 2. สะสมอาหาร */}
                <div
                  className={`quick-inspect-form-tile ${quickTargetFormId === 'food_storage' ? 'active-food-storage' : ''}`}
                  onClick={() => {
                    triggerHaptic(20)
                    setQuickTargetFormId('food_storage')
                  }}
                >
                  {quickTargetFormId === 'food_storage' && (
                    <div className="quick-inspect-tile-check" style={{ background: '#d97706' }}>
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                  <div
                    className="quick-inspect-tile-icon"
                    style={{
                      background: quickTargetFormId === 'food_storage' ? '#fef3c7' : '#fffbeb',
                      color: '#d97706'
                    }}
                  >
                    <Warehouse size={18} />
                  </div>
                  <div
                    className="quick-inspect-tile-title"
                    style={{ color: quickTargetFormId === 'food_storage' ? '#b45309' : '#1e293b' }}
                  >
                    สะสมอาหาร
                  </div>
                  <div
                    className="quick-inspect-tile-meta"
                    style={{ color: quickTargetFormId === 'food_storage' ? '#92400e' : '#64748b' }}
                  >
                    ๑๕ ข้อ • นจ.๔
                  </div>
                </div>

                {/* 3. กิจการอันตราย */}
                <div
                  className={`quick-inspect-form-tile ${quickTargetFormId === 'hazardous_health' ? 'active-hazardous' : ''}`}
                  onClick={() => {
                    triggerHaptic(20)
                    setQuickTargetFormId('hazardous_health')
                  }}
                >
                  {quickTargetFormId === 'hazardous_health' && (
                    <div className="quick-inspect-tile-check" style={{ background: '#9333ea' }}>
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                  <div
                    className="quick-inspect-tile-icon"
                    style={{
                      background: quickTargetFormId === 'hazardous_health' ? '#f3e8ff' : '#faf5ff',
                      color: '#9333ea'
                    }}
                  >
                    <ShieldAlert size={18} />
                  </div>
                  <div
                    className="quick-inspect-tile-title"
                    style={{ color: quickTargetFormId === 'hazardous_health' ? '#7e22ce' : '#1e293b' }}
                  >
                    กิจการอันตราย
                  </div>
                  <div
                    className="quick-inspect-tile-meta"
                    style={{ color: quickTargetFormId === 'hazardous_health' ? '#6b21a8' : '#64748b' }}
                  >
                    ๑๓ ข้อ • บท.๓
                  </div>
                </div>
              </div>
            </div>

            {/* Search Box & Quick Action Row */}
            <div className="quick-inspect-toolbar">
              {/* Search Bar */}
              <div className="quick-inspect-search-bar">
                <Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  className="quick-inspect-search-input"
                  value={quickInspectQuery}
                  onChange={e => setQuickInspectQuery(e.target.value)}
                  placeholder="ค้นหาชื่อร้าน, เลขทะเบียน, เจ้าของ, หรือหมู่บ้าน..."
                  autoFocus
                />
                {quickInspectQuery && (
                  <button
                    type="button"
                    onClick={() => setQuickInspectQuery('')}
                    style={{ color: '#94a3b8', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex' }}
                    title="ล้างคำค้นหา"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* 2 Quick Action Buttons */}
              <div className="quick-inspect-actions-row">
                <button
                  type="button"
                  className="quick-inspect-action-pill qr"
                  onClick={() => {
                    triggerHaptic(20)
                    setIsQuickInspectModalOpen(false)
                    setIsQrScannerOpen(true)
                  }}
                >
                  <QrCode size={15} />
                  <span>สแกน QR หน้าร้าน</span>
                </button>

                <button
                  type="button"
                  className="quick-inspect-action-pill add"
                  onClick={() => {
                    triggerHaptic(20)
                    setIsQuickInspectModalOpen(false)
                    setWizardStep(1)
                    setSubScreen('new_store')
                  }}
                >
                  <Plus size={15} />
                  <span>เพิ่มร้านใหม่ (+ GPS)</span>
                </button>
              </div>
            </div>

            {/* List of Establishments to Pick */}
            <div className="quick-inspect-stores-container">
              {(() => {
                const q = quickInspectQuery.trim().toLowerCase()
                const matches = establishments.filter(e => {
                  if (!q) return true
                  return (
                    e.name.toLowerCase().includes(q) ||
                    (e.address && e.address.toLowerCase().includes(q)) ||
                    (e.village && e.village.toLowerCase().includes(q)) ||
                    (e.permitNo && e.permitNo.toLowerCase().includes(q)) ||
                    (e.owner && e.owner.toLowerCase().includes(q))
                  )
                })

                const targetFormDef = quickTargetFormId
                  ? (ALL_OFFICIAL_FORMS.find(f => f.id === quickTargetFormId) || OFFICIAL_FOOD_SERVICE_FORM)
                  : OFFICIAL_FOOD_SERVICE_FORM

                if (matches.length === 0) {
                  return (
                    <div className="quick-inspect-empty-state">
                      <div className="quick-inspect-empty-icon">
                        <Search size={26} />
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                        ไม่พบสถานประกอบการที่ตรงกับ "{quickInspectQuery}"
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', maxWidth: '280px', lineHeight: 1.4 }}>
                        ลองค้นหาด้วยชื่ออื่น หรือลงทะเบียนร้านค้าใหม่เข้าสู่ระบบ อบต.โป่งน้ำร้อน
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setQuickInspectQuery('')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '10px',
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#475569',
                            cursor: 'pointer'
                          }}
                        >
                          ล้างคำค้นหา
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(20)
                            setIsQuickInspectModalOpen(false)
                            setNewStoreName(quickInspectQuery)
                            setWizardStep(1)
                            setSubScreen('new_store')
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '10px',
                            background: '#dbeafe',
                            border: '1px solid #93c5fd',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#1d4ed8',
                            cursor: 'pointer'
                          }}
                        >
                          + ลงทะเบียนร้านนี้
                        </button>
                      </div>
                    </div>
                  )
                }

                return (
                  <>
                    <div className="quick-inspect-stores-header">
                      <span>เลือกร้านค้าเพื่อเริ่มบันทึกผล ({matches.length} ร้าน)</span>
                      <span style={{
                        color: quickTargetFormId === 'food_service' ? '#15803d' : quickTargetFormId === 'food_storage' ? '#b45309' : '#7e22ce',
                        background: quickTargetFormId === 'food_service' ? '#dcfce7' : quickTargetFormId === 'food_storage' ? '#fef3c7' : '#f3e8ff',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 700
                      }}>
                        แบบ: {quickTargetFormId === 'food_service' ? 'จำหน่ายอาหาร' : quickTargetFormId === 'food_storage' ? 'สะสมอาหาร' : 'กิจการอันตราย'}
                      </span>
                    </div>

                    {matches.map(est => {
                      const naturalForm = resolveInspectionForm(est.type, est.category)
                      const chosenForm = quickTargetFormId
                        ? (ALL_OFFICIAL_FORMS.find(f => f.id === quickTargetFormId) || naturalForm)
                        : naturalForm

                      // Category styling for icon
                      const isFood = est.type?.includes('อาหาร') || est.category === 'food_license' || est.category === 'food_notice'
                      const isStorage = est.type?.includes('สะสม') || est.category === 'food_storage'
                      const iconBg = isFood ? '#fef3c7' : isStorage ? '#dcfce7' : '#f3e8ff'
                      const iconColor = isFood ? '#b45309' : isStorage ? '#15803d' : '#7e22ce'
                      const IconComp = isFood ? UtensilsCrossed : isStorage ? Warehouse : ShieldAlert

                      return (
                        <div
                          key={est.id}
                          className="quick-inspect-card"
                          onClick={() => {
                            triggerHaptic(30)
                            startReport(est, undefined, chosenForm)
                          }}
                        >
                          {/* Store Avatar / Category Icon */}
                          <div
                            className="quick-inspect-card-icon"
                            style={{ background: iconBg, color: iconColor }}
                          >
                            <IconComp size={20} />
                          </div>

                          {/* Store Details */}
                          <div className="quick-inspect-card-body">
                            <div className="quick-inspect-card-title-row">
                              <span className="quick-inspect-card-name">
                                {est.name}
                              </span>
                              {est.village && (
                                <span className="quick-inspect-village-tag">
                                  {est.village.replace(' (ที่ทำการ อบต.)', '')}
                                </span>
                              )}
                            </div>

                            <div className="quick-inspect-card-meta">
                              <span>👤 {est.owner || est.type || 'ผู้ประกอบการ'}</span>
                              <span>•</span>
                              <span>🏷️ {est.permitNo || 'รอออกเลข'}</span>
                            </div>

                            {est.address && (
                              <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                📍 {est.address}
                              </div>
                            )}
                          </div>

                          {/* CTA Button */}
                          <button
                            type="button"
                            className="quick-inspect-start-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              triggerHaptic(30)
                              startReport(est, undefined, chosenForm)
                            }}
                          >
                            <ClipboardCheck size={14} />
                            <span>เริ่มตรวจ</span>
                          </button>
                        </div>
                      )
                    })}
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Official Government Form Modal Preview */}
      {selectedGovForm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '380px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
              padding: '14px 16px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} className="text-cyan-300" />
                <span style={{ fontSize: '13px', fontWeight: 700 }}>{selectedGovForm.code}</span>
              </div>
              <button onClick={() => setSelectedGovForm(null)} style={{ color: '#ffffff' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                {selectedGovForm.title}
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4, marginBottom: '14px' }}>
                {selectedGovForm.desc}
              </p>
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', fontSize: '11.5px', marginBottom: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>อัตราค่าธรรมเนียม:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedGovForm.fee}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>อายุใบอนุญาต:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedGovForm.period}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>อ้างอิง:</span>
                  <span style={{ color: '#2563eb', fontSize: '10.5px' }}>{selectedGovForm.law}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    notify(`✓ ดาวน์โหลดตัวอย่าง ${selectedGovForm.code} เรียบร้อย`)
                    setSelectedGovForm(null)
                  }}
                  style={{
                    flex: 1,
                    background: '#1769d2',
                    color: '#ffffff',
                    padding: '10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={14} />
                  <span>ดาวน์โหลดแบบฟอร์ม PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. Modal: ข้อมูลส่วนตัวเจ้าหน้าที่ */}
      {isProfileModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '400px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid #e2e8f0',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
              padding: '14px 16px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserRound size={18} className="text-cyan-300" />
                <span style={{ fontSize: '13.5px', fontWeight: 800 }}>แก้ไขข้อมูลส่วนตัวเจ้าหน้าที่</span>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                style={{ color: '#ffffff', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  ชื่อ-นามสกุล <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="เช่น นางสาวรุ่งทิวา อุปนันท์"
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  ตำแหน่งราชการ
                </label>
                <input
                  type="text"
                  value={profilePosition}
                  onChange={e => setProfilePosition(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="เช่น นักวิชาการสาธารณสุขปฏิบัติการ"
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  บทบาท / สิทธิ์ปฏิบัติหน้าที่
                </label>
                <input
                  type="text"
                  value={profileRole}
                  onChange={e => setProfileRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="เช่น นักวิชาการสาธารณสุขปฏิบัติการ (ผู้ตรวจหลัก)"
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  เบอร์โทรศัพท์ติดต่อ
                </label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={e => setProfilePhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="เช่น 053-010-555 ต่อ 12"
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  อีเมลหน่วยงาน
                </label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={e => setProfileEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="เช่น health@pongnamron.go.th"
                />
              </div>

              {/* Digital Signature section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                    ลายมือชื่อดิจิทัลทางการ (Official E-Signature)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsSigningInProfile(!isSigningInProfile)}
                    style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: 700, background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    {isSigningInProfile ? 'ปิดกระดานเซ็น' : '✏️ วาดลายเซ็นใหม่'}
                  </button>
                </div>

                {isSigningInProfile ? (
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px dashed #3b82f6' }}>
                    <SignaturePad
                      role="officer"
                      title="วาดลายมือชื่อทางการเพื่อใช้ในเอกสารราชการ"
                      officerName={profileName || currentOfficer.name}
                      initialSignature={profileSignature}
                      canvasHeight={120}
                      onSave={(dataUrl) => {
                        setProfileSignature(dataUrl)
                        setIsSigningInProfile(false)
                        notify('✓ บันทึกลายมือชื่อลงในฟอร์มแล้ว (กดบันทึกข้อมูลเพื่อซิงค์)')
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    height: '70px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {profileSignature ? (
                      <img src={profileSignature} alt="ลายมือชื่อ" style={{ maxHeight: '60px', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>ยังไม่มีลายมือชื่อดิจิทัล (กดวาดลายเซ็นใหม่)</span>
                    )}
                  </div>
                )}
              </div>

              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', fontSize: '11px', color: '#64748b', border: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>สังกัด: </span>
                งานสุขาภิบาลและอนามัยสิ่งแวดล้อม สำนักปลัด/กองสาธารณสุข อบต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  style={{
                    flex: 2,
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(29, 78, 216, 0.3)'
                  }}
                >
                  <Save size={14} />
                  <span>บันทึก & ซิงค์ระบบหลัก</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: เปลี่ยนรหัสผ่าน PIN */}
      {isPinModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '360px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
              padding: '14px 16px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} className="text-cyan-300" />
                <span style={{ fontSize: '13.5px', fontWeight: 800 }}>เปลี่ยนรหัสผ่าน PIN เจ้าหน้าที่</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                style={{ color: '#ffffff', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pinError && (
                <div style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: '#fef2f2',
                  color: '#dc2626',
                  fontSize: '11.5px',
                  border: '1px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <AlertTriangle size={14} />
                  <span>{pinError}</span>
                </div>
              )}

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  รหัส PIN ปัจจุบัน
                </label>
                <input
                  type="password"
                  value={currentPinInput}
                  onChange={e => setCurrentPinInput(e.target.value)}
                  placeholder="กรอก PIN เดิม"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  รหัส PIN ใหม่ (อย่างน้อย ๔ หลัก)
                </label>
                <input
                  type="password"
                  value={newPinInput}
                  onChange={e => setNewPinInput(e.target.value)}
                  placeholder="กรอก PIN ใหม่"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  ยืนยันรหัส PIN ใหม่
                </label>
                <input
                  type="password"
                  value={confirmPinInput}
                  onChange={e => setConfirmPinInput(e.target.value)}
                  placeholder="กรอก PIN ใหม่อีกครั้ง"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSavePin}
                  style={{
                    flex: 2,
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <KeyRound size={14} />
                  <span>บันทึก PIN ใหม่</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: สิทธิ์การใช้งาน */}
      {isPermissionsModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '380px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
              padding: '14px 16px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} />
                <span style={{ fontSize: '13.5px', fontWeight: 800 }}>สิทธิ์และอำนาจเจ้าพนักงานสาธารณสุข</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPermissionsModalOpen(false)}
                style={{ color: '#ffffff', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11.5px' }}>
              <div style={{ background: '#f0fdf4', padding: '10px 12px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontWeight: 800, color: '#15803d', fontSize: '12px', marginBottom: '2px' }}>
                  {currentOfficer.name}
                </div>
                <div style={{ color: '#166534', fontSize: '11px' }}>
                  รหัสเจ้าหน้าที่: {currentOfficer.officerCode} • {currentOfficer.position}
                </div>
              </div>

              <div style={{ color: '#334155', lineHeight: 1.5 }}>
                ได้รับแต่งตั้งเป็น <strong>"เจ้าพนักงานสาธารณสุข"</strong> ตามพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕ มีอำนาจหน้าที่ดังต่อไปนี้:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  'เข้าตรวจตราสถานประกอบการในเขต อบต.โป่งน้ำร้อน ในเวลาระหว่างพระอาทิตย์ขึ้นถึงพระอาทิตย์ตก',
                  'ตรวจสอบสุขลักษณะ อาหาร น้ำใช้ อุปกรณ์ และการสุขาภิบาลตามแบบตรวจมาตรฐาน',
                  'บันทึกผลการตรวจสอบหน้างาน ถ่ายภาพหลักฐาน และเก็บพิกัดดาวเทียม GIS',
                  'ลงลายมือชื่อดิจิทัลรับรองผลการตรวจ และส่งต่อเพื่อพิจารณาออกใบอนุญาต/หนังสือรับรอง',
                  'รับลงทะเบียนสถานประกอบการรายใหม่ภาคสนาม และส่งตรงเข้าระบบทะเบียนกลาง'
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#475569' }}>
                    <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsPermissionsModalOpen(false)}
                style={{
                  marginTop: '6px',
                  padding: '10px',
                  borderRadius: '10px',
                  background: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                รับทราบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: เกี่ยวกับแอปพลิเคชัน */}
      {isAboutModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '380px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
              padding: '16px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={18} className="text-cyan-300" />
                <span style={{ fontSize: '13.5px', fontWeight: 800 }}>เกี่ยวกับแอปพลิเคชัน</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAboutModalOpen(false)}
                style={{ color: '#ffffff', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ textAlign: 'center', padding: '6px 0' }}>
                <div style={{ fontSize: '26px', marginBottom: '4px' }}>🏛️</div>
                <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  ระบบสาธารณสุขภาคสนาม (PWA)
                </h3>
                <p style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700, margin: '2px 0 0' }}>
                  องค์การบริหารส่วนตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่
                </p>
                <span style={{ fontSize: '10px', color: '#64748b' }}>เวอร์ชัน 1.2.0 • Build 2026.10</span>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>ฐานข้อมูลหลัก Cloud:</span>
                  <strong style={{ color: '#059669' }}>● Supabase เชื่อมต่อแล้ว</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>ซิงค์ระบบเว็บ Desktop:</span>
                  <strong style={{ color: '#2563eb' }}>● Real-time (BroadcastChannel)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>โหมดออฟไลน์:</span>
                  <strong style={{ color: '#059669' }}>● พร้อมบันทึกในเครื่องอัตโนมัติ</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>พิกัด GIS มาตรฐาน:</span>
                  <strong style={{ color: '#0f172a' }}>19.9288, 99.1685 (ต.โป่งน้ำร้อน)</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAboutModalOpen(false)}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  background: '#1d4ed8',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: ยืนยันออกจากระบบ */}
      {isLogoutConfirmOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '340px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid #fee2e2'
          }}>
            <div style={{ padding: '20px 16px', textAlign: 'center' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#ef4444',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 12px'
              }}>
                <LogOut size={22} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                ต้องการออกจากระบบ?
              </h3>
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: '0 0 16px' }}>
                คุณต้องการออกจากระบบเจ้าหน้าที่ "{currentOfficer.name}" ใช่หรือไม่?
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsLogoutConfirmOpen(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogoutConfirmOpen(false)
                    handleLogout()
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  ออกจากระบบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: ดูภาพถ่ายขยายใหญ่ */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '16px'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '420px', width: '100%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <img
              src={previewImageUrl}
              alt="ภาพขยาย"
              style={{
                width: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
              }}
            />
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              style={{
                position: 'absolute',
                top: '-12px',
                right: '-12px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#ffffff',
                color: '#0f172a',
                border: 'none',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Modal 7: การดำเนินการเพิ่มเติม (Store More Actions Sheet) */}
      {isMoreActionsModalOpen && selectedEst && (
        <div
          className="store-action-sheet-backdrop"
          onClick={e => {
            if (e.target === e.currentTarget) setIsMoreActionsModalOpen(false)
          }}
        >
          <div className="store-action-sheet" role="dialog" aria-modal="true">
            {/* Grabber handle */}
            <div className="quick-inspect-handle-bar" onClick={() => setIsMoreActionsModalOpen(false)}>
              <div className="quick-inspect-handle-pill" />
            </div>

            {/* Header */}
            <div className="quick-inspect-header">
              <div>
                <div className="quick-inspect-badge" style={{ background: '#f1f5f9', borderColor: '#cbd5e1', color: '#334155' }}>
                  <Settings size={13} color="#475569" />
                  <span>การดำเนินการเพิ่มเติม</span>
                </div>
                <h3 className="quick-inspect-title" style={{ fontSize: '16px' }}>{selectedEst.name}</h3>
                <p className="quick-inspect-subtitle">
                  {selectedEst.permitNo} • {selectedEst.village || 'ต.โป่งน้ำร้อน'}
                </p>
              </div>
              <button
                type="button"
                className="quick-inspect-close-btn"
                onClick={() => setIsMoreActionsModalOpen(false)}
                title="ปิดหน้าต่าง"
              >
                <X size={18} />
              </button>
            </div>

            {/* Actions List */}
            <div style={{ padding: '14px 18px 24px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '65vh' }}>
              {/* 1. ดูแผนที่ / นำทาง GPS */}
              <button
                type="button"
                className="store-action-item"
                onClick={() => {
                  triggerHaptic(20)
                  const lat = selectedEst.lat || 19.9288
                  const lng = selectedEst.lng || 99.1685
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
                }}
              >
                <div className="store-action-item-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                  <Navigation size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>นำทางด้วย Google Maps</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>เปิดแผนที่นำทางไปยังสถานประกอบการ ({selectedEst.lat || 19.9288}, {selectedEst.lng || 99.1685})</div>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </button>

              {/* 2. เริ่มตรวจสุขลักษณะทันที */}
              <button
                type="button"
                className="store-action-item"
                onClick={() => {
                  setIsMoreActionsModalOpen(false)
                  startReport(selectedEst)
                }}
              >
                <div className="store-action-item-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                  <ClipboardCheck size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>เริ่มตรวจสุขลักษณะหน้าร้าน</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>บันทึกผลการตรวจสุขาภิบาลตามเกณฑ์ พ.ร.บ.สาธารณสุข</div>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </button>

              {/* 3. แก้ไขข้อมูลสถานประกอบการ */}
              <button
                type="button"
                className="store-action-item"
                onClick={() => openEditStore(selectedEst)}
              >
                <div className="store-action-item-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                  <FileCheck2 size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>แก้ไขข้อมูลสถานประกอบการ</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>แก้ไขชื่อร้าน, เจ้าของ, เบอร์โทร, พิกัด GPS, ขนาดพื้นที่</div>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </button>

              {/* 4. โทรติดต่อผู้ประกอบการ */}
              {selectedEst.phone && (
                <button
                  type="button"
                  className="store-action-item"
                  onClick={() => {
                    triggerHaptic(20)
                    window.location.href = `tel:${selectedEst.phone}`
                  }}
                >
                  <div className="store-action-item-icon" style={{ background: '#f0fdf4', color: '#15803d' }}>
                    <Phone size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>โทรติดต่อผู้ประกอบการ</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{selectedEst.owner} ({selectedEst.phone})</div>
                  </div>
                  <ChevronRight size={16} color="#94a3b8" />
                </button>
              )}

              {/* 5. QR Code ประจำร้าน */}
              <button
                type="button"
                className="store-action-item"
                onClick={() => openStoreQrModal(selectedEst)}
              >
                <div className="store-action-item-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                  <QrCode size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>รหัส QR Code ประจำร้าน</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>สร้าง QR สำหรับพิมพ์ติดหน้าร้านและสแกนตรวจด่วน</div>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </button>

              {/* 6. ถ่ายภาพ / เปลี่ยนภาพหน้าร้าน */}
              <label
                className="store-action-item"
                style={{ cursor: 'pointer' }}
              >
                <div className="store-action-item-icon" style={{ background: '#fdf2f8', color: '#db2777' }}>
                  <Camera size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>เปลี่ยน / ถ่ายภาพหน้าร้านใหม่</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>อัปโหลดภาพถ่ายสถานที่จริงบันทึกเข้าสู่ระบบ</div>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={e => {
                    setIsMoreActionsModalOpen(false)
                    handleStoreImageFileChange(e, selectedEst.id)
                  }}
                />
              </label>

              {/* 7. ลบสถานประกอบการ (Danger) */}
              <button
                type="button"
                className="store-action-item danger"
                onClick={handleDeleteSelectedStore}
              >
                <div className="store-action-item-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                  <Trash2 size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 800 }}>ลบสถานประกอบการออกจากระบบ</div>
                  <div style={{ fontSize: '11px', opacity: 0.85 }}>เพิกถอนและลบข้อมูลร้านออกจากฐานข้อมูล อบต.โป่งน้ำร้อน</div>
                </div>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 8: แก้ไขข้อมูลสถานประกอบการ (Edit Store Form) */}
      {isEditStoreModalOpen && selectedEst && (
        <div
          className="store-action-sheet-backdrop"
          onClick={e => {
            if (e.target === e.currentTarget) setIsEditStoreModalOpen(false)
          }}
        >
          <div className="store-action-sheet" role="dialog" aria-modal="true" style={{ maxHeight: '92vh' }}>
            {/* Grabber handle */}
            <div className="quick-inspect-handle-bar" onClick={() => setIsEditStoreModalOpen(false)}>
              <div className="quick-inspect-handle-pill" />
            </div>

            {/* Header */}
            <div className="quick-inspect-header">
              <div>
                <div className="quick-inspect-badge" style={{ background: '#fef3c7', borderColor: '#fde68a', color: '#b45309' }}>
                  <FileCheck2 size={13} color="#b45309" />
                  <span>แก้ไขข้อมูลสถานประกอบการ</span>
                </div>
                <h3 className="quick-inspect-title" style={{ fontSize: '16px' }}>{selectedEst.name}</h3>
                <p className="quick-inspect-subtitle">
                  เลขทะเบียน: {selectedEst.permitNo}
                </p>
              </div>
              <button
                type="button"
                className="quick-inspect-close-btn"
                onClick={() => setIsEditStoreModalOpen(false)}
                title="ปิดหน้าต่าง"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Fields (Scrollable) */}
            <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* ชื่อร้าน */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  ชื่อสถานประกอบการ <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={editStoreName}
                  onChange={e => setEditStoreName(e.target.value)}
                  className="gov-input-box"
                  placeholder="เช่น ร้านลาบป่าซาง, ปั๊มน้ำมันหยอดเหรียญ"
                />
              </div>

              {/* ประเภทกิจการ */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  ประเภทกิจการ
                </label>
                <input
                  type="text"
                  value={editStoreType}
                  onChange={e => setEditStoreType(e.target.value)}
                  className="gov-input-box"
                  placeholder="เช่น สถานที่จำหน่ายอาหาร, กิจการที่เป็นอันตรายต่อสุขภาพ"
                />
              </div>

              {/* หมวดหมู่ทางกฎหมาย */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  หมวดหมู่กฎหมาย พ.ร.บ.สาธารณสุข
                </label>
                <select
                  value={editStoreCategory}
                  onChange={e => setEditStoreCategory(e.target.value as any)}
                  className="gov-input-box"
                >
                  <option value="food_notice">สถานที่จำหน่ายอาหาร (นจ.๓ - ไม่เกิน ๒๐๐ ตร.ม.)</option>
                  <option value="food_license">สถานที่จำหน่ายอาหาร (บทอ.๒ - เกิน ๒๐๐ ตร.ม.)</option>
                  <option value="food_storage">สถานที่สะสมอาหาร (นจ.๔ / บทส.๒)</option>
                  <option value="hazardous">กิจการที่เป็นอันตรายต่อสุขภาพ (บท.๓)</option>
                </select>
              </div>

              {/* เจ้าของ & เบอร์โทร (2 Cols) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    ชื่อผู้ประกอบการ / เจ้าของ
                  </label>
                  <input
                    type="text"
                    value={editStoreOwner}
                    onChange={e => setEditStoreOwner(e.target.value)}
                    className="gov-input-box"
                    placeholder="นาย/นาง/นางสาว..."
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    value={editStorePhone}
                    onChange={e => setEditStorePhone(e.target.value)}
                    className="gov-input-box"
                    placeholder="08X-XXX-XXXX"
                  />
                </div>
              </div>

              {/* ที่อยู่ & หมู่บ้าน */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  ที่อยู่ / เลขที่
                </label>
                <input
                  type="text"
                  value={editStoreAddress}
                  onChange={e => setEditStoreAddress(e.target.value)}
                  className="gov-input-box"
                  placeholder="เช่น 214 หมู่ที่ 7 ต.โป่งน้ำร้อน"
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  หมู่บ้านในเขต อบต.โป่งน้ำร้อน
                </label>
                <select
                  value={editStoreVillage}
                  onChange={e => setEditStoreVillage(e.target.value)}
                  className="gov-input-box"
                >
                  {VILLAGES.filter(v => v !== 'ทั้งหมด').map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {/* พิกัด GPS & ปุ่มจับพิกัด */}
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>พิกัดดาวเทียม GIS (GPS)</span>
                  <button
                    type="button"
                    onClick={handleCaptureEditGps}
                    disabled={isCapturingEditGps}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '8px',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <LocateFixed size={12} className={isCapturingEditGps ? 'animate-spin' : ''} />
                    <span>{isCapturingEditGps ? 'กำลังระบุ...' : '📍 ดึงพิกัดปัจจุบัน'}</span>
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    value={editStoreLat}
                    onChange={e => setEditStoreLat(e.target.value)}
                    className="gov-input-box"
                    placeholder="Latitude"
                  />
                  <input
                    type="text"
                    value={editStoreLng}
                    onChange={e => setEditStoreLng(e.target.value)}
                    className="gov-input-box"
                    placeholder="Longitude"
                  />
                </div>
              </div>

              {/* ขนาดพื้นที่ กว้าง x ยาว & สถานะ */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    กว้าง (ม.)
                  </label>
                  <input
                    type="number"
                    value={editStoreWidthM}
                    onChange={e => setEditStoreWidthM(Number(e.target.value) || 0)}
                    className="gov-input-box"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    ยาว (ม.)
                  </label>
                  <input
                    type="number"
                    value={editStoreLengthM}
                    onChange={e => setEditStoreLengthM(Number(e.target.value) || 0)}
                    className="gov-input-box"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    สถานะใบอนุญาต
                  </label>
                  <select
                    value={editStoreStatus}
                    onChange={e => setEditStoreStatus(e.target.value as 'ปกติ' | 'ใกล้หมดอายุ' | 'หมดอายุ')}
                    className="gov-input-box"
                  >
                    <option value="ปกติ">ปกติ (ใช้งานได้)</option>
                    <option value="ใกล้หมดอายุ">ใกล้หมดอายุ</option>
                    <option value="หมดอายุ">หมดอายุ</option>
                  </select>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'right' }}>
                พื้นที่คำนวณ: <strong style={{ color: '#0f172a' }}>{Math.round(editStoreWidthM * editStoreLengthM * 100) / 100} ตารางเมตร</strong>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px', background: '#ffffff' }}>
              <button
                type="button"
                className="gov-btn-cta secondary"
                style={{ flex: 1 }}
                onClick={() => setIsEditStoreModalOpen(false)}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="gov-btn-cta primary"
                style={{ flex: 2 }}
                onClick={handleSaveStoreEdit}
              >
                <Save size={16} />
                <span>บันทึกการแก้ไข</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 9: แสดง QR Code ประจำร้าน (Store QR Code Modal) */}
      {isStoreQrModalOpen && selectedEst && (
        <div
          className="store-action-sheet-backdrop"
          onClick={e => {
            if (e.target === e.currentTarget) setIsStoreQrModalOpen(false)
          }}
        >
          <div className="store-action-sheet" role="dialog" aria-modal="true" style={{ maxWidth: '420px', borderRadius: '28px' }}>
            <div className="quick-inspect-handle-bar" onClick={() => setIsStoreQrModalOpen(false)}>
              <div className="quick-inspect-handle-pill" />
            </div>

            <div className="quick-inspect-header">
              <div>
                <div className="quick-inspect-badge" style={{ background: '#f5f3ff', borderColor: '#ddd6fe', color: '#7c3aed' }}>
                  <QrCode size={13} color="#7c3aed" />
                  <span>QR Code ประจำร้านค้า</span>
                </div>
                <h3 className="quick-inspect-title" style={{ fontSize: '16px' }}>{selectedEst.name}</h3>
                <p className="quick-inspect-subtitle">
                  เลขทะเบียน: {selectedEst.permitNo}
                </p>
              </div>
              <button
                type="button"
                className="quick-inspect-close-btn"
                onClick={() => setIsStoreQrModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {storeQrDataUrl ? (
                <div style={{
                  padding: '14px',
                  borderRadius: '20px',
                  background: '#ffffff',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.1)',
                  border: '1px solid #e2e8f0',
                  marginBottom: '16px'
                }}>
                  <img
                    src={storeQrDataUrl}
                    alt={`QR Code ${selectedEst.name}`}
                    style={{ width: '220px', height: '220px', display: 'block' }}
                  />
                </div>
              ) : (
                <div style={{ width: '220px', height: '220px', display: 'grid', placeItems: 'center', background: '#f8fafc', borderRadius: '20px', marginBottom: '16px' }}>
                  <QrCode size={48} className="animate-pulse text-slate-300" />
                </div>
              )}

              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
                {selectedEst.name}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '16px' }}>
                {selectedEst.owner} • {selectedEst.village}
              </div>

              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                {storeQrDataUrl && (
                  <a
                    href={storeQrDataUrl}
                    download={`QR_${selectedEst.permitNo || selectedEst.name}.png`}
                    className="gov-btn-cta primary"
                    style={{ flex: 1, textDecoration: 'none' }}
                    onClick={() => notify('ดาวน์โหลดภาพ QR Code เรียบร้อย')}
                  >
                    <Download size={16} />
                    <span>บันทึกภาพ QR</span>
                  </a>
                )}
                <button
                  type="button"
                  className="gov-btn-cta secondary"
                  style={{ flex: 1 }}
                  onClick={() => setIsStoreQrModalOpen(false)}
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

          {/* TOP OFFICIAL APP BAR (2026 LIGHT FROSTED GLASS) */}
          <header className="official-app-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {subScreen !== 'none' || tab === 'profile' ? (
                <button
                  onClick={() => {
                    triggerHaptic(15)
                    if (tab === 'profile') {
                      setTab('home')
                    } else {
                      setSubScreen('none')
                    }
                  }}
                  style={{
                    color: '#0f172a',
                    background: '#f1f5f9',
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.2s'
                  }}
                  aria-label="ย้อนกลับ"
                >
                  <ArrowLeft size={18} />
                </button>
              ) : (
                <button
                  onClick={() => {
                    triggerHaptic(15)
                    setTab('profile')
                  }}
                  style={{
                    color: '#0f172a',
                    background: '#f1f5f9',
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.2s'
                  }}
                >
                  <Menu size={18} />
                </button>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, justifyContent: 'center' }}>
                <h1 className="bar-title" style={{ fontSize: tab === 'home' ? '12px' : '13.5px', lineHeight: 1.25, fontWeight: 800, margin: 0, whiteSpace: 'normal' }}>
                  {subScreen === 'detail'
                    ? 'รายละเอียดสถานประกอบการ'
                    : subScreen === 'prep'
                    ? 'เตรียมเอกสารลงพื้นที่'
                    : subScreen === 'report'
                    ? 'บันทึกผลการตรวจสอบ'
                    : subScreen === 'forms'
                    ? 'แบบฟอร์มราชการ'
                    : subScreen === 'analytics'
                    ? 'รายงานและสถิติ'
                    : subScreen === 'new_store'
                    ? 'ลงทะเบียนร้านค้าใหม่'
                    : tab === 'home'
                    ? 'งานสาธารณสุข องค์การบริหารส่วนตำบลโป่งน้ำร้อน'
                    : tab === 'stores'
                    ? 'ทะเบียนสถานประกอบการ'
                    : tab === 'map'
                    ? 'แผนที่ GIS ภาคสนาม'
                    : tab === 'tasks'
                    ? 'งานลงพื้นที่'
                    : 'โปรไฟล์ / ตั้งค่า'}
                </h1>
                {tab === 'home' && subScreen === 'none' && (
                  <span style={{ fontSize: '9.5px', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                    อบต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* QR Scanner shortcut */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(30)
                  setIsQrScannerOpen(true)
                }}
                style={{
                  color: '#1d4ed8',
                  background: '#eff6ff',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  border: '1px solid #dbeafe',
                  transition: 'all 0.2s'
                }}
                title="สแกน QR Code"
              >
                <QrCode size={17} />
              </button>

              {/* Officer avatar circle */}
              <div
                className="officer-avatar-btn"
                onClick={() => {
                  triggerHaptic(20)
                  setTab('profile')
                  setSubScreen('none')
                }}
                title={currentOfficer.name}
              >
                <img
                  src={currentOfficer.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                  alt={currentOfficer.name}
                />
              </div>
            </div>
          </header>

          {/* =========================================================
              SCROLLABLE MAIN CONTENT (TABS & SUBSCREENS)
              ========================================================= */}
          {tab === 'map' && subScreen === 'none' ? (
            /* SCREEN 5: GIS MAP & MUNICIPAL STATUS OVERVIEW */
            <div className="mobile-app-content" style={{ padding: '12px 14px 115px' }}>
              {/* Search & Category Filter Header */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '9px 14px',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                  border: '1px solid #e2e8f0',
                  gap: '8px'
                }}>
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาสถานที่ / ชื่อร้าน / หมู่บ้าน..."
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '12.5px' }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} style={{ color: '#94a3b8', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Map category filter pills */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                  {(['ทั้งหมด', 'ร้านอาหาร', 'สถานที่สะสมอาหาร', 'กิจการอันตราย'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        triggerHaptic(15)
                        setStoreCategoryFilter(cat)
                      }}
                      style={{
                        padding: '6px 13px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        background: storeCategoryFilter === cat ? '#1d4ed8' : '#ffffff',
                        color: storeCategoryFilter === cat ? '#ffffff' : '#334155',
                        boxShadow: storeCategoryFilter === cat ? '0 2px 8px rgba(29, 78, 216, 0.25)' : '0 1px 3px rgba(0,0,0,0.04)',
                        border: '1px solid ' + (storeCategoryFilter === cat ? '#1d4ed8' : '#e2e8f0'),
                        cursor: 'pointer'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive GIS Map Container */}
              <div style={{
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
                border: '1px solid #cbd5e1',
                marginBottom: '16px',
                position: 'relative'
              }}>
                <LiveFieldMap
                  establishments={filteredEsts}
                  onSelectEst={est => openStoreDetail(est)}
                  onStartInspect={est => startReport(est)}
                  height="360px"
                />
              </div>

              {/* 4 Status / KPI Tiles Directly Underneath the Map */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BarChart3 size={15} style={{ color: '#1d4ed8' }} />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                    สถานะใบอนุญาตในเขต อบต.
                  </span>
                </div>
                {storeStatusFilter !== 'ทั้งหมด' && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(15)
                      setStoreStatusFilter('ทั้งหมด')
                    }}
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#2563eb',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>แสดงทั้งหมด</span>
                    <X size={11} />
                  </button>
                )}
              </div>

              {/* 4 Real Dynamic Municipal Stats Tiles (2x2 Grid) */}
              <div className="metric-stat-grid" style={{ marginBottom: '16px' }}>
                {/* Tile 1: สถานประกอบการในระบบ */}
                <div
                  className={`metric-stat-tile blue cursor-pointer ${storeStatusFilter === 'ทั้งหมด' ? 'is-active-filter' : ''}`}
                  onClick={() => {
                    triggerHaptic(15)
                    setStoreStatusFilter('ทั้งหมด')
                  }}
                  style={{ padding: '12px 14px' }}
                >
                  <div className="tile-header" style={{ marginBottom: '6px' }}>
                    <span className="tile-title" style={{ fontSize: '11px' }}>สถานประกอบการในระบบ</span>
                    <div className="tile-icon" style={{ width: '30px', height: '30px' }}><Store size={15} /></div>
                  </div>
                  <div className="tile-number" style={{ fontSize: '24px' }}>
                    {totalEstCount}<span className="tile-unit">แห่ง</span>
                  </div>
                  <p style={{ fontSize: '9.5px', color: '#64748b', margin: '4px 0 0 0' }}>อบต.โป่งน้ำร้อน</p>
                </div>

                {/* Tile 2: ใบอนุญาตปกติ */}
                <div
                  className={`metric-stat-tile green cursor-pointer ${storeStatusFilter === 'ใช้งานได้' ? 'is-active-filter' : ''}`}
                  onClick={() => {
                    triggerHaptic(15)
                    setStoreStatusFilter('ใช้งานได้')
                  }}
                  style={{ padding: '12px 14px' }}
                >
                  <div className="tile-header" style={{ marginBottom: '6px' }}>
                    <span className="tile-title" style={{ fontSize: '11px' }}>ใบอนุญาตปกติ</span>
                    <div className="tile-icon" style={{ width: '30px', height: '30px' }}><CheckCircle size={15} /></div>
                  </div>
                  <div className="tile-number" style={{ fontSize: '24px' }}>
                    {activeLicenseCount}<span className="tile-unit">แห่ง</span>
                  </div>
                  <p style={{ fontSize: '9.5px', color: '#059669', margin: '4px 0 0 0' }}>สมบูรณ์ / ใช้งานได้</p>
                </div>

                {/* Tile 3: ใกล้หมดอายุ (30 วัน) */}
                <div
                  className={`metric-stat-tile orange cursor-pointer ${storeStatusFilter === 'ใกล้หมดอายุ' ? 'is-active-filter' : ''}`}
                  onClick={() => {
                    triggerHaptic(15)
                    setStoreStatusFilter('ใกล้หมดอายุ')
                  }}
                  style={{ padding: '12px 14px' }}
                >
                  <div className="tile-header" style={{ marginBottom: '6px' }}>
                    <span className="tile-title" style={{ fontSize: '11px' }}>ใกล้หมดอายุ (30 วัน)</span>
                    <div className="tile-icon" style={{ width: '30px', height: '30px' }}><Clock3 size={15} /></div>
                  </div>
                  <div className="tile-number" style={{ fontSize: '24px' }}>
                    {expiringCount}<span className="tile-unit">แห่ง</span>
                  </div>
                  <p style={{ fontSize: '9.5px', color: '#d97706', margin: '4px 0 0 0' }}>ต้องแจ้งเตือนต่ออายุ</p>
                </div>

                {/* Tile 4: หมดอายุแล้ว */}
                <div
                  className={`metric-stat-tile red cursor-pointer ${storeStatusFilter === 'หมดอายุ' ? 'is-active-filter' : ''}`}
                  onClick={() => {
                    triggerHaptic(15)
                    setStoreStatusFilter('หมดอายุ')
                  }}
                  style={{ padding: '12px 14px' }}
                >
                  <div className="tile-header" style={{ marginBottom: '6px' }}>
                    <span className="tile-title" style={{ fontSize: '11px' }}>หมดอายุแล้ว</span>
                    <div className="tile-icon" style={{ width: '30px', height: '30px' }}><AlertTriangle size={15} /></div>
                  </div>
                  <div className="tile-number" style={{ fontSize: '24px' }}>
                    {expiredCount}<span className="tile-unit">แห่ง</span>
                  </div>
                  <p style={{ fontSize: '9.5px', color: '#e11d48', margin: '4px 0 0 0' }}>ต้องเข้าตรวจสอบ</p>
                </div>
              </div>

              {/* Stores matching current Map filter */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={15} style={{ color: '#0284c7' }} />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                    ร้านค้าบนแผนที่ ({filteredEsts.length} แห่ง)
                  </span>
                </div>
                {storeStatusFilter !== 'ทั้งหมด' && (
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background: storeStatusFilter === 'ใช้งานได้' ? '#ecfdf5' : storeStatusFilter === 'ใกล้หมดอายุ' ? '#fffbeb' : '#fff1f2',
                    color: storeStatusFilter === 'ใช้งานได้' ? '#059669' : storeStatusFilter === 'ใกล้หมดอายุ' ? '#d97706' : '#e11d48',
                    border: '1px solid ' + (storeStatusFilter === 'ใช้งานได้' ? '#a7f3d0' : storeStatusFilter === 'ใกล้หมดอายุ' ? '#fde68a' : '#fecdd3')
                  }}>
                    ● {storeStatusFilter}
                  </span>
                )}
              </div>

              {/* Store Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredEsts.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '30px 16px',
                    background: '#f8fafc',
                    borderRadius: '16px',
                    border: '1px dashed #cbd5e1'
                  }}>
                    <Store size={32} style={{ color: '#94a3b8', margin: '0 auto 8px', opacity: 0.7 }} />
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      ไม่พบสถานประกอบการในเงื่อนไขนี้
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStoreStatusFilter('ทั้งหมด')
                        setStoreCategoryFilter('ทั้งหมด')
                        setSearchQuery('')
                      }}
                      style={{
                        marginTop: '8px',
                        padding: '6px 14px',
                        borderRadius: '10px',
                        background: '#1d4ed8',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ล้างตัวกรองทั้งหมด
                    </button>
                  </div>
                ) : (
                  filteredEsts.map(est => {
                    const statusClass =
                      est.permitStatus === 'ปกติ' || est.status === 'active'
                        ? 'green'
                        : est.permitStatus === 'ใกล้หมดอายุ' || est.status === 'expiring'
                        ? 'amber'
                        : 'red'
                    const statusText =
                      est.permitStatus === 'ปกติ' || est.status === 'active'
                        ? 'ปกติ'
                        : est.permitStatus === 'ใกล้หมดอายุ' || est.status === 'expiring'
                        ? 'ใกล้หมดอายุ'
                        : 'หมดอายุ'

                    return (
                      <div
                        key={est.id}
                        className="mobile-card-item cursor-pointer"
                        onClick={() => openStoreDetail(est)}
                      >
                        <div className="card-top-row">
                          <div>
                            <div className="card-store-title">{est.name}</div>
                            <div className="card-subtitle">{est.owner || est.type} • {est.permitNo}</div>
                          </div>
                          <span className={`tag-badge ${statusClass}`}>
                            {statusText}
                          </span>
                        </div>

                        <div className="card-location-row">
                          <MapPin size={12} className="text-slate-400" />
                          <span>{est.address} ({est.village})</span>
                        </div>

                        <div className="card-tags-row">
                          <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                            {est.areaSqm ? `${est.areaSqm} ตร.ม.` : est.type}
                          </span>
                          <div className="card-action-btns" onClick={e => e.stopPropagation()}>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${est.lat || 19.9288},${est.lng || 99.1685}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-pill-action"
                              title="นำทาง Google Maps"
                              style={{ textDecoration: 'none', color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe' }}
                            >
                              <Navigation size={12} />
                              <span>นำทาง</span>
                            </a>
                            <button
                              type="button"
                              className="btn-pill-action"
                              onClick={() => startReport(est)}
                              style={{ background: '#1d4ed8', color: '#ffffff', border: 'none' }}
                            >
                              <ClipboardCheck size={12} />
                              <span>ตรวจ</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="mobile-app-content">

              {/* =======================================================
                  SCREEN 2: หน้าหลัก (HOME DASHBOARD)
                  ======================================================= */}
              {tab === 'home' && subScreen === 'none' && (
                <div>
                  {/* Officer Greeting Strip */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '18px',
                    padding: '12px 14px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ position: 'relative' }}>
                        <img
                          src={currentOfficer.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                          alt={currentOfficer.name}
                          style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #3b82f6' }}
                        />
                        <span style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: '#10b981',
                          border: '2px solid #ffffff'
                        }} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <h2 style={{ fontSize: '13.5px', fontWeight: 800, margin: 0, color: '#0f172a' }}>{currentOfficer.name}</h2>
                          <span style={{ fontSize: '9.5px', background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: '8px', fontWeight: 700 }}>ออนไลน์</span>
                        </div>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>
                          {currentOfficer.position} อบต.โป่งน้ำร้อน
                        </p>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '2px'
                    }}>
                      <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '8px' }}>
                        🟢 พร้อมปฏิบัติงาน
                      </span>
                      <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                        {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>

                  {/* Primary Action Card: ลงทะเบียนสถานประกอบการใหม่ */}
                  <div
                    onClick={() => {
                      triggerHaptic(25)
                      setWizardStep(1)
                      setSubScreen('new_store')
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#ffffff',
                      borderRadius: '20px',
                      padding: '16px',
                      marginBottom: '12px',
                      boxShadow: '0 8px 24px -4px rgba(5, 150, 105, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      right: '-15px',
                      bottom: '-15px',
                      width: '90px',
                      height: '90px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      pointerEvents: 'none'
                    }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '14px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(8px)',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                      }}>
                        <Store size={22} color="#ffffff" />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                            ลงทะเบียนร้านค้าใหม่หน้างาน
                          </h3>
                          <span style={{ fontSize: '9px', background: '#34d399', color: '#064e3b', padding: '2px 6px', borderRadius: '8px', fontWeight: 800 }}>
                            ลงทะเบียนทันที
                          </span>
                        </div>
                        <p style={{ fontSize: '11px', color: '#d1fae5', margin: '3px 0 0 0', lineHeight: 1.35 }}>
                          บันทึกผู้ประกอบการ, วาดผัง ตร.ม., ปัก GPS ในเขต อบต.
                        </p>
                      </div>
                    </div>

                    <div style={{
                      background: '#ffffff',
                      color: '#047857',
                      padding: '8px 12px',
                      borderRadius: '14px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      flexShrink: 0,
                      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.12)',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      <PlusCircle size={14} />
                      <span>เพิ่มร้าน</span>
                    </div>
                  </div>

                  {/* Secondary Action Card: ตรวจสุขลักษณะหน้างาน (๑๐๐ คะแนน) */}
                  <div style={{
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)',
                    color: '#ffffff',
                    borderRadius: '20px',
                    padding: '16px',
                    marginBottom: '14px',
                    boxShadow: '0 8px 24px -4px rgba(29, 78, 216, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.18)',
                          backdropFilter: 'blur(6px)',
                          display: 'grid',
                          placeItems: 'center'
                        }}>
                          <Zap size={20} color="#fde047" />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                            ตรวจสุขลักษณะหน้างาน (๑๐๐ คะแนน)
                          </h3>
                          <p style={{ fontSize: '11px', color: '#bfdbfe', margin: '2px 0 0 0' }}>
                            แบบฟอร์มทางการ บท.๑, บท.๒, บท.๓
                          </p>
                        </div>
                      </div>
                      <span style={{
                        fontSize: '9.5px',
                        background: '#10b981',
                        color: '#ffffff',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: 800
                      }}>
                        ตรวจสนาม
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(30)
                        setIsQuickInspectModalOpen(true)
                      }}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '13px',
                        background: '#ffffff',
                        color: '#1e40af',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                        marginBottom: '10px'
                      }}
                    >
                      <ClipboardCheck size={16} color="#2563eb" />
                      <span>เลือกร้านค้าและเริ่มตรวจทันที</span>
                      <ArrowRight size={14} />
                    </button>

                    {/* Quick Action Shortcut Pills */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(20)
                          setIsQrScannerOpen(true)
                        }}
                        style={{
                          padding: '7px 4px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.14)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          color: '#ffffff',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <QrCode size={13} color="#93c5fd" />
                        <span>สแกน QR ร้าน</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(20)
                          setTab('map')
                          setSubScreen('none')
                        }}
                        style={{
                          padding: '7px 4px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.14)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          color: '#ffffff',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <MapPin size={13} color="#93c5fd" />
                        <span>แผนที่รอบตัว</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(20)
                          setSubScreen('forms')
                        }}
                        style={{
                          padding: '7px 4px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.14)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          color: '#ffffff',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <FileText size={13} color="#93c5fd" />
                        <span>คลังแบบตรวจ</span>
                      </button>
                    </div>
                  </div>

                  {/* Real Registered Establishment Section */}
                  <div style={{ marginBottom: '14px' }}>
                    <div className="section-header-row" style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Store size={15} color="#2563eb" />
                        <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          สถานประกอบการในระบบจริง ({establishments.length} แห่ง)
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          triggerHaptic(15)
                          setTab('stores')
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          fontSize: '11px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          cursor: 'pointer'
                        }}
                      >
                        <span>ดูทั้งหมด</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>

                    {establishments.length > 0 ? (
                      <div style={{
                        background: '#ffffff',
                        borderRadius: '18px',
                        padding: '14px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
                        position: 'relative'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <span style={{
                                fontSize: '10px',
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                padding: '2px 8px',
                                borderRadius: '8px',
                                fontWeight: 800,
                                border: '1px solid #bfdbfe'
                              }}>
                                {establishments[0].permitNo || 'บทส-69-0044'}
                              </span>
                              <span style={{
                                fontSize: '10px',
                                background: establishments[0].permitStatus === 'ปกติ' ? '#ecfdf5' : '#fffbeb',
                                color: establishments[0].permitStatus === 'ปกติ' ? '#047857' : '#b45309',
                                padding: '2px 8px',
                                borderRadius: '8px',
                                fontWeight: 800
                              }}>
                                ● {establishments[0].permitStatus || 'ปกติ'}
                              </span>
                            </div>

                            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                              {establishments[0].name}
                            </h4>

                            <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={12} color="#94a3b8" />
                              <span>{establishments[0].address || 'ม.1 ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่'}</span>
                            </p>

                            <p style={{ fontSize: '10.5px', color: '#0284c7', margin: 0, fontWeight: 600 }}>
                              {establishments[0].type || 'กิจการที่เป็นอันตรายต่อสุขภาพ'} • {establishments[0].areaSqm || 145} ตร.ม.
                            </p>
                          </div>
                        </div>

                        {/* Quick Store Actions */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '8px',
                          marginTop: '12px',
                          paddingTop: '10px',
                          borderTop: '1px solid #f1f5f9'
                        }}>
                          <button
                            type="button"
                            onClick={() => startReport(establishments[0])}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '10px',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              fontSize: '11px',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            <Zap size={13} color="#2563eb" />
                            <span>เริ่มตรวจสุขลักษณะ</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openStoreDetail(establishments[0])}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '10px',
                              background: '#f8fafc',
                              color: '#334155',
                              border: '1px solid #e2e8f0',
                              fontSize: '11px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            <FileText size={13} color="#64748b" />
                            <span>ดูประวัติ / เอกสาร</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        background: '#f8fafc',
                        borderRadius: '16px',
                        padding: '16px',
                        textAlign: 'center',
                        border: '1px dashed #cbd5e1'
                      }}>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
                          ยังไม่มีสถานประกอบการในระบบ
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setWizardStep(1)
                            setSubScreen('new_store')
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '10px',
                            background: '#059669',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          + ลงทะเบียนร้านแรก
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Section: สถานะงานและเอกสารลงพื้นที่ */}
                  <div className="section-header-row" style={{ marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      สถานะงานและเอกสารลงพื้นที่
                    </h3>
                    <button
                      onClick={() => setTab('tasks')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        cursor: 'pointer'
                      }}
                    >
                      <span>ดูทั้งหมด</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>

                  <div className="queue-action-card">
                    {/* Item 1: เตรียมเอกสารลงพื้นที่ */}
                    <div
                      className="queue-action-item"
                      onClick={() => openFieldPrep()}
                    >
                      <div className="queue-item-left">
                        <div className="queue-item-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                          <FileCheck2 size={18} />
                        </div>
                        <div className="queue-item-text">
                          <h4 style={{ fontSize: '12.5px', fontWeight: 700 }}>เตรียมเอกสารลงพื้นที่</h4>
                          <p style={{ fontSize: '10.5px' }}>จัดเตรียมแบบฟอร์ม บท.๑ - บท.๓ ให้พร้อมลงตรวจ</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="queue-item-badge" style={{ background: '#dcfce7', color: '#15803d' }}>
                          พร้อมใช้งาน
                        </span>
                        <ChevronRight size={15} color="#94a3b8" />
                      </div>
                    </div>

                    {/* Item 2: รายการงานลงพื้นที่ (Dynamic count) */}
                    <div
                      className="queue-action-item"
                      onClick={() => {
                        triggerHaptic(20)
                        setTab('tasks')
                        setTaskFilter('pending')
                      }}
                    >
                      <div className="queue-item-left">
                        <div className="queue-item-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                          <ClipboardCheck size={18} />
                        </div>
                        <div className="queue-item-text">
                          <h4 style={{ fontSize: '12.5px', fontWeight: 700 }}>งานตรวจสุขลักษณะที่รอดำเนินการ</h4>
                          <p style={{ fontSize: '10.5px' }}>บันทึกผลการตรวจสุขลักษณะสถานที่และรูปถ่าย</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          className="queue-item-badge"
                          style={{
                            background: pendingTasksCount > 0 ? '#fef3c7' : '#f1f5f9',
                            color: pendingTasksCount > 0 ? '#b45309' : '#64748b'
                          }}
                        >
                          {pendingTasksCount} รายการ
                        </span>
                        <ChevronRight size={15} color="#94a3b8" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =======================================================
                  SCREEN 3: ทะเบียนสถานประกอบการ (STORES DIRECTORY)
                  ======================================================= */}
              {tab === 'stores' && subScreen === 'none' && (
                <div>
                  {/* Top Header & Store Registration Button */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px'
                  }}>
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        รายการสถานประกอบการ ({filteredEsts.length})
                      </h3>
                      <p style={{ fontSize: '10.5px', color: '#64748b', margin: '2px 0 0 0' }}>ฐานข้อมูล อบต.โป่งน้ำร้อน (อัปเดตเรียลไทม์)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(20)
                        setWizardStep(1)
                        setSubScreen('new_store')
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '22px',
                        padding: '7px 16px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)',
                        cursor: 'pointer'
                      }}
                    >
                      <PlusCircle size={14} />
                      <span>ลงทะเบียนร้านใหม่</span>
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#ffffff',
                    borderRadius: '18px',
                    padding: '11px 16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                    marginBottom: '10px',
                    gap: '8px'
                  }}>
                    <Search size={16} className="text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="ค้นหาร้านค้า ชื่อร้านค้าหรือเลขที่ใบอนุญาต"
                      style={{ border: 'none', outline: 'none', width: '100%', fontSize: '12px' }}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} style={{ color: '#94a3b8' }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Category Filter Pills (ทั้งหมด | ร้านอาหาร | สถานที่สะสมอาหาร) */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '2px' }}>
                    <button
                      onClick={() => setStoreCategoryFilter('ทั้งหมด')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        background: storeCategoryFilter === 'ทั้งหมด' ? '#1d4ed8' : '#ffffff',
                        color: storeCategoryFilter === 'ทั้งหมด' ? '#ffffff' : '#475569',
                        border: '1px solid ' + (storeCategoryFilter === 'ทั้งหมด' ? '#1d4ed8' : '#e2e8f0'),
                        boxShadow: storeCategoryFilter === 'ทั้งหมด' ? '0 2px 8px rgba(29, 78, 216, 0.25)' : 'none'
                      }}
                    >
                      ทั้งหมด
                    </button>
                    <button
                      onClick={() => setStoreCategoryFilter('ร้านอาหาร')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        background: storeCategoryFilter === 'ร้านอาหาร' ? '#1d4ed8' : '#ffffff',
                        color: storeCategoryFilter === 'ร้านอาหาร' ? '#ffffff' : '#475569',
                        border: '1px solid ' + (storeCategoryFilter === 'ร้านอาหาร' ? '#1d4ed8' : '#e2e8f0'),
                        boxShadow: storeCategoryFilter === 'ร้านอาหาร' ? '0 2px 8px rgba(29, 78, 216, 0.25)' : 'none'
                      }}
                    >
                      ร้านอาหาร
                    </button>
                    <button
                      onClick={() => setStoreCategoryFilter('สถานที่สะสมอาหาร')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        background: storeCategoryFilter === 'สถานที่สะสมอาหาร' ? '#1d4ed8' : '#ffffff',
                        color: storeCategoryFilter === 'สถานที่สะสมอาหาร' ? '#ffffff' : '#475569',
                        border: '1px solid ' + (storeCategoryFilter === 'สถานที่สะสมอาหาร' ? '#1d4ed8' : '#e2e8f0'),
                        boxShadow: storeCategoryFilter === 'สถานที่สะสมอาหาร' ? '0 2px 8px rgba(29, 78, 216, 0.25)' : 'none',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      สถานที่สะสมอาหาร
                    </button>
                    <button
                      onClick={() => setStoreCategoryFilter('กิจการอันตราย')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        background: storeCategoryFilter === 'กิจการอันตราย' ? '#1d4ed8' : '#ffffff',
                        color: storeCategoryFilter === 'กิจการอันตราย' ? '#ffffff' : '#475569',
                        border: '1px solid ' + (storeCategoryFilter === 'กิจการอันตราย' ? '#1d4ed8' : '#e2e8f0'),
                        boxShadow: storeCategoryFilter === 'กิจการอันตราย' ? '0 2px 8px rgba(29, 78, 216, 0.25)' : 'none',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      กิจการที่เป็นอันตรายต่อสุขภาพ
                    </button>
                  </div>

                  {/* Secondary Dropdown Filters Row */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                    <select
                      value={storeStatusFilter}
                      onChange={e => setStoreStatusFilter(e.target.value as any)}
                      style={{
                        flex: 1,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '6px 10px',
                        fontSize: '11px',
                        color: '#334155'
                      }}
                    >
                      <option value="ทั้งหมด">สถานะใบอนุญาต: ทั้งหมด</option>
                      <option value="ใช้งานได้">ใช้งานได้</option>
                      <option value="ใกล้หมดอายุ">ใกล้หมดอายุ</option>
                      <option value="หมดอายุ">หมดอายุ</option>
                    </select>

                    <select
                      value={villageFilter}
                      onChange={e => setVillageFilter(e.target.value)}
                      style={{
                        flex: 1,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '6px 10px',
                        fontSize: '11px',
                        color: '#334155'
                      }}
                    >
                      <option value="ทั้งหมด">อำเภอ/ตำบล/หมู่บ้าน</option>
                      {VILLAGES.slice(1).map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>

                  {/* Establishment List Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '80px' }}>
                    {filteredEsts.map(est => (
                      <div
                        key={est.id}
                        className="cursor-pointer"
                        onClick={() => openStoreDetail(est)}
                        style={{
                          background: '#ffffff',
                          borderRadius: '16px',
                          padding: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'transform 0.15s'
                        }}
                      >
                        {/* Store thumbnail */}
                        <div style={{
                          width: '68px',
                          height: '68px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          background: '#f1f5f9',
                          flexShrink: 0
                        }}>
                          <img
                            src={est.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80'}
                            alt={est.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>

                        {/* Store Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {est.name}
                            </h3>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{
                              fontSize: '10px',
                              color: (est.category === 'hazardous' || est.type.includes('ปิโตรเลียม') || est.type.includes('อันตราย') || est.type.includes('หยอดเหรียญ')) ? '#7c3aed' : '#2563eb',
                              background: (est.category === 'hazardous' || est.type.includes('ปิโตรเลียม') || est.type.includes('อันตราย') || est.type.includes('หยอดเหรียญ')) ? '#f5f3ff' : '#eff6ff',
                              padding: '1px 6px',
                              borderRadius: '6px',
                              fontWeight: 600
                            }}>
                              {est.category === 'hazardous' || est.type.includes('ปิโตรเลียม') || est.type.includes('อันตราย') || est.type.includes('หยอดเหรียญ')
                                ? 'กิจการที่เป็นอันตรายต่อสุขภาพ'
                                : est.category === 'food_storage' || est.type.includes('สะสมอาหาร')
                                ? 'สถานที่สะสมอาหาร'
                                : 'สถานที่จำหน่ายอาหาร'}
                            </span>
                            <span style={{
                              fontSize: '10px',
                              padding: '1px 7px',
                              borderRadius: '10px',
                              fontWeight: 600,
                              background: est.permitStatus === 'ปกติ' ? '#ecfdf5' : est.permitStatus === 'ใกล้หมดอายุ' ? '#fffbeb' : '#fef2f2',
                              color: est.permitStatus === 'ปกติ' ? '#059669' : est.permitStatus === 'ใกล้หมดอายุ' ? '#b45309' : '#b91c1c'
                            }}>
                              {est.permitStatus === 'ปกติ' ? 'ใช้งานได้' : est.permitStatus}
                            </span>
                          </div>

                          <p style={{ fontSize: '10.5px', color: '#64748b' }}>
                            {est.permitNo}
                          </p>
                          <p style={{ fontSize: '10px', color: '#94a3b8' }}>
                            หมดอายุ {est.expiry}
                          </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              triggerHaptic(30)
                              startReport(est)
                            }}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '11px',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(29, 78, 216, 0.25)'
                            }}
                            title="เริ่มตรวจสุขลักษณะร้านนี้ทันที"
                          >
                            <Zap size={12} color="#fde047" />
                            <span>เริ่มตรวจ</span>
                          </button>
                          <ChevronRight size={15} color="#cbd5e1" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Floating Toggle: [ รายการ | แผนที่ ] */}
                  <div className="floating-segmented-pill">
                    <button className="active">
                      <ListTodo size={14} />
                      <span>รายการ</span>
                    </button>
                    <button onClick={() => setTab('map')}>
                      <Map size={14} />
                      <span>แผนที่</span>
                    </button>
                  </div>

                  {/* Floating Action Button (+) */}
                  <button
                    type="button"
                    className="mobile-fab-btn"
                    onClick={() => {
                      triggerHaptic(30)
                      setSubScreen('new_store')
                    }}
                    title="ลงทะเบียนร้านค้าใหม่"
                  >
                    <Plus size={24} />
                  </button>
                </div>
              )}

              {/* =======================================================
                  SCREEN 4: รายละเอียดสถานประกอบการ (STORE DETAIL)
                  ======================================================= */}
              {subScreen === 'detail' && selectedEst && (
                <div style={{ margin: '-14px -14px 0', paddingBottom: '70px' }}>
                  {/* Hero Photo Banner */}
                  <div className="store-hero-banner" style={{ position: 'relative' }}>
                    <img
                      src={selectedEst.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'}
                      alt={selectedEst.name}
                      style={{ cursor: 'pointer' }}
                      onClick={() => selectedEst.image && setPreviewImageUrl(selectedEst.image)}
                    />
                    <div className="store-hero-overlay" />

                    {/* Camera / Upload Store Photo Action */}
                    <label
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(8px)',
                        color: '#ffffff',
                        borderRadius: '24px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        zIndex: 4
                      }}
                      title="กดเพื่อถ่ายรูปหน้าร้านใหม่ หรือเลือกรูปภาพจากเครื่อง"
                    >
                      <Camera size={14} color="#60a5fa" />
                      <span>เปลี่ยน/ถ่ายภาพหน้าร้าน</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={e => handleStoreImageFileChange(e, selectedEst.id)}
                      />
                    </label>
                  </div>

                  {/* Store Detail Header Card */}
                  <div className="store-detail-header-card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div>
                        <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                          {selectedEst.name}
                        </h2>
                        <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>
                          {selectedEst.type}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '10.5px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: 700,
                        background: selectedEst.permitStatus === 'ปกติ' ? '#ecfdf5' : '#fffbeb',
                        color: selectedEst.permitStatus === 'ปกติ' ? '#059669' : '#b45309'
                      }}>
                        {selectedEst.permitStatus === 'ปกติ' ? 'ใช้งานได้' : selectedEst.permitStatus}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px', color: '#475569', marginTop: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={14} className="text-slate-400" />
                        <span>{selectedEst.permitNo}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserRound size={14} className="text-slate-400" />
                        <span>เจ้าของกิจการ: {selectedEst.owner}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={14} className="text-slate-400" />
                        <a href={`tel:${selectedEst.phone}`} style={{ color: '#1769d2', textDecoration: 'none' }}>
                          {selectedEst.phone}
                        </a>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <MapPin size={14} className="text-slate-400 mt-0.5" />
                        <span>{selectedEst.address}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Navigation size={14} className="text-slate-400" />
                        <span>{selectedEst.lat || 19.9123}, {selectedEst.lng || 99.8321}</span>
                      </div>
                    </div>

                    {/* 3 Action Buttons Row: [ ดูแผนที่ ] [ แก้ไข ] [ เพิ่มเติม ] */}
                    <div className="action-buttons-row">
                      <button
                        className="action-pill-btn primary"
                        onClick={() => {
                          setSubScreen('none')
                          setTab('map')
                        }}
                      >
                        <Map size={14} />
                        <span>ดูแผนที่</span>
                      </button>
                      <button
                        className="action-pill-btn"
                        onClick={() => openEditStore(selectedEst)}
                      >
                        <FileCheck2 size={14} />
                        <span>แก้ไข</span>
                      </button>
                      <button
                        className="action-pill-btn"
                        onClick={() => {
                          triggerHaptic(20)
                          setIsMoreActionsModalOpen(true)
                        }}
                      >
                        <Settings size={14} />
                        <span>เพิ่มเติม</span>
                      </button>
                    </div>

                    {/* Sub-tabs: [ ใบอนุญาต ] [ เอกสาร ] [ ประวัติ ] */}
                    <div className="underline-sub-tabs">
                      <button
                        className={`underline-sub-tab ${detailSubTab === 'license' ? 'active' : ''}`}
                        onClick={() => setDetailSubTab('license')}
                      >
                        ใบอนุญาต
                      </button>
                      <button
                        className={`underline-sub-tab ${detailSubTab === 'docs' ? 'active' : ''}`}
                        onClick={() => setDetailSubTab('docs')}
                      >
                        เอกสาร
                      </button>
                      <button
                        className={`underline-sub-tab ${detailSubTab === 'history' ? 'active' : ''}`}
                        onClick={() => setDetailSubTab('history')}
                      >
                        ประวัติ
                      </button>
                    </div>

                    {/* Active Tab Content: ใบอนุญาตล่าสุด */}
                    {detailSubTab === 'license' && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>ใบอนุญาตล่าสุด</h4>
                        </div>
                        <div style={{
                          background: '#f8fafc',
                          borderRadius: '14px',
                          padding: '12px 14px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              display: 'grid',
                              placeItems: 'center'
                            }}>
                              <FileText size={18} />
                            </div>
                            <div>
                              <h5 style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                                {selectedEst.category === 'hazardous' || selectedEst.type.includes('ปิโตรเลียม') || selectedEst.type.includes('อันตราย') || selectedEst.type.includes('หยอดเหรียญ')
                                  ? 'ใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ'
                                  : selectedEst.category === 'food_storage' || selectedEst.type.includes('สะสมอาหาร')
                                  ? 'ใบรับแจ้งสถานที่สะสมอาหาร'
                                  : 'ใบอนุญาตจัดตั้งสถานที่จำหน่ายอาหาร'}
                              </h5>
                              <p style={{ fontSize: '10.5px', color: '#64748b' }}>{selectedEst.permitNo}</p>
                              <p style={{ fontSize: '9.5px', color: '#94a3b8' }}>🕒 หมดอายุ {selectedEst.expiry}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => startReport(selectedEst)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '10px',
                              background: '#1769d2',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 700
                            }}
                          >
                            ตรวจร้าน
                          </button>
                        </div>
                      </div>
                    )}

                    {detailSubTab === 'docs' && (
                      <div style={{ padding: '8px 0', fontSize: '11.5px', color: '#64748b' }}>
                        <p>✓ สำเนาบัตรประชาชนผู้ประกอบการ (ตรวจสอบแล้ว)</p>
                        <p style={{ marginTop: '6px' }}>✓ ทะเบียนบ้านสถานประกอบการ (ตรวจสอบแล้ว)</p>
                        <p style={{ marginTop: '6px' }}>✓ วุฒิบัตรผ่านการอบรมผู้สัมผัสอาหาร (ครบถ้วน)</p>
                      </div>
                    )}

                    {detailSubTab === 'history' && (
                      <div style={{ padding: '8px 0', fontSize: '11px', color: '#64748b' }}>
                        <p>• ๑๒ ม.ค. ๒๕๖๗: ตรวจประเมินสุขลักษณะประจำปี (ผ่านเกณฑ์ ๙๕ คะแนน)</p>
                        <p style={{ marginTop: '4px' }}>• ๑๐ ม.ค. ๒๕๖๖: ออกใบอนุญาตจัดตั้งสถานที่จำหน่ายอาหาร</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* =======================================================
                  SCREEN 6: งานลงพื้นที่ (FIELD TASKS LIST)
                  ======================================================= */}
              {tab === 'tasks' && subScreen === 'none' && (
                <div>
                  {/* Segmented Tab Filter: [ งานทั้งหมด ] [ รอดำเนินการ ] [ กำลังดำเนินการ ] */}
                  <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '12px' }}>
                    <button
                      className={`underline-sub-tab ${taskFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setTaskFilter('all')}
                    >
                      งานทั้งหมด
                    </button>
                    <button
                      className={`underline-sub-tab ${taskFilter === 'pending' ? 'active' : ''}`}
                      onClick={() => setTaskFilter('pending')}
                    >
                      รอดำเนินการ
                    </button>
                    <button
                      className={`underline-sub-tab ${taskFilter === 'progress' ? 'active' : ''}`}
                      onClick={() => setTaskFilter('progress')}
                    >
                      กำลังดำเนินการ
                    </button>
                  </div>

                  {/* Search input: ค้นหาร้านค้า / เลขที่งาน */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                    marginBottom: '14px',
                    gap: '8px'
                  }}>
                    <Search size={16} className="text-slate-400" />
                    <input
                      type="text"
                      placeholder="ค้นหาร้านค้า / เลขที่งาน"
                      style={{ border: 'none', outline: 'none', width: '100%', fontSize: '12px' }}
                    />
                  </div>

                  {/* Task Cards List (Matching Screen 6) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '70px' }}>
                    {filteredTasks.map(task => {
                      const est = establishments.find(e => e.id === task.establishmentId) || establishments[0]
                      return (
                        <div
                          key={task.id}
                          style={{
                            background: '#ffffff',
                            borderRadius: '16px',
                            padding: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                        >
                          {/* Store thumbnail */}
                          <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            background: '#f1f5f9',
                            flexShrink: 0
                          }}>
                            <img
                              src={est?.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80'}
                              alt={task.establishmentName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>

                          {/* Task details */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {task.establishmentName}
                              </h3>
                              <span style={{
                                fontSize: '9.5px',
                                padding: '1px 6px',
                                borderRadius: '8px',
                                fontWeight: 700,
                                background: est?.permitStatus === 'หมดอายุ' ? '#fef2f2' : est?.permitStatus === 'ใกล้หมดอายุ' ? '#fffbeb' : '#ecfdf5',
                                color: est?.permitStatus === 'หมดอายุ' ? '#b91c1c' : est?.permitStatus === 'ใกล้หมดอายุ' ? '#b45309' : '#047857'
                              }}>
                                {est?.permitStatus === 'ปกติ' ? 'ใช้งานได้' : est?.permitStatus}
                              </span>
                            </div>
                            <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                              {task.due}
                            </p>
                          </div>

                          {/* Status Action Pill Button */}
                          <button
                            type="button"
                            onClick={() => startReport(est, task)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '14px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: task.status === 'รอดำเนินการ' ? '#eff6ff' : task.status === 'นัดหมายแล้ว' ? '#f0fdf4' : '#f8fafc',
                              color: task.status === 'รอดำเนินการ' ? '#1d4ed8' : task.status === 'นัดหมายแล้ว' ? '#15803d' : '#475569',
                              border: '1px solid ' + (task.status === 'รอดำเนินการ' ? '#bfdbfe' : '#bbf7d0'),
                              flexShrink: 0
                            }}
                          >
                            {task.status}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* =======================================================
                  SCREEN 7: เตรียมเอกสารลงพื้นที่ (FIELD PREP WIZARD)
                  ======================================================= */}
              {subScreen === 'prep' && selectedEst && (
                <div style={{ paddingBottom: '70px' }}>
                  {/* 4-Step Stepper */}
                  <div className="prep-wizard-stepper">
                    <div className="prep-step-item done">
                      <div className="prep-step-circle">✓</div>
                      <span className="prep-step-label">เลือกสถานที่</span>
                    </div>
                    <div className="prep-step-item active">
                      <div className="prep-step-circle">2</div>
                      <span className="prep-step-label">เตรียมเอกสาร</span>
                    </div>
                    <div className="prep-step-item">
                      <div className="prep-step-circle">3</div>
                      <span className="prep-step-label">นัดหมาย</span>
                    </div>
                    <div className="prep-step-item">
                      <div className="prep-step-circle">4</div>
                      <span className="prep-step-label">ลงพื้นที่</span>
                    </div>
                  </div>

                  {/* Selected Store Card */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '12px 14px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '14px'
                  }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={selectedEst.image} alt={selectedEst.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{selectedEst.name}</h3>
                      <p style={{ fontSize: '10.5px', color: '#64748b' }}>{selectedEst.permitNo} • {selectedEst.type}</p>
                    </div>
                  </div>

                  {/* Button: สร้างเอกสารให้ครบชุด */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(30)
                      playSuccessChime()
                      setPrepCheckedDocs({ doc1: true, doc2: true, doc3: true, doc4: true })
                      notify('✓ เตรียมชุดเอกสารราชการครบทั้ง ๔ รายการแล้ว')
                    }}
                    style={{
                      width: '100%',
                      background: '#1769d2',
                      color: '#ffffff',
                      padding: '10px',
                      borderRadius: '14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      marginBottom: '16px',
                      boxShadow: '0 4px 12px rgba(23, 105, 210, 0.25)'
                    }}
                  >
                    สร้างเอกสารให้ครบชุด
                  </button>

                  {/* Checklist: เอกสารที่ต้องเตรียม */}
                  <div style={{ marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>เอกสารที่ต้องเตรียม</h4>
                  </div>

                  <div className="prep-checklist-card">
                    <div
                      className="prep-checklist-item"
                      onClick={() => setPrepCheckedDocs(p => ({ ...p, doc1: !p.doc1 }))}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '6px',
                          background: prepCheckedDocs.doc1 ? '#10b981' : '#f1f5f9',
                          color: '#ffffff',
                          display: 'grid',
                          placeItems: 'center'
                        }}>
                          {prepCheckedDocs.doc1 && <Check size={14} />}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>แบบฟอร์มคำขอเอกสาร</span>
                      </div>
                      <ChevronRight size={16} color="#94a3b8" />
                    </div>

                    <div
                      className="prep-checklist-item"
                      onClick={() => setPrepCheckedDocs(p => ({ ...p, doc2: !p.doc2 }))}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '6px',
                          background: prepCheckedDocs.doc2 ? '#10b981' : '#f1f5f9',
                          color: '#ffffff',
                          display: 'grid',
                          placeItems: 'center'
                        }}>
                          {prepCheckedDocs.doc2 && <Check size={14} />}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>แบบฟอร์มรับรองมาตรฐาน (ตามที่กำหนด)</span>
                      </div>
                      <ChevronRight size={16} color="#94a3b8" />
                    </div>

                    <div
                      className="prep-checklist-item"
                      onClick={() => setPrepCheckedDocs(p => ({ ...p, doc3: !p.doc3 }))}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '6px',
                          background: prepCheckedDocs.doc3 ? '#10b981' : '#f1f5f9',
                          color: '#ffffff',
                          display: 'grid',
                          placeItems: 'center'
                        }}>
                          {prepCheckedDocs.doc3 && <Check size={14} />}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>แบบตรวจสอบสถานที่</span>
                      </div>
                      <ChevronRight size={16} color="#94a3b8" />
                    </div>

                    <div
                      className="prep-checklist-item"
                      onClick={() => setPrepCheckedDocs(p => ({ ...p, doc4: !p.doc4 }))}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '6px',
                          background: prepCheckedDocs.doc4 ? '#10b981' : '#f1f5f9',
                          color: '#ffffff',
                          display: 'grid',
                          placeItems: 'center'
                        }}>
                          {prepCheckedDocs.doc4 && <Check size={14} />}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>เอกสารอื่นๆ</span>
                      </div>
                      <ChevronRight size={16} color="#94a3b8" />
                    </div>
                  </div>

                  {/* Sticky Bottom Buttons: [ ยกเลิก ] [ ถัดไป ] */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="button"
                      className="btn-big-cancel"
                      onClick={() => setSubScreen('none')}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      className="btn-big-submit"
                      onClick={() => startReport(selectedEst)}
                    >
                      <span>ถัดไป</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* =======================================================
                  SCREEN 8: บันทึกผลการตรวจสอบ (FIELD INSPECTION REPORT)
                  ======================================================= */}
              {subScreen === 'report' && selectedEst && (
                <div style={{ paddingBottom: '70px' }}>
                  {/* Store Summary Card */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '12px 14px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '14px',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
                  }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={selectedEst.image} alt={selectedEst.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {selectedEst.name}
                        </h3>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: selectedFormDef.id === 'hazardous_health' ? '#f5f3ff' : '#eff6ff',
                          color: selectedFormDef.id === 'hazardous_health' ? '#7c3aed' : '#1d4ed8',
                          flexShrink: 0
                        }}>
                          {selectedFormDef.id === 'hazardous_health' ? 'กิจการอันตราย' : selectedFormDef.id === 'food_storage' ? 'สถานที่สะสมอาหาร' : 'สถานที่จำหน่ายอาหาร'}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {selectedEst.permitNo} • {selectedEst.type}
                      </p>
                    </div>
                  </div>

                  {/* 4-Step Inspection Wizard Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#ffffff',
                    padding: '10px 14px',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                    marginBottom: '10px'
                  }}>
                    {[
                      { step: 1, label: '๑. ตรวจเกณฑ์', icon: ClipboardCheck },
                      { step: 2, label: '๒. รูปถ่าย & GPS', icon: Camera },
                      { step: 3, label: '๓. เจ้าของเซ็น', icon: PenTool },
                      { step: 4, label: '๔. เจ้าหน้าที่เซ็น', icon: ShieldCheck }
                    ].map((s, idx, arr) => {
                      const isActive = inspectWizardStep === s.step
                      const isCompleted = inspectWizardStep > s.step
                      const IconComp = s.icon
                      return (
                        <React.Fragment key={s.step}>
                          <div
                            onClick={() => {
                              if (isCompleted || s.step < inspectWizardStep) {
                                triggerHaptic(20)
                                setInspectWizardStep(s.step as any)
                              }
                            }}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '3px',
                              cursor: (isCompleted || s.step < inspectWizardStep) ? 'pointer' : 'default',
                              opacity: isActive || isCompleted ? 1 : 0.4
                            }}
                          >
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: isActive
                                ? 'linear-gradient(135deg, #1d4ed8, #2563eb)'
                                : isCompleted
                                ? '#059669'
                                : '#f1f5f9',
                              color: isActive || isCompleted ? '#ffffff' : '#64748b',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '11px',
                              fontWeight: 800,
                              boxShadow: isActive ? '0 3px 8px rgba(37, 99, 235, 0.35)' : 'none'
                            }}>
                              {isCompleted ? <Check size={14} /> : <IconComp size={13} />}
                            </div>
                            <span style={{
                              fontSize: '9.5px',
                              fontWeight: isActive ? 800 : 600,
                              color: isActive ? '#1d4ed8' : isCompleted ? '#059669' : '#64748b',
                              whiteSpace: 'nowrap'
                            }}>
                              {s.label}
                            </span>
                          </div>
                          {idx < arr.length - 1 && (
                            <div style={{
                              flex: 1,
                              height: '2px',
                              background: inspectWizardStep > idx + 1 ? '#059669' : '#e2e8f0',
                              margin: '0 4px',
                              marginBottom: '14px'
                            }} />
                          )}
                        </React.Fragment>
                      )
                    })}
                  </div>

                  {/* Form Container (Step-by-Step Flow) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* ==========================================
                        ขั้นตอนที่ ๑: ตรวจเกณฑ์สุขลักษณะ & บันทึกผล
                        ========================================== */}
                    {inspectWizardStep === 1 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {/* แถบเลือกแบบฟอร์มทางการ อบต.โป่งน้ำร้อน */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div>
                          <label style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a' }}>
                            แบบตรวจราชการ อบต.โป่งน้ำร้อน
                          </label>
                          <div style={{ fontSize: '10px', color: '#1d4ed8', fontWeight: 700, marginTop: '1px' }}>
                            {selectedFormDef.id === 'hazardous_health'
                              ? '⚡ แบบ บท.๓: กิจการที่เป็นอันตรายต่อสุขภาพ'
                              : selectedFormDef.id === 'food_storage'
                              ? '⚡ แบบ บท.๒: สถานที่สะสมอาหาร'
                              : '⚡ แบบ บท.๑: สถานที่จำหน่ายอาหาร'}
                          </div>
                        </div>
                        <span style={{ fontSize: '10.5px', color: '#059669', fontWeight: 700, background: '#ecfdf5', padding: '2px 8px', borderRadius: '12px' }}>
                          ผ่าน {totalPassedCount}/{totalCriteriaCount} ({passPercentage}%)
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                        {ALL_OFFICIAL_FORMS.map(f => {
                          const isSelected = selectedFormDef.id === f.id
                          const count = f.categories.reduce((acc, c) => acc + c.items.length, 0)
                          let shortName = 'จำหน่ายอาหาร'
                          if (f.id === 'food_storage') shortName = 'สะสมอาหาร'
                          if (f.id === 'hazardous_health') shortName = 'กิจการอันตราย'

                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => {
                                triggerHaptic(20)
                                setSelectedFormDef(f)
                                const init: Record<string, boolean> = {}
                                f.categories.forEach(c => c.items.forEach(i => { init[i.id] = true }))
                                setCheckedCriteria(init)
                              }}
                              style={{
                                padding: '8px 4px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 700,
                                background: isSelected ? 'linear-gradient(135deg, #1e40af, #2563eb)' : '#ffffff',
                                color: isSelected ? '#ffffff' : '#475569',
                                border: '1px solid ' + (isSelected ? '#1d4ed8' : '#e2e8f0'),
                                boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '2px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              <span>{shortName}</span>
                              <span style={{ fontSize: '9.5px', opacity: isSelected ? 0.9 : 0.6 }}>
                                ({count} ข้อ)
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Official Form Header Badge & Scanned Document Metadata */}
                    <div style={{
                      background: '#ffffff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '16px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.06)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#1e40af', lineHeight: 1.35 }}>
                            {selectedFormDef.title}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                            {selectedFormDef.orgName} {selectedFormDef.districtName} จังหวัดเชียงใหม่
                          </div>
                        </div>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '10px',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          fontSize: '10px',
                          fontWeight: 800,
                          flexShrink: 0
                        }}>
                          {selectedFormDef.id === 'hazardous_health' ? 'แบบ บท.๓' : selectedFormDef.id === 'food_storage' ? 'แบบ บท.๒' : 'แบบ บท.๑'}
                        </span>
                      </div>

                      {/* Official Form Document Metadata Grid matching scanned sheet */}
                      <div style={{
                        background: '#f8fafc',
                        borderRadius: '12px',
                        padding: '10px 12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '11px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '6px 12px'
                      }}>
                        <div style={{ gridColumn: 'span 2' }}>
                          <span style={{ color: '#64748b' }}>ลักษณะของกิจการ: </span>
                          <strong style={{ color: '#0f172a' }}>{selectedEst.type}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>ปีงบประมาณ: </span>
                          <strong style={{ color: '#0f172a' }}>พ.ศ. ๒๕๗๐</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>ประเภทการตรวจ: </span>
                          <strong style={{ color: '#059669' }}>ต่ออายุใบอนุญาต</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>ผู้ประกอบการ: </span>
                          <strong style={{ color: '#0f172a' }}>{selectedEst.owner}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>โทรศัพท์: </span>
                          <strong style={{ color: '#0f172a' }}>{selectedEst.phone || '088-7694944'}</strong>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <span style={{ color: '#64748b' }}>ที่ตั้ง: </span>
                          <strong style={{ color: '#0f172a' }}>{selectedEst.address}</strong>
                        </div>
                      </div>
                    </div>

                      {/* 1-Click Pass All Across Entire Form Shortcut */}
                      <button
                        type="button"
                        onClick={handlePassAllCriteria}
                        style={{
                          width: '100%',
                          padding: '11px 16px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '7px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.28)'
                        }}
                      >
                        <CheckCheck size={16} />
                        <span>✓ บันทึกผ่านเกณฑ์ทั้งหมดในคลิกเดียว ({totalCriteriaCount} ข้อ)</span>
                      </button>

                      {/* Category Stepper & Slider ("เลื่อนๆ ด้านที่ 1 ไป 2 ไป 3") */}
                      {(() => {
                        const currentCats = selectedFormDef.categories
                        const safeCatIndex = Math.min(activeCatIndex, Math.max(0, currentCats.length - 1))
                        const activeCat = currentCats[safeCatIndex] || currentCats[0]
                        const totalCats = currentCats.length
                        const passedInCurrentCat = activeCat.items.filter(i => checkedCriteria[i.id] !== false).length

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Category Stepper Navigation Pills */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#334155' }}>
                                  ขั้นตอนการตรวจ ({safeCatIndex + 1}/{totalCats} ด้าน)
                                </span>
                                <span style={{ fontSize: '10.5px', color: '#1d4ed8', fontWeight: 700 }}>
                                  แตะสลับด้านได้ทันที
                                </span>
                              </div>

                              <div style={{
                                display: 'flex',
                                gap: '6px',
                                overflowX: 'auto',
                                paddingBottom: '4px',
                                scrollbarWidth: 'none'
                              }}>
                                {currentCats.map((cat, idx) => {
                                  const isSelected = idx === safeCatIndex
                                  const catPassed = cat.items.filter(i => checkedCriteria[i.id] !== false).length
                                  const isAllPassed = catPassed === cat.items.length
                                  const isFailed = cat.items.some(i => checkedCriteria[i.id] === false)
                                  const shortCatName = cat.title.includes('สถานที่') ? 'สถานที่' : cat.title.includes('อาหาร') ? 'อาหาร' : cat.title.includes('ภาชนะ') ? 'ภาชนะ' : cat.title.includes('บุคคล') ? 'สุขอนามัย' : cat.title.includes('อาชีว') ? 'ความปลอดภัย' : cat.title.includes('ของเสีย') || cat.title.includes('มลพิษ') ? 'มลพิษ/ของเสีย' : `ด้าน ${idx + 1}`

                                  return (
                                    <button
                                      key={cat.id}
                                      type="button"
                                      onClick={() => {
                                        triggerHaptic(20)
                                        playBeep(840, 0.04)
                                        setActiveCatIndex(idx)
                                      }}
                                      style={{
                                        flexShrink: 0,
                                        padding: '7px 12px',
                                        borderRadius: '12px',
                                        background: isSelected
                                          ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)'
                                          : '#ffffff',
                                        color: isSelected ? '#ffffff' : '#334155',
                                        border: isSelected ? '1px solid #1e40af' : '1px solid #e2e8f0',
                                        boxShadow: isSelected ? '0 3px 10px rgba(29, 78, 216, 0.22)' : 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        transition: 'all 0.2s ease'
                                      }}
                                    >
                                      <span>ด้าน {idx + 1}: {shortCatName}</span>
                                      {isAllPassed ? (
                                        <span style={{
                                          fontSize: '9.5px',
                                          padding: '1px 5px',
                                          borderRadius: '8px',
                                          background: isSelected ? 'rgba(255,255,255,0.25)' : '#ecfdf5',
                                          color: isSelected ? '#ffffff' : '#059669',
                                          fontWeight: 700
                                        }}>
                                          ✓ {catPassed}/{cat.items.length}
                                        </span>
                                      ) : (
                                        <span style={{
                                          fontSize: '9.5px',
                                          padding: '1px 5px',
                                          borderRadius: '8px',
                                          background: isSelected ? 'rgba(255,255,255,0.25)' : (isFailed ? '#fef2f2' : '#f1f5f9'),
                                          color: isSelected ? '#ffffff' : (isFailed ? '#dc2626' : '#64748b'),
                                          fontWeight: 700
                                        }}>
                                          {catPassed}/{cat.items.length}
                                        </span>
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Active Category Inspection Box */}
                            <div
                              style={{
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '18px',
                                overflow: 'hidden',
                                boxShadow: '0 3px 12px rgba(15, 23, 42, 0.04)',
                                transition: 'all 0.25s ease'
                              }}
                            >
                              {/* Category Banner with Quick Pass Action */}
                              <div style={{
                                padding: '12px 14px',
                                background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                                borderBottom: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '10px'
                              }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    color: '#1d4ed8',
                                    background: '#eff6ff',
                                    padding: '2px 7px',
                                    borderRadius: '6px',
                                    marginBottom: '3px'
                                  }}>
                                    <span>ด้านที่ {safeCatIndex + 1} จาก {totalCats}</span>
                                    <span>•</span>
                                    <span>{passedInCurrentCat}/{activeCat.items.length} ข้อผ่าน</span>
                                  </div>
                                  <h4 style={{
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    color: '#0f172a',
                                    margin: 0,
                                    lineHeight: 1.35
                                  }}>
                                    {activeCat.title}
                                  </h4>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    triggerHaptic(30)
                                    playSuccessChime()
                                    setCheckedCriteria(prev => {
                                      const next = { ...prev }
                                      activeCat.items.forEach(i => { next[i.id] = true })
                                      return next
                                    })
                                    notify(`✓ ด้านที่ ${safeCatIndex + 1}: บันทึกผ่านทั้งหมด`)
                                  }}
                                  style={{
                                    flexShrink: 0,
                                    padding: '6px 11px',
                                    borderRadius: '10px',
                                    background: '#ecfdf5',
                                    border: '1px solid #a7f3d0',
                                    color: '#047857',
                                    fontSize: '10.5px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    boxShadow: '0 1px 2px rgba(4, 120, 87, 0.08)'
                                  }}
                                >
                                  <Check size={12} />
                                  <span>ผ่านทั้งหมดในด้านนี้</span>
                                </button>
                              </div>

                              {/* Criteria Items for Active Category */}
                              <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {activeCat.items.map(item => {
                                  const isPass = checkedCriteria[item.id] !== false
                                  const hasNote = Boolean(criterionNotes[item.id])
                                  return (
                                    <div
                                      key={item.id}
                                      style={{
                                        padding: '10px 4px',
                                        borderBottom: '1px solid #f1f5f9',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px'
                                      }}
                                    >
                                      <div style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        justifyContent: 'space-between',
                                        gap: '10px'
                                      }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                            <span style={{
                                              fontSize: '10px',
                                              fontWeight: 800,
                                              color: '#2563eb',
                                              background: '#eff6ff',
                                              padding: '1px 5px',
                                              borderRadius: '6px',
                                              flexShrink: 0
                                            }}>
                                              {item.code}
                                            </span>
                                            <span style={{ fontSize: '11.5px', color: '#1e293b', lineHeight: 1.4, fontWeight: 500 }}>
                                              {item.label}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Pass / Fail Toggle Buttons */}
                                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              triggerHaptic(15)
                                              setCheckedCriteria(prev => ({ ...prev, [item.id]: true }))
                                            }}
                                            style={{
                                              padding: '5px 10px',
                                              borderRadius: '8px',
                                              fontSize: '10.5px',
                                              fontWeight: 700,
                                              background: isPass ? '#ecfdf5' : '#f8fafc',
                                              color: isPass ? '#059669' : '#94a3b8',
                                              border: '1px solid ' + (isPass ? '#10b981' : '#e2e8f0'),
                                              cursor: 'pointer',
                                              transition: 'all 0.15s'
                                            }}
                                          >
                                            ✓ ผ่าน
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              triggerHaptic(20)
                                              setCheckedCriteria(prev => ({ ...prev, [item.id]: false }))
                                            }}
                                            style={{
                                              padding: '5px 10px',
                                              borderRadius: '8px',
                                              fontSize: '10.5px',
                                              fontWeight: 700,
                                              background: !isPass ? '#fef2f2' : '#f8fafc',
                                              color: !isPass ? '#ef4444' : '#94a3b8',
                                              border: '1px solid ' + (!isPass ? '#f87171' : '#e2e8f0'),
                                              cursor: 'pointer',
                                              transition: 'all 0.15s'
                                            }}
                                          >
                                            ✕ ไม่ผ่าน
                                          </button>
                                        </div>
                                      </div>

                                      {/* Defect note input if marked not passed */}
                                      {(!isPass || hasNote) && (
                                        <div style={{ paddingLeft: '24px', paddingTop: '2px' }}>
                                          <input
                                            type="text"
                                            value={criterionNotes[item.id] || ''}
                                            onChange={e => setCriterionNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                                            placeholder="ระบุข้อบกพร่องที่ต้องแก้ไขสำหรับข้อนี้..."
                                            style={{
                                              width: '100%',
                                              fontSize: '10.5px',
                                              padding: '5px 8px',
                                              borderRadius: '6px',
                                              border: '1px solid #fca5a5',
                                              background: '#fff5f5',
                                              color: '#991b1b',
                                              outline: 'none'
                                            }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>

                              {/* Slider / Stepper Footer Controls ("เลื่อนๆ ด้านที่ 1 ไป 2 ไป 3") */}
                              <div style={{
                                padding: '10px 14px',
                                background: '#f8fafc',
                                borderTop: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px'
                              }}>
                                {safeCatIndex > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      triggerHaptic(20)
                                      playBeep(700, 0.04)
                                      setActiveCatIndex(safeCatIndex - 1)
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      padding: '7px 12px',
                                      borderRadius: '10px',
                                      background: '#ffffff',
                                      border: '1px solid #cbd5e1',
                                      color: '#334155',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <ArrowLeft size={13} />
                                    <span>ด้านที่ {safeCatIndex}</span>
                                  </button>
                                ) : (
                                  <div style={{ width: '70px' }} />
                                )}

                                {/* Progress Dots Indicator */}
                                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                  {currentCats.map((_, dotIdx) => (
                                    <div
                                      key={dotIdx}
                                      onClick={() => {
                                        triggerHaptic(15)
                                        setActiveCatIndex(dotIdx)
                                      }}
                                      style={{
                                        width: dotIdx === safeCatIndex ? '16px' : '6px',
                                        height: '6px',
                                        borderRadius: '3px',
                                        background: dotIdx === safeCatIndex ? '#1d4ed8' : '#cbd5e1',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                    />
                                  ))}
                                </div>

                                {safeCatIndex < totalCats - 1 ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      triggerHaptic(25)
                                      playBeep(880, 0.05)
                                      setActiveCatIndex(safeCatIndex + 1)
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      padding: '7px 14px',
                                      borderRadius: '10px',
                                      background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                                      border: 'none',
                                      color: '#ffffff',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      boxShadow: '0 2px 6px rgba(29, 78, 216, 0.25)'
                                    }}
                                  >
                                    <span>ไปด้านที่ {safeCatIndex + 2}</span>
                                    <ArrowRight size={13} />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      triggerHaptic(35)
                                      playSuccessChime()
                                      notify('✓ ตรวจครบทุกด้านแล้ว โปรดตรวจสอบลายเซ็นและส่งข้อมูล')
                                      const el = document.getElementById('report-conclusions-section')
                                      if (el) el.scrollIntoView({ behavior: 'smooth' })
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      padding: '7px 14px',
                                      borderRadius: '10px',
                                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                      border: 'none',
                                      color: '#ffffff',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                                    }}
                                  >
                                    <span>ครบทุกด้านแล้ว</span>
                                    <Check size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })()}

                      {/* Hazardous Form Specific Conclusions (Matching Pong Nam Ron Official Scan) */}
                      {selectedFormDef.id === 'hazardous_health' && (
                        <div
                          id="report-conclusions-section"
                          style={{
                            background: '#ffffff',
                            border: '1.5px solid #bfdbfe',
                            borderRadius: '16px',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}
                        >
                          <label style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                            สรุปผลการตรวจและคำสั่งของเจ้าพนักงานสาธารณสุข:
                          </label>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11.5px', fontWeight: 600, color: '#047857', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                name="hazardDecision"
                                checked={summaryDecision === 'approve'}
                                onChange={() => {
                                  setSummaryDecision('approve')
                                  setReportOutcome('ผ่าน')
                                }}
                                style={{ marginTop: '2px' }}
                              />
                              <span>เห็นสมควรอนุญาตต่ออายุใบอนุญาตได้ (ผ่านเกณฑ์มาตรฐาน ๑๐๐%)</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11.5px', fontWeight: 600, color: '#b91c1c', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                name="hazardDecision"
                                checked={summaryDecision === 'reject'}
                                onChange={() => {
                                  setSummaryDecision('reject')
                                  setReportOutcome('ผ่านเกณฑ์โดยมีเงื่อนไข')
                                }}
                                style={{ marginTop: '2px' }}
                              />
                              <span>มีคำสั่งให้ปรับปรุงแก้ไขตามเงื่อนไข ให้แล้วเสร็จภายในระยะเวลาที่กำหนด (ไม่เกิน ๓๐ วัน)</span>
                            </label>
                          </div>

                          {summaryDecision === 'reject' && (
                            <div>
                              <label style={{ fontSize: '11px', color: '#b91c1c', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                                ข้อบกพร่องที่ต้องแก้ไข:
                              </label>
                              <textarea
                                rows={2}
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="ระบุข้อบกพร่องที่ต้องแก้ไข เช่น เพิ่มถาดรองรับน้ำมันหยด หรือเปลี่ยนเครื่องดับเพลิง..."
                                className="mobile-textarea"
                              />
                            </div>
                          )}

                          <div>
                            <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                              ข้อเสนอแนะเพิ่มเติม:
                            </label>
                            <textarea
                              rows={2}
                              value={otherNotes}
                              onChange={e => setOtherNotes(e.target.value)}
                              placeholder="ข้อเสนอแนะสำหรับการปฏิบัติงานสุขาภิบาล..."
                              className="mobile-textarea"
                            />
                          </div>
                        </div>
                      )}

                      {/* สรุปผลการตรวจสอบหลัก dropdown & หมายเหตุ */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          ผลการตรวจสอบภาพรวม
                        </label>
                        <select
                          value={reportOutcome}
                          onChange={e => setReportOutcome(e.target.value)}
                          className="mobile-input"
                          style={{ fontWeight: 600 }}
                        >
                          <option value="ผ่าน">ผ่าน (ถูกต้องตามเกณฑ์สุขลักษณะ)</option>
                          <option value="ผ่านเกณฑ์โดยมีเงื่อนไข">ผ่านเกณฑ์โดยมีเงื่อนไข</option>
                          <option value="ไม่ผ่านเกณฑ์ (ต้องปรับปรุง)">ไม่ผ่านเกณฑ์ (ต้องปรับปรุง)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          หมายเหตุเพิ่มเติม
                        </label>
                        <textarea
                          rows={2}
                          value={reportNotes}
                          onChange={e => setReportNotes(e.target.value)}
                          placeholder="สถานที่สะอาด ถูกสุขลักษณะ อุปกรณ์ครบถ้วน..."
                          className="mobile-textarea"
                        />
                      </div>

                      {/* Step 1 Footer Action */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                        <button
                          type="button"
                          className="btn-big-cancel"
                          onClick={() => setSubScreen('none')}
                          style={{ flex: 1 }}
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          className="btn-big-submit"
                          onClick={() => {
                            triggerHaptic(30)
                            playBeep(880, 0.05)
                            setInspectWizardStep(2)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          style={{ flex: 2, background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)' }}
                        >
                          <span>บันทึกผลแล้วไปถ่ายรูป & GPS (ขั้นตอนที่ ๒)</span>
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ==========================================
                      ขั้นตอนที่ ๒: รูปถ่ายหลักฐานหน้างาน & พิกัด GPS
                      ========================================== */}
                  {inspectWizardStep === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Step 2 Banner */}
                      <div style={{
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        border: '1.5px solid #bfdbfe',
                        borderRadius: '16px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '12px',
                          background: '#2563eb',
                          color: '#ffffff',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0
                        }}>
                          <Camera size={20} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e40af' }}>
                            ขั้นตอนที่ ๒: ถ่ายรูปหลักฐานหน้างาน & บันทึก GPS
                          </div>
                          <div style={{ fontSize: '11px', color: '#475569', marginTop: '1px' }}>
                            ถ่ายรูปสภาพแวดล้อม 3 ด้าน พร้อมตรวจเช็กตำแหน่งดาวเทียม อบต.โป่งน้ำร้อน
                          </div>
                        </div>
                      </div>

                      {/* Photo Evidence Section (3 Clear Inspection Slots with Camera Capture) */}
                      <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Camera size={15} color="#2563eb" />
                              <span>รูปถ่ายหลักฐานหน้างาน (๓ ภาพ)</span>
                            </label>
                            <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0 }}>แตะที่กล้องเพื่อถ่ายภาพจากมือถือ หรืออัปโหลดภาพ</p>
                          </div>
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: Object.values(inspectPhotos).filter(Boolean).length >= 3 ? '#059669' : '#d97706',
                            background: Object.values(inspectPhotos).filter(Boolean).length >= 3 ? '#ecfdf5' : '#fffbeb',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            border: '1px solid ' + (Object.values(inspectPhotos).filter(Boolean).length >= 3 ? '#a7f3d0' : '#fde68a')
                          }}>
                            {Object.values(inspectPhotos).filter(Boolean).length}/3 รูป
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                          {[
                            { key: 'p1', label: 'หน้าร้าน / ป้าย', sample: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80' },
                            { key: 'p2', label: 'บริเวณทำงาน / ปรุง', sample: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80' },
                            { key: 'p3', label: 'จุดล้าง / สุขาภิบาล', sample: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80' }
                          ].map(slot => {
                            const currentPhoto = inspectPhotos[slot.key]
                            return (
                              <div
                                key={slot.key}
                                style={{
                                  borderRadius: '12px',
                                  border: currentPhoto ? '1.5px solid #10b981' : '1.5px dashed #94a3b8',
                                  overflow: 'hidden',
                                  background: currentPhoto ? '#ffffff' : '#f8fafc',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  position: 'relative',
                                  boxShadow: currentPhoto ? '0 2px 8px rgba(16, 185, 129, 0.12)' : 'none'
                                }}
                              >
                                {currentPhoto ? (
                                  <div style={{ position: 'relative', height: '94px', width: '100%', background: '#0f172a' }}>
                                    <img
                                      src={currentPhoto}
                                      alt={slot.label}
                                      onClick={() => setPreviewImageUrl(currentPhoto)}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }}
                                    />
                                    {/* Badge Check */}
                                    <div style={{
                                      position: 'absolute',
                                      top: '4px',
                                      left: '4px',
                                      background: 'rgba(16, 185, 129, 0.9)',
                                      color: '#ffffff',
                                      borderRadius: '50%',
                                      width: '18px',
                                      height: '18px',
                                      display: 'grid',
                                      placeItems: 'center',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                    }}>
                                      <Check size={11} strokeWidth={3} />
                                    </div>

                                    {/* Action Buttons: Retake / Delete */}
                                    <div style={{
                                      position: 'absolute',
                                      bottom: '4px',
                                      right: '4px',
                                      display: 'flex',
                                      gap: '4px'
                                    }}>
                                      <label
                                        style={{
                                          background: 'rgba(15, 23, 42, 0.8)',
                                          color: '#ffffff',
                                          borderRadius: '50%',
                                          width: '26px',
                                          height: '26px',
                                          display: 'grid',
                                          placeItems: 'center',
                                          cursor: 'pointer'
                                        }}
                                        title="ถ่ายใหม่"
                                      >
                                        <RefreshCw size={12} />
                                        <input
                                          type="file"
                                          accept="image/*"
                                          capture="environment"
                                          style={{ display: 'none' }}
                                          onChange={e => handleInspectPhotoFileChange(e, slot.key)}
                                        />
                                      </label>
                                      <button
                                        type="button"
                                        onClick={e => handleClearInspectPhotoSlot(slot.key, e)}
                                        style={{
                                          background: 'rgba(239, 68, 68, 0.85)',
                                          color: '#ffffff',
                                          borderRadius: '50%',
                                          width: '26px',
                                          height: '26px',
                                          display: 'grid',
                                          placeItems: 'center',
                                          border: 'none',
                                          cursor: 'pointer'
                                        }}
                                        title="ลบรูป"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <label
                                    style={{
                                      height: '94px',
                                      width: '100%',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '6px',
                                      cursor: 'pointer',
                                      background: '#f1f5f9'
                                    }}
                                  >
                                    <div style={{
                                      width: '34px',
                                      height: '34px',
                                      borderRadius: '50%',
                                      background: '#e0e7ff',
                                      display: 'grid',
                                      placeItems: 'center',
                                      color: '#4338ca'
                                    }}>
                                      <Camera size={18} />
                                    </div>
                                    <span style={{ fontSize: '10px', color: '#475569', fontWeight: 700 }}>แตะถ่ายกล้อง</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      style={{ display: 'none' }}
                                      onChange={e => handleInspectPhotoFileChange(e, slot.key)}
                                    />
                                  </label>
                                )}

                                <div style={{
                                  padding: '5px 4px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  color: '#334155',
                                  textAlign: 'center',
                                  background: '#ffffff',
                                  borderTop: '1px solid #f1f5f9',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {slot.label}
                                </div>

                                {!currentPhoto && (
                                  <button
                                    type="button"
                                    onClick={e => handleUseMockPhotoSlot(slot.key, slot.sample, e)}
                                    style={{
                                      border: 'none',
                                      background: 'transparent',
                                      color: '#64748b',
                                      fontSize: '9px',
                                      padding: '2px 0 4px',
                                      cursor: 'pointer',
                                      textDecoration: 'underline'
                                    }}
                                  >
                                    ใช้ภาพตัวอย่าง
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* GPS Verification Card */}
                      <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: '#fee2e2',
                            display: 'grid',
                            placeItems: 'center',
                            color: '#dc2626',
                            flexShrink: 0
                          }}>
                            <MapPin size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>พิกัดดาวเทียมหน้างาน (GPS)</div>
                            <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                              {reportGps?.lat.toFixed(5) || '19.9288'}, {reportGps?.lng.toFixed(5) || '99.1685'}
                            </div>
                            <div style={{ fontSize: '9.5px', color: '#059669', fontWeight: 600 }}>
                              ✓ พิกัดในเขต อบต.โป่งน้ำร้อน อ.ฝาง
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => captureGps(false)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '10px',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <Navigation size={13} />
                          <span>อัปเดตพิกัด</span>
                        </button>
                      </div>

                      {/* Step 2 Footer Navigation */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                        <button
                          type="button"
                          className="btn-big-cancel"
                          onClick={() => {
                            triggerHaptic(20)
                            setInspectWizardStep(1)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          style={{ flex: 1 }}
                        >
                          <ArrowLeft size={14} />
                          <span>ย้อนกลับ</span>
                        </button>
                        <button
                          type="button"
                          className="btn-big-submit"
                          onClick={() => {
                            triggerHaptic(30)
                            playBeep(880, 0.05)
                            setInspectWizardStep(3)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          style={{ flex: 2, background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
                        >
                          <span>ถัดไป: ให้เจ้าของร้านเซ็น</span>
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ==========================================
                      ขั้นตอนที่ ๓: ให้เจ้าของร้านเซ็นชื่อ (แนวนอน)
                      ========================================== */}
                  {inspectWizardStep === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Step 3 Banner */}
                      <div style={{
                        background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                        border: '1.5px solid #a7f3d0',
                        borderRadius: '16px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '12px',
                          background: '#059669',
                          color: '#ffffff',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0
                        }}>
                          <PenTool size={20} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#047857' }}>
                            ขั้นตอนที่ ๓: ให้เจ้าของร้านลงลายมือชื่อ (แนวนอน)
                          </div>
                          <div style={{ fontSize: '11px', color: '#065f46', marginTop: '1px' }}>
                            ส่งอุปกรณ์ให้เจ้าของร้าน/ผู้แทน ตรวจรับทราบและลงลายมือชื่อ
                          </div>
                        </div>
                      </div>

                      {/* Store Summary Acknowledgment Card for Owner */}
                      <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>สถานประกอบการ:</span>
                          <strong style={{ fontSize: '12px', color: '#0f172a' }}>{selectedEst.name}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>ผู้รับการตรวจ / ผู้แทน:</span>
                          <strong style={{ fontSize: '12px', color: '#0f172a' }}>{selectedEst.owner}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>ผลการตรวจสอบ:</span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: reportOutcome === 'ไม่ผ่านเกณฑ์ (ต้องปรับปรุง)' ? '#dc2626' : '#059669',
                            background: reportOutcome === 'ไม่ผ่านเกณฑ์ (ต้องปรับปรุง)' ? '#fef2f2' : '#ecfdf5',
                            padding: '2px 8px',
                            borderRadius: '8px'
                          }}>
                            {reportOutcome}
                          </span>
                        </div>
                        <div style={{
                          background: '#f8fafc',
                          padding: '8px 10px',
                          borderRadius: '10px',
                          border: '1px dashed #cbd5e1',
                          fontSize: '10.5px',
                          color: '#475569',
                          lineHeight: 1.45,
                          marginTop: '4px'
                        }}>
                          "ข้าพเจ้าได้รับทราบผลการตรวจประเมินสุขลักษณะ และคำแนะนำของเจ้าพนักงานสาธารณสุข อบต.โป่งน้ำร้อน เรียบร้อยแล้ว จึงลงลายมือชื่อไว้เป็นหลักฐาน"
                        </div>
                      </div>

                      {/* Wide Horizontal Touch Signature Pad for Owner */}
                      <SignaturePad
                        role="owner"
                        title="ลายมือชื่อผู้รับการตรวจ (เจ้าของร้าน / ผู้มีอำนาจ)"
                        signerName={selectedEst?.owner || 'ผู้ประกอบการ / ผู้รับมอบอำนาจ'}
                        signerSubtitle={`ผู้ดำเนินกิจการ ${selectedEst?.name || ''}`}
                        initialSignature={ownerSignatureDataUrl}
                        canvasHeight={200}
                        allowLandscapeModal={true}
                        onSave={(url: string) => setOwnerSignatureDataUrl(url)}
                      />

                      {/* Step 3 Footer Navigation */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                        <button
                          type="button"
                          className="btn-big-cancel"
                          onClick={() => {
                            triggerHaptic(20)
                            setInspectWizardStep(2)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          style={{ flex: 1 }}
                        >
                          <ArrowLeft size={14} />
                          <span>ย้อนกลับ</span>
                        </button>
                        <button
                          type="button"
                          className="btn-big-submit"
                          onClick={() => {
                            triggerHaptic(30)
                            playBeep(880, 0.05)
                            setInspectWizardStep(4)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          style={{ flex: 2, background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)' }}
                        >
                          <span>เจ้าของร้านเซ็นเสร็จแล้ว ➔ เจ้าหน้าที่ลงนาม</span>
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ==========================================
                      ขั้นตอนที่ ๔: เจ้าหน้าที่ลงนาม & บันทึกส่งรายงาน
                      ========================================== */}
                  {inspectWizardStep === 4 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Step 4 Banner */}
                      <div style={{
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        border: '1.5px solid #bfdbfe',
                        borderRadius: '16px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '12px',
                          background: '#1d4ed8',
                          color: '#ffffff',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0
                        }}>
                          <ShieldCheck size={20} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e40af' }}>
                            ขั้นตอนที่ ๔: เจ้าหน้าที่สาธารณสุขลงนาม & บันทึกส่งรายงาน
                          </div>
                          <div style={{ fontSize: '11px', color: '#1e3a8a', marginTop: '1px' }}>
                            ตรวจสอบความเรียบร้อยรอบสุดท้ายและลงลายมือชื่อเจ้าหน้าที่ผู้ตรวจ
                          </div>
                        </div>
                      </div>

                      {/* Summary Review Card */}
                      <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
                      }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                          สรุปข้อมูลรายงานการตรวจก่อนส่งระบบ
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '11px' }}>
                          <div>
                            <span style={{ color: '#64748b' }}>แบบฟอร์ม: </span>
                            <strong style={{ color: '#0f172a' }}>{selectedFormDef.title}</strong>
                          </div>
                          <div>
                            <span style={{ color: '#64748b' }}>ผลการตรวจ: </span>
                            <strong style={{
                              color: reportOutcome === 'ไม่ผ่านเกณฑ์ (ต้องปรับปรุง)' ? '#dc2626' : '#059669'
                            }}>
                              {reportOutcome}
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: '#64748b' }}>เกณฑ์ที่ผ่าน: </span>
                            <strong style={{ color: '#0f172a' }}>{totalPassedCount}/{totalCriteriaCount} ข้อ ({passPercentage}%)</strong>
                          </div>
                          <div>
                            <span style={{ color: '#64748b' }}>พิกัดดาวเทียม: </span>
                            <strong style={{ color: '#0f172a' }}>{reportGps?.lat.toFixed(4) || '19.9288'}, {reportGps?.lng.toFixed(4) || '99.1685'}</strong>
                          </div>
                        </div>

                        {/* Evidentiary Photos Preview */}
                        <div>
                          <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                            ภาพถ่ายหลักฐาน ({Object.values(inspectPhotos).filter(Boolean).length}/3 รูป):
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {[inspectPhotos.p1, inspectPhotos.p2, inspectPhotos.p3].filter(Boolean).map((p, i) => (
                              <img
                                key={i}
                                src={p}
                                alt={`evidence-${i}`}
                                style={{ width: '46px', height: '46px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #cbd5e1' }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Owner Signature Preview */}
                        <div style={{
                          background: '#f8fafc',
                          padding: '10px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px'
                        }}>
                          <div>
                            <div style={{ fontSize: '10.5px', color: '#64748b' }}>ลายมือชื่อเจ้าของร้าน:</div>
                            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>{selectedEst.owner}</div>
                            <div style={{ fontSize: '9.5px', color: ownerSignatureDataUrl ? '#059669' : '#d97706', fontWeight: 600 }}>
                              {ownerSignatureDataUrl ? '✓ ลงลายมือชื่อเรียบร้อยแล้ว' : '⚠️ ยังไม่ได้ลงลายมือชื่อ'}
                            </div>
                          </div>
                          {ownerSignatureDataUrl ? (
                            <img
                              src={ownerSignatureDataUrl}
                              alt="owner-sig"
                              style={{ height: '40px', maxWidth: '120px', objectFit: 'contain', background: '#ffffff', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '2px' }}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setInspectWizardStep(3)
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                              }}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '8px',
                                background: '#fef3c7',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              กลับไปให้เซ็น
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Official Officer Touch Signature Pad */}
                      <SignaturePad
                        role="officer"
                        title="ลายมือชื่อพนักงานเจ้าหน้าที่ผู้ตรวจ"
                        signerName={currentOfficer.name || RUNGTHIWA_OFFICER.name}
                        signerSubtitle={`${currentOfficer.position} อบต.โป่งน้ำร้อน`}
                        officerName={currentOfficer.name || RUNGTHIWA_OFFICER.name}
                        initialSignature={signatureDataUrl || OFFICIAL_NWK_SIGNATURE_DATA_URL}
                        autoPreloadOfficer={true}
                        canvasHeight={150}
                        onSave={(url: string) => setSignatureDataUrl(url)}
                      />

                      {/* Final Submit & Draft Buttons */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                        <button
                          type="button"
                          className="btn-big-cancel"
                          onClick={() => {
                            triggerHaptic(20)
                            setInspectWizardStep(3)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          style={{ flex: 1 }}
                        >
                          <ArrowLeft size={14} />
                          <span>ย้อนกลับ</span>
                        </button>
                        <button
                          type="button"
                          className="btn-big-submit"
                          onClick={submitReport}
                          disabled={isSyncing}
                          style={{ flex: 2, background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
                        >
                          <CheckCheck size={16} />
                          <span>{isSyncing ? 'กำลังส่งข้อมูล...' : 'บันทึกและส่งผลการตรวจ'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                    </div>
                  </div>
                )}

              {/* =======================================================
                  SCREEN 9: แบบฟอร์มราชการ (OFFICIAL FORMS DIRECTORY)
                  ======================================================= */}
              {subScreen === 'forms' && (
                <div style={{ paddingBottom: '70px' }}>
                  {/* Search forms */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '10px',
                    gap: '8px'
                  }}>
                    <Search size={16} className="text-slate-400" />
                    <input
                      type="text"
                      placeholder="ค้นหาแบบฟอร์ม"
                      style={{ border: 'none', outline: 'none', width: '100%', fontSize: '12px' }}
                    />
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '2px' }}>
                    <button
                      onClick={() => setFormsFilter('all')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        background: formsFilter === 'all' ? '#1d4ed8' : '#ffffff',
                        color: formsFilter === 'all' ? '#ffffff' : '#475569',
                        border: '1px solid ' + (formsFilter === 'all' ? '#1d4ed8' : '#e2e8f0'),
                        boxShadow: formsFilter === 'all' ? '0 2px 8px rgba(29, 78, 216, 0.25)' : 'none'
                      }}
                    >
                      ทั้งหมด
                    </button>
                    <button
                      onClick={() => setFormsFilter('license')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        background: formsFilter === 'license' ? '#1d4ed8' : '#ffffff',
                        color: formsFilter === 'license' ? '#ffffff' : '#475569',
                        border: '1px solid ' + (formsFilter === 'license' ? '#1d4ed8' : '#e2e8f0'),
                        boxShadow: formsFilter === 'license' ? '0 2px 8px rgba(29, 78, 216, 0.25)' : 'none'
                      }}
                    >
                      ใบอนุญาต
                    </button>
                    <button
                      onClick={() => setFormsFilter('renew')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        background: formsFilter === 'renew' ? '#1d4ed8' : '#ffffff',
                        color: formsFilter === 'renew' ? '#ffffff' : '#475569',
                        border: '1px solid ' + (formsFilter === 'renew' ? '#1d4ed8' : '#e2e8f0'),
                        boxShadow: formsFilter === 'renew' ? '0 2px 8px rgba(29, 78, 216, 0.25)' : 'none'
                      }}
                    >
                      ต่ออายุ
                    </button>
                    <button
                      onClick={() => setFormsFilter('change')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        background: formsFilter === 'change' ? '#1d4ed8' : '#ffffff',
                        color: formsFilter === 'change' ? '#ffffff' : '#475569',
                        border: '1px solid ' + (formsFilter === 'change' ? '#1d4ed8' : '#e2e8f0'),
                        boxShadow: formsFilter === 'change' ? '0 2px 8px rgba(29, 78, 216, 0.25)' : 'none'
                      }}
                    >
                      เปลี่ยนแปลง
                    </button>
                  </div>

                  {/* Official Inspection Forms of อบต.โป่งน้ำร้อน (แบบตรวจสุขลักษณะสนาม 3 ฉบับจริง) */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                        แบบตรวจสุขลักษณะ อบต.โป่งน้ำร้อน (ทางการ)
                      </h3>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', padding: '2px 8px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                        3 ฉบับหลัก
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {ALL_OFFICIAL_FORMS.map(formDef => {
                        const count = formDef.categories.reduce((acc, c) => acc + c.items.length, 0)
                        return (
                          <div
                            key={formDef.id}
                            onClick={() => {
                              triggerHaptic(25)
                              startReport(selectedEst || establishments[0], undefined, formDef)
                            }}
                            style={{
                              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                              border: '1.5px solid #bfdbfe',
                              borderRadius: '16px',
                              padding: '12px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.06)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '12px',
                                background: '#eff6ff',
                                display: 'grid',
                                placeItems: 'center',
                                color: '#1d4ed8',
                                flexShrink: 0
                              }}>
                                <FileCheck2 size={20} />
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <h4 style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                                    {formDef.title}
                                  </h4>
                                  <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '1px 5px', borderRadius: '6px' }}>
                                    {count} ข้อ
                                  </span>
                                </div>
                                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                  {formDef.orgName} • {formDef.lawReference}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              style={{
                                padding: '6px 12px',
                                borderRadius: '14px',
                                background: '#2563eb',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: 700,
                                flexShrink: 0,
                                border: 'none'
                              }}
                            >
                              เริ่มตรวจ
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* List of Other Official Request Forms (แบบ บท.๑ - บท.๖) */}
                  <div style={{ marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                      แบบคำขอและใบอนุญาตราชการ (บท.๑ - บท.๖)
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {GOV_FORMS.filter(f => formsFilter === 'all' || f.category === formsFilter).map(form => (
                      <div
                        key={form.id}
                        className="gov-form-card"
                        onClick={() => setSelectedGovForm(form)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="gov-form-icon">
                            <FileText size={18} />
                          </div>
                          <div>
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                              {form.code}
                            </h4>
                            <p style={{ fontSize: '11.5px', color: '#64748b' }}>
                              {form.title}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={18} color="#cbd5e1" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* =======================================================
                  SCREEN 10: รายงานและสถิติ (REPORTS & ANALYTICS)
                  ======================================================= */}
              {subScreen === 'analytics' && (
                <div style={{ paddingBottom: '70px' }}>
                  {/* Date range picker pill */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '16px'
                  }}>
                    <CalendarDays size={14} className="text-blue-600" />
                    <span>1 ม.ค. 2568 - 31 ธ.ค. 2568</span>
                    <ChevronDown size={14} />
                  </div>

                  {/* Monthly License Trends Bar Chart */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                    marginBottom: '16px'
                  }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                      สถิติใบอนุญาต (ย้อนหลัง 6 เดือน)
                    </h3>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '10px', color: '#64748b', marginBottom: '14px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10b981' }} />
                        ใช้งานได้
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#f59e0b' }} />
                        ใกล้หมดอายุ
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#ef4444' }} />
                        หมดอายุ
                      </span>
                    </div>

                    {/* Simulated SVG Bar Chart */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', paddingTop: '10px', borderBottom: '1px solid #e2e8f0' }}>
                      {[
                        { m: 'ม.ค.', a: 80, e: 14, x: 5 },
                        { m: 'ก.พ.', a: 85, e: 16, x: 7 },
                        { m: 'มี.ค.', a: 90, e: 18, x: 8 },
                        { m: 'เม.ย.', a: 95, e: 20, x: 9 },
                        { m: 'พ.ค.', a: 98, e: 17, x: 8 },
                        { m: 'มิ.ย.', a: 100, e: 18, x: 9 }
                      ].map(bar => (
                        <div key={bar.m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
                            <div style={{ width: '8px', height: `${bar.a}px`, background: '#10b981', borderRadius: '2px 2px 0 0' }} />
                            <div style={{ width: '8px', height: `${bar.e * 2}px`, background: '#f59e0b', borderRadius: '2px 2px 0 0' }} />
                            <div style={{ width: '8px', height: `${bar.x * 2.5}px`, background: '#ef4444', borderRadius: '2px 2px 0 0' }} />
                          </div>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>{bar.m}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Establishment Types Donut Chart */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)'
                  }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
                      ประเภทสถานประกอบการ
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                      {/* Donut representation */}
                      <div style={{
                        width: '110px',
                        height: '110px',
                        borderRadius: '50%',
                        background: 'conic-gradient(#1769d2 0% 65%, #10b981 65% 92%, #cbd5e1 92% 100%)',
                        display: 'grid',
                        placeItems: 'center',
                        position: 'relative'
                      }}>
                        <div style={{
                          width: '74px',
                          height: '74px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>248</span>
                          <span style={{ fontSize: '9px', color: '#94a3b8' }}>รวม</span>
                        </div>
                      </div>

                      {/* Legend */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#1769d2' }} />
                          <span style={{ color: '#334155' }}>ร้านอาหาร</span>
                          <strong style={{ color: '#0f172a' }}>162 (65%)</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10b981' }} />
                          <span style={{ color: '#334155' }}>สะสมอาหาร</span>
                          <strong style={{ color: '#0f172a' }}>68 (27%)</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#cbd5e1' }} />
                          <span style={{ color: '#334155' }}>อื่นๆ</span>
                          <strong style={{ color: '#0f172a' }}>18 (8%)</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =======================================================
                  SCREEN 11: โปรไฟล์ / ตั้งค่า (PROFILE & SETTINGS)
                  ======================================================= */}
              {tab === 'profile' && subScreen === 'none' && (
                <div style={{ paddingBottom: '70px' }}>
                  {/* Officer Profile Card with Interactive Avatar Camera Upload */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    padding: '18px 16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    marginBottom: '16px',
                    position: 'relative'
                  }}>
                    <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '3px solid #2563eb',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                        background: '#f1f5f9'
                      }}>
                        <img
                          src={currentOfficer.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                          alt={currentOfficer.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      {/* Avatar camera upload badge */}
                      <label
                        style={{
                          position: 'absolute',
                          bottom: '-2px',
                          right: '-2px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#2563eb',
                          color: '#ffffff',
                          display: 'grid',
                          placeItems: 'center',
                          cursor: 'pointer',
                          border: '2px solid #ffffff',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
                        }}
                        title="แตะเพื่อเปลี่ยนรูปโปรไฟล์ หรือถ่ายรูปจากกล้อง"
                      >
                        <Camera size={12} />
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleAvatarFileChange}
                        />
                      </label>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        {currentOfficer.name}
                      </h2>
                      <p style={{ fontSize: '11.5px', color: '#2563eb', fontWeight: 600, marginTop: '2px', marginBottom: 0 }}>
                        {currentOfficer.position}
                      </p>
                      <p style={{ fontSize: '10.5px', color: '#64748b', margin: '1px 0 0' }}>
                        {currentOfficer.roleName}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileName(currentOfficer.name)
                        setProfilePosition(currentOfficer.position)
                        setProfileRole(currentOfficer.roleName)
                        setProfilePhone(currentOfficer.phone || '053-010-555')
                        setProfileEmail(currentOfficer.email || 'health@pongnamron.go.th')
                        setProfileSignature(currentOfficer.signatureUrl || OFFICIAL_NWK_SIGNATURE_DATA_URL)
                        setIsSigningInProfile(false)
                        setIsProfileModalOpen(true)
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      แก้ไข
                    </button>
                  </div>

                  {/* Settings Menu List (Matching Screen 11) */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '18px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                    marginBottom: '16px'
                  }}>
                    {/* เมนูลงทะเบียนร้านค้าใหม่ */}
                    <div
                      className="queue-action-item"
                      onClick={() => {
                        triggerHaptic(20)
                        setWizardStep(1)
                        setSubScreen('new_store')
                      }}
                      style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: '#dcfce7',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0
                        }}>
                          <PlusCircle size={18} color="#16a34a" />
                        </div>
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#15803d' }}>ลงทะเบียนร้านค้าใหม่</span>
                          <p style={{ fontSize: '10.5px', color: '#16a34a', margin: 0 }}>แบบฟอร์มคำขอ บท./นจ. และผังตรวจสุขลักษณะ</p>
                        </div>
                      </div>
                      <ChevronRight size={16} color="#16a34a" />
                    </div>

                    {/* ข้อมูลส่วนตัว */}
                    <div
                      className="queue-action-item"
                      onClick={() => {
                        triggerHaptic(20)
                        setProfileName(currentOfficer.name)
                        setProfilePosition(currentOfficer.position)
                        setProfileRole(currentOfficer.roleName)
                        setProfilePhone(currentOfficer.phone || '053-010-555')
                        setProfileEmail(currentOfficer.email || 'health@pongnamron.go.th')
                        setIsProfileModalOpen(true)
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <UserRound size={18} className="text-slate-500" />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>ข้อมูลส่วนตัว</span>
                      </div>
                      <ChevronRight size={16} color="#94a3b8" />
                    </div>

                    {/* ลายมือชื่อดิจิทัลทางการ */}
                    <div
                      className="queue-action-item"
                      onClick={() => {
                        triggerHaptic(20)
                        setProfileName(currentOfficer.name)
                        setProfilePosition(currentOfficer.position)
                        setProfileRole(currentOfficer.roleName)
                        setProfilePhone(currentOfficer.phone || '053-010-555')
                        setProfileEmail(currentOfficer.email || 'health@pongnamron.go.th')
                        setProfileSignature(currentOfficer.signatureUrl || OFFICIAL_NWK_SIGNATURE_DATA_URL)
                        setIsSigningInProfile(true)
                        setIsProfileModalOpen(true)
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <PenTool size={18} className="text-blue-600" />
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>ลายมือชื่อดิจิทัลทางการ</span>
                          <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0 }}>ประทับอัตโนมัติในใบตรวจและเอกสารราชการ</p>
                        </div>
                      </div>
                      <ChevronRight size={16} color="#94a3b8" />
                    </div>

                    {/* เปลี่ยนรหัสผ่าน */}
                    <div
                      className="queue-action-item"
                      onClick={() => {
                        triggerHaptic(20)
                        setCurrentPinInput('')
                        setNewPinInput('')
                        setConfirmPinInput('')
                        setPinError('')
                        setIsPinModalOpen(true)
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Lock size={18} className="text-slate-500" />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>เปลี่ยนรหัสผ่าน</span>
                      </div>
                      <ChevronRight size={16} color="#94a3b8" />
                    </div>

                    {/* สิทธิ์การใช้งาน */}
                    <div
                      className="queue-action-item"
                      onClick={() => {
                        triggerHaptic(20)
                        setIsPermissionsModalOpen(true)
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ShieldCheck size={18} className="text-slate-500" />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>สิทธิ์การใช้งาน</span>
                      </div>
                      <ChevronRight size={16} color="#94a3b8" />
                    </div>

                    {/* แจ้งเตือน (Toggle switch) */}
                    <div className="queue-action-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Bell size={18} className="text-slate-500" />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>แจ้งเตือน</span>
                      </div>
                      <div
                        onClick={() => {
                          triggerHaptic(20)
                          setNotificationsEnabled(!notificationsEnabled)
                        }}
                        style={{
                          width: '42px',
                          height: '24px',
                          borderRadius: '14px',
                          background: notificationsEnabled ? '#10b981' : '#cbd5e1',
                          padding: '2px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: notificationsEnabled ? 'flex-end' : 'flex-start',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </div>
                    </div>

                    {/* แบบฟอร์มราชการ (Screen 9) */}
                    <div
                      className="queue-action-item"
                      onClick={() => setSubScreen('forms')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={18} className="text-blue-600" />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>แบบฟอร์มราชการ (บท.๑ - บท.๖)</span>
                      </div>
                      <ChevronRight size={16} color="#94a3b8" />
                    </div>

                    {/* รายงานและสถิติ (Screen 10) */}
                    <div
                      className="queue-action-item"
                      onClick={() => setSubScreen('analytics')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <BarChart3 size={18} className="text-blue-600" />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>รายงานและสถิติ</span>
                      </div>
                      <ChevronRight size={16} color="#94a3b8" />
                    </div>

                    {/* เกี่ยวกับแอป */}
                    <div
                      className="queue-action-item"
                      onClick={() => {
                        triggerHaptic(20)
                        setIsAboutModalOpen(true)
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Info size={18} className="text-slate-500" />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>เกี่ยวกับแอป</span>
                      </div>
                      <ChevronRight size={16} color="#94a3b8" />
                    </div>

                    {/* ออกจากระบบ (Logout - Red) */}
                    <div
                      className="queue-action-item"
                      onClick={() => {
                        triggerHaptic(30)
                        setIsLogoutConfirmOpen(true)
                      }}
                      style={{ borderTop: '1px solid #fee2e2' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <LogOut size={18} color="#ef4444" />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444' }}>ออกจากระบบ</span>
                      </div>
                      <ChevronRight size={16} color="#ef4444" />
                    </div>
                  </div>
                </div>
              )}

              {/* =======================================================
                  SCREEN: NEW STORE REGISTRATION WIZARD
                  ======================================================= */}
              {/* =======================================================
                  SCREEN: NEW STORE REGISTRATION WIZARD (2026 MODERN GOVERNMENT UX)
                  ======================================================= */}
              {subScreen === 'new_store' && (
                <div style={{ paddingBottom: '90px' }}>
                  {/* Municipal Official Header Banner */}
                  <div style={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    borderRadius: '20px',
                    padding: '16px',
                    color: '#ffffff',
                    marginBottom: '14px',
                    boxShadow: '0 6px 20px -2px rgba(5, 150, 105, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '14px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}>
                      <Store size={22} color="#ffffff" />
                    </div>
                    <div>
                      <span style={{ fontSize: '9.5px', background: 'rgba(255, 255, 255, 0.22)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                        🏛️ กองสาธารณสุขและสิ่งแวดล้อม อบต.โป่งน้ำร้อน
                      </span>
                      <h3 style={{ fontSize: '14.5px', fontWeight: 800, margin: '4px 0 1px', color: '#ffffff' }}>
                        ลงทะเบียนสถานประกอบการใหม่
                      </h3>
                      <p style={{ fontSize: '11px', margin: 0, color: '#a7f3d0' }}>
                        บันทึกข้อมูล ปักหมุดดาวเทียม GIS และคำนวณพื้นที่ ตร.ม.
                      </p>
                    </div>
                  </div>

                  {/* Modern Glass Connected Stepper */}
                  <div className="wizard-glass-stepper">
                    <div
                      className={`wizard-step-node ${wizardStep === 1 ? 'active' : wizardStep > 1 ? 'completed' : ''}`}
                      onClick={() => setWizardStep(1)}
                    >
                      <div className="wizard-step-badge">
                        {wizardStep > 1 ? <Check size={16} /> : '1'}
                      </div>
                      <span className="wizard-step-text">ข้อมูลร้าน & ผู้ขอ</span>
                    </div>

                    <div style={{ flex: 0.6, height: '2px', background: wizardStep >= 2 ? '#10b981' : '#e2e8f0', margin: '0 4px', marginBottom: '16px', transition: 'background 0.3s' }} />

                    <div
                      className={`wizard-step-node ${wizardStep === 2 ? 'active' : wizardStep > 2 ? 'completed' : ''}`}
                      onClick={() => {
                        if (newStoreName.trim() && newOwner.trim()) setWizardStep(2)
                        else notify('กรุณาระบุชื่อร้านและชื่อผู้ประกอบการก่อน')
                      }}
                    >
                      <div className="wizard-step-badge">
                        {wizardStep > 2 ? <Check size={16} /> : '2'}
                      </div>
                      <span className="wizard-step-text">วัดขนาดพื้นที่</span>
                    </div>

                    <div style={{ flex: 0.6, height: '2px', background: wizardStep >= 3 ? '#10b981' : '#e2e8f0', margin: '0 4px', marginBottom: '16px', transition: 'background 0.3s' }} />

                    <div
                      className={`wizard-step-node ${wizardStep === 3 ? 'active' : ''}`}
                      onClick={() => {
                        if (newStoreName.trim() && newOwner.trim()) setWizardStep(3)
                        else notify('กรุณาระบุชื่อร้านและชื่อผู้ประกอบการก่อน')
                      }}
                    >
                      <div className="wizard-step-badge">
                        3
                      </div>
                      <span className="wizard-step-text">พิกัด GPS & บันทึก</span>
                    </div>
                  </div>

                  {/* STEP 1: ข้อมูลร้าน & ผู้ประกอบการ */}
                  {wizardStep === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Section 1: Store Profile Card */}
                      <div className="gov-card-section">
                        <div className="gov-card-header">
                          <Store size={16} style={{ color: '#059669' }} />
                          <span className="gov-card-title">๑. ข้อมูลสถานประกอบการ</span>
                        </div>

                        <div className="gov-input-wrapper">
                          <label className="gov-label">
                            <span>ชื่อสถานประกอบการ / ร้านค้า</span>
                            <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={newStoreName}
                            onChange={e => setNewStoreName(e.target.value)}
                            placeholder="เช่น ร้านครัวคุณแม่ หรือ ครัวปลาเผาบ้านใหม่ผาใต้"
                            className="gov-input-box"
                            autoFocus
                          />
                        </div>

                        <div className="gov-input-wrapper">
                          <label className="gov-label">
                            <span>ประเภทกิจการ</span>
                            <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <select
                            value={newStoreType}
                            onChange={e => setNewStoreType(e.target.value)}
                            className="gov-input-box"
                            style={{ cursor: 'pointer' }}
                          >
                            <option value="สถานที่จำหน่ายอาหาร (ร้านอาหาร)">🍽️ สถานที่จำหน่ายอาหาร (ร้านอาหารทั่วไป)</option>
                            <option value="สถานที่สะสมอาหาร (คลังสินค้า/ห้องเย็น/ของชำ)">📦 สถานที่สะสมอาหาร (คลังสินค้า/ห้องเย็น/ร้านของชำ)</option>
                            <option value="สถานที่จำหน่ายอาหาร (เครื่องดื่ม/คาเฟ่)">☕ สถานที่จำหน่ายอาหาร (เครื่องดื่ม/คาเฟ่/ซุ้มกาแฟ)</option>
                            <option value="กิจการที่เป็นอันตรายต่อสุขภาพ (เช่น ปั๊มน้ำมันหยอดเหรียญ, อู่ซ่อมรถ, เลี้ยงสัตว์)">⚠️ กิจการที่เป็นอันตรายต่อสุขภาพ (ปั๊มน้ำมันหยอดเหรียญ/อู่ซ่อมรถ/เลี้ยงสัตว์)</option>
                          </select>
                        </div>

                        <div className="gov-input-wrapper">
                          <label className="gov-label">
                            <MapPin size={13} style={{ color: '#0284c7' }} />
                            <span>หมู่บ้านในเขต อบต.โป่งน้ำร้อน</span>
                          </label>
                          <select
                            value={newVillage}
                            onChange={e => setNewVillage(e.target.value)}
                            className="gov-input-box"
                            style={{ cursor: 'pointer' }}
                          >
                            {VILLAGES.filter(v => v !== 'ทั้งหมด').map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Section 2: Owner Information Card */}
                      <div className="gov-card-section">
                        <div className="gov-card-header">
                          <UserRound size={16} style={{ color: '#1d4ed8' }} />
                          <span className="gov-card-title">๒. ข้อมูลผู้ประกอบการ / ผู้ขออนุญาต</span>
                        </div>

                        <div className="gov-input-wrapper">
                          <label className="gov-label">
                            <span>ชื่อ-นามสกุล เจ้าของร้าน</span>
                            <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={newOwner}
                            onChange={e => setNewOwner(e.target.value)}
                            placeholder="เช่น นายสมศักดิ์ รักดี"
                            className="gov-input-box"
                          />
                        </div>

                        <div className="gov-input-wrapper">
                          <label className="gov-label">
                            <ShieldCheck size={13} style={{ color: '#059669' }} />
                            <span>เลขประจำตัวประชาชน (๑๓ หลัก)</span>
                          </label>
                          <input
                            type="text"
                            maxLength={17}
                            value={newCitizenId}
                            onChange={e => setNewCitizenId(e.target.value)}
                            placeholder="เช่น 1-5099-xxxxx-xx-x"
                            className="gov-input-box"
                          />
                        </div>

                        <div className="gov-input-wrapper">
                          <label className="gov-label">
                            <Phone size={13} style={{ color: '#2563eb' }} />
                            <span>เบอร์โทรศัพท์ติดต่อ</span>
                          </label>
                          <input
                            type="tel"
                            value={newPhone}
                            onChange={e => setNewPhone(e.target.value)}
                            placeholder="081-234-5678"
                            className="gov-input-box"
                          />
                        </div>
                      </div>

                      {/* CTA Next Button */}
                      <button
                        type="button"
                        className="gov-btn-cta primary"
                        onClick={() => {
                          if (!newStoreName.trim()) {
                            triggerHaptic(60)
                            notify('กรุณาระบุชื่อสถานประกอบการ')
                            return
                          }
                          if (!newOwner.trim()) {
                            triggerHaptic(60)
                            notify('กรุณาระบุชื่อผู้ประกอบการ')
                            return
                          }
                          triggerHaptic(20)
                          setWizardStep(2)
                        }}
                      >
                        <span>ถัดไป: คำนวณขนาดพื้นที่ & วาดผัง</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  )}

                  {/* STEP 2: ขนาดพื้นที่ & วาดผัง ตร.ม. */}
                  {wizardStep === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <FloorplanVisualizer
                        widthM={newWidthM}
                        lengthM={newLengthM}
                        onChangeWidth={w => setNewWidthM(w)}
                        onChangeLength={l => setNewLengthM(l)}
                      />

                      {/* Legal Assessment Summary Card */}
                      <div style={{
                        background: calculatedArea > 200 ? '#eff6ff' : '#ecfdf5',
                        borderRadius: '16px',
                        padding: '14px',
                        border: '1px solid ' + (calculatedArea > 200 ? '#bfdbfe' : '#a7f3d0'),
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>พื้นที่ประกอบการรวม:</span>
                          <strong style={{ fontSize: '16px', color: calculatedArea > 200 ? '#1d4ed8' : '#047857' }}>
                            {calculatedArea} ตารางเมตร
                          </strong>
                        </div>
                        <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.4, borderTop: '1px dashed ' + (calculatedArea > 200 ? '#cbd5e1' : '#bbf7d0'), paddingTop: '6px' }}>
                          <span style={{ fontWeight: 700 }}>การจัดประเภททางกฎหมาย: </span>
                          {newStoreType.includes('อันตราย') || newStoreType.includes('ปิโตรเลียม') || newStoreType.includes('หยอดเหรียญ')
                            ? 'กิจการที่เป็นอันตรายต่อสุขภาพ (ต้องขอใบอนุญาต แบบ บท.๓)'
                            : calculatedArea > 200
                            ? 'พื้นที่เกิน ๒๐๐ ตร.ม. (ต้องขอรับใบอนุญาตจัดตั้ง แบบ บทอ.๒ - ๓,๐๐๐ บาท/ปี)'
                            : 'พื้นที่ไม่เกิน ๒๐๐ ตร.ม. (หนังสือรับรองการแจ้งจัดตั้ง แบบ นจ.๓ - ๑,๐๐๐ บาท/ปี)'}
                        </div>
                      </div>

                      {/* Navigation Buttons */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="gov-btn-cta secondary"
                          style={{ flex: 1 }}
                          onClick={() => {
                            triggerHaptic(15)
                            setWizardStep(1)
                          }}
                        >
                          <ArrowLeft size={16} />
                          <span>ย้อนกลับ</span>
                        </button>
                        <button
                          type="button"
                          className="gov-btn-cta primary"
                          style={{ flex: 2 }}
                          onClick={() => {
                            triggerHaptic(20)
                            setWizardStep(3)
                          }}
                        >
                          <span>ถัดไป: พิกัดดาวเทียม GPS</span>
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: พิกัด GPS & บันทึกเข้าระบบ */}
                  {wizardStep === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Section: Address Details */}
                      <div className="gov-card-section">
                        <div className="gov-card-header">
                          <MapPin size={16} style={{ color: '#0284c7' }} />
                          <span className="gov-card-title">๓. สถานที่ตั้งและที่อยู่จริง</span>
                        </div>

                        <div className="gov-input-wrapper">
                          <label className="gov-label">
                            <span>ที่อยู่ / เลขที่ / ซอย / ถนน</span>
                          </label>
                          <input
                            type="text"
                            value={newAddress}
                            onChange={e => setNewAddress(e.target.value)}
                            placeholder={`เช่น 123 ${newVillage} ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่ 50110`}
                            className="gov-input-box"
                          />
                        </div>
                      </div>

                      {/* Section: GPS Geolocation Card */}
                      <div className="gov-card-section">
                        <div className="gov-card-header">
                          <Radio size={16} style={{ color: '#059669' }} />
                          <span className="gov-card-title">๔. พิกัดดาวเทียม GIS (GPS Geolocation)</span>
                        </div>

                        <div style={{
                          background: '#f8fafc',
                          borderRadius: '14px',
                          padding: '12px',
                          border: '1px solid #e2e8f0',
                          marginBottom: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div>
                            <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>พิกัด ละติจูด, ลองจิจูด:</span>
                            <strong style={{ fontSize: '13px', color: '#0f172a' }}>{newLat}, {newLng}</strong>
                          </div>
                          <span style={{ fontSize: '10px', background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '8px', fontWeight: 700 }}>
                            ● พร้อมปักหมุด
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => captureGps(true)}
                            disabled={isCapturingGps}
                            style={{
                              flex: 1,
                              padding: '11px',
                              borderRadius: '12px',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1d4ed8',
                              fontSize: '11.5px',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <Compass size={15} className={isCapturingGps ? 'animate-spin' : ''} />
                            <span>{isCapturingGps ? 'กำลังดึงพิกัดดาวเทียม...' : '📡 แตะเพื่อจับพิกัด GPS จริง'}</span>
                          </button>

                          <a
                            href={`https://www.google.com/maps?q=${newLat},${newLng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '11px 14px',
                              borderRadius: '12px',
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              color: '#475569',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="ดูพิกัดบน Google Maps"
                          >
                            <Navigation size={14} />
                            <span>ดูแผนที่</span>
                          </a>
                        </div>
                      </div>

                      {/* Section: Review Checklist Card */}
                      <div style={{
                        background: '#f8fafc',
                        borderRadius: '16px',
                        padding: '14px',
                        border: '1px solid #e2e8f0',
                        fontSize: '11.5px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
                          📋 ตรวจสอบความถูกต้องก่อนบันทึก:
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>ชื่อร้าน:</span>
                          <strong>{newStoreName}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>ผู้ประกอบการ:</span>
                          <strong>{newOwner}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>ประเภท:</span>
                          <span style={{ color: '#2563eb', fontWeight: 600 }}>{newStoreType}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>พื้นที่:</span>
                          <strong>{calculatedArea} ตารางเมตร ({newVillage})</strong>
                        </div>
                      </div>

                      {/* Submission Action Buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="gov-btn-cta secondary"
                            style={{ flex: 1 }}
                            onClick={() => {
                              triggerHaptic(15)
                              setWizardStep(2)
                            }}
                          >
                            <ArrowLeft size={16} />
                            <span>ย้อนกลับ</span>
                          </button>
                          <button
                            type="button"
                            className="gov-btn-cta primary"
                            style={{ flex: 2 }}
                            onClick={() => handleSaveNewStore(false)}
                          >
                            <Save size={16} />
                            <span>บันทึกเข้าระบบทะเบียนกลาง</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          className="gov-btn-cta success"
                          onClick={() => handleSaveNewStore(true)}
                          title="บันทึกร้านแล้วเริ่มทำแบบตรวจ ๑๐๐ คะแนนทันที"
                        >
                          <ClipboardCheck size={17} />
                          <span>บันทึก & เริ่มตรวจสุขลักษณะทันที (1-Click)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* =========================================================
              BOTTOM NAVIGATION BAR (5 TABS MATCHING GRAPHIC 100%)
              1. หน้าหลัก | 2. ร้านค้า | 3. แผนที่ | 4. งานตรวจ | 5. เพิ่มเติม
              ========================================================= */}
          <nav className="mobile-bottom-nav">
            {/* Tab 1: หน้าหลัก */}
            <button
              className={`bottom-tab-item ${tab === 'home' && subScreen === 'none' ? 'active' : ''}`}
              onClick={() => {
                triggerHaptic(20)
                setTab('home')
                setSubScreen('none')
              }}
            >
              <div className="tab-icon-wrap">
                <Store size={19} />
              </div>
              <span>หน้าหลัก</span>
            </button>

            {/* Tab 2: ร้านค้า */}
            <button
              className={`bottom-tab-item ${tab === 'stores' && subScreen === 'none' ? 'active' : ''}`}
              onClick={() => {
                triggerHaptic(20)
                setTab('stores')
                setSubScreen('none')
              }}
            >
              <div className="tab-icon-wrap">
                <Building size={19} />
              </div>
              <span>ร้านค้า</span>
            </button>

            {/* Center Action Button: 📋 ตรวจสนาม / ลงพื้นที่ (Field Inspection) */}
            <button
              type="button"
              className="bottom-tab-center-action"
              onClick={() => {
                triggerHaptic(30)
                setIsQuickInspectModalOpen(true)
              }}
              title="ตรวจสนาม / ลงพื้นที่ตรวจสุขลักษณะ (Field Inspection)"
            >
              <div className="center-fab-icon">
                <ClipboardCheck size={22} color="#ffffff" />
              </div>
              <span className="center-fab-label">ตรวจสนาม</span>
            </button>

            {/* Tab 3: แผนที่ */}
            <button
              className={`bottom-tab-item ${tab === 'map' && subScreen === 'none' ? 'active' : ''}`}
              onClick={() => {
                triggerHaptic(20)
                setTab('map')
                setSubScreen('none')
              }}
            >
              <div className="tab-icon-wrap">
                <MapPin size={19} />
              </div>
              <span>แผนที่</span>
            </button>

            {/* Tab 4: งานตรวจ */}
            <button
              className={`bottom-tab-item ${tab === 'tasks' && subScreen === 'none' ? 'active' : ''}`}
              onClick={() => {
                triggerHaptic(20)
                setTab('tasks')
                setSubScreen('none')
              }}
            >
              <div className="tab-icon-wrap">
                <ClipboardCheck size={19} />
                {tasks.filter(t => t.status === 'รอดำเนินการ').length > 0 && (
                  <span className="tab-badge">
                    {tasks.filter(t => t.status === 'รอดำเนินการ').length}
                  </span>
                )}
              </div>
              <span>งานลงพื้นที่</span>
            </button>
          </nav>

        </div>
      </div>
  )
}

export default PublicHealthFieldPwaApp;
