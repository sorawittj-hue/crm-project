import { useState } from 'react';
import { Dialog, DialogContent } from './Dialog';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { Crown, Sparkles, CheckCircle2, Shield, Zap, ShieldCheck, Loader2, LogIn, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PaywallModal() {
  const { isPaywallOpen, closePaywall, paywallReason } = useAppStore();
  const { signOut, signUp } = useAuth();
  const { isGuestAccount } = useSubscription();
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [registerError, setRegisterError] = useState('');

  const handleConfirmPayment = () => {
    setConfirming(true);
    // Simulate payment verification
    setTimeout(() => {
      setConfirming(false);
      setSuccess(true);
    }, 1800);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setRegisterError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    setRegistering(true);
    setRegisterError('');
    
    // Call signUp which triggers migration
    const { error } = await signUp(formData.email, formData.password, formData.name);
    
    if (error) {
      setRegisterError(error.message);
      setRegistering(false);
    } else {
      // success, wait a sec then close
      setTimeout(() => {
        handleClose();
      }, 1500);
    }
  };

  const handleClose = () => {
    closePaywall();
    setTimeout(() => {
      setSuccess(false);
      setConfirming(false);
      setRegistering(false);
      setFormData({ name: '', email: '', password: '' });
      setRegisterError('');
    }, 300);
  };

  return (
    <Dialog open={isPaywallOpen} onOpenChange={handleClose} className="max-w-4xl">
      <DialogContent className="overflow-hidden p-0 border-0 bg-white sm:rounded-3xl shadow-2xl">
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="paywall-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col md:flex-row relative"
            >
              {/* Left Column: Benefits (Dark Mode / Stripe-Like) */}
              <div className="w-full md:w-5/12 bg-slate-900 p-8 text-white relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-violet-600/30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl" />
                
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/10 mb-6">
                    <Crown size={24} className="text-amber-400" />
                  </div>
                  
                  <h3 className="text-3xl font-black tracking-tight mb-2">
                    Nova Pro
                  </h3>
                  <p className="text-slate-400 font-medium mb-8">
                    {paywallReason === 'trial_ended' 
                      ? 'หมดเวลาทดลองใช้แล้ว กรุณาอัปเกรดเพื่อทำงานต่อ' 
                      : paywallReason === 'premium_only'
                        ? 'ฟีเจอร์นี้เปิดให้เฉพาะผู้ใช้ Pro เท่านั้น'
                        : 'ปลดล็อคพลังการขายเต็มรูปแบบ'
                    }
                  </p>

                  <div className="space-y-5">
                    {[
                      { label: 'ฐานข้อมูลส่วนตัว 100%', desc: 'ความปลอดภัยสูงสุด ข้อมูลไม่รั่วไหล', icon: Shield },
                      { label: 'บันทึกข้อมูลไม่จำกัด', desc: 'ลูกค้า ดีลการขาย และรายงานแบบ Full', icon: Zap },
                      { label: 'AI Copilot วิเคราะห์ข้อมูล', desc: 'ผู้ช่วย AI ทรงพลังเหมือนมีเลขา', icon: Sparkles },
                      { label: 'Auto-Backup (Cloud)', desc: 'สำรองข้อมูลอัตโนมัติ สบายใจได้', icon: ShieldCheck },
                    ].map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 text-violet-400">
                          <item.icon size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-white leading-none">{item.label}</p>
                          <p className="text-sm text-slate-400 mt-1.5 leading-snug">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative z-10 mt-12 pt-6 border-t border-white/10">
                  <p className="text-sm text-slate-400">มีคำถามเพิ่มเติม?</p>
                  <a href="#" className="text-violet-400 hover:text-violet-300 font-bold text-sm mt-1 inline-block">ติดต่อทีมซัพพอร์ตของเรา</a>
                </div>
              </div>

              {/* Right Column: Payment */}
              <div className="w-full md:w-7/12 p-8 lg:p-12 bg-white relative">
                {paywallReason === 'default' ? (
                  <div className="h-full flex flex-col justify-center items-center text-center">
                    <div className="w-20 h-20 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mb-6">
                      <Sparkles size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-3">ทดลองใช้ฟรีเต็มรูปแบบ 3 วัน</h2>
                    <p className="text-slate-500 mb-8 max-w-sm">สมัครสมาชิกตอนนี้เพื่อเข้าถึงทุกฟีเจอร์ระดับ Pro ได้ทันทีโดยไม่มีข้อผูกมัดใดๆ</p>
                    <button
                      onClick={() => {
                        closePaywall();
                        signOut(); // triggers signout to show login page
                      }}
                      className="w-full max-w-xs h-14 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-violet-500/25 active:scale-95"
                    >
                      <LogIn size={20} />
                      สมัครสมาชิก / เข้าสู่ระบบ
                    </button>
                    <button
                      onClick={handleClose}
                      className="mt-4 text-sm font-bold text-slate-400 hover:text-slate-600"
                    >
                      ใช้งานแบบผู้เยี่ยมชมต่อ
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-end mb-8 pb-6 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-black text-violet-600 uppercase tracking-widest bg-violet-50 px-2 py-1 rounded-md">PRO PLAN</span>
                        <h2 className="text-2xl font-black text-slate-900 mt-3">สมัครสมาชิกรายเดือน</h2>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-black text-slate-900">299</span>
                        <span className="text-sm font-bold text-slate-500 ml-1">THB / เดือน</span>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center mb-8">
                      <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-2xl shadow-slate-200/50 flex flex-col items-center text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 bg-[#113566] text-white py-1.5 text-xs font-bold tracking-widest flex items-center justify-center gap-2">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/1200px-QR_code_for_mobile_English_Wikipedia.svg.png" className="w-4 h-4 opacity-0" alt="" />
                          PROMPTPAY
                        </div>
                        <div className="w-48 h-48 mt-8 mb-4 border border-slate-200 rounded-2xl overflow-hidden p-2 bg-white">
                           <img src="/promptpay_qr.png" alt="PromptPay QR Code" className="w-full h-full object-contain" />
                        </div>
                        <p className="text-sm font-bold text-slate-600 mb-1">สแกนเพื่อชำระเงิน</p>
                        <p className="text-xl font-black text-violet-700">299.00 บาท</p>
                      </div>
                    </div>

                    <div className="space-y-3 mt-auto">
                      <button
                        onClick={handleConfirmPayment}
                        disabled={confirming}
                        className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg disabled:opacity-50 active:scale-95"
                      >
                        {confirming ? (
                          <>
                            <Loader2 size={20} className="animate-spin" />
                            กำลังตรวจสอบการทำรายการ...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={20} />
                            ฉันโอนเงินแล้ว (ยืนยันสิทธิ์)
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleClose}
                        disabled={confirming}
                        className="w-full h-12 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl flex items-center justify-center transition-colors active:scale-95"
                      >
                        ไว้ทีหลัง
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="paywall-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-10 flex flex-col items-center w-full"
            >
              {isGuestAccount ? (
                // REGISTRATION FORM FOR GUESTS
                <div className="w-full max-w-md mx-auto text-center">
                  <div className="w-16 h-16 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/10 mb-6 mx-auto">
                    <User size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">สร้างบัญชีผู้ใช้ของคุณ</h3>
                  <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                    ระบบได้รับยอดชำระเงินของคุณแล้ว! กรุณาสร้างบัญชีเพื่อผูกข้อมูลทดลองใช้ทั้งหมดเข้าสู่ระบบ Cloud อย่างปลอดภัย
                  </p>
                  
                  <form onSubmit={handleRegister} className="space-y-4 text-left w-full">
                    {registerError && (
                      <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg flex items-center gap-2">
                        <AlertCircle size={16} />
                        {registerError}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อ-นามสกุล</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          placeholder="ชื่อของคุณ"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">อีเมล</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">รหัสผ่าน</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="password"
                          value={formData.password}
                          onChange={e => setFormData({ ...formData, password: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={registering}
                      className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 mt-6 transition-all shadow-lg disabled:opacity-50 active:scale-95"
                    >
                      {registering ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          กำลังสร้างบัญชีและย้ายข้อมูล...
                        </>
                      ) : (
                        'ยืนยันการสร้างบัญชี'
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                // SUCCESS FOR EXISTING USERS
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-6 mx-auto animate-bounce">
                    <CheckCircle2 size={40} />
                  </div>
                  <span className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2 block">Upgrade Successful</span>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-3">ขอต้อนรับสู่ Premium!</h3>
                  <p className="text-sm text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                    ระบบได้ทำการปรับปรุงสิทธิ์ของคุณเรียบร้อยแล้ว คุณสามารถเข้าถึงฐานข้อมูลส่วนตัวและฟีเจอร์ขั้นสูงได้ทันที
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-8 px-8 h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl inline-flex items-center justify-center transition-colors shadow-lg active:scale-95"
                  >
                    เริ่มต้นใช้งานระบบ Premium
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
