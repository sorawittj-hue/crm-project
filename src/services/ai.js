import { GoogleGenAI } from '@google/genai';

let aiClient = null;

/**
 * ⚠️ SECURITY NOTE: This API key is exposed in the client bundle.
 * For production, move AI calls to a serverless function (e.g. Vercel API Route
 * or Supabase Edge Function) and restrict the key in Google Cloud Console.
 */
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
 * Simple rate limiter to prevent excessive API calls.
 * Allows maxCalls within windowMs milliseconds.
 */
const rateLimiter = {
  calls: [],
  maxCalls: 10,
  windowMs: 60_000, // 1 minute

  canCall() {
    const now = Date.now();
    this.calls = this.calls.filter((t) => now - t < this.windowMs);
    if (this.calls.length >= this.maxCalls) return false;
    this.calls.push(now);
    return true;
  },
};

/**
 * Call Gemini API using the official SDK with rate limiting
 * @param {string} prompt - The prompt to send
 * @returns {object|string|null} Parsed JSON or text response
 */
export async function callGeminiAPI(prompt) {
  const client = getClient();
  if (!client) return null;

  if (!rateLimiter.canCall()) {
    console.warn('AI rate limit reached — please wait before making more requests.');
    return { text: 'คำขอ AI มากเกินไป กรุณารอสักครู่แล้วลองใหม่' };
  }

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
