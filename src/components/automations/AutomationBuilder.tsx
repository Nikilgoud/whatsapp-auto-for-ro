'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { AutomationSequence, AutomationStep } from '@/types';
import {
  Zap,
  Clock,
  Send,
  HelpCircle,
  Plus,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ArrowDown,
  ShieldCheck,
  Tag,
  ToggleLeft,
  ToggleRight,
  Filter,
} from 'lucide-react';

export const AutomationBuilder: React.FC = () => {
  const { automations } = useApp();
  const [activeSeq, setActiveSeq] = useState<AutomationSequence>(automations[0]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <span>Smart Follow-up Automation Sequences</span>
          </h2>
          <p className="text-xs text-slate-500">
            Automated WhatsApp outreach sequence that stops as soon as a customer responds or books.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sequence Active</span>
          </span>
        </div>
      </div>

      {/* Visual Sequence Canvas */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {activeSeq.name}
            </h3>
            <p className="text-xs text-slate-500">{activeSeq.description}</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Anti-Spam Filter ON (Quiet hours: 19:30 - 09:00)</span>
        </div>

        {/* Visual Step Blocks */}
        <div className="max-w-xl mx-auto space-y-3">
          {/* TRIGGER BLOCK */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 bg-white/20 rounded-md">
                TRIGGER
              </span>
              <Clock className="w-4 h-4 text-white/80" />
            </div>
            <h4 className="font-bold text-sm">WHEN: Service or Installation is Completed</h4>
            <p className="text-xs text-blue-100">
              System saves purifier baseline TDS and begins the 90-day countdown.
            </p>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-4 h-4 text-slate-400" />
          </div>

          {/* STEP 1 */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded">
                STEP 1: 15 DAYS BEFORE DUE DATE
              </span>
              <MessageSquare className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Action: Send Friendly WhatsApp Service Due Reminder
            </p>
            <p className="text-xs text-slate-500 italic bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
              &ldquo;Hi &#123;&#123;customer_name&#125;&#125;, your Kent RO service may be due around &#123;&#123;due_date&#125;&#125;. Reply YES to book a slot.&rdquo;
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Guard: Don&apos;t send if customer already booked appointment</span>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-4 h-4 text-slate-400" />
          </div>

          {/* STEP 2 */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded">
                STEP 2: WAIT 3 DAYS (IF NO RESPONSE)
              </span>
              <MessageSquare className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Action: Send Technician Slot Follow-up
            </p>
            <p className="text-xs text-slate-500 italic bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
              &ldquo;Just following up regarding your RO service. We have technician slots available in &#123;&#123;locality&#125;&#125; this week.&rdquo;
            </p>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-4 h-4 text-slate-400" />
          </div>

          {/* STEP 3 */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded">
                STEP 3: 7 DAYS OVERDUE
              </span>
              <AlertCircle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Action: Send Urgent Overdue Alert + Highlight Membrane Health
            </p>
            <p className="text-xs text-slate-500 italic bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
              &ldquo;Your RO service is now overdue. Regular servicing extends membrane life and keeps TDS low. Reply BOOK to send technician.&rdquo;
            </p>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-4 h-4 text-slate-400" />
          </div>

          {/* STOP CONDITION */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900 text-center space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              AUTO-TERMINATION RULE
            </span>
            <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
              Sequence immediately stops as soon as customer replies or appointment is booked!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
