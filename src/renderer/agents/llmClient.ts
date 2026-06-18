import type { AgentConfig, Provider } from './types';
import { DEFAULT_MODELS } from './types';

interface LLMResponse {
  content: string;
  error?: string;
}

function buildRequestBody(provider: Provider, model: string, systemPrompt: string, userPrompt: string) {
  switch (provider) {
    case 'openai':
    case 'hackclub':
      return {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      };
    case 'anthropic':
      return {
        model,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0.3,
      };
    case 'google':
      return {
        contents: [{
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        }],
        generationConfig: { temperature: 0.3 },
      };
  }
}

function buildHeaders(provider: Provider, apiKey: string): Record<string, string> {
  switch (provider) {
    case 'openai':
    case 'hackclub':
      return { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
    case 'anthropic':
      return { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' };
    case 'google':
      return { 'Content-Type': 'application/json' };
  }
}

function buildUrl(provider: Provider, model: string, apiKey: string): string {
  switch (provider) {
    case 'openai':
      return 'https://api.openai.com/v1/chat/completions';
    case 'anthropic':
      return 'https://api.anthropic.com/v1/messages';
    case 'google':
      return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    case 'hackclub':
      return 'https://ai.hackclub.com/proxy/v1/chat/completions';
  }
}

function extractContent(provider: Provider, raw: unknown): string {
  try {
    const data = raw as Record<string, unknown>;
    switch (provider) {
      case 'openai':
      case 'hackclub': {
        const choices = data.choices as Array<{ message: { content: string } }>;
        return choices?.[0]?.message?.content ?? '';
      }
      case 'anthropic': {
        const content = data.content as Array<{ text: string }>;
        return content?.[0]?.text ?? '';
      }
      case 'google': {
        const candidates = data.candidates as Array<{ content: { parts: Array<{ text: string }> } }>;
        return candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      }
    }
  } catch {
    return '';
  }
}

export async function callLLM(
  config: AgentConfig,
  systemPrompt: string,
  userPrompt: string,
): Promise<LLMResponse> {
  const model = config.model ?? DEFAULT_MODELS[config.provider];
  const maxRetries = 3;
  let retryDelay = 2000;
  
  for(let attempt = 1; attempt <= maxRetries; attempt++){
  try {
    const response = await fetch(buildUrl(config.provider, model, config.apiKey), {
      method: 'POST',
      headers: buildHeaders(config.provider, config.apiKey),
      body: JSON.stringify(buildRequestBody(config.provider, model, systemPrompt, userPrompt)),
    });

    if (!response.ok) {

      if (response.status === 429 && attempt < maxRetries){
        console.warn(`Rate limit hit (429). Retrying attempt ${attempt}/${maxRetries} in ${retryDelay}ms....`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        retryDelay *= 2;
        continue ;
      }
      const body = await response.text();
      return { content: '', error: `${response.status}: ${body}` };
    }
  

    const raw = await response.json();
    const content = extractContent(config.provider, raw);
    return { content };
  } catch (err) {

    if (attempt < maxRetries) {
      console.warn(`Network fetch failed. Retrying attempt ${attempt}/${maxRetries} in ${retryDelay}ms...`);
      await new Promise((resolve)=> setTimeout(resolve,retryDelay));
      retryDelay *= 2;
      continue;
    }

    return { content: '', error: String(err) };
  }
}

return { content: '', error: 'Max API retry attempts exceeded' };
}


export function getStoredConfig(): AgentConfig | null {
  const apiKey = localStorage.getItem('kinetic-api-key');
  const provider = localStorage.getItem('kinetic-provider') as Provider | null;
  if (!apiKey || !provider) return null;
  return { apiKey, provider };
}
