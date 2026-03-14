"use client";

import { useState } from "react";
import { Sparkles, Loader2, Music4 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generatePracticePrompt } from "@/ai/flows/practice-prompt-generator-flow";

interface PracticePromptCardProps {
  bpm: number;
  timeSignature: string;
}

export function PracticePromptCard({ bpm, timeSignature }: PracticePromptCardProps) {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generatePracticePrompt({ bpm, timeSignature });
      setPrompt(result.exercise);
    } catch (error) {
      console.error("Failed to generate practice prompt", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-4 border-primary/20 backdrop-blur-lg rounded-[2.5rem] shadow-xl overflow-hidden relative">
      <div className="absolute top-[-20px] right-[-20px] bg-primary/20 w-16 h-16 rounded-full blur-xl" />
      
      <CardHeader className="pb-3 pt-6">
        <CardTitle className="text-xl flex items-center justify-center gap-3 text-primary font-black uppercase tracking-wider">
          <div className="bg-primary/20 p-2 rounded-xl">
            <Music4 className="w-6 h-6" />
          </div>
          BeatBuddy Coach
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6 text-center pb-8 px-8">
        <div className="min-h-[60px] flex items-center justify-center">
          {prompt ? (
            <p className="text-foreground text-lg font-bold leading-relaxed italic">
              "{prompt}"
            </p>
          ) : (
            <p className="text-muted-foreground font-medium">
              Want a fun musical challenge? <br/> Ask your BeatBuddy coach!
            </p>
          )}
        </div>
        
        <Button 
          onClick={handleGenerate} 
          disabled={loading}
          variant="secondary"
          className="w-full font-black text-lg h-14 rounded-2xl shadow-[0_8px_15px_rgba(0,0,0,0.2)] hover:shadow-primary/20 active:translate-y-1 transition-all border-b-4 border-black/20"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
          ) : (
            <Sparkles className="w-6 h-6 mr-2" />
          )}
          {prompt ? "Another Challenge!" : "Give Me A Challenge!"}
        </Button>
      </CardContent>
    </Card>
  );
}