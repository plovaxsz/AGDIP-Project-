import React from 'react';
import { LayoutDashboard, FileText, Settings, BarChart3, ShieldCheck, PlusCircle, BrainCircuit, MessageSquareText } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onReset: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onReset }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'docs', label: 'Dokumen', icon: FileText },
    { id: 'analytics', label: 'Analitik & Audit', icon: BarChart3 },
    { id: 'simulation', label: 'Simulasi AI', icon: BrainCircuit },
    { id: 'chat', label: 'Konsultasi AI', icon: MessageSquareText }, 
    { id: 'admin', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-govt-blue text-white min-h-screen flex flex-col fixed left-0 top-0 z-50 shadow-xl border-r border-slate-700">
      <div className="p-6 border-b border-slate-700 flex items-center gap-3 bg-slate-900/10">
        <div className="p-2 bg-govt-gold rounded-lg shadow-lg shadow-blue-900/50">
            <ShieldCheck className="w-6 h-6 text-govt-blue" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">GENIE</h1>
          <p className="text-[10px] text-slate-200 tracking-[0.2em] uppercase font-semibold">Executive</p>
        </div>
      </div>

      <div className="p-4">
        <button 
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-semibold transition-all shadow-lg border border-white/10 group"
        >
          <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span>Analisis Baru</span>
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden ${
              activeTab === item.id
                ? 'bg-slate-900/40 text-white border border-white/10'
                : 'text-slate-300 hover:bg-slate-900/20 hover:text-white'
            }`}
          >
            {activeTab === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-govt-gold rounded-l-lg"></div>
            )}
            <item.icon className={`w-5 h-5 transition-colors ${activeTab === item.id ? 'text-govt-gold' : 'text-slate-400 group-hover:text-slate-200'}`} />
            <span className="font-medium text-sm tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700 bg-slate-900/20">
        <div className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-4 backdrop-blur-sm">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">Status Sistem</p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-emerald-400">Aman & Terenkripsi</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;