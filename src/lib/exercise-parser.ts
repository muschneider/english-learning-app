/**
 * Parses exercise markdown content into structured interactive exercise data.
 *
 * Handles these markdown patterns from the curriculum:
 * - Fill-in-blank: "1. I _______ a student."
 * - Multiple-choice (lettered): "1. She _______ to school.\n   a) go  b) goes  c) going"
 * - Multiple-choice (inline): "1. She is _______ engineer. (a / an / the)"
 * - Transformation: "1. book → _______"
 * - Free-text: "1. Eu tenho 25 anos." (translation, sentence building, rewriting)
 */

import type {
  ExerciseQuestion,
  ExerciseType,
  ParsedExercise,
} from './exercise-types';

const BLANK_PATTERN = /_{3,}/g;
const NUMBERED_LINE = /^(\d+)\.\s+(.+)/;
const MC_LETTERED = /^\s+([a-d])\)\s+/;
const MC_INLINE_OPTIONS = /\(([^)]+\/[^)]+)\)\s*$/;
const TRANSFORMATION_ARROW = /→\s*_{3,}/;
const VERB_HINT = /\(([^)]*(?:not|verb|[a-z]+ing|[a-z]+ed|[a-z]+ \/ [a-z]+)[^)]*)\)/i;
const GABARITO_MARKER = /^#+ GABARITO/m;

/**
 * Parse an exercise's markdown content into a structured ParsedExercise.
 */
export function parseExercise(
  title: string,
  content: string
): ParsedExercise {
  // Strip embedded answer key if present (A1 last exercise pattern)
  const cleanContent = stripAnswerKey(content);

  // Extract instruction from title
  const instruction = extractInstruction(title);

  // Split into lines and group by question number
  const lines = cleanContent.split('\n');
  const questions: ExerciseQuestion[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    const match = line.match(NUMBERED_LINE);

    if (match) {
      const num = parseInt(match[1], 10);
      const text = match[2].trim();

      // Check if next lines contain lettered MC options
      const mcOptions: string[] = [];
      let j = i + 1;
      while (j < lines.length && MC_LETTERED.test(lines[j])) {
        // Parse "a) go  b) goes  c) going" format — could be on one line or multiple
        const optLine = lines[j].trim();
        const opts = parseMultipleOptionsFromLine(optLine);
        mcOptions.push(...opts);
        j++;
      }

      // Also check if options are on the same line as a) ... b) ... c) ...
      if (mcOptions.length === 0) {
        const sameLineOpts = parseSameLineOptions(text);
        if (sameLineOpts.length > 0) {
          mcOptions.push(...sameLineOpts);
        }
      }

      const question = classifyQuestion(num, text, lines[i], mcOptions);
      questions.push(question);
      i = j; // Skip over consumed MC option lines
    } else {
      i++;
    }
  }

  return {
    title,
    instruction,
    questions,
    hasQuestions: questions.length > 0,
    rawContent: cleanContent,
  };
}

/**
 * Strip the embedded GABARITO answer key from content (A1 pattern).
 */
function stripAnswerKey(content: string): string {
  const match = content.match(GABARITO_MARKER);
  if (match && match.index !== undefined) {
    return content.substring(0, match.index).trim();
  }
  return content.trim();
}

/**
 * Extract a human-readable instruction from the exercise title.
 */
function extractInstruction(title: string): string {
  // Remove "Exercício N:" or "Exercise N:" prefix
  const cleaned = title.replace(/^(Exerc[ií]cio|Exercise)\s+\d+\s*[:—–-]?\s*/i, '').trim();
  return cleaned || title;
}

/**
 * Parse lettered options from a line like "   a) go  b) goes  c) going"
 */
function parseMultipleOptionsFromLine(line: string): string[] {
  const opts: string[] = [];
  const regex = /([a-d])\)\s*([^a-d)]+?)(?=\s+[a-d]\)|$)/g;
  let m;
  while ((m = regex.exec(line)) !== null) {
    opts.push(m[2].trim());
  }
  return opts;
}

/**
 * Try to parse same-line MC options from text like:
 * "She _______ to school every day.\n   a) go  b) goes  c) going"
 * When options appear on the numbered line itself after the question.
 */
function parseSameLineOptions(text: string): string[] {
  // Check for inline parenthetical options: (a / an / the)
  const inlineMatch = text.match(MC_INLINE_OPTIONS);
  if (inlineMatch) {
    return inlineMatch[1].split('/').map((o) => o.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Classify a numbered question line into an exercise type and build the question object.
 */
function classifyQuestion(
  num: number,
  text: string,
  rawLine: string,
  mcOptions: string[]
): ExerciseQuestion {
  // Extract parenthetical hint (verb conjugation hints)
  let hint: string | undefined;
  const hintMatch = text.match(VERB_HINT);
  if (hintMatch) {
    hint = hintMatch[1];
  }

  // Count blanks
  const blanks = text.match(BLANK_PATTERN);
  const blankCount = blanks ? blanks.length : 0;

  // Determine type
  let type: ExerciseType;
  let options: string[] | undefined;
  let prompt = text;

  if (mcOptions.length >= 2) {
    // Lettered multiple choice (a, b, c)
    type = 'multiple-choice';
    options = mcOptions;
  } else {
    // Check for inline options in parentheses
    const inlineMatch = text.match(MC_INLINE_OPTIONS);
    if (inlineMatch && blankCount > 0) {
      type = 'multiple-choice';
      options = inlineMatch[1].split('/').map((o) => o.trim()).filter(Boolean);
      // Remove the inline options from prompt
      prompt = text.replace(MC_INLINE_OPTIONS, '').trim();
    } else if (TRANSFORMATION_ARROW.test(text)) {
      type = 'transformation';
    } else if (blankCount > 0) {
      type = 'fill-blank';
    } else {
      type = 'free-text';
    }
  }

  return {
    number: num,
    rawText: rawLine.trim(),
    type,
    prompt,
    options,
    blankCount: Math.max(blankCount, type === 'transformation' ? 1 : 0),
    hint,
  };
}

/**
 * Check if exercise content looks like it only contains answers (A2/B1/C1 pattern).
 * Answer-only exercises have numbered lines with short answers, no blanks, no instructions.
 */
export function isAnswerOnlyExercise(content: string): boolean {
  const lines = content.trim().split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return false;

  let numberedLines = 0;
  let hasBlank = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.match(NUMBERED_LINE)) {
      numberedLines++;
      if (BLANK_PATTERN.test(trimmed)) {
        hasBlank = true;
      }
    }
  }

  // If all substantive lines are numbered and none have blanks,
  // and the average line length is short, it's likely answer-only
  if (numberedLines > 0 && !hasBlank) {
    const avgLen =
      lines.reduce((sum, l) => sum + l.trim().length, 0) / lines.length;
    // Answer-only exercises tend to have very short lines
    if (avgLen < 80) return true;
  }

  return false;
}
