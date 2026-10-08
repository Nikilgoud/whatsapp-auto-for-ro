import { Renewal, Customer, Invoice, AMCSubscription, BusinessSettings } from '@/types';
import { getDaysRemaining } from './dueCalculator';

export interface RevenueOpportunityBreakdown {
  totalPotentialRevenue: number;
  filterReplacementsOpportunity: number;
  filterReplacementsCount: number;
  amcRenewalsOpportunity: number;
  amcRenewalsCount: number;
  overdueCustomersOpportunity: number;
  overdueCustomersCount: number;
  pendingPaymentsAmount: number;
  pendingInvoicesCount: number;
  forecast30DaysAmount: number;
  forecast30DaysCount: number;
  forecast60DaysAmount: number;
  forecast60DaysCount: number;
}

export function calculateRevenueOpportunities(
  renewals: Renewal[],
  customers: Customer[],
  invoices: Invoice[],
  amcSubscriptions: AMCSubscription[],
  settings: BusinessSettings
): RevenueOpportunityBreakdown {
  const avgServiceCost = settings.serviceCharges?.generalService ?? settings.averageServiceCost ?? 0;
  const avgFilterCost = settings.serviceCharges?.filterReplacement ?? settings.averageFilterCost ?? 0;
  const avgAmcCost = settings.averageAmcCost ?? 0;

  // 1. Filter replacements due or overdue
  const filterRenewals = renewals.filter(
    (r) => r.renewalType === 'FILTER_REPLACEMENT' && r.daysRemaining <= 30 && r.status === 'PENDING'
  );
  const filterReplacementsCount = filterRenewals.length;
  const filterReplacementsOpportunity = filterRenewals.reduce(
    (sum, r) => sum + (r.estimatedValue || avgFilterCost),
    0
  );

  // 2. AMC Renewals expiring soon or expired within 60 days
  const expiringAmcs = amcSubscriptions.filter((sub) => {
    const days = getDaysRemaining(sub.endDate);
    return days <= 30 && days >= -60 && sub.status !== 'Renewed' && sub.status !== 'Cancelled';
  });
  const amcRenewalsCount = expiringAmcs.length;
  const amcRenewalsOpportunity = expiringAmcs.reduce(
    (sum, sub) => sum + (sub.price || avgAmcCost),
    0
  );

  // 3. Overdue customers (services where daysRemaining <= 0 and status is pending)
  const overdueRenewals = renewals.filter(
    (r) => r.daysRemaining <= 0 && r.status === 'PENDING' && r.renewalType !== 'FILTER_REPLACEMENT'
  );
  const overdueCustomersCount = overdueRenewals.length;
  const overdueCustomersOpportunity = overdueRenewals.reduce(
    (sum, r) => sum + (r.estimatedValue || avgServiceCost),
    0
  );

  // 4. Pending invoices
  const pendingInvoices = invoices.filter(
    (inv) => inv.paymentStatus === 'Pending' || inv.paymentStatus === 'Partially paid'
  );
  const pendingInvoicesCount = pendingInvoices.length;
  const pendingPaymentsAmount = pendingInvoices.reduce(
    (sum, inv) => sum + (inv.balanceDue || inv.total - inv.amountPaid),
    0
  );

  // Forecast 30 days & 60 days
  const next30Days = renewals.filter((r) => r.daysRemaining >= 0 && r.daysRemaining <= 30);
  const forecast30DaysCount = next30Days.length;
  const forecast30DaysAmount = next30Days.reduce((sum, r) => sum + (r.estimatedValue || avgServiceCost), 0);

  const next60Days = renewals.filter((r) => r.daysRemaining >= 0 && r.daysRemaining <= 60);
  const forecast60DaysCount = next60Days.length;
  const forecast60DaysAmount = next60Days.reduce((sum, r) => sum + (r.estimatedValue || avgServiceCost), 0);

  const totalPotentialRevenue =
    filterReplacementsOpportunity +
    amcRenewalsOpportunity +
    overdueCustomersOpportunity +
    pendingPaymentsAmount;

  return {
    totalPotentialRevenue,
    filterReplacementsOpportunity,
    filterReplacementsCount,
    amcRenewalsOpportunity,
    amcRenewalsCount,
    overdueCustomersOpportunity,
    overdueCustomersCount,
    pendingPaymentsAmount,
    pendingInvoicesCount,
    forecast30DaysAmount,
    forecast30DaysCount,
    forecast60DaysAmount,
    forecast60DaysCount,
  };
}
