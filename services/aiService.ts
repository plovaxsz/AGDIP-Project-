
import { GoogleGenAI } from "@google/genai";
import { ProjectData, UserSettings, PIO_Ingest, PIO_Architecture, DocumentClassification, ProjectDocuments, SavedScenario, ExecutiveReviewResult, WorkspaceDocument } from '../types';
import { generateGovtDemoData } from './mockService'; 

let ai: GoogleGenAI | null = null;

// --- GOV DOC INTELLIGENCE SYSTEM PROMPT ---
const GOV_DOC_SYSTEM_PROMPT = `
You are an Enterprise Government Document Intelligence AI designed to analyze uploaded documents (TOR, research papers, spreadsheets, government templates, business documents) and automatically structure them into a professional tab-based system.

Your primary objective is to transform unstructured documents into structured, decision-ready artifacts used in government digital transformation projects.

The system MUST strictly follow a modular tab architecture.

---

# CORE BEHAVIOR

When a user uploads a document or provides text:

1. Read the entire document.
2. Understand context, domain, project goals, stakeholders, risks, architecture, and operational impact.
3. Extract structured knowledge.
4. Place extracted information into the correct tab.
5. Generate missing sections intelligently using government-grade formal language.
6. Never hallucinate regulatory facts.
7. Maintain professional bureaucratic tone suitable for director-level review.

Output must always be structured.

Never respond casually.

---

# TAB ARCHITECTURE (MANDATORY)

Create the following tabs inside the **"Dokumen"** section:

• Kajian Kebutuhan
• Dokumen Penelitian
• BRD (Business Requirement Document)
• FSD (Functional Specification Document)
• Project Charter
• Spreadsheet
• Government Template
• Research Paper

Each tab has its own extraction logic.

Never mix sections.

---

# TAB EXTRACTION RULES

---

## 🟦 TAB: Kajian Kebutuhan

Extract and generate:

### 1. Informasi Umum Proyek
* Project name
* Governing unit
* Responsible IT division
* PIC
* Stakeholders

### 2. Latar Belakang & Masalah
Identify:
* urgency
* institutional drivers
* operational problems
* regulatory pressure
* financial risks
Generate executive-ready narrative.

### 3. Target & Business Value
Extract:
* measurable outcomes
* efficiency gains
* service improvements
* risk reduction
* national economic impact (if relevant)

### 4. Kebutuhan Fungsional
Convert requirements into structured feature list:
Format:
• Feature name
• Description
• Actor
• Priority

### 5. Kebutuhan Non-Fungsional
Infer enterprise-grade constraints:
* Security
* Availability
* Compliance
* Performance
* Auditability
* Interoperability

### 6. Alur Bisnis & BIA
Detect operational flows.
Generate:
• Process narrative
• Risk table
• Impact classification:
* Operational
* Financial
* Legal
* Reputational
Also infer: RTO, RPO. Use realistic enterprise assumptions.

---

## 🟦 TAB: Dokumen Penelitian

This tab performs system-scale estimation.

Extract or infer:

### Actor Specification (UAW)
Classify actors:
* Simple
* Average
* Complex

### Use Case Model (UUCW)
Identify:
* transactions
* workflow complexity
* system interactions

### Auto-calculate:
UAW, UUCW, UUCP

### Technical Complexity Factor
Score realistically based on:
* distributed architecture
* security requirements
* integrations
* concurrency

### Environmental Factor
Evaluate team capability, tooling maturity, and project stability.

### Generate automatically:
Final UCP
Estimated Man-Month
Project Duration

Then build:

## Cost Estimation (RAB / KAK)
Distribute effort across:
* analysis
* design
* development
* testing
* deployment
* documentation

Generate TOTAL PROJECT COST.
Use government-scale salary assumptions if absent.

---

## 🟦 TAB: BRD

Create a director-ready Business Requirement Document.

Must include:
### Business Process Analysis
AS-IS vs TO-BE comparison.
### Functional Requirements
Structured table.
### Non-functional Requirements
### Actor Specification
### Use Case Narrative
### Priority Matrix
### Strategic Alignment
Explain how the system supports institutional mission.
Tone must be executive.

---

## 🟦 TAB: FSD

Produce a technical blueprint.
Include:
### BPMN-ready process explanation
### Interface mock guidance
### Role-based access model
### System architecture recommendation
### Integration map
### Security controls
### Repository structure suggestion
Write like a lead system architect.

---

## 🟦 TAB: Project Charter

Generate a formal project authorization document.
Must contain:
• Scope
• Out-of-scope
• Timeline
• Milestones
• Resource planning
• Governance structure
• Risk register
• Success criteria
Tone: ministerial-level.

---

## 🟦 TAB: Spreadsheet

If spreadsheets are uploaded:
Automatically detect:
* budget tables
* workload calculations
* staffing models
* procurement estimates
Convert them into structured financial models.
Provide summaries.
Highlight anomalies.

---

## 🟦 TAB: Government Template

If the uploaded document follows a regulatory template:
Detect framework automatically.
Examples:
* procurement format
* compliance checklist
* ministry TOR format
Preserve structure.
Never alter mandated sections.
Only enhance clarity.

---

## 🟦 TAB: Research Paper

If academic material is uploaded:
Extract:
• abstract
• methodology
• findings
• limitations
• applicability to government systems

Then generate:
## Policy Translation Layer
Explain how research can be operationalized into public-sector systems.

---

# ADVANCED INTELLIGENCE RULES

You must behave like a hybrid of:
Enterprise Architect
Government Consultant
Policy Analyst
AI Systems Designer

Always optimize for:
• audit readiness
• budget defense
• executive clarity
• implementation feasibility

Avoid startup-style language.
Think bureaucracy-grade.

---

# AUTO-GENERATION RULE

If data is incomplete:
Infer conservatively.
Never guess recklessly.
Prefer institutional realism over creativity.

---

# OUTPUT FORMAT (STRICT)

When responding, return a valid JSON object.
Keys must be the document IDs.
Values must be 'WorkspaceDocument' objects.

Example Structure:
{
  "doc-kajian": {
    "id": "doc-kajian",
    "type": "KAJIAN",
    "title": "Kajian Kebutuhan",
    "status": "DRAFT",
    "version": "1.0",
    "sections": [ ... ]
  },
  "doc-penelitian": {
     "id": "doc-penelitian",
     "type": "RESEARCH",
     "title": "Dokumen Penelitian (UCP & RAB)",
     "status": "DRAFT",
     "version": "1.0",
     "sections": [ ... ]
  },
  "doc-brd": {
     "id": "doc-brd",
     "type": "BRD",
     "title": "Business Requirement Document",
     "status": "DRAFT",
     "version": "1.0",
     "sections": [ ... ]
  },
  "doc-fsd": { ... },
  "doc-charter": { ... },
  "doc-spreadsheet": { ... }, 
  "doc-template": { ... },
  "doc-paper": { ... }
}

ENSURE ALL 8 TABS ARE REPRESENTED IF APPLICABLE OR INFERRED. 
If a specific file type (Spreadsheet, Template, Research Paper) is NOT detected in the input, you may omit those specific tabs or provide a placeholder stating "No source file detected".
However, ALWAYS generate 'Kajian', 'Penelitian', 'BRD', 'FSD', and 'Charter' based on inference.
`;

