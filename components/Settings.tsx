import React from 'react';
import { UserSettings } from '../types';
import { Moon, Sun, Monitor, Cpu, ShieldAlert, Layout } from 'lucide-react';

interface SettingsProps {
  settings: UserSettings;
  updateSettings: (key: keyof UserSettings, value: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, updateSettings }) => {
  const isDark = settings.darkMode;

  return (
    <div className={`max-w-4xl mx-auto space-y-8 animate-fade-in ${isDark ? 'text-white' : 'text-slate-900'}`}>
        <div className={`p-8 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                <div className="p-3 bg-blue-600 rounded-lg text-white"><Monitor className="w-6 h-6" /></div>
                <div>
                    <h2 className="text-2xl font-bold">Antarmuka & Personalisasi</h2>
                    <p className="text-slate-500">Sesuaikan lingkungan kerja Anda.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label className="block text-sm font-bold mb-3 uppercase tracking-wider text-slate-500">Tampilan</label>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => updateSettings('darkMode', false)}
                            className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${!settings.darkMode ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500 ring-offset-2' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800'}`}
                        >
                            <Sun className="w-6 h-6" />
                            <span className="font-semibold">Mode Terang</span>
                        </button>
                        <button 
                            onClick={() => updateSettings('darkMode', true)}
                            className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${settings.darkMode ? 'border-blue-500 bg-slate-800 text-blue-400 ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' : 'border-slate-200 hover:border-slate-300 bg-white text-slate-500'}`}
                        >
                            <Moon className="w-6 h-6" />
                            <span className="font-semibold">Mode Gelap</span>
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold mb-3 uppercase tracking-wider text-slate-500">Kepadatan Informasi</label>
                     <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {['Compact', 'Comfortable'].map((d) => (
                            <button
                                key={d}
                                onClick={() => updateSettings('density', d)}
                                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${settings.density === d ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                {d === 'Compact' ? 'Padat' : 'Nyaman'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <div className={`p-8 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                <div className="p-3 bg-purple-600 rounded-lg text-white"><Cpu className="w-6 h-6" /></div>
                <div>
                    <h2 className="text-2xl font-bold">Parameter Mesin AI</h2>
                    <p className="text-slate-500">Sesuaikan perilaku model generatif.</p>
                </div>
            </div>

            <div className="space-y-8">
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="font-bold flex items-center gap-2">
                            Indeks Kreativitas
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">v4.0 Model</span>
                        </label>
                        <span className="font-mono text-purple-600">{settings.aiCreativity}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" max="100" 
                        value={settings.aiCreativity}
                        onChange={(e) => updateSettings('aiCreativity', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <p className="text-xs text-slate-500 mt-2">Nilai yang lebih tinggi menghasilkan solusi yang lebih inovatif namun berpotensi kurang standar.</p>
                </div>

                <div>
                    <label className="block text-sm font-bold mb-3 uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" /> Profil Toleransi Risiko
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                        {['Conservative', 'Balanced', 'Aggressive'].map((mode) => (
                             <button
                                key={mode}
                                onClick={() => updateSettings('riskTolerance', mode)}
                                className={`py-3 px-4 rounded-lg border text-sm font-semibold transition-all ${
                                    settings.riskTolerance === mode 
                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' 
                                    : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 text-slate-500'
                                }`}
                            >
                                {mode === 'Conservative' ? 'Konservatif' : mode === 'Balanced' ? 'Seimbang' : 'Agresif'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Settings;