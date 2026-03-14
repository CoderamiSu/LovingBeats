"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Square, Palette, Volume2, Music, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { BeatIndicator } from "./BeatIndicator";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLOR_THEMES = {
  lime: {
    primary: "100 85% 55%",
    background: "95 18% 12%",
    card: "95 18% 15%",
    secondary: "110 71% 75%",
  },
  blue: {
    primary: "210 100% 66%",
    background: "222 47% 11%",
    card: "222 47% 15%",
    secondary: "210 70% 80%",
  },
  pink: {
    primary: "330 100% 70%",
    background: "330 30% 12%",
    card: "330 30% 15%",
    secondary: "330 70% 85%",
  },
  orange: {
    primary: "30 100% 60%",
    background: "25 40% 10%",
    card: "25 40% 13%",
    secondary: "35 80% 80%",
  },
  ultraman: {
    primary: "0 100% 50%", // Red
    background: "220 40% 8%", // Dark Galaxy Blue
    card: "220 40% 12%",
    secondary: "0 0% 85%", // Silver
  },
  zelda: {
    primary: "48 100% 50%", // Triforce Gold
    background: "140 40% 8%", // Deep Forest Green
    card: "140 40% 12%",
    secondary: "100 50% 60%", // Link Green
  },
  minecraft: {
    primary: "85 80% 50%", // Grass Block Green
    background: "25 30% 10%", // Dirt Brown
    card: "25 30% 14%",
    secondary: "195 90% 65%", // Sky Blue
  },
};

const SOUND_PROFILES = {
  classic: { accent: 1000, normal: 800, type: 'sine' as OscillatorType },
  woodblock: { accent: 1500, normal: 1200, type: 'triangle' as OscillatorType },
  electronic: { accent: 600, normal: 400, type: 'square' as OscillatorType },
};

const STORAGE_KEY = "simplebeats_settings";

