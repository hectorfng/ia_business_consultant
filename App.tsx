import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Step, Language, ChatMessage } from './types';
import { generateQuestions, generateAdvice, generateFollowUp, generateSummary } from './services/geminiService';
import { RocketIcon, BotIcon, ArrowRightIcon, ArrowLeftIcon, ClipboardIcon, CheckIcon } from './components/Icons';

// --- Localization ---
const translations = {
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

type Translations = typeof translations.es;

// --- Helper Components ---

const Loader = ({ step, isSummarizing, t }: { step: Step; isSummarizing: boolean; t: Translations }) => {
  const messages: Record<string, string> = t.loader;
  let message = messages[step] || t.loader.processing;
  if (isSummarizing) {
    message = t.loader.generatingSummary;
  }
  
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
      <BotIcon className="w-12 h-12 text-blue-400 animate-spin" />
      <p className="text-lg font-semibold text-gray-300">{message}</p>
      <p className="text-sm text-gray-500">{t.loader.wait}</p>
    </div>
  );
};

const ErrorAlert = ({ message, t }: { message: string; t: Translations }) => (
  <div className="mb-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
    <p className="font-semibold">{t.error.title}</p>
    <p className="text-sm">{message}</p>
  </div>
);

interface Step1FormProps {
  businessName: string;
  setBusinessName: (value: string) => void;
  problemDescription: string;
  setProblemDescription: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  t: Translations;
}

const Step1Form: React.FC<Step1FormProps> = ({ businessName, setBusinessName, problemDescription, setProblemDescription, onSubmit, t }) => (
  <form onSubmit={onSubmit} className="space-y-6 animate-fade-in">
    <div>
      <label htmlFor="businessName" className="block text-sm font-medium text-gray-300 mb-1">
        {t.step1.companyName}
      </label>
      <input
        type="text"
        id="businessName"
        className="block w-full px-4 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500 transition"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        placeholder={t.step1.companyPlaceholder}
        required
      />
    </div>
    <div>
      <label htmlFor="problemDescription" className="block text-sm font-medium text-gray-300 mb-1">
        {t.step1.problemDescription}
      </label>
      <textarea
        id="problemDescription"
        rows={5}
        className="block w-full px-4 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500 transition"
        value={problemDescription}
        onChange={(e) => setProblemDescription(e.target.value)}
        placeholder={t.step1.problemPlaceholder}
        required
      />
    </div>
    <button
      type="submit"
      className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg shadow-lg text-lg font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
    >
      {t.step1.button} <ArrowRightIcon className="w-5 h-5" />
    </button>
  </form>
);

