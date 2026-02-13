
import { ProjectData, Task, AnalyticsData, ScoringCriteria, Regulation, StrategicAnalysis, BIAAnalysis, NFR } from '../types';

// Helper for randomization
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateGovtDemoData = (themeInput: string): ProjectData => {
  const theme = themeInput.includes('Patroli') || themeInput === '' ? 'Modul Imsama (Impor Sementara Indonesia)' : themeInput;
  const investment = 0.69180417; 
  
  const scoring: ScoringCriteria[] = [
    { parameter: "Urgensi Regulasi", score: 9, max: 10, reason: "Mandatory: Percepatan layanan ekspor sesuai regulasi terbaru." },
    { parameter: "Dampak Efisiensi", score: 9, max: 10, reason: "Mengurangi Cost of Logistics sebesar 15%." },
    { parameter: "Kompleksitas Teknis", score: 7, max: 10, reason: "Integrasi Data Manifest dan Validasi NPWP Master Data." },
    { parameter: "Strategic Alignment", score: 10, max: 10, reason: "Target Outcome: Proses dokumen aju < 30 detik." }
  ];

  const totalScore = 88;

  const economicProjection = [2024, 2025, 2026, 2027, 2028].map((year, idx) => ({
      year: year.toString(),
      cost: idx === 0 ? investment : 0.05, 
      benefit: idx === 0 ? 0 : 0.5 + (idx * 0.2), 
      netValue: idx === 0 ? -investment : (0.5 + (idx * 0.2)) - 0.05
  }));

  const analytics: AnalyticsData = {
    recommendation: {
        action: 'PROCEED',
        condition: 'Strategic Mandate (High Value/Low Cost)',
        urgency: 'IMMEDIATE',
        confidenceScore: 98
    },
    worstCaseScenario: {
        title: 'Integrasi Manifest Gagal',
        narrative: 'Jika integrasi data manifest tidak real-time, validasi dokumen akan fallback ke manual.',
        triggerCondition: 'API Response Time > 2000ms'
    },
    portfolioImpact: [
        { projectName: 'Portal Pengguna Jasa', impactType: 'DELAY', impactValue: 'Dependency' },
    ],
    decisionTrace: [
        { label: 'Regulatory Mandate', value: 'High', impact: 'POSITIVE' },
    ],
    decisionClimate: { status: 'STABLE', volatilityIndex: 12, reversalRisk: 5, weatherShort: "Clear" },
    boardroomDefense: {
        statement: "Proses ini adalah mandat efisiensi logistik nasional.",
        bulletPoints: ["Target: Proses dokumen < 30 detik."]
    },
    regulations: [
        { id: '1', name: 'Regulasi Ekspor Terbaru', version: '2024', status: 'ACTIVE', lastValidated: '2024-01-01' }
    ],
    aiTransparency: { influenceScore: 90, primaryAssumption: "UCP Estimation valid.", humanOverrideActive: false },
    economicProjection,
    socialSentiment: [],
    riskAnalysis: [
        { category: 'Data Integration', probability: 30, impact: 80, mitigationCost: 0.05 },
        { category: 'User Adoption', probability: 20, impact: 60, mitigationCost: 0.02 },
    ],
    quantMetrics: { sharpeRatio: 2.5, volatility: 0.1, alpha: 0.05, beta: 0.8, var95: 5.0, expectedShortfall: 7.0, irr: 45.0, npv: 1.2 },
    monteCarloSim: [],
    marketContext: "Efisiensi ekspor adalah kunci daya saing nasional.",
    futureOutlook: "Dapat dikembangkan ke modul Impor dan FTZ.",
    baseParams: { initialInvestment: investment, annualOpex: 0.05, annualRevenue: 0.5, discountRate: 10 },
    auditState: {
        val_efficiency: { id: 'v1', title: 'EFFICIENCY', group: 'BUSINESS_VALUE', selectedOptionIndex: 2, options: [{label: 'Low', value: 1}, {label: 'Med', value: 2}, {label: 'High', value: 5}] },
        val_user: { id: 'v2', title: 'USER', group: 'BUSINESS_VALUE', selectedOptionIndex: 2, options: [{label: 'Internal', value: 1}, {label: 'Mixed', value: 3}, {label: 'Public', value: 5}] },
        val_regulation: { id: 'v3', title: 'REGULATION', group: 'BUSINESS_VALUE', selectedOptionIndex: 2, options: [{label: 'Optional', value: 1}, {label: 'Support', value: 3}, {label: 'Mandatory', value: 5}] },
        val_biz_impact: { id: 'v4', title: 'IMPACT', group: 'BUSINESS_VALUE', selectedOptionIndex: 2, options: [{label: 'Dept', value: 1}, {label: 'Div', value: 3}, {label: 'National', value: 5}] },
        eff_duration: { id: 'e1', title: 'DURATION', group: 'EFFORT', selectedOptionIndex: 1, options: [{label: '>12 Mo', value: 1}, {label: '6 Mo', value: 3}, {label: '<3 Mo', value: 5}] },
        eff_tech: { id: 'e2', title: 'TECH', group: 'EFFORT', selectedOptionIndex: 1, options: [{label: 'New Core', value: 1}, {label: 'Standard', value: 3}, {label: 'Simple', value: 5}] },
        eff_complexity: { id: 'e3', title: 'COMPLEXITY', group: 'EFFORT', selectedOptionIndex: 1, options: [{label: 'High', value: 1}, {label: 'Med', value: 3}, {label: 'Low', value: 5}] },
        eff_strategy: { id: 'e4', title: 'STRATEGY', group: 'EFFORT', selectedOptionIndex: 1, options: [{label: 'Outsource', value: 1}, {label: 'In-House', value: 3}] },
    },
    auditLogs: [],
    causalChain: []
  };

  const strategicAnalysis: StrategicAnalysis = {
    executiveSummary: "Penyempurnaan SKP Impor Sementara (Imsama) diperlukan untuk menyelaraskan proses bisnis-IT, mengakomodasi regulasi baru, dan mengoptimalkan pelayanan serta pengawasan.",
    problemStatement: "SKP yang ada sering error, output tidak terupdate, dan banyak probis impor sementara belum terakomodir/terintegrasi.",
    businessObjectives: [
        "Sistem aplikasi untuk stakeholder (importir) via portal pengguna jasa.",
        "Mengurangi Cost of Logistics sebesar 15% akibat efisiensi waktu tunggu di pelabuhan."
    ],
    businessValue: "Mengamankan hak keuangan negara; Mempermudah importir dengan pengajuan online.",
    successMetrics: [
        { kpi: "Processing Time", target: "< 30 Detik" },
        { kpi: "Cost of Logistics", target: "Turun 15%" },
        { kpi: "Completion Date", target: "2023-12-31" }
    ],
    assumptions: ["Data master NPWP tersedia."],
    constraints: ["Waktu pengembangan 6 bulan.", "Anggaran Rp 691 Juta."],
    stakeholderMatrix: [
        { role: "Dit. Teknis Kepabeanan", interest: "High", power: "High", strategy: "Manage Closely" },
    ]
  };

  const bia: BIAAnalysis = {
      processDescription: "Proses bisnis impor sementara mencakup perizinan, pemberitahuan pabean, dan pembayaran pungutan negara.",
      impacts: { operational: 'High', financial: 'High', reputational: 'High', legal: 'High' },
      rto: '4 Hours', rpo: '1 Day',
      risks: [
          { id: '1', risk: 'SKP sering mengalami gangguan', level: 'Tinggi', impact: 'Hambatan pelayanan', mitigation: 'Peningkatan stabilitas' },
      ]
  };

  const nfr: NFR[] = [
      { category: 'Performance', requirement: 'Sistem harus user-friendly.' },
      { category: 'Integration', requirement: 'Sistem harus terintegrasi dengan CEISA Impor.' }
  ];

  return {
    meta: {
      theme,
      createdAt: "2024-01-01",
      department: 'Direktorat Teknis Kepabeanan',
      unit_tik: 'Direktorat Teknis Kepabeanan',
      pic_name: 'Chotibul Umam',
      pic_contact: '197207021992121001',
      estimationLock: { isLocked: true } 
    },
    scoring,
    charter: [
        { id: '1', name: 'Project Charter Template', start: '2024-01-01', end: '2024-01-05', pic: 'PM', status: 'Completed', progress: 100 },
    ],
    strategicAnalysis,
    bia,
    nfr,
    documents: {
      research: "", tor: "", fsd: "", brd: "", flowchart: "",
      tables: {
          tor: [],
          brd: [
              { id: 'brd1', title: 'Kebutuhan Fungsional', headers: ['ID', 'Deskripsi Kebutuhan Fungsional', 'Prioritas'], rows: [['FR1', 'Modul Pendaftaran/Sign Up', 'Mandatory'], ['FR2', 'Modul Aplikasi Inhouse', 'Mandatory']] }
          ]
      }
    },
    analytics,
    stats: {
      totalScore,
      priorityLabel: "HIGH PRIORITY",
      riskLevel: "Low",
      efficiencyGain: "15%"
    },
    pioTrace: {
        ingest: { project_name: theme, executive_summary: strategicAnalysis.executiveSummary, legal_basis: [], objectives: [], stakeholders: [], budget_signal: 0.6, timeline_signal: 6, technical_stack_signal: [] },
        arch: { 
            actors: ['Pengguna Jasa', 'Analis', 'Admin IKC', 'Technical Support', 'Pegawai IKC', 'Seksi DIKC'], 
            modules: [], integrations: [], security_level: 'High', data_classification: 'Secret', 
            use_cases: [
                {code: 'UC1', name: 'Penerbitan Nopen'},
                {code: 'UC2', name: 'Home Portal'},
                {code: 'UC3', name: 'Knowledgebase'},
                {code: 'UC4', name: 'Perekaman Layanan Service Katalog'},
                {code: 'UC5', name: 'Manajemen Release'}
            ] 
        },
        compliance: { risk_score: 10, regulations: [], audit_state_indices: {} }
    }
  };
};
