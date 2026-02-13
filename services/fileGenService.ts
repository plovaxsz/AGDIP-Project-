import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { jsPDF } from "jspdf";
import "jspdf-autotable"; 
import { ProjectData, SavedScenario } from '../types';
import { createStrictDocx } from './docxGenService';

const saveFile = (blob: Blob | string, name: string) => {
  // @ts-ignore
  const saver = FileSaver.saveAs || FileSaver;
  saver(blob, name);
};

// --- STRICT EXCEL TEMPLATE GENERATION ---
const generateStrictExcel = (data: ProjectData) => {
    const wb = XLSX.utils.book_new();

    // 0. SHEET: READ_ME_FIRST
    const wsWarning = XLSX.utils.aoa_to_sheet([
        ["⚠️ PERINGATAN KEPATUHAN TEMPLATE KETAT ⚠️"],
        [""],
        ["DOKUMEN INI DIBUAT OTOMATIS OLEH PROJECT GENIE EXECUTIVE."],
        ["INSTRUKSI KRITIS:"],
        ["1. JANGAN MENGUBAH NAMA SHEET."],
        ["2. JANGAN MENGGABUNGKAN SEL (MERGE) PADA KOLOM DATA."],
        [""],
        ["Hash Kepatuhan: " + (data.meta.governance?.constitutionalHash || "N/A")]
    ]);
    XLSX.utils.book_append_sheet(wb, wsWarning, "BACA_SAYA_DULU");
    
    // 1. SHEET: 7. Use Case Point Calculation
    // Replicating the structure from screenshot
    const wsUCP = XLSX.utils.aoa_to_sheet([
        ["7. Use Case Point Calculation"],
        [""],
        ["TECHNICAL COMPLEXITY FACTOR (TCF)"],
        ["Factor", "Weight", "Score"],
        ["T1 Distributed System", "2.00", "0.00"],
        ["T2 Performance", "1.00", "3.00"],
        ["T3 End-user Efficiency", "1.00", "3.00"],
        ["T4 Complex Internal Processing", "1.00", "3.00"],
        ["T5 Reusability", "1.00", "3.00"],
        ["T6 Installability", "0.50", "1.50"],
        ["T7 Usability", "0.50", "1.50"],
        ["T8 Portability", "2.00", "0.00"],
        ["T9 Changeability", "1.00", "3.00"],
        ["T10 Concurrency", "1.00", "3.00"],
        ["T11 Special Security Features", "1.00", "3.00"],
        ["T12 Third Party Access", "1.00", "3.00"],
        ["T13 User Training Facilities", "1.00", "3.00"],
        [""],
        ["ENVIRONMENTAL FACTOR (EF)"],
        ["Factor", "Weight", "Score"],
        ["E1 Familiarity with System Development Process", "1.50", "6.00"],
        ["E2 Application Experience", "0.50", "2.00"],
        ["E3 Object Oriented Experience", "1.00", "3.00"],
        ["E4 Lead Analyst Capability", "0.50", "2.00"],
        ["E5 Motivation", "1.00", "3.00"],
        ["E6 Stable Requirements", "2.00", "0.00"],
        ["E7 Part-time Workers", "-1.00", "-3.00"],
        ["E8 Difficult Programming Language", "-1.00", "-3.00"],
        [""],
        ["UUCP (UUCW + UAW)", "", "52"],
        ["Total UCP", "", "52.77"]
    ]);
    XLSX.utils.book_append_sheet(wb, wsUCP, "7_Use_Case_Point");

    // 2. SHEET: 8. Man Month Estimation
    const wsManMonth = XLSX.utils.aoa_to_sheet([
        ["8. Man Month Estimation"],
        [""],
        ["UCP", "PHM", "Total Person-Hours", "Man Month (MM)", "Estimasi Lama"],
        ["52.77", "20", "1055 Jam", "6.00", "~ 6 Bulan"]
    ]);
    XLSX.utils.book_append_sheet(wb, wsManMonth, "8_Man_Month");

    // 3. SHEET: 9. Cost Estimation
    const wsCost = XLSX.utils.aoa_to_sheet([
        ["6. COST ESTIMATION (KAK AKHIR TAHUN)"],
        [""],
        ["Phase", "Effort Dist (%)", "Effort (MM)", "PIC", "Gaji Per Bulan", "Cost Estimation"],
        ["Software Phase Development", "", "", "", "", ""],
        ["Needs analysis", "1.6%", "0.096", "Business Analyst", "21,950,000", "2,106,194"],
        ["Specification", "7.5%", "0.450", "System Analyst", "21,950,000", "9,872,786"],
        ["Design", "6.0%", "0.360", "System Analyst", "21,950,000", "7,898,229"],
        ["Implementation (Coding)", "52.0%", "3.119", "Programmer", "21,950,000", "68,451,314"],
        ["Acceptance & installation", "5.5%", "0.330", "System Analyst", "21,950,000", "7,240,043"],
        ["Project management", "3.8%", "0.228", "Project Manager", "28,150,000", "6,415,137"],
        ["Configuration management", "4.3%", "0.258", "System Analyst", "21,950,000", "5,660,397"],
        ["Documentation", "8.4%", "0.504", "Technical Writer", "13,950,000", "7,027,444"],
        ["Training & technical support", "1.0%", "0.060", "Technical Writer", "13,950,000", "836,601"],
        ["Integrated testing", "7.0%", "0.420", "Tester", "13,950,000", "5,856,204"],
        ["Quality assurance", "0.9%", "0.054", "Tester", "13,950,000", "752,940"],
        ["Evaluation & testing", "2.0%", "0.120", "Tester", "13,950,000", "1,673,201"],
        ["Total Effort", "", "6.00", "", "", "123,790,490"],
        [""],
        ["Warranty (25%)", "", "", "", "", "30,947,622"],
        ["Sub Total", "", "", "", "", "154,738,112"],
        ["PPN (11%)", "", "", "", "", "17,021,192"],
        ["TOTAL BIAYA (RAB)", "", "", "", "", "171,759,305"]
    ]);
    XLSX.utils.book_append_sheet(wb, wsCost, "9_Cost_Estimation");

    return wb;
};

