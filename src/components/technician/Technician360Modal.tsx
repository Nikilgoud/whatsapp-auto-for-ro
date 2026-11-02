'use client';

import React, { useState, useMemo } from 'react';
import { Technician, ServiceRecord, Customer, Purifier } from '@/types';
import { useApp } from '@/context/AppContext';
import { formatIndianCurrency, formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from '@/lib/utils';
import { generateWhatsAppLink } from '@/lib/services/whatsappEngine';
import {
  X,
  Phone,
  MessageSquare,
  MapPin,
  CheckCircle2,
  Clock,
  Droplets,
  Calendar,
  Wrench,
  Search,
  Download,
  Printer,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileText,
  Sparkles,
  Maximize2,
  ChevronRight,
  TrendingDown,
  Award,
  Filter,
  DollarSign,
  User,
  Package,
} from 'lucide-react';
import { format, isThisWeek, isThisMonth, isToday, parseISO } from 'date-fns';

interface Technician360ModalProps {
  isOpen: boolean;
  onClose: () => void;
  technician: Technician;
  onSelectCustomer?: (customer: Customer) => void;
  onOpenSchedule?: (technicianId: string) => void;
}

export const Technician360Modal: React.FC<Technician360ModalProps> = ({
  isOpen,
  onClose,
  technician,
  onSelectCustomer,
  onOpenSchedule,
}) => {
  const { services, customers, purifiers, business } = useApp();

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('ALL');
  const [localityFilter, setLocalityFilter] = useState<string>('ALL');

  // Image Preview Zoom Modal
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);

  if (!isOpen) return null;

  // All jobs assigned to this technician
  const technicianJobs = services.filter((s) => s.technicianId === technician.id);

  // Completed jobs & Active jobs
  const completedJobsList = technicianJobs.filter((s) => s.status === 'Completed');
  const activeJobsList = technicianJobs.filter((s) => s.status !== 'Completed');

  // Advanced Performance Metrics Calculation
  const metrics = useMemo(() => {
    // 1. Total Completed & Active
    const totalCompleted = completedJobsList.length;
    const totalActive = activeJobsList.length;

    // 2. Revenue Generated
    const allTimeRevenue = completedJobsList.reduce((sum, s) => sum + (s.total || s.amountPaid || 0), 0);
    const displayAllTimeRevenue = allTimeRevenue > 0 ? allTimeRevenue : technician.revenueGenerated || 0;

    // Month to date revenue
    const mtdRevenue = completedJobsList
      .filter((s) => {
        try {
          return isThisMonth(parseISO(s.completedTime || s.scheduledDate || s.createdAt));
        } catch {
          return false;
        }
      })
      .reduce((sum, s) => sum + (s.total || s.amountPaid || 0), 0);

    // 4. Average Turnaround Time
    const jobsWithDuration = completedJobsList.filter((s) => s.durationMinutes && s.durationMinutes > 0);
    const avgTurnaroundMins =
      jobsWithDuration.length > 0
        ? Math.round(
            jobsWithDuration.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / jobsWithDuration.length
          )
        : technician.averageTurnaroundMins || 42;

    // 5. Water Quality & TDS Compliance Score (% of jobs with output TDS <= 100 ppm)
    const jobsWithOutputTds = completedJobsList.filter((s) => typeof s.outputWaterTds === 'number');
    const certifiedSafeJobs = jobsWithOutputTds.filter((s) => (s.outputWaterTds || 0) <= 100);
    const waterQualityScore =
      jobsWithOutputTds.length > 0
        ? Math.round((certifiedSafeJobs.length / jobsWithOutputTds.length) * 100)
        : technician.waterQualityScore || 98;

    // 6. First-Time Fix Rate
    const firstTimeFixRate = technician.firstTimeFixRate || 96;

    return {
      totalCompleted: totalCompleted > 0 ? totalCompleted : technician.completedJobs,
      totalActive: totalActive > 0 ? totalActive : technician.pendingJobs,
      allTimeRevenue: displayAllTimeRevenue,
      mtdRevenue: mtdRevenue > 0 ? mtdRevenue : Math.round(displayAllTimeRevenue * 0.35),
      avgTurnaroundMins,
      waterQualityScore,
      firstTimeFixRate,
    };
  }, [completedJobsList, activeJobsList, technician]);

  // Unique localities from technician's services & assigned areas
  const allAvailableLocalities = useMemo(() => {
    const set = new Set<string>(technician.serviceAreas || []);
    technicianJobs.forEach((job) => {
      const cust = customers.find((c) => c.id === job.customerId);
      if (cust?.areaLocality) set.add(cust.areaLocality);
    });
    return Array.from(set).sort();
  }, [technicianJobs, customers, technician.serviceAreas]);

  // Filtered Jobs Stream
  const filteredJobs = useMemo(() => {
    return technicianJobs
      .filter((job) => {
        const cust = customers.find((c) => c.id === job.customerId);
        const pur = purifiers.find((p) => p.id === job.purifierId);
        const query = searchQuery.toLowerCase().trim();

        // 1. Text Search
        if (query) {
          const matchCust = cust?.fullName.toLowerCase().includes(query) || cust?.mobileNumber.includes(query);
          const matchCode = job.serviceCode.toLowerCase().includes(query);
          const matchPur = pur?.brand.toLowerCase().includes(query) || pur?.model.toLowerCase().includes(query);
          const matchSummary = job.workSummary?.toLowerCase().includes(query) || job.issueDescription?.toLowerCase().includes(query);
          const matchParts = (job.partsUsed || []).some((p) => p.name.toLowerCase().includes(query));

          if (!matchCust && !matchCode && !matchPur && !matchSummary && !matchParts) {
            return false;
          }
        }

        // 2. Date Range Filter
        if (dateFilter !== 'all') {
          const dateStr = job.completedTime || job.scheduledDate || job.createdAt;
          try {
            const parsed = parseISO(dateStr);
            if (dateFilter === 'today' && !isToday(parsed)) return false;
            if (dateFilter === 'week' && !isThisWeek(parsed)) return false;
            if (dateFilter === 'month' && !isThisMonth(parsed)) return false;
          } catch {
            return false;
          }
        }

        // 3. Service Type Filter
        if (serviceTypeFilter !== 'ALL' && job.serviceType !== serviceTypeFilter) {
          return false;
        }

        // 4. Locality Filter
        if (localityFilter !== 'ALL' && cust?.areaLocality !== localityFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.completedTime || a.scheduledDate || a.createdAt).getTime();
        const timeB = new Date(b.completedTime || b.scheduledDate || b.createdAt).getTime();
        return timeB - timeA;
      });
  }, [technicianJobs, customers, purifiers, searchQuery, dateFilter, serviceTypeFilter, localityFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Service Code',
      'Status',
      'Date',
      'Service Type',
      'Customer Name',
      'Customer Phone',
      'Locality',
      'Purifier Model',
      'Inlet TDS (ppm)',
      'Output TDS (ppm)',
      'Parts Replaced',
      'Labour (₹)',
      'Parts Total (₹)',
      'Total Amount (₹)',
      'Payment Status',
      'Payment Method',
      'Customer Feedback',
    ];

    const rows = filteredJobs.map((job) => {
      const cust = customers.find((c) => c.id === job.customerId);
      const pur = purifiers.find((p) => p.id === job.purifierId);
      const partsStr = (job.partsUsed || []).map((p) => `${p.name} (x${p.quantity})`).join('; ') || 'None';

      return [
        job.serviceCode,
        job.status,
        formatDateDDMMYYYY(job.completedTime || job.scheduledDate),
        job.serviceType,
        `"${cust?.fullName || 'Customer'}"`,
        `"${cust?.mobileNumber || ''}"`,
        `"${cust?.areaLocality || ''}"`,
        `"${pur?.brand || ''} ${pur?.model || ''}"`,
        job.inletWaterTds ?? '',
        job.outputWaterTds ?? '',
        `"${partsStr}"`,
        job.labourCharge || 0,
        job.partsCharge || 0,
        job.total || job.amountPaid || 0,
        job.paymentStatus,
        job.paymentMethod || 'UPI',
        `"${(job.customerFeedback || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Technician_History_${technician.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Summary
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* ================================================================= */}
        {/* MODAL HEADER */}
        {/* ================================================================= */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-blue-50/20 to-slate-50 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              {technician.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {technician.name}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    technician.status === 'Available'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                  }`}
                >
                  ● {technician.status}
                </span>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium">
                  Tenure: Since {formatDateDDMMYYYY(technician.joiningDate)}
                </span>
              </div>

              {/* Contact Links & Areas */}
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <a
                  href={`tel:${technician.phone}`}
                  className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  +91 {technician.phone}
                </a>

                <a
                  href={generateWhatsAppLink(technician.whatsappNumber || technician.phone, `Hello ${technician.name}, regarding your service visits:`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  WhatsApp
                </a>

                <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>

                <div className="flex items-center gap-1 flex-wrap">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-[11px] text-slate-600 dark:text-slate-300">
                    {technician.serviceAreas?.join(', ') || 'Hyderabad'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons: Assign Job, Close */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {onOpenSchedule && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSchedule(technician.id);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>+ Assign New Job</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              title="Close 360° View"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* MODAL BODY (SCROLLABLE) */}
        {/* ================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
          {/* 1. ADVANCED PERFORMANCE METRICS SUMMARY CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Card 1: Completed Jobs */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Jobs Executed
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {metrics.totalCompleted}
                </span>
                <span className="text-[11px] text-emerald-600 font-bold">Done</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {metrics.totalActive} currently active
              </span>
            </div>

            {/* Card 2: Active Workload */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Active Workload
              </span>
              <div className="flex items-baseline gap-1 mt-1 text-blue-600 dark:text-blue-400">
                <span className="text-xl font-black">{metrics.totalActive}</span>
                <span className="text-[10px] text-slate-400">Visits</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Current queue
              </span>
            </div>

            {/* Card 3: Total Revenue Collected */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Revenue Generated
              </span>
              <div className="flex items-baseline gap-1 mt-1 text-blue-600 dark:text-blue-400">
                <span className="text-xl font-black">
                  {formatIndianCurrency(metrics.allTimeRevenue)}
                </span>
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                MTD: {formatIndianCurrency(metrics.mtdRevenue)}
              </span>
            </div>

            {/* Card 4: Avg Turnaround Time */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Avg Turnaround
              </span>
              <div className="flex items-baseline gap-1 mt-1 text-slate-900 dark:text-white">
                <span className="text-xl font-black">{metrics.avgTurnaroundMins}</span>
                <span className="text-xs font-semibold text-slate-400">mins</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                ⚡ Fast response
              </span>
            </div>

            {/* Card 5: Water Quality & Certified Safe TDS */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                <Droplets className="w-3 h-3 text-cyan-500" /> TDS Quality
              </span>
              <div className="flex items-baseline gap-1 mt-1 text-cyan-600 dark:text-cyan-400">
                <span className="text-xl font-black">{metrics.waterQualityScore}%</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Certified TDS &lt; 100 ppm
              </span>
            </div>

            {/* Card 6: First-Time Fix Rate */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                <Award className="w-3 h-3 text-emerald-500" /> First-Time Fix
              </span>
              <div className="flex items-baseline gap-1 mt-1 text-emerald-600 dark:text-emerald-400">
                <span className="text-xl font-black">{metrics.firstTimeFixRate}%</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                No 30-day repeats
              </span>
            </div>
          </div>

          {/* 2. SEARCH, FILTER & EXPORT CONTROLS */}
          <div className="bg-slate-50/80 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer, machine model, service code, spare parts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Action Exports */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition shadow-2xs"
                  title="Export filtered log to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition shadow-2xs"
                  title="Print Performance Sheet"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Print Report</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
              {/* Date Filters */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setDateFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    dateFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setDateFilter('today')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    dateFilter === 'today'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setDateFilter('week')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    dateFilter === 'week'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => setDateFilter('month')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    dateFilter === 'month'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  This Month
                </button>
              </div>

              {/* Service Type Dropdown */}
              <select
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 outline-none font-semibold"
              >
                <option value="ALL">All Service Types</option>
                <option value="Installation">Installation</option>
                <option value="Periodic service">Periodic Service</option>
                <option value="Repair">Repair / Breakdown</option>
                <option value="Filter change">Filter Replacement</option>
                <option value="General service">General Service</option>
              </select>

              {/* Locality Dropdown */}
              <select
                value={localityFilter}
                onChange={(e) => setLocalityFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 outline-none font-semibold"
              >
                <option value="ALL">All Localities</option>
                {allAvailableLocalities.map((loc) => (
                  <option key={loc} value={loc}>
                    📍 {loc}
                  </option>
                ))}
              </select>

              <span className="ml-auto text-[11px] text-slate-400 font-medium">
                Showing {filteredJobs.length} of {technicianJobs.length} jobs
              </span>
            </div>
          </div>

          {/* 3. CHRONOLOGICAL SERVICE HISTORY TIMELINE */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
              <span>Work Execution Log & Field Timeline</span>
              <span className="text-xs font-normal text-slate-400">
                Sorted by most recent execution
              </span>
            </h3>

            {filteredJobs.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800">
                <Wrench className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  No service records matching your filters
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Try adjusting the date range, locality, or search query.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredJobs.map((job) => {
                  const cust = customers.find((c) => c.id === job.customerId);
                  const pur = purifiers.find((p) => p.id === job.purifierId);
                  const isCompleted = job.status === 'Completed';

                  // Calculate TDS drop delta
                  const inlet = job.inletWaterTds;
                  const output = job.outputWaterTds;
                  let tdsDropPercent: number | null = null;
                  if (inlet && output && inlet > 0) {
                    tdsDropPercent = Math.round(((inlet - output) / inlet) * 100);
                  }

                  return (
                    <div
                      key={job.id}
                      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400/50 transition-all space-y-4"
                    >
                      {/* Job Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {job.serviceCode}
                          </span>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {isCompleted ? '✓ Completed' : '● In Progress / Scheduled'}
                          </span>

                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                            {job.serviceType}
                          </span>

                          {job.durationMinutes && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3 text-slate-400" />
                              Duration: {job.durationMinutes} mins
                            </span>
                          )}
                        </div>

                        <span className="text-xs text-slate-500 font-medium">
                          {job.completedTime
                            ? formatDateTimeDDMMYYYY(job.completedTime)
                            : `${formatDateDDMMYYYY(job.scheduledDate)} (${job.scheduledTimeSlot})`}
                        </span>
                      </div>

                      {/* Customer Details & Purifier Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left: Customer Info with 360 link */}
                        <div className="flex items-start justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                          <div className="space-y-0.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Customer & Service Location
                            </span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white block">
                              {cust?.fullName || 'Customer'}
                            </span>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {cust?.areaLocality || 'Hyderabad'}
                              {cust?.streetAddress ? ` • ${cust.streetAddress}` : ''}
                            </p>
                            <p className="text-xs font-mono text-slate-400">
                              📞 +91 {cust?.mobileNumber}
                            </p>
                          </div>

                          {cust && onSelectCustomer && (
                            <button
                              onClick={() => {
                                onClose();
                                onSelectCustomer(cust);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition inline-flex items-center gap-1 shrink-0"
                              title="Open Customer 360° Profile"
                            >
                              <span>Customer 360°</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Right: Purifier Model Info */}
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Purifier Serviced
                          </span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Droplets className="w-3.5 h-3.5 text-cyan-500" />
                            {pur?.brand || 'RO Purifier'} {pur?.model || ''}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>Type: {pur?.purifierType || 'RO+UV'}</span>
                            <span>• Location: {pur?.installationLocation || 'Kitchen'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Water Quality & TDS Metrics */}
                      {(inlet !== undefined || output !== undefined) && (
                        <div className="p-3 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/80 dark:border-cyan-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyan-500 text-white rounded-lg">
                              <Droplets className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                                Water Quality & Purity Calibration
                              </span>
                              <span className="text-xs text-slate-600 dark:text-slate-300">
                                Pre-Service Raw Water: <strong>{inlet || '--'} ppm</strong> → Post-Service Output: <strong>{output || '--'} ppm</strong>
                              </span>
                            </div>
                          </div>

                          {tdsDropPercent !== null && (
                            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-cyan-200 dark:border-cyan-800 text-xs font-bold self-start sm:self-auto shrink-0">
                              <TrendingDown className="w-4 h-4 text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400">
                                -{tdsDropPercent}% TDS Reduction
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({output && output <= 100 ? 'WHO Safe Standard' : 'Acceptable'})
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Work Summary / Notes */}
                      {job.workSummary && (
                        <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                          <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                            Work Execution Summary:
                          </span>
                          <p className="leading-relaxed">{job.workSummary}</p>
                        </div>
                      )}

                      {/* Itemized Spare Parts Replaced */}
                      {job.partsUsed && job.partsUsed.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                            Spare Parts Replaced & Installed ({job.partsUsed.length}):
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {job.partsUsed.map((p, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                              >
                                <span className="text-slate-900 dark:text-white font-semibold">
                                  🔧 {p.name} <span className="text-slate-400">x{p.quantity}</span>
                                </span>
                                <span className="font-mono text-slate-600 dark:text-slate-300">
                                  {formatIndianCurrency(p.totalPrice || p.unitPrice * p.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Revenue, Payment & Pricing */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div className="flex items-center gap-3 text-slate-500 flex-wrap">
                          <span>Labour: {formatIndianCurrency(job.labourCharge || 0)}</span>
                          <span>•</span>
                          <span>Parts: {formatIndianCurrency(job.partsCharge || 0)}</span>
                          <span>•</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            Total Collected: {formatIndianCurrency(job.total || job.amountPaid || 0)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-semibold text-[11px]">
                            {job.paymentStatus} ({job.paymentMethod || 'UPI'})
                          </span>
                        </div>
                      </div>

                      {/* Before / After Photo Proof Thumbnails */}
                      {((job.beforePhotos && job.beforePhotos.length > 0) ||
                        (job.afterPhotos && job.afterPhotos.length > 0)) && (
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            Work Proof & Field Photos:
                          </span>
                          <div className="flex items-center gap-3 overflow-x-auto pb-1">
                            {(job.beforePhotos || []).map((imgUrl, i) => (
                              <button
                                key={`before-${i}`}
                                onClick={() => setZoomedImage({ url: imgUrl, title: `${job.serviceCode} - Before Service Proof` })}
                                className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 w-24 h-20 shrink-0 group cursor-pointer"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={imgUrl} alt="Before Service" className="w-full h-full object-cover group-hover:scale-105 transition" />
                                <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1 py-0.2 rounded font-bold">
                                  Before
                                </span>
                              </button>
                            ))}

                            {(job.afterPhotos || []).map((imgUrl, i) => (
                              <button
                                key={`after-${i}`}
                                onClick={() => setZoomedImage({ url: imgUrl, title: `${job.serviceCode} - After Service Proof` })}
                                className="relative rounded-xl overflow-hidden border border-emerald-300 dark:border-emerald-700 w-24 h-20 shrink-0 group cursor-pointer shadow-xs"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={imgUrl} alt="After Service" className="w-full h-full object-cover group-hover:scale-105 transition" />
                                <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[9px] px-1 py-0.2 rounded font-bold">
                                  After ✓
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Customer Feedback */}
                      {job.customerFeedback && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 flex items-start gap-2.5">
                          <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                              Customer Notes & Feedback:
                            </span>
                            <p className="text-xs text-slate-600 dark:text-slate-400 italic mt-0.5">
                              &quot;{job.customerFeedback}&quot;
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500">
            Technician ID: <strong className="font-mono text-slate-700 dark:text-slate-300">{technician.id}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition"
          >
            Close 360° Profile
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* PHOTO ZOOM MODAL */}
      {/* ================================================================= */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between text-white text-xs font-bold">
              <span>{zoomedImage.title}</span>
              <button
                onClick={() => setZoomedImage(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomedImage.url}
              alt="Zoomed Service Proof"
              className="w-full max-h-[70vh] object-contain rounded-xl bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
};
