

export interface ScoringCriteria {
  parameter: string;
  score: number;
  max: number;
  reason: string;
  weight?: number; 
}

export interface Task {
  id: string;
  name: string;
  start: string; 
  end: string;   
  pic: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  dependency?: string; 
  progress: number; 
}

// --- ADIE CORE STRUCTURES ---

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AIFieldMeta {
    confidence: ConfidenceLevel;
    sourceRef?: string; // e.g., "Extracted from Page 2, Paragraph 1"
    reasoning?: string;
    isManualOverride?: boolean;
    lastUpdated?: string;
}

export interface ExecutiveReviewResult {
    readinessScore: number; // 0-100
    status: 'READY_FOR_SIGNATURE' | 'NEEDS_REVISION' | 'CRITICAL_GAPS';
    findings: {
        section: string;
        severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
        issue: string;
        recommendation: string;
    }[];
    timestamp: string;
}

// --- WORKSPACE ARCHITECTURE (NEW) ---

export type BlockType = 'TEXT' | 'TABLE' | 'METRIC' | 'APPROVAL' | 'DIAGRAM' | 'RISK_MATRIX';

export interface WorkspaceBlock {
    id: string;
    type: BlockType;
    title?: string;
    content: any; // Text string or DocTable
    meta?: AIFieldMeta;
    isLocked?: boolean;
    aiSuggestions?: string[];
}

export interface WorkspaceSection {
    id: string;
    title: string;
    order: number;
    blocks: WorkspaceBlock[];
    lastModified: string;
}

export interface WorkspaceDocument {
    id: string;
    type: StrictDocType;
    title: string;
    status: 'DRAFT' | 'REVIEW' | 'APPROVED';
    sections: WorkspaceSection[];
    version: string;
}

// --- GRAPH STRUCTURES ---
export type NodeType = 'PROJECT' | 'DOCUMENT' | 'REQUIREMENT' | 'RISK' | 'STAKEHOLDER' | 'REGULATION' | 'DECISION' | 'MODULE' | 'AUDIT_SCORE';

export interface GraphNode {
    id: string;
    label: string;
    type: NodeType;
    data: any;
    confidence: number;
}

export interface GraphEdge {
    source: string;
    target: string;
    relation: 'HAS_DOCUMENT' | 'DERIVES' | 'DEFINES' | 'HAS_RISK' | 'MITIGATED_BY' | 'SCORED_BY' | 'INFLUENCES' | 'GENERATES' | 'VALIDATES';
}

export interface VerificationIssue {
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    message: string;
    nodeId?: string;
    recommendation: string;
}

export interface AuditQuestion {
    question: string;
    answer: string;
    status: 'PASSED' | 'FAILED';
    traceability_source?: string;
}

export interface AuditSimulation {
    audit_readiness: 'READY' | 'AT_RISK' | 'FAILED';
    audit_score: number;
    simulated_questions: AuditQuestion[];
    timestamp: string;
}

export interface VerificationResult {
    verified: boolean;
    score: number;
    issues: VerificationIssue[];
    lineageMap: string; // ID hash
    governanceMeta?: GovernanceMeta; 
    auditSimulation?: AuditSimulation; 
}

export type StrictDocType = 'TOR' | 'KAJIAN' | 'RESEARCH' | 'BRD' | 'CHARTER' | 'FSD' | 'LEGAL' | 'SPREADSHEET' | 'GOVT_TEMPLATE' | 'ACADEMIC_PAPER' | 'UNKNOWN';

export interface DocumentClassification {
    type: StrictDocType;
    confidence: number;
    origin: 'CLIENT' | 'INTERNAL';
    processingPriority: 'HIGH' | 'NORMAL' | 'LOW';
    routingRule?: string; 
}

export interface GovernanceMeta {
    templateVersion: string;
    engineStatus: 'SECURE' | 'BYPASS_ATTEMPTED';
    complianceScore: number;
    blockedSections: string[];
    timestamp: string;
    constitutionalHash?: string; 
    decisionLineage?: string[];
}

export interface DocumentVersion {
    id: string;
    timestamp: string;
    note: string;
    content: string; 
    tables?: DocTable[]; 
    erd?: string;        
    sql?: string;        
}

export interface FlowchartVersion {
    id: string;
    code: string;
    timestamp: string;
    notes: string;
}

export interface DocTable {
    id: string;
    title: string;
    headers: string[];
    rows: string[][];
    // New types for SmartTable logic
    type?: 'GENERIC' | 'UCP_ACTOR' | 'UCP_USECASE' | 'RAB' | 'SCHEDULE'; 
}

