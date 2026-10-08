'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Invoice } from '@/types';
import { formatIndianCurrency, formatAmountInWords } from '@/lib/utils';
import {
  FileText,
  Search,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Droplets,
  Building2,
  User,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Check,
  Calendar,
  Receipt,
} from 'lucide-react';

export const InvoiceManager: React.FC = () => {
  const { invoices, customers, purifiers, services, business } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Partially paid' | 'Pending'>('All');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    const customer = customers.find((c) => c.id === inv.customerId);
    const matchesStatus = statusFilter === 'All' || inv.paymentStatus === statusFilter;
    if (!matchesStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        customer?.fullName.toLowerCase().includes(q) ||
        customer?.mobileNumber.includes(q)
      );
    }
    return true;
  });

  const totalInvoiced = invoices.reduce((sum, i) => sum + i.total, 0);
  const totalPaid = invoices.reduce((sum, i) => sum + i.amountPaid, 0);
  const totalDue = invoices.reduce((sum, i) => sum + i.balanceDue, 0);

  const handlePrint = () => {
    window.print();
  };

  // Resolve customer & purifier for selected invoice
  const activeCustomer = selectedInvoice ? customers.find((c) => c.id === selectedInvoice.customerId) : null;
  const activePurifier = selectedInvoice
    ? purifiers.find((p) => p.customerId === selectedInvoice.customerId)
    : null;
  const activeService = selectedInvoice?.serviceRecordId
    ? services.find((s) => s.id === selectedInvoice.serviceRecordId)
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <span>Invoices & Billing Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Clean, professional GST & non-GST service bills and customer payment receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500">
            GSTIN:{' '}
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              {business.settings.gstin || 'Not Applicable (Composition)'}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Total Invoices</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{invoices.length}</p>
          <span className="text-[10px] text-blue-600 font-medium">All generated bills</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Total Invoiced</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatIndianCurrency(totalInvoiced)}
          </p>
          <span className="text-[10px] text-slate-400">Gross billing amount</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Amount Collected</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {formatIndianCurrency(totalPaid)}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">
            {Math.round((totalPaid / (totalInvoiced || 1)) * 100)}% realization rate
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Outstanding Balance</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            {formatIndianCurrency(totalDue)}
          </p>
          <span className="text-[10px] text-rose-500 font-medium">Due for collection</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Paid', 'Partially paid', 'Pending'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Invoice # or Customer..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Bill Amount</th>
                <th className="py-3.5 px-4">Paid</th>
                <th className="py-3.5 px-4">Balance</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No invoices found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const customer = customers.find((c) => c.id === inv.customerId);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {inv.invoiceNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">{customer?.fullName || 'Customer'}</p>
                        <p className="text-[10px] text-slate-400">+91 {customer?.mobileNumber}</p>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {inv.invoiceDate}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {formatIndianCurrency(inv.total)}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-emerald-600">
                        {formatIndianCurrency(inv.amountPaid)}
                      </td>

                      <td className="py-3.5 px-4">
                        {inv.balanceDue > 0 ? (
                          <span className="font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900 text-[11px]">
                            {formatIndianCurrency(inv.balanceDue)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium text-[11px]">Nil (Paid)</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : inv.paymentStatus === 'Partially paid'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {inv.paymentStatus === 'Paid' && <CheckCircle2 className="w-3 h-3" />}
                          {inv.paymentStatus === 'Partially paid' && <Clock className="w-3 h-3" />}
                          {inv.paymentStatus === 'Pending' && <AlertCircle className="w-3 h-3" />}
                          <span>{inv.paymentStatus}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white rounded-lg font-semibold text-[11px] transition shadow-2xs cursor-pointer"
                        >
                          View & Print
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BEAUTIFUL PRINTABLE INVOICE MODAL (NO QR, NO PAYMENT LINKS) */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 text-slate-900 my-8 overflow-hidden print:m-0 print:border-none print:shadow-none print:w-full print:max-w-none">
            {/* Top Toolbar (Hidden on print) */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Customer Invoice Preview
                </span>
                <span className="text-[11px] font-mono bg-slate-800 text-blue-300 px-2 py-0.5 rounded">
                  {selectedInvoice.invoiceNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="p-4 sm:p-10 space-y-6 bg-white text-slate-800 print:p-6" id="printable-invoice">
              {/* Header: Business Profile & Invoice Badges */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b-2 border-slate-200">
                <div className="space-y-1.5 max-w-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-cyan-500 flex items-center justify-center text-white shadow-sm">
                      <Droplets className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-950 tracking-tight">
                        {business.name}
                      </h3>
                      <p className="text-[11px] font-medium text-blue-600 uppercase tracking-wider">
                        {business.tagline || 'Certified RO Water Solutions & Spares'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 text-xs text-slate-600 space-y-0.5 leading-relaxed">
                    {business.ownerName && (
                      <p className="font-semibold text-slate-800">
                        Proprietor: {business.ownerName}
                      </p>
                    )}
                    <p>
                      {business.address}, {business.city}, {business.state} - {business.pincode}
                    </p>
                    <p className="flex items-center gap-3 pt-0.5">
                      <span>Phone: <strong>{business.phone}</strong></span>
                      {business.email && <span>Email: {business.email}</span>}
                    </p>
                    {business.settings.gstin && (
                      <p className="font-mono text-slate-700 font-semibold pt-0.5">
                        GSTIN: {business.settings.gstin}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right space-y-1.5 min-w-[210px]">
                  <div className="inline-block px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs font-black uppercase tracking-widest">
                    Tax Invoice / Bill
                  </div>
                  <p className="text-xl font-mono font-extrabold text-slate-950 pt-1">
                    {selectedInvoice.invoiceNumber}
                  </p>
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <p>
                      Invoice Date: <strong className="text-slate-800">{selectedInvoice.invoiceDate}</strong>
                    </p>
                    <p>
                      Payment Due: <strong className="text-slate-800">{selectedInvoice.dueDate}</strong>
                    </p>
                  </div>

                  {/* Payment Status Stamp */}
                  <div className="pt-2">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-black tracking-wide uppercase border ${
                        selectedInvoice.paymentStatus === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : selectedInvoice.paymentStatus === 'Partially paid'
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : 'bg-rose-50 text-rose-700 border-rose-300'
                      }`}
                    >
                      {selectedInvoice.paymentStatus === 'Paid' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {selectedInvoice.paymentStatus === 'Partially paid' && <Clock className="w-3.5 h-3.5" />}
                      {selectedInvoice.paymentStatus === 'Pending' && <AlertCircle className="w-3.5 h-3.5" />}
                      <span>{selectedInvoice.paymentStatus === 'Paid' ? 'PAID IN FULL' : selectedInvoice.paymentStatus}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Billed To & Equipment Details (2-Column Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Details */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="w-3 h-3 text-slate-500" />
                    <span>Billed To (Customer Details):</span>
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    {activeCustomer?.fullName || 'Customer'}
                  </p>
                  <p className="text-slate-600 leading-snug">
                    {activeCustomer?.streetAddress}
                    {activeCustomer?.areaLocality ? `, ${activeCustomer.areaLocality}` : ''}
                    {activeCustomer?.city ? `, ${activeCustomer.city}` : ', Hyderabad'}
                  </p>
                  <p className="text-slate-700 font-semibold pt-0.5">
                    Mobile: +91 {activeCustomer?.mobileNumber}
                  </p>
                </div>

                {/* Purifier & Service Details */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-slate-500" />
                    <span>RO Equipment & Service Log:</span>
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    {activePurifier ? `${activePurifier.brand} ${activePurifier.model}` : 'Domestic RO Purifier'}
                  </p>
                  <p className="text-slate-600">
                    Purifier Code: <span className="font-mono font-medium">{activePurifier?.purifierCode || 'PUR-DOM-01'}</span>
                    {activePurifier?.capacityLph ? ` • ${activePurifier.capacityLph} LPH` : ''}
                  </p>
                  <p className="text-slate-600">
                    Service Type:{' '}
                    <span className="font-semibold text-slate-800">
                      {activeService?.serviceType || 'Filter Replacement & General Service'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Description of Goods / Services</th>
                      <th className="py-2.5 px-3 w-20 text-center">HSN/SAC</th>
                      <th className="py-2.5 px-3 w-16 text-center">Qty</th>
                      <th className="py-2.5 px-3 w-28 text-right">Rate (₹)</th>
                      <th className="py-2.5 px-3 w-28 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-900">{item.description}</p>
                        </td>
                        <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                          {item.description.toLowerCase().includes('service') || item.description.toLowerCase().includes('charge') || item.description.toLowerCase().includes('amc')
                            ? '9987'
                            : '8421'}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-700 font-medium">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-700 font-mono">
                          {formatIndianCurrency(item.unitPrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                          {formatIndianCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Terms Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* Left Column: Amount in Words & Terms (Strictly No QR / No Payment Links) */}
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                      Amount in Words:
                    </span>
                    <p className="font-bold text-slate-900 italic">
                      {formatAmountInWords(selectedInvoice.total)}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-slate-500">
                    <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      Terms & Service Warranty:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                      <li>Replaced consumables and filters carry genuine manufacturer warranty.</li>
                      <li>Includes comprehensive water TDS testing and 30-day leakage guarantee.</li>
                      <li>Next periodic service recommended in 90 days for peak water purity.</li>
                    </ul>
                  </div>

                  <div className="pt-1 text-[11px] text-slate-500">
                    <p className="font-semibold text-slate-700">Payment Mode:</p>
                    <p className="text-slate-600">Cash on Service Completion / Direct Bank Settlement</p>
                  </div>
                </div>

                {/* Right Column: Financial Calculations */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">{formatIndianCurrency(selectedInvoice.subtotal)}</span>
                  </div>

                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Promotional Discount:</span>
                      <span className="font-mono">-{formatIndianCurrency(selectedInvoice.discount)}</span>
                    </div>
                  )}

                  {business.settings.gstin && (
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>GST (Included / Composition):</span>
                      <span className="font-mono">
                        {selectedInvoice.gstAmount > 0
                          ? formatIndianCurrency(selectedInvoice.gstAmount)
                          : '₹0 (Nil)'}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t-2 border-slate-300 flex justify-between items-center text-sm font-extrabold text-slate-950">
                    <span>Grand Total:</span>
                    <span className="text-base text-blue-700 font-mono">
                      {formatIndianCurrency(selectedInvoice.total)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-emerald-700 font-bold pt-1 border-t border-slate-200">
                    <span>Amount Paid:</span>
                    <span className="font-mono">{formatIndianCurrency(selectedInvoice.amountPaid)}</span>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="font-bold text-slate-700">Balance Outstanding:</span>
                    <span
                      className={`font-mono font-black ${
                        selectedInvoice.balanceDue > 0 ? 'text-rose-600 text-sm' : 'text-emerald-700'
                      }`}
                    >
                      {formatIndianCurrency(selectedInvoice.balanceDue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures Row */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
                <div className="space-y-8">
                  <div className="h-10 border-b border-dashed border-slate-300"></div>
                  <div>
                    <p className="font-bold text-slate-800">Customer Signature & Acceptance</p>
                    <p className="text-[10px] text-slate-400">Received machine in working condition</p>
                  </div>
                </div>

                <div className="space-y-8 text-right">
                  <div className="h-10 border-b border-dashed border-slate-300"></div>
                  <div>
                    <p className="font-bold text-slate-900">For {business.name}</p>
                    <p className="text-[10px] text-slate-400">Authorized Service Engineer / Signatory</p>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center pt-4 border-t border-slate-100 text-[11px] text-slate-400">
                Thank you for trusting <strong>{business.name}</strong> for your drinking water safety. For queries or service assistance, contact {business.phone}.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
