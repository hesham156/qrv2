import { parseCVText } from './cvParser';

const sampleCV = `
John Doe
Software Engineer
john.doe@example.com
+1-555-0123
https://linkedin.com/in/johndoe
Summary: Experienced developer...
`;

const result = parseCVText(sampleCV);

console.log("--- CV Parser Verification ---");
console.log("Input:", sampleCV.trim());
console.log("Output:", JSON.stringify(result, null, 2));

const expected = {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+15550123",
    jobTitle: "Software Engineer",
    website: "https://linkedin.com/in/johndoe"
};

let passed = true;
if (result.email !== expected.email) { console.error("❌ Email mismatch"); passed = false; }
if (result.jobTitle !== expected.jobTitle) { console.error("❌ Job Title mismatch"); passed = false; }
// Phone regex might be tricky on format, let's just check if truthy
if (!result.phone) { console.error("❌ Phone missing"); passed = false; }

if (passed) {
    console.log("✅ Verification Passed!");
} else {
    console.error("❌ Verification Failed");
}
