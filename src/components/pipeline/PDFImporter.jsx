import { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle2, FileText, Sliders } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

// Configure the worker explicitly for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PDFImporter = ({ onDataExtracted }) => {
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

    const deterministicSearch = (text, key) => {
        const patterns = {
            company: [/Company:\s*([^\n]+)/i, /Name:\s*([^\n]+)/i, /([A-Z][a-z]+ [A-Z].+)/],
            total: [/Total:\s*([\d,.ผ]+)/i, /Amount:\s*([\d,.ผ]+)/i],
            contact: [/Contact:\s*([^\n]+)/i, /Inquiry:\s*([^\n]+)/i]
        };
        const match = text.match(patterns[key]?.[0] || /./);
        return match ? match[1]?.trim() : null;
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
            
            // Logic Rule Engine for extraction
            // We use simple regex logic instead of AI
            const company = deterministicSearch(text, 'company') || "Unknown Enterprise";
            const contact = deterministicSearch(text, 'contact') || "Direct Inquiry";
            const rawValue = deterministicSearch(text, 'total') || "0";
            const cleanValue = parseFloat(rawValue.replace(/,/g, '')) || 500000; // Mock default for demo

            const ruleResult = {
              contact,
              company,
              value: cleanValue,
              title: `Procurement: ${company}`,
              probability: 50,
              sourceFilename: file.name
            };

            setTimeout(() => {
                setSuccess(true);
                setIsProcessing(false);
                setTimeout(() => {
                    onDataExtracted(ruleResult);
                    setSuccess(false);
                }, 1500);
            }, 2000);
        } catch (err) {
            setError(err.message || "Diagnostic error during rule-based extraction.");
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
                            <div className="w-12 h-12 border-4 border-slate-900/20 border-t-slate-900 rounded-full animate-spin mx-auto" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-900 animate-pulse">Running Logic Rule Set...</p>
                        </motion.div>
                    ) : success ? (
                        <motion.div key="succ" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto"><CheckCircle2 size={32} className="text-emerald-500" /></div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Rule Matching Complete</p>
                        </motion.div>
                    ) : (
                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                            <div className="w-20 h-20 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                                <FileText size={40} className="text-slate-300" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Logic Importer</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[250px] mx-auto">
                                    Drop your Express-ERP PDF here for Rule Engine synchronization.
                                </p>
                            </div>
                            <Button onClick={() => fileInputRef.current?.click()} className="rounded-full px-10 h-14 shadow-lg shadow-slate-900/10 bg-slate-900 text-white font-black text-xs uppercase tracking-widest">
                                <Upload size={18} className="mr-2" /> Sync Asset
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
               <Sliders size={12} className="text-slate-400" />
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rule Engine Health: NOMINAL</p>
            </div>
        </div>
    );
};

export default PDFImporter;
