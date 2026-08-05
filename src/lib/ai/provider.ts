import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import type { LanguageModel } from 'ai';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export function getModel(): LanguageModel {
  if (process.env.GROQ_API_KEY) {
    return groq(process.env.GROQ_MODEL || 'openai/gpt-oss-120b');
  }
  return google(process.env.GEMINI_MODEL || 'gemini-2.5-flash');
}
