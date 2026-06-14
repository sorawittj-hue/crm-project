// Service to handle sending notifications to configured integrations

function getSettings() {
  try {
    const saved = localStorage.getItem('nova_integrations');
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    console.error('Failed to parse integration settings', e);
    return {};
  }
}

async function notifyTelegram(settings, message) {
  if (!settings.enabled || !settings.bot_token || !settings.chat_id) return;

  try {
    const url = `https://api.telegram.org/bot${settings.bot_token}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: settings.chat_id,
        text: message,
        parse_mode: 'HTML'
      })
    });
    console.log('[Integration] Telegram notification sent.');
  } catch (err) {
    console.error('[Integration] Telegram error:', err);
  }
}

async function notifyLineOA(settings, message) {
  if (!settings.enabled || !settings.channel_token || !settings.user_id) return;

  try {
    // Note: Calling LINE API directly from browser usually fails due to CORS.
    // This requires a proxy or backend. We use no-cors to attempt sending it anyway,
    // though the request body might be stripped or preflight might fail.
    const url = 'https://api.line.me/v2/bot/message/push';
    await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.channel_token}`
      },
      body: JSON.stringify({
        to: settings.user_id,
        messages: [{ type: 'text', text: message }]
      })
    });
    console.log('[Integration] LINE OA notification sent.');
  } catch (err) {
    console.error('[Integration] LINE OA error:', err);
  }
}

async function notifyWebhook(settings, payload) {
  if (!settings.enabled || !settings.webhook_url) return;

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (settings.secret_key) {
      headers['X-Nova-Signature'] = settings.secret_key;
    }

    await fetch(settings.webhook_url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    console.log('[Integration] Webhook notification sent.');
  } catch (err) {
    console.error('[Integration] Webhook error:', err);
  }
}

export async function dispatchNotification(eventType, data) {
  const settings = getSettings();
  
  let message = '';
  if (eventType === 'DEAL_WON') {
    message = `🎉 <b>ปิดดีลสำเร็จ!</b> 🎉\n\n<b>ลูกค้า:</b> ${data.customerName || 'ไม่ระบุ'}\n<b>มูลค่า:</b> ฿${Number(data.value).toLocaleString()}\n<b>สร้างโดย:</b> ${data.userEmail || 'เซลส์'}`;
  } else if (eventType === 'DEAL_CREATED') {
    message = `🆕 <b>ได้ Lead ใหม่!</b>\n\n<b>ลูกค้า:</b> ${data.customerName || 'ไม่ระบุ'}\n<b>มูลค่าคาดหวัง:</b> ฿${Number(data.value).toLocaleString()}`;
  } else {
    return;
  }

  const promises = [];

  if (settings.telegram) {
    promises.push(notifyTelegram(settings.telegram, message));
  }
  
  if (settings.line_oa) {
    // LINE OA doesn't support HTML tags like Telegram does. We strip them out.
    const cleanMessage = message.replace(/<[^>]*>?/gm, '');
    promises.push(notifyLineOA(settings.line_oa, cleanMessage));
  }

  if (settings.webhook) {
    promises.push(notifyWebhook(settings.webhook, { event: eventType, data }));
  }

  await Promise.allSettled(promises);
}
