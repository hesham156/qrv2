import emailjs from '@emailjs/browser';

// These should be in your .env file
// REACT_APP_EMAILJS_SERVICE_ID
// REACT_APP_EMAILJS_TEMPLATE_ID
// REACT_APP_EMAILJS_PUBLIC_KEY

export const initEmailService = () => {
    emailjs.init({
        publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY,
    });
};

export const sendBookingNotification = async (bookingData) => {
    const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
    const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
        console.warn("EmailJS keys are missing in .env. Email notification skipped.");
        return;
    }

    try {
        const response = await emailjs.send(
            serviceId,
            templateId,
            {
                to_name: "Admin", // or fetch the employee name
                from_name: bookingData.name,
                from_phone: bookingData.phone,
                booking_date: bookingData.date,
                booking_time: bookingData.time,
                message: `New booking received for ${bookingData.date} at ${bookingData.time}. From: ${bookingData.name} (${bookingData.phone}).${bookingData.zoomLink ? `\n\nZoom Meeting: ${bookingData.zoomLink}` : ''}`,
            },
            publicKey
        );
        console.log('Email sent successfully!', response.status, response.text);
        return response;
    } catch (err) {
        console.error('Failed to send email:', err);
        throw err;
    }
};

// sendOtpEmail removed

