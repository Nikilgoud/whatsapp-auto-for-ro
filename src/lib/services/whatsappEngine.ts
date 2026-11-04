import { Customer, Purifier, LanguageCode, ServiceRecord, Technician, Business } from '@/types';
import { formatDateDDMMYYYY } from '@/lib/utils';

export interface BusinessDetailsPayload {
  name?: string;
  phone?: string;
  whatsappNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  ownerName?: string;
  website?: string;
}

/**
 * Formats a standardized, professional business details footer for WhatsApp messages.
 * Includes Business Name, Phone Number, Complete Address, and Website link.
 */
export function formatBusinessDetailsFooter(
  business?: Partial<Business> | BusinessDetailsPayload
): string {
  const bName = business?.name || 'niki Aquapure RO Solutions';
  const bPhone = business?.phone || business?.whatsappNumber || '+91 98490 12345';

  let addressLine = '';
  if (business?.address) {
    const parts = [business.address];
    if (business.city && !business.address.toLowerCase().includes(business.city.toLowerCase())) {
      parts.push(business.city);
    }
    if (business.state && !business.address.toLowerCase().includes(business.state.toLowerCase())) {
      parts.push(business.pincode ? `${business.state} ${business.pincode}` : business.state);
    } else if (business.pincode && !business.address.includes(business.pincode)) {
      parts.push(business.pincode);
    }
    addressLine = parts.join(', ');
  } else {
    addressLine = 'Plot 42, Hitech City Main Rd, Madhapur, Hyderabad, Telangana 500081';
  }

  const lines = [
    '—',
    `🏢 *${bName}*`,
    `📞 *Phone:* ${bPhone}`,
    `📍 *Address:* ${addressLine}`
  ];

  if (business?.website && business.website.trim()) {
    lines.push(`🌐 *Website:* ${business.website.trim()}`);
  }

  return lines.join('\n');
}

/**
 * Ensures any message text cleanly ends with business name, phone, address, and website.
 * Prevents duplicate appending if business details are already present.
 */
export function appendBusinessFooter(
  messageText: string,
  business?: Partial<Business> | BusinessDetailsPayload
): string {
  if (!messageText) return '';
  const text = messageText.trim();

  // Avoid duplicate footer if already present in message body
  const bName = business?.name || 'niki Aquapure RO Solutions';
  const bPhone = business?.phone || business?.whatsappNumber || '98490';
  const phoneDigits = bPhone.replace(/\D/g, '').slice(-8);

  const hasPhone = phoneDigits ? text.includes(phoneDigits) : false;
  const hasAddress = text.includes('📍 *Address:*') || text.includes('📍 Address:');
  const hasBusiness = text.includes(`🏢 *${bName}*`) || text.includes(`🏢 ${bName}`);
  const hasWebsite = business?.website && business.website.trim()
    ? (text.includes('🌐 *Website:*') || text.includes('🌐 Website:') || text.includes(business.website.trim()))
    : true;

  if (hasAddress && (hasPhone || hasBusiness) && hasWebsite) {
    return text;
  }

  if (hasAddress && (hasPhone || hasBusiness) && !hasWebsite && business?.website && business.website.trim()) {
    return `${text}\n🌐 *Website:* ${business.website.trim()}`;
  }

  const footer = formatBusinessDetailsFooter(business);
  return `${text}\n\n${footer}`;
}

export interface WhatsAppMessageParams {
  customerName: string;
  purifierBrand: string;
  purifierModel?: string;
  dueDate?: string;
  businessName: string;
  ownerName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessWebsite?: string;
  technicianName?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  amount?: number;
  upiPaymentLink?: string;
}

export type TemplateCategory = 'SERVICE_REMINDERS' | 'OPERATIONS' | 'BILLING_AMC' | 'MARKETING';

export interface WhatsAppTemplateDef {
  name: string;
  category: TemplateCategory;
  description: string;
  languages: {
    en: string;
    [key: string]: string | undefined;
  };
}

