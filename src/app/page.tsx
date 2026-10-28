'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Customer, Purifier, Renewal } from '@/types';
import { Sidebar } from '@/components/ui/Sidebar';
import { TopNav } from '@/components/ui/TopNav';
import { BottomNav } from '@/components/ui/BottomNav';
import { OwnerDashboard } from '@/components/dashboard/OwnerDashboard';
import { RenewalsPipeline } from '@/components/renewals/RenewalsPipeline';
import { CustomerList } from '@/components/customers/CustomerList';
import { ServiceList } from '@/components/services/ServiceList';
import { ServiceCalendar } from '@/components/services/ServiceCalendar';
import { AMCManager } from '@/components/amc/AMCManager';
import { TechniciansManager } from '@/components/services/TechniciansManager';
import { InventoryManager } from '@/components/inventory/InventoryManager';
import { InvoiceManager } from '@/components/invoices/InvoiceManager';
import { BusinessReports } from '@/components/reports/BusinessReports';
import { SettingsManager } from '@/components/settings/SettingsManager';
import { WhatsAppAutomationHub } from '@/components/whatsapp-automation/WhatsAppAutomationHub';

// Global Modals

import { AddCustomerModal } from '@/components/customers/AddCustomerModal';
import { ImportCustomersModal } from '@/components/customers/ImportCustomersModal';
import { ScheduleServiceModal } from '@/components/services/ScheduleServiceModal';
import { Customer360Modal } from '@/components/customers/Customer360Modal';
import { GlobalSearchModal } from '@/components/ui/GlobalSearchModal';
import { VideoWalkthroughModal } from '@/components/ui/VideoWalkthroughModal';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals state
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selected360Customer, setSelected360Customer] = useState<Customer | null>(null);

  // Preselected info for booking
  const [scheduleCustomer, setScheduleCustomer] = useState<Customer | null>(null);
  const [schedulePurifier, setSchedulePurifier] = useState<Purifier | null>(null);

  const { customers, purifiers } = useApp();

  const handleOpenScheduleForCustomer = (cust: Customer, pur?: Purifier) => {
    setScheduleCustomer(cust);
    setSchedulePurifier(pur || null);
    setIsScheduleOpen(true);
  };

  const handleScheduleForRenewal = (rnw: Renewal) => {
    const cust = customers.find((c) => c.id === rnw.customerId);
    const pur = purifiers.find((p) => p.id === rnw.purifierId);
    setScheduleCustomer(cust || null);
    setSchedulePurifier(pur || null);
    setIsScheduleOpen(true);
  };

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Left Sidebar (Desktop fixed, Mobile sliding drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <TopNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
          onOpenScheduleService={() => {
            setScheduleCustomer(null);
            setSchedulePurifier(null);
            setIsScheduleOpen(true);
          }}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenVideoTour={() => setIsVideoModalOpen(true)}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-thin">
          <div className="max-w-7xl mx-auto pb-24 lg:pb-12">
            {activeTab === 'dashboard' && (
              <OwnerDashboard
                onNavigate={(tab) => setActiveTab(tab)}
                onSelectCustomer={(cust) => setSelected360Customer(cust)}
                onScheduleForRenewal={handleScheduleForRenewal}
              />
            )}

            {activeTab === 'whatsapp-automation' && (
              <WhatsAppAutomationHub />
            )}

            {activeTab === 'renewals' && (
              <RenewalsPipeline
                onSelectCustomer={(cust) => setSelected360Customer(cust)}
                onScheduleForRenewal={handleScheduleForRenewal}
              />
            )}


            {activeTab === 'customers' && (
              <CustomerList
                onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
                onOpenImport={() => setIsImportOpen(true)}
                onBookService={handleOpenScheduleForCustomer}
              />
            )}

            {activeTab === 'services' && (
              <ServiceList
                onOpenSchedule={() => {
                  setScheduleCustomer(null);
                  setSchedulePurifier(null);
                  setIsScheduleOpen(true);
                }}
                onSelectCustomer={(cust) => setSelected360Customer(cust)}
              />
            )}

            {activeTab === 'calendar' && (
              <ServiceCalendar
                onSelectCustomer={(cust) => setSelected360Customer(cust)}
                onOpenSchedule={() => {
                  setScheduleCustomer(null);
                  setSchedulePurifier(null);
                  setIsScheduleOpen(true);
                }}
              />
            )}

            {activeTab === 'amc' && <AMCManager />}

            {activeTab === 'technicians' && (
              <TechniciansManager
                onOpenSchedule={(techId) => {
                  setScheduleCustomer(null);
                  setSchedulePurifier(null);
                  setIsScheduleOpen(true);
                }}
                onSelectCustomer={(cust) => setSelected360Customer(cust)}
              />
            )}

            {activeTab === 'inventory' && <InventoryManager />}

            {activeTab === 'invoices' && <InvoiceManager />}
            {activeTab === 'reports' && <BusinessReports />}

            {activeTab === 'settings' && <SettingsManager />}
          </div>
        </main>
      </div>

      {/* MODALS */}
      {isAddCustomerOpen && (
        <AddCustomerModal
          isOpen={isAddCustomerOpen}
          onClose={() => setIsAddCustomerOpen(false)}
        />
      )}

      {isImportOpen && (
        <ImportCustomersModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
        />
      )}

      {isScheduleOpen && (
        <ScheduleServiceModal
          isOpen={isScheduleOpen}
          onClose={() => {
            setIsScheduleOpen(false);
            setScheduleCustomer(null);
            setSchedulePurifier(null);
          }}
          preselectedCustomer={scheduleCustomer}
          preselectedPurifier={schedulePurifier}
        />
      )}

      {selected360Customer && (
        <Customer360Modal
          isOpen={!!selected360Customer}
          onClose={() => setSelected360Customer(null)}
          customer={selected360Customer}
          onBookService={handleOpenScheduleForCustomer}
        />
      )}

      {isSearchOpen && (
        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectCustomer={(cust) => setSelected360Customer(cust)}
        />
      )}

      {/* Telugu Video Tour Walkthrough Modal */}
      <VideoWalkthroughModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSidebar={() => setIsMobileSidebarOpen(true)}
      />
    </div>
  );
}
