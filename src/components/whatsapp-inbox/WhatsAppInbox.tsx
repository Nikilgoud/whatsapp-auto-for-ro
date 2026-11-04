'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Customer, Purifier, LiveWhatsAppConversation, LiveWhatsAppMessage, Invoice } from '@/types';
import { useApp } from '@/context/AppContext';
import { appendBusinessFooter } from '@/lib/services/whatsappEngine';
import { formatDateDDMMYYYY, generateCustomerCode } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import {
  MessageSquare,
  Search,
  Check,
  CheckCheck,
  Send,
  Paperclip,
  Phone,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Clock,
  AlertCircle,
  ExternalLink,
  Droplets,
  Calendar,
  X,
  FileCheck,
  PlusCircle,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  QrCode,
  Wrench,
  Settings,
  Radio,
  HelpCircle,
  CheckCircle2,
  ListOrdered,
  LayoutGrid,
  Share2,
  Zap,
  Copy,
  ChevronDown,
  ChevronUp,
  Filter,
  SlidersHorizontal,
  CreditCard,
} from 'lucide-react';

interface WhatsAppInboxProps {
  onSelectCustomer?: (customer: Customer) => void;
  onOpenScheduleService?: (customer: Customer) => void;
  onOpenCreateInvoice?: (customer: Customer) => void;
}

// ---------------------------------------------------------------------------
// Meta Approved WhatsApp Business Cloud API Templates (English Only)
// ---------------------------------------------------------------------------
interface TemplateItem {
  id: string;
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  title: string;
  description: string;
  buildText: (params: {
    customerName: string;
    businessName: string;
    purifierBrand: string;
    purifierModel: string;
    dueDate: string;
    outputTds: number;
    amount?: number;
    technicianName?: string;
  }) => string;
}

const META_APPROVED_TEMPLATES: TemplateItem[] = [
  {
    id: 'ro_service_due_alert',
    name: 'ro_service_due_alert',
    category: 'UTILITY',
    title: 'RO Service Due Reminder',
    description: 'Notifies customer when their periodic RO service is due to protect membrane and health.',
    buildText: ({ customerName, businessName, purifierBrand, dueDate }) =>
      `Hi ${customerName}, greetings from ${businessName}! 💧\n\nYour ${purifierBrand} RO Water Purifier is due for its periodic service on ${dueDate}.\n\nRegular service maintains pure drinking water and extends filter life. Would you like to schedule a technician visit this week?\n\nReply YES to confirm your appointment.`,
  },
  {
    id: 'technician_dispatched_notice',
    name: 'technician_dispatched_notice',
    category: 'UTILITY',
    title: 'Technician Dispatched Alert',
    description: 'Informs customer that a certified technician is en route to their doorstep.',
    buildText: ({ customerName, businessName, purifierBrand, purifierModel, technicianName }) =>
      `Dear ${customerName}, our certified service technician ${technicianName ? `(${technicianName})` : ''} is on the way to your doorstep for your ${purifierBrand} ${purifierModel} service. 🛵\n\nExpected arrival within 15-25 minutes. Thank you for choosing ${businessName}!`,
  },
  {
    id: 'service_completed_invoice',
    name: 'service_completed_invoice',
    category: 'UTILITY',
    title: 'Service Completed & Digital Bill',
    description: 'Post-service signoff with TDS calibration and digital warranty invoice link.',
    buildText: ({ customerName, businessName, purifierBrand, outputTds, amount }) =>
      `Hello ${customerName}, your ${purifierBrand} RO service has been successfully completed! ✨🚰\n\nPure water output TDS has been calibrated to ${outputTds} ppm (WHO Safe Drinking Benchmark: 50-150 ppm).${amount ? `\nService Total: ₹${amount}` : ''}\n\nYour digital warranty bill & service summary are ready. Thank you for trusting ${businessName}!`,
  },
  {
    id: 'water_tds_certificate',
    name: 'water_tds_certificate',
    category: 'UTILITY',
    title: 'Water Purity & TDS Certificate',
    description: 'Shares certified water test reading and mineral safety benchmark.',
    buildText: ({ customerName, businessName, purifierBrand, purifierModel, outputTds }) =>
      `Water Purity Report for ${customerName}: 🧪💧\n\nPurifier: ${purifierBrand} ${purifierModel}\nTested Output TDS: ${outputTds} ppm\nPurity Status: 100% Pure, Safe & Mineral-Rich.\nWHO Drinking Guideline: 50 - 150 ppm (Excellent)\n\nCertified by ${businessName} Water Quality Care.`,
  },
  {
    id: 'amc_annual_renewal_offer',
    name: 'amc_annual_renewal_offer',
    category: 'MARKETING',
    title: 'Annual Maintenance Contract (AMC) Offer',
    description: 'Annual coverage proposal with 3 free routine visits and filter replacement cover.',
    buildText: ({ customerName, businessName, purifierBrand, dueDate }) =>
      `Protect your purifier year-round! 🛡️\n\nDear ${customerName}, ensure uninterrupted pure water with our Comprehensive AMC Plan for your ${purifierBrand} RO (due ${dueDate}).\n\nIncludes:\n• 3 Free Scheduled Preventive Services\n• Sediment & Carbon Filter Replacements\n• Free Breakdown Visits & Electrical Check\n\nReply AMC to activate your special discount with ${businessName}.`,
  },
  {
    id: 'customer_reengagement_hello',
    name: 'customer_reengagement_hello',
    category: 'UTILITY',
    title: '24h Window Re-engagement Prompt',
    description: 'Approved prompt to reopen the Meta 24-hour customer communication window.',
    buildText: ({ customerName, businessName, purifierBrand }) =>
      `Hello ${customerName}, greetings from ${businessName} RO Care Support! 👋\n\nWe are checking in regarding your ${purifierBrand} water purifier. Please reply to this message if you need any service assistance, filter checkup, or water testing. Our team is ready to help!`,
  },
  {
    id: 'payment_receipt_ack',
    name: 'payment_receipt_ack',
    category: 'UTILITY',
    title: 'Payment Receipt Confirmation',
    description: 'Instant payment received acknowledgment with updated balance status.',
    buildText: ({ customerName, businessName, amount }) =>
      `Dear ${customerName}, we have received your payment${amount ? ` of ₹${amount}` : ''} for your RO service. Thank you for choosing ${businessName}! Your official invoice has been marked as Paid.`,
  },
];

// ---------------------------------------------------------------------------
// Standard Canned Responses / Knowledge Snippets (English Only)
// ---------------------------------------------------------------------------
interface CannedSnippet {
  id: string;
  trigger: string;
  title: string;
  category: string;
  text: string;
}

