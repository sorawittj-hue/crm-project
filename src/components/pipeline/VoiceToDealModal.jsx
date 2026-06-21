import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Loader2, Mic, StopCircle, Sparkles, Check } from 'lucide-react';
import { parseVoiceDealText } from '../../services/ai';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceToDealModal({ open, onOpenChange, onSaveDeal }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);

  // Initialize SpeechRecognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'th-TH'; // Default to Thai

        recognitionRef.current.onresult = (event) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setIsRecording(false);
          setError('เกิดข้อผิดพลาดในการบันทึกเสียง: ' + event.error);
        };
      }
    }
  }, []);

  const startRecording = () => {
    if (!recognitionRef.current) {
      setError('เบราว์เซอร์ของคุณไม่รองรับการบันทึกเสียง');
      return;
    }
    setTranscript('');
    setParsedData(null);
    setError(null);
    setIsRecording(true);
    recognitionRef.current.start();
  };

  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    
    if (transcript.trim().length > 5) {
      await processTranscript(transcript);
    } else {
      setError('ไม่ได้ยินเสียงหรือข้อความสั้นเกินไป กรุณาลองใหม่');
    }
  };

  const processTranscript = async (text) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await parseVoiceDealText(text);
      if (result) {
        setParsedData({
          title: result.title || '',
          company: result.company || '',
          value: result.value || '',
          contact: result.contact || '',
          stage: result.stage || 'lead',
          expected_close_date: result.expected_close_date || ''
        });
      } else {
        setError('ไม่สามารถแยกข้อมูลจากเสียงได้ กรุณาลองใหม่ หรือพิมพ์เอง');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการประมวลผลด้วย AI');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (!parsedData || !parsedData.company) {
      setError('กรุณาระบุชื่อบริษัทเป็นอย่างน้อย');
      return;
    }
    onSaveDeal({
      ...parsedData,
      value: Number(parsedData.value) || 0,
      probability: 50 // Default
    });
    // Reset state
    setParsedData(null);
    setTranscript('');
    onOpenChange(false);
  };

  // When modal closes, stop recording if active
  useEffect(() => {
    if (!open && isRecording) {
      stopRecording();
    }
  }, [open, isRecording]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0 bg-white shadow-2xl">
        <div className="h-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
              <Mic size={18} className="text-violet-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Voice to Deal</h3>
              <p className="text-xs text-slate-400 mt-0.5">พูดเพื่อสร้างดีล AI จะจัดการให้</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!parsedData ? (
              <motion.div
                key="recording"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6 flex flex-col items-center justify-center py-6"
              >
                {/* Visualizer / Button */}
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className={cn(
                    "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 relative",
                    isRecording ? "bg-rose-50 border-rose-200" : "bg-violet-50 hover:bg-violet-100 border-violet-200",
                    "border-4 cursor-pointer"
                  )}
                >
                  {isRecording && (
                    <div className="absolute inset-0 rounded-full animate-ping bg-rose-400 opacity-20" />
                  )}
                  {isProcessing ? (
                    <Loader2 size={40} className="text-violet-600 animate-spin" />
                  ) : isRecording ? (
                    <StopCircle size={40} className="text-rose-500" />
                  ) : (
                    <Mic size={40} className="text-violet-600" />
                  )}
                </button>
                
                <p className="text-sm font-semibold text-slate-500 text-center">
                  {isProcessing ? "AI กำลังวิเคราะห์..." : isRecording ? "ปล่อยเพื่อหยุดบันทึก..." : "กดค้างไว้เพื่อพูด"}
                </p>

                {transcript && (
                  <div className="w-full bg-slate-50 p-4 rounded-xl text-sm text-slate-700 italic border border-slate-100 min-h-[60px] max-h-[120px] overflow-y-auto shadow-inner">
                    "{transcript}"
                  </div>
                )}
                
                {error && <p className="text-xs font-bold text-rose-500">{error}</p>}
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-100 mb-4">
                  <Check size={14} /> AI ดึงข้อมูลสำเร็จ กรุณาตรวจสอบก่อนบันทึก
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ชื่อบริษัท/ลูกค้า</label>
                  <Input
                    value={parsedData.company}
                    onChange={e => setParsedData({...parsedData, company: e.target.value})}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">หัวข้อดีล</label>
                  <Input
                    value={parsedData.title}
                    onChange={e => setParsedData({...parsedData, title: e.target.value})}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">มูลค่า (บาท)</label>
                    <Input
                      type="number"
                      value={parsedData.value}
                      onChange={e => setParsedData({...parsedData, value: e.target.value})}
                      className="h-10 rounded-xl font-bold text-violet-700"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">วันคาดปิดดีล</label>
                    <input
                      type="date"
                      value={parsedData.expected_close_date}
                      onChange={e => setParsedData({...parsedData, expected_close_date: e.target.value})}
                      className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ผู้ติดต่อ</label>
                  <Input
                    value={parsedData.contact}
                    onChange={e => setParsedData({...parsedData, contact: e.target.value})}
                    className="h-10 rounded-xl"
                  />
                </div>
                
                {error && <p className="text-xs font-bold text-rose-500 mt-2">{error}</p>}
                
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setParsedData(null); setTranscript(''); }}
                    className="flex-1 rounded-xl"
                  >
                    เริ่มใหม่
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="flex-1 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-md shadow-violet-500/20"
                  >
                    บันทึกดีล
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