interface Step2FormProps {
    questions: string[];
    answers: string[];
    handleAnswerChange: (index: number, value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onBack: () => void;
    t: Translations;
}
const Step2Form: React.FC<Step2FormProps> = ({ questions, answers, handleAnswerChange, onSubmit, onBack, t }) => (
    <form onSubmit={onSubmit} className="space-y-6 animate-fade-in">
        {questions.map((question, index) => (
            <div key={index}>
                <label htmlFor={`question-${index}`} className="block text-sm font-medium text-gray-300 mb-1">
                    {index + 1}. {question}
                </label>
                <textarea
                    id={`question-${index}`}
                    rows={2}
                    className="block w-full px-4 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500 transition"
                    value={answers[index]}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder={t.step2.answerPlaceholder}
                    required
                />
            </div>
        ))}
        <div className="flex gap-4">
            <button
                type="button"
                onClick={onBack}
                className="w-1/3 flex justify-center items-center gap-2 py-3 px-4 rounded-lg shadow-lg text-lg font-bold text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-4 focus:ring-gray-400/50 transition-all duration-300"
            >
                <ArrowLeftIcon className="w-5 h-5" /> {t.backButton}
            </button>
            <button
                type="submit"
                className="w-2/3 flex justify-center items-center gap-2 py-3 px-4 rounded-lg shadow-lg text-lg font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
            >
                {t.step2.button} <ArrowRightIcon className="w-5 h-5" />
            </button>
        </div>
    </form>
);

interface ConsultationViewProps {
    chatHistory: ChatMessage[];
    onBack: () => void;
    onEndConsultation: () => void;
    onSendFollowUp: (e: React.FormEvent) => void;
    followUpPrompt: string;
    setFollowUpPrompt: (value: string) => void;
    isCopied: boolean;
    onCopy: (textToCopy: string) => void;
    t: Translations;
    isLoading: boolean;
}
const ConsultationView: React.FC<ConsultationViewProps> = ({
    chatHistory, onBack, onEndConsultation, onSendFollowUp,
    followUpPrompt, setFollowUpPrompt, isCopied, onCopy, t, isLoading
}) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);
    
    return (
        <div className="animate-fade-in">
            <div ref={chatContainerRef} className="relative p-4 bg-gray-700/50 border border-gray-600 rounded-lg shadow-inner max-h-96 overflow-y-auto space-y-4">
                <div className="flex justify-between items-center sticky top-0 bg-gray-700/80 backdrop-blur-sm z-10 py-2 -mx-4 px-4 border-b border-gray-600/50">
                    <h2 className="text-xl font-bold text-white">{t.advice.title}</h2>
                    <button onClick={() => onCopy(chatHistory.map(m => `${m.role === 'user' ? 'User' : 'Consultant'}:\n${m.content}`).join('\n\n'))} className="flex items-center gap-2 text-sm bg-gray-600/50 hover:bg-gray-500/50 text-gray-300 px-3 py-1 rounded-md transition">
                        {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
                        {isCopied ? t.advice.copied : t.advice.copy}
                    </button>
                </div>
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-lg shadow ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-200'}`}>
                            <div className="prose prose-invert max-w-none text-gray-200 leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-[85%] p-3 rounded-lg bg-gray-600 text-gray-200 flex items-center gap-2">
                             <BotIcon className="w-5 h-5 animate-spin" />
                             <span>Thinking...</span>
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={onSendFollowUp} className="mt-6 space-y-3">
                <label htmlFor="followUp" className="block text-sm font-medium text-gray-300 mb-1">{t.advice.followUpLabel}</label>
                <textarea
                    id="followUp"
                    rows={2}
                    className="block w-full px-4 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500 transition"
                    value={followUpPrompt}
                    onChange={(e) => setFollowUpPrompt(e.target.value)}
                    placeholder={t.advice.followUpPlaceholder}
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !followUpPrompt.trim()}
                    className="w-full flex justify-center items-center gap-2 py-2 px-4 rounded-lg shadow-lg font-semibold text-white bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-green-300/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
                >
                    {t.advice.sendButton}
                </button>
            </form>

            <div className="flex gap-4 mt-6">
                <button
                    onClick={onBack}
                    className="w-1/3 flex justify-center items-center gap-2 py-3 px-4 rounded-lg shadow-lg text-lg font-bold text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-4 focus:ring-gray-400/50 transition-all duration-300"
                >
                    <ArrowLeftIcon className="w-5 h-5" /> {t.backButton}
                </button>
                <button
                    onClick={onEndConsultation}
                    className="w-2/3 flex justify-center items-center py-3 px-4 rounded-lg shadow-lg text-lg font-bold text-white bg-red-700 hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-400/50 transition-all duration-300"
                >
                    {t.advice.endConsultation}
                </button>
            </div>
        </div>
    );
};

interface SummaryViewProps {
    summary: string;
    onRestart: () => void;
    isCopied: boolean;
    onCopy: (textToCopy: string) => void;
    t: Translations;
}

