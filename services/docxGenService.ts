import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, Header, VerticalAlign, Footer, PageNumber, NumberFormat } from "docx";
import FileSaver from 'file-saver';
import { ProjectData, DocTable } from '../types';

const saveFile = (blob: Blob | string, name: string) => {
  // @ts-ignore
  const saver = FileSaver.saveAs || FileSaver;
  saver(blob, name);
};

// --- STYLING CONSTANTS (Government Standard) ---
const BLUE_HEADER = "1F4E79"; // Ministry Blue
const GREY_BG = "E7E6E6"; // Table Header Grey
const WHITE = "FFFFFF";
const BLACK = "000000";

const BORDER_STYLE = {
    style: BorderStyle.SINGLE,
    size: 4, // 1/2 pt
    color: "000000",
};

const FONT_FAMILY = "Arial";

// --- HELPER FUNCTIONS ---

const createTextCell = (text: string, bold = false, fill = "auto", align = AlignmentType.LEFT, fontSize = 20, vAlign = VerticalAlign.TOP, colSpan = 1) => {
    return new TableCell({
        children: [new Paragraph({ 
            children: [new TextRun({ text: text || "-", bold, color: "000000", font: FONT_FAMILY, size: fontSize })],
            alignment: align
        })],
        shading: { fill: fill === "auto" ? "FFFFFF" : fill, type: ShadingType.CLEAR, color: "auto" },
        verticalAlign: vAlign,
        columnSpan: colSpan,
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
        borders: {
            top: BORDER_STYLE, bottom: BORDER_STYLE, left: BORDER_STYLE, right: BORDER_STYLE
        }
    });
};

const createStrictHeader = (docTitle: string, docNumber: string = "DOK-2024-XXX", generatedFor: string) => {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [
                            new Paragraph({ children: [new TextRun({ text: "DOKUMEN PENELITIAN & KAK", bold: true, size: 28, font: FONT_FAMILY })], alignment: AlignmentType.CENTER, spacing: { before: 200, after: 100 } }),
                            new Paragraph({ children: [new TextRun({ text: "Generated for: " + generatedFor, size: 20, font: FONT_FAMILY })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
                        ],
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: BLACK }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                    })
                ]
            })
        ]
    });
};

const createTableFromData = (headers: string[], rows: any[][], widths?: number[]) => {
    const tableRows = [
        new TableRow({
            children: headers.map(h => createTextCell(h, true, GREY_BG, AlignmentType.CENTER, 20, VerticalAlign.CENTER))
        }),
        ...rows.map((row) => {
            return new TableRow({
                children: row.map(cell => createTextCell(String(cell), false, "FFFFFF", AlignmentType.LEFT, 20, VerticalAlign.TOP))
            });
        })
    ];

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows
    });
};

