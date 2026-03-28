// content.js
console.log("DigiCard Companion: Content script loaded.");

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scan_page") {
        const data = extractLeadData();
        sendResponse(data);
    }
});

function extractLeadData() {
    const bodyText = document.body.innerText;
    const html = document.body.innerHTML;

    // 1. Basic Metadata
    const title = document.title;
    const url = window.location.href;

    // 2. Extract Email (Simple Regex)
    const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;
    const emails = [...new Set(bodyText.match(emailRegex) || [])]; // Unique emails

    // 3. Extract Phone (Simple Regex - can be improved)
    // Matches formats like +1-555-555-5555, (555) 555-5555, etc.
    const phoneRegex = /(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/g;
    const phones = [...new Set(bodyText.match(phoneRegex) || [])];

    // 4. Try to find "Name"
    // Heuristic: H1 usually contains the main subject/name on profile pages like LinkedIn
    let name = "";
    const h1 = document.querySelector('h1');
    if (h1) name = h1.innerText.trim();

    // 5. Try to find "Job Title" (Heuristic for LinkedIn/Socials)
    let jobTitle = "";
    // Example: specific common classes or metadata (very heuristic)
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        // sometimes description has "Job Title at Company"
        jobTitle = metaDesc.content.split(' at ')[0] || "";
    }

    return {
        title,
        url,
        name,
        jobTitle: jobTitle.length < 50 ? jobTitle : "", // Safety check
        emails: emails.slice(0, 3), // Limit to top 3
        phones: phones.slice(0, 3)
    };
}
