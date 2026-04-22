import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { Target, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!email.trim()) { setFormError('กรุณากรอกอีเมล'); return; }
    if (!password) { setFormError('กรุณากรอกรหัสผ่าน'); return; }
    const { error: signInError } = await signIn(email, password);
    if (signInError) { setFormError(signInError.message); return; }
    navigate('/command');
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-violet-50 via-white to-pink-50">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-violet-600 to-violet-800 p-14 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute top-1/2 -right-24 w-64 h-64 rounded-full bg-pink-400/10" />
          <div className="absolute -bottom-16 left-1/3 w-80 h-80 rounded-full bg-violet-400/10" />
          {/* Grid pattern */}
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
              <span className="text-white font-bold text-xl tracking-tight">Zenith CRM</span>
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
        </div>

        <div className="relative z-10 text-violet-300 text-xs">
          © 2026 Zenith CRM. All rights reserved.
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center">
              <Target size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">Zenith CRM</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">ยินดีต้อนรับกลับมา</h2>
            <p className="text-slate-500 text-sm">เข้าสู่ระบบเพื่อจัดการยอดขายของคุณ</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full h-12 px-4 pr-12 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-violet-500/25 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> กำลังเข้าสู่ระบบ...</>
              ) : (
                <>เข้าสู่ระบบ <ArrowRight size={18} /></>
              )}
            </motion.button>
          </form>

          <p className="text-center text-slate-400 text-xs mt-8">
            💡 ติดต่อผู้ดูแลระบบหากลืมรหัสผ่าน
          </p>
        </motion.div>
      </div>
    </div>
  );
}
