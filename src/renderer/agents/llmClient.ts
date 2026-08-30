import type { AgentConfig, Provider } from './types';
import { DEFAULT_MODELS } from './types';

export type TextPart = { type: 'text'; text: string };
export type ImagePart = { type: 'image'; mimeType: string; base64: string };
export type LLMPart = TextPart | ImagePart;

export interface LLMResponse {
  content: string;
  error?: string;
}

export interface ILLMClient {
  call(systemPrompt: string, userPrompt: string): Promise<LLMResponse>;
  callMultimodal(systemPrompt: string, parts: LLMPart[]): Promise<LLMResponse>;
}

interface ClientOverrides {
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
}

abstract class BaseLLMClient implements ILLMClient {
  protected config: AgentConfig;
  protected model: string;
  protected overrides: ClientOverrides;

  constructor(config: AgentConfig, overrides?: ClientOverrides) {
    this.config = config;
    this.model = config.model ?? DEFAULT_MODELS[config.provider];
    this.overrides = overrides ?? {};
  }

  protected abstract getUrl(): string;
  protected abstract getHeaders(): Record<string, string>;
  protected abstract buildRequestBody(systemPrompt: string, parts: LLMPart[]): Record<string, unknown>;
  protected abstract extractContent(raw: unknown): string;

  public async call(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    return this.callWithParts(systemPrompt, [{ type: 'text', text: userPrompt }]);
  }

  public async callMultimodal(systemPrompt: string, parts: LLMPart[]): Promise<LLMResponse> {
    return this.callWithParts(systemPrompt, parts);
  }

  private formatError(status: number, body: string): string {
    const snippet = body.slice(0, 400);
    if (status === 401) return `401 Unauthorized: Invalid API key for ${this.config.provider}. Check Settings. ${snippet}`;
    if (status === 403) return `403 Forbidden: ${this.config.provider} rejected the request. ${snippet}`;
    if (status === 429) return `429 Rate limited by ${this.config.provider}. The model is busy — wait 30s or switch model/provider in Settings. ${snippet}`;
    if (status === 402) return `402 Payment required: ${this.config.provider} quota exceeded. ${snippet}`;
    if (status >= 500) return `${status} Server error from ${this.config.provider}. Try again. ${snippet}`;
    return `${status}: ${snippet}`;
  }

  private formatNetworkError(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    const lower = msg.toLowerCase();
    const isLocal = this.config.provider === 'ollama' || this.config.provider === 'lmstudio' || this.config.provider === 'local';
    if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('econnrefused') || lower.includes('load failed')) {
      if (this.config.provider === 'ollama') return `Ollama not reachable at ${this.getUrl()}. Is Ollama installed and running? Try: ollama serve. (${msg})`;
      if (this.config.provider === 'lmstudio') return `LM Studio not reachable at ${this.getUrl()}. Is the local server turned on? (${msg})`;
      if (isLocal) return `Local model not reachable at ${this.getUrl()}. Check baseUrl and that the server is running. (${msg})`;
      return `Network error: could not reach ${this.config.provider}. Check internet / firewall. (${msg})`;
    }
    if (lower.includes('aborted') || lower.includes('timeout')) return `Request timed out for ${this.config.provider}. The model may be overloaded — try again or switch provider. (${msg})`;
    return msg;
  }

  private async callWithParts(systemPrompt: string, parts: LLMPart[]): Promise<LLMResponse> {
    const maxRetries = this.overrides.maxRetries ?? 6;
    let retryDelay = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch(this.getUrl(), {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(this.buildRequestBody(systemPrompt, parts)),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
          if (response.status === 429 && attempt < maxRetries) {
            console.warn(`Rate limit hit (429). Retrying attempt ${attempt}/${maxRetries} in ${retryDelay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            retryDelay = Math.min(retryDelay * 2, 15000);
            continue;
          }
          const body = await response.text();
          return { content: '', error: this.formatError(response.status, body) };
        }

        const raw = await response.json();
        const content = this.extractContent(raw);
        if (!content) return { content: '', error: `Empty response from ${this.config.provider}. Model returned no content — try a different model.` };
        return { content };
      } catch (err: unknown) {
        clearTimeout(timeout);
        const isAbort = err instanceof Error && err.name === 'AbortError';
        const human = isAbort ? `Request timed out for ${this.config.provider} (30s).` : this.formatNetworkError(err);
        if (attempt < maxRetries && !isAbort) {
          console.warn(`Network fetch failed (${human}). Retrying attempt ${attempt}/${maxRetries} in ${retryDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          retryDelay = Math.min(retryDelay * 2, 15000);
          continue;
        }
        return { content: '', error: human };
      }
    }

    return { content: '', error: `Rate limited by ${this.config.provider} — max retries exceeded. Wait 30s or switch model/provider.` };
  }
}

class OpenAICompatibleClient extends BaseLLMClient {
  protected getUrl(): string {
    const isLocal = this.config.provider === 'ollama' || this.config.provider === 'lmstudio' || this.config.provider === 'local' || this.config.provider === 'byoc';
    if (this.config.baseUrl && isLocal) {
      let cleaned = this.config.baseUrl.replace(/\/+$/, '');
      if (cleaned.includes('11434') && !cleaned.includes('/v1') && !cleaned.includes('/api')) {
        cleaned = `${cleaned}/v1`;
      }
      return cleaned.endsWith('/chat/completions') ? cleaned : `${cleaned}/chat/completions`;
    }
    if (this.config.provider === 'hackclub') {
      return 'https://ai.hackclub.com/proxy/v1/chat/completions';
    }
    if (this.config.provider === 'ollama' || this.config.provider === 'local') {
      return 'http://localhost:11434/v1/chat/completions';
    }
    if (this.config.provider === 'lmstudio') {
      return 'http://localhost:1234/v1/chat/completions';
    }
    if (this.config.provider === 'groq') {
      return 'https://api.groq.com/openai/v1/chat/completions';
    }
    return 'https://api.openai.com/v1/chat/completions';
  }

  protected getHeaders(): Record<string, string> {
    const key = this.config.apiKey || 'local';
    return {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    };
  }

  protected buildRequestBody(systemPrompt: string, parts: LLMPart[]): Record<string, unknown> {
    const userContent = parts.map((p) =>
      p.type === 'text'
        ? { type: 'text', text: p.text }
        : { type: 'image_url', image_url: { url: `data:${p.mimeType};base64,${p.base64}` } }
    );
    const body: Record<string, unknown> = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent.length === 1 && userContent[0]!.type === 'text' ? userContent[0]!.text : userContent },
      ],
      temperature: this.overrides.temperature ?? 0.3,
      max_tokens: this.overrides.maxTokens ?? 4096,
    };
    if (this.config.provider !== 'hackclub' && systemPrompt.toLowerCase().includes('json only') && !systemPrompt.toLowerCase().includes('tsx') && !systemPrompt.toLowerCase().includes('jsx')) {
      body.response_format = { type: 'json_object' };
    }
    return body;
  }

  protected extractContent(raw: unknown): string {
    const data = raw as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? '';
  }
}

