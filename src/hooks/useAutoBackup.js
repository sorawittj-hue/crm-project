import { useEffect, useState } from 'react';
import localforage from 'localforage';
import { exportWorkspaceData } from '../services/apiBackup';
import { useAuth } from './useAuth';
import { useQueryClient } from '@tanstack/react-query';

// Configure localforage for our backups
const backupStore = localforage.createInstance({
  name: 'NovaPipeline',
  storeName: 'auto_backups',
  description: 'Daily automatic backups of workspace data'
});

const MAX_BACKUPS = 7; // Keep last 7 days

export function useAutoBackup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [lastBackupTime, setLastBackupTime] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    const checkAndRunBackup = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const backupKey = `backup_${user.id}_${todayStr}`;
        
        // Check if we already backed up today
        const existingBackup = await backupStore.getItem(backupKey);
        
        if (!existingBackup) {
          // We need to run backup
          console.log('[AutoBackup] Running daily backup...');
          const data = await exportWorkspaceData(user.id);
          
          await backupStore.setItem(backupKey, {
            ...data,
            auto_backup_date: new Date().toISOString() // specific timestamp
          });
          
          setLastBackupTime(new Date().toISOString());
          
          // Cleanup old backups
          const keys = await backupStore.keys();
          const userKeys = keys.filter(k => k.startsWith(`backup_${user.id}_`)).sort();
          
          if (userKeys.length > MAX_BACKUPS) {
            const keysToDelete = userKeys.slice(0, userKeys.length - MAX_BACKUPS);
            for (const k of keysToDelete) {
              await backupStore.removeItem(k);
            }
          }
          console.log('[AutoBackup] Daily backup completed successfully.');
        } else {
          setLastBackupTime(existingBackup.auto_backup_date);
        }
      } catch (err) {
        console.error('[AutoBackup] Failed to run auto backup:', err);
      }
    };

    // Run on mount
    checkAndRunBackup();
    
    // Also check every 12 hours just in case the tab stays open
    const intervalId = setInterval(checkAndRunBackup, 12 * 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [user?.id, queryClient]);

  return { lastBackupTime };
}

// Helper to fetch history for UI
export async function getAutoBackupHistory(userId) {
  if (!userId) return [];
  const keys = await backupStore.keys();
  const userKeys = keys.filter(k => k.startsWith(`backup_${userId}_`)).sort().reverse();
  
  const history = [];
  for (const k of userKeys) {
    const item = await backupStore.getItem(k);
    if (item) {
      history.push({
        id: k,
        date: item.auto_backup_date,
        dealsCount: item.data?.deals?.length || 0,
        customersCount: item.data?.customers?.length || 0,
        activitiesCount: item.data?.activities?.length || 0,
        data: item // The raw data
      });
    }
  }
  return history;
}
