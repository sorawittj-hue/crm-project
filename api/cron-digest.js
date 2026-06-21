/* global process */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use service role key to bypass RLS and select all users' data for cron summary
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function notifyTelegram(settings, message) {
  if (!settings.enabled || !settings.bot_token || !settings.chat_id) return;
  const url = `https://api.telegram.org/bot${settings.bot_token}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: settings.chat_id,
      text: message,
      parse_mode: 'HTML'
    })
  });
}

async function notifyLineOA(settings, message) {
  if (!settings.enabled || !settings.channel_token || !settings.user_id) return;
  const url = 'https://api.line.me/v2/bot/message/push';
  await fetch(url, {
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
}

async function notifyWebhook(settings, payload) {
  if (!settings.enabled || !settings.webhook_url) return;
  const headers = { 'Content-Type': 'application/json' };
  if (settings.secret_key) {
    headers['X-Nova-Signature'] = settings.secret_key;
  }
  await fetch(settings.webhook_url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
}

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify Vercel Cron signature
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Fetch all user settings with active integrations
    const { data: appSettingsList, error: settingsError } = await supabase
      .from('app_settings')
      .select('id, integrations');

    if (settingsError) throw settingsError;

    const activeUsers = (appSettingsList || []).filter(item => {
      const integrations = item.integrations || {};
      return (
        integrations.telegram?.enabled ||
        integrations.line_oa?.enabled ||
        integrations.webhook?.enabled
      );
    });

    if (activeUsers.length === 0) {
      return res.status(200).json({ message: 'No active integrations found to notify.' });
    }

    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayISO = yesterday.toISOString();

    let notificationsSent = 0;

    // 2. Loop over users and send digest
    for (const userConfig of activeUsers) {
      const userId = userConfig.id;
      const integrations = userConfig.integrations;

      // Fetch user's deals
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .eq('owner_id', userId);

      if (dealsError) {
        console.error(`Failed to fetch deals for user ${userId}:`, dealsError.message);
        continue;
      }

      const userDeals = deals || [];

      // Filter deal changes yesterday
      const newDeals = userDeals.filter(d => d.created_at >= yesterdayISO);
      const wonDeals = userDeals.filter(d => d.stage === 'won' && d.actual_close_date >= yesterdayISO);
      const lostDeals = userDeals.filter(d => d.stage === 'lost' && d.actual_close_date >= yesterdayISO);

      // Simple at-risk logic: inactive >= 7 days or probability < 25 for active deals
      const atRiskDeals = userDeals.filter(d => {
        if (d.stage === 'won' || d.stage === 'lost') return false;
        const lastTouch = d.last_activity || d.updated_at || d.created_at;
        const inactiveDays = Math.floor((today.getTime() - new Date(lastTouch).getTime()) / 86_400_000);
        return inactiveDays >= 7 || (d.probability !== undefined && d.probability < 25);
      });

      // Skip digest if nothing happened and no active pipeline
      if (newDeals.length === 0 && wonDeals.length === 0 && lostDeals.length === 0 && atRiskDeals.length === 0) {
        continue;
      }

      const totalWonValue = wonDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);

      // 3. Construct digest message
      const digestHTML = `📊 <b>Nova CRM Daily Digest — รายงานประจำวัน</b> 📊\n\n` +
        `🆕 <b>ดีลใหม่:</b> ${newDeals.length} ดีล\n` +
        `✅ <b>ปิดดีลสำเร็จ:</b> ${wonDeals.length} ดีล (มูลค่ารวม ฿${totalWonValue.toLocaleString()})\n` +
        `❌ <b>ปิดดีลไม่ได้:</b> ${lostDeals.length} ดีล\n` +
        `⚠️ <b>ดีลที่มีความเสี่ยง (At-risk):</b> ${atRiskDeals.length} ดีล\n\n` +
        `เข้าระบบเพื่อบริหารความสัมพันธ์ลูกค้าของคุณวันนี้! 🚀`;

      const digestPlain = digestHTML.replace(/<[^>]*>?/gm, '');

      // Send to enabled integrations
      const sendPromises = [];

      if (integrations.telegram?.enabled) {
        sendPromises.push(notifyTelegram(integrations.telegram, digestHTML).catch(err => {
          console.error(`Telegram digest error for user ${userId}:`, err.message);
        }));
      }

      if (integrations.line_oa?.enabled) {
        sendPromises.push(notifyLineOA(integrations.line_oa, digestPlain).catch(err => {
          console.error(`LINE OA digest error for user ${userId}:`, err.message);
        }));
      }

      if (integrations.webhook?.enabled) {
        const payload = {
          event: 'DAILY_DIGEST',
          userId,
          summary: {
            newDealsCount: newDeals.length,
            wonDealsCount: wonDeals.length,
            wonDealsValue: totalWonValue,
            lostDealsCount: lostDeals.length,
            atRiskCount: atRiskDeals.length,
          },
          timestamp: new Date().toISOString()
        };
        sendPromises.push(notifyWebhook(integrations.webhook, payload).catch(err => {
          console.error(`Webhook digest error for user ${userId}:`, err.message);
        }));
      }

      await Promise.allSettled(sendPromises);
      notificationsSent++;
    }

    return res.status(200).json({ success: true, notificationsSent });
  } catch (error) {
    console.error("Cron Digest Error:", error.message);
    return res.status(500).json({ error: error.message || 'Digest execution failed' });
  }
}
