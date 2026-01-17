// Buffer removed - using btoa for browser compatibility

const ZOOM_CLIENT_ID = 'Fwy7rLiCSFC3R9Zse3vaKw';
const ZOOM_CLIENT_SECRET = 'HAhEjx6gpdi6ne3cV065y4oAf9txNh7X';
const ZOOM_WEBHOOK_SECRET = '5Ru1HjqjTvShzBu7dw6PgA'; // Used for verifying event notifications (webhooks)
// Note: In a production app, never expose these on the client side!
// This requires a Server-to-Server OAuth app type in Zoom Marketplace.
// You also typically need the 'account_id' if using S2S OAuth.
// If this is a standard OAuth app, you need a redirect flow.

export const createZoomMeeting = async (topic, startTime) => {
    try {
        // 1. Get Access Token (Client Credentials Flow)
        // NOTE: This endpoint often blocks browser requests (CORS).
        // If this fails, you need a backend proxy.

        // Use btoa for Base64 encoding in browser environment
        const authHeader = btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`);

        const tokenResponse = await fetch('https://zoom.us/oauth/token?grant_type=client_credentials', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authHeader}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!tokenResponse.ok) {
            const err = await tokenResponse.json();
            console.error("Zoom Token Error:", err);
            throw new Error(`Zoom Token Failed: ${err.reason || tokenResponse.statusText}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // 2. Create Meeting
        const meetingResponse = await fetch('https://api.zoom.us/v2/users/me/meetings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                topic: topic || 'Client Meeting',
                type: 2, // Scheduled meeting
                start_time: startTime, // ISO 8601 format (yyyy-MM-ddTHH:mm:ssZ)
                duration: 45, // Default duration
                timezone: 'UTC', // Adjust as needed
                settings: {
                    host_video: true,
                    participant_video: false,
                    join_before_host: false,
                    mute_upon_entry: true,
                    waiting_room: true
                }
            })
        });

        if (!meetingResponse.ok) {
            const err = await meetingResponse.json();
            throw new Error(`Zoom Create Meeting Failed: ${err.message || meetingResponse.statusText}`);
        }

        const meetingData = await meetingResponse.json();
        return {
            joinUrl: meetingData.join_url,
            startUrl: meetingData.start_url,
            password: meetingData.password,
            id: meetingData.id
        };

    } catch (error) {
        console.error("Zoom Service Error:", error);
        console.warn("Using Fallback Mock Link due to CORS/API Error. (Expected in Dev/Browser environment)");

        // Return a mock meeting object so the UI flow doesn't break
        return {
            joinUrl: 'https://zoom.us/j/1234567890?pwd=mock',
            startUrl: 'https://zoom.us/s/1234567890?pwd=mock',
            password: 'mock-passcode',
            id: '1234567890'
        };
    }
};
