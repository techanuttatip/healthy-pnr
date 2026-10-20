import React, { useState, useEffect } from 'react';
import type {
  Establishment,
  OfficialFormCode,
  SystemSettings,
  PrintDocumentMode
} from './types/publicHealth';
import { DEFAULT_SYSTEM_SETTINGS } from './types/publicHealth';
import { sanitationDataService, DEFAULT_OFFICERS, type OfficerAccount } from './services/sanitationDataService';
import { showConfirmDialog, showToast } from './utils/sweetAlert';

// 1. Layout Components
import { AppSidebar, AppHeader, OfficerLoginScreen, type AppModuleType } from './components/layout';

// 2. Functional Domain Views
import { UnifiedMapDashboard } from './components/dashboard';
import { GisMapModuleView } from './components/gis';
import { EstablishmentTable, NewRequestModal, SimpleEstablishmentDirectory } from './components/registry';
import { YearlyDocumentArchiveTab, PdfUploadView, ManualEntryView } from './components/archive';
import { OfficialCertificatePrint } from './components/print';
import { RemoteSignView, PublicHealthFieldPwaApp } from './components/inspection';

// 3. Inspection & System Modals
import { FieldRenewalKitModal, PwaQrModal } from './components/inspection';
import { SystemSettingsModal, UserProfileModal, OfficerLoginModal, AuditLogModal, DataSafetyModal } from './components/system';

