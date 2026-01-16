
const parseCVText = (text) => {
    const result = {
        name: '',
        email: '',
        phone: '',
        jobTitle: '',
        website: '',
    };

    // 1. Email
    const emailMatch = text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/);
    if (emailMatch) result.email = emailMatch[0];

    // 2. Phone
    const phoneMatch = text.match(/(?:\+|00)?\d{1,3}[-. ]?\(?\d{2,4}\)?[-. ]?\d{3,4}[-. ]?\d{3,4}/);
    if (phoneMatch) result.phone = phoneMatch[0].replace(/\s+/g, '').replace(/-/g, '');

    // 3. Website
    const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
    if (linkedinMatch) result.website = `https://${linkedinMatch[0]}`;

    // 5. Job Title
    const roles = ["Software Engineer", "Developer", "Manager"];
    for (const role of roles) {
        if (new RegExp(role, 'i').test(text)) {
            result.jobTitle = role;
            break;
        }
    }

    return result;
};

const sample = `
Moustafa Ahmed
Software Engineer
moustafa@example.com
+20-100-123-4567
linkedin.com/in/moustafa
`;

console.log(parseCVText(sample));
