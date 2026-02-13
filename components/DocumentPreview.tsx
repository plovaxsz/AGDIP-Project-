
import React, { useState, useEffect, useCallback } from 'react';
import { ProjectDocuments, ProjectData, WorkspaceDocument, WorkspaceSection, WorkspaceBlock, DocTable, ExecutiveReviewResult } from '../types';
import { createStrictDocx } from '../services/docxGenService';
import { runExecutiveSimulationAgent } from '../services/aiService'; 
import { FileDown, ArrowLeft, Plus, Trash2, GripVertical, Bot, Sparkles, Lock, Unlock, ChevronDown, ChevronRight, Eye, Save, Wand2, FileText, CheckCircle2, AlertTriangle, Layout, Maximize2, Calculator, Settings, Files } from 'lucide-react';
import FileSaver from 'file-saver';
import SmartTable from './SmartTable';
import { formatIDR } from '../utils/currency';

interface DocumentWorkspaceProps {
  docs: ProjectDocuments;
  title: string;
  fullData?: ProjectData;
  onUpdate?: (data: ProjectData) => void;
  onBack?: () => void;
}

// --- PATENT PARAMETERS (LOCKED BY GOVERNANCE) ---
const TCF = 0.87;
const ECF = 0.77;
const PHM_MULTIPLIER = 20; // Standard government multiplier
const DAYS_DIVISOR = 8;
const MONTH_DIVISOR = 22;

// Standard Inkindo 2023 Rates (Example)
const RATES: Record<string, number> = {
    'Project Manager': 28150000,
    'Business Analyst': 21950000,
    'System Analyst': 21950000,
    'Programmer': 21950000,
    'Quality Control': 13950000,
    'Quality Assurance': 13950000,
    'Technical Writer': 13950000,
    'Tester': 13950000
};

// Fixed Effort Distribution % (Based on 24 MM Base)
const EFFORT_DIST_PCT: Record<string, number> = {
    'Needs analysis': 0.016,
    'Specification': 0.075,
    'Design': 0.060,
    'Implementation (Coding)': 0.520,
    'Acceptance & installation': 0.055,
    'Project management': 0.038,
    'Configuration management': 0.043,
    'Documentation': 0.084,
    'Training & technical support': 0.010,
    'Integrated testing': 0.070,
    'Quality assurance': 0.009,
    'Evaluation & testing': 0.020
};

const ACTIVITY_ROLE_MAP: Record<string, string> = {
    'Needs analysis': 'Business Analyst',
    'Specification': 'System Analyst',
    'Design': 'System Analyst',
    'Implementation (Coding)': 'Programmer',
    'Acceptance & installation': 'System Analyst',
    'Project management': 'Project Manager',
    'Configuration management': 'System Analyst',
    'Documentation': 'Technical Writer',
    'Training & technical support': 'Technical Writer',
    'Integrated testing': 'Tester',
    'Quality assurance': 'Tester',
    'Evaluation & testing': 'Tester'
};

// --- MOCK WORKSPACE GENERATOR ---
const generateWorkspaceFromLegacy = (legacyDocs: ProjectDocuments, fullData: ProjectData): WorkspaceDocument[] => {
    // 1. RESEARCH & ESTIMATION DOC
    const researchDoc: WorkspaceDocument = {
        id: 'doc-research',
        type: 'RESEARCH',
        title: 'Kajian Kebutuhan & Estimasi Biaya',
        status: 'DRAFT',
        version: '1.0',
        sections: [
            {
                id: 'sec-exec',
                title: '1. Executive Summary',
                order: 0,
                lastModified: new Date().toISOString(),
                blocks: [
                    { id: 'b1', type: 'TEXT', content: fullData.strategicAnalysis.executiveSummary || "Deskripsi proyek..." },
                ]
            },
            {
                id: 'sec-uaw',
                title: '2. Perhitungan UAW (Actors)',
                order: 1,
                lastModified: new Date().toISOString(),
                blocks: [
                    { 
                        id: 'b_uaw', 
                        type: 'TABLE', 
                        content: {
                            id: 'uaw_table',
                            title: 'Unadjusted Actor Weight (UAW)',
                            headers: ['No', 'Aktor', 'Klasifikasi', 'Weight'],
                            rows: fullData.pioTrace?.arch.actors.map((a, i) => [(i+1).toString(), a, 'Complex', '3']) || [['1', 'Pengguna Jasa', 'Complex', '3']],
                            type: 'UCP_ACTOR'
                        } 
                    }
                ]
            },
            {
                id: 'sec-uucw',
                title: '3. Perhitungan UUCW (Use Cases)',
                order: 2,
                lastModified: new Date().toISOString(),
                blocks: [
                    { 
                        id: 'b_uucw', 
                        type: 'TABLE', 
                        content: {
                            id: 'uucw_table',
                            title: 'Unadjusted Use Case Weight (UUCW)',
                            headers: ['No', 'Use Case', 'Tipe', 'Trans.', 'Weight'],
                            rows: fullData.pioTrace?.arch.use_cases.map((uc, i) => [(i+1).toString(), uc.name, 'Average', '5', '10']) || [['1', 'Login', 'Simple', '1', '5']],
                            type: 'UCP_USECASE'
                        } 
                    }
                ]
            },
            {
                id: 'sec-rab',
                title: '4. Estimasi Biaya (RAB) - Auto Calculated',
                order: 3,
                lastModified: new Date().toISOString(),
                blocks: [
                    { 
                        id: 'b_rab', 
                        type: 'TABLE', 
                        content: {
                            id: 'rab_table',
                            title: 'Cost Estimation (Man-Month Distribution)',
                            headers: ['Fase / Aktivitas', 'Effort (%)', 'Effort (MM)', 'Role', 'Rate (IDR)', 'Biaya (IDR)'],
                            rows: [], // Will be populated by effect
                            type: 'RAB'
                        } 
                    }
                ]
            }
        ]
    };

    return [researchDoc];
};

