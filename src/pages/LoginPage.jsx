import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { startLocalTrial } from '../lib/localDb';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Eye, EyeOff, ArrowRight, Loader2, UserPlus, LogIn, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp, loading } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const switchMode = (m) => { setMode(m); setFormError(''); setSuccessMsg(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!email.trim()) { setFormError('กรุณากรอกอีเมล'); return; }
    if (!password) { setFormError('กรุณากรอกรหัสผ่าน'); return; }

    if (mode === 'register') {
      if (password.length < 6) { setFormError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
      if (password !== confirmPassword) { setFormError('รหัสผ่านไม่ตรงกัน'); return; }
      const { error } = await signUp(email, password, fullName);
      if (error) { setFormError(error.message); return; }
      setSuccessMsg('สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันตัวตน แล้วเข้าสู่ระบบ');
      setMode('login');
      setPassword(''); setConfirmPassword('');
    } else {
      const { error } = await signIn(email, password);
      if (error) { setFormError(error.message); return; }
      navigate('/command');
    }
  };

  const handleGuestLogin = async () => {
    setFormError('');
    setSuccessMsg('');
    try {
      startLocalTrial();
      navigate('/command');
    } catch (error) {
      setFormError('ไม่สามารถเข้าสู่โหมดทดลองใช้งานได้: ' + error.message);
    }
  };

  const isLogin = mode === 'login';

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-violet-50 via-white to-pink-50">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-violet-600 to-violet-800 p-14 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute top-1/2 -right-24 w-64 h-64 rounded-full bg-pink-400/10" />
          <div className="absolute -bottom-16 left-1/3 w-80 h-80 rounded-full bg-violet-400/10" />
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Target size={22} className="text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-xl tracking-tight">Nova Pipeline</span>
              <p className="text-violet-200 text-xs font-medium">Sales Intelligence Platform</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-white leading-tight">
              จัดการยอดขาย<br />
              <span className="text-violet-200">อย่างมืออาชีพ</span>
            </h1>
            <p className="text-violet-200 text-base leading-relaxed max-w-xs">
              ติดตามดีล, วิเคราะห์ข้อมูลลูกค้า และพัฒนาทีมขายด้วยระบบ AI
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'AI วิเคราะห์ดีล', value: 'Smart' },
              { label: 'ปิดดีลเร็วขึ้น', value: '3x' },
              { label: 'Real-time Sync', value: '24/7' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-white font-bold text-lg">{stat.value}</p>
                <p className="text-violet-200 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* New Showcase Card for Desktop */}
          <div className="mt-8 bg-white/10 border border-white/20 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-150" />
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2 relative z-10">
              <Sparkles className="text-amber-300" size={20} />
              ทดลองใช้งานระบบ (Showcase Mode)
            </h3>
            <p className="text-violet-200 text-sm mb-6 leading-relaxed relative z-10">
              สัมผัสประสบการณ์ใช้งานแบบจัดเต็มด้วยข้อมูลจำลอง (Mock Data) โดยไม่ต้องสมัครสมาชิก หรือใช้รหัสผ่านใดๆ
            </p>
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-violet-50 text-violet-700 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-black/10 active:scale-95 disabled:opacity-60 relative z-10"
            >
              เข้าสู่โหมดทดลองเล่น <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div className="relative z-10 text-violet-300 text-xs">
          © 2026 Nova Pipeline. All rights reserved.
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center">
              <Target size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">Nova Pipeline</span>
          </div>

          {/* Mobile Showcase Card */}
          <div className="lg:hidden bg-gradient-to-br from-violet-600 to-indigo-800 rounded-3xl p-5 mb-8 shadow-xl shadow-violet-500/20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <h3 className="font-bold flex items-center gap-2 mb-1.5 relative z-10">
              <Sparkles className="text-amber-300" size={16} /> Showcase Mode
            </h3>
            <p className="text-xs text-violet-200 mb-4 opacity-90 leading-relaxed relative z-10">
              ทดลองเล่นระบบด้วยข้อมูลจำลอง ไม่ต้องสมัครสมาชิก
            </p>
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full bg-white text-violet-700 font-bold py-3 rounded-xl text-sm transition-all active:scale-95 shadow-md relative z-10 flex items-center justify-center gap-2"
            >
              ทดลองเล่นเลย <ArrowRight size={14} />
            </button>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
            {[
              { key: 'login', label: 'เข้าสู่ระบบ', icon: LogIn },
              { key: 'register', label: 'สมัครสมาชิก', icon: UserPlus },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => switchMode(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  mode === key
                    ? 'bg-white text-violet-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              {isLogin ? 'ยินดีต้อนรับกลับมา' : 'สร้างบัญชีใหม่'}
            </h2>
            <p className="text-slate-500 text-sm">
              {isLogin ? 'เข้าสู่ระบบเพื่อจัดการยอดขายของคุณ' : 'กรอกข้อมูลเพื่อเริ่มใช้งาน Nova Pipeline'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: isLogin ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {formError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  {formError}
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-sm"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  {successMsg}
                </motion.div>
              )}

              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">ชื่อ-นามสกุล</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="เช่น สมชาย ใจดี"
                    disabled={loading}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all disabled:opacity-60"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">อีเมล</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={loading}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all disabled:opacity-60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">รหัสผ่าน</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full h-12 px-4 pr-12 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">ยืนยันรหัสผ่าน</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all disabled:opacity-60"
                  />
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-violet-500/25 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> กำลังดำเนินการ...</>
                ) : isLogin ? (
                  <>เข้าสู่ระบบ <ArrowRight size={18} /></>
                ) : (
                  <>สมัครสมาชิก <UserPlus size={18} /></>
                )}
              </motion.button>
            </motion.form>
          </AnimatePresence>

          {isLogin && (
            <p className="text-center text-slate-400 text-xs mt-8">
              💡 ติดต่อผู้ดูแลระบบหากลืมรหัสผ่าน
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