const CANNED_RESPONSES: CannedSnippet[] = [
  {
    id: 'tds-safe-guide',
    trigger: '/tds',
    title: 'Safe TDS Benchmark Guide',
    category: 'Water Quality',
    text: `💧 *Drinking Water TDS Guide (WHO & BIS Standards):*\n• Under 50 ppm: Low minerals\n• 50 - 150 ppm: *Excellent for drinking*\n• 150 - 300 ppm: Good\n• 300 - 500 ppm: Fair\n• Over 500 ppm: *Unsafe / Needs RO filtration*\n\nOur service engineers calibrate your purifier to 80 - 120 ppm for optimal taste and mineral retention.`,
  },
  {
    id: 'spare-rates',
    trigger: '/price',
    title: 'Standard Spare Parts Rate Card',
    category: 'Pricing',
    text: `🔧 *Genuine RO Spare Parts Rate Card:*\n1. 5-Micron Spun Pre-Filter: ₹250\n2. Sediment Filter Cartridge: ₹450\n3. Pre-Carbon Block Cartridge: ₹480\n4. Post-Carbon Polish Filter: ₹380\n5. 80 GPD Filmtec RO Membrane: ₹1,650\n6. 100 GPD Booster Pump: ₹1,850\n7. 24V SMPS Power Adapter: ₹850\n8. General Service Visiting Fee: ₹250\n\nAll spare parts include certified quality guarantee and leak-proof testing.`,
  },
  {
    id: 'bank-upi-details',
    trigger: '/bank',
    title: 'UPI & Bank Payment Details',
    category: 'Billing',
    text: `💳 *Payment Options:*\n• UPI Payment: Send to registered business UPI ID or scan QR code on invoice.\n• Payment Modes: Google Pay, PhonePe, Paytm, BHIM, Net Banking, or Cash.\n• Instant receipt is sent via WhatsApp immediately after payment.`,
  },
  {
    id: 'working-hours',
    trigger: '/hours',
    title: 'Working Hours & Emergency Protocol',
    category: 'Support',
    text: `⏰ *Service Timings & Availability:*\n• Monday to Saturday: 9:00 AM – 7:30 PM\n• Sunday: 10:00 AM – 2:00 PM (Emergency slots only)\n• Doorstep Service Turnaround: Within 2 to 4 hours across city limits.\n• For urgent water leakage, please turn off inlet valve and call us immediately.`,
  },
  {
    id: 'warranty-terms',
    trigger: '/warranty',
    title: 'Warranty & Replacement Terms',
    category: 'Policy',
    text: `📜 *Warranty & Coverage Terms:*\n• New Machine: 12 Months comprehensive warranty covering booster pump, SMPS, and electronic valves.\n• RO Membrane: 6 to 12 Months performance warranty up to 1500 ppm inlet TDS.\n• Consumables (Spun & Carbon filters): 3-month quality defect warranty.\n• Free door-step labour support during active warranty.`,
  },
];

