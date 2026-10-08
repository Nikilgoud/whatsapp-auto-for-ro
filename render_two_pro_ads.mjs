import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FFMPEG = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\8c7f8733-53a2-4149-8a35-6dc819535038\\scratch\\.venv\\Lib\\site-packages\\imageio_ffmpeg\\binaries\\ffmpeg-win-x86_64-v7.1.exe';
const BASE_DIR = 'C:\\Users\\user\\OneDrive\\Desktop\\ro-water-purifier-service-reminder';
const RECORDINGS_DIR = path.join(BASE_DIR, 'ad-recordings');
const HD_DIR = path.join(RECORDINGS_DIR, 'hd_assets');
const TEMP_BUILD = path.join(RECORDINGS_DIR, 'pro_ads_temp');

if (!fs.existsSync(TEMP_BUILD)) fs.mkdirSync(TEMP_BUILD, { recursive: true });

function getAudioDuration(audioPath) {
  try {
    const out = execSync(`"${FFMPEG}" -i "${audioPath}" 2>&1`, { encoding: 'utf8' });
    const match = out.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
    if (match) {
      return parseFloat(match[1]) * 3600 + parseFloat(match[2]) * 60 + parseFloat(match[3]);
    }
  } catch (e) {
    const str = e.stdout || e.stderr || '';
    const match = str.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
    if (match) {
      return parseFloat(match[1]) * 3600 + parseFloat(match[2]) * 60 + parseFloat(match[3]);
    }
  }
  return 10.0;
}

// ---------------- VIDEO 1 DATA (16:9 Landscape) ----------------
const scenesV1 = [
  {
    id: 1,
    tag: "PROBLEM & LOST REVENUE",
    telugu: "మీ R O బిజినెస్ లో ఫిల్టర్ సర్వీస్ డేట్స్ మర్చిపోయి కస్టమర్లను కోల్పోతున్నారా?",
    english: "Stop Losing Customers! Never Miss an R O Filter Renewal Date Again.",
    image: path.join(HD_DIR, 'hd_01_dashboard_revenue.png')
  },
  {
    id: 2,
    tag: "SMART URGENCY RADAR",
    telugu: "Smart Urgency Radar: రెడ్ (ఈరోజే మార్చాలి), ఆరెంజ్ (వారం రోజుల్లో)!",
    english: "Color-Coded Priority Queue: Auto-Calculates Filter Lifespan & Service Dates.",
    image: path.join(HD_DIR, 'hd_02_urgency_pipeline.png')
  },
  {
    id: 3,
    tag: "1-CLICK WHATSAPP ENGINE",
    telugu: "సింగిల్ క్లిక్ తో WhatsApp రిమైండర్ + కస్టమర్ మెషిన్ TDS వివరాలు!",
    english: "Instant Personalized WhatsApp Message with Customer Name & Live TDS Level.",
    image: path.join(HD_DIR, 'hd_03_whatsapp_reminder.png')
  },
  {
    id: 4,
    tag: "CUSTOMER 360 & MACHINE HEALTH",
    telugu: "Customer 360°: సెడిమెంట్ 0%, మెంబ్రేన్ లైఫ్ & పూర్తి సర్వీస్ హిస్టరీ!",
    english: "Full Machine Profile: Component Life Tracking & Complete Service Records.",
    image: path.join(HD_DIR, 'hd_04_customer_360.png')
  },
  {
    id: 5,
    tag: "UBER-STYLE FIELD DISPATCH",
    telugu: "టెక్నీషియన్ కి Google Maps లొకేషన్ తో WhatsApp జాబ్ కార్డ్ డిస్పాచ్!",
    english: "Field Tech Dispatch: 1-Click GPS Navigation, Customer Address & Payment Due.",
    image: path.join(HD_DIR, 'hd_05_technician_dispatch.png')
  },
  {
    id: 6,
    tag: "INVENTORY & UPI QR INVOICE",
    telugu: "స్పేర్స్ లో-స్టాక్ అలర్ట్స్ + Scan to Pay UPI QR కోడ్ తో GST బిల్స్!",
    english: "Spares Reorder Alerts + Instant Printable GST Invoice with Direct UPI QR Code.",
    image: path.join(HD_DIR, 'hd_07_upi_invoice.png')
  },
  {
    id: 7,
    tag: "100% SMARTPHONE AUTOMATION",
    telugu: "ల్యాప్‌టాప్ అవసరం లేదు! మీ మొబైల్ లోనే మీ పూర్తి R O బిజినెస్ నడపండి!",
    english: "Automate Your R O Dealership Today! Contact Us for a Free Setup & Demo.",
    image: path.join(HD_DIR, 'hd_08_mobile_dashboard.png')
  }
];

