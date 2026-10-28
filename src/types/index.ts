export type UserRole = 'OWNER' | 'MANAGER';

export interface User {
  id: string;
  businessId: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface ServiceChargesConfig {
  generalService: number;
  periodicService: number;
  installation: number;
  uninstallation: number;
  filterReplacement: number;
  membraneReplacement: number;
  uvReplacement: number;
  leakageRepair: number;
  tdsAdjustment: number;
  emergencyService: number;
  minimumVisitingFee: number;
}

export interface BusinessSettings {
  defaultServiceIntervalMonths: number;
  sedimentFilterIntervalMonths: number;
  carbonFilterIntervalMonths: number;
  membraneIntervalMonths: number;
  uvLampIntervalMonths: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  quietHoursEnabled: boolean;
  currency: string;
  gstin?: string;
  enableGst: boolean;
  invoicePrefix: string;
  averageServiceCost: number;
  averageFilterCost: number;
  averageAmcCost: number;
  serviceCharges?: ServiceChargesConfig;
}

export interface Business {
  id: string;
  name: string;
  ownerName?: string;
  tagline: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  logoUrl?: string;
  settings: BusinessSettings;
}

export type CustomerType =
  | 'Residential'
  | 'Commercial'
  | 'Office'
  | 'Restaurant'
  | 'School'
  | 'Hospital'
  | 'Apartment'
  | 'Other';

export type CustomerStatus =
  | 'Lead'
  | 'Active customer'
  | 'Service due'
  | 'Overdue'
  | 'AMC active'
  | 'AMC expiring'
  | 'Inactive'
  | 'Lost customer';

export interface Customer {
  id: string;
  businessId: string;
  customerCode: string;
  fullName: string;
  mobileNumber: string;
  alternateMobile?: string;
  whatsappNumber: string;
  email?: string;
  houseFlatNo: string;
  buildingName?: string;
  streetAddress: string;
  areaLocality: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  googleMapsUrl?: string;
  customerType: CustomerType;
  status: CustomerStatus;
  tags: string[];
  notes?: string;
  whatsappOptOut: boolean;
  totalSpend: number;
  pendingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export type PurifierType =
  | 'RO'
  | 'UV'
  | 'UF'
  | 'RO+UV'
  | 'RO+UV+UF'
  | 'RO+Alkaline'
  | 'Commercial RO';

export type ComponentType =
  | 'Sediment filter'
  | 'Pre-carbon filter'
  | 'Post-carbon filter'
  | 'Membrane'
  | 'UV lamp'
  | 'UF filter'
  | 'Alkaline filter'
  | 'Mineral cartridge'
  | 'Booster Pump'
  | 'SMPS Adapter'
  | 'Other filter';

export interface PurifierComponent {
  id: string;
  purifierId: string;
  componentType: ComponentType;
  brand: string;
  model?: string;
  installedDate: string;
  expectedLifeMonths: number;
  nextReplacementDate: string;
  cost: number;
  sellingPrice: number;
  warrantyMonths: number;
  status: 'OK' | 'DUE_SOON' | 'OVERDUE' | 'REPLACED';
}

export interface Purifier {
  id: string;
  businessId: string;
  customerId: string;
  purifierCode: string;
  brand: string;
  model: string;
  purifierType: PurifierType;
  capacityLph: number;
  serialNumber?: string;
  installationDate: string;
  purchaseDate?: string;
  warrantyStart?: string;
  warrantyExpiry?: string;
  sparePartsWarrantyExpiry?: string;
  sparePartsWarrantyNotes?: string;
  installationLocation: string;
  currentCondition: 'Excellent' | 'Good' | 'Needs service' | 'Critical';
  inletTdsBaseline?: number;
  outputTdsBaseline?: number;
  lastServiceDate?: string;
  nextServiceDueDate: string;
  components: PurifierComponent[];
}

export type ServiceType =
  | 'Installation'
  | 'General service'
  | 'Periodic service'
  | 'Filter replacement'
  | 'Membrane replacement'
  | 'UV replacement'
  | 'Leakage repair'
  | 'Pump replacement'
  | 'SMPS replacement'
  | 'Tap replacement'
  | 'Pipe replacement'
  | 'Complete cleaning'
  | 'TDS adjustment'
  | 'Water quality check'
  | 'AMC service'
  | 'Emergency service'
  | 'Other';

export type ServiceStatus =
  | 'Requested'
  | 'Confirmed'
  | 'Assigned'
  | 'Technician on way'
  | 'Started'
  | 'Completed'
  | 'Cancelled'
  | 'Rescheduled'
  | 'No-show';

export type PaymentStatus = 'Paid' | 'Partially paid' | 'Pending' | 'Failed' | 'Refunded';
export type PaymentMethod = 'Cash' | 'UPI' | 'Bank transfer' | 'Card' | 'Other';

export interface ServiceItem {
  id: string;
  inventoryItemId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ServiceChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  notes?: string;
}

export interface ServiceRecord {
  id: string;
  businessId: string;
  serviceCode: string;
  customerId: string;
  purifierId: string;
  technicianId?: string;
  serviceType: ServiceType;
  bookingDate: string;
  scheduledDate: string;
  scheduledTimeSlot: string;
  startedTime?: string;
  completedTime?: string;
  status: ServiceStatus;
  issueDescription?: string;
  technicianNotes?: string;
  workSummary?: string;
  inletWaterTds?: number;
  outputWaterTds?: number;
  checklists?: ServiceChecklistItem[];
  partsUsed: ServiceItem[];
  labourCharge: number;
  partsCharge: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountPending: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  customerRating?: number;
  customerSignature?: string;
  beforePhotos: string[];
  afterPhotos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Technician {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  whatsappNumber: string;
  email?: string;
  serviceAreas: string[];
  skills: string[];
  status: 'Available' | 'On job' | 'Busy' | 'On leave' | 'Inactive';
  joiningDate: string;
  completedJobs: number;
  pendingJobs: number;
  revenueGenerated: number;
  rating: number;
  currentLocation?: string;
}

export interface AMCPlan {
  id: string;
  businessId: string;
  name: string;
  description: string;
  durationMonths: number;
  annualVisits: number;
  isMembraneCovered: boolean;
  isFiltersCovered: boolean;
  isElectricalCovered: boolean;
  isLabourCovered: boolean;
  price: number;
}

export type AMCStatus =
  | 'Active'
  | 'Expiring soon'
  | 'Expired'
  | 'Renewal contacted'
  | 'Renewal interested'
  | 'Renewed'
  | 'Cancelled';

export interface AMCSubscription {
  id: string;
  businessId: string;
  subscriptionCode: string;
  customerId: string;
  purifierId: string;
  amcPlanId: string;
  startDate: string;
  endDate: string;
  renewalDate: string;
  visitsTotal: number;
  visitsCompleted: number;
  price: number;
  amountPaid: number;
  status: AMCStatus;
  notes?: string;
}

export type UrgencyLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export type RenewalStage =
  | 'Not due'
  | 'Upcoming'
  | 'Reminder sent'
  | 'Customer contacted'
  | 'Interested'
  | 'Appointment requested'
  | 'Appointment scheduled'
  | 'Technician assigned'
  | 'Service completed'
  | 'Payment pending'
  | 'Paid'
  | 'Follow-up required'
  | 'Customer declined'
  | 'No response'
  | 'Reschedule later';

export interface Renewal {
  id: string;
  businessId: string;
  customerId: string;
  purifierId: string;
  amcSubscriptionId?: string;
  renewalType: 'REGULAR_SERVICE' | 'FILTER_REPLACEMENT' | 'MEMBRANE_REPLACEMENT' | 'AMC_RENEWAL';
  lastServiceDate?: string;
  nextDueDate: string;
  urgency: UrgencyLevel;
  daysRemaining: number;
  serviceType: ServiceType;
  estimatedValue: number;
  assignedTechnicianId?: string;
  followUpStage: RenewalStage;
  status: 'PENDING' | 'SCHEDULED' | 'CONVERTED' | 'LOST' | 'SNOOZED';
  remindersSentCount: number;
  lastReminderDate?: string;
  notes?: string;
}

export type LanguageCode = 'en' | 'te' | 'hi' | 'hinglish';

export interface MessageTemplate {
  id: string;
  businessId: string;
  key: string;
  name: string;
  triggerEvent: string;
  languages: Record<LanguageCode, string>;
  variables: string[];
}

export interface CommunicationLog {
  id: string;
  businessId: string;
  customerId: string;
  channel: 'WhatsApp' | 'SMS' | 'Call' | 'Email';
  templateKey?: string;
  language: LanguageCode;
  messageText: string;
  status: 'Sent' | 'Delivered' | 'Read' | 'Failed' | 'Manual Logged';
  sentAt: string;
  responseReceived: boolean;
  responseText?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}


export interface InventoryItem {
  id: string;
  businessId: string;
  sku: string;
  productName: string;
  category: 'Filter' | 'Membrane' | 'Pump' | 'SMPS' | 'UV Lamp' | 'Fittings & Pipes' | 'Cartridges' | 'Other Spares';
  brand: string;
  supplier: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  reorderLevel: number;
  unit: string;
  isLowStock: boolean;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  businessId: string;
  invoiceNumber: string;
  customerId: string;
  serviceRecordId?: string;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  gstRate: number;
  gstAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  notes?: string;
}

export interface AutomationStep {
  id: string;
  stepNumber: number;
  trigger: 'SERVICE_COMPLETED' | 'DAYS_BEFORE_DUE' | 'DUE_TODAY' | 'OVERDUE_DAYS';
  triggerValue?: number;
  channel: 'WhatsApp' | 'SMS';
  templateKey: string;
  conditionCheck?: 'NOT_BOOKED' | 'NO_RESPONSE' | 'OVERDUE';
}

export interface AutomationSequence {
  id: string;
  businessId: string;
  name: string;
  description: string;
  isActive: boolean;
  steps: AutomationStep[];
}

export interface PurifierProduct {
  id: string;
  businessId: string;
  brand: string;
  model: string;
  purifierType: string;
  capacityLph: number;
  storageLiters: number;
  stagesCount: number;
  mrp: number;
  sellingPrice: number;
  warrantyMonths: number;
  features: string[];
  imageUrl?: string;
  brochureUrl?: string;
  inStock: boolean;
  createdAt: string;
}

export interface AutoReminderStage {
  daysBeforeOrAfter: number;
  label: string;
  templateKey: string;
  enabled: boolean;
}

export interface AutoReminderConfig {
  enabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  stages: AutoReminderStage[];
  lastAutoRun?: string;
  autoSentCount: number;
}

export interface BroadcastLog {
  id: string;
  messageText: string;
  targetAudience: string;
  recipientCount: number;
  status: 'Queued' | 'Sending' | 'Completed' | 'Failed';
  sentAt: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}


export interface ChatMessage {
  id: string;
  sender: 'bot' | 'customer' | 'system';
  text: string;
  timestamp: string;
  options?: { id: string; label: string; action: string }[];
  productCard?: PurifierProduct;
}