export const App: React.FC = () => {
  // 1. Core Establishments State
  const [establishments, setEstablishments] = useState<Establishment[]>(() => {
    try {
      const deletedIds: string[] = JSON.parse(localStorage.getItem('PNR_DELETED_ESTABLISHMENT_IDS') || '[]');
      const saved = localStorage.getItem('PNR_SANITATION_ESTABLISHMENTS');
      const MOCK_IDS = [
        'est-001', 'est-002', 'est-003', 'est-004', 'est-005', 'est-006',
        'est-joy', 'est-boat', 'est-curry', 'est-cafe', 'est-cold', 'est-stream',
        'est-045', 'est-046', 'est-047'
      ];
      if (saved) {
        const parsed: Establishment[] = JSON.parse(saved);
        const filtered = parsed.filter(e => 
          !MOCK_IDS.includes(e.id) && 
          !MOCK_IDS.includes(e.regNumber) &&
          !deletedIds.includes(e.id) && 
          !deletedIds.includes(e.regNumber)
        );
        if (filtered.length > 0) return filtered;
      }
      return [];
    } catch {
      return [];
    }
  });

  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(() => {
    try {
      const deletedIds: string[] = JSON.parse(localStorage.getItem('PNR_DELETED_ESTABLISHMENT_IDS') || '[]');
      const saved = localStorage.getItem('PNR_SANITATION_ESTABLISHMENTS');
      const MOCK_IDS = [
        'est-001', 'est-002', 'est-003', 'est-004', 'est-005', 'est-006',
        'est-joy', 'est-boat', 'est-curry', 'est-cafe', 'est-cold', 'est-stream',
        'est-045', 'est-046', 'est-047'
      ];
      if (saved) {
        const parsed: Establishment[] = JSON.parse(saved);
        const valid = parsed.filter(e => 
          !MOCK_IDS.includes(e.id) && 
          !MOCK_IDS.includes(e.regNumber) &&
          !deletedIds.includes(e.id) && 
          !deletedIds.includes(e.regNumber)
        );
        if (valid.length > 0) return valid[0];
      }
      return null;
    } catch {
      return null;
    }
  });

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    return selectedEstablishment ? selectedEstablishment.id : null;
  });

  // Check if opening for remote mobile signature (?signToken=...)
  const [signToken] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('signToken');
    } catch {
      return null;
    }
  });

  // Check if opening for dedicated Mobile Field Inspector PWA (via URL, standalone installed PWA, or mobile shortcut)
  const [isInspectorPwa] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const path = window.location.pathname.toLowerCase();
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 820;

      // 1. Direct URL parameters or path
      if (
        params.get('app') === 'inspector' ||
        params.get('pwa') === '1' ||
        params.has('inspector') ||
        params.has('mobile') ||
        params.has('pwa') ||
        path.includes('/inspector') ||
        path.includes('/mobile') ||
        path.includes('/pwa')
      ) {
        localStorage.setItem('pwa_launch_mode', 'inspector');
        return true;
      }

      // 2. Installed PWA opened from Home Screen (standalone)
      if (isStandalone) {
        localStorage.setItem('pwa_launch_mode', 'inspector');
        return true;
      }

      // 3. Mobile device with inspector mode previously launched
      if (isMobileDevice && localStorage.getItem('pwa_launch_mode') === 'inspector') {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  });

  // 2. Active Module & Navigation State
  const [activeModule, setActiveModule] = useState<AppModuleType>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const mod = params.get('module');
      if (
        mod &&
        ['dashboard', 'directory', 'table', 'upload_pdf', 'manual_entry', 'field_inspection', 'archive', 'map', 'print', 'intake'].includes(
          mod
        )
      ) {
        if (mod === 'intake') return 'upload_pdf';
        if (mod === 'archive') return 'table';
        if (mod === 'map') return 'dashboard';
        return mod as AppModuleType;
      }
    } catch {
      // fallback
    }
    return 'dashboard';
  });

  const [tableStatusFilter, setTableStatusFilter] = useState<string>('all');
  const [currentMode, setCurrentMode] = useState<OfficialFormCode | string>('นจ.1');
  const [printInitialMode, setPrintInitialMode] = useState<PrintDocumentMode>('garuda');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedArchiveYear, setSelectedArchiveYear] = useState<number>(2569);
  const [returnModuleAfterPrint, setReturnModuleAfterPrint] = useState<AppModuleType>('table');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');

  const availableArchiveYears = React.useMemo(() => {
    const set = new Set<number>([2570, 2569, 2568, 2567]);
    establishments.forEach((e) => {
      e.yearlyArchives?.forEach((a) => set.add(a.year));
      const regMatch = e.regNumber?.match(/[-_](\d{2})[-_]/);
      if (regMatch) set.add(2500 + parseInt(regMatch[1], 10));
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [establishments]);

  // 3. Modals State
  const [isFieldRenewalKitOpen, setIsFieldRenewalKitOpen] = useState<boolean>(false);
  const [fieldRenewalKitEst, setFieldRenewalKitEst] = useState<Establishment | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState<boolean>(false);
  const [isOfficerLoginOpen, setIsOfficerLoginOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isDataSafetyModalOpen, setIsDataSafetyModalOpen] = useState<boolean>(false);
  const [isPwaQrModalOpen, setIsPwaQrModalOpen] = useState<boolean>(false);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('new') === '1';
    } catch {
      return false;
    }
  });

  // 4. System Settings State
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem('pnr_health_food_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.signatories?.officerName === 'นายนพดล สุขเกษม') {
          parsed.signatories.officerName = 'นางสาวรุ่งทิวา อุปนันท์';
          parsed.signatories.officerPosition = 'นักวิชาการสาธารณสุขปฏิบัติการ';
          localStorage.setItem('pnr_health_food_settings', JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse system settings from localStorage', e);
    }
    return DEFAULT_SYSTEM_SETTINGS;
  });

  const handleSaveSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    sanitationDataService.saveSettings(newSettings, currentOfficer?.id);
  };

  const municipality = settings.organizationName || 'องค์การบริหารส่วนตำบลโป่งน้ำร้อน';

  // 5. Officer Authentication State
  const [currentOfficer, setCurrentOfficer] = useState<OfficerAccount>(() => {
    return sanitationDataService.getCurrentOfficer() || DEFAULT_OFFICERS[0];
  });

  const SESSION_KEY = 'PNR_AUTHENTICATED_SESSION';
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  });

  const handleLoginSuccess = (officer: OfficerAccount) => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    localStorage.setItem('PNR_CURRENT_OFFICER', JSON.stringify(officer));
    setCurrentOfficer(officer);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    const isConfirmed = await showConfirmDialog({
      title: 'ออกจากระบบ?',
      text: 'คุณต้องการออกจากระบบเจ้าหน้าที่ อบต.โป่งน้ำร้อน ใช่หรือไม่?',
      confirmText: 'ออกจากระบบ',
      cancelText: 'ยกเลิก',
      icon: 'question'
    });
    if (!isConfirmed) return;

    sessionStorage.removeItem(SESSION_KEY);
    sanitationDataService.logoutOfficer();
    setIsAuthenticated(false);
    showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
  };

  // Inactivity Auto-Logout: 30 นาที
  useEffect(() => {
    if (!isAuthenticated) return;
    const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
    let timer: ReturnType<typeof setTimeout>;
    let lastReset = Date.now();

    const resetInactivity = () => {
      const now = Date.now();
      if (now - lastReset < 10000) return;
      lastReset = now;

      clearTimeout(timer);
      timer = setTimeout(() => {
        sessionStorage.removeItem(SESSION_KEY);
        sanitationDataService.logoutOfficer();
        setIsAuthenticated(false);
        showToast(
          'เซสชันหมดอายุเนื่องจากไม่มีการใช้งานเกิน ๓๐ นาที เพื่อความปลอดภัยกรุณาเข้าสู่ระบบใหม่',
          'warning'
        );
      }, INACTIVITY_LIMIT_MS);
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'pointerdown'];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetInactivity, { passive: true }));
    resetInactivity();

    return () => {
      clearTimeout(timer);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetInactivity));
    };
  }, [isAuthenticated]);

  const handleOfficerChange = async (officer: OfficerAccount) => {
    setCurrentOfficer(officer);
    const userSettings = await sanitationDataService.getSettings(officer.id);
    if (userSettings) {
      setSettings(userSettings);
    }
  };

  // Initial Data Load & Real-Time Live Sync (Supabase Cloud + BroadcastChannel + Polling)
  useEffect(() => {
    let isMounted = true;

    const loadCloudData = async () => {
      try {
        const cloudData = await sanitationDataService.getEstablishments();
        if (!isMounted) return;
        if (cloudData) {
          setEstablishments((prev) => {
            // Only update state if data actually changed to avoid re-rendering map and destroying active popups
            if (
              prev.length === cloudData.length &&
              prev.every((p, idx) => {
                const c = cloudData[idx];
                return (
                  c &&
                  p.id === c.id &&
                  p.status === c.status &&
                  p.inspectionScore === c.inspectionScore &&
                  p.feeAmount === c.feeAmount &&
                  p.receiptNo === c.receiptNo &&
                  (p.yearlyArchives?.length || 0) === (c.yearlyArchives?.length || 0)
                );
              })
            ) {
              return prev; // Reference unchanged: preserves map markers & open popups
            }
            return cloudData;
          });
          if (cloudData.length > 0) {
            setSelectedEstablishment((prev) => {
              if (prev && cloudData.some((c) => c.id === prev.id || c.regNumber === prev.regNumber)) {
                return cloudData.find((c) => c.id === prev.id || c.regNumber === prev.regNumber) || cloudData[0];
              }
              return cloudData[0];
            });
            setSelectedId((prev) => {
              if (prev && cloudData.some((c) => c.id === prev)) {
                return prev;
              }
              return cloudData[0].id;
            });
          } else {
            setSelectedEstablishment(null);
            setSelectedId(null);
          }
        }
        const cloudSettings = await sanitationDataService.getSettings();
        if (!isMounted) return;
        if (cloudSettings) {
          setSettings(cloudSettings);
        }

        // ๔. Auto-sync officer profile (avatar, position, etc.) from Supabase Cloud
        const officers = await sanitationDataService.getOfficers();
        if (!isMounted) return;
        if (officers && officers.length > 0) {
          const cur = sanitationDataService.getCurrentOfficer();
          if (cur) {
            const matched = officers.find(o => o.officerCode === cur.officerCode || o.id === cur.id);
            if (matched) {
              const merged = { ...cur, ...matched };
              localStorage.setItem('PNR_CURRENT_OFFICER', JSON.stringify(merged));
              setCurrentOfficer(merged);
            }
          }
        }
      } catch (err) {
        console.warn('Initial data load warning:', err);
      }
    };

    loadCloudData();

    // ๑. Listen for cross-tab and PWA updates via localStorage
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'PNR_SANITATION_ESTABLISHMENTS' || e.key === 'PNR_DELETED_ESTABLISHMENT_IDS' || e.key === 'PNR_CURRENT_OFFICER') {
        loadCloudData();
        const off = sanitationDataService.getCurrentOfficer();
        if (off) setCurrentOfficer(off);
      }
    };
    window.addEventListener('storage', handleStorage);

    // ๒. Listen for BroadcastChannel events from Mobile PWA / Inspections
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('PNR_SANITATION_CHANNEL');
      bc.onmessage = (event: MessageEvent) => {
        if (event.data?.type === 'OFFICER_UPDATED' && event.data?.data) {
          setCurrentOfficer(event.data.data);
        }
        loadCloudData();
      };
    } catch {}

    // ๓. Listen for Supabase Cloud Realtime changes (Instant cross-device sync)
    const unsubRealtime = sanitationDataService.subscribeToChanges(() => {
      loadCloudData();
    });

    // ๔. Re-sync on window focus when testing across devices or apps
    const handleFocus = () => {
      loadCloudData();
    };
    window.addEventListener('focus', handleFocus);

    // ๕. Background polling (ทุก 25 วินาที) สำหรับการสำรองเชื่อมโยง
    const pollTimer = setInterval(() => {
      loadCloudData();
    }, 25000);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
      if (bc) bc.close();
      unsubRealtime();
      clearInterval(pollTimer);
    };
  }, []);

  // Action Handlers
  const handleInspectEstablishment = (est: Establishment) => {
    setSelectedEstablishment(est);
    setSelectedId(est.id);
    setActiveModule('table');
  };

  const handlePrintEstablishment = (
    est?: Establishment | null,
    mode?: OfficialFormCode | string,
    docMode: PrintDocumentMode = 'garuda',
    returnMod: AppModuleType = 'table'
  ) => {
    if (est) {
      setSelectedEstablishment(est);
      setSelectedId(est.id);
      if (mode) setCurrentMode(mode);
      else setCurrentMode(est.regType);
    } else if (establishments.length > 0) {
      setSelectedEstablishment(establishments[0]);
      setSelectedId(establishments[0].id);
    }
    setPrintInitialMode(docMode);
    setReturnModuleAfterPrint(returnMod);
    setActiveModule('print');
  };

  const handlePrintRegisterReport = () => {
    setPrintInitialMode('register_report');
    setReturnModuleAfterPrint('table');
    setActiveModule('print');
  };

  const handlePrintCategoryReport = (category: string, year: string) => {
    setPrintInitialMode('register_report');
    setSelectedCategoryFilter(category);
    setReturnModuleAfterPrint('directory');
    setActiveModule('print');
  };

  const handleOpenFieldKit = (est: Establishment) => {
    setFieldRenewalKitEst(est);
    setIsFieldRenewalKitOpen(true);
  };

  const handleOpenArchive = (est?: Establishment | null) => {
    if (est) {
      setSelectedEstablishment(est);
      setSelectedId(est.id);
    }
    setActiveModule('table');
  };

  const handleViewOnMap = (est: Establishment) => {
    setSelectedEstablishment(est);
    setSelectedId(est.id);
    setActiveModule('dashboard');
  };

  const handleEditEstablishment = (est: Establishment) => {
    setSelectedEstablishment(est);
    setSelectedId(est.id);
    setCurrentMode(est.regType);
    setActiveModule('manual_entry');
  };

  const handleStartNewRequest = (code: OfficialFormCode | string) => {
    setCurrentMode(code);
    setSelectedEstablishment(null);
    setSelectedId(null);
    setIsNewRequestModalOpen(false);
    setActiveModule('manual_entry');
  };

  const handleDeleteEstablishment = async (est: Establishment) => {
    const isConfirmed = await showConfirmDialog({
      title: 'ยืนยันการลบสถานประกอบการ?',
      text: `คุณแน่ใจหรือไม่ว่าต้องการลบ "${est.businessName}" (เลขที่ ${est.regNumber}) ออกจากระบบ? ข้อมูลประวัติและสารบรรณจะถูกลบถาวร`,
      confirmText: 'ใช่, ลบข้อมูล',
      cancelText: 'ยกเลิก',
      icon: 'warning',
      isDanger: true
    });
    if (!isConfirmed) return;

    const remaining = establishments.filter((e) => e.id !== est.id && e.regNumber !== est.regNumber);
    setEstablishments(remaining);
    if (selectedEstablishment?.id === est.id || selectedEstablishment?.regNumber === est.regNumber) {
      setSelectedEstablishment(remaining.length > 0 ? remaining[0] : null);
      setSelectedId(remaining.length > 0 ? remaining[0].id : null);
    }

    await sanitationDataService.deleteEstablishment(est.id, est.regNumber);
    sanitationDataService.logAuditAction({
      action: 'delete',
      actionTitle: `ลบข้อมูลสถานประกอบการ: ${est.businessName}`,
      establishmentId: est.id,
      establishmentName: est.businessName,
      officerName: currentOfficer?.name || settings.signatories?.officerName || 'เจ้าหน้าที่สาธารณสุข',
      officerRole: currentOfficer?.roleName || 'เจ้าหน้าที่สาธารณสุข',
      details: `ลบข้อมูลสถานประกอบการ เลขทะเบียน ${est.regNumber} (${est.categoryName})`
    });
    showToast(`ลบสถานประกอบการ "${est.businessName}" เรียบร้อยแล้ว`, 'success');
  };

  const handleSaveEstablishment = (data: Partial<Establishment>) => {
    const target = data.id
      ? establishments.find((e) => e.id === data.id)
      : data.regNumber
      ? establishments.find((e) => e.regNumber === data.regNumber)
      : selectedEstablishment;

    if (target) {
      const updatedItem: Establishment = { ...target, ...data } as Establishment;
      const updated = establishments.map((e) => (e.id === target.id ? updatedItem : e));
      if (!establishments.some((e) => e.id === target.id)) {
        updated.unshift(updatedItem);
      }
      setEstablishments(updated);
      if (!selectedEstablishment || selectedEstablishment.id === target.id) {
        setSelectedEstablishment(updatedItem);
      }
      sanitationDataService.saveEstablishment(updatedItem);
      sanitationDataService.logAuditAction({
        action: 'update',
        actionTitle: `บันทึก/แก้ไขข้อมูล: ${updatedItem.businessName}`,
        establishmentId: updatedItem.id,
        establishmentName: updatedItem.businessName,
        officerName: currentOfficer?.name || settings.signatories?.officerName || 'เจ้าหน้าที่สาธารณสุข',
        officerRole: currentOfficer?.roleName || 'เจ้าหน้าที่สาธารณสุข',
        details: `อัปเดตข้อมูลสถานประกอบการ เลขทะเบียน ${updatedItem.regNumber}`
      });
      showToast('บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
    } else {
      const newId = `est-${Date.now().toString().slice(-4)}`;
      const newItem: Establishment = {
        id: newId,
        regNumber: data.regNumber || `รหัส-${newId}`,
        businessName: data.businessName || 'สถานประกอบการใหม่',
        ownerName: data.ownerName || '',
        citizenId: data.citizenId || '',
        categoryName: data.categoryName || 'กิจการที่เป็นอันตรายต่อสุขภาพ',
        address: data.address || '',
        village: data.village || 'หมู่ที่ ๑ บ้านโป่งน้ำร้อน',
        phone: data.phone || '',
        regType: (data.regType as OfficialFormCode) || 'สภ.๑',
        status: data.status || 'pending_inspection',
        areaSqm: data.areaSqm || 50,
        workerCount: data.workerCount || 1,
        annualFeeDue: data.annualFeeDue || 'มกราคม',
        feeAmount: data.feeAmount || 500,
        bookNo: data.bookNo || '๐๑',
        docNo: data.docNo || '๐๐๑',
        conditions: data.conditions || [],
        notes: data.notes || '',
        issueDate: data.issueDate || new Date().toISOString().split('T')[0],
        expireDate:
          data.expireDate ||
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lat: data.lat || 19.9328,
        lng: data.lng || 99.1719,
        ...data
      } as Establishment;

      const updated = [newItem, ...establishments];
      setEstablishments(updated);
      setSelectedEstablishment(newItem);
      setSelectedId(newItem.id);
      sanitationDataService.saveEstablishment(newItem);
      sanitationDataService.logAuditAction({
        action: 'create',
        actionTitle: `เพิ่มสถานประกอบการใหม่: ${newItem.businessName}`,
        establishmentId: newItem.id,
        establishmentName: newItem.businessName,
        officerName: currentOfficer?.name || settings.signatories?.officerName || 'เจ้าหน้าที่สาธารณสุข',
        officerRole: currentOfficer?.roleName || 'เจ้าหน้าที่สาธารณสุข',
        details: `สร้างทะเบียนสถานประกอบการใหม่ เลขทะเบียน ${newItem.regNumber}`
      });
      showToast('สร้างสถานประกอบการใหม่เรียบร้อยแล้ว', 'success');
    }
  };

  // Status Counters
  const activeCount = establishments.filter((e) => e.status === 'active').length;
  const inspectionCount = establishments.filter((e) => e.status === 'pending_inspection').length;
  const correctionCount = establishments.filter((e) => e.status === 'pending_correction').length;

  // If opened via QR / link with signToken, show the clean mobile signing view directly
  if (signToken) {
    return <RemoteSignView token={signToken} />;
  }

  // Dedicated Mobile Field Inspector PWA app - fixed for mobile only, separate app / url
  if (isInspectorPwa) {
    return <PublicHealthFieldPwaApp mode="standalone" />;
  }

  return (
    <>
      {/* 1. LOGIN SCREEN GATE (บล็อกระบบจนกว่าจะยืนยัน PIN) */}
      {!isAuthenticated && <OfficerLoginScreen onLoginSuccess={handleLoginSuccess} />}

      {/* 2. MAIN APP (แสดงเฉพาะหลัง login สำเร็จ) */}
      {isAuthenticated && (
        <div className="h-screen w-screen overflow-hidden flex relative bg-[#f3f5f8] text-slate-800 font-sans print:h-auto print:w-auto print:overflow-visible print:bg-white print:text-black ui-scope">
          {/* Left Navigation Sidebar */}
          <AppSidebar
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            activeModule={activeModule}
            onSelectModule={setActiveModule}
            establishmentsCount={establishments.length}
            activeCount={activeCount}
            inspectionCount={inspectionCount}
            correctionCount={correctionCount}
            currentOfficer={currentOfficer}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenAuditLog={() => setIsAuditLogOpen(true)}
            onLogout={handleLogout}
            onFilterTableByStatus={(status) => setTableStatusFilter(status)}
            onOpenPwaQr={() => setIsPwaQrModalOpen(true)}
            selectedCategory={selectedCategoryFilter}
            onSelectCategory={(cat) => setSelectedCategoryFilter(cat)}
            availableYears={availableArchiveYears}
            selectedYear={selectedArchiveYear}
            onSelectYear={(yr) => setSelectedArchiveYear(yr)}
          />

          {/* Right Workspace Area */}
          <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
            {/* Top Header Bar */}
            <AppHeader
              activeModule={activeModule}
              onNavigateHome={() => setActiveModule('dashboard')}
              organizationName={settings.organizationName || 'อบต.โป่งน้ำร้อน'}
              globalSearch={globalSearch}
              onSearchChange={setGlobalSearch}
              onSelectTableModule={() => setActiveModule('table')}
              currentOfficer={currentOfficer}
              onOpenProfile={() => setIsProfileModalOpen(true)}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              onOpenDataSafety={() => setIsDataSafetyModalOpen(true)}
              onOpenPwaQr={() => setIsPwaQrModalOpen(true)}
            />

            {/* Main Content View Switcher */}
            <main className="flex-1 overflow-hidden relative flex bg-transparent print:overflow-visible print:h-auto print:bg-white">
              {/* MODULE 0: UNIFIED COMMAND CENTER DASHBOARD (INCLUDING GIS MAP & KPI) */}
              {(activeModule === 'dashboard' || activeModule === 'map') && (
                <UnifiedMapDashboard
                  establishments={establishments}
                  selectedId={selectedId}
                  onOpenNewRequest={() => setIsNewRequestModalOpen(true)}
                  onNavigateToTable={(filter) => {
                    setTableStatusFilter(filter || 'all');
                    setActiveModule('table');
                  }}
                  onPrintEstablishment={(est) => handlePrintEstablishment(est, est.regType, 'garuda')}
                  onOpenArchive={handleOpenArchive}
                />
              )}

              {/* MODULE 1: TABLE VIEW */}
              {activeModule === 'table' && (
                <EstablishmentTable
                  establishments={establishments}
                  selectedId={selectedId}
                  onSelect={(est) => {
                    setSelectedEstablishment(est);
                    setSelectedId(est.id);
                  }}
                  onInspect={handleInspectEstablishment}
                  onPrint={(est, docMode) => handlePrintEstablishment(est, est.regType, docMode)}
                  onPrintReport={handlePrintRegisterReport}
                  onEdit={handleEditEstablishment}
                  onViewMap={handleViewOnMap}
                  onNewRequest={() => setIsNewRequestModalOpen(true)}
                  onOpenArchive={handleOpenArchive}
                  onOpenFieldKit={handleOpenFieldKit}
                  onDelete={handleDeleteEstablishment}
                  initialStatusFilter={tableStatusFilter}
                  searchQuery={globalSearch}
                  onSearchQueryChange={setGlobalSearch}
                />
              )}

              {/* MODULE: YEARLY DOCUMENT ARCHIVE */}
              {activeModule === 'archive' && (
                <YearlyDocumentArchiveTab
                  establishments={establishments}
                  selectedEstablishment={selectedEstablishment}
                  onSelectEstablishment={(est) => {
                    setSelectedEstablishment(est);
                    setSelectedId(est.id);
                  }}
                  onUpdateEstablishment={(updatedEst) => {
                    handleSaveEstablishment(updatedEst);
                  }}
                  onOpenPrint={(est, docMode) => {
                    setSelectedEstablishment(est);
                    setSelectedId(est.id);
                    setPrintInitialMode(docMode);
                    setActiveModule('print');
                  }}
                  settings={settings}
                  initialYear={selectedArchiveYear}
                />
              )}

              {/* MODULE 1.5: SIMPLE ESTABLISHMENT DIRECTORY */}
              {activeModule === 'directory' && (
                <SimpleEstablishmentDirectory
                  establishments={establishments}
                  onSelectEstablishment={(est) => {
                    setSelectedEstablishment(est);
                    setSelectedId(est.id);
                  }}
                  onPrintEstablishment={(est, regType, docMode) =>
                    handlePrintEstablishment(est, regType, docMode, 'directory')
                  }
                  onPrintCategoryReport={handlePrintCategoryReport}
                  onOpenArchive={(est) => {
                    setSelectedEstablishment(est);
                    setSelectedId(est.id);
                    setActiveModule('archive');
                  }}
                  onUpdateEstablishment={(updatedEst) => handleSaveEstablishment(updatedEst)}
                  activeCategoryFilter={selectedCategoryFilter}
                  onCategoryFilterChange={(cat) => setSelectedCategoryFilter(cat)}
                />
              )}

              {/* MODULE 4: PRINT CERTIFICATE & REGISTER REPORT */}
              {activeModule === 'print' && (
                <div className="flex-1 h-full overflow-hidden bg-transparent flex flex-col print:overflow-visible print:h-auto print:bg-white p-3 md:p-5">
                  <OfficialCertificatePrint
                    establishment={selectedEstablishment || establishments[0]}
                    establishments={establishments}
                    formCode={currentMode}
                    municipalityName={municipality}
                    initialMode={printInitialMode}
                    initialReportCategory={selectedCategoryFilter}
                    initialReportYear={String(selectedArchiveYear)}
                    settings={settings}
                    onClose={() => setActiveModule(returnModuleAfterPrint || 'table')}
                  />
                </div>
              )}

              {/* MODULE 3: UPLOAD PDF VIEW */}
              {(activeModule === 'upload_pdf' || activeModule === 'intake') && (
                <PdfUploadView
                  onSaveEstablishment={(newEst) => {
                    handleSaveEstablishment(newEst);
                    setSelectedEstablishment(newEst);
                    setSelectedId(newEst.id);
                    setActiveModule('table');
                  }}
                  onNavigateToPrint={(newEst) => {
                    handleSaveEstablishment(newEst);
                    setSelectedEstablishment(newEst);
                    setSelectedId(newEst.id);
                    setPrintInitialMode('garuda');
                    setActiveModule('print');
                  }}
                  onNavigateToTable={() => setActiveModule('table')}
                  settings={settings}
                />
              )}

              {/* MODULE 4: MANUAL ENTRY VIEW */}
              {activeModule === 'manual_entry' && (
                <ManualEntryView
                  onSaveEstablishment={(newEst) => {
                    handleSaveEstablishment(newEst);
                    setSelectedEstablishment(newEst);
                    setSelectedId(newEst.id);
                    setActiveModule('table');
                  }}
                  onNavigateToPrint={(newEst) => {
                    handleSaveEstablishment(newEst);
                    setSelectedEstablishment(newEst);
                    setSelectedId(newEst.id);
                    setPrintInitialMode('garuda');
                    setActiveModule('print');
                  }}
                  onNavigateToTable={() => setActiveModule('table')}
                  settings={settings}
                />
              )}

            </main>
          </div>
        </div>
      )}

      {/* 3. MODALS */}
      <NewRequestModal
        isOpen={isNewRequestModalOpen}
        onClose={() => setIsNewRequestModalOpen(false)}
        onSelectForm={(formCode) => handleStartNewRequest(formCode)}
      />

      {isFieldRenewalKitOpen && fieldRenewalKitEst && (
        <FieldRenewalKitModal
          isOpen={isFieldRenewalKitOpen}
          onClose={() => setIsFieldRenewalKitOpen(false)}
          establishment={fieldRenewalKitEst}
          settings={settings}
        />
      )}

      {isSettingsModalOpen && (
        <SystemSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          settings={settings}
          onSaveSettings={handleSaveSettings}
          establishments={establishments}
          onImportEstablishments={(data) => setEstablishments(data)}
          onOpenProfile={() => {
            setIsSettingsModalOpen(false);
            setIsProfileModalOpen(true);
          }}
        />
      )}

      {isAuditLogOpen && (
        <AuditLogModal
          isOpen={isAuditLogOpen}
          onClose={() => setIsAuditLogOpen(false)}
          onSelectEstablishment={(estId) => {
            const est = establishments.find((e) => e.id === estId);
            if (est) {
              setSelectedEstablishment(est);
              setSelectedId(est.id);
              setActiveModule('table');
            }
          }}
        />
      )}

      {isOfficerLoginOpen && (
        <OfficerLoginModal
          isOpen={isOfficerLoginOpen}
          onClose={() => setIsOfficerLoginOpen(false)}
          currentOfficer={currentOfficer}
          onOfficerChange={handleOfficerChange}
        />
      )}

      {isProfileModalOpen && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentOfficer={currentOfficer}
          onOfficerChange={handleOfficerChange}
        />
      )}

      {/* SSSS Zero-Loss Data Safety & Disaster Recovery Modal */}
      <DataSafetyModal
        isOpen={isDataSafetyModalOpen}
        onClose={() => setIsDataSafetyModalOpen(false)}
        establishments={establishments}
        onDataRestored={async () => {
          const fresh = await sanitationDataService.getEstablishments();
          setEstablishments(fresh);
          setIsDataSafetyModalOpen(false);
          showToast('กู้คืนฐานข้อมูลและอัปเดตหน้าจอเรียบร้อยแล้ว', 'success');
        }}
      />

      {/* PWA Mobile App QR Code & Connection Modal */}
      <PwaQrModal
        isOpen={isPwaQrModalOpen}
        onClose={() => setIsPwaQrModalOpen(false)}
      />
    </>
  );
};

export default App;
