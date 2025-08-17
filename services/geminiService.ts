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
  model: "gemini-2.5-pro",
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
    const prompt = `You are an expert business consultant. Based on the following problem description for a company named "${businessName}", generate 5 concise, key questions that, when answered, will provide enough context to give strategic advice. Problem: "${problemDescription}". Respond ONLY with a JSON array of strings, where each string is a question. The questions must be in ${language === 'es' ? 'Spanish' : 'English'}. For example: ["Question 1?", "Question 2?"]`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        console.log("Raw response from AI:", text); // Added for debugging

        // --- Start of new robust code ---
        if (!text || !text.trim().startsWith('[')) {
            console.error("AI did not return a valid JSON array. Fallback activated.");
            // Fallback to avoid crashing
            return language === 'es'
                ? ["¿Cuál es el principal objetivo que esperas alcanzar?", "¿Quiénes son tus competidores principales?", "¿Cuál es tu presupuesto actual para esta iniciativa?"]
                : ["What is the main objective you hope to achieve?", "Who are your main competitors?", "What is your current budget for this initiative?"];
        }

        try {
            const cleanJson = text.replace(/```json|```/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (parseError) {
            console.error("Failed to parse JSON from AI response:", parseError);
            // Fallback if JSON is malformed
            return language === 'es'
                ? ["¿Cuál ha sido el mayor obstáculo hasta ahora?", "¿Qué recursos tienes disponibles?", "¿Cómo mides el éxito?"]
                : ["What has been the biggest obstacle so far?", "What resources do you have available?", "How do you measure success?"];
        }
        // --- End of new robust code ---

    } catch (apiError) {
        console.error("Error generating questions from Gemini API:", apiError);
        throw new Error("Failed to generate questions from the AI.");
    }
}

export async function generateAdvice(businessName: string, problemDescription: string, questions: string[], answers: string[], language: Language): Promise<string> {
    const qaPairs = questions.map((q, i) => `Q: ${q}\nA: ${answers[i] || 'No answer provided.'}`).join('\n\n');
    
    // Instrucción detallada para el formato de la respuesta
    const formattingInstruction = language === 'es' 
      ? `Estructura tu respuesta con emojis para que sea visualmente atractiva y clara, así:\n\n🎯 **Objetivo Principal:** [Un objetivo simple en una oración]\n\n🔍 **Análisis Clave:** [Un breve análisis profesional de la situación]\n\n🚀 **Pasos a Seguir:**\n- **Paso 1:** [Acción simple y directa]\n- **Paso 2:** [Otra acción simple]\n- **Paso 3:** [Y una más]\n\n💡 **Consejo Estratégico:** [Una sugerencia útil y experta]`
      : `Structure your response with emojis for visual appeal and clarity, like this:\n\n🎯 **Main Goal:** [A simple, one-sentence objective]\n\n🔍 **Key Insight:** [A brief, professional analysis of the situation]\n\n🚀 **Action Steps:**\n- **Step 1:** [Simple, direct action]\n- **Step 2:** [Another simple action]\n- **Step 3:** [And another one]\n\n💡 **Strategic Tip:** [A helpful, expert hint]`;

    const prompt = `You are an expert business consultant with a friendly and professional tone. The company "${businessName}" has this challenge: "${problemDescription}". They've answered these questions: \n${qaPairs}.\n\nProvide clear, insightful, and actionable advice in ${language === 'es' ? 'Spanish' : 'English'}. ${formattingInstruction}\n\nMantén un tono profesional pero de apoyo.`;

    try {
        const result = await model.generateContent(prompt);
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
