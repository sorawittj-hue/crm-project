import { useState } from 'react';
import { Dialog, DialogContent } from './Dialog';
import { useAppStore } from '../../store/useAppStore';
import { Crown, Sparkles, CheckCircle2, AlertCircle, Shield, Zap, Users, ShieldCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PaywallModal() {
  const { isPaywallOpen, closePaywall, paywallReason } = useAppStore();
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConfirmPayment = () => {
    setConfirming(true);
    // Simulate payment verification
    setTimeout(() => {
      setConfirming(false);
      setSuccess(true);
    }, 1800);
  };

  const handleClose = () => {
    closePaywall();
    // Reset state after a delay
    setTimeout(() => {
      setSuccess(false);
      setConfirming(false);
    }, 300);
  };

  return (
    <Dialog open={isPaywallOpen} onOpenChange={handleClose} className="max-w-md">
      <DialogContent className="overflow-hidden p-0 border-0 bg-white">
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="paywall-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative p-6"
            >
              {/* Header Gradient */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600" />

              {/* Title & Badge */}
              <div className="flex flex-col items-center text-center mt-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shadow-md shadow-amber-500/10 mb-3 animate-bounce">
                  <Crown size={24} className="text-amber-500 fill-amber-400/20" />
                </div>
                <span className="text-[10px] font-bold text-violet-600 uppercase tracking-[0.2em] mb-1">
                  {paywallReason === 'trial_ended' ? 'Trial Expired' : 'Nova CRM Premium'}
                </span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {paywallReason === 'trial_ended' 
                    ? 'หมดเวลาทดลองใช้แล้ว' 
                    : paywallReason === 'premium_only' 
                      ? 'ฟีเจอร์พิเศษเฉพาะ PRO'
                      : 'ปลดล็อคพลังการขายเต็มรูปแบบ'
                  }
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  {paywallReason === 'trial_ended' 
                    ? 'อัปเกรดเป็น Premium เพื่อเข้าถึงข้อมูลและการทำงานต่อ' 
                    : paywallReason === 'premium_only'
                      ? 'อัปเกรดเป็น Premium เพื่อใช้งานฟีเจอร์นี้'
                      : 'เริ่มต้นเพียง 300 บาท/ตลอดชีพ'
                  }
                </p>
              </div>

              {/* Benefits list */}
              <div className="space-y-3 mb-6 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 shadow-inner">
                {[
                  { label: 'ฐานข้อมูลส่วนตัวแยกบัญชีและทีม', desc: 'เก็บดีลและลูกค้าของคุณเองอย่างปลอดภัย', icon: Shield },
                  { label: 'บันทึกดีลและลูกค้าไม่จำกัด', desc: 'ไม่มีลิมิตจำนวนลูกค้าและดีลการขาย', icon: Zap },
                  { label: 'AI Copilot วิเคราะห์ข้อมูลจริง', desc: 'ให้ AI ช่วยแนะนำคอขวดและดีลเสี่ยงหลุด', icon: Sparkles },
                  { label: 'ระบบสำรองข้อมูลอัตโนมัติ', desc: 'Auto-Backup กู้คืนข้อมูลได้ทุกเมื่อกันข้อมูลสูญหาย', icon: ShieldCheck },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 mt-0.5">
                      <item.icon size={13} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-none">{item.label}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Info */}
              <div className="flex flex-col items-center p-4 rounded-2xl border-2 border-dashed border-violet-100 bg-violet-50/20 mb-6 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">สแกนชำระเงินเพื่อปลดล็อค</p>
                <div className="w-48 border border-slate-100 rounded-xl overflow-hidden mt-3 shadow-md bg-white p-1">
                  <img src="/promptpay_qr.png" alt="PromptPay QR Code" className="w-full h-auto object-contain rounded-lg" />
                </div>
                <div className="mt-3 flex flex-col items-center">
                  <p className="text-xs font-bold text-slate-500">บัญชีพร้อมเพย์ (PromptPay)</p>
                  <p className="text-sm font-black text-violet-700 tracking-tight leading-none mt-1">ยอดโอน: 300.00 บาท</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  onClick={handleConfirmPayment}
                  disabled={confirming}
                  className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-violet-500/20 disabled:opacity-50 text-xs active:scale-95"
                >
                  {confirming ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      กำลังตรวจสอบการทำรายการ...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      ฉันโอนเงินแล้ว (ยืนยันสิทธิ์)
                    </>
                  )}
                </button>
                <button
                  onClick={handleClose}
                  disabled={confirming}
                  className="w-full h-10 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-xl flex items-center justify-center text-xs transition-colors active:scale-95"
                >
                  ไว้ทีหลัง
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="paywall-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 text-center flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-4 animate-bounce">
                <CheckCircle2 size={36} />
              </div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Upgrade Successful</span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">ขอต้อนรับสู่ Premium!</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1.5 max-w-xs leading-relaxed">
                ระบบได้ทำการปรับปรุงสิทธิ์ของคุณเรียบร้อยแล้ว คุณสามารถเข้าถึงฐานข้อมูลส่วนตัวและฟีเจอร์ขั้นสูงได้ทันที
              </p>
              <button
                onClick={handleClose}
                className="mt-6 w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center text-xs transition-colors shadow-md active:scale-95"
              >
                เริ่มต้นใช้งานระบบ Premium
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
