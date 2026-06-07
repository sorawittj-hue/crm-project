import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // Add CORS headers for local testing via Vite proxy if needed, though Vercel handles it
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Uses process.env.VITE_GEMINI_API_KEY from environment 
  // (In Vercel, this should be set in Project Settings -> Environment Variables)
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API Key missing on server' });
  }

  try {
    const { prompt, schema, model = 'gemini-2.5-flash' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const config = {};
    if (schema) {
      config.responseMimeType = 'application/json';
      config.responseSchema = schema;
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: Object.keys(config).length > 0 ? config : undefined
    });

    return res.status(200).json({ text: response.text });
  } catch (error) {
    console.error("AI Error:", error.message);
    return res.status(500).json({ error: error.message || 'AI generation failed' });
  }
}
