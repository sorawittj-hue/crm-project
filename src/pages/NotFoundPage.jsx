import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home, ArrowLeft } from 'lucide-react';

// Floating particle configuration
const particles = [
  { id: 1, size: 6,  top: '18%', left: '12%',  delay: 0,    duration: 3.8 },
  { id: 2, size: 10, top: '72%', left: '8%',   delay: 0.6,  duration: 4.5 },
  { id: 3, size: 7,  top: '25%', right: '10%', delay: 1.1,  duration: 3.2 },
  { id: 4, size: 12, top: '65%', right: '14%', delay: 0.3,  duration: 5.0 },
  { id: 5, size: 5,  top: '45%', left: '5%',   delay: 0.9,  duration: 3.6 },
  { id: 6, size: 8,  top: '80%', right: '6%',  delay: 1.4,  duration: 4.2 },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#fafaf9]">

      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-violet-400/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-8%] left-[15%] w-[420px] h-[420px] rounded-full bg-fuchsia-400/15 blur-[120px]" />
      <div className="pointer-events-none absolute top-[30%] right-[10%] w-[320px] h-[320px] rounded-full bg-indigo-400/10 blur-[100px]" />

      {/* Floating particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="pointer-events-none absolute rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 opacity-60"
          style={{
            width:  p.size,
            height: p.size,
            top:    p.top   ?? undefined,
            left:   p.left  ?? undefined,
            right:  p.right ?? undefined,
          }}
          animate={{ y: [0, -15, 0] }}
          transition={{ delay: p.delay, duration: p.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Glassmorphism card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
        className="relative z-10 mx-4 w-full max-w-lg bg-white/80 backdrop-blur-xl border border-violet-100 rounded-3xl shadow-2xl shadow-violet-200/40 p-10 flex flex-col items-center text-center gap-8"
      >
        {/* Inner glow ring */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-violet-100/60" />

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col items-center gap-5 w-full">

          {/* 404 gradient number */}
          <motion.div variants={itemVariants} className="relative select-none leading-none">
            <div className="absolute inset-0 mx-auto w-4/5 h-full rounded-full bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 blur-[40px] -z-10 scale-110" />
            <span className="text-[9rem] font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-500">
              404
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1 variants={itemVariants} className="text-3xl font-black text-slate-900 tracking-tight leading-snug">
            Signal Not Found
          </motion.h1>

          {/* Gradient divider */}
          <motion.div variants={itemVariants} className="w-16 h-0.5 rounded-full bg-gradient-to-r from-transparent via-violet-300 to-transparent" />

          {/* Description */}
          <motion.p variants={itemVariants} className="text-sm font-medium text-slate-400 max-w-sm leading-relaxed">
            The sector you&apos;re trying to access doesn&apos;t exist or has been decommissioned. Let&apos;s get you back on track.
          </motion.p>

          {/* Buttons */}
          <motion.div variants={itemVariants} className="flex items-center gap-3 pt-2 flex-wrap justify-center">

            {/* Back button — outline style */}
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-white border border-violet-200 text-slate-700 text-xs font-black uppercase tracking-widest shadow-sm hover:shadow-md hover:border-violet-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <ArrowLeft size={15} />
              ย้อนกลับ
            </button>

            {/* Home button — gradient fill */}
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <Home size={15} />
              หน้าหลัก
            </button>

          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
