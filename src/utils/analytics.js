import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let device = 'Desktop';
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) device = 'Mobile';
    if (/iPad|Android|Tablet/i.test(ua) && !/Mobile/i.test(ua)) device = 'Tablet';

    let browser = 'Other';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    let os = 'Other';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Linux')) os = 'Linux';

    return { device, browser, os };
};

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
        const eventsRef = collection(db, 'artifacts', appId, 'users', userId, 'employees', employeeId, 'analytics_events');
        const deviceInfo = getDeviceInfo();

        await addDoc(eventsRef, {
            type,
            subtype,
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent,
            ...deviceInfo,
            date: new Date().toISOString().split('T')[0],
            ...metadata
        });
    } catch (error) {
        console.error("Error logging analytics event:", error);
    }
};
