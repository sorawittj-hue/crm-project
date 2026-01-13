import fs from 'fs';

// Manually read .env
let apiKey = '';
try {
    const envContent = fs.readFileSync('.env', 'utf-8');
    const match = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
    if (match) apiKey = match[1].trim();
} catch (e) {
    console.log("Could not read .env file");
}

console.log("Testing Key:", apiKey ? apiKey.slice(0, 5) + "..." : "MISSING");

async function test() {
    if (!apiKey) return;

    // Try using the key
    const models = ["gemini-1.5-flash", "gemini-pro"];
    for (const model of models) {
        console.log(`\n--- Testing ${model} ---`);
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
            });
            const data = await response.json();
            if (data.error) {
                console.log("ERROR:", JSON.stringify(data.error, null, 2));
            } else {
                console.log("SUCCESS!");
                console.log("Response available.");
                return;
            }
        } catch (e) {
            console.log("FETCH ERROR:", e.message);
        }
    }
}

test();
