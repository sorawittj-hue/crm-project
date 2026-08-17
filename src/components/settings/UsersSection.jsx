import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { Clock, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { useAllProfiles, useUpdateProfileRole } from '../../hooks/useUserProfiles';
import { useToast } from '../ui/Toast';
import { useAppStore } from '../../store/useAppStore';

export function UsersSection() {
  const { user } = useAuth();
  const { openPaywall } = useAppStore();
  const { shouldBlockBasic, isGuestAccount } = useSubscription();
  const { data: allProfiles = [] } = useAllProfiles();
  const updateRole = useUpdateProfileRole();
  const { success, error } = useToast();

  const handleUpdateRole = async (id, newRole) => {
    if (shouldBlockBasic) {
      openPaywall(isGuestAccount ? 'default' : 'trial_ended');
      return;
    }
    try {
      await updateRole.mutateAsync({ id, role: newRole });
      success('อัปเดตสิทธิ์ผู้ใช้งานสำเร็จ');
    } catch (err) {
      error('เกิดข้อผิดพลาดในการอัปเดตสิทธิ์: ' + err.message);
    }
  };

  return (
    <Card className="p-8 rounded-[2rem] bg-white/60 dark:bg-[#0f111a]/80 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-400/10 to-transparent rounded-bl-full -z-0 pointer-events-none" />
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight relative z-10 flex items-center gap-2">
            จัดการผู้ใช้งานระบบ
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300">{allProfiles.length} คน</span>
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 relative z-10">เพิ่ม/ลบผู้ใช้ และกำหนดสิทธิ์การใช้งาน</p>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        {allProfiles.map(profile => {
          const isSelf = profile.id === user?.id;
          const isProfileAdmin = profile.role === 'admin';
          return (
            <div key={profile.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-white dark:hover:from-white/[0.06] dark:hover:to-white/[0.04] hover:border-violet-100 dark:hover:border-violet-500/20 hover:shadow-sm transition-all group">
              <div className={cn('p-0.5 rounded-xl shrink-0', isProfileAdmin ? 'bg-gradient-to-br from-violet-400 to-indigo-500' : 'bg-gradient-to-br from-slate-300 to-slate-400')}>
                <div className={cn(
                  'w-10 h-10 rounded-[10px] flex items-center justify-center font-bold text-sm border border-white/20',
                  isProfileAdmin ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300' : 'bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300'
                )}>
                  {(profile.full_name || profile.email || '?').charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                    {profile.full_name || profile.email}
                  </p>
                  {isSelf && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300">คุณ</span>}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{profile.email}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full',
                    isProfileAdmin ? 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                  )}>
                    {isProfileAdmin ? 'Admin' : 'Member'}
                  </span>
                  {profile.last_seen_at && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(profile.last_seen_at).toLocaleDateString('th-TH')}
                    </span>
                  )}
                </div>
              </div>
              {!isSelf && (
                <select
                  value={profile.role}
                  onChange={e => handleUpdateRole(profile.id, e.target.value)}
                  disabled={updateRole.isPending}
                  className="h-8 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171926] text-xs font-bold outline-none cursor-pointer text-slate-600 dark:text-slate-300 shrink-0 hover:border-violet-300 dark:hover:border-violet-500/40 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30 transition-all appearance-none"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              )}
            </div>
          );
        })}
        {allProfiles.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center mx-auto mb-3">
              <Users size={28} className="text-violet-400" />
            </div>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">ยังไม่มีผู้ใช้งานในระบบ</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">ผู้ใช้จะปรากฏที่นี่เมื่อมีการลงทะเบียน</p>
          </div>
        )}
      </div>
    </Card>
  );
}
