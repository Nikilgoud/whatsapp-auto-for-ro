'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { calculateRevenueOpportunities } from '@/lib/services/revenueEngine';
import { formatIndianCurrency } from '@/lib/utils';
import { getUrgencyBadgeConfig } from '@/lib/services/dueCalculator';
import { WhatsAppModal } from '@/components/ui/WhatsAppModal';
import { Customer, Purifier, Renewal } from '@/types';
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
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';

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

  // Dynamic monthly revenue trend from real invoices & completed services
  const revenueChartData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = monthNames[d.getMonth()];
      const yearStr = d.getFullYear().toString();
      const mStr = String(d.getMonth() + 1).padStart(2, '0');
      const prefix = `${yearStr}-${mStr}`;

      const monthInvoices = invoices.filter((inv) => inv.invoiceDate?.startsWith(prefix));
      const invRev = monthInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

      const monthServices = services.filter((srv) =>
        srv.status === 'Completed' &&
        (srv.completedTime?.startsWith(prefix) || srv.scheduledDate?.startsWith(prefix) || srv.createdAt?.startsWith(prefix))
      );
      const srvRev = monthServices.reduce((sum, srv) => sum + (srv.amountPaid || srv.total || 0), 0);

      const rev = Math.max(invRev, srvRev);
      const srvCount = Math.max(monthInvoices.length, monthServices.length);
      result.push({ month: mName, revenue: rev, services: srvCount });
    }
    return result;
  }, [invoices, services]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/10 rounded-full text-xs text-cyan-300 font-medium">
            <Droplet className="w-3.5 h-3.5 text-cyan-400" />
            <span>RO Operating System • Hyderabad Live</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {getGreeting()}, {ownerDisplayName}!
          </h2>
          <p className="text-xs text-slate-300">
            {business.name} has <span className="text-cyan-300 font-bold">{overdueRenewals.length} services overdue</span> and <span className="text-emerald-300 font-bold">{todaysJobs.length} technician visits scheduled today</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('renewals')}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-sm flex items-center gap-1.5"
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
          className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Active Customers</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalCustomers}</span>
            <span className="text-[11px] text-emerald-600 font-medium">+{customersThisMonth} this month</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Residential & Commercial RO</p>
        </div>

        {/* Card 2: Overdue Alert */}
        <div
          onClick={() => onNavigate('renewals')}
          className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-xs hover:border-rose-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-rose-600 dark:text-rose-400">Urgent Overdue</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/50 rounded-xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{overdueRenewals.length}</span>
            <span className="text-[11px] text-rose-600 font-medium">Needs outreach</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">High risk of customer churn</p>
        </div>

        {/* Card 3: Today's Jobs */}
        <div
          onClick={() => onNavigate('services')}
          className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Today's Visits</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{todaysJobs.length}</span>
            <span className="text-[11px] text-emerald-600 font-medium">{activeTechniciansCount} Technicians active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Doorstep servicing Hyderabad</p>
        </div>

        {/* Card 4: Monthly Revenue */}
        <div
          onClick={() => onNavigate('invoices')}
          className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Month Revenue</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatIndianCurrency(currentMonthRevenue)}</span>
            <span className="text-[11px] text-slate-400 font-medium">Collected</span>
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

      {/* CHARTS ROW: Monthly Revenue + Overdue Recovery Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Monthly Service Revenue Trend</h3>
              <p className="text-xs text-slate-500">Regular servicing, spares, and AMC subscription earnings</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded-lg">
              Avg Ticket: {formatIndianCurrency(invoices.length > 0 ? Math.round(invoices.reduce((sum, i) => sum + (i.amountPaid || i.total || 0), 0) / invoices.length) : 0)}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} textAnchor="middle" fontSize={11} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatIndianCurrency(value), 'Revenue']}
                  labelFormatter={(label) => `Month: ${label}`}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Technician Performance Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Technician Leaderboard</h3>
              <button
                onClick={() => onNavigate('technicians')}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {technicians.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No technicians added yet.
                </div>
              ) : (
                technicians.map((tech) => (
                  <div
                    key={tech.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {tech.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{tech.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {tech.serviceAreas?.[0] || 'General'} zone • {tech.rating || 5} ★
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{tech.completedJobs} Jobs</p>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                        {tech.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {technicians.length > 0 ? (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-300">
              <span className="font-semibold">Smart Locality Routing: </span>
              {technicians.map((t) => `${t.name} (${t.serviceAreas.join(', ') || 'All areas'})`).join(' • ')}
            </div>
          ) : (
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
              Add field technicians in the Technicians tab to assign service jobs.
            </div>
          )}
        </div>
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
