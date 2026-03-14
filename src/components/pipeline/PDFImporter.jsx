import { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle2, FileText, Cpu, Zap, Activity } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { Card } from '../ui/Card';

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
      } catch {
        return null;
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

            const aiResultStr = await callGeminiAPI(prompt);
            const aiResult = parseAIResponse(aiResultStr);

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
        <Card className="premium-card bg-muted/10 overflow-hidden border-dashed border-2 border-border/40">
            <div
                className={cn(
                    "relative min-h-[300px] transition-all duration-700 p-8",
                    isDragging ? "bg-primary/[0.03] scale-[0.99]" : "bg-transparent",
                    isProcessing && "pointer-events-none"
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

                <div className="flex flex-col items-center justify-center text-center h-full min-h-[250px] relative z-20">
                    <AnimatePresence mode="wait">
                        {isProcessing ? (
                            <motion.div 
                                key="processing"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1 }}
                                className="space-y-8"
                            >
                                <div className="relative mx-auto w-24 h-24">
                                    <motion.div 
                                       animate={{ rotate: 360 }}
                                       transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                       className="absolute inset-0 rounded-full border-2 border-primary/10 border-t-primary shadow-[0_0_20px_-5px_rgba(var(--primary),0.5)]"
                                    />
                                    <div className="absolute inset-4 rounded-full bg-primary/5 flex items-center justify-center">
                                       <Activity className="text-primary animate-pulse" size={32} />
                                    </div>
                                    <motion.div 
                                       animate={{ opacity: [0, 0.5, 0] }}
                                       transition={{ duration: 2, repeat: Infinity }}
                                       className="absolute -inset-4 bg-primary/10 blur-2xl rounded-full"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-xl font-black uppercase tracking-[0.2em] premium-gradient-text italic">Scanning Node Matrix</h3>
                                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                                       <Cpu size={12} className="animate-spin-slow" />
                                       <span>Extracting High-Value Signals</span>
                                    </div>
                                </div>
                            </motion.div>
                        ) : success ? (
                            <motion.div 
                                key="success"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6"
                            >
                                <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]">
                                    <CheckCircle2 size={48} className="text-emerald-500" />
                                </div>
                                <div className="space-y-2">
                                   <h3 className="text-2xl font-black uppercase tracking-tighter premium-gradient-text">Synchronization Complete</h3>
                                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Injecting data into your sector</p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-8"
                            >
                                <div className="relative mx-auto group">
                                   <div className="absolute -inset-4 bg-primary/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                   <div className="w-24 h-24 bg-muted/20 rounded-[2.5rem] flex items-center justify-center mx-auto border border-border/40 group-hover:border-primary/40 group-hover:scale-105 transition-all duration-700 group-hover:shadow-[0_0_30px_-5px_rgba(var(--primary),0.1)]">
                                       <FileText size={40} className="text-primary/60 group-hover:text-primary transition-colors duration-700" />
                                   </div>
                                   <div className="absolute -top-2 -right-2">
                                      <Zap size={24} className="text-primary animate-pulse" />
                                   </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-3xl font-black uppercase tracking-tighter">AI Digital Importer</h3>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] max-w-[300px] mx-auto leading-relaxed">
                                       Drop <span className="text-primary italic">Express-ERP Quotation</span> here to synchronize global deal nodes
                                    </p>
                                </div>
                                <Button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="btn-zenith-primary h-14 px-10 text-[11px] font-black shadow-2xl shadow-primary/20"
                                >
                                    <Upload size={18} className="mr-2" /> Select Intelligence File
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-10 p-5 bg-destructive/10 border border-destructive/20 text-destructive rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-4 max-w-sm mx-auto shadow-lg"
                        >
                            <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                               <AlertCircle size={18} />
                            </div>
                            <span className="text-left leading-tight">{error}</span>
                        </motion.div>
                    )}
                </div>

                {/* Cyberdecorations */}
                <div className="absolute top-4 left-4 border-l border-t border-primary/20 w-8 h-8 rounded-tl-xl" />
                <div className="absolute top-4 right-4 border-r border-t border-primary/20 w-8 h-8 rounded-tr-xl" />
                <div className="absolute bottom-4 left-4 border-l border-b border-primary/20 w-8 h-8 rounded-bl-xl" />
                <div className="absolute bottom-4 right-4 border-r border-b border-primary/20 w-8 h-8 rounded-br-xl" />
                
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                     style={{ 
                        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                     }} 
                />
            </div>
        </Card>
    );
};

export default PDFImporter;
