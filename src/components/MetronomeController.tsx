"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Square, Plus, Minus, Palette, Volume2 } from "lucide-react";
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
  lime: "100 85% 55%",
  blue: "210 100% 66%",
  pink: "330 100% 70%",
  orange: "30 100% 60%",
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
  const [themeColor, setThemeColor] = useState<keyof typeof COLOR_THEMES>("lime");
  const [soundProfile, setSoundProfile] = useState<keyof typeof SOUND_PROFILES>("classic");

  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0.0);
  const beatNumber = useRef(0);
  const timerID = useRef<number | null>(null);
  const beatsPerMeasure = parseInt(timeSignature.split("/")[0]);

  const scheduleNote = useCallback((beatNumber: number, time: number) => {
    if (!audioContext.current) return;

    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();
    const profile = SOUND_PROFILES[soundProfile];

    // Set sound parameters based on profile
    osc.type = profile.type;
    osc.frequency.value = beatNumber % beatsPerMeasure === 0 ? profile.accent : profile.normal;
    
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + (soundProfile === 'woodblock' ? 0.05 : 0.1));

    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }, [beatsPerMeasure, soundProfile]);

  const scheduler = useCallback(() => {
    if (!audioContext.current) return;
    
    while (nextNoteTime.current < audioContext.current.currentTime + 0.1) {
      scheduleNote(beatNumber.current, nextNoteTime.current);
      
      const secondsPerBeat = 60.0 / bpm;
      nextNoteTime.current += secondsPerBeat;
      
      const currentLocalBeat = beatNumber.current % beatsPerMeasure;
      setTimeout(() => setCurrentBeat(currentLocalBeat), 0);
      
      beatNumber.current++;
    }
    timerID.current = window.setTimeout(scheduler, 25.0);
  }, [bpm, beatsPerMeasure, scheduleNote]);

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

  return (
    <div 
      className="max-w-md mx-auto w-full space-y-8 px-4 py-8"
      style={{ '--primary': COLOR_THEMES[themeColor] } as React.CSSProperties}
    >
      {/* Visual Indicator Area */}
      <div className="bg-card rounded-3xl p-6 shadow-2xl border border-primary/10">
        <BeatIndicator 
          currentBeat={currentBeat} 
          totalBeats={beatsPerMeasure} 
          active={isPlaying} 
        />
        
        <div className="text-center space-y-2">
          <div className="text-8xl font-bold text-primary tracking-tighter">
            {bpm}
          </div>
          <div className="text-secondary font-bold text-xl uppercase tracking-widest">
            BPM
          </div>
        </div>
      </div>

      {/* Main Controls */}
      <div className="space-y-10">
        {/* Slider & Quick Adjust */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full border-2 text-primary border-primary/20 hover:bg-primary/10"
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
              className="h-14 w-14 rounded-full border-2 text-primary border-primary/20 hover:bg-primary/10"
              onClick={() => adjustBpm(5)}
            >
              <Plus className="w-8 h-8" />
            </Button>
          </div>
        </div>

        {/* Start/Stop Button */}
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

        {/* Settings Grid */}
        <div className="grid grid-cols-1 gap-3">
          {/* Time Signature */}
          <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-primary/10">
            <span className="text-md font-bold text-secondary">Time Signature</span>
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

          {/* Sound Profile */}
          <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-primary/10">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-secondary" />
              <span className="text-md font-bold text-secondary">Sound</span>
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

          {/* Theme Color */}
          <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-primary/10">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-secondary" />
              <span className="text-md font-bold text-secondary">Color</span>
            </div>
            <Select value={themeColor} onValueChange={(v) => setThemeColor(v as any)}>
              <SelectTrigger className="w-32 bg-background border-none text-primary font-bold capitalize">
                <SelectValue placeholder="Color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lime">Lime</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="pink">Pink</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <footer className="text-center text-muted-foreground text-sm pt-8">
        Designed for little musicians • BeatBuddy v1.0
      </footer>
    </div>
  );
}