class AnthropicClient extends BaseLLMClient {
  protected getUrl(): string {
    return 'https://api.anthropic.com/v1/messages';
  }

  protected getHeaders(): Record<string, string> {
    return {
      'x-api-key': this.config.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    };
  }

  protected buildRequestBody(systemPrompt: string, parts: LLMPart[]): Record<string, unknown> {
    const content = parts.map((p) =>
      p.type === 'text'
        ? { type: 'text', text: p.text }
        : { type: 'image', source: { type: 'base64', media_type: p.mimeType, data: p.base64 } }
    );
    return {
      model: this.model,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
      temperature: this.overrides.temperature ?? 0.3,
      max_tokens: this.overrides.maxTokens ?? 16384,
    };
  }

  protected extractContent(raw: unknown): string {
    const data = raw as { content?: Array<{ text?: string }> };
    return data.content?.[0]?.text ?? '';
  }
}

class GoogleClient extends BaseLLMClient {
  protected getUrl(): string {
    return `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.config.apiKey}`;
  }

  protected getHeaders(): Record<string, string> {
    return { 'Content-Type': 'application/json' };
  }

  protected buildRequestBody(systemPrompt: string, parts: LLMPart[]): Record<string, unknown> {
    const mappedParts = parts.map((p) =>
      p.type === 'text'
        ? { text: p.text }
        : { inlineData: { mimeType: p.mimeType, data: p.base64 } }
    );
    const allParts = [{ text: `${systemPrompt}\n\n` }, ...mappedParts];
    return {
      contents: [{ role: 'user', parts: allParts }],
      generationConfig: { temperature: this.overrides.temperature ?? 0.3, maxOutputTokens: this.overrides.maxTokens ?? 16384 },
    };
  }

  protected extractContent(raw: unknown): string {
    const data = raw as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }
}

