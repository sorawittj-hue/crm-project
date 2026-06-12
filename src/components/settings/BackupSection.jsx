import { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { Database, DownloadCloud, UploadCloud, AlertTriangle, Loader2, RefreshCcw, HardDriveDownload, CalendarClock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { exportWorkspaceData, restoreWorkspaceData, factoryResetWorkspace } from '../../services/apiBackup';
import { getAutoBackupHistory } from '../../hooks/useAutoBackup';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscription } from '../../hooks/useSubscription';
import { useAppStore } from '../../store/useAppStore';

export function BackupSection() {
  const { user } = useAuth();
  const { openPaywall } = useAppStore();
  const { canUsePremiumFeatures, isGuestAccount } = useSubscription();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const [autoBackups, setAutoBackups] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    if (user?.id) {
      getAutoBackupHistory(user.id).then(history => {
        setAutoBackups(history);
        setIsLoadingHistory(false);
      });
    }
  }, [user?.id]);

  const handleExport = async () => {
    if (!canUsePremiumFeatures) {
      openPaywall(isGuestAccount ? 'default' : 'premium_only');
      return;
    }
    if (!user?.id) return;
    setIsExporting(true);
    try {
      const data = await exportWorkspaceData(user.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nova-pipeline-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success('ดาวน์โหลดไฟล์สำรองข้อมูลสำเร็จ');
    } catch (err) {
      error('เกิดข้อผิดพลาดในการสำรองข้อมูล: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    if (!canUsePremiumFeatures) {
      openPaywall(isGuestAccount ? 'default' : 'premium_only');
      return;
    }
    if (!user?.id) return;
    setIsExporting(true);
    try {
      const data = await exportWorkspaceData(user.id);
      
      // Convert Deals to CSV
      if (data.deals && data.deals.length > 0) {
        const dealsHeaders = Object.keys(data.deals[0]).join(',');
        const dealsRows = data.deals.map(d => Object.values(d).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
        const dealsCSV = [dealsHeaders, ...dealsRows].join('\n');
        
        const blob = new Blob(['\ufeff' + dealsCSV], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nova-pipeline-deals-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      success('ดาวน์โหลดไฟล์ CSV สำเร็จ (PDPA Data Export)');
    } catch (err) {
      error('เกิดข้อผิดพลาดในการส่งออกข้อมูล: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsRestoring(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await processRestore(parsed);
    } catch (err) {
      error('ไฟล์ไม่ถูกต้อง หรือเกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsRestoring(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleRestoreAutoBackup = async (backupData) => {
    if (!canUsePremiumFeatures) {
      openPaywall(isGuestAccount ? 'default' : 'premium_only');
      return;
    }
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการกู้คืนข้อมูลจากวันที่นี้? (ข้อมูลที่มีอยู่จะถูกเขียนทับด้วย ID เดิม)')) return;
    setIsRestoring(true);
    try {
      await processRestore(backupData);
    } catch (err) {
      error('เกิดข้อผิดพลาดในการกู้คืนข้อมูล: ' + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  const processRestore = async (parsedData) => {
    const result = await restoreWorkspaceData(parsedData, user.id);
    await queryClient.invalidateQueries({ queryKey: ['deals'] });
    await queryClient.invalidateQueries({ queryKey: ['customers'] });
    await queryClient.invalidateQueries({ queryKey: ['activities'] });
    success(`กู้คืนข้อมูลสำเร็จ! ลูกค้า ${result.customersCount} | ดีล ${result.dealsCount} | กิจกรรม ${result.activitiesCount}`);
  };

  const handleFactoryReset = async () => {
    if (!user?.id) return;
    setIsResetting(true);
    try {
      await factoryResetWorkspace(user.id);
      await queryClient.invalidateQueries({ queryKey: ['deals'] });
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      await queryClient.invalidateQueries({ queryKey: ['activities'] });
      success('ล้างข้อมูลในระบบสำเร็จ ระบบของคุณว่างเปล่าแล้ว');
      setShowResetConfirm(false);
    } catch (err) {
      error('เกิดข้อผิดพลาดในการล้างข้อมูล: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-3xl border border-white shadow-xl shadow-slate-200/50 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-400/10 to-transparent rounded-bl-full -z-0 pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Database className="text-violet-600" size={24} /> จัดการข้อมูล
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">สำรอง กู้คืน และจัดการข้อมูลทั้งหมดในพื้นที่ทำงานของคุณ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {/* Export Box */}
          <div className="p-6 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <DownloadCloud size={20} />
                </div>
                <h3 className="font-bold text-slate-800">ส่งออกข้อมูล (Manual Backup)</h3>
              </div>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                ดาวน์โหลดข้อมูล ลูกค้า, ดีล, และกิจกรรมทั้งหมดออกมาเป็นไฟล์ <span className="font-bold text-slate-700">.json</span> เก็บไว้ในเครื่องของคุณ
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md text-xs font-semibold"
              >
                {isExporting ? <Loader2 size={16} className="animate-spin mr-2" /> : <HardDriveDownload size={16} className="mr-2" />}
                ดาวน์โหลด JSON
              </Button>
              <Button
                onClick={handleExportCSV}
                disabled={isExporting}
                variant="outline"
                className="w-full h-11 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 rounded-xl shadow-sm text-xs font-semibold"
              >
                {isExporting ? <Loader2 size={16} className="animate-spin mr-2" /> : <HardDriveDownload size={16} className="mr-2" />}
                ส่งออก CSV (PDPA)
              </Button>
            </div>
          </div>

          {/* Import Box */}
          <div className="p-6 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UploadCloud size={20} />
                </div>
                <h3 className="font-bold text-slate-800">กู้คืนข้อมูล (Restore)</h3>
              </div>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                อัปโหลดไฟล์ <span className="font-bold text-slate-700">.json</span> เพื่อกู้คืนข้อมูล ระบบจะทำการเขียนทับข้อมูลเดิมที่มี ID ตรงกัน และเพิ่มข้อมูลใหม่
              </p>
            </div>
            <div>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                onClick={() => {
                  if (!canUsePremiumFeatures) {
                    openPaywall(isGuestAccount ? 'default' : 'premium_only');
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                disabled={isRestoring}
                className="w-full h-11 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl shadow-sm text-sm font-semibold mt-4"
              >
                {isRestoring ? <Loader2 size={16} className="animate-spin mr-2" /> : <UploadCloud size={16} className="mr-2" />}
                เลือกไฟล์อัปโหลด
              </Button>
            </div>
          </div>
        </div>

        {/* Auto Backup Section */}
        <div className="relative z-10 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock size={18} className="text-violet-600" />
            <h3 className="font-bold text-slate-800">ประวัติการสำรองข้อมูลอัตโนมัติ (Auto-Backup)</h3>
          </div>
          <p className="text-xs font-medium text-slate-500 mb-4">
            ระบบจะทำการแบ็คอัปข้อมูลลงในเบราว์เซอร์ของคุณอัตโนมัติวันละ 1 ครั้ง และเก็บย้อนหลังสูงสุด 7 วัน
          </p>

          <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
            {isLoadingHistory ? (
              <div className="p-8 text-center"><Loader2 size={24} className="animate-spin text-slate-300 mx-auto" /></div>
            ) : autoBackups.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm font-medium">ยังไม่มีประวัติการสำรองข้อมูลอัตโนมัติ</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {autoBackups.map((bkp, i) => {
                  const dateObj = new Date(bkp.date);
                  const isToday = new Date().toDateString() === dateObj.toDateString();
                  return (
                    <div key={bkp.id} className="p-4 flex items-center justify-between hover:bg-white transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs",
                          isToday ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-500"
                        )}>
                          {isToday ? 'วันนี้' : dateObj.toLocaleDateString('th-TH', { weekday: 'short' })}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{dateObj.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {bkp.dealsCount} ดีล • {bkp.customersCount} ลูกค้า • {bkp.activitiesCount} กิจกรรม
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        disabled={isRestoring}
                        onClick={() => handleRestoreAutoBackup(bkp.data)}
                        className="text-xs h-8 px-3 rounded-lg text-violet-600 hover:bg-violet-50 font-bold"
                      >
                        <RefreshCcw size={12} className="mr-1.5" /> กู้คืน
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-8 rounded-[2rem] bg-rose-50/30 border border-rose-100 shadow-sm space-y-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
              <AlertTriangle size={18} /> โซนอันตราย (Danger Zone)
            </h3>
            <p className="text-xs font-medium text-rose-500/80 mt-1">ลบข้อมูลลูกค้า, ดีล, และกิจกรรมทั้งหมดออกจากระบบ</p>
          </div>
          <Button
            onClick={() => {
              if (!canUsePremiumFeatures) {
                openPaywall(isGuestAccount ? 'default' : 'premium_only');
              } else {
                setShowResetConfirm(true);
              }
            }}
            variant="destructive"
            className="h-10 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md shadow-rose-500/20 whitespace-nowrap"
          >
            ล้างข้อมูลทั้งหมด (Factory Reset)
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        onConfirm={handleFactoryReset}
        title="ยืนยันการล้างข้อมูลทั้งหมด"
        description="การกระทำนี้จะไม่สามารถย้อนกลับได้ ข้อมูลลูกค้า ดีล และกิจกรรมทั้งหมดของคุณจะถูกลบออกจากฐานข้อมูลอย่างถาวร (ยกเว้นในกรณีที่คุณมีไฟล์ Backup เก็บไว้) คุณแน่ใจหรือไม่?"
        confirmLabel="ใช่, ลบข้อมูลทั้งหมด"
        cancelLabel="ยกเลิก"
      />
    </div>
  );
}
