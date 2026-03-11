"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Square, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { BeatIndicator } from "./BeatIndicator";
import { PracticePromptCard } from "./PracticePromptCard";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MetronomeController() {
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState("4/4");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0.0);
  const beatNumber = useRef(0);
  const timerID = useRef<number | null>(null);
  const beatsPerMeasure = parseInt(timeSignature.split("/")[0]);

  const scheduleNote = useCallback((beatNumber: number, time: number) => {
    if (!audioContext.current) return;

    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();

    // Accent the first beat of the measure
    osc.frequency.value = beatNumber % beatsPerMeasure === 0 ? 1000 : 800;
    
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }, [beatsPerMeasure]);

  const scheduler = useCallback(() => {
    while (nextNoteTime.current < audioContext.current!.currentTime + 0.1) {
      scheduleNote(beatNumber.current, nextNoteTime.current);
      
      const secondsPerBeat = 60.0 / bpm;
      nextNoteTime.current += secondsPerBeat;
      
      const currentLocalBeat = beatNumber.current % beatsPerMeasure;
      // We use a small timeout to sync UI with audio
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
    <div className="max-w-md mx-auto w-full space-y-8 px-4 py-8">
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

        {/* Settings */}
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-primary/10">
            <span className="text-lg font-bold text-secondary">Time Signature</span>
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
        </div>
      </div>

      {/* AI Practice Prompt */}
      <PracticePromptCard bpm={bpm} timeSignature={timeSignature} />

      <footer className="text-center text-muted-foreground text-sm pt-8">
        Designed for little musicians • BeatBuddy v1.0
      </footer>
    </div>
  );
}
