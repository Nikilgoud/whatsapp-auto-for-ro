import { LiveWhatsAppConversation, LiveWhatsAppMessage } from '@/types';
import { formatWhatsAppPhoneNumber } from './whatsappCloudApi';

interface MockStoreState {
  conversations: Map<string, LiveWhatsAppConversation>;
  messages: Map<string, LiveWhatsAppMessage[]>;
}

declare global {
  // eslint-disable-next-line no-var
  var __mockWhatsAppStore: MockStoreState | undefined;
}

function initMockStore(): MockStoreState {
  if (global.__mockWhatsAppStore) {
    return global.__mockWhatsAppStore;
  }

  const now = new Date();
  const timeMinusMins = (mins: number) => new Date(now.getTime() - mins * 60 * 1000).toISOString();
  const timeMinusHours = (hours: number) => new Date(now.getTime() - hours * 3600 * 1000).toISOString();
  const timeMinusDays = (days: number) => new Date(now.getTime() - days * 86400 * 1000).toISOString();

  const businessId = 'biz-demo-ro';

  // Pre-seed realistic chat histories
  const initialMessages: Record<string, LiveWhatsAppMessage[]> = {
    'demo-cust-01': [
      {
        id: 'msg-seed-101',
        businessId,
        customerId: 'demo-cust-01',
        phoneNumber: '919876543210',
        direction: 'OUTBOUND',
        messageType: 'TEMPLATE',
        templateName: 'service_renewal_due',
        content: 'నమస్తే Rajesh Kumar గారు! Aquapure RO సర్వీసెస్ నుండి గుర్తుచేస్తున్నాము. మీ Kent Grand Plus RO సర్వీస్ గడువు 20 Oct 2026 నాటికి ముగుస్తుంది. శుభ్రమైన, ఆరోగ్యకరమైన తాగునీటి కోసం సర్వీస్ స్లాట్ బుక్ చేసుకోండి.',
        status: 'READ',
        sentAt: timeMinusDays(2),
        deliveredAt: timeMinusDays(2),
        readAt: timeMinusDays(2),
        createdAt: timeMinusDays(2),
      },
      {
        id: 'msg-seed-102',
        businessId,
        customerId: 'demo-cust-01',
        phoneNumber: '919876543210',
        direction: 'INBOUND',
        messageType: 'TEXT',
        content: 'Hi, I noticed the water output flow is quite slow since yesterday. Can someone visit tomorrow morning?',
        status: 'READ',
        sentAt: timeMinusHours(5),
        createdAt: timeMinusHours(5),
      },
      {
        id: 'msg-seed-103',
        businessId,
        customerId: 'demo-cust-01',
        phoneNumber: '919876543210',
        direction: 'OUTBOUND',
        messageType: 'TEXT',
        content: 'ఖచ్చితంగా Rajesh గారు! రేపు ఉదయం 10:30 AM కి టెక్నీషియన్ విజిట్ స్లాట్ నమోదు చేశాము. టెక్నీషియన్ రమేష్ (Ph: +91 98491 23456) మీ ఇంటికి వస్తారు.',
        status: 'READ',
        sentAt: timeMinusHours(4),
        deliveredAt: timeMinusHours(4),
        readAt: timeMinusHours(4),
        createdAt: timeMinusHours(4),
      },
      {
        id: 'msg-seed-104',
        businessId,
        customerId: 'demo-cust-01',
        phoneNumber: '919876543210',
        direction: 'INBOUND',
        messageType: 'TEXT',
        content: 'Ok thanks! What will be the standard TDS check and filter service charges?',
        status: 'RECEIVED',
        sentAt: timeMinusMins(22),
        createdAt: timeMinusMins(22),
      },
    ],

    'demo-cust-02': [
      {
        id: 'msg-seed-201',
        businessId,
        customerId: 'demo-cust-02',
        phoneNumber: '919848123456',
        direction: 'OUTBOUND',
        messageType: 'TEMPLATE',
        templateName: 'amc_quarterly_visit',
        content: 'Dear Sneha Sharma ji, Your Aquaguard Geneus AMC Comprehensive Plan quarterly checkup is scheduled for next week. Our technician will visit to sanitize filters and test water purity.',
        status: 'READ',
        sentAt: timeMinusDays(3),
        deliveredAt: timeMinusDays(3),
        readAt: timeMinusDays(3),
        createdAt: timeMinusDays(3),
      },
      {
        id: 'msg-seed-202',
        businessId,
        customerId: 'demo-cust-02',
        phoneNumber: '919848123456',
        direction: 'INBOUND',
        messageType: 'TEXT',
        content: 'Can you please send the invoice copy of my AMC plan renewal?',
        status: 'READ',
        sentAt: timeMinusHours(2),
        createdAt: timeMinusHours(2),
      },
      {
        id: 'msg-seed-203',
        businessId,
        customerId: 'demo-cust-02',
        phoneNumber: '919848123456',
        direction: 'OUTBOUND',
        messageType: 'MEDIA',
        content: 'Sure Sneha ji, here is your digital AMC invoice and 12-month comprehensive warranty receipt for 2026-27.',
        mediaUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60',
        mediaType: 'image',
        status: 'DELIVERED',
        sentAt: timeMinusMins(45),
        deliveredAt: timeMinusMins(44),
        createdAt: timeMinusMins(45),
      },
    ],

    'demo-cust-03': [
      {
        id: 'msg-seed-301',
        businessId,
        customerId: 'demo-cust-03',
        phoneNumber: '919988776655',
        direction: 'OUTBOUND',
        messageType: 'TEMPLATE',
        templateName: 'urgent_overdue_alert',
        content: '⚠️ URGENT ALERT: Vikram Reddy గారు, మీ Pureit RO సెడిమెంట్ ఫిల్టర్ రీప్లేస్‌మెంట్ గడువు దాటిపోయింది. పాత ఫిల్టర్ వాడటం వల్ల వాటర్ ట్యాంక్‌లో బ్యాక్టీరియా చేరే ప్రమాదం ఉంది. దయచేసి సర్వీస్ చేయించుకోండి.',
        status: 'DELIVERED',
        sentAt: timeMinusHours(8),
        deliveredAt: timeMinusHours(8),
        createdAt: timeMinusHours(8),
      },
      {
        id: 'msg-seed-302',
        businessId,
        customerId: 'demo-cust-03',
        phoneNumber: '919988776655',
        direction: 'INBOUND',
        messageType: 'TEXT',
        content: 'Send me the filter replacement price list please. Do you have original Pureit carbon blocks in stock?',
        status: 'RECEIVED',
        sentAt: timeMinusHours(1),
        createdAt: timeMinusHours(1),
      },
    ],

    'demo-cust-04': [
      {
        id: 'msg-seed-401',
        businessId,
        customerId: 'demo-cust-04',
        phoneNumber: '919123456780',
        direction: 'INBOUND',
        messageType: 'TEXT',
        content: 'Hello, what was the final TDS reading after the membrane change service done yesterday?',
        status: 'READ',
        sentAt: timeMinusHours(6),
        createdAt: timeMinusHours(6),
      },
      {
        id: 'msg-seed-402',
        businessId,
        customerId: 'demo-cust-04',
        phoneNumber: '919123456780',
        direction: 'OUTBOUND',
        messageType: 'TEXT',
        content: 'Hello Priya ji! Post-service output TDS was tested and certified at 68 ppm (WHO recommended drinking standard 50-150 ppm). Water purity is optimal!',
        status: 'READ',
        sentAt: timeMinusHours(5),
        deliveredAt: timeMinusHours(5),
        readAt: timeMinusHours(4),
        createdAt: timeMinusHours(5),
      },
      {
        id: 'msg-seed-403',
        businessId,
        customerId: 'demo-cust-04',
        phoneNumber: '919123456780',
        direction: 'INBOUND',
        messageType: 'TEXT',
        content: 'Great, payment of ₹1,850 completed via GPay UPI. Thank you for the quick service!',
        status: 'RECEIVED',
        sentAt: timeMinusMins(12),
        createdAt: timeMinusMins(12),
      },
    ],
  };

  const conversationsMap = new Map<string, LiveWhatsAppConversation>();
  const messagesMap = new Map<string, LiveWhatsAppMessage[]>();

  const demoCustMeta: Record<string, { name: string; phone: string; area: string; brand: string; model: string; nextDue: string; tds: number }> = {
    'demo-cust-01': {
      name: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      area: 'Madhapur',
      brand: 'Kent',
      model: 'Grand Plus Alkaline RO',
      nextDue: '2026-10-20',
      tds: 65,
    },
    'demo-cust-02': {
      name: 'Sneha Sharma',
      phone: '+91 98481 23456',
      area: 'Jubilee Hills',
      brand: 'Aquaguard',
      model: 'Geneus RO+UV',
      nextDue: '2026-11-15',
      tds: 70,
    },
    'demo-cust-03': {
      name: 'Vikram Reddy',
      phone: '+91 99887 76655',
      area: 'Gachibowli',
      brand: 'Pureit',
      model: 'Copper+ Mineral RO',
      nextDue: '2026-10-01',
      tds: 95,
    },
    'demo-cust-04': {
      name: 'Priya Ananth',
      phone: '+91 91234 56780',
      area: 'Banjara Hills',
      brand: 'Havells',
      model: 'Max Alkaline RO+UV',
      nextDue: '2026-11-10',
      tds: 68,
    },
  };

  for (const [custId, msgs] of Object.entries(initialMessages)) {
    messagesMap.set(custId, msgs);
    const meta = demoCustMeta[custId];
    const lastMsg = msgs[msgs.length - 1];
    const unreadCount = msgs.filter((m) => m.direction === 'INBOUND' && m.status !== 'READ').length;

    conversationsMap.set(custId, {
      customerId: custId,
      customerName: meta?.name || 'Customer',
      phoneNumber: meta?.phone || lastMsg.phoneNumber,
      area: meta?.area,
      purifierBrand: meta?.brand,
      purifierModel: meta?.model,
      nextDueDate: meta?.nextDue,
      outputTds: meta?.tds,
      unreadCount,
      lastMessage: lastMsg.content,
      lastMessageDirection: lastMsg.direction,
      lastMessageStatus: lastMsg.status,
      lastMessageTime: lastMsg.createdAt,
      mediaUrl: lastMsg.mediaUrl,
      mediaType: lastMsg.mediaType,
    });
  }

  global.__mockWhatsAppStore = {
    conversations: conversationsMap,
    messages: messagesMap,
  };

  return global.__mockWhatsAppStore;
}

