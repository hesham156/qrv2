import React, { useState, useEffect, lazy, Suspense } from 'react';
// Dashboard Component
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { UserPlus, LogOut, Plus, AlertCircle } from 'lucide-react';
// استيراد المكونات الفرعية
import EmployeeCard from '../../components/dashboard/EmployeeCard'; // Keep eager for cards
import EmployeeForm from '../../components/dashboard/EmployeeForm'; // Keep eager for speed or lazy? Form is heavy, maybe lazy.
import DashboardLayout from '../../layouts/DashboardLayout';
import AdminView from '../admin/AdminView'; // Heavy
import AnalyticsView from './AnalyticsView'; // Heavy
import LeadsView from './LeadsView'; // Heavy
import ProductsView from './ProductsView';

import { useSEO } from '../../hooks/useSEO';
import { isItemLocked } from '../../utils/planHelpers';

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


  const [employees, setEmployees] = useState([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  // const [selectedEmployee, setSelectedEmployee] = useState(null) // Unused
  const [analyticsEmployee, setAnalyticsEmployee] = useState(null)
  const [leadsEmployee, setLeadsEmployee] = useState(null)
  const [previewEmployee, setPreviewEmployee] = useState(null)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [permissionError, setPermissionError] = useState(false)
  const [productManagerEmployee, setProductManagerEmployee] = useState(null)
  const [storiesManagerEmployee, setStoriesManagerEmployee] = useState(null)
  const [qrEmployee, setQrEmployee] = useState(null) // New state for QR Modal
  const [portfolioModal, setPortfolioModal] = useState(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [currentView, setCurrentView] = useState('cards'); // 'cards', 'analytics', 'leads', 'products'
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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

  const handleDelete = async (emp) => {
    if (window.confirm(t.deleteConfirm)) {
      try {
        if (emp.slug) {
          await deleteDoc(doc(db, "artifacts", appId, "public", "data", "slugs", emp.slug))
        }
        await deleteDoc(doc(db, "artifacts", appId, "users", user.uid, "employees", emp.id))
      } catch (e) {
        console.error("Error deleting:", e)
        window.alert(t.deleteError)
      }
    }
  }

  const handleEdit = (employee) => {
    setEditingEmployee(employee)
    setIsFormOpen(true)
  }

  const handleAddNew = () => {
    // Subscription Limit Check
    const plan = user?.plan || 'free';
    if (plan === 'free' && employees.length >= 1) {
      setShowUpgradeModal(true);
      return;
    }
    setEditingEmployee(null)
    setIsFormOpen(true)
  }

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
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-all text-sm shadow-sm hover:shadow-md"
          >
            <Plus size={18} strokeWidth={2.5} />
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
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{t.noCards}</h3>
              <p className="text-slate-500 mb-6">{t.noCardsSub}</p>
              <button onClick={handleAddNew} className="text-blue-600 font-bold hover:underline">
                {t.addFirst}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map((employee, index) => {
                const isLocked = isItemLocked(index, user);
                return (
                  <div key={employee.id} className="relative">
                    <EmployeeCard
                      employee={employee}
                      userId={user.uid}
                      t={t}
                      lang={lang}
                      onDelete={() => handleDelete(employee)}
                      onEdit={() => !isLocked && handleEdit(employee)}
                      onShowQR={() => !isLocked && setQrEmployee(employee)}
                      onShowAnalytics={() => !isLocked && setAnalyticsEmployee(employee)}
                      onShowLeads={() => !isLocked && setLeadsEmployee(employee)}
                      onPreview={() => !isLocked && setPreviewEmployee(employee)}
                      onManageProducts={() => !isLocked && setProductManagerEmployee(employee)}
                      onManageStories={() => !isLocked && setStoriesManagerEmployee(employee)}
                      onManagePortfolio={() => !isLocked && setPortfolioModal(employee)}
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
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Placeholders for other views (Or we could render different components) */}
      {currentView === 'analytics' && (
        <AnalyticsView employees={employees} user={user} />
      )}

      {currentView === 'leads' && (
        <LeadsView employees={employees} user={user} />
      )}

      {currentView === 'products' && (
        <ProductsView
          employees={employees}
          onManageProducts={setProductManagerEmployee}
          t={t}
        />
      )}

      {currentView === 'admin' && (
        <AdminView t={t} />
      )}

      {isFormOpen && (
        <EmployeeForm onClose={() => setIsFormOpen(false)} initialData={editingEmployee} userId={user.uid} user={user} t={t} />
      )}

      {/* Render QRModal with lang prop */}
      <Suspense fallback={null}>
        {qrEmployee && (
          <QRModal employee={qrEmployee} userId={user.uid} onClose={() => setQrEmployee(null)} t={t} lang={lang} />
        )}

        {/* Render AnalyticsModal with lang prop */}
        {analyticsEmployee && (
          <AnalyticsModal employee={analyticsEmployee} onClose={() => setAnalyticsEmployee(null)} t={t} lang={lang} />
        )}

        {/* Render LeadsListModal with lang prop */}
        {leadsEmployee && (
          <LeadsListModal
            userId={user.uid}
            employee={leadsEmployee}
            onClose={() => setLeadsEmployee(null)}
            t={t}
            lang={lang}
          />
        )}

        {previewEmployee && (
          <PreviewModal employee={previewEmployee} userId={user.uid} onClose={() => setPreviewEmployee(null)} t={t} />
        )}

        {productManagerEmployee && (
          <ProductsManagerModal
            userId={user.uid}
            employee={productManagerEmployee}
            onClose={() => setProductManagerEmployee(null)}
            t={t}
            user={user}
            onUpgrade={() => setShowUpgradeModal(true)}
          />
        )}

        {storiesManagerEmployee && (
          <StoriesManagerModal
            userId={user.uid}
            employee={storiesManagerEmployee}
            onClose={() => setStoriesManagerEmployee(null)}
            t={t}
          />
        )}

        {portfolioModal && (
          <PortfolioManagerModal
            userId={user.uid}
            employee={portfolioModal}
            onClose={() => setPortfolioModal(null)}
            t={t}
            user={user}
            onUpgrade={() => setShowUpgradeModal(true)}
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

    </DashboardLayout>
  )
}