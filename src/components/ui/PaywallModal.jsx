import { useState, useCallback } from 'react';
import { Dialog, DialogContent } from './Dialog';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { migrateLocalToSupabase } from '../../lib/migration';
import {
  Crown, Sparkles, CheckCircle2, Shield, Zap, ShieldCheck,
  Loader2, LogIn, Mail, Lock, User, AlertCircle,
  ArrowRight, Star, Users2, Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const SOCIAL_PROOF = [
  'Kasikorn Digital', 'Central Retail', 'PTTEP', 'Minor Hotels', 'Grab Thailand',
];

const PRO_BENEFITS = [
  { icon: Shield, label: 'ฐานข้อมูลส่วนตัว 100%', desc: 'ความปลอดภัยระดับ Enterprise' },
  { icon: Zap, label: 'บันทึกข้อมูลไม่จำกัด', desc: 'ดีล ลูกค้า กิจกรรม ทุกอย่าง' },
  { icon: Sparkles, label: 'AI Copilot วิเคราะห์ดีล', desc: 'กลยุทธ์ปิดการขายจาก AI' },
  { icon: ShieldCheck, label: 'Auto-Backup (Cloud)', desc: 'สำรองข้อมูลทุกวันอัตโนมัติ' },
];

export default function PaywallModal() {
  const { isPaywallOpen, closePaywall, paywallReason } = useAppStore();
  const { signOut, signUp } = useAuth();
  const { isGuestAccount } = useSubscription();

  // Payment confirmation state
  const [confirming, setConfirming] = useState(false);

  // Registration state
  const [registering, setRegistering] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [registerError, setRegisterError] = useState('');

  // Migration progress state
  const [migrating, setMigrating] = useState(false);
  const [migrationStep, setMigrationStep] = useState(null);
  const [migrationDone, setMigrationDone] = useState(null);

  // Success / final state
  const [success, setSuccess] = useState(false);
  const [successType, setSuccessType] = useState('premium');

  const handleConfirmPayment = () => {
    setConfirming(true);
    setTimeout(() => {
      setConfirming(false);
      setSuccess(true);
      setSuccessType('premium');
    }, 1800);
  };

  const handleRegister = useCallback(async (e) => {
    e?.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setRegisterError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (formData.password.length < 6) {
      setRegisterError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    setRegistering(true);
    setRegisterError('');

    const { data, error } = await signUp(formData.email, formData.password, formData.name);

    if (error) {
      setRegisterError(error.message);
      setRegistering(false);
      return;
    }

    // Migration with progress feedback
    const userId = data?.user?.id;
    if (userId && isGuestAccount) {
      setRegistering(false);
      setMigrating(true);

      await migrateLocalToSupabase(userId, ({ step, total, label, migrated }) => {
        setMigrationStep({ step, total, label, migrated });
      });

      setMigrating(false);
      setMigrationDone(true);

      setTimeout(() => {
        setSuccess(true);
        setSuccessType('trial');
        setMigrationDone(null);
      }, 800);
    } else {
      setRegistering(false);
      setSuccess(true);
      setSuccessType('trial');
    }
  }, [formData, signUp, isGuestAccount]);

  const handleClose = useCallback(() => {
    closePaywall();
    setTimeout(() => {
      setSuccess(false);
      setSuccessType('premium');
      setConfirming(false);
      setRegistering(false);
      setMigrating(false);
      setMigrationStep(null);
      setMigrationDone(null);
      setFormData({ name: '', email: '', password: '' });
      setRegisterError('');
    }, 350);
  }, [closePaywall]);

  const isGuestUpgrade = paywallReason === 'guest_upgrade';
  const isTrialEnded = paywallReason === 'trial_ended';
  const isDefault = paywallReason === 'default';
  const isMigratingOrDone = migrating || migrationDone;

  return (
    <Dialog open={isPaywallOpen} onOpenChange={handleClose} className="max-w-4xl">
      <DialogContent className="overflow-hidden p-0 border-0 bg-white sm:rounded-3xl shadow-2xl">
        <AnimatePresence mode="wait">

          {/* ── SUCCESS SCREEN ── */}
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-12 flex flex-col items-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/15"
              >
                <CheckCircle2 size={40} />
              </motion.div>
              <span className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2 block">
                {successType === 'premium' ? 'Upgrade Successful' : 'Welcome to Nova!'}
              </span>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
                {successType === 'premium' ? 'ขอต้อนรับสู่ Premium!' : 'บัญชีสร้างสำเร็จแล้ว!'}
              </h3>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-8">
                {successType === 'premium'
                  ? 'ระบบได้อัปเกรดสิทธิ์ของคุณเรียบร้อยแล้ว เข้าถึงฟีเจอร์ Pro ได้ทันที'
                  : 'ข้อมูล Sandbox ถูกย้ายขึ้น Cloud เรียบร้อย คุณพร้อมเริ่มต้นใช้งานจริงได้เลย'
                }
              </p>
              <button
                onClick={handleClose}
                className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
              >
                เริ่มต้นใช้งาน <ArrowRight size={16} className="inline ml-1" />
              </button>
            </motion.div>

          ) : (
            /* ── MAIN MODAL ── */
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col md:flex-row"
            >
              {/* ── LEFT COLUMN: Benefits ── */}
              <div className="w-full md:w-5/12 bg-slate-900 p-8 text-white relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-16 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-5">
                    <Crown size={22} className="text-amber-400" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight mb-1.5">Nova Pro</h3>
                  <p className="text-slate-400 text-sm mb-7 leading-relaxed">
                    {isTrialEnded
                      ? 'หมดเวลาทดลองแล้ว — อัปเกรดเพื่อทำงานต่อโดยไม่ขาดตอน'
                      : isGuestUpgrade
                        ? 'บันทึกข้อมูลขึ้น Cloud และรับสิทธิ์ Pro ฟรี 3 วัน'
                        : 'ปลดล็อคศักยภาพการขายเต็มรูปแบบ'}
                  </p>

                  <div className="space-y-4">
                    {PRO_BENEFITS.map(({ icon: Icon, label, desc }) => (
                      <div key={label} className="flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 text-violet-400">
                          <Icon size={15} />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm leading-none mb-1">{label}</p>
                          <p className="text-xs text-slate-400">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Social proof */}
                <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-1 mb-2">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={11} className="text-amber-400 fill-amber-400" />
                    ))}
                    <span className="text-[11px] text-slate-400 ml-1.5">4.9 (127 รีวิว)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">ไว้วางใจโดย</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SOCIAL_PROOF.map(name => (
                      <span key={name} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-400">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── RIGHT COLUMN ── */}
              <div className="w-full md:w-7/12 p-8 lg:p-10 bg-white">

                {/* GUEST UPGRADE */}
                {isGuestUpgrade ? (
                  <div className="flex flex-col h-full">
                    <div className="mb-5">
                      <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest bg-violet-50 px-2 py-1 rounded-md">
                        Sandbox → Cloud
                      </span>
                      <h2 className="text-xl font-black text-slate-900 mt-3 tracking-tight">สมัครสมาชิก Nova Pipeline</h2>
                      <p className="text-sm text-slate-500 mt-1">ข้อมูลทดลองย้ายขึ้น Cloud อัตโนมัติ ไม่มีข้อมูลสูญหาย</p>
                    </div>

                    {/* Feature comparison */}
                    <div className="mb-5 rounded-xl border border-slate-100 overflow-hidden text-xs">
                      <div className="grid grid-cols-3 font-black uppercase tracking-wider text-[10px]">
                        <div className="bg-slate-50 px-3 py-2 text-slate-400">ฟีเจอร์</div>
                        <div className="bg-slate-100 px-3 py-2 text-slate-500 text-center">Sandbox</div>
                        <div className="bg-violet-600 px-3 py-2 text-white text-center">หลังสมัคร ✓</div>
                      </div>
                      {[
                        { label: 'ที่เก็บข้อมูล', sandbox: '🌐 เบราว์เซอร์', pro: '☁️ Cloud' },
                        { label: 'ข้อมูลคงอยู่', sandbox: '❌ ปิด tab = หาย', pro: '✅ ถาวร' },
                        { label: 'Real-time Sync', sandbox: '❌', pro: '✅ ทุกอุปกรณ์' },
                        { label: 'Export & Backup', sandbox: '❌', pro: '✅ Pro' },
                      ].map((row, i) => (
                        <div key={i} className="grid grid-cols-3 border-t border-slate-100">
                          <div className="px-3 py-2 font-semibold text-slate-700">{row.label}</div>
                          <div className="px-3 py-2 text-slate-500 text-center bg-slate-50/50">{row.sandbox}</div>
                          <div className="px-3 py-2 text-violet-700 font-bold text-center bg-violet-50/40">{row.pro}</div>
                        </div>
                      ))}
                    </div>

                    {/* Migration progress overlay */}
                    {isMigratingOrDone ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                        {migrationDone ? (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                            <CheckCircle2 size={48} className="text-emerald-500 mb-3 mx-auto" />
                            <p className="font-black text-slate-900">ย้ายข้อมูลสำเร็จ!</p>
                          </motion.div>
                        ) : (
                          <>
                            <Loader2 size={36} className="text-violet-500 animate-spin mb-4" />
                            <p className="font-bold text-slate-900 text-sm mb-1">
                              {migrationStep?.label || 'กำลังย้ายข้อมูล...'}
                            </p>
                            {migrationStep && (
                              <p className="text-xs text-slate-400">
                                ขั้นตอน {migrationStep.step}/{migrationStep.total}
                              </p>
                            )}
                            {migrationStep?.migrated && (
                              <div className="flex gap-3 mt-3 text-xs text-slate-500">
                                {migrationStep.migrated.customers > 0 && (
                                  <span>✅ ลูกค้า {migrationStep.migrated.customers} คน</span>
                                )}
                                {migrationStep.migrated.deals > 0 && (
                                  <span>✅ ดีล {migrationStep.migrated.deals} รายการ</span>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      /* Registration form */
                      <form onSubmit={handleRegister} className="space-y-3 flex flex-col flex-1">
                        {registerError && (
                          <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2">
                            <AlertCircle size={14} /> {registerError}
                          </div>
                        )}
                        {[
                          { icon: User, type: 'text', field: 'name', placeholder: 'ชื่อ-นามสกุล' },
                          { icon: Mail, type: 'email', field: 'email', placeholder: 'อีเมล (you@example.com)' },
                          { icon: Lock, type: 'password', field: 'password', placeholder: 'รหัสผ่านอย่างน้อย 6 ตัว' },
                        ].map(({ icon: Icon, type, field, placeholder }) => (
                          <div key={field} className="relative">
                            <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input
                              type={type}
                              value={formData[field]}
                              onChange={e => setFormData(p => ({ ...p, [field]: e.target.value }))}
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                              placeholder={placeholder}
                              required
                            />
                          </div>
                        ))}

                        <div className="mt-auto pt-2">
                          <button
                            type="submit"
                            disabled={registering}
                            className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 active:scale-95 text-sm"
                          >
                            {registering
                              ? <><Loader2 size={16} className="animate-spin" /> กำลังสร้างบัญชี...</>
                              : <><User size={15} /> สร้างบัญชีฟรี — ย้ายข้อมูลขึ้น Cloud</>
                            }
                          </button>
                          <p className="text-center text-[10px] text-slate-400 mt-2">
                            ✓ ไม่ต้องบัตรเครดิต · ✓ ทดลอง Pro 3 วัน · ✓ ข้อมูลย้ายให้อัตโนมัติ
                          </p>
                        </div>
                      </form>
                    )}
                  </div>

                ) : isDefault ? (
                  /* DEFAULT: Go to login */
                  <div className="h-full flex flex-col justify-center items-center text-center">
                    <div className="w-16 h-16 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mb-5">
                      <Sparkles size={32} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mb-2">เข้าสู่ระบบ / สมัครสมาชิก</h2>
                    <p className="text-slate-500 mb-7 max-w-xs text-sm leading-relaxed">
                      สมัครสมาชิกตอนนี้เพื่อเข้าถึงทุกฟีเจอร์ Pro โดยไม่มีข้อผูกมัด
                    </p>
                    <button
                      onClick={() => { closePaywall(); signOut(); }}
                      className="w-full max-w-xs h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                    >
                      <LogIn size={18} /> ไปหน้าเข้าสู่ระบบ
                    </button>
                    <button onClick={handleClose} className="mt-3 text-sm font-bold text-slate-400 hover:text-slate-600">
                      ปิดหน้าต่างนี้
                    </button>
                  </div>

                ) : (
                  /* PAYMENT: PromptPay */
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-end mb-7 pb-6 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest bg-violet-50 px-2 py-1 rounded-md">Pro Plan</span>
                        <h2 className="text-xl font-black text-slate-900 mt-2.5">สมัครสมาชิกรายเดือน</h2>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-black text-slate-900">299</span>
                        <span className="text-sm font-bold text-slate-500 ml-1">THB / เดือน</span>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center mb-6">
                      <div className="bg-white border-2 border-slate-100 rounded-2xl p-5 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center relative overflow-hidden w-full max-w-[220px]">
                        <div className="absolute top-0 left-0 right-0 bg-[#113566] text-white py-1.5 text-[10px] font-bold tracking-widest flex items-center justify-center">
                          PROMPTPAY
                        </div>
                        <div className="w-40 h-40 mt-8 mb-3 border border-slate-200 rounded-xl overflow-hidden p-1.5 bg-white">
                          <img src="/promptpay_qr.png" alt="PromptPay QR Code" className="w-full h-full object-contain" />
                        </div>
                        <p className="text-xs font-bold text-slate-600 mb-0.5">สแกนเพื่อชำระเงิน</p>
                        <p className="text-lg font-black text-violet-700">299.00 บาท</p>
                      </div>
                    </div>

                    <div className="space-y-2.5 mt-auto">
                      <button
                        onClick={handleConfirmPayment}
                        disabled={confirming}
                        className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-lg disabled:opacity-50 active:scale-95"
                      >
                        {confirming
                          ? <><Loader2 size={18} className="animate-spin" /> กำลังตรวจสอบ...</>
                          : <><CheckCircle2 size={18} /> ฉันโอนเงินแล้ว (ยืนยันสิทธิ์)</>
                        }
                      </button>
                      <button
                        onClick={handleClose}
                        disabled={confirming}
                        className="w-full h-11 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl flex items-center justify-center transition-colors active:scale-95 text-sm"
                      >
                        ไว้ทีหลัง
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
