// Shared by the evaluation runner (server) and the results view (browser).

export type Level = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TestComplaint = {
  id: string;
  language: 'en' | 'roman-urdu';
  title: string;
  description: string;
  category: string;
  priority: Level;
  location: string | null;
  room: string | null;
};

export type TestPair = {
  id: string;
  set: 'original' | 'meaning';
  a: string;
  roomA: string | null;
  b: string;
  roomB: string | null;
  duplicate: boolean;
};

export type Fields = {
  category: string;
  priority: Level;
  location: string | null;
  room: string | null;
};

export type ComplaintResult = {
  id: string;
  rules: Fields & { categoryScore: number; emergency: boolean };
  ai: (Fields & { language: string; summary: string }) | null;
  aiError: string | null;
  aiMs: number | null;
};

export type PairResult = {
  id: string;
  ruleScore: number;
  embeddingScore: number | null;
  aiError: string | null;
  aiMs: number | null;
};

export type StepOutcome<T> =
  | { status: 'ok'; result: T }
  | { status: 'retry'; waitMs: number; reason: string }
  | { status: 'error'; message: string };