export const WHATSAPP_TEMPLATES: Record<string, WhatsAppTemplateDef> = {
  SERVICE_DUE: {
    name: 'Service Due Reminder',
    category: 'SERVICE_REMINDERS',
    description: 'Sent when general RO service or periodic maintenance is due',
    languages: {
      en: `Hi {{customerName}}, greetings from {{businessName}}! 💧\n\nYour {{purifierBrand}} RO Water Purifier is due for its periodic service on {{dueDate}}.\n\nRegular service maintains pure drinking water and extends filter life. Would you like to schedule a technician visit this week?\n\nReply YES to book a convenient slot.`,
    },
  },
  SERVICE_OVERDUE: {
    name: 'Urgent Overdue Service Notice',
    category: 'SERVICE_REMINDERS',
    description: 'Sent to customers whose service is overdue > 7 days to protect membrane and health',
    languages: {
      en: `Attention {{customerName}}: Your {{purifierBrand}} RO service is now overdue. ⚠️ Overdue filters can affect water purity, increase TDS, and reduce membrane life.\n\n{{businessName}} has certified technician slots available today. Reply BOOK to send a technician.`,
    },
  },
  FILTER_REPLACEMENT: {
    name: 'Filter & Cartridge Replacement Due',
    category: 'SERVICE_REMINDERS',
    description: 'Sent when sediment or pre-carbon filters complete their 3 to 6 month cycle',
    languages: {
      en: `Hi {{customerName}}, greetings from {{businessName}}! 💧\n\nYour {{purifierBrand}} sediment and carbon filter lifespan is nearing completion (due on {{dueDate}}).\n\nTimely filter replacement protects your expensive RO membrane and prevents bacteria & dirt buildup.\n\nReply YES to book a genuine filter replacement visit.`,
    },
  },
  TDS_WATER_HEALTH_CHECK: {
    name: 'Free Water TDS & Purity Checkup',
    category: 'SERVICE_REMINDERS',
    description: 'Doorstep water TDS measurement and mineral quality testing campaign',
    languages: {
      en: `Is your drinking water 100% pure & safe? 🧪💧\n\nHi {{customerName}}, {{businessName}} is offering a FREE Doorstep Water Quality & Digital TDS Checkup this week in your locality!\n\nUnchecked tap or borewell water can harm your family's health. Let our water expert test your inlet & RO output water.\n\nReply TDS to book your free checkup today!`,
    },
  },
  APPOINTMENT_CONFIRMATION: {
    name: 'Appointment Confirmed',
    category: 'OPERATIONS',
    description: 'Sent once a technician is assigned to a service slot',
    languages: {
      en: `Your RO service has been confirmed! ✅\n\nDate: {{scheduledDate}}\nTime: {{scheduledTime}}\nTechnician: {{technicianName}}\n\nOur technician will call you before arriving. Thank you for choosing {{businessName}}!`,
    },
  },
  TECHNICIAN_ON_WAY: {
    name: 'Technician On The Way',
    category: 'OPERATIONS',
    description: 'Sent when technician departs for customer doorstep',
    languages: {
      en: `Our service technician {{technicianName}} is on the way to your location for your {{purifierBrand}} RO service. 🛵\n\nExpected arrival within 20-30 minutes. - {{businessName}}`,
    },
  },
  NEW_INSTALLATION: {
    name: 'New Purifier Installation & Setup',
    category: 'OPERATIONS',
    description: 'Sent when a new RO purifier order is confirmed and installation is scheduled',
    languages: {
      en: `Congratulations {{customerName}}! 🎉\n\nYour order for {{purifierBrand}} {{purifierModel}} has been confirmed by {{businessName}}.\n\nInstallation Scheduled: {{scheduledDate}} (Slot: {{scheduledTime}})\nTechnician: {{technicianName}}\n\nOur certified technician will arrive for professional, leak-free installation, electrical check, and pure water TDS calibration.\n\nPure Water. Healthier Life! 🚰`,
    },
  },
  SERVICE_COMPLETED: {
    name: 'Service Completed & Water Health Card',
    category: 'OPERATIONS',
    description: 'Sent after successful technician sign-off with pure water guarantee',
    languages: {
      en: `Your {{purifierBrand}} RO service has been successfully completed! 🚰✨\n\nTechnician: {{technicianName}}\nAmount Paid: ₹{{amount}}\nNext Service Due: in 3 months.\n\nThank you for choosing {{businessName}}. Pure & safe drinking water guaranteed!`,
    },
  },
  PAYMENT_PENDING: {
    name: 'Payment Reminder & UPI',
    category: 'BILLING_AMC',
    description: 'Sent for uncollected or pending service invoices with payment modes',
    languages: {
      en: `Dear {{customerName}}, an outstanding balance of ₹{{amount}} is pending for your recent RO service by {{businessName}}.\n\nYou can pay securely via UPI, QR code on your invoice, or cash on visit. Thank you for your prompt payment!`,
    },
  },
  AMC_RENEWAL: {
    name: 'Annual Maintenance Contract (AMC) Renewal',
    category: 'BILLING_AMC',
    description: 'Sent when customer AMC is expiring within 30 days',
    languages: {
      en: `Protect your purifier year-round! 🛡️\n\nHi {{customerName}}, your Annual Maintenance Contract (AMC) with {{businessName}} expires on {{dueDate}}. Renew now to get 3 Free Periodic Services, Free Filter Replacements, and Free Breakdown Support!\n\nReply RENEW for our special renewal offer.`,
    },
  },
  FESTIVE_EXCHANGE_OFFER: {
    name: 'RO Exchange & Upgrade Offer',
    category: 'MARKETING',
    description: 'Promotional campaign to trade in old purifier for a brand new Copper/Alkaline model',
    languages: {
      en: `Mega RO Purifier Exchange Festival! 🎁✨\n\nDear {{customerName}}, trade in your old or malfunctioning RO purifier and get an INSTANT FLAT ₹1,500 - ₹3,000 DISCOUNT on top brand Alkaline Copper RO purifiers from {{businessName}}!\n\n✅ 100% Copper + Zinc + Alkaline Mineral Health\n✅ Free Delivery & Professional Installation\n✅ 1-Year Comprehensive Warranty\n\nReply OFFERS to see eligible models & exchange value!`,
    },
  },
  WELCOME_ONBOARDING: {
    name: 'Welcome to Customer Family',
    category: 'MARKETING',
    description: 'Sent to newly onboarded or registered customers with direct helpline',
    languages: {
      en: `Welcome to {{businessName}}! 🌊🚰\n\nDear {{customerName}}, thank you for registering with us for your {{purifierBrand}} Water Purifier care. Your water purity and peace of mind are now our top responsibility!\n\nSave this number for:\n• Quick Service & Filter Reminders\n• Fast Emergency Leakage Support\n• 100% Genuine Certified Spares\n\nNeed any help? Just reply HI to chat with us anytime!`,
    },
  },
};