export interface StrategicAnalysis {
    executiveSummary: string;
    executiveSummaryMeta?: AIFieldMeta; // ADIE Traceability
    problemStatement: string;
    problemStatementMeta?: AIFieldMeta; // ADIE Traceability
    businessObjectives: string[];
    businessValue: string;
    businessValueMeta?: AIFieldMeta; // ADIE Traceability
    successMetrics: { kpi: string; target: string }[];
    assumptions: string[];
    constraints: string[];
    stakeholderMatrix: { role: string; interest: 'High' | 'Low'; power: 'High' | 'Low'; strategy: string }[];
}

export interface BIAAnalysis {
    processDescription: string;
    impacts: {
        operational: 'High' | 'Medium' | 'Low';
        financial: 'High' | 'Medium' | 'Low';
        reputational: 'High' | 'Medium' | 'Low';
        legal: 'High' | 'Medium' | 'Low';
    };
    rto: string; 
    rpo: string; 
    risks: {
        id: string;
        risk: string;
        level: 'Tinggi' | 'Sedang' | 'Rendah';
        impact: string;
        mitigation: string;
    }[];
}

export interface NFR {
    category: 'Performance' | 'Security' | 'Reliability' | 'Scalability' | 'Integration';
    requirement: string;
}

export interface ProjectDocuments {
  tor: string;
  research: string;
  fsd: string;
  brd: string;
  flowchart: string; 
  erd?: string;      
  sql?: string;      
  flowchartVersions?: FlowchartVersion[]; 
  tables?: Record<string, DocTable[]>; 
  history?: Record<string, DocumentVersion[]>; 
  // NEW WORKSPACE DATA
  workspaces?: Record<string, WorkspaceDocument>; 
}

export interface EconomicMetric {
  year: string;
  cost: number;
  benefit: number;
  netValue: number;
}

export interface SentimentMetric {
  segment: string;
  approval: number;
  friction: number;
}

export interface QuantMetrics {
  sharpeRatio: number;
  volatility: number; 
  alpha: number;
  beta: number;
  var95: number; 
  expectedShortfall: number;
  irr: number; 
  npv: number; 
}

export interface SimulationRun {
  runId: number;
  name?: string; 
  color?: string; 
  data: { step: number; value: number }[];
}

export interface SavedScenario {
    id: string;
    name: string;
    color: string;
    runs: SimulationRun[];
    params: ScenarioParams;
    gbmParams?: { drift: number; volatility: number }; 
    confidence: number;
    metrics?: { npv: number; irr: number; risk: number }; 
}

export interface SimulationResult {
    runs: SimulationRun[];
    confidenceScore: number;
    marketAnalysis: string;
    citations?: { uri: string; title: string }[];
    sensitivityAnalysis?: { parameter: string, impactScore: number }[]; 
    strategicTips?: string[]; 
}

export type SimulationDataSource = 'DATABASE' | 'INTERNET' | 'HYBRID';

export interface AuditOption {
    label: string;
    value: number;
    description?: string;
    riskImplication?: string; 
}

export interface AuditCategory {
    id: string;
    title: string;
    group: 'BUSINESS_VALUE' | 'EFFORT'; 
    selectedOptionIndex: number; 
    options: AuditOption[];
}

export interface AuditState {
    val_efficiency: AuditCategory;
    val_user: AuditCategory;
    val_regulation: AuditCategory;
    val_biz_impact: AuditCategory;
    eff_duration: AuditCategory;
    eff_tech: AuditCategory;
    eff_complexity: AuditCategory;
    eff_strategy: AuditCategory;
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    previousValue: string;
    newValue: string;
    justification: string;
    category: 'TECHNICAL' | 'POLITICAL' | 'BUDGETARY';
    feedback?: any; 
}

export interface CausalNode {
    cause: string;
    effect: string;
    magnitude: string; 
    probability: string; 
}

export interface PortfolioImpact {
    projectName: string;
    impactType: 'DELAY' | 'CANCEL' | 'BUDGET_CUT';
    impactValue: string;
}