const SummaryView: React.FC<SummaryViewProps> = ({ summary, onRestart, isCopied, onCopy, t }) => (
     <div className="animate-fade-in">
        <div className="relative p-6 bg-gray-700/50 border border-gray-600 rounded-lg shadow-inner">
            <button onClick={() => onCopy(summary)} className="absolute top-3 right-3 flex items-center gap-2 text-sm bg-gray-600/50 hover:bg-gray-500/50 text-gray-300 px-3 py-1 rounded-md transition">
                {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
                {isCopied ? t.advice.copied : t.summary.copy}
            </button>
            <h2 className="text-xl font-bold text-white mb-4">{t.summary.title}</h2>
            <div className="prose prose-invert max-w-none text-gray-200 leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: summary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }}>
            </div>
        </div>
        <button
            onClick={onRestart}
            className="mt-6 w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-lg text-lg font-bold text-white bg-blue-700 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all duration-300"
        >
            {t.advice.restart}
        </button>
    </div>
);


// --- Main App Component ---

const App = () => {
  const [language, setLanguage] = useState<Language>('es');
  const [businessName, setBusinessName] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [summary, setSummary] = useState('');
  const [followUpPrompt, setFollowUpPrompt] = useState('');
  const [currentStep, setCurrentStep] = useState<Step>(Step.PROBLEM_DESCRIPTION);
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const t = translations[language];

  const buildContextString = useCallback(() => {
    const qaSection = questions.map((q, i) => `Q: ${q}\nA: ${answers[i] || 'No answer provided.'}`).join('\n');
    const chatSection = chatHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Consultant'}:\n${msg.content}`).join('\n\n');
    return `
Initial Problem for ${businessName}: ${problemDescription}

Key Questions & Answers:
${qaSection}

Consultation Discussion:
${chatSection}
    `.trim();
  }, [businessName, problemDescription, questions, answers, chatHistory]);

  const handleGenerateQuestions = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const generatedQs = await generateQuestions(problemDescription, businessName, language);
      setQuestions(generatedQs);
      setAnswers(Array(generatedQs.length).fill(''));
      setCurrentStep(Step.KEY_QUESTIONS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [problemDescription, businessName, language]);
  
  const handleGenerateAdvice = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const finalAdvice = await generateAdvice(businessName, problemDescription, questions, answers, language);
      setChatHistory([{ role: 'model', content: finalAdvice }]);
      setCurrentStep(Step.FINAL_ADVICE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [businessName, problemDescription, questions, answers, language]);

  const handleSendFollowUp = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!followUpPrompt.trim()) return;
    
    const newUserMessage: ChatMessage = { role: 'user', content: followUpPrompt };
    const currentChatHistory = [...chatHistory, newUserMessage];
    setChatHistory(currentChatHistory);
    setFollowUpPrompt('');
    setIsLoading(true);
    setError(null);
    
    try {
      const context = buildContextString();
      const response = await generateFollowUp(context, followUpPrompt, language);
      setChatHistory([...currentChatHistory, { role: 'model', content: response }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setChatHistory(chatHistory); // Revert on error
    } finally {
      setIsLoading(false);
    }
  }, [chatHistory, followUpPrompt, language, buildContextString]);

  const handleEndConsultation = useCallback(async () => {
    setIsLoading(true);
    setIsSummarizing(true);
    setError(null);
    try {
      const context = buildContextString();
      const finalSummary = await generateSummary(context, language);
      setSummary(finalSummary);
      setCurrentStep(Step.CONSULTATION_SUMMARY);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setIsSummarizing(false);
    }
  }, [buildContextString, language]);

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleRestart = () => {
    setBusinessName('');
    setProblemDescription('');
    setQuestions([]);
    setAnswers([]);
    setChatHistory([]);
    setSummary('');
    setFollowUpPrompt('');
    setCurrentStep(Step.PROBLEM_DESCRIPTION);
    setError(null);
  };

  const handleGoBack = () => {
    setError(null);
    if (currentStep === Step.KEY_QUESTIONS) {
        setCurrentStep(Step.PROBLEM_DESCRIPTION);
    } else if (currentStep === Step.FINAL_ADVICE) {
        setCurrentStep(Step.KEY_QUESTIONS);
    }
  };

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
    }).catch(err => console.error('Failed to copy text: ', err));
  };
  
  const renderContent = () => {
    if (isLoading && !chatHistory.length) { // Full page loader only for initial steps
      return <Loader step={currentStep} isSummarizing={isSummarizing} t={t} />;
    }
    
    switch (currentStep) {
      case Step.PROBLEM_DESCRIPTION:
        return <Step1Form businessName={businessName} setBusinessName={setBusinessName} problemDescription={problemDescription} setProblemDescription={setProblemDescription} onSubmit={handleGenerateQuestions} t={t} />;
      case Step.KEY_QUESTIONS:
        return <Step2Form questions={questions} answers={answers} handleAnswerChange={handleAnswerChange} onSubmit={handleGenerateAdvice} onBack={handleGoBack} t={t} />;
      case Step.FINAL_ADVICE:
        return <ConsultationView chatHistory={chatHistory} onBack={handleGoBack} onEndConsultation={handleEndConsultation} onSendFollowUp={handleSendFollowUp} followUpPrompt={followUpPrompt} setFollowUpPrompt={setFollowUpPrompt} isCopied={isCopied} onCopy={handleCopy} t={t} isLoading={isLoading} />;
      case Step.CONSULTATION_SUMMARY:
        return <SummaryView summary={summary} onRestart={handleRestart} isCopied={isCopied} onCopy={handleCopy} t={t} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center gap-4 mb-4">
            <button onClick={() => setLanguage('es')} className={`px-4 py-1 rounded-md text-sm transition ${language === 'es' ? 'bg-blue-500 text-white font-semibold' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Español</button>
            <button onClick={() => setLanguage('en')} className={`px-4 py-1 rounded-md text-sm transition ${language === 'en' ? 'bg-blue-500 text-white font-semibold' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>English</button>
        </div>

        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700/50 transition-all duration-500">
            <div className="flex flex-col items-center mb-6 text-center">
                <RocketIcon className="text-blue-400 w-12 h-12 mb-3 animate-bounce-slow" />
                <h1 className="text-4xl font-extrabold text-white">
                    {t.title}
                </h1>
                <p className="text-gray-400 mt-2 max-w-md">
                    {t.header[currentStep]}
                </p>
            </div>
            
            {error && <ErrorAlert message={error} t={t} />}

            <div className="mt-8">
                {renderContent()}
            </div>

            <div className="mt-10 text-center text-gray-500 text-xs">
                <p>{t.createdBy}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;
