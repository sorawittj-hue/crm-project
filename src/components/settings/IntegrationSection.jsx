import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plug, Webhook, MessageCircle, Send, Check, Loader2, Save, AlertCircle, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import { useToast } from '../ui/Toast';

const PLUGINS = [
  {
    id: 'line_oa',
    name: 'LINE Official Account',
    desc: 'รับการแจ้งเตือนเมื่อมี Lead ใหม่ หรือปิดดีลสำเร็จ ผ่าน LINE OA',
    icon: MessageCircle,
    color: 'bg-[#06C755]',
    textColor: 'text-[#06C755]',
    glow: 'shadow-[#06C755]/30',
    fields: [
      { key: 'channel_token', label: 'Channel Access Token', type: 'password', placeholder: 'eyJhbGciOiJIUzI1NiJ9...' },
      { key: 'user_id', label: 'Default Target User/Group ID', type: 'text', placeholder: 'U1a2b3c4d5e6f...' }
    ]
  },
  {
    id: 'telegram',
    name: 'Telegram Bot',
    desc: 'อัปเดตสถานะและรับแจ้งเตือนแบบ Real-time ผ่าน Telegram',
    icon: Send,
    color: 'bg-[#229ED9]',
    textColor: 'text-[#229ED9]',
    glow: 'shadow-[#229ED9]/30',
    fields: [
      { key: 'bot_token', label: 'Bot Token', type: 'password', placeholder: '123456789:ABCdefGhIJKlmNoPQRsTuvwxyZ' },
      { key: 'chat_id', label: 'Chat ID', type: 'text', placeholder: '-1001234567890' }
    ]
  },
  {
    id: 'webhook',
    name: 'Custom Webhook (Zapier/Make)',
    desc: 'ยิงข้อมูล JSON ออกไปยังระบบอื่น เมื่อเกิดเหตุการณ์สำคัญใน CRM',
    icon: Webhook,
    color: 'bg-violet-500',
    textColor: 'text-violet-500',
    glow: 'shadow-violet-500/30',
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', type: 'url', placeholder: 'https://hooks.zapier.com/hooks/catch/...' },
      { key: 'secret_key', label: 'Secret Key (Optional)', type: 'password', placeholder: 'my-super-secret-signature' }
    ]
  }
];

export function IntegrationSection() {
  const [activePlugin, setActivePlugin] = useState(null);
  const [settings, setSettings] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nova_integrations');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load integration settings', e);
    }
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      localStorage.setItem('nova_integrations', JSON.stringify(settings));
      toast.success('บันทึกการตั้งค่าปลั๊กอินเรียบร้อย');
      setActivePlugin(null); // close modal
    } catch (e) {
      toast.error('ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePlugin = (pluginId, e) => {
    e.stopPropagation();
    const current = settings[pluginId] || {};
    const newSettings = {
      ...settings,
      [pluginId]: {
        ...current,
        enabled: !current.enabled
      }
    };
    setSettings(newSettings);
    localStorage.setItem('nova_integrations', JSON.stringify(newSettings));
    toast.success(newSettings[pluginId].enabled ? `เปิดใช้งาน ${pluginId} แล้ว` : `ปิดใช้งาน ${pluginId} แล้ว`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 mb-6">
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Plug className="text-violet-500" size={24} /> ปลั๊กอิน & การเชื่อมต่อ (Integrations)
        </h2>
        <p className="text-sm font-medium text-slate-500">
          เชื่อมต่อแอปพลิเคชันที่คุณใช้งานเป็นประจำ เพื่อรับการแจ้งเตือนและส่งต่อข้อมูลแบบอัตโนมัติ
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {PLUGINS.map(plugin => {
          const Icon = plugin.icon;
          const isEnabled = settings[plugin.id]?.enabled || false;

          return (
            <motion.div
              key={plugin.id}
              whileHover={{ y: -4 }}
              className={cn(
                "group relative overflow-hidden bg-white rounded-3xl border transition-all duration-300 cursor-pointer",
                isEnabled 
                  ? `border-${plugin.textColor.split('-')[1]}-200 shadow-xl ${plugin.glow}`
                  : "border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300"
              )}
              onClick={() => setActivePlugin(plugin)}
            >
              {isEnabled && (
                <div className="absolute top-0 right-0 p-4">
                  <div className={cn("flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-opacity-10", plugin.color.replace('bg-', 'bg-').replace(']', ']/10'), plugin.textColor)}>
                    <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", plugin.color)} />
                    Active
                  </div>
                </div>
              )}
              
              <div className="p-6">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg transition-transform group-hover:scale-110",
                  plugin.color,
                  isEnabled ? plugin.glow : "shadow-slate-200"
                )}>
                  <Icon size={24} strokeWidth={2.5} />
                </div>
                
                <h3 className="text-base font-black text-slate-900 mb-2">{plugin.name}</h3>
                <p className="text-xs font-medium text-slate-500 leading-relaxed mb-6 line-clamp-2">
                  {plugin.desc}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {isEnabled ? 'Configure' : 'Setup Now'}
                  </span>
                  <button 
                    onClick={(e) => togglePlugin(plugin.id, e)}
                    className={cn(
                      "transition-colors",
                      isEnabled ? plugin.textColor : "text-slate-300 hover:text-slate-400"
                    )}
                  >
                    {isEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Configuration Modal */}
      <AnimatePresence>
        {activePlugin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setActivePlugin(null)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className={cn("h-2 w-full", activePlugin.color)} />
              
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", activePlugin.color)}>
                      <activePlugin.icon size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 leading-tight">{activePlugin.name}</h2>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configuration</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActivePlugin(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  {activePlugin.fields.map(field => (
                    <div key={field.key} className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        {field.label}
                      </label>
                      <Input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={settings[activePlugin.id]?.[field.key] || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          [activePlugin.id]: {
                            ...settings[activePlugin.id],
                            [field.key]: e.target.value
                          }
                        })}
                        className="font-mono text-sm bg-slate-50 border-slate-200"
                      />
                    </div>
                  ))}

                  <div className="pt-6 flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 rounded-xl h-12 font-bold"
                      onClick={() => setActivePlugin(null)}
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className={cn("flex-1 rounded-xl h-12 font-bold text-white shadow-lg", activePlugin.color.replace('bg-', 'hover:bg-').replace(']', ']/90'), activePlugin.color)}
                    >
                      {isSaving ? <Loader2 className="animate-spin" size={18} /> : (
                        <>
                          <Save size={18} className="mr-2" /> บันทึกการเชื่อมต่อ
                        </>
                      )}
                    </Button>
                  </div>
                </form>
                
                <div className="mt-6 p-4 rounded-2xl bg-slate-50 flex gap-3 border border-slate-100">
                  <AlertCircle size={20} className="text-slate-400 shrink-0" />
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    ข้อมูลของคุณจะถูกเข้ารหัสและจัดเก็บไว้อย่างปลอดภัยใน Local Storage ของคุณเท่านั้น ไม่มีการส่งไปเก็บไว้ที่เซิร์ฟเวอร์ส่วนกลาง
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