// ---------------- VIDEO 2 DATA (9:16 Vertical Reel) ----------------
const scenesV2 = [
  {
    id: 1,
    tag: "డైరీలు బంద్ చేయండి ❌",
    telugu: "ఇంకా పాత డైరీలలోనే R O సర్వీస్ డేట్స్ రాస్తున్నారా?",
    english: "Stop Losing ₹50,000+ Every Month with Paper Diaries!",
    image: path.join(HD_DIR, 'hd_01_dashboard_revenue.png')
  },
  {
    id: 2,
    tag: "స్మార్ట్ అలర్ట్స్ 🚨",
    telugu: "ఏ కస్టమర్‌కి ఈరోజే ఫిల్టర్ మార్చాలో రెడ్ అలర్ట్!",
    english: "Instant Color-Coded Urgency Pipeline on Mobile.",
    image: path.join(HD_DIR, 'hd_02_urgency_pipeline.png')
  },
  {
    id: 3,
    tag: "1-CLICK WHATSAPP 📲",
    telugu: "ఒకే ఒక్క క్లిక్ తో... ఆటోమేటిక్ WhatsApp రిమైండర్!",
    english: "Auto-Filled Customer Name, Machine Model & TDS.",
    image: path.join(HD_DIR, 'hd_03_whatsapp_reminder.png')
  },
  {
    id: 4,
    tag: "టెక్నీషియన్ డిస్పాచ్ 📍",
    telugu: "Google Maps లొకేషన్ తో జాబ్ కార్డ్ డైరెక్ట్ వాట్సాప్!",
    english: "Uber-Style 1-Click Field Technician Navigation.",
    image: path.join(HD_DIR, 'hd_05_technician_dispatch.png')
  },
  {
    id: 5,
    tag: "UPI QR ఇన్వాయిస్ 🚀",
    telugu: "ఆన్-ది-స్పాట్ UPI QR బిల్స్! ఫ్రీ డెమో కొరకు మెసేజ్ చేయండి!",
    english: "Instant Scan & Pay UPI Invoice. Contact Us Today!",
    image: path.join(HD_DIR, 'hd_07_upi_invoice.png')
  }
];

