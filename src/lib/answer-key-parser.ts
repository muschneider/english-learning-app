/**
 * Parses answer keys from various formats found in the curriculum data.
 *
 * Three answer key sources:
 * 1. A1: Embedded in the last exercise's content under "# GABARITO COMPLETO"
 * 2. B2/C2: In the top-level `answerKey` field of the level content
 * 3. A2/B1/C1: Exercises array contains only answers (the exercises ARE the answers)
 */

import type { AnswerEntry } from './exercise-types';

const NUMBERED_ANSWER = /^(\d+)\.\s+(.+)/;
const GABARITO_SECTION = /##\s*Gabarito\s*[—–-]\s*Exerc[ií]cio\s+(\d+)/i;

/**
 * Extract the exercise number from its title.
 * E.g., "Exercício 8: Reescreva..." → 8
 *       "Exercise 3: Cleft Sentences" → 3
 * Returns null if no number found.
 */
export function extractExerciseNumber(title: string): number | null {
  const match = title.match(/(?:Exerc[ií]cio|Exercise)\s+(\d+)/i);
  if (match) return parseInt(match[1], 10);
  return null;
}

/**
 * Parse the A1-style embedded answer key (GABARITO COMPLETO in the last exercise content).
 * Returns a map of exerciseNumber (1-based) → questionNumber → AnswerEntry.
 */
