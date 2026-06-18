export class AudioAnalyzer {
    private buffer: AudioBuffer | null = null;
    private channelData: Float32Array | null = null;

    //1. Fetch and Decode the audio
    public async load(url: string) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();

        //use temporary Audio Context just to decode the file
        const ctx = new window.AudioContext();
        this.buffer = await ctx.decodeAudioData(arrayBuffer);

        // grab raw waveform data from left channel
        this.channelData = this.buffer.getChannelData(0);
        console.log("Audio Loaded! Total Samples:", this.channelData.length);
    }

    // Get energy per frame
    public getFrameData(frame: number, fps: number): number {
        if (!this.buffer || !this.channelData) return 0;

        // calculate sample rate
        const sampleRate = this.buffer.sampleRate;
        const samplesPerFrame = Math.floor(sampleRate / fps);

        // find the exact slice of audio array for this frame
        const startIndex = frame * samplesPerFrame;
        const endIndex = Math.min(startIndex + samplesPerFrame, this.channelData.length);

        if (startIndex >= this.channelData.length) return 0;

        //calculate loudness
        let sumSquares = 0;
        for (let i = startIndex; i < endIndex; i++) {
            const amplitude = this.channelData[i];
            sumSquares += amplitude * amplitude;
        }

        //return a normalized value

        const rms = Math.sqrt(sumSquares / (endIndex - startIndex));

        return Math.min(rms * 5, 1);
    }
}