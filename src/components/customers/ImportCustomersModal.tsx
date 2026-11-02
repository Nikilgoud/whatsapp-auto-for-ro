'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import {
  parseExcelOrCsvFile,
  parseCustomerCSV,
  downloadSampleExcelTemplate,
  downloadSampleCsvTemplate,
  ImportResult,
  SAMPLE_INDIAN_CUSTOMERS,
} from '@/lib/services/csvImporter';
import { formatDateDDMMYYYY, formatIndianCurrency } from '@/lib/utils';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowRight,
  FileText,
  Trash2,
  Calendar,
  Sparkles,
  Phone,
  Check,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';

interface ImportCustomersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportCustomersModal: React.FC<ImportCustomersModalProps> = ({ isOpen, onClose }) => {
  const { business, batchImportCustomers } = useApp();

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<ImportResult | null>(null);
  const [filterView, setFilterView] = useState<'all' | 'valid' | 'errors'>('all');
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Manual CSV text state
  const [csvContent, setCsvContent] = useState<string>(() => {
    const headers = Object.keys(SAMPLE_INDIAN_CUSTOMERS[0]).join(',');
    const rows = SAMPLE_INDIAN_CUSTOMERS.map((row) =>
      Object.values(row)
        .map((v) => (String(v).includes(',') ? `"${v}"` : v))
        .join(',')
    ).join('\n');
    return `${headers}\n${rows}`;
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle file selection (drag or file picker)
  const handleFileProcess = async (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const lowerName = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValidExt) {
      setParseError('Please upload an Excel spreadsheet (.xlsx, .xls) or a CSV file.');
      return;
    }

    setSelectedFile(file);
    setParseError(null);
    setIsParsing(true);

    try {
      const result = await parseExcelOrCsvFile(file, business.id, business.settings);
      setParsedResult(result);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setParseError(err.message || 'Failed to parse file. Please verify the file format and try again.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleParseCsvText = () => {
    if (!csvContent.trim()) {
      setParseError('Please paste or type CSV text to import.');
      return;
    }
    setParseError(null);
    setIsParsing(true);
    try {
      const result = parseCustomerCSV(csvContent, business.id, business.settings);
      setParsedResult(result);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse CSV text.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedResult(null);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (!parsedResult) return;

    const validCustomers = parsedResult.rows
      .filter((r) => r.isValid && r.parsedCustomer)
      .map((r) => r.parsedCustomer!);

    const validPurifiers = parsedResult.rows
      .filter((r) => r.isValid && r.parsedPurifier)
      .map((r) => r.parsedPurifier!);

    const validServices = parsedResult.rows
      .filter((r) => r.isValid && r.parsedService)
      .map((r) => r.parsedService!);

    if (validCustomers.length === 0) {
      alert('No valid customer records to import. Please review row errors.');
      return;
    }

    // Commit to AppContext
    batchImportCustomers(validCustomers, validPurifiers, validServices);

    setImportSuccessMessage(
      `🎉 Successfully imported ${validCustomers.length} customers! Next service dates & renewals have been scheduled automatically.`
    );

    setTimeout(() => {
      onClose();
    }, 1800);
  };

  // Filter preview rows
  const displayRows = parsedResult
    ? parsedResult.rows.filter((r) => {
        if (filterView === 'valid') return r.isValid;
        if (filterView === 'errors') return !r.isValid;
        return true;
      })
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <span>Bulk Customer Import</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Excel & CSV
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your existing client records. Columns are auto-detected and renewal dates are calculated automatically.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {importSuccessMessage && (
          <div className="m-4 p-4 rounded-xl bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{importSuccessMessage}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Mode Tabs & Sample Downloads */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('upload');
                  setParseError(null);
                }}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File (.xlsx, .xls, .csv)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('paste');
                  setParseError(null);
                }}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'paste'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste CSV Text</span>
              </button>
            </div>

            {/* Template Download Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium">Templates:</span>
              <button
                type="button"
                onClick={downloadSampleExcelTemplate}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition shadow-2xs cursor-pointer"
                title="Download Sample Excel Spreadsheet (.xlsx)"
              >
                <Download className="w-3 h-3 text-emerald-600" />
                <span>Sample Excel</span>
              </button>
              <button
                type="button"
                onClick={downloadSampleCsvTemplate}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition shadow-2xs cursor-pointer"
                title="Download Sample CSV Template"
              >
                <Download className="w-3 h-3 text-blue-600" />
                <span>Sample CSV</span>
              </button>
            </div>
          </div>

          {/* TAB 1: File Upload Zone */}
          {activeTab === 'upload' && !parsedResult && (
            <div className="space-y-3">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 sm:p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition text-center group ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 scale-[0.99]'
                    : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition shadow-2xs">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                    Drag & Drop your Excel file or Browse
                  </span>
                  <p className="text-xs text-slate-400">
                    Supports Microsoft Excel (<span className="font-mono font-semibold">.xlsx, .xls</span>) & standard <span className="font-mono font-semibold">.csv</span>
                  </p>
                </div>

                <button
                  type="button"
                  className="mt-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs pointer-events-none"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose Excel / CSV File</span>
                </button>
              </div>

              {/* Flexible Column Detection Guide */}
              <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800/50 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  <p className="font-bold text-blue-900 dark:text-blue-200">
                    Smart Column Auto-Detection Active:
                  </p>
                  <p>
                    Your spreadsheet can use any common header names: <code className="font-mono px-1 py-0.5 bg-white dark:bg-slate-800 rounded border border-blue-200 dark:border-blue-900">Name</code>, <code className="font-mono px-1 py-0.5 bg-white dark:bg-slate-800 rounded border border-blue-200 dark:border-blue-900">Phone / Mobile</code>, <code className="font-mono px-1 py-0.5 bg-white dark:bg-slate-800 rounded border border-blue-200 dark:border-blue-900">Address / Locality</code>, <code className="font-mono px-1 py-0.5 bg-white dark:bg-slate-800 rounded border border-blue-200 dark:border-blue-900">Brand / Purifier</code>, and <code className="font-mono px-1 py-0.5 bg-white dark:bg-slate-800 rounded border border-blue-200 dark:border-blue-900">Last Service / Due Date</code>.
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Minimal requirement: Just <strong>Customer Name</strong> and <strong>Phone Number</strong>. Missing addresses or dates are filled with intelligent safe defaults!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Direct Paste CSV */}
          {activeTab === 'paste' && !parsedResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                  Paste Spreadsheet Data (Comma or Tab Separated):
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const headers = Object.keys(SAMPLE_INDIAN_CUSTOMERS[0]).join(',');
                    const rows = SAMPLE_INDIAN_CUSTOMERS.map((row) =>
                      Object.values(row)
                        .map((v) => (String(v).includes(',') ? `"${v}"` : v))
                        .join(',')
                    ).join('\n');
                    setCsvContent(`${headers}\n${rows}`);
                  }}
                  className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset to Sample Data</span>
                </button>
              </div>

              <textarea
                rows={9}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="w-full p-3 font-mono text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed text-slate-900 dark:text-white"
                placeholder="Name, Phone, Address, Locality, Brand, Last Service Date..."
              />

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleParseCsvText}
                  disabled={isParsing || !csvContent.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Parse & Preview Records</span>
                </button>
              </div>
            </div>
          )}

