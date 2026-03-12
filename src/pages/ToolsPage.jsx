import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { HardDrive, Cpu, Zap, Loader2 } from 'lucide-react';
import { callGeminiAPI } from '../services/ai';

export default function ToolsPage() {
  // RAID State
  const [raidConfig, setRaidConfig] = useState({ size: 4, unit: 'TB', count: 4, level: '5' });
  const [raidResult, setRaidResult] = useState(null);

  // CPU Compare State
  const [cpuInputs, setCpuInputs] = useState({ cpuA: '', cpuB: '' });
  const [cpuResults, setCpuResults] = useState(null);
  const [isComparingCpu, setIsComparingCpu] = useState(false);

  const calculateRaid = () => {
    const { size, count, level } = raidConfig;
    const s = Number(size);
    const n = Number(count);
    let capacity = 0;
    let faultTolerance = 0;

    if (level === '0') { capacity = s * n; faultTolerance = 0; }
    else if (level === '1') { capacity = s; faultTolerance = n - 1; }
    else if (level === '5') { capacity = s * (n - 1); faultTolerance = 1; }
    else if (level === '6') { capacity = s * (n - 2); faultTolerance = 2; }
    else if (level === '10') { capacity = (s * n) / 2; faultTolerance = n / 2; }

    setRaidResult({ capacity, faultTolerance, unit: raidConfig.unit });
  };

  const handleCpuCompare = async () => {
    setIsComparingCpu(true);
    const prompt = `Compare these two CPUs: "${cpuInputs.cpuA}" vs "${cpuInputs.cpuB}".
    Return ONLY a JSON object with this exact structure:
    {
      "cpuA": { "model": "Full Model Name", "cores": "X/Y", "clock": "GHz", "tdp": "W", "desc": "Brief desc" },
      "cpuB": { "model": "Full Model Name", "cores": "X/Y", "clock": "GHz", "tdp": "W", "desc": "Brief desc" }
    }`;

    const result = await callGeminiAPI(prompt);
    if (result) setCpuResults(result);
    setIsComparingCpu(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">IT Professional Tools</h1>
      <p className="text-muted-foreground">Specialized calculators and AI-assisted technical comparisons.</p>

      <Tabs defaultValue="raid" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="raid">RAID Calculator</TabsTrigger>
          <TabsTrigger value="cpu">CPU Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="raid" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><HardDrive className="text-primary" /> RAID Capacity Calculator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Disk Size</label>
                  <Input type="number" value={raidConfig.size} onChange={e => setRaidConfig({...raidConfig, size: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Number of Disks</label>
                  <Input type="number" value={raidConfig.count} onChange={e => setRaidConfig({...raidConfig, count: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">RAID Level</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={raidConfig.level} 
                    onChange={e => setRaidConfig({...raidConfig, level: e.target.value})}
                  >
                    <option value="0">RAID 0 (Striping)</option>
                    <option value="1">RAID 1 (Mirroring)</option>
                    <option value="5">RAID 5 (Parity)</option>
                    <option value="6">RAID 6 (Double Parity)</option>
                    <option value="10">RAID 10 (1+0)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={calculateRaid} className="w-full">Calculate</Button>
                </div>
              </div>

              {raidResult && (
                <div className="p-6 bg-secondary/50 rounded-xl border border-dashed flex justify-around items-center">
                  <div className="text-center">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Usable Capacity</p>
                    <p className="text-4xl font-black text-primary">{raidResult.capacity} {raidResult.unit}</p>
                  </div>
                  <div className="h-12 w-px bg-border" />
                  <div className="text-center">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Fault Tolerance</p>
                    <p className="text-4xl font-black text-emerald-500">{raidResult.faultTolerance} Disks</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cpu" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Cpu className="text-primary" /> AI CPU Comparison</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Input placeholder="CPU A (e.g. Intel i9-14900K)" value={cpuInputs.cpuA} onChange={e => setCpuInputs({...cpuInputs, cpuA: e.target.value})} />
                <Input placeholder="CPU B (e.g. AMD Ryzen 9 7950X)" value={cpuInputs.cpuB} onChange={e => setCpuInputs({...cpuInputs, cpuB: e.target.value})} />
                <Button onClick={handleCpuCompare} disabled={isComparingCpu}>
                  {isComparingCpu ? <Loader2 className="animate-spin mr-2" /> : <Zap className="mr-2" />}
                  Compare with AI
                </Button>
              </div>

              {cpuResults && (
                <div className="grid md:grid-cols-2 gap-6">
                  {[cpuResults.cpuA, cpuResults.cpuB].map((cpu, i) => (
                    <div key={i} className="p-4 border rounded-xl bg-card shadow-sm">
                      <h4 className="font-bold text-lg text-primary mb-2">{cpu.model}</h4>
                      <div className="grid grid-cols-3 gap-2 text-center mb-4">
                        <div className="p-2 bg-muted rounded-lg">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Cores/Thr</p>
                          <p className="text-sm font-black">{cpu.cores}</p>
                        </div>
                        <div className="p-2 bg-muted rounded-lg">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Clock</p>
                          <p className="text-sm font-black">{cpu.clock}</p>
                        </div>
                        <div className="p-2 bg-muted rounded-lg">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">TDP</p>
                          <p className="text-sm font-black">{cpu.tdp}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground italic">{cpu.desc}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
