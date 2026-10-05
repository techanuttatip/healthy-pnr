import React, { useState, useEffect } from 'react';
import type {
  Establishment,
  OfficialFormCode,
  SystemSettings,
  PrintDocumentMode
} from './types/publicHealth';
import { DEFAULT_SYSTEM_SETTINGS } from './types/publicHealth';
import { INITIAL_ESTABLISHMENTS } from './services/publicHealthMockData';
import { sanitationDataService, DEFAULT_OFFICERS, type OfficerAccount } from './services/sanitationDataService';
import { showConfirmDialog, showToast } from './utils/sweetAlert';

// 1. Layout Components
import { AppSidebar, AppHeader, OfficerLoginScreen, type AppModuleType } from './components/layout';

// 2. Functional Domain Views
import { PublicHealthDashboard } from './components/dashboard';
import { EstablishmentTable, NewRequestModal } from './components/registry';
import { YearlyDocumentArchiveTab, SmartPdfIntakeView } from './components/archive';
import { GisMapModuleView } from './components/gis';
import { OfficialCertificatePrint } from './components/print';

// 3. Inspection & System Modals
import { FieldRenewalKitModal } from './components/inspection';
import { SystemSettingsModal, UserProfileModal, OfficerLoginModal, AuditLogModal, DataSafetyModal } from './components/system';

export const App: React.FC = () => {
  // 1. Core Establishments State
  const [establishments, setEstablishments] = useState<Establishment[]>(() => {
    try {
      const deletedIds: string[] = JSON.parse(localStorage.getItem('PNR_DELETED_ESTABLISHMENT_IDS') || '[]');
      const saved = localStorage.getItem('PNR_SANITATION_ESTABLISHMENTS');
      if (saved) {
        const parsed: Establishment[] = JSON.parse(saved);
        const filtered = parsed.filter(e => !deletedIds.includes(e.id) && !deletedIds.includes(e.regNumber));
        if (filtered.length > 0) return filtered;
      }
      if (!deletedIds.includes('est-044') && !deletedIds.includes('บทส-69-0044')) {
        return INITIAL_ESTABLISHMENTS;
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
      if (saved) {
        const parsed: Establishment[] = JSON.parse(saved);
        const valid = parsed.filter(e => !deletedIds.includes(e.id) && !deletedIds.includes(e.regNumber));
        if (valid.length > 0) return valid[0];
      }
      if (!deletedIds.includes('est-044') && !deletedIds.includes('บทส-69-0044') && INITIAL_ESTABLISHMENTS.length > 0) {
        return INITIAL_ESTABLISHMENTS[0];
      }
      return null;
    } catch {
      return null;
    }
  });

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    return selectedEstablishment ? selectedEstablishment.id : null;
  });

  // 2. Active Module & Navigation State
  const [activeModule, setActiveModule] = useState<AppModuleType>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const mod = params.get('module');
      if (mod && ['dashboard', 'table', 'intake', 'archive', 'map', 'print'].includes(mod)) {
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // 3. Modals State
  const [isFieldRenewalKitOpen, setIsFieldRenewalKitOpen] = useState<boolean>(false);
  const [fieldRenewalKitEst, setFieldRenewalKitEst] = useState<Establishment | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState<boolean>(false);
  const [isOfficerLoginOpen, setIsOfficerLoginOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isDataSafetyModalOpen, setIsDataSafetyModalOpen] = useState<boolean>(false);
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

  // Initial Data Load (Supabase Cloud + LocalStorage fallback)
  useEffect(() => {
    const loadCloudData = async () => {
      try {
        const cloudData = await sanitationDataService.getEstablishments();
        if (cloudData) {
          setEstablishments(cloudData);
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
        if (cloudSettings) {
          setSettings(cloudSettings);
        }
      } catch (err) {
        console.warn('Initial data load warning:', err);
      }
    };
    loadCloudData();
  }, []);

  // Action Handlers
  const handleInspectEstablishment = (est: Establishment) => {
    setSelectedEstablishment(est);
    setSelectedId(est.id);
    setActiveModule('archive');
  };

  const handlePrintEstablishment = (
    est?: Establishment | null,
    mode?: OfficialFormCode | string,
    docMode: PrintDocumentMode = 'garuda'
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
    setActiveModule('print');
  };

  const handlePrintRegisterReport = () => {
    setPrintInitialMode('register_report');
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
    setActiveModule('archive');
  };

  const handleViewOnMap = (est: Establishment) => {
    setSelectedEstablishment(est);
    setSelectedId(est.id);
    setActiveModule('map');
  };

  const handleEditEstablishment = (est: Establishment) => {
    setSelectedEstablishment(est);
    setSelectedId(est.id);
    setCurrentMode(est.regType);
    setActiveModule('intake');
  };

  const handleStartNewRequest = (code: OfficialFormCode | string) => {
    setCurrentMode(code);
    setSelectedEstablishment(null);
    setSelectedId(null);
    setIsNewRequestModalOpen(false);
    setActiveModule('intake');
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

  return (
    <>
      {/* 1. LOGIN SCREEN GATE (บล็อกระบบจนกว่าจะยืนยัน PIN) */}
      {!isAuthenticated && <OfficerLoginScreen onLoginSuccess={handleLoginSuccess} />}

      {/* 2. MAIN APP (แสดงเฉพาะหลัง login สำเร็จ) */}
      {isAuthenticated && (
        <div className="h-screen w-screen overflow-hidden flex relative bg-slate-900 text-slate-800 font-sans print:h-auto print:w-auto print:overflow-visible print:bg-white print:text-black">
          {/* Full-screen Panoramic Landscape Background (Pong Nam Ron) */}
          <div className="gov-panoramic-bg" />
          <div className="absolute inset-0 bg-gradient-to-b from-sky-950/20 via-slate-100/60 to-slate-100/90 pointer-events-none" />

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
            />

            {/* Main Content View Switcher */}
            <main className="flex-1 overflow-hidden relative flex bg-transparent print:overflow-visible print:h-auto print:bg-white">
              {/* MODULE 0: EXECUTIVE DASHBOARD */}
              {activeModule === 'dashboard' && (
                <PublicHealthDashboard
                  establishments={establishments}
                  onOpenNewRequest={() => setIsNewRequestModalOpen(true)}
                  onNavigateToTable={(filter) => {
                    setTableStatusFilter(filter || 'all');
                    setActiveModule('table');
                  }}
                  onNavigateToMap={() => setActiveModule('map')}
                  onInspectEstablishment={handleInspectEstablishment}
                  onPrintEstablishment={(est) => handlePrintEstablishment(est, est.regType, 'garuda')}
                  onPrintReport={handlePrintRegisterReport}
                  onEditEstablishment={handleEditEstablishment}
                  onOpenSettings={() => setIsSettingsModalOpen(true)}
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
                />
              )}

              {/* MODULE 2: GIS MAP VIEW */}
              {activeModule === 'map' && (
                <GisMapModuleView
                  establishments={establishments}
                  selectedEstablishment={selectedEstablishment}
                  selectedId={selectedId}
                  onSelectEstablishment={(est) => {
                    setSelectedEstablishment(est);
                    setSelectedId(est.id);
                  }}
                  onInspectEstablishment={handleInspectEstablishment}
                  onPrintEstablishment={(est) => handlePrintEstablishment(est, est.regType)}
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
                    settings={settings}
                    onClose={() => setActiveModule('table')}
                  />
                </div>
              )}

              {/* MODULE 3: SMART PDF INTAKE VIEW */}
              {activeModule === 'intake' && (
                <SmartPdfIntakeView
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
    </>
  );
};

export default App;
