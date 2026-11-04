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

  const conversationsMap = new Map<string, LiveWhatsAppConversation>();
  const messagesMap = new Map<string, LiveWhatsAppMessage[]>();

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
    businessId: msg.businessId || 'biz-client-ro',
    customerId: msg.customerId || targetKey,
    phoneNumber: msg.phoneNumber || '',
    direction: msg.direction || 'OUTBOUND',
    messageType: msg.messageType || 'TEXT',
    templateName: msg.templateName || null,
    content: msg.content || '',
    mediaUrl: msg.mediaUrl || null,
    mediaType: msg.mediaType || null,
    mediaFilename: msg.mediaFilename || null,
    interactiveData: msg.interactiveData || null,
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
  const lastInboundTime = msg.direction === 'INBOUND' ? nowIso : existingConv?.lastInboundTime || null;

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
      lastInboundTime,
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
      lastInboundTime,
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
