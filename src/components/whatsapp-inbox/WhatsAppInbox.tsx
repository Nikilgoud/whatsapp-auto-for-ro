'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Customer, Purifier, LiveWhatsAppConversation, LiveWhatsAppMessage } from '@/types';
import { useApp } from '@/context/AppContext';
import { appendBusinessFooter } from '@/lib/services/whatsappEngine';
import { formatDateDDMMYYYY } from '@/lib/utils';
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
} from 'lucide-react';

interface WhatsAppInboxProps {
  onSelectCustomer?: (customer: Customer) => void;
}

export const WhatsAppInbox: React.FC<WhatsAppInboxProps> = ({ onSelectCustomer }) => {
  const { customers, purifiers, setUnreadWhatsAppCount, business } = useApp();

  const [conversations, setConversations] = useState<LiveWhatsAppConversation[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LiveWhatsAppMessage[]>([]);
  const [activeCustomerMeta, setActiveCustomerMeta] = useState<Customer | null>(null);
  const [activePurifierMeta, setActivePurifierMeta] = useState<Purifier | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'due'>('all');
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Per-customer draft storage — survives chat switching without polluting state
  const draftsRef = useRef<Record<string, string>>({});
  const prevCustomerIdRef = useRef<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentType, setAttachmentType] = useState<'image' | 'document' | 'audio'>('image');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll messages to bottom smoothly
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
        // Calculate total unread count and update global AppContext badge
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

        // Find customer in AppContext if available, otherwise use API response
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
            customerCode: 'CUST-LIVE',
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
              outputTdsBaseline: data.purifier.outputTdsBaseline || 65,
              nextServiceDueDate: data.purifier.nextServiceDueDate || '',
              components: [],
            });
          }
        }

        // Mark thread as read via PATCH
        fetch(`/api/whatsapp/conversations/${encodeURIComponent(customerIdOrPhone)}`, {
          method: 'PATCH',
        })
          .then(() => {
            // Update local conversation unread count
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

  // Save draft for previous chat, restore draft for newly selected chat
  useEffect(() => {
    const prevId = prevCustomerIdRef.current;

    // Save whatever was typed into the previous customer's draft slot
    if (prevId !== null) {
      draftsRef.current[prevId] = inputText;
    }

    // Load draft for the newly selected customer (empty string if first visit)
    const restoredDraft = selectedCustomerId ? (draftsRef.current[selectedCustomerId] ?? '') : '';
    setInputText(restoredDraft);

    // Update prev pointer
    prevCustomerIdRef.current = selectedCustomerId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId]);

  // Realtime subscription + fallback polling
  useEffect(() => {
    const channel = supabase
      .channel('realtime:live_whatsapp_inbox')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_messages' },
        () => {
          fetchConversations(true);
          if (selectedCustomerId) {
            fetchThread(selectedCustomerId, true);
          }
        }
      )
      .subscribe();

    // Fallback polling every 5 seconds for incoming messages & status changes
    const interval = setInterval(() => {
      fetchConversations(true);
      if (selectedCustomerId) {
        fetchThread(selectedCustomerId, true);
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchConversations, fetchThread, selectedCustomerId]);

  // Auto-grow textarea whenever inputText changes
  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }, [inputText]);

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
      return true;
    });
  }, [conversations, searchQuery, filterTab]);

  // Current active conversation
  const activeConversation = useMemo(() => {
    return conversations.find(
      (c) => c.customerId === selectedCustomerId || c.phoneNumber === selectedCustomerId
    );
  }, [conversations, selectedCustomerId]);

  // Handle Send Message
  const handleSendMessage = async (textToSend?: string) => {
    const rawContent = (textToSend !== undefined ? textToSend : inputText).trim();
    if ((!rawContent && !attachmentUrl) || !activeConversation || isSending) return;

    const content = attachmentUrl && !rawContent ? 'Media attachment' : appendBusinessFooter(rawContent, business);

    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const optimisticMsg: LiveWhatsAppMessage = {
      id: tempId,
      businessId: business?.id || 'biz-client-ro',
      customerId: activeConversation.customerId,
      phoneNumber: activeConversation.phoneNumber,
      direction: 'OUTBOUND',
      messageType: attachmentUrl ? 'MEDIA' : 'TEXT',
      content: content,
      mediaUrl: attachmentUrl || undefined,
      mediaType: attachmentUrl ? attachmentType : undefined,
      status: 'SENT',
      createdAt: nowIso,
      sentAt: nowIso,
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
    // Clear draft for this customer now that message is sent
    if (selectedCustomerId) {
      delete draftsRef.current[selectedCustomerId];
    }
    setAttachmentUrl('');
    setShowAttachmentModal(false);
    setTimeout(() => scrollToBottom('smooth'), 50);

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: activeConversation.phoneNumber,
          customerId: activeConversation.customerId,
          bodyText: content,
          mediaUrl: attachmentUrl || undefined,
          mediaType: attachmentUrl ? attachmentType : undefined,
        }),
      });

      const data = await res.json();
      if (data?.success && data.message) {
        // Replace optimistic msg with confirmed server record
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...data.message, status: 'DELIVERED' } : m))
        );
        // Refresh conversations preview
        fetchConversations(true);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'FAILED', errorMessage: 'Failed to send' } : m))
      );
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Quick Action 1-Click Templates
  const quickTemplates = useMemo(() => {
    const custName = activeConversation?.customerName || 'Customer';
    const brand = activeConversation?.purifierBrand || 'RO';
    const model = activeConversation?.purifierModel || 'Purifier';
    const tds = activeConversation?.outputTds || 65;
    const bName = business?.name || 'Aquapure RO';

    return [
      {
        id: 'slot-confirm',
        label: 'Confirm Slot',
        icon: Calendar,
        text: appendBusinessFooter(`నమస్తే ${custName} గారు, మీ ${brand} RO సర్వీస్ అపాయింట్‌మెంట్ రేపు ఉదయం 10:30 AM కి ఖరారు చేయబడింది. మా అధీకృత టెక్నీషియన్ మీ ఇంటికి వస్తారు.`, business),
      },
      {
        id: 'tds-report',
        label: 'TDS Report',
        icon: Droplets,
        text: appendBusinessFooter(`Hello ${custName}, your water purity certificate: Current Output TDS: ${tds} ppm (WHO safe drinking benchmark: 50-150 ppm). Water quality is 100% pure & healthy.`, business),
      },
      {
        id: 'price-list',
        label: 'Filter Rates',
        icon: FileText,
        text: appendBusinessFooter(`${bName} Genuine Spare Rates:\n1. 5-Micron Spun Filter: ₹250\n2. Sediment Cartridge: ₹450\n3. Activated Carbon Block: ₹550\n4. 80 GPD Filmtec Membrane: ₹1,650\nIncludes complimentary installation & 12-point leak testing.`, business),
      },
      {
        id: 'payment-link',
        label: 'Payment Link',
        icon: FileCheck,
        text: appendBusinessFooter(`Hello ${custName}, thank you for choosing ${bName}. Please complete your service payment via UPI to: ${business.phone?.replace(/\D/g, '') || 'roservice'}@upi or scan the QR code shared by our technician.`, business),
      },
      {
        id: 'tech-on-way',
        label: 'Tech On Way',
        icon: UserCheck,
        text: appendBusinessFooter(`Dear ${custName}, our certified service engineer is on the way to your location and will arrive in approx 15-20 minutes.`, business),
      },
    ];
  }, [activeConversation, business]);

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
  const renderStatusIcon = (status: LiveWhatsAppMessage['status']) => {
    switch (status) {
      case 'READ':
        return (
          <span title="Read">
            <CheckCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          </span>
        );
      case 'DELIVERED':
        return (
          <span title="Delivered">
            <CheckCheck className="w-4 h-4 text-slate-300 dark:text-slate-400 shrink-0" />
          </span>
        );
      case 'SENT':
        return (
          <span title="Sent">
            <Check className="w-4 h-4 text-slate-300 dark:text-slate-400 shrink-0" />
          </span>
        );
      case 'FAILED':
        return (
          <span title="Failed to deliver">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          </span>
        );
      default:
        return (
          <span title="Pending">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 animate-pulse" />
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] lg:h-[calc(100vh-8rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Dual Pane Container */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* ================================================================= */}
        {/* LEFT PANE: CONVERSATION LIST (Responsive: Full width on mobile when no chat open) */}
        {/* ================================================================= */}
        <div
          className={`${
            selectedCustomerId ? 'hidden lg:flex' : 'flex'
          } w-full lg:w-96 xl:w-[410px] flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shrink-0`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    WhatsApp Inbox
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live WhatsApp Cloud Sync
                  </p>
                </div>
              </div>

              <button
                onClick={() => fetchConversations()}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Refresh Conversations"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingConversations ? 'animate-spin text-emerald-500' : ''}`} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, phone, area, model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900 dark:text-white placeholder-slate-400"
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
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFilterTab('all')}
                className={`flex-1 py-1 px-2.5 rounded-lg transition-all ${
                  filterTab === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({conversations.length})
              </button>
              <button
                onClick={() => setFilterTab('unread')}
                className={`flex-1 py-1 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  filterTab === 'unread'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Unread
                {conversations.filter((c) => c.unreadCount > 0).length > 0 && (
                  <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {conversations.filter((c) => c.unreadCount > 0).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilterTab('due')}
                className={`flex-1 py-1 px-2.5 rounded-lg transition-all ${
                  filterTab === 'due'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Service Due
              </button>
            </div>
          </div>

          {/* Conversation List Stream */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-thin">
            {isLoadingConversations && conversations.length === 0 ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Syncing live conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No conversations found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filter</p>
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
                  .toUpperCase();

                return (
                  <button
                    key={conv.customerId || conv.phoneNumber}
                    onClick={() => setSelectedCustomerId(conv.customerId || conv.phoneNumber)}
                    className={`w-full text-left p-3.5 transition-all flex items-start gap-3 select-none ${
                      isSelected
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-l-4 border-emerald-500'
                        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0 mt-0.5">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold text-sm flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xs">
                        {initials}
                      </div>
                      {conv.unreadCount > 0 ? (
                        <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs">
                          {conv.unreadCount}
                        </span>
                      ) : (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-slate-900"></span>
                      )}
                    </div>

                    {/* Chat Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {conv.customerName}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400 shrink-0">
                          {formatMsgTime(conv.lastMessageTime)}
                        </span>
                      </div>

                      {/* Purifier / Area Tags */}
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        {conv.area && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                            {conv.area}
                          </span>
                        )}
                        {conv.purifierModel && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded truncate max-w-[140px]">
                            {conv.purifierBrand ? `${conv.purifierBrand} ` : ''}
                            {conv.purifierModel}
                          </span>
                        )}
                      </div>

                      {/* Last Message Snippet */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        {conv.lastMessageDirection === 'OUTBOUND' && (
                          <span className="shrink-0">{renderStatusIcon(conv.lastMessageStatus)}</span>
                        )}
                        <p className={`truncate ${conv.unreadCount > 0 ? 'font-bold text-slate-900 dark:text-white' : ''}`}>
                          {conv.lastMessage || (conv.mediaUrl ? 'Attachment' : '')}
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
        {/* RIGHT PANE: ACTIVE CHAT WINDOW (Responsive: Full width on mobile when chat open) */}
        {/* ================================================================= */}
        <div
          className={`${
            !selectedCustomerId ? 'hidden lg:flex' : 'flex'
          } flex-1 flex-col bg-slate-50/50 dark:bg-slate-950/60 min-w-0 h-full`}
        >
          {activeConversation ? (
            <>
              {/* Active Chat Header */}
              <div className="p-3.5 lg:p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0 z-10 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setSelectedCustomerId(null)}
                    className="p-1.5 -ml-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden"
                    title="Back to conversations"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
                    {activeConversation.customerName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm lg:text-base font-bold text-slate-900 dark:text-white truncate">
                        {activeConversation.customerName}
                      </h3>
                      <a
                        href={`tel:${activeConversation.phoneNumber}`}
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        {activeConversation.phoneNumber}
                      </a>
                    </div>

                    {/* Metadata chips */}
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      {activeConversation.purifierModel && (
                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          <Droplets className="w-3 h-3 text-cyan-500" />
                          {activeConversation.purifierBrand ? `${activeConversation.purifierBrand} ` : ''}
                          {activeConversation.purifierModel}
                        </span>
                      )}

                      {activeConversation.outputTds !== undefined && activeConversation.outputTds !== null && (
                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          TDS: {activeConversation.outputTds} ppm
                        </span>
                      )}

                      {activeConversation.nextDueDate && (
                        <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded text-[11px] font-semibold">
                          <Calendar className="w-3 h-3" />
                          Due: {formatDateDDMMYYYY(activeConversation.nextDueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Header Action: Customer 360° modal button */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (activeCustomerMeta && onSelectCustomer) {
                        onSelectCustomer(activeCustomerMeta);
                      } else {
                        // Create a customer object from conversation data
                        const synthesizedCustomer: Customer = {
                          id: activeConversation.customerId || 'cust-live',
                          businessId: 'biz-client-ro',
                          customerCode: 'CUST-360',
                          fullName: activeConversation.customerName,
                          mobileNumber: activeConversation.phoneNumber,
                          whatsappNumber: activeConversation.phoneNumber,
                          houseFlatNo: '',
                          streetAddress: '',
                          areaLocality: activeConversation.area || '',
                          city: 'Hyderabad',
                          state: 'Telangana',
                          pincode: '',
                          customerType: 'Residential',
                          status: 'Service due',
                          tags: ['WhatsApp Customer'],
                          whatsappOptOut: false,
                          totalSpend: 0,
                          pendingBalance: 0,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        };
                        onSelectCustomer?.(synthesizedCustomer);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 transition-colors shadow-xs"
                    title="Open Complete Customer 360° Profile"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">View Customer 360°</span>
                    <span className="sm:hidden">360°</span>
                  </button>
                </div>
              </div>

              {/* Message Bubble History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
                {isLoadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                    <p className="text-xs">Loading message thread...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                    <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-medium">No messages in this conversation yet</p>
                    <p className="text-xs text-slate-400">Send a WhatsApp message or select a 1-click template below</p>
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
                          {/* Media preview if present */}
                          {msg.mediaUrl && (
                            <div className="mb-2 overflow-hidden rounded-xl bg-slate-900/10 dark:bg-slate-950/40">
                              {msg.mediaType === 'image' ? (
                                <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={msg.mediaUrl}
                                    alt="WhatsApp Attachment"
                                    className="max-h-56 w-full object-cover rounded-xl hover:opacity-95 transition-opacity"
                                  />
                                </a>
                              ) : msg.mediaType === 'document' ? (
                                <a
                                  href={msg.mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                                >
                                  <FileText className="w-5 h-5 shrink-0" />
                                  <span className="text-xs underline truncate font-medium">View Attached Document</span>
                                  <ExternalLink className="w-3.5 h-3.5 ml-auto shrink-0" />
                                </a>
                              ) : (
                                <div className="p-3 text-xs italic opacity-90">Audio / Document attachment</div>
                              )}
                            </div>
                          )}

                          {/* Message Content */}
                          <p className="whitespace-pre-wrap leading-relaxed select-text">{msg.content}</p>

                          {/* Timestamp & Status */}
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                              isOutbound ? 'text-emerald-100' : 'text-slate-400'
                            }`}
                          >
                            <span>{formatMsgTime(msg.createdAt || msg.sentAt)}</span>
                            {isOutbound && renderStatusIcon(msg.status)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Action 1-Click Templates Bar */}
              <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs shrink-0">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Quick Actions:
                  </span>
                  {quickTemplates.map((tpl) => {
                    const Icon = tpl.icon;
                    return (
                      <button
                        key={tpl.id}
                        onClick={() => {
                          setInputText(tpl.text);
                          inputRef.current?.focus();
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 transition-all shrink-0 active:scale-95"
                      >
                        <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {tpl.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Direct Reply Input Bar */}
              <div className="p-3.5 lg:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                {/* Media Attachment Drawer */}
                {showAttachmentModal && (
                  <div className="mb-3 p-3 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-emerald-500" />
                        Attach Media / Invoice / Report
                      </span>
                      <button
                        onClick={() => setShowAttachmentModal(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={attachmentType}
                        onChange={(e) => setAttachmentType(e.target.value as any)}
                        className="text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                      >
                        <option value="image">Image (Photo / Diagram)</option>
                        <option value="document">Document / PDF Invoice</option>
                        <option value="audio">Audio Message</option>
                      </select>

                      <input
                        type="url"
                        placeholder="Paste image or document URL (e.g. https://.../invoice.pdf)"
                        value={attachmentUrl}
                        onChange={(e) => setAttachmentUrl(e.target.value)}
                        className="flex-1 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white placeholder-slate-400"
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
                      placeholder={`Reply to ${activeConversation.customerName} via WhatsApp...`}
                      style={{ height: 'auto', overflowY: 'auto' }}
                      className="w-full resize-none min-h-[52px] max-h-56 px-3.5 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 leading-relaxed"
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
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Choose a customer from the left list to review real-time WhatsApp conversation history and reply instantly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
