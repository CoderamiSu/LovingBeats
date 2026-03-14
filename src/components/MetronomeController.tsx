"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Square, Palette, Volume2, Music, Sparkles, Star, Heart } from "lucide-react";
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
  playtime: {
    primary: "48 90% 70%", // Softer Yellow
    background: "195 70% 97%", // Very Soft Sky Blue
    card: "0 0% 100%",
    secondary: "0 75% 75%", // Softer Red
  },
  candy: {
    primary: "330 80% 80%", // Gentle Pink
    background: "330 40% 98%", 
    card: "0 0% 100%",
    secondary: "280 65% 80%", // Gentle Lavender
  },
  ocean: {
    primary: "200 75% 75%", // Gentle Blue
    background: "200 50% 96%",
    card: "0 0% 100%",
    secondary: "170 60% 75%", // Gentle Mint
  },
  blocks: {
    primary: "90 60% 70%", // Gentle Grass
    background: "30 40% 97%", // Cream
    card: "0 0% 100%",
    secondary: "200 70% 80%", // Gentle Sky
  },
  ultraman: {
    primary: "0 80% 75%", // Softened Hero Red
    background: "210 30% 98%", // Soft Silver
    card: "0 0% 100%",
    secondary: "210 20% 85%", // Muted Silver
  },
  zelda: {
    primary: "145 55% 65%", // Soft Forest
    background: "50 45% 97%", // Soft Parchment
    card: "0 0% 100%",
    secondary: "45 80% 75%", // Soft Gold
  },
  minecraft: {
    primary: "105 50% 70%", // Soft Pixel Green
    background: "0 0% 95%", // Soft Stone
    card: "0 0% 100%",
    secondary: "30 45% 70%", // Soft Dirt
  },
};

const SOUND_PROFILES = {
  classic: { accent: 1000, normal: 800, type: 'sine' as OscillatorType },
  woodblock: { accent: 1500, normal: 1200, type: 'triangle' as OscillatorType },
  electronic: { accent: 600, normal: 400, type: 'square' as OscillatorType },
};

const STORAGE_KEY = "simplebeats_settings_v3";

