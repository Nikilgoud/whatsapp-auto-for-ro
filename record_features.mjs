import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve('ad-recordings');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function record() {
  console.log('Launching Chrome from:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await sleep(1500);

  // 1. Dashboard Overview
  console.log('Capturing 01_dashboard_revenue_overview.png ...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_dashboard_revenue_overview.png') });

  // 2. Click Renewals Tab
  console.log('Navigating to Renewals Pipeline...');
  const renewalsBtn = await page.$('nav button:nth-child(2)');
  if (renewalsBtn) await renewalsBtn.click();
  await sleep(1000);
  console.log('Capturing 02_renewals_urgency_pipeline.png ...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_renewals_urgency_pipeline.png') });

  // 3. Open WhatsApp Reminder Modal
  console.log('Opening WhatsApp Reminder...');
  const waBtn = await page.$('button[title*="WhatsApp"]');
  if (waBtn) {
    await waBtn.click();
    await sleep(800);
    console.log('Capturing 03_whatsapp_reminder_modal.png ...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03_whatsapp_reminder_modal.png') });
    // Close modal
    const closeBtn = await page.$('div.fixed button:has(svg.lucide-x)');
    if (closeBtn) await closeBtn.click();
    await sleep(500);
  }

  // 4. Click Customers Tab & Customer 360
  console.log('Navigating to Customers Directory...');
  const custBtn = await page.$('nav button:nth-child(3)');
  if (custBtn) await custBtn.click();
  await sleep(1000);
  console.log('Capturing 04_customers_directory.png ...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_customers_directory.png') });

  // Click on first customer for 360 view
  const firstCustomer = await page.$('table tbody tr:first-child button');
  if (firstCustomer) {
    await firstCustomer.click();
    await sleep(800);
    console.log('Capturing 05_customer_360_history_view.png ...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05_customer_360_history_view.png') });
    const close360 = await page.$('div.fixed button:has(svg.lucide-x)');
    if (close360) await close360.click();
    await sleep(500);
  }

  // 5. Click Services Tab (Field Dispatch)
  console.log('Navigating to Services Operations...');
  const srvBtn = await page.$('nav button:nth-child(4)');
  if (srvBtn) await srvBtn.click();
  await sleep(1000);
  console.log('Capturing 06_service_operations.png ...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_service_operations.png') });

  // Click WhatsApp Tech Dispatch using xpath or evaluate
  console.log('Opening WhatsApp Tech Dispatch modal...');
  const techBtns = await page.$$('table tbody tr td:last-child button');
  if (techBtns.length > 0) {
    await techBtns[0].click();
    await sleep(800);
    console.log('Capturing 07_technician_whatsapp_dispatch_modal.png ...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '07_technician_whatsapp_dispatch_modal.png') });
    const closeTechModal = await page.$('div.fixed button:has(svg.lucide-x)');
    if (closeTechModal) await closeTechModal.click();
    await sleep(500);
  }

  // 6. Technicians Manager
  console.log('Navigating to Technicians tab...');
  const techTab = await page.$('nav button:nth-child(7)');
  if (techTab) await techTab.click();
  await sleep(1000);
  console.log('Capturing 08_technicians_management.png ...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_technicians_management.png') });

  // 7. Inventory Spares
  console.log('Navigating to Inventory...');
  const invTab = await page.$('nav button:nth-child(8)');
  if (invTab) await invTab.click();
  await sleep(1000);
  console.log('Capturing 09_inventory_spares_lowstock.png ...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_inventory_spares_lowstock.png') });

  // 8. Invoices & Billing
  console.log('Navigating to Invoices...');
  const invcTab = await page.$('nav button:nth-child(9)');
  if (invcTab) await invcTab.click();
  await sleep(1000);
  console.log('Capturing 10_invoices_billing_list.png ...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10_invoices_billing_list.png') });

  // Open Printable Invoice Preview
  const viewInvoiceBtn = await page.$('table tbody tr:first-child button');
  if (viewInvoiceBtn) {
    await viewInvoiceBtn.click();
    await sleep(800);
    console.log('Capturing 11_printable_invoice_with_upi_qr.png ...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '11_printable_invoice_with_upi_qr.png') });
    const closeInvoice = await page.$('div.fixed button:has(svg.lucide-x)');
    if (closeInvoice) await closeInvoice.click();
    await sleep(500);
  }

  // 9. Business Profile Settings
  console.log('Navigating to Settings...');
  const allNavBtns = await page.$$('nav button');
  if (allNavBtns.length > 0) {
    await allNavBtns[allNavBtns.length - 1].click();
    await sleep(1000);
    console.log('Capturing 12_business_profile_settings.png ...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '12_business_profile_settings.png') });
  }

  // 10. Mobile Viewport Recording (9:16 vertical for UGC ad)
  console.log('Switching to Mobile 9:16 Viewport for ad clips...');
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await sleep(1200);
  console.log('Capturing 13_mobile_dashboard_vertical.png ...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '13_mobile_dashboard_vertical.png') });

  // Mobile hamburger menu
  const mobileMenuBtn = await page.$('header button');
  if (mobileMenuBtn) {
    await mobileMenuBtn.click();
    await sleep(600);
    console.log('Capturing 14_mobile_navigation_drawer.png ...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '14_mobile_navigation_drawer.png') });
  }

  await browser.close();
  console.log('SUCCESS! All ad asset screenshots captured in', OUTPUT_DIR);
}

record().catch((err) => {
  console.error('Error during recording:', err);
  process.exit(1);
});
