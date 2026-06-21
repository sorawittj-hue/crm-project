import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import { 
  Crown, Users, Sparkles, Calendar, Search, 
  UserCheck, ShieldAlert, Mail, Clock, RefreshCw, Plus,
  UserPlus, Trash2, Lock, Unlock, Loader2, Sliders, X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { 
  useAllProfiles, 
  useUpdateProfileRole, 
  useUpdateProfileSubscription,
  useDeleteProfile,
  useCreateProfile
} from '../../hooks/useUserProfiles';
import { useToast } from '../ui/Toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/Dialog';
import ConfirmDialog from '../ui/ConfirmDialog';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export function ConsoleCenterSection() {
  const { user } = useAuth();
  const { success, error } = useToast();
  
  // Security check - owner only
  const isOwner = user?.email === 'sorawittj@gmail.com';
  
  const { data: allProfiles = [], isLoading } = useAllProfiles();
  const updateRole = useUpdateProfileRole();
  const updateSubscription = useUpdateProfileSubscription();
  const deleteProfile = useDeleteProfile();
  const createProfile = useCreateProfile();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pro', 'trial', 'free'
  const [customExpiries, setCustomExpiries] = useState({}); // { [userId]: 'YYYY-MM-DD' }
  const [managedProfile, setManagedProfile] = useState(null);

  // Compute reactive managed profile based on fresh database queries
  const currentManagedProfile = useMemo(() => {
    if (!managedProfile) return null;
    return allProfiles.find(p => p.id === managedProfile.id) || managedProfile;
  }, [allProfiles, managedProfile]);

  const managedTrialEndDateString = useMemo(() => {
    if (!currentManagedProfile) return '';
    const date = currentManagedProfile.trial_ends_at 
      ? new Date(currentManagedProfile.trial_ends_at) 
      : new Date(new Date(currentManagedProfile.created_at).getTime() + 3 * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  }, [currentManagedProfile]);

  const managedTrialDaysLeft = useMemo(() => {
    if (!currentManagedProfile) return 0;
    const endDate = currentManagedProfile.trial_ends_at 
      ? new Date(currentManagedProfile.trial_ends_at) 
      : new Date(new Date(currentManagedProfile.created_at).getTime() + 3 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days < 0 ? 0 : days;
  }, [currentManagedProfile]);

  // Add User State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    fullName: '',
    email: '',
    password: '',
    planType: 'trial',
    role: 'member',
    trialDays: 3
  });
  const [isAdding, setIsAdding] = useState(false);

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);

  // Suspend State
  const [suspendConfirmOpen, setSuspendConfirmOpen] = useState(false);
  const [profileToSuspend, setProfileToSuspend] = useState(null);

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
      const isSuspended = profile.plan_type === 'suspended';
      let isUserTrial = false;

      if (!isUserPro && !isSuspended) {
        if (profile.plan_type === 'trial' || (!profile.plan_type && profile.created_at)) {
          const endDate = profile.trial_ends_at 
            ? new Date(profile.trial_ends_at) 
            : new Date(new Date(profile.created_at).getTime() + 3 * 24 * 60 * 60 * 1000);
          const now = new Date();
          isUserTrial = now < endDate;
        }
      }

      // 2. Tab filter
      if (activeTab === 'pro') return isUserPro;
      if (activeTab === 'trial') return isUserTrial;
      if (activeTab === 'free') return !isUserPro && !isUserTrial; // Expired, Free, and Suspended users shown under free/expired
      
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
      const isSuspended = profile.plan_type === 'suspended';
      if (isUserPro) {
        proCount++;
      } else if (isSuspended) {
        freeCount++; // Count suspended as part of free/expired category in overview
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

  const proPct = useMemo(() => {
    if (stats.total === 0) return 0;
    return (stats.pro / stats.total) * 100;
  }, [stats]);

  const trialPct = useMemo(() => {
    if (stats.total === 0) return 0;
    return (stats.trial / stats.total) * 100;
  }, [stats]);

  const freePct = useMemo(() => {
    if (stats.total === 0) return 0;
    return (stats.free / stats.total) * 100;
  }, [stats]);

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
      let trialEndsAt = undefined;
      if (newPlan === 'trial') {
        trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      } else if (newPlan === 'free') {
        trialEndsAt = new Date(Date.now() - 1000).toISOString(); // expired (past date)
      } else if (newPlan === 'pro') {
        trialEndsAt = null; // pro doesn't need trial ends at
      } else if (newPlan === 'suspended') {
        trialEndsAt = null;
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

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!addForm.fullName.trim() || !addForm.email.trim() || !addForm.password.trim()) {
      error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (addForm.password.length < 6) {
      error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsAdding(true);
    try {
      // 1. Create a non-persistent Supabase client instance so that it does not log the admin out!
      const tempClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });

      // 2. Sign up the user in Supabase auth
      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: addForm.email,
        password: addForm.password,
        options: {
          data: {
            full_name: addForm.fullName
          }
        }
      });

      if (authError) throw authError;
      if (!authData?.user?.id) throw new Error('ไม่ได้รับรหัสผู้ใช้จากระบบลงทะเบียน');

      // 3. Calculate trial expiration
      let trialEndsAt = null;
      if (addForm.planType === 'trial') {
        trialEndsAt = new Date(Date.now() + addForm.trialDays * 24 * 60 * 60 * 1000).toISOString();
      } else if (addForm.planType === 'free') {
        trialEndsAt = new Date(Date.now() - 1000).toISOString();
      }

      // 4. Create row in user_profiles
      await createProfile.mutateAsync({
        id: authData.user.id,
        email: addForm.email,
        fullName: addForm.fullName,
        role: addForm.role,
        planType: addForm.planType,
        trialEndsAt
      });

      success('เพิ่มผู้ใช้งานและลงทะเบียนบัญชีสำเร็จแล้ว');
      setIsAddModalOpen(false);
      setAddForm({
        fullName: '',
        email: '',
        password: '',
        planType: 'trial',
        role: 'member',
        trialDays: 3
      });
    } catch (err) {
      error('เกิดข้อผิดพลาดในการลงทะเบียน: ' + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!profileToDelete) return;
    try {
      await deleteProfile.mutateAsync(profileToDelete.id);
      setProfileToDelete(null);
      setManagedProfile(null); // Close the drawer if the deleted user is the one being managed
    } catch {
      // Toast is handled inside hook
    }
  };

  const handleToggleSuspend = async (profile) => {
    const isSuspended = profile.plan_type === 'suspended';
    try {
      if (isSuspended) {
        // Resume to free (or previous status, free is default safe fallback)
        await updateSubscription.mutateAsync({
          id: profile.id,
          planType: 'free',
          trialEndsAt: new Date(Date.now() - 1000).toISOString()
        });
        success('เปิดใช้งานบัญชีสำเร็จ');
      } else {
        // Suspend the user
        await updateSubscription.mutateAsync({
          id: profile.id,
          planType: 'suspended',
          trialEndsAt: null
        });
        success('ระงับการเข้าใช้งานบัญชีนี้เรียบร้อย');
      }
    } catch (err) {
      error('เกิดข้อผิดพลาด: ' + err.message);
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
          { 
            label: 'ผู้สมัครใช้งานทั้งหมด', 
            value: stats.total, 
            icon: Users, 
            gradient: 'from-violet-600 to-indigo-700', 
            shadow: 'shadow-violet-600/10' 
          },
          { 
            label: 'ผู้ใช้ระดับ PRO', 
            value: stats.pro, 
            icon: Crown, 
            gradient: 'from-amber-500 to-orange-600', 
            shadow: 'shadow-amber-500/10' 
          },
          { 
            label: 'กำลังทดลองใช้ (Active)', 
            value: stats.trial, 
            icon: Sparkles, 
            gradient: 'from-emerald-500 to-teal-600', 
            shadow: 'shadow-emerald-500/10' 
          },
          { 
            label: 'หมดอายุ / บัญชีฟรี / ระงับ', 
            value: stats.free, 
            icon: Clock, 
            gradient: 'from-slate-700 to-slate-800', 
            shadow: 'shadow-slate-700/10' 
          },
        ].map((item, idx) => (
          <div 
            key={idx} 
            className={cn(
              "p-5 rounded-[2rem] border-0 text-white flex flex-col justify-between relative overflow-hidden bg-gradient-to-br shadow-xl transition-all hover:-translate-y-0.5", 
              item.gradient, 
              item.shadow
            )}
          >
            {/* Background pattern decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{item.label}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/20 text-white">
                <item.icon size={15} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-white relative z-10">
              {isLoading ? '...' : item.value.toLocaleString()}
            </h3>
          </div>
        ))}
      </div>

      {/* Proportion Bar */}
      <Card className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-xs font-black text-slate-900">อัตราส่วนประเภทบัญชีผู้ใช้ (Account Classification Ratio)</h3>
            <p className="text-[10px] font-medium text-slate-500">สัดส่วนผู้ใช้ระดับพรีเมียม ทดลองใช้งาน และบัญชีฟรี</p>
          </div>
          <div className="text-[11px] font-bold text-slate-600">
            PRO: <span className="text-amber-600 font-extrabold">{proPct.toFixed(1)}%</span>
          </div>
        </div>
        
        {/* Multi-segment Progress Bar */}
        <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-200/30">
          {stats.pro > 0 && (
            <div 
              style={{ width: `${proPct}%` }} 
              className="bg-gradient-to-r from-amber-400 to-orange-500 h-full transition-all duration-500 cursor-help relative group"
              title={`PRO: ${stats.pro} คน (${proPct.toFixed(1)}%)`}
            />
          )}
          {stats.trial > 0 && (
            <div 
              style={{ width: `${trialPct}%` }} 
              className="bg-gradient-to-r from-violet-500 to-indigo-600 h-full transition-all duration-500 cursor-help"
              title={`TRIAL: ${stats.trial} คน (${trialPct.toFixed(1)}%)`}
            />
          )}
          {stats.free > 0 && (
            <div 
              style={{ width: `${freePct}%` }} 
              className="bg-slate-400 h-full transition-all duration-500 cursor-help"
              title={`FREE/EXPIRED/SUSPENDED: ${stats.free} คน (${freePct.toFixed(1)}%)`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-[10px] font-bold text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm shadow-orange-500/10" />
            <span>PRO ({stats.pro} คน)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-sm shadow-indigo-500/10" />
            <span>TRIAL ({stats.trial} คน)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-slate-400 shadow-sm" />
            <span>FREE / EXPIRED / SUSPENDED ({stats.free} คน)</span>
          </div>
        </div>
      </Card>

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
          
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อ หรือ อีเมลสมาชิก..."
                className="pl-9 pr-4 h-10 rounded-xl text-xs"
              />
            </div>
            
            {/* Add User Button */}
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="h-10 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-violet-500/20 text-xs shrink-0 border-0"
            >
              <UserPlus size={15} />
              เพิ่มผู้ใช้ใหม่
            </Button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit relative z-10">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'pro', label: 'Pro/พรีเมียม' },
            { id: 'trial', label: 'กำลังทดลอง' },
            { id: 'free', label: 'หมดอายุ/ฟรี/ระงับ' },
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
        <div className="space-y-3 relative z-10">
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
              const isSuspended = profile.plan_type === 'suspended';
              
              // Calculate trial status
              let trialDaysLeft = 0;
              let isUserTrial = false;

              if (!isUserPro && !isSuspended) {
                const endDate = profile.trial_ends_at 
                  ? new Date(profile.trial_ends_at) 
                  : new Date(new Date(profile.created_at).getTime() + 3 * 24 * 60 * 60 * 1000);
                const now = new Date();
                isUserTrial = now < endDate;
                
                const diffTime = endDate.getTime() - now.getTime();
                trialDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (trialDaysLeft < 0) trialDaysLeft = 0;
              }

              return (
                <div key={profile.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50/60 border border-slate-100 hover:bg-slate-50 hover:border-slate-200/80 transition-all group">
                  {/* Left Column: Avatar & User Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm transition-all',
                      isSuspended
                        ? 'bg-rose-50 border border-rose-100 text-rose-500'
                        : isUserPro 
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' 
                          : isUserTrial 
                            ? 'bg-violet-100 text-violet-700' 
                            : 'bg-slate-200 text-slate-600'
                    )}>
                      {(profile.full_name || profile.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-slate-800 truncate leading-none">
                          {profile.full_name || 'ไม่ระบุชื่อ'}
                        </span>
                        {isOwnerAccount && (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-violet-600 text-white uppercase tracking-wider">
                            OWNER 👑
                          </span>
                        )}
                        {isSuspended ? (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 uppercase tracking-wider flex items-center gap-0.5">
                            <Lock size={8} /> ระงับการใช้งาน
                          </span>
                        ) : isUserPro ? (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase tracking-wider">
                            PRO
                          </span>
                        ) : isUserTrial ? (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                            TRIAL ({trialDaysLeft} วัน)
                          </span>
                        ) : (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 uppercase tracking-wider">
                            FREE / EXPIRED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                        <Mail size={11} className="shrink-0" /> {profile.email}
                      </p>
                    </div>
                  </div>

                  {/* Middle Metadata (Registration / Last Login) */}
                  <div className="hidden md:flex items-center gap-6 text-[11px] text-slate-400 shrink-0">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      สมัคร: {new Date(profile.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </span>
                    {profile.last_seen_at ? (
                      <span className="flex items-center gap-1">
                        <UserCheck size={11} />
                        ใช้งานล่าสุด: {new Date(profile.last_seen_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <UserCheck size={11} />
                        ใช้งานล่าสุด: —
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold uppercase text-[9px]">
                      {profile.role || 'member'}
                    </span>
                  </div>

                  {/* Right Column: Manage Button */}
                  <div className="shrink-0 flex items-center gap-2">
                    {isOwnerAccount ? (
                      <div className="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
                        บัญชีหลัก
                      </div>
                    ) : (
                      <button
                        onClick={() => setManagedProfile(profile)}
                        className="h-9 px-3.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all border border-slate-200 shadow-sm active:scale-95 group-hover:border-violet-200 group-hover:text-violet-700"
                      >
                        <Sliders size={13} />
                        จัดการสมาชิก
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* 1. Add User Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md p-8 rounded-[2.5rem] border-0 shadow-2xl relative overflow-hidden bg-white">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 to-indigo-600" />
          
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <UserPlus className="text-violet-600" size={20} />
              เพิ่มผู้ใช้งานใหม่
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1 font-medium">
              ลงทะเบียนบัญชี Supabase Auth และสร้างโปรไฟล์โดยแอดมินจะไม่หลุดออกจากระบบ
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ชื่อ-นามสกุล</label>
              <Input
                value={addForm.fullName}
                onChange={e => setAddForm({ ...addForm, fullName: e.target.value })}
                placeholder="สมชาย มุ่งมั่น"
                className="h-10 rounded-xl text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">อีเมลเข้าใช้งาน</label>
              <Input
                type="email"
                value={addForm.email}
                onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                placeholder="somchai@example.com"
                className="h-10 rounded-xl text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)</label>
              <Input
                type="password"
                value={addForm.password}
                onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                placeholder="••••••••"
                className="h-10 rounded-xl text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">แผนสมาชิก</label>
                <select
                  value={addForm.planType}
                  onChange={e => setAddForm({ ...addForm, planType: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold outline-none cursor-pointer text-slate-600"
                >
                  <option value="pro">Pro (พรีเมียม)</option>
                  <option value="trial">Trial (ทดลองใช้)</option>
                  <option value="free">Free / Expired</option>
                  <option value="suspended">🔒 ระงับการใช้งาน</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">บทบาท</label>
                <select
                  value={addForm.role}
                  onChange={e => setAddForm({ ...addForm, role: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold outline-none cursor-pointer text-slate-600"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {addForm.planType === 'trial' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ระยะเวลาทดลองใช้ (วัน)</label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={addForm.trialDays}
                  onChange={e => setAddForm({ ...addForm, trialDays: parseInt(e.target.value) || 3 })}
                  className="h-10 rounded-xl text-xs"
                  required
                />
              </div>
            )}

            <DialogFooter className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 h-11 rounded-xl text-slate-600 border border-slate-200"
                disabled={isAdding}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold border-0 shadow-lg shadow-violet-500/20"
                disabled={isAdding}
              >
                {isAdding ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'สร้างผู้ใช้'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Delete User Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="ยืนยันการลบบัญชีผู้ใช้งาน"
        description={`คุณแน่ใจหรือไม่ที่จะลบบัญชีของ "${profileToDelete?.full_name || profileToDelete?.email}"? ข้อมูลโปรไฟล์และสิทธิ์สมาชิกทั้งหมดจะถูกลบทันที (การกระทำนี้ไม่สามารถกู้คืนได้)`}
        confirmLabel="ยืนยันการลบ"
        cancelLabel="ยกเลิก"
        variant="danger"
        isLoading={deleteProfile.isPending}
        onConfirm={handleDeleteConfirm}
      />

      {/* 3. Suspend User Confirmation Dialog */}
      <ConfirmDialog
        open={suspendConfirmOpen}
        onOpenChange={setSuspendConfirmOpen}
        title="ยืนยันการระงับบัญชีผู้ใช้"
        description={`คุณแน่ใจหรือไม่ที่จะระงับการเข้าใช้งานของ "${profileToSuspend?.full_name || profileToSuspend?.email}"? บัญชีนี้จะไม่สามารถเข้าใช้งานหรือเข้าถึงข้อมูลใดๆ ในระบบ CRM ได้ชั่วคราว`}
        confirmLabel="ระงับบัญชี"
        cancelLabel="ยกเลิก"
        variant="warning"
        isLoading={updateSubscription.isPending}
        onConfirm={() => {
          if (profileToSuspend) {
            handleToggleSuspend(profileToSuspend);
            setProfileToSuspend(null);
          }
        }}
      />

      {/* Manage User Drawer */}
      <AnimatePresence>
        {currentManagedProfile && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setManagedProfile(null)}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-100"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                    <Sliders size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-950">การจัดการบัญชีผู้ใช้งาน</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Console Center Controls</p>
                  </div>
                </div>
                <button 
                  onClick={() => setManagedProfile(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* User Hero Section */}
                <div className="p-5 rounded-2.5xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-100/80 flex items-start gap-4">
                  {/* Large Avatar */}
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-md shrink-0",
                    currentManagedProfile.plan_type === 'suspended'
                      ? "bg-slate-400"
                      : currentManagedProfile.email === 'sorawittj@gmail.com' || currentManagedProfile.plan_type === 'pro'
                        ? "bg-gradient-to-br from-amber-400 to-orange-500"
                        : currentManagedProfile.plan_type === 'trial'
                          ? "bg-gradient-to-br from-violet-500 to-indigo-600"
                          : "bg-slate-300"
                  )}>
                    {(currentManagedProfile.full_name || currentManagedProfile.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-base font-black text-slate-900 truncate">
                      {currentManagedProfile.full_name || 'ไม่ระบุชื่อ'}
                    </h4>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                      <Mail size={12} className="text-slate-400 shrink-0" />
                      {currentManagedProfile.email}
                    </p>
                    
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {currentManagedProfile.plan_type === 'suspended' ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 uppercase tracking-wider flex items-center gap-0.5">
                          <Lock size={8} /> SUSPENDED
                        </span>
                      ) : currentManagedProfile.email === 'sorawittj@gmail.com' || currentManagedProfile.plan_type === 'pro' ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase tracking-wider">
                          👑 PRO SUBSCRIBER
                        </span>
                      ) : currentManagedProfile.plan_type === 'trial' ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                          ⚡ TRIAL ACTIVE ({managedTrialDaysLeft} วัน)
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                          FREE / EXPIRED
                        </span>
                      )}
                      
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 uppercase">
                        {currentManagedProfile.role || 'member'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100/50 text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">วันที่สมัครใช้งาน</p>
                    <p className="font-bold text-slate-700 mt-0.5">
                      {new Date(currentManagedProfile.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">ใช้งานล่าสุด</p>
                    <p className="font-bold text-slate-700 mt-0.5">
                      {currentManagedProfile.last_seen_at 
                        ? new Date(currentManagedProfile.last_seen_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
                        : '—'}
                    </p>
                  </div>
                </div>

                {/* Form Actions Section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">การตั้งค่าสิทธิ์และแผนใช้งาน</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Plan Type Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">แผนสมาชิก</label>
                      <select
                        value={currentManagedProfile.plan_type || 'free'}
                        onChange={e => handleUpdatePlan(currentManagedProfile.id, e.target.value)}
                        disabled={updateSubscription.isPending}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold outline-none cursor-pointer text-slate-800 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                      >
                        <option value="pro">Pro (พรีเมียม)</option>
                        <option value="trial">Trial (ทดลองใช้)</option>
                        <option value="free">Free / Expired</option>
                        <option value="suspended">🔒 ระงับการใช้งาน</option>
                      </select>
                    </div>

                    {/* Role Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">บทบาทระบบ</label>
                      <select
                        value={currentManagedProfile.role || 'member'}
                        onChange={e => handleUpdateRole(currentManagedProfile.id, e.target.value)}
                        disabled={updateRole.isPending}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold outline-none cursor-pointer text-slate-800 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                      >
                        <option value="member">Member (ผู้ใช้ทั่วไป)</option>
                        <option value="admin">Admin (ผู้ควบคุม)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Trial Duration Extension (Show only if plan is trial or free/expired and not suspended) */}
                {currentManagedProfile.plan_type !== 'pro' && currentManagedProfile.plan_type !== 'suspended' && (
                  <div className="p-5 rounded-2.5xl border border-violet-100 bg-violet-50/30 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                        <Calendar size={14} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">ตัวจัดการระยะเวลาทดลองใช้ (Trial Manager)</h4>
                        <p className="text-[10px] text-slate-500 font-medium">ขยายเวลาหรือระบุวันที่หมดอายุทดลองใช้แบบเฉพาะคน</p>
                      </div>
                    </div>

                    {/* Current Expire Info */}
                    <div className="p-3 bg-white rounded-xl border border-violet-100/50 flex justify-between items-center text-xs">
                      <span className="text-slate-500">วันหมดอายุปัจจุบัน:</span>
                      <span className="font-bold text-violet-700">
                        {currentManagedProfile.trial_ends_at
                          ? new Date(currentManagedProfile.trial_ends_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
                          : 'ยังไม่เริ่มทดลองใช้'}
                      </span>
                    </div>

                    {/* Quick Extend Buttons */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">ปุ่มลัดขยายเวลาทดลอง</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: '+3 วัน', val: 3 },
                          { label: '+7 วัน', val: 7 },
                          { label: '+30 วัน', val: 30 },
                        ].map(btn => (
                          <button
                            key={btn.label}
                            onClick={() => handleQuickExtendTrial(currentManagedProfile, btn.val)}
                            disabled={updateSubscription.isPending}
                            className="h-10 bg-white hover:bg-violet-600 hover:text-white border border-violet-200 text-violet-700 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center"
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Calendar Selector */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">กำหนดวันหมดอายุเป็นวันเฉพาะ</span>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="date"
                            value={customExpiries[currentManagedProfile.id] || managedTrialEndDateString}
                            onChange={e => setCustomExpiries({ ...customExpiries, [currentManagedProfile.id]: e.target.value })}
                            className="w-full h-11 px-3 border border-slate-200 rounded-xl text-xs outline-none bg-white text-slate-800 focus:border-violet-400 transition-all cursor-pointer"
                          />
                        </div>
                        {customExpiries[currentManagedProfile.id] && customExpiries[currentManagedProfile.id] !== managedTrialEndDateString && (
                          <Button
                            className="h-11 px-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shrink-0 border-0 flex items-center gap-1.5"
                            onClick={() => handleCustomExpirySave(currentManagedProfile.id)}
                            disabled={updateSubscription.isPending}
                          >
                            <Plus size={14} />
                            บันทึกวัน
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Danger Zone */}
                <div className="p-5 rounded-2.5xl border border-rose-100 bg-rose-50/30 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                      <ShieldAlert size={14} />
                    </div>
                    <h4 className="text-xs font-black text-rose-950">Danger Zone (พื้นที่ควบคุมความปลอดภัย)</h4>
                  </div>

                  <p className="text-[10px] text-rose-700/70 leading-relaxed font-medium">
                    การกระทำในส่วนนี้มีผลกระทบโดยตรงต่อสิทธิ์การเข้าใช้งานระบบ CRM ของสมาชิกคนนี้ กรุณาตรวจสอบให้แน่ใจก่อนทำการเปลี่ยนแปลงใดๆ
                  </p>

                  <div className="flex flex-col gap-2 pt-2">
                    {/* Suspend / Resume Option */}
                    <button
                      onClick={() => {
                        if (currentManagedProfile.plan_type === 'suspended') {
                          handleToggleSuspend(currentManagedProfile);
                        } else {
                          setProfileToSuspend(currentManagedProfile);
                          setSuspendConfirmOpen(true);
                        }
                      }}
                      disabled={updateSubscription.isPending}
                      className={cn(
                        "w-full h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all active:scale-[0.98]",
                        currentManagedProfile.plan_type === 'suspended'
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg shadow-emerald-500/10"
                          : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                      )}
                    >
                      {currentManagedProfile.plan_type === 'suspended' ? (
                        <>
                          <Unlock size={14} />
                          เปิดระบบระงับใช้งาน (Unsuspend User)
                        </>
                      ) : (
                        <>
                          <Lock size={14} />
                          ระงับการเข้าใช้งานระบบ (Suspend User)
                        </>
                      )}
                    </button>

                    {/* Delete Option */}
                    <button
                      onClick={() => {
                        setProfileToDelete(currentManagedProfile);
                        setDeleteConfirmOpen(true);
                      }}
                      disabled={deleteProfile.isPending}
                      className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-rose-500/10 border-0"
                    >
                      <Trash2 size={14} />
                      ลบบัญชีและล้างข้อมูลถาวร (Delete Account)
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
