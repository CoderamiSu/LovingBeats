import MetronomeController from "@/components/MetronomeController";
import { Music } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center">
      {/* Header */}
      <header className="w-full py-6 px-4 flex items-center justify-center gap-2">
        <div className="bg-primary p-2 rounded-xl">
          <Music className="w-6 h-6 text-background" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          BeatBuddy <span className="text-primary">Metronome</span>
        </h1>
      </header>

      {/* App Content */}
      <div className="flex-1 w-full max-w-2xl flex items-center justify-center">
        <MetronomeController />
      </div>
    </main>
  );
}
