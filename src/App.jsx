import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Users, Plus, Search,
  Building2, DollarSign, Trophy, X, Loader2, Database, Menu,
  CheckCircle2, Upload, Download, FileSpreadsheet, AlertCircle,
  FileText, CheckSquare, MessageSquare, Trash2, XCircle, Clock, ArrowRight,
  Cpu, Server, HardDrive, ChevronRight, RotateCcw,
  Zap, Signal, Target, Sparkles, Wand2, TrendingUp, AlertTriangle, Pencil, Save,
  Sun, Moon, CheckSquare as CheckSquareIcon, Filter, Activity, Info, Phone, Calendar, CircleDot
} from 'lucide-react';
import SolutionLayout from './components/solution-designer/SolutionLayout';
import MonthlyPipeline from './components/pipeline/MonthlyPipeline';
import TeamDashboard from './components/team/TeamDashboard';
import CommandCenter from './components/dashboard/CommandCenter';
import PDFImporter from './components/pipeline/PDFImporter';
import { supabase } from './utils/supabase';

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

const ActionOrb = ({ deal, onClick }) => (
  <div className="fixed bottom-40 left-8 z-[60] group cursor-pointer animate-bounce">
    <div className="zenith-orb w-14 h-14 rounded-full flex items-center justify-center ring-4 ring-gold/20">
      <AlertTriangle size={24} className="text-white" />
      <div className="absolute left-16 bg-surface p-3 rounded-2xl border border-white/20 w-56 opacity-0 group-hover:opacity-100 transition-opacity whitespace-pre-wrap pointer-events-none">
        <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">Critical Orchestration</p>
        <p className="text-xs font-bold text-white mb-2">{deal.title}</p>
        <button onClick={() => onClick(deal)} className="w-full py-1.5 bg-amber-500 text-white text-[10px] font-black rounded-lg">RESPOND NOW</button>
      </div>
    </div>
  </div>
);

const Card = ({ children, className = '' }) => (
  <div className={`bg-surface rounded-3xl shadow-clay-md border border-white/60 ${className}`}>
    {children}
  </div>
);

// --- Utilities ---
const daysSince = (dateStr) => Math.floor((Date.now() - new Date(dateStr || Date.now())) / 86400000);
const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount);
const formatDate = (isoString) => isoString ? new Date(isoString).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

