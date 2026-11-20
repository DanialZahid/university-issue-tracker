import 'server-only';
import { detectCategory } from '@/automation/category-detection';
import { hasEmergency } from '@/automation/emergency';
import { detectLocation } from '@/automation/location-detection';
import {
  detectPriority,
  type PriorityLevel,
} from '@/automation/priority-detection';
import { detectRoom } from '@/automation/room-detection';
import { classifyComplaint } from './classify';
import { isAiEnabled } from './gemini';

const NO_PLACE = 'No specific place';
const place = (l: string | null) => (l === NO_PLACE ? null : l);

export type Analysis = {
  category: string;
  priority: PriorityLevel;
  location: string | null;
  room: string | null;
  summary: string | null;
  // 'ai' when the model's answer was used, 'rules' when it was not
  // (AI off, failed, or an emergency phrase decided).
  source: 'ai' | 'rules';
};

// The same combination the evaluation measured: the AI decides category and
// priority, the rules keep a named place or room, and an emergency phrase
// always means Safety and Critical. Any AI failure falls back to the rules.
export async function analyzeComplaint(input: {
  title: string;
  description: string;
  locations: string[];
  timeoutMs?: number;
}): Promise<Analysis> {
  const { title, description, locations } = input;
  const ruleCategory = detectCategory(title, description).category;
  const rules: Analysis = {
    category: ruleCategory,
    priority: detectPriority(title, description, ruleCategory),
    location: place(detectLocation(title, description, locations)),
    room: detectRoom(title, description),
    summary: null,
    source: 'rules',
  };
  if (!isAiEnabled()) return rules;

  try {
    const ai = await classifyComplaint({
      title,
      description,
      locations,
      timeoutMs: input.timeoutMs ?? 8_000,
    });
    const location = rules.location ?? place(ai.location);
    const room = rules.room ?? ai.room;
    const summary = ai.summary || null;
    if (hasEmergency(`${title} ${description}`)) {
      return { ...rules, location, room, summary };
    }
    return {
      category: ai.category,
      priority: ai.priority,
      location,
      room,
      summary,
      source: 'ai',
    };
  } catch {
    return rules;
  }
}
