'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Technician, ServiceRecord, Customer, Purifier } from '@/types';
import { formatIndianCurrency, formatDateDDMMYYYY } from '@/lib/utils';
import { AddTechnicianModal } from '@/components/technician/AddTechnicianModal';
import { SendJobToTechWhatsAppModal } from '@/components/technician/SendJobToTechWhatsAppModal';
import { Technician360Modal } from '@/components/technician/Technician360Modal';
import { generateWhatsAppLink } from '@/lib/services/whatsappEngine';
import {
  Users,
  UserPlus,
  Phone,
  MessageSquare,
  MapPin,
  CheckCircle2,
  Wrench,
  Calendar,
  Send,
  Sparkles,
  ArrowRight,
  Trash2,
  AlertTriangle,
  Award,
  ChevronRight,
} from 'lucide-react';

interface TechniciansManagerProps {
  onOpenSchedule: (technicianId?: string) => void;
  onSelectCustomer: (customer: Customer) => void;
}

export const TechniciansManager: React.FC<TechniciansManagerProps> = ({
  onOpenSchedule,
  onSelectCustomer,
}) => {
  const { technicians, services, customers, purifiers, business, deleteTechnician } = useApp();

  const [isAddTechOpen, setIsAddTechOpen] = useState(false);
  const [selectedTechFor360, setSelectedTechFor360] = useState<Technician | null>(null);
  const [selectedServiceToDispatch, setSelectedServiceToDispatch] = useState<ServiceRecord | null>(null);
  const [selectedTechForDispatch, setSelectedTechForDispatch] = useState<Technician | null>(null);
  const [techToDelete, setTechToDelete] = useState<Technician | null>(null);

  // Send daily summary to technician
  const handleSendDailySummary = (tech: Technician) => {
    const techJobs = services.filter((s) => s.technicianId === tech.id && s.status !== 'Completed');

    if (techJobs.length === 0) {
      alert(`No pending scheduled jobs assigned to ${tech.name} right now.`);
      return;
    }

    let summary = `📋 *SCHEDULED SERVICE VISITS FOR ${tech.name.toUpperCase()}*\n`;
    summary += `Dealer: ${business.name} | Date: Today / Tomorrow\n\n`;

    techJobs.forEach((job, idx) => {
      const cust = customers.find((c) => c.id === job.customerId);
      const pur = purifiers.find((p) => p.id === job.purifierId);
      const addressQuery = encodeURIComponent(`${cust?.streetAddress || ''}, ${cust?.areaLocality || ''}`);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${addressQuery}`;

      summary += `*#${idx + 1}. [${job.scheduledTimeSlot}] - ${cust?.fullName || 'Customer'}*\n`;
      summary += `• Phone: +91 ${cust?.mobileNumber}\n`;
      summary += `• Address: ${cust?.streetAddress}, ${cust?.areaLocality}\n`;
      summary += `• Purifier: ${pur?.brand || 'RO'} ${pur?.model || ''} (${job.serviceType})\n`;
      summary += `• Maps: ${mapsUrl}\n\n`;
    });

    summary += `Please call each customer before visiting. Contact office for spares.\n_${business.name}_`;

    const url = generateWhatsAppLink(tech.whatsappNumber || tech.phone, summary);
    window.open(url, '_blank');
  };

  const openDispatchModal = (service: ServiceRecord, tech: Technician) => {
    setSelectedServiceToDispatch(service);
    setSelectedTechForDispatch(tech);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Field Technicians & Work Assignment</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold">
              {technicians.length} Active Servicemen
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Owner & Manager can assign scheduled customer jobs and notify technicians on WhatsApp with 1 click.
          </p>
        </div>

        <button
          onClick={() => setIsAddTechOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Technician</span>
        </button>
      </div>

      {/* Technicians Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {technicians.map((tech) => {
          const techJobs = services.filter((s) => s.technicianId === tech.id);
          const activeJobs = techJobs.filter((s) => s.status !== 'Completed');
          const completedJobs = techJobs.filter((s) => s.status === 'Completed');

          return (
            <div
              key={tech.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Tech Profile Header */}
                <div className="flex items-start justify-between">
                  <div
                    onClick={() => setSelectedTechFor360(tech)}
                    className="flex items-center gap-3 cursor-pointer group"
                    title="Click to view Technician 360° Profile"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-md group-hover:scale-105 transition">
                      {tech.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-600 transition flex items-center gap-1">
                        <span>{tech.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        📱 +91 {tech.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tech.status === 'Available'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {tech.status}
                    </span>
                    <button
                      onClick={() => setTechToDelete(tech)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                      title={`Delete ${tech.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Workload & Stats */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-medium">Active Visits</span>
                    <span className="font-extrabold text-blue-600 mt-0.5 block text-sm">
                      {activeJobs.length}
                    </span>
                  </div>

                  <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-medium">Completed</span>
                    <span className="font-extrabold text-emerald-600 mt-0.5 block text-sm">
                      {tech.completedJobs || completedJobs.length}
                    </span>
                  </div>
                </div>

                {/* Service Localities */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Coverage Localities:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {tech.serviceAreas.map((area) => (
                      <span
                        key={area}
                        className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[10px] font-medium"
                      >
                        📍 {area}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Currently Assigned Jobs */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Assigned Customer Visits ({activeJobs.length}):
                  </span>
                  {activeJobs.length > 0 ? (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {activeJobs.map((job) => {
                        const cust = customers.find((c) => c.id === job.customerId);
                        return (
                          <div
                            key={job.id}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-[11px]"
                          >
                            <div className="truncate pr-2">
                              <span className="font-bold text-slate-900 dark:text-white truncate block">
                                {cust?.fullName || 'Customer'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {formatDateDDMMYYYY(job.scheduledDate)} • {job.scheduledTimeSlot}
                              </span>
                            </div>
                            <button
                              onClick={() => openDispatchModal(job, tech)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shrink-0 flex items-center gap-1 shadow-2xs"
                              title="Send WhatsApp update to technician"
                            >
                              <Send className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic bg-slate-50 dark:bg-slate-800/30 p-2 rounded-lg">
                      No active jobs assigned. Tap below to assign a customer visit.
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons for Owner */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  onClick={() => setSelectedTechFor360(tech)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 font-bold rounded-xl transition shadow-2xs cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Work History & Field Performance 360°</span>
                </button>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => onOpenSchedule(tech.id)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-xs"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Assign Work</span>
                  </button>

                  <button
                    onClick={() => handleSendDailySummary(tech)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send Schedule</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Technician Modal */}
      {isAddTechOpen && (
        <AddTechnicianModal
          isOpen={isAddTechOpen}
          onClose={() => setIsAddTechOpen(false)}
        />
      )}

      {/* Technician 360° Work History & Performance Modal */}
      {selectedTechFor360 && (
        <Technician360Modal
          isOpen={!!selectedTechFor360}
          onClose={() => setSelectedTechFor360(null)}
          technician={selectedTechFor360}
          onSelectCustomer={onSelectCustomer}
          onOpenSchedule={onOpenSchedule}
        />
      )}

      {/* Send Job Dispatch Modal */}
      {selectedServiceToDispatch && selectedTechForDispatch && (
        <SendJobToTechWhatsAppModal
          isOpen={!!selectedServiceToDispatch}
          onClose={() => {
            setSelectedServiceToDispatch(null);
            setSelectedTechForDispatch(null);
          }}
          service={selectedServiceToDispatch}
          customer={customers.find((c) => c.id === selectedServiceToDispatch.customerId)!}
          purifier={purifiers.find((p) => p.id === selectedServiceToDispatch.purifierId)}
          defaultTechnicianId={selectedTechForDispatch.id}
        />
      )}

      {/* Delete Confirmation Modal */}
      {techToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Delete Technician</h3>
                <p className="text-xs text-slate-500">Remove from team roster</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-900 dark:text-white">{techToDelete.name}</strong> (+91 {techToDelete.phone})?
              Any active scheduled jobs currently assigned to them will be moved back to unassigned status.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setTechToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteTechnician(techToDelete.id);
                  setTechToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Technician</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
