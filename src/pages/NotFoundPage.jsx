import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, FileQuestion } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return <main className="grid min-h-screen place-items-center bg-slate-50 px-6 dark:bg-slate-950">
    <section className="max-w-md text-center">
      <FileQuestion size={48} className="mx-auto mb-6 text-violet-500" />
      <p className="text-sm font-semibold tracking-widest text-slate-400">404</p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">ไม่พบหน้าที่คุณต้องการ</h1>
      <p className="mt-3 leading-7 text-slate-500">ลิงก์อาจมีการเปลี่ยนแปลง คุณสามารถกลับไปยังพื้นที่ทำงานหรือหน้าก่อนหน้าได้</p>
      <div className="mt-7 flex justify-center gap-3"><Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft size={16} className="mr-2" />ย้อนกลับ</Button><Button onClick={() => navigate('/command')}><Home size={16} className="mr-2" />ไปหน้าหลัก</Button></div>
    </section>
  </main>;
}
