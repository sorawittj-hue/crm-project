import { supabase } from '../utils/supabase';
import {
  DEFAULT_MONTHLY_TARGET,
  DEFAULT_MEMBER_TARGET,
  addOwnerIdIfSupported,
  getRequiredUserId,
  isMissingColumnError,
  removeMissingColumn,
} from './sessionScope';

const DEFAULTS = {
  monthly_target: DEFAULT_MONTHLY_TARGET,
  leader_target: 7000000,
  member_target: DEFAULT_MEMBER_TARGET,
  company_name: '',
  company_industry: '',
  currency: 'THB',
  fiscal_month_start: 1,
  timezone: 'Asia/Bangkok',
  integrations: {},
};

function toSettingsPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );
}

async function safeUpsertSettings(initialPayload) {
  let payload = toSettingsPayload(initialPayload);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data, error } = await supabase
      .from('app_settings')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (!error) return data;

    if (!isMissingColumnError(error)) {
      console.error('Unable to update app settings:', error);
      throw new Error('Settings could not be updated: ' + error.message);
    }

    const nextPayload = removeMissingColumn(payload, error);
    if (nextPayload === payload) {
      return { ...DEFAULTS, ...payload };
    }

    payload = nextPayload;
  }

  return { ...DEFAULTS, ...payload };
}

export async function fetchAppSettings() {
  const userId = await getRequiredUserId();
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    if (isMissingColumnError(error)) {
      const { data: legacyData, error: legacyError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();

      if (legacyError) {
        return { id: 'global', ...DEFAULTS };
      }

      return { id: 'global', ...DEFAULTS, ...legacyData };
    }

    console.error('Unable to load app settings:', error);
    throw new Error('Settings could not be loaded');
  }

  if (!data) {
    const created = await safeUpsertSettings(
      addOwnerIdIfSupported('app_settings', { id: userId, ...DEFAULTS, owner_id: userId }, userId)
    );
    return { ...DEFAULTS, ...created };
  }

  return { ...DEFAULTS, ...data };
}

export async function updateAppSettings(updates) {
  const userId = await getRequiredUserId();
  const payload = {
    id: userId,
    owner_id: userId,
    monthly_target: Number(updates.monthly_target) || DEFAULT_MONTHLY_TARGET,
    leader_target: Number(updates.leader_target) || 0,
    member_target: Number(updates.member_target) || DEFAULT_MEMBER_TARGET,
    company_name: updates.company_name ?? '',
    company_industry: updates.company_industry ?? '',
    currency: updates.currency || 'THB',
    fiscal_month_start: Number(updates.fiscal_month_start) || 1,
    timezone: updates.timezone || 'Asia/Bangkok',
    integrations: updates.integrations,
    updated_at: new Date().toISOString(),
  };

  const data = await safeUpsertSettings(addOwnerIdIfSupported('app_settings', payload, userId));
  return { ...DEFAULTS, ...data };
}
