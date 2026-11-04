import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { startLocalTrial } from '../lib/localDb';
import './LoginPage.css';
import { Eye, EyeOff, ArrowRight, Loader2, Layers } from 'lucide-react';

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
      if (error) { setFormError(error.message || 'ดำเนินการไม่สำเร็จ กรุณาลองอีกครั้ง'); return; }
      setSuccessMsg('สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันตัวตน แล้วเข้าสู่ระบบ');
      setMode('login');
      setPassword(''); setConfirmPassword('');
    } else {
      const { error } = await signIn(email, password);
      if (error) { setFormError(error.message || 'ดำเนินการไม่สำเร็จ กรุณาลองอีกครั้ง'); return; }
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
      console.error('Local trial could not start', error);
      setFormError('ไม่สามารถเข้าสู่โหมดทดลองใช้งานได้: ' + error.message);
    }
  };

  const isLogin = mode === 'login';

  const brand = <div className="nova-wordmark"><img src="/icon.svg" alt="" />Nova Pipeline</div>;

  return (
    <main className="nova-entry">
      <aside className="nova-story">
        {brand}
        <div>
          <p className="nova-kicker">Sales workspace</p>
          <h1>ทุกดีลมีที่มา<br /><em>ทุกก้าวมีเป้าหมาย</em></h1>
          <p className="nova-intro">รวมดีล ลูกค้า และงานติดตามของทีมขายไว้ในที่เดียว</p>
          <figure className="nova-map">
            <figcaption><Layers size={17} /> เส้นทางการขาย <small>PIPELINE</small></figcaption>
            <ol>
              {['เปิดดีล', 'เสนอราคา', 'ปิดการขาย'].map((stage, index) => (
                <li key={stage}><b>0{index + 1}</b><span>{stage}</span></li>
              ))}
            </ol>
          </figure>
        </div>
        <span className="nova-edition">NOVA PIPELINE &nbsp; / &nbsp; SALES INTELLIGENCE</span>
      </aside>
      <section className="nova-access">
        <div className="nova-form">
          <div className="nova-mobile-brand">{brand}</div>
          <p className="nova-kicker">Account access</p>
          <h2>{isLogin ? 'ยินดีต้อนรับกลับมา' : 'สร้างบัญชีใหม่'}</h2>
          <p className="nova-muted">{isLogin ? 'เข้าสู่พื้นที่ทำงานของคุณเพื่อติดตามดีลและยอดขาย' : 'กรอกข้อมูลเพื่อเริ่มใช้งาน Nova Pipeline'}</p>
          <div className="nova-switch" role="group" aria-label="เลือกวิธีเข้าใช้งาน">
            {['login', 'register'].map(key => <button key={key} disabled={loading} aria-pressed={mode === key} onClick={() => switchMode(key)}>{key === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</button>)}
          </div>
          <form onSubmit={handleSubmit}>
            {formError && <p role="alert" className="nova-error">{formError}</p>}
            {successMsg && <p role="status" className="nova-success">{successMsg}</p>}
            {!isLogin && <label>ชื่อ-นามสกุล<input autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} disabled={loading} /></label>}
            <label>อีเมล<input type="email" autoComplete={isLogin ? 'username' : 'email'} placeholder="name@company.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={loading} /></label>
            <div><label htmlFor="password">รหัสผ่าน</label>
              <div className="nova-password"><input id="password" type={showPassword ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder={isLogin ? 'กรอกรหัสผ่าน' : 'อย่างน้อย 6 ตัวอักษร'} required value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
                <button type="button" aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            {!isLogin && <label>ยืนยันรหัสผ่าน<input type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={loading} /></label>}
            <button className="nova-submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" size={18} /> : <>{isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}<ArrowRight size={17} /></>}</button>
          </form>
          <div className="nova-demo"><div><strong>ลองใช้งานก่อน</strong><p>สำรวจ CRM โดยไม่ต้องสมัครสมาชิก</p></div><button onClick={handleGuestLogin} disabled={loading}>เปิดเดโม <ArrowRight size={16} /></button></div>
          {isLogin && <p className="nova-help">ลืมรหัสผ่าน? ติดต่อผู้ดูแลระบบของคุณ</p>}
        </div>
      </section>
    </main>
  );
}