const createRABTable = () => {
    const headers = ["Fase / Aktivitas", "%", "MM", "Role", "Rate", "Biaya"];
    const rows = [
        ["Needs analysis", "1.6%", "0.096", "Business Analyst", "Rp 21.950.000", "Rp 2.106.194"],
        ["Specification", "7.5%", "0.450", "System Analyst", "Rp 21.950.000", "Rp 9.872.786"],
        ["Design", "6%", "0.360", "System Analyst", "Rp 21.950.000", "Rp 7.898.229"],
        ["Implementation (Coding)", "52%", "3.119", "Programmer", "Rp 21.950.000", "Rp 68.451.314"],
        ["Acceptance & installation", "5.5%", "0.330", "System Analyst", "Rp 21.950.000", "Rp 7.240.043"],
        ["Project management", "3.8%", "0.228", "Project Manager", "Rp 28.150.000", "Rp 6.415.137"],
        ["Configuration management", "4.3%", "0.258", "System Analyst", "Rp 21.950.000", "Rp 5.660.397"],
        ["Documentation", "8.4%", "0.504", "Technical Writer", "Rp 13.950.000", "Rp 7.027.444"],
        ["Training & technical support", "1%", "0.060", "Technical Writer", "Rp 13.950.000", "Rp 836.601"],
        ["Integrated testing", "7%", "0.420", "Tester", "Rp 13.950.000", "Rp 5.856.204"],
        ["Quality assurance", "0.9%", "0.054", "Tester", "Rp 13.950.000", "Rp 752.940"],
        ["Evaluation & testing", "2%", "0.120", "Tester", "Rp 13.950.000", "Rp 1.673.201"],
        ["Total Effort", "-", "-", "-", "-", "Rp 123.790.490"],
        ["Warranty (25%)", "-", "-", "-", "-", "Rp 30.947.622"],
        ["Sub Total", "-", "-", "-", "-", "Rp 154.738.112"],
        ["PPN (11%)", "-", "-", "-", "-", "Rp 17.021.192"],
        ["TOTAL BIAYA (RAB)", "-", "-", "-", "-", "Rp 171.759.305"],
    ];

    const tableRows = [
        new TableRow({
            children: headers.map(h => createTextCell(h, true, GREY_BG, AlignmentType.CENTER, 20, VerticalAlign.CENTER))
        }),
        ...rows.map((row, index) => {
            const isTotal = index >= rows.length - 5;
            const fill = isTotal ? (index === rows.length - 1 ? "10B981" : GREY_BG) : "FFFFFF"; 
            const bold = isTotal;
            
            return new TableRow({
                children: row.map(cell => createTextCell(cell, bold, fill, AlignmentType.LEFT, 20, VerticalAlign.TOP))
            });
        })
    ];

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows
    });
};

