import { Customer, Purifier, BusinessSettings } from '@/types';
import { calculateComponentNextDue, calculateUrgency, getDaysRemaining } from './dueCalculator';
import { normalizeIndianPhoneNumber } from './whatsappEngine';
import { addMonths, format } from 'date-fns';

export interface ImportRowValidation {
  rowIndex: number;
  raw: Record<string, string>;
  isValid: boolean;
  errors: string[];
  parsedCustomer?: Partial<Customer>;
  parsedPurifier?: Partial<Purifier>;
}

export interface ImportResult {
  totalRows: number;
  validCount: number;
  errorCount: number;
  rows: ImportRowValidation[];
}

export function parseCustomerCSV(
  csvText: string,
  businessId: string,
  settings: BusinessSettings
): ImportResult {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { totalRows: 0, validCount: 0, errorCount: 0, rows: [] };
  }

  // Parse header
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));

  const nameIdx = headers.findIndex((h) => h.includes('name'));
  const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('mobile'));
  const addressIdx = headers.findIndex((h) => h.includes('address') || h.includes('flat'));
  const areaIdx = headers.findIndex((h) => h.includes('area') || h.includes('locality'));
  const brandIdx = headers.findIndex((h) => h.includes('brand'));
  const modelIdx = headers.findIndex((h) => h.includes('model'));
  const installDateIdx = headers.findIndex((h) => h.includes('install'));
  const lastServiceIdx = headers.findIndex((h) => h.includes('last service') || h.includes('service date'));
  const notesIdx = headers.findIndex((h) => h.includes('note'));

  const rows: ImportRowValidation[] = [];
  let validCount = 0;
  let errorCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // basic CSV line parse handling quotes
    const cells = rawLine.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    const rawRecord: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rawRecord[h] = cells[idx] || '';
    });

    const errors: string[] = [];
    const name = cells[nameIdx] || '';
    const phone = cells[phoneIdx] || '';
    const address = cells[addressIdx] || '';
    const area = cells[areaIdx] || 'Local';
    const brand = cells[brandIdx] || 'RO Purifier';
    const model = cells[modelIdx] || 'Standard RO';
    const installDate = cells[installDateIdx] || format(new Date(), 'yyyy-MM-dd');
    const lastServiceDate = cells[lastServiceIdx] || installDate;
    const notes = cells[notesIdx] || '';

    if (!name) {
      errors.push('Customer Name is required');
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      errors.push(`Invalid Indian phone number: "${phone}"`);
    }

    const isValid = errors.length === 0;

    if (isValid) {
      validCount++;
      const normPhone = normalizeIndianPhoneNumber(cleanPhone);
      const customerId = `cust-${Date.now()}-${i}`;
      const purifierId = `pur-${Date.now()}-${i}`;

      // Calculate next due date automatically
      const nextDue = format(addMonths(new Date(lastServiceDate || installDate), settings.defaultServiceIntervalMonths || 3), 'yyyy-MM-dd');

      rows.push({
        rowIndex: i,
        raw: rawRecord,
        isValid: true,
        errors: [],
        parsedCustomer: {
          id: customerId,
          businessId,
          customerCode: `CUST-${1000 + i}`,
          fullName: name,
          mobileNumber: normPhone.slice(-10),
          whatsappNumber: normPhone,
          houseFlatNo: '',
          streetAddress: address,
          areaLocality: area,
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500084',
          customerType: 'Residential',
          status: 'Active customer',
          tags: ['Imported'],
          notes,
          whatsappOptOut: false,
          totalSpend: 0,
          pendingBalance: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        parsedPurifier: {
          id: purifierId,
          businessId,
          customerId,
          purifierCode: `PUR-${500 + i}`,
          brand,
          model,
          purifierType: 'RO+UV',
          capacityLph: 15,
          installationDate: installDate,
          installationLocation: 'Kitchen',
          currentCondition: 'Good',
          lastServiceDate,
          nextServiceDueDate: nextDue,
          components: [
            {
              id: `comp-${Date.now()}-1`,
              purifierId,
              componentType: 'Sediment filter',
              brand,
              installedDate: lastServiceDate,
              expectedLifeMonths: 3,
              nextReplacementDate: calculateComponentNextDue(lastServiceDate, 3),
              cost: 180,
              sellingPrice: 350,
              warrantyMonths: 0,
              status: 'OK',
            },
            {
              id: `comp-${Date.now()}-2`,
              purifierId,
              componentType: 'Pre-carbon filter',
              brand,
              installedDate: lastServiceDate,
              expectedLifeMonths: 6,
              nextReplacementDate: calculateComponentNextDue(lastServiceDate, 6),
              cost: 220,
              sellingPrice: 450,
              warrantyMonths: 0,
              status: 'OK',
            },
            {
              id: `comp-${Date.now()}-3`,
              purifierId,
              componentType: 'Membrane',
              brand: 'Filmtec / Vontron',
              installedDate: lastServiceDate,
              expectedLifeMonths: 18,
              nextReplacementDate: calculateComponentNextDue(lastServiceDate, 18),
              cost: 850,
              sellingPrice: 1800,
              warrantyMonths: 12,
              status: 'OK',
            },
          ],
        },
      });
    } else {
      errorCount++;
      rows.push({
        rowIndex: i,
        raw: rawRecord,
        isValid: false,
        errors,
      });
    }
  }

  return {
    totalRows: lines.length - 1,
    validCount,
    errorCount,
    rows,
  };
}
