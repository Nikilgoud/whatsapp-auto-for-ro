'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Technician } from '@/types';
import { X, UserPlus, Phone, MapPin, Wrench, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface AddTechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTechnicianModal: React.FC<AddTechnicianModalProps> = ({ isOpen, onClose }) => {
  const { business, addTechnician } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [serviceAreas, setServiceAreas] = useState('Kondapur, Madhapur, Gachibowli');
  const [currentLocation, setCurrentLocation] = useState('Hyderabad');
  const [skills, setSkills] = useState<string[]>([
    'Domestic RO',
    'Membrane Replacement',
    'TDS Calibration',
  ]);

  if (!isOpen) return null;

  const toggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter((s) => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert('Please fill technician name and phone number');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanWhatsapp = (whatsappNumber || phone).replace(/\D/g, '').slice(-10);

    const areasList = serviceAreas
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    addTechnician({
      businessId: business.id,
      name,
      phone: cleanPhone,
      whatsappNumber: `91${cleanWhatsapp}`,
      email: email || undefined,
      serviceAreas: areasList.length > 0 ? areasList : ['Hyderabad Central'],
      skills: skills.length > 0 ? skills : ['Domestic RO'],
      status: 'Available',
      joiningDate: format(new Date(), 'yyyy-MM-dd'),
      currentLocation: currentLocation || 'Hyderabad',
    });

    alert(`Technician ${name} added successfully! You can now assign scheduled customer jobs to them.`);
    onClose();
    // reset
    setName('');
    setPhone('');
    setWhatsappNumber('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Add New Technician</h3>
              <p className="text-xs text-slate-500">Register field serviceman for WhatsApp job dispatches</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Technician Full Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Ramesh Goud or Naresh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number (Calling) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">+91</span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, ''));
                    if (!whatsappNumber) setWhatsappNumber(e.target.value.replace(/\D/g, ''));
                  }}
                  className="w-full pl-11 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp Number (For Job Dispatches) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">+91</span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="98765 43210"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-11 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Assigned Service Localities (Comma separated) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kondapur, Madhapur, Gachibowli, Kukatpally, Miyapur"
              value={serviceAreas}
              onChange={(e) => setServiceAreas(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              When scheduling customer jobs in these areas, this technician will be recommended first.
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Certified Technical Skills
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                'Domestic RO',
                'Commercial RO',
                'Membrane Replacement',
                'Pump Repair',
                'Electrical / SMPS',
                'TDS Calibration',
                'Leakage Specialist',
              ].map((skill) => (
                <button
                  type="button"
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                    skills.includes(skill)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {skills.includes(skill) ? '✓ ' : '+ '}
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-[11px] text-blue-900 dark:text-blue-300">
            <strong>Work Assignment Workflow:</strong> Once added, owner/manager can assign scheduled customer jobs to this technician and send complete job details (address, time, purifier, and Google Maps link) to their WhatsApp with 1 click!
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md"
            >
              Save Technician
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
