export enum UserRole {
  CANDIDATE = 'CANDIDATE',
  ADMIN = 'ADMIN'
}

export enum CandidateStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  IN_REVIEW = 'IN_REVIEW',
  PASSED = 'PASSED',
  REJECTED = 'REJECTED'
}

export interface Question {
  id: string;
  text: string;
  videoUrl?: string; // URL to avatar video asking the question
  prepTimeSeconds: number;
  maxAnswerTimeSeconds: number;
}

export interface InterviewFlow {
  id: string;
  title: string;
  jobRole: string;
  questions: Question[];
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  roleApplied: string;
  status: CandidateStatus;
  appliedDate: string;
  score?: number;
}

export interface Recording {
  questionId: string;
  videoBlob: Blob | null;
  videoUrl: string | null;
}
