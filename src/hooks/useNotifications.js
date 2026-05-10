import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import {
  fetchNotifications,
  upsertNotification,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
  dismissAllNotifications,
} from '../services/apiNotifications';
import { generateNotifications } from '../utils/notificationEngine';
import { useToast } from '../components/ui/Toast';

const POLL_INTERVAL = 60_000;   // re-fetch from DB every 60s
const ENGINE_INTERVAL = 5 * 60_000;  // run proactive engine every 5 min

export function useNotifications(userId) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => fetchNotifications(userId),
    enabled: !!userId,
    refetchInterval: POLL_INTERVAL,
    staleTime: 30_000,
  });
}

// Proactive engine: generates notifications from deals/activities and upserts them
export function useProactiveEngine({ userId, deals, activities, monthlyTarget }) {
  const queryClient = useQueryClient();
  const lastRunRef = useRef(0);

  useEffect(() => {
    if (!userId || !deals?.length) return;

    const runEngine = async () => {
      const now = Date.now();
      if (now - lastRunRef.current < ENGINE_INTERVAL) return;
      lastRunRef.current = now;

      const notifs = generateNotifications({ deals, activities: activities || [], userId, monthlyTarget });
      for (const notification of notifs) {
        const result = await upsertNotification(notification);
        if (result === null) break;
      }
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    };

    runEngine();
    const timer = setInterval(runEngine, ENGINE_INTERVAL);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, deals, activities, monthlyTarget]);
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('อ่านทั้งหมดแล้ว');
    },
  });
}

export function useDismissNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dismissNotification,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const snapshots = queryClient.getQueriesData({ queryKey: ['notifications'] });
      queryClient.setQueriesData({ queryKey: ['notifications'] }, (old) =>
        old ? old.filter(n => n.id !== id) : old
      );
      return { snapshots };
    },
    onError: (_, __, ctx) => {
      ctx?.snapshots?.forEach(([key, val]) => queryClient.setQueryData(key, val));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useDismissAllNotifications() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: dismissAllNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('ล้างการแจ้งเตือนทั้งหมดแล้ว');
    },
  });
}
