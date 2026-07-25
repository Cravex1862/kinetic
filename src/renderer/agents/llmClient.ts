import type { AgentConfig, Provider } from './types';
import { DEFAULT_MODELS } from './types';

export interface LLMResponse {
  content: string;
  error?: string;
}

export interface ILLMClient {
  call(systemPrompt: string, userPrompt: string): Promise<LLMResponse>;
}

abstract class BaseLLMClient implements ILLMClient {
  protected config: AgentConfig;
  protected model: string;

  constructor(config: AgentConfig) {
    this.config = config;
    this.model = config.model ?? DEFAULT_MODELS[config.provider];
  }

  abstract getUrl(): string;
  abstract getHeaders(): Record<string, string>;
  abstract getRequestBody(systemPrompt: string, userPrompt: string): Record<string, unknown>;
  abstract extractContent(raw: unknown): string;

  public async call(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    const maxRetries = 6;
    let retryDelay = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(this.getUrl(), {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(this.getRequestBody(systemPrompt, userPrompt)),
        });

        if (!response.ok) {
          if (response.status === 429 && attempt < maxRetries) {
            console.warn(`Rate limit hit (429). Retrying attempt ${attempt}/${maxRetries} in ${retryDelay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            retryDelay = Math.min(retryDelay * 2, 15000);
            continue;
          }
          const body = await response.text();
          return { content: '', error: `${response.status}: ${body}` };
        }

        const raw = await response.json();
        const content = this.extractContent(raw);
        return { content };
      } catch (err: unknown) {
        if (attempt < maxRetries) {
          console.warn(`Network fetch failed. Retrying attempt ${attempt}/${maxRetries} in ${retryDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          retryDelay = Math.min(retryDelay * 2, 15000);
          continue;
        }
        return { content: '', error: err instanceof Error ? err.message : String(err) };
      }
    }

    return { content: '', error: 'Max API retry attempts exceeded due to rate limits.' };
  }
}

class OpenAICompatibleClient extends BaseLLMClient {
  getUrl(): string {
    if (this.config.provider === 'hackclub') {
      return 'https://ai.hackclub.com/proxy/v1/chat/completions';
    }
    return 'https://api.openai.com/v1/chat/completions';
  }

  getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  getRequestBody(systemPrompt: string, userPrompt: string): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    };
    if (systemPrompt.toLowerCase().includes('json')) {
      body.response_format = { type: 'json_object' };
    }
    return body;
  }

  extractContent(raw: unknown): string {
    const data = raw as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? '';
  }
}

class AnthropicClient extends BaseLLMClient {
  getUrl(): string {
    return 'https://api.anthropic.com/v1/messages';
  }

  getHeaders(): Record<string, string> {
    return {
      'x-api-key': this.config.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    };
  }

  getRequestBody(systemPrompt: string, userPrompt: string): Record<string, unknown> {
    return {
      model: this.model,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.3,
    };
  }

  extractContent(raw: unknown): string {
    const data = raw as { content?: Array<{ text?: string }> };
    return data.content?.[0]?.text ?? '';
  }
}

class GoogleClient extends BaseLLMClient {
  getUrl(): string {
    return `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.config.apiKey}`;
  }

  getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  getRequestBody(systemPrompt: string, userPrompt: string): Record<string, unknown> {
    return {
      contents: [{
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
      }],
      generationConfig: { temperature: 0.3 },
    };
  }

  extractContent(raw: unknown): string {
    const data = raw as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }
}

export class LLMClientFactory {
  public static create(config: AgentConfig): ILLMClient {
    switch (config.provider) {
      case 'openai':
      case 'hackclub':
        return new OpenAICompatibleClient(config);
      case 'anthropic':
        return new AnthropicClient(config);
      case 'google':
        return new GoogleClient(config);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }
}

const responseCache = new Map<string, string>();

export function clearLLMCache(): void {
  responseCache.clear();
  console.log("🧹 LLM Response cache cleared.");
}

export async function callLLM(
  config: AgentConfig,
  systemPrompt: string,
  userPrompt: string,
  bypassCache: boolean = false
): Promise<LLMResponse> {
  const cacheKey = `${config.provider}:${config.model || ''}:${systemPrompt}:${userPrompt}`;
  if (!bypassCache && responseCache.has(cacheKey)) {
    console.log("⚡ Returning cached LLM response (0ms)");
    return { content: responseCache.get(cacheKey)! };
  }

  const client = LLMClientFactory.create(config);
  let result = await client.call(systemPrompt, userPrompt);

  // Fallback handling for Google provider on 429 quota limit
  if (result.error && result.error.includes('429') && config.provider === 'google') {
    const fallbackModels = ['gemini-2.0-flash'];
    for (const fallbackModel of fallbackModels) {
      if (fallbackModel === config.model) continue;
      console.warn(`⚠️ Primary model rate limited. Retrying with fallback model: [${fallbackModel}]...`);
      const fallbackConfig = { ...config, model: fallbackModel };
      const fallbackClient = LLMClientFactory.create(fallbackConfig);
      result = await fallbackClient.call(systemPrompt, userPrompt);
      if (!result.error && result.content) {
        console.log(`✅ Fallback model [${fallbackModel}] succeeded!`);
        break;
      }
    }
  }

  if (result.content && !result.error) {
    responseCache.set(cacheKey, result.content);
  }
  return result;
}

export function getStoredConfig(): AgentConfig | null {
  const apiKey = localStorage.getItem('kinetic-api-key');
  const provider = localStorage.getItem('kinetic-provider') as Provider | null;
  const model = localStorage.getItem('kinetic-model') || undefined;
  if (!apiKey || !provider) return null;
  return { apiKey, provider, model };
}

export function safeParseJson<T>(content: string, defaultValue: T): T {
  try {
    const cleaned = content.replace(/```json/gi, '').replace(/```/gi, '').trim();
    return JSON.parse(cleaned) as T;
  } catch (err: unknown) {
    console.error('Failed to parse JSON content:', err instanceof Error ? err.message : err);
    return defaultValue;
  }
}


