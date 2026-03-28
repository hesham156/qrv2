import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Common AI Model configuration
 */
export const getAIModel = (modelName = "gemini-2.0-flash") => {
    return genAI.getGenerativeModel({ model: modelName });
};

/**
 * Parse CV Text using AI
 * @param {string} text 
 * @returns {Promise<Object>}
 */
export const parseCVWithAI = async (text) => {
    try {
        const model = getAIModel();
        const prompt = `
            Extract the following information from this CV text and return it strictly as a JSON object:
            {
                "name": "Full name",
                "jobTitle": "Most recent job title or profession",
                "email": "Email address",
                "phone": "Phone number",
                "website": "LinkedIn or Portfolio URL",
                "bio_en": "A 2-sentence professional bio in English",
                "bio_ar": "A 2-sentence professional bio in Arabic",
                "skills": ["Skill 1", "Skill 2" ... max 10]
            }
            Text: ${text.slice(0, 10000)} // Safety slice
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonText = response.text().replace(/```json|```/g, "").trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("AI CV Parse Error:", error);
        throw error;
    }
};

/**
 * Generate/Optimize text content
 * @param {string} currentText 
 * @param {string} type - 'bio', 'jobTitle', etc.
 * @param {string} lang - 'ar', 'en'
 * @returns {Promise<string>}
 */
export const optimizeTextWithAI = async (currentText, type, lang = 'en') => {
    try {
        const model = getAIModel();
        const prompt = `
            Act as a professional copywriter. 
            Optimize the following ${type} to be more impressive and professional. 
            Language: ${lang === 'ar' ? 'Arabic' : 'English'}.
            Keep it concise.
            Text: ${currentText}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("AI Text Optimization Error:", error);
        throw error;
    }
};

/**
 * Chat with Profile context
 * @param {string} message 
 * @param {Object} profileContext 
 * @param {Array} history 
 * @returns {Promise<string>}
 */
export const chatWithProfileAI = async (message, profileContext, history = []) => {
    const modelName = "gemini-2.0-flash";

    const name = profileContext?.name || 'this professional';
    const job = profileContext?.jobTitle || 'Expert';
    const bio = profileContext?.bio || '';
    const skillsSnippet = profileContext?.skills?.length > 0 ? profileContext.skills.join(", ") : 'Experience in various fields';
    const productsSnippet = profileContext?.products?.length > 0 ? profileContext.products.map(p => p.name || p.title).join(", ") : 'various services';

    const systemPrompt = `
        You are a helpful AI assistant for a digital card profile.
        Owner Name: ${name}
        Job Title: ${job}
        Bio: ${bio}
        Skills: ${skillsSnippet}
        Offerings/Projects: ${productsSnippet}
        
        Respond as a professional assistant. Be polite and concise.
        Use the same language as the visitor (Arabic or English).
    `;

    const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
    });

    const chat = model.startChat({
        history: history,
        generationConfig: {
            maxOutputTokens: 500,
        },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
};

/**
 * Generates a warm, culturally appropriate 1-line welcome message for a visitor.
 * @param {string} country - Visitor country name.
 * @param {string} ownerName - Profile owner name.
 * @param {string} lang - Preferred language (ar/en).
 */
export const generateLocalizedGreeting = async (country, ownerName, lang = 'en') => {
    try {
        const prompt = `
            You are a polite assistant for ${ownerName}.
            A visitor just opened the profile from ${country}.
            Generate a very warm, professional ONE-LINE welcome message.
            If the country is an Arabic-speaking country, respond in Arabic.
            Otherwise, respond in the language of that country if possible, or English.
            Keep it strictly under 60 characters.
            Example: "Welcome from Egypt! It's an honor to have you here."
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Greeting AI Error:", error);
        return lang === 'ar' ? `أهلاً بك من ${country}!` : `Welcome from ${country}!`;
    }
};