// --- Components ---
const App = () => {
  // const isDemoMode = true; // FORCE DEMO MODE (Local Storage)
  // const isDemoMode = false; // Real Supabase Mode
  // ---/ State /---
  const [activeTab, setActiveTab] = useState('command'); // 'command' | 'pipeline' | 'team' | 'customers' | 'activity' | 'spec-setup' | 'tools' | 'solution'
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
  const [isPdfVerificationModalOpen, setIsPdfVerificationModalOpen] = useState(false);
  const [pdfExtractedData, setPdfExtractedData] = useState(null);

  // UX State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(''); // State for date filter
  const [filterValueMin, setFilterValueMin] = useState('');
  const [filterValueMax, setFilterValueMax] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [battlePlan, setBattlePlan] = useState(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [zenithMode, setZenithMode] = useState(() => localStorage.getItem('zenithMode') === 'true');
  const [strategicMandates, setStrategicMandates] = useState([]);
  const [isGeneratingMandates, setIsGeneratingMandates] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  // Wait, I see selectedDealForMove on line 177 in previous reads (Step 269). Let's use that if it exists.
  const [movingDeal, setMovingDeal] = useState(null);
  const fileInputRef = useRef(null);
  const [importStatus, setImportStatus] = useState(null);
  const [visibleStages, setVisibleStages] = useState(['lead', 'contact', 'proposal', 'negotiation', 'won', 'lost']);
  const [globalActivities, setGlobalActivities] = useState([]);

  // Persist Goal to Supabase
  const [monthlyGoal, setMonthlyGoal] = useState(10000000);
  const [expandedCompany, setExpandedCompany] = useState(null);

  // Team Members Configuration
  const [teamMembers] = useState([
    { id: 'leader', name: 'ผม (Leader)', role: 'หัวหน้าทีม', goal: 7000000, color: '#7C6AF3' },
    { id: 'off', name: 'น้องออฟ', role: 'ทีมงาน', goal: 3000000, color: '#F97316' },
  ]);

  // Pipeline filter by assignee

  const [customerOwnerFilter, setCustomerOwnerFilter] = useState('all');

  // Zenith Mode Effect
  useEffect(() => {
    if (zenithMode) {
      document.documentElement.classList.add('zenith');
      localStorage.setItem('zenithMode', 'true');
    } else {
      document.documentElement.classList.remove('zenith');
      localStorage.setItem('zenithMode', 'false');
    }
  }, [zenithMode]);

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

  const { filteredDeals: memoFilteredDeals, goldenList, totalPipeline, wonRevenue, funnel: funnelStats } = masterData;


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

  const handleAddDeal = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const dealDate = formData.get('date') ? new Date(formData.get('date')).toISOString() : new Date().toISOString();
    const newDeal = {
      title: formData.get('title'),
      company: formData.get('company'),
      contact: formData.get('contact'),
      value: Number(formData.get('value')),
      assigned_to: formData.get('assigned_to') || 'leader',
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

  const handlePDFExtracted = (data) => {
    setPdfExtractedData(data);
    setIsImportModalOpen(false);
    setIsPdfVerificationModalOpen(true);
  };

  const handleGenerateBattlePlan = async () => {
    setIsGeneratingPlan(true);
    const urgentDeals = deals.filter(d => !['won', 'lost'].includes(d.stage) && daysSince(d.lastActivity || d.createdAt) >= 7).slice(0, 5);
    const hotDeals = deals.filter(d => d.stage === 'negotiation' || (d.probability >= 60)).slice(0, 5);
    const wonCount = deals.filter(d => d.stage === 'won' && new Date(d.createdAt).getMonth() === new Date().getMonth()).length;

    const dataSnapshot = {
      urgent: urgentDeals.map(d => ({ title: d.title, company: d.company, value: d.value, daysIdle: daysSince(d.lastActivity || d.createdAt) })),
      hot: hotDeals.map(d => ({ title: d.title, company: d.company, value: d.value, prob: d.probability })),
      wonMonth: wonCount,
      goal: monthlyGoal
    };

    const prompt = `You are a Senior Sales Leader. Analyze these deals and provide a high-energy "Battle Plan" for today in Thai language.
    Focus on:
    1. Which 2-3 specific deals to close NOW and how (Closing Strategy).
    2. Which idle deals need a "Wake Up Call" (Re-engagement).
    3. Motivation for the team to hit the goal.
    
    Data: ${JSON.stringify(dataSnapshot)}
    
    Return ONLY a JSON object: { "plan": "The text of the plan in Thai, use professional yet energetic tone." }`;

    const result = await callGeminiAPI(prompt);
    if (result && result.plan) {
      setBattlePlan(result.plan);
    }
    setIsGeneratingPlan(false);
  };

  const handleGenerateStrategicMandates = async () => {
    setIsGeneratingMandates(true);
    const activeDeals = deals.filter(d => !['won', 'lost'].includes(d.stage))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const context = activeDeals.map(d => `${d.title} (฿${d.value.toLocaleString()}) at ${d.stage} stage, last action ${daysSince(d.lastActivity)}d ago`);

    const prompt = `Analyze these top 10 CRM deals and provide 3 high-impact "Strategic Mandates" to win the market. 
    Be bold, professional, and use Thai language. 
    Context: ${context.join('; ')}
    Return ONLY a JSON array of objects: [{ "id": 1, "mandate": "Short bold title", "desc": "Actionable advice", "urgency": "high|medium|low" }]`;

    const result = await callGeminiAPI(prompt);
    if (result && Array.isArray(result)) {
      setStrategicMandates(result);
    }
    setIsGeneratingMandates(false);
  };

  const handleSavePDFDeal = async (e) => {
    e.preventDefault();
    if (!pdfExtractedData) return;

    // Convert to deal format
    const formData = new FormData(e.target);
    const dealDate = formData.get('date') ? new Date(formData.get('date')).toISOString() : new Date().toISOString();

    // Auto follow-up 2 days later
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 2);

    const newDeal = {
      title: formData.get('title'),
      company: formData.get('company'),
      contact: formData.get('contact'),
      value: Number(formData.get('value')),
      assigned_to: formData.get('assigned_to') || 'leader',
      stage: 'proposal',
      probability: 40,
      lastActivity: new Date().toISOString(),
      createdAt: dealDate,
      notes: [{
        id: Date.now(),
        text: `📄 นำเข้าอัตโนมัติจากใบเสนอราคา PDF: ${pdfExtractedData.sourceFilename || 'ไม่ทราบชื่อไฟล์'}`,
        date: new Date().toISOString(),
        user: 'System'
      }],
      tasks: [{
        id: Date.now() + 1,
        text: '📞 ติดตามผลการเสนอราคา (ส่งไปเมื่อ 2 วันก่อน)',
        date: followUpDate.toISOString(),
        completed: false
      }]
    };

    try {
      const { data, error } = await supabase.from('deals').insert([newDeal]).select();
      if (!error && data) {
        setDeals(prev => [data[0], ...prev]);
        setIsPdfVerificationModalOpen(false);
        setPdfExtractedData(null);
        showToast("✓ นำเข้าดีลจาก PDF และสร้างงานติดตามแล้ว", "success");
      } else {
        console.error(error);
        showToast("x ไม่สามารถสร้างดีลได้", "error");
      }
    } catch (error) {
      console.error(error);
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

  // --- Advanced Client Analytics (Logic อย่ากั๊ก) ---
  const vipClients = useMemo(() => {
    const clients = {};
    const now = new Date();

    deals.forEach(deal => {
      if (!deal.company) return;
      const name = deal.company.trim();
      const nameKey = name.toLowerCase();

      if (!clients[nameKey]) {
        clients[nameKey] = {
          id: nameKey,
          name: name,
          contact: deal.contact || 'Unknown',
          firstSeen: new Date(deal.createdAt),
          lastSeen: new Date(deal.createdAt),
          totalDeals: 0,
          wonDeals: 0,
          wonValue: 0,
          activeCount: 0,
          activeValue: 0,
          products: new Set()
        };
      }

      const client = clients[nameKey];
      const dealDate = new Date(deal.createdAt);

      // Timestamps
      if (dealDate < client.firstSeen) client.firstSeen = dealDate;
      if (dealDate > client.lastSeen) client.lastSeen = dealDate;

      // Aggregates
      client.totalDeals++;
      if (deal.stage === 'won') {
        client.wonDeals++;
        client.wonValue += Number(deal.value);
      } else if (deal.stage !== 'lost') {
        client.activeCount++;
        client.activeValue += Number(deal.value);
      }

      // Track potential products from title
      if (deal.title) client.products.add(deal.title.split(' ')[0]);
    });

    return Object.values(clients).map(c => {
      const daysSinceLast = Math.round((now - c.lastSeen) / (1000 * 60 * 60 * 24));
      const winRate = c.totalDeals > 0 ? Math.round((c.wonDeals / c.totalDeals) * 100) : 0;
      const avgDealSize = c.wonDeals > 0 ? c.wonValue / c.wonDeals : 0;

      // Tier Logic
      let tier = { name: 'Silver', color: 'bg-slate-100 text-slate-600', gradient: 'from-slate-50 to-slate-100' };
      if (c.wonValue >= 1000000) tier = { name: 'Platinum', color: 'bg-indigo-100 text-indigo-700', gradient: 'from-indigo-50 to-indigo-100' };
      else if (c.wonValue >= 500000) tier = { name: 'Gold', color: 'bg-yellow-100 text-yellow-700', gradient: 'from-yellow-50 to-yellow-100' };

      // Health Logic
      let health = { label: 'Neutral', color: 'text-gray-500', bg: 'bg-gray-100' };
      if (c.activeCount > 0) health = { label: 'Active', color: 'text-green-600', bg: 'bg-green-100' };
      else if (daysSinceLast > 90) health = { label: 'Churn Risk', color: 'text-red-600', bg: 'bg-red-100' };
      else if (daysSinceLast < 30) health = { label: 'Engaged', color: 'text-blue-600', bg: 'bg-blue-100' };

      return { ...c, daysSinceLast, winRate, avgDealSize, tier, health };
    }).sort((a, b) => b.wonValue - a.wonValue);
  }, [deals]);

  // Render Views
  // Render Views
  if (!isDbReady) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-accent" size={48} /></div>;
  }

  return (
    <div className={`flex flex-col xl:flex-row h-screen w-screen bg-bg font-sans text-text-main overflow-hidden selection:bg-accent/30 transition-colors duration-500 ${zenithMode ? 'zenith' : ''}`} style={{ maxWidth: '100vw', maxHeight: '100vh' }}>
      {/* Zenith Mode Toggle Floating Button */}
      <button
        onClick={() => setZenithMode(!zenithMode)}
        className={`fixed bottom-24 right-8 w-14 h-14 rounded-full flex items-center justify-center z-[60] shadow-2xl transition-all hover:scale-110 active:scale-95 ${zenithMode ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}
        title="Toggle Zenith World-Class Mode"
      >
        <Zap size={24} className={zenithMode ? 'animate-pulse' : ''} />
      </button>

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
          {/* ─── SECTION: SALES ─────────────────────────────── */}
          <p className="px-3 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 opacity-70">SALES</p>
          {[
            { id: 'overview', icon: '📈', label: 'Strategic Overview' },
            { id: 'command', icon: '🏠', label: 'Command Center' },
            { id: 'pipeline', icon: '🗂️', label: 'Sales Pipeline' },
            { id: 'team', icon: '🏆', label: 'Team Dashboard' },
            { id: 'customers', icon: '🤝', label: 'Customer Master' },
            { id: 'activity', icon: '📋', label: 'Activity Feed' },
          ].map(({ id, icon, label }) => {
            const isActive = activeTab === id;
            // Red badge: stale deals
            const staleDealCount = id === 'pipeline'
              ? deals.filter(d => !['won', 'lost'].includes(d.stage) && Math.floor((Date.now() - new Date(d.lastActivity || d.createdAt)) / 86400000) >= 7).length
              : id === 'command'
                ? deals.filter(d => !['won', 'lost'].includes(d.stage) && Math.floor((Date.now() - new Date(d.lastActivity || d.createdAt)) / 86400000) >= 7).length
                : 0;
            return (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 relative ${isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                  }`}
              >
                <span className="text-base leading-none">{icon}</span>
                <span className="flex-1 text-left tracking-wide">{label}</span>
                {staleDealCount > 0 && (
                  <span className={`ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                    }`}>{staleDealCount}</span>
                )}
              </button>
            );
          })}

          {/* ─── SECTION: TOOLS ─────────────────────────────── */}
          <div className="my-3 border-t border-gray-100" />
          <p className="px-3 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 opacity-70">TOOLS</p>
          {[
            { id: 'spec-setup', icon: '🖥️', label: 'Spec AI' },
            { id: 'solution', icon: '🏗️', label: 'Solution Designer' },
            { id: 'tools', icon: '🔧', label: 'IT Tools' },
          ].map(({ id, icon, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-medium transition-all ${isActive ? 'bg-gray-100 text-gray-800 font-bold' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                  }`}
              >
                <span className="text-sm leading-none">{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Team Progress Mini-Bar */}
        {(() => {
          const now = new Date();
          const teamWon = deals
            .filter(d => d.stage === 'won' && new Date(d.createdAt).getMonth() === now.getMonth() && new Date(d.createdAt).getFullYear() === now.getFullYear())
            .reduce((s, d) => s + (d.value || 0), 0);
          const pct = Math.round(Math.min(100, (teamWon / monthlyGoal) * 100));
          return (
            <div className="px-4 pb-2">
              <div className="bg-surface/80 rounded-2xl p-3 border border-white/40 shadow-clay-sm">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-black text-text-muted uppercase tracking-widest">🎯 ทีม {pct}%</span>
                  <span className="text-xs font-bold text-text-main">{formatCurrency(teamWon)}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-accent to-orange-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex gap-2 mt-2">
                  {teamMembers.map(m => {
                    const mWon = deals
                      .filter(d => d.assigned_to === m.id && d.stage === 'won' && new Date(d.createdAt).getMonth() === now.getMonth() && new Date(d.createdAt).getFullYear() === now.getFullYear())
                      .reduce((s, d) => s + (d.value || 0), 0);
                    const mPct = Math.round(Math.min(100, (mWon / m.goal) * 100));
                    return (
                      <div key={m.id} className="flex-1">
                        <div className="flex items-center gap-1 mb-0.5">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                          <span className="text-[8px] font-bold text-text-muted truncate">{m.name.split(' ')[0]}</span>
                          <span className="text-[8px] font-black ml-auto" style={{ color: m.color }}>{mPct}%</span>
                        </div>
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${mPct}%`, backgroundColor: m.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

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
      <main className="flex-1 flex flex-col h-full w-full relative overflow-hidden bg-bg">
        <header className="h-20 bg-bg/50 backdrop-blur-sm flex justify-between items-center px-4 md:px-6 xl:px-8 flex-shrink-0 z-20 sticky top-0">
          <div className="flex items-center gap-3">
            {/* Show Menu button on Mobile AND Tablet (xl:hidden) */}
            <button onClick={() => setIsSidebarOpen(true)} className="xl:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <Menu size={24} />
            </button>
            <h1 className="text-lg md:text-xl font-bold text-gray-800 truncate">
              {activeTab === 'pipeline' ? 'Sales Pipeline' :
                activeTab === 'overview' ? 'Sales Overview' :
                  activeTab === 'dashboard' ? 'Dashboard Analysis' :
                    activeTab === 'team' ? '🏆 Team Dashboard' :
                      activeTab === 'customers' ? 'Customer Master' :
                        activeTab === 'calendar' ? 'Calendar View' :
                          activeTab === 'activity' ? 'Activity Feed' :
                            activeTab === 'command' ? 'Command Center' :
                              activeTab === 'spec-setup' ? 'Smart Spec Recommendation' :
                                activeTab === 'solution' ? 'Enterprise Solution Designer' : 'Professional IT Tools'}
            </h1>
            {loading && <Loader2 size={16} className="animate-spin text-accent hidden md:block" />}
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {/* Live Team Status Pill */}
            {(() => {
              const now = new Date();
              const teamWon = deals
                .filter(d => d.stage === 'won' && new Date(d.createdAt).getMonth() === now.getMonth() && new Date(d.createdAt).getFullYear() === now.getFullYear())
                .reduce((s, d) => s + (d.value || 0), 0);
              const teamPct = Math.round(Math.min(100, (teamWon / monthlyGoal) * 100));
              return (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-surface rounded-xl shadow-clay-sm border border-white/60 text-xs font-black">
                  <div className="flex items-center gap-1">
                    <span className="text-text-muted">🏆</span>
                    <span className="text-text-main">{teamPct}%</span>
                  </div>
                  <div className="w-px h-3 bg-gray-200" />
                  {teamMembers.map(m => {
                    const mWon = deals
                      .filter(d => d.assigned_to === m.id && d.stage === 'won' && new Date(d.createdAt).getMonth() === now.getMonth() && new Date(d.createdAt).getFullYear() === now.getFullYear())
                      .reduce((s, d) => s + (d.value || 0), 0);
                    const mPct = Math.round(Math.min(100, (mWon / m.goal) * 100));
                    return (
                      <div key={m.id} className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-white font-black text-[10px]" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                        <span style={{ color: m.color }}>{mPct}%</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${visibleStages.includes(s.id) ? 'bg-accent text-white shadow-clay-btn' : 'text-text-muted hover:bg-bg'}`}
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
            <Button
              onClick={() => setIsImportModalOpen(true)}
              icon={Upload}
              variant="secondary"
              className="whitespace-nowrap hidden lg:flex"
            >
              Import Data
            </Button>
            <Button onClick={() => setIsModalOpen(true)} icon={Plus} variant="primary" className="whitespace-nowrap"><span className="hidden md:inline">New Deal</span><span className="md:hidden">Add</span></Button>
          </div>
        </header>

        {/* Bulk Actions Bar - ย้ายมาไว้ข้างนอกให้เห็นชัดเจนขึ้น */}
        {bulkMode && selectedDealIds.size > 0 && (
          <div className="bg-accent text-white px-4 md:px-6 xl:px-8 py-3 flex items-center justify-between z-30 shadow-lg">
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

        {/* Main Content Area - จัดระเบียบให้ทุกหน้าอยู่ใน Container เดียวกัน */}
        <div className={`flex-1 bg-bg p-4 md:p-6 xl:p-8 ${activeTab === 'pipeline' ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto overflow-x-hidden'}`}>
          {activeTab === 'command' && (
            <CommandCenter
              deals={deals}
              teamMembers={teamMembers}
              monthlyGoal={monthlyGoal}
              onDealClick={(deal) => { setSelectedDeal(deal); setIsEditingDetails(true); }}
              onAddDeal={() => setIsModalOpen(true)}
              onGeneratePlan={handleGenerateBattlePlan}
              isGeneratingPlan={isGeneratingPlan}
              battlePlan={battlePlan}
              zenithMode={zenithMode}
              focusMode={focusMode}
              setFocusMode={setFocusMode}
              strategicMandates={strategicMandates}
              isGeneratingMandates={isGeneratingMandates}
              onGenerateMandates={handleGenerateStrategicMandates}
            />
          )}

          {activeTab === 'pipeline' && (
            <MonthlyPipeline
              deals={deals}
              teamMembers={teamMembers}
              monthlyTarget={monthlyGoal}
              onDealClick={(deal) => { setSelectedDeal(deal); setIsEditingDetails(true); }}
              onUpdateDeal={handleUpdateDeal}
              onAddDeal={() => setIsModalOpen(true)}
              visibleStages={visibleStages}
              zenithMode={zenithMode}
              focusMode={focusMode}
            />
          )}
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
                              <div key={i} className="text-xs bg-warm-yellow/20 text-warm-yellow-dark px-1 py-0.5 rounded truncate" title={task.text}>
                                {task.text}
                              </div>
                            ))}
                            {tasks.length > 2 && (
                              <div className="text-xs text-text-muted">+{tasks.length - 2} more</div>
                            )}
                          </div>
                        )}
                        {dealsOnDate.length > 0 && (
                          <div className="space-y-1 mt-1">
                            {dealsOnDate.slice(0, 1).map((deal, i) => (
                              <div key={i} className="text-xs font-bold bg-accent/20 text-accent px-1.5 py-0.5 rounded truncate" title={deal.title}>
                                {deal.title}
                              </div>
                            ))}
                            {dealsOnDate.length > 1 && (
                              <div className="text-xs text-text-muted">+{dealsOnDate.length - 1} deal</div>
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
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black text-text-main mb-2">Action Center</h2>
                  <p className="text-text-muted font-medium">ศูนย์รวมการแจ้งเตือนและกิจกรรมที่ต้องทำ (AI Recommended Actions)</p>
                </div>
                <div className="bg-white/50 px-4 py-2 rounded-2xl shadow-clay-inner border border-white flex gap-4">
                  <div className="text-center">
                    <p className="text-xs font-black text-text-muted uppercase">Pending Tasks</p>
                    <p className="text-xl font-black text-text-main">{deals.reduce((acc, d) => acc + (d.tasks || []).filter(t => !t.completed).length, 0)}</p>
                  </div>
                  <div className="w-px h-8 bg-black/5"></div>
                  <div className="text-center">
                    <p className="text-xs font-black text-text-muted uppercase">Urgent</p>
                    <p className="text-xl font-black text-warm-red">{deals.reduce((acc, d) => acc + (d.tasks || []).filter(t => !t.completed && new Date(t.date) < new Date()).length, 0)}</p>
                  </div>
                </div>
              </div>

              {/* 1. AI Smart Alerts Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                  <Zap size={16} className="text-accent" /> AI Insights & Alerts
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Overdue Tasks Alert */}
                  {deals.some(d => d.tasks?.some(t => !t.completed && new Date(t.date) < new Date())) && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                      <div className="p-2 bg-white rounded-xl text-red-500 shadow-sm"><AlertCircle size={20} /></div>
                      <div className="flex-1">
                        <h4 className="font-bold text-red-900 text-sm">Overdue Tasks Detected</h4>
                        <p className="text-xs text-red-700 mt-1">You have tasks that missed their deadline. Please review them immediately.</p>
                        <button onClick={() => setFilterDate(new Date().toISOString().split('T')[0])} className="mt-2 text-xs font-black bg-white text-red-600 px-3 py-1.5 rounded-lg shadow-sm hover:bg-red-500 hover:text-white transition-all uppercase">View Tasks</button>
                      </div>
                    </div>
                  )}

                  {/* Stalled Deals Alert */}
                  {deals.some(d => {
                    const lastActive = new Date(d.lastActivity || d.createdAt);
                    const diffDays = (new Date() - lastActive) / (1000 * 60 * 60 * 24);
                    return d.stage !== 'won' && d.stage !== 'lost' && diffDays > 7;
                  }) && (
                      <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3">
                        <div className="p-2 bg-white rounded-xl text-orange-500 shadow-sm"><Clock size={20} /></div>
                        <div className="flex-1">
                          <h4 className="font-bold text-orange-900 text-sm">Stalled Deals Warning</h4>
                          <p className="text-xs text-orange-700 mt-1">Some deals haven&apos;t had activity for over 7 days. Consider sending a follow-up.</p>
                          <button onClick={() => setActiveTab('pipeline')} className="mt-2 text-xs font-black bg-white text-orange-600 px-3 py-1.5 rounded-lg shadow-sm hover:bg-orange-500 hover:text-white transition-all uppercase">Go to Pipeline</button>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* 2. Unified Feed (Tasks + Activities) */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-text-muted uppercase tracking-widest flex items-center gap-2 mt-4">
                  <Activity size={16} className="text-text-muted" /> Recent Activity Log
                </h3>

                {globalActivities.length === 0 ? (
                  <Card className="p-12 text-center opacity-50">
                    <p className="font-bold text-text-muted">No recent activities recorded.</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {globalActivities.sort((a, b) => new Date(b.date) - new Date(a.date)).map((activity) => {
                      return (
                        <div key={activity.id} className="group flex gap-4 p-4 bg-white hover:bg-white/80 dark:bg-gray-900 border border-black/5 dark:border-white/5 rounded-2xl shadow-sm hover:shadow-clay-md transition-all">
                          <div className="flex-col items-center gap-2 hidden sm:flex">
                            <span className="text-xs font-black text-text-muted opacity-50">{new Date(activity.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                            <div className="w-px h-full bg-black/5 flex-1"></div>
                          </div>

                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/20 shadow-inner ${activity.type === 'note' ? 'bg-blue-100 text-blue-600' :
                            activity.type === 'task' ? (activity.completed ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600') :
                              activity.type === 'deal_created' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                            {activity.type === 'note' && <MessageSquare size={18} />}
                            {activity.type === 'task' && <CheckSquare size={18} />}
                            {activity.type === 'deal_created' && <Plus size={18} />}
                            {activity.type === 'deal_moved' && <ArrowRight size={18} />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h4 className="text-sm font-bold text-text-main">{activity.text}</h4>
                              <span className="text-[10px] font-bold text-text-muted whitespace-nowrap ml-2 bg-surface px-2 py-0.5 rounded-lg border border-black/5">{formatDate(activity.date)}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded text-white ${activity.type === 'task' ? 'bg-yellow-400' : 'bg-gray-400'
                                }`}>{activity.type}</span>
                              <span className="text-xs text-text-muted">for <b>{activity.dealTitle}</b> ({activity.company})</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="max-w-7xl mx-auto space-y-6 pb-20">
              {/* Clients Dashboard Header */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[24px] text-white shadow-clay-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:scale-110 transition-transform"></div>
                  <div className="relative z-10">
                    <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1">Total VIP Lifetime Value</p>
                    <h2 className="text-3xl font-black">{formatCurrency(vipClients.reduce((sum, c) => sum + c.wonValue, 0))}</h2>
                    <div className="mt-4 flex items-center gap-2 text-indigo-200 text-xs">
                      <TrendingUp size={14} /> <span>Across {vipClients.length} clients</span>
                    </div>
                  </div>
                </div>

                <Card className="p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><Target size={16} /></div>
                    <span className="text-xs font-bold text-text-muted uppercase">Avg Win Rate</span>
                  </div>
                  <p className="text-2xl font-black text-text-main">
                    {Math.round(vipClients.reduce((sum, c) => sum + c.winRate, 0) / (vipClients.length || 1))}%
                  </p>
                </Card>

                <Card className="p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><AlertTriangle size={16} /></div>
                    <span className="text-xs font-bold text-text-muted uppercase">Churn Risks</span>
                  </div>
                  <p className="text-2xl font-black text-warm-red">
                    {vipClients.filter(c => c.health.label === 'Churn Risk').length} Clients
                  </p>
                </Card>

                <Card className="p-6 flex flex-col justify-center bg-accent/5 border-accent/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center"><Zap size={16} /></div>
                    <span className="text-xs font-bold text-accent uppercase">Active Pipelines</span>
                  </div>
                  <p className="text-2xl font-black text-accent">
                    {vipClients.reduce((sum, c) => sum + c.activeCount, 0)} Deals
                  </p>
                </Card>
              </div>

              <div className="flex justify-between items-end px-2">
                <div>
                  <h2 className="text-2xl font-black text-text-main">Client Portfolio</h2>
                  <p className="text-text-muted text-sm font-medium">จัดการลูกค้าตามระดับความสำคัญและโอกาสการขาย</p>
                </div>
              </div>

              {/* VIP Client Cards */}
              <div className="grid grid-cols-1 gap-4">
                {vipClients.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20 filter grayscale">
                    <Users size={64} className="mb-4 text-text-muted" />
                    <p className="text-lg font-bold">No clients found. Close some deals!</p>
                  </div>
                )}

                {vipClients.map((client, idx) => (
                  <div key={client.id} className="group bg-white hover:bg-white/80 dark:bg-gray-900 rounded-[28px] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-clay-lg transition-all duration-300 relative overflow-hidden">
                    {/* Rank Indicator */}
                    <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-b from-gray-50 to-white border-r border-gray-100 flex flex-col items-center justify-center gap-1 z-10">
                      <span className="text-[10px] font-black uppercase text-gray-300 transform -rotate-90 origin-center w-20 text-center">Rank</span>
                      <span className={`text-2xl font-black ${idx < 3 ? 'text-accent scale-110' : 'text-gray-300'}`}>#{idx + 1}</span>
                    </div>

                    <div className="pl-20 pr-6 py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">

                      {/* Client Info */}
                      <div className="flex-1 min-w-[240px]">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-black text-text-main group-hover:text-accent transition-colors">{client.name}</h3>
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${client.tier.color}`}>{client.tier.name}</span>
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${client.health.bg} ${client.health.color}`}>{client.health.label}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-text-muted font-bold">
                          <div className="flex items-center gap-1.5"><Users size={14} className="opacity-50" /> {client.contact}</div>
                          <div className="flex items-center gap-1.5"><CheckCircle2 size={14} className="opacity-50 text-green-500" /> {client.wonDeals} Won</div>
                          <div className="flex items-center gap-1.5"><Clock size={14} className="opacity-50" /> Last seen {client.daysSinceLast} days ago</div>
                        </div>
                      </div>

                      {/* Performance Stats */}
                      <div className="flex items-center gap-8 lg:border-l lg:border-gray-100 lg:pl-8">
                        <div>
                          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">Lifetime Value</p>
                          <p className="text-xl font-black text-text-main">{formatCurrency(client.wonValue)}</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">Win Rate</p>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-accent rounded-full" style={{ width: `${client.winRate}%` }}></div>
                            </div>
                            <span className="text-sm font-bold">{client.winRate}%</span>
                          </div>
                        </div>
                        <div className="hidden xl:block">
                          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">Avg Deal</p>
                          <p className="text-sm font-bold text-text-main">{formatCurrency(client.avgDealSize)}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pl-4 border-l border-gray-100/50">
                        <button onClick={() => showToast(`Drafting email to ${client.name}...`)} className="p-3 rounded-xl bg-gray-50 text-text-muted hover:bg-accent hover:text-white transition-all shadow-sm"><MessageSquare size={16} /></button>
                        <button onClick={() => showToast(`Calling ${client.contact}...`)} className="p-3 rounded-xl bg-gray-50 text-text-muted hover:bg-green-500 hover:text-white transition-all shadow-sm"><Users size={16} /></button>
                        <button onClick={() => showToast(`Scheduled review for ${client.name}`)} className="px-4 py-3 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-2">
                          <Wand2 size={14} /> <span className="hidden xl:inline">Smart Plan</span>
                        </button>
                      </div>

                    </div>
                  </div>
                ))}
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
                    {goldenList.slice(0, 5).map(deal => {
                      const assignee = teamMembers.find(m => m.id === deal.assigned_to);
                      return (
                        <div key={deal.id} onClick={() => handleDealClick(deal)} className="p-2.5 bg-white/60 dark:bg-gray-800/60 rounded-xl shadow-sm border border-white/40 cursor-pointer hover:translate-x-1 transition-all">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[11px] font-black text-text-main truncate flex-1">{deal.title}</p>
                            {assignee && (
                              <div className="w-4 h-4 rounded-full flex items-center justify-center text-white font-black text-[8px] ml-1 flex-shrink-0" style={{ backgroundColor: assignee.color }}>
                                {assignee.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-accent">{formatCurrency(deal.value)}</span>
                            {assignee && <span className="text-xs text-text-muted">{assignee.name}</span>}
                          </div>
                        </div>
                      );
                    })}
                    {goldenList.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center opacity-40 py-4">
                        <Target size={24} className="mb-2" />
                        <p className="text-xs font-bold text-center">No targets in window</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-black text-text-muted mt-4 uppercase opacity-40 italic">Focus on &quot;Life-Changing Deals&quot;</p>
                </Card>

                <div className="lg:col-span-3 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-[32px] p-6 lg:p-8 shadow-clay-md border border-white/60 relative overflow-hidden group">
                  {/* Decorative Background Blob */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-accent/20 transition-all duration-700"></div>

                  <div className="flex flex-col md:flex-row gap-8 lg:gap-12 relative z-10 h-full">
                    {/* LEFT: MAIN GOAL GAUGE */}
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
                      <div className="flex justify-between w-full mb-2 px-4 max-w-[240px]">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Team Goal</span>
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

                      {/* Per-Member Mini Gauges */}
                      <div className="mt-4 w-full max-w-[240px] space-y-2">
                        {teamMembers.map(m => {
                          const now = new Date();
                          const mWon = deals
                            .filter(d => d.assigned_to === m.id && d.stage === 'won' && new Date(d.createdAt).getMonth() === now.getMonth() && new Date(d.createdAt).getFullYear() === now.getFullYear())
                            .reduce((s, d) => s + (d.value || 0), 0);
                          const mPct = Math.round(Math.min(100, (mWon / m.goal) * 100));
                          return (
                            <div key={m.id}>
                              <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-white font-black text-[8px]" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                                  <span className="text-[10px] font-bold text-text-main">{m.name}</span>
                                </div>
                                <span className="text-[10px] font-black" style={{ color: m.color }}>{formatCurrency(mWon)} / {mPct}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${mPct}%`, backgroundColor: m.color }} />
                              </div>
                            </div>
                          );
                        })}
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
            <div className="max-w-7xl mx-auto space-y-6 pb-20">
              {/* Header Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-black/5 shadow-sm flex items-center justify-between group hover:border-accent/30 transition-all">
                  <div>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Total Customers</p>
                    <h3 className="text-2xl font-black text-text-main group-hover:text-accent transition-colors">{vipClients.length}</h3>
                  </div>
                  <div className="p-3 bg-bg rounded-xl text-text-muted group-hover:bg-accent group-hover:text-white transition-colors"><Users size={20} /></div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-black/5 shadow-sm flex items-center justify-between group hover:border-accent/30 transition-all">
                  <div>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Active Buying</p>
                    <h3 className="text-2xl font-black text-text-main group-hover:text-green-500 transition-colors">{vipClients.filter(c => c.health.label === 'Active' || c.health.label === 'Engaged').length}</h3>
                  </div>
                  <div className="p-3 bg-bg rounded-xl text-text-muted group-hover:bg-green-500 group-hover:text-white transition-colors"><Zap size={20} /></div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-black/5 shadow-sm flex items-center justify-between group hover:border-accent/30 transition-all">
                  <div>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Avg Lifetime Value</p>
                    <h3 className="text-2xl font-black text-text-main group-hover:text-indigo-500 transition-colors">{formatCurrency(vipClients.reduce((sum, c) => sum + c.wonValue, 0) / (vipClients.length || 1))}</h3>
                  </div>
                  <div className="p-3 bg-bg rounded-xl text-text-muted group-hover:bg-indigo-500 group-hover:text-white transition-colors"><Trophy size={20} /></div>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-surface p-4 rounded-2xl shadow-clay-inner border border-white/60">
                <div>
                  <h2 className="text-xl font-black text-text-main flex items-center gap-2"><Users size={20} className="text-accent" /> Customer Master</h2>
                  <p className="text-xs font-medium text-text-muted">Manage all your customer relationships in one place.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  {/* Owner Filter */}
                  <div className="flex items-center gap-1 bg-bg rounded-xl p-1 shadow-clay-inner">
                    {[{ id: 'all', label: '👥 All' }, ...teamMembers.map(m => ({ id: m.id, label: m.name }))].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setCustomerOwnerFilter(opt.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${customerOwnerFilter === opt.id ? 'bg-white text-accent shadow-clay-sm' : 'text-text-muted hover:bg-white/60'
                          }`}
                      >{opt.label}</button>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-text-muted uppercase hidden md:inline">Sort by:</span>
                  <select className="bg-bg border-none text-xs font-bold rounded-lg px-3 py-2 focus:ring-accent cursor-pointer">
                    <option value="ltv">Lifetime Value (High-Low)</option>
                    <option value="recent">Recently Active</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Customer List (Cards) */}
              <div className="grid grid-cols-1 gap-4">
                {vipClients.filter(c =>
                  c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.contact.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((client) => {
                  // Determine owner: the member with most deals for this client
                  const clientDeals = deals.filter(d => d.company === client.name);
                  const ownerCounts = {};
                  clientDeals.forEach(d => { if (d.assigned_to) ownerCounts[d.assigned_to] = (ownerCounts[d.assigned_to] || 0) + 1; });
                  const ownerId = Object.entries(ownerCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
                  const owner = teamMembers.find(m => m.id === ownerId);
                  return (
                    <div key={client.id} className="group bg-white dark:bg-gray-900 rounded-[20px] border border-black/5 dark:border-white/5 shadow-sm hover:shadow-clay-md transition-all duration-300 overflow-hidden">
                      <div
                        onClick={() => setExpandedCompany(expandedCompany === client.name ? null : client.name)}
                        className="p-5 flex flex-col md:flex-row items-center gap-6 cursor-pointer relative"
                      >
                        {/* Left: Avatar & Identity */}
                        <div className="flex items-center gap-4 min-w-[300px] w-full md:w-auto">
                          <div className="relative">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black bg-gradient-to-br ${client.tier.gradient} shadow-inner`}>
                              {client.name.charAt(0)}
                            </div>
                            {owner && (
                              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white font-black text-[9px]" style={{ backgroundColor: owner.color }}>
                                {owner.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-black text-text-main truncate group-hover:text-accent transition-colors">{client.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm ${client.tier.color}`}>{client.tier.name}</span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm flex items-center gap-1 ${client.health.bg} ${client.health.color}`}>
                                <div className={`w-1.5 h-1.5 rounded-full bg-current animate-pulse`}></div>
                                {client.health.label}
                              </span>
                              {owner && <span className="text-[9px] font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: owner.color }}>👤 {owner.name}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Middle: Key Stats */}
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                          <div>
                            <p className="text-[9px] font-bold text-text-muted uppercase opacity-60 mb-0.5">Contact</p>
                            <p className="text-xs font-bold text-text-main truncate flex items-center gap-1"><Users size={12} />{client.contact}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-text-muted uppercase opacity-60 mb-0.5">Total Spent (LTV)</p>
                            <p className="text-xs font-black text-accent">{formatCurrency(client.wonValue)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-text-muted uppercase opacity-60 mb-0.5">Win Rate</p>
                            <p className="text-xs font-bold text-text-main">{client.winRate}% ({client.wonDeals}/{client.totalDeals})</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-text-muted uppercase opacity-60 mb-0.5">Last Activity</p>
                            <p className="text-xs font-bold text-text-main">{client.daysSinceLast} days ago</p>
                          </div>
                        </div>

                        {/* Right: Expand Icon */}
                        <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-bg text-text-muted group-hover:bg-accent group-hover:text-white transition-all">
                          <ChevronRight size={20} className={`transform transition-transform ${expandedCompany === client.name ? 'rotate-90' : ''}`} />
                        </div>
                      </div>

                      {/* Expanded Detail View */}
                      {expandedCompany === client.name && (
                        <div className="bg-bg/40 border-t border-black/5 p-6 animate-in slide-in-from-top-2 duration-200">
                          <div className="flex flex-col xl:flex-row gap-6">
                            {/* Profile / Notes Side */}
                            <div className="xl:w-1/3 space-y-4">
                              <h4 className="font-bold text-sm uppercase flex items-center gap-2 opacity-60"><Users size={14} /> Customer Profile</h4>
                              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-white">
                                <div className="space-y-3">
                                  <button className="w-full flex items-center justify-between p-3 rounded-xl bg-bg hover:bg-accent/10 hover:text-accent transition-all group/btn text-sm font-bold text-text-muted">
                                    <span className="flex items-center gap-2"><MessageSquare size={16} /> Send Email</span>
                                    <ArrowRight size={14} className="opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all" />
                                  </button>
                                  <button className="w-full flex items-center justify-between p-3 rounded-xl bg-bg hover:bg-green-50 hover:text-green-600 transition-all group/btn text-sm font-bold text-text-muted">
                                    <span className="flex items-center gap-2"><Phone size={16} /> Call Contact</span>
                                    <ArrowRight size={14} className="opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all" />
                                  </button>
                                  <button className="w-full flex items-center justify-between p-3 rounded-xl bg-bg hover:bg-purple-50 hover:text-purple-600 transition-all group/btn text-sm font-bold text-text-muted">
                                    <span className="flex items-center gap-2"><Calendar size={16} /> Schedule Meeting</span>
                                    <ArrowRight size={14} className="opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all" />
                                  </button>
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-text-muted uppercase mb-2">Interests & Products</p>
                                <div className="flex flex-wrap gap-2">
                                  {Array.from(client.products).map(p => (
                                    <span key={p} className="px-2 py-1 bg-white border rounded-lg text-[10px] font-bold text-text-main hover:border-accent cursor-default">{p}</span>
                                  ))}
                                  {client.products.size === 0 && <span className="text-xs text-text-muted italic">No products identified yet.</span>}
                                </div>
                              </div>
                            </div>

                            {/* Deal Timeline Side */}
                            <div className="flex-1 space-y-4">
                              <div className="flex justify-between items-center">
                                <h4 className="font-bold text-sm uppercase flex items-center gap-2 opacity-60"><Activity size={14} /> Deal History</h4>
                                <span className="text-[10px] font-black bg-white px-2 py-1 rounded-lg border">{deals.filter(d => d.company === client.name).length} Deals</span>
                              </div>

                              <div className="space-y-3">
                                {deals.filter(d => d.company === client.name).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(deal => (
                                  <div key={deal.id} onClick={(e) => { e.stopPropagation(); handleDealClick(deal); }} className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-2xl border border-transparent hover:border-accent shadow-sm cursor-pointer transition-all group/deal">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${deal.stage === 'won' ? 'bg-green-100 text-green-600' :
                                      deal.stage === 'lost' ? 'bg-red-100 text-red-600' :
                                        'bg-blue-100 text-blue-600'
                                      }`}>
                                      {deal.stage === 'won' ? <Trophy size={18} /> : deal.stage === 'lost' ? <XCircle size={18} /> : <CircleDot size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-start">
                                        <p className="font-bold text-sm text-text-main truncate group-hover/deal:text-accent transition-colors">{deal.title}</p>
                                        <p className="font-black text-sm text-text-main">{formatCurrency(deal.value)}</p>
                                      </div>
                                      <div className="flex justify-between items-center mt-0.5">
                                        <p className="text-[10px] font-bold text-text-muted uppercase">{formatDate(deal.createdAt)} • {deal.stage}</p>
                                        <span className="text-[9px] font-bold text-text-muted opacity-0 group-hover/deal:opacity-100 transition-opacity flex items-center gap-1">View Detail <ArrowRight size={10} /></span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {vipClients.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20 filter grayscale">
                    <Users size={64} className="mb-4 text-text-muted" />
                    <p className="text-lg font-bold">No customers found.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'spec-setup' && (
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Actionable Orbs for Zenith Mode */}
                {zenithMode && deals.filter(d => daysSince(d.lastActivity || d.createdAt) >= 14).slice(0, 1).map((deal) => (
                  <ActionOrb key={deal.id} deal={deal} onClick={setSelectedDeal} />
                ))}

                {/* Modals */}
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

          {activeTab === 'team' && (
            <TeamDashboard
              deals={deals}
              teamMembers={teamMembers}
              onDealClick={handleDealClick}
              formatCurrency={formatCurrency}
            />
          )}
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

      {/* Quick-Add FAB */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-50 group border border-indigo-400"
      >
        <Plus size={28} className="transition-transform group-hover:rotate-90" />
        <span className="absolute right-16 bg-gray-900 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap shadow-md">
          เพิ่มดีลด่วน
        </span>
      </button>

      {/* Import Modal */}
      {
        isImportModalOpen && (
          <div className="fixed inset-0 bg-bg/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-surface rounded-3xl w-full max-w-2xl shadow-clay-lg p-8 border border-white/50 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-black text-text-main flex items-center"><FileSpreadsheet className="mr-3 text-accent" size={32} />AI & Data Import</h3><button onClick={() => setIsImportModalOpen(false)}><X size={24} className="text-text-muted hover:text-warm-red" /></button></div>

              <div className="mb-6">
                <PDFImporter onDataExtracted={handlePDFExtracted} callGeminiAPI={callGeminiAPI} />
              </div>
              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink-0 mx-4 text-text-muted text-xs font-bold uppercase tracking-widest">Or Import via CSV</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              <div className="space-y-4">
                <Button variant="outline" fullWidth onClick={downloadTemplate} icon={Download}>ดาวน์โหลดแบบฟอร์ม (CSV Template)</Button>
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current.click()}>
                  <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  {importStatus === 'processing' ? (<div className="flex flex-col items-center text-accent"><Loader2 className="animate-spin mb-2" size={32} /><span>Creating data...</span></div>) : importStatus?.startsWith('success') ? (<div className="flex flex-col items-center text-warm-green-dark"><CheckCircle2 className="mb-2" size={32} /><span>Success! {importStatus.split(':')[1]} items imported.</span></div>) : importStatus === 'error' ? (<div className="flex flex-col items-center text-warm-red-dark"><AlertCircle className="mb-2" size={32} /><span>Error reading CSV.</span></div>) : (<div className="flex flex-col items-center text-text-muted"><Upload className="mb-2" size={32} /><span className="font-medium">Click to upload .CSV</span></div>)}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* PDF Verification Modal */}
      {
        isPdfVerificationModalOpen && pdfExtractedData && (
          <div className="fixed inset-0 bg-bg/80 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-surface rounded-3xl w-full max-w-lg shadow-clay-lg animate-in zoom-in-95 border border-white/50">
              <div className="flex justify-between items-center p-6 border-b border-black/5">
                <h3 className="text-xl font-black text-text-main flex items-center"><Sparkles className="mr-2 text-accent" size={24} /> Verify AI Extracted Data</h3>
                <button onClick={() => setIsPdfVerificationModalOpen(false)} className="text-text-muted hover:text-warm-red"><X size={20} /></button>
              </div>
              <form onSubmit={handleSavePDFDeal} className="p-6 space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-xl text-xs font-bold flex items-start gap-2 mb-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-yellow-500" />
                  <p>AI data extraction may not be 100% accurate. Please review and modify the data before saving.</p>
                </div>

                <div><label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Deal Title</label><input required name="title" type="text" defaultValue={pdfExtractedData.title || ''} className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-accent rounded-xl focus:outline-none font-bold text-text-main text-sm shadow-sm" /></div>

                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Company</label><input required name="company" type="text" defaultValue={pdfExtractedData.company || ''} className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-accent rounded-xl focus:outline-none font-bold text-text-main text-sm shadow-sm" /></div>
                  <div><label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Contact Person</label><input name="contact" type="text" defaultValue={pdfExtractedData.contact || ''} className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-accent rounded-xl focus:outline-none font-bold text-text-main text-sm shadow-sm" /></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Total Value (THB)</label><input required name="value" type="number" min="0" defaultValue={pdfExtractedData.value || 0} className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-accent rounded-xl focus:outline-none font-black text-accent text-sm shadow-sm" /></div>
                  <div><label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Quote Date</label><input required name="date" type="date" defaultValue={pdfExtractedData.date || new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-accent rounded-xl focus:outline-none font-bold text-text-main text-sm shadow-sm" /></div>
                </div>

                <div className="pt-2">
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Assign To</label>
                  <div className="grid grid-cols-2 gap-3">
                    {teamMembers.map(m => (
                      <label key={m.id} className="relative cursor-pointer">
                        <input type="radio" name="assigned_to" value={m.id} defaultChecked={m.id === 'leader'} className="sr-only peer" />
                        <div className="flex items-center gap-2 p-2 rounded-xl border border-gray-200 bg-white peer-checked:border-current peer-checked:bg-opacity-5 transition-all peer-checked:shadow-sm" style={{ '--tw-border-opacity': 1, color: m.color }}>
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-black text-xs" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                          <p className="text-xs font-bold text-text-main">{m.name}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-black/5 flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setIsPdfVerificationModalOpen(false)} type="button">Cancel</Button>
                  <Button variant="primary" type="submit" icon={CheckCircle2}>Confirm & Import</Button>
                </div>
              </form>
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
                {/* Assignee Field */}
                <div>
                  <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">มอบหมายดีลให้</label>
                  <div className="grid grid-cols-2 gap-3">
                    {teamMembers.map(m => (
                      <label key={m.id} className="relative cursor-pointer">
                        <input type="radio" name="assigned_to" value={m.id} defaultChecked={m.id === 'leader'} className="sr-only peer" />
                        <div
                          className="flex items-center gap-3 p-3 rounded-2xl border-2 border-transparent bg-bg/50 peer-checked:border-current peer-checked:bg-opacity-10 transition-all shadow-clay-inner peer-checked:shadow-clay-btn"
                          style={{ '--tw-border-opacity': 1 }}
                        >
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                          <div>
                            <p className="text-xs font-black text-text-main">{m.name}</p>
                            <p className="text-[10px] text-text-muted">{m.role}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
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