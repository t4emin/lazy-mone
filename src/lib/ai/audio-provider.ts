export interface GenerateAudioInput {
  text: string;
  voice: string;
  language: string;
  speed: number;
}

export interface GeneratedAudio {
  data: Buffer;
  provider: string;
  model: string;
}

export interface AIAudioProvider {
  generateAudio(input: GenerateAudioInput): Promise<GeneratedAudio>;
}
