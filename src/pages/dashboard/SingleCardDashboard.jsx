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
import FollowersListModal from '../../components/modals/FollowersListModal';
import ReviewsListModal from '../../components/modals/ReviewsListModal';
import BookingsListModal from '../../components/modals/BookingsListModal';
import StoryAnalyticsModal from '../../components/modals/StoryAnalyticsModal';
import QRCodeManagerModal from '../../components/modals/QRCodeManagerModal';
import BrandedLoader from '../../components/ui/BrandedLoader';
import SettingsModal from '../../components/modals/SettingsModal';

// Lazy load specific heavy modals if needed, but for embedded dashboard we might want them eager or mostly eager
// For now, importing eager is safer for layout consistency.

export default function SingleCardDashboard({ user, t, lang, onLogout, toggleLang }) {
    const { cardId } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
        <>
            <Routes>
                <Route element={<SingleCardLayout
                    t={t}
                    lang={lang}
                    employee={employee}
                    user={user}
                    onLogout={onLogout}
                    toggleLang={toggleLang}
                    onOpenSettings={() => setIsSettingsOpen(true)}
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
                                else if (actionId === 'followers') navigate('followers');
                                else if (actionId === 'reviews') navigate('reviews');
                                else if (actionId === 'qr') navigate('qr');
                                else if (actionId === 'appointments') navigate('appointments');
                                else if (actionId === 'storyanalytics') navigate('story-analytics');
                            }}
                        />
                    } />

                    {/* Edit (General/Contact) */}
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

                    {/* Design & Identity */}
                    <Route path="design" element={
                        <EmployeeForm
                            isEmbedded={true}
                            initialTab="design"
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

                    {/* Followers */}
                    <Route path="followers" element={
                        <FollowersListModal
                            isEmbedded={true}
                            employee={employee}
                            userId={user.uid}
                            t={t}
                            onClose={() => navigate('..')}
                        />
                    } />

                    {/* Reviews */}
                    <Route path="reviews" element={
                        <ReviewsListModal
                            isEmbedded={true}
                            employee={employee}
                            userId={user.uid}
                            t={t}
                            onClose={() => navigate('..')}
                        />
                    } />

                    {/* QR Code */}
                    <Route path="qr" element={
                        <QRCodeManagerModal
                            isEmbedded={true}
                            employee={employee}
                            userId={user.uid}
                            t={t}
                            onClose={() => navigate('..')}
                        />
                    } />

                    {/* Appointments */}
                    <Route path="appointments" element={
                        <BookingsListModal
                            isEmbedded={true}
                            employee={employee}
                            userId={user.uid}
                            t={t}
                            onClose={() => navigate('..')}
                        />
                    } />

                    {/* Story Analytics */}
                    <Route path="story-analytics" element={
                        <StoryAnalyticsModal
                            isEmbedded={true}
                            employee={employee}
                            userId={user.uid}
                            t={t}
                            onClose={() => navigate('..')}
                        />
                    } />
                </Route>
            </Routes>
            {isSettingsOpen && (
                <SettingsModal
                    onClose={() => setIsSettingsOpen(false)}
                    user={user}
                    t={t}
                    lang={lang}
                />
            )}
        </>
    );
}
