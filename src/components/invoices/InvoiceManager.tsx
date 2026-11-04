'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Invoice } from '@/types';
import { formatIndianCurrency, formatAmountInWords, formatDateDDMMYYYY } from '@/lib/utils';
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
  QrCode,
  Trash2,
  Hash,
} from 'lucide-react';

export const InvoiceManager: React.FC = () => {
  const { invoices, customers, purifiers, services, business } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Partially paid' | 'Pending'>('All');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceViewMode, setInvoiceViewMode] = useState<'standard' | 'warranty'>('standard');

  const getWarrantyExpiryDate = (invDate: string, explicitExpiry?: string) => {
    if (explicitExpiry) return explicitExpiry;
    try {
      const d = new Date(invDate);
      d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().split('T')[0];
    } catch {
      return invDate;
    }
  };

  const isWarrantyInvoice = (inv: Invoice) => {
    if (inv.invoiceType === 'SALES' || inv.purifierProductId || inv.machineSerialNo) return true;
    if (inv.notes?.toLowerCase().includes('warranty')) return true;
    if (
      inv.items.some((it) => {
        const desc = it.description.toLowerCase();
        return (
          desc.includes('warranty') ||
          desc.includes('amc') ||
          desc.includes('installation') ||
          desc.includes('purifier') ||
          desc.includes('ro system') ||
          desc.includes('membrane') ||
          desc.includes('booster pump') ||
          desc.includes('smps') ||
          desc.includes('kent') ||
          desc.includes('aquaguard') ||
          desc.includes('livpure')
        );
      })
    ) {
      return true;
    }
    const pur = purifiers.find((p) => p.customerId === inv.customerId);
    if (pur?.warrantyExpiry || pur?.sparePartsWarrantyExpiry) return true;
    return false;
  };

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

  // Compute live UPI details and QR image for selected invoice
  const cleanPhone = (business.phone || '').replace(/\D/g, '').slice(-10) || '9849012345';
  const upiId = business.whatsappNumber
    ? `${business.whatsappNumber.replace(/\D/g, '').slice(-10)}@upi`
    : `${cleanPhone}@upi`;
  const invoiceBalance = selectedInvoice ? (selectedInvoice.balanceDue > 0 ? selectedInvoice.balanceDue : selectedInvoice.total) : 0;
  const upiPayLink = selectedInvoice
    ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(business.name)}&am=${invoiceBalance}&cu=INR&tn=${encodeURIComponent(`Invoice ${selectedInvoice.invoiceNumber}`)}`
    : '';
  const dynamicQrUrl = selectedInvoice
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiPayLink)}`
    : '';
  const activeQrImage = business.paymentQrCodeUrl || dynamicQrUrl;

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

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-xl border border-blue-200 dark:border-blue-800">
            <Hash className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-semibold">Series:</span>
            <span className="font-mono font-bold">YYMMsequence (e.g. 26110001)</span>
          </div>
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

      {/* Invoices: Mobile Cards (< md screens) + Desktop Table (>= md screens) */}
      {/* 1. Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 text-xs">
            No invoices found matching your filter.
          </div>
        ) : (
          filteredInvoices.map((inv) => {
            const customer = customers.find((c) => c.id === inv.customerId);

            return (
              <div
                key={inv.id}
                onClick={() => setSelectedInvoice(inv)}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3 cursor-pointer active:scale-[0.99] transition"
              >
                {/* Header: Invoice #, Date, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                        {inv.invoiceNumber}
                      </span>
                      {(inv.customerCode || customer?.customerCode) && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold">
                          ID: {inv.customerCode || customer?.customerCode}
                        </span>
                      )}
                      {isWarrantyInvoice(inv) && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-0.5">
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Warranty</span>
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                      {customer?.fullName || 'Customer'}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">
                      +91 {customer?.mobileNumber}
                    </p>
                  </div>

                  <div className="text-right">
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
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {formatDateDDMMYYYY(inv.invoiceDate)}
                    </span>
                  </div>
                </div>

                {/* Amounts Breakdown Grid */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-xs grid grid-cols-3 gap-1 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Total Bill</span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {formatIndianCurrency(inv.total)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Amount Paid</span>
                    <span className="font-bold text-emerald-600 text-xs">
                      {formatIndianCurrency(inv.amountPaid)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Balance</span>
                    <span
                      className={`font-bold text-xs ${
                        inv.balanceDue > 0 ? 'text-rose-600' : 'text-slate-400'
                      }`}
                    >
                      {inv.balanceDue > 0 ? formatIndianCurrency(inv.balanceDue) : '₹0'}
                    </span>
                  </div>
                </div>

                {/* Footer action button */}
                <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80 flex-wrap">
                  <span className="text-[11px] text-slate-400">
                    Tap to view receipt
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isWarrantyInvoice(inv) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoice(inv);
                          setInvoiceViewMode('warranty');
                        }}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-xs flex items-center gap-1 cursor-pointer"
                        title="Generate Official Warranty Detailed Invoice"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Warranty Invoice</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedInvoice(inv);
                        setInvoiceViewMode(isWarrantyInvoice(inv) ? 'warranty' : 'standard');
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition shadow-xs cursor-pointer"
                    >
                      View & Print
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{inv.invoiceNumber}</span>
                          {isWarrantyInvoice(inv) && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-0.5">
                              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Warranty</span>
                            </span>
                          )}
                        </div>
                        {(inv.customerCode || customer?.customerCode) && (
                          <div className="text-[10px] font-normal text-slate-400 font-mono mt-0.5">
                            Cust ID: {inv.customerCode || customer?.customerCode}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">{customer?.fullName || 'Customer'}</p>
                        <p className="text-[10px] text-slate-400">+91 {customer?.mobileNumber}</p>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {formatDateDDMMYYYY(inv.invoiceDate)}
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
                        <div className="flex items-center justify-end gap-1.5">
                          {isWarrantyInvoice(inv) && (
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setInvoiceViewMode('warranty');
                              }}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white rounded-lg font-semibold text-[11px] transition shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Generate Official Warranty Detailed Invoice"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Warranty Invoice</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setInvoiceViewMode(isWarrantyInvoice(inv) ? 'warranty' : 'standard');
                            }}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white rounded-lg font-semibold text-[11px] transition shadow-2xs cursor-pointer"
                          >
                            View & Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BEAUTIFUL PRINTABLE INVOICE MODAL (SCROLLABLE & FULL VIEW) */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-2 sm:p-4 md:p-6 animate-in fade-in print:p-0 print:bg-white print:static">
          <div className="w-full max-w-4xl max-h-[94vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 text-slate-900 overflow-hidden print:m-0 print:border-none print:shadow-none print:w-full print:max-w-none print:max-h-none print:overflow-visible">
            {/* Top Toolbar (Fixed Header, Hidden on print) */}
            <div className="shrink-0 flex items-center justify-between gap-2 px-4 sm:px-6 py-3.5 bg-slate-900 text-white print:hidden z-10 border-b border-slate-800 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  {invoiceViewMode === 'warranty' ? 'Warranty Detailed Invoice' : 'Customer Invoice Preview'}
                </span>
                <span className="text-xs font-mono font-bold bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2.5 py-0.5 rounded-md">
                  {selectedInvoice.invoiceNumber}
                </span>
                {(selectedInvoice.customerCode || activeCustomer?.customerCode) && (
                  <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-md">
                    Cust ID: {selectedInvoice.customerCode || activeCustomer?.customerCode}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Format Toggle: Standard vs Warranty Detailed */}
                <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
                  <button
                    onClick={() => setInvoiceViewMode('standard')}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      invoiceViewMode === 'standard'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Standard Bill
                  </button>
                  <button
                    onClick={() => setInvoiceViewMode('warranty')}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      invoiceViewMode === 'warranty'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Warranty Detailed</span>
                  </button>
                </div>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
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

            {/* Printable Document Sheet (Scrollable to view full invoice) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-10 space-y-6 bg-white text-slate-800 print:overflow-visible print:p-6 scrollbar-thin" id="printable-invoice">
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
                      {business.website && <span>Website: <strong>{business.website}</strong></span>}
                    </p>
                    {business.settings.gstin && (
                      <p className="font-mono text-slate-700 font-semibold pt-0.5">
                        GSTIN: {business.settings.gstin}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right space-y-1.5 min-w-[210px]">
                  <div className={`inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border ${
                    invoiceViewMode === 'warranty'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}>
                    {invoiceViewMode === 'warranty' ? 'Tax Invoice & Official Warranty Card' : 'Tax Invoice / Bill'}
                  </div>
                  <p className="text-xl font-mono font-extrabold text-slate-950 pt-1">
                    {selectedInvoice.invoiceNumber}
                  </p>
                  {(selectedInvoice.customerCode || activeCustomer?.customerCode) && (
                    <p className="text-xs font-mono font-bold text-blue-700">
                      Customer ID: {selectedInvoice.customerCode || activeCustomer?.customerCode}
                    </p>
                  )}
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <p>
                      Invoice Date: <strong className="text-slate-800">{formatDateDDMMYYYY(selectedInvoice.invoiceDate)}</strong>
                    </p>
                    <p>
                      Payment Due: <strong className="text-slate-800">{formatDateDDMMYYYY(selectedInvoice.dueDate)}</strong>
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
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900">
                      {activeCustomer?.fullName || 'Customer'}
                    </p>
                    {(selectedInvoice.customerCode || activeCustomer?.customerCode) && (
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                        Cust ID: {selectedInvoice.customerCode || activeCustomer?.customerCode}
                      </span>
                    )}
                  </div>
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

              {/* OFFICIAL WARRANTY CARD (Displayed for Warranty Detailed Invoices) */}
              {invoiceViewMode === 'warranty' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-blue-50/70 border-2 border-emerald-500/40 text-slate-900 space-y-4 print:border-emerald-700 print:bg-white print:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-300/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                          Certified Water Protection Plan
                        </span>
                        <h4 className="text-base font-extrabold text-slate-950">
                          12-Month Comprehensive Equipment Warranty Card
                        </h4>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Warranty Card No:</span>
                      <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                        WAR-{selectedInvoice.invoiceNumber}
                      </span>
                    </div>
                  </div>

                  {/* Core Equipment Identification Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-2.5 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Customer ID</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {selectedInvoice.customerCode || activeCustomer?.customerCode || '00012611'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Equipment / Brand</span>
                      <span className="font-bold text-slate-900 truncate block text-xs">
                        {activePurifier ? `${activePurifier.brand} ${activePurifier.model}` : 'Domestic RO Purifier'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Machine Serial No</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {selectedInvoice.machineSerialNo || activePurifier?.serialNumber || 'SR-RO-2026-01'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Warranty Period</span>
                      <span className="font-bold text-emerald-700 text-xs block">
                        12 Months (1 Year)
                      </span>
                    </div>
                  </div>

                  {/* Effective Dates & Guarantee Validity */}
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="text-slate-700">
                      <span className="font-medium text-slate-500">Coverage Duration: </span>
                      <strong className="text-slate-900">{formatDateDDMMYYYY(selectedInvoice.invoiceDate)}</strong>
                      {' to '}
                      <strong className="text-emerald-700 font-bold">
                        {formatDateDDMMYYYY(activePurifier?.warrantyExpiry || getWarrantyExpiryDate(selectedInvoice.invoiceDate))}
                      </strong>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 w-fit">
                      ✓ Active Genuine Service Guarantee
                    </span>
                  </div>

                  {/* Terms & Claim Policy */}
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 text-[11px] text-slate-600 space-y-1 leading-relaxed">
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block">
                      Warranty Terms & Claim Procedure:
                    </span>
                    <ol className="list-decimal pl-4 space-y-0.5 text-slate-600">
                      <li><strong>Customer ID Authentication:</strong> Quote your Customer ID <strong className="font-mono text-slate-900">{selectedInvoice.customerCode || activeCustomer?.customerCode}</strong> whenever requesting doorstep service.</li>
                      <li><strong>On-Site Doorstep Service:</strong> Certified service engineers will attend within 24 to 48 hours of service request.</li>
                      <li><strong>Exclusions:</strong> Physical breakage, fire damage, operation without water (dry run), or voltage surge exceeding 260V without a voltage stabilizer voids the warranty.</li>
                      <li><strong>Customer Helpline:</strong> Contact our service center at <strong>{business.phone}</strong> (WhatsApp enabled) for priority dispatch.</li>
                    </ol>
                  </div>
                </div>
              )}

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
                          {invoiceViewMode === 'warranty' && (
                            <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Covered under 12-Month Official Warranty & Genuine Spares Guarantee</span>
                            </p>
                          )}
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
                      {invoiceViewMode === 'warranty' ? 'Comprehensive Warranty Terms & Service Policy:' : 'Terms & Service Warranty:'}
                    </p>
                    {invoiceViewMode === 'warranty' ? (
                      <ul className="list-disc pl-4 space-y-1 text-slate-600">
                        <li><strong>12-Month Guarantee:</strong> Comprehensive warranty on pump, SMPS adapter, and RO membrane against manufacturing defects.</li>
                        <li><strong>Customer ID Verification:</strong> Present Customer ID <strong>{selectedInvoice.customerCode || activeCustomer?.customerCode}</strong> for all claims & free visits.</li>
                        <li><strong>Zero-Charge Preventive Service:</strong> Includes 3 periodic maintenance visits within the warranty year.</li>
                        <li><strong>Authorized Genuine Parts:</strong> Replaced components are 100% genuine and food-grade certified.</li>
                      </ul>
                    ) : (
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                        <li>Replaced consumables and filters carry genuine manufacturer warranty.</li>
                        <li>Includes comprehensive water TDS testing and 30-day leakage guarantee.</li>
                        <li>Next periodic service recommended in 90 days for peak water purity.</li>
                      </ul>
                    )}
                  </div>

                  <div className="pt-1 text-[11px] text-slate-500">
                    <p className="font-semibold text-slate-700">Payment Mode:</p>
                    <p className="text-slate-600">UPI QR Scan & Pay / Cash / Bank Settlement</p>
                  </div>

                  {/* Payment QR Code Box: ALWAYS VISIBLE ON EVERY INVOICE */}
                  <div className="flex items-center gap-3.5 p-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 print:border-slate-300 print:bg-white">
                    <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center p-1 shrink-0 border border-slate-200 overflow-hidden shadow-2xs">
                      <img
                        src={activeQrImage}
                        alt="Scan to Pay QR"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-[11px] leading-tight space-y-1">
                      <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Scan & Pay via UPI</span>
                      </span>
                      <p className="text-[10px] text-slate-500 font-medium">Google Pay • PhonePe • Paytm • BHIM</p>
                      <p className="text-[10px] text-slate-600 font-mono">UPI ID: {upiId}</p>
                      <span className="inline-block text-[9px] text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded font-bold">
                        {business.paymentQrCodeUrl ? 'Custom Business QR' : 'Instant UPI Payment'}
                      </span>
                    </div>
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
                    <p className="font-bold text-slate-800">
                      {invoiceViewMode === 'warranty' ? 'Customer Acceptance & Warranty Acknowledgment' : 'Customer Signature & Acceptance'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {invoiceViewMode === 'warranty' ? 'Received equipment and verified warranty terms' : 'Received machine in working condition'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-right flex flex-col items-end">
                  <div className="w-48 ml-auto flex flex-col items-end justify-end">
                    {business.signatureUrl ? (
                      <div className="h-12 w-full flex items-end justify-end">
                        <img
                          src={business.signatureUrl}
                          alt="Authorized Signature"
                          className="max-h-12 max-w-[160px] object-contain mb-1"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-full border-b border-dashed border-slate-300"></div>
                    )}
                    {business.signatureUrl && <div className="border-b border-slate-300 w-full mb-1"></div>}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">For {business.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {invoiceViewMode === 'warranty' ? 'Authorized Warranty Seal & Signatory' : 'Authorized Service Engineer / Signatory'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center pt-4 border-t border-slate-100 text-[11px] text-slate-400">
                Thank you for trusting <strong>{business.name}</strong> for your drinking water safety. For queries or service assistance, contact {business.phone}.
              </div>
            </div>

            {/* Bottom Modal Actions Bar (Hidden on Print) */}
            <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-2.5 bg-slate-50 border-t border-slate-200 print:hidden text-xs">
              <span className="text-slate-500 font-medium hidden sm:inline">
                {invoiceViewMode === 'warranty'
                  ? 'Viewing Official Warranty Detailed Invoice • Scroll to view full warranty card and coverage schedule'
                  : 'Viewing invoice • Scroll vertically to inspect full document & payment details'}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setInvoiceViewMode(invoiceViewMode === 'warranty' ? 'standard' : 'warranty')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition border border-slate-300 cursor-pointer flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{invoiceViewMode === 'warranty' ? 'Switch to Standard Bill' : 'Generate Warranty Invoice'}</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{invoiceViewMode === 'warranty' ? 'Print Warranty Invoice' : 'Print Invoice'}</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
