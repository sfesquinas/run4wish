// app/lib/groqClient.ts
// Cliente de Groq para generación de preguntas con IA

import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
  console.warn('⚠️ GROQ_API_KEY no está configurada. Las llamadas a Groq fallarán.');
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