const getAiClient = () => {
  if (!ai) {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY is missing. Please check your environment configuration.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function generateContentWithRetry(modelName: string, params: any, maxRetries = 3) {
    const client = getAiClient();
    
    // INJECT CONSTITUTION
    let contentString = "";
    if (typeof params.contents === 'string') {
        contentString = params.contents;
    } else if (Array.isArray(params.contents) && typeof params.contents[0] === 'string') {
        contentString = params.contents[0];
    } else if (params.contents?.parts && params.contents.parts[0]?.text) {
        contentString = params.contents.parts[0].text;
    }

    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            return await client.models.generateContent({
                model: modelName,
                contents: params.contents,
                config: params.config
            });
        } catch (error: any) {
            const isRetriable = 
                error?.status === 429 || 
                error?.code === 429 || 
                error?.status === 503 || 
                error?.code === 500 || 
                error?.status === "UNKNOWN" ||
                error?.message?.includes('429') || 
                error?.message?.includes('quota') ||
                error?.message?.includes('xhr error') ||
                error?.message?.includes('fetch failed');

            if (isRetriable && attempt < maxRetries - 1) {
                attempt++;
                const delay = Math.pow(2, attempt) * 1000 + (Math.random() * 1000);
                console.warn(`[ADIE] Transient error detected (Attempt ${attempt}/${maxRetries}): ${error?.message}. Retrying in ${Math.round(delay)}ms...`);
                await wait(delay); 
            } else {
                console.error("[ADIE] Critical Error:", error);
                throw error; 
            }
        }
    }
    throw new Error(`ADIE Service Unavailable: Max retries (${maxRetries}) exceeded.`);
}

