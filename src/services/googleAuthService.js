import { getFunctions, httpsCallable } from "firebase/functions";
import { appId } from "../config/firebase";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

/**
 * Initiates the Google OAuth2 flow (Code flow).
 * Returns the auth code to be exchanged by the backend.
 */
export const connectGoogleCalendar = () => {
    return new Promise((resolve, reject) => {
        const redirectUri = window.location.origin + "/dashboard"; // Must be registered in Google Console

        // Use the Google Identity Services popup
        const client = window.google.accounts.oauth2.initCodeClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: SCOPES,
            ux_mode: 'popup',
            callback: async (response) => {
                if (response.code) {
                    try {
                        const functions = getFunctions();
                        const exchangeCode = httpsCallable(functions, 'exchangeGoogleCode');
                        await exchangeCode({
                            code: response.code,
                            redirect_uri: redirectUri,
                            appId: appId
                        });
                        resolve(true);
                    } catch (err) {
                        console.error("Token exchange failed:", err);
                        reject(err);
                    }
                } else {
                    reject(new Error("No code returned from Google"));
                }
            },
        });

        client.requestCode();
    });
};
