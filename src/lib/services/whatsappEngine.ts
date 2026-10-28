import { Customer, Purifier, LanguageCode, ServiceRecord, Technician, Business } from '@/types';

export interface WhatsAppMessageParams {
  customerName: string;
  purifierBrand: string;
  purifierModel?: string;
  dueDate?: string;
  businessName: string;
  ownerName?: string;
  businessAddress?: string;
  businessPhone?: string;
  technicianName?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  amount?: number;
  upiPaymentLink?: string;
}

export const WHATSAPP_TEMPLATES: Record<
  string,
  {
    name: string;
    description: string;
    languages: Record<LanguageCode, string>;
  }
> = {
  SERVICE_DUE: {
    name: 'Service Due Reminder',
    description: 'Sent when general RO service or filter replacement is due',
    languages: {
      en: `Hi {{customerName}}, greetings from {{businessName}}! 💧\n\nYour {{purifierBrand}} RO Water Purifier is due for its periodic service on {{dueDate}}.\n\nRegular service maintains pure drinking water and extends filter life. Would you like to schedule a technician visit this week?\n\nReply YES to book a convenient slot.`,
      te: `నమస్కారం {{customerName}} గారు, {{businessName}} నుండి! 💧\n\nమీ {{purifierBrand}} RO వాటర్ ప్యూరిఫైయర్ సర్వీస్ {{dueDate}} తేదీన చేయవలసి ఉంది.\n\nరెగ్యులర్ సర్వీసింగ్ వల్ల స్వచ్ఛమైన నీరు లభిస్తుంది మరియు ఫిల్టర్ల ఆయుష్షు పెరుగుతుంది. ఈ వారం టెక్నీషియన్ విజిట్ షెడ్యూల్ చేయమంటారా?\n\nఅనుకూలమైన సమయం కోసం YES అని రిప్లై ఇవ్వండి.`,
      hi: `नमस्ते {{customerName}} जी, {{businessName}} की ओर से सादर प्रणाम! 💧\n\nआपके {{purifierBrand}} RO वाटर प्यूरीफायर की नियमित सर्विस {{dueDate}} को देय है।\n\nशुद्ध पेयजल और प्यूरीफायर की लंबी उम्र के लिए नियमित सर्विस आवश्यक है। क्या हम इस सप्ताह सर्विस शेड्यूल करें?\n\nसुविधाजनक समय बुक करने के लिए कृपया YES लिखकर उत्तर दें।`,
      hinglish: `Hi {{customerName}} ji, {{businessName}} se! 💧\n\nAapke {{purifierBrand}} RO Purifier ka regular service {{dueDate}} ko due hai. Pure drinking water aur filters ki health ke liye time pe servicing zaroori hai.\n\nKya hum is hafte technician visit schedule karein? Slot book karne ke liye reply karein YES.`,
    },
  },
  SERVICE_OVERDUE: {
    name: 'Urgent Overdue Service Notice',
    description: 'Sent to customers whose service is overdue > 7 days',
    languages: {
      en: `Attention {{customerName}}: Your {{purifierBrand}} RO service is now overdue. Overdue filters can affect water purity and reduce membrane life. 🛠️\n\n{{businessName}} has technician slots available today. Reply BOOK to send a technician.`,
      te: `శ్రద్ధ వహించండి {{customerName}} గారు: మీ {{purifierBrand}} RO సర్వీస్ సమయం మించిపోయింది. ఫిల్టర్లు మార్చకపోతే నీటి నాణ్యత తగ్గవచ్చు. 🛠️\n\n{{businessName}} వద్ద ఈరోజు టెక్నీషియన్ స్లాట్స్ అందుబాటులో ఉన్నాయి. బుకింగ్ కొరకు BOOK అని రిప్లై ఇవ్వండి.`,
      hi: `ध्यान दें {{customerName}} जी: आपके {{purifierBrand}} RO की सर्विस अतिदेय (Overdue) हो चुकी है। समय पर फिल्टर न बदलने से पानी की शुद्धता प्रभावित हो सकती है। 🛠️\n\nआज ही सर्विस के लिए BOOK लिखकर भेजें। - {{businessName}}`,
      hinglish: `Alert {{customerName}} ji: Aapke {{purifierBrand}} RO ka service overdue ho gaya hai. Choked filters se membrane kharab ho sakti hai aur TDS badh sakta hai. 🛠️\n\nTechnician slot book karne ke liye turant BOOK reply karein. - {{businessName}}`,
    },
  },
  APPOINTMENT_CONFIRMATION: {
    name: 'Appointment Confirmed',
    description: 'Sent once a technician is assigned to a service slot',
    languages: {
      en: `Your RO service has been confirmed! ✅\n\nDate: {{scheduledDate}}\nTime: {{scheduledTime}}\nTechnician: {{technicianName}}\n\nOur technician will call you before arriving. Thank you for choosing {{businessName}}!`,
      te: `మీ RO సర్వీస్ అపాయింట్‌మెంట్ కన్ఫర్మ్ చేయబడింది! ✅\n\nతేదీ: {{scheduledDate}}\nసమయం: {{scheduledTime}}\nటెక్నీషియన్: {{technicianName}}\n\nమా టెక్నీషియన్ రాకముందు మీకు కాల్ చేస్తారు. {{businessName}} ని ఎంచుకున్నందుకు ధన్యవాదాలు!`,
      hi: `आपकी RO सर्विस कन्फर्म हो गई है! ✅\n\nदिनांक: {{scheduledDate}}\nसमय: {{scheduledTime}}\nतकनीशियन: {{technicianName}}\n\nहमारे तकनीशियन आने से पहले आपसे संपर्क करेंगे। {{businessName}} चुनने के लिए धन्यवाद!`,
      hinglish: `Aapka RO service confirm ho gaya hai! ✅\n\nDate: {{scheduledDate}}\nTime: {{scheduledTime}}\nTechnician: {{technicianName}}\n\nTechnician aane se pehle call karenge. Thanks for trusting {{businessName}}!`,
    },
  },
  TECHNICIAN_ON_WAY: {
    name: 'Technician On The Way',
    description: 'Sent when technician departs for customer doorstep',
    languages: {
      en: `Our service technician {{technicianName}} is on the way to your location for your {{purifierBrand}} RO service. 🛵\n\nExpected arrival within 20-30 minutes. - {{businessName}}`,
      te: `మా సర్వీస్ టెక్నీషియన్ {{technicianName}} మీ {{purifierBrand}} RO సర్వీస్ కోసం మీ ఇంటికి బయలుదేరారు. 🛵\n\n20-30 నిమిషాల్లో చేరుకుంటారు. - {{businessName}}`,
      hi: `हमारे तकनीशियन {{technicianName}} आपके {{purifierBrand}} RO सर्विस के लिए निकल चुके हैं। 🛵\n\nलगभग 20-30 मिनट में पहुंचेंगे। - {{businessName}}`,
      hinglish: `Humare technician {{technicianName}} aapke address ke liye nikal chuke hain. 🛵\n\n20-30 minutes mein pahunch jayenge. - {{businessName}}`,
    },
  },
  SERVICE_COMPLETED: {
    name: 'Service Completed & Thank You',
    description: 'Sent after successful technician sign-off',
    languages: {
      en: `Your {{purifierBrand}} RO service has been successfully completed! 🚰✨\n\nTechnician: {{technicianName}}\nAmount Paid: ₹{{amount}}\nNext Service Due: in 3 months.\n\nThank you for choosing {{businessName}}. Pure & safe drinking water guaranteed!`,
      te: `మీ {{purifierBrand}} RO సర్వీస్ విజయవంతంగా పూర్తయింది! 🚰✨\n\nటెక్నీషియన్: {{technicianName}}\nచెల్లించిన మొత్తం: ₹{{amount}}\nతదుపరి సర్వీస్: 3 నెలల్లో.\n\n{{businessName}} ని ఎంచుకున్నందుకు ధన్యవాదాలు!`,
      hi: `आपकी {{purifierBrand}} RO सर्विस सफलतापूर्वक संपन्न हो गई है! 🚰✨\n\nतकनीशियन: {{technicianName}}\nभुगतान राशि: ₹{{amount}}\n\n{{businessName}} पर विश्वास करने के लिए धन्यवाद! स्वस्थ रहें, सुरक्षित रहें।`,
      hinglish: `Aapka {{purifierBrand}} RO service complete ho gaya hai! 🚰✨\n\nTechnician: {{technicianName}}\nAmount: ₹{{amount}}\nAgla service: 3 months baad.\n\nThank you for choosing {{businessName}}!`,
    },
  },
  PAYMENT_PENDING: {
    name: 'Payment Reminder',
    description: 'Sent for uncollected or pending invoices',
    languages: {
      en: `Dear {{customerName}}, an outstanding balance of ₹{{amount}} is pending for your recent RO service by {{businessName}}. You can pay via UPI or cash on visit. Thank you!`,
      te: `ప్రియమైన {{customerName}} గారు, మీ ఇటీవలి RO సర్వీస్ కు సంబంధించి ₹{{amount}} బకాయి ఉంది. దయచేసి UPI ద్వారా చెల్లించగలరు. ధన్యవాదాలు! - {{businessName}}`,
      hi: `प्रिय {{customerName}} जी, आपकी हालिया RO सर्विस के लिए ₹{{amount}} की राशि बकाया है। कृपया UPI द्वारा भुगतान करें। धन्यवाद! - {{businessName}}`,
      hinglish: `Dear {{customerName}} ji, aapke recent RO service ka ₹{{amount}} payment pending hai. Aap UPI se pay kar sakte hain. - {{businessName}}`,
    },
  },
  AMC_RENEWAL: {
    name: 'Annual Maintenance Contract (AMC) Renewal',
    description: 'Sent when customer AMC is expiring within 30 days',
    languages: {
      en: `Protect your purifier year-round! 🛡️\n\nHi {{customerName}}, your Annual Maintenance Contract (AMC) with {{businessName}} expires on {{dueDate}}. Renew now to get 3 Free Periodic Services, Free Filter Replacements, and Free Breakdown Support!\n\nReply RENEW for our special festive renewal offer.`,
      te: `సంవత్సరం మొత్తం మీ ప్యూరిఫైయర్‌ను రక్షించుకోండి! 🛡️\n\n{{customerName}} గారు, {{businessName}} తో మీ వార్షిక నిర్వహణ కాంట్రాక్ట్ (AMC) {{dueDate}} న ముగుస్తుంది. ఉచిత సర్వీసులు మరియు స్పేర్స్ కవరేజ్ కోసం వెంటనే రెన్యూ చేసుకోండి.\n\nఆఫర్ల కోసం RENEW అని రిప్లై ఇవ్వండి.`,
      hi: `साल भर बेफिक्र रहें! 🛡️\n\n{{customerName}} जी, {{businessName}} के साथ आपका RO AMC अनुबंध {{dueDate}} को समाप्त हो रहा है। फ्री सर्विस और फिल्टर कवरेज जारी रखने के लिए आज ही रिन्यू करें।\n\nविशेष छूट के लिए RENEW लिखकर भेजें।`,
      hinglish: `Year-round peace of mind! 🛡️\n\n{{customerName}} ji, aapka RO AMC contract {{dueDate}} ko expire ho raha hai. Free periodic services aur filters coverage ke liye abhi renew karein.\n\nOffer janne ke liye reply RENEW. - {{businessName}}`,
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
  let result = templateText;
  result = result.replace(/\{\{customerName\}\}/g, params.customerName || 'Customer');
  result = result.replace(/\{\{purifierBrand\}\}/g, params.purifierBrand || 'RO');
  result = result.replace(/\{\{purifierModel\}\}/g, params.purifierModel || '');
  result = result.replace(/\{\{dueDate\}\}/g, params.dueDate || 'soon');
  result = result.replace(/\{\{businessName\}\}/g, params.businessName || 'RO Service Care');
  result = result.replace(/\{\{technicianName\}\}/g, params.technicianName || 'Our Technician');
  result = result.replace(/\{\{scheduledDate\}\}/g, params.scheduledDate || 'Today');
  result = result.replace(/\{\{scheduledTime\}\}/g, params.scheduledTime || 'convenient slot');
  result = result.replace(/\{\{amount\}\}/g, (params.amount || 0).toLocaleString('en-IN'));

  // Always end messages with business name, owner name, and address
  const footerLines = [
    '',
    '—',
    `🏢 ${params.businessName || 'RO Service Agency'}`,
    params.ownerName ? `👤 Owner: ${params.ownerName}` : '',
    params.businessAddress ? `📍 Address: ${params.businessAddress}` : '',
    params.businessPhone ? `📞 Contact: ${params.businessPhone}` : '',
  ].filter(Boolean);

  const businessFooter = footerLines.join('\n');
  if (!result.includes(params.businessAddress || 'Address:') && footerLines.length > 2) {
    result = `${result.trim()}\n${businessFooter}`;
  }

  return result;
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

📅 *Scheduled Date:* ${service.scheduledDate}
⏰ *Time Slot:* ${service.scheduledTimeSlot}
🔧 *Job Type:* ${service.serviceType}
💵 *Estimated Bill:* ₹${service.total.toLocaleString('en-IN')}

━━━━━━━━━━━━━━━━━━━
👤 *CUSTOMER DETAILS*
• *Name:* ${customer.fullName}
• *Phone:* +91 ${customer.mobileNumber}
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

Please confirm by replying *ACCEPTED*.
_${business.name} Dispatch Desk_`;

  return message;
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

  return `🌊 *Welcome to ${business.name}!* 💧
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

  return `🚰 *${product.brand.toUpperCase()} ${product.model}*
${product.purifierType} Water Purifier

💰 *Special Price:* ₹${product.sellingPrice.toLocaleString('en-IN')} ${discount > 0 ? `(~₹${product.mrp.toLocaleString('en-IN')}~, *${discount}% OFF!*)` : ''}
⚡ *Purification Speed:* ${product.capacityLph} LPH
🛢️ *Tank Capacity:* ${product.storageLiters} Liters
🛡️ *Warranty:* ${product.warrantyMonths} Months Comprehensive Warranty
✨ *Stages:* ${product.stagesCount}-Stage Purification

🌟 *Key Features:*
${product.features.map((f) => `• ${f}`).join('\n')}

🚚 *FREE Doorstep Delivery & Professional Installation included!*
Reply *BUY ${product.model.toUpperCase()}* or reply *BOOK DEMO* to schedule a free doorstep water TDS check!

—
🏢 ${business.name}
📍 ${business.address || ''}, ${business.city || 'Hyderabad'}
📞 ${business.phone || ''}`;
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
• 📍 *Address:* ${business.address || 'HITEC City'}, ${business.city || 'Hyderabad'}, ${business.state || 'Telangana'} ${business.pincode || ''}
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

