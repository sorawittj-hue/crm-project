import { supabase } from '../utils/supabase';
import { getLocalDeals, getLocalCustomers, getLocalActivities, endLocalTrial, isLocalTrialActive } from './localDb';

/**
 * Migrates all local Sandbox data to Supabase cloud for a newly registered user.
 * Handles ID remapping (local string IDs → Supabase UUIDs) and reports progress.
 *
 * @param {string} userId - The authenticated Supabase user ID
 * @param {Function} onProgress - Optional callback: ({ step, total, label, migrated }) => void
 * @returns {{ success: boolean, migrated: object, errors: Array }}
 */
export const migrateLocalToSupabase = async (userId, onProgress = null) => {
  if (!userId || !isLocalTrialActive()) {
    return { success: false, message: 'No active local trial or missing user ID', migrated: {} };
  }

  const report = {
    success: false,
    migrated: { customers: 0, deals: 0, activities: 0 },
    errors: [],
  };

  const notify = (step, total, label, migrated = {}) => {
    if (typeof onProgress === 'function') {
      onProgress({ step, total, label, migrated });
    }
  };

  try {
    const customers = getLocalCustomers();
    const deals = getLocalDeals();
    const activities = getLocalActivities();

    const TOTAL_STEPS = 3;

    // ── Step 1: Customers ──────────────────────────────────────────────────
    notify(1, TOTAL_STEPS, `กำลังย้ายข้อมูลลูกค้า (${customers.length} รายการ)...`);
    const customerIdMap = {};

    for (const c of customers) {
      const oldId = c.id;
      const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = c;
      const payload = { ...rest, owner_id: userId };

      const { data, error } = await supabase.from('customers').insert(payload).select('id').single();
      if (!error && data) {
        customerIdMap[oldId] = data.id;
        report.migrated.customers++;
      } else if (error) {
        report.errors.push({ entity: 'customer', id: oldId, error: error.message });
      }
    }

    // ── Step 2: Deals ─────────────────────────────────────────────────────
    notify(2, TOTAL_STEPS, `กำลังย้ายดีล (${deals.length} รายการ)...`, { customers: report.migrated.customers });
    const dealIdMap = {};

    for (const d of deals) {
      const oldId = d.id;
      const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = d;
      const payload = {
        ...rest,
        owner_id: userId,
        customer_id: d.customer_id ? (customerIdMap[d.customer_id] ?? null) : null,
      };

      const { data, error } = await supabase.from('deals').insert(payload).select('id').single();
      if (!error && data) {
        dealIdMap[oldId] = data.id;
        report.migrated.deals++;
      } else if (error) {
        report.errors.push({ entity: 'deal', id: oldId, error: error.message });
      }
    }

    // ── Step 3: Activities ────────────────────────────────────────────────
    notify(3, TOTAL_STEPS, `กำลังย้ายกิจกรรม (${activities.length} รายการ)...`, {
      customers: report.migrated.customers,
      deals: report.migrated.deals,
    });

    for (const a of activities) {
      const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = a;
      const payload = {
        ...rest,
        owner_id: userId,
        deal_id: a.deal_id ? (dealIdMap[a.deal_id] ?? null) : null,
      };

      const { error } = await supabase.from('activities').insert(payload);
      if (!error) {
        report.migrated.activities++;
      } else {
        report.errors.push({ entity: 'activity', id: a.id, error: error.message });
      }
    }

    // ── Cleanup ───────────────────────────────────────────────────────────
    endLocalTrial();
    report.success = true;

    notify(TOTAL_STEPS, TOTAL_STEPS, 'ย้ายข้อมูลสำเร็จ!', report.migrated);
    return report;

  } catch (err) {
    console.error('[Migration] Failed:', err);
    report.errors.push({ entity: 'system', error: err.message });
    return report;
  }
};
