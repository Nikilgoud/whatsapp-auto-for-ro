import { addMonths, differenceInDays, format, parseISO, isBefore, isAfter } from 'date-fns';
import { Purifier, PurifierComponent, BusinessSettings, UrgencyLevel, Renewal, ServiceRecord, Customer } from '@/types';

export function calculateComponentNextDue(installedDateStr: string, lifeMonths: number): string {
  try {
    const installedDate = parseISO(installedDateStr);
    const dueDate = addMonths(installedDate, lifeMonths);
    return format(dueDate, 'yyyy-MM-dd');
  } catch {
    const now = new Date();
    return format(addMonths(now, lifeMonths), 'yyyy-MM-dd');
  }
}

export function getDaysRemaining(dueDateStr: string): number {
  try {
    const dueDate = parseISO(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return differenceInDays(dueDate, today);
  } catch {
    return 0;
  }
}

export function calculateUrgency(daysRemaining: number): UrgencyLevel {
  if (daysRemaining <= 0) return 'RED';
  if (daysRemaining <= 14) return 'ORANGE';
  if (daysRemaining <= 30) return 'YELLOW';
  return 'GREEN';
}

export function getUrgencyBadgeConfig(urgency: UrgencyLevel) {
  switch (urgency) {
    case 'RED':
      return {
        label: 'Overdue / Due Today',
        bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900',
        dot: 'bg-rose-500 animate-pulse',
      };
    case 'ORANGE':
      return {
        label: 'Due in < 14 Days',
        bg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',
        dot: 'bg-amber-500',
      };
    case 'YELLOW':
      return {
        label: 'Upcoming (15-30 Days)',
        bg: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-900',
        dot: 'bg-yellow-500',
      };
    case 'GREEN':
      return {
        label: 'Healthy (> 30 Days)',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
        dot: 'bg-emerald-500',
      };
  }
}

/**
 * Calculates the next overall service due date for a purifier based on last service,
 * installation, or component lifespans.
 */
export function calculateNextPurifierServiceDue(
  purifier: Purifier,
  settings: BusinessSettings,
  lastServiceDateStr?: string
): string {
  const baseDateStr = lastServiceDateStr || purifier.lastServiceDate || purifier.installationDate;
  const baseDate = parseISO(baseDateStr);
  
  // Default general interval
  const generalDue = addMonths(baseDate, settings.defaultServiceIntervalMonths || 3);

  // Check if any critical component (Sediment or Carbon) expires earlier
  let earliestDate = generalDue;
  if (purifier.components && purifier.components.length > 0) {
    for (const comp of purifier.components) {
      if (comp.nextReplacementDate) {
        const compDue = parseISO(comp.nextReplacementDate);
        if (isBefore(compDue, earliestDate)) {
          earliestDate = compDue;
        }
      }
    }
  }

  return format(earliestDate, 'yyyy-MM-dd');
}

/**
 * Generates or updates a Renewal record following a completed service or installation
 */
export function createRenewalFromService(
  customer: Customer,
  purifier: Purifier,
  service: ServiceRecord,
  settings: BusinessSettings
): Renewal {
  const nextDueDate = calculateNextPurifierServiceDue(purifier, settings, service.completedTime ? format(parseISO(service.completedTime), 'yyyy-MM-dd') : undefined);
  const daysRemaining = getDaysRemaining(nextDueDate);
  const urgency = calculateUrgency(daysRemaining);

  return {
    id: `rnw-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    businessId: customer.businessId,
    customerId: customer.id,
    purifierId: purifier.id,
    renewalType: 'REGULAR_SERVICE',
    lastServiceDate: service.completedTime ? format(parseISO(service.completedTime), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    nextDueDate,
    urgency,
    daysRemaining,
    serviceType: 'General service',
    estimatedValue: settings.averageServiceCost || 650,
    followUpStage: 'Not due',
    status: 'PENDING',
    remindersSentCount: 0,
    notes: `Automatically scheduled after service ${service.serviceCode}`,
  };
}
