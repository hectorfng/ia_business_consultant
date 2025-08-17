import { GoogleGenAI, Type } from "@google/genai";
import { Language } from '../types';

if (!process.env.API_KEY) {
  // In a real app, you might use a placeholder key or show a message.
  // For this context, we'll throw an error to make it clear.
  console.warn("API_KEY environment variable not set. Using a placeholder. Please provide your own API key.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "YOUR_API_KEY" });

const prompts = {
  generateQuestions: {
    en: (businessName: string, problemDescription: string) => `You are an expert business consultant. Based on the following problem description for a company named "${businessName}", generate 5 concise, key questions that, when answered, will provide enough context to give strategic advice. Problem: "${problemDescription}". Respond ONLY with a JSON array of strings, where each string is a question. The questions must be in English. For example: ["Question 1?", "Question 2?"]`,
    es: (businessName: string, problemDescription: string) => `Eres un consultor de negocios experto. Basado en la siguiente descripción del problema para una empresa llamada "${businessName}", genera 5 preguntas clave y concisas que, al ser respondidas, proporcionarán suficiente contexto para dar un consejo estratégico. Problema: "${problemDescription}". Responde ÚNICAMENTE con un array JSON de strings, donde cada string es una pregunta. Las preguntas deben estar en Español. Por ejemplo: ["¿Pregunta 1?", "¿Pregunta 2?"]`,
  },
  generateAdvice: {
    en: (businessName: string, problemDescription: string, questionsAndAnswers: string) => `You are an expert business consultant with a friendly and professional tone. The company "${businessName}" has this challenge: "${problemDescription}". They've answered these questions: ${questionsAndAnswers}.\n\nProvide clear, insightful, and actionable advice in English. Use simple, professional language. Structure your response with emojis for visual appeal and clarity, like this:\n\n🎯 **Main Goal:** [A simple, one-sentence objective]\n\n🔍 **Key Insight:** [A brief, professional analysis of the situation]\n\n🚀 **Action Steps:**\n- **Step 1:** [Simple, direct action]\n- **Step 2:** [Another simple action]\n- **Step 3:** [And another one]\n\n💡 **Strategic Tip:** [A helpful, expert hint]\n\nMaintain a professional yet supportive tone.`,
    es: (businessName: string, problemDescription: string, questionsAndAnswers: string) => `Eres un consultor de negocios experto con un tono amigable y profesional. La empresa "${businessName}" tiene este desafío: "${problemDescription}". Han respondido a estas preguntas: ${questionsAndAnswers}.\n\nProporciona un consejo claro, perspicaz y accionable en Español. Usa un lenguaje simple y profesional. Estructura tu respuesta con emojis para que sea visualmente atractiva y clara, así:\n\n🎯 **Objetivo Principal:** [Un objetivo simple en una oración]\n\n🔍 **Análisis Clave:** [Un breve análisis profesional de la situación]\n\n🚀 **Pasos a Seguir:**\n- **Paso 1:** [Acción simple y directa]\n- **Paso 2:** [Otra acción simple]\n- **Paso 3:** [Y una más]\n\n💡 **Consejo Estratégico:** [Una sugerencia útil y experta]\n\nMantén un tono profesional pero de apoyo.`,
  },
  generateFollowUp: {
    en: (context: string, userQuestion: string) => `You are a friendly and professional business consultant. Based on the entire consultation history provided below, please answer the user's follow-up question.\n\n--- CONSULTATION HISTORY ---\n${context}\n\n--- USER'S NEW QUESTION ---\n${userQuestion}\n\nAnswer in a clear, professional, and supportive manner. Use simple language.`,
    es: (context: string, userQuestion:string) => `Eres un consultor de negocios amigable y profesional. Basado en todo el historial de la consulta que se proporciona a continuación, responde la pregunta de seguimiento del usuario.\n\n--- HISTORIAL DE LA CONSULTA ---\n${context}\n\n--- NUEVA PREGUNTA DEL USUARIO ---\n${userQuestion}\n\nResponde de manera clara, profesional y de apoyo. Usa un lenguaje sencillo.`,
  },
  generateSummary: {
    en: (context: string) => `You are an expert business consultant creating a final, professional summary of a client consultation. Synthesize the entire consultation history provided below into a comprehensive report.\n\n--- FULL CONSULTATION HISTORY ---\n${context}\n\n--- INSTRUCTIONS ---\nGenerate a clean, well-structured summary document. Use clear headings (e.g., "**Initial Problem:**", "**Key Findings:**", "**Strategic Recommendations:**", "**Follow-up Discussion Highlights:**"). The summary should be easy to read and serve as a final, actionable takeaway for the user. Your tone should be authoritative yet supportive.`,
    es: (context: string) => `Eres un consultor de negocios experto que está creando un resumen final y profesional de una consulta con un cliente. Sintetiza todo el historial de la consulta proporcionado a continuación en un informe completo.\n\n--- HISTORIAL COMPLETO DE LA CONSULTA ---\n${context}\n\n--- INSTRUCCIONES ---\nGenera un documento de resumen limpio y bien estructurado. Usa encabezados claros (p. ej., "**Problema Inicial:**", "**Hallazgos Clave:**", "**Recomendaciones Estratégicas:**", "**Puntos Destacados de la Discusión:**"). El resumen debe ser fácil de leer y servir como un documento final y accionable para el usuario. Tu tono debe ser autoritario pero de apoyo.`,
  }
};


export const generateQuestions = async (problemDescription: string, businessName: string, language: Language): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompts.generateQuestions[language](businessName, problemDescription),
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });
    
    const jsonText = (response.text || '[]').trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error generating questions:", error);
    throw new Error("Failed to generate questions from AI.");
  }
};

export const generateAdvice = async (
  businessName: string,
  problemDescription: string,
  questions: string[],
  answers: string[],
  language: Language
): Promise<string> => {
    const questionsAndAnswers = questions.map((q, i) => `Q: ${q}\nA: ${answers[i] || 'No answer provided.'}`).join('\n\n');
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompts.generateAdvice[language](businessName, problemDescription, questionsAndAnswers)
        });
        return response.text || '';
    } catch (error) {
        console.error("Error generating advice:", error);
        throw new Error("Failed to generate advice from AI.");
    }
};

export const generateFollowUp = async (
    context: string,
    userQuestion: string,
    language: Language
): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompts.generateFollowUp[language](context, userQuestion)
        });
        return response.text || '';
    } catch (error) {
        console.error("Error generating follow-up:", error);
        throw new Error("Failed to get a follow-up response from AI.");
    }
};

export const generateSummary = async (
    context: string,
    language: Language
): Promise<string> => {
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompts.generateSummary[language](context)
        });
        return response.text || '';
    } catch (error) {
        console.error("Error generating summary:", error);
        throw new Error("Failed to generate summary from AI.");
    }
};