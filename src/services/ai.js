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
 * Call Gemini API using the secure Vercel Edge Function proxy.
 * @param {string} prompt - The prompt to send
 * @param {object} [schema] - Optional GoogleGenAI Type schema for structured output
 * @returns {object|string|null} Parsed JSON or text response
 */
export async function callGeminiAPI(prompt, schema = null) {
  if (!rateLimiter.canCall()) {
    console.warn('AI rate limit reached — please wait before making more requests.');
    return { text: 'คำขอ AI มากเกินไป กรุณารอสักครู่แล้วลองใหม่' };
  }

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt,
        schema,
        model: 'gemini-2.5-flash'
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to fetch from AI proxy');
    }

    const data = await response.json();
    const text = data.text;
    if (!text) return null;

    // If schema was provided, the response should already be valid JSON string
    if (schema) {
      try {
        return JSON.parse(text);
      } catch {
        return { text };
      }
    }

    // Try parsing as JSON for legacy unstructured calls
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      return JSON.parse(jsonStr);
    } catch {
      return { text }; // Fallback if not JSON
    }
  } catch (error) {
    console.error("AI Proxy Error:", error.message);
    return null;
  }
}
