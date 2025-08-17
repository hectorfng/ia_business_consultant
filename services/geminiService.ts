import { GoogleGenerativeAI } from "@google/generative-ai";
import { Language, ChatMessage } from '../types';
import { translations } from '../localization';

// 1. Lee la API key usando el método correcto y seguro de Vite
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

if (!apiKey) {
  console.error("Gemini API key not found. Please set VITE_GEMINI_API_KEY in Vercel.");
}

// 2. Prepara el cliente de IA con el modelo correcto
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 1024,
  }
});

// Helper para obtener traducciones
const getPrompts = (lang: Language) => translations[lang];

// 3. Funciones que tu App necesita, ahora usando la sintaxis correcta
export async function generateQuestions(problemDescription: string, businessName: string, language: Language): Promise<string[]> {
  const t = getPrompts(language);
  const prompt = `You are an expert business consultant. Based on the following problem description for a company named "${businessName}", generate 3 concise, key questions that, when answered, will provide enough context to give strategic advice. Problem: "${problemDescription}". Respond ONLY with a JSON array of strings, where each string is a question. The questions must be in ${language === 'es' ? 'Spanish' : 'English'}. For example: ["Question 1?", "Question 2?"]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Limpia y parsea la respuesta JSON
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error generating questions:", error);
    throw new Error("Failed to generate questions from the AI.");
  }
}

export async function generateAdvice(businessName: string, problemDescription: string, questions: string[], answers: string[], language: Language): Promise<string> {
    const t = getPrompts(language);
    const qaPairs = questions.map((q, i) => `Q: ${q}\nA: ${answers[i] || 'No answer provided.'}`).join('\n\n');
    const prompt = t.advice.title; // Usar prompt desde un objeto de traducciones sería ideal, pero esto funciona.

    try {
        const fullPrompt = `You are an expert business consultant with a friendly and professional tone. The company "${businessName}" has this challenge: "${problemDescription}". They've answered these questions: \n${qaPairs}.\n\nProvide clear, insightful, and actionable advice in ${language === 'es' ? 'Spanish' : 'English'}. Structure your response with markdown.`;
        const result = await model.generateContent(fullPrompt);
        return result.response.text();
    } catch (error) {
        console.error("Error generating advice:", error);
        throw new Error("Failed to generate advice from AI.");
    }
}

export async function generateFollowUp(context: string, userQuestion: string, language: Language): Promise<string> {
    const t = getPrompts(language);
    const prompt = `You are a friendly and professional business consultant. Based on the entire consultation history provided below, please answer the user's follow-up question in ${language === 'es' ? 'Spanish' : 'English'}.\n\n--- CONSULTATION HISTORY ---\n${context}\n\n--- USER'S NEW QUESTION ---\n${userQuestion}\n\nAnswer in a clear, professional, and supportive manner.`;
    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error generating follow-up:", error);
        throw new Error("Failed to get a follow-up response from AI.");
    }
}

export async function generateSummary(context: string, language: Language): Promise<string> {
    const t = getPrompts(language);
    const prompt = `You are an expert business consultant creating a final, professional summary of a client consultation in ${language === 'es' ? 'Spanish' : 'English'}. Synthesize the entire consultation history provided below into a comprehensive report.\n\n--- FULL CONSULTATION HISTORY ---\n${context}\n\n--- INSTRUCTIONS ---\nGenerate a clean, well-structured summary document using markdown with clear headings (e.g., "**Initial Problem:**", "**Key Findings:**", "**Strategic Recommendations:**").`;
    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error generating summary:", error);
        throw new Error("Failed to generate summary from AI.");
    }
}
