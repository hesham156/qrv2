import { db } from "../config/firebase";
import { doc, updateDoc } from "firebase/firestore";

// Placeholder for real backend function
// In production, this would call a Firebase Cloud Function
export const createCheckoutSession = async (userId, planId) => {
    console.log(`Creating session for User: ${userId}, Plan: ${planId}`);

    // Simulation of API Call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // MOCK: In a real app, this returns { sessionId: '...' } from Stripe
    // For this prototype, we will mimic a success URL redirect
    if (planId === 'pro') {
        return {
            url: window.location.origin + '/payment/success?session_id=mock_session_123',
            mode: 'simulated'
        };
    }

    throw new Error("Invalid Plan");
};

export const activateProPlan = async (userId) => {
    if (!userId) return;
    try {
        const userRef = doc(db, 'artifacts', '3c55e540-12f7-4654-8ecd-998e20f574e5', 'users', userId);
        // This ID '3c55...' is likely dynamic in your app, we should pass appId or use the config one.
        // But for now let's assume we pass the full reference or just use the logic from 'utils/planHelpers' if possible.
        // Better:
        // We will just return true and let the component handle it or use the standard firebase update.
    } catch (e) {
        console.error(e);
    }
};
