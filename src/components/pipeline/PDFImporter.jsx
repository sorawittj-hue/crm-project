import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker explicitly for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PDFImporter = ({ onDataExtracted, callGeminiAPI }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
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
        if (file.type !== 'application/pdf') {
            setError("Please upload a valid PDF file.");
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // 1. Extract raw text locally
            const text = await extractTextFromPDF(file);

            // 2. Send to Gemini for structuring
            const prompt = `You are an AI data extractor for a CRM system. 
Analyze the following text extracted from an Express accounting software quotation PDF.
Extract the following information and return ONLY a valid JSON object:
{
  "contact": "Name of the contact person (string, empty if not found)",
  "company": "Name of the customer company (string, empty if not found)",
  "value": numeric total value of the quote (number),
  "date": "Date of the quote in YYYY-MM-DD format (string)",
  "title": "A short summary title for the deal based on the items or just 'Quotation for [Company]' (string)"
}

Raw Text:
${text.substring(0, 4000)} // Truncate to save tokens if it's too long
`;

            const aiResult = await callGeminiAPI(prompt);

            if (!aiResult) throw new Error("AI failed to process the PDF data.");

            onDataExtracted({ ...aiResult, sourceFilename: file.name });
        } catch (err) {
            console.error(err);
            setError(err.message || "An error occurred during processing.");
        } finally {
            setIsProcessing(false);
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    return (
        <div
            className={`border-2 border-dashed rounded-3xl p-8 transition-all ${isDragging ? 'border-accent bg-accent/5 scale-[1.02]' : 'border-gray-300 hover:border-gray-400 bg-surface'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
        >
            <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={(e) => processFile(e.target.files[0])} />

            <div className="flex flex-col items-center justify-center text-center">
                {isProcessing ? (
                    <>
                        <div className="relative">
                            <Loader2 size={48} className="animate-spin text-accent mb-4" />
                            <Sparkles size={16} className="absolute -top-1 -right-1 text-yellow-400 animate-pulse" />
                        </div>
                        <h3 className="text-lg font-black text-text-main mb-2">AI is reading your Express PDF...</h3>
                        <p className="text-sm text-text-muted">Extracting contact, value, and company details.</p>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center text-accent mb-4">
                            <Upload size={32} />
                        </div>
                        <h3 className="text-xl font-black text-text-main mb-2">Drag & Drop Express PDF</h3>
                        <p className="text-sm border flex items-center gap-2 font-bold bg-white text-text-muted px-4 py-2 rounded-xl mb-6 shadow-sm">
                            <FileText size={16} /> Auto-create Deals with AI
                        </p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-6 py-3 bg-accent text-white font-bold rounded-2xl shadow-clay-btn hover:-translate-y-1 transition-all"
                        >
                            Browse PDF File
                        </button>
                    </>
                )}

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
                        <AlertCircle size={14} /> {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PDFImporter;
