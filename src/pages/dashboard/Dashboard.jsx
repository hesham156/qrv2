import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
// Dashboard Component
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { UserPlus, LogOut, Plus, AlertCircle } from 'lucide-react';
// استيراد المكونات الفرعية
import EmployeeCard from '../../components/dashboard/EmployeeCard'; // Keep eager for cards
import EmployeeForm from '../../components/dashboard/EmployeeForm'; // Keep eager for speed or lazy? Form is heavy, maybe lazy.
import CardDetailsView from '../../components/dashboard/CardDetailsView'; // New View
import DashboardLayout from '../../layouts/DashboardLayout';
import AdminView from '../admin/AdminView'; // Heavy
import AnalyticsView from './AnalyticsView'; // Heavy
import LeadsView from './LeadsView'; // Heavy
import ProductsView from './ProductsView';
import TasksView from './TasksView';
import TaskDetailsModal from '../../components/dashboard/TaskDetailsModal';
import OnboardingWizard from '../../components/onboarding/OnboardingWizard';
import { updateDoc } from 'firebase/firestore';

import { useSEO } from '../../hooks/useSEO';
import { isItemLocked } from '../../utils/planHelpers';
import PageTransition from '../../components/ui/PageTransition';

// Lazy Load Modals
const QRModal = lazy(() => import('../../components/modals/QRModal'));
const AnalyticsModal = lazy(() => import('../../components/modals/AnalyticsModal'));
const LeadsListModal = lazy(() => import('../../components/modals/LeadsListModal'));
const PreviewModal = lazy(() => import('../../components/modals/PreviewModal'));
const ProductsManagerModal = lazy(() => import('../../components/modals/ProductsManagerModal'));
const PortfolioManagerModal = lazy(() => import('../../components/modals/PortfolioManagerModal'));
const StoriesManagerModal = lazy(() => import('../../components/modals/StoriesManagerModal'));
const SettingsModal = lazy(() => import('../../components/modals/SettingsModal'));
const UpgradeModal = lazy(() => import('../../components/modals/UpgradeModal'));

