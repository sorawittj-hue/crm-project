import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, KanbanSquare, Users, Plus, Search, MoreHorizontal,
  Building2, DollarSign, Calendar, Trophy, X, Loader2, Database, Menu,
  CheckCircle2, Upload, Download, FileSpreadsheet, AlertCircle,
  FileText, CheckSquare, MessageSquare, Trash2, XCircle, Clock, ArrowRight,
  Cpu, Calculator, Server, HardDrive, Wrench, ChevronRight, RotateCcw,
  Battery, Zap, Signal, PieChart, BarChart3, Target, Sparkles, Wand2, TrendingUp, Flame, AlertTriangle, Pencil, Save, ArrowRightCircle
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- Supabase Configuration ---
// ใช้ Environment Variables จากไฟล์ .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || "your-anon-key";

// Initialize Supabase Client
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Components ---
const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon, disabled = false, fullWidth = false, size = 'md' }) => {
  const baseStyle = "flex items-center justify-center rounded-2xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-95 tracking-wide";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-5 py-2.5 text-sm", lg: "px-8 py-4 text-base" };
  const variants = {
    primary: "bg-accent text-white shadow-clay-btn hover:-translate-y-1 hover:shadow-lg active:shadow-clay-btn-active active:translate-y-0",
    secondary: "bg-surface text-text-main shadow-clay-btn hover:text-accent hover:-translate-y-1 active:shadow-clay-btn-active active:translate-y-0",
    ghost: "text-text-muted hover:bg-surface/50 hover:text-text-main bg-transparent hover:shadow-clay-sm",
    success: "bg-warm-green text-white shadow-clay-btn hover:-translate-y-1 active:shadow-clay-btn-active",
    danger: "bg-warm-red text-white shadow-clay-btn hover:-translate-y-1 active:shadow-clay-btn-active",
    outline: "border-2 border-accent text-accent hover:bg-accent hover:text-white active:bg-accent/80"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}>
      {Icon && <Icon size={size === 'sm' ? 16 : 20} className="mr-2" strokeWidth={2.5} />}
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-surface rounded-3xl shadow-clay-md border border-white/60 ${className}`}>
    {children}
  </div>
);

// --- Main Application ---
const App = () => {
  // const isDemoMode = true; // FORCE DEMO MODE (Local Storage)
  const isDemoMode = false; // Real Supabase Mode
  // ---/ State /---
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'dashboard' | 'contacts' | 'spec-setup' | 'tools'
  const [isDbReady, setIsDbReady] = useState(true); // Always ready in Local Mode
  const [specBudget, setSpecBudget] = useState(50000);
  const [specUseCase, setSpecUseCase] = useState('general');
  const [recommendedSpecs, setRecommendedSpecs] = useState([]);
  const [isGeneratingSpec, setIsGeneratingSpec] = useState(false);

  // Tools State
  // Tools State
  const [activeTool, setActiveTool] = useState('raid'); // 'raid' | 'cpu'
  const [raidConfig, setRaidConfig] = useState({ size: 4, unit: 'TB', count: 4, level: '5' });
  const [raidResult, setRaidResult] = useState(null);

  // CPU Compare State
  const [cpuInputs, setCpuInputs] = useState({ cpuA: '', cpuB: '' });
  const [cpuResults, setCpuResults] = useState(null);
  const [isComparingCpu, setIsComparingCpu] = useState(false);

  // Helper to generate mock CPU data based on model name
  // --- Gemini AI Integration ---
  const callGeminiAPI = async (prompt) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) { alert("API Key Missing"); return null; }

    try {
      // 1. Auto-Discover Models (Dynamic)
      // This fixes "Model Not Found" by asking Google "What models CAN I use?"
      const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const listData = await listResponse.json();

      if (listData.error) {
        throw new Error(`ListModels Failed: ${listData.error.message}`);
      }

      // Find the first model that supports 'generateContent'
      const validModel = listData.models?.find(m =>
        m.supportedGenerationMethods?.includes("generateContent") &&
        (m.name.includes("gemini") || m.name.includes("pro") || m.name.includes("flash"))
      );

      if (!validModel) {
        throw new Error("No compatible Gemini models found for this API Key.");
      }

      const modelName = validModel.name.replace("models/", ""); // e.g., "gemini-1.5-flash"
      console.log(`Using Auto-Discovered Model: ${modelName}`);

      // 2. Call the API with the discovered model
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
      }
    } catch (e) {
      console.error(e);
      alert(`AI Failed: ${e.message}\n\nPlease check that 'Generative Language API' is enabled in Google Cloud Console.`);
      return null;
    }
  };

  const handleCpuCompare = async () => {
    setIsComparingCpu(true);
    const prompt = `Compare these two CPUs: "${cpuInputs.cpuA}" vs "${cpuInputs.cpuB}".
    Return ONLY a JSON object with this exact structure:
    {
      "cpuA": { "model": "Full Model Name", "make": "Intel/AMD", "cores": "X Cores / Y Threads", "clock": "Base-Boost GHz", "tdp": "Watts", "desc": "Brief 1 sentence description" },
      "cpuB": { "model": "Full Model Name", "make": "Intel/AMD", "cores": "X Cores / Y Threads", "clock": "Base-Boost GHz", "tdp": "Watts", "desc": "Brief 1 sentence description" }
    }
    If a CPU is unknown, assume reasonable specs or mark as unknown.`;

    const result = await callGeminiAPI(prompt);

    if (result) {
      setCpuResults(result);
    }
    setIsComparingCpu(false);
  };

  const handleGenerateSpec = async () => {
    setIsGeneratingSpec(true);
    const prompt = `Recommend 3 server/workstation specifications for this use case: "${specUseCase}" with a budget around ${specBudget} THB.
    Return ONLY a JSON array of objects with this structure, no markdown:
    [
      { "id": 1, "name": "Entry Option", "cpu": "Model", "ram": "Size", "storage": "Size", "price": "number", "desc": "Why this matches" },
      { "id": 2, "name": "Best Value", "cpu": "Model", "ram": "Size", "storage": "Size", "price": "number", "desc": "Why this matches" },
      { "id": 3, "name": "High Performance", "cpu": "Model", "ram": "Size", "storage": "Size", "price": "number", "desc": "Why this matches" }
    ]`;

    const result = await callGeminiAPI(prompt);
    if (result && Array.isArray(result)) {
      setRecommendedSpecs(result);
    }
    setIsGeneratingSpec(false);
  };

  // Bandwidth Calc State
  const [bwConfig, setBwConfig] = useState({ size: 100, sizeUnit: 'GB', speed: 1, speedUnit: 'Gbps' });
  const [bwResult, setBwResult] = useState('');

  // UPS Calc State
  const [upsConfig, setUpsConfig] = useState({ load: 500, voltage: 12, capacity: 9, quantity: 4 });
  const [upsResult, setUpsResult] = useState(null);

  const [deals, setDeals] = useState([]);

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  // UX State
  const [draggedDeal, setDraggedDeal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(''); // State for date filter
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDealForMove, setSelectedDealForMove] = useState(null); // Keep this if existing or remove if unused, but I'll add a new clear one or use this one. 
  // Wait, I see selectedDealForMove on line 177 in previous reads (Step 269). Let's use that if it exists.
  const [movingDeal, setMovingDeal] = useState(null);
  const fileInputRef = useRef(null);
  const [importStatus, setImportStatus] = useState(null);

  // Persist Goal to Supabase
  const [monthlyGoal, setMonthlyGoal] = useState(1000000);
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'monthly_goal').single();
      if (data && data.value) setMonthlyGoal(Number(data.value));
    };
    fetchSettings();
  }, []);

  const handleSaveGoal = async () => {
    setIsEditingGoal(false);
    await supabase.from('settings').upsert({ key: 'monthly_goal', value: String(monthlyGoal) }, { onConflict: 'key' });
  };

  // Detail View Inputs
  const [newNote, setNewNote] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');

  // 2. Load Data from Supabase Realtime
  useEffect(() => {
    const fetchDeals = async () => {
      const { data, error } = await supabase.from('deals').select('*').order('createdAt', { ascending: false });
      if (!error) setDeals(data || []);
      setLoading(false);
    };

    fetchDeals();

    // Realtime Subscription
    const subscription = supabase
      .channel('deals_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setDeals(prev => {
            if (prev.some(d => d.id === payload.new.id)) return prev;
            return [payload.new, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setDeals(prev => prev.map(d => d.id === payload.new.id ? payload.new : d));
        } else if (payload.eventType === 'DELETE') {
          setDeals(prev => prev.filter(d => d.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  const stages = [
    { id: 'lead', title: 'ลูกค้าใหม่ (Cold)', color: 'bg-primary/20 border-primary/30', textColor: 'text-text-main' },
    { id: 'contact', title: 'เริ่มพูดคุย (Warm)', color: 'bg-warm-blue/20 border-warm-blue/30', textColor: 'text-warm-blue-dark' },
    { id: 'proposal', title: 'ส่งใบเสนอราคา (Warm+)', color: 'bg-warm-yellow/20 border-warm-yellow/30', textColor: 'text-warm-yellow-dark' },
    { id: 'negotiation', title: 'เจรจา/ปิดดีล (Hot 🔥)', color: 'bg-orange-100 border-orange-200', textColor: 'text-orange-700' },
    { id: 'won', title: 'ปิดการขาย (Won)', color: 'bg-warm-green/20 border-warm-green/30', textColor: 'text-warm-green-dark' },
    { id: 'lost', title: 'หลุด/แพ้ (Lost)', color: 'bg-warm-red/20 border-warm-red/30', textColor: 'text-warm-red-dark' },
  ];

  // Logic Functions
  const handleDealClick = (deal) => setSelectedDeal(deal);

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleUpdateDeal = async (dealId, data) => {
    data.lastActivity = new Date().toISOString(); // Update timestamp for Stale Alert / Sorting
    // 1. Optimistic Update
    let updatedDeal = null;
    setDeals(prev => prev.map(d => {
      if (d.id === dealId) {
        updatedDeal = { ...d, ...data, updatedAt: new Date().toISOString() };
        return updatedDeal;
      }
      return d;
    }));

    // 2. Workflow Automation Logic (Smart Stage Triggers)
    if (updatedDeal && data.stage) {
      // Define Rules for each Stage
      const stageAutomations = {
        'lead': { task: 'ตรวจสอบข้อมูลลูกค้าเบื้องต้น (Auto)', check: 'ตรวจสอบข้อมูล' },
        'contact': { task: 'โทรหาลูกค้าเพื่อแนะนำตัว (Auto)', check: 'โทร' },
        'proposal': { task: 'จัดเตรียมและส่งใบเสนอราคา (Auto)', check: 'ใบเสนอราคา' },
        'negotiation': { task: 'ติดตามผลและต่อรองเงื่อนไข (Auto)', check: 'ต่อรอง' },
        'won': { task: 'เตรียมสัญญาและเอกสารปิดการขาย (Auto)', check: 'สัญญา' },
        'lost': { task: 'วิเคราะห์สาเหตุที่หลุด (Auto)', check: 'วิเคราะห์' }
      };

      const rule = stageAutomations[data.stage];

      if (rule) {
        // Check if task already exists
        const hasTask = updatedDeal.tasks?.some(t => t.text.includes(rule.check));

        if (!hasTask) {
          const newTaskItem = {
            id: Date.now(), // Generate ID
            text: rule.task,
            date: new Date().toISOString(),
            completed: false
          };

          updatedDeal.tasks = [...(updatedDeal.tasks || []), newTaskItem];

          // Re-update state with the new task
          setDeals(prev => prev.map(d => d.id === dealId ? updatedDeal : d));

          // Add to payload for Supabase
          data.tasks = updatedDeal.tasks;

          showToast(`⚡ Smart Trigger: สร้าง Task '${rule.task}'`, "success");
        }
      }
    }

    try {
      const { error } = await supabase.from('deals').update(data).eq('id', dealId);
      if (error) console.error("Error updating deal:", error);
    } catch (error) { console.error("Error updating deal:", error); }
  };

  // Rule 2: "If Inactive > 7 Days -> Notify/Add Task" (Run on Load)
  useEffect(() => {
    if (loading || !deals.length) return;

    const checkInactivity = async () => {
      const now = new Date();
      let automationTriggered = false;

      const updates = deals.map(deal => {
        if (deal.stage === 'won' || deal.stage === 'lost') return deal; // Ignore finished deals

        const lastActivityDate = new Date(deal.lastActivity || deal.createdAt); // Fallback to CreatedAt
        const diffTime = Math.abs(now - lastActivityDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 7) {
          const hasFollowUpTask = deal.tasks?.some(t => t.text.includes('7 วัน'));
          if (!hasFollowUpTask) {
            const newTaskItem = {
              id: Date.now() + Math.random(), // Ensure unique ID
              text: '⚠️ แจ้งเตือน: เงียบไปเกิน 7 วัน (Auto)',
              date: now.toISOString(),
              completed: false
            };

            // Trigger Supabase Update for this deal
            supabase.from('deals').update({
              tasks: [...(deal.tasks || []), newTaskItem]
            }).eq('id', deal.id);

            automationTriggered = true;
            return { ...deal, tasks: [...(deal.tasks || []), newTaskItem] };
          }
        }
        return deal;
      });

      if (automationTriggered) {
        setDeals(updates);
        showToast("🔔 Automation: ตรวจพบดีลเงียบเกิน 7 วัน", "warning");
      }
    };

    // Run once when deals are loaded and stable
    const timeoutId = setTimeout(checkInactivity, 2000); // Small delay to ensure data is ready
    return () => clearTimeout(timeoutId);

  }, [loading /* Only Re-run if loading changes (initial load), NOT on every deal change to avoid loops */]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedDeal) return;
    const note = { id: Date.now(), text: newNote, date: new Date().toISOString(), user: 'User' };
    const updatedNotes = [...(selectedDeal.notes || []), note];
    await handleUpdateDeal(selectedDeal.id, { notes: updatedNotes });
    setNewNote('');
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || !selectedDeal) return;
    const task = { id: Date.now(), text: newTask, date: newTaskDate || new Date().toISOString(), completed: false };
    const updatedTasks = [...(selectedDeal.tasks || []), task];
    await handleUpdateDeal(selectedDeal.id, { tasks: updatedTasks });
    setNewTask(''); setNewTaskDate('');
  };

  const handleToggleTask = async (taskId) => {
    if (!selectedDeal) return;
    const updatedTasks = selectedDeal.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    await handleUpdateDeal(selectedDeal.id, { tasks: updatedTasks });
  };

  const handleDeleteTask = async (taskId) => {
    if (!selectedDeal) return;
    const updatedTasks = selectedDeal.tasks.filter(t => t.id !== taskId);
    await handleUpdateDeal(selectedDeal.id, { tasks: updatedTasks });
  };

  const handleDragStart = (e, dealId) => { setDraggedDeal(dealId); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = async (e, stageId) => {
    e.preventDefault();
    if (draggedDeal) {
      await handleUpdateDeal(draggedDeal, { stage: stageId });
      setDraggedDeal(null);
    }
  };

  const handleAddDeal = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const dealDate = formData.get('date') ? new Date(formData.get('date')).toISOString() : new Date().toISOString();
    const newDeal = {
      title: formData.get('title'),
      company: formData.get('company'),
      contact: formData.get('contact'),
      value: Number(formData.get('value')),
      stage: 'lead',
      probability: 20,
      lastActivity: new Date().toISOString(),
      createdAt: dealDate,
      notes: [], tasks: []
    };
    try {
      const { data, error } = await supabase.from('deals').insert([newDeal]).select();
      if (!error && data) {
        setDeals(prev => [data[0], ...prev]);
        setIsModalOpen(false);
      }
    } catch (error) { console.error(error); }
  };

  // Predictive Scoring State
  const [analyzingDealIds, setAnalyzingDealIds] = useState(new Set());

  const handleAnalyzeDeal = async (deal, e) => {
    e.stopPropagation();
    if (analyzingDealIds.has(deal.id)) return;

    setAnalyzingDealIds(prev => new Set(prev).add(deal.id));

    try {
      const prompt = `Analyze this sales deal for probability of winning (0-100) based on:
      Title: ${deal.title}
      Stage: ${deal.stage} (lead -> contact -> proposal -> negotiation -> won)
      Value: ${deal.value}
      Company: ${deal.company}
      
      Return ONLY a JSON object: { "score": number, "insight": "Short strategic reason (max 10 words)" }`;

      const result = await callGeminiAPI(prompt);

      if (result && result.score !== undefined) {
        // Update Supabase
        const { error } = await supabase.from('deals').update({
          ai_score: result.score,
          ai_insight: result.insight
        }).eq('id', deal.id);

        if (!error) {
          // Optimistic Update
          setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, ai_score: result.score, ai_insight: result.insight } : d));
        } else {
          alert("Please create 'ai_score' and 'ai_insight' columns in Supabase first!");
        }
      }
    } catch (error) {
      console.error(error);
      alert("Analysis failed");
    } finally {
      setAnalyzingDealIds(prev => {
        const next = new Set(prev);
        next.delete(deal.id);
        return next;
      });
    }
  };

  const handleMarkLost = async (e) => {
    e.preventDefault();
    if (!selectedDeal) return;
    const formData = new FormData(e.target);
    const reason = formData.get('reason');
    const followUpMonths = formData.get('followUp');

    const updates = { stage: 'lost', lostReason: reason };

    // Win-Back Strategy: Auto-create Task
    if (followUpMonths && followUpMonths !== 'no') {
      const months = parseInt(followUpMonths);
      const followUpDate = new Date();
      followUpDate.setMonth(followUpDate.getMonth() + months);

      const task = {
        id: Date.now(),
        text: `♻️ Win-Back: ติดตามลูกค้า (เคยหลุด: ${reason})`,
        date: followUpDate.toISOString(),
        completed: false
      };
      // We need to fetch current tasks first or rely on selectedDeal.tasks
      updates.tasks = [...(selectedDeal.tasks || []), task];
      showToast(`ตั้งเตือนติดตามลูกค้าในอีก ${months} เดือนเรียบร้อย`, "success");
    }

    await handleUpdateDeal(selectedDeal.id, updates);
    setIsLostModalOpen(false);
    setSelectedDeal(null);
  };

  const handleSaveDealDetails = async (e) => {
    e.preventDefault();
    if (!selectedDeal) return;
    const formData = new FormData(e.target);

    const updates = {
      title: formData.get('title'),
      value: Number(formData.get('value')),
      contact: formData.get('contact'),
      company: formData.get('company'),
      createdAt: new Date(formData.get('createdAt')).toISOString(),
    };

    await handleUpdateDeal(selectedDeal.id, updates);
    setSelectedDeal(prev => ({ ...prev, ...updates })); // Update local modal state
    setIsEditingDetails(false);
    showToast("อัพเดทข้อมูลเรียบร้อย", "success");
  };

  const handleDeleteDeal = async (dealId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this deal?")) return;

    // Optimistic UI Update: Remove deeply from state immediately
    const originalDeals = [...deals];
    setDeals(prev => prev.filter(d => d.id !== dealId));

    if (isDemoMode) return;

    try {
      const { error } = await supabase.from('deals').delete().eq('id', dealId);
      if (error) {
        // Revert if API fails
        setDeals(originalDeals);
        console.error("Error deleting deal:", error);
        alert("Failed to delete deal");
      }
    } catch (error) {
      setDeals(originalDeals);
      console.error(error);
    }
  };

  // Helper Functions
  const downloadTemplate = () => {
    const csvContent = "\uFEFFTitle,Value,Contact,Company,Stage\nออกแบบเว็บไซต์,50000,คุณวิชัย,Tech Corp,lead\nติดตั้ง Server,120000,คุณสมศรี,Bank inc.,negotiation\nดูแลระบบรายปี,25000,คุณจอร์น,StartUp,won";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "deal_template.csv");
    document.body.appendChild(link);
    link.click(); document.body.removeChild(link);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setImportStatus('processing');
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n');
        const dataLines = lines.slice(1).filter(line => line.trim() !== '');

        const newDeals = [];

        for (const line of dataLines) {
          // Simple CSV split (Note: does not handle commas inside quotes)
          const cols = line.split(',').map(item => item.trim());
          if (cols.length >= 2) {
            const [title, valueStr, contact, company, stageStr] = cols;
            let stage = 'lead';
            if (stageStr && stages.find(s => s.id === stageStr.toLowerCase())) stage = stageStr.toLowerCase();

            newDeals.push({
              title: title || 'No Title',
              value: Number(valueStr) || 0,
              contact: contact || '',
              company: company || '',
              stage: stage,
              probability: 20,
              lastActivity: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              notes: [],
              tasks: []
            });
          }
        }

        if (newDeals.length > 0) {
          const { data, error } = await supabase.from('deals').insert(newDeals).select();

          if (error) {
            console.error("Supabase Import Error:", error);
            throw error;
          }

          // Update Local State immediately
          if (data) {
            setDeals(prev => {
              // Determine unique new deals that aren't already in state (though usually IDs are new)
              const existingIds = new Set(prev.map(d => d.id));
              const uniqueNew = data.filter(d => !existingIds.has(d.id));
              return [...uniqueNew, ...prev];
            });
          }

          setImportStatus(`success:${newDeals.length}`);
          setTimeout(() => { setImportStatus(null); setIsImportModalOpen(false); }, 2000);
        } else {
          setImportStatus('error');
        }

      } catch (error) {
        console.error("File Parse Error:", error);
        setImportStatus('error');
      }
    };
    reader.readAsText(file); event.target.value = '';
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount);
  const formatDate = (isoString) => isoString ? new Date(isoString).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

  // Filter Logic
  const filteredDeals = deals.filter(deal => {
    // 1. Text Search
    const matchesSearch = deal.title?.toLowerCase().includes(searchTerm.toLowerCase()) || deal.company?.toLowerCase().includes(searchTerm.toLowerCase());
    // 2. Date Filter
    const matchesDate = !filterDate || (deal.createdAt && new Date(deal.createdAt).toLocaleDateString('en-CA') === filterDate);

    return matchesSearch && matchesDate;
  });

  const getStageTotal = (stageId) => filteredDeals.filter(d => d.stage === stageId).reduce((sum, d) => sum + d.value, 0);

  // Render Views
  // Render Views
  if (!isDbReady) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-accent" size={48} /></div>;
  }

  return (
    <div className="flex h-screen bg-bg font-sans text-text-main overflow-hidden selection:bg-accent/30">
      {/* Mobile/Tablet Sidebar Overlay (Backdrop) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 xl:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-clay-lg flex items-center gap-3 animate-fade-in-down transition-all duration-300 ${toast.type === 'success' ? 'bg-warm-green text-white' : 'bg-warm-yellow text-text-main'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <span className="font-bold">{toast.message}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed xl:static inset-y-0 left-0 z-40 
        w-[280px] min-w-[280px]
        bg-surface text-text-muted 
        flex flex-col m-0 xl:m-4 xl:rounded-3xl xl:shadow-clay-lg border border-white/50
        transition-transform duration-300 ease-in-out font-sans
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        xl:translate-x-0 
      `}>
        {/* Header / Logo */}
        <div className="h-24 flex items-center justify-between px-8">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white shadow-clay-btn transform rotate-3 flex-shrink-0">
              <span className="font-extrabold text-2xl">S</span>
            </div>
            <div className="flex flex-col">
              <span className="text-text-main font-black text-xl tracking-tight whitespace-nowrap leading-tight">Sales CRM</span>
              <span className="text-accent text-xs font-bold tracking-widest uppercase">Professional</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="xl:hidden text-text-muted hover:text-accent transition-colors p-1">
            <X size={24} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Menu</p>
          {['pipeline', 'overview', 'dashboard', 'contacts'].map(tab => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setIsSidebarOpen(false); }}
                className={`
                  w-full flex items-center px-6 py-4 rounded-2xl transition-all duration-300 group mb-2
                  ${isActive
                    ? 'bg-surface shadow-clay-inner text-accent font-bold translate-x-2'
                    : 'text-text-muted hover:bg-surface hover:shadow-clay-sm hover:text-text-main hover:translate-x-1'}
                `}
              >
                {tab === 'pipeline' && <KanbanSquare size={24} className={`mr-4 ${isActive ? 'text-accent' : 'text-text-muted group-hover:text-primary'}`} />}
                {tab === 'overview' && <PieChart size={24} className={`mr-4 ${isActive ? 'text-accent' : 'text-text-muted group-hover:text-primary'}`} />}
                {tab === 'dashboard' && <LayoutDashboard size={24} className={`mr-4 ${isActive ? 'text-accent' : 'text-text-muted group-hover:text-primary'}`} />}
                {tab === 'contacts' && <Users size={24} className={`mr-4 ${isActive ? 'text-accent' : 'text-text-muted group-hover:text-primary'}`} />}
                <span className="text-base capitalize">
                  {tab === 'spec-setup' ? 'Spec AI' : tab}
                </span>
              </button>
            );
          })}

          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6">Features</p>
          {['spec-setup', 'tools'].map(tab => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setIsSidebarOpen(false); }}
                className={`
                  w-full flex items-center px-6 py-4 rounded-2xl transition-all duration-300 group mb-2
                  ${isActive
                    ? 'bg-surface shadow-clay-inner text-accent font-bold translate-x-2'
                    : 'text-text-muted hover:bg-surface hover:shadow-clay-sm hover:text-text-main hover:translate-x-1'}
                `}
              >
                {tab === 'spec-setup' && <Cpu size={24} className={`mr-4 ${isActive ? 'text-accent' : 'text-text-muted group-hover:text-primary'}`} />}
                {tab === 'tools' && <Wrench size={24} className={`mr-4 ${isActive ? 'text-accent' : 'text-text-muted group-hover:text-primary'}`} />}
                <span className="text-base">
                  {tab === 'spec-setup' ? 'Spec AI' : 'IT Tools'}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-6 mt-auto">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="w-full flex items-center justify-center px-4 py-4 bg-surface text-text-muted rounded-2xl text-sm font-bold transition-all duration-300 shadow-clay-sm hover:shadow-clay-md hover:text-accent mb-6 group border border-white/50"
          >
            <FileSpreadsheet size={20} className="mr-3 text-warm-green group-hover:scale-110 transition-transform" />
            Import Data
          </button>

          <div className="flex items-center gap-2 px-2 py-3 mt-2 bg-gradient-to-r from-accent/10 to-transparent rounded-2xl border border-accent/20 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-accent/10 blur-xl rounded-full -mr-8 -mt-8 pointer-events-none"></div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-[#C08C60] flex items-center justify-center text-white shadow-clay-sm transform group-hover:scale-110 transition-transform duration-300 shrink-0">
              <span className="font-black text-[10px]">DEV</span>
            </div>
            <div className="flex-1 min-w-0 relative z-10">
              <p className="text-[10px] font-black text-accent uppercase tracking-wide mb-0.5">Creator & Developer</p>
              <p className="text-[13px] font-black text-text-main whitespace-nowrap tracking-tight group-hover:text-accent transition-colors">SORAWIT THUNTHAKIJ</p>
            </div>
          </div>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen w-full relative overflow-hidden bg-bg">
        <header className="h-24 bg-bg/50 backdrop-blur-sm flex justify-between items-center px-4 md:px-6 xl:px-8 flex-shrink-0 z-20 sticky top-0">
          <div className="flex items-center gap-3">
            {/* Show Menu button on Mobile AND Tablet (xl:hidden) */}
            <button onClick={() => setIsSidebarOpen(true)} className="xl:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <Menu size={24} />
            </button>
            <h1 className="text-lg md:text-xl font-bold text-gray-800 truncate">
              {activeTab === 'pipeline' ? 'Sales Pipeline' :
                activeTab === 'overview' ? 'Sales Overview' :
                  activeTab === 'dashboard' ? 'Dashboard Analysis' :
                    activeTab === 'contacts' ? 'Contacts List' :
                      activeTab === 'spec-setup' ? 'Smart Spec Recommendation' : 'Professional IT Tools'}
            </h1>
            {loading && <Loader2 size={16} className="animate-spin text-accent hidden md:block" />}
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative hidden md:block group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted group-hover:text-accent transition-colors" size={20} />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 pr-6 py-3 bg-surface border-none shadow-clay-inner rounded-xl focus:outline-none focus:ring-0 text-sm w-48 lg:w-64 transition-all placeholder-text-muted/50 text-text-main" />
            </div>
            {/* Date Filter Input */}
            <div className="flex items-center space-x-2 bg-surface shadow-clay-inner rounded-xl px-2">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 bg-transparent border-none focus:ring-0 text-sm text-text-main focus:outline-none"
              />
              {filterDate && (
                <button onClick={() => setFilterDate('')} className="text-xs text-warm-red hover:text-red-700 underline whitespace-nowrap p-2">
                  Clear
                </button>
              )}
            </div>
            <Button onClick={() => setIsModalOpen(true)} icon={Plus} variant="primary" className="whitespace-nowrap"><span className="hidden md:inline">New Deal</span><span className="md:hidden">Add</span></Button>
          </div>
        </header>

        <div className={`flex-1 bg-bg p-4 md:p-6 xl:p-8 ${activeTab === 'pipeline' ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto overflow-x-hidden'}`}>
          {activeTab === 'pipeline' && (
            <div className="flex overflow-x-auto pb-4 h-full gap-4 items-start snap-x snap-mandatory">
              {stages.map(stage => (
                <div key={stage.id} className={`min-w-[85vw] md:min-w-[320px] lg:min-w-[320px] xl:min-w-[340px] w-[85vw] md:w-[320px] lg:w-[320px] xl:w-[340px] flex-shrink-0 flex flex-col max-h-full snap-center px-2 ${stage.id === 'lost' ? 'opacity-70 hover:opacity-100' : ''}`} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, stage.id)}>
                  <div className={`p-4 mb-4 rounded-2xl bg-surface/40 backdrop-blur-sm border border-white/40 sticky top-0 z-10`}>
                    <div className="flex justify-between items-center mb-1">
                      <h3 className={`font-black text-lg text-text-main`}>{stage.title}</h3>
                      <span className="bg-white shadow-clay-inner text-text-muted text-xs font-bold px-2 py-1 rounded-lg">{deals.filter(d => d.stage === stage.id).length}</span>
                    </div>
                    <div className="text-sm text-text-muted font-bold">Total: {formatCurrency(getStageTotal(stage.id))}</div>
                  </div>
                  <div className="p-2 overflow-y-auto flex-1 space-y-4 custom-scrollbar touch-pan-y pb-20">
                    {filteredDeals.filter(deal => deal.stage === stage.id).map(deal => {
                      // --- Stale Deal Alert Logic ---
                      let lastActive = new Date(deal.lastActivity); // Try lastActivity
                      if (isNaN(lastActive.getTime())) lastActive = new Date(deal.createdAt); // Fallback if invalid (e.g. old string format)
                      const diffHours = (new Date() - lastActive) / (1000 * 60 * 60);
                      const diffDays = Math.ceil(diffHours / 24);

                      let staleStyle = "bg-surface border-white/60";
                      let staleBadge = null;

                      if (stage.id === 'lead' && diffHours > 24) {
                        staleStyle = "bg-orange-50 border-orange-300";
                        staleBadge = (<div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-orange-100/90 backdrop-blur-sm text-orange-700 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-orange-200 shadow-sm animate-pulse"><Zap size={10} fill="currentColor" /> ด่วน {Math.floor(diffHours)} ชม.</div>);
                      } else if (stage.id === 'proposal' && diffDays > 3) {
                        staleStyle = "bg-red-50 border-red-300";
                        staleBadge = (<div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-red-100/90 backdrop-blur-sm text-red-700 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-red-200 shadow-sm"><Flame size={10} fill="currentColor" /> ร้อน {diffDays} วัน</div>);
                      } else if (stage.id === 'negotiation' && diffDays > 7) {
                        staleStyle = "bg-yellow-50 border-yellow-300";
                        staleBadge = (<div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-yellow-100/90 backdrop-blur-sm text-yellow-700 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-yellow-200 shadow-sm"><AlertTriangle size={10} fill="currentColor" /> เงียบ {diffDays} วัน</div>);
                      }

                      return (
                        <div
                          key={deal.id}
                          draggable="true"
                          onDragStart={(e) => handleDragStart(e, deal.id)}
                          onClick={() => handleDealClick(deal)}
                          onContextMenu={(e) => e.preventDefault()} // Block native popup
                          style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'manipulation' }}
                          className={`${staleStyle} p-5 rounded-3xl shadow-clay-sm border hover:shadow-clay-md cursor-pointer hover:-translate-y-1 transition-all active:scale-95 group relative overflow-hidden`}
                        >
                          {staleBadge}
                          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/80 to-transparent rounded-bl-full pointer-events-none opacity-50"></div>
                          <div className="flex justify-between items-start mb-3 relative z-10">
                            <div className="flex flex-col gap-1 max-w-[60%]">
                              <span className="text-xs font-bold text-accent bg-accent/10 px-3 py-1 rounded-lg truncate">{deal.company}</span>
                              {deal.ai_score !== undefined && deal.ai_score !== null && (
                                <div className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 w-fit
                                 ${deal.ai_score >= 70 ? 'bg-green-100 text-green-700 border-green-200' : deal.ai_score >= 40 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-red-100 text-red-700 border-red-200'}
                               `}>
                                  <TrendingUp size={10} /> {deal.ai_score}% Win Prob.
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {deal.tasks?.filter(t => !t.completed).length > 0 && (<div className="flex items-center text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded"><AlertCircle size={10} className="mr-1" />{deal.tasks.filter(t => !t.completed).length}</div>)}
                              <button
                                onClick={(e) => handleAnalyzeDeal(deal, e)}
                                className={`text-text-muted hover:text-warm-purple hover:bg-warm-purple/10 p-1.5 rounded-lg transition-colors group/ai ${analyzingDealIds.has(deal.id) ? 'animate-spin text-warm-purple' : ''}`}
                                title="AI Predict Score"
                              >
                                <Wand2 size={14} />
                              </button>
                              <button
                                onClick={(e) => handleDeleteDeal(deal.id, e)}
                                className="text-text-muted hover:text-warm-red hover:bg-warm-red/10 p-1.5 rounded-lg transition-colors group/delete"
                                title="Delete Deal"
                              >
                                <Trash2 size={14} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setMovingDeal(deal); }}
                                className="text-text-muted hover:text-accent hover:bg-accent/10 p-1.5 rounded-lg transition-colors group/move lg:hidden"
                                title="Move Deal"
                              >
                                <ArrowRightCircle size={14} />
                              </button>
                            </div>
                          </div>
                          <h4 className="font-bold text-lg text-text-main mb-1 leading-tight relative z-10">{deal.title}</h4>
                          {deal.ai_insight && <p className="text-[10px] text-text-muted mb-2 relative z-10 italic">" {deal.ai_insight} "</p>}
                          <div className="flex items-center text-sm text-text-muted mb-4 relative z-10"><Users size={16} className="mr-2" />{deal.contact}</div>
                          <div className="border-t border-black/5 pt-3 flex justify-between items-center relative z-10">
                            <span className="font-extrabold text-text-main text-lg">{formatCurrency(deal.value)}</span>
                            {stage.id === 'lost' ? <span className="text-xs text-warm-red bg-warm-red/10 px-2 py-1 rounded-lg font-bold">{deal.lostReason || 'N/A'}</span> : stage.id !== 'won' && <div className="flex items-center text-xs text-warm-yellow font-bold bg-warm-yellow/10 px-2 py-1 rounded-lg"><Trophy size={14} className="mr-1" />{deal.probability}%</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-5xl mx-auto pb-8">
              <h2 className="text-2xl font-bold text-gray-800 px-1">ภาพรวมการขาย (Overview)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <Card className="p-6 border-l-8 border-l-warm-blue">
                  <div className="flex justify-between items-start">
                    <div><p className="text-text-muted text-sm font-bold uppercase tracking-wide">Total Value</p><h3 className="text-3xl font-black text-text-main mt-2">{formatCurrency(deals.reduce((acc, d) => acc + d.value, 0))}</h3></div>
                    <div className="p-3 bg-warm-blue/20 rounded-2xl text-warm-blue"><DollarSign size={28} /></div>
                  </div>
                </Card>
                <Card className="p-6 border-l-8 border-l-warm-green">
                  <div className="flex justify-between items-start">
                    <div><p className="text-text-muted text-sm font-bold uppercase tracking-wide">Deals Won</p><h3 className="text-3xl font-black text-warm-green mt-2">{formatCurrency(deals.filter(d => d.stage === 'won').reduce((acc, d) => acc + d.value, 0))}</h3></div>
                    <div className="p-3 bg-warm-green/20 rounded-2xl text-warm-green"><Trophy size={28} /></div>
                  </div>
                </Card>
                <Card className="p-6 border-l-8 border-l-warm-purple">
                  <div className="flex justify-between items-start">
                    <div><p className="text-text-muted text-sm font-bold uppercase tracking-wide">Win Rate</p><h3 className="text-3xl font-black text-warm-purple mt-2">{deals.length ? Math.round((deals.filter(d => d.stage === 'won').length / deals.length) * 100) : 0}%</h3></div>
                    <div className="p-3 bg-warm-purple/20 rounded-2xl text-warm-purple"><LayoutDashboard size={28} /></div>
                  </div>
                </Card>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center"><Trophy size={18} className="mr-2 text-yellow-500" /> Top Active Deals</h3>
                  <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-gray-500 border-b"><tr><th className="pb-2">ชื่อดีล</th><th className="pb-2 text-right">มูลค่า</th></tr></thead><tbody className="divide-y">{deals.filter(d => d.stage !== 'lost' && d.stage !== 'won').sort((a, b) => b.value - a.value).slice(0, 5).map(deal => (<tr key={deal.id}><td className="py-2">{deal.title}</td><td className="py-2 text-right font-medium">{formatCurrency(deal.value)}</td></tr>))}</tbody></table></div>
                </Card>
                <Card className="p-6 bg-red-50/30 border-red-100">
                  <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center"><XCircle size={18} className="mr-2 text-red-500" /> วิเคราะห์สาเหตุที่หลุด</h3>
                  {deals.filter(d => d.stage === 'lost').length > 0 ? (<div className="space-y-3">{Object.entries(deals.filter(d => d.stage === 'lost').reduce((acc, d) => { const r = d.lostReason || 'ไม่ระบุ'; acc[r] = (acc[r] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (<div key={reason} className="flex items-center"><div className="w-full"><div className="flex justify-between text-sm mb-1"><span className="text-gray-700 font-medium">{reason}</span><span className="text-gray-500">{count} เคส</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-red-500 h-2 rounded-full" style={{ width: `${(count / deals.filter(d => d.stage === 'lost').length) * 100}%` }}></div></div></div></div>))}</div>) : (<div className="text-center py-8 text-gray-400 text-sm">ยังไม่มีเคสหลุด ยอดเยี่ยมมาก!</div>)}
                </Card>
              </div>
            </div>
          )}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 max-w-6xl mx-auto pb-8">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black text-text-main mb-2">Dashboard</h2>
                  <p className="text-text-muted font-medium">ภาพรวมยอดขายและประสิทธิภาพทีม</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => {
                    if (!deals.length) return alert("No data to analyze");
                    const prompt = `Analyze this sales data and give 3 key strategic insights (in Thai language):
                      Total Deals: ${deals.length}
                      Won: ${deals.filter(d => d.stage === 'won').length}
                      Lost: ${deals.filter(d => d.stage === 'lost').length}
                      Total Value: ${deals.reduce((acc, d) => acc + d.value, 0)}
                      Pipeline Status: ${JSON.stringify(deals.reduce((acc, d) => { acc[d.stage] = (acc[d.stage] || 0) + 1; return acc; }, {}))}
                      `;
                    callGeminiAPI(prompt).then(res => {
                      if (res) alert("AI Analyst Insight:\n\n" + (typeof res === 'string' ? res : JSON.stringify(res)));
                      else alert("AI Analysis complete (check console for details if raw)");
                    });
                  }}>
                    <Sparkles size={18} className="mr-2 text-accent" /> AI Analyst (Beta)
                  </Button>
                </div>
              </div>

              {/* 1. Key Metrics & Goal */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6 border-l-4 border-l-accent relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-accent/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">Total Pipeline Value</p>
                  <h3 className="text-2xl font-black text-text-main">{formatCurrency(deals.reduce((acc, d) => acc + d.value, 0))}</h3>
                </Card>
                <Card className="p-6 border-l-4 border-l-warm-green relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-warm-green/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">Revenue (Won)</p>
                  <h3 className="text-2xl font-black text-warm-green">{formatCurrency(deals.filter(d => d.stage === 'won').reduce((acc, d) => acc + d.value, 0))}</h3>
                </Card>
                <Card className="p-6 border-l-4 border-l-warm-purple relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-warm-purple/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">Win Rate</p>
                  <h3 className="text-2xl font-black text-warm-purple">{deals.length ? Math.round((deals.filter(d => d.stage === 'won').length / deals.length) * 100) : 0}%</h3>
                </Card>
                <Card className="p-6 border-l-4 border-l-warm-yellow relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-warm-yellow/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">Active Deals</p>
                  <h3 className="text-2xl font-black text-warm-yellow">{deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').length}</h3>
                </Card>
              </div>

              {/* 2. Monthly Goal & Pipeline Health */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Monthly Goal */}
                <Card className="p-8 lg:col-span-1 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none"></div>
                  <div className="flex justify-between items-end mb-4 relative z-10 w-full">
                    <div className="w-full">
                      <h3 className="font-black text-lg text-text-main flex items-center gap-2"><Target size={20} className="text-red-500" /> Monthly Goal</h3>

                      <div className="flex items-center mt-1">
                        <span className="text-xs text-text-muted font-bold mr-2">Target:</span>
                        {isEditingGoal ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={monthlyGoal}
                              onChange={(e) => setMonthlyGoal(Number(e.target.value))}
                              className="w-24 px-2 py-0.5 text-xs font-bold border border-accent rounded focus:outline-none focus:ring-1 focus:ring-accent bg-white"
                              autoFocus
                            />
                            <button onClick={handleSaveGoal} className="text-warm-green hover:bg-warm-green/10 p-0.5 rounded"><CheckCircle2 size={14} /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 group/edit cursor-pointer" onClick={() => setIsEditingGoal(true)}>
                            <span className="text-xs text-text-muted font-bold hover:text-accent transition-colors">฿{monthlyGoal.toLocaleString()}</span>
                            <Wrench size={10} className="text-text-muted opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-3xl font-black text-accent">{Math.min(100, Math.round((deals.filter(d => d.stage === 'won').reduce((acc, d) => acc + d.value, 0) / monthlyGoal) * 100))}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden relative z-10">
                    <div className="bg-gradient-to-r from-accent to-warm-red h-4 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, (deals.filter(d => d.stage === 'won').reduce((acc, d) => acc + d.value, 0) / monthlyGoal) * 100)}%` }}></div>
                  </div>
                  <p className="text-center text-xs text-text-muted mt-4 font-bold">Keep pushing! You're doing great.</p>
                </Card>

                {/* Pipeline Health (Bar Chart) */}
                <Card className="p-6 md:col-span-1 lg:col-span-2">
                  <h3 className="font-bold text-lg mb-6 text-text-main flex items-center gap-2"><BarChart3 size={20} className="text-warm-blue" /> Pipeline Health</h3>
                  <div className="grid grid-cols-5 gap-4 h-32 items-end">
                    {['lead', 'contact', 'quotation', 'negotiation', 'won'].map(stage => {
                      const count = deals.filter(d => d.stage === stage).length;
                      const max = Math.max(...['lead', 'contact', 'quotation', 'negotiation', 'won'].map(s => deals.filter(d => d.stage === s).length), 1);
                      const height = Math.max(10, (count / max) * 100);
                      const colors = { 'lead': 'bg-gray-400', 'contact': 'bg-blue-400', 'quotation': 'bg-indigo-400', 'negotiation': 'bg-purple-400', 'won': 'bg-green-400' };
                      return (
                        <div key={stage} className="flex flex-col items-center group cursor-help">
                          <div className="text-xs font-bold text-text-main mb-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">{count} Deals</div>
                          <div className={`w-full ${colors[stage]} rounded-t-lg transition-all duration-500 hover:brightness-110`} style={{ height: `${height}%` }}></div>
                          <div className="mt-2 text-[10px] font-bold uppercase text-text-muted tracking-wider">{stage.substring(0, 4)}</div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              </div>

              {/* 3. Top Deals & Loss Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-4 text-text-main flex items-center"><Trophy size={18} className="mr-2 text-yellow-500" /> Top Opportunities</h3>
                  <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-text-muted border-b border-gray-100"><tr><th className="pb-3 pl-2">Deal Name</th><th className="pb-3 text-right pr-2">Value</th></tr></thead><tbody className="divide-y divide-gray-50">{deals.filter(d => d.stage !== 'lost' && d.stage !== 'won').sort((a, b) => b.value - a.value).slice(0, 5).map(deal => (<tr key={deal.id} className="group hover:bg-gray-50 transition-colors"><td className="py-3 pl-2 font-medium text-text-main">{deal.title}<div className="text-[10px] text-text-muted">{deal.company}</div></td><td className="py-3 text-right pr-2 font-bold text-accent">{formatCurrency(deal.value)}</td></tr>))}</tbody></table></div>
                </Card>
                <Card className="p-6 bg-red-50/30 border-red-100">
                  <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center"><XCircle size={18} className="mr-2 text-red-500" /> Loss Analysis</h3>
                  {deals.filter(d => d.stage === 'lost').length > 0 ? (<div className="space-y-3">{Object.entries(deals.filter(d => d.stage === 'lost').reduce((acc, d) => { const r = d.lostReason || 'Unspecified'; acc[r] = (acc[r] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (<div key={reason} className="flex items-center"><div className="w-full"><div className="flex justify-between text-sm mb-1"><span className="text-gray-700 font-bold text-xs uppercase">{reason}</span><span className="text-gray-500 text-xs font-bold">{count}</span></div><div className="w-full bg-red-100 rounded-full h-1.5"><div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${(count / deals.filter(d => d.stage === 'lost').length) * 100}%` }}></div></div></div></div>))}</div>) : (<div className="text-center py-8 text-text-muted text-sm italic">No lost deals yet. Keep it up!</div>)}
                </Card>
              </div>
            </div>
          )}
          {activeTab === 'contacts' && (
            <div className="bg-surface rounded-3xl shadow-clay-md border border-white/60 overflow-hidden">
              <div className="overflow-x-auto"><table className="w-full text-left min-w-[700px]"><thead className="bg-bg/50 text-text-muted font-bold text-sm"><tr><th className="px-6 py-4">Contact Name</th><th className="px-6 py-4">Company</th><th className="px-6 py-4">Related Deal</th><th className="px-6 py-4">Last Contact</th></tr></thead><tbody className="divide-y divide-black/5">{deals.map(deal => (<tr key={deal.id} className="hover:bg-bg/30 cursor-pointer transition-colors" onClick={() => setSelectedDeal(deal)}><td className="px-6 py-4"><div className="flex items-center"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-blue to-primary text-white shadow-clay-sm flex items-center justify-center font-bold mr-3 text-sm shrink-0">{deal.contact?.charAt(0) || '?'}</div><span className="font-bold text-text-main">{deal.contact}</span></div></td><td className="px-6 py-4 text-text-muted font-medium">{deal.company}</td><td className="px-6 py-4 text-accent font-bold">{deal.title}</td><td className="px-6 py-4 text-text-muted text-sm">{deal.lastActivity && !deal.lastActivity.includes('-') ? deal.lastActivity : formatDate(deal.lastActivity)}</td></tr>))}</tbody></table></div>
            </div>
          )}

          {activeTab === 'spec-setup' && (
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Inputs */}
                <div className="lg:col-span-1 space-y-6">
                  <Card className="p-8 border-l-8 border-l-accent">
                    <div className="flex items-center mb-6 text-accent">
                      <Cpu size={32} className="mr-3" />
                      <h2 className="text-2xl font-black text-text-main">Spec AI</h2>
                    </div>
                    <p className="text-text-muted mb-6">Describe your needs below, and our AI will recommend the best server hardware for you.</p>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">Budget (THB)</label>
                        <div className="relative">
                          <DollarSign size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                          <input
                            type="number"
                            value={specBudget}
                            onChange={(e) => setSpecBudget(Number(e.target.value))}
                            className="w-full pl-12 pr-5 py-4 bg-bg/50 border-none shadow-clay-inner rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main font-bold text-lg"
                          />
                          {recommendedSpecs.length > 0 && (
                            <button
                              onClick={() => { setRecommendedSpecs([]); setSpecBudget(50000); }}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-warm-red font-bold underline"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <input
                          type="range"
                          min="10000"
                          max="500000"
                          step="5000"
                          value={specBudget}
                          onChange={(e) => setSpecBudget(Number(e.target.value))}
                          className="w-full mt-4 accent-accent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">Usage Type</label>
                        <select
                          value={specUseCase}
                          onChange={(e) => setSpecUseCase(e.target.value)}
                          className="w-full px-5 py-4 bg-bg/50 border-none shadow-clay-inner rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main font-bold appearance-none"
                        >
                          <option value="general">General Office / File Server</option>
                          <option value="express">Express Accounting Server (Popular)</option>
                          <option value="ad">Active Directory (AD) Server</option>
                          <option value="db">Database Server (SQL/Oracle)</option>
                          <option value="vm">Virtualization Host (VMware/Proxmox)</option>
                        </select>
                      </div>

                      <Button fullWidth size="lg" onClick={handleGenerateSpec}>
                        {isGeneratingSpec ? <><Loader2 className="animate-spin mr-2" /> Analyzing...</> : <><Cpu className="mr-2" /> Generate Spec</>}
                      </Button>
                    </div>
                  </Card>
                </div>

                {/* Results */}
                <div className="lg:col-span-2 space-y-6">
                  {recommendedSpecs.length > 0 ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <h3 className="text-xl font-bold text-text-muted mb-4 uppercase tracking-wider">AI Recommendations</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recommendedSpecs.map((spec, idx) => (
                          spec.price > 0 ? (
                            <div key={idx} className="bg-surface p-6 rounded-3xl shadow-clay-md border border-white/60 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Server size={100} className="text-accent" />
                              </div>
                              <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                  <span className="bg-accent text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">Rank #{idx + 1}</span>
                                  <span className="bg-warm-green/20 text-warm-green-dark px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">Recommended</span>
                                </div>
                                <h4 className="text-lg font-black text-text-main mb-2">{spec.name}</h4>
                                <div className="space-y-2 text-sm text-text-muted font-medium">
                                  <div className="flex items-center"><Cpu size={16} className="mr-2 text-accent" /> {spec.cpu}</div>
                                  <div className="flex items-center"><Database size={16} className="mr-2 text-accent" /> {spec.ram}</div>
                                  <div className="flex items-center"><HardDrive size={16} className="mr-2 text-accent" /> {spec.storage}</div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-black/5 flex gap-2">
                                  <Button size="sm" variant="secondary" fullWidth>View Details</Button>
                                  <Button size="sm" variant="primary" fullWidth>Add to Quote</Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="col-span-full text-center p-12 bg-bg/50 rounded-3xl border border-dashed border-text-muted">
                              <AlertCircle className="mx-auto text-text-muted mb-2" size={32} />
                              <p className="text-text-muted font-bold">{spec.name}</p>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50 space-y-4 min-h-[400px]">
                      <Cpu size={64} />
                      <p className="text-xl font-bold text-center pl-8 pr-8">Select your usage use case and budget on the left to get started.</p>
                    </div>
                  )}
                  {recommendedSpecs.length > 0 && (
                    <div className="flex justify-center mt-4">
                      <Button variant="secondary" onClick={() => setRecommendedSpecs([])} icon={RotateCcw}>Start Over (Clear Results)</Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                  <nav className="space-y-4">
                    <button
                      onClick={() => setActiveTool('raid')}
                      className={`w-full p-4 rounded-2xl font-bold text-left flex items-center border transition-all ${activeTool === 'raid' ? 'bg-surface shadow-clay-inner text-accent border-accent/20' : 'text-text-muted hover:bg-surface/50 border-transparent'}`}
                    >
                      <HardDrive size={22} className="mr-3" /> RAID Calculator
                    </button>
                    <button
                      onClick={() => setActiveTool('cpu')}
                      className={`w-full p-4 rounded-2xl font-bold text-left flex items-center border transition-all ${activeTool === 'cpu' ? 'bg-surface shadow-clay-inner text-accent border-accent/20' : 'text-text-muted hover:bg-surface/50 border-transparent'}`}
                    >
                      <Cpu size={22} className="mr-3" /> CPU Compare (2026)
                    </button>
                    <button
                      onClick={() => setActiveTool('bandwidth')}
                      className={`w-full p-4 rounded-2xl font-bold text-left flex items-center border transition-all ${activeTool === 'bandwidth' ? 'bg-surface shadow-clay-inner text-accent border-accent/20' : 'text-text-muted hover:bg-surface/50 border-transparent'}`}
                    >
                      <Signal size={22} className="mr-3" /> Bandwidth Calculator
                    </button>
                    <button
                      onClick={() => setActiveTool('ups')}
                      className={`w-full p-4 rounded-2xl font-bold text-left flex items-center border transition-all ${activeTool === 'ups' ? 'bg-surface shadow-clay-inner text-accent border-accent/20' : 'text-text-muted hover:bg-surface/50 border-transparent'}`}
                    >
                      <Zap size={22} className="mr-3" /> UPS Runtime Calculator
                    </button>
                  </nav>
                </div>
                <div className="md:col-span-2">
                  {activeTool === 'raid' && (
                    <Card className="p-8 border-t-8 border-t-accent animate-in fade-in slide-in-from-right duration-300">
                      <h2 className="text-2xl font-black text-text-main mb-6 flex items-center"><HardDrive className="mr-3 text-accent" /> RAID Calculator</h2>
                      <div className="grid grid-cols-2 gap-6 mb-8">
                        <div>
                          <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">Disk Size</label>
                          <div className="flex gap-2">
                            <input
                              type="number" min="1"
                              value={raidConfig.size}
                              onChange={(e) => setRaidConfig({ ...raidConfig, size: Number(e.target.value) })}
                              className="w-full px-4 py-3 bg-bg/50 border-none shadow-clay-inner rounded-xl focus:outline-none text-text-main font-bold"
                            />
                            <select
                              value={raidConfig.unit}
                              onChange={(e) => setRaidConfig({ ...raidConfig, unit: e.target.value })}
                              className="w-24 px-2 py-3 bg-bg/50 border-none shadow-clay-inner rounded-xl focus:outline-none text-text-main font-bold"
                            >
                              <option value="TB">TB</option>
                              <option value="GB">GB</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">Quantity</label>
                          <input
                            type="number" min="1" max="24"
                            value={raidConfig.count}
                            onChange={(e) => setRaidConfig({ ...raidConfig, count: Number(e.target.value) })}
                            className="w-full px-4 py-3 bg-bg/50 border-none shadow-clay-inner rounded-xl focus:outline-none text-text-main font-bold"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">RAID Level</label>
                          <div className="flex gap-2 bg-bg/50 p-2 rounded-xl shadow-clay-inner overflow-x-auto">
                            {['0', '1', '5', '6', '10'].map(level => (
                              <button
                                key={level}
                                onClick={() => setRaidConfig({ ...raidConfig, level })}
                                className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all ${raidConfig.level === level ? 'bg-accent text-white shadow-clay-btn' : 'text-text-muted hover:bg-white/50'}`}
                              >
                                RAID {level}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <Button fullWidth size="lg" onClick={() => {
                          let usable = 0;
                          let faultTolerance = '';
                          const n = raidConfig.count;
                          const s = raidConfig.size;

                          if (raidConfig.level === '0') {
                            usable = n * s;
                            faultTolerance = '0 drive failure (High Risk)';
                          } else if (raidConfig.level === '1') {
                            usable = s * 1; // Assuming pairs
                            faultTolerance = '1 drive failure';
                          } else if (raidConfig.level === '5') {
                            usable = (n - 1) * s;
                            faultTolerance = '1 drive failure';
                          } else if (raidConfig.level === '6') {
                            usable = (n - 2) * s;
                            faultTolerance = '2 drive failures';
                          } else if (raidConfig.level === '10') {
                            usable = (n / 2) * s;
                            faultTolerance = 'Up to half (if not same mirror)';
                          }

                          setRaidResult({ usable, fault: faultTolerance });
                        }}>
                          Calculate
                        </Button>
                        <Button variant="secondary" className="px-6" onClick={() => { setRaidResult(null); setRaidConfig({ size: 4, unit: 'TB', count: 4, level: '5' }); }}>
                          <RotateCcw size={20} />
                        </Button>
                      </div>

                      {raidResult && (
                        <div className="mt-8 p-6 bg-warm-blue/10 rounded-2xl border border-warm-blue/30 animate-in zoom-in-95">
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                              <p className="text-text-muted text-xs font-bold uppercase tracking-wide">Total Capacity</p>
                              <p className="text-3xl font-black text-warm-blue text-shadow-sm">{raidResult.usable} {raidConfig.unit}</p>
                            </div>
                            <div>
                              <p className="text-text-muted text-xs font-bold uppercase tracking-wide">Fault Tolerance</p>
                              <p className="text-lg font-bold text-text-main mt-1">{raidResult.fault}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  )}

                  {activeTool === 'cpu' && (
                    <Card className="p-8 border-t-8 border-t-warm-blue animate-in fade-in slide-in-from-right duration-300">
                      <h2 className="text-2xl font-black text-text-main mb-6 flex items-center"><Cpu className="mr-3 text-warm-blue" /> CPU Comparison (2026)</h2>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div>
                          <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">CPU 1 Model Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Intel Core Ultra 9 285K"
                            value={cpuInputs.cpuA}
                            onChange={(e) => setCpuInputs({ ...cpuInputs, cpuA: e.target.value })}
                            className="w-full px-5 py-4 bg-bg/50 border-none shadow-clay-inner rounded-2xl focus:outline-none focus:ring-2 focus:ring-warm-blue/50 text-text-main font-bold placeholder-text-muted/50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">CPU 2 Model Name</label>
                          <input
                            type="text"
                            placeholder="e.g. AMD Ryzen 9 9950X"
                            value={cpuInputs.cpuB}
                            onChange={(e) => setCpuInputs({ ...cpuInputs, cpuB: e.target.value })}
                            className="w-full px-5 py-4 bg-bg/50 border-none shadow-clay-inner rounded-2xl focus:outline-none focus:ring-2 focus:ring-warm-blue/50 text-text-main font-bold placeholder-text-muted/50"
                          />
                        </div>
                        <div className="col-span-2 mt-2 flex gap-2">
                          <Button fullWidth onClick={handleCpuCompare} disabled={!cpuInputs.cpuA || !cpuInputs.cpuB}>
                            {isComparingCpu ? <><Loader2 className="animate-spin mr-2" /> Searching & Comparing...</> : 'Compare Specs'}
                          </Button>
                          {cpuResults && (
                            <Button variant="secondary" onClick={() => { setCpuResults(null); setCpuInputs({ cpuA: '', cpuB: '' }); }}>
                              <RotateCcw size={20} />
                            </Button>
                          )}
                        </div>
                      </div>

                      {cpuResults ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                          <div className="grid grid-cols-3 gap-4 text-sm bg-bg/30 p-4 rounded-2xl border border-white/50">
                            <div className="font-bold text-text-muted uppercase self-center">Spec</div>
                            <div className="font-bold text-text-main text-center break-words">{cpuResults.cpuA.make} {cpuResults.cpuA.model}</div>
                            <div className="font-bold text-text-main text-center break-words">{cpuResults.cpuB.make} {cpuResults.cpuB.model}</div>

                            <div className="col-span-3 h-px bg-black/5 my-2"></div>

                            <div className="text-text-muted font-medium self-center">Cores/Threads</div>
                            <div className="text-center font-bold text-text-main">{cpuResults.cpuA.cores}</div>
                            <div className="text-center font-bold text-text-main">{cpuResults.cpuB.cores}</div>

                            <div className="text-text-muted font-medium self-center">Clock Speed</div>
                            <div className="text-center text-text-main text-xs sm:text-sm">{cpuResults.cpuA.clock}</div>
                            <div className="text-center text-text-main text-xs sm:text-sm">{cpuResults.cpuB.clock}</div>

                            <div className="text-text-muted font-medium self-center">TDP</div>
                            <div className="text-center text-text-main">{cpuResults.cpuA.tdp}</div>
                            <div className="text-center text-text-main">{cpuResults.cpuB.tdp}</div>
                          </div>

                          <div className="bg-warm-blue/10 p-6 rounded-2xl border border-warm-blue/30 shadow-clay-sm">
                            <h4 className="font-black text-warm-blue mb-2 flex items-center"><AlertCircle size={18} className="mr-2" /> Key Differences</h4>
                            <div className="space-y-3">
                              <p className="text-text-main text-sm leading-relaxed break-words">
                                <strong className="block mb-1 text-accent">{cpuResults.cpuA.model}:</strong>
                                {cpuResults.cpuA.desc}
                              </p>
                              <div className="h-px bg-warm-blue/20"></div>
                              <p className="text-text-main text-sm leading-relaxed break-words">
                                <strong className="block mb-1 text-accent">{cpuResults.cpuB.model}:</strong>
                                {cpuResults.cpuB.desc}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-text-muted opacity-50">
                          <Cpu size={48} className="mx-auto mb-4" />
                          <p>Enter two CPU models above to auto-generate comparison.</p>
                        </div>
                      )}
                    </Card>
                  )}


                  {activeTool === 'bandwidth' && (
                    <Card className="p-8 border-t-8 border-t-warm-blue-dark animate-in fade-in slide-in-from-right duration-300">
                      <h2 className="text-2xl font-black text-text-main mb-6 flex items-center"><Signal className="mr-3 text-warm-blue-dark" /> Bandwidth Calculator</h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                          <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">Data Size</label>
                          <div className="flex gap-2">
                            <input
                              type="number" min="0" value={bwConfig.size}
                              onChange={(e) => setBwConfig({ ...bwConfig, size: e.target.value })}
                              className="w-full px-4 py-3 bg-bg/50 border-none shadow-clay-inner rounded-xl focus:outline-none text-text-main font-bold"
                            />
                            <select
                              value={bwConfig.sizeUnit}
                              onChange={(e) => setBwConfig({ ...bwConfig, sizeUnit: e.target.value })}
                              className="w-24 px-2 py-3 bg-bg/50 border-none shadow-clay-inner rounded-xl focus:outline-none text-text-main font-bold"
                            >
                              <option value="MB">MB</option>
                              <option value="GB">GB</option>
                              <option value="TB">TB</option>
                              <option value="PB">PB</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">Network Speed</label>
                          <div className="flex gap-2">
                            <input
                              type="number" min="0" value={bwConfig.speed}
                              onChange={(e) => setBwConfig({ ...bwConfig, speed: e.target.value })}
                              className="w-full px-4 py-3 bg-bg/50 border-none shadow-clay-inner rounded-xl focus:outline-none text-text-main font-bold"
                            />
                            <select
                              value={bwConfig.speedUnit}
                              onChange={(e) => setBwConfig({ ...bwConfig, speedUnit: e.target.value })}
                              className="w-[110px] px-2 py-3 bg-bg/50 border-none shadow-clay-inner rounded-xl focus:outline-none text-text-main font-bold"
                            >
                              <option value="Mbps">Mbps</option>
                              <option value="Gbps">Gbps</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 mb-4">
                        <Button fullWidth onClick={() => {
                          let bits = parseFloat(bwConfig.size);
                          if (bwConfig.sizeUnit === 'GB') bits *= 8 * 1000 * 1000 * 1000; // Simplified 1k
                          else if (bwConfig.sizeUnit === 'TB') bits *= 8 * 1000 * 1000 * 1000 * 1000;
                          else if (bwConfig.sizeUnit === 'MB') bits *= 8 * 1000 * 1000;
                          else if (bwConfig.sizeUnit === 'PB') bits *= 8 * 1000 * 1000 * 1000 * 1000 * 1000;

                          let speedBits = parseFloat(bwConfig.speed);
                          if (bwConfig.speedUnit === 'Gbps') speedBits *= 1000 * 1000 * 1000;
                          else speedBits *= 1000 * 1000;

                          const seconds = bits / speedBits;

                          const d = Math.floor(seconds / (3600 * 24));
                          const h = Math.floor(seconds % (3600 * 24) / 3600);
                          const m = Math.floor(seconds % 3600 / 60);
                          const s = Math.floor(seconds % 60);

                          let timeStr = '';
                          if (d > 0) timeStr += `${d} Days, `;
                          if (h > 0) timeStr += `${h} Hours, `;
                          timeStr += `${m} Minutes, ${s} Seconds`;

                          setBwResult(timeStr);
                        }}>Calculate Time</Button>

                        {bwResult && <Button variant="secondary" onClick={() => setBwResult('')}><RotateCcw size={20} /></Button>}
                      </div>

                      {bwResult && (
                        <div className="mt-8 p-6 bg-warm-blue-dark/10 rounded-2xl border border-warm-blue-dark/30 animate-in zoom-in-95 text-center">
                          <p className="text-text-muted text-xs font-bold uppercase tracking-wide">Estimated Transfer Time</p>
                          <p className="text-2xl font-black text-warm-blue-dark mt-2">{bwResult}</p>
                        </div>
                      )}
                    </Card>
                  )}

                  {activeTool === 'ups' && (
                    <Card className="p-8 border-t-8 border-t-warm-yellow-dark animate-in fade-in slide-in-from-right duration-300">
                      <h2 className="text-2xl font-black text-text-main mb-6 flex items-center"><Zap className="mr-3 text-warm-yellow-dark" /> UPS Runtime Calculator</h2>

                      <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="col-span-2">
                          <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">Total Load (Watts)</label>
                          <input
                            type="number" value={upsConfig.load}
                            onChange={(e) => setUpsConfig({ ...upsConfig, load: e.target.value })}
                            className="w-full px-4 py-3 bg-bg/50 border-none shadow-clay-inner rounded-xl focus:outline-none text-text-main font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">Battery Voltage (V)</label>
                          <select
                            value={upsConfig.voltage}
                            onChange={(e) => setUpsConfig({ ...upsConfig, voltage: e.target.value })}
                            className="w-full px-4 py-3 bg-bg/50 border-none shadow-clay-inner rounded-xl focus:outline-none text-text-main font-bold"
                          >
                            <option value="12">12V</option>
                            <option value="6">6V</option>
                            <option value="2">2V</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">Capacity (Ah)</label>
                          <input
                            type="number" value={upsConfig.capacity}
                            onChange={(e) => setUpsConfig({ ...upsConfig, capacity: e.target.value })}
                            className="w-full px-4 py-3 bg-bg/50 border-none shadow-clay-inner rounded-xl focus:outline-none text-text-main font-bold"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">Battery Quantity</label>
                          <input
                            type="number" min="1" value={upsConfig.quantity}
                            onChange={(e) => setUpsConfig({ ...upsConfig, quantity: e.target.value })}
                            className="w-full px-4 py-3 bg-bg/50 border-none shadow-clay-inner rounded-xl focus:outline-none text-text-main font-bold"
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 mb-4">
                        <Button fullWidth onClick={() => {
                          const load = parseFloat(upsConfig.load);
                          const energy = parseFloat(upsConfig.voltage) * parseFloat(upsConfig.capacity) * parseFloat(upsConfig.quantity);
                          const usable = energy * 0.8; // 80% Efficiency approx

                          const hours = usable / load;
                          const minutes = Math.floor(hours * 60);

                          setUpsResult(minutes);
                        }}>Calculate Runtime</Button>

                        {upsResult !== null && <Button variant="secondary" onClick={() => setUpsResult(null)}><RotateCcw size={20} /></Button>}
                      </div>

                      {upsResult !== null && (
                        <div className="mt-8 p-6 bg-warm-yellow-dark/10 rounded-2xl border border-warm-yellow-dark/30 animate-in zoom-in-95 text-center">
                          <p className="text-text-muted text-xs font-bold uppercase tracking-wide">Estimated Backup Time</p>
                          <p className="text-3xl font-black text-warm-yellow-dark mt-2">{upsResult} Minutes</p>
                          <p className="text-xs text-text-muted mt-2">(Approx @ 80% Efficiency)</p>
                        </div>
                      )}
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {
        selectedDeal && (
          <div className="fixed inset-0 bg-bg/80 z-50 flex items-center justify-center sm:p-4 backdrop-blur-md overflow-y-auto">
            <div className="bg-surface w-full max-w-4xl min-h-[80vh] sm:rounded-3xl shadow-clay-lg flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200 border border-white/50">
              <div className="w-full md:w-1/3 bg-bg/50 border-r border-white/50 p-6 flex flex-col">
                {!isEditingDetails ? (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${selectedDeal.stage === 'lost' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{stages.find(s => s.id === selectedDeal.stage)?.title}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setIsEditingDetails(true)} className="text-text-muted hover:text-accent p-1"><Pencil size={18} /></button>
                        <button onClick={() => setSelectedDeal(null)} className="md:hidden text-text-muted hover:text-red-500"><X size={24} /></button>
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1 leading-tight">{selectedDeal.title}</h2>
                    <p className="text-2xl font-mono text-gray-700 mb-6">{formatCurrency(selectedDeal.value)}</p>

                    <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                      <div><label className="text-xs font-bold text-text-muted uppercase tracking-wide">Contact Person</label><div className="flex items-center mt-2"><div className="w-10 h-10 bg-warm-blue/20 rounded-xl flex items-center justify-center text-warm-blue-dark text-sm font-bold mr-4 shadow-clay-sm flex-shrink-0">{selectedDeal.contact?.charAt(0)}</div><div className="min-w-0"><p className="font-bold text-text-main text-lg truncate">{selectedDeal.contact}</p><p className="text-sm text-text-muted font-medium truncate">{selectedDeal.company}</p></div></div></div>
                      <div><label className="text-xs font-bold text-text-muted uppercase tracking-wide">Created At</label><p className="text-sm font-bold text-text-main mt-1 bg-surface inline-block px-3 py-1 rounded-lg shadow-clay-sm">{formatDate(selectedDeal.createdAt)}</p></div>
                      {selectedDeal.stage === 'lost' && (<div className="bg-warm-red/10 p-4 rounded-2xl border border-warm-red/20 shadow-clay-inner"><label className="text-xs font-bold text-warm-red uppercase flex items-center mb-1"><XCircle size={14} className="mr-2" /> Lost Reason</label><p className="text-base text-warm-red-dark font-bold">{selectedDeal.lostReason}</p></div>)}
                    </div>

                    {selectedDeal.stage !== 'lost' && selectedDeal.stage !== 'won' && (<div className="mt-6 pt-6 border-t border-gray-200"><button onClick={() => setIsLostModalOpen(true)} className="w-full py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors">แจ้งเคสหลุด (Mark as Lost)</button></div>)}
                  </>
                ) : (
                  <form onSubmit={handleSaveDealDetails} className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-lg text-text-main flex items-center"><Pencil className="mr-2 text-accent" size={20} /> Edit Deal</h3>
                      <button type="button" onClick={() => setIsEditingDetails(false)} className="text-text-muted hover:text-warm-red"><X size={20} /></button>
                    </div>
                    <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                      <div><label className="block text-xs font-bold text-text-muted uppercase tracking-wide mb-1">Deal Title</label><input required name="title" defaultValue={selectedDeal.title} className="w-full px-4 py-3 bg-white border-2 border-transparent focus:border-accent rounded-xl focus:outline-none font-bold text-text-main text-sm shadow-clay-inner" /></div>
                      <div><label className="block text-xs font-bold text-text-muted uppercase tracking-wide mb-1">Value (THB)</label><input required name="value" type="number" defaultValue={selectedDeal.value} className="w-full px-4 py-3 bg-white border-2 border-transparent focus:border-accent rounded-xl focus:outline-none font-bold text-text-main text-sm shadow-clay-inner" /></div>
                      <div><label className="block text-xs font-bold text-text-muted uppercase tracking-wide mb-1">Contact Name</label><input required name="contact" defaultValue={selectedDeal.contact} className="w-full px-4 py-3 bg-white border-2 border-transparent focus:border-accent rounded-xl focus:outline-none font-bold text-text-main text-sm shadow-clay-inner" /></div>
                      <div><label className="block text-xs font-bold text-text-muted uppercase tracking-wide mb-1">Company</label><input required name="company" defaultValue={selectedDeal.company} className="w-full px-4 py-3 bg-white border-2 border-transparent focus:border-accent rounded-xl focus:outline-none font-bold text-text-main text-sm shadow-clay-inner" /></div>
                      <div><label className="block text-xs font-bold text-text-muted uppercase tracking-wide mb-1">Deal Date</label><input required name="createdAt" type="date" defaultValue={selectedDeal.createdAt ? new Date(selectedDeal.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 bg-white border-2 border-transparent focus:border-accent rounded-xl focus:outline-none font-bold text-text-main text-sm shadow-clay-inner" /></div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                      <Button type="button" variant="secondary" onClick={() => setIsEditingDetails(false)} className="flex-1">Cancel</Button>
                      <Button type="submit" variant="primary" icon={Save} className="flex-1">Save</Button>
                    </div>
                  </form>
                )}
              </div>
              <div className="w-full md:w-2/3 flex flex-col h-[80vh] md:h-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-100"><div className="flex space-x-4"><div className="flex items-center text-gray-800 font-bold border-b-2 border-blue-500 pb-1 px-1"><FileText size={16} className="mr-2" /> กิจกรรม & Tasks</div></div><button onClick={() => setSelectedDeal(null)} className="hidden md:block text-gray-400 hover:text-gray-600"><X size={24} /></button></div>
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
                  <section><h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center"><CheckSquare size={16} className="mr-2" /> Tasks</h3><div className="space-y-2 mb-4">{selectedDeal.tasks?.map(task => (<div key={task.id} className="group flex items-center justify-between p-3 rounded-2xl border border-white/50 bg-bg/30 hover:bg-bg/60 transition-all"><div className="flex items-center"><button onClick={() => handleToggleTask(task.id)} className={`mr-3 rounded-full p-1 ${task.completed ? 'bg-warm-green/20 text-warm-green' : 'bg-surface text-text-muted hover:bg-white shadow-clay-sm'}`}><CheckCircle2 size={18} /></button><div className={task.completed ? 'opacity-50 line-through' : ''}><p className="text-text-main text-sm font-bold">{task.text}</p>{task.date && (<p className={`text-xs flex items-center mt-0.5 ${new Date(task.date) < new Date() && !task.completed ? 'text-warm-red' : 'text-text-muted'}`}><Clock size={10} className="mr-1" /> {new Date(task.date).toLocaleDateString('th-TH')}</p>)}</div></div><button onClick={() => handleDeleteTask(task.id)} className="text-text-muted hover:text-warm-red opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button></div>))}{(!selectedDeal.tasks || selectedDeal.tasks.length === 0) && (<p className="text-sm text-text-muted italic pl-2">No tasks yet.</p>)}</div><form onSubmit={handleAddTask} className="flex gap-2 items-end bg-bg/50 p-3 rounded-2xl border border-white/50 shadow-clay-inner"><div className="flex-1"><input type="text" placeholder="Add a new task..." className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 mb-2 text-text-main font-bold placeholder-text-muted/50" value={newTask} onChange={(e) => setNewTask(e.target.value)} /><div className="flex items-center gap-2"><Clock size={14} className="text-text-muted" /><input type="date" className="bg-transparent text-xs text-text-muted focus:outline-none" value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)} /></div></div><button type="submit" disabled={!newTask.trim()} className="p-2 bg-accent text-white rounded-xl hover:bg-accent/80 disabled:opacity-50 shadow-clay-btn active:shadow-clay-btn-active"><Plus size={16} /></button></form></section><hr className="border-black/5" />
                  <section><h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center"><MessageSquare size={16} className="mr-2" /> Timeline</h3><div className="space-y-4 mb-4 pl-4 border-l-2 border-black/5">{selectedDeal.notes?.map(note => (<div key={note.id} className="relative"><div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-accent border-2 border-white"></div><div className="bg-bg/30 p-4 rounded-2xl rounded-tl-none border border-white/50"><p className="text-text-main text-sm font-medium whitespace-pre-wrap">{note.text}</p><p className="text-xs text-text-muted mt-2 font-bold">{formatDate(note.date)}</p></div></div>))}</div><form onSubmit={handleAddNote} className="relative"><textarea placeholder="Add a note..." className="w-full p-4 pr-12 bg-bg/50 border-none shadow-clay-inner rounded-2xl focus:ring-0 focus:outline-none text-sm resize-none text-text-main font-medium placeholder-text-muted/50" rows="3" value={newNote} onChange={(e) => setNewNote(e.target.value)} /><button type="submit" disabled={!newNote.trim()} className="absolute bottom-3 right-3 p-2 bg-text-main text-white rounded-xl hover:bg-text-main/80 disabled:opacity-50 transition-all shadow-clay-btn active:shadow-clay-btn-active"><ArrowRight size={16} /></button></form></section>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Mark Lost Modal */}
      {
        isLostModalOpen && (
          <div className="fixed inset-0 bg-bg/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-surface rounded-3xl w-full max-w-sm p-6 shadow-clay-lg animate-in zoom-in-95 border border-white/50">
              <div className="flex items-center mb-6 text-warm-red"><AlertCircle size={28} className="mr-3" /><h3 className="text-xl font-black text-text-main">Mark as Lost</h3></div>
              <form onSubmit={handleMarkLost}>
                <div className="space-y-4 mb-4">
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wide mb-2">Lost Reason</label>
                  {['Price too high', 'Competitor selected', 'Project delayed', 'Unreachable', 'Product mismatch'].map(reason => (<label key={reason} className="flex items-center p-3 border border-white/50 bg-bg/30 rounded-xl hover:bg-warm-red/10 cursor-pointer transition-all has-[:checked]:bg-warm-red/20 has-[:checked]:border-warm-red/30 has-[:checked]:shadow-clay-inner"><input type="radio" name="reason" value={reason} className="text-warm-red focus:ring-warm-red w-4 h-4 bg-surface border-none shadow-clay-inner" required /><span className="ml-3 text-sm font-bold text-text-main">{reason}</span></label>))}
                </div>

                <div className="mb-8">
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wide mb-2">Win-Back: Follow up in?</label>
                  <select name="followUp" className="w-full px-4 py-3 bg-bg/50 border-none shadow-clay-inner rounded-xl focus:outline-none text-text-main font-bold">
                    <option value="no">No Reminder</option>
                    <option value="1">1 Month (Cool Down)</option>
                    <option value="3">3 Months (Quarterly Review) 🔥 Recommended</option>
                    <option value="6">6 Months (New Budget)</option>
                  </select>
                </div>

                <div className="flex gap-4"><Button fullWidth variant="secondary" onClick={() => setIsLostModalOpen(false)} type="button">Cancel</Button><Button fullWidth variant="danger" type="submit">Confirm</Button></div>
              </form>
            </div>
          </div>
        )
      }

      {/* Import Modal */}
      {
        isImportModalOpen && (
          <div className="fixed inset-0 bg-bg/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-surface rounded-3xl w-full max-w-md shadow-clay-lg p-8 border border-white/50">
              <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black text-text-main flex items-center"><FileSpreadsheet className="mr-3 text-warm-green" size={28} />Import Data</h3><button onClick={() => setIsImportModalOpen(false)}><X size={24} className="text-text-muted hover:text-warm-red" /></button></div>
              <div className="space-y-4"><Button variant="outline" fullWidth onClick={downloadTemplate} icon={Download}>ดาวน์โหลดแบบฟอร์ม (Template)</Button><div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current.click()}><input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />{importStatus === 'processing' ? (<div className="flex flex-col items-center text-accent"><Loader2 className="animate-spin mb-2" size={32} /><span>Creating data...</span></div>) : importStatus?.startsWith('success') ? (<div className="flex flex-col items-center text-warm-green-dark"><CheckCircle2 className="mb-2" size={32} /><span>Success! {importStatus.split(':')[1]} items imported.</span></div>) : importStatus === 'error' ? (<div className="flex flex-col items-center text-warm-red-dark"><AlertCircle className="mb-2" size={32} /><span>Error reading CSV.</span></div>) : (<div className="flex flex-col items-center text-text-muted"><Upload className="mb-2" size={32} /><span className="font-medium">Click to upload .CSV</span></div>)}</div></div>
            </div>
          </div>
        )
      }

      {/* Add Deal Modal */}
      {
        isModalOpen && (
          <div className="fixed inset-0 bg-bg/80 z-50 flex items-end md:items-center justify-center sm:p-4 backdrop-blur-sm">
            <div className="bg-surface rounded-t-3xl md:rounded-3xl w-full max-w-md shadow-clay-lg transform transition-all animate-in slide-in-from-bottom duration-300 border border-white/50">
              <div className="flex justify-between items-center p-8 border-b border-black/5"><h3 className="text-2xl font-black text-text-main">New Deal</h3><button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-warm-red bg-bg rounded-full p-2 hover:shadow-clay-sm transition-all"><X size={20} /></button></div>
              <form onSubmit={handleAddDeal} className="p-8 space-y-6">
                <div><label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">Deal Title</label><input required name="title" type="text" className="w-full px-5 py-4 bg-bg/50 border-none shadow-clay-inner rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main font-bold placeholder-text-muted/30" placeholder="e.g. Website Redesign" /></div>
                <div className="grid grid-cols-2 gap-6">
                  <div><label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">Value (THB)</label><input required name="value" type="number" min="0" className="w-full px-5 py-4 bg-bg/50 border-none shadow-clay-inner rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main font-bold placeholder-text-muted/30" placeholder="0" /></div>
                  <div><label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">Deal Date</label><input required name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-5 py-4 bg-bg/50 border-none shadow-clay-inner rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main font-bold placeholder-text-muted/30" /></div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div><label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">Contact Person</label><input required name="contact" type="text" className="w-full px-5 py-4 bg-bg/50 border-none shadow-clay-inner rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main font-bold placeholder-text-muted/30" placeholder="Client Name" /></div>
                  <div><label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">Company</label><div className="relative"><Building2 size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" /><input required name="company" type="text" className="w-full pl-12 pr-5 py-4 bg-bg/50 border-none shadow-clay-inner rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-main font-bold placeholder-text-muted/30" placeholder="Company Name" /></div></div>
                </div>
                <div className="pt-6 flex justify-end space-x-4 pb-4 md:pb-0"><Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button" className="flex-1 md:flex-none">Cancel</Button><Button variant="primary" type="submit" className="flex-1 md:flex-none">Save Deal</Button></div>
              </form>
            </div>
          </div>
        )
      }

      {/* Move Deal Modal (Tablet/Mobile Friendly) */}
      {
        movingDeal && (
          <div className="fixed inset-0 bg-bg/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-surface rounded-3xl w-full max-w-sm p-6 shadow-clay-lg animate-in zoom-in-95 border border-white/50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-text-main">Move Deal</h3>
                <button onClick={() => setMovingDeal(null)} className="text-text-muted hover:text-warm-red"><X size={24} /></button>
              </div>
              <p className="text-sm text-text-muted font-bold mb-4">Select destination stage for <span className="text-accent">"{movingDeal.title}"</span>:</p>
              <div className="space-y-3">
                {stages.map(stage => (
                  <button
                    key={stage.id}
                    onClick={async () => {
                      await handleUpdateDeal(movingDeal.id, { stage: stage.id });
                      setMovingDeal(null);
                    }}
                    className={`w-full p-4 rounded-xl font-bold text-left flex items-center justify-between border-2 transition-all
                       ${movingDeal.stage === stage.id ? 'bg-accent/10 border-accent text-accent cursor-default' : 'bg-bg/50 border-transparent hover:bg-white text-text-main shadow-clay-inner hover:shadow-clay-sm'}
                     `}
                    disabled={movingDeal.stage === stage.id}
                  >
                    <span>{stage.title}</span>
                    {movingDeal.stage === stage.id && <CheckCircle2 size={18} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}

export default App;