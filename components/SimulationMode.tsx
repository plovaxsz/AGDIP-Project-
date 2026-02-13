import React, { useState, useEffect, useMemo } from 'react';
import { ProjectData, SimulationRun, SavedScenario, ScenarioParams } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Label, ComposedChart } from 'recharts';
import { BrainCircuit, Play, Loader2, Save, Database, TrendingUp, ArrowRight, Download, Trash2, Scale, UploadCloud, FileSpreadsheet, RefreshCcw, Sigma, FileText, Sparkles } from 'lucide-react';
import { exportSimulationReport } from '../services/fileGenService';
import { analyzeSimulationScenarios } from '../services/aiService';
import * as XLSX from 'xlsx';

interface SimulationModeProps {
  data: ProjectData;
  onUpdateData?: (data: ProjectData) => void;
}

// --- GEOMETRIC BROWNIAN MOTION (GBM) GENERATOR ---
const generateGBMPath = (startVal: number, drift: number, volatility: number, steps: number, timeHorizon: number = 1) => {
    let current = startVal;
    const dt = timeHorizon / steps; 
    
    return Array.from({ length: steps }).map((_, i) => {
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        
        const change = (drift - 0.5 * Math.pow(volatility, 2)) * dt + volatility * Math.sqrt(dt) * z;
        current = current * Math.exp(change);
        
        return { step: i, value: Math.max(0, current) };
    });
};

// --- STATISTICAL HELPERS (Pandas-lite) ---
const calculateStats = (values: number[]) => {
    if (values.length < 2) return { drift: 0.05, volatility: 0.2 };
    
    // Calculate Log Returns: ln(Pt / Pt-1)
    const returns = [];
    for (let i = 1; i < values.length; i++) {
        if (values[i-1] > 0 && values[i] > 0) {
            returns.push(Math.log(values[i] / values[i-1]));
        }
    }
    
    if (returns.length === 0) return { drift: 0.05, volatility: 0.2 };

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
    
    // Scale to annualized approx (assuming monthly data input for demo)
    return {
        drift: mean * 12,
        volatility: Math.sqrt(variance * 12)
    };
};

