import { supabase } from '../utils/supabase';

export async function fetchEmailTemplates() {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error('Could not load email templates');
  return data || [];
}

export async function addEmailTemplate(template) {
  const { data, error } = await supabase
    .from('email_templates')
    .insert([{ ...template, created_at: new Date().toISOString() }])
    .select();
  if (error) throw new Error('Could not add template: ' + error.message);
  return data?.[0];
}

export async function updateEmailTemplate({ id, ...updates }) {
  const { data, error } = await supabase
    .from('email_templates')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw new Error('Could not update template');
  return data?.[0];
}

export async function deleteEmailTemplate(id) {
  const { error } = await supabase.from('email_templates').delete().eq('id', id);
  if (error) throw new Error('Could not delete template');
  return true;
}