export function getMockWhatsAppConversations(): LiveWhatsAppConversation[] {
  const store = initMockStore();
  const convs = Array.from(store.conversations.values());
  // Sort descending by last message time
  return convs.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
}

export function getMockWhatsAppThread(customerIdOrPhone: string): {
  customer: {
    id: string;
    fullName: string;
    mobileNumber: string;
    whatsappNumber: string;
    areaLocality?: string;
    city?: string;
  } | null;
  purifier: {
    brand?: string;
    model?: string;
    nextServiceDueDate?: string;
    outputTdsBaseline?: number;
  } | null;
  messages: LiveWhatsAppMessage[];
} {
  const store = initMockStore();
  const formattedTarget = formatWhatsAppPhoneNumber(customerIdOrPhone);

  // Find matching customer key
  let matchedKey = customerIdOrPhone;
  if (!store.messages.has(matchedKey)) {
    for (const [key, conv] of store.conversations.entries()) {
      if (
        conv.customerId === customerIdOrPhone ||
        formatWhatsAppPhoneNumber(conv.phoneNumber) === formattedTarget
      ) {
        matchedKey = key;
        break;
      }
    }
  }

  const msgs = store.messages.get(matchedKey) || [];
  const conv = store.conversations.get(matchedKey);

  const customer = conv
    ? {
        id: conv.customerId || matchedKey,
        fullName: conv.customerName,
        mobileNumber: conv.phoneNumber,
        whatsappNumber: conv.phoneNumber,
        areaLocality: conv.area,
        city: 'Hyderabad',
      }
    : null;

  const purifier = conv
    ? {
        brand: conv.purifierBrand,
        model: conv.purifierModel,
        nextServiceDueDate: conv.nextDueDate,
        outputTdsBaseline: conv.outputTds || undefined,
      }
    : null;

  return { customer, purifier, messages: [...msgs] };
}

