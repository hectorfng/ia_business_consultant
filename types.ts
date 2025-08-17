export enum Step {
  PROBLEM_DESCRIPTION,
  KEY_QUESTIONS,
  FINAL_ADVICE,
  CONSULTATION_SUMMARY,
}

export type Language = 'es' | 'en';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
