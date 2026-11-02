import { Customer, Purifier, ServiceRecord, BusinessSettings, CustomerStatus, CustomerType, PurifierType } from '@/types';
import { calculateUrgency, getDaysRemaining } from './dueCalculator';
import { normalizeIndianPhoneNumber } from './whatsappEngine';
import { addMonths, addDays, format, isValid as isValidDate } from 'date-fns';
import * as XLSX from 'xlsx';

export interface ImportRowValidation {
  rowIndex: number;
  raw: Record<string, any>;
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  parsedCustomer?: Customer;
  parsedPurifier?: Purifier;
  parsedService?: ServiceRecord;
}

export interface ImportResult {
  fileName?: string;
  totalRows: number;
  validCount: number;
  errorCount: number;
  rows: ImportRowValidation[];
}

/**
 * Standard Indian phone cleaner:
 * Extracts 10-digit mobile number, stripping +91, country code, spaces, hyphens, etc.
 */
export function cleanIndianMobileNumber(val: any): string {
  if (!val) return '';
  const str = String(val).replace(/\D/g, '');
  if (str.length === 10) return str;
  if (str.length === 12 && str.startsWith('91')) return str.slice(2);
  if (str.length === 11 && str.startsWith('0')) return str.slice(1);
  if (str.length > 10) return str.slice(-10);
  return str;
}

/**
 * Flexible Service Charge parser:
 * - If string is 'free', 'nil', 'none', 'zero', 'na', etc. -> returns 0
 * - If numeric or string with digits -> returns parsed float (e.g. 300, 900, 1000)
 * - Defaults to 0 if absent
 */
export function parseServiceCharge(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.max(0, val);
  const str = String(val).trim().toLowerCase();
  if (['free', 'nil', 'none', 'zero', 'n/a', 'na', '-', 'no charge', 'complimentary', '0'].includes(str)) {
    return 0;
  }
  const cleaned = str.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.max(0, num);
}

/**
 * Tolerant date parser supporting:
 * - Excel Serial Numbers (e.g. 45231, 46073)
 * - DD-MM-YYYY, DD/MM/YYYY
 * - M/D/YY, M/D/YYYY, D/M/YY
 * - YYYY-MM-DD, YYYY/MM/DD
 * - Native Date objects (using local year/month/date)
 */
export function parseDateFlexible(val: any): string | null {
  if (!val) return null;
  if (val instanceof Date && isValidDate(val)) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Handle Excel Serial Number (e.g. 45231, 46073)
  if (typeof val === 'number' || (!isNaN(Number(val)) && !String(val).includes('-') && !String(val).includes('/'))) {
    const serial = Number(val);
    if (serial > 20000 && serial < 65000) {
      // Excel epoch date conversion (25569 = days between 1900-01-01 and 1970-01-01)
      const utcDays = Math.floor(serial - 25569);
      const utcValue = utcDays * 86400;
      const dateInfo = new Date(utcValue * 1000);
      if (isValidDate(dateInfo)) {
        return format(dateInfo, 'yyyy-MM-dd');
      }
    }
  }

  const str = String(val).trim();
  if (!str) return null;

  // DD-MM-YYYY, DD/MM/YYYY, M/D/YY, or M/D/YYYY
  const slashMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (slashMatch) {
    const p1 = parseInt(slashMatch[1], 10);
    const p2 = parseInt(slashMatch[2], 10);
    let year = parseInt(slashMatch[3], 10);
    if (year < 100) year += 2000;

    if (p1 > 12) {
      // p1 is day, p2 is month (e.g. 20/02/2026)
      const day = p1;
      const month = p2 - 1;
      const d = new Date(year, month, day);
      if (isValidDate(d)) return format(d, 'yyyy-MM-dd');
    } else if (p2 > 12) {
      // p2 is day, p1 is month (e.g. 2/20/26)
      const month = p1 - 1;
      const day = p2;
      const d = new Date(year, month, day);
      if (isValidDate(d)) return format(d, 'yyyy-MM-dd');
    } else {
      // Both <= 12, default to day/month/year (Indian standard)
      const day = p1;
      const month = p2 - 1;
      const d = new Date(year, month, day);
      if (isValidDate(d)) return format(d, 'yyyy-MM-dd');
    }
  }

  // YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month, day);
    if (isValidDate(d)) return format(d, 'yyyy-MM-dd');
  }

  // Standard JS Date parse fallback
  const parsed = new Date(str);
  if (isValidDate(parsed)) {
    return format(parsed, 'yyyy-MM-dd');
  }

  return null;
}

