/* global process */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const rateLimitMap = new Map();
const LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30; // 30 requests per minute for integrations

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

async function notifyTelegram(settings, message) {
  if (!settings.enabled || !settings.bot_token || !settings.chat_id) return;

  const url = `https://api.telegram.org/bot${settings.bot_token}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: settings.chat_id,
      text: message,
      parse_mode: 'HTML'
    })
  });
  
  if (!response.ok) {
    throw new Error(`Telegram error status: ${response.status}`);
  }
}

async function notifyLineOA(settings, message) {
  if (!settings.enabled || !settings.channel_token || !settings.user_id) return;

  const url = 'https://api.line.me/v2/bot/message/push';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.channel_token}`
    },
    body: JSON.stringify({
      to: settings.user_id,
      messages: [{ type: 'text', text: message }]
    })
  });

  if (!response.ok) {
    throw new Error(`LINE OA error status: ${response.status}`);
  }
}

async function notifyWebhook(settings, payload) {
  if (!settings.enabled || !settings.webhook_url) return;

  const headers = { 'Content-Type': 'application/json' };
  if (settings.secret_key) {
    headers['X-Nova-Signature'] = settings.secret_key;
  }

  const response = await fetch(settings.webhook_url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Webhook error status: ${response.status}`);
  }
}

// Retry wrapper with exponential backoff
async function retryWithBackoff(fn, label, maxRetries = 3) {
  let delay = 1000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await fn();
      console.log(`[Integration] ${label} success on attempt ${attempt}`);
      return;
    } catch (err) {
      console.error(`[Integration] ${label} attempt ${attempt} failed:`, err.message);
      if (attempt === maxRetries) {
        throw err;
      }
      console.log(`[Integration] Retrying ${label} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
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
    return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
  }

  try {
    const { eventType, data } = req.body;
    if (!eventType || !data) {
      return res.status(400).json({ error: 'eventType and data are required' });
    }

    // 3. Query app_settings integrations for user using user-authenticated client
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: appSettings, error: settingsError } = await userSupabase
      .from('app_settings')
      .select('integrations')
      .eq('id', user.id)
      .maybeSingle();

    if (settingsError) {
      console.error("Failed to load integrations from DB:", settingsError.message);
      return res.status(500).json({ error: 'Failed to load integration settings: ' + settingsError.message });
    }

    const settings = appSettings?.integrations || {};

    // 4. Construct messages
    let message = '';
    if (eventType === 'DEAL_WON') {
      message = `🎉 <b>ปิดดีลสำเร็จ!</b> 🎉\n\n<b>ลูกค้า:</b> ${data.customerName || 'ไม่ระบุ'}\n<b>มูลค่า:</b> ฿${Number(data.value).toLocaleString()}\n<b>สร้างโดย:</b> ${data.userEmail || 'เซลส์'}`;
    } else if (eventType === 'DEAL_CREATED') {
      message = `🆕 <b>ได้ Lead ใหม่!</b>\n\n<b>ลูกค้า:</b> ${data.customerName || 'ไม่ระบุ'}\n<b>มูลค่าคาดหวัง:</b> ฿${Number(data.value).toLocaleString()}`;
    } else {
      return res.status(400).json({ error: 'Unsupported eventType' });
    }

    const promises = [];

    // Telegram
    if (settings.telegram?.enabled) {
      promises.push(
        retryWithBackoff(
          () => notifyTelegram(settings.telegram, message),
          'Telegram Bot'
        )
      );
    }

    // LINE OA
    if (settings.line_oa?.enabled) {
      const cleanMessage = message.replace(/<[^>]*>?/gm, '');
      promises.push(
        retryWithBackoff(
          () => notifyLineOA(settings.line_oa, cleanMessage),
          'LINE OA'
        )
      );
    }

    // Webhook
    if (settings.webhook?.enabled) {
      promises.push(
        retryWithBackoff(
          () => notifyWebhook(settings.webhook, { event: eventType, data }),
          'Webhook'
        )
      );
    }

    await Promise.allSettled(promises);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Integration Error:", error.message);
    return res.status(500).json({ error: error.message || 'Integration dispatch failed' });
  }
}
