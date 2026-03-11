"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
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
    <Card className="bg-card/50 border-primary/20 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-secondary">
          <Sparkles className="w-5 h-5" />
          BeatBuddy AI Coach
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {prompt ? (
          <p className="text-foreground italic leading-relaxed">
            "{prompt}"
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Need a fun challenge? Click below for a custom rhythm exercise!
          </p>
        )}
        <Button 
          onClick={handleGenerate} 
          disabled={loading}
          variant="secondary"
          className="w-full font-bold h-12 rounded-xl"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Sparkles className="w-5 h-5 mr-2" />
          )}
          {prompt ? "Try Another Exercise" : "Generate Exercise"}
        </Button>
      </CardContent>
    </Card>
  );
}
