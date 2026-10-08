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
