import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import {
  fetchNotifications,
  upsertNotification,
  upsertNotificationsBatch,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
  dismissAllNotifications,
} from '../services/apiNotifications';
import { generateNotifications } from '../utils/notificationEngine';
import { useToast } from '../components/ui/Toast';

const POLL_INTERVAL = 60_000;   // re-fetch from DB every 60s
const ENGINE_INTERVAL = 5 * 60_000;  // run proactive engine every 5 min

function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Double tone sine wave chime (F5 -> A5)
    const now = ctx.currentTime;
    
    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(698.46, now); // F5
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.08, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    
    // Second tone (slightly offset)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.08); // A5
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.08, now + 0.13);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    
    osc1.start(now);
    osc1.stop(now + 0.4);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.5);
  } catch (e) {
    console.warn('Audio context chime blocked or failed:', e);
  }
}

export function useNotifications(userId) {
  const toast = useToast();
  const prevNotifsRef = useRef([]);

  const query = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => fetchNotifications(userId),
    enabled: !!userId,
    refetchInterval: POLL_INTERVAL,
    staleTime: 30_000,
  });

  const currentNotifs = query.data || [];

  useEffect(() => {
    if (!userId || !currentNotifs.length) {
      if (currentNotifs.length === 0) {
        prevNotifsRef.current = [];
      }
      return;
    }

    // Only diff if we already had a previous list loaded
    if (prevNotifsRef.current.length > 0) {
      const prevKeys = new Set(prevNotifsRef.current.map(n => n.id));
      const newUnread = currentNotifs.filter(n => !n.is_read && !prevKeys.has(n.id));

      if (newUnread.length > 0) {
        let settings = { soundEnabled: true, desktopEnabled: false };
        try {
          const stored = localStorage.getItem('crm.notificationSettings.v1');
          if (stored) settings = { ...settings, ...JSON.parse(stored) };
        } catch (e) {
          console.error('Error loading notification preferences:', e);
        }

        // Trigger notifications for new unread items
        newUnread.forEach(notif => {
          // 1. Toast Alert
          toast.info(notif.title, { description: notif.message, duration: 5000 });

          // 2. Desktop Notification
          if (settings.desktopEnabled && Notification.permission === 'granted' && document.hidden) {
            try {
              new Notification(notif.title, {
                body: notif.message,
                icon: '/icon.svg',
              });
            } catch (e) {
              console.error('Desktop notification failed:', e);
            }
          }
        });

        // 3. Sound Chime (only play once per batch)
        if (settings.soundEnabled) {
          playNotificationChime();
        }
      }
    }

    prevNotifsRef.current = currentNotifs;
  }, [currentNotifs, userId, toast]);

  return query;
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

      // Load user preferences for categories from localStorage to pass to engine
      let settings = {
        enabledCategories: {
          deal_at_risk: true,
          deal_closing_overdue: true,
          follow_up_overdue: true,
          deal_closing_soon: true,
          monthly_goal_at_risk: true,
          deal_stale: true,
        },
        staleDaysThreshold: 3
      };
      try {
        const stored = localStorage.getItem('crm.notificationSettings.v1');
        if (stored) settings = { ...settings, ...JSON.parse(stored) };
      } catch (e) {
        console.error('Error loading settings in proactive engine:', e);
      }

      const notifs = generateNotifications({ 
        deals, 
        activities: activities || [], 
        userId, 
        monthlyTarget,
        enabledCategories: settings.enabledCategories,
        staleDaysThreshold: settings.staleDaysThreshold
      });

      if (notifs.length === 0) return;

      const results = await upsertNotificationsBatch(notifs);
      if (results && results.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      }
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
