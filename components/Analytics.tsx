
import React, { useState, useMemo, useEffect } from 'react';
import { AnalyticsData, ProjectData, AuditCategory } from '../types';
import { 
    ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, Bar, LineChart, Line, Legend, ScatterChart, Scatter, ZAxis, BarChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceLine, ReferenceDot
} from 'recharts';
import { 
    ArrowLeft, Globe, Cpu, TrendingUp,
    CheckCircle2, Download, Layers, ShieldAlert, Plus, Trash2, AlertTriangle, ArrowRight, GitMerge, Clock, Split, Sparkles, FileSpreadsheet, Check, Briefcase, Activity, Target, Zap, Layout, MoveUpRight, Scale, Network, Radar as RadarIcon
} from 'lucide-react';
import { formatIDR } from '../utils/currency';
import IntelligenceGraph from './IntelligenceGraph';

interface AnalyticsProps {
  data: ProjectData;
  setData?: (data: ProjectData) => void;
  settings: any;
  onBack?: () => void;
}

const Analytics: React.FC<AnalyticsProps> = ({ data, setData, settings, onBack }) => {
  const { analytics } = data;
  const [activeTab, setActiveTab] = useState<'ANALYSIS' | 'NETWORK' | 'PREDICTION' | 'AUDIT'>('ANALYSIS');
  const [localAuditState, setLocalAuditState] = useState(analytics.auditState);

  useEffect(() => {
      setLocalAuditState(analytics.auditState);
  }, [analytics.auditState]);

  // --- PREDICTIVE GOVERNANCE LOGIC ---
  const predictiveMetrics = useMemo(() => {
      const auditScore = data.stats.totalScore;
      const volatility = analytics.quantMetrics.volatility;
      const riskCount = analytics.riskAnalysis.filter(r => r.impact > 70).length;
      
      // Heuristic "Pre-Crime" Formula
      const failureProb = Math.min(99, ((100 - auditScore) * 0.4) + (volatility * 100) + (riskCount * 5));
      const governanceWeather = failureProb < 20 ? 'CLEAR' : failureProb < 50 ? 'CLOUDY' : 'STORM';
      
      return {
          failureProb: failureProb.toFixed(1),
          weather: governanceWeather,
          drift: (volatility * 100 * 1.5).toFixed(1),
          auditVulnerability: (100 - (data.meta.verification?.score || 50)).toFixed(0)
      };
  }, [data]);

  // --- SCORE CALCULATION & MATRIX COORDS ---
  const matrixData = useMemo(() => {
      let valueScore = 0, easeScore = 0;
      let valueMax = 0, easeMax = 0;

      Object.values(localAuditState).forEach((cat: any) => {
          const selectedVal = cat.options[cat.selectedOptionIndex]?.value || 0;
          const maxVal = Math.max(...cat.options.map((o: any) => o.value));
          
          if (cat.group === 'BUSINESS_VALUE') {
              valueScore += selectedVal;
              valueMax += maxVal;
          } else {
              easeScore += selectedVal;
              easeMax += maxVal;
          }
      });

      const y = (valueScore / valueMax) * 100;
      const x = (easeScore / easeMax) * 100; 
      const pulse = (valueScore + easeScore) / (valueMax + easeMax) * 10; 

      let quadrant = "";
      if (y > 50 && x > 50) quadrant = "Strategic Winner (High Value, Easy)";
      else if (y > 50 && x <= 50) quadrant = "Major Project (High Value, Hard)";
      else if (y <= 50 && x > 50) quadrant = "Quick Win (Low Value, Easy)";
      else quadrant = "Fill-in Task (Low Value, Hard)";

      return { x, y, pulse: pulse.toFixed(2), quadrant };
  }, [localAuditState]);

  const handleAuditSelect = (catKey: string, optionIndex: number) => {
      const newState = { ...localAuditState };
      // @ts-ignore
      newState[catKey].selectedOptionIndex = optionIndex;
      setLocalAuditState(newState);
      if (setData) {
          setData({ ...data, analytics: { ...data.analytics, auditState: newState } });
      }
  };

  const Card = ({ children, className = "", title, icon: Icon, subTitle }: any) => (
      <div className={`bg-white dark:bg-[#1E1E2D] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col ${className}`}>
          {title && (
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      {Icon && <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"><Icon className="w-5 h-5"/></div>}
                      <div className="flex flex-col">
                          <h3 className="font-bold text-slate-800 dark:text-white text-sm">{title}</h3>
                          {subTitle && <span className="text-xs text-slate-400 font-medium">{subTitle}</span>}
                      </div>
                  </div>
              </div>
          )}
          <div className="p-6 flex-1 relative">
              {children}
          </div>
      </div>
  );

  const StatWidget = ({ label, value, subValue, color = "blue" }: any) => (
      <Card className="h-full">
          <div className="flex flex-col h-full justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
              <div className="mt-2">
                  <h2 className={`text-3xl font-black text-${color}-600 dark:text-${color}-400`}>{value}</h2>
                  {subValue && <div className="mt-1 text-xs font-medium px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 inline-block text-slate-600 dark:text-slate-300">{subValue}</div>}
              </div>
          </div>
      </Card>
  );

  const AuditItem = ({ category, catKey }: { category: AuditCategory, catKey: string }) => {
      const selected = category.options[category.selectedOptionIndex];
      return (
          <div className="bg-white dark:bg-[#1E1E2D] rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">{category.title}</h4>
                  <span className="text-sm font-bold text-blue-600">Score: {selected.value}</span>
              </div>
              <div className="space-y-2">
                  {category.options.map((opt, idx) => (
                      <button
                          key={idx}
                          onClick={() => handleAuditSelect(catKey, idx)}
                          className={`w-full text-left px-4 py-3 rounded-lg text-xs font-medium transition-all border ${
                              idx === category.selectedOptionIndex 
                              ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 shadow-sm' 
                              : 'bg-white border-transparent hover:bg-slate-50 text-slate-500 dark:bg-transparent dark:hover:bg-slate-800'
                          }`}
                      >
                          <div className="flex justify-between items-center">
                              <span>{opt.label}</span>
                              {idx === category.selectedOptionIndex && <CheckCircle2 className="w-4 h-4"/>}
                          </div>
                      </button>
                  ))}
              </div>
          </div>
      );
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans text-slate-800 dark:text-slate-200">
        
        {/* HEADER TAB NAV */}
        <div className="flex justify-between items-center bg-white dark:bg-[#1E1E2D] p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto">
            <div className="flex gap-1">
                <button 
                    onClick={() => setActiveTab('ANALYSIS')} 
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'ANALYSIS' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Layout className="w-4 h-4"/> Ringkasan
                </button>
                <button 
                    onClick={() => setActiveTab('NETWORK')} 
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'NETWORK' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Network className="w-4 h-4"/> Intelligence Graph
                </button>
                <button 
                    onClick={() => setActiveTab('PREDICTION')} 
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'PREDICTION' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <RadarIcon className="w-4 h-4"/> Predictive Governance
                </button>
                <button 
                    onClick={() => setActiveTab('AUDIT')} 
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'AUDIT' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <CheckCircle2 className="w-4 h-4"/> Audit Matrix
                </button>
            </div>
            {onBack && (
                <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500">
                    <ArrowLeft className="w-5 h-5"/>
                </button>
            )}
        </div>

        {/* --- 1. ANALYSIS DASHBOARD --- */}
        {activeTab === 'ANALYSIS' && (
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatWidget label="NET PRESENT VALUE" value={`${analytics.quantMetrics.npv}B`} subValue="+12% vs Baseline" color="emerald" />
                    <StatWidget label="IRR PROJECTION" value={`${analytics.quantMetrics.irr}%`} subValue="Highly Viable" color="blue" />
                    <StatWidget label="SHARPE RATIO" value={analytics.quantMetrics.sharpeRatio} subValue="Risk Adjusted" color="purple" />
                    <StatWidget label="RISK VAR95" value={`${analytics.quantMetrics.var95}%`} subValue="Stable" color="amber" />
                </div>

                <div className="col-span-12 lg:col-span-8">
                    <Card title="Cumulative Economic Projection" subValue="Financial forecasting over 5 years (Line View)" icon={TrendingUp}>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={analytics.economicProjection} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                                    <XAxis dataKey="year" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} padding={{ left: 20, right: 20 }} />
                                    <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(v) => `${v}B`} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{backgroundColor: '#FFF', borderRadius: '8px', border: '1px solid #E2E8F0'}} />
                                    <Legend verticalAlign="top" height={36}/>
                                    <Line type="monotone" dataKey="benefit" stroke="#10B981" strokeWidth={3} dot={{r: 4}} name="Benefit Stream" />
                                    <Line type="monotone" dataKey="cost" stroke="#F43F5E" strokeWidth={3} dot={{r: 4}} name="Cost Structure" />
                                    <Line type="monotone" dataKey="netValue" stroke="#3B82F6" strokeWidth={4} dot={{r: 6}} name="Net Value (NPV)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                <div className="col-span-12 lg:col-span-4">
                    <Card title="Prioritization Matrix" subValue="Driven by Audit Log Scores" icon={MoveUpRight}>
                        <div className="h-[250px] w-full relative border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden">
                            <div className="absolute top-1/2 w-full h-[1px] bg-slate-300 dark:bg-slate-600 z-0"></div>
                            <div className="absolute left-1/2 h-full w-[1px] bg-slate-300 dark:bg-slate-600 z-0"></div>
                            <span className="absolute top-2 left-2 text-[10px] text-slate-400 font-bold">High Value</span>
                            <span className="absolute bottom-2 right-2 text-[10px] text-slate-400 font-bold">Easy Effort</span>
                            <div className="absolute w-6 h-6 bg-blue-600 rounded-full border-4 border-white dark:border-slate-800 shadow-lg z-10 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000" style={{ top: `${100 - matrixData.y}%`, left: `${matrixData.x}%` }}>
                                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold uppercase">{matrixData.quadrant}</span>
                        </div>
                    </Card>
                </div>
            </div>
        )}

        {/* --- 2. INTELLIGENCE GRAPH --- */}
        {activeTab === 'NETWORK' && (
            <div className="col-span-12 animate-fade-in">
                <Card title="Project Intelligence Graph" subValue={`${data.intelligenceGraph?.nodes.length || 0} Connected Data Points`} icon={Network} className="bg-slate-950 border-slate-800">
                    <div className="mb-4 text-xs text-slate-400 flex gap-4">
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Project</span>
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Requirement</span>
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500"></span>Risk</span>
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500"></span>Stakeholder</span>
                    </div>
                    {data.intelligenceGraph ? (
                        <IntelligenceGraph nodes={data.intelligenceGraph.nodes} edges={data.intelligenceGraph.edges} />
                    ) : (
                        <div className="h-[400px] flex items-center justify-center text-slate-500">Generating graph data...</div>
                    )}
                </Card>
            </div>
        )}

        {/* --- 3. PREDICTIVE GOVERNANCE --- */}
        {activeTab === 'PREDICTION' && (
            <div className="grid grid-cols-12 gap-6 animate-fade-in">
                <div className="col-span-12 lg:col-span-8">
                    <Card title="Predictive Governance Layer" subValue="Future Risk Forecasting" icon={RadarIcon}>
                        <div className="grid grid-cols-2 gap-6">
                            <div className={`p-6 rounded-xl border-2 flex flex-col items-center justify-center text-center ${predictiveMetrics.weather === 'CLEAR' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : predictiveMetrics.weather === 'CLOUDY' ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' : 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800'}`}>
                                <h3 className="text-xs font-bold uppercase tracking-widest mb-2 opacity-70">Governance Weather</h3>
                                <div className="text-4xl font-black mb-1">{predictiveMetrics.weather}</div>
                                <div className="text-sm font-bold opacity-80">Failure Prob: {predictiveMetrics.failureProb}%</div>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span>Template Drift Probability</span>
                                        <span className="text-blue-600">{predictiveMetrics.drift}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div className="bg-blue-500 h-full" style={{width: `${predictiveMetrics.drift}%`}}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span>Audit Vulnerability</span>
                                        <span className="text-rose-600">{predictiveMetrics.auditVulnerability}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div className="bg-rose-500 h-full" style={{width: `${predictiveMetrics.auditVulnerability}%`}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Pre-Crime Prevention triggers</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {data.analytics.riskAnalysis.slice(0,2).map((risk, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <ShieldAlert className="w-5 h-5 text-amber-500" />
                                        <div>
                                            <div className="text-xs font-bold">{risk.category}</div>
                                            <div className="text-[10px] text-slate-500">Preventive Action Required</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>
                <div className="col-span-12 lg:col-span-4">
                    <Card title="Strategic Risk Radar" icon={Target}>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                                    { subject: 'Regulatory', A: 100 - (analytics.auditState.val_regulation.options[analytics.auditState.val_regulation.selectedOptionIndex]?.value * 20 || 0), fullMark: 100 },
                                    { subject: 'Technical', A: 100 - (analytics.auditState.eff_tech.options[analytics.auditState.eff_tech.selectedOptionIndex]?.value * 20 || 0), fullMark: 100 },
                                    { subject: 'Financial', A: analytics.quantMetrics.volatility * 100, fullMark: 100 },
                                    { subject: 'Operational', A: 100 - (analytics.auditState.eff_complexity.options[analytics.auditState.eff_complexity.selectedOptionIndex]?.value * 20 || 0), fullMark: 100 },
                                    { subject: 'Political', A: 60, fullMark: 100 },
                                ]}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="Risk Exposure" dataKey="A" stroke="#F43F5E" strokeWidth={2} fill="#F43F5E" fillOpacity={0.2} />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            </div>
        )}

        {/* --- 4. AUDIT MATRIX --- */}
        {activeTab === 'AUDIT' && (
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AuditItem category={localAuditState.val_efficiency} catKey="val_efficiency" />
                    <AuditItem category={localAuditState.val_regulation} catKey="val_regulation" />
                    <AuditItem category={localAuditState.val_user} catKey="val_user" />
                    <AuditItem category={localAuditState.val_biz_impact} catKey="val_biz_impact" />
                    <AuditItem category={localAuditState.eff_duration} catKey="eff_duration" />
                    <AuditItem category={localAuditState.eff_complexity} catKey="eff_complexity" />
                    <AuditItem category={localAuditState.eff_tech} catKey="eff_tech" />
                    <AuditItem category={localAuditState.eff_strategy} catKey="eff_strategy" />
                </div>
                <div className="col-span-12 lg:col-span-3 space-y-6">
                    <div className="bg-[#D35400] text-white p-8 rounded-2xl shadow-xl relative overflow-hidden flex flex-col items-center text-center border-4 border-white dark:border-slate-800">
                        <div className="relative z-10">
                            <h4 className="text-xs font-bold uppercase border-b border-white/20 pb-2 mb-4 inline-block tracking-widest">PRIORITY PULSE</h4>
                            <div className="text-7xl font-black mb-2">{matrixData.pulse}</div>
                            <div className="text-lg font-bold uppercase tracking-wide opacity-90">{data.stats.priorityLabel}</div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Analytics;
