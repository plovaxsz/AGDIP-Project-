
import React, { useState, useEffect } from 'react';
import { DocTable } from '../types';
import { Plus, Trash2, Calculator, AlertCircle, Wand2, Lock, Coins } from 'lucide-react';
import { formatIDR } from '../utils/currency';

interface SmartTableProps {
    data: DocTable;
    onUpdate: (newData: DocTable) => void;
    readOnly?: boolean;
}

// --- PATENT PARAMETERS (LOCKED) ---
const UAW_WEIGHTS: Record<string, number> = { 'Simple': 1, 'Average': 2, 'Complex': 3 };
const UUCW_WEIGHTS: Record<string, number> = { 'Simple': 5, 'Average': 10, 'Complex': 15 };

const SmartTable: React.FC<SmartTableProps> = ({ data, onUpdate, readOnly = false }) => {
    const [localData, setLocalData] = useState<DocTable>(data);

    useEffect(() => {
        setLocalData(data);
    }, [data]);

    // --- LOGIC ENGINE ---
    const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
        if (readOnly) return;
        
        const newRows = localData.rows.map(r => [...r]);
        newRows[rowIndex][colIndex] = value;

        // AUTO-CALCULATE UCP
        if (localData.type === 'UCP_ACTOR') {
             // Structure: [No, Actor, Classification, Weight]
             // Col 2 is "Classification" (Simple/Average/Complex)
             if (colIndex === 2) {
                 const weight = UAW_WEIGHTS[value] || 0;
                 newRows[rowIndex][3] = weight.toString(); // Col 3 is Weight
             }
        } else if (localData.type === 'UCP_USECASE') {
             // Structure: [No, Use Case, Type, Transactions, Weight]
             // Col 2 is "Type" (Simple/Average/Complex)
             if (colIndex === 2) {
                 const weight = UUCW_WEIGHTS[value] || 0;
                 newRows[rowIndex][4] = weight.toString(); // Col 4 is Weight
             }
        }

        const newData = { ...localData, rows: newRows };
        setLocalData(newData);
        onUpdate(newData);
    };

    const addRow = () => {
        if (readOnly) return;
        const emptyRow = new Array(localData.headers.length).fill('');
        
        // Auto-increment ID
        let nextId = 1;
        if (localData.rows.length > 0) {
            const lastId = parseInt(localData.rows[localData.rows.length-1][0]);
            if (!isNaN(lastId)) nextId = lastId + 1;
        }
        emptyRow[0] = nextId.toString();

        // Defaults for UCP
        if (localData.type === 'UCP_ACTOR') {
            emptyRow[2] = 'Complex';
            emptyRow[3] = '3';
        } else if (localData.type === 'UCP_USECASE') {
            emptyRow[2] = 'Average';
            emptyRow[4] = '10';
        }
        
        const newData = { ...localData, rows: [...localData.rows, emptyRow] };
        setLocalData(newData);
        onUpdate(newData);
    };

    const deleteRow = (index: number) => {
        if (readOnly) return;
        const newRows = localData.rows.filter((_, i) => i !== index);
        // Re-index ID column
        newRows.forEach((row, i) => {
            if(!isNaN(parseInt(row[0]))) row[0] = (i + 1).toString();
        });
        
        const newData = { ...localData, rows: newRows };
        setLocalData(newData);
        onUpdate(newData);
    };

    const getTotal = () => {
        if (localData.type === 'UCP_ACTOR') {
            return localData.rows.reduce((sum, row) => sum + (parseFloat(row[3]) || 0), 0);
        }
        if (localData.type === 'UCP_USECASE') {
            return localData.rows.reduce((sum, row) => sum + (parseFloat(row[4]) || 0), 0);
        }
        if (localData.type === 'RAB') {
             // Find 'TOTAL BIAYA (RAB)' row
             const totalRow = localData.rows.find(r => r[0] === 'TOTAL BIAYA (RAB)');
             return totalRow ? totalRow[5] : "-";
        }
        return null;
    };

    // --- RENDER HELPERS ---
    
    // Check if a cell is locked (Patent Parameters)
    const isCellLocked = (rowIndex: number, colIndex: number) => {
        if (localData.type === 'UCP_ACTOR' && colIndex === 3) return true; // Weight is derived
        if (localData.type === 'UCP_USECASE' && colIndex === 4) return true; // Weight is derived
        if (localData.type === 'RAB') return true; // RAB is generally fully derived
        return false;
    };

    const isDropdown = (colIndex: number) => {
        return (localData.type === 'UCP_ACTOR' && colIndex === 2) || 
               (localData.type === 'UCP_USECASE' && colIndex === 2);
    };

    return (
        <div className="w-full overflow-hidden border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 shadow-sm mb-4">
            <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                    {localData.type?.includes('UCP') ? <Calculator className="w-3 h-3 text-blue-500"/> : 
                     localData.type === 'RAB' ? <Coins className="w-3 h-3 text-emerald-500"/> : 
                     <Wand2 className="w-3 h-3"/>}
                    {localData.title}
                </span>
                <div className="flex items-center gap-3">
                    {localData.type?.includes('UCP') && (
                        <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            Total Points: {getTotal()}
                        </span>
                    )}
                    {localData.type === 'RAB' && (
                        <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            Total: {getTotal()}
                        </span>
                    )}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead className="text-slate-500 bg-slate-50 dark:bg-slate-800 uppercase font-bold">
                        <tr>
                            {localData.headers.map((h, i) => (
                                <th key={i} className="px-4 py-3 whitespace-nowrap border-r border-slate-200 dark:border-slate-700 last:border-0">{h}</th>
                            ))}
                            {!readOnly && localData.type !== 'RAB' && <th className="w-10"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {localData.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${row[0] === 'TOTAL BIAYA (RAB)' ? 'bg-emerald-50 font-bold' : ''}`}>
                                {row.map((cell, colIndex) => {
                                    const locked = isCellLocked(rowIndex, colIndex) || readOnly;
                                    const dropdown = !locked && isDropdown(colIndex);

                                    return (
                                        <td key={colIndex} className="p-0 border-r border-slate-100 dark:border-slate-700 last:border-0 relative">
                                            {dropdown ? (
                                                <select 
                                                    className="w-full h-full px-4 py-3 bg-transparent border-none outline-none cursor-pointer appearance-none text-blue-600 font-bold"
                                                    value={cell}
                                                    onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                                >
                                                    <option value="Simple">Simple</option>
                                                    <option value="Average">Average</option>
                                                    <option value="Complex">Complex</option>
                                                </select>
                                            ) : (
                                                <div className="relative w-full h-full">
                                                    <input 
                                                        className={`w-full h-full px-4 py-3 bg-transparent border-none outline-none text-slate-700 dark:text-slate-200 font-medium ${locked ? 'text-slate-400 bg-slate-50/50 dark:bg-slate-800/50 cursor-not-allowed' : 'focus:bg-blue-50/50 dark:focus:bg-blue-900/20'}`}
                                                        value={cell}
                                                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                                        readOnly={locked}
                                                    />
                                                    {locked && localData.type?.includes('UCP') && (
                                                        <Lock className="w-3 h-3 text-slate-300 absolute right-2 top-3 opacity-50"/>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                                {!readOnly && localData.type !== 'RAB' && (
                                    <td className="text-center">
                                        <button onClick={() => deleteRow(rowIndex)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                            <Trash2 className="w-3 h-3"/>
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {!readOnly && localData.type !== 'RAB' && (
                <button onClick={addRow} className="w-full py-2 flex items-center justify-center gap-1 text-xs font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-t border-slate-100 dark:border-slate-700">
                    <Plus className="w-3 h-3"/> Add Row
                </button>
            )}
        </div>
    );
};

export default SmartTable;
