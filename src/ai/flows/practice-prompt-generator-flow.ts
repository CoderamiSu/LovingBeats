'use server';
/**
 * @fileOverview A Genkit flow for generating simple rhythm exercises based on BPM and time signature.
 *
 * - generatePracticePrompt - A function that generates rhythm exercises.
 * - PracticePromptGeneratorInput - The input type for the generatePracticePrompt function.
 * - PracticePromptGeneratorOutput - The return type for the generatePracticePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PracticePromptGeneratorInputSchema = z.object({
  bpm: z
    .number()
    .int()
    .positive()
    .describe('The current beats per minute (BPM) for the metronome.'),
  timeSignature: z
    .string()
    .regex(/^\d\/\d$/)
    .describe(
      'The current time signature (e.g., "4/4", "3/4"). Expected format: "numerator/denominator".'
    ),
});
export type PracticePromptGeneratorInput = z.infer<
  typeof PracticePromptGeneratorInputSchema
>;

const PracticePromptGeneratorOutputSchema = z.object({
  exercise: z
    .string()
    .describe(
      'A simple rhythm exercise suitable for young music learners, based on the provided BPM and time signature.'
    ),
});
export type PracticePromptGeneratorOutput = z.infer<
  typeof PracticePromptGeneratorOutputSchema
>;

export async function generatePracticePrompt(
  input: PracticePromptGeneratorInput
): Promise<PracticePromptGeneratorOutput> {
  return practicePromptGeneratorFlow(input);
}

const practicePrompt = ai.definePrompt({
  name: 'practicePrompt',
  input: {schema: PracticePromptGeneratorInputSchema},
  output: {schema: PracticePromptGeneratorOutputSchema},
  prompt: `You are a friendly music teacher assistant designed to create simple and fun rhythm exercises for young children learning music.

Based on the current BPM and time signature, generate a very simple rhythm exercise or practice prompt. The exercise should be easy to understand and encourage practice.

Make sure the exercise is short and clearly explained.

Here are the details:
BPM: {{{bpm}}}
Time Signature: {{{timeSignature}}}

Example Output: "Tap your hands together 4 times for each beat, then clap loudly on the first beat of every measure!"

Generate your exercise now:`,
});

const practicePromptGeneratorFlow = ai.defineFlow(
  {
    name: 'practicePromptGeneratorFlow',
    inputSchema: PracticePromptGeneratorInputSchema,
    outputSchema: PracticePromptGeneratorOutputSchema,
  },
  async input => {
    const {output} = await practicePrompt(input);
    return output!;
  }
);
