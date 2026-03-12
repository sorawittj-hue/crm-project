import { useState, useRef } from 'react';
import { Upload, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
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
            const prompt = `You are a World-Class Data Analyst. Extract information from this Express/ERP quotation PDF.
            Return ONLY a valid JSON object:
            {
              "contact": "Contact person name",
              "company": "Company name",
              "value": numeric_total_amount,
              "title": "Clear deal title",
              "probability": 40
            }
            
            PDF Content:
            ${text.substring(0, 5000)}`;

            const aiResult = await callGeminiAPI(prompt);

            if (!aiResult) throw new Error("AI intelligence failed to decode PDF.");

            setSuccess(true);
            setTimeout(() => {
                onDataExtracted({ ...aiResult, sourceFilename: file.name });
            }, 1000);
        } catch (err) {
            console.error(err);
            setError(err.message || "Diagnostic error during extraction.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-1"
        >
            <div
                className={cn(
                    "relative border-2 border-dashed rounded-3xl p-12 transition-all duration-500 overflow-hidden",
                    isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-white/10 bg-black/20 hover:border-white/20",
                    isProcessing && "border-primary/50 animate-pulse"
                )}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); processFile(e.dataTransfer.files[0]); }}
            >
                <input 
                    type="file" 
                    accept="application/pdf" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={(e) => processFile(e.target.files[0])} 
                />

                <div className="flex flex-col items-center justify-center text-center relative z-10">
                    <AnimatePresence mode="wait">
                        {isProcessing ? (
                            <motion.div 
                                key="processing"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <div className="relative mx-auto w-20 h-20">
                                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter italic">Scanning Matrix...</h3>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-2">Extracting high-value signals</p>
                                </div>
                            </motion.div>
                        ) : success ? (
                            <motion.div 
                                key="success"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-4"
                            >
                                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto border border-emerald-500/50">
                                    <CheckCircle2 size={40} className="text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-tighter italic">Data Synchronized</h3>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-6"
                            >
                                <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/5 group-hover:scale-110 transition-transform duration-500">
                                    <Upload size={32} className="text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter">AI Intel Scanner</h3>
                                    <p className="text-xs font-bold text-muted-foreground">Drop Express PDF here to auto-populate deal nodes</p>
                                </div>
                                <Button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary text-primary-foreground shadow-2xl shadow-primary/20"
                                >
                                    Browse Intelligence File
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
                        >
                            <AlertCircle size={16} /> {error}
                        </motion.div>
                    )}
                </div>

                {/* Decorative background grid */}
                <div className="absolute inset-0 -z-10 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            </div>
        </motion.div>
    );
};

export default PDFImporter;
