"use client";

import { cn } from "@/lib/utils";

interface BeatIndicatorProps {
  currentBeat: number;
  totalBeats: number;
  active: boolean;
}

export function BeatIndicator({ currentBeat, totalBeats, active }: BeatIndicatorProps) {
  return (
    <div className="flex justify-center gap-4 py-8">
      {Array.from({ length: totalBeats }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-8 h-8 rounded-full transition-all duration-150 border-2",
            active && currentBeat === i
              ? "bg-primary border-primary scale-125 shadow-[0_0_15px_rgba(107,239,43,0.5)]"
              : "bg-muted border-muted-foreground/30 opacity-40 scale-100"
          )}
        />
      ))}
    </div>
  );
}
