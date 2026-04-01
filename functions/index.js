const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const axios = require("axios");
const FormData = require("form-data");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { google } = require("googleapis");

admin.initializeApp();

// Set global options to use the closest region if desired, or stay default
setGlobalOptions({ region: "us-central1" });

/**
 * Upload a file to WordPress securely.
 * Expects: { base64File: string, fileName: string, fileType: string }
 */
exports.uploadFileToWordPress = onCall({
    maxInstances: 10
}, async (request) => {
    // 1. Auth check
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const { base64File, fileName, fileType } = request.data;
    if (!base64File || !fileName) {
        throw new HttpsError("invalid-argument", "Missing file data.");
    }

    try {
        const WP_API_URL = 'https://greenyellow-wombat-960712.hostingersite.com/wp-json/wp/v2';
        const WP_USERNAME = process.env.WP_USERNAME;
        const WP_PASSWORD = process.env.WP_PASSWORD;

        // Convert base64 to Buffer
        const buffer = Buffer.from(base64File, 'base64');

        const form = new FormData();
        form.append('file', buffer, {
            filename: fileName,
            contentType: fileType || 'application/octet-stream'
        });

        const response = await axios.post(`${WP_API_URL}/media`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Basic ${Buffer.from(`${WP_USERNAME}:${WP_PASSWORD}`).toString('base64')}`
            }
        });

        return { source_url: response.data.source_url };
    } catch (error) {
        console.error("WP Upload Error:", error.response?.data || error.message);
        throw new HttpsError("internal", error.response?.data?.message || "WordPress upload failed.");
    }
});

/**
 * Generate AI content using Gemini securely.
 * Expects: { prompt: string, modelName?: string, systemInstruction?: string, history?: Array }
 */
exports.generateAIContent = onCall({
    maxInstances: 10
}, async (request) => {
    // 1. Auth check
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const { prompt, modelName = "gemini-1.5-flash", systemInstruction, history } = request.data;

    if (!prompt) {
        throw new HttpsError("invalid-argument", "Prompt is required.");
    }

    try {
        const API_KEY = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(API_KEY);

        const model = genAI.getGenerativeModel({
            model: modelName,
            ...(systemInstruction ? { systemInstruction } : {})
        });

        let result;
        if (history) {
            const chat = model.startChat({ history });
            result = await chat.sendMessage(prompt);
        } else {
            result = await model.generateContent(prompt);
        }

        const response = await result.response;
        return { text: response.text() };
    } catch (error) {
        console.error("AI Error:", error);
        throw new HttpsError("internal", "AI generation failed.");
    }
});

/**
 * Exchange Google OAuth code for a refresh token and store it.
 */
exports.exchangeGoogleCode = onCall({
    maxInstances: 10
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }
    const { code, redirect_uri } = request.data;
    if (!code) {
        throw new HttpsError("invalid-argument", "Missing auth code.");
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri
        );

        const { tokens } = await oauth2Client.getToken(code);

        // Store the refresh token securely in Firestore
        // We store it under artifacts/{appId}/users/{uid}/credentials/google
        const appId = request.data.appId; // Need to pass appId from frontend
        await admin.firestore().doc(`artifacts/${appId}/users/${request.auth.uid}`)
            .set({
                googleCredentials: {
                    refreshToken: tokens.refresh_token,
                    linkedAt: admin.firestore.FieldValue.serverTimestamp(),
                    email: tokens.email || null // if scope includes email
                }
            }, { merge: true });

        return { success: true };
    } catch (error) {
        console.error("Google Exchange Error:", error);
        throw new HttpsError("internal", "Failed to exchange Google code.");
    }
});

/**
 * Create a Google Meet meeting.
 */
exports.createGoogleMeeting = onCall({
    maxInstances: 10
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }
    const { topic, startTime, duration = 45, appId, adminId } = request.data;

    try {
        // 1. Get user's refresh token from Firestore
        const userSnap = await admin.firestore().doc(`artifacts/${appId}/users/${adminId}`).get();
        const credentials = userSnap.data()?.googleCredentials;

        if (!credentials?.refreshToken) {
            throw new HttpsError("failed-precondition", "Google Calendar not linked.");
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        oauth2Client.setCredentials({ refresh_token: credentials.refreshToken });

        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        const event = {
            summary: topic,
            start: { dateTime: new Date(startTime).toISOString() },
            end: { dateTime: new Date(new Date(startTime).getTime() + duration * 60000).toISOString() },
            conferenceData: {
                createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: { type: "hangoutsMeet" }
                }
            }
        };

        const response = await calendar.events.insert({
            calendarId: "primary",
            resource: event,
            conferenceDataVersion: 1
        });

        const meetLink = response.data.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri;

        return { meetLink };
    } catch (error) {
        console.error("Google Meet Creation Error:", error);
        throw new HttpsError("internal", "Failed to create Google Meet meeting.");
    }
});

/**
 * Add a custom domain to Vercel via API.
 */
exports.addCustomDomainToVercel = onCall({
    maxInstances: 10
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const { customDomain } = request.data;
    if (!customDomain) {
        throw new HttpsError("invalid-argument", "Missing domain name.");
    }

    const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
    const VERCEL_AUTH_TOKEN = process.env.VERCEL_AUTH_TOKEN;

    if (!VERCEL_PROJECT_ID || !VERCEL_AUTH_TOKEN) {
        throw new HttpsError("failed-precondition", "Vercel API keys are not configured.");
    }

    try {
        const response = await axios.post(
            `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`,
            { name: customDomain },
            {
                headers: {
                    Authorization: `Bearer ${VERCEL_AUTH_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );
        return { success: true, data: response.data };
    } catch (error) {
        console.error("Vercel Add Error:", error.response?.data || error.message);
        throw new HttpsError("internal", error.response?.data?.error?.message || "Failed to add domain to Vercel.");
    }
});

/**
 * Remove a custom domain from Vercel via API.
 */
exports.removeCustomDomainFromVercel = onCall({
    maxInstances: 10
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const { customDomain } = request.data;
    if (!customDomain) {
        throw new HttpsError("invalid-argument", "Missing domain name.");
    }

    const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
    const VERCEL_AUTH_TOKEN = process.env.VERCEL_AUTH_TOKEN;

    if (!VERCEL_PROJECT_ID || !VERCEL_AUTH_TOKEN) {
        throw new HttpsError("failed-precondition", "Vercel API keys are not configured.");
    }

    try {
        const response = await axios.delete(
            `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${customDomain}`,
            {
                headers: {
                    Authorization: `Bearer ${VERCEL_AUTH_TOKEN}`
                }
            }
        );
        return { success: true, data: response.data };
    } catch (error) {
        // If domain is not found, we don't necessarily want to fail fully, but we log it.
        console.error("Vercel Remove Error:", error.response?.data || error.message);
        throw new HttpsError("internal", error.response?.data?.error?.message || "Failed to remove domain from Vercel.");
    }
});