const SimulationMode: React.FC<SimulationModeProps> = ({ data, onUpdateData }) => {
  const [activeView, setActiveView] = useState<'MONTE_CARLO' | 'COMPARISON'>('MONTE_CARLO');
  const [dataSource, setDataSource] = useState<'MANUAL' | 'UPLOAD'>('MANUAL');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(data.analytics.simulationComparison?.analysis || null);
  
  // Simulation State
  const [simulationData, setSimulationData] = useState<SimulationRun[]>([]);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(data.analytics.simulationComparison?.scenarios || []);
  const [historicalSeries, setHistoricalSeries] = useState<{step: number, value: number, original: number}[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  
  // Params State
  const [params, setParams] = useState<ScenarioParams>({
      budgetVariance: 0, adoptionRate: 85, timelineDelay: 0, marketRisk: 1.0, 
      taxRate: 11, inflation: 3.5, regulatoryCost: 0
  });
  
  // GBM Params
  const [drift, setDrift] = useState(0.05); 
  const [volatility, setVolatility] = useState(0.2); 
  
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState("");

  useEffect(() => {
      if (simulationData.length === 0) {
          runSimulation();
      }
  }, []);

  const runSimulation = async (customDrift?: number, customVol?: number) => {
      const d = customDrift !== undefined ? customDrift : drift;
      const v = customVol !== undefined ? customVol : volatility;
      
      const newRuns = Array.from({ length: 20 }).map((_, i) => ({
          runId: i,
          data: generateGBMPath(100, d, v, 24, 2) 
      }));
      return newRuns;
  };

  const handleManualRun = async () => {
      setIsLoading(true);
      setLoadingStep("Running Monte Carlo...");
      await new Promise(r => setTimeout(r, 600));
      const runs = await runSimulation();
      setSimulationData(runs);
      setIsLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingStep("Analyzing Dataset...");
    setIsLoading(true);
    setFileName(file.name);

    try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        // Heuristic: Find first column with numbers
        const values: number[] = [];
        const series: {step: number, value: number, original: number}[] = [];
        
        // Skip header if string
        const startRow = typeof json[0][0] === 'string' ? 1 : 0;
        
        for (let i = startRow; i < json.length; i++) {
            const row = json[i];
            // Try 2nd col (value) or 1st col
            const val = typeof row[1] === 'number' ? row[1] : typeof row[0] === 'number' ? row[0] : null;
            if (val !== null) {
                values.push(val);
            }
        }

        if (values.length > 2) {
            // Normalize to 100 base for comparison
            const startVal = values[0];
            values.forEach((v, i) => {
                series.push({ 
                    step: i, 
                    value: (v / startVal) * 100,
                    original: v 
                });
            });

            // Calculate Stats
            const stats = calculateStats(values);
            setDrift(parseFloat(stats.drift.toFixed(3)));
            setVolatility(parseFloat(stats.volatility.toFixed(3)));
            setHistoricalSeries(series);
            setDataSource('UPLOAD');
            
            // Auto Run Simulation with new params
            const runs = await runSimulation(stats.drift, stats.volatility);
            setSimulationData(runs);
        } else {
            alert("Data not readable or too short. Please provide at least 3 numeric points.");
        }
    } catch (err) {
        console.error(err);
        alert("Failed to parse file.");
    } finally {
        setIsLoading(false);
    }
  };

  const calculateMetrics = (runs: SimulationRun[], driftVal: number, volVal: number) => {
      const finalVals = runs.map(r => r.data[r.data.length - 1].value);
      const avg = finalVals.reduce((a,b) => a+b, 0) / finalVals.length;
      return {
          npv: Math.round(avg),
          irr: Math.round((avg - 100) / 100 * 100),
          risk: Math.round(volVal * 100),
          confidence: Math.max(0, 100 - (volVal * 150))
      };
  };

  const createScenarioObject = (name: string, runs: SimulationRun[], d: number, v: number, color: string): SavedScenario => {
      const metrics = calculateMetrics(runs, d, v);
      return {
          id: Date.now().toString() + Math.random(),
          name,
          color,
          runs,
          params: { ...params },
          gbmParams: { drift: d, volatility: v },
          confidence: metrics.confidence,
          metrics: { npv: metrics.npv, irr: metrics.irr, risk: metrics.risk }
      };
  };

  const handleAutoCompare = async () => {
      setIsLoading(true);
      setActiveView('COMPARISON');
      setLoadingStep("Menyiapkan Skenario Otomatis...");

      try {
          const scenarios: SavedScenario[] = [];
          const baseRuns = await runSimulation(0.05, 0.15);
          scenarios.push(createScenarioObject("Baseline (Moderated)", baseRuns, 0.05, 0.15, "#3B82F6"));
          const optRuns = await runSimulation(0.12, 0.25);
          scenarios.push(createScenarioObject("Optimistic (High Growth)", optRuns, 0.12, 0.25, "#10B981"));
          const pessRuns = await runSimulation(-0.02, 0.10);
          scenarios.push(createScenarioObject("Pessimistic (Stagnant)", pessRuns, -0.02, 0.10, "#F43F5E"));

          setSavedScenarios(scenarios);
          
          setLoadingStep("AI Menganalisis Perbandingan...");
          const analysisText = await analyzeSimulationScenarios(scenarios);
          setAiAnalysis(analysisText);

          if (onUpdateData) {
              onUpdateData({
                  ...data,
                  analytics: {
                      ...data.analytics,
                      simulationComparison: {
                          scenarios: scenarios,
                          analysis: analysisText,
                          winnerId: ''
                      }
                  }
              });
          }
      } catch (e) {
          console.error(e);
          alert("Gagal menjalankan perbandingan otomatis.");
      } finally {
          setIsLoading(false);
          setLoadingStep("");
      }
  };

  const handleSaveScenario = () => {
      if (!newScenarioName) return;
      const newScenario = createScenarioObject(
          newScenarioName, 
          simulationData, 
          drift, 
          volatility, 
          '#' + Math.floor(Math.random()*16777215).toString(16)
      );
      const updatedScenarios = [...savedScenarios, newScenario];
      setSavedScenarios(updatedScenarios);
      if (onUpdateData) {
          onUpdateData({ ...data, analytics: { ...data.analytics, simulationComparison: { scenarios: updatedScenarios, analysis: aiAnalysis || "", winnerId: '' } } });
      }
      setShowSaveModal(false);
      setNewScenarioName("");
  };

  const handleDeleteScenario = (id: string) => {
      setSavedScenarios(prev => prev.filter(s => s.id !== id));
  };

  const chartData = useMemo(() => {
      if (activeView === 'COMPARISON') {
         if (savedScenarios.length === 0) return [];
         const steps = savedScenarios[0].runs[0].data.length;
         return Array.from({ length: steps }).map((_, i) => {
             const point: any = { step: i };
             savedScenarios.forEach(scen => {
                 let sum = 0;
                 scen.runs.forEach(r => sum += r.data[i].value);
                 point[scen.id] = sum / scen.runs.length;
             });
             return point;
         });
      } else {
         return simulationData[0]?.data.map((_, i) => {
             const pt: any = { step: i };
             simulationData.forEach((run, idx) => pt[`run_${idx}`] = run.data[i]?.value);
             // Add Historical Overlay
             if (historicalSeries[i]) {
                 pt['historical'] = historicalSeries[i].value;
             }
             return pt;
         });
      }
  }, [simulationData, savedScenarios, activeView, historicalSeries]);

  return (
    <div className="min-h-screen bg-[#F9F9F9] dark:bg-[#151521] text-slate-800 dark:text-slate-100 p-8 animate-fade-in font-sans">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-200 dark:border-slate-700">
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-white">
                    <BrainCircuit className="w-8 h-8 text-blue-600" />
                    Simulation Intelligence
                </h2>
                <p className="text-slate-500 text-sm mt-1">Stochastic Modeling • Historical Benchmarking • Predictive AI</p>
            </div>
            <div className="flex gap-2">
                <button onClick={() => exportSimulationReport(savedScenarios)} className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                    <Download className="w-4 h-4" /> Export Report
                </button>
                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <button onClick={() => setActiveView('MONTE_CARLO')} className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${activeView === 'MONTE_CARLO' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>Single Run</button>
                    <button onClick={() => setActiveView('COMPARISON')} className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${activeView === 'COMPARISON' ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:text-slate-700'}`}>Comparison</button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
            {/* CONTROLS */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
                 {/* ENGINE CARD */}
                 <div className="bg-white dark:bg-[#1E1E2D] border border-slate-200 dark:border-slate-700 p-5 rounded-xl shadow-sm space-y-4">
                     <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Engine Controls</h3>
                     
                     <button 
                        onClick={handleManualRun}
                        disabled={isLoading}
                        className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
                     >
                        {isLoading && activeView === 'MONTE_CARLO' ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4" />}
                        Run Monte Carlo
                     </button>

                     <button 
                        onClick={() => setShowSaveModal(true)}
                        className="w-full p-3 border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
                     >
                        <Save className="w-4 h-4" />
                        Save Scenario
                     </button>

                     <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-2">
                        <button 
                            onClick={handleAutoCompare}
                            disabled={isLoading}
                            className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20"
                        >
                            {isLoading && activeView === 'COMPARISON' ? <Loader2 className="w-4 h-4 animate-spin"/> : <Scale className="w-4 h-4" />}
                            AI Auto-Compare
                        </button>
                     </div>
                 </div>

                 {/* PARAMETER CARD */}
                 <div className="bg-white dark:bg-[#1E1E2D] border border-slate-200 dark:border-slate-700 p-5 rounded-xl shadow-sm">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parameters</h3>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                             <button onClick={() => setDataSource('MANUAL')} className={`p-1 rounded ${dataSource === 'MANUAL' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}><RefreshCcw className="w-3 h-3"/></button>
                             <button onClick={() => setDataSource('UPLOAD')} className={`p-1 rounded ${dataSource === 'UPLOAD' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}><Database className="w-3 h-3"/></button>
                        </div>
                     </div>

                     {dataSource === 'MANUAL' ? (
                         <div className="space-y-5 animate-fade-in">
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span>Drift (Growth)</span>
                                    <span className="text-blue-600">{Math.round(drift * 100)}%</span>
                                </div>
                                <input type="range" min="-0.1" max="0.3" step="0.01" value={drift} onChange={e => setDrift(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span>Volatility (Risk)</span>
                                    <span className="text-rose-500">{Math.round(volatility * 100)}%</span>
                                </div>
                                <input type="range" min="0.05" max="0.5" step="0.01" value={volatility} onChange={e => setVolatility(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500" />
                            </div>
                         </div>
                     ) : (
                         <div className="space-y-4 animate-fade-in">
                             <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                                    <p className="text-xs text-slate-500 font-bold">Upload CSV / Excel</p>
                                </div>
                                <input type="file" className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} />
                             </label>
                             
                             {fileName && (
                                 <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded p-3">
                                     <div className="flex items-center gap-2 mb-2">
                                         <FileSpreadsheet className="w-4 h-4 text-emerald-600"/>
                                         <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 truncate">{fileName}</span>
                                     </div>
                                     <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                                         <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                                             <span className="block font-bold">Drift</span>
                                             <span className="text-emerald-600 font-mono">{(drift*100).toFixed(1)}%</span>
                                         </div>
                                         <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                                             <span className="block font-bold">Vol</span>
                                             <span className="text-rose-600 font-mono">{(volatility*100).toFixed(1)}%</span>
                                         </div>
                                     </div>
                                 </div>
                             )}
                         </div>
                     )}
                 </div>

                 {savedScenarios.length > 0 && (
                     <div className="bg-slate-50 dark:bg-[#1E1E2D] border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
                         <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Saved Scenarios</h4>
                         <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                             {savedScenarios.map(s => (
                                 <div key={s.id} className="flex justify-between items-center text-xs p-2 bg-white dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700">
                                     <div className="flex items-center gap-2">
                                         <div className="w-2 h-2 rounded-full" style={{backgroundColor: s.color}}></div>
                                         <span className="font-semibold truncate max-w-[120px]" title={s.name}>{s.name}</span>
                                     </div>
                                     <button onClick={() => handleDeleteScenario(s.id)} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-3 h-3"/></button>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}
            </div>

            {/* CHART AREA */}
            <div className="col-span-12 lg:col-span-9 flex flex-col gap-6">
                
                <div className="bg-white dark:bg-[#1E1E2D] border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm min-h-[500px] flex flex-col relative">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                {activeView === 'MONTE_CARLO' ? 'Monte Carlo Projection' : 'Scenario Comparison'}
                            </h3>
                            {isLoading && <span className="text-xs text-blue-500 flex items-center gap-2 mt-1"><Loader2 className="w-3 h-3 animate-spin"/> {loadingStep}</span>}
                        </div>
                        {activeView === 'MONTE_CARLO' && dataSource === 'UPLOAD' && (
                             <div className="flex items-center gap-2 text-xs font-bold px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-full border border-amber-200 dark:border-amber-800">
                                 <Sigma className="w-3 h-3"/> Data Driven Parameters
                             </div>
                        )}
                    </div>
                    
                    <div className="flex-1 w-full min-h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{top: 20, right: 30, left: 20, bottom: 20}}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} strokeOpacity={0.2} />
                                <XAxis dataKey="step" stroke="#94A3B8" tick={{fontSize: 12}} label={{ value: 'Time Horizon (Months)', position: 'insideBottom', offset: -10, fill: '#94A3B8', fontSize: 10 }}/>
                                <YAxis stroke="#94A3B8" tick={{fontSize: 12}} domain={['auto', 'auto']} label={{ value: 'Project Value (Index)', angle: -90, position: 'insideLeft', fill: '#94A3B8', fontSize: 10 }}/>
                                <Tooltip 
                                    contentStyle={{backgroundColor: '#1E1E2D', borderRadius: '8px', border: '1px solid #475569', color: 'white'}} 
                                    itemStyle={{fontSize: '12px'}}
                                />
                                <Legend />
                                
                                {activeView === 'MONTE_CARLO' && (
                                    <>
                                        {simulationData.map((run, idx) => (
                                            <Line key={run.runId} type="monotone" dataKey={`run_${idx}`} stroke="#3B82F6" strokeWidth={1} strokeOpacity={0.2} dot={false} name={idx === 0 ? "Simulation Paths" : ""} />
                                        ))}
                                        {/* Reference Mean Line */}
                                        <Line type="monotone" dataKey="run_0" stroke="#2563EB" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Mean Path" />
                                        
                                        {/* Historical Overlay if exists */}
                                        {historicalSeries.length > 0 && (
                                            <Line type="monotone" dataKey="historical" stroke="#10B981" strokeWidth={3} dot={{r:4}} name="Historical Data (Norm)" />
                                        )}
                                    </>
                                )}

                                {activeView === 'COMPARISON' && savedScenarios.map(scen => (
                                    <Line 
                                        key={scen.id} 
                                        type="monotone" 
                                        dataKey={scen.id} 
                                        stroke={scen.color} 
                                        strokeWidth={3} 
                                        dot={{r: 4}} 
                                        name={scen.name}
                                        animationDuration={1500}
                                    />
                                ))}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {/* AI ANALYSIS RESULT OVERLAY */}
                    {activeView === 'COMPARISON' && aiAnalysis && (
                        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg animate-fade-in">
                            <h4 className="text-sm font-bold text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4"/> AI Strategic Recommendation
                            </h4>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                {aiAnalysis}
                            </p>
                        </div>
                    )}
                </div>

                {/* COMPARISON TABLE */}
                {activeView === 'COMPARISON' && savedScenarios.length > 0 && (
                    <div className="bg-white dark:bg-[#1E1E2D] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Scenario Data Breakdown</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px]">
                                    <tr>
                                        <th className="p-4">Scenario</th>
                                        <th className="p-4 text-center">Drift</th>
                                        <th className="p-4 text-center">Volatility</th>
                                        <th className="p-4 text-right">NPV Est.</th>
                                        <th className="p-4 text-right">IRR Est.</th>
                                        <th className="p-4 text-right">Confidence</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {savedScenarios.map(scen => (
                                        <tr key={scen.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="p-4 font-bold flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{backgroundColor: scen.color}}></div>
                                                <span className="dark:text-white">{scen.name}</span>
                                            </td>
                                            <td className="p-4 text-center">{(scen.gbmParams?.drift || 0) * 100}%</td>
                                            <td className="p-4 text-center">{(scen.gbmParams?.volatility || 0) * 100}%</td>
                                            <td className="p-4 text-right font-mono font-bold text-emerald-600">{scen.metrics?.npv}</td>
                                            <td className="p-4 text-right font-mono text-blue-600">{scen.metrics?.irr}%</td>
                                            <td className="p-4 text-right">
                                                <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-xs font-bold">{scen.confidence}%</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {showSaveModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-[#1E1E2D] rounded-xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Save Scenario</h3>
                    <input 
                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg mb-4 text-sm"
                        placeholder="Scenario Name (e.g., Aggressive Growth)"
                        value={newScenarioName}
                        onChange={(e) => setNewScenarioName(e.target.value)}
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <button onClick={() => setShowSaveModal(false)} className="flex-1 py-2 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-lg">Cancel</button>
                        <button onClick={handleSaveScenario} className="flex-1 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700">Save</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SimulationMode;