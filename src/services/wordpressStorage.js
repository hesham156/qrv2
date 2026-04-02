import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

export const uploadToWordPress = async (file) => {
    try {
        // Convert file to base64
        const base64File = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Remove data schema prefix (e.g. data:image/jpeg;base64,)
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = error => reject(error);
        });

        const uploadCallable = httpsCallable(functions, 'uploadFileToWordPress');
        
        const response = await uploadCallable({
            base64File: base64File,
            fileName: file.name,
            fileType: file.type
        });

        // Return the source URL of the uploaded image
        return response.data.source_url;
    } catch (error) {
        console.error("WordPress Upload Error Details:", error);
        const serverMessage = error.message || "Unknown Error";
        alert(`Upload Failed: ${serverMessage}`);
        throw new Error("Failed to upload image to WordPress.");
    }
};
