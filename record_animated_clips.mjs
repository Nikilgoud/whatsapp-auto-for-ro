import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROJECT_DIR = 'C:\\Users\\user\\OneDrive\\Desktop\\ro-water-purifier-service-reminder';
const OUTPUT_DIR = path.join(PROJECT_DIR, 'ad-recordings');
const TEMP_FRAMES_DIR = path.join(OUTPUT_DIR, 'temp_frames');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(TEMP_FRAMES_DIR)) fs.mkdirSync(TEMP_FRAMES_DIR, { recursive: true });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanTempFrames() {
  const files = fs.readdirSync(TEMP_FRAMES_DIR);
  for (const f of files) {
    fs.unlinkSync(path.join(TEMP_FRAMES_DIR, f));
  }
}

function compileGif(outputFilename, durationMs = 250) {
  const outPath = path.join(OUTPUT_DIR, outputFilename);
  try {
    execSync(`python compile_gif.py "${TEMP_FRAMES_DIR}" "${outPath}" ${durationMs}`, { stdio: 'inherit' });
  } catch (err) {
    console.error('GIF compile error:', err.message);
  }
}

async function run() {
  console.log('Launching browser...');
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

  // --- CLIP 1: Dashboard to WhatsApp Reminder Modal ---
  console.log('--- Recording Clip 1: Dashboard & WhatsApp Reminder ---');
  cleanTempFrames();
  let frameIdx = 0;
  const takeFrame = async () => {
    await page.screenshot({ path: path.join(TEMP_FRAMES_DIR, `frame_${String(frameIdx++).padStart(3, '0')}.png`) });
  };

  await takeFrame(); await sleep(250);
  await takeFrame(); await sleep(250);
  
  // Click Renewals
  const navBtns = await page.$$('nav button');
  if (navBtns[1]) {
    await navBtns[1].click();
    for (let i = 0; i < 4; i++) { await takeFrame(); await sleep(250); }
  }

  // Click WhatsApp Reminder
  const waBtn = await page.$('button[title*="WhatsApp"]');
  if (waBtn) {
    await waBtn.click();
    for (let i = 0; i < 5; i++) { await takeFrame(); await sleep(250); }
    // Close modal
    const closeBtn = await page.$('div.fixed button');
    if (closeBtn) {
      await closeBtn.click();
      await sleep(200);
      await takeFrame();
    }
  }
  compileGif('clip_01_dashboard_to_whatsapp_modal.gif', 280);

  // --- CLIP 2: Customer 360 Machine Health ---
  console.log('--- Recording Clip 2: Customer 360 ---');
  cleanTempFrames();
  frameIdx = 0;
  
  const navBtns2 = await page.$$('nav button');
  if (navBtns2[2]) {
    await navBtns2[2].click();
    for (let i = 0; i < 3; i++) { await takeFrame(); await sleep(250); }
  }

  const allBtns = await page.$$('button');
  for (const b of allBtns) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('View 360')) {
      await b.click();
      break;
    }
  }
  for (let i = 0; i < 6; i++) { await takeFrame(); await sleep(300); }
  
  // Close 360 modal
  const closeBtn360 = await page.$('div.fixed button');
  if (closeBtn360) {
    await closeBtn360.click();
    await sleep(200);
    await takeFrame();
  }
  compileGif('clip_02_customer360_machine_health.gif', 300);

  // --- CLIP 3: Technician Assignment Dispatch ---
  console.log('--- Recording Clip 3: Technician Dispatch ---');
  cleanTempFrames();
  frameIdx = 0;

  const navBtns3 = await page.$$('nav button');
  if (navBtns3[3]) {
    await navBtns3[3].click();
    for (let i = 0; i < 3; i++) { await takeFrame(); await sleep(250); }
  }

  const serviceBtns = await page.$$('button');
  for (const b of serviceBtns) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && (text.includes('Assign') || text.includes('Dispatch'))) {
      await b.click();
      break;
    }
  }
  for (let i = 0; i < 6; i++) { await takeFrame(); await sleep(300); }

  const closeBtnDispatch = await page.$('div.fixed button');
  if (closeBtnDispatch) {
    await closeBtnDispatch.click();
    await sleep(200);
    await takeFrame();
  }
  compileGif('clip_03_technician_dispatch_maps.gif', 300);

  // --- CLIP 4: Spares Inventory & Print UPI Invoice ---
  console.log('--- Recording Clip 4: Inventory & Billing ---');
  cleanTempFrames();
  frameIdx = 0;

  const navBtns4 = await page.$$('nav button');
  if (navBtns4[5]) {
    await navBtns4[5].click();
    for (let i = 0; i < 3; i++) { await takeFrame(); await sleep(250); }
  }

  if (navBtns4[6]) {
    await navBtns4[6].click();
    for (let i = 0; i < 3; i++) { await takeFrame(); await sleep(250); }
  }

  const invoiceBtns = await page.$$('button');
  for (const b of invoiceBtns) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Print')) {
      await b.click();
      break;
    }
  }
  for (let i = 0; i < 6; i++) { await takeFrame(); await sleep(320); }
  compileGif('clip_04_inventory_and_upi_invoice.gif', 320);

  // --- CLIP 5: Mobile Experience (Vertical Reel) ---
  console.log('--- Recording Clip 5: Mobile Reel ---');
  cleanTempFrames();
  frameIdx = 0;

  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await sleep(1000);
  for (let i = 0; i < 3; i++) { await takeFrame(); await sleep(250); }

  await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
  await sleep(350);
  for (let i = 0; i < 3; i++) { await takeFrame(); await sleep(250); }

  compileGif('clip_05_mobile_vertical_walkthrough.gif', 280);

  await browser.close();

  // Cleanup
  cleanTempFrames();
  if (fs.existsSync(TEMP_FRAMES_DIR)) {
    fs.rmSync(TEMP_FRAMES_DIR, { recursive: true, force: true });
  }

  console.log('All animated GIF clips recorded successfully!');
}

run().catch(err => {
  console.error('Error during recording:', err);
  process.exit(1);
});
