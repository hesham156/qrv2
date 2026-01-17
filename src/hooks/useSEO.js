import { useEffect } from 'react';

export function useSEO(title, description, image) {
    useEffect(() => {
        // 1. Update Title
        const defaultTitle = "DigiCard - Professional Digital Business Cards";
        document.title = title ? `${title} | DigiCard` : defaultTitle;

        // 2. Update Meta Description
        updateMeta('name', 'description', description || "Create professional digital business cards, share contact info instantly via QR codes.");

        // 3. Update Open Graph Tags (Facebook, LinkedIn, WhatsApp)
        updateMeta('property', 'og:title', title || defaultTitle);
        updateMeta('property', 'og:description', description || "The smart way manage your business connections.");
        if (image) {
            updateMeta('property', 'og:image', image);
        }

        // 4. Update Twitter Card
        updateMeta('name', 'twitter:card', 'summary_large_image');
        updateMeta('name', 'twitter:title', title || defaultTitle);
        updateMeta('name', 'twitter:description', description || "Create professional digital business cards.");
        if (image) {
            updateMeta('name', 'twitter:image', image);
        }

    }, [title, description, image]);
}

// Helper function to update or create meta tags
function updateMeta(attrName, attrValue, content) {
    let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
    }
    element.setAttribute('content', content);
}