const DocumentWorkspace: React.FC<DocumentWorkspaceProps> = ({ docs, title, fullData, onUpdate, onBack }) => {
  const [workspaces, setWorkspaces] = useState<WorkspaceDocument[]>([]);
  const [activeDocId, setActiveDocId] = useState<string>('');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Derived Metrics State
  const [metrics, setMetrics] = useState({ uaw: 0, uucw: 0, uucp: 0, ucp: 0, mm: 0, totalCost: 0 });

  // Init Workspace Data
  useEffect(() => {
      if (fullData && (!fullData.documents.workspaces || Object.keys(fullData.documents.workspaces).length === 0)) {
          const generated = generateWorkspaceFromLegacy(docs, fullData);
          setWorkspaces(generated);
          setActiveDocId(generated[0].id);
      } else if (fullData?.documents.workspaces) {
          // @ts-ignore
          const wsList = Object.values(fullData.documents.workspaces);
          setWorkspaces(wsList);
          if (wsList.length > 0) setActiveDocId(wsList[0].id);
      }
  }, []);

  // --- CALCULATION ENGINE ---
  useEffect(() => {
      if (workspaces.length === 0) return;
      recalculateProjectCost();
  }, [workspaces]);

  const recalculateProjectCost = () => {
      // Logic primarily applies to RESEARCH or COST documents
      const doc = workspaces.find(w => w.type === 'RESEARCH' || w.type === 'KAJIAN') || workspaces[0];
      if (!doc) return;

      let totalUAW = 0;
      let totalUUCW = 0;

      // 1. Gather UAW & UUCW from existing tables
      doc.sections.forEach((sec: WorkspaceSection) => {
          sec.blocks.forEach((block: WorkspaceBlock) => {
              if (block.type === 'TABLE') {
                  const table = block.content as DocTable;
                  if (table.type === 'UCP_ACTOR') {
                      totalUAW += table.rows.reduce((sum, r) => sum + (parseFloat(r[3]) || 0), 0);
                  }
                  if (table.type === 'UCP_USECASE') {
                      totalUUCW += table.rows.reduce((sum, r) => sum + (parseFloat(r[4]) || 0), 0);
                  }
              }
          });
      });

      // 2. Compute Strict Government Formulas
      const UUCP = totalUAW + totalUUCW;
      const UCP = UUCP * TCF * ECF;
      const PHM = UCP * PHM_MULTIPLIER;
      const WD = PHM / DAYS_DIVISOR;
      const MM = WD / MONTH_DIVISOR;

      setMetrics({ uaw: totalUAW, uucw: totalUUCW, uucp: UUCP, ucp: UCP, mm: MM, totalCost: 0 });

      // Update RAB table rows logic omitted to prevent loops, relying on explicit updateRAB where needed
  };

  const handleUpdateBlock = (sectionId: string, blockId: string, newContent: any) => {
      if (!activeDoc) return;
      
      const newSections = activeDoc.sections.map((sec: WorkspaceSection) => {
          if (sec.id === sectionId) {
              return {
                  ...sec,
                  blocks: sec.blocks.map((b: WorkspaceBlock) => b.id === blockId ? { ...b, content: newContent } : b)
              };
          }
          return sec;
      });

      const newDoc = { ...activeDoc, sections: newSections };
      
      // RUN CALCULATIONS ON THE NEW DOC STATE IMMEDIATELY
      if (newDoc.type === 'RESEARCH' || newDoc.type === 'KAJIAN') {
          updateRAB(newDoc); 
      } else {
          updateWorkspaceState(newDoc);
      }
  };

  const updateRAB = (doc: WorkspaceDocument) => {
      let totalUAW = 0;
      let totalUUCW = 0;

      // 1. Gather UAW & UUCW
      doc.sections.forEach((sec: WorkspaceSection) => {
          sec.blocks.forEach((block: WorkspaceBlock) => {
              if (block.type === 'TABLE') {
                  const table = block.content as DocTable;
                  if (table.type === 'UCP_ACTOR') {
                      totalUAW += table.rows.reduce((sum, r) => sum + (parseFloat(r[3]) || 0), 0);
                  }
                  if (table.type === 'UCP_USECASE') {
                      totalUUCW += table.rows.reduce((sum, r) => sum + (parseFloat(r[4]) || 0), 0);
                  }
              }
          });
      });

      const UUCP = totalUAW + totalUUCW;
      const UCP = UUCP * TCF * ECF;
      const PHM = UCP * PHM_MULTIPLIER;
      const WD = PHM / DAYS_DIVISOR;
      const MM = WD / MONTH_DIVISOR;

      setMetrics({ uaw: totalUAW, uucw: totalUUCW, uucp: UUCP, ucp: UCP, mm: MM, totalCost: 0 });

      // 2. Update RAB Table Rows
      const updatedSections = doc.sections.map((sec: WorkspaceSection) => ({
          ...sec,
          blocks: sec.blocks.map((block: WorkspaceBlock) => {
              if (block.type === 'TABLE' && (block.content as DocTable).type === 'RAB') {
                  let runningTotal = 0;
                  const newRows = Object.keys(EFFORT_DIST_PCT).map(activity => {
                      const pct = EFFORT_DIST_PCT[activity];
                      const effortMM = MM * pct;
                      const role = ACTIVITY_ROLE_MAP[activity];
                      const rate = RATES[role] || 0;
                      const cost = effortMM * rate;
                      runningTotal += cost;
                      return [activity, (pct * 100).toFixed(1) + '%', effortMM.toFixed(3), role, formatIDR(rate), formatIDR(cost)];
                  });

                  const warranty = runningTotal * 0.25;
                  const subTotal = runningTotal + warranty;
                  const ppn = subTotal * 0.11;
                  const grandTotal = subTotal + ppn;

                  newRows.push(['Total Effort Cost', '100%', MM.toFixed(2), '-', '-', formatIDR(runningTotal)]);
                  newRows.push(['Warranty (25%)', '-', '-', '-', '-', formatIDR(warranty)]);
                  newRows.push(['Sub Total', '-', '-', '-', '-', formatIDR(subTotal)]);
                  newRows.push(['PPN (11%)', '-', '-', '-', '-', formatIDR(ppn)]);
                  newRows.push(['TOTAL BIAYA (RAB)', '-', '-', '-', '-', formatIDR(grandTotal)]);

                  return {
                      ...block,
                      content: { ...block.content, rows: newRows }
                  };
              }
              return block;
          })
      }));

      updateWorkspaceState({ ...doc, sections: updatedSections });
  };

  const updateWorkspaceState = (newDoc: WorkspaceDocument) => {
      const newWorkspaces = workspaces.map(w => w.id === newDoc.id ? newDoc : w);
      setWorkspaces(newWorkspaces);
      if (onUpdate && fullData) {
          onUpdate({
              ...fullData,
              documents: {
                  ...fullData.documents,
                  workspaces: newWorkspaces.reduce((acc: Record<string, WorkspaceDocument>, w: WorkspaceDocument) => ({...acc, [w.id]: w}), {} as Record<string, WorkspaceDocument>)
              }
          });
      }
  };

  const handleAddSection = () => {
      if (!activeDoc) return;
      const newSection: WorkspaceSection = {
          id: `sec-${Date.now()}`,
          title: 'New Section',
          order: activeDoc.sections.length,
          lastModified: new Date().toISOString(),
          blocks: [{ id: `b-${Date.now()}`, type: 'TEXT', content: 'Start typing...' }]
      };
      updateWorkspaceState({ ...activeDoc, sections: [...activeDoc.sections, newSection] });
      setActiveSectionId(newSection.id);
  };

  const handleDeleteSection = (secId: string) => {
      if (!activeDoc) return;
      if (!confirm('Are you sure you want to delete this section?')) return;
      updateWorkspaceState({ ...activeDoc, sections: activeDoc.sections.filter(s => s.id !== secId) });
  };

  const exportToDocx = async () => {
      if (!fullData || !activeDoc) return;
      // @ts-ignore
      const blob = await createStrictDocx(fullData, activeDoc.type);
      FileSaver.saveAs(blob, `${activeDoc.type}_${title}.docx`);
  };

  const activeDoc = workspaces.find(w => w.id === activeDocId);

  if (!activeDoc && workspaces.length === 0) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#151521] overflow-hidden animate-fade-in relative">
      
      {/* 1. TOP BAR */}
      <div className="h-16 bg-white dark:bg-[#1E1E2D] border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 z-20 shadow-sm">
         <div className="flex items-center gap-4">
             {onBack && (
                <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500">
                    <ArrowLeft className="w-5 h-5"/>
                </button>
             )}
             <div>
                 <h1 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                     <Layout className="w-4 h-4 text-govt-blue"/> {activeDoc?.title || "Project Documents"}
                 </h1>
                 {activeDoc && (
                     <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                         <span className={`px-1.5 rounded ${activeDoc.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{activeDoc.status}</span>
                         <span>v{activeDoc.version}</span>
                     </div>
                 )}
             </div>
         </div>

         {/* LIVE METRICS PILL */}
         <div className="hidden md:flex items-center gap-6 bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
             <div className="flex flex-col items-center">
                 <span className="text-[9px] text-slate-400 font-bold uppercase">Total UCP</span>
                 <span className="text-xs font-mono font-bold text-blue-600">{metrics.ucp.toFixed(2)}</span>
             </div>
             <div className="w-px h-6 bg-slate-300 dark:bg-slate-600"></div>
             <div className="flex flex-col items-center">
                 <span className="text-[9px] text-slate-400 font-bold uppercase">Man Month</span>
                 <span className="text-xs font-mono font-bold text-purple-600">{metrics.mm.toFixed(2)}</span>
             </div>
             <div className="w-px h-6 bg-slate-300 dark:bg-slate-600"></div>
             <div className="flex flex-col items-center">
                 <span className="text-[9px] text-slate-400 font-bold uppercase">Est. Cost</span>
                 <span className="text-xs font-mono font-bold text-emerald-600">{formatIDR(metrics.totalCost, true)}</span>
             </div>
         </div>

         <div className="flex items-center gap-3">
             <button onClick={exportToDocx} className="flex items-center gap-2 px-3 py-1.5 bg-govt-blue hover:bg-govt-darkBlue text-white rounded-md text-xs font-bold shadow-md transition-all">
                <FileDown className="w-3 h-3"/> Export DOCX
             </button>
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
          
          {/* 2. SIDEBAR NAVIGATION */}
          <div className={`w-64 bg-white dark:bg-[#1E1E2D] border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-64 absolute h-full z-10'}`}>
              
              {/* NEW: DOCUMENT SWITCHER */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                   <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-2"><Files className="w-3 h-3"/> Documents</h3>
                   <div className="space-y-1">
                       {workspaces.map(doc => (
                           <button
                                key={doc.id}
                                onClick={() => { setActiveDocId(doc.id); setActiveSectionId(null); }}
                                className={`w-full text-left px-3 py-2 rounded-md text-xs font-bold transition-all border ${activeDocId === doc.id ? 'bg-white shadow-sm border-blue-200 text-blue-700 dark:bg-slate-800 dark:border-slate-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                           >
                               <div className="flex items-center justify-between">
                                  <span className="truncate">{doc.title}</span>
                                  {doc.type === 'KAJIAN' && <span className="text-[9px] px-1 bg-blue-100 text-blue-700 rounded">CORE</span>}
                               </div>
                           </button>
                       ))}
                   </div>
              </div>

              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex-1 overflow-y-auto">
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Section Outline</h3>
                  <div className="space-y-1">
                      {activeDoc?.sections.map(sec => (
                          <button 
                            key={sec.id}
                            onClick={() => {
                                setActiveSectionId(sec.id);
                                document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 truncate ${activeSectionId === sec.id ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/10' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0"></span>
                              <span className="truncate">{sec.title}</span>
                          </button>
                      ))}
                      <button onClick={handleAddSection} className="w-full mt-2 py-2 border border-dashed border-slate-300 rounded-md text-xs text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-1">
                          <Plus className="w-3 h-3"/> Add Section
                      </button>
                  </div>
              </div>
              <div className="p-4 mt-auto border-t border-slate-100 dark:border-slate-800">
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                      <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 mb-2">
                          <Lock className="w-3 h-3"/> Patent Parameters
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-400">
                          <div>TCF: {TCF}</div>
                          <div>ECF: {ECF}</div>
                          <div>PHM: {PHM_MULTIPLIER}</div>
                          <div>Days: {MONTH_DIVISOR}</div>
                      </div>
                  </div>
              </div>
          </div>

          {/* TOGGLE SIDEBAR BUTTON */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`absolute top-20 z-10 p-1 bg-white border border-slate-200 rounded-r-md shadow-sm text-slate-500 hover:text-blue-600 transition-transform duration-300 ${sidebarOpen ? 'left-64' : 'left-0'}`}
          >
              {sidebarOpen ? <ChevronDown className="w-4 h-4 rotate-90"/> : <ChevronRight className="w-4 h-4"/>}
          </button>

          {/* 3. MAIN EDITOR CANVAS */}
          <div className="flex-1 overflow-y-auto p-8 lg:px-16 scroll-smooth">
              <div className="max-w-4xl mx-auto space-y-12 pb-20">
                  
                  {/* Sections */}
                  {activeDoc?.sections.map((sec, index) => (
                      <div key={sec.id} id={sec.id} className="group relative transition-all duration-300">
                          
                          {/* Section Header */}
                          <div className="flex items-center gap-2 mb-4 group/header">
                              <div className="cursor-move text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <GripVertical className="w-4 h-4"/>
                              </div>
                              <input 
                                className="text-xl font-bold bg-transparent border-none focus:ring-0 p-0 text-slate-800 dark:text-white placeholder-slate-300 w-full"
                                value={sec.title}
                                onChange={(e) => {
                                    const newSec = { ...sec, title: e.target.value };
                                    const newDoc = { ...activeDoc, sections: activeDoc.sections.map(s => s.id === sec.id ? newSec : s) };
                                    updateWorkspaceState(newDoc);
                                }}
                              />
                              <div className="opacity-0 group-hover/header:opacity-100 flex items-center gap-1 transition-opacity">
                                  <button onClick={() => handleDeleteSection(sec.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded">
                                      <Trash2 className="w-4 h-4"/>
                                  </button>
                              </div>
                          </div>

                          {/* Blocks */}
                          <div className="space-y-4 pl-6 border-l-2 border-slate-100 dark:border-slate-800 group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-colors">
                              {sec.blocks.map(block => (
                                  <div key={block.id} className="relative">
                                      
                                      {/* Block Content */}
                                      {block.type === 'TEXT' && (
                                          <textarea 
                                            className="w-full bg-transparent border-none resize-none focus:ring-0 p-0 text-slate-600 dark:text-slate-300 leading-relaxed text-sm min-h-[100px]"
                                            value={block.content}
                                            onChange={(e) => handleUpdateBlock(sec.id, block.id, e.target.value)}
                                          />
                                      )}

                                      {block.type === 'TABLE' && (
                                          <SmartTable 
                                            data={block.content as DocTable} 
                                            onUpdate={(newData) => handleUpdateBlock(sec.id, block.id, newData)} 
                                          />
                                      )}

                                  </div>
                              ))}
                              
                              {/* Add Block Trigger */}
                              <div className="h-6 w-full opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer group/add">
                                  <button className="mx-2 p-1 rounded-full bg-blue-50 text-blue-500 shadow-sm border border-blue-200">
                                      <Plus className="w-3 h-3"/>
                                  </button>
                              </div>
                          </div>

                      </div>
                  ))}
                  
                  {!activeDoc && (
                      <div className="text-center text-slate-400 mt-20">
                          <p>No document selected. Please select a document from the sidebar.</p>
                      </div>
                  )}

                  {activeDoc && (
                      <div className="pt-20 text-center text-slate-400 text-sm">
                          <p>End of Document</p>
                          <div className="w-2 h-2 bg-slate-300 rounded-full mx-auto mt-2"></div>
                      </div>
                  )}

              </div>
          </div>

      </div>
    </div>
  );
};

export default DocumentWorkspace;
