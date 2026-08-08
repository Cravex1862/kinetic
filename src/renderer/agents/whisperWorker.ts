import { pipeline, env } from '@xenova/transformers';

// Skip local model check since we'll fetch from Hugging Face hub
env.allowLocalModels = false;
// Restrict ONNX WASM memory/thread allocation to prevent RAM hogging and high CPU load
if (env.backends?.onnx?.wasm) {
    env.backends.onnx.wasm.numThreads = 2;
}

// We use the singleton pattern to load the models only once
class WhisperPipeline {
    static task = 'automatic-speech-recognition';
    static model = 'Xenova/whisper-base.en';
    static instance: any = null;

    static async getInstance(progress_callback?: any) {
        if (this.instance === null) {
            this.instance = await pipeline(this.task as any, this.model, {
                progress_callback,
                quantized: true, // Force 8-bit quantized ONNX model (~39MB)
            });
        }
        return this.instance;
    }
}

self.onmessage = async (e: MessageEvent) => {
    const { action, audioData } = e.data;

    if (action === 'transcribe') {
        try {
            self.postMessage({ status: 'progress', data: { status: 'init', name: 'Whisper Base' } });

            const transcriber = await WhisperPipeline.getInstance((progress: any) => {
                self.postMessage({ status: 'progress', data: progress });
            });

            self.postMessage({ status: 'progress', data: { status: 'transcribing' } });

            // audioData must be a Float32Array at 16kHz
            const output = await transcriber(audioData, {
                chunk_length_s: 30,
                stride_length_s: 5,
                return_timestamps: 'word',
            });

            self.postMessage({ status: 'complete', result: output });
        } catch (error: any) {
            self.postMessage({ status: 'error', error: error.message || String(error) });
        }
    }
};