export default function MetronomeController() {
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState("4/4");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [themeColor, setThemeColor] = useState<keyof typeof COLOR_THEMES>("playtime");
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
        if (settings.themeColor && COLOR_THEMES[settings.themeColor as keyof typeof COLOR_THEMES]) {
          setThemeColor(settings.themeColor as keyof typeof COLOR_THEMES);
        }
        if (settings.soundProfile && SOUND_PROFILES[settings.soundProfile as keyof typeof SOUND_PROFILES]) {
          setSoundProfile(settings.soundProfile as keyof typeof SOUND_PROFILES);
        }
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

  const currentTheme = COLOR_THEMES[themeColor] || COLOR_THEMES.playtime;
  if (!isLoaded) return null;

  return (
    <div 
      className="w-full min-h-screen bg-background transition-colors duration-700 ease-in-out flex flex-col items-center relative overflow-hidden p-4 pt-12"
      style={{ 
        '--primary': currentTheme.primary,
        '--background': currentTheme.background,
        '--card': currentTheme.card,
        '--secondary': currentTheme.secondary,
        '--accent': currentTheme.primary,
        '--ring': currentTheme.primary,
      } as React.CSSProperties}
    >
      {/* Playful Background Elements */}
      <div className="absolute top-10 left-10 text-primary/10 floating" style={{ animationDelay: '0s' }}><Star size={64} fill="currentColor" /></div>
      <div className="absolute top-40 right-10 text-secondary/10 floating" style={{ animationDelay: '1s' }}><Heart size={48} fill="currentColor" /></div>
      <div className="absolute bottom-20 left-20 text-accent/20 floating" style={{ animationDelay: '2s' }}><Music size={56} /></div>
      
      <header className="w-full py-6 flex flex-col items-center justify-center gap-2 z-10 floating">
        <div className="bg-primary p-4 rounded-[2.5rem] shadow-xl clay-button rotate-3 border-4 border-white">
          <Music className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-foreground drop-shadow-sm mt-2">
          Simple<span className="text-primary">Beats</span>
        </h1>
      </header>

      <div className="flex-1 w-full max-w-md space-y-6 z-10 flex flex-col items-center">
        <div className="w-full clay-card p-10 group relative transition-all duration-300">
          <BeatIndicator 
            currentBeat={currentBeat} 
            totalBeats={beatsPerMeasure} 
            active={isPlaying} 
          />
          
          <div className="text-center space-y-0 py-4">
            <div className={cn(
              "text-[10rem] font-black text-primary leading-none tracking-tighter transition-all duration-200 drop-shadow-md select-none",
              isPlaying && "beat-active"
            )}>
              {bpm}
            </div>
            <div className="flex items-center justify-center gap-3 text-secondary font-black text-3xl uppercase tracking-widest">
              <Sparkles className="w-6 h-6 fill-current" />
              BPM
              <Sparkles className="w-6 h-6 fill-current" />
            </div>
          </div>
        </div>

        <div className="w-full space-y-10 pt-4">
          <div className="flex items-center justify-center gap-6">
            {/* Plus Buttons on the Left */}
            <div className="flex flex-col gap-6">
              <Button
                variant="outline"
                className="h-16 w-16 rounded-full border-4 text-primary border-primary/20 hover:bg-primary/10 text-xl font-black bg-white clay-button"
                onClick={() => adjustBpm(1)}
              >
                +1
              </Button>
              <Button
                variant="outline"
                className="h-16 w-16 rounded-full border-4 text-primary border-primary/20 hover:bg-primary/10 text-xl font-black bg-white clay-button"
                onClick={() => adjustBpm(5)}
              >
                +5
              </Button>
            </div>
            
            <div className="flex-1 h-32 flex items-center px-6 bg-white/60 rounded-[3rem] border-4 border-white shadow-inner backdrop-blur-sm">
              <Slider
                value={[bpm]}
                onValueChange={(vals) => setBpm(vals[0])}
                min={40}
                max={240}
                step={1}
                className="h-10"
              />
            </div>

            {/* Minus Buttons on the Right */}
            <div className="flex flex-col gap-6">
              <Button
                variant="outline"
                className="h-16 w-16 rounded-full border-4 text-primary border-primary/20 hover:bg-primary/10 text-xl font-black bg-white clay-button"
                onClick={() => adjustBpm(-1)}
              >
                -1
              </Button>
              <Button
                variant="outline"
                className="h-16 w-16 rounded-full border-4 text-primary border-primary/20 hover:bg-primary/10 text-xl font-black bg-white clay-button"
                onClick={() => adjustBpm(-5)}
              >
                -5
              </Button>
            </div>
          </div>

          <div className="flex justify-center py-6">
            <Button
              onClick={toggleMetronome}
              className={cn(
                "h-48 w-48 rounded-[4rem] shadow-2xl transition-all duration-300 transform active:scale-90 border-[12px] border-white",
                isPlaying 
                  ? "bg-secondary text-white hover:bg-secondary/90 shadow-[0_20px_40px_rgba(var(--secondary),0.4)]" 
                  : "bg-primary text-white hover:bg-primary/90 shadow-[0_20px_40px_rgba(var(--primary),0.4)]"
              )}
            >
              {isPlaying ? (
                <Square className="w-24 h-24 fill-current" />
              ) : (
                <Play className="w-24 h-24 fill-current ml-4" />
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <div className="flex items-center justify-between p-6 bg-white/80 rounded-[2.5rem] border-4 border-white shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <Music className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xl font-black text-foreground uppercase tracking-wider">Beats</span>
              </div>
              <Select value={timeSignature} onValueChange={setTimeSignature}>
                <SelectTrigger className="w-32 h-14 bg-background/50 border-none text-primary font-black rounded-2xl text-xl shadow-inner">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent className="rounded-[2rem] border-4 border-primary/20">
                  <SelectItem value="2/4">2 / 4</SelectItem>
                  <SelectItem value="3/4">3 / 4</SelectItem>
                  <SelectItem value="4/4">4 / 4</SelectItem>
                  <SelectItem value="5/4">5 / 4</SelectItem>
                  <SelectItem value="6/8">6 / 8</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-6 bg-white/80 rounded-[2.5rem] border-4 border-white shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary/10 rounded-2xl">
                  <Volume2 className="w-6 h-6 text-secondary" />
                </div>
                <span className="text-xl font-black text-foreground uppercase tracking-wider">Sound</span>
              </div>
              <Select value={soundProfile} onValueChange={(v) => setSoundProfile(v as any)}>
                <SelectTrigger className="w-40 h-14 bg-background/50 border-none text-secondary font-black rounded-2xl text-xl capitalize shadow-inner">
                  <SelectValue placeholder="Sound" />
                </SelectTrigger>
                <SelectContent className="rounded-[2rem] border-4 border-secondary/20">
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="woodblock">Woody</SelectItem>
                  <SelectItem value="electronic">Bleep</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-6 bg-white/80 rounded-[2.5rem] border-4 border-white shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/20 rounded-2xl">
                  <Palette className="w-6 h-6 text-accent-foreground" />
                </div>
                <span className="text-xl font-black text-foreground uppercase tracking-wider">Style</span>
              </div>
              <Select value={themeColor} onValueChange={(v) => setThemeColor(v as any)}>
                <SelectTrigger className="w-40 h-14 bg-background/50 border-none text-foreground font-black rounded-2xl text-xl capitalize shadow-inner">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent className="rounded-[2rem] border-4 border-primary/20">
                  <SelectItem value="playtime">Toy Box</SelectItem>
                  <SelectItem value="candy">Candy</SelectItem>
                  <SelectItem value="ocean">Ocean</SelectItem>
                  <SelectItem value="blocks">Blocks</SelectItem>
                  <SelectItem value="ultraman">Ultraman</SelectItem>
                  <SelectItem value="zelda">Zelda</SelectItem>
                  <SelectItem value="minecraft">Minecraft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <footer className="w-full text-center text-muted-foreground/60 text-sm py-12 font-bold tracking-tight">
          Just a metronome • Designed with ❤️ for little musicians • SimpleBeats v2.0
        </footer>
      </div>
    </div>
  );
}
