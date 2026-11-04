import { z } from 'zod';

export const CustomerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().min(10, 'Valid phone number is required').max(15),
  alternatePhone: z.string().max(15).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().min(1, 'Address is required').max(500),
  area: z.string().min(1, 'Area is required').max(100),
  city: z.string().default('Hyderabad'),
  pincode: z.string().max(10).optional().nullable(),
  landmark: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  tags: z.array(z.string()).default([]),
  languagePreference: z.enum(['en', 'te', 'hi']).default('te'),
  optOutWhatsApp: z.boolean().default(false),
});

export const PurifierSchema = z.object({
  id: z.string().uuid().optional(),
  customerId: z.string().uuid(),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  serialNumber: z.string().optional().nullable(),
  installationDate: z.string(), // ISO date
  serviceCycleDays: z.number().int().min(30).max(365).default(90),
  lastServiceDate: z.string().optional().nullable(),
  nextServiceDueDate: z.string(),
  amcActive: z.boolean().default(false),
  amcExpiryDate: z.string().optional().nullable(),
  currentTdsInput: z.number().optional().nullable(),
  currentTdsOutput: z.number().optional().nullable(),
  locationInHome: z.string().optional().nullable(),
});

export const ServiceRecordSchema = z.object({
  id: z.string().uuid().optional(),
  customerId: z.string().uuid(),
  purifierId: z.string().uuid(),
  technicianId: z.string().uuid().optional().nullable(),
  serviceType: z.enum([
    'RO_SERVICE',
    'FILTER_CHANGE',
    'MEMBRANE_REPLACEMENT',
    'REPAIR',
    'INSTALLATION',
    'TDS_CHECK',
    'GENERAL_MAINTENANCE'
  ]),
  scheduledDate: z.string(),
  completedDate: z.string().optional().nullable(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']),
  partsReplaced: z.array(z.string()).default([]),
  cost: z.number().min(0).default(0),
  tdsReadingBefore: z.number().optional().nullable(),
  tdsReadingAfter: z.number().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  customerFeedback: z.string().max(500).optional().nullable(),
});

export const InvoiceSchema = z.object({
  id: z.string().uuid().optional(),
  customerId: z.string().uuid(),
  serviceId: z.string().uuid().optional().nullable(),
  invoiceNumber: z.string().min(1),
  issueDate: z.string(),
  dueDate: z.string(),
  lineItems: z.array(
    z.object({
      description: z.string().min(1),
      quantity: z.number().min(1),
      unitPrice: z.number().min(0),
      total: z.number().min(0),
    })
  ).min(1, 'At least one line item is required'),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  grandTotal: z.number().min(0),
  paidAmount: z.number().min(0).default(0),
  paymentStatus: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED']),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'NET_BANKING', 'CHEQUE']).optional().nullable(),
});

export const BroadcastCampaignSchema = z.object({
  campaignName: z.string().min(1).max(150),
  targetFilter: z.object({
    areas: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    amcStatus: z.enum(['ALL', 'ACTIVE_AMC', 'NO_AMC']).default('ALL'),
    languagePreference: z.enum(['ALL', 'te', 'en', 'hi']).default('ALL'),
    overdueDaysMin: z.number().optional(),
  }),
  messageTemplate: z.string().min(1).max(1000),
  mediaUrl: z.string().url().optional().nullable(),
  mediaType: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT']).optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
});

export const WhatsAppMessageSendSchema = z.object({
  recipientPhone: z.string().min(10).max(20),
  templateName: z.string().optional(),
  languageCode: z.string().default('en'),
  components: z.array(z.any()).optional(),
  parameters: z.array(z.string()).optional(),
  bodyText: z.string().optional(),
  messageText: z.string().optional(),
  mediaUrl: z.string().optional().nullable(),
  mediaType: z.enum(['image', 'video', 'document', 'audio']).optional().nullable(),
  mediaCaption: z.string().optional().nullable(),
  mediaFilename: z.string().optional().nullable(),
  interactiveType: z.enum(['button', 'list']).optional().nullable(),
  interactiveData: z.any().optional().nullable(),
  customerId: z.string().optional().nullable(),
  customerName: z.string().optional(),
  area: z.string().optional(),
  purifierBrand: z.string().optional(),
  purifierModel: z.string().optional(),
  nextDueDate: z.string().optional(),
  outputTds: z.number().optional().nullable(),
  renewalId: z.string().optional().nullable(),
  serviceId: z.string().optional().nullable(),
});
