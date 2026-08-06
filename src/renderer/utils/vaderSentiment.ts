import vader from 'vader-sentiment';

export type SentimentMood = 'excited' | 'calm' | 'dramatic' | 'playful' | 'neutral';

export interface SentimentAnalysisResult {
  compound: number;
  pos: number;
  neg: number;
  neu: number;
  mood: SentimentMood;
}

/**
 * Analyzes sentence sentiment using the official VADER sentiment intensity analyzer.
 * Maps compound scores and positive/negative intensity to dynamic animation moods.
 */
export function analyzeSentenceSentiment(text: string): SentimentAnalysisResult {
  if (!text || !text.trim()) {
    return {
      compound: 0,
      pos: 0,
      neg: 0,
      neu: 1,
      mood: 'neutral',
    };
  }

  const scores = vader.SentimentIntensityAnalyzer.polarity_scores(text);
  const compound = scores.compound;

  let mood: SentimentMood = 'neutral';

  if (compound >= 0.45) {
    mood = 'excited';
  } else if (compound >= 0.1) {
    if (text.includes('!') || text.toLowerCase().includes('fun') || text.toLowerCase().includes('magic')) {
      mood = 'playful';
    } else {
      mood = 'calm';
    }
  } else if (compound <= -0.1) {
    mood = 'dramatic';
  } else {
    mood = 'neutral';
  }

  return {
    compound: scores.compound,
    pos: scores.pos,
    neg: scores.neg,
    neu: scores.neu,
    mood,
  };
}
