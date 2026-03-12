"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Square, Plus, Minus, Palette, Volume2, Music } from "lucide-react";
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

export default function MetronomeController() {
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState("4/4");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [themeColor, setThemeColor] = useState<keyof typeof COLOR_THEMES>("zelda");
  const [soundProfile, setSoundProfile] = useState<keyof typeof SOUND_PROFILES>("classic");

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
    
    return () => {
      releaseWakeLock();
    };
  }, [isPlaying, requestWakeLock, releaseWakeLock]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isPlaying) {
        await requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPlaying, requestWakeLock]);

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

  useEffect(() => {
    return () => {
      if (timerID.current) clearTimeout(timerID.current);
    };
  }, []);

  const adjustBpm = (delta: number) => {
    setBpm((prev) => Math.min(Math.max(prev + delta, 40), 240));
  };

  const currentTheme = COLOR_THEMES[themeColor];

  return (
    <div 
      className="w-full min-h-screen bg-background transition-colors duration-500 ease-in-out flex flex-col items-center relative overflow-hidden"
      style={{ 
        '--primary': currentTheme.primary,
        '--background': currentTheme.background,
        '--card': currentTheme.card,
        '--secondary': currentTheme.secondary,
        '--accent': currentTheme.primary,
        '--ring': currentTheme.primary,
      } as React.CSSProperties}
    >
      <header className="w-full py-8 px-4 flex items-center justify-center gap-2 z-10">
        <div className="bg-primary p-2 rounded-xl transition-colors duration-500">
          <Music className="w-6 h-6 text-background" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          SimpleBeats <span className="text-primary transition-colors duration-500">Metronome</span>
        </h1>
      </header>

      <div className="flex-1 w-full max-w-md space-y-8 px-4 pb-12 z-10">
        <div className="bg-card rounded-3xl p-6 shadow-2xl border border-primary/10 transition-colors duration-500">
          <BeatIndicator 
            currentBeat={currentBeat} 
            totalBeats={beatsPerMeasure} 
            active={isPlaying} 
          />
          
          <div className="text-center space-y-2">
            <div className="text-8xl font-bold text-primary tracking-tighter transition-colors duration-500">
              {bpm}
            </div>
            <div className="text-secondary font-bold text-xl uppercase tracking-widest transition-colors duration-500">
              BPM
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-full border-2 text-primary border-primary/20 hover:bg-primary/10 transition-colors duration-500"
                onClick={() => adjustBpm(-5)}
              >
                <Minus className="w-8 h-8" />
              </Button>
              <Slider
                value={[bpm]}
                onValueChange={(vals) => setBpm(vals[0])}
                min={40}
                max={240}
                step={1}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-full border-2 text-primary border-primary/20 hover:bg-primary/10 transition-colors duration-500"
                onClick={() => adjustBpm(5)}
              >
                <Plus className="w-8 h-8" />
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={toggleMetronome}
              className={cn(
                "h-32 w-32 rounded-full shadow-2xl transition-all duration-300 transform active:scale-95",
                isPlaying 
                  ? "bg-destructive text-white hover:bg-destructive/90" 
                  : "bg-primary text-background hover:bg-primary/90"
              )}
            >
              {isPlaying ? (
                <Square className="w-16 h-16 fill-current" />
              ) : (
                <Play className="w-16 h-16 fill-current ml-2" />
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-primary/10 transition-colors duration-500">
              <span className="text-md font-bold text-secondary transition-colors duration-500">Time Signature</span>
              <Select value={timeSignature} onValueChange={setTimeSignature}>
                <SelectTrigger className="w-24 bg-background border-none text-primary font-bold">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2/4">2/4</SelectItem>
                  <SelectItem value="3/4">3/4</SelectItem>
                  <SelectItem value="4/4">4/4</SelectItem>
                  <SelectItem value="5/4">5/4</SelectItem>
                  <SelectItem value="6/8">6/8</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-primary/10 transition-colors duration-500">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-secondary transition-colors duration-500" />
                <span className="text-md font-bold text-secondary transition-colors duration-500">Sound</span>
              </div>
              <Select value={soundProfile} onValueChange={(v) => setSoundProfile(v as any)}>
                <SelectTrigger className="w-32 bg-background border-none text-primary font-bold capitalize">
                  <SelectValue placeholder="Sound" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="woodblock">Woodblock</SelectItem>
                  <SelectItem value="electronic">Electronic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-primary/10 transition-colors duration-500">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-secondary transition-colors duration-500" />
                <span className="text-md font-bold text-secondary transition-colors duration-500">Theme</span>
              </div>
              <Select value={themeColor} onValueChange={(v) => setThemeColor(v as any)}>
                <SelectTrigger className="w-32 bg-background border-none text-primary font-bold capitalize">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lime">Lime</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="pink">Pink</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                  <SelectItem value="ultraman">Ultraman</SelectItem>
                  <SelectItem value="zelda">Zelda</SelectItem>
                  <SelectItem value="minecraft">Minecraft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <footer className="text-center text-muted-foreground text-sm pt-8 opacity-60">
          Just a metronome • Designed for little musicians • SimpleBeats v1.1
        </footer>
      </div>
    </div>
  );
}