function getHtmlV1(scene) {
  const imgBase64 = fs.readFileSync(scene.image).toString('base64');
  return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: 1920px;
        height: 1080px;
        background: radial-gradient(circle at 50% 30%, #0f172a 0%, #020617 100%);
        font-family: 'Nirmala UI', 'Gautami', 'Segoe UI', sans-serif;
        overflow: hidden;
        color: white;
        display: flex;
        flex-direction: column;
      }
      .top-bar {
        height: 80px;
        padding: 0 40px;
        background: rgba(15, 23, 42, 0.95);
        border-bottom: 2px solid #1e293b;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .logo-pill {
        background: linear-gradient(135deg, #0284c7, #2563eb);
        color: white;
        padding: 10px 24px;
        border-radius: 30px;
        font-weight: 800;
        font-size: 22px;
        letter-spacing: 1px;
        box-shadow: 0 4px 15px rgba(2, 132, 199, 0.4);
      }
      .tag-pill {
        color: #38bdf8;
        font-size: 22px;
        font-weight: 700;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }
      .live-pill {
        background: #e11d48;
        color: white;
        padding: 8px 20px;
        border-radius: 20px;
        font-size: 16px;
        font-weight: 800;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 0 20px rgba(225, 29, 72, 0.5);
      }
      .content-area {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px 40px 10px 40px;
      }
      .frame-card {
        width: 100%;
        max-width: 1720px;
        height: 720px;
        background: #000;
        border-radius: 16px;
        overflow: hidden;
        border: 2px solid rgba(56, 189, 248, 0.3);
        box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(2, 132, 199, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .frame-card img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .sub-banner {
        height: 180px;
        background: linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, #020617 100%);
        border-top: 3px solid #38bdf8;
        padding: 20px 60px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }
      .sub-telugu {
        font-size: 38px;
        font-weight: 800;
        color: #fef08a;
        line-height: 1.3;
        margin-bottom: 8px;
        text-shadow: 0 3px 6px rgba(0,0,0,0.8);
      }
      .sub-english {
        font-size: 22px;
        font-weight: 600;
        color: #94a3b8;
        letter-spacing: 0.5px;
      }
    </style>
  </head>
  <body>
    <div class="top-bar">
      <div class="logo-pill">R O SERVICE RENEWAL ENGINE</div>
      <div class="tag-pill">${scene.tag}</div>
      <div class="live-pill">● LIVE DEMO</div>
    </div>
    <div class="content-area">
      <div class="frame-card">
        <img src="data:image/png;base64,${imgBase64}">
      </div>
    </div>
    <div class="sub-banner">
      <div class="sub-telugu">${scene.telugu}</div>
      <div class="sub-english">${scene.english}</div>
    </div>
  </body>
  </html>`;
}

function getHtmlV2(scene) {
  const imgBase64 = fs.readFileSync(scene.image).toString('base64');
  return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: 1080px;
        height: 1920px;
        background: radial-gradient(circle at 50% 20%, #1e1b4b 0%, #090d16 100%);
        font-family: 'Nirmala UI', 'Gautami', 'Segoe UI', sans-serif;
        overflow: hidden;
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: 70px 40px;
      }
      .header-sticker {
        background: linear-gradient(135deg, #f59e0b, #ef4444);
        padding: 18px 40px;
        border-radius: 50px;
        font-size: 38px;
        font-weight: 900;
        color: white;
        box-shadow: 0 10px 30px rgba(239, 68, 68, 0.5);
        letter-spacing: 1px;
      }
      .tag-subtitle {
        font-size: 32px;
        font-weight: 700;
        color: #38bdf8;
        margin-top: 16px;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      .phone-frame {
        width: 900px;
        height: 1220px;
        background: #020617;
        border-radius: 40px;
        border: 8px solid #334155;
        box-shadow: 0 30px 80px rgba(0,0,0,0.9), 0 0 50px rgba(56, 189, 248, 0.3);
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .phone-frame img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .bottom-card {
        width: 1000px;
        background: rgba(15, 23, 42, 0.95);
        border: 3px solid #38bdf8;
        border-radius: 28px;
        padding: 30px 40px;
        text-align: center;
        box-shadow: 0 20px 50px rgba(0,0,0,0.7);
      }
      .bottom-telugu {
        font-size: 42px;
        font-weight: 900;
        color: #fef08a;
        line-height: 1.3;
        margin-bottom: 12px;
        text-shadow: 0 4px 10px rgba(0,0,0,0.8);
      }
      .bottom-english {
        font-size: 26px;
        font-weight: 700;
        color: #94a3b8;
      }
    </style>
  </head>
  <body>
    <div style="display:flex; flex-direction:column; align-items:center;">
      <div class="header-sticker">${scene.tag}</div>
      <div class="tag-subtitle">R O SERVICE RENEWAL ENGINE</div>
    </div>
    <div class="phone-frame">
      <img src="data:image/png;base64,${imgBase64}">
    </div>
    <div class="bottom-card">
      <div class="bottom-telugu">${scene.telugu}</div>
      <div class="bottom-english">${scene.english}</div>
    </div>
  </body>
  </html>`;
}

async function renderAds() {
  console.log('Launching Chrome for 100% Perfect Telugu Graphic Rendering...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=max']
  });

  const page = await browser.newPage();

  // ==================== RENDER VIDEO 1 (16:9 Landscape) ====================
  console.log('\n--- Rendering Video 1 (16:9 Landscape 1920x1080) ---');
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  const v1Mp4s = [];

  for (const sc of scenesV1) {
    const html = getHtmlV1(sc);
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 10000 });
    const pngPath = path.join(TEMP_BUILD, `v1_frame_${sc.id}.png`);
    await page.screenshot({ path: pngPath });

    const audioPath = path.join(RECORDINGS_DIR, 'audio_v1', `scene_${sc.id}.mp3`);
    const dur = getAudioDuration(audioPath);
    console.log(`V1 Scene ${sc.id} Audio Duration: ${dur.toFixed(2)}s`);

    const outMp4 = path.join(TEMP_BUILD, `v1_scene_${sc.id}.mp4`);
    const cmd = `"${FFMPEG}" -y -loop 1 -i "${pngPath}" -i "${audioPath}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -r 24 -t ${dur.toFixed(2)} "${outMp4}"`;
    execSync(cmd, { stdio: 'inherit' });
    v1Mp4s.push(outMp4);
  }

  // Concat Video 1
  const v1List = path.join(TEMP_BUILD, 'v1_list.txt');
  fs.writeFileSync(v1List, v1Mp4s.map(f => `file '${f}'`).join('\n'));
  const finalV1 = path.join(RECORDINGS_DIR, 'Video_1_RO_Growth_Engine_16x9.mp4');
  execSync(`"${FFMPEG}" -y -f concat -safe 0 -i "${v1List}" -c copy "${finalV1}"`, { stdio: 'inherit' });
  console.log(`\n🎉 VIDEO 1 SAVED: ${finalV1} (${(fs.statSync(finalV1).size / (1024*1024)).toFixed(2)} MB)`);

  // ==================== RENDER VIDEO 2 (9:16 Vertical Reel) ====================
  console.log('\n--- Rendering Video 2 (9:16 Vertical Reel 1080x1920) ---');
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  const v2Mp4s = [];

  for (const sc of scenesV2) {
    const html = getHtmlV2(sc);
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 10000 });
    const pngPath = path.join(TEMP_BUILD, `v2_frame_${sc.id}.png`);
    await page.screenshot({ path: pngPath });

    const audioPath = path.join(RECORDINGS_DIR, 'audio_v2', `scene_${sc.id}.mp3`);
    const dur = getAudioDuration(audioPath);
    console.log(`V2 Scene ${sc.id} Audio Duration: ${dur.toFixed(2)}s`);

    const outMp4 = path.join(TEMP_BUILD, `v2_scene_${sc.id}.mp4`);
    const cmd = `"${FFMPEG}" -y -loop 1 -i "${pngPath}" -i "${audioPath}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -r 24 -t ${dur.toFixed(2)} "${outMp4}"`;
    execSync(cmd, { stdio: 'inherit' });
    v2Mp4s.push(outMp4);
  }

  // Concat Video 2
  const v2List = path.join(TEMP_BUILD, 'v2_list.txt');
  fs.writeFileSync(v2List, v2Mp4s.map(f => `file '${f}'`).join('\n'));
  const finalV2 = path.join(RECORDINGS_DIR, 'Video_2_RO_Mobile_Autopilot_9x16.mp4');
  execSync(`"${FFMPEG}" -y -f concat -safe 0 -i "${v2List}" -c copy "${finalV2}"`, { stdio: 'inherit' });
  console.log(`\n🎉 VIDEO 2 SAVED: ${finalV2} (${(fs.statSync(finalV2).size / (1024*1024)).toFixed(2)} MB)`);

  await browser.close();
  console.log('\n======================================================');
  console.log('BOTH PROFESSIONAL AD VIDEOS CREATED SUCCESSFULLY!');
  console.log('======================================================');
}

renderAds().catch(err => {
  console.error('Error during ad rendering:', err);
  process.exit(1);
});
