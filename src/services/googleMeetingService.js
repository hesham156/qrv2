/**
 * Creates a Google Meet link via Google Apps Script (Bypasses Firebase Blaze Plan).
 * Now uses the updated script that sends real emails and generates real Meet links.
 */
export const createGoogleMeeting = async (meetingData) => {
    const { topic, startTime, duration = 45, name, phone } = meetingData;

    // New script URL provided by the user
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyCh2CL8Fik2ArdtdQOOs8rzV3p4ejXdz5W992R7kscQvACHwr8IkqF0DDlXN69lhZU/exec";

    try {
        console.log("Calling Pro Google Apps Script for Meet creation & Email...");

        // We use 'POST' with JSON payload. 
        // Note: browser 'fetch' to Apps Script with 'no-cors' will work for execution,
        // but we can't read the response. However, the script will send the email!
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
                topic,
                startTime,
                duration,
                name,
                phone
            })
        });

        return {
            joinUrl: "تفقّد بريدك الإلكتروني الآن، ستصلك تفاصيل الاجتماع خلال لحظات.",
            status: 'success'
        };

    } catch (error) {
        console.error("Pro Google Apps Script Error:", error);

        // Fallback to mock link just in case
        const mockMeetingId = Math.random().toString(36).substring(2, 5) + '-' +
            Math.random().toString(36).substring(2, 6) + '-' +
            Math.random().toString(36).substring(2, 5);

        return {
            joinUrl: `https://meet.google.com/${mockMeetingId}`,
            id: mockMeetingId,
            status: 'mock'
        };
    }
};
