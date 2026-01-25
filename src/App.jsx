import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LayoutDashboard, Users, Plus, Search,
  Building2, DollarSign, Trophy, X, Loader2, Database, Menu,
  CheckCircle2, Upload, Download, FileSpreadsheet, AlertCircle,
  FileText, CheckSquare, MessageSquare, Trash2, XCircle, Clock, ArrowRight,
  Cpu, Server, HardDrive, Wrench, ChevronRight, RotateCcw,
  Zap, Signal, PieChart, Target, Sparkles, Wand2, TrendingUp, Flame, AlertTriangle, Pencil, Save,
  Sun, Moon, CheckSquare as CheckSquareIcon, Filter, Activity, Info
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
  const [expandedCompany, setExpandedCompany] = useState(null);

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

  // --- Unified Data Engine (Optimized & Interconnected) ---
  const masterData = useMemo(() => {
    // 1. Basic Filtering (Search & Stage Filter)
    const filtered = deals.filter(deal => {
      const matchSearch = deal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.contact?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStage = filterStage === 'all' || deal.stage === filterStage;

      const val = deal.value || 0;
      const matchMin = filterValueMin === '' || val >= Number(filterValueMin);
      const matchMax = filterValueMax === '' || val <= Number(filterValueMax);

      const matchDate = !filterDate || (deal.createdAt && deal.createdAt.startsWith(filterDate));

      return matchSearch && matchStage && matchMin && matchMax && matchDate;
    });

    // 2. Customer Master (Unique Entities)
    const customers = Object.entries(deals.reduce((acc, d) => {
      const key = d.company?.trim() || 'No Company';
      if (!acc[key]) {
        acc[key] = {
          name: key,
          contact: d.contact,
          ltv: 0,
          count: 0,
          activeDeals: 0,
          lastDate: d.createdAt,
          status: d.stage,
          deals: []
        };
      }
      acc[key].deals.push(d);
      if (d.stage === 'won') acc[key].ltv += d.value;
      if (d.stage !== 'won' && d.stage !== 'lost') acc[key].activeDeals += 1;
      if (new Date(d.createdAt) > new Date(acc[key].lastDate)) {
        acc[key].lastDate = d.createdAt;
        acc[key].status = d.stage;
      }
      return acc;
    }, {}))
      .map(([, val]) => val)
      .sort((a, b) => b.ltv - a.ltv);

    // 3. The Golden List (Strategic Targets)
    const goldenList = deals.filter(d => {
      const daysOld = (new Date() - new Date(d.lastActivity || d.createdAt)) / (1000 * 60 * 60 * 24);
      return d.value >= 100000 && d.stage === 'proposal' && daysOld >= 2 && daysOld <= 5;
    }).sort((a, b) => b.value - a.value);

    // 4. Metrics & Funnel
    const totalPipeline = deals.reduce((acc, d) => acc + (d.value || 0), 0);
    const wonRevenue = deals.filter(d => d.stage === 'won').reduce((acc, d) => acc + d.value, 0);
    const funnel = ['lead', 'contact', 'proposal', 'negotiation', 'won'].map(sid => ({
      id: sid,
      count: deals.filter(d => d.stage === sid).length,
      value: deals.filter(d => d.stage === sid).reduce((acc, d) => acc + d.value, 0)
    }));

    return { filteredDeals: filtered, customers, goldenList, totalPipeline, wonRevenue, funnel };
  }, [deals, searchTerm, filterStage, filterValueMin, filterValueMax, filterDate]);

  const { filteredDeals: memoFilteredDeals, customers: customerMaster, goldenList, totalPipeline, wonRevenue, funnel: funnelStats } = masterData;


  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'monthly_goal').single();
      if (data && data.value) setMonthlyGoal(Number(data.value));
    };
    fetchSettings();

    // 72-Hour Aggressive Nudge: Request Notification Permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Aggressive Nudge: Periodic Check (Every 1 hour while tab is open)
  useEffect(() => {
    const checkAggressiveNudge = () => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;

      const now = new Date();
      deals.forEach(deal => {
        if (deal.value >= 100000 && deal.stage === 'proposal') {
          const lastActivity = new Date(deal.lastActivity || deal.createdAt);
          const diffHours = (now - lastActivity) / (1000 * 60 * 60);

          if (diffHours >= 48) {
            new Notification("🔥 URGENT: High Value Deal Stalled!", {
              body: `ดีล ${deal.title} (฿${deal.value.toLocaleString()}) เงียบไปเกิน 48 ชม. แล้ว! รีบตามด่วนก่อนหลุด!`,
              icon: '/favicon.ico'
            });
          }
        }
      });
    };

    const interval = setInterval(checkAggressiveNudge, 1000 * 60 * 60 * 2); // Every 2 hours
    return () => clearInterval(interval);
  }, [deals]);

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

  const getStageTotal = (stageId) => memoFilteredDeals.filter(d => d.stage === stageId).reduce((sum, d) => sum + d.value, 0);

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
          {['pipeline', 'overview', 'dashboard', 'customers', 'clients'].map((tab) => {
            const isActive = activeTab === tab;
            const tabIcons = {
              pipeline: <Activity size={18} />,
              overview: <PieChart size={18} />,
              dashboard: <LayoutDashboard size={18} />,
              customers: <Users size={18} />,
              clients: <Trophy size={18} className="text-yellow-500" />
            };
            const tabLabels = {
              pipeline: 'Sales Pipeline',
              overview: 'Sales Overview',
              dashboard: 'Strategic Dash',
              customers: 'Customer Master',
              clients: 'Key VIP Clients'
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300
                  ${isActive
                    ? 'bg-accent text-white shadow-clay-btn translate-x-1'
                    : 'text-text-muted hover:bg-bg hover:text-text-main hover:translate-x-1'}
                `}
              >
                {tabIcons[tab]}
                {tabLabels[tab]}
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
                    activeTab === 'customers' ? 'Customer Master' :
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
              <input type="text" placeholder="Search customer, deal, product..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 pr-6 py-3 bg-white border border-gray-200 shadow-clay-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 text-sm w-64 lg:w-96 transition-all placeholder-text-muted/50 text-text-main" />
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

          {activeTab === 'clients' && (
            <div className="max-w-6xl mx-auto space-y-8 pb-10">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black text-text-main mb-2">Key VIP Clients</h2>
                  <p className="text-text-muted font-medium">ลำดับความสำคัญของลูกค้าตามยอดซื้อสะสม (Lifetime Value)</p>
                </div>
                <div className="bg-white/50 px-4 py-2 rounded-2xl shadow-clay-inner border border-white">
                  <p className="text-[10px] font-black text-text-muted uppercase">Total VIPs</p>
                  <p className="text-xl font-black text-accent">{customerMaster.filter(c => c.ltv > 0).length}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {customerMaster.filter(c => c.ltv > 0).slice(0, 10).map((stats, idx) => {
                  let tier = { label: 'Silver', color: 'bg-slate-100 text-slate-600', icon: <Users size={16} /> };
                  if (stats.ltv >= 1000000) tier = { label: 'Platinum VIP', color: 'bg-indigo-600 text-white shadow-indigo-200', icon: <Trophy size={16} /> };
                  else if (stats.ltv >= 500000) tier = { label: 'Gold Client', color: 'bg-yellow-500 text-white shadow-yellow-200', icon: <Sparkles size={16} /> };

                  const company = stats.name;
                  return (
                    <Card key={company} className="p-8 group hover:shadow-clay-lg transition-all duration-500 relative overflow-hidden">
                      {idx < 3 && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform"></div>
                      )}

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-bg to-bg/50 shadow-clay-inner border border-white flex items-center justify-center text-2xl font-black text-accent">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-black text-text-main">{company}</h3>
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm ${tier.color}`}>
                                {tier.icon} {tier.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold text-text-muted">
                              <span className="flex items-center gap-1"><Users size={12} className="opacity-40" /> {stats.contact}</span>
                              <span className="flex items-center gap-1"><Trophy size={12} className="opacity-40" /> {stats.deals.filter(d => d.stage === 'won').length} Deals Won</span>
                              <span className="flex items-center gap-1"><Clock size={12} className="opacity-40" /> Last Deal: {formatDate(stats.lastDate)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-10">
                          <div className="text-right">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Lifetime Value (LTV)</p>
                            <p className="text-3xl font-black text-text-main">{formatCurrency(stats.ltv)}</p>
                          </div>
                          <div className="w-px h-12 bg-black/5 hidden md:block"></div>
                          <div className="flex flex-col gap-2">
                            <p className="text-[10px] font-black text-accent uppercase tracking-widest text-center">Take Care Action</p>
                            <div className="flex gap-2">
                              <button onClick={() => showToast(`ส่งคำขอบคุณถึง ${company} แล้ว`, "success")} className="px-4 py-2 bg-accent/10 text-accent rounded-xl text-[10px] font-black uppercase hover:bg-accent hover:text-white transition-all shadow-clay-sm border border-accent/20">
                                Appreciation
                              </button>
                              <button onClick={() => showToast(`สร้างนัดหมายทานข้าวกับ ${company} แล้ว`, "success")} className="px-4 py-2 bg-warm-blue/10 text-warm-blue rounded-xl text-[10px] font-black uppercase hover:bg-warm-blue hover:text-white transition-all shadow-clay-sm border border-warm-blue/20">
                                Coffee/Dinner
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                {customerMaster.filter(c => c.ltv > 0).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-40 opacity-20 filter grayscale">
                    <Trophy size={80} className="mb-4 text-accent" />
                    <p className="text-lg font-black uppercase tracking-widest text-center">No VIP Clients Yet <br /> Close some deals to build your VIP list!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pipeline' && (
            <div className="flex flex-col h-full gap-4 overflow-hidden">
              {/* Hot Deals (>100k) Ticker */}
              <div className="mx-2 mb-2 px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[24px] border border-orange-200/50 shadow-clay-sm shrink-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full shadow-lg shadow-orange-500/30 animate-pulse">
                    <Flame size={14} fill="currentColor" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Hot Deals {'>'}100k</span>
                  </div>
                  <span className="text-[10px] text-text-muted font-bold opacity-70">โฟกัสดีลเหล่านี้เพื่อปิดยอดให้เร็วที่สุด!</span>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar snap-x">
                  {deals.filter(d => d.value >= 100000 && d.stage !== 'won' && d.stage !== 'lost').length === 0 && (
                    <div className="text-xs text-text-muted italic opacity-50 py-2 w-full text-center">ยังไม่มีดีลร้อนแรงในขณะนี้ (No Hot Deals)</div>
                  )}
                  {deals.filter(d => d.value >= 100000 && d.stage !== 'won' && d.stage !== 'lost')
                    .sort((a, b) => b.value - a.value)
                    .map(deal => {
                      const lastActive = new Date(deal.lastActivity || deal.createdAt);
                      const hoursDiff = (new Date() - lastActive) / (1000 * 60 * 60);
                      const isQuoteSent = ['proposal', 'negotiation'].includes(deal.stage);
                      const isCritical = isQuoteSent && hoursDiff > 48;

                      return (
                        <div key={`hot-${deal.id}`} onClick={() => handleDealClick(deal)}
                          className={`min-w-[240px] p-3.5 rounded-2xl border cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md flex flex-col gap-1.5 snap-start bg-white dark:bg-gray-900 group
                               ${isCritical
                              ? 'border-red-500 dark:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-[pulse_3s_ease-in-out_infinite]'
                              : 'border-orange-100 dark:border-white/10 hover:border-orange-300'}
                             `}>
                          <div className="flex justify-between items-center mb-0.5">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block"></span>
                              <span className="text-[10px] font-black uppercase text-text-muted truncate max-w-[120px] tracking-wider">{deal.company}</span>
                            </div>
                            {isCritical && <div className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[9px] font-black flex items-center gap-1 animate-bounce"><AlertTriangle size={8} /> 48h+ Delay</div>}
                          </div>
                          <h4 className="text-sm font-extrabold text-text-main truncate group-hover:text-accent transition-colors">{deal.title}</h4>
                          <div className="flex justify-between items-center mt-1">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${deal.stage === 'proposal' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              deal.stage === 'negotiation' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                'bg-gray-50 text-gray-500 border-gray-100'
                              }`}>
                              {stages.find(s => s.id === deal.stage)?.title?.split(' ')[0] || deal.stage}
                            </span>
                            <span className="text-base font-black text-accent">{formatCurrency(deal.value)}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

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
                    แสดงผล: <span className="text-text-main">{memoFilteredDeals.length}</span> จาก <span className="text-text-main">{deals.length}</span> ดีล
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
                        {memoFilteredDeals
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
                                  {/* Improved Header: Company First, then Title */}
                                  <div className="flex justify-between items-start mb-1 gap-2">
                                    <span className="font-black text-sm text-text-main hover:text-accent transition-colors truncate" title={deal.company}>{deal.company}</span>
                                    {staleMarker}
                                  </div>
                                  <div className="flex items-center gap-1.5 overflow-hidden">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent/40 shrink-0"></span>
                                    <h4 className="font-bold text-xs text-text-muted truncate group-hover:text-text-main transition-colors" title={deal.title}>{deal.title}</h4>
                                  </div>
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
                                    <span className="text-[9px] text-text-muted font-bold uppercase opacity-50 leading-none mb-0.5">Deal Value</span>
                                    <span className="text-xl font-black text-accent tracking-tight">{formatCurrency(deal.value)}</span>
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
                        {memoFilteredDeals.filter(deal => deal.stage === stage.id).length === 0 && (
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
            <div className="space-y-6 max-w-7xl mx-auto pb-10">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-3xl font-black text-text-main mb-1">Strategic Overview</h2>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Growth Matrix & Engagement Pulse</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-2xl shadow-clay-inner border border-black/5 text-center">
                    <p className="text-[10px] font-black text-text-muted uppercase">Avg Deal Size</p>
                    <p className="text-lg font-black text-accent">{formatCurrency(deals.length ? deals.reduce((acc, d) => acc + d.value, 0) / deals.length : 0)}</p>
                  </div>
                </div>
              </div>

              {/* Thai Strategic Guide (Collapsible) */}
              <details className="group bg-white/40 dark:bg-black/20 border border-white/40 rounded-2xl overflow-hidden mb-6">
                <summary className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-white/50 transition-colors list-none">
                  <span className="text-xs font-bold text-text-muted flex items-center gap-2"><Info size={14} /> คู่มือวิเคราะห์กลยุทธ์ (Strategic Manual)</span>
                  <span className="text-xs text-text-muted group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-text-muted leading-relaxed">
                  <div>
                    <strong className="text-text-main block mb-1">1. Deal Health Matrix (กราฟจุด)</strong>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><span className="text-green-600 font-bold">Stars (สีเขียว)</span>: ดีลเกรด A+ มูลค่าสูงและมีการคุยต่อเนื่อง (ต้องปิดให้ได้)</li>
                      <li><span className="text-red-500 font-bold">Risk (สีแดง)</span>: ดีลเสี่ยงหลุด! มูลค่าสูงแต่เริ่มเงียบไปนาน (รีบตามด่วน)</li>
                      <li><span className="text-blue-500 font-bold">Cash Cow (สีฟ้า)</span>: ดีลเล็กแต่มาเรื่อยๆ (ปิดเร็วๆ เก็บยอด)</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-text-main block mb-1">2. Sales Velocity (ความเร็ว)</strong>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong>Cycle Time</strong>: เวลาเฉลี่ยที่ใช้ปิดดีล (ยิ่งน้อยยิ่งดี)</li>
                      <li><strong>Velocity</strong>: รายได้ที่ไหลเข้ามาต่อวัน (ยิ่งมากยิ่งดี)</li>
                      <li><strong>Engagement Trend</strong>: กราฟแท่งแสดงความถี่ในการติดต่อลูกค้าในช่วง 30 วัน</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-text-main block mb-1">3. AI Battle Plan & Quick Wins</strong>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong>AI Plan</strong>: ให้ AI ช่วยคิด &quot;แผนการรบ&quot; ประจำวัน 3 ข้อเพื่อปิดยอดทันที</li>
                      <li><strong>Quick Wins</strong>: แนะนำดีลที่มีโอกาสชนะเกิน 50% หรือดีลช่วงต่อรองที่ปิดง่าย</li>
                    </ul>
                  </div>
                </div>
              </details>

              {/* The Growth Matrix (2x2 Grid) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                {/* Matrix Chart */}
                <div className="bg-surface rounded-[32px] p-8 shadow-clay-md border border-white/60 relative overflow-hidden flex flex-col min-h-[500px]">
                  <h3 className="text-lg font-black text-text-main mb-6 flex items-center gap-2">
                    <Target size={20} className="text-accent" /> Deal Health Matrix
                  </h3>
                  <div className="absolute top-8 right-8 flex gap-4 text-[10px] font-bold text-text-muted uppercase">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> Stars (High Val/Active)</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Risk (High Val/Idle)</div>
                  </div>

                  {/* The Grid */}
                  <div className="flex-1 relative bg-white/50 dark:bg-black/20 rounded-3xl border-2 border-dashed border-black/10 dark:border-white/10 p-4">
                    {/* Axes Labels */}
                    <div className="absolute -left-6 top-1/2 -rotate-90 text-[10px] font-black uppercase text-text-muted tracking-widest">Deal Value (High)</div>
                    <div className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 text-[10px] font-black uppercase text-text-muted tracking-widest">Engagement (High)</div>

                    {/* Quadrant Dividers */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-full h-px bg-black/10 dark:bg-white/10"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="h-full w-px bg-black/10 dark:bg-white/10"></div>
                    </div>

                    {/* Plotting Deals */}
                    {deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').map(deal => {
                      const avgVal = deals.reduce((acc, d) => acc + d.value, 0) / deals.length || 1;
                      const daysIdle = (new Date() - new Date(deal.lastActivity || deal.createdAt)) / (1000 * 60 * 60 * 24);

                      // X-Axis: 0 (Dead) -> 100 (Active). Invert daysIdle: 0 days = 100%, 30 days = 0%
                      const xPercent = Math.max(5, Math.min(95, 100 - (daysIdle * 3)));
                      // Y-Axis: 0 (Low) -> 100 (High). Cap at 2x Avg
                      const yPercent = Math.max(5, Math.min(95, (deal.value / (avgVal * 2)) * 100));

                      let color = 'bg-gray-400';
                      if (xPercent > 50 && yPercent > 50) color = 'bg-green-500 shadow-green-200'; // Star
                      else if (xPercent < 50 && yPercent > 50) color = 'bg-red-500 shadow-red-200 animate-pulse'; // At Risk
                      else if (xPercent > 50 && yPercent < 50) color = 'bg-blue-500 shadow-blue-200'; // Cash Cow
                      else color = 'bg-orange-400 opacity-50'; // Dog

                      return (
                        <div key={deal.id}
                          onClick={() => handleDealClick(deal)}
                          className={`absolute w-3 h-3 rounded-full ${color} shadow-lg cursor-pointer hover:scale-150 transition-all z-10 group`}
                          style={{ left: `${xPercent}%`, bottom: `${yPercent}%` }}>
                          {/* Tooltip */}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-20">
                            {deal.title} ({formatCurrency(deal.value)})
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Velocity & Trends */}
                <div className="flex flex-col gap-6">
                  <Card className="flex-1 p-8 bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-none shadow-[0_20px_50px_rgba(79,70,229,0.15)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 relative z-10"><Activity size={20} className="text-cyan-400" /> Sales Velocity Pulse</h3>

                    <div className="grid grid-cols-2 gap-8 relative z-10">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Cycle Time</p>
                        <h4 className="text-4xl font-black text-white">18 <span className="text-sm font-bold text-slate-500">Days</span></h4>
                        <p className="text-[10px] text-green-400 mt-2 flex items-center gap-1"><TrendingUp size={10} /> -2 days vs last month</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pipeline Velocity</p>
                        <h4 className="text-4xl font-black text-cyan-400">{formatCurrency(totalPipeline / 18)}<span className="text-sm font-bold text-slate-500">/day</span></h4>
                        <p className="text-[10px] text-slate-400 mt-2">Revenue flow rate</p>
                      </div>
                    </div>

                    {/* Mini Forecast Chart (CSS) */}
                    <div className="mt-8 pt-6 border-t border-white/10">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Engagement Trend (30 Days)</p>
                      <div className="flex items-end gap-1 h-16 w-full">
                        {[...Array(20)].map((_, i) => {
                          const h = Math.floor(Math.random() * 100);
                          return <div key={i} className="flex-1 bg-cyan-500/20 hover:bg-cyan-400 rounded-t-sm transition-all" style={{ height: `${h}%` }}></div>
                        })}
                      </div>
                    </div>
                  </Card>

                  {/* AI Battle Plan (New Feature) */}
                  <Card className="p-6 border-l-4 border-l-accent bg-surface shadow-clay-md">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-sm text-text-main flex items-center gap-2"><Sparkles size={16} className="text-accent" /> AI Battle Plan</h3>
                      <button onClick={async () => {
                        const strategyDeals = deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').slice(0, 5);
                        const prompt = `Act as a ruthless Sales Director. Look at these deals: ${JSON.stringify(strategyDeals.map(d => ({ title: d.title, stage: d.stage, val: d.value })))}. Give me 3 concrete, aggressive bullet points on what to do TODAY to close money. Thai Language. Short & Punchy.`;
                        alert("AI is thinking... (Ordering 3 strategies)");
                        const res = await callGeminiAPI(prompt);
                        if (res && res.response) alert(res.response);
                        if (res) alert("🎯 Strategy:\n" + (res.plan || JSON.stringify(res)));
                      }} className="px-3 py-1 bg-accent/10 text-accent text-[10px] uppercase font-black rounded-lg hover:bg-accent hover:text-white transition-colors">
                        Generate Plan
                      </button>
                    </div>
                    <p className="text-xs text-text-muted">Generate a data-driven daily execution plan to maximize revenue.</p>
                  </Card>

                  {/* Quick Wins List (Refined Logic) */}
                  <Card className="flex-1 p-6 overflow-y-auto max-h-[300px]">
                    <h3 className="font-bold text-sm mb-4 text-text-main flex items-center gap-2"><Zap size={16} className="text-yellow-500" /> Quick Wins Opportunity</h3>
                    <div className="space-y-3">
                      {/* Logic Update: Show ANY deal with > 50% probability that isn't won yet */}
                      {deals.filter(d => d.stage !== 'won' && d.stage !== 'lost' && (d.probability >= 50 || d.stage === 'negotiation')).sort((a, b) => b.probability - a.probability).slice(0, 4).map(deal => (
                        <div key={deal.id} onClick={() => handleDealClick(deal)} className="flex items-center justify-between p-3 rounded-xl bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 cursor-pointer hover:bg-yellow-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 font-bold text-xs">
                              {deal.probability}%
                            </div>
                            <div>
                              <p className="text-xs font-black text-text-main">{deal.title}</p>
                              <p className="text-[10px] text-text-muted">{deal.company}</p>
                            </div>
                          </div>
                          <span className="text-xs font-black text-accent">{formatCurrency(deal.value)}</span>
                        </div>
                      ))}
                      {deals.filter(d => d.stage !== 'won' && d.stage !== 'lost' && (d.probability >= 50 || d.stage === 'negotiation')).length === 0 && (
                        <div className="text-center py-6 opacity-40 text-xs font-bold">No high-probability deals found. Keep pushing!</div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 max-w-6xl mx-auto pb-8">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black text-text-main mb-2">Dashboard Intelligence</h2>
                  <p className="text-text-muted font-medium uppercase tracking-widest text-[10px]">Real-time Sales Performance & Pipeline Health</p>

                  {/* Thai Dashboard Guide (Collapsible) */}
                  <details className="mt-4 group bg-white/40 dark:bg-black/20 border border-white/40 rounded-2xl overflow-hidden w-full md:w-[480px]">
                    <summary className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-white/50 transition-colors list-none">
                      <span className="text-xs font-bold text-text-muted flex items-center gap-2"><Info size={14} /> คำอธิบายแดชบอร์ด</span>
                      <span className="text-xs text-text-muted group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="p-4 pt-0 text-xs text-text-muted leading-relaxed">
                      <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Revenue Goal (วงแหวน)</strong>: แสดงยอดขายจริงเทียบกับเป้าหมาย (แก้เป้าได้โดยกด Edit)</li>
                        <li><strong>AI Forecast</strong>: ยอดที่ AI คำนวณว่าจะ &quot;จบได้จริง&quot; ตามความน่าจะเป็น</li>
                        <li><strong>Target Gap</strong>: ยอดที่ต้องหาเพิ่ม เพื่อให้ถึงเป้าหมาย</li>
                        <li><strong>Golden List</strong>: รายชื่อดีลที่สำคัญที่สุด (Top Deals) ที่ต้องโฟกัส</li>
                      </ul>
                    </div>
                  </details>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={async () => {
                    if (!deals.length) return alert("No data to analyze");
                    const prompt = `Analyze this sales data and give 3 key strategic insights (in Thai language):
                      Total Deals: ${deals.length}
                      Value: ${totalPipeline}
                      `;
                    const res = await callGeminiAPI(prompt);
                    if (res) alert("AI Analysis: " + JSON.stringify(res));
                  }}>
                    <Sparkles size={18} className="mr-2 text-accent" /> AI Analyst
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-1 p-6 bg-gradient-to-br from-accent/20 to-surface border-accent/30 relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 p-2 opacity-10"><Zap size={48} className="text-accent" /></div>
                  <h3 className="font-black text-xs text-accent uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Trophy size={14} /> The Golden List
                  </h3>
                  <div className="flex-1 space-y-3">
                    {goldenList.slice(0, 5).map(deal => (
                      <div key={deal.id} onClick={() => handleDealClick(deal)} className="p-2.5 bg-white/60 dark:bg-gray-800/60 rounded-xl shadow-sm border border-white/40 cursor-pointer hover:translate-x-1 transition-all">
                        <p className="text-[11px] font-black text-text-main truncate">{deal.title}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[9px] font-bold text-accent">{formatCurrency(deal.value)}</span>
                        </div>
                      </div>
                    ))}
                    {goldenList.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center opacity-40 py-4">
                        <Target size={24} className="mb-2" />
                        <p className="text-[10px] font-bold text-center">No targets in window</p>
                      </div>
                    )}
                  </div>
                  <p className="text-[8px] font-black text-text-muted mt-4 uppercase opacity-40 italic">Focus on &quot;Life-Changing Deals&quot;</p>
                </Card>

                <div className="lg:col-span-3 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-[32px] p-6 lg:p-8 shadow-clay-md border border-white/60 relative overflow-hidden group">
                  {/* Decorative Background Blob */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-accent/20 transition-all duration-700"></div>

                  <div className="flex flex-col md:flex-row gap-8 lg:gap-12 relative z-10 h-full">
                    {/* LEFT: MAIN GOAL GAUGE */}
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
                      <div className="flex justify-between w-full mb-2 px-4 max-w-[240px]">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Revenue Goal</span>
                        <button onClick={() => {
                          const newGoal = prompt("Set Monthly Goal (THB):", monthlyGoal);
                          if (newGoal && !isNaN(newGoal)) {
                            setMonthlyGoal(Number(newGoal));
                            supabase.from('settings').upsert({ key: 'monthly_goal', value: Number(newGoal) });
                          }
                        }} className="text-[10px] font-bold text-accent hover:underline cursor-pointer">Edit Target</button>
                      </div>

                      {/* The Gauge (SVG) */}
                      <div className="relative w-40 h-40 lg:w-48 lg:h-48">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100 dark:text-gray-700" />
                          <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="12" fill="transparent"
                            strokeDasharray="283"
                            strokeDashoffset={Math.max(0, 283 - (283 * (Math.min(100, (wonRevenue / monthlyGoal) * 100)) / 100))}
                            strokeLinecap="round" className="text-accent transition-all duration-1000 ease-out" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl lg:text-4xl font-black text-text-main tracking-tighter">
                            {Math.round((wonRevenue / monthlyGoal) * 100)}%
                          </span>
                          <span className="text-[10px] font-bold text-text-muted mt-1 uppercase">Allocated</span>
                        </div>
                      </div>

                      <div className="mt-4 text-center">
                        <p className="text-2xl font-black text-text-main">{formatCurrency(wonRevenue)}</p>
                        <p className="text-[10px] font-bold text-text-muted">of {formatCurrency(monthlyGoal)} Goal</p>
                      </div>
                    </div>

                    {/* RIGHT: INSIGHTS & METRICS */}
                    <div className="flex-[1.5] flex flex-col justify-center gap-6">
                      {/* Insight Banner */}
                      <div className="bg-surface/50 rounded-2xl p-4 border border-white/50 shadow-sm backdrop-blur-sm">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-warm-blue/10 text-warm-blue rounded-xl shrink-0"><Sparkles size={18} /></div>
                          <div>
                            <h4 className="font-bold text-sm text-text-main mb-1">AI Sales Forecast</h4>
                            <p className="text-xs text-text-muted leading-relaxed">
                              Based on probability, projected landing: <span className="text-text-main font-black underline decoration-accent/30">{formatCurrency(wonRevenue + (deals.reduce((acc, d) => d.stage !== 'won' && d.stage !== 'lost' ? acc + (d.value * (d.probability / 100)) : acc, 0)))}</span>.
                              {(wonRevenue + (deals.reduce((acc, d) => d.stage !== 'won' && d.stage !== 'lost' ? acc + (d.value * (d.probability / 100)) : acc, 0))) > monthlyGoal
                                ? <span className="text-warm-green font-bold block mt-1"> 🚀 You are on track to exceed target!</span>
                                : <span className="text-warm-red font-bold block mt-1"> ⚠️ Focus on &apos;Closing&apos; stage to bridge gap.</span>}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Metric Bars */}
                      <div className="space-y-5 px-1">
                        <div>
                          <div className="flex justify-between text-[10px] font-bold mb-2">
                            <span className="flex items-center gap-2 uppercase tracking-wide text-text-muted"><Activity size={12} /> Total Pipeline</span>
                            <span className="text-text-main text-xs">{formatCurrency(totalPipeline)}</span>
                          </div>
                          <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-warm-blue rounded-full transition-all duration-1000" style={{ width: '100%' }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-bold mb-2">
                            <span className="flex items-center gap-2 uppercase tracking-wide text-text-muted"><Target size={12} /> Target Gap</span>
                            <span className="text-warm-red text-xs">{formatCurrency(Math.max(0, monthlyGoal - wonRevenue))}</span>
                          </div>
                          <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-warm-red/80 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (Math.max(0, monthlyGoal - wonRevenue) / monthlyGoal) * 100)}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-8 h-full">
                  <h3 className="font-black text-lg mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-accent" /> วิเคราะห์กรวยการขาย (Funnel)</h3>
                  <div className="space-y-1">
                    {funnelStats.map((f, idx) => {
                      const stage = stages.find(s => s.id === f.id);
                      const widths = [100, 85, 70, 55, 40];
                      return (
                        <div key={f.id} className="flex items-center gap-4 h-10">
                          <span className="w-20 text-[9px] font-black text-text-muted uppercase text-right truncate">{stage?.title}</span>
                          <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative">
                            <div className="absolute inset-y-0 left-0 bg-accent/60 rounded-r-lg" style={{ width: `${widths[idx]}%` }}></div>
                            <span className="absolute inset-0 flex items-center px-3 text-[10px] font-black text-white">{f.count} Deals</span>
                          </div>
                          <span className="w-24 text-[10px] font-black text-right">{formatCurrency(f.value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <div className="grid grid-cols-1 gap-6">
                  <Card className="p-6">
                    <h3 className="font-black text-xs uppercase mb-4 flex items-center gap-2"><Trophy size={14} /> Top Active Ops</h3>
                    <div className="space-y-2">
                      {memoFilteredDeals.filter(d => d.stage !== 'won' && d.stage !== 'lost').sort((a, b) => b.value - a.value).slice(0, 3).map(d => (
                        <div key={d.id} onClick={() => handleDealClick(d)} className="flex items-center justify-between p-2 hover:bg-bg/50 rounded-xl cursor-pointer">
                          <div><p className="text-xs font-black">{d.title}</p><p className="text-[9px] text-text-muted uppercase">{d.company}</p></div>
                          <p className="text-xs font-black text-accent">{formatCurrency(d.value)}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card className="p-6 bg-red-50/10">
                    <h3 className="font-black text-xs uppercase mb-4 flex items-center gap-2"><XCircle size={14} /> Loss Insights</h3>
                    <div className="space-y-2">
                      {Object.entries(deals.filter(d => d.stage === 'lost').reduce((acc, d) => { const r = d.lostReason || 'Other'; acc[r] = (acc[r] || 0) + 1; return acc; }, {})).slice(0, 2).map(([r, c]) => (
                        <div key={r} className="flex items-center justify-between text-[10px] font-bold">
                          <span className="uppercase">{r}</span>
                          <span className="text-red-500">{c} Cases</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="bg-surface rounded-[40px] shadow-clay-lg border border-white/60 overflow-hidden animate-in fade-in duration-500 max-w-6xl mx-auto">
              <div className="p-8 border-b border-black/5 flex justify-between items-center bg-bg/20">
                <div>
                  <h2 className="text-2xl font-black text-text-main mb-1">Customer Master</h2>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Grouping all deals by unique company name</p>
                </div>
                <div className="px-4 py-2 bg-white rounded-2xl shadow-clay-inner border border-black/5 text-center">
                  <p className="text-[9px] font-black text-text-muted uppercase">Entities</p>
                  <p className="text-xl font-black text-accent">{customerMaster.length}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-bg/40 text-text-muted font-black text-[10px] uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-5">Company & Contact</th>
                      <th className="px-8 py-5">Summary Status</th>
                      <th className="px-8 py-5">Lifetime Value (LTV)</th>
                      <th className="px-8 py-5 text-right">View History</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {customerMaster.map((data) => (
                      <React.Fragment key={data.name}>
                        <tr onClick={() => setExpandedCompany(expandedCompany === data.name ? null : data.name)} className={`hover:bg-bg/20 cursor-pointer group ${expandedCompany === data.name ? 'bg-accent/5' : ''}`}>
                          <td className="px-8 py-5">
                            <p className="font-black text-text-main text-base group-hover:text-accent">{data.name}</p>
                            <p className="text-xs font-bold text-text-muted">{data.contact}</p>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-[10px] font-black uppercase px-3 py-1 bg-surface border rounded-lg shadow-clay-inner">
                              {data.status} ({data.deals.length} deals)
                            </span>
                          </td>
                          <td className="px-8 py-5 font-black text-text-main text-lg">{formatCurrency(data.ltv)}</td>
                          <td className="px-8 py-5 text-right"><ChevronRight size={18} className={expandedCompany === data.name ? 'rotate-90 transition-transform' : ''} /></td>
                        </tr>
                        {expandedCompany === data.name && (
                          <tr>
                            <td colSpan="4" className="bg-bg/40 p-6">
                              <div className="grid grid-cols-1 gap-2">
                                {data.deals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(deal => (
                                  <div key={deal.id} onClick={(e) => { e.stopPropagation(); setSelectedDeal(deal); }} className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-clay-sm border hover:border-accent cursor-pointer transition-all">
                                    <div>
                                      <p className="font-bold text-sm text-text-main">{deal.title}</p>
                                      <p className="text-[9px] font-bold text-text-muted uppercase">{formatDate(deal.createdAt)} • {deal.stage}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-black text-accent">{formatCurrency(deal.value)}</p>
                                      <p className="text-[8px] font-bold text-accent uppercase">View Detail</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
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
      {selectedDeal && (
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

                    {selectedDeal.stage === 'lost' && (
                      <div className="bg-warm-red/10 p-4 rounded-2xl border border-warm-red/20 shadow-clay-inner">
                        <label className="text-xs font-bold text-warm-red uppercase flex items-center mb-1"><XCircle size={14} className="mr-2" /> Lost Reason</label>
                        <p className="text-base text-warm-red-dark font-bold">{selectedDeal.lostReason}</p>
                      </div>
                    )}
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

                  {selectedDeal.stage !== 'lost' && selectedDeal.stage !== 'won' && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <button onClick={() => setIsLostModalOpen(true)} className="w-full py-1.5 border border-red-100 text-red-500 rounded-lg hover:bg-red-50 text-[10px] font-black uppercase tracking-wider transition-colors">Mark as Lost</button>
                    </div>
                  )}
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
      )}

      {/* Mark Lost Modal */}
      {isLostModalOpen && (
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
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-bg/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl w-full max-w-md shadow-clay-lg p-8 border border-white/50">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black text-text-main flex items-center"><FileSpreadsheet className="mr-3 text-warm-green" size={28} />Import Data</h3><button onClick={() => setIsImportModalOpen(false)}><X size={24} className="text-text-muted hover:text-warm-red" /></button></div>
            <div className="space-y-4">
              <Button variant="outline" fullWidth onClick={downloadTemplate} icon={Download}>ดาวน์โหลดแบบฟอร์ม (Template)</Button>
              <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current.click()}>
                <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                {importStatus === 'processing' ? (<div className="flex flex-col items-center text-accent"><Loader2 className="animate-spin mb-2" size={32} /><span>Creating data...</span></div>) : importStatus?.startsWith('success') ? (<div className="flex flex-col items-center text-warm-green-dark"><CheckCircle2 className="mb-2" size={32} /><span>Success! {importStatus.split(':')[1]} items imported.</span></div>) : importStatus === 'error' ? (<div className="flex flex-col items-center text-warm-red-dark"><AlertCircle className="mb-2" size={32} /><span>Error reading CSV.</span></div>) : (<div className="flex flex-col items-center text-text-muted"><Upload className="mb-2" size={32} /><span className="font-medium">Click to upload .CSV</span></div>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Deal Modal */}
      {isModalOpen && (
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
      )}

      {/* Move Deal Modal (Tablet/Mobile Friendly) */}
      {movingDeal && (
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
      )}
    </div>
  );
}

export default App;