/**
 * Replaces placeholders in message templates with dynamic values
 */
export function interpolateTemplate(
  templateText: string,
  params: WhatsAppMessageParams
): string {
  const formattedDueDate = params.dueDate ? formatDateDDMMYYYY(params.dueDate, params.dueDate) : 'soon';
  const formattedScheduledDate = params.scheduledDate ? formatDateDDMMYYYY(params.scheduledDate, params.scheduledDate) : 'Today';

  let result = templateText;
  result = result.replace(/\{\{customerName\}\}/g, params.customerName || 'Customer');
  result = result.replace(/\{\{purifierBrand\}\}/g, params.purifierBrand || 'RO');
  result = result.replace(/\{\{purifierModel\}\}/g, params.purifierModel || '');
  result = result.replace(/\{\{dueDate\}\}/g, formattedDueDate);
  result = result.replace(/\{\{businessName\}\}/g, params.businessName || 'RO Service Care');
  result = result.replace(/\{\{technicianName\}\}/g, params.technicianName || 'Our Technician');
  result = result.replace(/\{\{scheduledDate\}\}/g, formattedScheduledDate);
  result = result.replace(/\{\{scheduledTime\}\}/g, params.scheduledTime || 'convenient slot');
  result = result.replace(/\{\{amount\}\}/g, (params.amount || 0).toLocaleString('en-IN'));
  result = result.replace(/\{\{phone\}\}/g, params.businessPhone || '');
  result = result.replace(/\{\{businessPhone\}\}/g, params.businessPhone || '');
  result = result.replace(/\{\{businessAddress\}\}/g, params.businessAddress || '');
  result = result.replace(/\{\{businessWebsite\}\}/g, params.businessWebsite || '');

  // Always guarantee message ends with business name, business number, complete address, and website
  return appendBusinessFooter(result, {
    name: params.businessName,
    phone: params.businessPhone,
    address: params.businessAddress,
    ownerName: params.ownerName,
    website: params.businessWebsite,
  });
}

