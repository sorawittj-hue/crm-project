// src/hooks/useTeam.js — ถ้ายังไม่มี ให้สร้างไฟล์นี้
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useTeam() {
  return useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const { data, error } = await supabase.from('team_members').select('*').order('created_at');
      if (error) throw error;
      return data || [];
    },
  });
}
