import asyncio
import os
import subprocess
import json
import base64
from pathlib import Path
import imageio_ffmpeg
import edge_tts
from playwright.sync_api import sync_playwright

BASE_DIR = Path(r"C:\Users\user\OneDrive\Desktop\ro-water-purifier-service-reminder")
TEMP_DIR = BASE_DIR / "temp_video_build"
OUTPUT_VIDEO = BASE_DIR / "public" / "ro_renewal_engine_telugu_walkthrough.mp4"

TEMP_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_VIDEO.parent.mkdir(parents=True, exist_ok=True)

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

SCENES = [
    {
        "id": 1,
        "nav_selector": "button:has-text('Dashboard')",
        "tab_selector": None,
        "telugu_title": "1. హోమ్ పేజీ & ఎగ్జిక్యూటివ్ డాష్‌బోర్డ్",
        "english_title": "Executive Dashboard & Live Revenue Metrics",
        "voiceover": "మీరు ఆర్.ఓ. వాటర్ ప్యూరిఫైయర్ సర్వీస్ బిజినెస్ నడుపుతున్నారా? ఫిల్టర్ మార్చే డేట్లు మర్చిపోయి కస్టమర్లు వేరే వాళ్ల దగ్గరకు వెళ్లిపోతున్నారా? ఇకపై మీ ఒక్క కస్టమర్ కూడా మిస్ అవ్వరు! ఈ ఆర్.ఓ. సర్వీస్ & రెన్యూవల్ ఇంజిన్ ద్వారా మీ మొత్తం నెలవారీ రెవెన్యూ, పెండింగ్ సర్వీసులు, మరియు యాక్టివ్ ఏ.ఎం.సి.లు అన్నీ ఒకే స్క్రీన్‌పై స్పష్టంగా కనిపిస్తాయి.",
        "caption": "మొత్తం బిజినెస్ రెవెన్యూ, పెండింగ్ సర్వీసులు & యాక్టివ్ ఏ.ఎం.సి.లు ఒకే స్క్రీన్‌పై స్పష్టంగా!"
    },
    {
        "id": 2,
        "nav_selector": "button:has-text('Customers 360')",
        "tab_selector": None,
        "telugu_title": "2. కస్టమర్ 360 & ప్యూరిఫైయర్ ప్రొఫైల్",
        "english_title": "Customer 360 & Equipment Health Profiling",
        "voiceover": "కస్టమర్ 360 ప్రొఫైల్‌లో ప్రతీ కస్టమర్ పూర్తి సమాచారం ఉంటుంది. వారు వాడుతున్న ప్యూరిఫైయర్ బ్రాండ్, మోడల్, ఇన్లెట్ మరియు అవుట్‌పుట్ వాటర్ టి.డి.ఎస్. రీడింగ్స్, గతంలో చేసిన సర్వీస్ హిస్టరీ మరియు ప్రతీ ఫిల్టర్ కండిషన్ ఎప్పటికప్పుడు సేవ్ అయి ఉంటాయి. ఫోన్ నంబర్‌తో ఒక్క సెకనులో వారి హిస్టరీ మొత్తం తెలుసుకోవచ్చు.",
        "caption": "ఆర్.ఓ. బ్రాండ్, మోడల్, వాటర్ టి.డి.ఎస్. రీడింగ్స్ & పూర్తి ఫిల్టర్ సర్వీస్ హిస్టరీ!"
    },
    {
        "id": 3,
        "nav_selector": "button:has-text('Renewals Pipeline')",
        "tab_selector": None,
        "telugu_title": "3. సర్వీస్ రెన్యూవల్ పైప్‌లైన్ & డ్యూ అలర్ట్స్",
        "english_title": "Automated Service Renewals Kanban Pipeline",
        "voiceover": "ఈ ఆటోమేటెడ్ రెన్యూవల్ పైప్‌లైన్‌తో మీ ఫిల్టర్ సేల్స్ మరియు సర్వీస్ రెవెన్యూ రెట్టింపు అవుతుంది! సర్వీస్ డ్యూ డేట్ కంటే 15 రోజుల ముందే అలర్ట్, సర్వీస్ రోజున రిమైండర్, ఒకవేళ ఆలస్యమైతే ఓవర్‌డ్యూ అలర్ట్స్ అన్నీ ఆటోమేటిక్‌గా కాన్‌బాన్ బోర్డులో కనిపిస్తాయి. దీంతో ఏ ఒక్క సర్వీస్ కూడా మిస్ అవ్వదు.",
        "caption": "15 రోజుల ముందే అలర్ట్స్, సర్వీస్ డ్యూ డేట్ ట్రాకింగ్ & కాన్‌బాన్ పైప్‌లైన్ బోర్డ్!"
    },
    {
        "id": 4,
        "nav_selector": "button:has-text('AMC Management')",
        "tab_selector": None,
        "telugu_title": "4. వార్షిక ఏ.ఎం.సి. కాంట్రాక్ట్ మేనేజ్‌మెంట్",
        "english_title": "Annual Maintenance Contracts (AMC) Tracker",
        "voiceover": "మీ కస్టమర్లను శాశ్వతంగా మీతోనే ఉంచుకోవడానికి ఏ.ఎం.సి. మేనేజ్‌మెంట్ ఎంతో ఉపయోగపడుతుంది. 1 సంవత్సరం లేదా 2 సంవత్సరాల ఏ.ఎం.సి. ప్యాకేజీలు, వార్షిక విజిట్స్ కౌంటర్, మరియు కాంట్రాక్ట్ ఎక్స్‌పైరీ రిమైండర్లు అన్నీ ఇందులో ఆటోమేటిక్‌గా మేనేజ్ అవుతాయి. దీనివల్ల మీకు ప్రతినెలా రెగ్యులర్ క్యాష్ ఫ్లో లభిస్తుంది.",
        "caption": "1 & 2 సంవత్సరాల ఏ.ఎం.సి. ప్లాన్స్, విజిట్స్ కౌంటర్ & ఆటోమేటిక్ కాంట్రాక్ట్ రెన్యూవల్!"
    },
    {
        "id": 5,
        "nav_selector": "button:has-text('Technicians')",
        "tab_selector": None,
        "telugu_title": "5. టెక్నీషియన్ డిస్పాచ్ & జాబ్ ట్రాకింగ్",
        "english_title": "Field Technician Allocation & Balance Collection",
        "voiceover": "మీ ఫీల్డ్ టెక్నీషియన్లకు సర్వీస్ కాల్స్‌ను ఒక్క క్లిక్‌తో అసైన్ చేయవచ్చు. ఏ టెక్నీషియన్ దగ్గర ఎన్ని జాబ్స్ పెండింగ్‌లో ఉన్నాయి, కస్టమర్ల దగ్గర ఎంత పేమెంట్ కలెక్ట్ అయ్యిందో లైవ్‌గా ట్రాక్ చేయవచ్చు. టెక్నీషియన్ల పనితీరును సులభంగా పర్యవేక్షించవచ్చు.",
        "caption": "టెక్నీషియన్లకు లైవ్ సర్వీస్ కాల్స్ అసైన్ చేయడం & పెండింగ్ పేమెంట్ కలెక్షన్!"
    },
    {
        "id": 6,
        "nav_selector": "button:has-text('Invoices & Billing')",
        "tab_selector": None,
        "telugu_title": "6. జి.ఎస్.టి. ఇన్‌వాయిస్ & బిల్లింగ్ రశీదులు",
        "english_title": "Professional GST Invoices & Payment Receipts",
        "voiceover": "సర్వీస్ పూర్తి కాగానే ప్రొఫెషనల్ జి.ఎస్.టి. టాక్స్ ఇన్‌వాయిస్‌లు మరియు పేమెంట్ రశీదులను క్షణాల్లో తయారు చేసి నేరుగా కస్టమర్ వాట్సాప్‌కి పంపించవచ్చు. స్పేర్ పార్ట్స్ రేట్లు, లేబర్ చార్జీలు మరియు పెండింగ్ బ్యాలెన్స్‌ల లెక్కలు పక్కాగా ఉంటాయి.",
        "caption": "1-క్లిక్‌తో ప్రొఫెషనల్ టాక్స్ ఇన్‌వాయిస్ & వాట్సాప్ ద్వారా పేమెంట్ రశీదులు!"
    },
    {
        "id": 7,
        "nav_selector": "button:has-text('WhatsApp Automation')",
        "tab_selector": "button:has-text('AI Chatbot & Simulator')",
        "telugu_title": "7. వాట్సాప్ ఆటోమేషన్ - 24/7 ఏ.ఐ. చాట్‌బాట్",
        "english_title": "24/7 Grounded AI WhatsApp Chatbot",
        "voiceover": "ఈ ఇంజిన్ యొక్క ప్రధాన ఆకర్షణ — 24/7 వాట్సాప్ ఏ.ఐ. చాట్‌బాట్! కస్టమర్ వాట్సాప్‌లో మెసేజ్ చేయగానే మన ఏ.ఐ. బాట్ వెంటనే స్వాగతం పలికి సర్వీస్ బుకింగ్, ఫిల్టర్ రేట్లు, వాటర్ లీకేజ్ లేదా టి.డి.ఎస్. సమస్యల వంటి ఆప్షన్లను చూపిస్తుంది. మీ బిజినెస్ వివరాల ఆధారంగా కస్టమర్లతో నిరంతరం మాట్లాడుతూ సర్వీస్ కాల్స్‌ను బుక్ చేస్తుంది.",
        "caption": "కస్టమర్ మెసేజ్ చేయగానే 1 నుండి 7 సర్వీస్ ఆప్షన్లతో 24 గంటలూ పనిచేసే ఏ.ఐ. బాట్!"
    },
    {
        "id": 8,
        "nav_selector": "button:has-text('WhatsApp Automation')",
        "tab_selector": "button:has-text('1-Click Message All Customers')",
        "telugu_title": "8. వాట్సాప్ కామర్స్ & మీడియా బ్రాడ్‌కాస్ట్",
        "english_title": "Purifier Catalog & 1-Click Media Broadcast",
        "voiceover": "ఇందులో మీ ప్యూరిఫైయర్ ప్రోడక్ట్స్ క్యాటలాగ్ ఉంటుంది, కస్టమర్లు వాట్సాప్ ద్వారానే కొత్త ఆర్.ఓ. మెషీన్లను ఆర్డర్ చేయవచ్చు. అంతేకాదు, మీ కస్టమర్లందరికీ ఒకే క్లిక్‌తో బల్క్ మెసేజ్‌లు పంపవచ్చు. కొత్తగా చేర్చిన మీడియా బటన్ ద్వారా ఫిల్టర్ ఆఫర్ ఫోటోలు, వీడియోలు లేదా ప్యూరిఫైయర్ పోస్టర్లను జతచేసి క్షణాల్లో బ్రాడ్‌కాస్ట్ చేయవచ్చు!",
        "caption": "ప్యూరిఫైయర్ల క్యాటలాగ్ & ఫిల్టర్ ఆఫర్ల ఫోటోలు, వీడియోలతో 1-క్లిక్ బల్క్ మెసేజ్!"
    },
    {
        "id": 9,
        "nav_selector": "button:has-text('WhatsApp Automation')",
        "tab_selector": "button:has-text('Automated Due Reminders')",
        "telugu_title": "9. ఆటోమేటెడ్ రిమైండర్స్ & క్వైట్ అవర్స్ రక్షణ",
        "english_title": "Automated Reminders Engine & Mobile Responsive",
        "voiceover": "రాత్రి సమయాల్లో కస్టమర్లకు ఇబ్బంది కలగకుండా క్వైట్ అవర్స్ రక్షణతో ఆటోమేటిక్ రిమైండర్లు వెళ్తాయి. మొబైల్ మరియు కంప్యూటర్ రెండింటిలోనూ అద్భుతంగా పనిచేసే ఈ ఆర్.ఓ. రెన్యూవల్ ఇంజిన్‌తో మీ సర్వీస్ బిజినెస్‌ను నెక్స్ట్ లెవెల్‌కి తీసుకెళ్లండి. ఇప్పుడే ప్రారంభించండి!",
        "caption": "డిస్టర్బెన్స్ లేకుండా క్వైట్ అవర్స్ ఆటోమేషన్ - మొబైల్ & కంప్యూటర్‌లో 100% రెస్పాన్సివ్!"
    }
]

