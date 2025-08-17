import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { Language } from '../types';
import { translations } from '../localization';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

if (!apiKey) {
  console.error("Gemini API key not found. Please set VITE_GEMINI_API_KEY in Vercel.");
}

// Prepara el cliente de IA
const genAI = new GoogleGenerativeAI(apiKey);

// Define la configuración de seguridad para ser menos restrictiva
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 1024,
  },
  safetySettings // Añadimos la configuración de seguridad aquí
});

const getPrompts = (lang: Language) => translations[lang];

export async function generateQuestions(problemDescription: string, businessName: string, language: Language): Promise<string[]> {
    const prompt = `You are an expert business consultant. Based on the problem description for "${businessName}": "${problemDescription}", generate 5 key questions. Respond ONLY with a JSON array of strings in ${language === 'es' ? 'Spanish' : 'English'}. Example: ["Question 1?", "Question 2?"]`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        if (!text || !text.trim().startsWith('[')) {
            throw new Error("AI did not return a valid JSON array.");
        }
        const cleanJson = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson);

    } catch (error) {
        console.error("Error in generateQuestions:", error);
        // Devolvemos preguntas de respaldo en caso de cualquier error
        return language === 'es'
            ? ["¿Cuál es el principal objetivo que esperas alcanzar?", "¿Quiénes son tus competidores principales?", "¿Cuál es tu presupuesto actual para esta iniciativa?", "¿Cómo mides el éxito?", "¿Qué has intentado hasta ahora?"]
            : ["What is the main objective you hope to achieve?", "Who are your main competitors?", "What is your current budget for this initiative?", "How do you measure success?", "What have you tried so far?"];
    }
}

export async function generateAdvice(businessName: string, problemDescription: string, questions: string[], answers: string[], language: Language): Promise<string> {
    const qaPairs = questions.map((q, i) => `Q: ${q}\nA: ${answers[i] || 'No answer provided.'}`).join('\n\n');
    const formattingInstruction = language === 'es' 
      ? `Estructura tu respuesta con emojis: 🎯 **Objetivo Principal:**, 🔍 **Análisis Clave:**, 🚀 **Pasos a Seguir:** (con viñetas), 💡 **Consejo Estratégico:**`
      : `Structure your response with emojis: 🎯 **Main Goal:**, 🔍 **Key Insight:**, 🚀 **Action Steps:** (with bullet points), 💡 **Strategic Tip:**`;
    const prompt = `As an expert AI consultant for "${businessName}" facing "${problemDescription}", and based on these Q&As:\n${qaPairs}\n\nProvide clear, actionable advice in ${language === 'es' ? 'Spanish' : 'English'}. ${formattingInstruction}`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error generating advice:", error);
        throw new Error("Failed to generate advice from AI.");
    }
}

// ... Las funciones generateFollowUp y generateSummary también deberían incluir el safetySettings
// pero el modelo ya lo tiene configurado en su inicialización, así que no es necesario cambiar su código.

export async function generateFollowUp(context: string, userQuestion: string, language: Language): Promise<string> {
    const prompt = `Based on the consultation history:\n${context}\n\nAnswer the user's new question: "${userQuestion}" in ${language === 'es' ? 'Spanish' : 'English'}.`;
    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error generating follow-up:", error);
        throw new Error("Failed to get a follow-up response from AI.");
    }
}

export async function generateSummary(context: string, language: Language): Promise<string> {
    const prompt = `Summarize the following consultation history into a structured report in ${language === 'es' ? 'Spanish' : 'English'}:\n${context}`;
    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error generating summary:", error);
        throw new Error("Failed to generate summary from AI.");
    }
}
