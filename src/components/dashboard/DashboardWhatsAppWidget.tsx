'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { LiveWhatsAppConversation, Customer, Purifier } from '@/types';
import { appendBusinessFooter } from '@/lib/services/whatsappEngine';
import { formatDateDDMMYYYY } from '@/lib/utils';
import {
  MessageSquare,
  Send,
  CheckCheck,
  Check,
  Clock,
  Sparkles,
  ExternalLink,
  UserCheck,
  Megaphone,
  Zap,
  RefreshCw,
  Droplets,
  Calendar,
  ChevronRight,
  Phone,
  ShieldAlert,
  X,
  Radio,
} from 'lucide-react';
import { format } from 'date-fns';

interface DashboardWhatsAppWidgetProps {
  onNavigate: (tab: string) => void;
  onSelectCustomer: (customer: Customer) => void;
  onScheduleService?: (customer: Customer, purifier?: Purifier) => void;
}

export const DashboardWhatsAppWidget: React.FC<DashboardWhatsAppWidgetProps> = ({
  onNavigate,
  onSelectCustomer,
  onScheduleService,
}) => {
  const {
    business,
    customers,
    purifiers,
    renewals,
    unreadWhatsAppCount,
    setUnreadWhatsAppCount,
    communications,
    broadcastToAllCustomers,
    autoReminderConfig,
    runAutomatedRemindersNow,
  } = useApp();

  const [conversations, setConversations] = useState<LiveWhatsAppConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Quick Inline Reply Modal State
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<LiveWhatsAppConversation | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replySuccessMessage, setReplySuccessMessage] = useState<string | null>(null);

  // Quick Broadcast Trigger Modal State
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<'overdue' | 'due_soon' | 'all'>('overdue');
  const [broadcastMessage, setBroadcastMessage] = useState(
    `💧 *Urgent Water Purity & RO Checkup Alert* 💧\n\nDear {{customerName}},\nGreetings from {{businessName}}! Ensure 100% pure & healthy drinking water for your family. We have technician slots available today in {{phone}} area for digital TDS measurement & filter testing.\n\nReply *YES* to schedule your doorstep visit!`
  );
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState<string | null>(null);

  // Fetch conversations from live API or fallback to mock store / communications
  const fetchConversations = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setIsRefreshing(true);
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
      console.warn('Failed to fetch dashboard WhatsApp conversations, using local fallback:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [setUnreadWhatsAppCount]);

  useEffect(() => {
    fetchConversations();
    // Auto refresh every 45 seconds
    const interval = setInterval(() => fetchConversations(true), 45000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Quick Glance KPI Metrics
  const kpiStats = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todaysComms = communications.filter(
      (c) => c.sentAt?.startsWith(todayStr) || c.status === 'Delivered' || c.status === 'Sent'
    );

    const totalIncoming = conversations.filter(
      (c) => c.lastMessageDirection === 'INBOUND'
    ).length;

    const unreadCount = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0) || unreadWhatsAppCount || 0;

    const pendingReplies = conversations.filter(
      (c) => c.lastMessageDirection === 'INBOUND' && (c.unreadCount > 0 || c.lastMessageStatus === 'RECEIVED')
    ).length;

    const autoRemindersSent = autoReminderConfig?.autoSentCount || todaysComms.filter(c => c.templateKey !== 'CUSTOM_BROADCAST').length || 12;

    return {
      totalIncoming,
      unreadCount,
      pendingReplies,
      autoRemindersSent,
    };
  }, [conversations, communications, unreadWhatsAppCount, autoReminderConfig]);

  // Top 5 recent conversations sorted by latest message
  const recentConversations = useMemo(() => {
    return [...conversations]
      .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())
      .slice(0, 5);
  }, [conversations]);

  // Relative timestamp helper
  const getRelativeTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (60 * 1000));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return format(date, 'dd MMM');
    } catch {
      return '';
    }
  };

  // Open Quick Reply
  const handleOpenReply = (conv: LiveWhatsAppConversation) => {
    setSelectedConversation(conv);
    setReplyText(`నమస్తే ${conv.customerName} గారు, మీ ${conv.purifierBrand || 'RO'} సర్వీస్ సంబంధించి మా అధీకృత టెక్నీషియన్ ఈరోజు అందుబాటులో ఉన్నారు. సమయం ఖరారు చేయమంటారా?`);
    setReplySuccessMessage(null);
    setReplyModalOpen(true);
  };

  // Dispatch Quick Reply
  const handleSendQuickReply = async () => {
    if (!selectedConversation || !replyText.trim() || isSendingReply) return;

    setIsSendingReply(true);
    const finalContent = appendBusinessFooter(replyText, business);

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: selectedConversation.phoneNumber,
          customerId: selectedConversation.customerId,
          customerName: selectedConversation.customerName,
          bodyText: finalContent,
          messageText: finalContent,
        }),
      });

      const data = await res.json();
      if (data?.success) {
        setReplySuccessMessage('Reply dispatched successfully via WhatsApp!');
        setTimeout(() => {
          setReplyModalOpen(false);
          setSelectedConversation(null);
          setReplySuccessMessage(null);
          fetchConversations(true);
        }, 1200);
      } else {
        alert(data?.error || 'Failed to dispatch WhatsApp reply.');
      }
    } catch (e) {
      console.error('Failed to send reply:', e);
      alert('Network error while dispatching WhatsApp reply.');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Quick Broadcast Action
  const handleTriggerBroadcast = async () => {
    if (!broadcastMessage.trim() || isBroadcasting) return;

    setIsBroadcasting(true);
    setBroadcastFeedback(null);

    try {
      const result = await broadcastToAllCustomers(broadcastMessage, broadcastTarget);
      setBroadcastFeedback(`✅ Broadcast successfully queued to ${result.sent} customers!`);
      setTimeout(() => {
        setBroadcastModalOpen(false);
        setBroadcastFeedback(null);
      }, 1800);
    } catch (e: any) {
      setBroadcastFeedback(`❌ Broadcast failed: ${e?.message || 'Error executing broadcast'}`);
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                WhatsApp Operations & Live Chats
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-700/40">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-600 dark:text-emerald-400" />
                Live Desk
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time customer inquiries, automated reminder dispatch, and 1-click service scheduling.
            </p>
          </div>
        </div>

        {/* TOP ACTION BUTTONS */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setBroadcastModalOpen(true)}
            className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 rounded-xl text-xs font-bold border border-cyan-200 dark:border-cyan-800/60 transition flex items-center gap-1.5 shadow-xs"
            title="Fire fast broadcast for TDS or filter checkups"
          >
            <Megaphone className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Fast Broadcast</span>
          </button>

          <button
            onClick={() => fetchConversations()}
            disabled={isRefreshing}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl transition"
            title="Refresh conversations"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
          </button>

          <button
            onClick={() => onNavigate('whatsapp-inbox')}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95"
          >
            <span>Open WhatsApp Inbox</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* QUICK GLANCE KPI STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4">
        {/* KPI 1: Incoming Chats */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Incoming Queries</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              {kpiStats.totalIncoming}
            </p>
            <p className="text-[10px] text-slate-500">Active customer requests</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 2: Unread Counter */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unread Messages</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {kpiStats.unreadCount}
              </span>
              {kpiStats.unreadCount > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-500 text-white text-[9px] font-black rounded-full animate-bounce">
                  NEW
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500">Awaiting your response</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 3: Auto Reminders Dispatched */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Automations Sent</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              {kpiStats.autoRemindersSent}
            </p>
            <p className="text-[10px] text-slate-500">Service due & welcome alerts</p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 4: Pending Replies */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Actions</p>
            <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 tabular-nums">
              {kpiStats.pendingReplies}
            </p>
            <p className="text-[10px] text-slate-500">Technician dispatch needed</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* RECENT LIVE CONVERSATIONS LIST */}
      <div className="mt-2 space-y-2.5">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
            Recent Customer WhatsApp Threads
          </span>
          <span className="text-[11px] text-slate-400">
            Showing top {recentConversations.length} live conversations
          </span>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
            <span>Loading WhatsApp conversations...</span>
          </div>
        ) : recentConversations.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            No active WhatsApp messages recorded yet. Send your first reminder or broadcast!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {recentConversations.map((conv) => {
              const matchedCustomer = customers.find(
                (c) => c.id === conv.customerId || c.mobileNumber?.includes(conv.phoneNumber.slice(-10))
              );
              const matchedPurifier = purifiers.find((p) => p.customerId === matchedCustomer?.id);

              const isIncoming = conv.lastMessageDirection === 'INBOUND';
              const isUnread = (conv.unreadCount || 0) > 0;

              return (
                <div
                  key={conv.phoneNumber}
                  className={`py-3 px-3 rounded-2xl transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isUnread
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Left: Avatar & Customer info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        {conv.customerName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-xs">
                        <MessageSquare className="w-2.5 h-2.5 text-emerald-600 fill-emerald-600" />
                      </span>
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {conv.customerName}
                        </span>

                        {conv.area && (
                          <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                            {conv.area}
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400">
                          • +91 {conv.phoneNumber.replace(/^91/, '')}
                        </span>

                        {isUnread && (
                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[9px] font-extrabold uppercase">
                            {conv.unreadCount} Unread
                          </span>
                        )}
                      </div>

                      {/* Purifier Info & TDS Indicator */}
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                          <Droplets className="w-3 h-3" />
                          {conv.purifierBrand || matchedPurifier?.brand || 'RO'} {conv.purifierModel || matchedPurifier?.model || 'Purifier'}
                        </span>

                        {conv.outputTds && (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-200/50 dark:border-cyan-800/40">
                            TDS: {conv.outputTds} ppm
                          </span>
                        )}

                        {conv.nextDueDate && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            Due: {formatDateDDMMYYYY(conv.nextDueDate)}
                          </span>
                        )}
                      </div>

                      {/* Last Message Snippet */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 pt-0.5">
                        {isIncoming ? (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px] shrink-0">
                            Incoming:
                          </span>
                        ) : (
                          <span className="shrink-0 flex items-center text-cyan-500">
                            {conv.lastMessageStatus === 'READ' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-cyan-500" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </span>
                        )}
                        <p className="truncate text-[11px] max-w-md text-slate-600 dark:text-slate-300">
                          {conv.lastMessage}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Timestamp & Action Buttons */}
                  <div className="flex items-center justify-between md:justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                      {getRelativeTime(conv.lastMessageTime)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Instant Reply Button */}
                      <button
                        onClick={() => handleOpenReply(conv)}
                        className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                        title="Send quick WhatsApp reply"
                      >
                        <Send className="w-3 h-3" />
                        <span>Reply</span>
                      </button>

                      {/* Schedule Technician Button */}
                      {matchedCustomer && (
                        <button
                          onClick={() => {
                            if (onScheduleService) {
                              onScheduleService(matchedCustomer, matchedPurifier);
                            } else {
                              onSelectCustomer(matchedCustomer);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                          title="Schedule technician visit"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Dispatch Tech</span>
                        </button>
                      )}

                      {/* Open Full Chat */}
                      <button
                        onClick={() => onNavigate('whatsapp-inbox')}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition"
                        title="Open in WhatsApp Inbox"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUICK INLINE REPLY MODAL */}
      {replyModalOpen && selectedConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Quick WhatsApp Reply
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    To: {selectedConversation.customerName} (+91 {selectedConversation.phoneNumber.replace(/^91/, '')})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReplyModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Template Buttons */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                1-Click Quick Message Templates:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    label: 'Slot Confirmed',
                    msg: `నమస్తే ${selectedConversation.customerName} గారు, మీ ${selectedConversation.purifierBrand || 'RO'} సర్వీస్ అపాయింట్‌మెంట్ రేపు ఉదయం 10:30 AM కి ఖరారు చేయబడింది. మా అధీకృత టెక్నీషియన్ మీ ఇంటికి వస్తారు.`,
                  },
                  {
                    label: 'TDS Report',
                    msg: `Hello ${selectedConversation.customerName}, your current purifier output TDS is calibrated at ${selectedConversation.outputTds || 65} ppm. The water quality is 100% safe, pure & healthy!`,
                  },
                  {
                    label: 'Technician on Way',
                    msg: `Dear ${selectedConversation.customerName}, our certified technician has departed for your doorstep and will arrive within 20-30 minutes.`,
                  },
                  {
                    label: 'Payment Link',
                    msg: `Dear ${selectedConversation.customerName}, thank you for choosing ${business.name}. Please complete your RO service payment via UPI to: ${business.phone.replace(/\D/g, '')}@upi.`,
                  },
                ].map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => setReplyText(tpl.msg)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                  >
                    + {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Textarea */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Message Body (Business details footer is automatically appended):
              </label>
              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-900 dark:text-white"
                placeholder="Type your message..."
              />
            </div>

            {/* Business Footer Note */}
            <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5 border border-slate-200/50 dark:border-slate-700/50">
              <span className="font-bold text-slate-700 dark:text-slate-300">Auto-Appended Business Footer:</span>
              <p>🏢 {business.name} • 📞 {business.phone} • 📍 {business.address}, {business.city}{business.website ? ` • 🌐 ${business.website}` : ''}</p>
            </div>

            {replySuccessMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold text-center">
                {replySuccessMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReplyModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendQuickReply}
                disabled={isSendingReply || !replyText.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                {isSendingReply ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send via WhatsApp</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK BROADCAST TRIGGER MODAL */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Quick WhatsApp Broadcast Trigger
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Instantly broadcast service reminders or free TDS check offers
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBroadcastModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Customer Audience:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'overdue', label: 'Overdue Only', desc: 'Critical filters' },
                  { id: 'due_soon', label: 'Due < 15 Days', desc: 'Upcoming checkup' },
                  { id: 'all', label: 'All Customers', desc: 'Full active list' },
                ].map((tgt) => (
                  <button
                    key={tgt.id}
                    type="button"
                    onClick={() => setBroadcastTarget(tgt.id as any)}
                    className={`p-2.5 rounded-xl text-left border transition ${
                      broadcastTarget === tgt.id
                        ? 'border-cyan-500 bg-cyan-50/70 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <p className="text-xs">{tgt.label}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{tgt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Broadcast Message */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Broadcast Content (Personalized variables & business footer included):
              </label>
              <textarea
                rows={5}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 text-slate-900 dark:text-white"
                placeholder="Type broadcast message..."
              />
            </div>

            {broadcastFeedback && (
              <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-700 text-cyan-800 dark:text-cyan-200 text-xs font-bold text-center">
                {broadcastFeedback}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBroadcastModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTriggerBroadcast}
                disabled={isBroadcasting || !broadcastMessage.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-cyan-600/20"
              >
                {isBroadcasting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <>
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>Trigger Broadcast Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
