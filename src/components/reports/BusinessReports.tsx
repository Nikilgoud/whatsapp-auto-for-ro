'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { formatIndianCurrency } from '@/lib/utils';
import {
  BarChart3,
  TrendingUp,
  Users,
  Repeat,
  Wrench,
  ShieldCheck,
  Package,
  Star,
  CheckCircle,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  DollarSign,
  Clock,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

type RevenuePeriod = 'weekly' | 'monthly' | 'yearly';

interface RevenueDataPoint {
  period: string;
  label: string;
  serviceRevenue: number;
  amcRevenue: number;
  total: number;
  jobsCompleted: number;
  growth: string;
  isPositive: boolean;
  notes: string;
}

export const BusinessReports: React.FC = () => {
  const { customers, services, renewals, technicians, inventory, amcSubscriptions, invoices } = useApp();
  const [period, setPeriod] = useState<RevenuePeriod>('monthly');

  const completedServices = services.filter((s) => s.status === 'Completed');
  const avgServiceValue =
    completedServices.length > 0
      ? Math.round(completedServices.reduce((sum, s) => sum + (s.total || 0), 0) / completedServices.length)
      : invoices.length > 0
      ? Math.round(invoices.reduce((sum, i) => sum + (i.amountPaid || i.total || 0), 0) / invoices.length)
      : 0;

  // Dynamic Weekly Revenue (last 5 weeks)
  const weeklyData = useMemo<RevenueDataPoint[]>(() => {
    const points: RevenueDataPoint[] = [];
    const now = new Date();
    for (let w = 4; w >= 0; w--) {
      const end = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
      const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];
      const label = w === 0 ? 'This Week' : (w + 'w ago');
      const periodTitle = start.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) + ' - ' + end.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

      const periodInvoices = invoices.filter((inv) => {
        const d = inv.invoiceDate;
        return d && d >= startStr && d <= endStr;
      });
      const periodServices = services.filter((s) => {
        const d = s.scheduledDate || s.completedTime;
        return d && d >= startStr && d <= endStr && s.status === 'Completed';
      });

      const invSum = periodInvoices.reduce((sum, inv) => sum + (inv.amountPaid || inv.total || 0), 0);
      const srvSum = periodServices.reduce((sum, s) => sum + (s.amountPaid || s.total || 0), 0);
      const sRev = Math.max(invSum, srvSum);
      const aRev = 0;
      const tot = sRev + aRev;

      points.push({
        period: periodTitle,
        label,
        serviceRevenue: sRev,
        amcRevenue: aRev,
        total: tot,
        jobsCompleted: periodServices.length,
        growth: '0%',
        isPositive: true,
        notes: periodServices.length > 0 ? (periodServices.length + ' jobs completed') : 'No services logged',
      });
    }

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1].total;
      const curr = points[i].total;
      if (prev > 0) {
        const pct = Math.round(((curr - prev) / prev) * 100);
        points[i].growth = (pct >= 0 ? '+' : '') + pct + '%';
        points[i].isPositive = pct >= 0;
      } else if (curr > 0) {
        points[i].growth = '+100%';
        points[i].isPositive = true;
      } else {
        points[i].growth = '0%';
        points[i].isPositive = true;
      }
    }
    return points;
  }, [invoices, services]);

  // Dynamic Monthly Revenue (last 6 months)
  const monthlyData = useMemo<RevenueDataPoint[]>(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const points: RevenueDataPoint[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = monthNames[d.getMonth()];
      const year = d.getFullYear();
      const prefix = year + '-' + String(d.getMonth() + 1).padStart(2, '0');

      const periodInvoices = invoices.filter((inv) => inv.invoiceDate?.startsWith(prefix));
      const periodServices = services.filter((s) => {
        const dt = s.completedTime || s.scheduledDate;
        return dt?.startsWith(prefix) && s.status === 'Completed';
      });

      const invSum = periodInvoices.reduce((sum, inv) => sum + (inv.amountPaid || inv.total || 0), 0);
      const srvSum = periodServices.reduce((sum, s) => sum + (s.amountPaid || s.total || 0), 0);
      const sRev = Math.max(invSum, srvSum);
      const aRev = 0;
      const tot = sRev + aRev;

      points.push({
        period: mName + ' ' + year,
        label: mName + " '" + String(year).slice(2),
        serviceRevenue: sRev,
        amcRevenue: aRev,
        total: tot,
        jobsCompleted: periodServices.length,
        growth: '0%',
        isPositive: true,
        notes: periodServices.length > 0 ? (periodServices.length + ' visits logged') : 'No visits recorded',
      });
    }

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1].total;
      const curr = points[i].total;
      if (prev > 0) {
        const pct = Math.round(((curr - prev) / prev) * 100);
        points[i].growth = (pct >= 0 ? '+' : '') + pct + '%';
        points[i].isPositive = pct >= 0;
      } else if (curr > 0) {
        points[i].growth = '+100%';
        points[i].isPositive = true;
      } else {
        points[i].growth = '0%';
        points[i].isPositive = true;
      }
    }
    return points;
  }, [invoices, services]);

  // Dynamic Yearly Revenue (last 3 years)
  const yearlyData = useMemo<RevenueDataPoint[]>(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const points: RevenueDataPoint[] = [];

    for (let y = curYear - 2; y <= curYear; y++) {
      const yStr = String(y);
      const periodInvoices = invoices.filter((inv) => inv.invoiceDate?.startsWith(yStr));
      const periodServices = services.filter((s) => {
        const dt = s.completedTime || s.scheduledDate;
        return dt?.startsWith(yStr) && s.status === 'Completed';
      });

      const invSum = periodInvoices.reduce((sum, inv) => sum + (inv.amountPaid || inv.total || 0), 0);
      const srvSum = periodServices.reduce((sum, s) => sum + (s.amountPaid || s.total || 0), 0);
      const sRev = Math.max(invSum, srvSum);
      const aRev = 0;
      const tot = sRev + aRev;

      points.push({
        period: 'FY ' + y,
        label: '' + y,
        serviceRevenue: sRev,
        amcRevenue: aRev,
        total: tot,
        jobsCompleted: periodServices.length,
        growth: '0%',
        isPositive: true,
        notes: periodServices.length > 0 ? (periodServices.length + ' jobs in ' + y) : ('No records for ' + y),
      });
    }

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1].total;
      const curr = points[i].total;
      if (prev > 0) {
        const pct = Math.round(((curr - prev) / prev) * 100);
        points[i].growth = (pct >= 0 ? '+' : '') + pct + '%';
        points[i].isPositive = pct >= 0;
      } else if (curr > 0) {
        points[i].growth = '+100%';
        points[i].isPositive = true;
      } else {
        points[i].growth = '0%';
        points[i].isPositive = true;
      }
    }
    return points;
  }, [invoices, services]);

  // Dynamic Service Distribution
  const serviceTypeData = useMemo(() => {
    if (services.length === 0) {
      return [
        { name: 'Filter Replacement', value: 0, color: '#2563eb' },
        { name: 'Routine Sanitization & TDS', value: 0, color: '#06b6d4' },
        { name: 'AMC Contract Renewals', value: 0, color: '#4f46e5' },
        { name: 'Pump & Electrical Spares', value: 0, color: '#f59e0b' },
      ];
    }
    const filterCount = services.filter((s) =>
      s.serviceType?.toLowerCase().includes('filter') || s.serviceType?.toLowerCase().includes('membrane')
    ).length;
    const sanitCount = services.filter((s) =>
      s.serviceType?.toLowerCase().includes('routine') ||
      s.serviceType?.toLowerCase().includes('sanitization') ||
      s.serviceType?.toLowerCase().includes('general')
    ).length;
    const amcCount = services.filter((s) => s.serviceType?.toLowerCase().includes('amc')).length;
    const repairCount = Math.max(0, services.length - (filterCount + sanitCount + amcCount));

    return [
      { name: 'Filter Replacement', value: Math.round((filterCount / services.length) * 100), color: '#2563eb' },
      { name: 'Routine Sanitization & TDS', value: Math.round((sanitCount / services.length) * 100), color: '#06b6d4' },
      { name: 'AMC Contract Renewals', value: Math.round((amcCount / services.length) * 100), color: '#4f46e5' },
      { name: 'Pump & Electrical Spares', value: Math.round((repairCount / services.length) * 100), color: '#f59e0b' },
    ];
  }, [services]);

  // Select active dataset
  const activeDataset =
    period === 'weekly'
      ? weeklyData
      : period === 'monthly'
      ? monthlyData
      : yearlyData;

  // Aggregate stats for the active view
  const totalPeriodRevenue = activeDataset.reduce((sum, d) => sum + d.total, 0);
  const totalPeriodService = activeDataset.reduce((sum, d) => sum + d.serviceRevenue, 0);
  const totalPeriodAmc = activeDataset.reduce((sum, d) => sum + d.amcRevenue, 0);
  const totalPeriodJobs = activeDataset.reduce((sum, d) => sum + d.jobsCompleted, 0);
  const latestDataPoint = activeDataset[activeDataset.length - 1] || {
    period: 'Current',
    label: 'Now',
    serviceRevenue: 0,
    amcRevenue: 0,
    total: 0,
    jobsCompleted: 0,
    growth: '0%',
    isPositive: true,
    notes: 'Awaiting new bookings',
  };
  const serviceSharePercent = Math.round((totalPeriodService / (totalPeriodRevenue || 1)) * 100);
  const amcSharePercent = 100 - serviceSharePercent;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Business Reports & Intelligence</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real calculated metrics for customer retention, technician performance, and revenue breakdown.
          </p>
        </div>

        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
          System Status: {customers.length > 0 ? 'Active' : 'Ready'}
        </span>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Total Customer Base</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{customers.length}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">{customers.length > 0 ? `${customers.length} registered` : 'No customers yet'}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Avg Service Ticket</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatIndianCurrency(avgServiceValue)}
          </p>
          <span className="text-[10px] text-slate-400">Filters + Labour charges</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Active AMC Contracts</span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{amcSubscriptions.length}</p>
          <span className="text-[10px] text-indigo-500 font-semibold">Annual recurring value</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Consumables in Stock</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {inventory.reduce((sum, i) => sum + i.currentStock, 0)} Units
          </p>
          <span className="text-[10px] text-amber-500 font-semibold">
            {inventory.filter((i) => i.isLowStock).length} Items Low Stock
          </span>
        </div>
      </div>

      {/* REVENUE BREAKDOWN & ANALYSIS (WEEKLY, MONTHLY, YEARLY) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        {/* Module Title & Period Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Revenue Breakdown & Financial Analytics
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                {period.toUpperCase()} VIEW
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Granular comparative analysis of weekly cashflow, monthly trends, and yearly revenue growth.
            </p>
          </div>

          {/* Period Toggle Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setPeriod('weekly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                period === 'weekly'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Weekly Analysis</span>
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                period === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Monthly Analysis</span>
            </button>
            <button
              onClick={() => setPeriod('yearly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                period === 'yearly'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Yearly Analysis</span>
            </button>
          </div>
        </div>

        {/* Dynamic Period Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">
              {period === 'weekly' ? 'Latest Week Revenue' : period === 'monthly' ? 'Latest Month Revenue' : 'Projected Annual Revenue'}
            </span>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              {formatIndianCurrency(latestDataPoint.total)}
            </p>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-0.5">
              <ArrowUpRight className="w-3 h-3" />
              <span>{latestDataPoint.growth} {period === 'weekly' ? 'WoW' : period === 'monthly' ? 'MoM' : 'YoY'}</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Routine Services & Spares</span>
            <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
              {formatIndianCurrency(totalPeriodService)}
            </p>
            <span className="text-[11px] text-slate-500 font-medium">{serviceSharePercent}% of total revenue</span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">AMC Contract Revenue</span>
            <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
              {formatIndianCurrency(totalPeriodAmc)}
            </p>
            <span className="text-[11px] text-slate-500 font-medium">{amcSharePercent}% recurring stability</span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Total Service Jobs Executed</span>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              {totalPeriodJobs} Visits
            </p>
            <span className="text-[11px] text-slate-500 font-medium">
              ~{formatIndianCurrency(Math.round(totalPeriodRevenue / (totalPeriodJobs || 1)))} / ticket
            </span>
          </div>
        </div>

        {/* Visual Chart: Comparative Bar Chart */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Comparative Revenue Stream Breakdown (₹ in Rupees)
            </p>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block"></span>
                <span>Routine Services & Spares</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block"></span>
                <span>AMC Subscriptions</span>
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeDataset} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickFormatter={(val) => (val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : `₹${val / 1000}k`)}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    formatIndianCurrency(Number(value)),
                    name === 'serviceRevenue' ? 'Routine Services & Spares' : 'AMC Contracts',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}
                />
                <Bar dataKey="serviceRevenue" fill="#2563eb" radius={[4, 4, 0, 0]} name="serviceRevenue" />
                <Bar dataKey="amcRevenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="amcRevenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Breakdown Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <th className="py-2.5 px-3">Period / Horizon</th>
                <th className="py-2.5 px-3 text-center">Jobs Completed</th>
                <th className="py-2.5 px-3 text-right">Service & Spares</th>
                <th className="py-2.5 px-3 text-right">AMC Contracts</th>
                <th className="py-2.5 px-3 text-right">Total Revenue</th>
                <th className="py-2.5 px-3 text-center">Growth</th>
                <th className="py-2.5 px-3">Operational Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeDataset.map((row) => (
                <tr key={row.period} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                    {row.period}
                  </td>
                  <td className="py-2.5 px-3 text-center font-medium text-slate-700 dark:text-slate-300">
                    {row.jobsCompleted}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-600 dark:text-blue-400">
                    {formatIndianCurrency(row.serviceRevenue)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-indigo-600 dark:text-indigo-400">
                    {formatIndianCurrency(row.amcRevenue)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {formatIndianCurrency(row.total)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.isPositive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {row.growth}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                    {row.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Strategic Analysis & Key Insights Box */}
        <div className="p-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-200/80 dark:border-blue-900 text-xs text-slate-700 dark:text-slate-300 space-y-1">
          <div className="flex items-center gap-2 font-bold text-blue-950 dark:text-blue-200">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>
              {period === 'weekly'
                ? 'Weekly Strategic Intelligence & Dispatch Focus'
                : period === 'monthly'
                ? 'Monthly Cashflow & Seasonality Intelligence'
                : 'Annual Enterprise Growth & Customer Lifetime Value (LTV)'}
            </span>
          </div>
          <p className="leading-relaxed">
            {period === 'weekly' && (
              <>
                Weekend service bookings and filter renewals are prioritized by area locality. Dispatching technicians to cluster areas prevents delays and accelerates completion.
              </>
            )}
            {period === 'monthly' && (
              <>
                Track scheduled maintenance and proactive WhatsApp renewal reminders to ensure steady monthly revenue and customer retention.
              </>
            )}
            {period === 'yearly' && (
              <>
                Proactive service intervals and regular maintenance ensure high customer satisfaction and recurring AMC contract stability.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Revenue by Service Type Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          Revenue Distribution by Service & Spares Category (%)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Breakdown of earnings across filter consumables, routine visits, AMC agreements, and pump electronics.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {serviceTypeData.map((item) => (
            <div key={item.name} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{item.value}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.value}%`, backgroundColor: item.color }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technician Detailed Performance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Field Technician Attribution & Customer Ratings
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Technician</th>
                <th className="py-2.5 px-3">Primary Service Areas</th>
                <th className="py-2.5 px-3">Completed Jobs</th>
                <th className="py-2.5 px-3">Revenue Attributed</th>
                <th className="py-2.5 px-3">Customer Rating</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {technicians.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    No technicians added yet.
                  </td>
                </tr>
              ) : (
                technicians.map((t) => (
                <tr key={t.id}>
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-[10px] text-slate-400">+91 {t.phone}</p>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {t.serviceAreas.join(', ')}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {t.completedJobs}
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-600">
                    {formatIndianCurrency(t.revenueGenerated)}
                  </td>
                  <td className="py-3 px-3 font-bold text-amber-500">
                    {t.rating} ★
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
