import { Timestamp } from 'firebase/firestore';

/**
 * Checks if the user has an active Pro/Enterprise plan.
 * Returns true if plan is 'pro' or 'enterprise' AND (expiry date is future OR null/undefined).
 */
export const isPlanActive = (user) => {
    if (!user) return false;
    const plan = user.plan || 'free';
    if (plan === 'free') return false;

    // If no expiry date is set for a paid plan, assume active (lifetime or manual management)
    if (!user.planExpiresAt) return true;

    const now = new Date();
    let expiry;

    // Handle Firestore Timestamp or standard Date string/object
    if (user.planExpiresAt instanceof Timestamp) {
        expiry = user.planExpiresAt.toDate();
    } else {
        expiry = new Date(user.planExpiresAt);
    }

    return expiry > now;
};

/**
 * Returns 'pro' or 'free' based on validity.
 */
export const getEffectivePlan = (user) => {
    return isPlanActive(user) ? 'pro' : 'free';
};

/**
 * Returns true if the item at this index should be locked based on the user's plan.
 * Free plan limit: 1 item (Index 0).
 */
export const isItemLocked = (index, user) => {
    const plan = getEffectivePlan(user);
    if (plan === 'free' && index >= 1) return true;
    return false;
};
