type SpinnerVariant = "ring" | "dots";
type SpinnerSize = "sm" | "md" | "lg" | "xl";

export interface SpinnerProps {
  variant?: SpinnerVariant;
  size?: SpinnerSize;
  color?: string;
  accent?: string;
  modal?: boolean;
  label?: string;
}

export interface IUser {
  userName: string;
  password: string;
}

export interface User {
  id: string;
  role: string;
  email?: string;
  name?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// types.ts

// Equivalent of TestScheduledDTO.java
export interface TestScheduledDTO {
  id: string;
  userId: string;
  testName: string;
  scheduleMock: string;
  maxAttemptsPerDay: number;
  durationSeconds: number;
  isActive: boolean;
  createdAt: string;
}

export interface IOlympicData {
  athlete: string;
  age: number;
  country: string;
  year: number;
  date: string;
  sport: string;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
}

export interface CreateMockFormData {
  testName: string;
  scheduleMock: string; // ISO datetime (e.g. 2025-08-29T14:30:00)
}
export interface FormErrors {
  userId?: string;
  testName?: string;
  scheduleMock?: string;
}

export interface CreateAttemptDto {
  mockName: string;
  userId: string;
  testScheduledId: string;
}

export interface Question {
  questionId: number;
  questionText: string;
  options: string[];
  givenAnswer: string | null;
  isAnswered: boolean;
  timeTakenSeconds: number;
}

export interface ExamState {
  currentQuestionIndex: number;
  questions: Question[];
  selectedAnswer: string | null;
  isLoading: boolean;
  timeSpent: number;
}

export interface SecureExamEnvironmentProps {
  formData: any;
  testData: any;
  onStartExam: () => void;
  onExitSecure: () => void;
  onSecurityViolation: (
    violation: string,
    severity: "warning" | "critical"
  ) => void;
}

export interface SecurityViolation {
  type: string;
  timestamp: Date;
  severity: "warning" | "critical";
  description: string;
}

export interface IQuestionQuery {
  attemptId: string;
  limit: number;
  subject?: string;
  difficultyLevel?: string;
  previousYear?:string;
  exam?:string;
  chapter?:string;
}

export interface UnifiedDto {
  attemptId: string;
  limit?: number;
  previousYear?: number;
  exam?: string;
  difficultyLevel?: string;
  subject?: string;
  chapter?: string;
  source?: string;
}

export interface ExamFormData {
  attemptId: string;
  limit?: number;
  previousYear?: number;
  exam?: string;
  difficultyLevel?: string;
  subject?: string;
  chapter?: string;
  source?: string;
}

export interface TestData {
  id: string;
  testName: string;
  duration?: number;
  instructions?: string;
}