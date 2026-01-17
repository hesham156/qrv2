import * as pdfjsLib from 'pdfjs-dist';
import { parseCVWithAI as aiParse } from './aiService';

// Use Unpkg for worker to ensure mjs support for v5+
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Extract text from a PDF file
 * @param {File} file 
 * @returns {Promise<string>}
 */
export const extractTextFromPDF = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';

        // Iterate over all pages
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }

        return fullText;
    } catch (error) {
        console.error("Error extracting text from PDF:", error);
        throw new Error("Failed to parse PDF");
    }
};

/**
 * Parse raw text to find Contact Info
 * @param {string} text 
 * @returns {Object} { name, email, phone, links, jobTitle }
 */
export const parseCVText = (text) => {
    const result = {
        name: '',
        email: '',
        phone: '',
        jobTitle: '',
        website: '',
        skills: []
    };

    // 1. Email (High confidence)
    const emailMatch = text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/);
    if (emailMatch) result.email = emailMatch[0];

    // 2. Phone (Heuristic - looks for patterns like +123..., 010..., etc)
    // Matches international format or local egyptian format commonly used
    const phoneMatch = text.match(/(?:\+|00)?\d{1,3}[-. ]?\(?\d{2,4}\)?[-. ]?\d{3,4}[-. ]?\d{3,4}/);
    if (phoneMatch) result.phone = phoneMatch[0].replace(/\s+/g, '').replace(/-/g, '');

    // 3. Website / Links
    const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
    const githubMatch = text.match(/github\.com\/[\w-]+/i);
    const genericLink = text.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/);

    if (linkedinMatch) result.website = `https://${linkedinMatch[0]}`;
    else if (githubMatch) result.website = `https://${githubMatch[0]}`;
    else if (genericLink) result.website = genericLink[0];

    // 4. Name (Low confidence - heuristic)
    // Assume the first few lines contain the name. We look for a line with 2-4 words that aren't common keywords.
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const line = lines[i];
        // Simple check: 2-4 words, no numbers, no special chars except -
        if (/^[a-zA-Z\s-]{3,30}$/.test(line) && line.split(' ').length >= 2) {
            result.name = line;
            break;
        }
    }

    // 5. Job Title (Heuristic - whitelist of common roles)
    const roles = [
        "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
        "Product Manager", "UI/UX Designer", "Graphic Designer", "Marketing Manager", "Sales Manager",
        "Accountant", "HR Manager", "CEO", "Founder", "Consultant", "Doctor", "Engineer"
    ];

    for (const role of roles) {
        if (new RegExp(role, 'i').test(text)) {
            result.jobTitle = role;
            break;
        }
    }

    return result;
};

/**
 * Intelligent CV Parsing using Gemini AI
 */
export const parseCVWithAI = async (text) => {
    try {
        return await aiParse(text);
    } catch (error) {
        console.error("AI Parse failed, falling back to heuristic:", error);
        return parseCVText(text);
    }
};
