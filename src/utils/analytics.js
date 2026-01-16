import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

/**
 * Logs an analytics event to Firestore.
 * @param {string} userId - The owner of the card (employee).
 * @param {string} employeeId - The specific card/employee ID.
 * @param {string} type - 'view' or 'click'.
 * @param {string} subtype - detailed type (e.g., 'whatsapp', 'call', 'website').
 * @param {object} metadata - optional extra data.
 */
export const logAnalyticsEvent = async (userId, employeeId, type, subtype = null, metadata = {}) => {
    if (!userId || !employeeId) return;

    try {
        // We store events in a subcollection 'analytics_events' under the employee document
        const eventsRef = collection(db, 'artifacts', appId, 'users', userId, 'employees', employeeId, 'analytics_events');

        await addDoc(eventsRef, {
            type,
            subtype,
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent,
            // We could add simple date strings for easier querying/grouping later if needed, 
            // but client-side processing of timestamps is fine for small-medium scale.
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD for easier daily grouping
            ...metadata
        });
    } catch (error) {
        console.error("Error logging analytics event:", error);
        // Be silent about errors to not disrupt user experience
    }
};
