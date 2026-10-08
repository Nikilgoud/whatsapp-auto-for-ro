'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { parseCustomerCSV, ImportResult } from '@/lib/services/csvImporter';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download, ArrowRight } from 'lucide-react';

interface ImportCustomersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_CSV = `Name,Phone,Address,Area,Brand,Model,Installation Date,Last Service Date,Notes
Ramesh Varma,9876512345,"Plot 12, Cyber Valley",Madhapur,Kent,Grand Plus,2024-01-15,2024-06-20,Prefers weekend mornings
Swapna Reddy,9876523456,"Flat 301, Aparna Sarovar",Nallagandla,Aquaguard,Geneus Active,2024-02-10,2024-05-15,Ground water TDS 950
Karthik Rao,9876534567,"House 4-5-88",Kukatpally,Pureit,Copper RO,2023-11-20,2024-04-10,AMC Interested
Goutham Reddy,9876545678,"Villa 9, Palm Meadows",Gachibowli,Livpure,Glo Pro,2024-03-01,2024-07-01,Wants alkaline cartridge`;

export const ImportCustomersModal: React.FC<ImportCustomersModalProps> = ({ isOpen, onClose }) => {
  const { business, batchImportCustomers } = useApp();
  const [csvContent, setCsvContent] = useState<string>(SAMPLE_CSV);
  const [parsedResult, setParsedResult] = useState<ImportResult | null>(null);

  if (!isOpen) return null;

  const handleValidate = () => {
    const res = parseCustomerCSV(csvContent, business.id, business.settings);
    setParsedResult(res);
  };

  const handleConfirmImport = () => {
    if (!parsedResult) return;
    const validCustomers = parsedResult.rows
      .filter((r) => r.isValid && r.parsedCustomer)
      .map((r) => r.parsedCustomer as any);
    const validPurifiers = parsedResult.rows
      .filter((r) => r.isValid && r.parsedPurifier)
      .map((r) => r.parsedPurifier as any);

    batchImportCustomers(validCustomers, validPurifiers);
    alert(`Successfully imported ${validCustomers.length} customers with automated renewal calculations!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-600 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Import Existing Customers (CSV / Excel)
              </h3>
              <p className="text-xs text-slate-500">
                Bulk migrate your customer database. We automatically calculate their next service due date!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Paste CSV Text or Edit Below:
            </label>
            <button
              onClick={() => setCsvContent(SAMPLE_CSV)}
              className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Load Sample Indian Dataset</span>
            </button>
          </div>

          <textarea
            rows={7}
            value={csvContent}
            onChange={(e) => {
              setCsvContent(e.target.value);
              setParsedResult(null);
            }}
            className="w-full p-3 font-mono text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleValidate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition"
            >
              Validate & Preview Columns
            </button>
            <span className="text-[11px] text-slate-400">
              Columns: Name, Phone, Address, Area, Brand, Model, Dates
            </span>
          </div>

          {/* Validation Report */}
          {parsedResult && (
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800 animate-in fade-in">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{parsedResult.validCount} Valid Customers Ready</span>
                </div>
                {parsedResult.errorCount > 0 && (
                  <div className="flex items-center gap-1.5 text-rose-600 font-bold">
                    <AlertCircle className="w-4 h-4" />
                    <span>{parsedResult.errorCount} Rows with Errors</span>
                  </div>
                )}
              </div>

              {/* Rows preview */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500">
                    <tr>
                      <th className="p-2">Row</th>
                      <th className="p-2">Customer</th>
                      <th className="p-2">Phone</th>
                      <th className="p-2">Purifier</th>
                      <th className="p-2">Next Due (Auto)</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedResult.rows.map((row) => (
                      <tr
                        key={row.rowIndex}
                        className={row.isValid ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'bg-rose-50/50 dark:bg-rose-950/20'}
                      >
                        <td className="p-2 text-slate-400">#{row.rowIndex}</td>
                        <td className="p-2 font-semibold text-slate-800 dark:text-slate-200">
                          {row.parsedCustomer?.fullName || row.raw['name']}
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-400">
                          {row.parsedCustomer?.mobileNumber || row.raw['phone']}
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-400">
                          {row.parsedPurifier?.brand} {row.parsedPurifier?.model}
                        </td>
                        <td className="p-2 font-bold text-blue-600">
                          {row.parsedPurifier?.nextServiceDueDate || 'Calculated'}
                        </td>
                        <td className="p-2">
                          {row.isValid ? (
                            <span className="text-emerald-600 font-bold">Valid</span>
                          ) : (
                            <span className="text-rose-600 font-bold">{row.errors.join(', ')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={!parsedResult || parsedResult.validCount === 0}
            className="flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-md"
          >
            <span>Confirm Import & Generate Renewals</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
