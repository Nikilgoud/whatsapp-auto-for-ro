import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_DIR = 'C:\\Users\\user\\OneDrive\\Desktop\\ro-water-purifier-service-reminder';
const OUTPUT_DIR = path.join(BASE_DIR, 'ad-recordings', 'hd_assets');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture() {
  console.log('Launching Chrome for 1080p HD Asset Generation...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080', '--force-device-scale-factor=1.25'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1.25 });

  console.log('Opening http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await sleep(1500);

  // 1. Dashboard Overview & Money Left on Table
  console.log('Capturing hd_01_dashboard_revenue.png ...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'hd_01_dashboard_revenue.png') });

  // 2. Renewals Pipeline
  console.log('Navigating to Renewals...');
  const navBtns = await page.$$('nav button');
  if (navBtns[1]) {
    await navBtns[1].click();
    await sleep(800);
    console.log('Capturing hd_02_urgency_pipeline.png ...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'hd_02_urgency_pipeline.png') });
  }

  // 3. WhatsApp Reminder Modal
  console.log('Opening WhatsApp reminder modal...');
  const waBtn = await page.$('button[title*="WhatsApp"]');
  if (waBtn) {
    await waBtn.click();
    await sleep(800);
    console.log('Capturing hd_03_whatsapp_reminder.png ...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'hd_03_whatsapp_reminder.png') });
    
    // Close modal
    const closeBtn = await page.$('div.fixed button');
    if (closeBtn) await closeBtn.click();
    await sleep(400);
  }

  // 4. Customers 360 View
  console.log('Navigating to Customers & 360 History...');
  const navBtnsCust = await page.$$('nav button');
  if (navBtnsCust[2]) {
    await navBtnsCust[2].click();
    await sleep(800);
    
    const allBtns = await page.$$('button');
    for (const b of allBtns) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('View 360')) {
        await b.click();
        break;
      }
    }
    await sleep(800);
    console.log('Capturing hd_04_customer_360.png ...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'hd_04_customer_360.png') });
    
    // Close 360
    const closeBtn360 = await page.$('div.fixed button');
    if (closeBtn360) await closeBtn360.click();
    await sleep(400);
  }

  // 5. Service Operations & Dispatch Modal
  console.log('Navigating to Service Ops & Technician Dispatch...');
  const navBtnsOps = await page.$$('nav button');
  if (navBtnsOps[3]) {
    await navBtnsOps[3].click();
    await sleep(800);
    
    const assignBtns = await page.$$('button');
    for (const b of assignBtns) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && (text.includes('Assign') || text.includes('Dispatch'))) {
        await b.click();
        break;
      }
    }
    await sleep(800);
    console.log('Capturing hd_05_technician_dispatch.png ...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'hd_05_technician_dispatch.png') });
    
    // Close modal
    const closeBtnOps = await page.$('div.fixed button');
    if (closeBtnOps) await closeBtnOps.click();
    await sleep(400);
  }

  // 6. Spares Inventory
  console.log('Navigating to Spares Inventory...');
  const navBtnsInv = await page.$$('nav button');
  if (navBtnsInv[5]) {
    await navBtnsInv[5].click();
    await sleep(800);
    console.log('Capturing hd_06_spares_inventory.png ...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'hd_06_spares_inventory.png') });
  }

  // 7. Printable GST & UPI Invoice
  console.log('Navigating to Invoices & Printing...');
  const navBtnsBill = await page.$$('nav button');
  if (navBtnsBill[6]) {
    await navBtnsBill[6].click();
    await sleep(800);
    
    const printBtns = await page.$$('button');
    for (const b of printBtns) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('Print')) {
        await b.click();
        break;
      }
    }
    await sleep(800);
    console.log('Capturing hd_07_upi_invoice.png ...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'hd_07_upi_invoice.png') });
    
    // Close print modal
    const closeBtnPrint = await page.$('div.fixed button');
    if (closeBtnPrint) await closeBtnPrint.click();
    await sleep(400);
  }

  // 8. Mobile 9:16 Vertical View
  console.log('Capturing Mobile 9:16 vertical view...');
  await page.setViewport({ width: 430, height: 932, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await sleep(1000);
  console.log('Capturing hd_08_mobile_dashboard.png ...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'hd_08_mobile_dashboard.png') });

  // Open mobile menu
  const menuBtn = await page.$('button svg.lucide-menu');
  if (menuBtn) {
    const parent = await menuBtn.getProperty('parentElement');
    await parent.asElement().click();
    await sleep(500);
    console.log('Capturing hd_09_mobile_menu.png ...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'hd_09_mobile_menu.png') });
  }

  await browser.close();
  console.log('All 1080p HD assets captured successfully in ad-recordings/hd_assets!');
}

capture().catch(err => {
  console.error('Error during HD capture:', err);
  process.exit(1);
});