export interface DecisionTraceItem {
  label: string;
  value: string;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export interface DecisionClimate {
    status: 'STABLE' | 'VOLATILE' | 'CRITICAL';
    volatilityIndex: number; 
    reversalRisk: number; 
    weatherShort: string; 
}

export interface BoardroomDefense {
    statement: string;
    bulletPoints: string[];
}

export interface Regulation {
    id: string;
    name: string;
    version: string;
    status: 'ACTIVE' | 'REVIEW_NEEDED' | 'DEPRECATED';
    lastValidated: string;
}

export interface AITransparency {
    influenceScore: number; 
    primaryAssumption: string; 
    humanOverrideActive: boolean;
    dataSources?: string[];
    confidenceLevel?: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
    attachments?: { type: 'image' | 'file', content: string, name: string }[];
}

// --- PIO (Project Intelligence Object) Intermediate Structures ---
export interface PIO_Ingest {
    project_name: string;
    executive_summary: string;
    executive_summary_meta?: AIFieldMeta;
    legal_basis: string[];
    objectives: string[];
    stakeholders: { role: string; interest: string; power: string }[];
    budget_signal: number; // in Billions
    timeline_signal: number; // in Months
    technical_stack_signal: string[];
}

export interface PIO_Architecture {
    actors: string[];
    modules: string[];
    integrations: string[];
    security_level: string;
    data_classification: string;
    use_cases: { code: string; name: string }[];
    detailed_actors?: { name: string; type: 'Simple' | 'Average' | 'Complex'; desc: string }[];
}

export interface PIO_Compliance {
    risk_score: number;
    regulations: Regulation[];
    audit_state_indices: Record<string, number>;
}

export interface AnalyticsData {
  recommendation: {
    action: 'PROCEED' | 'HOLD' | 'REJECT';
    condition: string;
    urgency: 'IMMEDIATE' | 'NEXT_FISCAL';
    confidenceScore: number;
  };
  worstCaseScenario: {
    title: string;
    narrative: string;
    triggerCondition: string;
  };
  portfolioImpact: PortfolioImpact[];
  decisionTrace: DecisionTraceItem[];
  economicProjection: EconomicMetric[];
  socialSentiment: SentimentMetric[];
  riskAnalysis: {
    category: string;
    probability: number;
    impact: number;
    mitigationCost: number;
  }[];
  marketContext: string;
  futureOutlook: string;
  quantMetrics: QuantMetrics;
  monteCarloSim: SimulationRun[];
  simulationComparison?: {
      scenarios: SavedScenario[];
      analysis: string;
      winnerId: string;
  };
  executiveReview?: ExecutiveReviewResult; // NEW: The "Killer Feature" result
  auditState: AuditState; 
  auditLogs: AuditLogEntry[];
  causalChain: CausalNode[];
  baseParams: {
    initialInvestment: number;
    annualOpex: number;
    annualRevenue: number;
    discountRate: number; 
  };
  decisionClimate: DecisionClimate;
  boardroomDefense: BoardroomDefense;
  regulations: Regulation[];
  aiTransparency: AITransparency;
}

export interface EstimationLock {
    isLocked: boolean;
    lockedAt?: string;
    lockedBy?: string;
}

export interface ProjectData {
  meta: {
    theme: string;
    createdAt: string;
    department: string;
    unit_tik: string; // New
    pic_name: string; // New
    pic_contact: string; // New
    classification?: DocumentClassification; 
    verification?: VerificationResult;
    governance?: GovernanceMeta; 
    estimationLock?: EstimationLock; 
  };
  // New: Raw Graph Data accessible to UI
  intelligenceGraph?: {
      nodes: GraphNode[];
      edges: GraphEdge[];
  };
  scoring: ScoringCriteria[];
  charter: Task[];
  strategicAnalysis: StrategicAnalysis; 
  bia?: BIAAnalysis; // New
  nfr?: NFR[]; // New
  documents: ProjectDocuments;
  analytics: AnalyticsData;
  stats: {
    totalScore: number;
    priorityLabel: string;
    riskLevel: string;
    efficiencyGain: string;
  };
  // Internal PIO State (Optional trace)
  pioTrace?: {
      ingest: PIO_Ingest;
      arch: PIO_Architecture;
      compliance: PIO_Compliance;
  };
}

export interface UserSettings {
  darkMode: boolean;
  aiCreativity: number;
  riskTolerance: 'Conservative' | 'Balanced' | 'Aggressive';
  autoSave: boolean;
  density: 'Compact' | 'Comfortable';
}

export interface ScenarioParams {
  budgetVariance: number;
  adoptionRate: number;
  timelineDelay: number;
  marketRisk: number;
  taxRate: number;
  inflation: number;
  regulatoryCost: number;
}

export type InputMode = 'DEMO' | 'UPLOAD';
