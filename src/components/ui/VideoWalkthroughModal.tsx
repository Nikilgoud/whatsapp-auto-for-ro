'use client';

import React, { useRef, useState } from 'react';
import {
  X,
  Play,
  Pause,
  Download,
  Volume2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface VideoWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SCENE_TIMESTAMPS = [
  { id: 1, time: 0, label: '1. Dashboard', telugu: 'హోమ్ పేజీ & డాష్‌బోర్డ్' },
  { id: 2, time: 25, label: '2. Customer 360', telugu: 'కస్టమర్ 360 ప్రొఫైల్' },
  { id: 3, time: 48, label: '3. Renewals', telugu: 'సర్వీస్ రెన్యూవల్ పైప్‌లైన్' },
  { id: 4, time: 70, label: '4. AMC Tracker', telugu: 'వార్షిక AMC కాంట్రాక్టులు' },
  { id: 5, time: 95, label: '5. Technicians', telugu: 'టెక్నీషియన్ డిస్పాచ్' },
  { id: 6, time: 112, label: '6. Invoices', telugu: 'GST ఇన్‌వాయిస్ & బిల్లింగ్' },
  { id: 7, time: 129, label: '7. AI Chatbot', telugu: '24/7 వాట్సాప్ AI చాట్‌బాట్' },
  { id: 8, time: 155, label: '8. WhatsApp Media', telugu: 'మీడియా బ్రాడ్‌కాస్ట్ (Photos/Videos)' },
  { id: 9, time: 179, label: '9. Auto Reminders', telugu: 'క్వైట్ అవర్స్ ఆటో రిమైండర్స్' },
];

export const VideoWalkthroughModal: React.FC<VideoWalkthroughModalProps> = ({ isOpen, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeScene, setActiveScene] = useState(1);

  if (!isOpen) return null;

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    for (let i = SCENE_TIMESTAMPS.length - 1; i >= 0; i--) {
      if (cur >= SCENE_TIMESTAMPS[i].time) {
        setActiveScene(SCENE_TIMESTAMPS[i].id);
        break;
      }
    }
  };

  const jumpToScene = (time: number, id: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    videoRef.current.play();
    setIsPlaying(true);
    setActiveScene(id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold text-lg">
              🎬
            </span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                <span>RO Service Engine — Walkthrough Video</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  తెలుగు Female Voice
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                All 9 core features explained one by one in Telugu (3m 09s)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/ro_renewal_engine_telugu_walkthrough.mp4"
              download="ro_renewal_engine_telugu_walkthrough.mp4"
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              title="Download MP4 Video"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Download MP4 (5.3MB)</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="relative bg-black aspect-video w-full flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            src="/ro_renewal_engine_telugu_walkthrough.mp4"
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Interactive Scene Chapters */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Jump to Scene Chapter:</span>
            </span>
            <span className="text-[11px] text-slate-400">Click any chapter to jump</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {SCENE_TIMESTAMPS.map((s) => {
              const isActive = activeScene === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => jumpToScene(s.time, s.id)}
                  className={`p-2.5 rounded-xl text-left border transition flex flex-col gap-0.5 ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-400'
                  }`}
                >
                  <span className={`font-bold truncate text-[11px] ${isActive ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {s.label}
                  </span>
                  <span className={`text-[10px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                    {s.telugu}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
