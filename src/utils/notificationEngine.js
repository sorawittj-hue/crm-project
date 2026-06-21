// Generates proactive notification payloads from deals + activities.
// Each notification has a stable notification_key for idempotent upserts.

const STAGE_LABEL = {
  lead: 'ลีด',
  contact: 'ติดต่อแล้ว',
  proposal: 'เสนอราคา',
  negotiation: 'กำลังปิด',
  won: 'ปิดสำเร็จ',
  lost: 'เสียดีล',
};

function fmt(value) {
  const n = Number(value || 0);
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(0)}K`;
  return `฿${n.toLocaleString()}`;
}

export function generateNotifications({ 
  deals = [], 
  activities = [], 
  userId, 
  monthlyTarget,
  enabledCategories,
  staleDaysThreshold
}) {
  const now = Date.now();
  const notifs = [];
  const activeThreshold = staleDaysThreshold ?? 3;

  for (const deal of deals) {
    if (['won', 'lost'].includes(deal.stage)) continue;

    const lastMs = new Date(deal.last_activity || deal.created_at).getTime();
    const daysInactive = Math.floor((now - lastMs) / 86_400_000);
    const stageLabel = STAGE_LABEL[deal.stage] || deal.stage;
    const name = deal.company || deal.title;

    // Deal at risk — proposal/negotiation with inactivity tiers
    if (!enabledCategories || enabledCategories.deal_at_risk) {
      if (['proposal', 'negotiation'].includes(deal.stage)) {
        if (daysInactive >= 7) {
          notifs.push({
            notification_key: `deal_at_risk_critical_${deal.id}`,
            user_id: userId,
            type: 'deal_at_risk',
            priority: 'critical',
            title: `🔴 ดีลวิกฤต: ${name}`,
            message: `ไม่มีความเคลื่อนไหว ${daysInactive} วัน — ${stageLabel} · ${fmt(deal.value)}`,
            related_deal_id: deal.id,
          });
        } else if (daysInactive >= 5) {
          notifs.push({
            notification_key: `deal_at_risk_high_${deal.id}`,
            user_id: userId,
            type: 'deal_at_risk',
            priority: 'high',
            title: `🟠 เสี่ยงหลุด: ${name}`,
            message: `ไม่มีความเคลื่อนไหว ${daysInactive} วัน — ${stageLabel} · ${fmt(deal.value)}`,
            related_deal_id: deal.id,
          });
        } else if (daysInactive >= 3) {
          notifs.push({
            notification_key: `deal_at_risk_medium_${deal.id}`,
            user_id: userId,
            type: 'deal_at_risk',
            priority: 'medium',
            title: `🟡 ต้องติดตาม: ${name}`,
            message: `ไม่มีความเคลื่อนไหว ${daysInactive} วัน — ${stageLabel} · ${fmt(deal.value)}`,
            related_deal_id: deal.id,
          });
        }
      }
    }

    // Stale deal — other active stages with no activity
    if (!enabledCategories || enabledCategories.deal_stale) {
      if (!['proposal', 'negotiation'].includes(deal.stage) && daysInactive >= activeThreshold) {
        const priority = daysInactive >= 10 ? 'high' : daysInactive >= 7 ? 'medium' : 'low';
        notifs.push({
          notification_key: `deal_stale_${deal.id}`,
          user_id: userId,
          type: 'deal_stale',
          priority,
          title: `ดีลหยุดนิ่ง: ${name}`,
          message: `ไม่มีความเคลื่อนไหว ${daysInactive} วัน — ${stageLabel} · ${fmt(deal.value)}`,
          related_deal_id: deal.id,
        });
      }
    }

    // Closing soon / overdue
    if (deal.expected_close_date) {
      const closeMs = new Date(deal.expected_close_date).getTime();
      const daysToClose = Math.ceil((closeMs - now) / 86_400_000);
      const closeDateStr = new Date(deal.expected_close_date).toLocaleDateString('th-TH');

      if (daysToClose <= 0) {
        if (!enabledCategories || enabledCategories.deal_closing_overdue) {
          notifs.push({
            notification_key: `deal_closing_overdue_${deal.id}`,
            user_id: userId,
            type: 'deal_closing_overdue',
            priority: 'high',
            title: `⏰ เลยกำหนดปิด: ${deal.title}`,
            message: `วันปิดผ่านไปแล้ว ${Math.abs(daysToClose)} วัน · ${fmt(deal.value)}`,
            related_deal_id: deal.id,
          });
        }
      } else if (daysToClose <= 3) {
        if (!enabledCategories || enabledCategories.deal_closing_soon) {
          notifs.push({
            notification_key: `deal_closing_soon_3d_${deal.id}`,
            user_id: userId,
            type: 'deal_closing_soon',
            priority: 'high',
            title: `🎯 ปิดดีลใน ${daysToClose} วัน: ${deal.title}`,
            message: `คาดปิด ${closeDateStr} · ${fmt(deal.value)}`,
            related_deal_id: deal.id,
          });
        }
      } else if (daysToClose <= 7) {
        if (!enabledCategories || enabledCategories.deal_closing_soon) {
          notifs.push({
            notification_key: `deal_closing_soon_7d_${deal.id}`,
            user_id: userId,
            type: 'deal_closing_soon',
            priority: 'medium',
            title: `📅 ปิดดีลใน ${daysToClose} วัน: ${deal.title}`,
            message: `คาดปิด ${closeDateStr} · ${fmt(deal.value)}`,
            related_deal_id: deal.id,
          });
        }
      }
    }
  }

  // Overdue / due-today follow-ups
  if (!enabledCategories || enabledCategories.follow_up_overdue) {
    const dealMap = Object.fromEntries(deals.map(d => [d.id, d]));
    const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);

    for (const activity of activities) {
      if (!activity.scheduled_at || activity.completed_at || !activity.deal_id) continue;
      const deal = dealMap[activity.deal_id];
      if (!deal || ['won', 'lost'].includes(deal.stage)) continue;

      const scheduledMs = new Date(activity.scheduled_at).getTime();
      if (scheduledMs > endOfToday.getTime()) continue;

      const overdueDays = Math.floor((now - scheduledMs) / 86_400_000);
      notifs.push({
        notification_key: `follow_up_due_${activity.id}`,
        user_id: userId,
        type: 'follow_up_overdue',
        priority: overdueDays > 1 ? 'high' : 'medium',
        title: overdueDays > 0 ? `เลยนัด: ${activity.title}` : `นัดวันนี้: ${activity.title}`,
        message: `${deal.company || deal.title}${overdueDays > 0 ? ` · เลย ${overdueDays} วัน` : ' · วันนี้'}`,
        related_deal_id: deal.id,
        related_activity_id: activity.id,
      });
    }
  }

  // Monthly goal at risk
  if (monthlyTarget && monthlyTarget > 0) {
    if (!enabledCategories || enabledCategories.monthly_goal_at_risk) {
      const today = new Date();
      const wonThisMonth = deals
        .filter(d => {
          if (d.stage !== 'won') return false;
          const cd = new Date(d.actual_close_date || d.created_at);
          return cd.getMonth() === today.getMonth() && cd.getFullYear() === today.getFullYear();
        })
        .reduce((s, d) => s + Number(d.value || 0), 0);

      const progress = wonThisMonth / monthlyTarget;
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const daysPassed = today.getDate();
      const expectedProgress = daysPassed / daysInMonth;

      if (daysPassed >= 7 && progress < expectedProgress * 0.7) {
        notifs.push({
          notification_key: `monthly_goal_at_risk_${today.getFullYear()}_${today.getMonth()}`,
          user_id: userId,
          type: 'monthly_goal_at_risk',
          priority: progress < 0.3 ? 'critical' : 'high',
          title: '📊 เป้าเดือนนี้เสี่ยงไม่ถึง',
          message: `ทำได้ ${Math.round(progress * 100)}% จากเป้า ${fmt(monthlyTarget)} — เหลือ ${daysInMonth - daysPassed} วัน`,
          related_deal_id: null,
        });
      }
    }
  }

  return notifs;
}