export class LLMClientFactory {
  public static create(config: AgentConfig, overrides?: ClientOverrides): ILLMClient {
    switch (config.provider) {
      case 'openai':
      case 'hackclub':
      case 'ollama':
      case 'lmstudio':
      case 'local':
      case 'groq':
        return new OpenAICompatibleClient(config, overrides);
      case 'anthropic':
        return new AnthropicClient(config, overrides);
      case 'google':
        return new GoogleClient(config, overrides);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }
}

export async function fetchAvailableModels(
  provider: Provider,
  baseUrl?: string,
  apiKey?: string
): Promise<{ models: string[]; error?: string }> {
  try {
    if (provider === 'ollama') {
      const host = (baseUrl || 'http://localhost:11434').replace(/\/v1\/?$/, '').replace(/\/+$/, '');
      try {
        const res = await fetch(`${host}/api/tags`);
        if (res.ok) {
          const data = await res.json();
          const models = (data.models || []).map((m: { name: string }) => m.name);
          if (models.length > 0) return { models };
        }
      } catch (e) {
        // Fallback to /v1/models endpoint
      }
      const v1Endpoint = `${host}/v1/models`;
      const v1Res = await fetch(v1Endpoint);
      if (v1Res.ok) {
        const data = await v1Res.json();
        const models = (data.data || []).map((m: { id: string }) => m.id);
        return { models };
      }
      return { models: [], error: `Could not reach Ollama server at ${host}. Make sure Ollama is running!` };
    }

    if (provider === 'lmstudio' || provider === 'local') {
      const host = (baseUrl || 'http://localhost:1234').replace(/\/+$/, '');
      const endpoint = host.endsWith('/v1') ? `${host}/models` : `${host}/v1/models`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        const models = (data.data || []).map((m: { id: string }) => m.id);
        return { models };
      }
      return { models: [], error: `Could not reach LM Studio server at ${host}. Make sure server is turned on!` };
    }

    if (provider === 'openai') {
      if (!apiKey) return { models: [], error: 'API key is required to fetch OpenAI models.' };
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      if (res.ok) {
        const data = await res.json();
        const models = (data.data || [])
          .map((m: { id: string }) => m.id)
          .filter((id: string) => id.includes('gpt'));
        return { models };
      }
      return { models: [], error: `OpenAI returned status ${res.status}` };
    }

    if (provider === 'google') {
      if (!apiKey) return { models: [], error: 'API key is required to fetch Google models.' };
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (res.ok) {
        const data = await res.json();
        const models = (data.models || [])
          .map((m: { name: string }) => m.name.replace(/^models\//, ''))
          .filter((name: string) => name.includes('gemini'));
        return { models };
      }
      return { models: [], error: `Google API returned status ${res.status}` };
    }

    if (provider === 'anthropic') {
      if (!apiKey) return { models: [], error: 'API key is required to fetch Anthropic models.' };
      const res = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const models = (data.data || []).map((m: { id: string }) => m.id);
        return { models };
      }
      return { models: [], error: `Anthropic API returned status ${res.status}` };
    }

    if (provider === 'groq') {
      if (!apiKey) return { models: [], error: 'API key is required to fetch Groq models.' };
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      if (res.ok) {
        const data = await res.json();
        const models = (data.data || []).map((m: { id: string }) => m.id);
        return { models };
      }
      return { models: [], error: `Groq API returned status ${res.status}` };
    }

    return { models: [], error: 'Provider model fetching not supported' };
  } catch (err: unknown) {
    return { models: [], error: err instanceof Error ? err.message : String(err) };
  }
}

export type BYOXHandler = (prompt: string) => Promise<string>;
let globalBYOCHandler: BYOXHandler | null = null;

export function registerBYOXHandler(handler: BYOXHandler | null) {
  globalBYOCHandler = handler;
}

export async function callLLM(
  config: AgentConfig,
  systemPrompt: string,
  userPrompt: string,
  bypassCache: boolean = true
): Promise<LLMResponse> {

  if (config.provider === 'byoc') {
    if (!globalBYOCHandler) {
      return { error: 'BYOC Mode is active, but no UI prompt handler is registered.', content: '' }
    }
    const fullPrompt = `${systemPrompt}\n\n=============User Request==================\n\n${userPrompt}`;
    try {
      const responseText = await globalBYOCHandler(fullPrompt);
      return { content: responseText };
    }
    catch (e: unknown) {
      return { error: e instanceof Error ? e.message : 'BYOC user cancelled prompt.', content: '' }
    };
  }

  const client = LLMClientFactory.create(config);
  let result = await client.call(systemPrompt, userPrompt);

  return result;
}

export function getStoredConfig(): AgentConfig | null {
  const apiKey = localStorage.getItem('kinetic-api-key') || '';
  const provider = localStorage.getItem('kinetic-provider') as Provider | null;
  const model = localStorage.getItem('kinetic-model') || undefined;
  const baseUrl = localStorage.getItem('kinetic-base-url') || undefined;
  if (!provider) return null;
  if (!apiKey && provider !== 'hackclub' && provider !== 'ollama' && provider !== 'lmstudio' && provider !== 'local' && provider !== 'byoc') {
    return null;
  }
  return { apiKey: apiKey || 'local_key', provider, model, baseUrl };
}

export function safeParseJson<T>(content: string, defaultValue: T): T {
  if (!content) return defaultValue;
  try {
    const cleaned = content.replace(/```json/gi, '').replace(/```/gi, '').trim();
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch && jsonMatch[0]) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    return JSON.parse(cleaned) as T;
  } catch (err: unknown) {
    console.error('Failed to parse JSON content:', err instanceof Error ? err.message : err);
    return defaultValue;
  }
}


