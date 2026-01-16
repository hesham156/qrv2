import { useEffect } from 'react';

export function useSEO(title, description) {
    useEffect(() => {
        // Update Title
        const defaultTitle = "DigiCard - Professional Digital Business Cards";
        document.title = title ? `${title} | DigiCard` : defaultTitle;

        // Update Meta Description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', description || "Create professional digital business cards, share contact info instantly via QR codes.");
        }

        // Optional: Restore defaults on unmount
        return () => {
            // document.title = defaultTitle; 
            // We often don't want to reset on unmount because the next page will set it immediately, 
            // preventing a flash of default title.
        };
    }, [title, description]);
}