export function parseEmbeddedAnswerKey(
  content: string
): Map<number, Map<number, AnswerEntry>> {
  const result = new Map<number, Map<number, AnswerEntry>>();

  const gabaritoIdx = content.indexOf('GABARITO COMPLETO');
  if (gabaritoIdx === -1) return result;

  const gabaritoText = content.substring(gabaritoIdx);
  const sections = gabaritoText.split(/(?=##\s*Gabarito)/);

  for (const section of sections) {
    const headerMatch = section.match(GABARITO_SECTION);
    if (!headerMatch) continue;

    const exerciseNum = parseInt(headerMatch[1], 10);
    const answers = parseAnswerLines(section);
    if (answers.size > 0) {
      result.set(exerciseNum, answers);
    }
  }

  return result;
}

/**
 * Parse the B2/C2-style answerKey field (structured by exercise sections).
 * Handles multiple formats:
 *   - "## Exercise N: ..." (C2 style)
 *   - "**Exercício N — ..." bold headers with continuous numbering (B2 style)
 *   - "### Respostas — ..." section headers
 * Returns a map of exerciseNumber (1-based) → questionNumber → AnswerEntry.
 */
export function parseFieldAnswerKey(
  answerKeyText: string
): Map<number, Map<number, AnswerEntry>> {
  const result = new Map<number, Map<number, AnswerEntry>>();
  if (!answerKeyText.trim()) return result;

  // Strategy A: Try splitting by ## Exercise N headers (C2 style)
  const hashSections = answerKeyText.split(/(?=##\s*(?:Exercise|Exerc[ií]cio)\s+\d+)/i);
  let foundHashSections = false;
  for (const section of hashSections) {
    const exMatch = section.match(/##\s*(?:Exercise|Exerc[ií]cio)\s*(\d+)/i);
    if (exMatch) {
      foundHashSections = true;
      const exNum = parseInt(exMatch[1], 10);
      const answers = parseAnswerLines(section);
      if (answers.size > 0) {
        result.set(exNum, answers);
      }
    }
  }
  if (foundHashSections) return result;

  // Strategy B: Try splitting by bold **Exercício N** headers (B2 style)
  // B2 uses continuous numbering across exercises (e.g., Ex2 starts at Q6).
  // Keep original question numbers since they match the exercise content numbering.
  const boldSections = answerKeyText.split(/(?=\*\*Exerc[ií]cio\s+\d+)/i);
  for (const section of boldSections) {
    const exMatch = section.match(/\*\*Exerc[ií]cio\s+(\d+)/i);
    if (exMatch) {
      const exNum = parseInt(exMatch[1], 10);
      const answers = parseAnswerLines(section);
      if (answers.size > 0) {
        result.set(exNum, answers);
      }
    }
  }
  if (result.size > 0) return result;

  // Strategy C: Fallback — treat entire text as one block
  const answers = parseAnswerLines(answerKeyText);
  if (answers.size > 0) {
    result.set(1, answers);
  }

  return result;
}

/**
 * Parse answer-only exercise content (A2/B1/C1 pattern).
 * The exercises array itself contains only answers, not questions.
 * Returns a map of questionNumber → AnswerEntry.
 */
export function parseAnswerOnlyContent(
  content: string
): Map<number, AnswerEntry> {
  return parseAnswerLines(content);
}

/**
 * Parse numbered answer lines from a text block.
 * Handles formats like:
 * - "1. am"
 * - "1. Do / do"  (multiple blanks)
 * - "1. She is not (isn't) a teacher." (alternative forms)
 * - "1. b) goes"  (MC answers)
 * - "1. If she **had studied** law..." (bold answers in text)
 */
function parseAnswerLines(text: string): Map<number, AnswerEntry> {
  const answers = new Map<number, AnswerEntry>();
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip headers and non-answer lines
    if (trimmed.startsWith('**Q') || trimmed.startsWith('##') || trimmed.startsWith('###')) continue;
    if (trimmed.startsWith('**Exerc') || trimmed.startsWith('**Exercise')) continue;

    const match = trimmed.match(NUMBERED_ANSWER);
    if (!match) continue;

    const num = parseInt(match[1], 10);
    let answerText = match[2].trim();

    // Remove trailing markdown separators
    answerText = answerText.replace(/\s*---\s*$/, '').trim();
    if (!answerText) continue;

    // Extract bold answers from text like "If she **had studied** law, she **would be** a lawyer."
    // For these, extract the bold parts as the answer
    const boldParts = answerText.match(/\*\*([^*]+)\*\*/g);
    if (boldParts && boldParts.length > 0) {
      const boldAnswers = boldParts.map((b) => b.replace(/\*\*/g, '').trim());
      const entry: AnswerEntry = {
        acceptedAnswers: boldAnswers.map((a) => extractAlternatives(a)),
        displayAnswer: boldAnswers.join(' / '),
      };
      answers.set(num, entry);
      continue;
    }

    const entry = parseAnswerText(answerText);
    answers.set(num, entry);
  }

  return answers;
}

/**
 * Parse a single answer text into an AnswerEntry with accepted alternatives.
 */
function parseAnswerText(text: string): AnswerEntry {
  const displayAnswer = text;

  // Check for MC letter answer: "b) goes"
  const mcMatch = text.match(/^[a-d]\)\s*(.+)/);
  if (mcMatch) {
    return {
      acceptedAnswers: [[mcMatch[1].trim()]],
      displayAnswer,
    };
  }

  // Check for "answer1 / answer2" pattern (could be multi-blank or alternatives)
  if (text.includes(' / ')) {
    const parts = text.split(' / ').map((p) => p.trim());

    // Check for "ou" alternatives: "in (ou at)"
    const ouMatch = text.match(/^(\S+)\s*\(ou\s+(\S+)\)/i);
    if (ouMatch) {
      return {
        acceptedAnswers: [[ouMatch[1], ouMatch[2]]],
        displayAnswer,
      };
    }

    // For ellipsis patterns like "Did ... see" — treat as multi-blank
    if (text.includes('...')) {
      const multiBlanks = text.split(/\s*\.\.\.\s*/).map((p) => p.trim()).filter(Boolean);
      return {
        acceptedAnswers: multiBlanks.map((p) => extractAlternatives(p)),
        displayAnswer,
      };
    }

    // If all parts are short words (< 15 chars), treat as multi-blank
    const allShort = parts.every((p) => p.length < 15);
    if (allShort && parts.length <= 3) {
      return {
        acceptedAnswers: parts.map((p) => extractAlternatives(p)),
        displayAnswer,
      };
    }
  }

  // Check for parenthetical alternatives: "She is not (isn't) a teacher."
  const parenAlts = text.match(/(.+?)\s*\(([^)]+)\)\s*(.*)/);
  if (parenAlts) {
    const before = parenAlts[1].trim();
    const altText = parenAlts[2].trim();
    const after = parenAlts[3].trim();

    // If alt text starts with "ou " or contains alternative form
    if (altText.startsWith('ou ') || altText.startsWith('or ')) {
      const alt = altText.replace(/^(ou|or)\s+/, '').trim();
      return {
        acceptedAnswers: [[before, alt].map((a) => a + (after ? ' ' + after : ''))],
        displayAnswer,
      };
    }

    // Check if it's a contraction alternative like "is not (isn't)"
    if (altText.includes("n't") || altText.includes("'")) {
      const fullForm = before + (after ? ' ' + after : '');
      const contractedForm = before.replace(/\S+$/, '').trim() + ' ' + altText + (after ? ' ' + after : '');
      return {
        acceptedAnswers: [[fullForm.trim(), contractedForm.trim(), altText.trim()]],
        displayAnswer,
      };
    }
  }

  // Simple single answer
  return {
    acceptedAnswers: [[text]],
    displayAnswer,
  };
}

/**
 * Extract alternatives from a single answer part.
 * E.g., "doesn't" → ["doesn't", "does not"]
 */
function extractAlternatives(text: string): string[] {
  const alts = [text];

  if (text.includes("n't")) {
    const expanded = text
      .replace("can't", 'cannot')
      .replace("won't", 'will not')
      .replace("don't", 'do not')
      .replace("doesn't", 'does not')
      .replace("didn't", 'did not')
      .replace("isn't", 'is not')
      .replace("aren't", 'are not')
      .replace("wasn't", 'was not')
      .replace("weren't", 'were not')
      .replace("haven't", 'have not')
      .replace("hasn't", 'has not')
      .replace("hadn't", 'had not')
      .replace("wouldn't", 'would not')
      .replace("couldn't", 'could not')
      .replace("shouldn't", 'should not');
    if (expanded !== text) alts.push(expanded);
  }

  return alts;
}

/**
 * Resolve the correct answers for a specific exercise.
 *
 * Uses the exercise title to identify the exercise number and match
 * against the answer key (embedded GABARITO or answerKey field).
 *
 * @param exerciseTitle - The exercise title, e.g., "Exercício 8: Reescreva..."
 * @param allLevelExercises - All exercises in the level (for finding embedded GABARITO)
 * @param answerKeyField - The level's answerKey field (B2/C2)
 */
export function resolveAnswersForExercise(
  exerciseTitle: string,
  allLevelExercises: { title: string; content: string }[],
  answerKeyField: string
): Map<number, AnswerEntry> | null {
  const exerciseNum = extractExerciseNumber(exerciseTitle);
  if (exerciseNum === null) return null;

  // Strategy 1: Check the answerKey field (B2/C2)
  if (answerKeyField && answerKeyField.trim().length > 0) {
    const allAnswers = parseFieldAnswerKey(answerKeyField);
    return allAnswers.get(exerciseNum) || null;
  }

  // Strategy 2: Check for embedded GABARITO in any exercise across the whole level (A1 pattern)
  for (const ex of allLevelExercises) {
    if (ex.content.includes('GABARITO COMPLETO')) {
      const allAnswers = parseEmbeddedAnswerKey(ex.content);
      return allAnswers.get(exerciseNum) || null;
    }
  }

  // Strategy 3: For answer-only exercises (A2/B1/C1), we can't match answers
  // because the exercise content IS the answers. Return null to signal
  // that this exercise should be rendered as static markdown.
  return null;
}
