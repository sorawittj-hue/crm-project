import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { ShieldCheck, Clock } from 'lucide-react';
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
    <Card className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-3xl border border-white shadow-xl shadow-slate-200/50 space-y-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-400/10 to-transparent rounded-bl-full -z-0 pointer-events-none" />
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight relative z-10">จัดการผู้ใช้งานระบบ</h2>
          <p className="text-sm font-medium text-slate-500 mt-1 relative z-10">เพิ่ม/ลบผู้ใช้ และกำหนดสิทธิ์การใช้งาน</p>
        </div>
      </div>

      <div className="space-y-3">
        {allProfiles.map(profile => {
          const isSelf = profile.id === user?.id;
          const isProfileAdmin = profile.role === 'admin';
          return (
            <div key={profile.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0',
                isProfileAdmin ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-600'
              )}>
                {(profile.full_name || profile.email || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {profile.full_name || profile.email}
                  </p>
                  {isSelf && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600">คุณ</span>}
                </div>
                <p className="text-xs text-slate-400 truncate">{profile.email}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full',
                    isProfileAdmin ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-600'
                  )}>
                    {isProfileAdmin ? 'Admin' : 'Member'}
                  </span>
                  {profile.last_seen_at && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
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
                  className="h-8 px-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold outline-none cursor-pointer text-slate-600 shrink-0"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
