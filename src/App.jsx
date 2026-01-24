import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Users, Plus, Search,
  Building2, DollarSign, Trophy, X, Loader2, Database, Menu,
  CheckCircle2, Upload, Download, FileSpreadsheet, AlertCircle,
  FileText, CheckSquare, MessageSquare, Trash2, XCircle, Clock, ArrowRight,
  Cpu, Server, HardDrive, Wrench, ChevronRight, RotateCcw,
  Zap, Signal, PieChart, BarChart3, Target, Sparkles, Wand2, TrendingUp, Flame, AlertTriangle, Pencil, Save,
  Sun, Moon, CheckSquare as CheckSquareIcon, Filter, Activity
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import SolutionLayout from './components/solution-designer/SolutionLayout';

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
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'dashboard' | 'contacts' | 'spec-setup' | 'tools' | 'calendar' | 'activity'
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedDealIds, setSelectedDealIds] = useState(new Set());
  const [isDbReady] = useState(true); // Always ready in Local Mode
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
  const [filterValueMin, setFilterValueMin] = useState('');
  const [filterValueMax, setFilterValueMax] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pipelineViewMode, setPipelineViewMode] = useState('active'); // 'active', 'recent', 'all'
  const [pipelineSortMode, setPipelineSortMode] = useState('value'); // 'value', 'activity', 'newest'
  // Wait, I see selectedDealForMove on line 177 in previous reads (Step 269). Let's use that if it exists.
  const [movingDeal, setMovingDeal] = useState(null);
  const fileInputRef = useRef(null);
  const [importStatus, setImportStatus] = useState(null);
  const [visibleStages, setVisibleStages] = useState(['lead', 'contact', 'proposal', 'negotiation', 'won', 'lost']);
  const [globalActivities, setGlobalActivities] = useState([]);

  // Persist Goal to Supabase
  const [monthlyGoal, setMonthlyGoal] = useState(1000000);
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  // Dark Mode Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'monthly_goal').single();
      if (data && data.value) setMonthlyGoal(Number(data.value));
    };
    fetchSettings();
  }, []);

  // Build Global Activities Feed
  useEffect(() => {
    const activities = [];
    deals.forEach(deal => {
      // Add notes as activities
      if (deal.notes) {
        deal.notes.forEach(note => {
          activities.push({
            id: `note-${deal.id}-${note.id}`,
            type: 'note',
            dealId: deal.id,
            dealTitle: deal.title,
            company: deal.company,
            text: note.text,
            date: note.date,
            user: note.user || 'User'
          });
        });
      }
      // Add tasks as activities
      if (deal.tasks) {
        deal.tasks.forEach(task => {
          activities.push({
            id: `task-${deal.id}-${task.id}`,
            type: 'task',
            dealId: deal.id,
            dealTitle: deal.title,
            company: deal.company,
            text: task.text,
            date: task.date,
            completed: task.completed
          });
        });
      }
      // Add deal creation as activity
      activities.push({
        id: `deal-${deal.id}`,
        type: 'deal_created',
        dealId: deal.id,
        dealTitle: deal.title,
        company: deal.company,
        text: `Deal created with value ${formatCurrency(deal.value)}`,
        date: deal.createdAt,
        stage: deal.stage
      });
    });
    // Sort by date descending
    setGlobalActivities(activities.sort((a, b) => new Date(b.date) - new Date(a.date)));
  }, [deals]);

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

  }, [loading, deals]);

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
    setSelectedDeal(prev => ({ ...prev, tasks: updatedTasks }));
  };

  const handleDeleteTask = async (taskId) => {
    if (!selectedDeal) return;
    const updatedTasks = selectedDeal.tasks.filter(t => t.id !== taskId);
    await handleUpdateDeal(selectedDeal.id, { tasks: updatedTasks });
    setSelectedDeal(prev => ({ ...prev, tasks: updatedTasks }));
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
  const exportToCSV = () => {
    if (!deals.length) return alert("ไม่มีข้อมูลสำหรับส่งออก");
    const headers = ["Title", "Company", "Contact", "Value", "Stage", "Probability", "Created At"];
    const rows = deals.map(d => [
      `"${d.title?.replace(/"/g, '""') || ''}"`,
      `"${d.company?.replace(/"/g, '""') || ''}"`,
      `"${d.contact?.replace(/"/g, '""') || ''}"`,
      d.value || 0,
      d.stage || '',
      `${d.probability || 0}%`,
      d.createdAt || ''
    ]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `crm_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click(); document.body.removeChild(link);
    showToast("ส่งออกข้อมูลสำเร็จ", "success");
  };

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
        let duplicateCount = 0;

        for (const line of dataLines) {
          const cols = line.split(',').map(item => item.trim());
          if (cols.length >= 2) {
            const [title, valueStr, contact, company, stageStr] = cols;
            const cleanTitle = title || 'No Title';
            const cleanCompany = company || '';
            const cleanContact = contact || '';

            // Check if this deal already exists in the current 'deals' state
            const isDuplicate = deals.some(d =>
              d.title === cleanTitle &&
              d.company === cleanCompany &&
              d.contact === cleanContact
            );

            if (isDuplicate) {
              duplicateCount++;
              continue;
            }

            let stage = 'lead';
            if (stageStr && stages.find(s => s.id === stageStr.toLowerCase())) stage = stageStr.toLowerCase();

            newDeals.push({
              title: cleanTitle,
              value: Number(valueStr) || 0,
              contact: cleanContact,
              company: cleanCompany,
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

          const message = duplicateCount > 0
            ? `success:${newDeals.length} (Skipped ${duplicateCount} duplicates)`
            : `success:${newDeals.length}`;

          setImportStatus(message);
          setTimeout(() => { setImportStatus(null); setIsImportModalOpen(false); }, 3000);
        } else if (duplicateCount > 0) {
          setImportStatus(`success:0 (All ${duplicateCount} items were duplicates)`);
          setTimeout(() => { setImportStatus(null); setIsImportModalOpen(false); }, 3000);
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
    // 3. Value Range Filter
    const matchesValueMin = !filterValueMin || deal.value >= Number(filterValueMin);
    const matchesValueMax = !filterValueMax || deal.value <= Number(filterValueMax);
    // 4. Stage Filter
    const matchesStage = filterStage === 'all' || deal.stage === filterStage;

    return matchesSearch && matchesDate && matchesValueMin && matchesValueMax && matchesStage;
  });

  // Bulk Action Handlers
  const toggleBulkSelection = (dealId) => {
    const newSelection = new Set(selectedDealIds);
    if (newSelection.has(dealId)) {
      newSelection.delete(dealId);
    } else {
      newSelection.add(dealId);
    }
    setSelectedDealIds(newSelection);
  };

  const selectAllVisible = () => {
    const allIds = new Set(filteredDeals.map(d => d.id));
    setSelectedDealIds(allIds);
  };

  const clearBulkSelection = () => {
    setSelectedDealIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedDealIds.size} deals?`)) return;

    try {
      const { error } = await supabase.from('deals').delete().in('id', Array.from(selectedDealIds));
      if (!error) {
        setDeals(prev => prev.filter(d => !selectedDealIds.has(d.id)));
        setSelectedDealIds(new Set());
        setBulkMode(false);
        showToast(`Deleted ${selectedDealIds.size} deals`, 'success');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      showToast('Failed to delete deals', 'error');
    }
  };

  const handleBulkMove = async (targetStage) => {
    try {
      const { error } = await supabase.from('deals').update({ stage: targetStage }).in('id', Array.from(selectedDealIds));
      if (!error) {
        setDeals(prev => prev.map(d => selectedDealIds.has(d.id) ? { ...d, stage: targetStage } : d));
        setSelectedDealIds(new Set());
        setBulkMode(false);
        showToast(`Moved ${selectedDealIds.size} deals to ${stages.find(s => s.id === targetStage)?.title}`, 'success');
      }
    } catch (error) {
      console.error('Bulk move error:', error);
      showToast('Failed to move deals', 'error');
    }
  };

  // Calendar Helpers
  const getCalendarDays = () => {
    const date = new Date(currentCalendarDate);
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getTasksForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const tasks = [];
    deals.forEach(deal => {
      if (deal.tasks) {
        deal.tasks.forEach(task => {
          const taskDate = new Date(task.date).toISOString().split('T')[0];
          if (taskDate === dateStr && !task.completed) {
            tasks.push({ ...task, dealTitle: deal.title, dealId: deal.id });
          }
        });
      }
    });
    return tasks;
  };

  const getDealsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return deals.filter(deal => {
      const dealDate = new Date(deal.createdAt).toISOString().split('T')[0];
      return dealDate === dateStr;
    });
  };

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
        w-[240px] min-w-[240px]
        bg-surface text-text-muted 
        flex flex-col m-0 xl:m-4 xl:rounded-3xl xl:shadow-clay-lg border border-white/50
        transition-transform duration-300 ease-in-out font-sans
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        xl:translate-x-0 
      `}>
        {/* Header / Logo */}
        <div className="h-20 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-clay-btn transform rotate-3 flex-shrink-0">
              <span className="font-extrabold text-xl">S</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-black text-sm text-text-main whitespace-nowrap tracking-tighter">Sales CRM</span>
              <span className="text-[9px] font-bold text-accent uppercase tracking-widest opacity-70">Professional</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="xl:hidden text-text-muted p-2"><X size={20} /></button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 opacity-60">Menu</p>
          {['pipeline', 'overview', 'dashboard', 'contacts'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  w-full flex items-center px-4 py-3 rounded-2xl transition-all duration-300 group
                  ${isActive
                    ? 'bg-surface shadow-clay-inner text-accent font-bold scale-[0.98]'
                    : 'text-text-muted hover:bg-surface/50 hover:text-text-main hover:translate-x-1'}
                `}
              >
                {tab === 'pipeline' && <LayoutDashboard size={20} className={`mr-3 ${isActive ? 'text-accent' : 'text-text-muted opacity-60'}`} />}
                {tab === 'overview' && <PieChart size={20} className={`mr-3 ${isActive ? 'text-accent' : 'text-text-muted opacity-60'}`} />}
                {tab === 'dashboard' && <BarChart3 size={20} className={`mr-3 ${isActive ? 'text-accent' : 'text-text-muted opacity-60'}`} />}
                {tab === 'contacts' && <Users size={20} className={`mr-3 ${isActive ? 'text-accent' : 'text-text-muted opacity-60'}`} />}
                <span className="text-[13px] capitalize">{tab}</span>
              </button>
            );
          })}

          <div className="my-6 border-t border-black/5 opacity-50 mx-4"></div>
          <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 opacity-60">Architect Tools</p>
          {['spec-setup', 'solution', 'tools'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  w-full flex items-center px-4 py-3 rounded-2xl transition-all duration-300 group
                  ${isActive
                    ? 'bg-surface shadow-clay-inner text-accent font-bold scale-[0.98]'
                    : 'text-text-muted hover:bg-surface/50 hover:text-text-main hover:translate-x-1'}
                `}
              >
                {tab === 'spec-setup' && <Cpu size={20} className={`mr-3 ${isActive ? 'text-accent' : 'text-text-muted opacity-60'}`} />}
                {tab === 'tools' && <Wrench size={20} className={`mr-3 ${isActive ? 'text-accent' : 'text-text-muted opacity-60'}`} />}
                {tab === 'solution' && <Server size={20} className={`mr-3 ${isActive ? 'text-accent' : 'text-text-muted opacity-60'}`} />}
                <span className="text-[13px]">
                  {tab === 'spec-setup' ? 'Spec AI' : tab === 'solution' ? 'Solution Designer' : 'IT Tools'}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Dark Mode Toggle */}
        <div className="px-4 py-4 border-t border-black/5 flex flex-col gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center justify-center px-4 py-2.5 bg-surface text-text-muted rounded-xl text-xs font-bold transition-all shadow-clay-sm hover:text-accent border border-white/50"
          >
            {darkMode ? <Sun size={16} className="mr-2" /> : <Moon size={16} className="mr-2" />}
            {darkMode ? 'Light' : 'Dark'} Mode
          </button>

          <button
            onClick={exportToCSV}
            className="w-full flex items-center justify-center px-4 py-2.5 bg-surface text-text-muted rounded-xl text-xs font-bold transition-all shadow-clay-sm hover:text-accent border border-white/50"
          >
            <Download size={16} className="mr-2" /> Export Data
          </button>
        </div>

        {/* Footer Actions */}
        <div className="px-4 pb-6">
          <div className="p-3 bg-gradient-to-br from-accent/10 to-transparent rounded-2xl border border-accent/20 relative group overflow-hidden">
            <div className="flex items-center gap-2 relative z-10">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-[#C08C60] flex items-center justify-center text-white shadow-clay-sm shrink-0">
                <span className="font-black text-[8px]">DEV</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-black text-accent uppercase tracking-wide opacity-70">Developer</p>
                <p className="text-[11px] font-black text-text-main whitespace-nowrap truncate tracking-tighter">SORAWIT THUNTHAKIJ</p>
              </div>
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
                      activeTab === 'calendar' ? 'Calendar View' :
                        activeTab === 'activity' ? 'Activity Feed' :
                          activeTab === 'spec-setup' ? 'Smart Spec Recommendation' :
                            activeTab === 'solution' ? 'Enterprise Solution Designer' : 'Professional IT Tools'}
            </h1>
            {loading && <Loader2 size={16} className="animate-spin text-accent hidden md:block" />}
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {activeTab === 'pipeline' && (
              <>
                {/* Bulk Mode Toggle */}
                <button
                  onClick={() => { setBulkMode(!bulkMode); setSelectedDealIds(new Set()); }}
                  className={`hidden md:flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all ${bulkMode ? 'bg-accent text-white shadow-clay-btn' : 'bg-surface text-text-muted hover:bg-white shadow-clay-sm'}`}
                >
                  <CheckSquareIcon size={16} className="mr-2" />
                  {bulkMode ? 'Exit Bulk' : 'Bulk Select'}
                </button>
                {/* Stage Visibility Toggle */}
                <div className="hidden lg:flex items-center gap-1 bg-surface shadow-clay-inner p-1 rounded-2xl mr-2">
                  {stages.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setVisibleStages(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${visibleStages.includes(s.id) ? 'bg-accent text-white shadow-clay-btn' : 'text-text-muted hover:bg-bg'}`}
                    >
                      {s.id}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="relative hidden md:block group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted group-hover:text-accent transition-colors" size={20} />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 pr-6 py-3 bg-surface border-none shadow-clay-inner rounded-xl focus:outline-none focus:ring-0 text-sm w-48 lg:w-64 transition-all placeholder-text-muted/50 text-text-main" />
            </div>
            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`hidden md:flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all ${showAdvancedFilters ? 'bg-accent text-white shadow-clay-btn' : 'bg-surface text-text-muted hover:bg-white shadow-clay-sm'}`}
            >
              <Filter size={16} className="mr-2" />
              Filters
            </button>
            <Button onClick={() => setIsModalOpen(true)} icon={Plus} variant="primary" className="whitespace-nowrap"><span className="hidden md:inline">New Deal</span><span className="md:hidden">Add</span></Button>
          </div>
        </header>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="bg-surface border-b border-black/5 px-4 md:px-6 xl:px-8 py-4 animate-in fade-in slide-in-from-top duration-300">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-text-muted uppercase">Value Range:</label>
                <input
                  type="number"
                  placeholder="Min"
                  value={filterValueMin}
                  onChange={(e) => setFilterValueMin(e.target.value)}
                  className="w-24 px-3 py-2 bg-bg/50 border-none shadow-clay-inner rounded-lg focus:outline-none text-sm text-text-main"
                />
                <span className="text-text-muted">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filterValueMax}
                  onChange={(e) => setFilterValueMax(e.target.value)}
                  className="w-24 px-3 py-2 bg-bg/50 border-none shadow-clay-inner rounded-lg focus:outline-none text-sm text-text-main"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-text-muted uppercase">Stage:</label>
                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="px-3 py-2 bg-bg/50 border-none shadow-clay-inner rounded-lg focus:outline-none text-sm text-text-main"
                >
                  <option value="all">All Stages</option>
                  {stages.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => { setFilterValueMin(''); setFilterValueMax(''); setFilterStage('all'); }}
                className="text-xs text-warm-red hover:text-red-700 underline font-bold"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {bulkMode && selectedDealIds.size > 0 && (
          <div className="bg-accent text-white px-4 md:px-6 xl:px-8 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-4">
              <span className="font-bold">{selectedDealIds.size} deals selected</span>
              <button onClick={selectAllVisible} className="text-xs underline hover:opacity-80">Select All Visible</button>
              <button onClick={clearBulkSelection} className="text-xs underline hover:opacity-80">Clear Selection</button>
            </div>
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => handleBulkMove(e.target.value)}
                className="px-3 py-2 bg-white text-accent rounded-lg focus:outline-none text-sm font-bold"
              >
                <option value="">Move to Stage...</option>
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
              <button onClick={handleBulkDelete} className="px-4 py-2 bg-warm-red rounded-lg text-xs font-bold hover:bg-red-600 transition-colors">
                Delete Selected
              </button>
            </div>
          </div>
        )}

        <div className={`flex-1 bg-bg p-4 md:p-6 xl:p-8 ${activeTab === 'pipeline' ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto overflow-x-hidden'}`}>
          {/* Calendar View */}
          {activeTab === 'calendar' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-text-main">Calendar</h2>
                <div className="flex items-center gap-4">
                  <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1)))} className="p-2 bg-surface rounded-xl hover:bg-white shadow-clay-sm transition-all">
                    <ChevronRight size={20} className="rotate-180" />
                  </button>
                  <span className="text-lg font-bold text-text-main min-w-[150px] text-center">
                    {currentCalendarDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1)))} className="p-2 bg-surface rounded-xl hover:bg-white shadow-clay-sm transition-all">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              <Card className="p-6">
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-bold text-text-muted uppercase py-2">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {getCalendarDays().map((date, idx) => {
                    if (!date) {
                      return <div key={`empty-${idx}`} className="min-h-[100px]"></div>;
                    }
                    const tasks = getTasksForDate(date);
                    const dealsOnDate = getDealsForDate(date);
                    const isToday = new Date().toDateString() === date.toDateString();
                    return (
                      <div
                        key={date.toISOString()}
                        className={`min-h-[100px] p-2 rounded-xl border transition-all cursor-pointer hover:shadow-clay-sm ${isToday ? 'bg-accent/10 border-accent' : 'bg-surface border-black/5'
                          }`}
                        onClick={() => {
                          const dateStr = date.toISOString().split('T')[0];
                          setFilterDate(dateStr);
                          setActiveTab('pipeline');
                        }}
                      >
                        <div className="text-sm font-bold text-text-main mb-1">{date.getDate()}</div>
                        {tasks.length > 0 && (
                          <div className="space-y-1">
                            {tasks.slice(0, 2).map((task, i) => (
                              <div key={i} className="text-[10px] bg-warm-yellow/20 text-warm-yellow-dark px-1 py-0.5 rounded truncate" title={task.text}>
                                {task.text}
                              </div>
                            ))}
                            {tasks.length > 2 && (
                              <div className="text-[10px] text-text-muted">+{tasks.length - 2} more</div>
                            )}
                          </div>
                        )}
                        {dealsOnDate.length > 0 && (
                          <div className="space-y-1 mt-1">
                            {dealsOnDate.slice(0, 1).map((deal, i) => (
                              <div key={i} className="text-[10px] bg-accent/20 text-accent px-1 py-0.5 rounded truncate" title={deal.title}>
                                {deal.title}
                              </div>
                            ))}
                            {dealsOnDate.length > 1 && (
                              <div className="text-[10px] text-text-muted">+{dealsOnDate.length - 1} deal</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* Activity Feed */}
          {activeTab === 'activity' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-text-main">Activity Feed</h2>
                <div className="text-sm text-text-muted">{globalActivities.length} activities</div>
              </div>
              <div className="space-y-4">
                {globalActivities.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Activity size={48} className="mx-auto mb-4 text-text-muted opacity-50" />
                    <p className="text-text-muted font-bold">No activities yet</p>
                  </Card>
                ) : (
                  globalActivities.map((activity) => (
                    <Card key={activity.id} className="p-4 hover:shadow-clay-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${activity.type === 'note' ? 'bg-warm-blue' :
                          activity.type === 'task' ? (activity.completed ? 'bg-warm-green' : 'bg-warm-yellow') :
                            activity.type === 'deal_created' ? 'bg-accent' : 'bg-text-muted'
                          }`}>
                          {activity.type === 'note' && <MessageSquare size={20} />}
                          {activity.type === 'task' && <CheckSquare size={20} />}
                          {activity.type === 'deal_created' && <Trophy size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-text-main">{activity.dealTitle}</span>
                            <span className="text-xs text-text-muted">•</span>
                            <span className="text-xs text-text-muted">{activity.company}</span>
                          </div>
                          <p className="text-sm text-text-muted mb-2">{activity.text}</p>
                          <div className="text-xs text-text-muted font-bold">
                            {formatDate(activity.date)}
                            {activity.user && ` • ${activity.user}`}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'pipeline' && (
            <div className="flex flex-col h-full gap-4 overflow-hidden">
              {/* Pipeline Management Header (High Volume Solution) */}
              <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 mx-2 shadow-clay-inner">
                <div className="flex items-center gap-2">
                  <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-clay-inner">
                    {[
                      { id: 'active', label: 'กำลังเจรจา (Active)', icon: Activity },
                      { id: 'recent', label: 'ล่าสุด (30d)', icon: Clock },
                      { id: 'all', label: 'ทั้งหมด (Archived)', icon: LayoutDashboard }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setPipelineViewMode(mode.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${pipelineViewMode === mode.id ? 'bg-white shadow-clay-sm text-accent' : 'text-text-muted hover:text-text-main'}`}
                      >
                        <mode.icon size={12} /> {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <select
                    value={pipelineSortMode}
                    onChange={(e) => setPipelineSortMode(e.target.value)}
                    className="bg-transparent border-none text-[10px] font-black text-text-muted uppercase tracking-widest focus:ring-0 cursor-pointer hover:text-accent"
                  >
                    <option value="value">Sort: มูลค่าสูงสุด</option>
                    <option value="activity">Sort: กิจกรรมล่าสุด</option>
                    <option value="newest">Sort: ใหม่ล่าสุด</option>
                  </select>
                  <div className="w-px h-6 bg-black/5"></div>
                  <div className="text-[10px] font-black text-text-muted">
                    แสดงผล: <span className="text-text-main">{filteredDeals.length}</span> จาก <span className="text-text-main">{deals.length}</span> ดีล
                  </div>
                </div>
              </div>

              <div className="flex overflow-x-auto pb-8 h-full gap-6 items-start snap-x snap-mandatory pt-2 px-2">
                {stages.filter(s => {
                  // High Volume Logic: Auto-hide Won/Lost in 'active' mode
                  if (pipelineViewMode === 'active' && (s.id === 'won' || s.id === 'lost')) return false;
                  return visibleStages.includes(s.id);
                }).map(stage => {
                  const stageColors = {
                    lead: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
                    contact: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
                    proposal: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
                    negotiation: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
                    won: 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                    lost: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  };

                  return (
                    <div key={stage.id}
                      className={`min-w-[320px] max-w-[340px] flex-shrink-0 flex flex-col max-h-full snap-center bg-gray-50/80 dark:bg-black/20 rounded-[32px] border border-black/5 dark:border-white/5 overflow-hidden shadow-sm`}
                      onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, stage.id)}
                    >
                      <div className={`p-5 flex flex-col gap-2`}>
                        <div className="flex justify-between items-center">
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${stageColors[stage.id]}`}>
                            <div className={`w-2 h-2 rounded-full bg-current shadow-[0_0_8px_rgba(0,0,0,0.2)]`}></div>
                            <h3 className={`font-black text-xs uppercase tracking-widest`}>{stage.title}</h3>
                          </div>
                          <span className="bg-white dark:bg-gray-800 shadow-clay-sm text-text-muted text-[10px] font-black px-2.5 py-1 rounded-lg border border-black/5">{deals.filter(d => d.stage === stage.id).length}</span>
                        </div>
                        <div className="px-1 flex justify-between items-end mt-1">
                          <span className="text-[10px] text-text-muted font-bold uppercase tracking-tighter opacity-60">Value Pool</span>
                          <span className="text-sm font-black text-text-main">{formatCurrency(getStageTotal(stage.id))}</span>
                        </div>
                      </div>
                      <div className="p-4 pt-0 overflow-y-auto flex-1 space-y-4 custom-scrollbar touch-pan-y pb-20">
                        {filteredDeals
                          .filter(deal => deal.stage === stage.id)
                          .filter(deal => {
                            // Recent mode: Only 30 days
                            if (pipelineViewMode === 'recent') {
                              const dealDate = new Date(deal.createdAt);
                              const daysOld = (new Date() - dealDate) / (1000 * 60 * 60 * 24);
                              return daysOld <= 30;
                            }
                            return true;
                          })
                          .sort((a, b) => {
                            if (pipelineSortMode === 'value') return b.value - a.value;
                            if (pipelineSortMode === 'activity') return new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0);
                            return new Date(b.createdAt) - new Date(a.createdAt);
                          })
                          .map(deal => {
                            const isSelected = selectedDealIds.has(deal.id);
                            // --- Stale Deal Alert Logic ---
                            let lastActive = new Date(deal.lastActivity); // Try lastActivity
                            if (isNaN(lastActive.getTime())) lastActive = new Date(deal.createdAt); // Fallback if invalid (e.g. old string format)
                            const diffHours = (new Date() - lastActive) / (1000 * 60 * 60);
                            const diffDays = Math.ceil(diffHours / 24);

                            let staleMarker = null;
                            let statusBorder = "border-gray-100 dark:border-gray-800";

                            if (stage.id === 'lead' && diffHours > 24) {
                              statusBorder = "border-l-4 border-l-orange-500";
                              staleMarker = (<div className="flex items-center gap-1 text-orange-500 text-[9px] font-bold animate-pulse"><Zap size={10} /> {Math.floor(diffHours)}h stall</div>);
                            } else if (stage.id === 'proposal' && diffDays > 3) {
                              statusBorder = "border-l-4 border-l-red-500";
                              staleMarker = (<div className="flex items-center gap-1 text-red-500 text-[9px] font-bold"><Flame size={10} /> {diffDays}d heat</div>);
                            } else if (stage.id === 'negotiation' && diffDays > 7) {
                              statusBorder = "border-l-4 border-l-yellow-600";
                              staleMarker = (<div className="flex items-center gap-1 text-yellow-600 text-[9px] font-bold"><AlertTriangle size={10} /> {diffDays}d idle</div>);
                            }

                            const nextTask = deal.tasks?.find(t => !t.completed);
                            const isOverdue = nextTask && nextTask.date && new Date(nextTask.date) < new Date();

                            const meddpiccLabels = {
                              Metrics: 'วัดผลได้ (Metrics)',
                              Economic: 'ผู้มีอำนาจ (Buyer)',
                              Criteria: 'เกณฑ์เลือก (Criteria)',
                              Process: 'กระบวนการ (Process)',
                              Pain: 'ระบุปัญหา (Pain)',
                              Champion: 'ผู้สนับสนุน (Champion)',
                              Competition: 'รู้คู่แข่ง (Competition)'
                            };
                            const meddpiccKeys = Object.keys(meddpiccLabels);
                            const qualifiedCount = (deal.tasks || []).filter(t => meddpiccKeys.some(k => t.text.includes(k))).length;

                            return (
                              <div
                                key={deal.id}
                                draggable={!bulkMode}
                                onDragStart={(e) => handleDragStart(e, deal.id)}
                                onClick={() => bulkMode ? toggleBulkSelection(deal.id) : handleDealClick(deal)}
                                style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'manipulation' }}
                                className={`bg-white dark:bg-gray-900 p-5 rounded-[24px] border ${statusBorder} shadow-clay-sm group relative transition-all 
                            ${bulkMode ? 'cursor-pointer hover:bg-accent/5' : 'cursor-pointer hover:shadow-clay-md hover:-translate-y-1'}
                            ${isSelected ? 'ring-2 ring-accent ring-offset-2' : ''}
                          `}
                              >
                                {/* Actions Overlay (Visible on Hover) */}
                                <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 z-20">
                                  <button onClick={(e) => handleAnalyzeDeal(deal, e)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 shadow-clay-sm hover:shadow-clay-inner rounded-xl text-accent transition-all"><Wand2 size={14} /></button>
                                  <button onClick={(e) => handleDeleteDeal(deal.id, e)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 shadow-clay-sm hover:text-red-500 rounded-xl text-text-muted transition-all"><Trash2 size={14} /></button>
                                </div>

                                {/* Bulk Selection Checkbox */}
                                {bulkMode && (
                                  <div className="absolute top-3 left-3 z-30">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${isSelected ? 'bg-accent border-accent text-white' : 'bg-white border-gray-300'}`}>
                                      {isSelected && <CheckSquareIcon size={12} />}
                                    </div>
                                  </div>
                                )}

                                <div className="mb-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[11px] font-black text-accent bg-accent/5 px-2 py-0.5 rounded-lg truncate max-w-[70%]">{deal.company}</span>
                                    {staleMarker}
                                  </div>
                                  <h4 className="font-extrabold text-[15px] text-text-main leading-tight group-hover:text-accent transition-colors">{deal.title}</h4>
                                </div>

                                <div className="flex items-center gap-2 text-[11px] text-text-muted font-medium mb-4">
                                  <Users size={14} className="opacity-40" />
                                  <span className="truncate">{deal.contact}</span>
                                </div>

                                {/* Next Action Badge */}
                                {nextTask ? (
                                  <div className={`mb-4 p-3 rounded-2xl flex flex-col gap-1 border ${isOverdue ? 'bg-red-50 border-red-100' : 'bg-bg dark:bg-white/5 border-black/5'}`}>
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${isOverdue ? 'text-red-500 animate-pulse' : 'text-text-muted opacity-50'}`}>
                                      Next Action
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <Clock size={12} className={isOverdue ? 'text-red-500' : 'text-accent'} />
                                      <span className={`text-[11px] font-bold truncate ${isOverdue ? 'text-red-700' : 'text-text-main'}`}>{nextTask.text}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mb-4 p-2.5 rounded-2xl border border-dashed border-black/10 dark:border-white/10 flex items-center gap-2 text-[10px] font-bold text-text-muted/40 italic">
                                    <Plus size={12} /> Add next activity
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-1">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-text-muted font-black uppercase opacity-40 leading-none mb-1">Deal Value</span>
                                    <span className="text-lg font-black text-text-main tracking-tight">{formatCurrency(deal.value)}</span>
                                  </div>

                                  {deal.ai_score && (
                                    <div className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1.5 shadow-clay-inner ${deal.ai_score >= 70 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                      <TrendingUp size={12} />{deal.ai_score}%
                                    </div>
                                  )}
                                </div>

                                {/* Qualification Tracker (MEDDPICC) */}
                                <div className="mt-4 pt-3 border-t border-black/5 flex flex-col gap-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-text-muted uppercase tracking-wider opacity-60">Qualification (MEDDPICC)</span>
                                    <span className="text-[10px] font-black text-text-main">{Math.round((qualifiedCount / 7) * 100)}%</span>
                                  </div>
                                  <div className="flex gap-1 h-1.5">
                                    {[...Array(7)].map((_, i) => (
                                      <div key={i} className={`flex-1 rounded-full transition-all duration-500 ${i < qualifiedCount ? 'bg-accent' : 'bg-gray-100 dark:bg-gray-800'}`}></div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        {filteredDeals.filter(deal => deal.stage === stage.id).length === 0 && (
                          <div className="flex flex-col items-center justify-center py-20 opacity-20 filter grayscale">
                            <LayoutDashboard size={48} className="mb-4" />
                            <p className="text-xs font-bold uppercase tracking-widest text-center">No deals in this stage</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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
                  <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">Forecast Revenue</p>
                  <h3 className="text-2xl font-black text-warm-purple">{formatCurrency(deals.filter(d => d.stage !== 'lost' && d.stage !== 'won').reduce((acc, d) => acc + (d.value * (d.probability / 100)), 0))}</h3>
                </Card>
                <Card className="p-6 border-l-4 border-l-warm-yellow relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-warm-yellow/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">Active Deals</p>
                  <h3 className="text-2xl font-black text-warm-yellow">{deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').length}</h3>
                </Card>
              </div>

              {/* 2. Revenue Performance Center (Beyond World Class) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Achievement Gauge */}
                <Card className="p-8 lg:col-span-1 border-none shadow-clay-lg bg-white dark:bg-gray-800 flex flex-col items-center justify-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Target size={120} className="text-accent" />
                  </div>

                  <div className="relative w-48 h-48 mb-6">
                    {/* Background Circle */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100 dark:text-gray-700" />
                      {/* Progress Circle with Gradient filter */}
                      <circle
                        cx="96" cy="96" r="80" stroke="url(#achievementGradient)" strokeWidth="12" fill="transparent"
                        strokeDasharray={2 * Math.PI * 80}
                        strokeDashoffset={2 * Math.PI * 80 * (1 - Math.min(1, deals.filter(d => d.stage === 'won').reduce((acc, d) => acc + d.value, 0) / monthlyGoal))}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                      <defs>
                        <linearGradient id="achievementGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--accent-color, #C08C60)" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-text-main">{Math.round((deals.filter(d => d.stage === 'won').reduce((acc, d) => acc + d.value, 0) / monthlyGoal) * 100)}%</span>
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">Reached</span>
                    </div>
                  </div>

                  <div className="text-center w-full">
                    <h3 className="font-black text-sm text-text-main mb-3 uppercase tracking-widest flex items-center justify-center gap-2">
                      รายได้เทียบเป้าหมาย (Monthly Target)
                    </h3>
                    <div className="flex justify-between items-end px-4">
                      <div className="text-left">
                        <p className="text-[9px] font-black text-text-muted uppercase">Achieved</p>
                        <p className="text-sm font-black text-warm-green">{formatCurrency(deals.filter(d => d.stage === 'won').reduce((acc, d) => acc + d.value, 0))}</p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        {isEditingGoal ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={monthlyGoal}
                              onChange={(e) => setMonthlyGoal(Number(e.target.value))}
                              className="w-20 px-2 py-0.5 text-[10px] font-black border border-accent rounded bg-white focus:outline-none"
                              autoFocus
                              onBlur={handleSaveGoal}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveGoal()}
                            />
                            <button onClick={handleSaveGoal} className="text-warm-green"><Save size={10} /></button>
                          </div>
                        ) : (
                          <button onClick={() => setIsEditingGoal(true)} className="text-[9px] font-black text-accent uppercase flex items-center gap-1 hover:underline">
                            Target <Pencil size={8} />
                          </button>
                        )}
                        <p className="text-sm font-black text-text-main">/ {formatCurrency(monthlyGoal)}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Forecast & Gap Analysis */}
                <Card className="p-8 lg:col-span-2 border-none shadow-clay-lg bg-white dark:bg-gray-800 flex flex-col">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="font-black text-lg text-text-main">วิเคราะห์ยอดขายและคาดการณ์ (Sales Forecast)</h3>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Comparing Actual, Weighted Pipeline, and TargetGap</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-warm-green"></div><span className="text-[9px] font-black text-text-muted">WON</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-accent"></div><span className="text-[9px] font-black text-text-muted">WEIGHTED</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-200"></div><span className="text-[9px] font-black text-text-muted">GAP</span></div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-end gap-1">
                    {/* Multi-layered Progress Bar */}
                    <div className="w-full h-12 bg-gray-50 dark:bg-gray-900 rounded-2xl flex overflow-hidden p-1 shadow-clay-inner border border-black/5">
                      {/* Won Portion */}
                      <div
                        className="h-full bg-warm-green rounded-xl transition-all duration-1000 shadow-[2px_0_10px_rgba(34,197,94,0.3)] z-30"
                        style={{ width: `${Math.min(100, (deals.filter(d => d.stage === 'won').reduce((acc, d) => acc + d.value, 0) / monthlyGoal) * 100)}%` }}
                      ></div>
                      {/* Weighted Pipeline Portion */}
                      <div
                        className="h-full bg-accent rounded-xl -ml-2 transition-all duration-1000 shadow-[2px_0_10px_rgba(192,140,96,0.2)] z-20"
                        style={{ width: `${Math.min(100 - (deals.filter(d => d.stage === 'won').reduce((acc, d) => acc + d.value, 0) / monthlyGoal * 100), (deals.filter(d => d.stage !== 'lost' && d.stage !== 'won').reduce((acc, d) => acc + (d.value * (d.probability / 100)), 0) / monthlyGoal) * 100)}%` }}
                      ></div>
                      {/* Gap Portion */}
                      <div className="h-full flex-1 bg-transparent"></div>
                    </div>

                    {/* Markers / Labels */}
                    <div className="flex justify-between text-[10px] font-black text-text-muted uppercase mt-4">
                      <div className="space-y-1">
                        <p>ยอดปิดได้แล้ว (Won)</p>
                        <p className="text-lg text-warm-green">{Math.round((deals.filter(d => d.stage === 'won').reduce((acc, d) => acc + d.value, 0) / monthlyGoal) * 100)}%</p>
                      </div>
                      <div className="text-center space-y-1">
                        <p>รวมคาดการณ์ (Total Projection)</p>
                        <p className="text-lg text-accent">
                          {Math.round(((deals.filter(d => d.stage === 'won').reduce((acc, d) => acc + d.value, 0) + deals.filter(d => d.stage !== 'lost' && d.stage !== 'won').reduce((acc, d) => acc + (d.value * (d.probability / 100)), 0)) / monthlyGoal) * 100)}%
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p>ยอดที่ยังขาด (Gap to Goal)</p>
                        <p className="text-lg text-text-main">
                          {formatCurrency(Math.max(0, monthlyGoal - (deals.filter(d => d.stage === 'won').reduce((acc, d) => acc + d.value, 0) + deals.filter(d => d.stage !== 'lost' && d.stage !== 'won').reduce((acc, d) => acc + (d.value * (d.probability / 100)), 0))))}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-black/5 grid grid-cols-2 gap-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-warm-blue/10 rounded-2xl text-warm-blue"><Activity size={20} /></div>
                      <div>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Pipeline Health</p>
                        <p className="text-sm font-black text-text-main">Velocity: {deals.length ? (deals.filter(d => d.stage === 'won').length / Math.max(1, deals.length) * 100).toFixed(1) : 0}% Win Rate</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-warm-purple/10 rounded-2xl text-warm-purple"><Sparkles size={20} /></div>
                      <div>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">AI Insight</p>
                        <p className="text-sm font-black text-text-main">
                          {(deals.filter(d => d.stage === 'won').reduce((acc, d) => acc + d.value, 0) + deals.filter(d => d.stage !== 'lost' && d.stage !== 'won').reduce((acc, d) => acc + (d.value * (d.probability / 100)), 0)) >= monthlyGoal
                            ? 'On track to hit target!'
                            : 'Needs more pipeline volume.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* 3. Pipeline Intelligence (Beyond World Class Funnel) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Conversion Funnel */}
                <Card className="p-8 border-none shadow-clay-lg bg-white dark:bg-gray-800 flex flex-col h-full uppercase tracking-tighter">
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <h3 className="font-black text-lg text-text-main flex items-center gap-2">
                        <TrendingUp size={20} className="text-accent" /> วิเคราะห์กรวยการขาย (Sales Funnel)
                      </h3>
                      <p className="text-[10px] font-bold text-text-muted mt-1">Lead to Conversion Drop-off Analysis</p>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col gap-1 pr-4">
                    {['lead', 'contact', 'proposal', 'negotiation', 'won'].map((stageId, idx) => {
                      const stage = stages.find(s => s.id === stageId);
                      const count = deals.filter(d => d.stage === stageId).length;
                      const totalVal = deals.filter(d => d.stage === stageId).reduce((acc, d) => acc + d.value, 0);

                      // Width calculation (decreasing funnel)
                      const widths = [100, 85, 70, 55, 40];
                      const colors = [
                        'bg-blue-500/80',
                        'bg-purple-500/80',
                        'bg-orange-500/80',
                        'bg-yellow-500/80',
                        'bg-green-500/80'
                      ];

                      // Conversion rate (compare to lead stage or previous stage)
                      const leadCount = deals.filter(d => d.stage === 'lead').length || 1;
                      const convRate = Math.round((count / leadCount) * 100);

                      return (
                        <div key={stageId} className="relative group mb-1">
                          <div className="flex items-center gap-4">
                            <div className="w-24 text-[9px] font-black text-text-muted text-right truncate">
                              {stage?.title}
                            </div>
                            <div className="flex-1 h-10 relative">
                              <div
                                className={`absolute inset-y-0 left-0 ${colors[idx]} rounded-r-lg transition-all duration-700 shadow-sm group-hover:scale-y-105 group-hover:brightness-110 flex items-center px-4`}
                                style={{ width: `${widths[idx]}%` }}
                              >
                                <span className="text-white text-[10px] font-black">{count} Deals</span>
                              </div>
                            </div>
                            <div className="w-24">
                              <p className="text-[11px] font-black text-text-main">{formatCurrency(totalVal)}</p>
                              <p className="text-[8px] font-bold text-text-muted">{idx === 0 ? 'SOURCE' : `CONV. ${convRate}%`}</p>
                            </div>
                          </div>
                          {idx < 4 && (
                            <div className="ml-28 h-4 border-l-2 border-dashed border-gray-200 dark:border-gray-700 my-0.5 opacity-50"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <div className="grid grid-cols-1 gap-6">
                  {/* Top Opportunities Mini-Table */}
                  <Card className="p-6 border-none shadow-clay-lg bg-white dark:bg-gray-800">
                    <h3 className="font-bold text-sm mb-4 text-text-main flex items-center gap-2"><Trophy size={16} className="text-yellow-500" /> TOP OPPORTUNITIES</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead className="text-text-muted border-b border-gray-100">
                          <tr><th className="pb-3 pl-2">DEAL NAME</th><th className="pb-3 text-right pr-2">VALUE</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {deals.filter(d => d.stage !== 'lost' && d.stage !== 'won').sort((a, b) => b.value - a.value).slice(0, 3).map(deal => (
                            <tr key={deal.id} className="group hover:bg-gray-50 transition-colors">
                              <td className="py-2.5 pl-2 font-black text-text-main">{deal.title}<div className="text-[9px] text-text-muted opacity-60 uppercase">{deal.company}</div></td>
                              <td className="py-2.5 text-right pr-2 font-black text-accent">{formatCurrency(deal.value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* Loss Analysis Mini-Graph */}
                  <Card className="p-6 border-none shadow-clay-lg bg-red-50/20 dark:bg-red-900/10">
                    <h3 className="font-bold text-sm mb-4 text-text-main flex items-center gap-2"><XCircle size={16} className="text-red-500" /> LOSS REASON ANALYSIS</h3>
                    {deals.filter(d => d.stage === 'lost').length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(deals.filter(d => d.stage === 'lost').reduce((acc, d) => { const r = d.lostReason || 'Unspecified'; acc[r] = (acc[r] || 0) + 1; return acc; }, {}))
                          .sort((a, b) => b[1] - a[1]).slice(0, 2).map(([reason, count]) => (
                            <div key={reason} className="flex items-center">
                              <div className="w-full">
                                <div className="flex justify-between text-[10px] mb-1"><span className="text-red-700 font-black uppercase">{reason}</span><span className="text-text-muted font-bold">{count} CASES</span></div>
                                <div className="w-full bg-red-100 dark:bg-red-900/30 rounded-full h-1.5"><div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${(count / deals.filter(d => d.stage === 'lost').length) * 100}%` }}></div></div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-text-muted text-xs italic">No losses yet. Maintaining 100% velocity!</div>
                    )}
                  </Card>
                </div>
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
                            <div key={idx} className="col-span-full text-center p-12 bg-bg/50 rounded-3xl border border-dashed border-text-muted">
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
          {activeTab === 'solution' && <SolutionLayout deals={deals} onUpdateDeal={handleUpdateDeal} />}
        </div>
      </main>

      {/* Detail Modal */}
      {
        selectedDeal && (
          <div className="fixed inset-0 bg-bg/85 z-50 flex items-center justify-center p-2 md:p-4 backdrop-blur-md overflow-y-auto overflow-x-hidden">
            <div className="bg-surface w-full max-w-3xl max-h-[92vh] sm:rounded-[32px] shadow-clay-lg flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200 border border-white/50 relative">
              <div className="w-full md:w-[350px] bg-bg/50 border-r border-white/50 p-5 flex flex-col shrink-0">

                {!isEditingDetails ? (
                  <>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${selectedDeal.stage === 'lost' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{stages.find(s => s.id === selectedDeal.stage)?.title}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setIsEditingDetails(true)} className="text-text-muted hover:text-accent p-1"><Pencil size={16} /></button>
                        <button onClick={() => setSelectedDeal(null)} className="md:hidden text-text-muted hover:text-warm-red"><X size={22} /></button>
                      </div>
                    </div>
                    <h2 className="text-lg font-black text-gray-900 mb-0.5 leading-tight">{selectedDeal.title}</h2>
                    <p className="text-xl font-mono text-gray-700 mb-4">{formatCurrency(selectedDeal.value)}</p>

                    <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      <div><label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Contact Person</label><div className="flex items-center mt-1.5"><div className="w-9 h-9 bg-warm-blue/20 rounded-xl flex items-center justify-center text-warm-blue-dark text-xs font-bold mr-3 shadow-clay-sm flex-shrink-0">{selectedDeal.contact?.charAt(0)}</div><div className="min-w-0"><p className="font-extrabold text-text-main text-base truncate">{selectedDeal.contact}</p><p className="text-[11px] text-text-muted font-bold truncate">{selectedDeal.company}</p></div></div></div>
                      <div><label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Created At</label><p className="text-[11px] font-black text-text-main mt-0.5 bg-surface inline-block px-2 py-0.5 rounded-lg shadow-clay-sm">{formatDate(selectedDeal.createdAt)}</p></div>


                      {/* Qualification Checklist (MEDDPICC) */}
                      <div className="pt-3 border-t border-black/5">
                        <label className="text-[10px] font-black text-accent uppercase tracking-widest block mb-1.5 flex items-center justify-between">
                          รายการ QUALIFY
                        </label>
                        <div className="space-y-1.5">
                          {[
                            { key: 'Metrics', label: 'วัดผลสำเร็จได้ (Metrics)' },
                            { key: 'Economic', label: 'ผู้มีอำนาจซื้อ (Buyer)' },
                            { key: 'Criteria', label: 'เกณฑ์ที่เลือก (Criteria)' },
                            { key: 'Process', label: 'กระบวนการ (Process)' },
                            { key: 'Pain', label: 'ปัญหาชัดเจน (Pain)' },
                            { key: 'Champion', label: 'คนสนับสนุน (Champion)' },
                            { key: 'Competition', label: 'รู้ว่าแข่งใคร (Competition)' }
                          ].map((item) => {
                            const isDone = selectedDeal.tasks?.some(t => t.text.includes(item.key) && t.completed);
                            return (
                              <button
                                key={item.key}
                                onClick={async () => {
                                  const existingTask = selectedDeal.tasks?.find(t => t.text.includes(item.key));
                                  if (existingTask) {
                                    const updatedTasks = selectedDeal.tasks.filter(t => t.id !== existingTask.id);
                                    await handleUpdateDeal(selectedDeal.id, { tasks: updatedTasks });
                                    setSelectedDeal(prev => ({ ...prev, tasks: updatedTasks }));
                                  } else {
                                    const task = { id: Date.now(), text: `[MEDDPICC] ${item.key}: ${item.label}`, date: new Date().toISOString(), completed: true };
                                    const updatedTasks = [...(selectedDeal.tasks || []), task];
                                    await handleUpdateDeal(selectedDeal.id, { tasks: updatedTasks });
                                    setSelectedDeal(prev => ({ ...prev, tasks: updatedTasks }));
                                  }
                                }}
                                className={`w-full flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${isDone ? 'bg-warm-green/10 border-warm-green/30 text-warm-green-dark shadow-clay-inner' : 'bg-white border-black/5 text-text-muted hover:border-accent/40 shadow-sm'}`}
                              >
                                {isDone ? <CheckCircle2 size={12} /> : <div className="w-2.5 h-2.5 rounded-full border-2 border-current opacity-30" />}
                                <span className="text-[10px] font-extrabold">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {selectedDeal.stage === 'lost' && (<div className="bg-warm-red/10 p-4 rounded-2xl border border-warm-red/20 shadow-clay-inner"><label className="text-xs font-bold text-warm-red uppercase flex items-center mb-1"><XCircle size={14} className="mr-2" /> Lost Reason</label><p className="text-base text-warm-red-dark font-bold">{selectedDeal.lostReason}</p></div>)}
                    </div>

                    <div className="mt-3 pt-3 border-t border-black/5">
                      <button
                        onClick={async () => {
                          const prompt = `Act as an Enterprise Sales Coach (MEDDPICC Expert). This deal is in stage '${selectedDeal.stage}' with value ${selectedDeal.value}. Current qualification state: ${(selectedDeal.tasks || []).filter(t => t.text.includes('[MEDDPICC]')).map(t => t.text).join(', ')}. Provide a Win-Strategy in 3 bullet points (Thai language): 1. Tactical Next Step 2. Relationship Strategy 3. Risk to Mitigate`;
                          showToast("Consulting Sales Coach AI...", "info");
                          const res = await callGeminiAPI(prompt);
                          if (res) alert("Sales Coach AI Strategy:\n\n" + (typeof res === 'string' ? res : JSON.stringify(res)));
                        }}
                        className="w-full py-2.5 bg-gradient-to-r from-accent to-[#C08C60] text-white rounded-2xl font-black text-[10px] shadow-clay-btn hover:scale-[1.02] transition-all flex items-center justify-center gap-2 mb-2 uppercase tracking-widest"
                      >
                        <Target size={14} /> Win-Strategy AI
                      </button>
                    </div>

                    {selectedDeal.stage !== 'lost' && selectedDeal.stage !== 'won' && (<div className="mt-2 pt-2 border-t border-gray-200"><button onClick={() => setIsLostModalOpen(true)} className="w-full py-1.5 border border-red-100 text-red-500 rounded-lg hover:bg-red-50 text-[10px] font-black uppercase tracking-wider transition-colors">Mark as Lost</button></div>)}

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
              <div className="flex-1 flex flex-col h-full bg-white relative">
                {/* Desktop Close Button */}
                <button onClick={() => setSelectedDeal(null)} className="absolute top-4 right-4 z-10 hidden md:block text-gray-400 hover:text-warm-red transition-colors">
                  <X size={24} />
                </button>

                <div className="flex items-center p-4 border-b border-gray-100 pr-12">
                  <div className="flex space-x-4">
                    <div className="flex items-center text-gray-800 font-black text-xs uppercase tracking-widest border-b-2 border-accent pb-1">
                      <FileText size={14} className="mr-2 text-accent" /> Activity & Timeline
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                  <section>
                    <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 flex items-center">
                      <CheckSquare size={14} className="mr-2 text-accent" /> Tasks
                    </h3>
                    <div className="space-y-2 mb-4">
                      {selectedDeal.tasks?.map(task => (
                        <div key={task.id} className="group flex items-center justify-between p-2.5 rounded-2xl bg-bg/40 hover:bg-bg/70 transition-all border border-black/5">
                          <div className="flex items-center min-w-0">
                            <button onClick={() => handleToggleTask(task.id)} className={`mr-2.5 rounded-full p-0.5 ${task.completed ? 'bg-warm-green/20 text-warm-green' : 'bg-white text-text-muted shadow-clay-sm'}`}>
                              <CheckCircle2 size={16} />
                            </button>
                            <div className={task.completed ? 'opacity-40 line-through' : ''}>
                              <p className="text-text-main text-[13px] font-bold truncate">{task.text}</p>
                              {task.date && (<p className={`text-[10px] flex items-center mt-0.5 ${new Date(task.date) < new Date() && !task.completed ? 'text-warm-red' : 'text-text-muted'}`}><Clock size={10} className="mr-1" /> {new Date(task.date).toLocaleDateString('th-TH')}</p>)}
                            </div>
                          </div>
                          <button onClick={() => handleDeleteTask(task.id)} className="text-text-muted hover:text-warm-red opacity-0 group-hover:opacity-100 transition-opacity p-1"><Trash2 size={14} /></button>
                        </div>
                      ))}
                      {(!selectedDeal.tasks || selectedDeal.tasks.length === 0) && (<p className="text-[11px] text-text-muted italic pl-2">No tasks assigned.</p>)}
                    </div>
                    <form onSubmit={handleAddTask} className="flex gap-2 items-center bg-bg/50 p-2.5 rounded-2xl border border-black/5 shadow-clay-inner">
                      <div className="flex-1">
                        <input type="text" placeholder="Add task..." className="w-full bg-transparent border-none focus:ring-0 text-[13px] p-0 mb-1 text-text-main font-bold placeholder-text-muted/40" value={newTask} onChange={(e) => setNewTask(e.target.value)} />
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-text-muted" />
                          <input type="date" className="bg-transparent text-[10px] text-text-muted focus:outline-none font-bold" value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)} />
                        </div>
                      </div>
                      <button type="submit" disabled={!newTask.trim()} className="p-2 bg-accent text-white rounded-xl shadow-clay-btn active:scale-95"><Plus size={16} /></button>
                    </form>
                  </section>

                  <hr className="border-black/5" />

                  <section>
                    <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 flex items-center">
                      <MessageSquare size={14} className="mr-2 text-accent" /> Timeline
                    </h3>
                    <div className="space-y-4 mb-4 pl-4 border-l-2 border-black/5">
                      {selectedDeal.notes?.map(note => (
                        <div key={note.id} className="relative">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-accent border-2 border-white shadow-sm"></div>
                          <div className="bg-bg/30 p-3.5 rounded-2xl rounded-tl-none border border-black/5">
                            <p className="text-text-main text-[13px] font-medium whitespace-pre-wrap">{note.text}</p>
                            <p className="text-[10px] text-text-muted mt-2 font-black uppercase tracking-wider">{formatDate(note.date)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleAddNote} className="relative">
                      <textarea placeholder="Write a note..." className="w-full p-3 pr-12 bg-bg/50 border-none shadow-clay-inner rounded-2xl focus:ring-0 text-[13px] resize-none text-text-main font-medium placeholder-text-muted/40" rows="2" value={newNote} onChange={(e) => setNewNote(e.target.value)} />
                      <button type="submit" disabled={!newNote.trim()} className="absolute bottom-2.5 right-2.5 p-2 bg-text-main text-white rounded-xl shadow-clay-btn active:scale-95"><ArrowRight size={14} /></button>
                    </form>
                  </section>
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
              <p className="text-sm text-text-muted font-bold mb-4">Select destination stage for <span className="text-accent">&quot;{movingDeal.title}&quot;</span>:</p>
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