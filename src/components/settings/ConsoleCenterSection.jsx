import { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import { 
  ShieldCheck, Crown, Users, Sparkles, Calendar, Search, 
  UserCheck, ShieldAlert, Mail, Clock, RefreshCw, UserMinus, Plus
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { useAllProfiles, useUpdateProfileRole, useUpdateProfileSubscription } from '../../hooks/useUserProfiles';
import { useToast } from '../ui/Toast';

export function ConsoleCenterSection() {
  const { user } = useAuth();
  const { success, error } = useToast();
  
  // Security check - owner only
  const isOwner = user?.email === 'sorawittj@gmail.com';
  
  const { data: allProfiles = [], isLoading } = useAllProfiles();
  const updateRole = useUpdateProfileRole();
  const updateSubscription = useUpdateProfileSubscription();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pro', 'trial', 'free'
  const [customExpiries, setCustomExpiries] = useState({}); // { [userId]: 'YYYY-MM-DD' }

  // Filter & Search logic
  const filteredProfiles = useMemo(() => {
    return allProfiles.filter(profile => {
      // 1. Search filter
      const matchesSearch = 
        (profile.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (profile.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // Calculate status for filtering
      const isUserPro = profile.email === 'sorawittj@gmail.com' || profile.plan_type === 'pro';
      let isUserTrial = false;
      let isUserExpired = false;

      if (!isUserPro) {
        if (profile.plan_type === 'trial' || (!profile.plan_type && profile.created_at)) {
          const endDate = profile.trial_ends_at 
            ? new Date(profile.trial_ends_at) 
            : new Date(new Date(profile.created_at).getTime() + 3 * 24 * 60 * 60 * 1000);
          const now = new Date();
          isUserTrial = now < endDate;
          isUserExpired = now >= endDate;
        }
      }

      // 2. Tab filter
      if (activeTab === 'pro') return isUserPro;
      if (activeTab === 'trial') return isUserTrial;
      if (activeTab === 'free') return !isUserPro && (isUserExpired || (!isUserTrial && !isUserPro));
      
      return true;
    });
  }, [allProfiles, searchTerm, activeTab]);

  // Subscription stats
  const stats = useMemo(() => {
    let proCount = 0;
    let trialCount = 0;
    let freeCount = 0;

    allProfiles.forEach(profile => {
      const isUserPro = profile.email === 'sorawittj@gmail.com' || profile.plan_type === 'pro';
      if (isUserPro) {
        proCount++;
      } else {
        const endDate = profile.trial_ends_at 
          ? new Date(profile.trial_ends_at) 
          : new Date(new Date(profile.created_at).getTime() + 3 * 24 * 60 * 60 * 1000);
        const now = new Date();
        if (now < endDate) {
          trialCount++;
        } else {
          freeCount++;
        }
      }
    });

    return {
      total: allProfiles.length,
      pro: proCount,
      trial: trialCount,
      free: freeCount
    };
  }, [allProfiles]);

  const handleUpdateRole = async (id, newRole) => {
    try {
      await updateRole.mutateAsync({ id, role: newRole });
      success('อัปเดตบทบาทผู้ใช้งานสำเร็จ');
    } catch (err) {
      error('เกิดข้อผิดพลาดในการอัปเดตบทบาท: ' + err.message);
    }
  };

  const handleUpdatePlan = async (id, newPlan) => {
    try {
      // If setting to trial, we should also default/ensure trial_ends_at is set to 3 days from now if not present
      let trialEndsAt = undefined;
      if (newPlan === 'trial') {
        trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      } else if (newPlan === 'free') {
        trialEndsAt = new Date(Date.now() - 1000).toISOString(); // expired (past date)
      } else if (newPlan === 'pro') {
        trialEndsAt = null; // pro doesn't need trial ends at
      }
      
      await updateSubscription.mutateAsync({ id, planType: newPlan, trialEndsAt });
      success('ปรับเปลี่ยนแผนใช้งานสำเร็จ');
    } catch (err) {
      error('เกิดข้อผิดพลาดในการปรับแผน: ' + err.message);
    }
  };

  const handleQuickExtendTrial = async (profile, days) => {
    try {
      const currentExpiry = profile.trial_ends_at 
        ? new Date(profile.trial_ends_at).getTime() 
        : new Date(profile.created_at).getTime() + 3 * 24 * 60 * 60 * 1000;
      
      // If currently expired, extend from 'now', else extend from current expiry
      const baseTime = currentExpiry < Date.now() ? Date.now() : currentExpiry;
      const newExpiry = new Date(baseTime + days * 24 * 60 * 60 * 1000).toISOString();

      await updateSubscription.mutateAsync({ 
        id: profile.id, 
        planType: 'trial', 
        trialEndsAt: newExpiry 
      });
      success(`ขยายเวลาทดลองใช้สำเร็จ (+${days} วัน)`);
    } catch (err) {
      error('เกิดข้อผิดพลาดในการต่ออายุ: ' + err.message);
    }
  };

  const handleCustomExpirySave = async (id) => {
    const customDate = customExpiries[id];
    if (!customDate) return;
    try {
      const trialEndsAt = new Date(customDate + 'T23:59:59').toISOString();
      await updateSubscription.mutateAsync({ 
        id, 
        planType: 'trial', 
        trialEndsAt 
      });
      success('อัปเดตวันหมดอายุผู้ใช้งานสำเร็จ');
    } catch (err) {
      error('เกิดข้อผิดพลาดในการอัปเดตวันหมดอายุ: ' + err.message);
    }
  };

  if (!isOwner) {
    return (
      <Card className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-xl flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">ปฏิเสธการเข้าใช้งาน</h2>
        <p className="text-slate-500 text-sm mt-2 max-w-xs leading-relaxed">
          หน้าจอ Console Center นี้จำกัดสิทธิ์ให้เข้าใช้ได้เฉพาะเจ้าของระบบผู้สร้างแอปพลิเคชันเท่านั้น
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'ผู้สมัครใช้งานทั้งหมด', value: stats.total, icon: Users, color: 'text-violet-600 bg-violet-50 border-violet-100' },
          { label: 'ผู้ใช้ระดับ PRO', value: stats.pro, icon: Crown, color: 'text-amber-500 bg-amber-50 border-amber-100' },
          { label: 'กำลังทดลองใช้ (Active)', value: stats.trial, icon: Sparkles, color: 'text-emerald-500 bg-emerald-50 border-emerald-100' },
          { label: 'หมดอายุ / บัญชีฟรี', value: stats.free, icon: Clock, color: 'text-slate-500 bg-slate-50 border-slate-200' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", item.color)}>
                <item.icon size={14} />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900">{isLoading ? '...' : item.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Console Area */}
      <Card className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-400/5 to-transparent rounded-bl-full pointer-events-none" />
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Crown className="text-amber-500 fill-current" size={20} />
              Console Center (ระบบจัดการสมาชิก)
            </h2>
            <p className="text-xs font-bold text-slate-400 mt-1">
              แผงควบคุมหลังบ้านเฉพาะคุณสรวิศ เพื่อจัดการสิทธิ์ผู้ใช้งานทั้งหมด
            </p>
          </div>
          
          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อ หรือ อีเมลสมาชิก..."
              className="pl-9 pr-4 h-10 rounded-xl text-xs"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit relative z-10">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'pro', label: 'Pro/พรีเมียม' },
            { id: 'trial', label: 'กำลังทดลอง' },
            { id: 'free', label: 'หมดอายุ/ฟรี' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                activeTab === tab.id 
                  ? "bg-white text-violet-700 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* User List */}
        <div className="space-y-4 relative z-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <RefreshCw className="animate-spin" size={24} />
              <p className="text-xs font-bold">กำลังโหลดรายชื่อผู้ใช้...</p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <p className="text-xs font-bold">ไม่พบรายชื่อผู้ใช้งานที่ตรงตามเงื่อนไข</p>
            </div>
          ) : (
            filteredProfiles.map(profile => {
              const isUserPro = profile.email === 'sorawittj@gmail.com' || profile.plan_type === 'pro';
              const isOwnerAccount = profile.email === 'sorawittj@gmail.com';
              
              // Calculate trial status
              let trialDaysLeft = 0;
              let isUserTrial = false;
              let isUserExpired = false;
              let trialEndDateString = '';

              if (!isUserPro) {
                const endDate = profile.trial_ends_at 
                  ? new Date(profile.trial_ends_at) 
                  : new Date(new Date(profile.created_at).getTime() + 3 * 24 * 60 * 60 * 1000);
                const now = new Date();
                isUserTrial = now < endDate;
                isUserExpired = now >= endDate;
                trialEndDateString = endDate.toISOString().split('T')[0];
                
                const diffTime = endDate.getTime() - now.getTime();
                trialDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (trialDaysLeft < 0) trialDaysLeft = 0;
              }

              return (
                <div key={profile.id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                  {/* Left Column: Avatar & User Info */}
                  <div className="flex items-start gap-3.5 min-w-[280px]">
                    <div className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm',
                      isUserPro 
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' 
                        : isUserTrial 
                          ? 'bg-violet-100 text-violet-700' 
                          : 'bg-slate-200 text-slate-600'
                    )}>
                      {(profile.full_name || profile.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-black text-slate-800 leading-none">
                          {profile.full_name || 'ไม่ระบุชื่อ'}
                        </p>
                        {isOwnerAccount && (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-violet-600 text-white uppercase tracking-wider">
                            OWNER 👑
                          </span>
                        )}
                        {isUserPro ? (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-white uppercase tracking-wider flex items-center gap-0.5">
                            PRO
                          </span>
                        ) : isUserTrial ? (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-500 text-white uppercase tracking-wider">
                            TRIAL ({trialDaysLeft} วัน)
                          </span>
                        ) : (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-300 text-slate-600 uppercase tracking-wider">
                            FREE / EXPIRED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Mail size={11} /> {profile.email}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          สมัคร: {new Date(profile.created_at).toLocaleDateString('th-TH')}
                        </span>
                        {profile.last_seen_at && (
                          <span className="flex items-center gap-1">
                            <UserCheck size={10} />
                            ใช้งานล่าสุด: {new Date(profile.last_seen_at).toLocaleDateString('th-TH')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  {isOwnerAccount ? (
                    <div className="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl h-fit w-fit lg:self-center">
                      บัญชีหลัก (แก้ไขสิทธิ์ไม่ได้)
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 lg:border-t-0 pt-4 lg:pt-0">
                      
                      {/* 1. Plan Changer */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">แผนสมาชิก</span>
                        <select
                          value={profile.plan_type || 'free'}
                          onChange={e => handleUpdatePlan(profile.id, e.target.value)}
                          disabled={updateSubscription.isPending}
                          className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold outline-none cursor-pointer text-slate-600 w-32"
                        >
                          <option value="pro">Pro (พรีเมียม)</option>
                          <option value="trial">Trial (ทดลองใช้)</option>
                          <option value="free">Free / Expired</option>
                        </select>
                      </div>

                      {/* 2. Quick Extend Trial (Only relevant if not PRO) */}
                      {profile.plan_type !== 'pro' && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">ขยายเวลาทดลองใช้</span>
                          <div className="flex gap-1">
                            {[
                              { label: '+3 วัน', val: 3 },
                              { label: '+7 วัน', val: 7 },
                              { label: '+30 วัน', val: 30 },
                            ].map(btn => (
                              <button
                                key={btn.label}
                                onClick={() => handleQuickExtendTrial(profile, btn.val)}
                                disabled={updateSubscription.isPending}
                                className="h-8 px-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 transition-colors"
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. Custom Calendar Expiry (Only if not PRO) */}
                      {profile.plan_type !== 'pro' && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">กำหนดวันหมดอายุ</span>
                          <div className="flex gap-1 items-center">
                            <input
                              type="date"
                              value={customExpiries[profile.id] || trialEndDateString}
                              onChange={e => setCustomExpiries({ ...customExpiries, [profile.id]: e.target.value })}
                              className="h-8 px-2 border border-slate-200 rounded-lg text-xs outline-none bg-white text-slate-600"
                            />
                            {customExpiries[profile.id] && customExpiries[profile.id] !== trialEndDateString && (
                              <Button
                                size="icon"
                                className="h-8 w-8 bg-violet-600 hover:bg-violet-700 rounded-lg shrink-0"
                                onClick={() => handleCustomExpirySave(profile.id)}
                                disabled={updateSubscription.isPending}
                              >
                                <Plus size={14} />
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 4. Role Changer */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">บทบาท</span>
                        <select
                          value={profile.role || 'member'}
                          onChange={e => handleUpdateRole(profile.id, e.target.value)}
                          disabled={updateRole.isPending}
                          className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold outline-none cursor-pointer text-slate-600 w-28"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