export default function MetronomeController() {
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState("4/4");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [themeColor, setThemeColor] = useState<keyof typeof COLOR_THEMES>("zelda");
  const [soundProfile, setSoundProfile] = useState<keyof typeof SOUND_PROFILES>("classic");
  const [isLoaded, setIsLoaded] = useState(false);

  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0.0);
  const beatNumber = useRef(0);
  const timerID = useRef<number | null>(null);
  const beatsPerMeasure = parseInt(timeSignature.split("/")[0]);
  const wakeLock = useRef<any>(null);

  const bpmRef = useRef(bpm);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);
  const soundProfileRef = useRef(soundProfile);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        if (settings.bpm) setBpm(settings.bpm);
        if (settings.timeSignature) setTimeSignature(settings.timeSignature);
        if (settings.themeColor) setThemeColor(settings.themeColor);
        if (settings.soundProfile) setSoundProfile(settings.soundProfile);
      } catch (e) {
        console.error("Failed to parse saved settings", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      const settings = { bpm, timeSignature, themeColor, soundProfile };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [bpm, timeSignature, themeColor, soundProfile, isLoaded]);

  useEffect(() => {
    bpmRef.current = bpm;
    beatsPerMeasureRef.current = beatsPerMeasure;
    soundProfileRef.current = soundProfile;
  }, [bpm, beatsPerMeasure, soundProfile]);

  const requestWakeLock = useCallback(async () => {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
      try {
        wakeLock.current = await (navigator as any).wakeLock.request('screen');
      } catch (err: any) {
        console.warn(`Wake Lock could not be acquired: ${err.message}`);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLock.current !== null) {
      wakeLock.current.release().then(() => {
        wakeLock.current = null;
      });
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => releaseWakeLock();
  }, [isPlaying, requestWakeLock, releaseWakeLock]);

  const scheduleNote = useCallback((beatNum: number, time: number) => {
    if (!audioContext.current) return;
    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();
    const profile = SOUND_PROFILES[soundProfileRef.current];
    osc.type = profile.type;
    osc.frequency.value = beatNum % beatsPerMeasureRef.current === 0 ? profile.accent : profile.normal;
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + (soundProfileRef.current === 'woodblock' ? 0.05 : 0.1));
    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);
    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    if (!audioContext.current) return;
    while (nextNoteTime.current < audioContext.current.currentTime + 0.1) {
      scheduleNote(beatNumber.current, nextNoteTime.current);
      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTime.current += secondsPerBeat;
      const currentLocalBeat = beatNumber.current % beatsPerMeasureRef.current;
      setTimeout(() => setCurrentBeat(currentLocalBeat), 0);
      beatNumber.current++;
    }
    timerID.current = window.setTimeout(scheduler, 25.0);
  }, [scheduleNote]);

  const toggleMetronome = () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (isPlaying) {
      setIsPlaying(false);
      if (timerID.current) clearTimeout(timerID.current);
      setCurrentBeat(0);
      beatNumber.current = 0;
    } else {
      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }
      setIsPlaying(true);
      nextNoteTime.current = audioContext.current.currentTime;
      scheduler();
    }
  };

  const adjustBpm = (delta: number) => {
    setBpm((prev) => Math.min(Math.max(prev + delta, 40), 240));
  };

  const currentTheme = COLOR_THEMES[themeColor];
  if (!isLoaded) return null;

  return (
    <div 
      className="w-full min-h-screen bg-background transition-colors duration-700 ease-in-out flex flex-col items-center relative overflow-x-hidden p-4"
      style={{ 
        '--primary': currentTheme.primary,
        '--background': currentTheme.background,
        '--card': currentTheme.card,
        '--secondary': currentTheme.secondary,
        '--accent': currentTheme.primary,
        '--ring': currentTheme.primary,
      } as React.CSSProperties}
    >
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <header className="w-full py-6 flex items-center justify-center gap-3 z-10 floating">
        <div className="bg-primary p-3 rounded-2xl transition-all duration-500 shadow-lg rotate-3">
          <Music className="w-8 h-8 text-background" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground drop-shadow-sm">
          Simple<span className="text-primary transition-colors duration-500">Beats</span>
        </h1>
      </header>

      <div className="flex-1 w-full max-w-md space-y-6 z-10 flex flex-col items-center">
        <div className="w-full bg-card rounded-[3rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 border-white/5 transition-all duration-500 group overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <BeatIndicator 
            currentBeat={currentBeat} 
            totalBeats={beatsPerMeasure} 
            active={isPlaying} 
          />
          
          <div className="text-center space-y-0 py-4">
            <div className="text-[9rem] font-black text-primary leading-none tracking-tighter transition-colors duration-500 drop-shadow-md select-none">
              {bpm}
            </div>
            <div className="flex items-center justify-center gap-2 text-secondary font-black text-2xl uppercase tracking-[0.2em] transition-colors duration-500">
              <Sparkles className="w-5 h-5" />
              BPM
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="w-full space-y-10 pt-4">
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col gap-4">
              <Button
                variant="outline"
                className="h-16 w-16 rounded-[1.5rem] border-4 text-primary border-primary/20 hover:bg-primary/10 text-xl font-black bg-card shadow-lg active:scale-90 transition-all"
                onClick={() => adjustBpm(1)}
              >
                +1
              </Button>
              <Button
                variant="outline"
                className="h-16 w-16 rounded-[1.5rem] border-4 text-primary border-primary/20 hover:bg-primary/10 text-xl font-black bg-card shadow-lg active:scale-90 transition-all"
                onClick={() => adjustBpm(5)}
              >
                +5
              </Button>
            </div>
            
            <div className="flex-1 h-32 flex items-center px-4 bg-card/40 rounded-[2rem] border-2 border-white/5">
              <Slider
                value={[bpm]}
                onValueChange={(vals) => setBpm(vals[0])}
                min={40}
                max={240}
                step={1}
                className="h-8"
              />
            </div>

            <div className="flex flex-col gap-4">
              <Button
                variant="outline"
                className="h-16 w-16 rounded-[1.5rem] border-4 text-primary border-primary/20 hover:bg-primary/10 text-xl font-black bg-card shadow-lg active:scale-90 transition-all"
                onClick={() => adjustBpm(-1)}
              >
                -1
              </Button>
              <Button
                variant="outline"
                className="h-16 w-16 rounded-[1.5rem] border-4 text-primary border-primary/20 hover:bg-primary/10 text-xl font-black bg-card shadow-lg active:scale-90 transition-all"
                onClick={() => adjustBpm(-5)}
              >
                -5
              </Button>
            </div>
          </div>

          <div className="flex justify-center py-4">
            <Button
              onClick={toggleMetronome}
              className={cn(
                "h-40 w-40 rounded-[3rem] shadow-[0_15px_30px_rgba(0,0,0,0.4)] transition-all duration-300 transform active:scale-95 border-8 border-white/10",
                isPlaying 
                  ? "bg-destructive text-white hover:bg-destructive/90" 
                  : "bg-primary text-background hover:bg-primary/90 pulse-button"
              )}
            >
              {isPlaying ? (
                <Square className="w-20 h-20 fill-current" />
              ) : (
                <Play className="w-20 h-20 fill-current ml-4" />
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between p-5 bg-card/60 rounded-[2rem] border-2 border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/20 rounded-xl">
                  <Music className="w-5 h-5 text-secondary" />
                </div>
                <span className="text-lg font-black text-secondary uppercase">Beats</span>
              </div>
              <Select value={timeSignature} onValueChange={setTimeSignature}>
                <SelectTrigger className="w-28 h-12 bg-background/50 border-none text-primary font-black rounded-xl text-lg">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2 border-primary/20">
                  <SelectItem value="2/4">2/4</SelectItem>
                  <SelectItem value="3/4">3/4</SelectItem>
                  <SelectItem value="4/4">4/4</SelectItem>
                  <SelectItem value="5/4">5/4</SelectItem>
                  <SelectItem value="6/8">6/8</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-5 bg-card/60 rounded-[2rem] border-2 border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/20 rounded-xl">
                  <Volume2 className="w-5 h-5 text-secondary" />
                </div>
                <span className="text-lg font-black text-secondary uppercase">Sound</span>
              </div>
              <Select value={soundProfile} onValueChange={(v) => setSoundProfile(v as any)}>
                <SelectTrigger className="w-36 h-12 bg-background/50 border-none text-primary font-black rounded-xl text-lg capitalize">
                  <SelectValue placeholder="Sound" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2 border-primary/20">
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="woodblock">Woody</SelectItem>
                  <SelectItem value="electronic">Bleep</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-5 bg-card/60 rounded-[2rem] border-2 border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/20 rounded-xl">
                  <Palette className="w-5 h-5 text-secondary" />
                </div>
                <span className="text-lg font-black text-secondary uppercase">World</span>
              </div>
              <Select value={themeColor} onValueChange={(v) => setThemeColor(v as any)}>
                <SelectTrigger className="w-36 h-12 bg-background/50 border-none text-primary font-black rounded-xl text-lg capitalize">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2 border-primary/20">
                  <SelectItem value="lime">Bright</SelectItem>
                  <SelectItem value="blue">Ocean</SelectItem>
                  <SelectItem value="pink">Candy</SelectItem>
                  <SelectItem value="orange">Sunset</SelectItem>
                  <SelectItem value="ultraman">Hero</SelectItem>
                  <SelectItem value="zelda">Legend</SelectItem>
                  <SelectItem value="minecraft">Blocks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <footer className="w-full text-center text-muted-foreground/50 text-xs py-8 font-medium">
          Just a metronome • Designed with ❤️ for little musicians • SimpleBeats v1.2
        </footer>
      </div>
    </div>
  );
}