export function addMockWhatsAppMessage(
  msg: Partial<LiveWhatsAppMessage> & {
    customerName?: string;
    area?: string;
    purifierBrand?: string;
    purifierModel?: string;
    nextDueDate?: string;
    outputTds?: number | null;
  }
): LiveWhatsAppMessage {
  const store = initMockStore();
  const targetKey = msg.customerId || formatWhatsAppPhoneNumber(msg.phoneNumber || 'unknown');

  const nowIso = new Date().toISOString();
  const newMsg: LiveWhatsAppMessage = {
    id: msg.id || `msg-live-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    businessId: msg.businessId || 'biz-demo-ro',
    customerId: msg.customerId || targetKey,
    phoneNumber: msg.phoneNumber || '',
    direction: msg.direction || 'OUTBOUND',
    messageType: msg.messageType || 'TEXT',
    templateName: msg.templateName || null,
    content: msg.content || '',
    mediaUrl: msg.mediaUrl || null,
    mediaType: msg.mediaType || null,
    providerMessageId: msg.providerMessageId || `wamid-${Date.now()}`,
    status: msg.status || (msg.direction === 'OUTBOUND' ? 'DELIVERED' : 'RECEIVED'),
    sentAt: nowIso,
    deliveredAt: msg.direction === 'OUTBOUND' ? nowIso : null,
    readAt: null,
    createdAt: nowIso,
  };

  const list = store.messages.get(targetKey) || [];
  list.push(newMsg);
  store.messages.set(targetKey, list);

  // Update conversation entry
  const existingConv = store.conversations.get(targetKey);
  const unreadCount = list.filter((m) => m.direction === 'INBOUND' && m.status !== 'READ').length;

  if (existingConv) {
    store.conversations.set(targetKey, {
      ...existingConv,
      customerName: msg.customerName || existingConv.customerName,
      area: msg.area || existingConv.area,
      purifierBrand: msg.purifierBrand || existingConv.purifierBrand,
      purifierModel: msg.purifierModel || existingConv.purifierModel,
      nextDueDate: msg.nextDueDate || existingConv.nextDueDate,
      outputTds: msg.outputTds !== undefined ? msg.outputTds : existingConv.outputTds,
      lastMessage: newMsg.content,
      lastMessageDirection: newMsg.direction,
      lastMessageStatus: newMsg.status,
      lastMessageTime: newMsg.createdAt,
      unreadCount,
      mediaUrl: newMsg.mediaUrl,
      mediaType: newMsg.mediaType,
    });
  } else {
    store.conversations.set(targetKey, {
      customerId: msg.customerId || null,
      customerName: msg.customerName || 'Customer',
      phoneNumber: newMsg.phoneNumber,
      area: msg.area,
      purifierBrand: msg.purifierBrand,
      purifierModel: msg.purifierModel,
      nextDueDate: msg.nextDueDate,
      outputTds: msg.outputTds,
      unreadCount,
      lastMessage: newMsg.content,
      lastMessageDirection: newMsg.direction,
      lastMessageStatus: newMsg.status,
      lastMessageTime: newMsg.createdAt,
      mediaUrl: newMsg.mediaUrl,
      mediaType: newMsg.mediaType,
    });
  }

  return newMsg;
}

export function markMockThreadAsRead(customerIdOrPhone: string): number {
  const store = initMockStore();
  let matchedKey = customerIdOrPhone;
  const formattedTarget = formatWhatsAppPhoneNumber(customerIdOrPhone);

  if (!store.messages.has(matchedKey)) {
    for (const [key, conv] of store.conversations.entries()) {
      if (
        conv.customerId === customerIdOrPhone ||
        formatWhatsAppPhoneNumber(conv.phoneNumber) === formattedTarget
      ) {
        matchedKey = key;
        break;
      }
    }
  }

  const msgs = store.messages.get(matchedKey);
  if (!msgs) return 0;

  let count = 0;
  for (const m of msgs) {
    if (m.direction === 'INBOUND' && m.status !== 'READ') {
      m.status = 'READ';
      m.readAt = new Date().toISOString();
      count++;
    }
  }

  const conv = store.conversations.get(matchedKey);
  if (conv) {
    conv.unreadCount = 0;
    if (conv.lastMessageDirection === 'INBOUND') {
      conv.lastMessageStatus = 'READ';
    }
  }

  return count;
}

export function getMockTotalUnreadCount(): number {
  const store = initMockStore();
  let count = 0;
  for (const conv of store.conversations.values()) {
    count += conv.unreadCount || 0;
  }
  return count;
}
