import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, Routes, Route, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import SingleCardLayout from '../../layouts/SingleCardLayout';
import CardDetailsView from '../../components/dashboard/CardDetailsView';
import EmployeeForm from '../../components/dashboard/EmployeeForm';
import ProductsManagerModal from '../../components/modals/ProductsManagerModal';
import StoriesManagerModal from '../../components/modals/StoriesManagerModal';
import PortfolioManagerModal from '../../components/modals/PortfolioManagerModal';
import AnalyticsModal from '../../components/modals/AnalyticsModal';
import LeadsListModal from '../../components/modals/LeadsListModal';
import BrandedLoader from '../../components/ui/BrandedLoader';

// Lazy load specific heavy modals if needed, but for embedded dashboard we might want them eager or mostly eager
// For now, importing eager is safer for layout consistency.

export default function SingleCardDashboard({ user, t, lang, onLogout, toggleLang }) {
    const { cardId } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !cardId) return;

        const docRef = doc(db, "artifacts", appId, "users", user.uid, "employees", cardId);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setEmployee({ id: docSnap.id, ...docSnap.data() });
            } else {
                // Handle not found
                navigate('/dashboard');
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching card:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, cardId, navigate]);

    if (loading) return <BrandedLoader />;
    if (!employee) return null;

    return (
        <Routes>
            <Route element={<SingleCardLayout
                t={t}
                lang={lang}
                employee={employee}
                user={user}
                onLogout={onLogout}
                toggleLang={toggleLang}
            />}>
                {/* Overview */}
                <Route index element={
                    <CardDetailsView
                        employee={employee}
                        t={t}
                        lang={lang}
                        onBack={() => navigate('/dashboard')}
                        onAction={(actionId) => {
                            if (actionId === 'edit') navigate('edit');
                            else if (actionId === 'seo') navigate('seo');
                            else if (actionId === 'products') navigate('products');
                            else if (actionId === 'stories') navigate('stories');
                            else if (actionId === 'portfolio') navigate('portfolio');
                            else if (actionId === 'analytics') navigate('analytics');
                            else if (actionId === 'leads') navigate('leads');
                        }}
                    />
                } />

                {/* Edit (General/Contact/Design) */}
                <Route path="edit" element={
                    <EmployeeForm
                        isEmbedded={true}
                        initialTab="general"
                        initialData={employee}
                        userId={user.uid}
                        user={user}
                        t={t}
                        onClose={() => navigate('..')}
                    />
                } />

                {/* SEO */}
                <Route path="seo" element={
                    <EmployeeForm
                        isEmbedded={true}
                        initialTab="seo"
                        initialData={employee}
                        userId={user.uid}
                        user={user}
                        t={t}
                        onClose={() => navigate('..')}
                    />
                } />

                {/* Booking */}
                <Route path="booking" element={
                    <EmployeeForm
                        isEmbedded={true}
                        initialTab="availability"
                        initialData={employee}
                        userId={user.uid}
                        user={user}
                        t={t}
                        onClose={() => navigate('..')}
                    />
                } />

                {/* Products */}
                <Route path="products" element={
                    <ProductsManagerModal
                        isEmbedded={true}
                        employee={employee}
                        userId={user.uid}
                        user={user}
                        t={t}
                        onClose={() => navigate('..')}
                    />
                } />

                {/* Stories */}
                <Route path="stories" element={
                    <StoriesManagerModal
                        isEmbedded={true}
                        employee={employee}
                        userId={user.uid}
                        t={t}
                        onClose={() => navigate('..')}
                    />
                } />

                {/* Portfolio */}
                <Route path="portfolio" element={
                    <PortfolioManagerModal
                        isEmbedded={true}
                        employee={employee}
                        userId={user.uid}
                        user={user}
                        t={t}
                        onClose={() => navigate('..')}
                    />
                } />

                {/* Analytics */}
                <Route path="analytics" element={
                    <AnalyticsModal
                        isEmbedded={true}
                        employee={employee}
                        t={t}
                        onClose={() => navigate('..')}
                    />
                } />

                {/* Leads */}
                <Route path="leads" element={
                    <LeadsListModal
                        isEmbedded={true}
                        employee={employee}
                        userId={user.uid}
                        t={t}
                        onClose={() => navigate('..')}
                    />
                } />
            </Route>
        </Routes>
    );
}
