import axios from 'axios';

// ⚠️ Credentials provided by user. In production, proxy this through a backend.
const WP_API_URL = 'https://greenyellow-wombat-960712.hostingersite.com/wp-json/wp/v2';
const WP_USERNAME = 'h456ad@gmail.com';
const WP_PASSWORD = '0Z8W WwJF UZpR b7n8 fiZH S7cm';

export const uploadToWordPress = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);

        const response = await axios.post(`${WP_API_URL}/media`, formData, {
            headers: {
                'Authorization': `Basic ${btoa(`${WP_USERNAME}:${WP_PASSWORD}`)}`
            }
        });

        // Return the source URL of the uploaded image
        return response.data.source_url;
    } catch (error) {
        console.error("WordPress Upload Error Details:", error.response?.data);
        const serverMessage = error.response?.data?.message || error.message;
        alert(`Upload Failed: ${serverMessage}. \nCode: ${error.response?.data?.code}`);
        throw new Error("Failed to upload image to WordPress.");
    }
};