/**
 * Normalizes Indian phone numbers into international 91XXXXXXXXXX format
 */
export function normalizeIndianPhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
}

/**
 * Generates an official WhatsApp click-to-chat deep link
 */
export function generateWhatsAppLink(
  phoneNumber: string,
  messageText: string
): string {
  const normalizedPhone = normalizeIndianPhoneNumber(phoneNumber);
  const encodedMessage = encodeURIComponent(messageText);
  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
}

/**
 * Generates a complete WhatsApp dispatch message to assign a service job to a technician
 */
export function generateTechnicianDispatchMessage(
  technician: Technician,
  customer: Customer,
  purifier: Purifier | undefined,
  service: ServiceRecord,
  business: Business,
  customNotes?: string
): string {
  const addressQuery = encodeURIComponent(
    `${customer.streetAddress || ''}, ${customer.areaLocality || ''}, ${customer.city || 'Hyderabad'}`
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${addressQuery}`;

  const message = `🚨 *NEW RO SERVICE JOB ASSIGNED* 🛠️
Hello ${technician.name}, you have a service job assigned by ${business.name}.

📅 *Scheduled Date:* ${formatDateDDMMYYYY(service.scheduledDate)}
⏰ *Time Slot:* ${service.scheduledTimeSlot}
🔧 *Job Type:* ${service.serviceType}
💵 *Estimated Bill:* ₹${service.total.toLocaleString('en-IN')}

━━━━━━━━━━━━━━━━━━━
👤 *CUSTOMER DETAILS*
• *Name:* ${customer.fullName}
• *Phone:* +91 ${customer.mobileNumber}${(customer.alternateMobile || customer.alternativePhone) ? `\n• *Alt Phone:* +91 ${customer.alternateMobile || customer.alternativePhone}` : ''}
• *Locality:* ${customer.areaLocality}
• *Address:* ${customer.houseFlatNo ? customer.houseFlatNo + ', ' : ''}${customer.streetAddress || ''}
${customer.landmark ? `• *Landmark:* ${customer.landmark}` : ''}
🗺️ *Google Maps:* ${mapsUrl}

━━━━━━━━━━━━━━━━━━━
🚰 *PURIFIER DETAILS*
• *Brand & Model:* ${purifier?.brand || 'RO'} ${purifier?.model || ''}
• *Type:* ${purifier?.purifierType || 'RO+UV'}
• *Location in House:* ${purifier?.installationLocation || 'Kitchen'}
${purifier?.inletTdsBaseline ? `• *Baseline TDS:* ${purifier.inletTdsBaseline} in / ${purifier.outputTdsBaseline} out` : ''}
${service.issueDescription ? `• *Issue / Notes:* ${service.issueDescription}` : ''}
${customNotes ? `• *Owner Instructions:* ${customNotes}` : ''}

━━━━━━━━━━━━━━━━━━━
👉 *TECHNICIAN INSTRUCTIONS:*
1. Call the customer 15 minutes before visiting.
2. Measure raw inlet water TDS and pure output TDS.
3. Check pre-filter, carbon block, and leakage.
4. Collect payment via UPI/Cash upon completion.

Please confirm by replying *ACCEPTED*.`;

  return appendBusinessFooter(message, business);
}

/**
 * Anti-spam and reminder eligibility guard
 */
export function checkReminderEligibility(
  customer: Customer,
  lastReminderDate?: string,
  hasActiveAppointment = false
): { eligible: boolean; reason?: string } {
  if (customer.whatsappOptOut) {
    return { eligible: false, reason: 'Customer opted out of WhatsApp updates' };
  }
  if (hasActiveAppointment) {
    return { eligible: false, reason: 'Service appointment already active or scheduled' };
  }
  if (lastReminderDate) {
    const lastDate = new Date(lastReminderDate).getTime();
    const now = new Date().getTime();
    const hoursSince = (now - lastDate) / (1000 * 60 * 60);
    if (hoursSince < 48) {
      return { eligible: false, reason: `Reminder already sent ${Math.round(hoursSince)} hours ago` };
    }
  }
  return { eligible: true };
}

/**
 * Generates Welcome Message and Interactive Services Menu
 */
export function getWelcomeAndServiceDiscoveryMessage(business: Business): string {
  const serviceCharges = business.settings.serviceCharges || {
    generalService: 650,
    periodicService: 750,
    installation: 600,
    membraneReplacement: 1800,
    leakageRepair: 350,
  };

  const message = `🌊 *Welcome to ${business.name}!* 💧
${business.tagline || 'Never miss a service. Never lose a customer.'}

Hello! We are glad to assist you. Pure, healthy & safe drinking water is our top priority.

📋 *HOW CAN WE HELP YOU TODAY?*
Please reply with a number (1 - 7):

1️⃣ *Book General Service / Periodic Maintenance* (Starting ₹${serviceCharges.generalService})
2️⃣ *Filter & RO Membrane Replacement* (Pre-Carbon, Post-Carbon & 75/100 GPD)
3️⃣ *Water Quality / High TDS & Taste Checkup*
4️⃣ *Emergency Repair: Water Leakage / No Flow*
5️⃣ *Explore & Buy Brand New RO Purifiers 🛒* (Special Exchange Offers Available!)
6️⃣ *Annual Maintenance Contract (AMC Plans) 🛡️* (1 & 2 Year Peace of Mind)
7️⃣ *Speak directly with ${business.ownerName || 'Our Service Manager'}*

_Reply with 1, 2, 3, 4, 5, 6, or 7, or describe your issue!_`;

  return appendBusinessFooter(message, business);
}

/**
 * Formats a Purifier Product for WhatsApp sharing and buying
 */
export function formatPurifierProductForWhatsApp(
  product: import('@/types').PurifierProduct,
  business: Business
): string {
  const discount = product.mrp > product.sellingPrice 
    ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100) 
    : 0;

  const baseText = `🚰 *${product.brand.toUpperCase()} ${product.model}*
${product.purifierType} Water Purifier

💰 *Special Price:* ₹${product.sellingPrice.toLocaleString('en-IN')} ${discount > 0 ? `(~₹${product.mrp.toLocaleString('en-IN')}~, *${discount}% OFF!*)` : ''}
⚡ *Purification Speed:* ${product.capacityLph} LPH
🛢️ *Tank Capacity:* ${product.storageLiters} Liters
🛡️ *Warranty:* ${product.warrantyMonths} Months Comprehensive Warranty
✨ *Stages:* ${product.stagesCount}-Stage Purification

🌟 *Key Features:*
${product.features.map((f) => `• ${f}`).join('\n')}

🚚 *FREE Doorstep Delivery & Professional Installation included!*
Reply *BUY ${product.model.toUpperCase()}* or reply *BOOK DEMO* to schedule a free doorstep water TDS check!`;

  return appendBusinessFooter(baseText, business);
}

/**
 * Grounded AI Chatbot: Formulates real-time replies strictly from business knowledge base
 */
export function generateGroundedChatbotReply(
  userText: string,
  business: Business,
  products: import('@/types').PurifierProduct[],
  amcPlans: import('@/types').AMCPlan[]
): { replyText: string; options?: { id: string; label: string; action: string }[]; productCard?: import('@/types').PurifierProduct } {
  const result = computeGroundedChatbotReply(userText, business, products, amcPlans);
  return {
    ...result,
    replyText: appendBusinessFooter(result.replyText, business),
  };
}

function computeGroundedChatbotReply(
  userText: string,
  business: Business,
  products: import('@/types').PurifierProduct[],
  amcPlans: import('@/types').AMCPlan[]
): { replyText: string; options?: { id: string; label: string; action: string }[]; productCard?: import('@/types').PurifierProduct } {
  const q = userText.trim().toLowerCase();
  const charges = business.settings.serviceCharges || {
    generalService: 650,
    periodicService: 750,
    installation: 600,
    uninstallation: 400,
    filterReplacement: 1450,
    membraneReplacement: 2200,
    uvReplacement: 650,
    leakageRepair: 350,
    tdsAdjustment: 300,
    emergencyService: 700,
    minimumVisitingFee: 300,
  };

  // Option 1 or Service Booking query
  if (q === '1' || q.includes('general') || q.includes('service') || q.includes('maintenance') || q.includes('cleaning') || q.includes('servicing')) {
    return {
      replyText: `🔧 *RO Service & Maintenance Booking*

Our certified technician will visit your doorstep for a full 15-point checkup:
• Raw Inlet Water & Output TDS Testing
• Sediment Pre-Filter High-Pressure Flush
• Membrane Flushing & Pressure Pump Check
• Leakage, Pipe & Electrical Inspection

💵 *Service Charges:* ₹${charges.generalService} (Visiting & labor included)
📅 Slots are open today & tomorrow between ${business.settings.workingHoursStart || '09:00'} - ${business.settings.workingHoursEnd || '19:30'}.

Would you like to confirm a technician visit?`,
      options: [
        { id: 'book_today', label: '📅 Book Slot Today', action: 'book_today' },
        { id: 'view_menu', label: '📋 View All Services', action: 'show_menu' },
        { id: 'talk_owner', label: '📞 Speak to Manager', action: 'contact_owner' }
      ]
    };
  }

  // Option 2 or Filter / Membrane Replacement
  if (q === '2' || q.includes('filter') || q.includes('membrane') || q.includes('sediment') || q.includes('carbon') || q.includes('candle') || q.includes('cartridge')) {
    return {
      replyText: `🚰 *Genuine Filters & RO Membrane Rates*

At ${business.name}, we only install 100% genuine, food-grade verified filtration spares:
• *Spun / Sediment Filter:* ₹${business.settings.averageFilterCost || 450} (Replace every 3 months)
• *Pre-Carbon & Post-Carbon Block:* ₹${charges.filterReplacement || 1200} (Replace every 6 months)
• *High-Rejection RO Membrane (75/100 GPD):* ₹${charges.membraneReplacement || 2200} (Lasts 18-24 months)
• *Philips / Osram UV Lamp:* ₹${charges.uvReplacement || 650}

All replaced parts come with warranty and guaranteed TDS reduction!`,
      options: [
        { id: 'book_filter', label: '🛠️ Book Filter Replacement', action: 'book_filter' },
        { id: 'check_tds', label: '🧪 Check My Water TDS First', action: 'check_tds' },
        { id: 'show_menu', label: '📋 Back to Menu', action: 'show_menu' }
      ]
    };
  }

  // Option 3 or TDS / Taste Check
  if (q === '3' || q.includes('tds') || q.includes('taste') || q.includes('smell') || q.includes('quality') || q.includes('bad water')) {
    return {
      replyText: `🧪 *Water Quality & High TDS Troubleshooting*

• *Ideal Drinking Water TDS:* 70 - 150 ppm
• If your water tastes bitter, salty, or has white residue, the RO membrane may be scaled or exhausted.
• We offer doorstep digital TDS & pH measurement for ₹${charges.tdsAdjustment}. (Free if any service is completed).

Would you like our technician to test your water quality at home?`,
      options: [
        { id: 'book_tds', label: '📍 Schedule TDS Checkup', action: 'book_tds' },
        { id: 'show_menu', label: '📋 Main Menu', action: 'show_menu' }
      ]
    };
  }

  // Option 4 or Leakage / Low Flow
  if (q === '4' || q.includes('leak') || q.includes('leaking') || q.includes('drop') || q.includes('pipe') || q.includes('no water') || q.includes('slow') || q.includes('sound') || q.includes('beeping')) {
    return {
      replyText: `🚨 *Emergency Leakage & Repair Assistance*

⚠️ *Immediate Safety Tip:*
1. Turn OFF the inline water valve connecting to your RO purifier.
2. Turn OFF the electrical power adapter (SMPS plug) to protect the booster pump.

Our technicians handle urgent pipe punctures, connector bursts, and booster pump faults on priority.
Visiting & minor repair fee: ₹${charges.leakageRepair}.`,
      options: [
        { id: 'emergency_visit', label: '🚨 Send Technician Urgently', action: 'emergency_visit' },
        { id: 'call_now', label: `📞 Call ${business.phone}`, action: 'call_phone' }
      ]
    };
  }

  // Option 5 or Buy New Purifier / Products Catalog
  if (q === '5' || q.includes('buy') || q.includes('new') || q.includes('purifier') || q.includes('model') || q.includes('product') || q.includes('price') || q.includes('cost') || q.includes('kent') || q.includes('aquaguard')) {
    const featuredProduct = products.length > 0 ? products[0] : undefined;
    return {
      replyText: `🛒 *Brand New RO Water Purifiers for Sale*

Explore our top-selling, genuine Indian RO purifiers with free installation, factory warranty, and free first-year service!

We have ${products.length} models ready in stock:
${products.slice(0, 4).map((p, idx) => `${idx + 1}. *${p.brand} ${p.model}* — ₹${p.sellingPrice.toLocaleString('en-IN')} (${p.storageLiters}L, ${p.stagesCount} Stages)`).join('\n')}

Special: Exchange old purifiers for extra ₹1,500 discount!`,
      options: [
        { id: 'view_all_products', label: '🛍️ Browse Full Product Catalog', action: 'view_catalog' },
        { id: 'book_demo', label: '🎁 Book Free Doorstep Demo', action: 'book_demo' },
        { id: 'show_menu', label: '📋 Main Menu', action: 'show_menu' }
      ],
      productCard: featuredProduct
    };
  }

  // Option 6 or AMC Plans
  if (q === '6' || q.includes('amc') || q.includes('contract') || q.includes('annual') || q.includes('plan') || q.includes('subscription')) {
    const plansSummary = amcPlans.length > 0
      ? amcPlans.map((p) => `• *${p.name}:* ₹${p.price.toLocaleString('en-IN')}/year (${p.annualVisits} visits, ${p.isMembraneCovered ? 'Membrane Covered' : 'Filters & Labour Covered'})`).join('\n')
      : `• *Basic AMC:* ₹1,999/yr (3 Free visits + Labour Free)\n• *Comprehensive AMC:* ₹3,499/yr (All Filters + 3 Services Included)`;

    return {
      replyText: `🛡️ *Annual Maintenance Contract (AMC Plans)*

Zero maintenance stress all year round!
${plansSummary}

✅ Zero visiting charges
✅ Genuine original filters replacement
✅ Free emergency breakdown visits within 4 hours`,
      options: [
        { id: 'buy_amc', label: '🛡️ Buy AMC for My RO', action: 'buy_amc' },
        { id: 'show_menu', label: '📋 Main Menu', action: 'show_menu' }
      ]
    };
  }

  // Option 7 or Owner Contact / Hours / Location
  if (q === '7' || q.includes('owner') || q.includes('manager') || q.includes('speak') || q.includes('call') || q.includes('human') || q.includes('address') || q.includes('location') || q.includes('where') || q.includes('hours') || q.includes('shop')) {
    return {
      replyText: `🏢 *${business.name} Contact Details*

• 👤 *Owner / Manager:* ${business.ownerName || 'Customer Support'}
• 📞 *Helpline / Phone:* ${business.phone}
• 💬 *WhatsApp:* +${business.whatsappNumber || business.phone}
• 📍 *Address:* ${business.address || 'HITEC City'}, ${business.city || 'Hyderabad'}, ${business.state || 'Telangana'} ${business.pincode || ''}${business.website ? `\n• 🌐 *Website:* ${business.website}` : ''}
• ⏰ *Working Hours:* ${business.settings.workingHoursStart || '09:00'} to ${business.settings.workingHoursEnd || '19:30'} (Monday - Sunday)

Our team is ready to assist you!`,
      options: [
        { id: 'call_owner', label: `📞 Call ${business.phone}`, action: 'call_phone' },
        { id: 'book_service', label: '🛠️ Book a Service', action: 'book_service' },
        { id: 'show_menu', label: '📋 Back to Menu', action: 'show_menu' }
      ]
    };
  }

  // Default Fallback: Welcomes and shows menu
  return {
    replyText: getWelcomeAndServiceDiscoveryMessage(business),
    options: [
      { id: 'opt_1', label: '1️⃣ Book Service', action: 'book_service' },
      { id: 'opt_5', label: '5️⃣ Buy New RO', action: 'view_catalog' },
      { id: 'opt_6', label: '6️⃣ AMC Plans', action: 'amc_plans' },
      { id: 'opt_7', label: '7️⃣ Contact Us', action: 'contact_owner' }
    ]
  };
}