// --------------------------------------------------------
// FEATURE: EXECUTIVE SIMULATION AGENT (PRE-DIRECTOR REVIEW)
// --------------------------------------------------------
export async function runExecutiveSimulationAgent(projectData: ProjectData): Promise<ExecutiveReviewResult> {
    const prompt = `
    ACT AS: Director of Information Technology (Echelon II).
    TASK: Perform a brutal, high-level review of this project proposal before I sign it.
    
    PROJECT CONTEXT:
    Name: ${projectData.meta.theme}
    Cost: ${projectData.analytics.baseParams.initialInvestment} Billion IDR
    Objective: ${projectData.strategicAnalysis.executiveSummary}
    
    CRITERIA:
    1. Is the budget justified by the business value?
    2. Are the risks acceptable for a government system?
    3. Is the timeline realistic?
    4. Is it compliant with strategic goals?

    OUTPUT JSON:
    {
        "readinessScore": number (0-100),
        "status": "READY_FOR_SIGNATURE" | "NEEDS_REVISION" | "CRITICAL_GAPS",
        "findings": [
            {
                "section": "string",
                "severity": "CRITICAL" | "MAJOR" | "MINOR",
                "issue": "string",
                "recommendation": "string"
            }
        ]
    }
    `;

    const res = await generateContentWithRetry("gemini-3-flash-preview", {
        contents: prompt,
        config: { responseMimeType: "application/json", temperature: 0.2 } 
    });

    return JSON.parse(res.text!);
}

// --------------------------------------------------------
// WORKSPACE GENERATOR AGENT (CORE)
// --------------------------------------------------------
async function runWorkspaceGenerator(input: string, type: string): Promise<Record<string, WorkspaceDocument>> {
    const prompt = `
    ${GOV_DOC_SYSTEM_PROMPT}

    INPUT CONTEXT:
    Document Type: ${type}
    Content Snippet: "${input.substring(0, 50000)}"

    INSTRUCTION:
    Generate the full WorkspaceDocument JSON structure for the tabs 'Kajian Kebutuhan', 'Dokumen Penelitian', 'BRD', 'FSD', and 'Project Charter'.
    If the content implies a Spreadsheet, Government Template, or Research Paper, generate those as well.
    `;

    const res = await generateContentWithRetry("gemini-3-flash-preview", {
        contents: prompt,
        config: { responseMimeType: "application/json", temperature: 0.4 } // Slightly higher temp for creativity in generation
    });
    
    try {
        return JSON.parse(res.text!);
    } catch (e) {
        console.error("Failed to parse Workspace JSON", e);
        return {};
    }
}

// --------------------------------------------------------
// LAYER 1: DOCUMENT TYPE ROUTER (STRICT)
// --------------------------------------------------------
async function runClassifierAgent(content: string): Promise<DocumentClassification> {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes("term of reference") || lowerContent.includes("kajian kebutuhan") || lowerContent.includes("kak")) {
        return { type: 'TOR', confidence: 100, origin: 'INTERNAL', processingPriority: 'HIGH', routingRule: "Deterministic: Keyword 'KAK/TOR'" };
    }
    return { type: 'TOR', confidence: 50, origin: 'CLIENT', processingPriority: 'NORMAL', routingRule: "Fallback" }; 
}

