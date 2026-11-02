'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  MessageSquare,
  Bot,
  ShoppingBag,
  Send,
  Zap,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Play,
  Pause,
  RefreshCw,
  Eye,
  Sliders,
  Users,
  Smartphone,
  Phone,
  Droplets,
  ShieldCheck,
  ChevronRight,
  Trash2,
  ExternalLink,
  MessageCircle,
  Search,
  Filter,
  Image as ImageIcon,
  Video as VideoIcon,
  Paperclip,
  Megaphone,
  Copy,
  Check,
  Globe,
  Wrench,
} from 'lucide-react';

import {
  getWelcomeAndServiceDiscoveryMessage,
  generateGroundedChatbotReply,
  formatPurifierProductForWhatsApp,
  generateWhatsAppLink,
  WHATSAPP_TEMPLATES,
  appendBusinessFooter,
  formatBusinessDetailsFooter,
  interpolateTemplate,
  TemplateCategory,
} from '@/lib/services/whatsappEngine';
import { PurifierProduct, LanguageCode, ChatMessage } from '@/types';
import { formatIndianCurrency, formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from '@/lib/utils';

export const WhatsAppAutomationHub: React.FC = () => {
  const {
    business,
    customers,
    purifiers,
    renewals,
    amcPlans,
    purifierProducts,
    addPurifierProduct,
    deletePurifierProduct,
    autoReminderConfig,
    updateAutoReminderConfig,
    runAutomatedRemindersNow,
    broadcastToAllCustomers,
    broadcastLogs,
    communications,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'chatbot' | 'catalog' | 'broadcast' | 'reminders' | 'templates' | 'logs'>('chatbot');

  // Chatbot Live Simulator State
  const initialBotGreeting = getWelcomeAndServiceDiscoveryMessage(business);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init-1',
      sender: 'bot',
      text: initialBotGreeting,
      timestamp: 'Just now',
      options: [
        { id: '1', label: '1️⃣ Book Service', action: 'book_service' },
        { id: '2', label: '2️⃣ Filter Rates', action: 'filter_rates' },
        { id: '3', label: '3️⃣ High TDS / Taste', action: 'check_tds' },
        { id: '4', label: '4️⃣ Water Leakage', action: 'leak_repair' },
        { id: '5', label: '5️⃣ Buy New RO 🛒', action: 'view_catalog' },
        { id: '6', label: '6️⃣ AMC Plans 🛡️', action: 'amc_plans' },
        { id: '7', label: '7️⃣ Speak to Owner', action: 'contact_owner' },
      ],
    },
  ]);
  const [inputSimText, setInputSimText] = useState('');

  // Bulk Broadcast State
  const [manualBroadcastText, setManualBroadcastText] = useState(
    `💧 *Special Service & Filter Checkup Alert!* 💧\n\nDear {{customerName}},\nGreetings from {{businessName}}! Ensure pure & healthy drinking water for your family. We are conducting free water TDS checkups and special filter replacement offers this week in your area.\n\nReply *YES* to book our certified technician slot!\n\n—\n🏢 {{businessName}}\n📞 Phone: {{businessPhone}}\n📍 Address: {{businessAddress}}\n🌐 Website: {{businessWebsite}}`
  );

  // Templates Hub State
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<'ALL' | TemplateCategory>('ALL');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [templateActiveLanguages, setTemplateActiveLanguages] = useState<Record<string, LanguageCode>>({});
  const [templateShowLivePreview, setTemplateShowLivePreview] = useState(true);
  const [copiedTemplateKey, setCopiedTemplateKey] = useState<string | null>(null);
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'overdue' | 'due_soon' | 'amc_active'>('all');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState<string | null>(null);
  const [attachedMedia, setAttachedMedia] = useState<{ url: string; type: 'image' | 'video'; name: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds 15MB limit for WhatsApp media attachments.');
      return;
    }

    const isVideo = file.type.startsWith('video');
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setAttachedMedia({
        url: result,
        type: isVideo ? 'video' : 'image',
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };


  // New Purifier Product Modal
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newBrand, setNewBrand] = useState('Kent');
  const [newModel, setNewModel] = useState('');
  const [newType, setNewType] = useState('RO+UV+Alkaline');
  const [newCapacity, setNewCapacity] = useState(15);
  const [newStorage, setNewStorage] = useState(8);
  const [newStages, setNewStages] = useState(7);
  const [newMrp, setNewMrp] = useState(18999);
  const [newPrice, setNewPrice] = useState(14499);
  const [newWarranty, setNewWarranty] = useState(12);
  const [newFeatures, setNewFeatures] = useState('Alkaline Mineral Booster, High-grade TDS controller, 1 Year free service');

  // Automated reminder test execution
  const [reminderExecutionResult, setReminderExecutionResult] = useState<{ sent: number; skipped: number; logs: string[] } | null>(null);

  // Handle Sim Chatbot send
  const handleSendSimMessage = (customText?: string) => {
    const textToSend = customText || inputSimText;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'customer',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputSimText('');

    // Generate grounded reply
    setTimeout(() => {
      const { replyText, options, productCard } = generateGroundedChatbotReply(
        textToSend,
        business,
        purifierProducts,
        amcPlans
      );

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        options,
        productCard,
      };

      setChatMessages((prev) => [...prev, botMsg]);
    }, 600);
  };

  // Broadcast Handler
  const handleExecuteBroadcast = async () => {
    if (!manualBroadcastText.trim()) {
      alert('Please enter a message before sending.');
      return;
    }

    const recipientCount = customers.filter((c) => !c.whatsappOptOut).length;
    if (recipientCount === 0) {
      alert('No eligible customers found.');
      return;
    }

    if (!confirm(`Are you sure you want to broadcast this message to eligible customers (${recipientCount}) now?`)) {
      return;
    }

    setIsBroadcasting(true);
    setBroadcastFeedback(null);

    try {
      const res = await broadcastToAllCustomers(
        manualBroadcastText,
        broadcastTarget,
        attachedMedia ? { url: attachedMedia.url, type: attachedMedia.type } : undefined
      );
      setBroadcastFeedback(`✅ Broadcast successfully queued! Dispatched to ${res.sent} customer(s)${attachedMedia ? ` with attached ${attachedMedia.type}` : ''}.`);
    } catch (err: any) {
      setBroadcastFeedback(`❌ Error sending broadcast: ${err.message || 'Unknown error'}`);
    } finally {
      setIsBroadcasting(false);
    }
  };


  // Add Product Handler
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel.trim()) {
      alert('Please provide a model name');
      return;
    }

    addPurifierProduct({
      businessId: business.id,
      brand: newBrand,
      model: newModel,
      purifierType: newType,
      capacityLph: Number(newCapacity) || 15,
      storageLiters: Number(newStorage) || 8,
      stagesCount: Number(newStages) || 7,
      mrp: Number(newMrp) || 18000,
      sellingPrice: Number(newPrice) || 14000,
      warrantyMonths: Number(newWarranty) || 12,
      features: newFeatures.split(',').map((f) => f.trim()).filter(Boolean),
      inStock: true,
      imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=60',
    });

    setIsAddProductModalOpen(false);
    setNewModel('');
    alert('Purifier model added to catalog and ready to sell on WhatsApp!');
  };

  // Calculate target count for broadcast
  const targetCount = customers.filter((c) => {
    if (c.whatsappOptOut) return false;
    if (broadcastTarget === 'overdue') {
      const overdueIds = new Set(renewals.filter((r) => r.daysRemaining <= 0).map((r) => r.customerId));
      return overdueIds.has(c.id);
    }
    if (broadcastTarget === 'due_soon') {
      const dueIds = new Set(renewals.filter((r) => r.daysRemaining > 0 && r.daysRemaining <= 15).map((r) => r.customerId));
      return dueIds.has(c.id);
    }
    return true;
  }).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Status Radar */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-radial from-blue-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>WhatsApp Engine Online</span>
              </span>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-semibold">
                Auto-Reminders & Chatbot Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
              <span>WhatsApp Automation & Commerce</span>
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Automate customer service due reminders, power your 24/7 grounded water purifier chatbot, sell new RO models in-chat, and broadcast manual updates in 1 click.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                const res = runAutomatedRemindersNow();
                setReminderExecutionResult(res);
              }}
              className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Run Auto-Reminders Check Now</span>
            </button>
          </div>
        </div>

        {/* Quick Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 mt-6 border-t border-slate-800/80 scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('chatbot')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 shrink-0 transition ${
              activeTab === 'chatbot'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>🤖 Smart Chatbot & Services Menu</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 shrink-0 transition ${
              activeTab === 'catalog'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>🛒 Purifier Products Catalog ({purifierProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 shrink-0 transition ${
              activeTab === 'broadcast'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>📢 1-Click Message All Customers</span>
          </button>

          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 shrink-0 transition ${
              activeTab === 'reminders'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>⚡ Automated Service Reminders</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 shrink-0 transition ${
              activeTab === 'templates'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>💬 Multi-Lingual Templates</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 shrink-0 transition ${
              activeTab === 'logs'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>📋 Activity & Broadcast Logs</span>
          </button>
        </div>
      </div>

      {/* Execution Feedback Notification */}
      {reminderExecutionResult && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Automated Reminder Scan Completed: {reminderExecutionResult.sent} Sent, {reminderExecutionResult.skipped} Skipped / Up-to-date
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                {reminderExecutionResult.logs.join(' • ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setReminderExecutionResult(null)}
            className="text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: SMART CHATBOT & LIVE SIMULATOR */}
      {activeTab === 'chatbot' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Chatbot Explanation & Knowledge Base Overview */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-2xl">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Grounded Company AI Chatbot
                  </h3>
                  <p className="text-xs text-slate-500">
                    Auto-answers queries using your real business data
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                  <span className="font-extrabold uppercase text-[10px] text-blue-600 dark:text-blue-400">
                    Step 1: Warm Welcoming
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    When a customer sends any message (&ldquo;Hi&rdquo;, &ldquo;Hello&rdquo;, or &ldquo;Need Service&rdquo;), the bot welcomes them with your company branding and immediately shows the 7-option services menu.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                  <span className="font-extrabold uppercase text-[10px] text-emerald-600 dark:text-emerald-400">
                    Step 2: Service Discovery Menu
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    Customers can simply tap or reply with numbers 1 to 7 to book regular service, check filter costs, report water leaks, or view new RO purifiers for purchase.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                  <span className="font-extrabold uppercase text-[10px] text-cyan-600 dark:text-cyan-400">
                    Step 3: Grounded In Live Data
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    Pricing quotes, AMC rates, filter lifespans, and address details pull directly from your <strong>Business Settings</strong>. No hallucinations!
                  </p>
                </div>
              </div>

              {/* Business Data Snapshot */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">Active Knowledge Base Data:</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="block text-slate-400">General Service:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      ₹{business.settings.serviceCharges?.generalService || 650}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="block text-slate-400">RO Membrane:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      ₹{business.settings.serviceCharges?.membraneReplacement || 2200}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="block text-slate-400">Working Hours:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {business.settings.workingHoursStart} - {business.settings.workingHoursEnd}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="block text-slate-400">Purifiers in Catalog:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {purifierProducts.length} models
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Interactive Phone Simulator */}
          <div className="lg:col-span-7">
            <div className="max-w-md mx-auto bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl border-4 border-slate-800">
              {/* Phone Speaker Notch */}
              <div className="h-4 w-32 bg-slate-800 rounded-full mx-auto mb-2" />

              {/* Phone Screen */}
              <div className="bg-slate-100 dark:bg-[#0b141a] rounded-[2rem] overflow-hidden flex flex-col h-[580px] text-xs">
                {/* WhatsApp Chat Header */}
                <div className="bg-[#075e54] text-white p-3.5 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-sm">
                      💧
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs leading-tight">{business.name}</h4>
                      <p className="text-[10px] text-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                        <span>Online (24/7 AI Bot)</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] bg-emerald-800/60 px-2 py-0.5 rounded text-emerald-200 font-mono">
                    Official Business
                  </span>
                </div>

                {/* Chat Scroll Window */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
                  <div className="text-center my-1">
                    <span className="bg-slate-200 dark:bg-slate-800 text-slate-500 text-[10px] px-2.5 py-0.5 rounded-md shadow-xs">
                      TODAY
                    </span>
                  </div>

                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'customer' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 shadow-xs space-y-2 whitespace-pre-wrap ${
                          msg.sender === 'customer'
                            ? 'bg-[#d9fdd3] text-slate-900 dark:bg-[#005c4b] dark:text-emerald-50 rounded-tr-none'
                            : 'bg-white text-slate-900 dark:bg-[#202c33] dark:text-slate-100 rounded-tl-none'
                        }`}
                      >
                        <p className="text-[11px] leading-relaxed">{msg.text}</p>

                        {/* If product card attached */}
                        {msg.productCard && (
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 mt-2">
                            <span className="font-bold text-blue-600 dark:text-cyan-400 text-xs">
                              🌟 {msg.productCard.brand} {msg.productCard.model}
                            </span>
                            <div className="text-[10px] text-slate-600 dark:text-slate-300">
                              <div>💰 Offer Price: <strong className="text-emerald-600">₹{msg.productCard.sellingPrice.toLocaleString('en-IN')}</strong> (MRP ₹{msg.productCard.mrp.toLocaleString('en-IN')})</div>
                              <div>⚡ {msg.productCard.capacityLph} LPH • {msg.productCard.storageLiters}L Tank</div>
                            </div>
                            <button
                              onClick={() => handleSendSimMessage(`I want to buy ${msg.productCard?.brand} ${msg.productCard?.model}`)}
                              className="w-full py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] transition"
                            >
                              Confirm Purchase / Book Demo
                            </button>
                          </div>
                        )}

                        <span className="block text-[9px] text-right text-slate-400 mt-1">
                          {msg.timestamp}
                        </span>
                      </div>

                      {/* Interactive Option Buttons if present */}
                      {msg.options && msg.options.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
                          {msg.options.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => handleSendSimMessage(opt.label)}
                              className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-slate-700 rounded-full text-[10px] font-semibold shadow-xs transition"
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Chat Input Bar */}
                <div className="p-2.5 bg-white dark:bg-[#202c33] border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    value={inputSimText}
                    onChange={(e) => setInputSimText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendSimMessage();
                    }}
                    placeholder="Type as customer (e.g., '1', 'buy new purifier', 'amc cost')..."
                    className="flex-1 px-3 py-2 bg-slate-100 dark:bg-[#2a3942] text-slate-900 dark:text-slate-100 rounded-full text-xs outline-none placeholder:text-slate-400"
                  />
                  <button
                    onClick={() => handleSendSimMessage()}
                    className="p-2 bg-[#00a884] hover:bg-[#069677] text-white rounded-full transition shadow-xs"
                    title="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PURIFIER PRODUCTS CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                <span>Brand New Purifier Products for WhatsApp Commerce</span>
              </h3>
              <p className="text-xs text-slate-500">
                Customers can view these models, check features, and place purchase orders directly over WhatsApp.
              </p>
            </div>

            <button
              onClick={() => setIsAddProductModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Purifier Model</span>
            </button>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {purifierProducts.map((product) => {
              const waText = formatPurifierProductForWhatsApp(product, business);
              const testPhone = business.whatsappNumber || '919849012345';
              const waLink = generateWhatsAppLink(testPhone, waText);

              return (
                <div
                  key={product.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-400 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded-md">
                          {product.brand}
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base mt-1">
                          {product.model}
                        </h4>
                        <p className="text-xs text-slate-500">{product.purifierType}</p>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`Remove ${product.model} from catalog?`)) {
                            deletePurifierProduct(product.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Pricing */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-slate-400 line-through mr-2">
                          ₹{product.mrp.toLocaleString('en-IN')}
                        </span>
                        <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                          ₹{product.sellingPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                        In Stock
                      </span>
                    </div>

                    {/* Specs Pills */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-600 dark:text-slate-400">
                      <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <span className="block font-bold text-slate-800 dark:text-slate-200">{product.capacityLph} LPH</span>
                        <span>Speed</span>
                      </div>
                      <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <span className="block font-bold text-slate-800 dark:text-slate-200">{product.storageLiters} Liters</span>
                        <span>Tank</span>
                      </div>
                      <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <span className="block font-bold text-slate-800 dark:text-slate-200">{product.stagesCount} Stages</span>
                        <span>Filter</span>
                      </div>
                    </div>

                    {/* Features list */}
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      {product.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Share on WhatsApp</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: 1-CLICK BULK BROADCAST */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  <span>Manual Bulk Message Broadcast</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Type any custom announcement or offer and blast it to your customers in 1 click.
                </p>
              </div>

              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-extrabold text-xs rounded-full">
                Targeting {targetCount} Customer{targetCount === 1 ? '' : 's'}
              </span>
            </div>

            {/* Target Audience Selector */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Select Recipient Group:
              </label>
              <select
                value={broadcastTarget}
                onChange={(e) => setBroadcastTarget(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="all">All Registered Customers ({customers.length})</option>
                <option value="overdue">Only Overdue Customers ({renewals.filter((r) => r.daysRemaining <= 0).length})</option>
                <option value="due_soon">Customers Due Within 15 Days</option>
                <option value="amc_active">Active AMC Subscribers</option>
              </select>
            </div>

            {/* Message Area */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Type Custom Message:
                </label>
                <span className="text-[11px] text-slate-400">Click tags below to insert dynamic data</span>
              </div>

              <textarea
                rows={6}
                value={manualBroadcastText}
                onChange={(e) => setManualBroadcastText(e.target.value)}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Type your message here..."
              />

              {/* Tag inserters */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { tag: '{{customerName}}', label: 'Customer Name' },
                  { tag: '{{businessName}}', label: 'Business Name' },
                  { tag: '{{businessPhone}}', label: 'Business Phone' },
                  { tag: '{{businessAddress}}', label: 'Business Address' },
                  { tag: '{{businessWebsite}}', label: 'Website Link' },
                  { tag: '{{phone}}', label: 'Phone' },
                  { tag: '{{purifierBrand}}', label: 'RO Brand' },
                  { tag: '{{dueDate}}', label: 'Due Date' },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => setManualBroadcastText((prev) => `${prev} ${item.tag}`)}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 transition"
                  >
                    + {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Media Attachment Control (Photos & Videos) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  <span>Attach Media (Photo / Video for Customers):</span>
                </span>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,video/*"
                  onChange={handleMediaUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{attachedMedia ? 'Change Photo / Video' : 'Add Photo / Video'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Samples */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
                <span className="text-slate-400">Quick Media Presets:</span>
                <button
                  type="button"
                  onClick={() =>
                    setAttachedMedia({
                      url: 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?w=800&auto=format&fit=crop&q=80',
                      type: 'image',
                      name: 'RO_Filter_Service_Offer.jpg',
                    })
                  }
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-400 font-medium transition"
                >
                  📷 Filter Replacement Offer
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAttachedMedia({
                      url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=800&auto=format&fit=crop&q=80',
                      type: 'image',
                      name: 'New_RO_Purifier_Launch.jpg',
                    })
                  }
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-400 font-medium transition"
                >
                  📷 New Purifier Model Poster
                </button>
              </div>

              {/* Display Attached Media info */}
              {attachedMedia && (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {attachedMedia.type === 'image' ? (
                      <img
                        src={attachedMedia.url}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0">
                        <VideoIcon className="w-6 h-6 text-cyan-400" />
                      </div>
                    )}
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {attachedMedia.name}
                      </p>
                      <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{attachedMedia.type === 'video' ? 'Video Attached & Ready' : 'Photo Attached & Ready'}</span>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAttachedMedia(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                    title="Remove media"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                </div>
              )}
            </div>

            {/* Send Action */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="text-[11px] text-slate-400">
                🔒 Safe anti-ban throttle active (dispatched via queue).
              </div>

              <button
                disabled={isBroadcasting}
                onClick={handleExecuteBroadcast}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
              >
                {isBroadcasting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message To All ({targetCount})</span>
                  </>
                )}
              </button>
            </div>

            {broadcastFeedback && (
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 text-xs font-bold rounded-2xl border border-blue-200 dark:border-blue-800">
                {broadcastFeedback}
              </div>
            )}
          </div>

          {/* Right Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Live Customer WhatsApp Preview
              </h4>

              <div className="bg-[#e5ddd5] dark:bg-[#0b141a] p-4 rounded-2xl shadow-inner text-xs space-y-2">
                <div className="max-w-[90%] bg-white dark:bg-[#202c33] text-slate-900 dark:text-slate-100 p-3 rounded-2xl rounded-tl-none shadow-xs space-y-2">
                  {/* Attached Media in Chat Bubble */}
                  {attachedMedia && (
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 mb-2">
                      {attachedMedia.type === 'image' ? (
                        <img
                          src={attachedMedia.url}
                          alt="Broadcast attachment"
                          className="w-full max-h-48 object-cover rounded-xl"
                        />
                      ) : (
                        <video
                          src={attachedMedia.url}
                          controls
                          className="w-full max-h-48 rounded-xl bg-black"
                        />
                      )}
                    </div>
                  )}

                  <p className="text-[11px] leading-relaxed whitespace-pre-wrap">
                    {appendBusinessFooter(
                      manualBroadcastText
                        .replace(/\{\{customerName\}\}/g, 'Rajesh Kumar')
                        .replace(/\{\{businessName\}\}/g, business.name)
                        .replace(/\{\{businessPhone\}\}/g, business.phone)
                        .replace(
                          /\{\{businessAddress\}\}/g,
                          `${business.address}, ${business.city}, ${business.state} ${business.pincode}`
                        )
                        .replace(/\{\{businessWebsite\}\}/g, business.website || '')
                        .replace(/\{\{phone\}\}/g, '9849012345')
                        .replace(/\{\{purifierBrand\}\}/g, 'Kent Grand+')
                        .replace(/\{\{dueDate\}\}/g, '15/11/2026'),
                      business
                    )}
                  </p>
                  <span className="block text-[9px] text-right text-slate-400">
                    10:30 AM ✓✓
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                Preview rendered with sample customer &ldquo;Rajesh Kumar&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}


      {/* TAB 4: AUTOMATED DUE REMINDERS ENGINE */}
      {activeTab === 'reminders' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span>Automated Service Due Reminders Engine</span>
              </h3>
              <p className="text-xs text-slate-500">
                Automatically calculates customer due dates and sends sequential WhatsApp reminders on schedule.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {autoReminderConfig.enabled ? 'Engine Active' : 'Engine Paused'}
              </span>
              <button
                onClick={() =>
                  updateAutoReminderConfig({ enabled: !autoReminderConfig.enabled })
                }
                className={`p-2 rounded-xl transition ${
                  autoReminderConfig.enabled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {autoReminderConfig.enabled ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quiet hours setting */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Quiet Hours / Anti-Disturbance Window:
              </span>
              <p className="text-slate-500">
                Never send automated messages during late night or early morning hours.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono">19:30 to 09:00</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-bold">
                ENFORCED
              </span>
            </div>
          </div>

          {/* Stages Breakdown */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
              Configured Automated Outreach Stages:
            </h4>

            <div className="space-y-2.5">
              {autoReminderConfig.stages.map((stage, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-white">{stage.label}</h5>
                      <p className="text-[11px] text-slate-500">
                        Trigger: {stage.daysBeforeOrAfter > 0 ? `${stage.daysBeforeOrAfter} days before due date` : stage.daysBeforeOrAfter === 0 ? 'On exact due date' : `${Math.abs(stage.daysBeforeOrAfter)} days after due date`}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1 rounded-full">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TEMPLATES HUB */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* Header Controls & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  <span>WhatsApp Template Library & Multi-Language Hub</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  12 pre-approved templates in English, Telugu, Hindi, and Hinglish with automatic business address & website footer.
                </p>
              </div>

              {/* Live Preview Toggle */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-2">
                  {templateShowLivePreview ? 'Live Business Preview' : 'Raw {{tags}} Mode'}
                </span>
                <button
                  type="button"
                  onClick={() => setTemplateShowLivePreview((prev) => !prev)}
                  className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
                    templateShowLivePreview
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {templateShowLivePreview ? 'Live Active' : 'Switch to Live'}
                </button>
              </div>
            </div>

            {/* Search & Category Filter Pills */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'ALL', label: 'All Templates' },
                  { id: 'SERVICE_REMINDERS', label: 'Service Reminders' },
                  { id: 'OPERATIONS', label: 'Operations & Dispatch' },
                  { id: 'BILLING_AMC', label: 'Billing & AMC' },
                  { id: 'MARKETING', label: 'Promotions & Care' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setTemplateCategoryFilter(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      templateCategoryFilter === cat.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={templateSearchQuery}
                  onChange={(e) => setTemplateSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {Object.entries(WHATSAPP_TEMPLATES)
              .filter(([key, tpl]) => {
                const matchesCategory =
                  templateCategoryFilter === 'ALL' || tpl.category === templateCategoryFilter;
                const matchesSearch =
                  !templateSearchQuery.trim() ||
                  key.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
                  tpl.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
                  tpl.description.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
                  Object.values(tpl.languages).some((txt) =>
                    txt.toLowerCase().includes(templateSearchQuery.toLowerCase())
                  );
                return matchesCategory && matchesSearch;
              })
              .map(([key, tpl]) => {
                const currentLang: LanguageCode = templateActiveLanguages[key] || 'en';
                const rawText = tpl.languages[currentLang] || tpl.languages.en;

                const displayedText = templateShowLivePreview
                  ? interpolateTemplate(rawText, {
                      customerName: 'Rajesh Kumar',
                      purifierBrand: 'Kent Grand+',
                      purifierModel: 'Alkaline RO',
                      dueDate: '15/11/2026',
                      businessName: business.name,
                      ownerName: business.ownerName || 'Service Desk',
                      businessAddress: `${business.address}, ${business.city}`,
                      businessPhone: business.phone,
                      businessWebsite: business.website,
                      technicianName: 'Suresh Kumar',
                      scheduledDate: 'Tomorrow',
                      scheduledTime: '11:00 AM',
                      amount: 650,
                    })
                  : rawText;

                const isCopied = copiedTemplateKey === key;

                return (
                  <div
                    key={key}
                    className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded-md">
                            {key}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                              tpl.category === 'SERVICE_REMINDERS'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : tpl.category === 'OPERATIONS'
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                : tpl.category === 'BILLING_AMC'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            }`}
                          >
                            {tpl.category.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Language Selector on Card */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          {(['en', 'te', 'hi', 'hinglish'] as LanguageCode[]).map((l) => (
                            <button
                              key={l}
                              type="button"
                              onClick={() =>
                                setTemplateActiveLanguages((prev) => ({ ...prev, [key]: l }))
                              }
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase transition ${
                                currentLang === l
                                  ? 'bg-blue-600 text-white shadow-2xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                              title={`Switch to ${l.toUpperCase()}`}
                            >
                              {l === 'hinglish' ? 'Hing' : l}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {tpl.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          {tpl.description}
                        </p>
                      </div>

                      {/* WhatsApp Bubble Preview */}
                      <div className="bg-[#e5ddd5] dark:bg-[#0b141a] p-3.5 rounded-2xl text-xs space-y-1.5 shadow-inner">
                        <div className="bg-white dark:bg-[#202c33] text-slate-900 dark:text-slate-100 p-3 rounded-2xl rounded-tl-none shadow-xs space-y-2">
                          <p className="text-[11px] leading-relaxed whitespace-pre-wrap font-sans">
                            {displayedText}
                          </p>
                          <span className="block text-[9px] text-right text-slate-400">
                            10:30 AM ✓✓
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(displayedText);
                            setCopiedTemplateKey(key);
                            setTimeout(() => setCopiedTemplateKey(null), 2000);
                          }}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Text</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setManualBroadcastText(rawText);
                            setActiveTab('broadcast');
                          }}
                          className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                          title="Load this template into Bulk Broadcast"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Use in Broadcast</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const url = generateWhatsAppLink(
                            business.phone || business.whatsappNumber || '',
                            displayedText
                          );
                          window.open(url, '_blank');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                        title="Open in WhatsApp click-to-chat"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Test Send</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 6: LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Broadcast Campaigns Table */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-emerald-600" />
              <span>Bulk Broadcast Campaigns History</span>
            </h3>

            {broadcastLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No broadcast campaigns sent yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Time</th>
                      <th className="p-3">Target Audience</th>
                      <th className="p-3">Recipients</th>
                      <th className="p-3">Media Attached</th>
                      <th className="p-3">Message Text</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {broadcastLogs.map((bc) => (
                      <tr key={bc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3 text-slate-500 text-[11px] whitespace-nowrap">
                          {bc.sentAt ? formatDateTimeDDMMYYYY(bc.sentAt) : 'Recent'}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold text-[10px] uppercase">
                            {bc.targetAudience}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {bc.recipientCount} customers
                        </td>
                        <td className="p-3">
                          {bc.mediaUrl ? (
                            <div className="flex items-center gap-2">
                              {bc.mediaType === 'image' ? (
                                <img
                                  src={bc.mediaUrl}
                                  alt="Attached"
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400">
                                  <VideoIcon className="w-4 h-4" />
                                </div>
                              )}
                              <span className="text-[10px] font-bold text-blue-600 dark:text-cyan-400">
                                {bc.mediaType === 'video' ? '🎥 Video' : '📷 Photo'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">None (Text only)</span>
                          )}
                        </td>
                        <td className="p-3 max-w-xs truncate text-slate-600 dark:text-slate-300">
                          {bc.messageText}
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold rounded-full text-[10px]">
                            {bc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Individual Dispatches Table */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Recent WhatsApp Individual Customer Messages</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Channel / Type</th>
                    <th className="p-3">Media / Message</th>
                    <th className="p-3">Time</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {communications.slice(0, 15).map((log) => {
                    const cust = customers.find((c) => c.id === log.customerId);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {cust?.fullName || 'Customer'}
                          <span className="block text-[10px] text-slate-400">{cust?.mobileNumber}</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded font-medium text-[10px]">
                            {log.templateKey || log.channel}
                          </span>
                        </td>
                        <td className="p-3 max-w-xs text-slate-600 dark:text-slate-400">
                          {log.mediaUrl && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-cyan-400 mr-2 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                              {log.mediaType === 'video' ? '🎥 Video' : '📷 Photo'}
                            </span>
                          )}
                          <span className="truncate">{log.messageText}</span>
                        </td>
                        <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">
                          {log.sentAt ? formatDateTimeDDMMYYYY(log.sentAt) : 'Today'}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold rounded-full text-[10px]">
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD PURIFIER PRODUCT */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                <span>Add Purifier Product to Catalog</span>
              </h3>
              <button
                onClick={() => setIsAddProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Brand</label>
                  <select
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Kent">Kent</option>
                    <option value="Aquaguard">Aquaguard</option>
                    <option value="Pureit">Pureit</option>
                    <option value="Havells">Havells</option>
                    <option value="Livpure">Livpure</option>
                    <option value="AO Smith">AO Smith</option>
                    <option value="Blue Star">Blue Star</option>
                    <option value="Commercial RO">Commercial RO</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Model Name</label>
                  <input
                    type="text"
                    required
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    placeholder="e.g. Grand Plus Alkaline"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">MRP (₹)</label>
                  <input
                    type="number"
                    value={newMrp}
                    onChange={(e) => setNewMrp(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Warranty (Months)</label>
                  <input
                    type="number"
                    value={newWarranty}
                    onChange={(e) => setNewWarranty(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Speed (LPH)</label>
                  <input
                    type="number"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Storage Tank (L)</label>
                  <input
                    type="number"
                    value={newStorage}
                    onChange={(e) => setNewStorage(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Stages Count</label>
                  <input
                    type="number"
                    value={newStages}
                    onChange={(e) => setNewStages(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Features (Comma separated)</label>
                <input
                  type="text"
                  value={newFeatures}
                  onChange={(e) => setNewFeatures(e.target.value)}
                  placeholder="Alkaline booster, TDS controller, LED indicators"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md"
                >
                  Save & Publish Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
