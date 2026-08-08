/**
 * Utility to parse and resample an uploaded audio file into the format required by Whisper
 */
export async function extractAudioFeatures(file: File): Promise<Float32Array> {
    const arrayBuffer = await file.arrayBuffer();
    
    // Create an audio context explicitly set to 16kHz (Whisper's required sample rate)
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass({ sampleRate: 16000 });
    
    try {
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Whisper expects a single channel (mono) Float32Array
        const float32Array = audioBuffer.getChannelData(0);
        
        return float32Array;
    } finally {
        if (audioContext.state !== 'closed') {
            await audioContext.close();
        }
    }
}

export interface SubtitleChunk {
    text: string;
    startSec: number;
    endSec: number;
    startFrame: number;
    endFrame: number;
}

/**
 * Smartly groups individual word chunks from Whisper into natural phrases/sentences
 * based on pause duration (silence) and word counts.
 */
export function groupWordChunksIntoPhrases(
    rawChunks: any[],
    fps: number = 30,
    maxWordsPerPhrase: number = 6,
    maxPauseDurationSec: number = 0.4
): SubtitleChunk[] {
    if (!rawChunks || rawChunks.length === 0) return [];

    const result: SubtitleChunk[] = [];
    let currentWords: string[] = [];
    let phraseStartSec = 0;
    let lastWordEndSec = 0;

    for (let i = 0; i < rawChunks.length; i++) {
        const chunk = rawChunks[i];
        const text = (chunk.text || '').trim();
        if (!text) continue;

        const timestamp = chunk.timestamp || [0, 0];
        const startSec = Array.isArray(timestamp) ? timestamp[0] : 0;
        const endSec = Array.isArray(timestamp) ? (timestamp[1] || startSec + 0.4) : startSec + 0.4;

        if (currentWords.length === 0) {
            phraseStartSec = startSec;
        } else {
            const pause = startSec - lastWordEndSec;
            const lastWord = currentWords[currentWords.length - 1];
            const endsWithPunctuation = /[.!?]$/.test(lastWord);

            if (currentWords.length >= maxWordsPerPhrase || pause > maxPauseDurationSec || endsWithPunctuation) {
                result.push({
                    text: currentWords.join(' '),
                    startSec: phraseStartSec,
                    endSec: lastWordEndSec,
                    startFrame: Math.floor(phraseStartSec * fps),
                    endFrame: Math.ceil(lastWordEndSec * fps),
                });
                currentWords = [];
                phraseStartSec = startSec;
            }
        }

        currentWords.push(text);
        lastWordEndSec = endSec;
    }

    if (currentWords.length > 0) {
        result.push({
            text: currentWords.join(' '),
            startSec: phraseStartSec,
            endSec: lastWordEndSec,
            startFrame: Math.floor(phraseStartSec * fps),
            endFrame: Math.ceil(lastWordEndSec * fps),
        });
    }

    return result;
}
