// src/localization.ts

import { Step } from './types';

// La palabra "export" permite que otros archivos usen este objeto
export const translations = {
  es: {
    title: 'Consultor de Negocios IA',
    header: {
      [Step.PROBLEM_DESCRIPTION]: 'Tu Aliado de IA para Decisiones Estratégicas.',
      [Step.KEY_QUESTIONS]: 'Responde estas preguntas para un consejo preciso.',
      [Step.FINAL_ADVICE]: 'Tu consejo estratégico generado.',
      [Step.CONSULTATION_SUMMARY]: 'Resumen de tu Consulta.',
    },
    loader: {
      [Step.PROBLEM_DESCRIPTION]: 'Analizando tu problema...',
      [Step.KEY_QUESTIONS]: 'Elaborando preguntas clave...',
      [Step.FINAL_ADVICE]: 'Sintetizando tu consejo inicial...',
      processing: 'Procesando...',
      generatingSummary: 'Generando el resumen final...',
      wait: 'Esto puede tomar unos momentos.',
    },
    error: {
      title: 'Ocurrió un error',
    },
    step1: {
      companyName: 'Nombre de tu empresa',
      companyPlaceholder: 'Ej: Soluciones InnovateX',
      problemDescription: 'Describe tu problema o desafío',
      problemPlaceholder: "Ej: 'Nuestra participación de usuarios ha caído un 30% en el último trimestre y no estamos seguros de por qué.'",
      button: 'Generar Preguntas Clave',
    },
    step2: {
      answerPlaceholder: 'Tu respuesta...',
      button: 'Obtener Consejo Inicial',
    },
    advice: {
      title: 'Consulta Estratégica',
      restart: 'Iniciar una Nueva Consulta',
      followUpLabel: '¿Tienes alguna pregunta sobre este consejo?',
      followUpPlaceholder: 'Escribe aquí tu pregunta de seguimiento...',
      sendButton: 'Enviar Pregunta',
      endConsultation: 'Finalizar Consulta',
      copy: 'Copiar Discusión',
      copied: '¡Copiado!',
    },
    summary: {
      title: 'Resumen de la Consulta',
      copy: 'Copiar Resumen',
    },
    backButton: 'Atrás',
    createdBy: 'Creado por Hector Fong',
  },
  en: {
    title: 'AI Business Consultant',
    header: {
      [Step.PROBLEM_DESCRIPTION]: 'Your AI Ally for Strategic Decisions.',
      [Step.KEY_QUESTIONS]: 'Answer these questions for precise advice.',
      [Step.FINAL_ADVICE]: 'Your generated strategic advice.',
      [Step.CONSULTATION_SUMMARY]: 'Your Consultation Summary.',
    },
    loader: {
      [Step.PROBLEM_DESCRIPTION]: 'Analyzing your problem...',
      [Step.KEY_QUESTIONS]: 'Crafting key questions...',
      [Step.FINAL_ADVICE]: 'Synthesizing your initial advice...',
      processing: 'Processing...',
      generatingSummary: 'Generating final summary...',
      wait: 'This may take a few moments.',
    },
    error: {
      title: 'An error occurred',
    },
    step1: {
      companyName: 'Name of your company',
      companyPlaceholder: 'e.g., InnovateX Solutions',
      problemDescription: 'Describe your problem or challenge',
      problemPlaceholder: "e.g., 'Our user engagement has dropped by 30% in the last quarter and we're not sure why.'",
      button: 'Generate Key Questions',
    },
    step2: {
      answerPlaceholder: 'Your answer...',
      button: 'Get Initial Advice',
    },
    advice: {
      title: 'Strategic Consultation',
      restart: 'Start a New Consultation',
      followUpLabel: 'Do you have any questions about this advice?',
      followUpPlaceholder: 'Type your follow-up question here...',
      sendButton: 'Send Question',
      endConsultation: 'End Consultation',
      copy: 'Copy Discussion',
      copied: 'Copied!',
    },
    summary: {
        title: 'Consultation Summary',
        copy: 'Copy Summary',
    },
    backButton: 'Back',
    createdBy: 'Created by Hector Fong',
  },
};
