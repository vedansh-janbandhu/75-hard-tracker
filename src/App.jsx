import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, Zap, Droplets, Dumbbell, Footprints, BookOpen, Camera, Utensils, X, User, Edit2, Upload, Quote, AlertTriangle } from "lucide-react";

export default function App() {
  const [view, setView] = useState("tracker");
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [quote, setQuote] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // --- IDENTITY (These are preserved during reset) ---
  const [userName, setUserName] = useState(() => localStorage.getItem("75_user_name") || "OPERATIVE_01");
  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem("75_user_avatar") || null);

  // --- PROGRESS DATA (These are wiped during reset) ---
  const [currentDay, setCurrentDay] = useState(() => Number(localStorage.getItem("75_day")) || 1);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem("75_history")) || {});
  const [lastCheckDate, setLastCheckDate] = useState(() => localStorage.getItem("75_last_date") || new Date().toDateString());
  
  // Daily Tracking States
  const [tasks, setTasks] = useState({ diet: false, indoor: false, outdoor: false, read: false });
  const [water, setWater] = useState(0);
  const [photo, setPhoto] = useState(null);

  // --- AUDIO ENGINE ---
  const playEmergencyAlarm = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = "sawtooth";
    drone.frequency.setValueAtTime(40, ctx.currentTime);
    drone.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 2);
    droneGain.gain.setValueAtTime(0.2, ctx.currentTime);
    droneGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
    drone.connect(droneGain);
    droneGain.connect(ctx.destination);

    const alert = ctx.createOscillator();
    const alertGain = ctx.createGain();
    alert.type = "square";
    for (let i = 0; i < 2; i += 0.2) {
      alert.frequency.setValueAtTime(880, ctx.currentTime + i);
      alert.frequency.setValueAtTime(110, ctx.currentTime + i + 0.1);
    }
    alertGain.gain.setValueAtTime(0.1, ctx.currentTime);
    alertGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
    alert.connect(alertGain);
    alertGain.connect(ctx.destination);

    drone.start(); alert.start();
    drone.stop(ctx.currentTime + 2); alert.stop(ctx.currentTime + 2);
    if ("vibrate" in navigator) navigator.vibrate([100, 50, 100, 50, 500]);
  };

  const speakHumanly = (text) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    utterance.voice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
    utterance.pitch = 1.0;
    utterance.rate = 0.9;
    synth.speak(utterance);
  };

  // --- MIDNIGHT FAILURE DETECTION ---
  useEffect(() => {
    const today = new Date().toDateString();
    if (lastCheckDate !== today) {
      if (!history[currentDay]) {
        playEmergencyAlarm();
        speakHumanly(`Protocol breached, ${userName}. You failed to complete yesterday. Resetting progress.`);
        handleHardReset();
      }
      setLastCheckDate(today);
      localStorage.setItem("75_last_date", today);
    }
  }, []);

  useEffect(() => {
    const quotes = ["Discipline is the bridge.", "The person you will be is counting on you.", "Pain is temporary.", "Weakness is a choice.", "Stop when you are done."];
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    localStorage.setItem("75_day", currentDay);
    localStorage.setItem("75_history", JSON.stringify(history));
    localStorage.setItem("75_user_name", userName);
    if (userAvatar) localStorage.setItem("75_user_avatar", userAvatar);
  }, [currentDay, history, userName, userAvatar]);

  const progress = Math.min(100, Math.round(((Object.values(tasks).filter(Boolean).length + (water >= 3785 ? 1 : 0)) / 5) * 95 + (photo ? 5 : 0)));
  const isComplete = progress === 100;

  // --- SELECTIVE RESET: KEEPS IDENTITY ---
  const handleHardReset = () => {
    playEmergencyAlarm();
    setTimeout(() => {
      // Wipe only progress data
      localStorage.removeItem("75_day");
      localStorage.removeItem("75_history");
      localStorage.removeItem("75_last_date");
      
      // Manually reset states to Day 1
      setCurrentDay(1);
      setHistory({});
      setTasks({ diet: false, indoor: false, outdoor: false, read: false });
      setWater(0);
      setPhoto(null);
      setShowResetConfirm(false);
      
      // Note: We do NOT reload the page here so we don't lose the local userName state
      // but we force a clean view
      setView("tracker");
    }, 1500);
  };

  const moveToNextDay = () => {
    const dayData = { tasks: { ...tasks }, water, photo, date: new Date().toLocaleDateString() };
    setHistory(prev => ({ ...prev, [currentDay]: dayData }));
    setCurrentDay(prev => prev + 1);
    setTasks({ diet: false, indoor: false, outdoor: false, read: false });
    setWater(0); setPhoto(null); setShowSuccess(false);
    setView("tracker"); window.scrollTo(0,0);
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans overflow-x-hidden relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-50"></div>

      {/* EMERGENCY RESET MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 text-center animate-in fade-in">
          <div className="bg-black border-2 border-red-600 p-10 rounded-[3rem] shadow-[0_0_80px_rgba(220,38,38,0.2)] max-w-sm">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-6 animate-pulse" />
            <h2 className="text-3xl font-black italic uppercase mb-2">ABORT MISSION?</h2>
            <p className="text-red-500/60 text-[10px] mb-8 font-black uppercase tracking-widest">Progress will be terminated. Operative profile will be preserved.</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleHardReset} className="w-full py-5 bg-red-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-lg shadow-red-600/20">Confirm Reset</button>
              <button onClick={() => setShowResetConfirm(false)} className="w-full py-5 bg-white/5 text-white/40 font-black rounded-2xl uppercase text-[10px] tracking-widest">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS OVERLAY */}
      {showSuccess && (
        <div className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center p-8 text-center animate-in zoom-in">
          <Zap className="w-20 h-20 text-cyan-400 mb-6 drop-shadow-[0_0_30px_cyan]" />
          <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">MISSION SEALED</h2>
          <button onClick={moveToNextDay} className="mt-12 px-16 py-6 bg-white text-black font-black rounded-full uppercase tracking-[0.2em] active:scale-95 transition-all">Start Day {currentDay + 1}</button>
        </div>
      )}

      {view === "tracker" ? (
        <div className="p-6 max-w-md mx-auto space-y-6 pb-12">
          
          {/* HEADER (Preserved Identity) */}
          <header className="flex justify-between items-center pt-4 border-b border-white/5 pb-6">
            <div className="flex items-center gap-4">
              <div className="relative group w-14 h-14 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center shadow-lg shadow-cyan-500/10">
                {userAvatar ? <img src={userAvatar} className="w-full h-full object-cover" /> : <User size={20} className="mx-auto opacity-20" />}
                <label htmlFor="av" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"><Upload size={14}/></label>
                <input type="file" id="av" className="hidden" accept="image/*" onChange={(e) => {
                  const f=e.target.files[0]; if(f){const r=new FileReader(); r.onloadend=()=>setUserAvatar(r.result); r.readAsDataURL(f);}
                }} />
              </div>
              <div onClick={() => setIsEditingName(true)} className="cursor-pointer group">
                <p className="text-[8px] font-black tracking-[0.3em] text-cyan-500 uppercase mb-1">Authenticated</p>
                {isEditingName ? (
                  <input autoFocus className="bg-transparent border-b border-cyan-400 text-lg font-black uppercase outline-none w-28" value={userName} onChange={(e) => setUserName(e.target.value)} onBlur={() => setIsEditingName(false)} />
                ) : (
                  <h3 className="text-lg font-black uppercase italic tracking-tight flex items-center gap-2">{userName} <Edit2 size={10} className="opacity-0 group-hover:opacity-40" /></h3>
                )}
              </div>
            </div>
            <div onClick={() => setShowResetConfirm(true)} className="text-right cursor-pointer group active:scale-90 transition-transform">
              <p className="text-[8px] font-black opacity-30 uppercase tracking-widest mb-1 group-hover:text-red-500">System Reset</p>
              <h3 className="text-lg font-black text-cyan-400 italic">DAY {currentDay}</h3>
            </div>
          </header>

          {/* MOTIVATION BOX */}
          <div className="bg-white/5 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
            <Quote className="absolute -right-2 -bottom-2 w-16 h-16 text-white/5 -rotate-12 transition-transform group-hover:rotate-0" />
            <p className="text-[10px] font-black uppercase text-cyan-500/60 tracking-[0.2em] mb-2">Directive</p>
            <p className="text-sm font-medium italic text-white/80 leading-relaxed relative z-10">"{quote}"</p>
          </div>

          <div className="flex justify-between items-center px-1">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none text-white">Neural<br/><span className="text-cyan-400 text-4xl">TRACKER</span></h1>
            <button onClick={() => setView("history")} className="bg-white/5 p-4 rounded-2xl border border-white/10 text-cyan-400"><ChevronRight /></button>
          </div>

          {/* PROGRESS GLOW BOX */}
          <div className="comet-container h-44 relative overflow-hidden rounded-[2.5rem] p-[2px]">
            <div className="comet-glow"></div>
            <div className="relative z-10 w-full h-full bg-[#050505] rounded-[calc(2.5rem-2px)] flex items-center justify-center gap-8">
              <h2 className="text-7xl font-black italic tracking-tighter">{progress}%</h2>
              <Zap className={isComplete ? "text-cyan-400 drop-shadow-[0_0_20px_cyan] animate-pulse" : "text-white/5"} size={44} />
            </div>
          </div>

          {/* INTERACTIVE GRID */}
          <div className="grid grid-cols-2 gap-4">
            <div className="h-60 rounded-[2.5rem] bg-white/5 border border-white/10 relative overflow-hidden">
               <div className="absolute bottom-0 w-full bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all duration-1000" style={{ height: `${(water / 3785) * 100}%` }} />
               <div className="relative z-10 p-6 flex flex-col justify-between h-full">
                 <Droplets className="text-white drop-shadow-md" />
                 <div>
                    <p className="text-2xl font-black mb-4 tracking-tighter">{water}ml</p>
                    <button onClick={() => setWater(w => Math.min(4000, w + 500))} className="w-full py-4 bg-black/60 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase border border-white/10">+ 500ML</button>
                 </div>
               </div>
            </div>

            <div className="space-y-4">
               {['indoor', 'diet'].map(t => (
                 <button key={t} onClick={() => setTasks(p => ({...p, [t]: !p[t]}))} className={`w-full h-[112px] rounded-[2.2rem] border-2 transition-all flex flex-col items-center justify-center gap-2 ${tasks[t] ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/5 opacity-30'}`}>
                   {t === 'diet' ? <Utensils size={20}/> : <Dumbbell size={20}/>}
                   <span className="text-[10px] font-black uppercase tracking-widest">{t}</span>
                 </button>
               ))}
            </div>

            <button onClick={() => setTasks(t => ({...t, outdoor: !t.outdoor}))} className={`col-span-2 p-7 rounded-[2.5rem] border-2 flex items-center justify-between ${tasks.outdoor ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/5 opacity-30'}`}>
               <span className="text-[11px] font-black uppercase tracking-[0.3em]">Outdoor Protocol</span>
               <Footprints />
            </button>

            <button onClick={() => setTasks(t => ({...t, read: !t.read}))} className={`p-7 rounded-[2.5rem] border-2 flex flex-col items-start gap-4 ${tasks.read ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-white/5 border-white/5 opacity-30'}`}>
               <BookOpen size={24}/> <span className="text-[10px] font-black uppercase tracking-widest">Intel Gathering</span>
            </button>

            <div className={`relative p-7 rounded-[2.5rem] border-2 overflow-hidden flex flex-col items-center justify-center ${photo ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'bg-white/5 border-white/5 opacity-30'}`}>
               {photo && <img src={photo} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" />}
               <Camera size={24} className="relative z-10 mb-2" />
               <input type="file" id="up" className="hidden" accept="image/*" onChange={(e) => {
                 const f=e.target.files[0]; if(f){const r=new FileReader(); r.onloadend=()=>setPhoto(r.result); r.readAsDataURL(f);}
               }} />
               <label htmlFor="up" className="relative z-10 text-[9px] font-black uppercase underline cursor-pointer">Daily Pose</label>
            </div>
          </div>

          <button onClick={() => {speakHumanly(`Great job, ${userName}. Day ${currentDay} complete.`); setShowSuccess(true);}} disabled={!isComplete} className={`w-full py-8 rounded-[3.5rem] font-black text-sm tracking-[1em] transition-all uppercase ${isComplete ? 'bg-white text-black shadow-[0_0_60px_white]/20 active:scale-95' : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'}`}>
            Seal Protocol
          </button>
        </div>
      ) : (
        /* ARCHIVE VIEW */
        <div className="p-6 max-w-md mx-auto min-h-screen">
           <button onClick={() => setView("tracker")} className="mb-10 text-[10px] font-black opacity-30 uppercase flex items-center gap-2 hover:opacity-100 transition-opacity"><ChevronLeft size={16}/> Return Hub</button>
           <h2 className="text-4xl font-black italic mb-10 tracking-tighter uppercase text-cyan-400">Mission Logs</h2>
           <div className="grid grid-cols-5 gap-3 pb-20">
             {[...Array(75)].map((_, i) => {
               const dayNum = i + 1;
               const data = history[dayNum];
               return (
                 <button key={i} onClick={() => data && setSelectedDayData({...data, day: dayNum})} className={`aspect-square rounded-2xl flex items-center justify-center border-2 transition-all ${data ? 'bg-cyan-500 border-cyan-500 text-black shadow-[0_0_15px_cyan]/40' : dayNum === currentDay ? 'border-cyan-500 text-cyan-500 animate-pulse' : 'bg-white/5 border-white/10 opacity-10'}`}>
                   <span className="text-xs font-black">{dayNum}</span>
                 </button>
               );
             })}
           </div>
        </div>
      )}

      {/* MISSION REPORT MODAL */}
      {selectedDayData && (
        <div className="fixed inset-0 z-[600] bg-black/98 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-8 relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setSelectedDayData(null)} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full"><X size={20}/></button>
            <div className="text-center mb-6">
              <h3 className="text-4xl font-black italic uppercase tracking-tighter">Day {selectedDayData.day}</h3>
              <p className="text-[10px] text-cyan-400 font-black tracking-widest mt-1 uppercase">{selectedDayData.date}</p>
            </div>
            {selectedDayData.photo && <img src={selectedDayData.photo} className="w-full aspect-square object-cover rounded-[2.5rem] mb-6 border border-white/10 shadow-2xl" />}
            <div className="space-y-3">
              <div className="flex justify-between p-4 bg-white/5 rounded-2xl border border-white/5 items-center">
                <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">Hydration</span>
                <p className="font-black text-cyan-400">{selectedDayData.water}ml / 3785ml</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(selectedDayData.tasks).map(([name, done]) => (
                  <div key={name} className={`p-4 rounded-2xl border flex flex-col gap-1 ${done ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                    <span className="text-[8px] font-black uppercase opacity-40 tracking-tighter">{name}</span>
                    <span className={`text-[10px] font-black uppercase ${done ? 'text-cyan-400' : 'text-red-400'}`}>{done ? 'Complete' : 'Failed'}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setSelectedDayData(null)} className="w-full mt-6 py-4 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-2xl">Close Log</button>
          </div>
        </div>
      )}
    </div>
  );
}