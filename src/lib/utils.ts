import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatAmountInWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen ',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n === 0) return '';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  }

  const integerPart = Math.floor(Math.abs(num));
  const words = inWords(integerPart).trim();
  return words ? `${words} Rupees Only` : 'Zero Rupees Only';
}

/**
 * Formats any date string ('YYYY-MM-DD', ISO string, Date object) into standard 'DD/MM/YYYY'.
 * Universal Indian date format.
 */
export function formatDateDDMMYYYY(
  dateInput: string | Date | null | undefined,
  fallback: string = '—'
): string {
  if (!dateInput) return fallback;
  try {
    if (typeof dateInput === 'string') {
      const trimmed = dateInput.trim();
      if (!trimmed || trimmed === 'N/A' || trimmed === '—') return fallback;

      // If already DD/MM/YYYY or DD-MM-YYYY
      const dmy = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
      if (dmy) {
        const d = dmy[1].padStart(2, '0');
        const m = dmy[2].padStart(2, '0');
        const y = dmy[3];
        return `${d}/${m}/${y}`;
      }

      // If YYYY-MM-DD or YYYY/MM/DD
      const ymd = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
      if (ymd) {
        const y = ymd[1];
        const m = ymd[2].padStart(2, '0');
        const d = ymd[3].padStart(2, '0');
        return `${d}/${m}/${y}`;
      }
    }

    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return fallback || String(dateInput);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return fallback || (typeof dateInput === 'string' ? dateInput : '');
  }
}

/** Alias for formatDateDDMMYYYY */
export const formatDisplayDate = formatDateDDMMYYYY;

/**
 * Formats any timestamp or date into 'DD/MM/YYYY, hh:mm A'
 */
export function formatDateTimeDDMMYYYY(
  dateInput: string | Date | null | undefined,
  fallback: string = '—'
): string {
  if (!dateInput) return fallback;
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return formatDateDDMMYYYY(dateInput, fallback);
    const dateStr = formatDateDDMMYYYY(d, fallback);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // '0' should be '12'
    return `${dateStr}, ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  } catch {
    return fallback;
  }
}

/**
 * Generates a serial number for every invoice generated using the requested (YYMM + Sequence) series.
 * Format: YYMMXXXX (e.g. 26110001, 26110002 for November 2026).
 * - YY: 2-digit year (e.g. '26' for 2026)
 * - MM: 2-digit month (e.g. '11' for November)
 * - Sequence: 4-digit sequential counter starting from 0001 (or higher if existing invoices exist).
 *
 * When dummy data is removed (or in a fresh database with 0 invoices for the month),
 * it starts cleanly at 26110001.
 */
export function generateInvoiceSerialNumber(
  existingInvoices: { invoiceNumber?: string }[] = [],
  dateInput?: string | Date | null,
  customPrefix?: string
): string {
  let d: Date;
  if (!dateInput) {
    d = new Date();
  } else if (typeof dateInput === 'string') {
    d = new Date(dateInput);
    if (isNaN(d.getTime())) d = new Date();
  } else {
    d = dateInput;
  }

  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const seriesKey = `${yy}${mm}`;

  // If a custom prefix is explicitly specified in settings and is not a default demo prefix
  const cleanPrefix =
    customPrefix && !['DEMO-', 'AQ-RO-', 'RO-'].includes(customPrefix)
      ? customPrefix.trim()
      : '';

  // Scan existing invoices for this month's YYMM series to find highest sequence
  let maxSeq = 0;
  for (const inv of existingInvoices) {
    if (!inv || !inv.invoiceNumber) continue;
    // Match YYMM followed by digits: e.g. "26110001", "2611-0001", "INV-26110001"
    const regex = new RegExp(`(?:^|[^0-9])${seriesKey}[-]?(\\d+)`);
    const match = inv.invoiceNumber.match(regex);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const seqStr = String(nextSeq).padStart(4, '0');

  return cleanPrefix ? `${cleanPrefix}${seriesKey}${seqStr}` : `${seriesKey}${seqStr}`;
}

/**
 * Generates a Customer ID using the sequence+year+month format (e.g. 00012611, 00022611).
 * - sequence: 4-digit sequential counter starting from 0001
 * - year: 2-digit year (e.g. '26' for 2026)
 * - month: 2-digit month (e.g. '11' for November)
 *
 * When dummy data is removed or in a fresh database, the first customer is 00012611.
 */
export function generateCustomerCode(
  existingCustomers: { customerCode?: string }[] = [],
  dateInput?: string | Date | null
): string {
  let d: Date;
  if (!dateInput) {
    d = new Date();
  } else if (typeof dateInput === 'string') {
    d = new Date(dateInput);
    if (isNaN(d.getTime())) d = new Date();
  } else {
    d = dateInput;
  }

  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yearMonth = `${yy}${mm}`;

  // Find highest sequence number for this yearMonth suffix (e.g. ends with "2611")
  let maxSeq = 0;
  for (const c of existingCustomers) {
    if (!c || !c.customerCode) continue;
    // Match digits followed by YYMM: e.g. "00012611", "0001-2611", "CUST-00012611"
    const regex = new RegExp(`(?:^|[^0-9])(\\d{1,6})[-]?${yearMonth}(?:$|[^0-9])`);
    const match = c.customerCode.match(regex);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const seqStr = String(nextSeq).padStart(4, '0');
  return `${seqStr}${yearMonth}`;
}

/**
 * Returns owner-configured charge for a specific service type.
 * Never returns automatic hardcoded fees; returns 0 if not configured.
 */
export function getServiceCharge(serviceType?: string, settings?: any): number {
  if (!settings || !settings.serviceCharges) return 0;
  const sc = settings.serviceCharges;
  switch (serviceType) {
    case 'General service':
      return Number(sc.generalService) || 0;
    case 'Periodic service':
      return Number(sc.periodicService) || 0;
    case 'Installation':
      return Number(sc.installation) || 0;
    case 'Uninstallation':
      return Number(sc.uninstallation) || 0;
    case 'Filter replacement':
      return Number(sc.filterReplacement) || 0;
    case 'Membrane replacement':
      return Number(sc.membraneReplacement) || 0;
    case 'UV replacement':
      return Number(sc.uvReplacement) || 0;
    case 'Leakage repair':
    case 'Pump replacement':
    case 'SMPS replacement':
    case 'Tap replacement':
    case 'Pipe replacement':
      return Number(sc.leakageRepair) || 0;
    case 'TDS adjustment':
    case 'Water quality check':
    case 'Complete cleaning':
      return Number(sc.tdsAdjustment) || 0;
    case 'Emergency service':
      return Number(sc.emergencyService) || 0;
    default:
      return Number(sc.minimumVisitingFee) || 0;
  }
}