/**
 * Flexible / Fuzzy column finder:
 * Matches column headers regardless of casing, spaces, underscores, or common synonyms.
 */
function findRowValue(row: Record<string, any>, patterns: string[]): any {
  const keys = Object.keys(row);
  for (const pat of patterns) {
    const cleanPat = pat.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matchedKey = keys.find((k) => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanPat));
    if (matchedKey !== undefined && row[matchedKey] !== undefined && row[matchedKey] !== null) {
      const val = row[matchedKey];
      if (typeof val === 'string' && val.trim() !== '') return val.trim();
      if (typeof val === 'number') return val;
      if (val instanceof Date) return val;
    }
  }
  return '';
}

/**
 * Core processor for mapped records (used by both Excel and CSV parsers).
 */
export function processImportRecords(
  records: Record<string, any>[],
  businessId: string,
  settings?: BusinessSettings,
  fileName?: string
): ImportResult {
  const defaultInterval = settings?.defaultServiceIntervalMonths || 3;
  const rows: ImportRowValidation[] = [];
  let validCount = 0;
  let errorCount = 0;

  records.forEach((raw, idx) => {
    // 1. Fuzzy Column Extraction
    const name = findRowValue(raw, ['customername', 'fullname', 'clientname', 'customer', 'client', 'name', 'consumer']);
    const phoneRaw = findRowValue(raw, ['mobilenumber', 'phonenumber', 'whatsappnumber', 'whatsapp', 'mobile', 'phone', 'contact', 'cell', 'ph']);
    const address = findRowValue(raw, ['streetaddress', 'houseflatno', 'address', 'colony', 'flat', 'street', 'door', 'house']);
    const area = findRowValue(raw, ['arealocality', 'locality', 'area', 'location', 'sector', 'landmark', 'zone']);
    const city = findRowValue(raw, ['city', 'town', 'district']);
    const state = findRowValue(raw, ['state']);
    const pincode = findRowValue(raw, ['pincode', 'pin', 'postalcode', 'zip']);
    const brandRaw = findRowValue(raw, ['purifierbrand', 'robrand', 'brand', 'company', 'make', 'machinebrand']);
    const componentsRaw = findRowValue(raw, ['components', 'component', 'parts', 'filters', 'filter', 'items', 'workdone', 'description', 'servicecomponents']);
    const model = findRowValue(raw, ['purifiermodel', 'modelname', 'romodel', 'model', 'modelno']);
    const serialNumber = findRowValue(raw, ['serialnumber', 'serialno', 'slno', 'serial']);
    const purifierTypeRaw = findRowValue(raw, ['purifiertype', 'technology', 'tech', 'rotype', 'type']);
    const lastServiceRaw = findRowValue(raw, ['lastservicedate', 'servicedate', 'lastservice', 'previousservice', 'lastserviced', 'serviced']);
    const dueServiceRaw = findRowValue(raw, ['nextserviceduedate', 'nextduedate', 'servicedue', 'duedate', 'nextdue']);
    const installDateRaw = findRowValue(raw, ['installationdate', 'installedon', 'installdate', 'purchasedon', 'purchasedate', 'buydate', 'dop']);
    const serviceChargeRaw = findRowValue(raw, ['servicecharge', 'servicecharges', 'servicecost', 'serviceamount', 'servicefee', 'serviceprice', 'labourcharge', 'charge', 'charges', 'amount', 'cost', 'fee', 'price']);
    const inletTdsRaw = findRowValue(raw, ['inlettds', 'rawwatertds', 'inputtds']);
    const outputTdsRaw = findRowValue(raw, ['outputtds', 'puretds', 'rotds', 'filteredtds']);
    const notesRaw = findRowValue(raw, ['notes', 'remarks', 'comment', 'instruction']);

    // Intelligent brand detection from components text if dedicated brand column is omitted
    let detectedBrand = brandRaw;
    if (!detectedBrand && componentsRaw) {
      const lower = componentsRaw.toLowerCase();
      if (lower.includes('havells')) detectedBrand = 'Havells';
      else if (lower.includes('livpure') || lower.includes('liv pure')) detectedBrand = 'Livpure';
      else if (lower.includes('delite')) detectedBrand = 'Delite';
      else if (lower.includes('kent')) detectedBrand = 'Kent';
      else if (lower.includes('aquaguard')) detectedBrand = 'Aquaguard';
      else if (lower.includes('pureit')) detectedBrand = 'Pureit';
      else if (lower.includes('ao smith')) detectedBrand = 'AO Smith';
      else if (lower.includes('blue star')) detectedBrand = 'Blue Star';
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // 2. Validate Essential Fields
    const cleanPhone = cleanIndianMobileNumber(phoneRaw);
    if (!name && !cleanPhone) {
      // Completely empty row, skip without failing the whole process
      return;
    }

    if (!name) {
      errors.push('Missing Customer Name');
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      errors.push(`Invalid phone number ("${phoneRaw || 'blank'}") - 10 digits required`);
    }

    const isValid = errors.length === 0;

    if (!isValid) {
      errorCount++;
      rows.push({
        rowIndex: idx + 1,
        raw,
        isValid: false,
        errors,
        warnings,
      });
      return;
    }

    validCount++;

    // 3. Graceful Fallbacks & Date Calculations
    const normPhone = normalizeIndianPhoneNumber(cleanPhone);
    const customerId = `cust-imp-${Date.now()}-${idx}`;
    const purifierId = `pur-imp-${Date.now()}-${idx}`;

    const effectiveAddress = address || area || '';
    const effectiveArea = area || address || '';
    const effectiveBrand = detectedBrand || 'RO Purifier';
    const effectiveModel = model || '';
    const effectiveType: PurifierType = (purifierTypeRaw as PurifierType) || 'RO+UV';
    const effectiveNotes = notesRaw || (componentsRaw ? `Service/Components: ${componentsRaw}` : undefined);

    // Parse Dates strictly separated
    const parsedLastService = parseDateFlexible(lastServiceRaw);
    const parsedDueDate = parseDateFlexible(dueServiceRaw);
    const parsedInstallDate = parseDateFlexible(installDateRaw);

    // Strictly separate installationDate from lastServiceDate:
    // If installation date is NOT in Excel, leave undefined / empty (do NOT duplicate lastServiceDate)
    const installationDate = parsedInstallDate || undefined;
    const lastServiceDate = parsedLastService || undefined;

    // Next due date resolution:
    // a. If explicit due date given, use it.
    // b. Else if last service date given, add default interval (e.g. 3 months).
    // c. Else default to 30 days from today.
    let nextDueDate: string;
    if (parsedDueDate) {
      nextDueDate = parsedDueDate;
    } else if (lastServiceDate) {
      nextDueDate = format(addMonths(new Date(lastServiceDate), defaultInterval), 'yyyy-MM-dd');
    } else {
      nextDueDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
      warnings.push('Due date defaulted to 30 days (no prior service date)');
    }

    // Determine status based on days remaining
    const daysRemaining = getDaysRemaining(nextDueDate);
    let customerStatus: CustomerStatus = 'Active customer';
    if (daysRemaining <= 0) {
      customerStatus = 'Overdue';
    } else if (daysRemaining <= 15) {
      customerStatus = 'Service due';
    }

    // Baseline TDS (only if provided in Excel)
    const inletTds = inletTdsRaw && !isNaN(Number(inletTdsRaw)) ? Number(inletTdsRaw) : undefined;
    const outputTds = outputTdsRaw && !isNaN(Number(outputTdsRaw)) ? Number(outputTdsRaw) : undefined;

    // Parse Service Charge (if 'free' or not provided -> 0)
    const serviceCharge = parseServiceCharge(serviceChargeRaw);

    // 4. Construct Customer Record
    const parsedCustomer: Customer = {
      id: customerId,
      businessId,
      customerCode: `CUST-${1000 + idx + 1}`,
      fullName: name,
      mobileNumber: cleanPhone,
      whatsappNumber: normPhone,
      houseFlatNo: '',
      streetAddress: effectiveAddress,
      areaLocality: effectiveArea,
      city: city || 'Karimnagar',
      state: state || 'Telangana',
      pincode: pincode || '',
      customerType: 'Residential',
      status: customerStatus,
      tags: ['Excel Imported'],
      notes: effectiveNotes,
      whatsappOptOut: false,
      languagePreference: 'te',
      totalSpend: serviceCharge,
      pendingBalance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 5. Construct Purifier Record (Strictly Excel fields, empty components, no phantom charges)
    const parsedPurifier: Purifier = {
      id: purifierId,
      businessId,
      customerId,
      purifierCode: `PUR-${500 + idx + 1}`,
      brand: effectiveBrand,
      model: effectiveModel,
      purifierType: effectiveType,
      capacityLph: 15,
      serialNumber: serialNumber || undefined,
      installationDate,
      installationLocation: 'Kitchen',
      currentCondition: daysRemaining <= 0 ? 'Needs service' : 'Good',
      inletTdsBaseline: inletTds,
      outputTdsBaseline: outputTds,
      lastServiceDate,
      nextServiceDueDate: nextDueDate,
      components: [], // Strictly empty: no phantom consumables or arbitrary charges
    };

    // 6. Construct Completed Service Record if service date provided in Excel
    let parsedService: ServiceRecord | undefined = undefined;
    if (lastServiceDate) {
      const serviceSummary = componentsRaw
        ? `${componentsRaw} (${serviceCharge === 0 ? 'Free service' : `Service charge ₹${serviceCharge}`})`
        : serviceCharge === 0
          ? 'General service completed (Free of charge)'
          : `General service completed (Service charge ₹${serviceCharge})`;

      parsedService = {
        id: `srv-imp-${Date.now()}-${idx}`,
        businessId,
        serviceCode: `SRV-${(effectiveBrand || 'RO').slice(0, 3).toUpperCase()}-${100 + idx + 1}`,
        customerId,
        purifierId,
        serviceType: 'General service',
        bookingDate: lastServiceDate,
        scheduledDate: lastServiceDate,
        scheduledTimeSlot: '10:00 AM - 12:00 PM',
        startedTime: `${lastServiceDate} 10:00`,
        completedTime: `${lastServiceDate} 11:00`,
        status: 'Completed',
        issueDescription: componentsRaw ? `Service/Work Done: ${componentsRaw}` : 'Routine water purifier maintenance service',
        workSummary: serviceSummary,
        inletWaterTds: inletTds,
        outputWaterTds: outputTds,
        partsUsed: [], // Strictly empty: NO consumables or filter parts
        labourCharge: serviceCharge,
        partsCharge: 0,
        discount: 0,
        tax: 0,
        total: serviceCharge,
        amountPaid: serviceCharge,
        amountPending: 0,
        paymentStatus: 'Paid',
        paymentMethod: 'Cash',
        beforePhotos: [],
        afterPhotos: [],
        createdAt: `${lastServiceDate}T11:00:00.000Z`,
        updatedAt: `${lastServiceDate}T11:00:00.000Z`,
      };
    }

    rows.push({
      rowIndex: idx + 1,
      raw,
      isValid: true,
      errors: [],
      warnings: warnings.length > 0 ? warnings : undefined,
      parsedCustomer,
      parsedPurifier,
      parsedService,
    });
  });

  return {
    fileName,
    totalRows: rows.length,
    validCount,
    errorCount,
    rows,
  };
}

/**
 * Parses an Excel (.xlsx, .xls) or CSV File using SheetJS.
 */
export async function parseExcelOrCsvFile(
  file: File,
  businessId: string,
  settings?: BusinessSettings
): Promise<ImportResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { fileName: file.name, totalRows: 0, validCount: 0, errorCount: 0, rows: [] };
  }

  const worksheet = workbook.Sheets[sheetName];
  const records = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '', raw: false });

  return processImportRecords(records, businessId, settings, file.name);
}