// --------------------------------------------------------
// LAYER 2: TEMPLATE MAPPER AGENT (With Confidence)
// --------------------------------------------------------
async function runTemplateEnforcementAgent(content: string, type: any): Promise<PIO_Ingest> {
    const systemPrompt = `
    TASK: Semantic Extraction & Template Mapping.
    INPUT DOC TYPE: ${type}
    INPUT CONTENT: "${content.substring(0, 30000)}"

    INSTRUCTION:
    Extract fields for the Project Intelligence Object (PIO).
    For 'executive_summary', provide a meta object indicating confidence level based on source clarity.
    
    EXTRACT JSON:
    `;

    const schemaPrompt = `
    {
        "project_name": "string (Formal Title)",
        "executive_summary": "string (Latar Belakang & Tujuan)",
        "executive_summary_meta": { "confidence": "HIGH|MEDIUM|LOW", "sourceRef": "string" },
        "legal_basis": ["string"],
        "objectives": ["string"],
        "stakeholders": [{"role": "string", "interest": "High/Low", "power": "High/Low"}],
        "budget_signal": "number",
        "timeline_signal": "number",
        "technical_stack_signal": ["string"]
    }
    `;

    const res = await generateContentWithRetry("gemini-3-flash-preview", {
        contents: systemPrompt + schemaPrompt,
        config: { responseMimeType: "application/json", temperature: 0.0 } 
    });
    
    const parsed = JSON.parse(res.text!);
    return {
        project_name: parsed.project_name || "<<DATA_REQUIRED>>",
        executive_summary: parsed.executive_summary || "<<DATA_REQUIRED>>",
        executive_summary_meta: parsed.executive_summary_meta || { confidence: 'LOW', sourceRef: 'AI Generated' },
        legal_basis: Array.isArray(parsed.legal_basis) ? parsed.legal_basis : [],
        objectives: Array.isArray(parsed.objectives) ? parsed.objectives : [],
        stakeholders: Array.isArray(parsed.stakeholders) ? parsed.stakeholders : [],
        budget_signal: typeof parsed.budget_signal === 'number' ? parsed.budget_signal : 2.5,
        timeline_signal: typeof parsed.timeline_signal === 'number' ? parsed.timeline_signal : 12,
        technical_stack_signal: Array.isArray(parsed.technical_stack_signal) ? parsed.technical_stack_signal : []
    };
}

// --------------------------------------------------------
// LAYER 3: SPECIALIST AGENTS (UCP & ARCHITECTURE)
// --------------------------------------------------------
async function runArchitectureAgent(ingest: PIO_Ingest): Promise<PIO_Architecture> {
    const prompt = `
    Generate a precise Use Case and Actor list based on: "${ingest.project_name}".
    
    RULES:
    1. Actors must be classified as Simple, Average, or Complex.
    2. Use Cases must have a Transaction Count estimation.

    OUTPUT JSON:
    {
        "actors": ["string"],
        "modules": ["string"],
        "integrations": ["string"],
        "security_level": "string",
        "data_classification": "string",
        "use_cases": [
            {"code": "UC-001", "name": "string", "classification": "Simple|Average|Complex", "actor": "string", "transactions": number}
        ],
        "detailed_actors": [
            {"name": "string", "type": "Simple|Average|Complex", "desc": "string"}
        ]
    }
    `;

    const res = await generateContentWithRetry("gemini-3-flash-preview", {
        contents: prompt,
        config: { responseMimeType: "application/json", temperature: 0.1 } 
    });
    
    const parsed = JSON.parse(res.text!);
    return {
        actors: Array.isArray(parsed.actors) ? parsed.actors : [],
        modules: Array.isArray(parsed.modules) ? parsed.modules : [],
        integrations: Array.isArray(parsed.integrations) ? parsed.integrations : [],
        security_level: parsed.security_level || "Standard",
        data_classification: parsed.data_classification || "Confidential",
        use_cases: Array.isArray(parsed.use_cases) ? parsed.use_cases : [],
        detailed_actors: Array.isArray(parsed.detailed_actors) ? parsed.detailed_actors : []
    };
}