export default function Dashboard({ user, onLogout, lang, toggleLang, t, installPrompt, onInstall }) {
  useSEO("Dashboard", "Manage your digital business cards and analyze performance.");


  const [searchParams, setSearchParams] = useSearchParams();

  // State primarily derived from URL now, but we keep these for compatibility 
  // and easy binding to modals. They will be synchronized in useEffect.
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)

  const [analyticsEmployee, setAnalyticsEmployee] = useState(null)
  const [leadsEmployee, setLeadsEmployee] = useState(null)
  const [previewEmployee, setPreviewEmployee] = useState(null)
  const [productManagerEmployee, setProductManagerEmployee] = useState(null)
  const [storiesManagerEmployee, setStoriesManagerEmployee] = useState(null)
  const [qrEmployee, setQrEmployee] = useState(null)

  const [portfolioModal, setPortfolioModal] = useState(null)
  const [taskModal, setTaskModal] = useState(null)

  // New: Selected Card for Dashboard View
  const [selectedCardId, setSelectedCardId] = useState(null)
  const [selectedCardData, setSelectedCardData] = useState(null)

  const [employees, setEmployees] = useState([])
  const [permissionError, setPermissionError] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [currentView, setCurrentView] = useState('cards'); // 'cards', 'analytics', 'leads', 'products', 'card_details'
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Show onboarding if no employees and not skipped
    if (employees.length === 0 && !user?.hasSkippedOnboarding && !permissionError) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [employees.length, user?.hasSkippedOnboarding, permissionError]);

  const handleSkipOnboarding = async () => {
    setShowOnboarding(false);
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), {
        hasSkippedOnboarding: true
      });
    } catch (e) {
      console.error("Error skipping onboarding:", e);
    }
  };

  useEffect(() => {
    if (!user) return

    const q = collection(db, "artifacts", appId, "users", user.uid, "employees")

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setPermissionError(false)
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        setEmployees(docs)
      },
      (error) => {
        console.error("Error fetching employees:", error)
        if (error.code === "permission-denied") {
          setPermissionError(true)
        }
      },
    )

    return () => unsubscribe()

  }, [user])

  // --- URL State Synchronization ---
  useEffect(() => {
    const modalType = searchParams.get('modal');
    const cardId = searchParams.get('cardId');
    const viewType = searchParams.get('view'); // New param

    // Helper to find employee
    const findEmp = () => employees.find(e => e.id === cardId) || null;

    // Reset all first
    setIsFormOpen(false);
    setQrEmployee(null);
    setAnalyticsEmployee(null);
    setLeadsEmployee(null);
    setPreviewEmployee(null);
    setProductManagerEmployee(null);
    setStoriesManagerEmployee(null);
    setPortfolioModal(null);

    // Handle View Switching (Main Dashboard vs Single Card)
    if (viewType === 'card' && cardId) {
      setCurrentView('card_details');
      setSelectedCardId(cardId);
      // We need to set the data. if employees loaded, set it.
      const emp = employees.find(e => e.id === cardId);
      if (emp) setSelectedCardData(emp);
    } else if (currentView === 'card_details' && !viewType) {
      // If URL cleared but state is card_details, go back
      setCurrentView('cards');
      setSelectedCardId(null);
      setSelectedCardData(null);
    }

    if (!modalType) return;

    const emp = findEmp();

    // Map URL to State
    switch (modalType) {
      case 'create':
        setEditingEmployee(null);
        setIsFormOpen(true);
        break;
      case 'edit':
        if (emp) {
          setEditingEmployee(emp);
          setIsFormOpen(true);
        }
        break;
      case 'qr':
        setQrEmployee(emp);
        break;
      case 'analytics':
        setAnalyticsEmployee(emp);
        break;
      case 'leads':
        setLeadsEmployee(emp);
        break;
      case 'preview':
        setPreviewEmployee(emp);
        break;
      case 'products':
        setProductManagerEmployee(emp);
        break;
      case 'stories':
        setStoriesManagerEmployee(emp);
        break;
      case 'portfolio':
        setPortfolioModal(emp);
        break;
      default:
        break;
    }
  }, [searchParams, employees, currentView]); // Added dependencies

  // --- Handlers (Now just update URL) ---
  const closeModal = () => {
    // Keep the 'view' and 'id' params if we are in card mode
    if (currentView === 'card_details' && selectedCardId) {
      setSearchParams({ view: 'card', cardId: selectedCardId });
    } else {
      setSearchParams({});
    }
  };

  const handleEdit = (employee) => setSearchParams({ modal: 'edit', cardId: employee.id });

  // New Handler for Managing Card (Deep Dive)
  const handleManageCard = (employee) => {
    // Navigate to dedicated route
    // Since we are in Dashboard, we can use navigation
    // But Dashboard is lazily loaded... Wait, we are in Dashboard.jsx.
    // We need useNavigate.
    // Let's add useNavigate hook at top.

    // Actually, simpler:
    window.location.href = `/dashboard/card/${employee.id}`;
    // Or prefer SPA navigation if possible, but Dashboard code needs refactor to import useNavigate.
    // Let's assume we can just redirect for now or refactor to use hook.
  };

  const handleBackToDashboard = () => setSearchParams({});

  const handleAddNew = () => {
    // Subscription Limit Check
    const plan = user?.plan || 'free';
    if (plan === 'free' && employees.length >= 1) {
      setShowUpgradeModal(true);
      return;
    }
    setSearchParams({ modal: 'create' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    show: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <DashboardLayout
      currentView={currentView}
      setCurrentView={setCurrentView}
      user={user}
      onLogout={onLogout}
      t={t}
      lang={lang}
      toggleLang={toggleLang}
      onOpenSettings={() => setIsSettingsOpen(true)}
      headerActions={
        currentView === 'cards' && (
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all text-sm shadow-lg shadow-brand-200 hover:shadow-brand-300 hover:-translate-y-0.5"
          >
            <Plus size={20} strokeWidth={3} />
            <span className="hidden sm:inline">{t.addNew || "Add New"}</span>
          </button>
        )
      }
    >

      {/* Main Content Logic */}
      {currentView === 'cards' && (
        <>
          {permissionError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <div className="text-red-500 mt-1">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-red-800 font-bold mb-1">{t.alertTitle}</h3>
                <p className="text-red-600 text-sm">{t.alertMsg}</p>
              </div>
            </div>
          )}

          {employees.length === 0 && !permissionError ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300 shadow-soft">
              <div className="w-20 h-20 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow animate-float">
                <UserPlus size={40} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">{t.noCards || "No Digital Cards Found"}</h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
                {t.noCardsSub || "Get started by creating your first professional digital business card."}
              </p>
              <button
                onClick={handleAddNew}
                className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <Plus size={20} />
                {t.addFirst || "Create Card"}
              </button>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20"
            >
              {employees.filter(emp => !emp.hidden).map((employee, index) => {
                const isLocked = isItemLocked(index, user);
                return (
                  <motion.div variants={itemVariants} key={employee.id} className="relative">
                    <EmployeeCard
                      employee={employee}
                      userId={user.uid}
                      t={t}
                      lang={lang}
                      onDelete={() => {
                        // Delete logic remains direct as it's not a modal
                        if (window.confirm(t.deleteConfirm)) {
                          (async () => {
                            try {
                              if (employee.slug) await deleteDoc(doc(db, "artifacts", appId, "public", "data", "slugs", employee.slug));
                              await deleteDoc(doc(db, "artifacts", appId, "users", user.uid, "employees", employee.id));
                            } catch (e) { console.error(e); window.alert(t.deleteError); }
                          })();
                        }
                      }}
                      onEdit={() => !isLocked && handleEdit(employee)}
                      onManage={() => !isLocked && handleManageCard(employee)} // New Prop
                      onShowQR={() => !isLocked && setSearchParams({ modal: 'qr', cardId: employee.id })}
                      onShowAnalytics={() => !isLocked && setSearchParams({ modal: 'analytics', cardId: employee.id })}
                      onShowLeads={() => !isLocked && setSearchParams({ modal: 'leads', cardId: employee.id })}
                      onPreview={() => !isLocked && setSearchParams({ modal: 'preview', cardId: employee.id })}
                      onManageProducts={() => !isLocked && setSearchParams({ modal: 'products', cardId: employee.id })}
                      onManageStories={() => !isLocked && setSearchParams({ modal: 'stories', cardId: employee.id })}
                      onManagePortfolio={() => !isLocked && setSearchParams({ modal: 'portfolio', cardId: employee.id })}
                    />

                    {isLocked && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 rounded-2xl flex flex-col items-center justify-center text-center p-4 border border-slate-200">
                        <div className="bg-white p-3 rounded-full shadow-lg mb-3">
                          <LogOut className="text-slate-400" size={24} />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-1">{t.planExpiry || "Plan Limit Reached"}</h3>
                        <p className="text-xs text-slate-500 mb-4 max-w-[200px] mx-auto">
                          {t.upgradeMsg || "Upgrade to unlock this card."}
                        </p>
                        <button
                          onClick={() => setShowUpgradeModal(true)}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-indigo-700 transition-colors"
                        >
                          {t.upgradeBtn || "Upgrade Now"}
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </>
      )}

      {/* Placeholders for other views (Or we could render different components) */}
      {currentView === 'card_details' && selectedCardData && (
        <CardDetailsView
          employee={selectedCardData}
          onBack={handleBackToDashboard}
          t={t}
          lang={lang}
          onAction={(actionId) => {
            if (actionId === 'preview') setSearchParams({ view: 'card', cardId: selectedCardId, modal: 'preview' });
            else setSearchParams({ view: 'card', cardId: selectedCardId, modal: actionId });
          }}
        />
      )}

      {currentView === 'analytics' && (
        <AnalyticsView employees={employees} user={user} />
      )}

      {currentView === 'leads' && (
        <LeadsView employees={employees} user={user} t={t} />
      )}

      {currentView === 'products' && (
        <ProductsView

          employees={employees}
          onManageProducts={(emp) => setSearchParams({ modal: 'products', cardId: emp.id })}
          t={t}
        />
      )}

      {currentView === 'tasks' && (
        <TasksView
          employees={employees}
          user={user}
          t={t}
          openTaskModal={setTaskModal}
        />
      )}

      {currentView === 'admin' && (
        <PageTransition><AdminView t={t} /></PageTransition>
      )}

      {isFormOpen && (
        <EmployeeForm onClose={closeModal} initialData={editingEmployee} userId={user.uid} user={user} t={t} />
      )}

      {/* Render QRModal with lang prop */}
      <Suspense fallback={null}>
        {qrEmployee && (
          <QRModal employee={qrEmployee} userId={user.uid} user={user} onClose={closeModal} t={t} lang={lang} />
        )}

        {/* Render AnalyticsModal with lang prop */}
        {analyticsEmployee && (
          <AnalyticsModal employee={analyticsEmployee} onClose={closeModal} t={t} lang={lang} />
        )}

        {/* Render LeadsListModal with lang prop */}
        {leadsEmployee && (
          <LeadsListModal
            userId={user.uid}
            employee={leadsEmployee}
            onClose={closeModal}
            t={t}
            lang={lang}
          />
        )}

        {previewEmployee && (
          <PreviewModal employee={previewEmployee} userId={user.uid} onClose={closeModal} t={t} />
        )}

        {productManagerEmployee && (
          <ProductsManagerModal
            userId={user.uid}
            employee={productManagerEmployee}
            onClose={closeModal}
            t={t}
            user={user}
            onUpgrade={() => setShowUpgradeModal(true)}
          />
        )}

        {storiesManagerEmployee && (
          <StoriesManagerModal
            userId={user.uid}
            employee={storiesManagerEmployee}
            onClose={closeModal}
            t={t}
          />
        )}

        {portfolioModal && (
          <PortfolioManagerModal
            userId={user.uid}
            employee={portfolioModal}
            onClose={closeModal}
            t={t}
            user={user}
            onUpgrade={() => setShowUpgradeModal(true)}
          />
        )}

        {taskModal && (
          <TaskDetailsModal
            employee={taskModal}
            userId={user.uid}
            onClose={() => setTaskModal(null)}
            t={t}
          />
        )}

        {isSettingsOpen && (
          <SettingsModal
            onClose={() => setIsSettingsOpen(false)}
            user={user}
            t={t}
            lang={lang}
          />
        )}

        {showUpgradeModal && (
          <UpgradeModal
            onClose={() => setShowUpgradeModal(false)}
            t={t}
          />
        )}
      </Suspense>

      {showOnboarding && (
        <OnboardingWizard
          user={user}
          t={t}
          onComplete={() => setShowOnboarding(false)}
          onSkip={handleSkipOnboarding}
        />
      )}

    </DashboardLayout>
  )
}