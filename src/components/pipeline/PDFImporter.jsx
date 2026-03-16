import { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle2, FileText, Activity } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

// Configure the worker explicitly for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PDFImporter = ({ onDataExtracted, callGeminiAPI }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef(null);

    const extractTextFromPDF = async (file) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }
            return fullText;
        } catch (err) {
            console.error("PDF Extraction Error:", err);
            throw new Error("Cannot extract text from this PDF file.");
        }
    };

    const parseAIResponse = (text) => {
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch { return null; }
    };

    const processFile = async (file) => {
        if (!file) return;
        if (file.type !== 'application/pdf') {
            setError("Please upload a valid PDF file.");
            return;
        }
        setIsProcessing(true);
        setError(null);
        setSuccess(false);

        try {
            const text = await extractTextFromPDF(file);
            const prompt = `Extract information from this quotation PDF.
            Return ONLY a valid JSON object:
            {
              "contact": "Contact person name",
              "company": "Company name",
              "value": numeric_total_amount,
              "title": "Clear deal title",
              "probability": 40
            }
            PDF Content: ${text.substring(0, 5000)}`;

            const aiResultStr = await callGeminiAPI(prompt);
            const aiResult = parseAIResponse(aiResultStr);
            if (!aiResult) throw new Error("AI failed to read the document structure.");

            setSuccess(true);
            setTimeout(() => {
                onDataExtracted({ ...aiResult, sourceFilename: file.name });
            }, 1000);
        } catch (err) {
            setError(err.message || "Diagnostic error during extraction.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="relative">
            <div
                className={cn(
                    "min-h-[300px] border-2 border-dashed rounded-[2rem] transition-all flex flex-col items-center justify-center p-8 text-center",
                    isDragging ? "bg-primary/5 border-primary scale-[0.98]" : "bg-slate-50/50 border-slate-200",
                    isProcessing && "pointer-events-none opacity-60"
                )}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); processFile(e.dataTransfer.files[0]); }}
            >
                <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={(e) => processFile(e.target.files[0])} />

                <AnimatePresence mode="wait">
                    {isProcessing ? (
                        <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary animate-pulse">Analyzing Document Intelligence...</p>
                        </motion.div>
                    ) : success ? (
                        <motion.div key="succ" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto"><CheckCircle2 size={32} className="text-emerald-500" /></div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Scan Content Verified</p>
                        </motion.div>
                    ) : (
                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                            <div className="w-20 h-20 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                                <FileText size={40} className="text-slate-300" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Import Quotation</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[250px] mx-auto">
                                    Drop your Express-ERP PDF here or click below to upload.
                                </p>
                            </div>
                            <Button onClick={() => fileInputRef.current?.click()} className="rounded-full px-10 h-14 shadow-lg shadow-primary/20 font-black text-xs uppercase tracking-widest">
                                <Upload size={18} className="mr-2" /> Select File
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {error && (
                    <div className="mt-8 p-4 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-3">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}
            </div>
            
            <div className="mt-6 flex items-center justify-center gap-2">
               <Activity size={12} className="text-primary" />
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Extraction Engine Active</p>
            </div>
        </div>
    );
};

export default PDFImporter;
