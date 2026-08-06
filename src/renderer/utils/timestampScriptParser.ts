import { analyzeSentenceSentiment, SentimentMood } from "./vaderSentiment";

export interface VoiceoverSegment {
    time: string;
    timeStampSec: number;
    frame: number;
    sentence: string;
    mood: SentimentMood;
}

export function parseTimestampedScript(scriptText: string, fps: number = 30): VoiceoverSegment[] {
    if (!scriptText || !scriptText.trim()) return [];

    const lines = scriptText.split('\n');
    const segments: VoiceoverSegment[] = [];

    const bracketRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)/;
    const plainRegex = /^(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\s+(.*)/;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let minutes = 0;
        let seconds = 0;
        let milliseconds = 0;
        let text = '';
        let matched = false;

        const bMatch = trimmed.match(bracketRegex);
        if (bMatch) {
            minutes = parseInt(bMatch[1], 10);
            seconds = parseInt(bMatch[2], 10);
            milliseconds = bMatch[3] ? parseInt(bMatch[3].padEnd(3, '0'), 10) : 0;
            text = bMatch[4].trim();
            matched = true;
        } else {
            const pMatch = trimmed.match(plainRegex);
            if (pMatch) {
                minutes = parseInt(pMatch[1], 10);
                seconds = parseInt(pMatch[2], 10);
                milliseconds = pMatch[3] ? parseInt(pMatch[3].padEnd(3, '0'), 10) : 0;
                text = pMatch[4].trim();
                matched = true;
            }
        }

        if (matched && text) {
            const totalSec = minutes * 60 + seconds + milliseconds / 1000;
            const mm = String(minutes).padStart(2, '0');
            const ss = String(seconds).padStart(2, '0');
            const formattedTime = `${mm}:${ss}`;
            const sentiment = analyzeSentenceSentiment(text);

            segments.push({
                time: formattedTime,
                timeStampSec: totalSec,
                frame: Math.round(totalSec * fps),
                sentence: text,
                mood: sentiment.mood,
            });
        }
    }

    if (segments.length === 0) {
        const paragraphs = scriptText.split(/\n+/).filter((p) => p.trim());
        let currentSec = 2;
        for (const paragraph of paragraphs) {
            const text = paragraph.trim();
            const mm = String(Math.floor(currentSec / 60)).padStart(2, '0');
            const ss = String(Math.floor(currentSec % 60)).padStart(2, '0');
            const sentiment = analyzeSentenceSentiment(text);

            segments.push({
                time: `${mm}:${ss}`,
                timeStampSec: currentSec,
                frame: Math.round(currentSec * fps),
                sentence: text,
                mood: sentiment.mood,
            });
            currentSec += 4;
        }
    }

    return segments;
}