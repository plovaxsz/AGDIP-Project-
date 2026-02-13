import React, { useState } from 'react';
import { ProjectData, Task, ScoringCriteria, GraphNode } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, AreaChart, Area, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell, Legend } from 'recharts';
import { CheckCircle2, TrendingUp, AlertTriangle, Download, FileSpreadsheet, File, Shield, ThermometerSun, Gavel, Calendar, ArrowRight, LayoutTemplate, Info, ChevronDown, ChevronUp, FileKey, Lightbulb, Briefcase, Zap, Activity, Milestone, Sliders, Network, Share2, GitBranch, ShieldCheck, Lock, Fingerprint, Clock, BarChart3, Brain, Target, Search, Microscope, Sparkles, ChevronRight, ShieldAlert, Award } from 'lucide-react';
import { exportProjectPackage } from '../services/fileGenService';
import { formatIDR } from '../utils/currency';

interface DashboardProps {
  data: ProjectData;
}

// --- ROBUST GANTT COMPONENT (ENHANCED) ---
const RobustGantt: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
    const validTasks = tasks.filter(t => {
        const s = new Date(t.start).getTime();
        const e = new Date(t.end).getTime();
        return !isNaN(s) && !isNaN(e) && e >= s;
    });

    if (validTasks.length === 0) return <div className="text-sm text-slate-400">No Valid Timeline</div>;

    const startDates = validTasks.map(t => new Date(t.start).getTime());
    const endDates = validTasks.map(t => new Date(t.end).getTime());
    const minDate = Math.min(...startDates);
    const maxDate = Math.max(...endDates);
    const totalDuration = Math.max(maxDate - minDate, 24 * 60 * 60 * 1000 * 30); // Min 30 days
    const padding = totalDuration * 0.05;
    const timelineStart = minDate - padding;
    const timelineDuration = (maxDate + padding) - timelineStart;

    const getX = (date: string) => ((new Date(date).getTime() - timelineStart) / timelineDuration) * 100;

    return (
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="relative p-6">
                 {/* Timeline Header Info */}
                 <div className="flex justify-between mb-4 text-[10px] text-slate-400 font-mono uppercase border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> Start: {new Date(minDate).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> Duration: {Math.ceil(totalDuration / (1000 * 60 * 60 * 24))} Days</span>
                    <span className="flex items-center gap-1"><Milestone className="w-3 h-3"/> Finish: {new Date(maxDate).toLocaleDateString()}</span>
                 </div>

                {validTasks.map((task, index) => {
                    const xStart = getX(task.start);
                    const width = Math.max(getX(task.end) - xStart, 1);
                    return (
                        <div key={task.id} className="group relative mb-6 last:mb-0">
                            <div className="flex items-center gap-4 z-10 relative">
                                <div className="w-1/4 min-w-[140px]">
                                    <div className="text-xs font-bold truncate text-slate-700 dark:text-slate-200">{task.name}</div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> {task.pic}
                                    </div>
                                </div>
                                <div className="flex-1 relative h-9 bg-slate-50 dark:bg-slate-800 rounded-md overflow-hidden border border-slate-100 dark:border-slate-700 shadow-inner">
                                    <div 
                                        className={`absolute top-1.5 bottom-1.5 rounded-sm flex items-center px-2 transition-all hover:brightness-110 cursor-pointer shadow-sm ${task.status === 'Completed' ? 'bg-emerald-500' : task.status === 'In Progress' ? 'bg-govt-blue' : 'bg-slate-400'}`}
                                        style={{ left: `${xStart}%`, width: `${width}%` }}
                                        title={`${task.name}: ${task.start} to ${task.end}`}
                                    >
                                        <span className="text-[9px] text-white font-bold truncate sticky left-2">
                                            {task.status === 'Completed' ? 'Done' : `${task.progress}%`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Date Labels below bar */}
                            <div className="flex pl-[25%] pl-4 mt-1 relative h-3 select-none pointer-events-none">
                                <span className="absolute text-[9px] font-mono text-slate-400" style={{ left: `${xStart}%` }}>
                                    {new Date(task.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                                <span className="absolute text-[9px] font-mono text-slate-400 text-right" style={{ left: `${xStart + width}%`, transform: 'translateX(-100%)' }}>
                                    {new Date(task.end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [exportConfirmOpen, setExportConfirmOpen] = useState(false);
  
  const radarData = data.scoring.map(s => ({
    subject: s.parameter,
    A: s.score,
    fullMark: s.max,
    reason: s.reason
  }));

  const handleExportClick = () => { setExportConfirmOpen(true); };
  const confirmExport = () => { exportProjectPackage(data); setExportConfirmOpen(false); };

  return (
    <div className="space-y-8 animate-fade-in relative font-sans text-slate-800 dark:text-slate-200">
      
      {/* EXPORT CONFIRMATION MODAL */}
      {exportConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#1E1E2D] rounded-lg shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-700 p-6 animate-scale-in">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                        <Download className="w-6 h-6 text-govt-blue dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Export Project Artifacts?</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        This will generate a formal ZIP package containing the Master TOR, BRD, FSD, and Financial Estimation Sheets.
                    </p>
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setExportConfirmOpen(false)} className="flex-1 py-2 rounded-md border border-slate-300 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                        <button onClick={confirmExport} className="flex-1 py-2 rounded-md bg-govt-blue text-white font-bold text-sm hover:bg-govt-darkBlue transition-colors shadow-md">Confirm Export</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* TOP METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* TOTAL SCORE CARD (MANDATORY) */}
          <div className="md:col-span-4 bg-white dark:bg-[#1E1E2D] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Award className="w-24 h-24"/></div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Project Suitability Score</h3>
                  <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-govt-blue dark:text-blue-400">{data.stats.totalScore}</span>
                      <span className="text-lg text-slate-400 font-medium">/ 100</span>
                  </div>
                  <div className="mt-4">
                      <span className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                          data.stats.totalScore >= 80 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          data.stats.totalScore >= 60 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                          {data.stats.priorityLabel}
                      </span>
                  </div>
              </div>
          </div>

          {/* AI RECOMMENDATION */}
          <div className="md:col-span-5 bg-white dark:bg-[#1E1E2D] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col justify-between">
              <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">AI Strategic Recommendation</h3>
                  <div className="flex items-center gap-3 mb-2">
                      {data.analytics.recommendation.action === 'PROCEED' ? 
                          <CheckCircle2 className="w-6 h-6 text-emerald-500"/> : 
                          <AlertTriangle className="w-6 h-6 text-amber-500"/>
                      }
                      <span className="text-xl font-bold text-slate-800 dark:text-white">{data.analytics.recommendation.action}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-l-2 border-govt-gold pl-3 italic">
                      "{data.analytics.recommendation.condition}"
                  </p>
              </div>
              <div className="flex justify-between items-center mt-4 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span>Confidence: {data.analytics.recommendation.confidenceScore}%</span>
                  <span>Urgency: {data.analytics.recommendation.urgency}</span>
              </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="md:col-span-3 bg-govt-blue text-white rounded-xl shadow-lg p-6 flex flex-col justify-center items-center text-center">
              <ShieldCheck className="w-10 h-10 mb-3 text-govt-gold"/>
              <h3 className="font-bold text-lg mb-1">Executive Report</h3>
              <p className="text-xs text-blue-200 mb-4 px-2">Generate standard compliance documents.</p>
              <button onClick={handleExportClick} className="w-full py-2 bg-white text-govt-blue font-bold rounded hover:bg-blue-50 transition-colors text-sm">
                  Download Package
              </button>
          </div>
      </div>

      {/* STRATEGIC ALIGNMENT & CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white dark:bg-[#1E1E2D] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <Target className="w-4 h-4 text-govt-blue"/> Assessment Radar
              </h3>
              <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                          <Radar name="Score" dataKey="A" stroke="#1F4E79" strokeWidth={2} fill="#1F4E79" fillOpacity={0.3} />
                          <Tooltip contentStyle={{backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px'}}/>
                      </RadarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-[#1E1E2D] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-govt-blue"/> Strategic Timeline (Gantt)
                  </h3>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 font-mono">Phase View</span>
              </div>
              <RobustGantt tasks={data.charter} />
          </div>
      </div>

      {/* FINANCIAL & RISK OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#1E1E2D] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Financial Projection (5 Years)</h3>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.analytics.economicProjection}>
                          <defs>
                              <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#1F4E79" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#1F4E79" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="year" axisLine={false} tickLine={false} fontSize={10} stroke="#64748b" />
                          <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#64748b" tickFormatter={(v) => `${v}B`} />
                          <Tooltip contentStyle={{backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '4px', fontSize: '12px'}} />
                          <Area type="monotone" dataKey="netValue" stroke="#1F4E79" strokeWidth={2} fillOpacity={1} fill="url(#colorNet)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white dark:bg-[#1E1E2D] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Risk & Compliance Profile</h3>
              <div className="space-y-4">
                  {data.analytics.riskAnalysis.map((risk, i) => (
                      <div key={i} className="flex items-center gap-4">
                          <div className="w-1/3 text-xs font-medium text-slate-600 dark:text-slate-300">{risk.category}</div>
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                  className={`h-full rounded-full ${risk.impact > 70 ? 'bg-rose-500' : risk.impact > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                  style={{width: `${risk.impact}%`}}
                              ></div>
                          </div>
                          <div className="w-12 text-right text-xs font-bold text-slate-500">{risk.impact}%</div>
                      </div>
                  ))}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Overall Risk Level</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${data.stats.riskLevel === 'Low' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {data.stats.riskLevel}
                      </span>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;