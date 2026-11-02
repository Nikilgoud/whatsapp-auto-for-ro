'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Customer, Purifier, ServiceRecord } from '@/types';
import { formatIndianCurrency } from '@/lib/utils';
import { format, addDays, subDays, startOfWeek, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Wrench, User } from 'lucide-react';

interface ServiceCalendarProps {
  onSelectCustomer: (customer: Customer) => void;
  onOpenSchedule: () => void;
}

const TIME_SLOTS = [
  '09:30 AM - 11:00 AM',
  '11:30 AM - 01:00 PM',
  '02:30 PM - 04:00 PM',
  '04:30 PM - 06:00 PM',
  '06:30 PM - 08:00 PM',
];

export const ServiceCalendar: React.FC<ServiceCalendarProps> = ({
  onSelectCustomer,
  onOpenSchedule,
}) => {
  const { services, customers, purifiers, technicians } = useApp();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');
  const dayServices = services.filter((s) => s.scheduledDate === formattedSelectedDate);

  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return addDays(start, i);
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Calendar Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <span>Service Dispatch Calendar</span>
          </h2>
          <p className="text-xs text-slate-500">
            View daily doorstep technician appointments and slot distribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-slate-800 dark:text-slate-200">
              {format(selectedDate, 'dd/MM/yyyy')}
            </span>
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700"
          >
            Today
          </button>

          <button
            onClick={onOpenSchedule}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            + New Appointment
          </button>
        </div>
      </div>

      {/* Week Day Strips */}
      <div className="grid grid-cols-7 gap-2">
        {daysOfWeek.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const dateKey = format(day, 'yyyy-MM-dd');
          const count = services.filter((s) => s.scheduledDate === dateKey).length;

          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDate(day)}
              className={`p-3 rounded-2xl border text-center transition ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <p className="text-[11px] uppercase tracking-wider font-medium opacity-80">
                {format(day, 'EEE')}
              </p>
              <p className="text-lg font-bold mt-0.5">{format(day, 'd')}</p>
              <div className="mt-1 flex items-center justify-center">
                {count > 0 ? (
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    {count} jobs
                  </span>
                ) : (
                  <span className="text-[10px] opacity-40">•</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Slots Schedule for Selected Day */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Schedule for {format(selectedDate, 'EEEE, dd/MM/yyyy')}</span>
            <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-full">
              {dayServices.length} Appointments
            </span>
          </h3>
          <span className="text-xs text-slate-400">Hyderabad Field Shifts</span>
        </div>

        <div className="space-y-3">
          {TIME_SLOTS.map((slot) => {
            const slotServices = dayServices.filter((s) => s.scheduledTimeSlot === slot);

            return (
              <div
                key={slot}
                className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2.5 w-48 shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{slot}</span>
                </div>

                <div className="flex-1">
                  {slotServices.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {slotServices.map((srv) => {
                        const customer = customers.find((c) => c.id === srv.customerId);
                        const purifier = purifiers.find((p) => p.id === srv.purifierId);
                        const tech = technicians.find((t) => t.id === srv.technicianId);
                        if (!customer) return null;

                        return (
                          <div
                            key={srv.id}
                            onClick={() => onSelectCustomer(customer)}
                            className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500 transition cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900 dark:text-white">
                                {customer.fullName}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  srv.status === 'Completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : srv.status === 'Started'
                                    ? 'bg-blue-100 text-blue-800 animate-pulse'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {srv.status}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500 mt-1">
                              📍 {customer.areaLocality} • {purifier?.brand} ({srv.serviceType})
                            </p>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                              <span className="font-semibold text-blue-600 flex items-center gap-1">
                                <User className="w-3 h-3" /> Tech: {tech?.name || 'Unassigned'}
                              </span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {formatIndianCurrency(srv.total)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No appointments booked in this slot</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