const generateDokumenPenelitian = (data: ProjectData) => {
    const brdTable = data.documents.tables?.brd_fr?.[0] || { headers: [], rows: [] };
    
    return [
        createStrictHeader("DOKUMEN PENELITIAN & KAK", "DOK-2024-XXX", data.meta.theme),
        new Paragraph({ text: "" }),

        // 1. KAJIAN KEBUTUHAN & INFORMASI UMUM
        new Paragraph({ text: "1. Kajian Kebutuhan & Informasi Umum", heading: HeadingLevel.HEADING_1, run: {color: BLUE_HEADER} }),
        new Paragraph({ text: `Nama Proyek: ${data.meta.theme}` }),
        new Paragraph({ text: "Unit Pengampu: Dit. Teknis Kepabeanan" }),
        new Paragraph({ text: "Unit Penanggung Jawab: Subdit PSI / Seksi Perancangan Sistem Informasi" }),
        new Paragraph({ text: "PIC: Budi Santoso (081234567890)" }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "Latar Belakang & Masalah", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: data.strategicAnalysis.executiveSummary, alignment: AlignmentType.JUSTIFIED }),
        new Paragraph({ text: "" }),

        new Paragraph({ text: "Target & Outcome", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: "Target Penyelesaian: 2024-12-31" }),
        new Paragraph({ text: "Target Outcome: Tersedianya aplikasi mandiri yang mampu memproses dokumen aju kurang dari 30 detik." }),
        new Paragraph({ text: "Business Value: Mengurangi Cost of Logistics sebesar 15%." }),
        new Paragraph({ text: "" }),

        // 2. ESTIMASI BIAYA (RAB)
        new Paragraph({ text: "2. Estimasi Biaya (RAB) & KAK", heading: HeadingLevel.HEADING_1, run: {color: BLUE_HEADER} }),
        new Paragraph({ text: "Berikut adalah rincian estimasi biaya berdasarkan perhitungan Use Case Points (UCP).", spacing: { after: 200 } }),
        createRABTable(),
        new Paragraph({ text: "" }),
        new Paragraph({ pageBreakBefore: true }),

        // 3. DETAIL PERHITUNGAN UCP
        new Paragraph({ text: "3. Detail Perhitungan UCP", heading: HeadingLevel.HEADING_1, run: {color: BLUE_HEADER} }),
        new Paragraph({ text: "A. Daftar Aktor (UAW)", heading: HeadingLevel.HEADING_2 }),
        createTableFromData(["No", "Aktor", "Deskripsi", "Tipe", "UAW"], [
            ["1", "Pengguna Jasa / PJT", "Pengguna eksternal yang mengajukan dokumen", "GUI", "3"],
            ["2", "Sistem CEISA Inti", "Sistem backend utama DJBC", "API", "1"],
            ["3", "Pejabat Pemeriksa", "Pegawai bea cukai yang melakukan penelitian", "GUI", "3"],
        ]),
        new Paragraph({ text: "Total UAW: 7" }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "B. Daftar Use Case (UUCW)", heading: HeadingLevel.HEADING_2 }),
        createTableFromData(["No", "Use Case", "Tipe", "Trans.", "UUCW"], [
            ["1", "Mengajukan Permohonan Ekspor", "Complex", "8", "15"],
            ["2", "Melihat Status Aju", "Simple", "2", "5"],
            ["3", "Meneliti Dokumen (Pejabat)", "Average", "5", "10"],
            ["4", "Approval Berjenjang", "Average", "4", "10"],
            ["5", "Monitoring Devisa", "Simple", "3", "5"],
        ]),
        new Paragraph({ text: "Total UUCW: 45" }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "C. Total Complexity", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: "UUCP (UAW + UUCW) = 52" }),
        new Paragraph({ text: "TCF (Technical Factor) = 1.020" }),
        new Paragraph({ text: "EF (Environment Factor) = 0.995" }),
        new Paragraph({ text: "Final UCP = 52.77" }),
        new Paragraph({ text: "" }),

        // 4. KEBUTUHAN FUNGSIONAL (BRD)
        new Paragraph({ text: "4. Kebutuhan Fungsional (BRD)", heading: HeadingLevel.HEADING_1, run: {color: BLUE_HEADER} }),
        createTableFromData(["ID", "Deskripsi Kebutuhan Fungsional", "Prioritas"], [
            ["FR1", "Sistem harus dapat menerima upload XML BC 3.0", "Mandatory"],
            ["FR2", "Sistem harus dapat memvalidasi NPWP ke data master", "Mandatory"]
        ]),
        new Paragraph({ text: "" }),

        // 5. PROJECT CHARTER
        new Paragraph({ text: "5. Project Charter", heading: HeadingLevel.HEADING_1, run: {color: BLUE_HEADER} }),
        new Paragraph({ text: "Scope", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: "Membangun Modul Ekspor CEISA 4.0 mencakup Service API, Portal Pengguna Jasa, dan Dashboard Monitoring." }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Timeline", heading: HeadingLevel.HEADING_2 }),
        createTableFromData(["Milestone", "Start", "End", "Note"], [
            ["Project Charter Template", "2024-01-01", "2024-01-05", "Done"],
            ["Analysis Phase", "-", "-", "-"],
            ["Implementation", "-", "-", "-"]
        ]),
    ];
};

export const createStrictDocx = async (data: ProjectData, type: 'TOR' | 'BRD' | 'FSD' | 'RESEARCH'): Promise<Blob> => {
    let sectionsContent: any[] = generateDokumenPenelitian(data);

    const doc = new DocxDocument({
        styles: {
            default: {
                heading1: {
                    run: { font: FONT_FAMILY, size: 28, bold: true, color: BLUE_HEADER },
                    paragraph: { spacing: { before: 240, after: 120 } },
                },
                heading2: {
                    run: { font: FONT_FAMILY, size: 24, bold: true, color: BLUE_HEADER },
                    paragraph: { spacing: { before: 200, after: 100 } },
                },
                paragraph: {
                    run: { font: FONT_FAMILY, size: 22 }, // 11pt
                    paragraph: { spacing: { after: 120 }, alignment: AlignmentType.JUSTIFIED },
                },
            }
        },
        sections: [{
            properties: {},
            children: sectionsContent
        }]
    });

    return await Packer.toBlob(doc);
};