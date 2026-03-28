import a1Content from './a1-content.json';
import a2Content from './a2-content.json';
import b1Content from './b1-content.json';
import b2Content from './b2-content.json';
import c1Content from './c1-content.json';
import c2Content from './c2-content.json';
import curriculumData from './curriculum.json';
import courseMeta from './course-meta.json';

export interface ContentSection {
  title: string;
  content: string;
}

export interface LevelContent {
  level: string;
  title: string;
  overview: string;
  grammar: ContentSection[];
  vocabulary: ContentSection[];
  reading: ContentSection[];
  communication: ContentSection[];
  exercises: ContentSection[];
  answerKey: string;
}

export interface DayPlan {
  day: number;
  level: string;
  levelDescription: string;
  phase: string;
  title: string;
  grammarTopics: number[];
  vocabTopics: number[];
  readingTexts: number[];
  dialogues: number[];
  exercises: number[];
  isReview: boolean;
}

export interface LevelMeta {
  id: string;
  name: string;
  days: string;
  dayStart: number;
  dayEnd: number;
  color: string;
}

export interface CourseMeta {
  levels: LevelMeta[];
  totalDays: number;
}

const levels: Record<string, LevelContent> = {
  A1: a1Content as LevelContent,
  A2: a2Content as LevelContent,
  B1: b1Content as LevelContent,
  B2: b2Content as LevelContent,
  C1: c1Content as LevelContent,
  C2: c2Content as LevelContent,
};

export const curriculum = curriculumData as DayPlan[];
export const course = courseMeta as CourseMeta;

export function getLevelContent(level: string): LevelContent | undefined {
  return levels[level.toUpperCase()];
}

export function getDayPlan(day: number): DayPlan | undefined {
  return curriculum.find((d) => d.day === day);
}

export function getDayContent(day: number) {
  const plan = getDayPlan(day);
  if (!plan) return null;

  const level = getLevelContent(plan.level);
  if (!level) return null;

  return {
    plan,
    grammar: plan.grammarTopics.map((i) => level.grammar[i]).filter(Boolean),
    vocabulary: plan.vocabTopics.map((i) => level.vocabulary[i]).filter(Boolean),
    reading: plan.readingTexts.map((i) => level.reading[i]).filter(Boolean),
    dialogues: plan.dialogues.map((i) => level.communication[i]).filter(Boolean),
    exercises: plan.exercises.map((i) => level.exercises[i]).filter(Boolean),
    answerKey: level.answerKey,
    /** All exercises in the level (needed for answer key resolution across days) */
    allLevelExercises: level.exercises,
  };
}

export function getAllLevels(): LevelMeta[] {
  return course.levels;
}

export { levels };
