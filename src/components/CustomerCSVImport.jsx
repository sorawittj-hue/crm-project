import React, { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogContent } from './ui/Dialog';
import { Button } from './ui/Button';
import { Upload, FileText, AlertCircle } from 'lucide-react';

export default function CustomerCSVImport({ open, onOpenChange, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setIsUploading(true);
    // Simulate parsing and importing
    setTimeout(() => {
      setIsUploading(false);
      setFile(null);
      onOpenChange(false);
      if (onImportSuccess) onImportSuccess();
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[2rem] p-6 bg-white/95 backdrop-blur-xl border border-white/80 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Upload className="text-violet-500" /> นำเข้าข้อมูลลูกค้า (CSV)
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">คลิกเพื่อเลือกไฟล์ CSV</p>
                <p className="text-xs text-slate-500 mt-1">รองรับไฟล์ .csv ขนาดไม่เกิน 5MB</p>
              </div>
            </label>
          </div>
          
          {file && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between text-sm">
              <span className="text-emerald-700 font-medium truncate flex-1">{file.name}</span>
              <span className="text-emerald-600 text-xs bg-emerald-100 px-2 py-1 rounded-lg">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
          )}
          
          <div className="bg-blue-50 p-3 rounded-xl flex items-start gap-2 text-xs text-blue-700">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p>คอลัมน์ที่รองรับ: ชื่อลูกค้า, บริษัท, อีเมล, เบอร์โทร, อุตสาหกรรม (สามารถดาวน์โหลด Template ได้)</p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl border-slate-200 hover:bg-slate-50">
            ยกเลิก
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!file || isUploading}
            className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white min-w-[120px]"
          >
            {isUploading ? 'กำลังนำเข้า...' : 'เริ่มนำเข้าข้อมูล'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
