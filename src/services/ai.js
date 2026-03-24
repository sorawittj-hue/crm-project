import { GoogleGenAI } from '@google/genai';

let aiClient = null;

function getClient() {
  if (!aiClient) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Gemini API Key Missing — set VITE_GEMINI_API_KEY in .env");
      return null;
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

/**
 * Call Gemini API using the official SDK
 * @param {string} prompt - The prompt to send
 * @returns {object|string|null} Parsed JSON or text response
 */
export async function callGeminiAPI(prompt) {
  const client = getClient();
  if (!client) return null;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = response.text;
    if (!text) return null;

    // Try parsing as JSON
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      return JSON.parse(jsonStr);
    } catch {
      return { text }; // Fallback if not JSON
    }
  } catch (error) {
    console.error("AI Error:", error.message);
    return null;
  }
}