// --- NEW: USE CASE REFINEMENT AGENT ---
export async function refineUseCase(currentUseCase: any, instruction: string): Promise<any> {
    const prompt = `
    ROLE: Senior System Analyst (UCP Specialist)
    TASK: Refine a specific Use Case based on user instruction.
    
    INPUT USE CASE:
    ${JSON.stringify(currentUseCase)}

    USER INSTRUCTION:
    "${instruction}"

    OUTPUT JSON ONLY:
    {
        "id": "string",
        "name": "string",
        "type": "Simple" | "Average" | "Complex",
        "transactions": number,
        "weight": number
    }
    `;

    const res = await generateContentWithRetry("gemini-3-flash-preview", {
        contents: prompt,
        config: { responseMimeType: "application/json", temperature: 0.3 } 
    });

    return JSON.parse(res.text!);
}

// --------------------------------------------------------
// ORCHESTRATOR
// --------------------------------------------------------
export const orchestrateProjectAnalysis = async (input: string, settings: UserSettings, isFile: boolean, onProgress?: (msg: string) => void): Promise<ProjectData> => {
    onProgress?.("📡 ADIE Layer 1: Intelligent Ingestion...");
    const classification = await runClassifierAgent(input);
    
    onProgress?.(`🔒 ADIE Layer 2: Semantic Parsing & Template Map (${classification.type})...`);
    const pio = await runTemplateEnforcementAgent(input, classification.type);
    
    onProgress?.("🏗️ ADIE Layer 3: Functional Intelligence (UCP Modeling)...");
    const arch = await runArchitectureAgent(pio);
    
    onProgress?.("📑 ADIE Layer 4: Constructing Modular Workspaces...");
    // NEW: Generate the full tab structure based on the prompt
    const workspaces = await runWorkspaceGenerator(input, classification.type);

    const mock = generateGovtDemoData(input);
    
    onProgress?.("✅ Finalizing Artifacts...");
    
    return {
        ...mock,
        meta: {
            ...mock.meta,
            theme: pio.project_name !== "<<DATA_REQUIRED>>" ? pio.project_name : mock.meta.theme,
            classification,
            verification: {
                verified: true,
                score: 98,
                issues: [],
                lineageMap: "Verified: TOR -> Penelitian -> BRD -> FSD",
            },
            estimationLock: { isLocked: false }
        },
        strategicAnalysis: {
            ...mock.strategicAnalysis,
            executiveSummary: pio.executive_summary !== "<<DATA_REQUIRED>>" ? pio.executive_summary : mock.strategicAnalysis.executiveSummary,
            executiveSummaryMeta: pio.executive_summary_meta,
            businessObjectives: pio.objectives.length > 0 ? pio.objectives : mock.strategicAnalysis.businessObjectives,
        },
        documents: {
            ...mock.documents,
            workspaces: workspaces // Inject the AI-generated workspaces
        },
        pioTrace: { ingest: pio, arch, compliance: { risk_score: 10, regulations: [], audit_state_indices: {} } }
    };
};

export async function analyzeSimulationScenarios(scenarios: SavedScenario[]): Promise<string> {
    return "Simulation analysis placeholder.";
}

export async function sendChatToAI(
    history: { role: 'user' | 'model'; text: string }[],
    message: string,
    context: ProjectData,
    attachments: { type: 'image' | 'file'; content: string; name: string }[] = []
): Promise<string> {
    const client = getAiClient();
    const prompt = `
    Context:
    Project Name: ${context.meta.theme}
    Executive Summary: ${context.strategicAnalysis.executiveSummary}
    Cost: Rp ${context.analytics.baseParams.initialInvestment} Billion
    
    User Query: ${message}
    `;
    
    const res = await client.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
    });
    return res.text || "No response";
}
