import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-[70vh] gap-8 text-center px-4"
    >
      <div className="space-y-4">
        <p className="text-9xl font-black text-slate-100 tracking-tighter leading-none select-none">404</p>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Signal Not Found</h1>
        <p className="text-sm font-bold text-slate-400 max-w-md mx-auto leading-relaxed">
          The matrix sector you&apos;re trying to access doesn&apos;t exist or has been decommissioned.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="h-14 px-8 rounded-2xl bg-white border border-slate-100 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50"
        >
          <ArrowLeft size={16} className="mr-2" /> Go Back
        </Button>
        <Button
          onClick={() => navigate('/command')}
          className="h-14 px-10 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:scale-105 transition-transform"
        >
          <Home size={16} className="mr-2" /> Command Center
        </Button>
      </div>
    </motion.div>
  );
}
