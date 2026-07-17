import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { startLocalTrial } from '../lib/localDb';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Loader2, UserPlus, LogIn, Sparkles, Zap, Shield, TrendingUp, Users } from 'lucide-react';

function FloatingOrb({ style }) {
  return <div className="absolute rounded-full pointer-events-none" style={style} />;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp, loading } = useAuth();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [focusedField, setFocusedField] = useState(null);

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

  const inputStyle = (field) => ({
    width: '100%',
    height: '52px',
    padding: '0 1rem',
    borderRadius: '14px',
    border: `1.5px solid ${focusedField === field ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)'}`,
    background: focusedField === field ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.05)',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(139,92,246,0.15)' : 'none',
    fontFamily: 'inherit',
  });

  const features = [
    { icon: Zap,         label: 'AI วิเคราะห์ดีล',   sub: 'Smart Insights',    color: '#a78bfa' },
    { icon: TrendingUp,  label: 'ปิดดีลเร็วขึ้น 3x',  sub: 'Revenue Boost',     color: '#34d399' },
    { icon: Users,       label: 'ติดตามทีมแบบ Real-time', sub: 'Team Analytics', color: '#60a5fa' },
    { icon: Shield,      label: 'ความปลอดภัยสูง',     sub: 'Enterprise-grade',  color: '#f472b6' },
  ];

  return (
    <div
      className="min-h-screen flex overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, #08031f 0%, #0d0630 40%, #130540 70%, #0a0225 100%)' }}
    >
      {/* ─── Animated Background ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large ambient orbs */}
        <FloatingOrb style={{
          top: '-15%', left: '-10%', width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 65%)',
          animation: 'float 12s ease-in-out infinite',
        }} />
        <FloatingOrb style={{
          bottom: '-10%', right: '-5%', width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(236,72,153,0.14) 0%, transparent 65%)',
          animation: 'float 9s ease-in-out infinite alternate',
        }} />
        <FloatingOrb style={{
          top: '40%', left: '35%', width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 65%)',
          animation: 'float 15s ease-in-out infinite 2s',
        }} />
        {/* Star dots */}
        {[...Array(30)].map((_, i) => (
          <div key={i} className="absolute rounded-full" style={{
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `rgba(255,255,255,${Math.random() * 0.4 + 0.1})`,
            animation: `pulse ${Math.random() * 3 + 2}s ease-in-out infinite ${Math.random() * 2}s alternate`,
          }} />
        ))}
        {/* Grid overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* ─── Left Panel — Branding ─── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] relative p-14">

        {/* Top - Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl blur-lg" style={{background: 'rgba(139,92,246,0.6)'}} />
            <img
              src="/icon.svg"
              className="w-12 h-12 rounded-2xl object-cover shrink-0 select-none relative z-10"
              style={{boxShadow: '0 0 24px rgba(139,92,246,0.6)'}}
              alt="Nova Pipeline Logo"
            />
          </div>
          <div>
            <span className="text-white font-black text-xl tracking-tight">Nova Pipeline</span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{color: 'rgba(167,139,250,0.7)'}}>Sales Intelligence Platform</p>
          </div>
        </motion.div>

        {/* Middle - Hero */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-10"
        >
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold" style={{
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.3)',
              color: '#c4b5fd'
            }}>
              <Sparkles size={12} />
              Next-Gen CRM Platform
            </div>
            <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
              จัดการยอดขาย
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #a78bfa, #818cf8, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                อย่างมืออาชีพ
              </span>
            </h1>
            <p style={{color: 'rgba(255,255,255,0.5)'}} className="text-base leading-relaxed max-w-sm">
              ติดตามดีล, วิเคราะห์ข้อมูลลูกค้า และพัฒนาทีมขายด้วยระบบ AI อัจฉริยะ
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-3">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3 p-3.5 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{
                  background: `${feat.color}20`,
                  border: `1px solid ${feat.color}30`,
                }}>
                  <feat.icon size={16} style={{color: feat.color}} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-none mb-0.5">{feat.label}</p>
                  <p className="text-[10px]" style={{color: 'rgba(255,255,255,0.35)'}}>{feat.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trial CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="relative overflow-hidden rounded-3xl p-5"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.15))',
              border: '1px solid rgba(139,92,246,0.25)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full" style={{
              background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)',
              transform: 'translate(30%, -30%)',
            }} />
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <Sparkles className="text-amber-400" size={16} />
              <h3 className="font-bold text-white text-sm">ทดลองใช้งานระบบ</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{
                background: 'rgba(251,191,36,0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(251,191,36,0.25)'
              }}>ฟรี 100%</span>
            </div>
            <p className="text-xs mb-4 leading-relaxed relative z-10" style={{color: 'rgba(255,255,255,0.5)'}}>
              สัมผัสระบบ CRM เต็มรูปแบบด้วยข้อมูลจำลอง ไม่ต้องสมัคร ไม่ต้องใส่บัตรเครดิต
            </p>
            <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
              {['📊 Dashboard', '🎯 Pipeline', '👥 Customers', '📈 Analytics', '🤖 AI Copilot'].map(f => (
                <span key={f} className="text-[10px] px-2.5 py-1 rounded-full font-medium" style={{
                  background: 'rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>{f}</span>
              ))}
            </div>
            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full py-3 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 relative z-10"
              style={{
                background: 'white',
                color: '#7c3aed',
                boxShadow: '0 4px 16px rgba(139,92,246,0.25)',
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,92,246,0.35)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(139,92,246,0.25)'; }}
            >
              เข้าสู่โหมดทดลองเล่น <ArrowRight size={16} />
            </button>
          </motion.div>
        </motion.div>

        {/* Bottom */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-xs"
          style={{color: 'rgba(255,255,255,0.25)'}}
        >
          © 2026 Nova Pipeline · Developed by Sorawit Thunthakij
        </motion.p>
      </div>

      {/* ─── Right Panel — Form ─── */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Glass card */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md relative"
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '28px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)',
            padding: '2.5rem',
          }}
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-8 right-8 h-px rounded-full" style={{
            background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.6), rgba(236,72,153,0.4), transparent)'
          }} />

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl blur-md" style={{background: 'rgba(139,92,246,0.5)'}} />
              <img src="/icon.svg" className="w-9 h-9 rounded-2xl object-cover shrink-0 select-none relative z-10" alt="Logo" />
            </div>
            <span className="font-black text-xl text-white">Nova Pipeline</span>
          </div>

          {/* Mobile trial CTA */}
          <div
            className="lg:hidden mb-6 p-4 rounded-2xl relative overflow-hidden"
            style={{background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)'}}
          >
            <div className="flex items-center gap-2 mb-1 relative z-10">
              <Sparkles className="text-amber-400" size={14} />
              <h3 className="font-bold text-sm text-white">ทดลองใช้ฟรี — Sandbox Mode</h3>
            </div>
            <p className="text-xs mb-3 relative z-10" style={{color: 'rgba(255,255,255,0.45)'}}>ทดลองระบบ CRM เต็มรูปแบบ · ไม่ต้องสมัครสมาชิก</p>
            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 relative z-10"
              style={{background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.15)'}}
            >
              ทดลองเล่นเลย <ArrowRight size={14} />
            </button>
          </div>

          {/* Mode toggle */}
          <div className="flex p-1 rounded-2xl mb-7" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)'}}>
            {[
              { key: 'login', label: 'เข้าสู่ระบบ', icon: LogIn },
              { key: 'register', label: 'สมัครสมาชิก', icon: UserPlus },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => switchMode(key)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={mode === key ? {
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.6), rgba(99,102,241,0.5))',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
                } : {
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-2xl font-black text-white mb-1">
              {isLogin ? 'ยินดีต้อนรับกลับมา' : 'สร้างบัญชีใหม่'}
            </h2>
            <p className="text-sm" style={{color: 'rgba(255,255,255,0.4)'}}>
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
                  className="flex items-center gap-3 p-3.5 rounded-2xl text-sm"
                  style={{background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5'}}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  {formError}
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl text-sm"
                  style={{background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', color: '#6ee7b7'}}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  {successMsg}
                </motion.div>
              )}

              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{color: 'rgba(255,255,255,0.5)'}}>ชื่อ-นามสกุล</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="เช่น สมชาย ใจดี"
                    disabled={loading}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    style={{...inputStyle('name'), opacity: loading ? 0.6 : 1}}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold" style={{color: 'rgba(255,255,255,0.5)'}}>อีเมล</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={loading}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  style={{...inputStyle('email'), opacity: loading ? 0.6 : 1}}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold" style={{color: 'rgba(255,255,255,0.5)'}}>รหัสผ่าน</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    style={{...inputStyle('password'), paddingRight: '3rem', opacity: loading ? 0.6 : 1}}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{color: 'rgba(255,255,255,0.3)'}}
                    onMouseOver={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                    onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{color: 'rgba(255,255,255,0.5)'}}>ยืนยันรหัสผ่าน</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                    style={{...inputStyle('confirm'), opacity: loading ? 0.6 : 1}}
                  />
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-13 font-bold rounded-2xl flex items-center justify-center gap-2 mt-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                style={{
                  height: '52px',
                  background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                  color: 'white',
                  boxShadow: '0 8px 24px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                  border: '1px solid rgba(167,139,250,0.3)',
                }}
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> กำลังดำเนินการ...</>
                ) : isLogin ? (
                  <>เข้าสู่ระบบ <ArrowRight size={16} /></>
                ) : (
                  <>สมัครสมาชิก <UserPlus size={16} /></>
                )}
              </motion.button>
            </motion.form>
          </AnimatePresence>

          {isLogin && (
            <p className="text-center text-xs mt-6" style={{color: 'rgba(255,255,255,0.25)'}}>
              💡 ติดต่อผู้ดูแลระบบหากลืมรหัสผ่าน
            </p>
          )}
        </motion.div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(1deg); }
          66% { transform: translateY(-10px) rotate(-0.5deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}
