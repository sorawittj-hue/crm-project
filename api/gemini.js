import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const rateLimitMap = new Map();
const LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 15; // 15 requests per minute

function isRateLimited(userId) {
  const now = Date.now();
  if (!rateLimitMap.has(userId)) {
    rateLimitMap.set(userId, [now]);
    return false;
  }
  
  let timestamps = rateLimitMap.get(userId);
  timestamps = timestamps.filter(t => now - t < LIMIT_WINDOW);
  
  if (timestamps.length >= MAX_REQUESTS) {
    return true;
  }
  
  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);
  return false;
}

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Authenticate Request using Supabase JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token session' });
  }

  // 2. Rate Limiting by User ID
  if (isRateLimited(user.id)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute before trying again.' });
  }

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