/**
 * Parses raw CSV text string.
 */
export function parseCustomerCSV(
  csvText: string,
  businessId: string,
  settings?: BusinessSettings
): ImportResult {
  const workbook = XLSX.read(csvText, { type: 'string' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { fileName: 'pasted-text.csv', totalRows: 0, validCount: 0, errorCount: 0, rows: [] };
  }

  const worksheet = workbook.Sheets[sheetName];
  const records = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '', raw: false });

  return processImportRecords(records, businessId, settings, 'pasted-text.csv');
}

/**
 * Sample dataset for preview and template generation.
 */
export const SAMPLE_INDIAN_CUSTOMERS = [
  {
    'Customer Name': 'Ramesh Varma',
    'Phone Number': '9876512345',
    'Address / Flat': 'Plot 12, Cyber Valley',
    'Locality': 'Madhapur',
    'Purifier Brand': 'Kent',
    'Model': 'Grand Plus',
    'Last Service Date': '20/06/2024',
    'Service Charge': '350',
    'Notes': 'Prefers morning technician visit',
  },
  {
    'Customer Name': 'Swapna Reddy',
    'Phone Number': '9876523456',
    'Address / Flat': 'Flat 301, Aparna Sarovar',
    'Locality': 'Nallagandla',
    'Purifier Brand': 'Aquaguard',
    'Model': 'Geneus Active',
    'Last Service Date': '15/05/2024',
    'Service Charge': 'Free',
    'Notes': 'Borewell water TDS 950',
  },
  {
    'Customer Name': 'Karthik Rao',
    'Phone Number': '9876534567',
    'Address / Flat': 'House 4-5-88, Main Rd',
    'Locality': 'Kukatpally',
    'Purifier Brand': 'Pureit',
    'Model': 'Copper RO',
    'Last Service Date': '10/04/2024',
    'Service Charge': '450',
    'Notes': 'Interested in 1-Year AMC Plan',
  },
  {
    'Customer Name': 'Goutham Reddy',
    'Phone Number': '9876545678',
    'Address / Flat': 'Villa 9, Palm Meadows',
    'Locality': 'Gachibowli',
    'Purifier Brand': 'Livpure',
    'Model': 'Glo Pro',
    'Last Service Date': '01/07/2024',
    'Service Charge': 'Free',
    'Notes': 'Wants alkaline cartridge checkup',
  },
  {
    'Customer Name': 'Srinivas Murthy',
    'Phone Number': '9849098765',
    'Address / Flat': 'Flat 402, Rainbow Vistas',
    'Locality': 'HITEC City',
    'Purifier Brand': 'Custom Assembly',
    'Model': 'Copper Alkaline RO',
    'Last Service Date': '10/06/2024',
    'Service Charge': '500',
    'Notes': 'Quarterly filter replacement cycle',
  },
];

/**
 * Generates and downloads a sample Excel (.xlsx) template.
 */
export function downloadSampleExcelTemplate(): void {
  const ws = XLSX.utils.json_to_sheet(SAMPLE_INDIAN_CUSTOMERS);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers');
  XLSX.writeFile(wb, 'Sample_RO_Customers_Template.xlsx');
}

/**
 * Generates and downloads a sample CSV template.
 */
export function downloadSampleCsvTemplate(): void {
  const ws = XLSX.utils.json_to_sheet(SAMPLE_INDIAN_CUSTOMERS);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Sample_RO_Customers_Template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
