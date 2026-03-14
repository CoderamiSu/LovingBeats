"use client";

import { cn } from "@/lib/utils";

interface BeatIndicatorProps {
  currentBeat: number;
  totalBeats: number;
  active: boolean;
}

export function BeatIndicator({ currentBeat, totalBeats, active }: BeatIndicatorProps) {
  return (
    <div className="flex justify-center items-center gap-5 py-6">
      {Array.from({ length: totalBeats }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-10 h-10 rounded-2xl transition-all duration-150 border-4 shadow-sm",
            active && currentBeat === i
              ? "bg-primary border-white scale-125 rotate-6 shadow-[0_10px_20px_rgba(var(--primary),0.4)] z-10"
              : "bg-muted/30 border-muted-foreground/20 opacity-40 scale-100 rotate-0"
          )}
        />
      ))}
    </div>
  );
}