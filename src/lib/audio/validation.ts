import { z } from "zod";

export const voiceOptions = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "onyx",
  "nova",
  "sage",
  "shimmer",
  "verse",
  "marin",
  "cedar",
] as const;

export const languageOptions = ["Thai", "English"] as const;
export const speedOptions = [0.75, 1, 1.25, 1.5] as const;

export const generateAudioSchema = z.object({
  text: z.string().trim().min(1, "ต้องมี Script สำหรับสร้างเสียง").max(4096),
  voice: z.enum(voiceOptions),
  language: z.enum(languageOptions),
  speed: z.coerce.number().refine((value) => speedOptions.includes(value as 1)),
});

export type GenerateAudioInput = z.infer<typeof generateAudioSchema>;