export const WhatsAppInbox: React.FC<WhatsAppInboxProps> = ({
  onSelectCustomer,
  onOpenScheduleService,
  onOpenCreateInvoice,
}) => {
  const { customers, purifiers, invoices, technicians, setUnreadWhatsAppCount, business } = useApp();

  const [conversations, setConversations] = useState<LiveWhatsAppConversation[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LiveWhatsAppMessage[]>([]);
  const [activeCustomerMeta, setActiveCustomerMeta] = useState<Customer | null>(null);
  const [activePurifierMeta, setActivePurifierMeta] = useState<Purifier | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'due' | 'active_window' | 'expired_window'>('all');
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Per-customer draft storage
  const draftsRef = useRef<Record<string, string>>({});
  const prevCustomerIdRef = useRef<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Drawer & Modal States
  const [showSidebar360, setShowSidebar360] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showInteractiveModal, setShowInteractiveModal] = useState<'button' | 'list' | null>(null);
  const [showCannedModal, setShowCannedModal] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showApiDiagnosticsModal, setShowApiDiagnosticsModal] = useState(false);

  // Attachment state
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentType, setAttachmentType] = useState<'image' | 'document' | 'audio'>('image');
  const [attachmentFilename, setAttachmentFilename] = useState('');

  // Interactive Quick Reply state
  const [interactiveHeader, setInteractiveHeader] = useState('');
  const [interactiveBody, setInteractiveBody] = useState('');
  const [interactiveFooter, setInteractiveFooter] = useState('');
  const [interactiveButtons, setInteractiveButtons] = useState<string[]>(['Confirm Slot', 'Reschedule', 'Call Us']);

  // Interactive List Menu state
  const [listButtonTitle, setListButtonTitle] = useState('View Services');
  const [listSectionTitle, setListSectionTitle] = useState('Service & Maintenance');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Fetch all conversations
  const fetchConversations = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoadingConversations(true);
    try {
      const res = await fetch('/api/whatsapp/conversations');
      const data = await res.json();
      if (data?.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
        const totalUnread = data.conversations.reduce(
          (sum: number, c: LiveWhatsAppConversation) => sum + (c.unreadCount || 0),
          0
        );
        if (typeof setUnreadWhatsAppCount === 'function') {
          setUnreadWhatsAppCount(totalUnread);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch WhatsApp conversations:', err);
    } finally {
      if (!isSilent) setIsLoadingConversations(false);
    }
  }, [setUnreadWhatsAppCount]);

  // Fetch message thread for a selected customer
  const fetchThread = useCallback(async (customerIdOrPhone: string, isSilent = false) => {
    if (!isSilent) setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/whatsapp/conversations/${encodeURIComponent(customerIdOrPhone)}`);
      const data = await res.json();
      if (data?.success) {
        setMessages(data.messages || []);

        const appCust = customers.find(
          (c) =>
            c.id === customerIdOrPhone ||
            c.mobileNumber === customerIdOrPhone ||
            c.whatsappNumber === customerIdOrPhone
        );

        if (appCust) {
          setActiveCustomerMeta(appCust);
          const appPurifier = purifiers.find((p) => p.customerId === appCust.id);
          setActivePurifierMeta(appPurifier || null);
        } else if (data.customer) {
          setActiveCustomerMeta({
            id: data.customer.id,
            businessId: 'biz-client-ro',
            customerCode: generateCustomerCode(customers),
            fullName: data.customer.fullName || 'Customer',
            mobileNumber: data.customer.mobileNumber || '',
            whatsappNumber: data.customer.whatsappNumber || '',
            houseFlatNo: '',
            streetAddress: '',
            areaLocality: data.customer.areaLocality || '',
            city: data.customer.city || 'Hyderabad',
            state: 'Telangana',
            pincode: '',
            customerType: 'Residential',
            status: 'Service due',
            tags: [],
            whatsappOptOut: false,
            totalSpend: 0,
            pendingBalance: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          if (data.purifier) {
            setActivePurifierMeta({
              id: 'pur-live',
              businessId: 'biz-client-ro',
              customerId: data.customer.id,
              purifierCode: 'PUR-LIVE',
              brand: data.purifier.brand || 'RO Purifier',
              model: data.purifier.model || 'Standard RO',
              purifierType: 'RO+UV',
              capacityLph: 12,
              installationLocation: 'Kitchen',
              installationDate: new Date().toISOString(),
              currentCondition: 'Good',
              outputTdsBaseline: data.purifier.outputTdsBaseline || 85,
              nextServiceDueDate: data.purifier.nextServiceDueDate || '',
              components: [],
            });
          }
        }

        // Mark read
        fetch(`/api/whatsapp/conversations/${encodeURIComponent(customerIdOrPhone)}`, {
          method: 'PATCH',
        })
          .then(() => {
            setConversations((prev) =>
              prev.map((c) =>
                c.customerId === customerIdOrPhone || c.phoneNumber === customerIdOrPhone
                  ? { ...c, unreadCount: 0 }
                  : c
              )
            );
          })
          .catch(() => {});
      }
    } catch (err) {
      console.warn('Failed to load message thread:', err);
    } finally {
      if (!isSilent) setIsLoadingMessages(false);
      setTimeout(() => scrollToBottom('auto'), 50);
    }
  }, [customers, purifiers, scrollToBottom]);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Auto select first conversation on desktop if none selected
  useEffect(() => {
    if (!selectedCustomerId && conversations.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 1024) {
      const first = conversations[0];
      setSelectedCustomerId(first.customerId || first.phoneNumber);
    }
  }, [conversations, selectedCustomerId]);

  // Fetch thread when customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      fetchThread(selectedCustomerId);
    }
  }, [selectedCustomerId, fetchThread]);

  // Draft persistence
  useEffect(() => {
    const prevId = prevCustomerIdRef.current;
    if (prevId !== null) {
      draftsRef.current[prevId] = inputText;
    }
    const restoredDraft = selectedCustomerId ? (draftsRef.current[selectedCustomerId] ?? '') : '';
    setInputText(restoredDraft);
    prevCustomerIdRef.current = selectedCustomerId;
  }, [selectedCustomerId]);

  // Realtime subscription + fallback polling
  useEffect(() => {
    const channel = supabase
      .channel('realtime:live_whatsapp_inbox')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_messages' }, () => {
        fetchConversations(true);
        if (selectedCustomerId) {
          fetchThread(selectedCustomerId, true);
        }
      })
      .subscribe();

    const interval = setInterval(() => {
      fetchConversations(true);
      if (selectedCustomerId) {
        fetchThread(selectedCustomerId, true);
      }
    }, 6000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchConversations, fetchThread, selectedCustomerId]);

  // Auto-grow textarea
  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }, [inputText]);

  // Active conversation
  const activeConversation = useMemo(() => {
    return conversations.find(
      (c) => c.customerId === selectedCustomerId || c.phoneNumber === selectedCustomerId
    );
  }, [conversations, selectedCustomerId]);

  // Compute Meta 24-Hour Customer Window
  const window24h = useMemo(() => {
    if (!activeConversation) return { isActive: false, text: 'No conversation', hours: 0, mins: 0 };

    let lastInboundDate: Date | null = null;
    if (activeConversation.lastInboundTime) {
      lastInboundDate = new Date(activeConversation.lastInboundTime);
    } else {
      const inboundMsgs = messages.filter((m) => m.direction === 'INBOUND');
      if (inboundMsgs.length > 0) {
        const latest = inboundMsgs[inboundMsgs.length - 1];
        lastInboundDate = new Date(latest.createdAt || latest.sentAt || 0);
      }
    }

    if (!lastInboundDate || isNaN(lastInboundDate.getTime())) {
      return {
        isActive: false,
        text: 'Session Expired (>24h)',
        badge: 'Template Required',
        hours: 0,
        mins: 0,
      };
    }

    const diffMs = Date.now() - lastInboundDate.getTime();
    const windowMs = 24 * 60 * 60 * 1000;
    const remainingMs = windowMs - diffMs;

    if (remainingMs <= 0) {
      return {
        isActive: false,
        text: 'Session Expired (>24h)',
        badge: 'Template Required',
        hours: 0,
        mins: 0,
      };
    }

    const remainingMinutes = Math.floor(remainingMs / (60 * 1000));
    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;

    return {
      isActive: true,
      text: `${hours}h ${mins}m left`,
      badge: '24h Window Open',
      hours,
      mins,
    };
  }, [activeConversation, messages]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        c.customerName.toLowerCase().includes(query) ||
        c.phoneNumber.includes(query) ||
        (c.area && c.area.toLowerCase().includes(query)) ||
        (c.purifierModel && c.purifierModel.toLowerCase().includes(query)) ||
        c.lastMessage.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (filterTab === 'unread') {
        return c.unreadCount > 0;
      }
      if (filterTab === 'due') {
        return !!c.nextDueDate;
      }
      if (filterTab === 'active_window') {
        if (!c.lastInboundTime) return false;
        const diff = Date.now() - new Date(c.lastInboundTime).getTime();
        return diff < 24 * 3600 * 1000;
      }
      if (filterTab === 'expired_window') {
        if (!c.lastInboundTime) return true;
        const diff = Date.now() - new Date(c.lastInboundTime).getTime();
        return diff >= 24 * 3600 * 1000;
      }
      return true;
    });
  }, [conversations, searchQuery, filterTab]);

  // Customer's invoices
  const customerInvoices = useMemo(() => {
    if (!activeCustomerMeta?.id) return [];
    return invoices.filter((i) => i.customerId === activeCustomerMeta.id);
  }, [invoices, activeCustomerMeta]);

  // Dispatch generic message handler
  const handleSendMessage = async (customPayload?: {
    text?: string;
    templateName?: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'document' | 'audio';
    mediaFilename?: string;
    interactiveType?: 'button' | 'list';
    interactiveData?: any;
    parameters?: string[];
  }) => {
    if (!activeConversation || isSending) return;

    const rawContent = customPayload?.text !== undefined ? customPayload.text : inputText;
    const bodyContent = rawContent.trim();

    if (!bodyContent && !customPayload?.mediaUrl && !customPayload?.templateName && !customPayload?.interactiveData) {
      return;
    }

    const finalContent = customPayload?.templateName
      ? `[Template: ${customPayload.templateName}]`
      : customPayload?.interactiveType === 'button'
      ? customPayload.interactiveData?.bodyText || 'Interactive Buttons'
      : customPayload?.interactiveType === 'list'
      ? customPayload.interactiveData?.bodyText || 'Interactive List'
      : customPayload?.mediaUrl && !bodyContent
      ? `Attachment (${customPayload.mediaFilename || 'Document'})`
      : appendBusinessFooter(bodyContent, business);

    setIsSending(true);
    const tempId = `temp-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const optimisticMsg: LiveWhatsAppMessage = {
      id: tempId,
      businessId: business?.id || 'biz-client-ro',
      customerId: activeConversation.customerId,
      phoneNumber: activeConversation.phoneNumber,
      direction: 'OUTBOUND',
      messageType: customPayload?.interactiveType === 'button'
        ? 'INTERACTIVE_BUTTON'
        : customPayload?.interactiveType === 'list'
        ? 'INTERACTIVE_LIST'
        : customPayload?.templateName
        ? 'TEMPLATE'
        : customPayload?.mediaUrl
        ? 'MEDIA'
        : 'TEXT',
      templateName: customPayload?.templateName || null,
      content: finalContent,
      mediaUrl: customPayload?.mediaUrl || attachmentUrl || undefined,
      mediaType: customPayload?.mediaType || (attachmentUrl ? attachmentType : undefined),
      mediaFilename: customPayload?.mediaFilename || attachmentFilename || undefined,
      interactiveData: customPayload?.interactiveData || null,
      status: 'SENT',
      createdAt: nowIso,
      sentAt: nowIso,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    if (!customPayload) {
      setInputText('');
      if (selectedCustomerId) {
        delete draftsRef.current[selectedCustomerId];
      }
      setAttachmentUrl('');
      setAttachmentFilename('');
      setShowAttachmentModal(false);
    }
    setTimeout(() => scrollToBottom('smooth'), 60);

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: activeConversation.phoneNumber,
          customerId: activeConversation.customerId,
          customerName: activeConversation.customerName,
          area: activeConversation.area,
          purifierBrand: activeConversation.purifierBrand,
          purifierModel: activeConversation.purifierModel,
          nextDueDate: activeConversation.nextDueDate,
          outputTds: activeConversation.outputTds,
          bodyText: bodyContent || undefined,
          templateName: customPayload?.templateName,
          languageCode: 'en',
          parameters: customPayload?.parameters,
          mediaUrl: customPayload?.mediaUrl || attachmentUrl || undefined,
          mediaType: customPayload?.mediaType || (attachmentUrl ? attachmentType : undefined),
          mediaFilename: customPayload?.mediaFilename || attachmentFilename || undefined,
          interactiveType: customPayload?.interactiveType,
          interactiveData: customPayload?.interactiveData,
        }),
      });

      const data = await res.json();
      if (data?.success && data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...data.message, status: 'DELIVERED' } : m))
        );
        fetchConversations(true);
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...m,
                  status: 'FAILED',
                  errorMessage: data?.error || 'Failed to dispatch via Meta WhatsApp API',
                }
              : m
          )
        );
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                ...m,
                status: 'FAILED',
                errorMessage: err?.message || 'Network error dispatching message',
              }
            : m
        )
      );
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Send approved Meta template
  const handleSendTemplate = (tpl: TemplateItem) => {
    const custName = activeConversation?.customerName || 'Customer';
    const brand = activeConversation?.purifierBrand || 'RO';
    const model = activeConversation?.purifierModel || 'Purifier';
    const dueDate = activeConversation?.nextDueDate
      ? formatDateDDMMYYYY(activeConversation.nextDueDate)
      : 'this month';
    const tds = activeConversation?.outputTds || 85;
    const bName = business?.name || 'Water Care';
    const techName = technicians[0]?.name || 'Certified RO Technician';

    const rendered = tpl.buildText({
      customerName: custName,
      businessName: bName,
      purifierBrand: brand,
      purifierModel: model,
      dueDate,
      outputTds: tds,
      technicianName: techName,
      amount: customerInvoices[0]?.balanceDue || 450,
    });

    handleSendMessage({
      templateName: tpl.name,
      text: rendered,
      parameters: [custName, brand, dueDate, String(tds)],
    });

    setShowTemplateModal(false);
  };

  // Send Interactive Quick Reply Buttons
  const handleSendInteractiveButtons = () => {
    if (!interactiveBody.trim()) return;

    const filteredButtons = interactiveButtons
      .filter((b) => b.trim().length > 0)
      .slice(0, 3)
      .map((title, idx) => ({
        id: `btn_${idx + 1}_${Date.now()}`,
        title: title.trim().slice(0, 20),
      }));

    if (filteredButtons.length === 0) return;

    handleSendMessage({
      interactiveType: 'button',
      interactiveData: {
        headerText: interactiveHeader.trim() || undefined,
        bodyText: interactiveBody.trim(),
        footerText: interactiveFooter.trim() || undefined,
        buttons: filteredButtons,
      },
    });

    setShowInteractiveModal(null);
    setInteractiveHeader('');
    setInteractiveBody('');
    setInteractiveFooter('');
  };

  // Send Interactive Service List Menu
  const handleSendInteractiveList = (presetType: 'service' | 'diagnostic') => {
    const bName = business?.name || 'RO Service';

    let listData: any;
    if (presetType === 'service') {
      listData = {
        headerText: `🚰 ${bName} Service Catalog`,
        bodyText:
          'Please select the service or maintenance option you require. Our certified engineer will confirm your slot immediately:',
        footerText: 'Genuine parts • 100% pure water warranty',
        listButtonTitle: 'View Service Menu',
        sections: [
          {
            title: 'Maintenance & Service',
            rows: [
              { id: 'srv_periodic', title: 'Routine RO Service', description: 'Complete 12-point inspection & sanitization (₹350)' },
              { id: 'srv_filter', title: 'Filter Replacement', description: 'Sediment & Activated Carbon cartridge change (₹650)' },
              { id: 'srv_membrane', title: 'RO Membrane Change', description: 'Original 80 GPD Filmtec membrane install (₹1,500)' },
            ],
          },
          {
            title: 'Repairs & Breakdown',
            rows: [
              { id: 'srv_leak', title: 'Water Leakage Repair', description: 'Emergency piping, connector & valve fix' },
              { id: 'srv_pump', title: 'Booster Pump Service', description: 'Motor, SMPS adapter or electrical repair' },
              { id: 'srv_taste', title: 'High TDS / Taste Issue', description: 'Digital water quality test & TDS recalibration' },
            ],
          },
          {
            title: 'Annual Contracts (AMC)',
            rows: [
              { id: 'srv_amc', title: '1-Year Comprehensive AMC', description: '3 Free visits + free filters + breakdown cover' },
            ],
          },
        ],
      };
    } else {
      listData = {
        headerText: '🔍 Water Quality Diagnostics',
        bodyText: 'Select the issue you are experiencing with your water purifier:',
        footerText: 'Doorstep technician response in 2-4 hours',
        listButtonTitle: 'Select Purifier Issue',
        sections: [
          {
            title: 'Water Symptoms',
            rows: [
              { id: 'diag_taste', title: 'Bad Taste / Odour', description: 'Carbon exhaustion or bacterial accumulation' },
              { id: 'diag_flow', title: 'Very Slow Water Flow', description: 'Choked pre-filter or membrane fouling' },
              { id: 'diag_tds', title: 'TDS Level Too High', description: 'Water reading above 150 ppm' },
            ],
          },
          {
            title: 'Machine Failures',
            rows: [
              { id: 'diag_power', title: 'Purifier Not Powering On', description: 'SMPS adapter failure or loose wiring' },
              { id: 'diag_leak', title: 'Continuous Water Leakage', description: 'Auto cut-off valve or pipe burst' },
              { id: 'diag_noise', title: 'Loud Pump Vibrations', description: 'Booster pump head airlock or wear' },
            ],
          },
        ],
      };
    }

    handleSendMessage({
      interactiveType: 'list',
      interactiveData: listData,
    });

    setShowInteractiveModal(null);
  };

  // Format relative timestamp
  const formatMsgTime = (timestamp?: string | null) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (60 * 1000));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      if (diffDays === 1) return 'Yesterday';
      return formatDateDDMMYYYY(date);
    } catch {
      return '';
    }
  };

  // Render Delivery Status Icon
  const renderStatusIcon = (status: LiveWhatsAppMessage['status'], errorMessage?: string | null) => {
    switch (status) {
      case 'READ':
        return (
          <span title="Read by customer">
            <CheckCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          </span>
        );
      case 'DELIVERED':
        return (
          <span title="Delivered to device">
            <CheckCheck className="w-4 h-4 text-slate-300 dark:text-slate-400 shrink-0" />
          </span>
        );
      case 'SENT':
        return (
          <span title="Accepted by Meta Cloud API">
            <Check className="w-4 h-4 text-slate-300 dark:text-slate-400 shrink-0" />
          </span>
        );
      case 'FAILED':
        return (
          <span
            title={errorMessage || 'Meta Cloud API Error: Outside 24h window or invalid number'}
            className="cursor-help"
          >
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          </span>
        );
      default:
        return (
          <span title="Queued with Meta">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 animate-pulse" />
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-9.5rem)] sm:h-[calc(100dvh-8rem)] lg:h-[calc(100dvh-7.5rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* =================================================================== */}
      {/* TOP HEADER: CLOUD API HEALTH BAR & GLOBAL STATS                    */}
      {/* =================================================================== */}
      <div className="px-4 py-2.5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-tight">WhatsApp Business API Command Center</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Meta Cloud API Live
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active 24h window indicator if conversation selected */}
          {activeConversation && (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                window24h.isActive
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                  : 'bg-amber-950/40 text-amber-300 border-amber-800/60'
              }`}
              title={
                window24h.isActive
                  ? 'Customer messaged recently. Free-form messaging is active.'
                  : 'Meta Policy: Customer has not messaged in >24 hours. Pre-approved Template required.'
              }
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{window24h.text}</span>
            </div>
          )}

          <button
            onClick={() => setShowNewChatModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>

          <button
            onClick={() => setShowApiDiagnosticsModal(true)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Meta API Diagnostics & Webhook Credentials"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => fetchConversations()}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Refresh sync"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingConversations ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MAIN CONTAINER: LEFT LIST + CENTER CHAT + RIGHT 360 DRAWER          */}
      {/* =================================================================== */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* ================================================================= */}
        {/* LEFT PANE: CONVERSATION STREAM                                   */}
        {/* ================================================================= */}
        <div
          className={`${
            selectedCustomerId ? 'hidden lg:flex' : 'flex'
          } w-full lg:w-96 xl:w-[410px] flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shrink-0`}
        >
          {/* Search Box */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="relative mb-2.5">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer, phone, model, area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-900 dark:text-white placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-semibold overflow-x-auto scrollbar-none">
              <button
                onClick={() => setFilterTab('all')}
                className={`py-1 px-2 rounded-lg shrink-0 transition-all ${
                  filterTab === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({conversations.length})
              </button>
              <button
                onClick={() => setFilterTab('unread')}
                className={`py-1 px-2 rounded-lg shrink-0 transition-all flex items-center gap-1 ${
                  filterTab === 'unread'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Unread
                {conversations.filter((c) => c.unreadCount > 0).length > 0 && (
                  <span className="bg-emerald-500 text-white text-[9px] px-1.5 rounded-full font-bold">
                    {conversations.filter((c) => c.unreadCount > 0).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilterTab('due')}
                className={`py-1 px-2 rounded-lg shrink-0 transition-all ${
                  filterTab === 'due'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Service Due
              </button>
              <button
                onClick={() => setFilterTab('active_window')}
                className={`py-1 px-2 rounded-lg shrink-0 transition-all ${
                  filterTab === 'active_window'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🟢 24h Open
              </button>
              <button
                onClick={() => setFilterTab('expired_window')}
                className={`py-1 px-2 rounded-lg shrink-0 transition-all ${
                  filterTab === 'expired_window'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ⏱️ Expired
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-thin">
            {isLoadingConversations && conversations.length === 0 ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Syncing live conversations from Meta Cloud...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No conversations in this view</p>
                <p className="text-[11px] text-slate-400 mt-1">Click &apos;+ New Chat&apos; above to start messaging any customer</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected =
                  selectedCustomerId === conv.customerId || selectedCustomerId === conv.phoneNumber;
                const initials = conv.customerName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || 'RO';

                const isInboundOpen = conv.lastInboundTime
                  ? Date.now() - new Date(conv.lastInboundTime).getTime() < 24 * 3600 * 1000
                  : false;

                return (
                  <button
                    key={conv.customerId || conv.phoneNumber}
                    onClick={() => setSelectedCustomerId(conv.customerId || conv.phoneNumber)}
                    className={`w-full text-left p-3 transition-all flex items-start gap-3 select-none ${
                      isSelected
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-l-4 border-emerald-500'
                        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="relative shrink-0 mt-0.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        {initials}
                      </div>
                      {conv.unreadCount > 0 ? (
                        <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      ) : (
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white dark:border-slate-900 ${
                            isInboundOpen ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                          title={isInboundOpen ? '24h session open' : 'Session expired'}
                        ></span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {conv.customerName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatMsgTime(conv.lastMessageTime)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 mb-1 flex-wrap">
                        {conv.area && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                            {conv.area}
                          </span>
                        )}
                        {conv.purifierModel && (
                          <span className="text-[9px] font-medium px-1.5 py-0.2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded truncate max-w-[120px]">
                            {conv.purifierBrand ? `${conv.purifierBrand} ` : ''}
                            {conv.purifierModel}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        {conv.lastMessageDirection === 'OUTBOUND' && (
                          <span className="shrink-0">{renderStatusIcon(conv.lastMessageStatus)}</span>
                        )}
                        <p className={`text-[11px] truncate ${conv.unreadCount > 0 ? 'font-bold text-slate-900 dark:text-white' : ''}`}>
                          {conv.lastMessage || 'Interactive Message'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* CENTER PANE: ACTIVE CHAT THREAD                                  */}
        {/* ================================================================= */}
        <div
          className={`${
            !selectedCustomerId ? 'hidden lg:flex' : 'flex'
          } flex-1 flex-col bg-slate-50/50 dark:bg-slate-950/60 min-w-0 h-full`}
        >
          {activeConversation ? (
            <>
              {/* Active Chat Header */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0 z-10 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={() => setSelectedCustomerId(null)}
                    className="p-1 -ml-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 rounded-lg lg:hidden"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {activeConversation.customerName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'RO'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {activeConversation.customerName}
                      </h3>
                      <a
                        href={`tel:${activeConversation.phoneNumber}`}
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        {activeConversation.phoneNumber}
                      </a>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 flex-wrap">
                      {activeConversation.purifierModel && (
                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium">
                          <Droplets className="w-3 h-3 text-cyan-500" />
                          {activeConversation.purifierBrand ? `${activeConversation.purifierBrand} ` : ''}
                          {activeConversation.purifierModel}
                        </span>
                      )}
                      {activeConversation.outputTds !== undefined && activeConversation.outputTds !== null && (
                        <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-semibold">
                          TDS: {activeConversation.outputTds} ppm
                        </span>
                      )}
                      {activeConversation.nextDueDate && (
                        <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-semibold">
                          Due: {formatDateDDMMYYYY(activeConversation.nextDueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors"
                    title="Send pre-approved Meta Template"
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Templates</span>
                  </button>

                  <button
                    onClick={() => setShowSidebar360(!showSidebar360)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                      showSidebar360
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                    }`}
                    title="Toggle Customer 360° & Quick Actions Drawer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>360° CRM</span>
                  </button>
                </div>
              </div>

              {/* Meta 24-Hour Policy Notice Banner (If Window Expired) */}
              {!window24h.isActive && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 px-4 py-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>
                      <strong>24-Hour Session Lapsed:</strong> Free-form messaging requires a customer response. Send an official WhatsApp Template to re-open the window.
                    </span>
                  </div>
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="ml-2 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shrink-0 text-[11px] shadow-xs"
                  >
                    Send Template
                  </button>
                </div>
              )}

              {/* Message Bubble History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
                {isLoadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                    <p className="text-xs">Loading WhatsApp thread...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                    <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-medium">No messages yet with {activeConversation.customerName}</p>
                    <p className="text-xs text-slate-400">Send an approved WhatsApp template or quick reply below</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOutbound = msg.direction === 'OUTBOUND';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                            isOutbound
                              ? 'bg-emerald-600 text-white rounded-tr-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700/80 rounded-tl-xs'
                          }`}
                        >
                          {/* Template Header Badge */}
                          {msg.templateName && (
                            <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200 dark:text-emerald-300">
                              <ShieldCheck className="w-3 h-3" />
                              Official Meta Template ({msg.templateName})
                            </div>
                          )}

                          {/* Media Preview / Document Attachment */}
                          {msg.mediaUrl && (
                            <div className="mb-2 overflow-hidden rounded-xl bg-slate-900/10 dark:bg-slate-950/40">
                              {msg.mediaType === 'image' ? (
                                <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={msg.mediaUrl}
                                    alt="Attachment"
                                    className="max-h-56 w-full object-cover rounded-xl hover:opacity-95"
                                  />
                                </a>
                              ) : (
                                <a
                                  href={msg.mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                                >
                                  <FileText className="w-5 h-5 shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold underline truncate">
                                      {msg.mediaFilename || 'Invoice_Document.pdf'}
                                    </p>
                                    <p className="text-[10px] opacity-80">Click to view / download PDF</p>
                                  </div>
                                  <ExternalLink className="w-3.5 h-3.5 ml-auto shrink-0" />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Interactive List Rendering */}
                          {msg.messageType === 'INTERACTIVE_LIST' && msg.interactiveData && (
                            <div className="mb-2 p-2.5 bg-black/10 dark:bg-black/20 rounded-xl border border-white/20">
                              <div className="text-xs font-bold mb-1 flex items-center gap-1.5">
                                <ListOrdered className="w-3.5 h-3.5" />
                                {msg.interactiveData.headerText || 'Service Menu'}
                              </div>
                              <p className="text-xs mb-2">{msg.interactiveData.bodyText}</p>
                              <div className="space-y-1">
                                {(msg.interactiveData.sections || []).map((sec: any, sIdx: number) => (
                                  <div key={sIdx} className="text-[11px]">
                                    <div className="font-semibold text-emerald-200 dark:text-emerald-300">
                                      {sec.title}:
                                    </div>
                                    {(sec.rows || []).map((row: any, rIdx: number) => (
                                      <div key={rIdx} className="ml-2 py-0.5 border-l-2 border-white/30 pl-2">
                                        • <strong>{row.title}</strong>
                                        {row.description && ` — ${row.description}`}
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 text-center py-1 bg-white/20 rounded text-[11px] font-bold">
                                🔘 {msg.interactiveData.listButtonTitle || 'View Options'}
                              </div>
                            </div>
                          )}

                          {/* Message Body Content */}
                          {msg.messageType !== 'INTERACTIVE_LIST' && (
                            <p className="whitespace-pre-wrap leading-relaxed select-text">{msg.content}</p>
                          )}

                          {/* Interactive Buttons Rendering */}
                          {msg.messageType === 'INTERACTIVE_BUTTON' && msg.interactiveData?.buttons && (
                            <div className="mt-2.5 pt-2 border-t border-white/20 flex flex-col gap-1.5">
                              {msg.interactiveData.buttons.map((b: any, bIdx: number) => (
                                <div
                                  key={bIdx}
                                  className="w-full py-1.5 px-3 bg-white/15 dark:bg-white/10 hover:bg-white/25 rounded-lg text-xs font-bold text-center border border-white/20 transition-colors shadow-xs"
                                >
                                  {b.title}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Timestamp & Status Icon */}
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                              isOutbound ? 'text-emerald-100' : 'text-slate-400'
                            }`}
                          >
                            <span>{formatMsgTime(msg.createdAt || msg.sentAt)}</span>
                            {isOutbound && renderStatusIcon(msg.status, msg.errorMessage)}
                          </div>
                        </div>

                        {/* Error detail banner if delivery failed */}
                        {isOutbound && msg.status === 'FAILED' && msg.errorMessage && (
                          <div className="text-[10px] text-rose-500 flex items-center gap-1 mt-1 max-w-[70%]">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{msg.errorMessage}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions Bar (Templates, Buttons, Lists, Invoices, Snippets) */}
              <div className="px-3.5 py-2 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs shrink-0 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  API Tools:
                </span>

                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0 transition-all active:scale-95"
                >
                  <FileText className="w-3 h-3" />
                  Official Templates
                </button>

                <button
                  onClick={() => {
                    setInteractiveHeader('Service Appointment');
                    setInteractiveBody(
                      `Hello ${activeConversation.customerName}, your RO periodic maintenance slot is available tomorrow. Please confirm if this works:`
                    );
                    setInteractiveButtons(['Confirm Slot', 'Reschedule', 'Call Us']);
                    setShowInteractiveModal('button');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0 transition-all active:scale-95"
                >
                  <Radio className="w-3 h-3" />
                  Quick Reply Buttons
                </button>

                <button
                  onClick={() => handleSendInteractiveList('service')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shrink-0 transition-all active:scale-95"
                >
                  <ListOrdered className="w-3 h-3" />
                  Service Menu List
                </button>

                <button
                  onClick={() => setShowCannedModal(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0 transition-all active:scale-95"
                >
                  <Zap className="w-3 h-3" />
                  Canned Replies (/shortcuts)
                </button>

                <button
                  onClick={() => {
                    const storeAddress = business.address || 'Hitech City, Madhapur, Hyderabad';
                    const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(storeAddress)}`;
                    handleSendMessage({
                      text: `📍 *Our Service Center Location:*\n${business.name || 'RO Purifier Service'}\n${storeAddress}\n\nGoogle Maps: ${mapUrl}`,
                    });
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0 transition-all active:scale-95"
                >
                  <Share2 className="w-3 h-3 text-red-500" />
                  Share Location
                </button>
              </div>

              {/* Message Composer */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                {/* Media Attachment Drawer */}
                {showAttachmentModal && (
                  <div className="mb-3 p-3 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-emerald-500" />
                        Attach Document / Invoice / Image
                      </span>
                      <button onClick={() => setShowAttachmentModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {customerInvoices.length > 0 && (
                      <div className="mb-2 p-2 bg-white dark:bg-slate-700/60 rounded-lg border border-slate-200 dark:border-slate-600">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                          1-Click Attach Customer Invoice:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {customerInvoices.map((inv) => (
                            <button
                              key={inv.id}
                              onClick={() => {
                                setAttachmentUrl(`https://api.aquapurero.in/invoices/${inv.invoiceNumber}.pdf`);
                                setAttachmentFilename(`Invoice_${inv.invoiceNumber}.pdf`);
                                setAttachmentType('document');
                              }}
                              className="px-2 py-1 text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-100"
                            >
                              📄 {inv.invoiceNumber} (₹{inv.total})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={attachmentType}
                        onChange={(e) => setAttachmentType(e.target.value as any)}
                        className="text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                      >
                        <option value="image">Image (Photo / Proof)</option>
                        <option value="document">Document / PDF Invoice</option>
                        <option value="audio">Voice / Audio Note</option>
                      </select>

                      <input
                        type="url"
                        placeholder="Attachment URL (e.g. https://.../invoice.pdf or image link)"
                        value={attachmentUrl}
                        onChange={(e) => setAttachmentUrl(e.target.value)}
                        className="flex-1 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white placeholder-slate-400"
                      />

                      <input
                        type="text"
                        placeholder="File Name (e.g. Invoice.pdf)"
                        value={attachmentFilename}
                        onChange={(e) => setAttachmentFilename(e.target.value)}
                        className="w-40 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <button
                    onClick={() => setShowAttachmentModal(!showAttachmentModal)}
                    className={`p-2.5 rounded-xl border transition-colors shrink-0 ${
                      showAttachmentModal || attachmentUrl
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                    title="Attach File or Invoice"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      rows={2}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={`Message ${activeConversation.customerName} via WhatsApp (Type / for shortcuts)...`}
                      className="w-full resize-none min-h-[48px] max-h-40 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-900 dark:text-white placeholder-slate-400 leading-relaxed"
                    />
                  </div>

                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isSending || (!inputText.trim() && !attachmentUrl)}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-600/20 shrink-0 active:scale-95"
                    title="Send WhatsApp Message"
                  >
                    {isSending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Select a conversation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                Choose a customer from the left list to review real-time WhatsApp history, send interactive templates, and dispatch service jobs.
              </p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                + Start New WhatsApp Conversation
              </button>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* RIGHT DRAWER: CUSTOMER 360° & IN-CHAT CRM ACTIONS                 */}
        {/* ================================================================= */}
        {showSidebar360 && activeConversation && (
          <div className="w-80 xl:w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shrink-0 animate-in slide-in-from-right-4 duration-200 shadow-lg z-20 overflow-y-auto">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-500" />
                Customer 360° CRM Intelligence
              </span>
              <button
                onClick={() => setShowSidebar360(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Identity Card */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {activeCustomerMeta?.fullName || activeConversation.customerName}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded font-bold">
                    {activeCustomerMeta?.customerCode || 'CUST-LIVE'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                  <Phone className="w-3 h-3 text-emerald-500" />
                  {activeConversation.phoneNumber}
                </p>
                {activeCustomerMeta?.areaLocality && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    📍 {activeCustomerMeta.areaLocality}, {activeCustomerMeta.city}
                  </p>
                )}
              </div>

              {/* Machine Specs Card */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-cyan-500" />
                  RO Purifier Machine Details
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Brand / Model:</span>
                    <span className="font-semibold">{activePurifierMeta?.brand || activeConversation.purifierBrand || 'RO'} {activePurifierMeta?.model || activeConversation.purifierModel || ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Baseline Output TDS:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {activePurifierMeta?.outputTdsBaseline || activeConversation.outputTds || 85} ppm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Next Service Due:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {activePurifierMeta?.nextServiceDueDate ? formatDateDDMMYYYY(activePurifierMeta.nextServiceDueDate) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fast In-Chat CRM Triggers */}
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block mb-2">
                  Fast CRM Triggers
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      if (activeCustomerMeta && onOpenScheduleService) {
                        onOpenScheduleService(activeCustomerMeta);
                      } else if (activeCustomerMeta && onSelectCustomer) {
                        onSelectCustomer(activeCustomerMeta);
                      }
                    }}
                    className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 hover:bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-left transition-colors"
                  >
                    <Calendar className="w-4 h-4 mb-1 text-blue-600" />
                    <div className="text-[11px] font-bold">Book Service</div>
                    <div className="text-[9px] text-slate-500">Schedule technician</div>
                  </button>

                  <button
                    onClick={() => {
                      if (activeCustomerMeta && onOpenCreateInvoice) {
                        onOpenCreateInvoice(activeCustomerMeta);
                      } else if (activeCustomerMeta && onSelectCustomer) {
                        onSelectCustomer(activeCustomerMeta);
                      }
                    }}
                    className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 hover:bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-left transition-colors"
                  >
                    <FileCheck className="w-4 h-4 mb-1 text-emerald-600" />
                    <div className="text-[11px] font-bold">New Invoice</div>
                    <div className="text-[9px] text-slate-500">Generate bill</div>
                  </button>

                  <button
                    onClick={() => {
                      const upi = business.phone?.replace(/\D/g, '') || 'roservice';
                      handleSendMessage({
                        text: `Hello ${activeConversation.customerName}, please pay your RO service bill via UPI to: ${upi}@upi or scan the payment QR on your invoice. Thank you!`,
                      });
                    }}
                    className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/60 hover:bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-left transition-colors"
                  >
                    <QrCode className="w-4 h-4 mb-1 text-purple-600" />
                    <div className="text-[11px] font-bold">Send UPI Link</div>
                    <div className="text-[9px] text-slate-500">Instant QR prompt</div>
                  </button>

                  <button
                    onClick={() => {
                      if (activeCustomerMeta && onSelectCustomer) {
                        onSelectCustomer(activeCustomerMeta);
                      }
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-left transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mb-1 text-slate-600" />
                    <div className="text-[11px] font-bold">Full 360°</div>
                    <div className="text-[9px] text-slate-500">Open full profile</div>
                  </button>
                </div>
              </div>

              {/* Invoices List */}
              {customerInvoices.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block mb-2">
                    Invoices ({customerInvoices.length})
                  </span>
                  <div className="space-y-1.5">
                    {customerInvoices.slice(0, 3).map((inv) => (
                      <div
                        key={inv.id}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {inv.invoiceNumber}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {inv.invoiceDate ? formatDateDDMMYYYY(inv.invoiceDate) : ''} • ₹{inv.total}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            handleSendMessage({
                              text: `Hello ${activeConversation.customerName}, here is your official service invoice ${inv.invoiceNumber} for ₹${inv.total}. Thank you for choosing ${business.name || 'us'}!`,
                              mediaUrl: `https://api.aquapurero.in/invoices/${inv.invoiceNumber}.pdf`,
                              mediaType: 'document',
                              mediaFilename: `Invoice_${inv.invoiceNumber}.pdf`,
                            });
                          }}
                          className="px-2 py-1 text-[10px] font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        >
                          Send PDF
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* MODAL 1: OFFICIAL META APPROVED TEMPLATES LIBRARY                  */}
      {/* =================================================================== */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Official WhatsApp Templates (English Only)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pre-approved Meta Cloud API templates. Guaranteed 100% delivery even outside 24h window.
                </p>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {META_APPROVED_TEMPLATES.map((tpl) => {
                const previewText = tpl.buildText({
                  customerName: activeConversation?.customerName || 'Customer',
                  businessName: business.name || 'Aquapure RO Solutions',
                  purifierBrand: activeConversation?.purifierBrand || 'RO Purifier',
                  purifierModel: activeConversation?.purifierModel || 'Standard RO',
                  dueDate: activeConversation?.nextDueDate ? formatDateDDMMYYYY(activeConversation.nextDueDate) : 'this month',
                  outputTds: activeConversation?.outputTds || 85,
                  technicianName: technicians[0]?.name || 'Certified Engineer',
                  amount: customerInvoices[0]?.balanceDue || 450,
                });

                return (
                  <div
                    key={tpl.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{tpl.title}</span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                          {tpl.category}
                        </span>
                      </div>
                      <button
                        onClick={() => handleSendTemplate(tpl)}
                        disabled={isSending}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1 active:scale-95"
                      >
                        <Send className="w-3 h-3" />
                        Send Now
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">{tpl.description}</p>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 whitespace-pre-wrap">
                      {previewText}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: INTERACTIVE QUICK REPLY BUTTONS BUILDER                   */}
      {/* =================================================================== */}
      {showInteractiveModal === 'button' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-500" />
                Compose Interactive Quick Reply Buttons
              </h3>
              <button onClick={() => setShowInteractiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Header Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Service Appointment Confirmation"
                  value={interactiveHeader}
                  onChange={(e) => setInteractiveHeader(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Body Message Text <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter message text that requires customer action buttons..."
                  value={interactiveBody}
                  onChange={(e) => setInteractiveBody(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Action Buttons (Up to 3, max 20 chars each)
                </label>
                <div className="space-y-1.5">
                  {interactiveButtons.map((btn, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-6 text-slate-400 font-mono text-center">#{idx + 1}</span>
                      <input
                        type="text"
                        maxLength={20}
                        value={btn}
                        onChange={(e) => {
                          const updated = [...interactiveButtons];
                          updated[idx] = e.target.value;
                          setInteractiveButtons(updated);
                        }}
                        className="flex-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                      {interactiveButtons.length > 1 && (
                        <button
                          onClick={() => setInteractiveButtons(interactiveButtons.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {interactiveButtons.length < 3 && (
                    <button
                      onClick={() => setInteractiveButtons([...interactiveButtons, 'New Button'])}
                      className="text-xs text-blue-600 font-semibold hover:underline mt-1"
                    >
                      + Add Button
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  onClick={() => setShowInteractiveModal(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInteractiveButtons}
                  disabled={!interactiveBody.trim() || isSending}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs disabled:opacity-50"
                >
                  Send Interactive Buttons
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: CANNED RESPONSES / SHORTCUTS (/snippets)                  */}
      {/* =================================================================== */}
      {showCannedModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full max-h-[80vh] flex flex-col p-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Canned Responses & Rate Cards
              </h3>
              <button onClick={() => setShowCannedModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 scrollbar-thin">
              {CANNED_RESPONSES.map((snip) => (
                <div
                  key={snip.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{snip.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-bold">
                      {snip.trigger}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap mb-2">
                    {snip.text}
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setInputText(snip.text);
                        setShowCannedModal(false);
                        inputRef.current?.focus();
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                    >
                      Insert to Draft
                    </button>
                    <button
                      onClick={() => {
                        handleSendMessage({ text: snip.text });
                        setShowCannedModal(false);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Send Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 4: INITIATE NEW WHATSAPP CONVERSATION                         */}
      {/* =================================================================== */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-500" />
                Start New WhatsApp Conversation
              </h3>
              <button onClick={() => setShowNewChatModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Customer from CRM Database:
                </label>
                <select
                  onChange={(e) => {
                    const custId = e.target.value;
                    if (!custId) return;
                    const cust = customers.find((c) => c.id === custId);
                    if (cust) {
                      setSelectedCustomerId(cust.id);
                      setShowNewChatModal(false);
                    }
                  }}
                  className="w-full text-xs px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="">-- Choose existing customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} (+91 {c.mobileNumber}) {c.areaLocality ? `— ${c.areaLocality}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                <span className="flex-shrink mx-2 text-[10px] text-slate-400 uppercase font-bold">OR CUSTOM NUMBER</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as any;
                  const phone = form.phone.value.replace(/\D/g, '');
                  const name = form.name.value.trim() || 'Customer';
                  if (phone.length >= 10) {
                    setSelectedCustomerId(phone);
                    setShowNewChatModal(false);
                  }
                }}
                className="space-y-2.5"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Name:
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Ramesh Reddy"
                    className="w-full text-xs px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp Phone Number (10 digits):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-2 bg-slate-200 dark:bg-slate-700 text-xs font-bold rounded-lg text-slate-700 dark:text-slate-200">
                      +91
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="98490 12345"
                      maxLength={10}
                      className="flex-1 text-xs px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Open WhatsApp Chat
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 5: META CLOUD API DIAGNOSTICS & WEBHOOK CONFIG               */}
      {/* =================================================================== */}
      {showApiDiagnosticsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-500" />
                Meta WhatsApp Cloud API Configuration
              </h3>
              <button onClick={() => setShowApiDiagnosticsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500">API Gateway Mode:</span>
                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    Production (Meta Graph API v21.0)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Business WhatsApp Number:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {business.whatsappNumber || business.phone || '+91 98490 12345'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Webhook Status:</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Listening & Verifying
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Meta Webhook Callback URL:
                </label>
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-[11px] text-slate-800 dark:text-slate-200 break-all select-all">
                  https://your-domain.com/api/webhooks/whatsapp
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-1 text-blue-900 dark:text-blue-300">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  Meta Cloud API Rules Cheat Sheet:
                </div>
                <p className="text-[11px]">
                  • <strong>Inside 24h Window:</strong> Full two-way free-form messaging, interactive buttons, list menus, and media attachments are permitted at lowest session rate.
                </p>
                <p className="text-[11px]">
                  • <strong>Outside 24h Window:</strong> Meta requires sending a pre-approved Message Template to initiate contact. Free-form text will be rejected with error code 131026.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowApiDiagnosticsModal(false)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