          {/* Parsing Spinner */}
          {isParsing && (
            <div className="p-10 text-center space-y-2">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Parsing spreadsheet records & calculating renewal due dates...
              </p>
            </div>
          )}

          {/* Parse Error Alert */}
          {parseError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* PRE-IMPORT PREVIEW & VALIDATION SUMMARY */}
          {parsedResult && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Summary KPIs Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400">File / Source</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {parsedResult.fileName || (selectedFile ? selectedFile.name : 'Pasted Text')}
                  </p>
                </div>

                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800">
                  <span className="text-[10px] uppercase font-bold text-blue-500">Total Rows</span>
                  <p className="text-lg font-black text-blue-700 dark:text-blue-300 mt-0.5">
                    {parsedResult.totalRows}
                  </p>
                </div>

                <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] uppercase font-bold text-emerald-500">Ready to Import</span>
                  <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{parsedResult.validCount}</span>
                  </p>
                </div>

                <div className="p-3 bg-rose-50/70 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800">
                  <span className="text-[10px] uppercase font-bold text-rose-500">Skipped / Errors</span>
                  <p className="text-lg font-black text-rose-700 dark:text-rose-300 mt-0.5 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{parsedResult.errorCount}</span>
                  </p>
                </div>
              </div>

              {/* Filter controls */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px] font-medium">Show:</span>
                  <button
                    type="button"
                    onClick={() => setFilterView('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      filterView === 'all'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    All ({parsedResult.totalRows})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterView('valid')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      filterView === 'valid'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    Valid Only ({parsedResult.validCount})
                  </button>
                  {parsedResult.errorCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterView('errors')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        filterView === 'errors'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      Errors Only ({parsedResult.errorCount})
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Choose Another File</span>
                </button>
              </div>

              {/* Scrollable Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                <div className="max-h-[320px] overflow-x-auto overflow-y-auto">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 border-b border-slate-200 dark:border-slate-800 z-10 text-slate-500 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3">Customer Name</th>
                        <th className="py-2.5 px-3">Phone Number</th>
                        <th className="py-2.5 px-3">Address & Locality</th>
                        <th className="py-2.5 px-3">Purifier / Model</th>
                        <th className="py-2.5 px-3">Service Charge</th>
                        <th className="py-2.5 px-3">Calculated Next Due</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {displayRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                            No rows matching this filter.
                          </td>
                        </tr>
                      ) : (
                        displayRows.map((row) => {
                          const cust = row.parsedCustomer;
                          const pur = row.parsedPurifier;
                          const srv = row.parsedService;

                          return (
                            <tr
                              key={row.rowIndex}
                              className={`transition ${
                                row.isValid
                                  ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                                  : 'bg-rose-50/40 dark:bg-rose-950/20'
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                                {row.rowIndex}
                              </td>

                              <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                                {cust ? cust.fullName : <span className="text-rose-500 italic">Missing Name</span>}
                              </td>

                              <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                                {cust ? (
                                  `+91 ${cust.mobileNumber}`
                                ) : (
                                  <span className="text-rose-500 italic">
                                    {row.errors.find((e) => e.includes('phone')) || 'Invalid phone'}
                                  </span>
                                )}
                              </td>

                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                <p className="truncate max-w-[180px]">{cust?.streetAddress}</p>
                                <p className="text-[10px] text-slate-400">{cust?.areaLocality}</p>
                              </td>

                              <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                                <p className="font-semibold text-slate-900 dark:text-white">{pur?.brand}</p>
                                <p className="text-[10px] text-slate-400">
                                  {pur?.model ? `${pur.model} • ` : ''}{pur?.purifierType}
                                </p>
                              </td>

                              <td className="py-2.5 px-3">
                                {srv ? (
                                  srv.labourCharge === 0 ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                      Free (₹0)
                                    </span>
                                  ) : (
                                    <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                                      {formatIndianCurrency(srv.labourCharge)}
                                    </span>
                                  )
                                ) : (
                                  <span className="text-slate-400">₹0</span>
                                )}
                              </td>

                              <td className="py-2.5 px-3">
                                {pur ? (
                                  <div>
                                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                      {formatDateDDMMYYYY(pur.nextServiceDueDate)}
                                    </p>
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block ${
                                        cust?.status === 'Overdue'
                                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                          : cust?.status === 'Service due'
                                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                      }`}
                                    >
                                      {cust?.status}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>

                              <td className="py-2.5 px-3 text-right">
                                {row.isValid ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Ready</span>
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                    title={row.errors.join(', ')}
                                  >
                                    <AlertCircle className="w-3 h-3 text-rose-600" />
                                    <span>Skipped</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 shrink-0">
          <div className="text-[11px] text-slate-500">
            {parsedResult ? (
              <span>
                <strong>{parsedResult.validCount}</strong> valid customers will be imported into directory and renewal engine.
              </span>
            ) : (
              <span>Excel and CSV files are parsed safely in your browser.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>

            {parsedResult && parsedResult.validCount > 0 && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={!!importSuccessMessage}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Import ({parsedResult.validCount} Customers)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