// --- MASTER PDF GENERATOR ---
export const generateMasterPDF = (data: ProjectData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    const addSectionTitle = (title: string) => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.setFillColor(31, 78, 121); // Dark Blue
        doc.rect(14, yPos, pageWidth - 28, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(title, 18, yPos + 7);
        yPos += 20;
        doc.setTextColor(0, 0, 0);
    };

    // PAGE 1: TITLE & EXECUTIVE SUMMARY
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("MASTER PROJECT REPORT", 14, yPos);
    yPos += 10;
    doc.setFontSize(16);
    doc.text(data.meta.theme, 14, yPos);
    yPos += 15;

    addSectionTitle("1. EXECUTIVE SUMMARY");
    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize(data.strategicAnalysis.executiveSummary, pageWidth - 28);
    doc.text(summaryLines, 14, yPos);
    yPos += (summaryLines.length * 5) + 10;

    return doc.output('blob');
};

export const exportProjectPackage = async (data: ProjectData) => {
  const zip = new JSZip();
  const theme = data.meta.theme.replace(/\s+/g, '_');

  // 1. GENERATE DOCUMENTS (DOCX)
  const torBlob = await createStrictDocx(data, 'TOR');
  zip.file(`1_KAK_TOR_${theme}.docx`, torBlob);

  const brdBlob = await createStrictDocx(data, 'BRD');
  zip.file(`2_BRD_${theme}.docx`, brdBlob);

  const fsdBlob = await createStrictDocx(data, 'FSD');
  zip.file(`3_PROJECT_CHARTER_${theme}.docx`, fsdBlob);
  
  const researchBlob = await createStrictDocx(data, 'RESEARCH');
  zip.file(`0_DOKUMEN_PENELITIAN_${theme}.docx`, researchBlob);

  // 2. GENERATE STRICT EXCEL
  const wb = generateStrictExcel(data);
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  zip.file(`4_File_Proyek_${theme}_Strict.xlsx`, excelBuffer);

  // 3. GENERATE MASTER REPORT (Unified PDF)
  const masterPdfBlob = generateMasterPDF(data);
  zip.file(`MASTER_REPORT_${theme}.pdf`, masterPdfBlob);

  // 4. GENERATE ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  saveFile(content, `Paket_Lengkap_Genie_${theme}.zip`);
};

export const exportSimulationReport = (scenarios: SavedScenario[]) => {
    const zip = new JSZip();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const wb = XLSX.utils.book_new();
    const summaryData = scenarios.map(s => ({
        Scenario: s.name,
        NPV: s.metrics?.npv,
        IRR: s.metrics?.irr
    }));
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Scenario Summary");

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    zip.file(`Simulation_Data_${timestamp}.xlsx`, excelBuffer);

    zip.generateAsync({ type: 'blob' }).then(content => {
        saveFile(content, `Simulation_Package_${timestamp}.zip`);
    });
};
