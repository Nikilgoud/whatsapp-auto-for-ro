'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { calculateRevenueOpportunities } from '@/lib/services/revenueEngine';
import { formatIndianCurrency } from '@/lib/utils';
import { getUrgencyBadgeConfig } from '@/lib/services/dueCalculator';
import { WhatsAppModal } from '@/components/ui/WhatsAppModal';
import { Customer, Purifier, Renewal } from '@/types';
import { DashboardWhatsAppWidget } from './DashboardWhatsAppWidget';
import {
  Users,
  AlertTriangle,
  Clock,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Sparkles,
  ArrowUpRight,
  MessageSquare,
  Phone,
  Calendar,
  CheckCircle2,
  Wrench,
  ChevronRight,
  DollarSign,
  Droplet,
  Trophy,
  Award,
  MapPin,
} from 'lucide-react';

interface OwnerDashboardProps {
  onNavigate: (tab: string) => void;
  onSelectCustomer: (customer: Customer) => void;
  onScheduleForRenewal: (renewal: Renewal) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  onNavigate,
  onSelectCustomer,
  onScheduleForRenewal,
}) => {
  const {
    business,
    currentUser,
    customers,
    purifiers,
    renewals,
    services,
    invoices,
    amcSubscriptions,
    technicians,
  } = useApp();

  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [selectedCustForWhatsApp, setSelectedCustForWhatsApp] = useState<Customer | null>(null);
  const [selectedPurForWhatsApp, setSelectedPurForWhatsApp] = useState<Purifier | null>(null);
  const [defaultTemplate, setDefaultTemplate] = useState<string>('SERVICE_DUE');

  // Leaderboard sorting & fleet performance metrics
  const sortedTechnicians = useMemo(() => {
    return [...technicians].sort((a, b) => {
      return (b.completedJobs || 0) - (a.completedJobs || 0);
    });
  }, [technicians]);

  const totalFleetCompletedJobs = useMemo(() => {
    return technicians.reduce((sum, t) => sum + (t.completedJobs || 0), 0);
  }, [technicians]);

  const fleetServiceRevenue = useMemo(() => {
    return technicians.reduce((sum, t) => sum + (t.revenueGenerated || 0), 0);
  }, [technicians]);

  const availableTechsCount = useMemo(() => {
    return technicians.filter((t) => t.status === 'Available').length;
  }, [technicians]);

  // Revenue engine calculation
  const revenueStats = calculateRevenueOpportunities(
    renewals,
    customers,
    invoices,
    amcSubscriptions,
    business.settings
  );

  // Counts
  const totalCustomers = customers.length;
  const overdueRenewals = renewals.filter((r) => r.daysRemaining <= 0 && r.status === 'PENDING');
  const dueWithin7Days = renewals.filter((r) => r.daysRemaining > 0 && r.daysRemaining <= 7 && r.status === 'PENDING');
  const amcExpiringCount = amcSubscriptions.filter((s) => s.status === 'Expiring soon' || s.status === 'Active').length;
  const todaysJobs = services.filter((s) => s.status === 'Assigned' || s.status === 'Started' || s.status === 'Confirmed');
  const pendingInvoicesTotal = invoices
    .filter((inv) => inv.paymentStatus !== 'Paid')
    .reduce((sum, inv) => sum + (inv.balanceDue || inv.total - inv.amountPaid), 0);

  // Dynamic monthly calculations (reflects all paid invoices and completed paid services)
  const currentNow = new Date();
  const currentMonthPrefix = `${currentNow.getFullYear()}-${String(currentNow.getMonth() + 1).padStart(2, '0')}`;
  
  const currentMonthInvoices = invoices.filter((inv) => inv.invoiceDate?.startsWith(currentMonthPrefix));
  const invoiceRevenue = currentMonthInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

  const currentMonthServices = services.filter((srv) =>
    srv.status === 'Completed' &&
    (srv.completedTime?.startsWith(currentMonthPrefix) || srv.scheduledDate?.startsWith(currentMonthPrefix) || srv.createdAt?.startsWith(currentMonthPrefix))
  );
  const serviceRevenue = currentMonthServices.reduce((sum, srv) => sum + (srv.amountPaid || srv.total || 0), 0);

  const currentMonthRevenue = Math.max(invoiceRevenue, serviceRevenue);
  const customersThisMonth = customers.filter((c) => c.createdAt?.startsWith(currentMonthPrefix)).length;
  const activeTechniciansCount = technicians.filter((t) => t.status !== 'Inactive').length;

  const openWhatsApp = (customer: Customer, purifier?: Purifier, templateKey = 'SERVICE_DUE') => {
    setSelectedCustForWhatsApp(customer);
    setSelectedPurForWhatsApp(purifier || null);
    setDefaultTemplate(templateKey);
    setWhatsAppModalOpen(true);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };
  const ownerDisplayName = business.ownerName || currentUser.name || 'Owner';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 rounded-3xl p-6 text-white shadow-xl border border-sky-500/20 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/10 dark:bg-white/5 rounded-full text-xs text-cyan-300 font-semibold border border-cyan-400/20 backdrop-blur-xs">
            <Droplet className="w-3.5 h-3.5 text-cyan-400" />
            <span>RO Operating System • Water-Tech Control Center</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {getGreeting()}, {ownerDisplayName}!
          </h2>
          <p className="text-xs text-slate-300">
            {business.name} has <span className="text-cyan-300 font-bold">{overdueRenewals.length} services overdue</span> and <span className="text-emerald-300 font-bold">{todaysJobs.length} technician visits scheduled today</span>.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => onNavigate('renewals')}
            className="px-4 py-2.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition shadow-sm flex items-center gap-1.5 active:scale-95"
          >
            <span>Open Renewal Pipeline</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Customers */}
        <div
          onClick={() => onNavigate('customers')}
          className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-cyan-500/50 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">Active Customers</span>
            <div className="p-2.5 bg-sky-50 dark:bg-sky-950/50 rounded-2xl text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">{totalCustomers}</span>
            <span className="text-[11px] text-emerald-600 font-bold">+{customersThisMonth} this month</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Residential & Commercial RO</p>
        </div>

        {/* Card 2: Overdue Alert */}
        <div
          onClick={() => onNavigate('renewals')}
          className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200/90 dark:border-rose-900/60 shadow-xs hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold text-[11px] uppercase tracking-wider text-rose-600 dark:text-rose-400">Urgent Overdue</span>
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 rounded-2xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums tracking-tight">{overdueRenewals.length}</span>
            <span className="text-[11px] text-rose-600 font-bold">Needs outreach</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">High risk of customer churn</p>
        </div>

        {/* Card 3: Today's Jobs */}
        <div
          onClick={() => onNavigate('services')}
          className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">Today's Visits</span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">{todaysJobs.length}</span>
            <span className="text-[11px] text-emerald-600 font-bold">{activeTechniciansCount} Techs active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Doorstep servicing Hyderabad</p>
        </div>

        {/* Card 4: Monthly Revenue */}
        <div
          onClick={() => onNavigate('invoices')}
          className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-indigo-500/50 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">Month Revenue</span>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">{formatIndianCurrency(currentMonthRevenue)}</span>
            <span className="text-[11px] text-emerald-600 font-bold">Collected</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Pending: {formatIndianCurrency(pendingInvoicesTotal)}</p>
        </div>
      </div>

      {/* CORE HIGHLIGHT: "MONEY LEFT ON THE TABLE" WIDGET */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Revenue Opportunities (Money Left On The Table)</h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-amber-400 text-slate-900 rounded-full">
                  Unrealized Revenue
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Identified immediately from overdue filters, expired AMCs, and uncollected invoices.
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Potential Revenue</p>
            <p className="text-3xl font-extrabold text-amber-300">
              {formatIndianCurrency(revenueStats.totalPotentialRevenue)}
            </p>
          </div>
        </div>

        {/* 4 Breakdown Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          {/* Box 1 */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Filter Replacements</span>
              <span className="text-cyan-300 font-semibold">{revenueStats.filterReplacementsCount} due</span>
            </div>
            <p className="text-xl font-bold text-white">
              {formatIndianCurrency(revenueStats.filterReplacementsOpportunity)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Sediment & Pre-carbon candles due</p>
          </div>

          {/* Box 2 */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>AMC Renewals</span>
              <span className="text-indigo-300 font-semibold">{revenueStats.amcRenewalsCount} expiring</span>
            </div>
            <p className="text-xl font-bold text-white">
              {formatIndianCurrency(revenueStats.amcRenewalsOpportunity)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Annual contracts due this month</p>
          </div>

          {/* Box 3 */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Overdue Customers</span>
              <span className="text-rose-300 font-semibold">{revenueStats.overdueCustomersCount} overdue</span>
            </div>
            <p className="text-xl font-bold text-white">
              {formatIndianCurrency(revenueStats.overdueCustomersOpportunity)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Overdue regular service recovery</p>
          </div>

          {/* Box 4 */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Pending Invoices</span>
              <span className="text-amber-300 font-semibold">{revenueStats.pendingInvoicesCount} unpaid</span>
            </div>
            <p className="text-xl font-bold text-white">
              {formatIndianCurrency(revenueStats.pendingPaymentsAmount)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Collect via UPI link or on visit</p>
          </div>
        </div>
      </div>

      {/* TODAY'S PRIORITY ACTION RADAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Today&apos;s Priority Radar</span>
              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold rounded-full">
                Action Required
              </span>
            </h3>
            <p className="text-xs text-slate-500">Every morning the dealer should review and clear these items.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigate('renewals')}
            className="p-3 bg-rose-50/80 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/50 text-left hover:scale-[1.02] transition"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
              <span>Overdue</span>
            </div>
            <p className="text-xl font-extrabold text-rose-800 dark:text-rose-300 mt-1">{overdueRenewals.length}</p>
            <p className="text-[11px] text-rose-600/80">Immediate recovery</p>
          </button>

          <button
            onClick={() => onNavigate('renewals')}
            className="p-3 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50 text-left hover:scale-[1.02] transition"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Due &lt; 7 Days</span>
            </div>
            <p className="text-xl font-extrabold text-amber-800 dark:text-amber-300 mt-1">{dueWithin7Days.length}</p>
            <p className="text-[11px] text-amber-600/80">Send reminders</p>
          </button>

          <button
            onClick={() => onNavigate('amc')}
            className="p-3 bg-indigo-50/80 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-900/50 text-left hover:scale-[1.02] transition"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AMC Renewals</span>
            </div>
            <p className="text-xl font-extrabold text-indigo-800 dark:text-indigo-300 mt-1">{amcExpiringCount}</p>
            <p className="text-[11px] text-indigo-600/80">Contracts expiring</p>
          </button>

          <button
            onClick={() => onNavigate('invoices')}
            className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-left hover:scale-[1.02] transition"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Pending Dues</span>
            </div>
            <p className="text-xl font-extrabold text-emerald-800 dark:text-emerald-300 mt-1">
              {formatIndianCurrency(pendingInvoicesTotal)}
            </p>
            <p className="text-[11px] text-emerald-600/80">Unpaid balances</p>
          </button>

          <button
            onClick={() => onNavigate('services')}
            className="p-3 bg-blue-50/80 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50 text-left hover:scale-[1.02] transition"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
              <Wrench className="w-3.5 h-3.5" />
              <span>Today&apos;s Jobs</span>
            </div>
            <p className="text-xl font-extrabold text-blue-800 dark:text-blue-300 mt-1">{todaysJobs.length}</p>
            <p className="text-[11px] text-blue-600/80">Dispatched visits</p>
          </button>

          <button
            onClick={() => onNavigate('technicians')}
            className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left hover:scale-[1.02] transition"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Users className="w-3.5 h-3.5" />
              <span>Technicians</span>
            </div>
            <p className="text-xl font-extrabold text-slate-800 dark:text-slate-200 mt-1">{technicians.length} Active</p>
            <p className="text-[11px] text-slate-500">
              {technicians.length > 0 ? technicians.map((t) => t.name).join(', ') : 'No technicians yet'}
            </p>
          </button>
        </div>
      </div>

      {/* WHATSAPP OPERATIONS & RECENT CHATS LIVE WIDGET */}
      <DashboardWhatsAppWidget
        onNavigate={onNavigate}
        onSelectCustomer={onSelectCustomer}
      />

      {/* WIDE TECHNICIAN LEADERBOARD & FIELD OPS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-xs">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Technician Leaderboard</h3>
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 rounded-full border border-amber-300/40">
                  Field Operations
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time technician rankings, field job completion, coverage zones & active dispatch status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => onNavigate('technicians')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <span>Manage Technicians</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Fleet Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 p-3.5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          <div className="p-2 sm:p-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Staff</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">{technicians.length}</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">({availableTechsCount} Ready)</span>
            </div>
          </div>
          <div className="p-2 sm:p-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Today&apos;s Visits</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg sm:text-xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">{todaysJobs.length}</span>
              <span className="text-[11px] text-slate-500 font-medium">scheduled</span>
            </div>
          </div>
          <div className="p-2 sm:p-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Fleet Completed</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">{totalFleetCompletedJobs}</span>
              <span className="text-[11px] text-slate-500 font-medium">jobs closed</span>
            </div>
          </div>
          <div className="p-2 sm:p-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Fleet Serviced</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatIndianCurrency(fleetServiceRevenue)}
              </span>
            </div>
          </div>
        </div>

        {/* Wider Grid of Technicians */}
        {sortedTechnicians.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl my-2">
            <Wrench className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No field technicians added yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Add your RO service engineers and mechanics to track job completions, dispatch emergency visits, and allocate service areas.
            </p>
            <button
              onClick={() => onNavigate('technicians')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/20"
            >
              Add First Technician
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedTechnicians.map((tech, idx) => {
              const rank = idx + 1;
              const isTop = rank === 1;
              const isSecond = rank === 2;
              const isThird = rank === 3;

              return (
                <div
                  key={tech.id}
                  className={`relative p-4 rounded-2xl border transition-all hover:shadow-md ${
                    isTop
                      ? 'bg-gradient-to-b from-amber-500/5 via-white to-white dark:from-amber-500/10 dark:via-slate-900 dark:to-slate-900 border-amber-300/80 dark:border-amber-500/40 shadow-xs'
                      : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800'
                  }`}
                >
                  {/* Top Bar: Rank & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      {isTop && (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 shadow-xs">
                          <Trophy className="w-3 h-3 fill-amber-950" />
                          <span>#1 Leader</span>
                        </span>
                      )}
                      {isSecond && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                          #2 Runner
                        </span>
                      )}
                      {isThird && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                          #3
                        </span>
                      )}
                      {rank > 3 && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          #{rank}
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                        tech.status === 'Available'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : tech.status === 'On job'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          : tech.status === 'Busy'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          tech.status === 'Available'
                            ? 'bg-emerald-500 animate-pulse'
                            : tech.status === 'On job'
                            ? 'bg-blue-500'
                            : tech.status === 'Busy'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                      />
                      <span>{tech.status}</span>
                    </span>
                  </div>

                  {/* Technician Profile Card Header */}
                  <div className="flex items-center gap-3 mb-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                        isTop
                          ? 'bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-extrabold'
                          : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
                      }`}
                    >
                      {tech.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {tech.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {tech.phone}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {tech.skills?.[0] || 'RO Specialist'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Box */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 mb-3 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Completed</span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                        {tech.completedJobs || 0} Jobs
                      </span>
                    </div>
                    <div className="border-l border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block font-medium">Active / Pending</span>
                      <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                        {tech.pendingJobs || 0} Visits
                      </span>
                    </div>
                  </div>

                  {/* Locality Tags */}
                  <div className="mb-3.5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1.5 font-medium">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>Service Localities</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tech.serviceAreas && tech.serviceAreas.length > 0 ? (
                        tech.serviceAreas.slice(0, 3).map((area) => (
                          <span
                            key={area}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            {area}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">All Hyderabad zones</span>
                      )}
                      {tech.serviceAreas && tech.serviceAreas.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          +{tech.serviceAreas.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => onNavigate('technicians')}
                      className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg transition text-center"
                    >
                      View Details
                    </button>
                    {tech.whatsappNumber && (
                      <a
                        href={`https://wa.me/${tech.whatsappNumber.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 rounded-lg transition border border-emerald-200 dark:border-emerald-800"
                        title="Chat with Technician on WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {tech.phone && (
                      <a
                        href={`tel:${tech.phone}`}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-lg transition border border-blue-200 dark:border-blue-800"
                        title="Call Technician"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Locality Coverage Routing Footer */}
        {technicians.length > 0 && (
          <div className="mt-5 p-3.5 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50/70 dark:from-slate-800/60 dark:via-indigo-950/30 dark:to-slate-800/60 rounded-2xl border border-blue-100 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white">Smart Locality Coverage: </span>
                <span className="text-slate-600 dark:text-slate-400">
                  {technicians.map((t) => `${t.name} (${t.serviceAreas.join(', ') || 'All zones'})`).join(' • ')}
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('technicians')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline shrink-0 self-start sm:self-auto"
            >
              Manage Zones →
            </button>
          </div>
        )}
      </div>

      {/* OVERDUE RECOVERY TABLE (PRIORITY LIST) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
              <span>Overdue Recovery Desk</span>
            </h3>
            <p className="text-xs text-slate-500">
              Customers whose purifiers have exceeded their recommended service interval. Don&apos;t let them switch to another local mechanic!
            </p>
          </div>
          <button
            onClick={() => onNavigate('renewals')}
            className="text-xs text-blue-600 font-semibold hover:underline self-start sm:self-auto"
          >
            View Full Pipeline &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-3">Customer & Area</th>
                <th className="py-2.5 px-3">Purifier Model</th>
                <th className="py-2.5 px-3">Service Type</th>
                <th className="py-2.5 px-3">Days Overdue</th>
                <th className="py-2.5 px-3">Value</th>
                <th className="py-2.5 px-3 text-right">Quick Recovery Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {renewals.filter((r) => r.daysRemaining <= 0).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    All customer purifiers are up to date! No overdue services.
                  </td>
                </tr>
              ) : (
                renewals
                  .filter((r) => r.daysRemaining <= 0)
                  .slice(0, 5)
                  .map((rnw) => {
                  const customer = customers.find((c) => c.id === rnw.customerId);
                  const purifier = purifiers.find((p) => p.id === rnw.purifierId);
                  if (!customer) return null;

                  return (
                    <tr key={rnw.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3">
                        <button
                          onClick={() => onSelectCustomer(customer)}
                          className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 text-left"
                        >
                          {customer.fullName}
                        </button>
                        <p className="text-[11px] text-slate-400">
                          {customer.areaLocality}, Hyderabad • +91 {customer.mobileNumber}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {purifier?.brand || 'RO'} {purifier?.model || ''}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {rnw.serviceType}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          {Math.abs(rnw.daysRemaining)} Days Overdue
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {formatIndianCurrency(rnw.estimatedValue)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openWhatsApp(customer, purifier, 'SERVICE_OVERDUE')}
                            className="p-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white rounded-lg transition"
                            title="Send Overdue WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`tel:${customer.mobileNumber}`}
                            className="p-1.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-blue-600 hover:text-white rounded-lg transition"
                            title="Call Customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => onScheduleForRenewal(rnw)}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition text-[11px]"
                          >
                            Schedule Job
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

      {/* WhatsApp Modal */}
      {selectedCustForWhatsApp && (
        <WhatsAppModal
          isOpen={whatsAppModalOpen}
          onClose={() => {
            setWhatsAppModalOpen(false);
            setSelectedCustForWhatsApp(null);
          }}
          customer={selectedCustForWhatsApp}
          purifier={selectedPurForWhatsApp || undefined}
          defaultTemplateKey={defaultTemplate}
        />
      )}
    </div>
  );
};