async def generate_speech(text: str, output_path: str):
    communicate = edge_tts.Communicate(text, "te-IN-ShrutiNeural", rate="+0%", pitch="+0Hz")
    await communicate.save(output_path)

def get_audio_duration(audio_path: Path) -> float:
    cmd = [
        FFMPEG_EXE, "-i", str(audio_path)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    for line in res.stderr.splitlines():
        if "Duration:" in line:
            # Duration: 00:00:14.85, start: ...
            parts = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = parts.split(":")
            return float(h)*3600 + float(m)*60 + float(s)
    return 10.0

def build_overlay_html(screenshot_b64: str, scene: dict, total_scenes: int) -> str:
    progress_pct = (scene["id"] / total_scenes) * 100
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}
    body {{
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      font-family: 'Nirmala UI', 'Gautami', 'Segoe UI', system-ui, sans-serif;
      position: relative;
      background: #0b1426;
    }}
    .bg-image {{
      position: absolute;
      top: 0;
      left: 0;
      width: 1920px;
      height: 1080px;
      object-fit: cover;
    }}
    /* Lower Third Frosted Glass Container */
    .lower-third {{
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 230px;
      background: linear-gradient(180deg, rgba(8, 15, 30, 0.94) 0%, rgba(5, 10, 22, 0.98) 100%);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-top: 3px solid #0284c7;
      box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 24px 48px 16px 48px;
    }}
    .top-meta {{
      display: flex;
      align-items: center;
      justify-content: space-between;
    }}
    .badges-row {{
      display: flex;
      align-items: center;
      gap: 14px;
    }}
    .scene-badge {{
      background: linear-gradient(135deg, #0284c7, #0369a1);
      color: #ffffff;
      font-weight: 800;
      font-size: 14px;
      padding: 6px 14px;
      border-radius: 8px;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
    }}
    .brand-pill {{
      background: rgba(30, 41, 59, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.5);
      color: #38bdf8;
      font-weight: 700;
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }}
    .live-indicator {{
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
    }}
    .speaker-meta {{
      color: #94a3b8;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }}
    .titles-block {{
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 4px;
    }}
    .telugu-title {{
      font-size: 30px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.25;
      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
    }}
    .english-title {{
      font-size: 18px;
      font-weight: 600;
      color: #93c5fd;
      letter-spacing: 0.3px;
    }}
    /* Subtitle highlight box */
    .subtitle-box {{
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 10px;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 6px;
    }}
    .mic-icon {{
      font-size: 18px;
      flex-shrink: 0;
    }}
    .subtitle-text {{
      font-size: 21px;
      font-weight: 600;
      color: #fde047;
      line-height: 1.35;
      letter-spacing: 0.2px;
    }}
    /* Bottom Progress Bar */
    .progress-track {{
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 6px;
      background: rgba(30, 41, 59, 0.9);
    }}
    .progress-fill {{
      height: 100%;
      width: {progress_pct}%;
      background: linear-gradient(90deg, #0284c7, #10b981);
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.7);
    }}
  </style>
</head>
<body>
  <img src="data:image/png;base64,{screenshot_b64}" class="bg-image" />
  
  <div class="lower-third">
    <div class="top-meta">
      <div class="badges-row">
        <div class="scene-badge">SCENE {scene["id"]:02d} / {total_scenes:02d}</div>
        <div class="brand-pill">
          <span class="live-indicator"></span>
          <span>RO SERVICE & RENEWAL ENGINE</span>
        </div>
      </div>
      <div class="speaker-meta">
        <span>🎙️ అధికారిక వివరణ (తెలుగు వాయిస్)</span>
      </div>
    </div>

    <div class="titles-block">
      <div class="telugu-title">{scene["telugu_title"]}</div>
      <div class="english-title">{scene["english_title"]}</div>
    </div>

    <div class="subtitle-box">
      <span class="mic-icon">⚡</span>
      <span class="subtitle-text">{scene["caption"]}</span>
    </div>
  </div>

  <div class="progress-track">
    <div class="progress-fill"></div>
  </div>
</body>
</html>"""

def main():
    print("=== Step 1: Capturing UI and Rendering Flawless Telugu Typography via Chromium ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            headless=True
        )
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        app_page = context.new_page()

        app_page.goto("http://localhost:3000", wait_until="networkidle")
        app_page.wait_for_timeout(2000)

        for scene in SCENES:
            sid = scene["id"]
            raw_shot = TEMP_DIR / f"raw_{sid}.png"
            final_frame = TEMP_DIR / f"frame_{sid}.png"

            print(f"Capturing Scene {sid}: {scene['english_title']}...")
            try:
                if scene["nav_selector"]:
                    btn = app_page.locator(scene["nav_selector"]).first
                    if btn.count() > 0:
                        btn.click()
                        app_page.wait_for_timeout(1000)

                if scene["tab_selector"]:
                    tab = app_page.locator(scene["tab_selector"]).first
                    if tab.count() > 0:
                        tab.click()
                        app_page.wait_for_timeout(1000)

                app_page.wait_for_timeout(1000)
            except Exception as e:
                print(f"Nav note for scene {sid}: {e}")

            app_page.screenshot(path=str(raw_shot))

            # Encode raw screenshot to Base64
            with open(raw_shot, "rb") as img_f:
                b64_data = base64.b64encode(img_f.read()).decode("utf-8")

            # Render HTML overlay with 100% native Telugu HarfBuzz typography
            overlay_page = context.new_page()
            html_content = build_overlay_html(b64_data, scene, len(SCENES))
            overlay_page.set_content(html_content)
            overlay_page.wait_for_timeout(300)
            overlay_page.screenshot(path=str(final_frame))
            overlay_page.close()

        browser.close()

    print("\n=== Step 2: Generating Clean Telugu Female Voiceovers (Spelling 'ఆర్.ఓ.') ===")
    durations = {}
    for scene in SCENES:
        sid = scene["id"]
        audio_path = TEMP_DIR / f"audio_{sid}.mp3"
        print(f"Generating clean audio for Scene {sid}...")
        asyncio.run(generate_speech(scene["voiceover"], str(audio_path)))
        dur = get_audio_duration(audio_path)
        durations[sid] = dur
        print(f"Scene {sid} audio duration: {dur:.2f}s")

    print("\n=== Step 3: Compiling Subsecond-Synced Scene Clips ===")
    scene_clips = []
    for scene in SCENES:
        sid = scene["id"]
        frame_img = TEMP_DIR / f"frame_{sid}.png"
        audio_file = TEMP_DIR / f"audio_{sid}.mp3"
        clip_output = TEMP_DIR / f"clip_{sid}.mp4"
        dur = durations[sid]

        # Render exact duration clip with matching sample rate and clean timestamps
        cmd = [
            FFMPEG_EXE, "-y",
            "-loop", "1",
            "-t", str(dur),
            "-i", str(frame_img),
            "-i", str(audio_file),
            "-c:v", "libx264",
            "-tune", "stillimage",
            "-r", "30",
            "-g", "30",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-ar", "44100",
            "-shortest",
            str(clip_output)
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            print(f"FFmpeg error on scene {sid}: {res.stderr}")
        else:
            print(f"Rendered clip {sid} ({dur:.2f}s) -> {clip_output.name}")
            scene_clips.append(clip_output)

    print("\n=== Step 4: Seamless Concat Filter (Zero Dead Space, Zero Gap) ===")
    # Build filter_complex command for completely seamless audio and video concat
    inputs = []
    filter_parts = []
    for i, clip in enumerate(scene_clips):
        inputs.extend(["-i", str(clip)])
        filter_parts.append(f"[{i}:v][{i}:a]")

    filter_complex_str = "".join(filter_parts) + f"concat=n={len(scene_clips)}:v=1:a=1[v][a]"

    cmd_concat = [
        FFMPEG_EXE, "-y",
        *inputs,
        "-filter_complex", filter_complex_str,
        "-map", "[v]",
        "-map", "[a]",
        "-c:v", "libx264",
        "-preset", "fast",
        "-r", "30",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-ar", "44100",
        "-movflags", "+faststart",
        str(OUTPUT_VIDEO)
    ]
    res_master = subprocess.run(cmd_concat, capture_output=True, text=True)
    if res_master.returncode != 0:
        print(f"Master concat error: {res_master.stderr}")
    else:
        print(f"\n🎉 SUCCESS! Seamless Master Video created at: {OUTPUT_VIDEO}")
        print(f"Final file size: {OUTPUT_VIDEO.stat().st_size / (1024*1024):.2f} MB")

if __name__ == "__main__":
    main()
