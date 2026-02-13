import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DocumentPreview from './components/DocumentPreview';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import SimulationMode from './components/SimulationMode';
import ChatAssistant from './components/ChatAssistant'; 
import { orchestrateProjectAnalysis } from './services/aiService'; 
import { ProjectData, UserSettings } from './types';
import { UploadCloud, PlayCircle, Loader2, FileText, FileSpreadsheet, File, CheckCircle2, ShieldCheck } from 'lucide-react';
import * as XLSX from 'xlsx';
// @ts-ignore
import * as mammothProxy from 'mammoth';
// @ts-ignore
import * as pdfjsLibProxy from 'pdfjs-dist';

// Fix for library imports from ESM CDNs
// @ts-ignore
const mammoth = mammothProxy.default || mammothProxy;
// @ts-ignore
const pdfjsLib = pdfjsLibProxy.default || pdfjsLibProxy;

if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Initializing System...");
  const [themeInput, setThemeInput] = useState('Sistem Patroli Laut Terpadu');
  const [uploadedFileContent, setUploadedFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  
  // Enterprise Persistence Layer
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('govt_sys_settings');
      return saved ? JSON.parse(saved) : {
        darkMode: false,
        aiCreativity: 50, // More conservative default
        riskTolerance: 'Balanced',
        autoSave: true,
        density: 'Comfortable'
      };
    } catch(e) {
      return {
        darkMode: false,
        aiCreativity: 50,
        riskTolerance: 'Balanced',
        autoSave: true,
        density: 'Comfortable'
      };
    }
  });

  // Auto-Save Settings
  useEffect(() => {
    if (settings.autoSave) {
        setSaveStatus('saving');
        const timer = setTimeout(() => {
            localStorage.setItem('govt_sys_settings', JSON.stringify(settings));
            setSaveStatus('saved');
        }, 800); // Debounce save
        return () => clearTimeout(timer);
    }
  }, [settings]);

  // Theme Application
  useEffect(() => {
    if (settings.darkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const updateSettings = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateDemo = async () => {
    setLoading(true);
    setLoadingText("Accessing Secure Engine...");
    try {
      const input = uploadedFileContent || themeInput;
      const isFileUpload = !!uploadedFileContent;
      
      const data = await orchestrateProjectAnalysis(input, settings, isFileUpload, (msg) => {
          setLoadingText(msg);
      });
      
      setProjectData(data);
    } catch (error) {
      console.error("System Error:", error);
      alert("System processing failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if(confirm("Start new session? Current project data will be cleared.")) {
        setProjectData(null);
        setActiveTab('dashboard');
        setThemeInput('');
        setUploadedFileContent(null);
        setFileName(null);
        setFileType(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const extension = file.name.split('.').pop()?.toLowerCase();
    setFileType(extension || 'unknown');
    setLoading(true);
    setLoadingText("Scanning Document...");

    try {
        let content = "";
        if (extension === 'txt') {
            content = await file.text();
        } else if (extension === 'pdf') {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + "\n";
            }
            content = fullText;
        } else if (extension === 'docx' || extension === 'doc') {
            const arrayBuffer = await file.arrayBuffer();
            if (mammoth && mammoth.extractRawText) {
                const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                content = result.value;
            } else { throw new Error("Document parsing service unavailable."); }
        } else if (extension === 'xlsx' || extension === 'xls') {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            content = XLSX.utils.sheet_to_csv(worksheet);
        } else {
            alert("Unsupported file format.");
            setLoading(false);
            return;
        }
        setUploadedFileContent(content);
        setThemeInput(`File: ${file.name}`);
    } catch (err) {
        console.error("Read Error:", err);
        alert(`Document read error: ${(err as Error).message}`);
        setFileName(null);
        setUploadedFileContent(null);
    } finally {
        setLoading(false);
    }
  };

  if (!projectData) {
    return (
      <div className={`min-h-screen flex flex-col transition-colors duration-300 ${settings.darkMode ? 'bg-slate-950 text-white' : 'bg-govt-bg text-govt-text'}`}>
        <header className="bg-govt-blue py-6 px-8 flex items-center justify-between shadow-md border-b border-blue-900">
             <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-govt-gold rounded flex items-center justify-center font-bold text-govt-blue shadow-sm">
                    <ShieldCheck className="w-6 h-6"/>
                 </div>
                 <div>
                     <h1 className="text-white font-bold tracking-tight text-xl uppercase">Project Genie</h1>
                     <p className="text-blue-200 text-xs tracking-widest uppercase">Executive Governance Platform</p>
                 </div>
             </div>
             <div className="text-right hidden md:block">
                 <div className="text-white text-sm font-medium">Internal Use Only</div>
                 <div className="text-blue-300 text-xs">v4.2.0-Enterprise</div>
             </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-8">
              <div>
                  <h2 className={`text-3xl font-bold leading-tight mb-4 ${settings.darkMode ? 'text-white' : 'text-govt-darkBlue'}`}>
                    Institutional Document Automation
                  </h2>
                  <p className={`text-base leading-relaxed ${settings.darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Generate audit-ready Project Charters, BRDs, and Feasibility Studies compliant with national standards. Upload your TOR or define a scope to begin.
                  </p>
              </div>
              
              <div className={`p-8 rounded-xl shadow-sm border-2 ${settings.darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-govt-border'}`}>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${settings.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Project Directive / Title</label>
                <input 
                    type="text" 
                    value={themeInput}
                    disabled={!!uploadedFileContent}
                    onChange={(e) => setThemeInput(e.target.value)}
                    className={`w-full p-4 border rounded-lg mb-6 font-medium focus:ring-2 focus:ring-govt-blue focus:border-govt-blue outline-none transition-all ${settings.darkMode ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500 disabled:opacity-50' : 'border-slate-300 bg-slate-50 text-slate-900 disabled:opacity-50'}`}
                    placeholder="e.g. Sistem Informasi Manajemen Kepegawaian Nasional"
                />
                
                {uploadedFileContent && (
                    <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-4 text-sm text-emerald-800 dark:text-emerald-400">
                        {fileType?.includes('xls') ? <FileSpreadsheet className="w-6 h-6"/> : fileType === 'pdf' ? <FileText className="w-6 h-6" /> : <File className="w-6 h-6" />}
                        <div className="flex-1 overflow-hidden">
                            <span className="font-bold block text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-500">{fileType} Document Detected</span>
                            <span className="truncate block font-medium">{fileName}</span>
                        </div>
                        <button onClick={() => { setUploadedFileContent(null); setThemeInput(''); setFileName(null); }} className="px-3 py-1 bg-white dark:bg-slate-800 rounded border border-emerald-200 hover:bg-emerald-50 text-xs font-bold shadow-sm">Remove</button>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={handleGenerateDemo}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-govt-blue text-white py-4 rounded-lg font-bold hover:bg-govt-darkBlue transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm uppercase tracking-wide"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <PlayCircle className="w-5 h-5" />}
                        {loading ? "Processing..." : "Initiate Analysis"}
                    </button>
                    
                    <label className={`flex items-center justify-center gap-2 border-2 border-dashed py-4 rounded-lg font-bold transition-all cursor-pointer text-sm uppercase tracking-wide ${settings.darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:border-slate-400'}`}>
                        <UploadCloud className="w-5 h-5" />
                        Upload Document
                        <input type="file" accept=".txt,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileUpload} className="hidden" />
                    </label>
                </div>
                {loading && (
                    <div className="mt-6 flex flex-col items-center gap-2">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                            <div className="bg-govt-blue h-full animate-progress-indeterminate"></div>
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{loadingText}</span>
                    </div>
                )}
              </div>
            </div>

            <div className="hidden md:block relative">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-govt-gold rounded-full filter blur-[128px] opacity-10"></div>
                 <div className="absolute bottom-0 left-0 w-64 h-64 bg-govt-blue rounded-full filter blur-[128px] opacity-10"></div>
                 <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-1 shadow-2xl border border-slate-200 dark:border-slate-700 transform rotate-1 hover:rotate-0 transition-transform duration-700">
                    <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1000" alt="Dashboard Preview" className="rounded-xl opacity-90 grayscale hover:grayscale-0 transition-all duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-govt-darkBlue/80 to-transparent rounded-xl flex items-end p-8">
                        <div>
                            <h3 className="text-white font-bold text-xl mb-1">Strategic Oversight</h3>
                            <p className="text-blue-100 text-sm">Data-driven governance for complex projects.</p>
                        </div>
                    </div>
                 </div>
            </div>

          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen font-sans transition-colors duration-300 ${settings.darkMode ? 'bg-slate-950 text-white' : 'bg-govt-bg text-govt-text'}`}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onReset={handleReset} />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <header className="flex justify-between items-start mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase rounded tracking-wider">Project ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                    {saveStatus === 'saving' && <span className="text-[10px] text-govt-blue dark:text-blue-400 font-medium animate-pulse flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Saving...</span>}
                    {saveStatus === 'saved' && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> All changes saved</span>}
                </div>
                <h1 className={`text-3xl font-extrabold tracking-tight ${settings.darkMode ? 'text-white' : 'text-govt-darkBlue'}`}>{projectData.meta.theme}</h1>
                <p className={`text-sm mt-1 font-medium ${settings.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Department: {projectData.meta.department} | Created: {projectData.meta.createdAt}</p>
            </div>
            <div className="flex items-center gap-3">
                 <span className="px-4 py-2 bg-govt-blue text-white text-xs font-bold rounded shadow-sm uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-govt-gold"/> Secure Environment
                 </span>
            </div>
        </header>

        {activeTab === 'dashboard' && <Dashboard data={projectData} />}
        {activeTab === 'docs' && <DocumentPreview docs={projectData.documents} title={projectData.meta.theme} fullData={projectData} onUpdate={(d) => setProjectData(d)} onBack={() => setActiveTab('dashboard')} />}
        {activeTab === 'analytics' && <Analytics data={projectData} setData={setProjectData} settings={settings} onBack={() => setActiveTab('dashboard')} />}
        {activeTab === 'simulation' && <SimulationMode data={projectData} onUpdateData={setProjectData} />}
        {activeTab === 'chat' && <ChatAssistant data={projectData} />}
        {activeTab === 'admin' && <Settings settings={settings} updateSettings={updateSettings} />}
      </main>
    </div>
  );
};

export default App;