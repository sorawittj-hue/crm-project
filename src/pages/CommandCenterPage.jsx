import { useState } from 'react';
import { useDeals } from '../hooks/useDeals';
import { useAppStore } from '../store/useAppStore';
import { useTeam } from '../hooks/useTeam';
import { useSettings } from '../hooks/useSettings';
import CommandCenter from '../components/dashboard/CommandCenter';
import { Loader2 } from 'lucide-react';
import { callGeminiAPI } from '../services/ai';

export default function CommandCenterPage() {
  const { data: deals, isLoading: dealsLoading } = useDeals();
  const { data: teamMembers, isLoading: teamLoading } = useTeam();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { zenithMode } = useAppStore();
  
  const [battlePlan, setBattlePlan] = useState(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [strategicMandates, setStrategicMandates] = useState([]);
  const [isGeneratingMandates, setIsGeneratingMandates] = useState(false);

  const handleGeneratePlan = async () => {
    if (!deals) return;
    setIsGeneratingPlan(true);
    const urgentDeals = deals.filter(d => !['won', 'lost'].includes(d.stage)).slice(0, 5);
    
    const prompt = `You are a Senior Sales Leader. Analyze these deals: ${JSON.stringify(urgentDeals.map(d => ({ title: d.title, val: d.value, stage: d.stage })))} 
    Provide a high-energy "Battle Plan" for today in Thai language. 
    Return ONLY a JSON object: { "plan": "The text of the plan in Thai." }`;

    const result = await callGeminiAPI(prompt);
    if (result && result.plan) {
      setBattlePlan(result.plan);
    }
    setIsGeneratingPlan(false);
  };

  const handleGenerateMandates = async () => {
    if (!deals) return;
    setIsGeneratingMandates(true);
    const activeDeals = deals.filter(d => !['won', 'lost'].includes(d.stage)).slice(0, 10);
    
    const prompt = `Analyze these top 10 CRM deals and provide 3 high-impact "Strategic Mandates" to win the market. 
    Thai language. Context: ${JSON.stringify(activeDeals.map(d => ({ title: d.title, val: d.value })))}
    Return ONLY a JSON array of objects: [{ "id": 1, "mandate": "Short bold title", "desc": "Actionable advice", "urgency": "high|medium|low" }]`;

    const result = await callGeminiAPI(prompt);
    if (result && Array.isArray(result)) {
      setStrategicMandates(result);
    }
    setIsGeneratingMandates(false);
  };

  const isLoading = dealsLoading || teamLoading || settingsLoading;

  if (isLoading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <CommandCenter 
      deals={deals || []}
      teamMembers={teamMembers || []}
      monthlyGoal={settings?.monthly_target || 10000000}
      onDealClick={(deal) => console.log('Deal Clicked', deal)}
      onAddDeal={() => window.location.href = '/pipeline'} // Link to deployment
      onGeneratePlan={handleGeneratePlan}
      isGeneratingPlan={isGeneratingPlan}
      battlePlan={battlePlan}
      strategicMandates={strategicMandates}
      isGeneratingMandates={isGeneratingMandates}
      onGenerateMandates={handleGenerateMandates}
      zenithMode={zenithMode}
    />
  );
}
